import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listProjectAlerts } from "@/lib/alerts";
import { getCashflowProjection90d } from "@/lib/cashflow";
import { todayInSaoPauloISO } from "@/lib/time";
import { getFidcPanel } from "@/lib/fidc";
import { listRiskSuggestions } from "@/lib/risk-ai";

const AUTO_CHECKS = [
  "Ruptura de caixa em 90 dias",
  "Pendências de conciliação acima do limite",
  "Alerta crítico bloqueando fluxo",
  "Pico de saída nos próximos vencimentos",
  "Desvio relevante DRE x DFC",
] as const;

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Riscos e Alertas"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Riscos e Alertas"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Riscos e Alertas"><div className="alert bad-bg">Onboarding incompleto. Conclua o Cadastro antes de avançar para Riscos.</div></AppShell>;

  const [alerts, suggestions] = await Promise.all([
    listProjectAlerts(project.id),
    listRiskSuggestions(project.id, 20),
  ]);
  const today = todayInSaoPauloISO();
  const projection = await getCashflowProjection90d(project.id, today);
  const fidcPanel = await getFidcPanel(project.id);
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const flowBlocking = alerts.filter((a) => a.block_flow).length;

  return (
    <AppShell user={user} title="Projeto · Riscos & Alertas" subtitle="Camada de risco do projeto: registrar, interpretar, priorizar e bloquear quando necessário sem perder clareza operacional.">
      <ProductHero
        eyebrow="camada de risco"
        title="Risco bom não é o que fica escondido — é o que aparece cedo, com contexto e ação clara."
        description="Esta tela junta alertas manuais, leitura assistida por IA, projeção de caixa e painel FIDC para transformar risco em decisão prática."
      >
        <StatusPill label={criticalAlerts > 0 ? `${criticalAlerts} crítico(s)` : 'Sem críticos'} tone={criticalAlerts > 0 ? 'bad' : 'good'} />
        <StatusPill label={flowBlocking > 0 ? `${flowBlocking} bloqueia fluxo` : 'Sem bloqueio de fluxo'} tone={flowBlocking > 0 ? 'warn' : 'good'} />
      </ProductHero>
      {query.saved ? <div className="alert ok-bg mb-4">{query.saved === 'ai' ? 'Sugestão de risco gerada.' : query.saved === 'ai_apply' ? 'Sugestão processada.' : 'Alerta salvo.'}</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Não foi possível processar o alerta agora. Detalhe técnico: {query.error}</div> : null}

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <MetricCard label="Alertas abertos" value={alerts.length} tone={alerts.length > 0 ? 'warn' : 'good'} />
        <MetricCard label="Críticos" value={criticalAlerts} tone={criticalAlerts > 0 ? 'bad' : 'good'} />
        <MetricCard label="Ruptura 90d" value={projection.scenarios.base.ruptureDate || 'não'} tone={projection.scenarios.base.ruptureDate ? 'bad' : 'good'} />
        <MetricCard label="Recompras FIDC" value={fidcPanel.recompras.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} tone={fidcPanel.recompras > 0 ? 'warn' : 'good'} />
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Análise de risco com IA</h2><span className="kpi-chip">relato → ação</span></div>
        <div className="text-sm text-slate-400 mt-2">Fluxo recomendado: escrever o relato, gerar sugestão com IA e então aprovar ou descartar a recomendação.</div>
        <form action={`/api/projects/${id}/risk-ai/generate`} method="post" className="grid md:grid-cols-3 gap-2 text-sm mt-3">
          <textarea name="report" required placeholder="Relato do risco / contexto operacional" className="md:col-span-2 min-h-32 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <div className="space-y-2">
            <input name="opportunity" placeholder="oportunidade associada" className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 px-3 cursor-pointer w-full">Analisar com IA</button>
          </div>
        </form>
        <div className="mt-3 space-y-2 text-sm">
          {suggestions.length ? suggestions.map((s) => {
            const resp = s.response as Record<string, any>;
            return (
              <div key={s.id} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium">{String(resp.title || 'Sugestão IA')}</div>
                <div className="text-xs text-slate-500 mt-1">{s.created_at} · {s.provider || '-'} · {s.model || '-'} · {s.status}</div>
                <div className="text-sm text-slate-300 mt-2">{String(resp.rationale || '-')}</div>
                <div className="text-xs text-slate-400 mt-2">Severidade: {String(resp.severity || '-')} · blockFlow: {String(resp.blockFlow || false)} · origem: {String(resp.source || '-')}</div>
                <div className="mt-2 text-xs text-slate-400">Recomendações: {Array.isArray(resp.recommendations) ? resp.recommendations.join(' · ') : '-'}</div>
                {s.status === 'suggested' ? (
                  <form action={`/api/projects/${id}/risk-ai/apply`} method="post" className="flex gap-2 flex-wrap mt-3">
                    <input type="hidden" name="suggestion_id" value={s.id} />
                    <button type="submit" name="action" value="approve" className="pill">Aprovar e virar alerta</button>
                    <button type="submit" name="action" value="discard" className="pill">Descartar</button>
                  </form>
                ) : <div className="mt-3 text-xs text-slate-500">Status da sugestão: {s.status}</div>}
              </div>
            );
          }) : <EmptyState title="Sem sugestões de IA ainda" description="As análises assistidas vão aparecer aqui quando você começar a usar o fluxo de relato e sugestão." />}
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Novo alerta manual</h2><span className="kpi-chip">controle direto</span></div>
        <form action={`/api/projects/${id}/alerts/create`} method="post" className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
          <input name="name" required placeholder="nome do alerta" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <select name="severity" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option>
          </select>
          <select name="block_flow" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="false">não bloqueia</option>
            <option value="true">bloqueia fluxo</option>
          </select>
          <textarea name="project_report" placeholder="Contexto atual, gargalos e sinais de risco" className="md:col-span-3 min-h-20 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="opportunity" placeholder="oportunidade identificada" className="md:col-span-3 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="max_diff" type="number" step="0.01" placeholder="max_diff (R$)" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="max_pending" type="number" placeholder="max_pending" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="upload_ref" placeholder="referência de upload (url/id)" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <div className="md:col-span-3 rounded-lg border border-slate-800 p-3">
            <div className="text-slate-300 text-sm mb-2">Checklist automático</div>
            <div className="grid md:grid-cols-2 gap-1 text-sm">
              {AUTO_CHECKS.map((item) => (
                <label key={item} className="flex items-center gap-2"><input type="checkbox" name="auto_checks" value={item} /> {item}</label>
              ))}
            </div>
          </div>
          <button type="submit" className="badge py-2 cursor-pointer">Salvar alerta</button>
        </form>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Painel de risco FIDC</h2><span className="kpi-chip">retorno consolidado</span></div>
        <div className="grid md:grid-cols-5 gap-3 mt-3 text-sm">
          <MetricCard label="Retornos recebidos" value={fidcPanel.totalRetornos} />
          <MetricCard label="Carteira consolidada" value={fidcPanel.totalCarteira.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <MetricCard label="Vencidos" value={fidcPanel.vencidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} tone="bad" />
          <MetricCard label="A vencer" value={fidcPanel.aVencer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} tone="good" />
          <MetricCard label="Recompras" value={fidcPanel.recompras.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} tone="warn" />
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Alertas cadastrados</h2><span className="kpi-chip">visão ativa</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {alerts.length ? alerts.map((a) => (
            <div key={a.id} className="row !items-start rounded-xl border border-slate-800 px-3 py-3">
              <div>
                <div className="font-medium">{a.name} · {a.severity.toUpperCase()} {a.block_flow ? '· BLOQUEIA FLUXO' : ''}</div>
                <div className="text-xs text-slate-400 whitespace-pre-wrap mt-1">{JSON.stringify(a.rule, null, 2)}</div>
              </div>
            </div>
          )) : <EmptyState title="Sem alertas abertos" description="Quando novos riscos forem identificados, eles vão aparecer aqui com contexto e bloqueio de fluxo quando necessário." />}
        </div>
      </section>
    </AppShell>
  );
}

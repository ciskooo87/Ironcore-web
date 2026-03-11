import { AppShell } from "@/components/AppShell";
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

  return (
    <AppShell user={user} title="Projeto · Riscos e Alertas" subtitle="Relato operacional + checklist de risco com ação e bloqueio">
      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Novo alerta</h2><span className="kpi-chip">Risk control</span></div>
        <form action={`/api/projects/${id}/alerts/create`} method="post" className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
          <input name="name" required placeholder="nome do alerta" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <select name="severity" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="low">low</option><option value="medium">medium</option><option value="high">high</option><option value="critical">critical</option>
          </select>
          <select name="block_flow" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="false">não bloqueia</option>
            <option value="true">bloqueia fluxo</option>
          </select>

          <label className="md:col-span-3 space-y-1">
            <span className="text-slate-400">Relato breve do projeto (base para leitura de risco)</span>
            <textarea name="project_report" placeholder="Contexto atual, gargalos e sinais de risco" className="w-full min-h-20 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          </label>

          <label className="md:col-span-3 space-y-1">
            <span className="text-slate-400">Oportunidade identificada</span>
            <input name="opportunity" placeholder="Ex.: renegociação de vencimentos ou redução de custo financeiro" className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          </label>

          <input name="max_diff" type="number" step="0.01" placeholder="max_diff (R$)" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="max_pending" type="number" placeholder="max_pending" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="upload_ref" placeholder="referência de upload (url/id)" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />

          <div className="md:col-span-3 rounded-lg border border-slate-800 p-3">
            <div className="text-slate-300 text-sm mb-2">Checklist automático (selecionar os riscos/oportunidades detectados)</div>
            <div className="grid md:grid-cols-2 gap-1 text-sm">
              {AUTO_CHECKS.map((item) => (
                <label key={item} className="flex items-center gap-2"><input type="checkbox" name="auto_checks" value={item} /> {item}</label>
              ))}
            </div>
          </div>

          <button type="submit" className="badge py-2 cursor-pointer">Salvar alerta ✦</button>
        </form>
        {query.saved ? <div className="alert ok-bg mt-3">{query.saved === 'ai' ? 'Sugestão de risco gerada.' : query.saved === 'ai_apply' ? 'Sugestão processada.' : 'Alerta salvo.'}</div> : null}
        {query.error ? <div className="alert bad-bg mt-3">Erro: {query.error}</div> : null}
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Análise de risco com IA</h2><span className="kpi-chip">Relato → sugestão</span></div>
        <div className="text-sm text-slate-400 mt-2">Fluxo recomendado: escreva o relato do risco, clique em <b>Analisar com IA</b> e depois aprove ou descarte a sugestão gerada.</div>
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
                <div className="text-xs text-slate-400 mt-2">Severidade: {String(resp.severity || '-')} · blockFlow: {String(resp.blockFlow || false)}</div>
                <div className="mt-2 text-xs text-slate-400">Recomendações: {Array.isArray(resp.recommendations) ? resp.recommendations.join(' · ') : '-'}</div>
                {s.status === 'suggested' ? (
                  <form action={`/api/projects/${id}/risk-ai/apply`} method="post" className="flex gap-2 flex-wrap mt-3">
                    <input type="hidden" name="suggestion_id" value={s.id} />
                    <button type="submit" name="action" value="approve" className="pill">Aprovar e virar alerta</button>
                    <button type="submit" name="action" value="discard" className="pill">Descartar</button>
                  </form>
                ) : (
                  <div className="mt-3 text-xs text-slate-500">Status da sugestão: {s.status}</div>
                )}
              </div>
            );
          }) : <div className="alert muted-bg">Sem sugestões IA ainda.</div>}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-3 mb-4">
        <div className="card">
          <h2 className="title">Resumo do projeto</h2>
          <div className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{project.project_summary || "Sem resumo preenchido em Cadastro."}</div>
        </div>
        <div className="card">
          <h2 className="title">Resumo executivo automático</h2>
          <div className="space-y-2 mt-2 text-sm">
            <div className="row"><span>Alertas abertos</span><b>{alerts.length}</b></div>
            <div className="row"><span>Ruptura no cenário base</span><b>{projection.scenarios.base.ruptureDate || "não"}</b></div>
            <div className="row"><span>Próximos vencimentos</span><b>D+7 monitorado</b></div>
            <div className="row"><span>KPI DRE/DFC</span><b>visão consolidada no módulo DRE/DFC</b></div>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Painel de risco FIDC</h2><span className="kpi-chip">Retorno consolidado</span></div>
        <div className="grid md:grid-cols-5 gap-3 mt-3 text-sm">
          <div className="metric"><div className="text-xs text-slate-400">Retornos recebidos</div><div className="text-lg font-semibold mt-1">{fidcPanel.totalRetornos}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Carteira consolidada</div><div className="text-lg font-semibold mt-1">{fidcPanel.totalCarteira.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Vencidos</div><div className="text-lg font-semibold mt-1 text-rose-300">{fidcPanel.vencidos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">A vencer</div><div className="text-lg font-semibold mt-1 text-emerald-300">{fidcPanel.aVencer.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Recompras</div><div className="text-lg font-semibold mt-1 text-amber-300">{fidcPanel.recompras.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
        </div>
        <div className="grid md:grid-cols-4 gap-3 mt-4 text-sm">
          <div className="metric"><div className="text-xs text-slate-400">Carteira via operações</div><div className="text-lg font-semibold mt-1">{fidcPanel.carteiraOperacoes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Vencido via operações</div><div className="text-lg font-semibold mt-1 text-rose-300">{fidcPanel.vencidoOperacoes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">A vencer via operações</div><div className="text-lg font-semibold mt-1 text-emerald-300">{fidcPanel.aVencerOperacoes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Recompra via operações</div><div className="text-lg font-semibold mt-1 text-amber-300">{fidcPanel.recompraOperacoes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
          <div className="card !p-3">
            <div className="font-medium mb-2">Segregação por modalidade</div>
            <div className="space-y-2">
              {fidcPanel.byModalidade.length === 0 ? <div className="alert muted-bg">Sem retorno FIDC enviado ainda.</div> : null}
              {fidcPanel.byModalidade.map((item) => (
                <div key={item.modalidade} className="row"><span>{item.modalidade}</span><b>{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
              ))}
            </div>
          </div>
          <div className="card !p-3">
            <div className="font-medium mb-2">Leitura operacional do painel</div>
            <div className="space-y-2 text-slate-300">
              <div>• Último retorno: <b>{fidcPanel.latestDate || "-"}</b></div>
              <div>• Risco concentrado sinalizado: <b>{fidcPanel.riscoConcentrado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
              <div>• Operações/títulos vinculados: <b>{fidcPanel.operacoesVinculadas}</b></div>
              <div>• Última observação: <b>{fidcPanel.latestNotes || "sem nota"}</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Cadastro manual de alerta</h2><span className="kpi-chip">Opcional</span></div>
        <div className="text-sm text-slate-400 mt-2">Use esta área só quando quiser criar o alerta manualmente. Para o fluxo padrão, use a análise de risco com IA acima.</div>
      </section>

      <section className="card">
        <h2 className="title">Alertas cadastrados</h2>
        <div className="mt-3 space-y-2 text-sm">
          {alerts.length === 0 ? <div className="alert muted-bg">Sem alertas.</div> : null}
          {alerts.map((a) => (
            <div key={a.id} className="row !items-start">
              <div>
                <div className="font-medium">{a.name} · {a.severity.toUpperCase()} {a.block_flow ? "· BLOCK" : ""}</div>
                <div className="text-xs text-slate-400 whitespace-pre-wrap">{JSON.stringify(a.rule, null, 2)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

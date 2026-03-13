import { AppShell } from "@/components/AppShell";
import { EmptyState, ProductHero, StatusPill } from "@/components/product-ui";
import { CheckpointPanel, CommandGrid, CommandPanel } from "@/components/product-blocks";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listClosures } from "@/lib/closure";
import { listClosureValidations } from "@/lib/closure-validation";
import { ensureCsrfCookie } from "@/lib/csrf";

function br(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function currentYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function toneClasses(value: number) {
  if (value < 0) return "text-rose-300";
  if (value === 0) return "text-slate-200";
  return "text-emerald-300";
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Fechamento Mensal"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Fechamento Mensal"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Fechamento Mensal"><div className="alert bad-bg">Onboarding incompleto. Conclua o Cadastro antes de fechar o mês.</div></AppShell>;

  const [closures, validations, csrf] = await Promise.all([
    listClosures(project.id, 24),
    listClosureValidations(project.id, 20),
    ensureCsrfCookie(),
  ]);
  const latest = closures[0];
  const lastSnapshot = (latest?.snapshot || {}) as Record<string, unknown>;
  const resumo = (lastSnapshot.resumoMensal || {}) as Record<string, number>;
  const obs = (lastSnapshot.observaveis || {}) as Record<string, number>;
  const accountingFeed = (lastSnapshot.accountingFeed || {}) as Record<string, any>;
  const narrativaExecutiva = String(lastSnapshot.narrativaExecutiva || "");

  const mainAction = Number(obs.conciliacoesBloqueadas || 0) > 0
    ? `Resolver ${Number(obs.conciliacoesBloqueadas || 0)} conciliação(ões) bloqueada(s) antes de fechar com confiança.`
    : Number(obs.alertasCriticosAtivos || 0) > 0
      ? `Atacar ${Number(obs.alertasCriticosAtivos || 0)} alerta(s) crítico(s) antes da versão final.`
      : latest
        ? `Validar o fechamento ${latest.period_ym} v${latest.snapshot_version} e consolidar a versão oficial.`
        : "Gerar o primeiro fechamento mensal para abrir a trilha executiva.";

  const mainRisk = Number(obs.conciliacoesBloqueadas || 0) > 0
    ? "Conciliações bloqueadas comprometem a confiança do fechamento."
    : Number(obs.alertasCriticosAtivos || 0) > 0
      ? "Alertas críticos ativos podem distorcer a leitura final do mês."
      : "Sem risco dominante explícito no snapshot atual.";

  return (
    <AppShell user={user} title="Projeto · Fechamento Mensal" subtitle="Fechar o mês com narrativa, validação e leitura executiva consistente">
      <ProductHero
        eyebrow="fechamento executivo"
        title="Fechamento mensal precisa sair pronto para gestão, não como etapa solta."
        description="A tela agora organiza fechamento, narrativa, validação e evolução mensal como peça de produto única: leitura do mês, risco principal e trilha de aprovação."
      >
        <StatusPill label={`Fechamentos: ${closures.length}`} tone="info" />
        <StatusPill label={`Validações: ${validations.length}`} tone={validations.length > 0 ? "good" : "neutral"} />
      </ProductHero>
      {query.saved ? <div className="alert ok-bg mb-4">{query.saved === "validation" ? "Validação do fechamento registrada." : "Fechamento realizado."}</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Erro: {query.error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando do fechamento</h2><span className="kpi-chip">prioridade do mês</span></div>
          <CommandGrid>
            <CommandPanel action={<>{mainAction}</>} risk={<>{mainRisk}</>} />
            <CheckpointPanel title="Fechar mês">
              <form action={`/api/projects/${id}/fechamento/close`} method="post" className="flex gap-2 items-center flex-wrap">
                <input name="period_ym" placeholder="YYYY-MM" pattern="\d{4}-\d{2}" defaultValue={currentYm()} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                <button className="badge py-2 px-4 cursor-pointer" type="submit">Fechar mês</button>
              </form>
            </CheckpointPanel>
          </CommandGrid>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Resumo do snapshot</h2><span className="kpi-chip">leitura do mês</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Faturamento</div><div className={`mt-1 font-medium ${toneClasses(Number(resumo.faturamento || 0))}`}>{br(Number(resumo.faturamento || 0))}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Resultado</div><div className={`mt-1 font-medium ${toneClasses(Number(resumo.resultadoOperacional || 0))}`}>{br(Number(resumo.resultadoOperacional || 0))}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Conciliações bloqueadas</div><div className="mt-1 font-medium text-white">{Number(obs.conciliacoesBloqueadas || 0)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Alertas críticos</div><div className="mt-1 font-medium text-white">{Number(obs.alertasCriticosAtivos || 0)}</div></div>
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Narrativa executiva</h2><span className="kpi-chip">pronto para diretoria</span></div>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-300 whitespace-pre-wrap">
          {narrativaExecutiva || "Sem narrativa executiva ainda."}
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">DRE · receita bruta</div><div className="text-lg font-semibold mt-1">{br(accountingFeed?.dre?.receitaBruta || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">DRE · resultado líquido proxy</div><div className="text-lg font-semibold mt-1">{br(accountingFeed?.dre?.resultadoLiquidoProxy || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">DFC · saldo caixa proxy</div><div className="text-lg font-semibold mt-1">{br(accountingFeed?.dfc?.saldoCaixaProxy || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(accountingFeed?.carteira?.vencido || 0)}</div></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Validar fechamento</h2><span className="kpi-chip">decisão humana</span></div>
          <form action={`/api/projects/${id}/closure/validate`} method="post" className="grid md:grid-cols-4 gap-2 text-sm mt-3">
            <input type="hidden" name="csrf_token" value={csrf} />
            <select name="closure_id" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              {closures.map((c) => <option key={c.id} value={c.id}>{c.period_ym} · v{c.snapshot_version}</option>)}
            </select>
            <select name="decision" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              <option value="aprovado">Aprovar fechamento</option>
              <option value="ajustar">Enviar para ajuste</option>
              <option value="bloquear">Bloquear fechamento</option>
            </select>
            <input name="note" placeholder="nota da validação" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Registrar validação</button>
          </form>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Validações registradas</h2><span className="kpi-chip">trilha decisória</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {validations.length ? validations.map((v) => (
              <div key={v.id} className="rounded-2xl border border-slate-800 p-4">
                <div className="font-medium text-white">{v.decision}</div>
                <div className="text-xs text-slate-500 mt-1">{v.validated_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || '-'}</div>
              </div>
            )) : <EmptyState title="Nenhuma validação de fechamento ainda" description="Quando o fechamento começar a ser revisado, a trilha de aprovação executiva vai aparecer aqui." />}
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Evolução mensal</h2><span className="kpi-chip">narrativa contínua</span></div>
        <div className="mt-4 space-y-3">
          {closures.length === 0 ? <EmptyState title="Sem fechamentos" description="Gere o primeiro fechamento mensal para iniciar a trilha executiva do projeto." /> : closures.map((c) => {
            const s = (c.snapshot || {}) as Record<string, unknown>;
            const r = (s.resumoMensal || {}) as Record<string, number>;
            return (
              <div key={c.id} className="rounded-[24px] border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">{c.period_ym} · v{c.snapshot_version}</div>
                    <div className="text-xs text-slate-500 mt-1">status: {c.status}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Faturamento</div><div className="mt-1 font-medium text-white">{br(Number(r.faturamento || 0))}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Receber</div><div className="mt-1 font-medium text-white">{br(Number(r.contasReceber || 0))}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Pagar</div><div className="mt-1 font-medium text-white">{br(Number(r.contasPagar || 0))}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Resultado</div><div className={`mt-1 font-medium ${toneClasses(Number(r.resultadoOperacional || 0))}`}>{br(Number(r.resultadoOperacional || 0))}</div></div>
                </div>
                <details className="mt-4 rounded-lg border border-slate-800 p-2">
                  <summary className="cursor-pointer text-sm text-slate-300">Abrir snapshot técnico</summary>
                  <pre className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">{JSON.stringify(c.snapshot, null, 2)}</pre>
                </details>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

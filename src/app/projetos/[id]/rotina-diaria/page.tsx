import { AppShell } from "@/components/AppShell";
import { EmptyState, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listRoutineRuns, type RoutineRun } from "@/lib/routine";
import Link from "next/link";
import { todayInSaoPauloISO } from "@/lib/time";
import { ensureCsrfCookie } from "@/lib/csrf";
import { listSopSteps, type SopStatus } from "@/lib/sop";

type RoutineSummary = {
  aiAnalysis?: { riskLevel?: string; recommendation?: string };
  reconciliation?: { pending?: number; status?: string };
  operationalDecision?: {
    gatingStatus?: string;
    blockingReasons?: string[];
    releaseSignals?: string[];
    suggestedActions?: string[];
    opPendingApproval?: number;
    carteiraVencida?: number;
  };
  cashflow90d?: { note?: string };
  delivery?: { summaryText?: string };
};

const STATUS_OPTIONS: { value: SopStatus; label: string }[] = [
  { value: "nao_iniciado", label: "Não iniciado" },
  { value: "em_execucao", label: "Em execução" },
  { value: "aguardando_validacao", label: "Aguardando validação" },
  { value: "concluido", label: "Concluído" },
  { value: "bloqueado", label: "Bloqueado" },
];

const PHASE_LABEL: Record<string, string> = {
  IMPLEMENTACAO: "Implementação",
  OPERACAO_DIARIA: "Operação diária",
  FECHAMENTO: "Fechamento",
};

function statusTone(status: string) {
  if (status === "blocked") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (status === "warning") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "ainda não executado";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function routineView(run: RoutineRun | undefined) {
  const s = ((run?.summary || {}) as RoutineSummary);
  return {
    riskLevel: s.aiAnalysis?.riskLevel || "-",
    recommendation: s.aiAnalysis?.recommendation || "Sem recomendação ainda.",
    pendingRecon: Number(s.reconciliation?.pending || 0),
    reconStatus: s.reconciliation?.status || "-",
    gatingStatus: s.operationalDecision?.gatingStatus || "-",
    blockingReasons: Array.isArray(s.operationalDecision?.blockingReasons) ? s.operationalDecision?.blockingReasons : [],
    releaseSignals: Array.isArray(s.operationalDecision?.releaseSignals) ? s.operationalDecision?.releaseSignals : [],
    suggestedActions: Array.isArray(s.operationalDecision?.suggestedActions) ? s.operationalDecision?.suggestedActions : [],
    pendingApprovals: Number(s.operationalDecision?.opPendingApproval || 0),
    overdueWallet: Number(s.operationalDecision?.carteiraVencida || 0),
    cashflowNote: s.cashflow90d?.note || "-",
    deliveryText: s.delivery?.summaryText || "-",
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; sop_saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);
  const query = await searchParams;

  if (!project) return <AppShell user={user} title="Projeto · Rotina Diária"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Rotina Diária"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Rotina Diária"><div className="alert bad-bg">Onboarding incompleto. Conclua o Cadastro antes de iniciar a rotina diária.</div></AppShell>;

  const [runs, sopSteps] = await Promise.all([
    listRoutineRuns(project.id, 25),
    listSopSteps(project.id),
  ]);
  const csrf = await ensureCsrfCookie();
  const latest = runs[0];
  const current = routineView(latest);
  const blockedSop = sopSteps.filter((step) => step.status === "bloqueado").length;
  const waitingSop = sopSteps.filter((step) => step.status === "aguardando_validacao").length;
  const mainAction = current.blockingReasons[0] || current.suggestedActions[0] || "Rodar a rotina e revisar o resultado operacional do dia.";
  const mainRisk = current.blockingReasons[0] || (current.pendingRecon > 0 ? `${current.pendingRecon} pendência(s) de conciliação ainda abertas.` : current.overdueWallet > 0 ? `Carteira vencida em ${current.overdueWallet}.` : "Sem risco dominante explícito na leitura atual.");

  return (
    <AppShell user={user} title="Projeto · Rotina Diária" subtitle="Execução do dia com leitura clara, sequência de ação e amarração do SOP">
      <ProductHero
        eyebrow="execução do dia"
        title="Rotina diária precisa te dizer o que aconteceu, o que travou e o que falta fechar."
        description="A tela agora se comporta como posto de comando: disparo da rotina, leitura do motor, próximos passos e governança operacional em uma linha só."
      >
        <StatusPill label={latest ? `Rotina: ${latest.status}` : "Sem rotina executada"} tone={latest?.status === "blocked" ? "bad" : latest?.status === "warning" ? "warn" : latest?.status === "success" ? "good" : "neutral"} />
        <StatusPill label={`Gating: ${current.gatingStatus}`} tone={current.gatingStatus === "bloqueado" ? "bad" : current.gatingStatus === "atencao" ? "warn" : "neutral"} />
      </ProductHero>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Rodar rotina</h2><span className="kpi-chip">ação principal</span></div>
        <div className="flex gap-2 flex-wrap mt-3 mb-4">
          <Link href={`/projetos/${id}/diario`} className="pill">Base Diária</Link>
          <Link href={`/projetos/${id}/operacoes`} className="pill">Operações</Link>
          <Link href={`/projetos/${id}/riscos-alertas`} className="pill">Painel de Risco</Link>
          <Link href={`/projetos/${id}/movimento-diario`} className="pill">Movimento Diário</Link>
        </div>
        <form action={`/api/projects/${id}/routine/run`} method="post" className="grid gap-3 md:grid-cols-[220px_1fr_auto] items-end">
          <input type="hidden" name="csrf_token" value={csrf} />
          <div>
            <label className="text-xs text-slate-400">Data de negócio</label>
            <input name="business_date" type="date" defaultValue={todayInSaoPauloISO()} className="mt-1 w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="text-sm text-slate-300 flex items-center gap-2 px-2 pb-2">
            <input type="checkbox" name="auto_delivery" value="1" defaultChecked />
            envio automático após validar rotina
          </label>
          <button className="badge py-2 px-4 cursor-pointer" type="submit">Rodar rotina diária</button>
        </form>
        {query.saved ? <div className="alert ok-bg mt-3">Rotina executada.</div> : null}
        {query.sop_saved ? <div className="alert ok-bg mt-3">Workflow SOP atualizado.</div> : null}
        {query.error ? <div className="alert bad-bg mt-3">Erro: {query.error === "evidence_required"
          ? "evidência obrigatória para concluir etapa"
          : query.error === "sop_prereq_cadastro"
            ? "pré-requisito SOP: concluir Cadastro antes da rotina"
            : query.error === "sop_prereq_upload_base_diaria"
              ? "pré-requisito SOP: concluir Upload Base Diária antes da rotina"
              : query.error === "approval_role_required"
                ? "você não tem perfil para concluir esta etapa (exige aprovação superior)"
                : query.error}</div> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando da rotina</h2><span className="kpi-chip">prioridade operacional</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
              <div className="mt-2 text-lg font-semibold text-white">{mainAction}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
              <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Leitura do motor</div>
              <div className="mt-2 text-base font-semibold text-white">{current.recommendation}</div>
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div>Última rotina: <span className="text-slate-200">{formatWhen(latest?.created_at)}</span></div>
                <div>Pend. aprovação: <span className="text-slate-200">{current.pendingApprovals}</span></div>
                <div>Risco IA: <span className="text-slate-200">{current.riskLevel}</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Checkpoint do dia</h2><span className="kpi-chip">sinais operacionais</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Status da rotina</div><div className="mt-1 font-medium text-white">{latest?.status || "sem execução"}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Pendências conciliação</div><div className="mt-1 font-medium text-white">{current.pendingRecon}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Gating operacional</div><div className="mt-1 font-medium text-white">{current.gatingStatus}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">SOP do dia</div><div className="mt-1 font-medium text-white">{blockedSop} bloqueios / {waitingSop} validações</div></div>
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Bloqueios e sinais de liberação</h2><span className="kpi-chip">resultado do motor</span></div>
          <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
              <div className="font-medium text-rose-100 mb-2">Bloqueios</div>
              <ul className="space-y-2 text-slate-300">
                {current.blockingReasons.length ? current.blockingReasons.map((x, i) => <li key={i}>• {x}</li>) : <li>• sem bloqueios ativos</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <div className="font-medium text-emerald-100 mb-2">Sinais de liberação</div>
              <ul className="space-y-2 text-slate-300">
                {current.releaseSignals.length ? current.releaseSignals.map((x, i) => <li key={i}>• {x}</li>) : <li>• nenhum sinal forte ainda</li>}
              </ul>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 p-4 text-sm text-slate-300">
            <div className="font-medium text-white">Resumo de delivery</div>
            <div className="mt-2">{current.deliveryText}</div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Próximas ações sugeridas</h2><span className="kpi-chip">destravar o dia</span></div>
          <div className="mt-4 space-y-2 text-sm">
            {current.suggestedActions.length ? current.suggestedActions.map((action, idx) => (
              <div key={`${action}-${idx}`} className="rounded-2xl border border-slate-800 bg-slate-950/20 px-4 py-3">
                <div className="font-medium text-slate-100">{action}</div>
              </div>
            )) : <div className="alert muted-bg">Sem ações sugeridas além da execução normal.</div>}
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">SOP operacional</h2><span className="kpi-chip">governança da rotina</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {sopSteps.map((step) => (
            <form key={step.key} action={`/api/projects/${id}/sop/update`} method="post" className="rounded-[22px] border border-slate-800 bg-slate-950/20 p-4">
              <input type="hidden" name="csrf_token" value={csrf} />
              <input type="hidden" name="step_key" value={step.key} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{PHASE_LABEL[step.phase]} · {step.order}. {step.title}</div>
                  <div className="text-xs text-slate-400 mt-1">Última atualização: {step.updated_at || "-"}</div>
                  <div className={`text-xs mt-1 ${step.slaState === "atrasado" ? "text-rose-400" : step.slaState === "ok" ? "text-emerald-300" : "text-slate-500"}`}>
                    SLA: {step.slaState === "n/a" ? "n/a" : step.slaState === "atrasado" ? "atrasado" : "ok"}
                  </div>
                </div>
                <select name="status" defaultValue={step.status} className="bg-slate-950/40 border border-slate-700 rounded px-3 py-2 text-xs">
                  {STATUS_OPTIONS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-2 mt-3">
                <input name="evidence" defaultValue={step.evidence} placeholder="Evidência (obrigatória para Concluído)" className="bg-slate-950/40 border border-slate-700 rounded px-3 py-2 text-xs" />
                <input name="note" defaultValue={step.note} placeholder="Observação (opcional)" className="bg-slate-950/40 border border-slate-700 rounded px-3 py-2 text-xs" />
              </div>
              <div className="mt-3">
                <button type="submit" className="pill">Salvar etapa</button>
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Histórico de execuções</h2><span className="kpi-chip">últimas rotinas</span></div>
        <div className="mt-3 space-y-3 text-sm">
          {runs.length === 0 ? <EmptyState title="Nenhuma rotina executada ainda" description="Assim que o time rodar a rotina diária, o histórico vai aparecer aqui com status, risco e recomendação." /> : null}
          {runs.map((r) => {
            const view = routineView(r);
            return (
              <div key={r.id} className="rounded-[22px] border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{r.business_date}</div>
                    <div className="text-xs text-slate-500 mt-1">{formatWhen(r.created_at)}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone(r.status)}`}>{r.status}</span>
                </div>
                <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="row"><span>Risco IA</span><b>{view.riskLevel}</b></div>
                  <div className="row"><span>Status decisório</span><b>{view.gatingStatus}</b></div>
                  <div className="row"><span>Pendências conciliação</span><b>{view.pendingRecon}</b></div>
                  <div className="row"><span>Ops pend. aprovação</span><b>{view.pendingApprovals}</b></div>
                  <div className="row"><span>Carteira vencida</span><b>{view.overdueWallet}</b></div>
                  <div className="row"><span>Fluxo 90d</span><b>{view.cashflowNote}</b></div>
                  <div className="row md:col-span-2"><span>Recomendação</span><b className="truncate pl-2">{view.recommendation}</b></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

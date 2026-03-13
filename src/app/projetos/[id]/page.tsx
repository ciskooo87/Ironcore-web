import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ActionLink, ProductHero, StatusPill, toneClassName } from "@/components/product-ui";
import { CheckpointPanel, CommandPanel } from "@/components/product-blocks";
import { requireUser } from "@/lib/guards";
import { canAccessProject } from "@/lib/permissions";
import { getProjectByCode, getProjectOnboardingChecks, isProjectOnboardingComplete } from "@/lib/projects";
import { listSopSteps } from "@/lib/sop";
import { listRoutineRuns } from "@/lib/routine";
import { listProjectAlerts } from "@/lib/alerts";
import { dbQuery } from "@/lib/db";

function formatWhen(value: string | null) {
  if (!value) return "ainda não executado";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function phaseLabel(implementationOpen: number, dailyBlocked: boolean, monthlyOpen: number) {
  if (implementationOpen > 0) return "Implantação";
  if (dailyBlocked) return "Operação diária";
  if (monthlyOpen > 0) return "Fechamento";
  return "Governança contínua";
}

function describePriority(input: {
  onboardingPending: number;
  blockedSteps: number;
  blockingReasons: string[];
  pendingApprovals: number;
  waitingValidation: number;
  openClosures: number;
}) {
  if (input.onboardingPending > 0) return "Fechar implantação estrutural do projeto antes de acelerar a operação.";
  if (input.blockingReasons.length > 0) return input.blockingReasons[0];
  if (input.blockedSteps > 0) return `Destravar ${input.blockedSteps} etapa(s) bloqueada(s) da operação.`;
  if (input.pendingApprovals > 0) return `Resolver ${input.pendingApprovals} aprovação(ões) operacional(is) pendente(s).`;
  if (input.waitingValidation > 0) return `Concluir ${input.waitingValidation} validação(ões) para liberar o fluxo.`;
  if (input.openClosures > 0) return `Fechar ${input.openClosures} fechamento(s) mensal(is) em aberto.`;
  return "Projeto limpo para seguir operação e monitoramento.";
}

function describeMainRisk(input: { alerts: number; blockingReasons: string[]; attentionReasons: string[]; latestStatus: string | null | undefined; onboardingPending: number }) {
  if (input.onboardingPending > 0) return "Base estrutural ainda incompleta para uma leitura operacional confiável.";
  if (input.blockingReasons.length > 0) return input.blockingReasons[0];
  if (input.alerts > 0) return `${input.alerts} alerta(s) ativo(s) exigindo leitura do painel de risco.`;
  if (input.attentionReasons.length > 0) return input.attentionReasons[0];
  if (input.latestStatus === "warning") return "Última rotina trouxe sinais de atenção que merecem revisão.";
  return "Sem risco crítico destacado na última leitura do motor.";
}

export default async function ProjectWarRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);

  if (!project) {
    return <AppShell user={user} title="Projeto" subtitle="Sala de guerra"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  }

  const allowed = await canAccessProject(user, project.id);
  if (!allowed) {
    return <AppShell user={user} title="Projeto" subtitle="Sala de guerra"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  }

  const [steps, runs, alerts, pendingApprovalsQ, openClosuresQ, recentAuditsQ] = await Promise.all([
    listSopSteps(project.id),
    listRoutineRuns(project.id, 5),
    listProjectAlerts(project.id),
    dbQuery<{ c: number }>(
      `select count(*)::int as c from financial_operations where project_id=$1 and status in ('pendente_aprovacao','pendente_formalizacao','em_correcao_formalizacao')`,
      [project.id]
    ),
    dbQuery<{ c: number }>(
      `select count(*)::int as c from monthly_closures where project_id=$1 and status in ('draft','generated','under_review')`,
      [project.id]
    ),
    dbQuery<{ action: string; entity: string; created_at: string }>(
      `select action, entity, created_at::text from audit_log where project_id=$1 order by created_at desc limit 6`,
      [project.id]
    ),
  ]);

  const latest = runs[0];
  const op = ((latest?.summary || {}) as Record<string, any>).operationalDecision || {};
  const onboardingChecks = getProjectOnboardingChecks(project);
  const onboardingPending = onboardingChecks.filter((item) => !item.done).length;
  const pendingApprovals = Number(pendingApprovalsQ.rows[0]?.c || 0);
  const openClosures = Number(openClosuresQ.rows[0]?.c || 0);
  const blockedSteps = steps.filter((s) => s.status === "bloqueado").length;
  const waitingValidation = steps.filter((s) => s.status === "aguardando_validacao").length;
  const inFlightSteps = steps.filter((s) => s.status === "em_execucao").length;
  const implementationOpen = steps.filter((s) => s.phase === "IMPLEMENTACAO" && s.status !== "concluido").length;
  const monthlyOpen = steps.filter((s) => s.phase === "FECHAMENTO" && s.status !== "concluido").length;
  const dailyBlocked = steps.some((s) => s.phase === "OPERACAO_DIARIA" && s.status === "bloqueado");
  const blockingReasons = Array.isArray(op.blockingReasons) ? op.blockingReasons.map(String) : [];
  const attentionReasons = Array.isArray(op.attentionReasons) ? op.attentionReasons.map(String) : [];
  const gatingStatus = String(op.gatingStatus || "sem leitura");
  const recommendation = String(op.recommendation || "Sem recomendação operacional recente.");
  const phase = phaseLabel(implementationOpen, dailyBlocked, monthlyOpen);
  const onboardingComplete = isProjectOnboardingComplete(project);
  const implementationDone = steps.filter((s) => s.phase === "IMPLEMENTACAO" && s.status === "concluido").length;
  const implementationTotal = steps.filter((s) => s.phase === "IMPLEMENTACAO").length;
  const dailyDone = steps.filter((s) => s.phase === "OPERACAO_DIARIA" && s.status === "concluido").length;
  const dailyTotal = steps.filter((s) => s.phase === "OPERACAO_DIARIA").length;
  const closingDone = steps.filter((s) => s.phase === "FECHAMENTO" && s.status === "concluido").length;
  const closingTotal = steps.filter((s) => s.phase === "FECHAMENTO").length;

  let tone: "good" | "warn" | "bad" | "info" = "good";
  let statusLabel = "Operação estável";
  if (!onboardingComplete) {
    tone = "info";
    statusLabel = "Implantação";
  } else if (blockedSteps > 0 || blockingReasons.length > 0 || latest?.status === "blocked") {
    tone = "bad";
    statusLabel = "Bloqueado";
  } else if (waitingValidation > 0 || pendingApprovals > 0 || attentionReasons.length > 0 || alerts.length > 0 || latest?.status === "warning") {
    tone = "warn";
    statusLabel = "Atenção";
  }

  const nextActions = [
    !onboardingComplete ? { label: "Concluir onboarding", href: `/projetos/${project.code}/cadastro`, detail: "Fechar pendências estruturais do projeto." } : null,
    blockingReasons.length > 0 ? { label: "Tratar bloqueio operacional", href: `/projetos/${project.code}/movimento-diario`, detail: "Atuar nos bloqueios apontados pelo motor." } : null,
    pendingApprovals > 0 ? { label: "Resolver aprovações pendentes", href: `/projetos/${project.code}/operacoes`, detail: "Limpar fila de aprovações e formalização." } : null,
    waitingValidation > 0 ? { label: "Fechar validações pendentes", href: `/projetos/${project.code}/fluxo-trabalho`, detail: "Concluir etapas aguardando decisão." } : null,
    openClosures > 0 ? { label: "Concluir fechamento em aberto", href: `/projetos/${project.code}/fechamento-mensal`, detail: "Limpar backlog de fechamento mensal." } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; detail: string }>;

  const primaryAction = nextActions[0] || { label: "Abrir fluxo do projeto", href: `/projetos/${project.code}/fluxo-trabalho`, detail: "Seguir leitura macro do projeto." };

  const lanes = [
    {
      title: "Implantação",
      href: `/projetos/${project.code}/cadastro`,
      done: implementationDone,
      total: implementationTotal,
      status: onboardingComplete ? "Base pronta" : "Pendências abertas",
      hint: onboardingComplete ? "Estrutura do projeto pronta para operar." : `${onboardingPending} item(ns) estrutural(is) pendente(s).`,
    },
    {
      title: "Operação diária",
      href: `/projetos/${project.code}/rotina-diaria`,
      done: dailyDone,
      total: dailyTotal,
      status: latest?.status === "blocked" ? "Travada" : latest?.status === "warning" ? "Em atenção" : "Rodando",
      hint: `Gating atual: ${gatingStatus}.`,
    },
    {
      title: "Fechamento",
      href: `/projetos/${project.code}/fechamento-mensal`,
      done: closingDone,
      total: closingTotal,
      status: openClosures > 0 ? "Backlog aberto" : "Sem fila crítica",
      hint: openClosures > 0 ? `${openClosures} fechamento(s) em aberto.` : "Sem fechamento represado na fila.",
    },
  ];

  return (
    <AppShell
      user={user}
      title={`Projeto · ${project.name}`}
      subtitle="Sala de guerra do projeto: prioridade do dia, estado operacional, gargalos e entrada limpa para cada frente"
    >
      <ProductHero
        eyebrow={`projeto ${project.code}`}
        title={project.legal_name}
        description={project.project_summary || "Projeto sem resumo executivo ainda. Use esta página como entrada principal para destravar operação, fechamento e governança."}
      >
        <StatusPill label={statusLabel} tone={tone === "info" ? "info" : tone} />
        <StatusPill label={phase} tone="neutral" />
        <StatusPill label={`Gating: ${gatingStatus}`} tone={gatingStatus === "bloqueado" ? "bad" : gatingStatus === "atencao" ? "warn" : gatingStatus === "liberado" ? "good" : "neutral"} />
        <ActionLink href={primaryAction.href} label={primaryAction.label} />
        <ActionLink href={`/projetos/${project.code}/fluxo-trabalho`} label="Fluxo" tone="secondary" />
        <ActionLink href={`/projetos/${project.code}/movimento-diario`} label="Movimento" tone="secondary" />
        <ActionLink href={`/projetos/${project.code}/operacoes`} label="Operações" tone="secondary" />
      </ProductHero>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando do dia</h2><span className="kpi-chip">prioridade executiva</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <CommandPanel action={<>{describePriority({ onboardingPending, blockedSteps, blockingReasons, pendingApprovals, waitingValidation, openClosures })}</>} risk={<>{describeMainRisk({ alerts: alerts.length, blockingReasons, attentionReasons, latestStatus: latest?.status, onboardingPending })}</>} />
            <CheckpointPanel title="Leitura do motor">
              <div className="text-base font-semibold text-white">{recommendation}</div>
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div>Última rotina: <span className="text-slate-200">{formatWhen(latest?.created_at || null)}</span></div>
                <div>Status da rotina: <span className="text-slate-200">{latest?.status || "sem execução"}</span></div>
                <div>Alertas ativos: <span className="text-slate-200">{alerts.length}</span></div>
              </div>
            </CheckpointPanel>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Fila de ação</h2><span className="kpi-chip">próximos passos</span></div>
          <div className="mt-4 space-y-2 text-sm">
            {nextActions.length === 0 ? <div className="alert ok-bg">Nenhuma pendência crítica agora. Projeto navegando limpo.</div> : null}
            {nextActions.map((action) => (
              <Link key={action.href} href={action.href} className="block rounded-2xl border border-slate-800 bg-slate-950/20 px-4 py-3 hover:border-cyan-400 hover:bg-slate-900/40">
                <div className="font-medium text-slate-100">{action.label}</div>
                <div className="text-xs text-slate-500 mt-1">{action.detail}</div>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Bloqueios ativos</div><div className="text-lg font-semibold mt-1 text-rose-200">{blockingReasons.length + blockedSteps}</div><div className="text-xs text-cyan-300 mt-1">motor + etapas do fluxo</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Validações pendentes</div><div className="text-lg font-semibold mt-1 text-amber-200">{waitingValidation}</div><div className="text-xs text-cyan-300 mt-1">aprovações ops: {pendingApprovals}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Em execução</div><div className="text-lg font-semibold mt-1 text-cyan-100">{inFlightSteps}</div><div className="text-xs text-cyan-300 mt-1">frentes vivas no SOP</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Onboarding / fechamento</div><div className="text-lg font-semibold mt-1">{onboardingPending} / {openClosures}</div><div className="text-xs text-cyan-300 mt-1">pendências estruturais / backlog</div></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Frentes do projeto</h2><span className="kpi-chip">macro por trilha</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {lanes.map((lane) => {
              const progress = lane.total ? (lane.done / lane.total) * 100 : 0;
              return (
                <Link key={lane.title} href={lane.href} className="rounded-[22px] border border-slate-800 bg-slate-950/20 p-4 hover:border-cyan-400 hover:bg-slate-950/30">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{lane.title}</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{lane.done}/{lane.total}</div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-3 text-sm font-medium text-slate-100">{lane.status}</div>
                  <div className="mt-1 text-xs text-slate-500">{lane.hint}</div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {steps.map((step) => (
              <div key={step.key} className="row rounded-xl border border-slate-800 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">{step.title}</div>
                  <div className="text-xs text-slate-500">{step.phase}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${step.status === "bloqueado" ? toneClassName("bad") : step.status === "aguardando_validacao" ? toneClassName("warn") : step.status === "concluido" ? toneClassName("good") : step.status === "em_execucao" ? toneClassName("info") : "border-slate-700 bg-slate-900/40 text-slate-300"}`}>{step.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <section className="card">
            <div className="section-head"><h2 className="title">Sinais operacionais</h2><span className="kpi-chip">alertas e atenção</span></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                <div className="font-medium text-rose-100 mb-2">Bloqueios</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {blockingReasons.length === 0 ? <li className="text-slate-400">Sem bloqueio explícito no motor.</li> : blockingReasons.map((item: string) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                <div className="font-medium text-amber-100 mb-2">Atenções</div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {attentionReasons.length === 0 ? <li className="text-slate-400">Sem atenção adicional relevante.</li> : attentionReasons.map((item: string) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-head"><h2 className="title">Trilha recente</h2><span className="kpi-chip">auditoria viva</span></div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {recentAuditsQ.rows.length === 0 ? <div className="alert muted-bg">Sem trilha recente.</div> : null}
              {recentAuditsQ.rows.map((item) => (
                <div key={`${item.created_at}-${item.action}`} className="rounded-xl border border-slate-800 px-3 py-2">
                  <div className="font-medium text-slate-100">{item.action}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.entity} · {formatWhen(item.created_at)}</div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Base estrutural do projeto</h2><span className="kpi-chip">onboarding</span></div>
        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
          {onboardingChecks.map((item) => (
            <div key={item.key} className="row rounded-xl border border-slate-800 px-3 py-3">
              <span>{item.label}</span>
              <b className={item.done ? "text-emerald-300" : "text-amber-300"}>{item.done ? "ok" : "pendente"}</b>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

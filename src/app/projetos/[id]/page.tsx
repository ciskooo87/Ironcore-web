import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ActionLink, EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { canAccessProject } from "@/lib/permissions";
import { getProjectByCode, getProjectOnboardingChecks, isProjectOnboardingComplete } from "@/lib/projects";
import { listSopSteps } from "@/lib/sop";
import { listRoutineRuns } from "@/lib/routine";
import { listProjectAlerts } from "@/lib/alerts";
import { dbQuery } from "@/lib/db";

function toneClasses(tone: "good" | "warn" | "bad") {
  if (tone === "bad") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (tone === "warn") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

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
  const implementationOpen = steps.filter((s) => s.phase === "IMPLEMENTACAO" && s.status !== "concluido").length;
  const monthlyOpen = steps.filter((s) => s.phase === "FECHAMENTO" && s.status !== "concluido").length;
  const dailyBlocked = steps.some((s) => s.phase === "OPERACAO_DIARIA" && s.status === "bloqueado");
  const blockingReasons = Array.isArray(op.blockingReasons) ? op.blockingReasons : [];
  const attentionReasons = Array.isArray(op.attentionReasons) ? op.attentionReasons : [];
  const gatingStatus = String(op.gatingStatus || "sem leitura");
  const recommendation = String(op.recommendation || "Sem recomendação operacional recente.");
  const phase = phaseLabel(implementationOpen, dailyBlocked, monthlyOpen);

  let tone: "good" | "warn" | "bad" = "good";
  let statusLabel = "Operação estável";
  if (blockedSteps > 0 || blockingReasons.length > 0 || latest?.status === "blocked") {
    tone = "bad";
    statusLabel = "Bloqueado";
  } else if (onboardingPending > 0 || waitingValidation > 0 || pendingApprovals > 0 || attentionReasons.length > 0 || alerts.length > 0) {
    tone = "warn";
    statusLabel = "Atenção";
  }

  const nextActions = [
    !isProjectOnboardingComplete(project) ? { label: "Concluir onboarding", href: `/projetos/${project.code}/cadastro` } : null,
    blockingReasons.length > 0 ? { label: "Tratar bloqueio operacional", href: `/projetos/${project.code}/movimento-diario` } : null,
    pendingApprovals > 0 ? { label: "Resolver aprovações pendentes", href: `/projetos/${project.code}/operacoes` } : null,
    waitingValidation > 0 ? { label: "Fechar validações pendentes", href: `/projetos/${project.code}/fluxo-trabalho` } : null,
    openClosures > 0 ? { label: "Concluir fechamento em aberto", href: `/projetos/${project.code}/fechamento-mensal` } : null,
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  const primaryAction = nextActions[0] || { label: "Abrir fluxo do projeto", href: `/projetos/${project.code}/fluxo-trabalho` };

  return (
    <AppShell
      user={user}
      title={`Projeto · ${project.name}`}
      subtitle="Sala de guerra do projeto: estado atual, decisão do dia, travas, fluxo e próximos passos"
    >
      <ProductHero
        eyebrow={`projeto ${project.code}`}
        title={project.legal_name}
        description={project.project_summary || "Projeto sem resumo executivo ainda. Use esta página como entrada principal para destravar operação, fechamento e governança."}
      >
        <StatusPill label={statusLabel} tone={tone} />
        <StatusPill label={phase} tone="neutral" />
        <StatusPill label={`Status decisório: ${gatingStatus}`} tone="info" />
        <ActionLink href={primaryAction.href} label={primaryAction.label} />
        <ActionLink href={`/projetos/${project.code}/fluxo-trabalho`} label="Fluxo" tone="secondary" />
        <ActionLink href={`/projetos/${project.code}/movimento-diario`} label="Movimento" tone="secondary" />
        <ActionLink href={`/projetos/${project.code}/rotina-diaria`} label="Rotina" tone="secondary" />
      </ProductHero>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Última rotina</div><div className="text-lg font-semibold mt-1">{formatWhen(latest?.created_at || null)}</div><div className="text-xs text-cyan-300 mt-1">status: {latest?.status || "sem execução"}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Bloqueios ativos</div><div className="text-lg font-semibold mt-1 text-rose-200">{blockingReasons.length + blockedSteps}</div><div className="text-xs text-cyan-300 mt-1">alertas: {alerts.length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Validações pendentes</div><div className="text-lg font-semibold mt-1 text-amber-200">{waitingValidation}</div><div className="text-xs text-cyan-300 mt-1">aprovações ops: {pendingApprovals}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Onboarding pendente</div><div className="text-lg font-semibold mt-1">{onboardingPending}</div><div className="text-xs text-cyan-300 mt-1">fechamentos abertos: {openClosures}</div></div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Decisão do dia</h2><span className="kpi-chip">motor operacional</span></div>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Recomendação</div>
              <div className="mt-2 text-lg font-semibold text-white">{recommendation}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                <div className="font-medium text-rose-100 mb-2">Bloqueios</div>
                <ul className="space-y-2">
                  {blockingReasons.length === 0 ? <li className="text-slate-400">Sem bloqueio explícito no motor.</li> : blockingReasons.map((item: string) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
                <div className="font-medium text-amber-100 mb-2">Atenções</div>
                <ul className="space-y-2">
                  {attentionReasons.length === 0 ? <li className="text-slate-400">Sem atenção adicional relevante.</li> : attentionReasons.map((item: string) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Próximas ações</h2><span className="kpi-chip">fila do projeto</span></div>
          <div className="mt-4 space-y-2 text-sm">
            {nextActions.length === 0 ? <div className="alert ok-bg">Nenhuma pendência crítica agora. Projeto navegando limpo.</div> : null}
            {nextActions.map((action) => (
              <Link key={action.href} href={action.href} className="block rounded-2xl border border-slate-800 bg-slate-950/20 px-4 py-3 hover:border-cyan-400 hover:bg-slate-900/40">
                <div className="font-medium text-slate-100">{action.label}</div>
                <div className="text-xs text-slate-500 mt-1">Abrir frente correspondente e executar</div>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Fluxo do projeto</h2><span className="kpi-chip">timeline viva</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Implantação", steps.filter((s) => s.phase === "IMPLEMENTACAO" && s.status === "concluido").length, steps.filter((s) => s.phase === "IMPLEMENTACAO").length],
              ["Operação diária", steps.filter((s) => s.phase === "OPERACAO_DIARIA" && s.status === "concluido").length, steps.filter((s) => s.phase === "OPERACAO_DIARIA").length],
              ["Fechamento", steps.filter((s) => s.phase === "FECHAMENTO" && s.status === "concluido").length, steps.filter((s) => s.phase === "FECHAMENTO").length],
            ].map(([label, done, total]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-800 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{done}/{total}</div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${total ? (Number(done) / Number(total)) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            {steps.map((step) => (
              <div key={step.key} className="row rounded-xl border border-slate-800 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">{step.title}</div>
                  <div className="text-xs text-slate-500">{step.phase}</div>
                </div>
                <span className="pill">{step.status}</span>
              </div>
            ))}
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

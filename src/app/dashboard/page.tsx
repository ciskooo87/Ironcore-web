import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getUsageKpis } from "@/lib/kpis";
import { listProjectsForUser } from "@/lib/projects";
import { listSopSteps, type SopStepView } from "@/lib/sop";
import { listRoutineRuns } from "@/lib/routine";
import { dbQuery } from "@/lib/db";
import { listProjectAlerts } from "@/lib/alerts";

type ProjectCockpit = {
  id: string;
  code: string;
  name: string;
  segment: string;
  timezone: string;
  statusLabel: string;
  statusTone: "good" | "warn" | "bad";
  phaseLabel: string;
  nextActionLabel: string;
  nextActionHref: string;
  latestRoutineStatus: string;
  gatingStatus: string;
  blockingCount: number;
  attentionCount: number;
  pendingSteps: number;
  blockedSteps: number;
  alertCount: number;
  lastRoutineAt: string | null;
};

function toneClasses(tone: ProjectCockpit["statusTone"]) {
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

function sectionPhase(steps: SopStepView[]) {
  const implementationOpen = steps.filter((s) => s.phase === "IMPLEMENTACAO" && s.status !== "concluido");
  if (implementationOpen.length > 0) return "Implantação";
  const dailyBlocked = steps.some((s) => s.phase === "OPERACAO_DIARIA" && s.status === "bloqueado");
  if (dailyBlocked) return "Operação diária";
  const monthlyOpen = steps.filter((s) => s.phase === "FECHAMENTO" && s.status !== "concluido");
  if (monthlyOpen.length > 0) return "Fechamento";
  return "Governança contínua";
}

function pickNextAction(code: string, steps: SopStepView[]) {
  const firstPending = steps.find((step) => step.status !== "concluido");
  const map: Record<string, { label: string; href: string }> = {
    cadastro: { label: "Concluir cadastro", href: `/projetos/${code}/cadastro` },
    riscos: { label: "Revisar riscos", href: `/projetos/${code}/riscos-alertas` },
    upload_base_historica: { label: "Subir base histórica", href: `/projetos/${code}/diario` },
    analise_base_historica: { label: "Rodar diagnóstico histórico", href: `/projetos/${code}/diagnostico-historico` },
    validacao_diagnostico: { label: "Validar diagnóstico", href: `/projetos/${code}/fluxo-trabalho` },
    upload_base_diaria: { label: "Subir base diária", href: `/projetos/${code}/diario` },
    painel_risco: { label: "Revisar painel de risco", href: `/projetos/${code}/riscos-alertas` },
    movimento_diario: { label: "Tratar movimento diário", href: `/projetos/${code}/movimento-diario` },
    validacao_movimento: { label: "Validar movimento", href: `/projetos/${code}/movimento-diario` },
    alimentacao_contabil: { label: "Preparar fechamento", href: `/projetos/${code}/fechamento-mensal` },
    fechamento_mensal: { label: "Fechar mês", href: `/projetos/${code}/fechamento-mensal` },
    validacao_fechamento: { label: "Validar fechamento", href: `/projetos/${code}/monitoramento-diretoria` },
    monitoramento_diretoria: { label: "Revisar visão diretoria", href: `/projetos/${code}/monitoramento-diretoria` },
  };

  return firstPending && map[firstPending.key]
    ? map[firstPending.key]
    : { label: "Abrir sala de guerra", href: `/projetos/${code}` };
}

async function getPendingApprovals(projectId: string) {
  try {
    const q = await dbQuery<{ c: number }>(
      `select count(*)::int as c from financial_operations
       where project_id=$1 and status in ('pendente_aprovacao','pendente_formalizacao','em_correcao_formalizacao')`,
      [projectId]
    );
    return Number(q.rows[0]?.c || 0);
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const user = await requireUser();
  const usage = await getUsageKpis();
  const projects = await listProjectsForUser(user.email, user.role);

  const projectCockpit = await Promise.all(
    projects.map(async (project) => {
      const [steps, runs, alerts, pendingApprovals] = await Promise.all([
        listSopSteps(project.id),
        listRoutineRuns(project.id, 5),
        listProjectAlerts(project.id),
        getPendingApprovals(project.id),
      ]);

      const latest = runs[0];
      const op = ((latest?.summary || {}) as Record<string, any>).operationalDecision || {};
      const blockingCount = Array.isArray(op.blockingReasons) ? op.blockingReasons.length : 0;
      const attentionCount = Array.isArray(op.attentionReasons) ? op.attentionReasons.length : 0;
      const blockedSteps = steps.filter((s) => s.status === "bloqueado").length;
      const pendingSteps = steps.filter((s) => s.status !== "concluido").length;
      const nextAction = pickNextAction(project.code, steps);
      const gatingStatus = String(op.gatingStatus || "sem leitura");

      let statusLabel = "Operação liberada";
      let statusTone: ProjectCockpit["statusTone"] = "good";
      if (blockedSteps > 0 || blockingCount > 0 || latest?.status === "blocked") {
        statusLabel = "Bloqueado";
        statusTone = "bad";
      } else if (pendingApprovals > 0 || attentionCount > 0 || latest?.status === "warning" || pendingSteps > 0) {
        statusLabel = "Atenção";
        statusTone = "warn";
      }

      return {
        id: project.id,
        code: project.code,
        name: project.name,
        segment: project.segment,
        timezone: project.timezone,
        statusLabel,
        statusTone,
        phaseLabel: sectionPhase(steps),
        nextActionLabel: nextAction.label,
        nextActionHref: nextAction.href,
        latestRoutineStatus: latest?.status || "sem rotina",
        gatingStatus,
        blockingCount,
        attentionCount: attentionCount + pendingApprovals,
        pendingSteps,
        blockedSteps,
        alertCount: alerts.length,
        lastRoutineAt: latest?.created_at || null,
      } satisfies ProjectCockpit;
    })
  );

  const blockedProjects = projectCockpit.filter((p) => p.statusTone === "bad");
  const warningProjects = projectCockpit.filter((p) => p.statusTone === "warn");
  const goodProjects = projectCockpit.filter((p) => p.statusTone === "good");
  const topPriority = blockedProjects[0] || warningProjects[0] || projectCockpit[0] || null;

  return (
    <AppShell
      user={user}
      title="Ironcore · Cockpit"
      subtitle="Centro de comando da operação: o que exige atenção agora, qual decisão tomar e qual é a próxima melhor ação"
    >
      <section className="mb-4 rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(14,116,144,0.22),rgba(15,23,42,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              missão diária do ironcore
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">O produto precisa te dizer o que resolver agora — não te fazer caçar módulo.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              Use este cockpit como camada principal do Ironcore: prioridade operacional, fase do fluxo, status decisório e próximo passo por projeto.
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Projetos em foco</div>
              <div className="mt-1 text-2xl font-semibold text-white">{projectCockpit.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Bloqueados agora</div>
              <div className="mt-1 text-2xl font-semibold text-rose-200">{blockedProjects.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Em atenção</div>
              <div className="mt-1 text-2xl font-semibold text-amber-200">{warningProjects.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">Rotinas com sucesso</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-200">{usage.routineSuccess}/{usage.routineTotal}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr] mb-4">
        <section className="card">
          <div className="section-head">
            <h2 className="title">Missão do dia</h2>
            <span className="kpi-chip">prioridade máxima</span>
          </div>

          {!topPriority ? (
            <div className="alert muted-bg mt-3">Ainda não há projetos visíveis para montar o cockpit.</div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses(topPriority.statusTone)}`}>{topPriority.statusLabel}</span>
                <span className="pill">{topPriority.name}</span>
                <span className="pill">{topPriority.phaseLabel}</span>
                <span className="pill">gating: {topPriority.gatingStatus}</span>
              </div>

              <div>
                <div className="text-sm text-slate-400">Próxima melhor ação</div>
                <div className="mt-1 text-2xl font-semibold text-white">{topPriority.nextActionLabel}</div>
                <div className="mt-2 text-sm text-slate-300">
                  Última rotina: <b>{formatWhen(topPriority.lastRoutineAt)}</b> · bloqueios: <b>{topPriority.blockingCount}</b> · pendências/atenções: <b>{topPriority.attentionCount}</b>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Bloqueios</div>
                  <div className="mt-1 text-xl font-semibold text-rose-200">{topPriority.blockingCount + topPriority.blockedSteps}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Atenções</div>
                  <div className="mt-1 text-xl font-semibold text-amber-200">{topPriority.attentionCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Etapas abertas</div>
                  <div className="mt-1 text-xl font-semibold text-cyan-200">{topPriority.pendingSteps}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={topPriority.nextActionHref} className="badge px-4 py-2">Abrir próxima ação</Link>
                <Link href={`/projetos/${topPriority.code}/fluxo-trabalho`} className="pill">Ver fluxo completo</Link>
                <Link href={`/projetos/${topPriority.code}/movimento-diario`} className="pill">Abrir movimento diário</Link>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-head">
            <h2 className="title">Atenção agora</h2>
            <span className="kpi-chip">fila operacional</span>
          </div>
          <div className="mt-3 space-y-3 text-sm">
            {blockedProjects.length === 0 && warningProjects.length === 0 ? (
              <div className="alert ok-bg">Sem filas críticas no momento. O cockpit está limpo.</div>
            ) : null}

            {blockedProjects.map((project) => (
              <div key={`blocked-${project.id}`} className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-rose-100">{project.name}</div>
                    <div className="text-xs text-rose-200/80">{project.phaseLabel} · gating {project.gatingStatus}</div>
                  </div>
                  <Link href={project.nextActionHref} className="pill">Resolver</Link>
                </div>
              </div>
            ))}

            {warningProjects.slice(0, 4).map((project) => (
              <div key={`warn-${project.id}`} className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-amber-100">{project.name}</div>
                    <div className="text-xs text-amber-200/80">{project.attentionCount} pendências/atenções · {project.phaseLabel}</div>
                  </div>
                  <Link href={project.nextActionHref} className="pill">Abrir</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Usuários ativos 30d</div><div className="text-xl font-semibold mt-1">{usage.activeUsers}</div><div className="text-xs text-cyan-300 mt-1">Adoção real da plataforma</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Inconsistências 30d</div><div className="text-xl font-semibold mt-1">{usage.inconsistencies}</div><div className="text-xs text-cyan-300 mt-1">Warnings + bloqueios de conciliação</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Conciliações manuais</div><div className="text-xl font-semibold mt-1">{usage.manualReconciliations}</div><div className="text-xs text-cyan-300 mt-1">Carga operacional da equipe</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Entregas automáticas</div><div className="text-xl font-semibold mt-1">{usage.deliverySent}</div><div className="text-xs text-cyan-300 mt-1">Falhas: {usage.deliveryFailed} · Skip: {usage.deliverySkipped}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Projetos em foco</h2><span className="kpi-chip">sala de guerra</span></div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {projectCockpit.length === 0 ? <div className="alert muted-bg">Sem projetos disponíveis.</div> : null}
          {projectCockpit.map((project) => (
            <article key={project.id} className="rounded-[24px] border border-slate-800 bg-slate-950/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    <span className="badge">{project.code}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{project.segment} · {project.timezone}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses(project.statusTone)}`}>{project.statusLabel}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Fase</div><div className="mt-1 font-medium">{project.phaseLabel}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Gating</div><div className="mt-1 font-medium">{project.gatingStatus}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Bloqueios</div><div className="mt-1 font-medium text-rose-200">{project.blockingCount + project.blockedSteps}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Alertas</div><div className="mt-1 font-medium text-amber-200">{project.alertCount}</div></div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link href={project.nextActionHref} className="badge px-4 py-2">{project.nextActionLabel}</Link>
                <Link href={`/projetos/${project.code}/fluxo-trabalho`} className="pill">Fluxo</Link>
                <Link href={`/projetos/${project.code}/rotina-diaria`} className="pill">Rotina</Link>
                <Link href={`/projetos/${project.code}/diagnostico-historico`} className="pill">Diagnóstico</Link>
              </div>

              <div className="mt-3 text-xs text-slate-500">Última rotina: {formatWhen(project.lastRoutineAt)} · status runtime: {project.latestRoutineStatus}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card">
          <div className="section-head"><h2 className="title">Timeline do fluxo</h2><span className="kpi-chip">modelo de produto</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Implantação", `${projectCockpit.filter((p) => p.phaseLabel === "Implantação").length} projeto(s)`, "Cadastro, riscos, base histórica, diagnóstico"],
              ["Operação", `${projectCockpit.filter((p) => p.phaseLabel === "Operação diária").length} projeto(s)`, "Upload diário, risco, movimento e validação"],
              ["Fechamento", `${projectCockpit.filter((p) => p.phaseLabel === "Fechamento").length} projeto(s)`, "Alimentação contábil, fechamento e validação"],
              ["Governança", `${goodProjects.length} projeto(s) estáveis`, "Diretoria, auditoria e monitoramento contínuo"],
            ].map(([title, count, desc]) => (
              <div key={String(title)} className="rounded-2xl border border-slate-800 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
                <div className="mt-2 text-lg font-semibold text-white">{count}</div>
                <div className="mt-2 text-sm text-slate-300">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Saúde do motor</h2><span className="kpi-chip">últimos 30 dias</span></div>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {usage.topModules.length === 0 ? <div className="alert muted-bg">Sem dados de uso ainda.</div> : null}
            {usage.topModules.map((m) => (
              <div key={m.entity} className="row rounded-xl border border-slate-800 px-3 py-2"><span>{m.entity}</span><b>{m.c}</b></div>
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}

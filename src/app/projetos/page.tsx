import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { isProjectOnboardingComplete, listProjectsForUser } from "@/lib/projects";
import { listSopSteps, type SopStepView } from "@/lib/sop";
import { listRoutineRuns } from "@/lib/routine";

type PortfolioTone = "good" | "warn" | "bad" | "info";
type PortfolioStage = "ok" | "atencao" | "bloqueado" | "implantacao";

function toneClasses(tone: PortfolioTone) {
  if (tone === "bad") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (tone === "warn") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (tone === "info") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

function statusTone(stage: PortfolioStage): PortfolioTone {
  if (stage === "bloqueado") return "bad";
  if (stage === "atencao") return "warn";
  if (stage === "implantacao") return "info";
  return "good";
}

function stageLabel(stage: PortfolioStage) {
  if (stage === "bloqueado") return "Bloqueado";
  if (stage === "atencao") return "Atenção";
  if (stage === "implantacao") return "Implantação";
  return "Operação estável";
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "sem rotina";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getNextCriticalStep(steps: SopStepView[]) {
  return steps.find((step) => step.status === "bloqueado" || step.status === "aguardando_validacao" || step.status === "em_execucao" || step.status === "nao_iniciado") || null;
}

function describeNextAction(input: {
  onboardingComplete: boolean;
  blocked: number;
  waiting: number;
  gating: string;
  nextStep: SopStepView | null;
  blockingReasons: string[];
  attentionReasons: string[];
}) {
  if (!input.onboardingComplete) {
    if (input.nextStep) return `Fechar implantação em ${input.nextStep.title.toLowerCase()}.`;
    return "Concluir implantação e deixar o projeto operacional.";
  }

  if (input.blockingReasons.length > 0) {
    return input.blockingReasons[0];
  }

  if (input.blocked > 0 && input.nextStep) {
    return `Destravar ${input.nextStep.title.toLowerCase()} para voltar a operar.`;
  }

  if (input.waiting > 0 && input.nextStep) {
    return `Validar ${input.nextStep.title.toLowerCase()} para liberar o fluxo.`;
  }

  if (input.attentionReasons.length > 0) {
    return input.attentionReasons[0];
  }

  if (input.gating === "atencao") {
    return "Revisar sinais operacionais antes da próxima execução.";
  }

  return "Seguir operação diária e monitorar próximos desvios.";
}

function describeRisk(input: { blocked: number; waiting: number; blockingReasons: string[]; attentionReasons: string[]; onboardingComplete: boolean }) {
  if (!input.onboardingComplete) return "Implantação incompleta ainda distorce a leitura operacional.";
  if (input.blockingReasons.length > 0) return input.blockingReasons[0];
  if (input.blocked > 0) return `${input.blocked} etapa(s) da esteira estão bloqueadas.`;
  if (input.waiting > 0) return `${input.waiting} validação(ões) aguardando decisão.`;
  if (input.attentionReasons.length > 0) return input.attentionReasons[0];
  return "Sem risco crítico aberto na leitura atual.";
}

export default async function ProjetosPage({ searchParams }: { searchParams: Promise<{ error?: string; segment?: string }> }) {
  const user = await requireUser();
  const projects = await listProjectsForUser(user.email, user.role);
  const params = await searchParams;

  const segments = Array.from(new Set(projects.map((p) => p.segment).filter(Boolean))).sort();
  const segmentFilter = (params.segment || "all").trim();
  const filteredProjects = segmentFilter === "all" ? projects : projects.filter((p) => p.segment === segmentFilter);

  const projectCards = await Promise.all(
    filteredProjects.map(async (p) => {
      const [steps, runs] = await Promise.all([listSopSteps(p.id), listRoutineRuns(p.id, 1)]);
      const latest = runs[0];
      const onboardingComplete = isProjectOnboardingComplete(p);
      const blocked = steps.filter((s) => s.status === "bloqueado").length;
      const waiting = steps.filter((s) => s.status === "aguardando_validacao").length;
      const inFlight = steps.filter((s) => s.status === "em_execucao").length;
      const doneSteps = steps.filter((s) => s.status === "concluido").length;
      const op = ((latest?.summary || {}) as Record<string, any>).operationalDecision || {};
      const gating = String(op.gatingStatus || "sem leitura");
      const blockingReasons = Array.isArray(op.blockingReasons) ? op.blockingReasons.map(String) : [];
      const attentionReasons = Array.isArray(op.attentionReasons) ? op.attentionReasons.map(String) : [];
      const blockingReasonsCount = blockingReasons.length;
      const nextStep = getNextCriticalStep(steps);

      let stage: PortfolioStage = "ok";
      if (!onboardingComplete) {
        stage = "implantacao";
      } else if (blocked > 0 || latest?.status === "blocked" || blockingReasonsCount > 0 || gating === "bloqueado") {
        stage = "bloqueado";
      } else if (waiting > 0 || inFlight > 0 || latest?.status === "warning" || gating === "atencao" || attentionReasons.length > 0) {
        stage = "atencao";
      }

      return {
        project: p,
        onboardingComplete,
        blocked,
        waiting,
        inFlight,
        doneSteps,
        latest,
        gating,
        stage,
        tone: statusTone(stage),
        status: stageLabel(stage),
        nextStep,
        nextAction: describeNextAction({ onboardingComplete, blocked, waiting, gating, nextStep, blockingReasons, attentionReasons }),
        mainRisk: describeRisk({ blocked, waiting, blockingReasons, attentionReasons, onboardingComplete }),
        blockingReasonsCount,
      };
    })
  );

  const blockedCount = projectCards.filter((p) => p.stage === "bloqueado").length;
  const warningCount = projectCards.filter((p) => p.stage === "atencao").length;
  const onboardingCount = projectCards.filter((p) => p.stage === "implantacao").length;
  const healthyCount = projectCards.filter((p) => p.stage === "ok").length;

  return (
    <AppShell user={user} title="Projetos" subtitle="Carteira viva do Ironcore: onde cada projeto está, o que trava e qual é o próximo passo sem obrigar você a abrir módulo por módulo.">
      <ProductHero
        eyebrow="carteira do produto"
        title="A carteira precisa mostrar prioridade, risco e próxima jogada em uma leitura só."
        description="Agora a página de projetos se comporta mais como mesa de comando: estado operacional claro, gargalo principal, próxima ação e sinais de execução para decidir sem abrir cinco telas."
      >
        <div className="grid min-w-[320px] grid-cols-2 gap-3 text-sm lg:grid-cols-4">
          <MetricCard label="Projetos" value={projectCards.length} />
          <MetricCard label="Operação estável" value={healthyCount} tone="good" />
          <MetricCard label="Em atenção" value={warningCount} tone="warn" />
          <MetricCard label="Bloqueados / implantação" value={`${blockedCount} / ${onboardingCount}`} tone="bad" />
        </div>
      </ProductHero>

      {(user.role === "admin_master" || user.role === "head") ? (
        <section className="card mb-4">
          <div className="section-head"><h2 className="title">Novo projeto</h2><span className="kpi-chip">entrada de carteira</span></div>
          <form action="/api/projects/create" method="post" className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
            <input name="code" required placeholder="codigo (ex: elicon)" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="name" required placeholder="nome" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="cnpj" required placeholder="cnpj" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="legal_name" required placeholder="razão social" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="segment" required placeholder="segmento" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="timezone" defaultValue="America/Sao_Paulo" placeholder="timezone" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="partners" placeholder="sócios (separar por vírgula)" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <textarea name="account_plan" required placeholder="plano de contas (obrigatório, 1 conta por linha)" className="md:col-span-3 min-h-28 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button className="badge py-2 cursor-pointer" type="submit">Criar projeto</button>
          </form>
          {params.error ? <div className="alert bad-bg mt-3">Erro ao criar projeto ({params.error}). Verifique DB e campos obrigatórios.</div> : null}
        </section>
      ) : null}

      <section className="card mb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="title">Leitura da carteira</h2>
            <div className="text-sm text-slate-400 mt-1">Use o filtro para organizar a análise por segmento sem perder visibilidade de prioridade, risco e próxima ação.</div>
          </div>
          <form method="get" className="flex gap-2">
            <select name="segment" defaultValue={segmentFilter} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="all">Todos os segmentos</option>
              {segments.map((segment) => (
                <option key={segment} value={segment}>{segment}</option>
              ))}
            </select>
            <button className="badge py-2 cursor-pointer" type="submit">Filtrar</button>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Projetos em foco</h2><span className="kpi-chip">carteira ativa</span></div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {projectCards.length === 0 ? <div className="alert muted-bg">Sem projetos neste filtro.</div> : null}
          {projectCards.map(({ project: p, onboardingComplete, blocked, waiting, inFlight, doneSteps, latest, gating, tone, status, nextStep, nextAction, mainRisk, blockingReasonsCount }) => {
            const finance = p.financial_profile || {};
            return (
              <Link key={p.id} href={`/projetos/${p.code}/`} className="block rounded-[24px] border border-slate-800 bg-slate-950/20 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-slate-950/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                      <span className="badge">{p.code}</span>
                      {p.segment ? <StatusPill label={p.segment} tone="info" /> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{p.legal_name}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses(tone)}`}>{status}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1.3fr_1fr]">
                  <div className="rounded-[22px] border border-slate-800 bg-slate-950/40 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
                    <div className="mt-2 text-sm font-medium text-white">{nextAction}</div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
                    <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
                  </div>
                  <div className="rounded-[22px] border border-slate-800 bg-slate-950/40 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Checkpoint operacional</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusPill label={`Gating: ${gating}`} tone={gating === "bloqueado" ? "bad" : gating === "atencao" ? "warn" : gating === "liberado" ? "good" : "neutral"} />
                      <StatusPill label={`Rotina: ${latest?.status || "sem leitura"}`} tone={latest?.status === "blocked" ? "bad" : latest?.status === "warning" ? "warn" : latest?.status === "success" ? "good" : "neutral"} />
                    </div>
                    <div className="mt-3 text-xs text-slate-400">Última rotina: {formatWhen(latest?.created_at)}</div>
                    <div className="mt-1 text-xs text-slate-500">Próximo ponto sensível: {nextStep ? nextStep.title : "operação diária"}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4 xl:grid-cols-6">
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Estado</div><div className="mt-1 font-medium text-white">{status}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Onboarding</div><div className={`mt-1 font-medium ${onboardingComplete ? "text-emerald-200" : "text-cyan-200"}`}>{onboardingComplete ? "concluído" : "pendente"}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Bloqueios</div><div className="mt-1 font-medium text-rose-200">{Math.max(blocked, blockingReasonsCount)}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Validações</div><div className="mt-1 font-medium text-amber-200">{waiting}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Em execução</div><div className="mt-1 font-medium text-cyan-100">{inFlight}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Etapas concluídas</div><div className="mt-1 font-medium text-emerald-200">{doneSteps}</div></div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                  <div className="row"><span>Plano de contas</span><b>{(p.account_plan || []).length}</b></div>
                  <div className="row"><span>Fornec. classif.</span><b>{(p.supplier_classes || []).length}</b></div>
                  <div className="row"><span>TX</span><b>{Number(finance.tx_percent || 0).toFixed(2)}%</b></div>
                  <div className="row"><span>Float</span><b>{Number(finance.float_days || 0)}d</b></div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

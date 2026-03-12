import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { isProjectOnboardingComplete, listProjectsForUser } from "@/lib/projects";
import { listSopSteps } from "@/lib/sop";
import { listRoutineRuns } from "@/lib/routine";

function toneClasses(tone: "good" | "warn" | "bad") {
  if (tone === "bad") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (tone === "warn") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "sem rotina";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
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
      const op = ((latest?.summary || {}) as Record<string, any>).operationalDecision || {};
      const gating = String(op.gatingStatus || "sem leitura");
      const blockingReasons = Array.isArray(op.blockingReasons) ? op.blockingReasons.length : 0;

      let tone: "good" | "warn" | "bad" = "good";
      let status = "Operação estável";
      if (!onboardingComplete || blocked > 0 || latest?.status === "blocked" || blockingReasons > 0) {
        tone = "bad";
        status = !onboardingComplete ? "Implantação pendente" : "Bloqueado";
      } else if (waiting > 0 || latest?.status === "warning") {
        tone = "warn";
        status = "Atenção";
      }

      return {
        project: p,
        onboardingComplete,
        blocked,
        waiting,
        latest,
        gating,
        tone,
        status,
      };
    })
  );

  const blockedCount = projectCards.filter((p) => p.tone === "bad").length;
  const warningCount = projectCards.filter((p) => p.tone === "warn").length;

  return (
    <AppShell user={user} title="Projetos" subtitle="Carteira viva do Ironcore: onde cada projeto está, o que trava e qual é o próximo passo sem obrigar você a abrir módulo por módulo.">
      <ProductHero
        eyebrow="carteira do produto"
        title="Cada projeto precisa se comportar como uma sala de guerra com contexto, status e próxima ação."
        description="Esta página deixa de ser listagem bruta e vira carteira ativa do Ironcore: segmentação, prioridade, gating e entrada clara para execução."
      >
        <div className="grid min-w-[280px] grid-cols-2 gap-3 text-sm">
          <MetricCard label="Projetos" value={projectCards.length} />
          <MetricCard label="Bloqueados" value={blockedCount} tone="bad" />
          <MetricCard label="Em atenção" value={warningCount} tone="warn" />
          <MetricCard label="Segmentos" value={segments.length} tone="info" />
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
            <h2 className="title">Carteira por segmento</h2>
            <div className="text-sm text-slate-400 mt-1">Use o filtro para organizar a leitura da carteira sem perder a visão de prioridade.</div>
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
          {projectCards.map(({ project: p, onboardingComplete, blocked, waiting, latest, gating, tone, status }) => {
            const finance = p.financial_profile || {};
            return (
              <Link key={p.id} href={`/projetos/${p.code}/`} className="block rounded-[24px] border border-slate-800 bg-slate-950/20 p-4 hover:border-cyan-400">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                      <span className="badge">{p.code}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{p.segment} · {p.legal_name}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClasses(tone)}`}>{status}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Onboarding</div><div className={`mt-1 font-medium ${onboardingComplete ? "text-emerald-200" : "text-amber-200"}`}>{onboardingComplete ? "concluído" : "pendente"}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Gating</div><div className="mt-1 font-medium">{gating}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Bloqueios</div><div className="mt-1 font-medium text-rose-200">{blocked}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Validações</div><div className="mt-1 font-medium text-amber-200">{waiting}</div></div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                  <div className="row"><span>Plano de contas</span><b>{(p.account_plan || []).length}</b></div>
                  <div className="row"><span>Fornec. classif.</span><b>{(p.supplier_classes || []).length}</b></div>
                  <div className="row"><span>TX</span><b>{Number(finance.tx_percent || 0).toFixed(2)}%</b></div>
                  <div className="row"><span>Float</span><b>{Number(finance.float_days || 0)}d</b></div>
                </div>

                <div className="mt-3 text-xs text-slate-500">Última rotina: {formatWhen(latest?.created_at)}</div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

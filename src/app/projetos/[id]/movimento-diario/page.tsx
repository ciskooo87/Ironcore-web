import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listRoutineRuns } from "@/lib/routine";

function br(v: unknown) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function MovimentoDiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Movimento Diário"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Movimento Diário"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  if (!isProjectOnboardingComplete(project)) return <AppShell user={user} title="Projeto · Movimento Diário"><div className="alert bad-bg">Onboarding incompleto.</div></AppShell>;

  const runs = await listRoutineRuns(project.id, 20);
  const latest = runs[0];
  const s = (latest?.summary || {}) as Record<string, any>;
  const op = (s.operationalDecision || {}) as Record<string, any>;
  const fidc = (op.fidc || {}) as Record<string, any>;
  const actions: string[] = Array.isArray(op.suggestedActions) ? op.suggestedActions : [];

  return (
    <AppShell user={user} title="Projeto · Movimento Diário" subtitle="Leitura executiva da decisão operacional do dia">
      <section className="flex gap-2 flex-wrap mb-4">
        <Link href={`/projetos/${id}/rotina-diaria`} className="pill">Rotina Diária</Link>
        <Link href={`/projetos/${id}/operacoes`} className="pill">Operações</Link>
        <Link href={`/projetos/${id}/riscos-alertas`} className="pill">Painel de Risco</Link>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Status decisório</div><div className="text-lg font-semibold mt-1">{String(op.gatingStatus || '-')}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Pend. aprovação</div><div className="text-lg font-semibold mt-1">{String(op.opPendingApproval ?? '-')}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(op.carteiraVencida)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Recompra</div><div className="text-lg font-semibold mt-1 text-amber-300">{br(op.carteiraRecompra)}</div></div>
      </section>

      <section className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">FIDC carteira</div><div className="text-lg font-semibold mt-1">{br(fidc.carteira)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">FIDC vencido</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(fidc.vencido)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">FIDC recompra</div><div className="text-lg font-semibold mt-1 text-amber-300">{br(fidc.recompra)}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Recomendação executiva</h2><span className="kpi-chip">Hoje</span></div>
        <div className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">{String((s.aiAnalysis as any)?.recommendation || '-')}</div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Gatilhos de bloqueio</h2><span className="kpi-chip">Risco</span></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {Array.isArray(op.blockingReasons) && op.blockingReasons.length ? op.blockingReasons.map((x: string, i: number) => <li key={i}>• {x}</li>) : <li>• sem bloqueios ativos</li>}
          </ul>
        </section>
        <section className="card">
          <div className="section-head"><h2 className="title">Sinais de liberação</h2><span className="kpi-chip">Follow-up</span></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {Array.isArray(op.releaseSignals) && op.releaseSignals.length ? op.releaseSignals.map((x: string, i: number) => <li key={i}>• {x}</li>) : <li>• nenhum sinal forte de liberação</li>}
          </ul>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Ações automáticas sugeridas</h2><span className="kpi-chip">Execução</span></div>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {actions.length ? actions.map((x, i) => <li key={i}>• {x}</li>) : <li>• nenhuma ação sugerida ainda</li>}
        </ul>
      </section>
    </AppShell>
  );
}

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listRoutineRuns } from "@/lib/routine";
import { ensureCsrfCookie } from "@/lib/csrf";
import { dbQuery } from "@/lib/db";

function br(v: unknown) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function MovimentoDiarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Movimento Diário"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Movimento Diário"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  if (!isProjectOnboardingComplete(project)) return <AppShell user={user} title="Projeto · Movimento Diário"><div className="alert bad-bg">Onboarding incompleto.</div></AppShell>;

  const runs = await listRoutineRuns(project.id, 20);
  const latest = runs[0];
  const movementActions = (await dbQuery<{ id: string; action_label: string; status: string; linked_entity: string | null; linked_entity_id: string | null; assignee_name: string | null; closed_note: string | null; created_at: string }>(
    "select id, action_label, status, linked_entity, linked_entity_id, assignee_name, closed_note, created_at::text from movement_actions where project_id=$1 order by created_at desc limit 20",
    [project.id]
  ).catch(() => ({ rows: [] as any[] }))).rows;
  const s = (latest?.summary || {}) as Record<string, any>;
  const op = (s.operationalDecision || {}) as Record<string, any>;
  const fidc = (op.fidc || {}) as Record<string, any>;
  const actions: string[] = Array.isArray(op.suggestedActions) ? op.suggestedActions : [];
  const csrf = await ensureCsrfCookie();

  return (
    <AppShell user={user} title="Projeto · Movimento Diário" subtitle="Leitura executiva da decisão operacional do dia">
      {query.saved ? <div className="alert ok-bg mb-4">{query.saved === "validation" ? "Validação registrada." : query.saved === "action" ? "Ação registrada." : query.saved === "action_update" ? "Ação atualizada." : "Atualizado."}</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Erro: {query.error}</div> : null}

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

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Validação humana</h2><span className="kpi-chip">Workflow</span></div>
          <form action={`/api/projects/${id}/movement/validate`} method="post" className="space-y-2 mt-3 text-sm">
            <input type="hidden" name="csrf_token" value={csrf} />
            <input type="hidden" name="routine_run_id" value={latest?.id || ''} />
            <select name="decision" className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              <option value="aprovado">Aprovar movimento</option>
              <option value="ajustar">Enviar para ajuste</option>
              <option value="bloquear">Bloquear movimento</option>
            </select>
            <textarea name="note" placeholder="nota da validação" className="w-full min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Registrar validação</button>
          </form>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Ações automáticas sugeridas</h2><span className="kpi-chip">Execução</span></div>
          <div className="space-y-3 mt-3">
            {actions.length ? actions.map((x, i) => (
              <form key={i} action={`/api/projects/${id}/movement/action`} method="post" className="rounded-lg border border-slate-800 p-3">
                <input type="hidden" name="csrf_token" value={csrf} />
                <input type="hidden" name="routine_run_id" value={latest?.id || ''} />
                <input type="hidden" name="action_key" value={x} />
                <div className="text-sm text-slate-300">{x}</div>
                <button type="submit" className="pill mt-2">Marcar ação</button>
              </form>
            )) : <div className="text-sm text-slate-300">• nenhuma ação sugerida ainda</div>}
          </div>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Histórico de ações executadas</h2><span className="kpi-chip">Automação</span></div>
        <div className="mt-3 space-y-3 text-sm">
          {movementActions.length ? movementActions.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-800 p-3">
              <div className="font-medium">{item.action_label}</div>
              <div className="text-xs text-slate-500 mt-1">status: {item.status} · vínculo: {item.linked_entity || '-'} {item.linked_entity_id ? `(${item.linked_entity_id.slice(0,8)})` : ''} · {item.created_at}</div>
              <div className="text-xs text-slate-400 mt-1">responsável: {item.assignee_name || '-'} · nota: {item.closed_note || '-'}</div>
              <form action={`/api/projects/${id}/movement/action/update`} method="post" className="grid md:grid-cols-4 gap-2 mt-3">
                <input type="hidden" name="csrf_token" value={csrf} />
                <input type="hidden" name="action_id" value={item.id} />
                <input name="assignee_name" defaultValue={item.assignee_name || ''} placeholder="responsável" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
                <input name="note" placeholder="nota de fechamento/reabertura" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 md:col-span-2" />
                <div className="flex gap-2">
                  <button type="submit" name="mode" value="done" className="pill">Concluir</button>
                  <button type="submit" name="mode" value="reopen" className="pill">Reabrir</button>
                </div>
              </form>
            </div>
          )) : <div className="alert muted-bg">Sem ações executadas ainda.</div>}
        </div>
      </section>
    </AppShell>
  );
}

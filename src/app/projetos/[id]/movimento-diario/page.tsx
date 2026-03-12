import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ActionLink, EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listRoutineRuns } from "@/lib/routine";
import { ensureCsrfCookie } from "@/lib/csrf";
import { dbQuery } from "@/lib/db";
import { listMovementValidations } from "@/lib/movement";

function br(v: unknown) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toneClasses(status: string) {
  if (status === "bloqueado") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (status === "atencao") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
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
  const validations = await listMovementValidations(project.id, 20);
  const s = (latest?.summary || {}) as Record<string, any>;
  const op = (s.operationalDecision || {}) as Record<string, any>;
  const fidc = (op.fidc || {}) as Record<string, any>;
  const actions: string[] = Array.isArray(op.suggestedActions) ? op.suggestedActions : [];
  const blockingReasons: string[] = Array.isArray(op.blockingReasons) ? op.blockingReasons : [];
  const releaseSignals: string[] = Array.isArray(op.releaseSignals) ? op.releaseSignals : [];
  const recommendation = String((s.aiAnalysis as any)?.recommendation || op.recommendation || "Sem recomendação executiva ainda.");
  const csrf = await ensureCsrfCookie();

  return (
    <AppShell user={user} title="Projeto · Movimento Diário" subtitle="Cockpit de decisão do dia: aprovar, ajustar ou bloquear com contexto operacional claro, não só com números jogados na tela.">
      {query.saved ? <div className="alert ok-bg mb-4">{query.saved === "validation" ? "Validação registrada." : query.saved === "action" ? "Ação registrada." : query.saved === "action_update" ? "Ação atualizada." : "Atualizado."}</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Erro: {query.error === "blocked_state_requires_action" ? "A rotina está bloqueada. Não dá para aprovar o movimento sem tratar o bloqueio ou enviar para ajuste." : query.error}</div> : null}

      <ProductHero
        eyebrow="decisão do dia"
        title="O movimento diário precisa deixar evidente se a operação pode seguir ou se deve parar."
        description="Esta tela é o coração operacional do produto: recomendação do motor, motivos do bloqueio, sinais de liberação, validação humana e ações executadas."
      >
        <StatusPill label={`gating: ${String(op.gatingStatus || "sem leitura")}`} tone={String(op.gatingStatus || "") === "bloqueado" ? "bad" : String(op.gatingStatus || "") === "atencao" ? "warn" : "good"} />
      </ProductHero>

      <section className="flex gap-2 flex-wrap mb-4">
        <Link href={`/projetos/${id}/rotina-diaria`} className="pill">Rotina Diária</Link>
        <Link href={`/projetos/${id}/operacoes`} className="pill">Operações</Link>
        <Link href={`/projetos/${id}/riscos-alertas`} className="pill">Painel de Risco</Link>
        <Link href={`/projetos/${id}/fluxo-trabalho`} className="pill">Fluxo</Link>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Status decisório</div><div className="text-lg font-semibold mt-1">{String(op.gatingStatus || "-")}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Pend. aprovação</div><div className="text-lg font-semibold mt-1">{String(op.opPendingApproval ?? "-")}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(op.carteiraVencida)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Recompra</div><div className="text-lg font-semibold mt-1 text-amber-300">{br(op.carteiraRecompra)}</div></div>
      </section>

      <section className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">FIDC carteira</div><div className="text-lg font-semibold mt-1">{br(fidc.carteira)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">FIDC vencido</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(fidc.vencido)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">FIDC recompra</div><div className="text-lg font-semibold mt-1 text-amber-300">{br(fidc.recompra)}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Recomendação executiva</h2><span className="kpi-chip">decisão guiada</span></div>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
          <div className="text-sm text-slate-300">{recommendation}</div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Motivos de bloqueio</h2><span className="kpi-chip">risco</span></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {blockingReasons.length ? blockingReasons.map((x: string, i: number) => <li key={i}>• {x}</li>) : <li>• sem bloqueios ativos</li>}
          </ul>
        </section>
        <section className="card">
          <div className="section-head"><h2 className="title">Sinais de liberação</h2><span className="kpi-chip">follow-up</span></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {releaseSignals.length ? releaseSignals.map((x: string, i: number) => <li key={i}>• {x}</li>) : <li>• nenhum sinal forte de liberação</li>}
          </ul>
        </section>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Validação humana</h2><span className="kpi-chip">workflow</span></div>
          <form action={`/api/projects/${id}/movement/validate`} method="post" className="space-y-3 mt-3 text-sm">
            <input type="hidden" name="csrf_token" value={csrf} />
            <input type="hidden" name="routine_run_id" value={latest?.id || ""} />
            <select name="decision" className="w-full bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              <option value="aprovado">Aprovar movimento</option>
              <option value="ajustar">Enviar para ajuste</option>
              <option value="bloquear">Bloquear movimento</option>
            </select>
            <textarea name="note" placeholder="nota da validação" className="w-full min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" name="send_summary" value="1" /> enviar resumo validado</label>
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Registrar validação</button>
          </form>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Ações sugeridas</h2><span className="kpi-chip">execução</span></div>
          <div className="space-y-3 mt-3">
            {actions.length ? actions.map((x, i) => (
              <form key={i} action={`/api/projects/${id}/movement/action`} method="post" className="rounded-2xl border border-slate-800 p-4">
                <input type="hidden" name="csrf_token" value={csrf} />
                <input type="hidden" name="routine_run_id" value={latest?.id || ""} />
                <input type="hidden" name="action_key" value={x} />
                <div className="text-sm text-slate-300">{x}</div>
                <button type="submit" className="pill mt-3">Marcar ação</button>
              </form>
            )) : <div className="alert muted-bg">Nenhuma ação sugerida ainda.</div>}
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Validações registradas</h2><span className="kpi-chip">trilha decisória</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {validations.length ? validations.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-800 p-4">
              <div className="font-medium text-white">{item.decision}</div>
              <div className="text-xs text-slate-500 mt-1">{item.validated_at}</div>
              <div className="text-slate-300 mt-2 whitespace-pre-wrap">{item.summary_text || item.note || "-"}</div>
            </div>
          )) : <div className="alert muted-bg">Sem validações registradas ainda.</div>}
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Ações executadas</h2><span className="kpi-chip">automação + humano</span></div>
        <div className="mt-3 space-y-3 text-sm">
          {movementActions.length ? movementActions.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-800 p-4">
              <div className="font-medium text-white">{item.action_label}</div>
              <div className="text-xs text-slate-500 mt-1">status: {item.status} · vínculo: {item.linked_entity || "-"} {item.linked_entity_id ? `(${item.linked_entity_id.slice(0,8)})` : ""} · {item.created_at}</div>
              <div className="text-xs text-slate-400 mt-1">responsável: {item.assignee_name || "-"} · nota: {item.closed_note || "-"}</div>
              <form action={`/api/projects/${id}/movement/action/update`} method="post" className="grid md:grid-cols-4 gap-2 mt-3">
                <input type="hidden" name="csrf_token" value={csrf} />
                <input type="hidden" name="action_id" value={item.id} />
                <input name="assignee_name" defaultValue={item.assignee_name || ""} placeholder="responsável" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
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

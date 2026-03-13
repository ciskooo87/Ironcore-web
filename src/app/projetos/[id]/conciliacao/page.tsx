import { AppShell } from "@/components/AppShell";
import { EmptyState, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listPendingReconItems, listReconRuns } from "@/lib/conciliacao";
import { todayInSaoPauloISO } from "@/lib/time";
import { ensureCsrfCookie } from "@/lib/csrf";

function br(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; business_date?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);
  const query = await searchParams;

  if (!project) return <AppShell user={user} title="Projeto · Conciliação"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Conciliação"><div className="alert bad-bg">Sem permissão.</div></AppShell>;

  const selectedDate = query.business_date || todayInSaoPauloISO();
  const runs = await listReconRuns(project.id, 25);
  const pendingItems = await listPendingReconItems(project.id, selectedDate);
  const csrf = await ensureCsrfCookie();
  const latest = runs[0];
  const pendingCount = pendingItems.filter((i) => i.status === "pending").length;
  const resolvedCount = pendingItems.filter((i) => i.status !== "pending").length;
  const pendingAmount = pendingItems.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const mainAction = pendingCount > 0 ? `Conciliar ${pendingCount} pendência(s) da data ${selectedDate}.` : 'Rodar a conciliação para confirmar que o dia está limpo.';
  const mainRisk = pendingAmount > 0 ? `Valor pendente em aberto: ${br(pendingAmount)}.` : 'Sem valor pendente relevante na data selecionada.';

  return (
    <AppShell user={user} title="Projeto · Conciliação" subtitle="Consistência operacional com leitura rápida do que ainda impede o dia de fechar limpo">
      <ProductHero
        eyebrow="consistência operacional"
        title="Conciliação precisa mostrar se o dia está limpo ou se ainda existe risco escondido na base."
        description="A tela agora combina execução automática, tratamento manual e leitura rápida de pendências em um fluxo mais executivo."
      >
        <StatusPill label={`Pendentes: ${pendingCount}`} tone={pendingCount > 0 ? 'bad' : 'good'} />
        <StatusPill label={`Resolvidos: ${resolvedCount}`} tone="info" />
      </ProductHero>
      {query.saved ? <div className="alert ok-bg mb-4">Conciliação executada.</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Não foi possível concluir a conciliação agora. Revise a data, os itens pendentes e tente novamente.</div> : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando da conciliação</h2><span className="kpi-chip">prioridade do dia</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
              <div className="mt-2 text-lg font-semibold text-white">{mainAction}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
              <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Rodar conciliação</div>
              <form action={`/api/projects/${id}/conciliacao/run`} method="post" className="mt-3 flex gap-2 items-center flex-wrap">
                <input name="business_date" type="date" defaultValue={selectedDate} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm" />
                <button className="badge py-2 px-4 cursor-pointer" type="submit">Rodar conciliação</button>
              </form>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Checkpoint</h2><span className="kpi-chip">leitura rápida</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Última execução</div><div className="mt-1 font-medium text-white">{latest?.business_date || 'sem execução'}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Status</div><div className="mt-1 font-medium text-white">{latest?.status || '-'}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Pendentes</div><div className="mt-1 font-medium text-rose-200">{pendingCount}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Valor pendente</div><div className="mt-1 font-medium text-amber-200">{br(pendingAmount)}</div></div>
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Pendências da data</h2><span className="kpi-chip">{selectedDate}</span></div>
          <div className="mt-3 space-y-3 text-sm">
            {pendingItems.length === 0 ? <div className="alert ok-bg">Sem itens para esta data.</div> : null}
            {pendingItems.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-1">status: {item.status}</div>
                  </div>
                  <div className="text-sm font-semibold text-white">{br(item.amount)}</div>
                </div>

                <div className="mt-3">
                  {item.status === "pending" ? (
                    <form action={`/api/projects/${id}/conciliacao/item/${item.id}/resolve`} method="post" className="flex gap-2 flex-wrap">
                      <input type="hidden" name="csrf_token" value={csrf} />
                      <input type="hidden" name="business_date" value={selectedDate} />
                      <input name="note" required placeholder="motivo da conciliação manual" className="flex-1 min-w-[240px] bg-slate-950/40 border border-slate-700 rounded px-3 py-2" />
                      <button type="submit" className="pill">Conciliar manualmente</button>
                    </form>
                  ) : (
                    <div className="text-slate-300">{item.resolution_note || "Resolvido."}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Histórico de execuções</h2><span className="kpi-chip">trilha do motor</span></div>
          <div className="mt-3 space-y-3 text-sm">
            {runs.length === 0 ? <div className="alert muted-bg">Sem execuções ainda. Rode a primeira conciliação para abrir a leitura de consistência do dia.</div> : null}
            {runs.map((r) => {
              const d = r.details as Record<string, unknown>;
              return (
                <div key={r.id} className="rounded-[22px] border border-slate-800 bg-slate-950/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium text-white">{r.business_date}</div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-medium ${r.status === "blocked" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : r.status === "warning" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"}`}>{r.status.toUpperCase()}</div>
                  </div>
                  <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="row"><span>Match</span><b>{r.matched_items}</b></div>
                    <div className="row"><span>Pendências</span><b>{r.pending_items}</b></div>
                    <div className="row"><span>Extrato</span><b>{Number(d.extrato || 0).toFixed(2)}</b></div>
                    <div className="row"><span>Receber + Duplicatas</span><b>{(Number(d.receber || 0) + Number(d.duplicatas || 0)).toFixed(2)}</b></div>
                    <div className="row md:col-span-2"><span>Diferença</span><b>{Number(d.diff || 0).toFixed(2)}</b></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </AppShell>
  );
}

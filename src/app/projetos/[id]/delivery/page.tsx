import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listDeliveryRuns } from "@/lib/delivery-runs";
import { ensureCsrfCookie } from "@/lib/csrf";

export default async function DeliveryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; channel?: string; status?: string; from?: string; to?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Delivery"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Delivery"><div className="alert bad-bg">Sem permissão.</div></AppShell>;

  const runs = await listDeliveryRuns(project.id, 100, {
    channel: query.channel || undefined,
    status: query.status || undefined,
    from: query.from || undefined,
    to: query.to || undefined,
  });
  const csrf = await ensureCsrfCookie();

  const exportQs = new URLSearchParams();
  if (query.channel) exportQs.set("channel", query.channel);
  if (query.status) exportQs.set("status", query.status);
  if (query.from) exportQs.set("from", query.from);
  if (query.to) exportQs.set("to", query.to);

  const sent = runs.filter((r) => r.status === "sent").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const skipped = runs.filter((r) => r.status === "skipped").length;

  return (
    <AppShell user={user} title="Projeto · Delivery" subtitle="Cockpit de entrega: acompanhar o que saiu, o que falhou e onde agir rápido para garantir comunicação com o cliente.">
      {query.saved ? <div className="alert ok-bg mb-3">Retry executado.</div> : null}
      {query.error ? <div className="alert bad-bg mb-3">Erro: {query.error}</div> : null}

      <ProductHero
        eyebrow="monitor de entrega"
        title="Delivery precisa mostrar se a comunicação saiu, falhou ou foi descartada — e deixar o retry óbvio."
        description="Esta tela vira centro de controle de envio por canal, com histórico, filtros e retomada rápida das falhas."
      >
        <a className="badge px-4 py-2" href={`/api/projects/${id}/delivery/export?${exportQs.toString()}`}>Exportar CSV</a>
      </ProductHero>

      <section className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Sent</div><div className="text-xl font-semibold mt-1 text-emerald-200">{sent}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Failed</div><div className="text-xl font-semibold mt-1 text-rose-200">{failed}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Skipped</div><div className="text-xl font-semibold mt-1 text-amber-200">{skipped}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Filtro de entregas</h2><span className="kpi-chip">canais</span></div>
        <form className="grid md:grid-cols-5 gap-2 text-sm mt-3" method="get">
          <select name="channel" defaultValue={query.channel || ""} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="">canal: todos</option>
            <option value="telegram">telegram</option>
            <option value="whatsapp">whatsapp</option>
            <option value="email">email</option>
          </select>
          <select name="status" defaultValue={query.status || ""} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="">status: todos</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="skipped">skipped</option>
          </select>
          <input name="from" type="date" defaultValue={query.from || ""} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="to" type="date" defaultValue={query.to || ""} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <button className="badge py-2 cursor-pointer" type="submit">Filtrar</button>
        </form>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Histórico de entregas</h2><span className="kpi-chip">{runs.length} registros</span></div>
        <div className="mt-3 space-y-3 text-sm">
          {runs.length === 0 ? <EmptyState title="Nenhuma entrega registrada ainda" description="Assim que o projeto começar a enviar atualizações, a trilha de delivery vai aparecer aqui com status, canal e retry." /> : null}
          {runs.map((r) => (
            <div key={r.id} className="rounded-[22px] border border-slate-800 bg-slate-950/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{r.channel.toUpperCase()} · {r.status.toUpperCase()}</div>
                  <div className="text-xs text-slate-500 mt-1">{r.provider_message || "-"}</div>
                </div>
                <form action={`/api/projects/${id}/delivery/${r.id}/retry`} method="post">
                  <input type="hidden" name="csrf_token" value={csrf} />
                  <button className="pill" type="submit">Retry</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

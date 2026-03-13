import { AppShell } from "@/components/AppShell";
import { EmptyState, ProductHero, StatusPill } from "@/components/product-ui";
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
  const mainAction = failed > 0 ? `Tratar ${failed} entrega(s) com falha e rodar retry onde fizer sentido.` : skipped > 0 ? `Revisar ${skipped} entrega(s) descartada(s) para confirmar se o skip estava correto.` : 'Manter a trilha de entrega limpa e monitorar os próximos envios.';
  const mainRisk = failed > 0 ? 'Falhas de delivery quebram confiança operacional e comunicação com o cliente.' : 'Sem risco dominante explícito na fila de entrega atual.';

  return (
    <AppShell user={user} title="Projeto · Delivery" subtitle="Centro de controle de envio para saber o que saiu, o que falhou e onde agir rápido">
      {query.saved ? <div className="alert ok-bg mb-3">Retry executado.</div> : null}
      {query.error ? <div className="alert bad-bg mb-3">Não foi possível processar a entrega agora. Tente novamente em instantes ou revise o canal/filtro usado.</div> : null}

      <ProductHero
        eyebrow="monitor de entrega"
        title="Delivery precisa mostrar se a comunicação saiu, falhou ou foi descartada — e deixar o retry óbvio."
        description="A tela agora se comporta mais como cockpit de entrega: prioridade, risco, filtro por canal e retomada rápida das falhas."
      >
        <StatusPill label={`Sent: ${sent}`} tone="good" />
        <StatusPill label={`Failed: ${failed}`} tone={failed > 0 ? "bad" : "neutral"} />
        <StatusPill label={`Skipped: ${skipped}`} tone={skipped > 0 ? "warn" : "neutral"} />
        <a className="badge px-4 py-2" href={`/api/projects/${id}/delivery/export?${exportQs.toString()}`}>Exportar CSV</a>
      </ProductHero>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando de delivery</h2><span className="kpi-chip">prioridade de comunicação</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
              <div className="mt-2 text-lg font-semibold text-white">{mainAction}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
              <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Checkpoint</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Entregas</div><div className="mt-1 font-medium text-white">{runs.length}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Falhas</div><div className="mt-1 font-medium text-rose-200">{failed}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Canais</div><div className="mt-1 font-medium text-white">{Array.from(new Set(runs.map((r) => r.channel))).length}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Skips</div><div className="mt-1 font-medium text-amber-200">{skipped}</div></div>
              </div>
            </div>
          </div>
        </section>
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
        <div className="text-sm text-slate-400 mt-2">Use retry apenas quando fizer sentido operacionalmente; esta trilha serve para confirmar entrega real, falha ou descarte por regra.</div>
        <div className="mt-3 space-y-3 text-sm">
          {runs.length === 0 ? <EmptyState title="Nenhuma entrega registrada ainda" description="Quando o projeto começar a enviar atualizações, esta tela vira a trilha de comunicação com status, canal e retry. Por enquanto, vale revisar se a rotina e os envios automáticos já estão ativos." /> : null}
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

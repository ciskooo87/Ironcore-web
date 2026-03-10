import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listAccountingFeeds } from "@/lib/accounting";

function br(v: unknown) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · DRE / DFC"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · DRE / DFC"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  if (!isProjectOnboardingComplete(project)) return <AppShell user={user} title="Projeto · DRE / DFC"><div className="alert bad-bg">Onboarding incompleto.</div></AppShell>;

  const feeds = await listAccountingFeeds(project.id, 12);
  const latest = feeds[0]?.payload as Record<string, any> | undefined;
  const dre = (latest?.dre || {}) as Record<string, any>;
  const dfc = (latest?.dfc || {}) as Record<string, any>;
  const ops = (latest?.operacoes || {}) as Record<string, any>;
  const carteira = (latest?.carteira || {}) as Record<string, any>;

  return (
    <AppShell user={user} title="Projeto · DRE / DFC" subtitle="Alimentação contábil consolidada para fechamento e diretoria">
      {query.saved ? <div className="alert ok-bg mb-4">Alimentação contábil gerada.</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Erro: {query.error}</div> : null}

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Gerar alimentação contábil</h2><span className="kpi-chip">Etapa 5</span></div>
        <form action={`/api/projects/${id}/accounting/generate`} method="post" className="flex gap-2 items-center flex-wrap mt-3 text-sm">
          <input name="period_ym" type="month" defaultValue={currentYm()} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <button type="submit" className="badge py-2 px-3 cursor-pointer">Gerar DRE / DFC</button>
        </form>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Receita bruta</div><div className="text-lg font-semibold mt-1">{br(dre.receitaBruta)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Custos operacionais</div><div className="text-lg font-semibold mt-1">{br(dre.custosOperacionais)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Resultado operacional</div><div className="text-lg font-semibold mt-1">{br(dre.resultadoOperacional)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Resultado líquido proxy</div><div className="text-lg font-semibold mt-1">{br(dre.resultadoLiquidoProxy)}</div></div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Entradas operacionais</div><div className="text-lg font-semibold mt-1">{br(dfc.entradasOperacionais)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Saídas operacionais</div><div className="text-lg font-semibold mt-1">{br(dfc.saidasOperacionais)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Saldo caixa proxy</div><div className="text-lg font-semibold mt-1">{br(dfc.saldoCaixaProxy)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Duplicatas</div><div className="text-lg font-semibold mt-1">{br(dfc.duplicatas)}</div></div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Operações bruto</div><div className="text-lg font-semibold mt-1">{br(ops.bruto)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Operações líquido</div><div className="text-lg font-semibold mt-1">{br(ops.liquido)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira total</div><div className="text-lg font-semibold mt-1">{br(carteira.total)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(carteira.vencido)}</div></div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Histórico de alimentações</h2><span className="kpi-chip">DRE / DFC</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {feeds.length ? feeds.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-800 p-3">
              <div className="font-medium">{item.period_ym}</div>
              <div className="text-xs text-slate-500 mt-1">{item.created_at}</div>
              <div className="text-slate-300 mt-2">Receita: {br((item.payload as any)?.dre?.receitaBruta)} · Resultado operacional: {br((item.payload as any)?.dre?.resultadoOperacional)} · Caixa proxy: {br((item.payload as any)?.dfc?.saldoCaixaProxy)}</div>
            </div>
          )) : <div className="alert muted-bg">Sem alimentação contábil gerada ainda.</div>}
        </div>
      </section>
    </AppShell>
  );
}

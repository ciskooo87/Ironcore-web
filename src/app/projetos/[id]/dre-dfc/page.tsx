import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero } from "@/components/product-ui";
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

function toneClasses(value: number) {
  if (value < 0) return "text-rose-300";
  if (value === 0) return "text-slate-200";
  return "text-emerald-300";
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
    <AppShell user={user} title="Projeto · DRE / DFC" subtitle="Painel executivo da alimentação contábil: gerar, ler e usar a camada financeira para fechamento e diretoria.">
      {query.saved ? <div className="alert ok-bg mb-4">Alimentação contábil gerada.</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Não foi possível gerar a visão contábil agora. Detalhe técnico: {query.error}</div> : null}

      <ProductHero
        eyebrow="visão contábil executiva"
        title="DRE e DFC precisam sair daqui como leitura gerencial clara, não como alimentação técnica perdida no fluxo."
        description="Esta tela junta geração da base contábil, resumo financeiro e histórico para o fechamento e a diretoria trabalharem em cima de uma leitura objetiva."
      >
        <form action={`/api/projects/${id}/accounting/generate`} method="post" className="flex gap-2 items-center flex-wrap mt-3 text-sm">
          <input name="period_ym" type="month" defaultValue={currentYm()} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <button type="submit" className="badge py-2 px-4 cursor-pointer">Gerar DRE / DFC</button>
        </form>
      </ProductHero>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Receita bruta</div><div className={`text-lg font-semibold mt-1 ${toneClasses(Number(dre.receitaBruta || 0))}`}>{br(dre.receitaBruta)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Custos operacionais</div><div className={`text-lg font-semibold mt-1 ${toneClasses(-Number(dre.custosOperacionais || 0))}`}>{br(dre.custosOperacionais)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Resultado operacional</div><div className={`text-lg font-semibold mt-1 ${toneClasses(Number(dre.resultadoOperacional || 0))}`}>{br(dre.resultadoOperacional)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Resultado líquido proxy</div><div className={`text-lg font-semibold mt-1 ${toneClasses(Number(dre.resultadoLiquidoProxy || 0))}`}>{br(dre.resultadoLiquidoProxy)}</div></div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Entradas operacionais</div><div className="text-lg font-semibold mt-1 text-emerald-200">{br(dfc.entradasOperacionais)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Saídas operacionais</div><div className="text-lg font-semibold mt-1 text-rose-200">{br(dfc.saidasOperacionais)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Saldo caixa proxy</div><div className={`text-lg font-semibold mt-1 ${toneClasses(Number(dfc.saldoCaixaProxy || 0))}`}>{br(dfc.saldoCaixaProxy)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Duplicatas</div><div className="text-lg font-semibold mt-1">{br(dfc.duplicatas)}</div></div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Operações bruto</div><div className="text-lg font-semibold mt-1">{br(ops.bruto)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Operações líquido</div><div className="text-lg font-semibold mt-1">{br(ops.liquido)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira total</div><div className="text-lg font-semibold mt-1">{br(carteira.total)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Carteira vencida</div><div className="text-lg font-semibold mt-1 text-rose-300">{br(carteira.vencido)}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Leitura executiva</h2><span className="kpi-chip">financeiro do mês</span></div>
        <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 p-4">
            <div className="font-medium text-white">Resultado operacional</div>
            <div className="mt-2">O resultado operacional atual está em <b>{br(dre.resultadoOperacional)}</b>, refletindo a diferença entre recebimentos consolidados e custos operacionais do período.</div>
          </div>
          <div className="rounded-2xl border border-slate-800 p-4">
            <div className="font-medium text-white">Caixa</div>
            <div className="mt-2">O saldo de caixa proxy está em <b>{br(dfc.saldoCaixaProxy)}</b>, servindo como leitura rápida para fechamento, tesouraria e diretoria.</div>
          </div>
          <div className="rounded-2xl border border-slate-800 p-4">
            <div className="font-medium text-white">Carteira</div>
            <div className="mt-2">A carteira total está em <b>{br(carteira.total)}</b>, com vencido em <b>{br(carteira.vencido)}</b>, o que afeta leitura de liquidez e risco.</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Histórico de alimentações</h2><span className="kpi-chip">trilha contábil</span></div>
        <div className="mt-3 space-y-2 text-sm">
          {feeds.length ? feeds.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-800 p-4">
              <div className="font-medium text-white">{item.period_ym}</div>
              <div className="text-xs text-slate-500 mt-1">{item.created_at}</div>
              <div className="text-slate-300 mt-2">Receita: {br((item.payload as any)?.dre?.receitaBruta)} · Resultado operacional: {br((item.payload as any)?.dre?.resultadoOperacional)} · Caixa proxy: {br((item.payload as any)?.dfc?.saldoCaixaProxy)}</div>
            </div>
          )) : <div className="alert muted-bg">Sem alimentação contábil gerada ainda.</div>}
        </div>
      </section>
    </AppShell>
  );
}

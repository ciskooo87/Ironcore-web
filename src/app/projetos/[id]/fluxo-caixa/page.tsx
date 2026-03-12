import { AppShell } from "@/components/AppShell";
import { EmptyState, MetricCard, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { todayInSaoPauloISO } from "@/lib/time";
import { getCashflowProjection90d, getOperationalMovementRows, getTodayMovement } from "@/lib/cashflow";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

type ScenarioKey = "base" | "otimista" | "pessimista";

function toneClasses(ok: boolean) {
  return ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-rose-400/30 bg-rose-400/10 text-rose-100";
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ scenario?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Fluxo de Caixa"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Fluxo de Caixa"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Fluxo de Caixa"><div className="alert bad-bg">Onboarding incompleto. Conclua o Cadastro antes de usar o fluxo de caixa.</div></AppShell>;

  const scenario = (["base", "otimista", "pessimista"].includes(query.scenario || "") ? query.scenario : "base") as ScenarioKey;

  const today = todayInSaoPauloISO();
  const move = await getTodayMovement(project.id, today);
  const proj = await getCashflowProjection90d(project.id, today);
  const selected = proj.scenarios[scenario];
  const opRows = await getOperationalMovementRows(project.id, today);
  const totalEntradas = opRows.filter((r) => r.movimentacao.includes("ENTRADA")).reduce((s, r) => s + r.valor, 0);
  const totalSaidas = opRows.filter((r) => r.movimentacao.includes("SAÍDA")).reduce((s, r) => s + r.valor, 0);

  const firstNegative = selected.rows.find((r) => r.closing < 0);
  const finance = project.financial_profile || {};
  const txDesconto = Number(finance.tx_percent || 2.5) / 100;
  const floatDias = Number(finance.float_days || 15);
  const recebiveisCarteira = Math.max(totalEntradas * 3, 0);
  const gap = Math.abs(firstNegative?.closing || 0);
  const custoDesconto = gap * txDesconto + Number(finance.tac || 0) + Number(finance.cost_per_boleto || 0);
  const impactoProrrogacao = gap * 0.012;

  return (
    <AppShell user={user} title="Projeto · Fluxo de Caixa" subtitle="Cockpit financeiro de curto prazo: movimento do dia, projeção de 90 dias e decisão rápida para evitar ruptura de caixa.">
      <ProductHero
        eyebrow="caixa e projeção"
        title="Fluxo de caixa precisa responder rápido se o projeto atravessa os próximos 90 dias ou se vai romper."
        description="Esta tela junta movimento do dia, leitura prospectiva e resposta sugerida para o time agir antes da ruptura acontecer."
      >
        <StatusPill label={selected.ruptureDate ? `Ruptura prevista em ${selected.ruptureDate}` : `Sem ruptura prevista no cenário ${scenario}`} tone={selected.ruptureDate ? "bad" : "good"} />
      </ProductHero>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Entradas do dia</div><div className="text-xl font-semibold mt-1">{brl((move.contas_receber || 0) + (move.duplicatas || 0))}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Saídas do dia</div><div className="text-xl font-semibold mt-1">{brl(move.contas_pagar || 0)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Saldo base do dia</div><div className="text-xl font-semibold mt-1">{brl((move.extrato_bancario || 0) + (move.net_ops || 0))}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Cenário ativo</div><div className="text-xl font-semibold mt-1 capitalize">{scenario}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head flex-wrap">
          <h2 className="title">Projeção de 90 dias</h2><span className="kpi-chip">premium planner</span>
          <form method="get" className="flex gap-2">
            <select name="scenario" defaultValue={scenario} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="base">Base</option>
              <option value="otimista">Otimista</option>
              <option value="pessimista">Pessimista</option>
            </select>
            <button className="badge py-2 cursor-pointer" type="submit">Aplicar</button>
          </form>
        </div>

        <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Abertura inicial</div><div className="mt-1 text-lg font-semibold text-white">{brl(proj.baseOpening)}</div></div>
          <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Média entradas</div><div className="mt-1 text-lg font-semibold text-emerald-200">{brl(proj.avgIn)}</div></div>
          <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Média saídas</div><div className="mt-1 text-lg font-semibold text-rose-200">{brl(proj.avgOut)}</div></div>
        </div>

        <div className={`alert mt-4 ${selected.ruptureDate ? "bad-bg" : "ok-bg"}`}>
          {selected.ruptureDate
            ? `⚠ Ruptura de caixa prevista no cenário ${scenario} em ${selected.ruptureDate}`
            : `✅ Sem ruptura prevista em 90 dias no cenário ${scenario}`}
        </div>

        {firstNegative ? (
          <div className="mt-4 rounded-[24px] border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <div className="font-semibold text-white">Resposta sugerida para fluxo negativo</div>
            <div className="mt-2 text-slate-300">Gap estimado: <b>{brl(gap)}</b> · Float médio: <b>{floatDias} dias</b> · TX desconto: <b>{(txDesconto * 100).toFixed(2)}%</b></div>
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-700 p-4">
                <div className="font-medium text-slate-100">Opção 1 · Prorrogar títulos</div>
                <div className="text-slate-300 mt-2">Impacto financeiro estimado: {brl(impactoProrrogacao)}</div>
              </div>
              <div className="rounded-2xl border border-slate-700 p-4">
                <div className="font-medium text-slate-100">Opção 2 · Desconto de duplicatas</div>
                <div className="text-slate-300 mt-2">Recebíveis em carteira estimados: {brl(recebiveisCarteira)}</div>
                <div className="text-slate-300 mt-1">Custo projetado da operação: {brl(custoDesconto)}</div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Movimento do dia</h2><span className="kpi-chip">{today}</span></div>
          <div className="mt-3 grid md:grid-cols-2 gap-2 text-sm">
            <div className="row"><span>Faturamento</span><b>{brl(move.faturamento || 0)}</b></div>
            <div className="row"><span>Contas a receber</span><b>{brl(move.contas_receber || 0)}</b></div>
            <div className="row"><span>Contas a pagar</span><b>{brl(move.contas_pagar || 0)}</b></div>
            <div className="row"><span>Extrato bancário</span><b>{brl(move.extrato_bancario || 0)}</b></div>
            <div className="row"><span>Duplicatas</span><b>{brl(move.duplicatas || 0)}</b></div>
            <div className="row"><span>Operações líquidas</span><b>{brl(move.net_ops || 0)}</b></div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Resumo operacional</h2><span className="kpi-chip">consolidado</span></div>
          <div className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Entradas</div><div className="mt-1 text-lg font-semibold text-emerald-200">{brl(totalEntradas)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Saídas</div><div className="mt-1 text-lg font-semibold text-rose-200">{brl(totalSaidas)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Resultado</div><div className="mt-1 text-lg font-semibold text-white">{brl(totalEntradas - totalSaidas)}</div></div>
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Movimento operacional detalhado</h2><span className="kpi-chip">base do cálculo</span></div>
        <div className="table-wrap mt-3">
          <table className="min-w-[1300px] text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">FLUXO</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">MOVIMENTAÇÃO</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">CLASSIFICAÇÃO</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">SUBCLASSIFICAÇÃO</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">NATUREZA</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">LANÇAMENTO</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">VALORES (R$)</th>
              </tr>
            </thead>
            <tbody>
              {opRows.length === 0 ? (
                <tr><td className="px-2 py-2 border-b border-slate-900 text-center text-slate-400" colSpan={7}>Sem lançamentos diários para {today}</td></tr>
              ) : opRows.map((r, i) => (
                <tr key={`${r.classificacao}-${i}`} className="odd:bg-slate-900/30">
                  <td className="px-2 py-1.5 border-b border-slate-900">{r.fluxo}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900">{r.movimentacao}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900">{r.classificacao}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900">{r.subclassificacao}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900">{r.natureza}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900">{r.lancamento}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900 text-right">{brl(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

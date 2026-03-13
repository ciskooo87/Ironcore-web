import { AppShell } from "@/components/AppShell";
import { ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { todayInSaoPauloISO } from "@/lib/time";
import { getCashflowProjection90d, getOperationalMovementRows, getTodayMovement } from "@/lib/cashflow";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

type ScenarioKey = "base" | "otimista" | "pessimista";

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
  const netDay = totalEntradas - totalSaidas;

  const firstNegative = selected.rows.find((r) => r.closing < 0);
  const finance = project.financial_profile || {};
  const txDesconto = Number(finance.tx_percent || 2.5) / 100;
  const floatDias = Number(finance.float_days || 15);
  const recebiveisCarteira = Math.max(totalEntradas * 3, 0);
  const gap = Math.abs(firstNegative?.closing || 0);
  const custoDesconto = gap * txDesconto + Number(finance.tac || 0) + Number(finance.cost_per_boleto || 0);
  const impactoProrrogacao = gap * 0.012;
  const bestClosing = Math.max(...selected.rows.map((r) => r.closing));
  const worstClosing = Math.min(...selected.rows.map((r) => r.closing));

  const mainAction = firstNegative
    ? `Atuar antes da ruptura prevista em ${firstNegative.date} e cobrir um gap estimado de ${brl(gap)}.`
    : `Manter o cenário ${scenario} monitorado e proteger o caixa para sustentar os próximos 90 dias.`;

  const mainRisk = firstNegative
    ? `Ruptura de caixa prevista no cenário ${scenario} em ${firstNegative.date}.`
    : netDay < 0
      ? `O dia fecha negativo em ${brl(Math.abs(netDay))}, apesar de não haver ruptura prevista no horizonte.`
      : "Sem ruptura prevista no horizonte de 90 dias para o cenário atual.";

  return (
    <AppShell user={user} title="Projeto · Fluxo de Caixa" subtitle="Liquidez de curto prazo com leitura de ruptura, resposta sugerida e base do cálculo">
      <ProductHero
        eyebrow="caixa e projeção"
        title="Fluxo de caixa precisa responder rápido se o projeto atravessa os próximos 90 dias ou se vai romper."
        description="A tela agora organiza movimento do dia, projeção, risco de ruptura e resposta operacional em uma leitura mais executiva."
      >
        <StatusPill label={selected.ruptureDate ? `Ruptura em ${selected.ruptureDate}` : `Sem ruptura no cenário ${scenario}`} tone={selected.ruptureDate ? "bad" : "good"} />
        <StatusPill label={`Cenário: ${scenario}`} tone="info" />
      </ProductHero>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head flex-wrap">
            <h2 className="title">Comando do caixa</h2><span className="kpi-chip">prioridade financeira</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
              <div className="mt-2 text-lg font-semibold text-white">{mainAction}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
              <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Cenário ativo</div>
              <form method="get" className="mt-3 flex gap-2 flex-wrap">
                <select name="scenario" defaultValue={scenario} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                  <option value="base">Base</option>
                  <option value="otimista">Otimista</option>
                  <option value="pessimista">Pessimista</option>
                </select>
                <button className="badge py-2 cursor-pointer" type="submit">Aplicar</button>
              </form>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Checkpoint</h2><span className="kpi-chip">leitura rápida</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Abertura inicial</div><div className="mt-1 font-medium text-white">{brl(proj.baseOpening)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Média entradas</div><div className="mt-1 font-medium text-emerald-200">{brl(proj.avgIn)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Média saídas</div><div className="mt-1 font-medium text-rose-200">{brl(proj.avgOut)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Resultado do dia</div><div className={`mt-1 font-medium ${netDay < 0 ? "text-rose-300" : "text-emerald-300"}`}>{brl(netDay)}</div></div>
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Projeção de 90 dias</h2><span className="kpi-chip">leitura prospectiva</span></div>
        <div className={`alert mt-4 ${selected.ruptureDate ? "bad-bg" : "ok-bg"}`}>
          {selected.ruptureDate
            ? `⚠ Ruptura de caixa prevista no cenário ${scenario} em ${selected.ruptureDate}`
            : `✅ Sem ruptura prevista em 90 dias no cenário ${scenario}`}
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Melhor fechamento</div><div className="mt-1 text-lg font-semibold text-emerald-200">{brl(bestClosing)}</div></div>
          <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Pior fechamento</div><div className="mt-1 text-lg font-semibold text-rose-200">{brl(worstClosing)}</div></div>
          <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Ruptura prevista</div><div className="mt-1 text-lg font-semibold text-white">{selected.ruptureDate || "não"}</div></div>
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

        <div className="table-wrap mt-4">
          <table className="min-w-[1100px] text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Data</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Abertura</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Entradas</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Saídas</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Fechamento</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Sinal</th>
              </tr>
            </thead>
            <tbody>
              {selected.rows.slice(0, 20).map((row) => (
                <tr key={row.date} className="odd:bg-slate-900/30">
                  <td className="px-2 py-1.5 border-b border-slate-900">{row.date}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900 text-right">{brl(row.opening)}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900 text-right text-emerald-200">{brl(row.inflow)}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900 text-right text-rose-200">{brl(row.outflow)}</td>
                  <td className={`px-2 py-1.5 border-b border-slate-900 text-right ${row.closing < 0 ? "text-rose-300" : "text-slate-100"}`}>{brl(row.closing)}</td>
                  <td className="px-2 py-1.5 border-b border-slate-900">{row.rupture ? "ruptura" : "ok"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <div className="section-head"><h2 className="title">Resumo operacional</h2><span className="kpi-chip">base do dia</span></div>
          <div className="mt-3 grid md:grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Entradas</div><div className="mt-1 text-lg font-semibold text-emerald-200">{brl(totalEntradas)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Saídas</div><div className="mt-1 text-lg font-semibold text-rose-200">{brl(totalSaidas)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-4"><div className="text-xs text-slate-400">Resultado</div><div className={`mt-1 text-lg font-semibold ${netDay < 0 ? "text-rose-300" : "text-white"}`}>{brl(netDay)}</div></div>
          </div>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Movimento operacional detalhado</h2><span className="kpi-chip">base do cálculo</span></div>
        <div className="table-wrap mt-3">
          <table className="min-w-[1300px] text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Fluxo</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Movimentação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Classificação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Subclassificação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Natureza</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Lançamento</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Valor (R$)</th>
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

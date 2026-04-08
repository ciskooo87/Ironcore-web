const cards = [
  ["Saldo consolidado", "R$ 12.500"],
  ["Entradas", "R$ 4.500"],
  ["Saídas", "R$ 1.250"],
  ["Lançamentos", "2"],
] as const;

const alerts = [
  ["Risco projetado de liquidez", "A projeção exige acompanhamento próximo das saídas recorrentes.", "Priorizar disciplina de caixa e controle de obrigações previsíveis."],
  ["Geração líquida sob atenção", "A geração líquida ainda é sensível a oscilações operacionais.", "Monitorar despesas e antecipar ajustes antes de deterioração do saldo."],
] as const;

export default function CashflowDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#B54708]">Saúde do caixa: Observação</div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value]) => (
          <div key={title} className="rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">{title}</div>
            <div className="mt-3 text-3xl font-semibold text-[#101828]">{value}</div>
          </div>
        ))}
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">DFC inicial</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-[#475467]">
            <div><strong className="block text-[#101828]">Operacional líquido</strong>R$ 3.250</div>
            <div><strong className="block text-[#101828]">Investimento líquido</strong>R$ 0</div>
            <div><strong className="block text-[#101828]">Financiamento líquido</strong>R$ 0</div>
          </div>
          <div className="mt-4 font-semibold text-[#101828]">Geração líquida de caixa: R$ 3.250</div>
        </section>
        <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Projeção de caixa</div>
          <div className="mt-3 space-y-2 text-sm text-[#475467]">
            <div>Risco de liquidez: <strong className="text-[#B54708]">Médio</strong></div>
            <div>Saldo atual: <strong className="text-[#101828]">R$ 12.500</strong></div>
            <div>Média diária de entradas: <strong className="text-[#101828]">R$ 150</strong></div>
            <div>Média diária de saídas: <strong className="text-[#101828]">R$ 235</strong></div>
          </div>
          <div className="mt-4 rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#475467]">Monitorar o consumo de caixa e preparar ação preventiva sobre despesas e capital de giro.</div>
        </section>
      </div>
      <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Alertas</div>
        <div className="mt-4 grid gap-3">
          {alerts.map(([title, desc, rec]) => (
            <div key={title} className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-4">
              <div className="font-semibold text-[#101828]">{title}</div>
              <div className="mt-2 text-sm leading-7 text-[#475467]">{desc}</div>
              <div className="mt-2 text-sm leading-7 text-[#101828]">{rec}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const rules = [
  ["Aluguel", "Mensal", "Saída", "R$ 2.000"],
  ["Receita recorrente", "Mensal", "Entrada", "R$ 5.000"],
  ["Serviço contábil", "Mensal", "Saída", "R$ 750"],
] as const;

export default function CashflowRecurringPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="grid gap-4">
        {rules.map(([description, frequency, type, amount]) => (
          <div key={description} className="rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-xl font-semibold text-[#101828]">{description}</div>
            <div className="mt-2 text-sm text-[#667085]">{frequency} · {type}</div>
            <div className="mt-4 text-lg font-semibold text-[#101828]">{amount}</div>
          </div>
        ))}
      </section>
      <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <h2 className="text-2xl font-semibold text-[#101828]">Nova recorrência</h2>
        <p className="mt-2 text-sm text-[#667085]">Fluxos previsíveis ajudam a leitura da projeção e a antecipação de consumo de caixa.</p>
        <form className="mt-6 grid gap-4">
          <input placeholder="Descrição" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
          <input placeholder="Valor" type="number" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3" />
          <select className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3"><option>Entrada</option><option>Saída</option></select>
          <select className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3"><option>Mensal</option><option>Semanal</option></select>
          <button type="button" className="w-fit rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white">Criar recorrência</button>
        </form>
      </section>
    </div>
  );
}

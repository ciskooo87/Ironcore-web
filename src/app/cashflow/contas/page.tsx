const accounts = [
  ["Banco Principal", "Banco", "R$ 10.000", "Conta principal de operação e consolidação"],
  ["Caixa Operacional", "Caixa", "R$ 2.500", "Reserva imediata para despesas do dia a dia"],
] as const;

export default function CashflowAccountsPage() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {accounts.map(([name, type, balance, note]) => (
        <div key={name} className="rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="text-xl font-semibold text-[#101828]">{name}</div>
          <div className="mt-2 text-sm text-[#667085]">{type}</div>
          <div className="mt-4 text-lg font-semibold text-[#101828]">{balance}</div>
          <div className="mt-3 text-sm leading-7 text-[#475467]">{note}</div>
        </div>
      ))}
    </section>
  );
}

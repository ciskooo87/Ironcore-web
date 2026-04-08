import Link from "next/link";

const launches = [
  ["2026-04-08", "Recebimento de cliente", "Recebimentos", "Entrada", "R$ 4.500", false],
  ["2026-04-08", "Pagamento fornecedor", "Fornecedores", "Saída", "R$ 1.250", true],
] as const;

export default function CashflowLaunchesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#101828]">Lançamentos</h2>
          <p className="mt-2 text-sm text-[#667085]">Fluxo operacional inicial de entradas e saídas.</p>
        </div>
        <Link href="/cashflow/lancamentos/novo" className="rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white">Novo lançamento</Link>
      </div>
      {launches.map(([date, description, category, type, amount, receipt]) => (
        <div key={`${date}-${description}`} className="rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-[#101828]">{description}</div>
              <div className="mt-2 text-sm text-[#667085]">{date} · {category}</div>
              {receipt ? <div className="mt-2 text-sm text-[#101828]">Com comprovante anexado</div> : null}
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#101828]">{amount}</div>
              <div className="mt-2 text-sm text-[#667085]">{type}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

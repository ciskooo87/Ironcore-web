import Link from "next/link";

const launches = [
  ["2026-04-08", "Recebimento de cliente", "Recebimentos", "Entrada", "R$ 4.500", "Confirmado", false],
  ["2026-04-08", "Pagamento fornecedor", "Fornecedores", "Saída", "R$ 1.250", "Cancelado", true],
  ["2026-04-07", "Assinatura mensal", "Recebimentos", "Entrada", "R$ 2.900", "Confirmado", false],
] as const;

export default function CashflowLaunchesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#101828]">Lançamentos</h2>
          <p className="mt-2 text-sm text-[#667085]">Fluxo operacional com status, comprovante e trilha de edição/baixa lógica.</p>
        </div>
        <Link href="/cashflow/lancamentos/novo" className="rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white">Novo lançamento</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-4 text-sm text-[#475467] shadow-[0_16px_40px_rgba(15,23,42,0.05)]"><strong className="block text-[#101828]">Filtro futuro</strong>Período</div>
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-4 text-sm text-[#475467] shadow-[0_16px_40px_rgba(15,23,42,0.05)]"><strong className="block text-[#101828]">Filtro futuro</strong>Conta</div>
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-4 text-sm text-[#475467] shadow-[0_16px_40px_rgba(15,23,42,0.05)]"><strong className="block text-[#101828]">Filtro futuro</strong>Categoria</div>
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-4 text-sm text-[#475467] shadow-[0_16px_40px_rgba(15,23,42,0.05)]"><strong className="block text-[#101828]">Ordenação futura</strong>Mais recentes</div>
      </div>

      {launches.map(([date, description, category, type, amount, status, receipt]) => (
        <div key={`${date}-${description}`} className={`rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] ${status === "Cancelado" ? "opacity-70" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-[#101828]">{description}</div>
              <div className="mt-2 text-sm text-[#667085]">{date} · {category}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
                <span className={`rounded-full px-3 py-1 ${status === "Cancelado" ? "bg-[#FFF7ED] text-[#B54708]" : "bg-[#ECFDF3] text-[#027A48]"}`}>{status}</span>
                <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-[#475467]">{type}</span>
              </div>
              {receipt ? <div className="mt-3 text-sm text-[#101828]">Com comprovante anexado</div> : null}
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#101828]">{amount}</div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#101828]">Editar</button>
                {status !== "Cancelado" ? <button type="button" className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#B54708]">Baixar</button> : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

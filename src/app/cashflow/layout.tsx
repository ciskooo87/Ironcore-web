import Link from "next/link";

const nav = [
  ["/cashflow", "Visão geral"],
  ["/cashflow/dashboard", "Dashboard"],
  ["/cashflow/contas", "Contas"],
  ["/cashflow/categorias", "Categorias"],
  ["/cashflow/lancamentos", "Lançamentos"],
  ["/cashflow/recorrencias", "Recorrências"],
  ["/cashflow/login", "Login"],
] as const;

export default function CashflowLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#101828]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-10">
        <header className="mb-6 rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">IronSaaS Cashflow</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#101828] md:text-5xl">Operação de caixa com leitura executiva, DFC e projeção</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#667085]">
                MVP navegável publicado dentro do domínio principal da IronCore, agora com home mais contextual,
                dashboard mais analítico e fluxo de lançamentos mais próximo da operação real.
              </p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#F8FAFC] px-5 py-4 text-sm leading-7 text-[#475467] lg:max-w-sm">
              <div className="font-semibold text-[#101828]">Escopo atual</div>
              <div className="mt-1">Contas, categorias, lançamentos, recorrências, visão executiva, login demo e fluxo de caixa projetado.</div>
            </div>
          </div>
          <nav className="mt-6 flex flex-wrap gap-2">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full border border-black/10 bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#344054] transition hover:border-black/15 hover:bg-white hover:text-[#111827]">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

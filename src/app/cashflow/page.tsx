import Link from "next/link";

const cards = [
  ["Dashboard", "Leitura executiva inicial de caixa, DFC, projeção e alertas.", "/cashflow/dashboard"],
  ["Contas", "Estrutura de contas de banco e caixa com saldo por conta.", "/cashflow/contas"],
  ["Categorias", "Base de classificação para DFC e controle operacional.", "/cashflow/categorias"],
  ["Lançamentos", "Entradas e saídas com trilha para comprovantes e classificação.", "/cashflow/lancamentos"],
  ["Recorrências", "Fluxos previsíveis para sustentar projeção de caixa.", "/cashflow/recorrencias"],
  ["Login", "Acesso inicial de demonstração do MVP.", "/cashflow/login"],
] as const;

export default function CashflowHomePage() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(([title, text, href]) => (
        <Link key={href} href={href} className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-black/10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Módulo</div>
          <div className="mt-3 text-xl font-semibold text-[#101828]">{title}</div>
          <div className="mt-3 text-sm leading-7 text-[#475467]">{text}</div>
        </Link>
      ))}
    </section>
  );
}

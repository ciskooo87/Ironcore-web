import Link from "next/link";

const cards = [
  ["Dashboard", "Leitura executiva do caixa, fluxo líquido, tickets médios, DFC, projeção e alertas.", "/cashflow/dashboard"],
  ["Contas", "Estrutura de caixa e bancos para consolidar saldo e organizar a base operacional.", "/cashflow/contas"],
  ["Categorias", "Classificação financeira pronta para sustentar DFC e análise por natureza.", "/cashflow/categorias"],
  ["Lançamentos", "Entradas e saídas com status, comprovante, edição e baixa lógica no fluxo do MVP.", "/cashflow/lancamentos"],
  ["Recorrências", "Fluxos previsíveis para sustentar a projeção de caixa e dar visibilidade ao consumo futuro.", "/cashflow/recorrencias"],
  ["Login", "Acesso demo para posicionar a camada autenticada do produto.", "/cashflow/login"],
] as const;

export default function CashflowHomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="grid gap-6">
        <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Contexto atual</div>
          <h2 className="mt-3 text-2xl font-semibold text-[#101828] md:text-3xl">O /cashflow já virou um módulo navegável, não só uma vitrine.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#475467]">
            Esta publicação já reflete a evolução do produto: visão executiva mais forte, lançamentos mais operacionais,
            leitura de saúde do caixa e estrutura preparada para seguir aprofundando filtros, períodos e automações.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/cashflow/dashboard" className="rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white">Abrir dashboard</Link>
            <Link href="/cashflow/lancamentos" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#101828]">Ver lançamentos</Link>
            <Link href="/cashflow/lancamentos/novo" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#101828]">Novo lançamento</Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([title, text, href]) => (
            <Link key={href} href={href} className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-black/10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Módulo</div>
              <div className="mt-3 text-xl font-semibold text-[#101828]">{title}</div>
              <div className="mt-3 text-sm leading-7 text-[#475467]">{text}</div>
            </Link>
          ))}
        </section>
      </section>

      <aside className="grid gap-4">
        <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Destaques da evolução</div>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-[#475467]">
            <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Home mais contextual e orientada à operação.</div>
            <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Dashboard com fluxo líquido, tickets médios e pior saldo projetado.</div>
            <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Lançamentos com edição e baixa lógica refletidas no caixa.</div>
          </div>
        </div>

        <div className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Próximo ganho</div>
          <p className="mt-3 text-sm leading-7 text-[#475467]">
            O próximo salto natural deste módulo é adicionar filtros, períodos, ordenação e leitura comparativa por janela de tempo.
          </p>
        </div>
      </aside>
    </div>
  );
}

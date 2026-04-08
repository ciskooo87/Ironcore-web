import Link from 'next/link';

const features = [
  {
    title: 'Fluxo financeiro operacional',
    text: 'Contas, categorias, lançamentos, recorrências e visão consolidada de caixa em um produto único.',
  },
  {
    title: 'DFC e projeção executiva',
    text: 'Leitura de geração de caixa, projeção futura, pagamentos do dia e visão detalhada por blocos.',
  },
  {
    title: 'Produto pronto para operação',
    text: 'Acesso web, trilha auditável, experiência desktop e evolução mobile em andamento.',
  },
];

export default function IronSaaSPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#101828]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-10">
        <section className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">IronSaaS</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-[#101828] md:text-6xl">
            Software operacional para caixa, DFC e leitura financeira executiva.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#475467] md:text-lg">
            O IronSaaS é a camada de produto da Ironcore para operação financeira: lançamentos, contas, categorias,
            recorrências, projeção de caixa e DFC detalhado em um fluxo único.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cashflow" className="rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,24,39,0.18)]">
              Acessar produto
            </Link>
            <Link href="/cashflow/dashboard" className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#101828]">
              Ver dashboard
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="text-xl font-semibold text-[#101828]">{feature.title}</div>
              <div className="mt-3 text-sm leading-7 text-[#475467]">{feature.text}</div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

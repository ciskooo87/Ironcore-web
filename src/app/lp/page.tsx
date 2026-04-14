import Link from "next/link";

const products = [
  {
    eyebrow: "Core platform",
    title: "Ironcore",
    description:
      "Camada principal da operação: centraliza a navegação, organiza os fluxos e conecta os produtos do ecossistema em uma experiência única.",
    highlights: ["Portal central do ecossistema", "Acesso unificado aos módulos", "Base para operação e expansão"],
    primaryHref: "/login",
    primaryLabel: "Acessar Ironcore",
    secondaryHref: "#acessos",
    secondaryLabel: "Ver acessos",
  },
  {
    eyebrow: "Diagnóstico financeiro",
    title: "Ironcore Diag",
    description:
      "Fluxo guiado para transformar bases históricas, contexto do cliente e leitura financeira em um diagnóstico executivo pronto para validação e entrega.",
    highlights: ["Upload e normatização", "Workflow com checkpoints", "Entrega executiva com método"],
    primaryHref: "/diagnotico",
    primaryLabel: "Conhecer Diag",
    secondaryHref: "/diag/",
    secondaryLabel: "Abrir plataforma",
  },
  {
    eyebrow: "Financial ops SaaS",
    title: "IronSaaS",
    description:
      "Produto operacional para caixa, lançamentos, DFC, recorrências e projeção, com leitura executiva inspirada no que já foi consolidado no Cashflow.",
    highlights: ["Leitura de caixa", "Operação diária", "Projeção e DFC"],
    primaryHref: "/ironsaas",
    primaryLabel: "Conhecer IronSaaS",
    secondaryHref: "/cashflow",
    secondaryLabel: "Abrir plataforma",
  },
] as const;

const accessTabs = [
  {
    label: "Ironcore",
    href: "/login",
    description: "Entrada principal do ecossistema e camada central de navegação.",
  },
  {
    label: "Ironcore Diag",
    href: "/diag/",
    description: "Acesso direto ao módulo de diagnóstico financeiro.",
  },
  {
    label: "IronSaaS",
    href: "/cashflow",
    description: "Acesso ao produto operacional de caixa e gestão financeira.",
  },
] as const;

export default function LpChooserPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#101828]">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-10">
        <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Ironcore ecosystem</div>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-[#101828] md:text-6xl">
                Um ecossistema limpo para operar, diagnosticar e escalar finanças com a cara da Ironcore.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#475467] md:text-lg">
                A nova LP organiza o portfólio em três frentes complementares: <strong>Ironcore</strong> como camada central,
                <strong> Ironcore Diag</strong> para diagnóstico financeiro estruturado e <strong>IronSaaS</strong> para operação contínua de caixa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#acessos"
                  className="rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,24,39,0.18)]"
                >
                  Acessar plataformas
                </Link>
                <Link
                  href="/ironsaas"
                  className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#101828]"
                >
                  Ver visão do produto
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Estrutura</div>
                <div className="mt-3 text-lg font-semibold text-[#101828]">Clareza comercial + acesso operacional</div>
                <p className="mt-2 text-sm leading-7 text-[#475467]">
                  A página apresenta o portfólio sem ruído e já conduz o usuário para a plataforma certa.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Referência visual</div>
                <div className="mt-3 text-lg font-semibold text-[#101828]">Layout clean, inspirado no Cashflow</div>
                <p className="mt-2 text-sm leading-7 text-[#475467]">
                  Mais branco, mais respiro, cards claros e CTAs objetivos para reforçar posicionamento premium.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.title}
              className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">{product.eyebrow}</div>
              <h2 className="mt-3 text-2xl font-semibold text-[#101828]">{product.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#475467]">{product.description}</p>

              <div className="mt-5 grid gap-2">
                {product.highlights.map((item) => (
                  <div key={item} className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3 text-sm text-[#344054]">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={product.primaryHref}
                  className="rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white"
                >
                  {product.primaryLabel}
                </Link>
                <Link
                  href={product.secondaryHref}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#101828]"
                >
                  {product.secondaryLabel}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section id="acessos" className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Acessos</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
                Entrada direta para cada plataforma.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#475467] md:text-base">
                Esse bloco funciona como uma aba de acesso rápida: cada botão leva o usuário direto para a experiência certa,
                sem precisar navegar por menus intermediários.
              </p>
            </div>

            <div className="grid gap-4">
              {accessTabs.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-4 rounded-[24px] border border-black/5 bg-[#F8FAFC] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-lg font-semibold text-[#101828]">{item.label}</div>
                    <p className="mt-1 text-sm leading-7 text-[#475467]">{item.description}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Acessar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

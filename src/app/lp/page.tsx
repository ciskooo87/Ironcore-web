import Image from "next/image";
import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/csrf";

const contextBullets = [
  "Sua empresa fatura, mas não converte resultado em caixa",
  "Sua margem oscila sem explicação objetiva",
  "Seu financeiro fecha números, mas não explica desvios",
  "Seu time opera, mas sem padrão e sem previsibilidade",
  "Suas decisões são reativas, não estruturadas",
] as const;

const products = [
  {
    title: "IronCore Diag",
    subtitle: "Descubra exatamente onde sua empresa está perdendo dinheiro",
    description:
      "O IronCore Diag analisa seus dados financeiros e operacionais e entrega uma leitura direta sobre risco, perda e ineficiência. Não é relatório. É diagnóstico acionável.",
    deliveries: [
      "Mapeamento de perdas financeiras ocultas",
      "Identificação de gargalos operacionais críticos",
      "Análise de variações de margem e caixa",
      "Priorização de riscos por impacto financeiro",
      "Leitura executiva pronta para decisão",
    ],
    changes: [
      "Você sai de percepção para evidência",
      "Você entende o problema antes que ele escale",
      "Você passa a agir com base em impacto real",
    ],
    when: "Quando existe dúvida sobre desempenho, queda de resultado ou falta de clareza operacional",
    href: "/diag/",
    cta: "Gerar diagnóstico",
  },
  {
    title: "IronCore",
    subtitle: "Transforme diagnóstico em decisão estruturada",
    description:
      "O IronCore organiza dados, estrutura análises e direciona decisões. Consolida informações críticas, interpreta cenários e define exatamente o que deve ser feito, em que ordem e com qual impacto.",
    deliveries: [
      "Consolidação de dados financeiros e operacionais",
      "Análise estruturada de risco e impacto",
      "Priorização estratégica baseada em fatos",
      "Plano de ação completo (5W2H)",
      "Visão executiva para diretoria e comitê",
    ],
    changes: [
      "Você elimina decisões baseadas em feeling",
      "Você ganha clareza sobre prioridade real",
      "Você reduz erro estratégico",
    ],
    when: "Quando você precisa tomar decisões com segurança, velocidade e clareza",
    href: "/login",
    cta: "Ver plataforma",
  },
  {
    title: "IronSaaS",
    subtitle: "Execute com controle. Escale sem perder eficiência.",
    description:
      "O IronSaaS transforma processos críticos em sistemas. Elimina planilhas, automatiza rotinas e cria um ambiente operacional estruturado, rastreável e escalável.",
    deliveries: [
      "Automação de processos financeiros e operacionais",
      "Padronização de rotinas e fluxos",
      "Centralização de dados e controles",
      "Monitoramento em tempo real",
      "Base tecnológica para crescimento sustentável",
    ],
    changes: [
      "Você reduz erro operacional",
      "Você elimina retrabalho",
      "Você ganha escala com controle",
    ],
    when: "Quando a operação depende de planilhas, pessoas-chave ou controles manuais",
    href: "/cashflow",
    cta: "Conhecer solução",
  },
] as const;

const comparison = [
  {
    title: "IronCore Diag",
    focus: "Diagnóstico",
    resolve: "Falta de clareza",
    delivery: "O que está errado e onde está o impacto",
  },
  {
    title: "IronCore",
    focus: "Decisão",
    resolve: "Falta de direcionamento",
    delivery: "O que fazer, em que ordem e por quê",
  },
  {
    title: "IronSaaS",
    focus: "Execução",
    resolve: "Falta de controle",
    delivery: "Como executar com consistência e escala",
  },
] as const;

const results = [
  "Redução de perdas financeiras não identificadas",
  "Aumento de previsibilidade de caixa",
  "Melhoria consistente de margem",
  "Decisões mais rápidas e assertivas",
  "Operação mais eficiente e controlada",
] as const;

const demoCards = [
  {
    eyebrow: "Tela do diagnóstico",
    title: "Risco priorizado por impacto financeiro",
    bullets: ["Perdas ocultas destacadas", "Margem pressionada por origem", "Top riscos em ordem de prioridade"],
  },
  {
    eyebrow: "Leitura executiva",
    title: "Desvios e ineficiências sem ruído",
    bullets: ["Causa provável do desvio", "Impacto em caixa e margem", "Leitura pronta para diretoria"],
  },
  {
    eyebrow: "Plano de ação",
    title: "O que fazer agora, em que ordem",
    bullets: ["Ação priorizada", "Responsável definido", "Janela de execução e impacto"],
  },
  {
    eyebrow: "Interface do SaaS",
    title: "Controle operacional centralizado",
    bullets: ["Rotina padronizada", "Acompanhamento em tempo real", "Execução com menos retrabalho"],
  },
] as const;

const demoScreens = [
  "/lp-images/diagnotico-screen.gif",
  "/lp-images/processo-screen.gif",
  "/lp-images/processo-screen.gif",
  "/lp-images/cashflow-dashboard.gif",
] as const;

export default async function LpPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const query = await searchParams;
  const csrf = await ensureCsrfCookie();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_32%),linear-gradient(180deg,#F7F8FA_0%,#EEF2F6_100%)] text-[#101828]">
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 lg:px-10">
        <header className="sticky top-4 z-30 mb-6 rounded-[24px] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link href="/lp/" className="flex items-center gap-3">
              <div className="overflow-hidden rounded-2xl border border-black/5 bg-[#0F172A] p-1 shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                <Image src="/brand/ironcore-symbol.png" alt="IronCore" width={44} height={44} className="h-11 w-11 rounded-xl object-cover" priority />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-[-0.04em] text-[#101828]">IronCore</div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#98A2B3]">Diagnóstico · Decisão · Execução</div>
              </div>
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold text-[#344054]">
              <a href="#produtos" className="rounded-xl px-4 py-2 transition hover:bg-[#F4F7FA]">Produtos</a>
              <a href="#comparativo" className="rounded-xl px-4 py-2 transition hover:bg-[#F4F7FA]">Comparativo</a>
              <a href="#demo" className="rounded-xl px-4 py-2 transition hover:bg-[#F4F7FA]">Demonstração</a>
              <a href="#lead" className="rounded-xl bg-[#0F172A] px-4 py-2 text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)]">Falar com especialista</a>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] md:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_60%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D8E2EC] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#667085]">IronCore ecosystem</div>
              <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[0.92] tracking-[-0.06em] text-[#101828] md:text-7xl">
                Diagnostique. Decida. Execute. Sem achismo.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#475467] md:text-lg">
                Três soluções independentes para resolver problemas reais de caixa, margem e eficiência operacional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#produtos"
                  className="rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,24,39,0.18)]"
                >
                  Ver os produtos
                </Link>
                <a
                  href="#lead"
                  className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#101828]"
                >
                  Falar com especialista
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#667085]">
                <div className="rounded-full border border-[#D8E2EC] bg-white px-3 py-2">Foco em caixa</div>
                <div className="rounded-full border border-[#D8E2EC] bg-white px-3 py-2">Leitura executiva</div>
                <div className="rounded-full border border-[#D8E2EC] bg-white px-3 py-2">Execução com controle</div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[24px] border border-black/5 bg-[#0F172A] p-6 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Leitura CFO mode</div>
                <div className="mt-4 text-2xl font-semibold leading-tight">
                  O problema não é volume de dado. É não saber onde está o impacto.
                </div>
                <div className="mt-5 grid gap-3 text-sm text-white/80">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Caixa pressionado sem causa objetiva.</div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Margem oscilando sem leitura executiva.</div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">Operação crescendo com perda de controle.</div>
                </div>
              </div>
              <div className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Jornada</div>
                <div className="mt-4 grid gap-3 text-sm text-[#344054]">
                  <div className="rounded-xl border border-black/5 bg-white px-4 py-3"><strong>Diagnóstico:</strong> enxergar o problema</div>
                  <div className="rounded-xl border border-black/5 bg-white px-4 py-3"><strong>Decisão:</strong> definir prioridade e ação</div>
                  <div className="rounded-xl border border-black/5 bg-white px-4 py-3"><strong>Execução:</strong> operar com consistência e escala</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-[108px] z-20 mt-6 rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur md:p-5">
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#344054]">
            <a href="#contexto" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Entender o problema</a>
            <a href="#produtos" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Ver os produtos</a>
            <a href="#comparativo" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Comparar soluções</a>
            <a href="#demo" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Ver na prática</a>
            <a href="#lead" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Falar com especialista</a>
          </div>
        </section>

        <section id="contexto" className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Contexto</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
            O problema não é falta de dado. É falta de controle.
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contextBullets.map((item) => (
              <div key={item} className="rounded-[20px] border border-black/5 bg-[#F8FAFC] px-5 py-4 text-sm leading-7 text-[#344054]">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-base leading-8 text-[#475467]">
            Sem diagnóstico, você não enxerga. Sem decisão estruturada, você erra. Sem execução controlada, você perde eficiência.
            Cada etapa exige uma solução específica.
          </p>
        </section>

        <section id="produtos" className="mt-8 grid gap-6">
          {products.map((product) => (
            <article
              key={product.title}
              className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10"
            >
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Produto</div>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">{product.title}</h2>
                  <p className="mt-3 text-lg font-medium leading-8 text-[#101828]">{product.subtitle}</p>
                  <p className="mt-5 text-sm leading-8 text-[#475467] md:text-base">{product.description}</p>

                  <div className="mt-6 rounded-[24px] border border-black/5 bg-[#F8FAFC] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Quando usar</div>
                    <p className="mt-3 text-sm leading-7 text-[#344054]">{product.when}</p>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={product.href}
                      className="inline-flex rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white"
                    >
                      {product.cta}
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Entregas</div>
                    <div className="mt-4 grid gap-3">
                      {product.deliveries.map((item) => (
                        <div key={item} className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm text-[#344054]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">O que muda</div>
                    <div className="mt-4 grid gap-3">
                      {product.changes.map((item) => (
                        <div key={item} className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm text-[#344054]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section id="comparativo" className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Comparativo</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
            Cada produto resolve um problema específico
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {comparison.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-6">
                <div className="text-xl font-semibold text-[#101828]">{item.title}</div>
                <div className="mt-5 grid gap-3 text-sm leading-7 text-[#344054]">
                  <div><strong>Foco:</strong> {item.focus}</div>
                  <div><strong>Resolve:</strong> {item.resolve}</div>
                  <div><strong>Entrega:</strong> {item.delivery}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Resultado</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
              Impacto direto no resultado
            </h2>
            <div className="mt-8 grid gap-3">
              {results.map((item) => (
                <div key={item} className="rounded-[20px] border border-black/5 bg-[#F8FAFC] px-5 py-4 text-sm leading-7 text-[#344054]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <section id="demo" className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Demonstração</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
              O que você passa a enxergar
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {demoCards.map((card, index) => (
                <div key={card.title} className="overflow-hidden rounded-[24px] border border-black/5 bg-[#F8FAFC]">
                  <div className="border-b border-black/5 bg-white px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">{card.eyebrow}</div>
                    <div className="mt-2 text-lg font-semibold text-[#101828]">{card.title}</div>
                  </div>
                  <div className="grid gap-3 p-5">
                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
                      <Image
                        src={demoScreens[index]}
                        alt={card.title}
                        width={1400}
                        height={1400}
                        className="h-64 w-full object-cover object-top"
                        unoptimized
                      />
                    </div>
                    <div className="grid gap-2">
                      {card.bullets.map((item) => (
                        <div key={item} className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm text-[#344054]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/diag/"
                className="inline-flex rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white"
              >
                Quero ver na prática
              </Link>
            </div>
          </section>
        </section>

        <section id="lead" className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Falar com especialista</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
                Escolha o problema que você precisa resolver
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#475467]">
                Diagnosticar, decidir ou executar. Cada solução ataca um ponto crítico da operação.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-[#344054]">
                <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Se você precisa enxergar a perda, comece pelo diagnóstico.</div>
                <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Se você já enxerga o problema, entre pela decisão.</div>
                <div className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3">Se sua operação trava na execução, entre pela camada de controle.</div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-6">
              {query.lead === "ok" ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Lead recebido com sucesso.</div> : null}
              {query.lead && query.lead !== "ok" ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Não foi possível enviar. Revise os campos e tente novamente.</div> : null}
              <form action="/api/lead" method="post" className="grid gap-3 text-sm md:grid-cols-2">
                <input type="hidden" name="csrf_token" value={csrf} />
                <input type="hidden" name="segment" value="geral" />
                <input name="name" required placeholder="Seu nome" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[#101828] outline-none" />
                <input name="email" type="email" required placeholder="Seu email" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[#101828] outline-none" />
                <input name="company" placeholder="Empresa" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[#101828] outline-none" />
                <input name="phone" placeholder="WhatsApp" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[#101828] outline-none" />
                <textarea name="message" placeholder="Qual problema hoje mais pressiona caixa, margem ou operação?" className="min-h-28 rounded-xl border border-black/10 bg-white px-4 py-3 text-[#101828] outline-none md:col-span-2" />
                <button type="submit" className="rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
                  Falar com especialista
                </button>
              </form>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

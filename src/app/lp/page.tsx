import Link from "next/link";

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

const demoItems = [
  "Riscos priorizados por impacto financeiro",
  "Análise clara de desvios e ineficiências",
  "Plano de ação estruturado e executável",
  "Controle operacional centralizado",
] as const;

export default function LpPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#101828]">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-10">
        <section className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">IronCore ecosystem</div>
          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-[#101828] md:text-6xl">
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
            <Link
              href="/login"
              className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#101828]"
            >
              Falar com especialista
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
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

        <section className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
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

          <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Demonstração</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
              O que você passa a enxergar
            </h2>
            <div className="mt-8 grid gap-3">
              {demoItems.map((item) => (
                <div key={item} className="rounded-[20px] border border-black/5 bg-[#F8FAFC] px-5 py-4 text-sm leading-7 text-[#344054]">
                  {item}
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
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#98A2B3]">Escolha sua entrada</div>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#101828] md:text-4xl">
            Escolha o problema que você precisa resolver
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#475467]">
            Diagnosticar, decidir ou executar. Cada solução ataca um ponto crítico da operação.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/diag/" className="rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white">
              Gerar diagnóstico
            </Link>
            <Link href="/login" className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#101828]">
              Ver plataforma
            </Link>
            <Link href="/cashflow" className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#101828]">
              Conhecer solução
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

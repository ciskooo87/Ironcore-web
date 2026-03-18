import Link from "next/link";

export const metadata = {
  title: "Diagnóstico Financeiro para Consultorias | IronCore",
  description:
    "Transforme planilhas, extratos e histórico financeiro em um diagnóstico executivo claro, rápido e vendável para pequenas consultorias e consultores independentes.",
};

const bullets = [
  "Cadastro simples do cliente e do projeto",
  "Upload das bases históricas principais: faturamento, CAR, CAP, endividamento bancos e FIDC",
  "Relato do contexto do cliente para enriquecer a análise",
  "Normatização automática com conferência humana",
  "Diagnóstico com apoio de IA, validação humana e entrega final",
];

const pains = [
  "Você perde horas consolidando planilhas antes de conseguir analisar.",
  "Cada cliente pede um diagnóstico, mas o processo nunca está realmente padronizado.",
  "Seu trabalho tem valor, mas a entrega final ainda parece artesanal demais.",
  "Você sabe onde estão os riscos, mas demora para transformar isso em narrativa executiva.",
];

const gains = [
  "Reduz o tempo entre receber a base e entregar um diagnóstico apresentável.",
  "Padroniza o método sem engessar sua inteligência consultiva.",
  "Melhora percepção de valor da sua consultoria na apresentação final.",
  "Ajuda você a vender clareza, não só horas de análise.",
];

export default function DiagnosticoLandingPage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="product-hero card !rounded-[28px] !p-8 md:!p-12">
          <div className="max-w-3xl">
            <div className="product-eyebrow inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">
              ironcore diagnóstico
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Pare de entregar análise solta.
              <span className="block text-cyan-300">Entregue diagnóstico que vira decisão.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              O módulo de diagnóstico do IronCore foi desenhado para <strong>donos de pequenas consultorias</strong> e <strong>consultores independentes</strong>
              que precisam transformar base histórica, contexto do cliente e leitura financeira em uma entrega clara, rápida e com cara de produto.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/diag/" className="badge !px-4 !py-2 text-sm">
                Ver o módulo em ação
              </Link>
              <a href="#como-funciona" className="pill !px-4 !py-2 text-sm">
                Como funciona
              </a>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric product-metric">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Para quem</div>
            <div className="mt-2 text-lg font-semibold text-white">Consultorias pequenas</div>
            <p className="mt-2 text-sm text-slate-300">Times enxutos que precisam ganhar escala sem perder profundidade analítica.</p>
          </div>
          <div className="metric product-metric">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Perfil</div>
            <div className="mt-2 text-lg font-semibold text-white">Consultores independentes</div>
            <p className="mt-2 text-sm text-slate-300">Profissionais que querem transformar método próprio em processo replicável.</p>
          </div>
          <div className="metric product-metric">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Resultado</div>
            <div className="mt-2 text-lg font-semibold text-white">Mais velocidade</div>
            <p className="mt-2 text-sm text-slate-300">Menos tempo consolidando base. Mais tempo interpretando e recomendando.</p>
          </div>
          <div className="metric product-metric">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Entrega</div>
            <div className="mt-2 text-lg font-semibold text-white">Tela + documento</div>
            <p className="mt-2 text-sm text-slate-300">Diagnóstico pronto para revisão, validação e apresentação ao cliente.</p>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="section-head">
              <h2 className="title">O problema que essa LP resolve</h2>
              <span className="kpi-chip">dor real</span>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {pains.map((item) => (
                <div key={item} className="row">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h2 className="title">O ganho para a consultoria</h2>
              <span className="kpi-chip">benefício</span>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              {gains.map((item) => (
                <div key={item} className="row">
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mt-10 card">
          <div className="section-head">
            <h2 className="title">Como funciona</h2>
            <span className="kpi-chip">workflow</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm text-slate-300">
            {bullets.map((item, index) => (
              <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Etapa {index + 1}</div>
                <div className="mt-2 font-medium text-white">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card">
            <div className="section-head">
              <h2 className="title">O que você entrega ao cliente</h2>
              <span className="kpi-chip">resultado final</span>
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Em vez de entregar planilhas soltas, observações espalhadas e um parecer improvisado, você entrega um <strong>diagnóstico estruturado</strong>,
                com narrativa executiva, leitura dos pontos de atenção, validação humana e uma saída pronta para apresentação.
              </p>
              <p>
                Isso faz a sua consultoria parecer mais madura, mais confiável e mais difícil de substituir.
              </p>
              <div className="alert muted-bg">
                <strong className="text-white">Resumo:</strong> você continua sendo o cérebro da análise. O IronCore entra para organizar o processo,
                acelerar o caminho e melhorar a qualidade da entrega.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-head">
              <h2 className="title">Chamada final</h2>
              <span className="kpi-chip">cta</span>
            </div>
            <p className="text-sm leading-7 text-slate-300">
              Se você quer parar de vender esforço bruto e começar a vender <strong>diagnóstico com método</strong>, essa é a porta de entrada.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/diag/" className="badge !px-4 !py-3 text-center text-sm">
                Acessar o módulo de diagnóstico
              </Link>
              <div className="trust text-sm text-slate-300">
                Público ideal: consultorias financeiras pequenas, boutiques de diagnóstico, consultores independentes e operadores que precisam transformar análise em produto.
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

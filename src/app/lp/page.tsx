import Link from "next/link";

const FEATURES = [
  {
    title: "Conciliação inteligente",
    desc: "Automatize matching financeiro e trate exceções com fila manual auditável.",
  },
  {
    title: "Operações com painel de risco",
    desc: "Visualize saldo, vencimento, prazo e risco em uma mesa operacional única.",
  },
  {
    title: "Fluxo de caixa com cenários",
    desc: "Antecipe ruptura de caixa e simule opções de ação com custo/impacto estimado.",
  },
  {
    title: "Fechamento executivo",
    desc: "Feche o mês com snapshot versionado e narrativa pronta para diretoria.",
  },
  {
    title: "Auditoria de ponta a ponta",
    desc: "Rastreie decisões, ajustes e entregas com trilha técnica e operacional.",
  },
  {
    title: "Rotina operacional 4x ao dia",
    desc: "Check-ins objetivos para manter foco no que destrava resultado.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Ironcore · Plataforma Operacional Financeira
        </div>

        <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-tight">
          Controle financeiro de ponta a ponta,
          <span className="text-cyan-300"> sem retrabalho</span>.
        </h1>

        <p className="mt-5 max-w-3xl text-slate-300 text-base md:text-lg">
          O Ironcore centraliza cadastro, risco, conciliação, operações, fluxo de caixa,
          fechamento e auditoria em um único sistema. Menos planilha paralela,
          mais previsibilidade, governança e velocidade de decisão.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="badge !text-sm !px-5 !py-2.5">Entrar na plataforma</Link>
          <a href="#modulos" className="pill !text-sm !px-5 !py-2.5">Ver módulos</a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="metric"><div className="text-xs text-slate-400">Módulos integrados</div><div className="mt-1 text-2xl font-semibold">13</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Horizonte de caixa</div><div className="mt-1 text-2xl font-semibold">D+90</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Visão de risco</div><div className="mt-1 text-2xl font-semibold">Tempo real</div></div>
          <div className="metric"><div className="text-xs text-slate-400">Fechamento</div><div className="mt-1 text-2xl font-semibold">Auditável</div></div>
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-6xl px-6 py-10">
        <div className="section-head"><h2 className="title !text-xl">Módulos principais</h2><span className="kpi-chip">Pronto para escalar</span></div>
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="card">
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="text-sm text-slate-300 mt-2">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="card">
          <div className="section-head">
            <h2 className="title !text-xl">Ironcore para decisão rápida</h2>
            <span className="kpi-chip">Execução + Governança</span>
          </div>
          <p className="text-sm md:text-base text-slate-300 mt-2">
            Da operação diária ao fechamento mensal, o foco é simples: transformar dados financeiros em ação.
            Você ganha clareza, reduz risco operacional e mantém um padrão de execução consistente.
          </p>
          <div className="mt-5">
            <Link href="/login" className="badge !text-sm !px-5 !py-2.5">Quero acessar o Ironcore</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

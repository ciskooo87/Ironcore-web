import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/csrf";

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

const TESTIMONIALS = [
  {
    name: "Carlos M.",
    role: "Diretor Financeiro",
    text: "Saímos de operação reativa para gestão previsível. O fechamento mensal ficou muito mais confiável.",
  },
  {
    name: "Renata S.",
    role: "Head de Operações",
    text: "O painel de risco da operação virou nossa mesa de controle diária. Menos ruído, mais ação.",
  },
  {
    name: "Paulo R.",
    role: "Founder",
    text: "A maior diferença foi reduzir retrabalho e ganhar clareza para decidir rápido.",
  },
];

const PRICING = [
  { name: "Starter", price: "R$ 1.990/mês", desc: "Para operações em estruturação", items: ["Até 2 projetos", "Conciliação + rotina diária", "Dashboard executivo"] },
  { name: "Growth", price: "R$ 4.990/mês", desc: "Para operação com escala", items: ["Até 8 projetos", "Risco + fechamento mensal", "Auditoria e trilha completa"] },
  { name: "Enterprise", price: "Sob consulta", desc: "Para governança avançada", items: ["Projetos ilimitados", "Customizações e integrações", "SLA e suporte dedicado"] },
];

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const query = await searchParams;
  const csrf = await ensureCsrfCookie();

  return (
    <main className="min-h-screen text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Ironcore · Plataforma Operacional Financeira
        </div>

        <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-tight">
          Pare de apagar incêndio financeiro.
          <span className="text-cyan-300"> Comece a operar com previsibilidade.</span>
        </h1>

        <p className="mt-5 max-w-3xl text-slate-300 text-base md:text-lg">
          O Ironcore transforma rotina financeira em execução controlada: risco, conciliação, operação,
          caixa, fechamento e auditoria no mesmo fluxo. Você decide mais rápido, com menos retrabalho e mais margem.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#lead" className="badge !text-sm !px-5 !py-2.5">Quero uma demonstração</a>
          <Link href="/login" className="pill !text-sm !px-5 !py-2.5">Entrar na plataforma</Link>
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

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="section-head"><h2 className="title !text-xl">Depoimentos</h2><span className="kpi-chip">Resultados reais</span></div>
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="card">
              <p className="text-sm text-slate-200">“{t.text}”</p>
              <div className="mt-4 text-xs text-slate-400">{t.name} · {t.role}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="section-head"><h2 className="title !text-xl">Planos</h2><span className="kpi-chip">Placeholder comercial</span></div>
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          {PRICING.map((p) => (
            <article key={p.name} className="card">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <div className="text-cyan-300 font-semibold mt-1">{p.price}</div>
              <p className="text-sm text-slate-300 mt-2">{p.desc}</p>
              <ul className="mt-3 text-sm text-slate-300 space-y-1">
                {p.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="lead" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="card">
          <div className="section-head">
            <h2 className="title !text-xl">Fale com a gente</h2>
            <span className="kpi-chip">Contato / Lead</span>
          </div>
          <p className="text-sm md:text-base text-slate-300 mt-2">Quer ver o Ironcore rodando no seu cenário? Deixa seus dados e retornamos com uma demonstração objetiva.</p>

          {query.lead === "ok" ? <div className="alert ok-bg mt-3">Lead recebido com sucesso. Vamos entrar em contato.</div> : null}
          {query.lead === "required" ? <div className="alert bad-bg mt-3">Preencha nome e email.</div> : null}
          {query.lead === "csrf" ? <div className="alert bad-bg mt-3">Sessão expirada. Atualize a página e tente novamente.</div> : null}
          {query.lead === "error" ? <div className="alert bad-bg mt-3">Falha ao enviar agora. Tente novamente.</div> : null}

          <form action="/api/lead" method="post" className="grid md:grid-cols-2 gap-2 mt-4 text-sm">
            <input type="hidden" name="csrf_token" value={csrf} />
            <input name="name" required placeholder="Seu nome" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="email" type="email" required placeholder="Seu email" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="company" placeholder="Empresa" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="phone" placeholder="WhatsApp / Telefone" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <textarea name="message" placeholder="Contexto rápido do seu desafio" className="md:col-span-2 min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 cursor-pointer md:col-span-2">Quero minha demo</button>
          </form>
        </div>
      </section>
    </main>
  );
}

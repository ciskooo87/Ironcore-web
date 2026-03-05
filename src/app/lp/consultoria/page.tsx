import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/csrf";

const PRICING = [
  { name: "Starter", setup: "R$ 6.000", monthly: "R$ 1.490/mês", add: "R$ 250/projeto", items: ["Até 3 projetos", "IA para triagem e risco", "Conciliação + caixa"] },
  { name: "Growth", setup: "R$ 10.000", monthly: "R$ 2.990/mês", add: "R$ 220/projeto", items: ["Até 10 projetos", "IA para insights operacionais", "Fechamento + auditoria"] },
  { name: "Scale", setup: "R$ 15.000", monthly: "R$ 4.990/mês", add: "Blocos customizados", items: ["Até 25 projetos", "IA avançada + automações", "SLA prioritário"] },
];

export default async function LpConsultoriaPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const query = await searchParams;
  const csrf = await ensureCsrfCookie();

  return (
    <main className="min-h-screen text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">Ironcore para Consultorias</div>
        <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-tight">Escalone sua consultoria com <span className="text-cyan-300">IA operacional</span>.</h1>
        <p className="mt-5 max-w-3xl text-slate-300 text-base md:text-lg">Padronize entrega, acelere análise e transforme operações financeiras em produto recorrente. Com IA no fluxo, você ganha produtividade sem perder governança.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#lead" className="badge !text-sm !px-5 !py-2.5">Quero levar para minha consultoria</a>
          <Link href="/lp" className="pill !text-sm !px-5 !py-2.5">Trocar perfil</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="section-head"><h2 className="title !text-xl">Modelo comercial</h2><span className="kpi-chip">Setup + recorrência + expansão</span></div>
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          {PRICING.map((p) => (
            <article key={p.name} className="card">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <div className="mt-2 text-sm text-slate-300">Implementação: <b>{p.setup}</b></div>
              <div className="text-sm text-slate-300">Mensal: <b>{p.monthly}</b></div>
              <div className="text-sm text-slate-300">Novo projeto: <b>{p.add}</b></div>
              <ul className="mt-3 text-sm text-slate-300 space-y-1">{p.items.map((i) => <li key={i}>• {i}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section id="lead" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="card">
          <div className="section-head"><h2 className="title !text-xl">Agendar demonstração</h2><span className="kpi-chip">Consultoria</span></div>
          {query.lead === "ok" ? <div className="alert ok-bg mt-3">Lead recebido com sucesso.</div> : null}
          {query.lead && query.lead !== "ok" ? <div className="alert bad-bg mt-3">Não foi possível enviar. Tente novamente.</div> : null}
          <form action="/api/lead" method="post" className="grid md:grid-cols-2 gap-2 mt-4 text-sm">
            <input type="hidden" name="csrf_token" value={csrf} />
            <input type="hidden" name="segment" value="consultoria" />
            <input name="name" required placeholder="Seu nome" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="email" type="email" required placeholder="Seu email" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="company" placeholder="Consultoria" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="phone" placeholder="WhatsApp" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <textarea name="message" placeholder="Quantos projetos você gerencia hoje?" className="md:col-span-2 min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 cursor-pointer md:col-span-2">Quero escalar minha consultoria</button>
          </form>
        </div>
      </section>
    </main>
  );
}

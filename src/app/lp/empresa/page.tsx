import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/csrf";

const PRICING = [
  { name: "Essencial", setup: "R$ 2.500/projeto", monthly: "R$ 1.200/mês", add: "R$ 1.500 novo projeto", items: ["Operação básica com IA", "Conciliação e caixa", "Relatório executivo"] },
  { name: "Profissional", setup: "R$ 4.500/projeto", monthly: "R$ 2.400/mês", add: "R$ 2.000 novo projeto", items: ["IA com priorização de risco", "Fechamento mensal assistido", "Painel operacional completo"] },
  { name: "Premium", setup: "R$ 7.500/projeto", monthly: "R$ 4.000/mês", add: "R$ 3.000 novo projeto", items: ["IA intensiva para decisão", "Auditoria + governança avançada", "Acompanhamento dedicado"] },
];

export default async function LpEmpresaPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const query = await searchParams;
  const csrf = await ensureCsrfCookie();

  return (
    <main className="min-h-screen text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">Ironcore para Empresas</div>
        <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-tight">Sua operação financeira com <span className="text-cyan-300">IA no centro da decisão</span>.</h1>
        <p className="mt-5 max-w-3xl text-slate-300 text-base md:text-lg">Transforme dados dispersos em ação diária. O Ironcore usa IA para detectar risco, acelerar conciliação, orientar caixa e apoiar fechamento com confiança.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#lead" className="badge !text-sm !px-5 !py-2.5">Quero usar na minha empresa</a>
          <Link href="/lp" className="pill !text-sm !px-5 !py-2.5">Trocar perfil</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="section-head"><h2 className="title !text-xl">Modelo comercial</h2><span className="kpi-chip">Ferramenta + implantação</span></div>
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
          <div className="section-head"><h2 className="title !text-xl">Agendar demonstração</h2><span className="kpi-chip">Empresa</span></div>
          {query.lead === "ok" ? <div className="alert ok-bg mt-3">Lead recebido com sucesso.</div> : null}
          {query.lead && query.lead !== "ok" ? <div className="alert bad-bg mt-3">Não foi possível enviar. Tente novamente.</div> : null}
          <form action="/api/lead" method="post" className="grid md:grid-cols-2 gap-2 mt-4 text-sm">
            <input type="hidden" name="csrf_token" value={csrf} />
            <input type="hidden" name="segment" value="empresa" />
            <input name="name" required placeholder="Seu nome" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="email" type="email" required placeholder="Seu email" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="company" placeholder="Empresa" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="phone" placeholder="WhatsApp" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <textarea name="message" placeholder="Qual principal gargalo financeiro hoje?" className="md:col-span-2 min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 cursor-pointer md:col-span-2">Quero IA na operação financeira</button>
          </form>
        </div>
      </section>
    </main>
  );
}

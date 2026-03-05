import Link from "next/link";

export default function LpChooserPage() {
  return (
    <main className="min-h-screen text-slate-100">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
          Ironcore · Escolha seu perfil
        </div>
        <h1 className="mt-5 text-4xl md:text-5xl font-semibold leading-tight">
          Como você quer usar o <span className="text-cyan-300">Ironcore</span>?
        </h1>
        <p className="mt-4 text-slate-300 max-w-3xl">
          Selecione a jornada ideal para ver proposta comercial, benefícios e plano recomendado com IA.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <article className="card">
            <div className="kpi-chip">Para consultorias</div>
            <h2 className="mt-3 text-2xl font-semibold">Quero vender o Ironcore para meus clientes</h2>
            <p className="mt-2 text-slate-300 text-sm">
              Padronize operação, acelere entregas e use IA para reduzir retrabalho e aumentar margem da consultoria.
            </p>
            <div className="mt-5">
              <Link href="/lp/consultoria" className="badge !text-sm !px-5 !py-2.5">Ver oferta para Consultoria</Link>
            </div>
          </article>

          <article className="card">
            <div className="kpi-chip">Para empresas</div>
            <h2 className="mt-3 text-2xl font-semibold">Quero o Ironcore como ferramenta operacional</h2>
            <p className="mt-2 text-slate-300 text-sm">
              Tenha controle financeiro com IA aplicada ao dia a dia: risco, conciliação, caixa e fechamento no mesmo fluxo.
            </p>
            <div className="mt-5">
              <Link href="/lp/empresa" className="badge !text-sm !px-5 !py-2.5">Ver oferta para Empresa</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

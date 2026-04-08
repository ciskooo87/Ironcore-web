import Link from "next/link";
import Image from "next/image";

const modules = [
  {
    title: "Dashboard executivo",
    description: "Visão consolidada de saldo, entradas, saídas e leitura inicial de caixa.",
    href: "https://github.com/ciskooo87/ironsaas_cashflow",
    cta: "Ver base do produto",
  },
  {
    title: "Contas",
    description: "Estrutura de contas de caixa e banco com saldo atualizado por conta.",
    href: "https://github.com/ciskooo87/ironsaas_cashflow/tree/main/frontend/src/app/contas",
    cta: "Ver módulo",
  },
  {
    title: "Categorias",
    description: "Classificação base para organizar lançamentos e preparar o DFC automático.",
    href: "https://github.com/ciskooo87/ironsaas_cashflow/tree/main/frontend/src/app/categorias",
    cta: "Ver módulo",
  },
  {
    title: "Lançamentos",
    description: "Entrada e saída financeiras com estrutura pronta para evolução operacional.",
    href: "https://github.com/ciskooo87/ironsaas_cashflow/tree/main/frontend/src/app/lancamentos",
    cta: "Ver módulo",
  },
];

export default function CashflowPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#101828]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_35%),linear-gradient(180deg,#FFFFFF_0%,#F7F8FA_58%,#F7F8FA_100%)]" />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:px-10">
        <div className="rounded-[32px] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-[#F8FAFC]">
                <Image src="/brand/ironcore-mark.webp" alt="IronCore" width={30} height={30} className="h-8 w-8 object-contain" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#98A2B3]">IronSaaS Cashflow</div>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#101828] md:text-6xl">Controle de saldo, lançamentos e DFC com base pronta para escala.</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-[#667085] md:text-lg">Primeiro produto do IronSaaS. A base do Sprint A já está estruturada, versionada e pronta para virar MVP operacional com autenticação, contas, categorias, lançamentos e saldo por conta.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="https://github.com/ciskooo87/ironsaas_cashflow" target="_blank" className="inline-flex items-center justify-center rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]">Abrir repositório</a>
              <Link href="/ironsaas" className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#344054] transition hover:border-black/15 hover:text-[#111827]">Voltar para IronSaaS</Link>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <div key={module.title} className="rounded-[26px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Sprint A</div>
              <h2 className="mt-3 text-xl font-semibold leading-7 text-[#101828]">{module.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#475467]">{module.description}</p>
              <a href={module.href} target="_blank" className="mt-5 inline-flex items-center justify-center rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#344054] transition hover:border-black/15 hover:bg-white hover:text-[#111827]">{module.cta}</a>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Entregue até agora</div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#475467]">
              <li>Auth base com login e leitura do usuário atual</li>
              <li>Modelos de empresa, usuário, conta, categoria e lançamento</li>
              <li>Motor de saldo por conta</li>
              <li>Migrations iniciais com Alembic</li>
              <li>Seed de ambiente demo</li>
              <li>Frontend inicial para dashboard, contas, categorias e lançamentos</li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-[#0F172A] p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] md:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Próximo passo</div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">Fechar o fluxo operacional do Sprint A</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/82">
              <li>Conectar frontend e backend com autenticação real</li>
              <li>Persistir token e proteger o fluxo operacional</li>
              <li>Criar formulários de contas, categorias e lançamentos</li>
              <li>Preparar upload de comprovantes</li>
              <li>Levar a base para um MVP de operação diária</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

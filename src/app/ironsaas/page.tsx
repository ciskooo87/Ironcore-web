import Image from "next/image";
import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/csrf";

const painPoints = [
  "controles espalhados",
  "versões conflitantes",
  "dependência de pessoas",
  "retrabalho constante",
  "risco operacional invisível",
];

const features = [
  "transforma planilhas em aplicações web",
  "automatiza fluxos operacionais",
  "centraliza dados e elimina versões",
  "cria lógica, validações e controles",
  "organiza histórico e rastreabilidade",
];

const proofItems = [
  "Rotinas financeiras antes dispersas passaram a operar em fluxo único, com validação e histórico centralizado.",
  "Processos comerciais deixaram de depender de versões paralelas e ganharam leitura única de metas e execução.",
  "Consultorias conseguiram padronizar entrega e operar com mais escala sem aumentar retrabalho manual.",
];

const steps = [
  { step: "01", title: "Entendimento do processo", description: "Mapeamento do fluxo atual, da planilha, da rotina e das regras que hoje travam a execução." },
  { step: "02", title: "Estruturação lógica", description: "Evolução operacional em regras, validações, estrutura de dados e lógica operacional de sistema." },
  { step: "03", title: "Construção do SaaS", description: "Aplicação online pronta para uso, com acesso centralizado, histórico e controle real da operação." },
  { step: "04", title: "Operação contínua", description: "Evolução, ajustes e suporte para o sistema crescer junto com a complexidade do processo." },
];

const useCases = [
  { title: "Gestão financeira", items: ["controle de contas", "fluxo de caixa", "conciliação"] },
  { title: "Operações comerciais", items: ["acompanhamento de vendas", "metas e performance"] },
  { title: "Rotinas administrativas", items: ["controle de processos internos", "validações e aprovações"] },
  { title: "Consultorias", items: ["padronização de entregas", "dashboards estruturados", "ganho de escala"] },
];

const audiences = [
  "Profissionais de gestão que já sabem o processo, mas estão presos na execução",
  "Financeiro / controladoria que vivem reféns de planilhas",
  "Consultorias que precisam escalar sem perder padrão",
];

const differentiators = [
  { title: "Sob medida sem ser caro", description: "Você não entra em um sistema. O sistema é construído para o seu processo." },
  { title: "Rápido de implementar", description: "Sem projetos longos, sem ERP pesado e sem meses de espera para capturar valor." },
  { title: "Foco operacional", description: "Resolve o dia a dia da execução — não só a camada de análise." },
  { title: "Escalável", description: "Começa em um processo e cresce junto com a operação." },
];

function SectionTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={[
      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
      dark ? "border border-white/12 bg-white/8 text-white/72" : "border border-[rgba(16,24,40,0.08)] bg-white text-[#667085] shadow-[0_8px_24px_rgba(15,23,42,0.04)]",
    ].join(" ")}>
      {children}
    </div>
  );
}

export default async function IronSaaSPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const query = await searchParams;
  const csrf = await ensureCsrfCookie();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F7F8FA] text-[#0F172A]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08),transparent_38%),radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_28%),linear-gradient(180deg,#FFFFFF_0%,#F7F8FA_58%,#F7F8FA_100%)]" />

      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[rgba(247,248,250,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
              <Image src="/brand/ironcore-mark.webp" alt="IronCore" width={28} height={28} className="h-9 w-9 object-contain" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-[0.08em] text-[#111827]">IRONSAAS</div>
              <div className="truncate text-xs text-[#667085]">Software para operação real · por IronCore</div>
            </div>
          </div>

          <div className="hidden items-center gap-7 text-sm text-[#475467] lg:flex">
            <a href="#como-funciona" className="transition hover:text-[#111827]">Método</a>
            <a href="#casos" className="transition hover:text-[#111827]">Onde aplica</a>
            <a href="#demo" className="transition hover:text-[#111827]">Demonstração</a>
          </div>

          <a href="#demo" className="inline-flex flex-none items-center justify-center rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111827] md:px-5">
            Agendar demonstração
          </a>
        </div>
      </nav>

      <section className="px-4 pb-14 pt-8 md:px-8 md:pb-24 md:pt-12 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <SectionTag>Ecossistema IronCore</SectionTag>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#101828] sm:text-5xl md:text-6xl lg:text-7xl">
              Saia da planilha. Leve sua operação para o nível SaaS.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#475467] sm:text-lg md:text-xl">
              O IronSaaS transforma rotinas de gestão e financeiro em sistemas online, automatizados e escaláveis — sem depender de Excel, sem retrabalho, sem perda de controle.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-xl bg-[#0F172A] px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#111827]">
                Ver como funciona
              </a>
              <a href="#demo" className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-7 py-4 text-sm font-semibold text-[#344054] transition hover:border-black/15 hover:text-[#111827]">
                Agendar demonstração
              </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[["SaaS", "processo transformado em sistema"], ["sem Excel", "menos retrabalho e menos risco"], ["escala", "crescimento sem inflar equipe"]].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <div className="text-2xl font-semibold tracking-[-0.03em] text-[#101828]">{value}</div>
                  <div className="mt-1 text-sm leading-6 text-[#667085]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-3 top-10 hidden h-24 w-24 rounded-full bg-[#E2E8F0] blur-3xl md:block" />
            <div className="absolute -right-4 bottom-16 hidden h-24 w-24 rounded-full bg-[#CBD5E1] blur-3xl md:block" />
            <div className="relative overflow-hidden rounded-[30px] border border-black/5 bg-white p-4 shadow-[0_28px_90px_rgba(15,23,42,0.10)] sm:p-5 md:p-7">
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(248,250,252,0))]" />
              <div className="relative rounded-[26px] border border-black/5 bg-[#F8FAFC] p-5 sm:p-6">
                <div className="flex flex-col gap-4 border-b border-black/5 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Visão do produto</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#101828]">Processo transformado em sistema</h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-[#667085]">Fluxo centralizado, regras validadas, histórico salvo e execução menos dependente de planilhas ou pessoas-chave.</p>
                  </div>
                  <div className="flex items-center gap-3 self-start rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <Image src="/brand/ironcore-mark.webp" alt="Marca IronCore" width={44} height={44} className="h-12 w-12 rounded-xl object-contain p-0.5" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">Aplicação</div>
                      <div className="text-sm font-semibold text-[#101828]">Pronta para operar</div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[["Fluxo", "Regras e validações em ambiente online"], ["Controle", "Histórico, rastreabilidade e versões únicas"], ["Escala", "Mais execução com menos operação manual"]].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#98A2B3]">{label}</div>
                      <div className="mt-2 text-sm font-medium leading-6 text-[#101828]">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
                  <div className="rounded-2xl border border-[#D0D5DD] bg-[#FCFCFD] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">Evolução operacional</div>
                      <div className="rounded-full bg-[#ECFDF3] px-3 py-1 text-[11px] font-semibold text-[#027A48]">Online</div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {[["Antes", "Planilhas, retrabalho e controles soltos"], ["Depois", "Sistema único com lógica e validações"], ["Resultado operacional", "Mais velocidade, menos risco operacional"]].map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-white px-4 py-3">
                          <div className="text-sm font-medium text-[#101828]">{label}</div>
                          <div className="mt-1 text-sm leading-6 text-[#667085]">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#0F172A] p-5 text-white shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Efeito prático</div>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-white/88">
                      <li>Menos operação manual</li>
                      <li>Mais controle e rastreabilidade</li>
                      <li>Mais velocidade para crescer</li>
                    </ul>
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/72">Você traz o processo. A IronCore transforma em sistema real.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Contexto</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Sua operação roda em planilha. E isso está te travando.</h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[#475467]">Quando o processo cresce, a planilha deixa de organizar e passa a limitar. O problema não é só produtividade — é perda de controle, dependência operacional e dificuldade de escalar com segurança.</p>
              <div className="mt-8 rounded-[24px] border border-black/5 bg-[#0F172A] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Leitura prática</div>
                <p className="mt-3 text-base leading-8 text-white/82">Excel resolve no começo. Depois, vira gargalo operacional.</p>
              </div>
            </div>
            <div>
              <div className="grid gap-4 md:grid-cols-2">
                {painPoints.map((item, index) => (
                  <div key={item} className="rounded-[24px] border border-black/5 bg-[#F8FAFC] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Ponto crítico {String(index + 1).padStart(2, '0')}</div>
                    <p className="mt-4 text-lg font-semibold leading-7 text-[#101828]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[24px] border border-black/5 bg-[#F8FAFC] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Consequência</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {['você perde tempo','perde controle','perde escala'].map((item)=> <div key={item} className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-[#101828]">{item}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Proposta</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">IronSaaS: da planilha para um sistema real</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#475467]">O IronSaaS é o braço da IronCore que transforma rotinas operacionais em software. Sem rebuild complexo. Sem ERP pesado. Sem meses de projeto.</p>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[#475467]">Você traz o processo. Nós transformamos em sistema.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((item)=><div key={item} className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"><div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">IronSaaS faz</div><p className="mt-4 text-base font-medium leading-7 text-[#101828]">{item}</p></div>)}
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">{['menos operação manual','mais controle','mais velocidade'].map((item)=><div key={item} className="rounded-2xl bg-[#F8FAFC] p-5 text-base font-medium text-[#101828]">{item}</div>)}</div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Aplicações na prática</SectionTag>
          <div className="mt-6 grid gap-4 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">O ganho aparece quando a operação deixa de depender de versão, pessoa e improviso.</h2>
              <p className="mt-6 max-w-lg text-lg leading-8 text-[#475467]">Ainda sem expor clientes, já ancoramos a prova na transformação operacional que o IronSaaS gera no dia a dia.</p>
            </div>
            <div className="grid gap-4">
              {proofItems.map((item, index)=> <div key={item} className="rounded-2xl border border-black/5 bg-[#F8FAFC] p-6"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">Caso de uso {index+1}</div><p className="mt-3 text-base leading-7 text-[#101828]">{item}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-black/5 bg-[#FCFCFD] px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Método</SectionTag>
          <div className="mt-6 flex max-w-3xl flex-col gap-4">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Um processo simples para transformar rotina em sistema.</h2>
            <p className="text-lg leading-8 text-[#475467]">O objetivo é sair da planilha e colocar a operação num ambiente online, controlado e escalável.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-4">{steps.map((item)=><div key={item.step} className="rounded-[24px] border border-black/5 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.04)]"><div className="text-sm font-semibold tracking-[0.18em] text-[#98A2B3]">{item.step}</div><h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-[#101828]">{item.title}</h3><p className="mt-4 text-base leading-7 text-[#475467]">{item.description}</p></div>)}</div>
        </div>
      </section>

      <section id="casos" className="px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Onde aplica</SectionTag>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{useCases.map((item)=><div key={item.title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"><p className="text-base font-semibold leading-7 text-[#101828]">{item.title}</p><ul className="mt-4 space-y-2 text-sm leading-7 text-[#667085]">{item.items.map((sub)=><li key={sub}>{sub}</li>)}</ul></div>)}</div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Resultado operacional</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div><h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Menos planilha. Mais resultado.</h2><p className="mt-6 max-w-lg text-lg leading-8 text-[#475467]">Você não precisa trabalhar mais. Precisa de um sistema melhor.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">{['reduzir tempo operacional','eliminar erros manuais','ganhar visibilidade real','escalar processos sem aumentar equipe'].map((item)=><div key={item} className="rounded-2xl bg-[#F8FAFC] p-6"><p className="text-base font-medium leading-7 text-[#101828]">{item}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section id="para-quem" className="px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Perfil ideal</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.88fr_1.12fr]"><div><h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Para quem sabe o processo, mas não quer mais operar no improviso.</h2></div><div className="grid gap-4">{audiences.map((item)=><div key={item} className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)]"><p className="text-base font-medium leading-7 text-[#101828]">{item}</p></div>)}</div></div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Por que funciona</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"><div><h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Não é software genérico. É software do seu processo.</h2></div><div className="grid gap-4 sm:grid-cols-2">{differentiators.map((item)=><div key={item.title} className="rounded-2xl bg-[#F8FAFC] p-6"><p className="text-base font-semibold leading-7 text-[#101828]">{item.title}</p><p className="mt-3 text-sm leading-7 text-[#667085]">{item.description}</p></div>)}</div></div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-black/5 bg-[#0F172A] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:px-10 md:py-12">
          <SectionTag dark>Origem</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div><h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">Construído por quem entende operação de verdade</h2><p className="mt-6 max-w-lg text-lg leading-8 text-white/72">O IronSaaS nasce dentro da IronCore. Ou seja: não é só tecnologia. É gestão aplicada. É experiência real de operação. E vive dentro do ecossistema principal da IronCore em ironcore.lat.</p></div>
            <div className="grid gap-4">{['não é só tecnologia','é gestão aplicada','é experiência real de operação'].map((item)=><div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"><p className="text-base font-medium leading-7 text-white">{item}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-[#FCFCFD] px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionTag>Pergunta recorrente</SectionTag>
          <div className="mt-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"><div><h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Isso substitui meu ERP?</h2></div><div className="rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"><p className="text-lg leading-8 text-[#475467]">Não. O IronSaaS complementa o que você já tem. Ele resolve exatamente aquilo que o ERP não resolve: a operação real, o controle fino e o fluxo do dia a dia.</p></div></div>
        </div>
      </section>

      <section id="demo" className="px-4 py-16 md:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <SectionTag>Agendar demonstração</SectionTag>
            <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101828] md:text-5xl">Veja um processo seu funcionando como sistema.</h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#475467]">Preencha o formulário e a IronCore agenda uma conversa para entender o processo, avaliar aderência e mostrar como a transformação funciona na prática.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm leading-7 text-[#101828]">conversa objetiva sobre o processo</div>
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm leading-7 text-[#101828]">avaliação rápida de aderência</div>
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm leading-7 text-[#101828]">sem compromisso técnico prévio</div>
              <div className="rounded-2xl bg-[#F8FAFC] p-5 text-sm leading-7 text-[#101828]">próximo passo claro para demo</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
            {query.lead === 'ok' ? <div className="rounded-2xl border border-[#ABEFC6] bg-[#ECFDF3] px-4 py-3 text-sm text-[#027A48]">Demonstração solicitada com sucesso.</div> : null}
            {query.lead && query.lead !== 'ok' ? <div className="rounded-2xl border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">Não foi possível enviar agora. Tente novamente.</div> : null}
            <form action="/api/lead" method="post" className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="csrf_token" value={csrf} />
              <input type="hidden" name="segment" value="ironsaas" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="name" required placeholder="Seu nome" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 text-[#101828] placeholder:text-[#98A2B3]" />
                <input name="email" type="email" required placeholder="Seu email" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 text-[#101828] placeholder:text-[#98A2B3]" />
                <input name="company" placeholder="Empresa" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 text-[#101828] placeholder:text-[#98A2B3]" />
                <input name="phone" placeholder="WhatsApp" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 text-[#101828] placeholder:text-[#98A2B3]" />
              </div>
              <textarea name="message" placeholder="Qual processo você quer transformar em sistema?" className="min-h-28 rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3 text-[#101828] placeholder:text-[#98A2B3]" />
              <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-[#0F172A] px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#111827]">Agendar demonstração</button>
            </form>
          </div>
        </div>
      </section>

      
    </main>
  );
}

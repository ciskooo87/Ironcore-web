import Link from "next/link";

const cards = [
  ["Saldo consolidado", "R$ 12.500"],
  ["Fluxo líquido", "R$ 3.250"],
  ["Entradas", "R$ 4.500"],
  ["Saídas", "R$ 1.250"],
] as const;

const alerts = [
  ["Risco projetado de liquidez", "A projeção ainda exige atenção porque o consumo médio diário pressiona o saldo ao longo da janela.", "Priorizar disciplina de caixa, revisar saídas previsíveis e preparar reação antes de ruptura."],
  ["Concentração operacional", "A leitura do período ainda depende de poucos lançamentos relevantes, o que amplia volatilidade na análise.", "Aumentar cobertura da base operacional e revisar recorrências para melhorar previsibilidade."],
] as const;

const projection = [
  ["Dia 1", "R$ 12.415"],
  ["Dia 2", "R$ 12.330"],
  ["Dia 3", "R$ 12.245"],
  ["Dia 4", "R$ 12.160"],
  ["Dia 5", "R$ 12.075"],
  ["Dia 6", "R$ 11.990"],
  ["Dia 7", "R$ 11.905"],
] as const;

export default function CashflowDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="text-sm font-semibold text-[#B54708]">Saúde do caixa: Observação</div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value]) => (
          <div key={title} className="rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">{title}</div>
            <div className="mt-3 text-3xl font-semibold text-[#101828]">{value}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Leitura operacional</div>
            <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-[#475467]">
              <div><strong className="block text-[#101828]">Lançamentos</strong>2</div>
              <div><strong className="block text-[#101828]">Ticket médio de entrada</strong>R$ 4.500</div>
              <div><strong className="block text-[#101828]">Ticket médio de saída</strong>R$ 1.250</div>
            </div>
            <div className="mt-4 rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#475467]">
              O período observado ainda fecha positivo, mas a projeção mostra deterioração gradual. O foco executivo aqui é proteger caixa e aumentar previsibilidade operacional.
            </div>
          </section>

          <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">DFC</div>
            <div className="mt-4 grid gap-4 text-sm text-[#475467] md:grid-cols-3">
              <div><strong className="block text-[#101828]">Operacional líquido</strong>R$ 3.250</div>
              <div><strong className="block text-[#101828]">Investimento líquido</strong>R$ 0</div>
              <div><strong className="block text-[#101828]">Financiamento líquido</strong>R$ 0</div>
            </div>
            <div className="mt-4 font-semibold text-[#101828]">Geração líquida de caixa: R$ 3.250</div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Projeção de caixa</div>
            <div className="mt-3 space-y-2 text-sm text-[#475467]">
              <div>Risco de liquidez: <strong className="text-[#B54708]">Médio</strong></div>
              <div>Saldo atual: <strong className="text-[#101828]">R$ 12.500</strong></div>
              <div>Média diária de entradas: <strong className="text-[#101828]">R$ 150</strong></div>
              <div>Média diária de saídas: <strong className="text-[#101828]">R$ 235</strong></div>
            </div>
            <div className="mt-4 rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3 text-sm leading-7 text-[#475467]">Pior saldo projetado na janela inicial: <strong className="text-[#101828]">R$ 11.905</strong>.</div>
            <div className="mt-4 grid gap-2 text-sm text-[#475467]">
              {projection.map(([day, value]) => (
                <div key={day} className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-3 py-2">
                  <span>{day}</span>
                  <strong className="text-[#101828]">{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Prioridades</div>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-[#101828]">
              <Link href="/cashflow/lancamentos/novo" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Registrar nova movimentação</Link>
              <Link href="/cashflow/recorrencias" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Revisar recorrências</Link>
              <Link href="/cashflow/categorias" className="rounded-xl border border-black/10 bg-[#F8FAFC] px-4 py-3">Ajustar classificação</Link>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Alertas</div>
        <div className="mt-4 grid gap-3">
          {alerts.map(([title, desc, rec]) => (
            <div key={title} className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-4">
              <div className="font-semibold text-[#101828]">{title}</div>
              <div className="mt-2 text-sm leading-7 text-[#475467]">{desc}</div>
              <div className="mt-2 text-sm leading-7 text-[#101828]">{rec}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

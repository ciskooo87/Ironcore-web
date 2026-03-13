import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { listOperations, OPERATION_STATUS_FLOW, type OperationStatus } from "@/lib/operations";
import { todayInSaoPauloISO } from "@/lib/time";
import { ensureCsrfCookie } from "@/lib/csrf";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_CLASS: Record<OperationStatus, string> = {
  em_elaboracao: "text-slate-200",
  em_correcao: "text-amber-300",
  pendente_aprovacao: "text-cyan-300",
  aprovada: "text-emerald-300",
  em_correcao_formalizacao: "text-orange-300",
  pendente_formalizacao: "text-violet-300",
  formalizada: "text-green-300",
  cancelada: "text-rose-300",
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; q?: string; op_type?: string; status?: string; risk?: string; operator?: string; from?: string; to?: string; page?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Operações"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Operações"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Operações"><div className="alert bad-bg">Onboarding incompleto. Conclua o Cadastro antes de registrar operações.</div></AppShell>;

  const all = await listOperations(project.id, 500);
  const csrf = await ensureCsrfCookie();

  const q = (query.q || "").trim().toLowerCase();
  const opTypeFilter = (query.op_type || "").trim();
  const statusFilter = (query.status || "").trim();
  const riskFilter = (query.risk || "").trim();
  const operatorFilter = (query.operator || "").trim().toLowerCase();
  const from = (query.from || "").trim();
  const to = (query.to || "").trim();
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = 12;

  const operators = Array.from(new Set(all.map((o) => o.operator_name).filter(Boolean) as string[])).sort();

  const filtered = all.filter((o) => {
    if (q) {
      const blob = [o.id, o.notes, o.counterparty_name, o.fund_name, o.document_ref, o.operator_name, o.modality].filter(Boolean).join(" ").toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (opTypeFilter && o.op_type !== opTypeFilter) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    if (riskFilter && o.risk_level !== riskFilter) return false;
    if (operatorFilter && (o.operator_name || "").toLowerCase() !== operatorFilter) return false;
    if (from && o.business_date < from) return false;
    if (to && o.business_date > to) return false;
    return true;
  });

  const totals = {
    bruto: filtered.reduce((s, o) => s + Number(o.gross_amount || 0), 0),
    liquido: filtered.reduce((s, o) => s + Number(o.net_amount || 0), 0),
    empresa: filtered.reduce((s, o) => s + Number(o.company_fee || 0), 0),
  };

  const byStatus = OPERATION_STATUS_FLOW.map((s) => ({ ...s, count: filtered.filter((o) => o.status === s.value).length }));
  const pendingApproval = filtered.filter((o) => ["pendente_aprovacao", "pendente_formalizacao", "em_correcao_formalizacao"].includes(o.status)).length;
  const formalized = filtered.filter((o) => o.status === "formalizada").length;
  const highRisk = filtered.filter((o) => o.risk_level === "alto").length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <AppShell user={user} title="Projeto · Operações" subtitle="Carteira operacional com leitura de fila, risco e andamento da esteira">
      <ProductHero
        eyebrow="esteira operacional"
        title="Operações precisam parecer carteira viva, não tabela fria."
        description="A tela agora organiza criação, leitura de fila, filtros e carteira com uma lógica mais executiva: o que está travando, o que está andando e o que já foi formalizado."
      >
        <StatusPill label={`Pendentes: ${pendingApproval}`} tone={pendingApproval > 0 ? "warn" : "good"} />
        <StatusPill label={`Risco alto: ${highRisk}`} tone={highRisk > 0 ? "bad" : "good"} />
        <StatusPill label={`Formalizadas: ${formalized}`} tone="info" />
      </ProductHero>

      {query.saved ? <div className="alert ok-bg mb-4">Operação atualizada/registrada.</div> : null}
      {query.error ? <div className="alert bad-bg mb-4">Não foi possível salvar a operação agora. Revise os campos obrigatórios e tente novamente.</div> : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Leitura da esteira</h2><span className="kpi-chip">macro da carteira</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Valor bruto</div><div className="mt-1 font-medium text-white">{brl(totals.bruto)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Valor líquido</div><div className="mt-1 font-medium text-white">{brl(totals.liquido)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Empresa / custo</div><div className="mt-1 font-medium text-white">{brl(totals.empresa)}</div></div>
            <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Registros</div><div className="mt-1 font-medium text-white">{filtered.length}</div></div>
          </div>

          <div className="mt-4 grid md:grid-cols-4 gap-3">
            {byStatus.map((item) => (
              <div key={item.value} className="metric">
                <div className="text-xs text-slate-400">{item.label}</div>
                <div className={`text-lg font-semibold mt-1 ${STATUS_CLASS[item.value]}`}>{item.count}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Nova operação</h2><span className="kpi-chip">entrada da fila</span></div>
          <form action={`/api/projects/${id}/operacoes/create`} method="post" className="grid md:grid-cols-2 gap-2 text-sm mt-3">
            <input type="hidden" name="csrf_token" value={csrf} />
            <input name="business_date" type="date" defaultValue={todayInSaoPauloISO()} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="due_date" type="date" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <select name="op_type" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
              <option value="desconto_duplicata">desconto_duplicata</option>
              <option value="comissaria">comissaria</option>
              <option value="fomento">fomento</option>
              <option value="intercompany">intercompany</option>
            </select>
            <input name="modality" placeholder="modalidade" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="gross_amount" type="number" step="0.01" placeholder="valor bruto" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="principal_amount" type="number" step="0.01" placeholder="valor principal" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="disbursed_amount" type="number" step="0.01" placeholder="valor desembolsado" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="company_fee" type="number" step="0.01" placeholder="empresa (R$)" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="fee_percent" type="number" step="0.01" placeholder="taxa %" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="fund_limit" type="number" step="0.01" placeholder="limite fundo" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="receivable_available" type="number" step="0.01" placeholder="recebível disponível" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="fund_name" placeholder="fundo" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="operator_name" placeholder="operador" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="counterparty_name" placeholder="cedente / contraparte" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="document_ref" placeholder="documento / borderô / ref" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <input name="notes" placeholder="comentários" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 cursor-pointer md:col-span-2">Registrar operação</button>
          </form>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Filtro operacional</h2><span className="kpi-chip">carteira</span></div>
        <form method="get" className="grid md:grid-cols-6 gap-2 text-sm mt-3">
          <input name="q" defaultValue={q} placeholder="pesquisar por operação, fundo, contraparte, ref" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <select name="op_type" defaultValue={opTypeFilter} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="">Modalidade (todas)</option>
            <option value="desconto_duplicata">desconto_duplicata</option>
            <option value="comissaria">comissaria</option>
            <option value="fomento">fomento</option>
            <option value="intercompany">intercompany</option>
          </select>
          <select name="status" defaultValue={statusFilter} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="">Status (todos)</option>
            {OPERATION_STATUS_FLOW.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select name="risk" defaultValue={riskFilter} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="">Risco (todos)</option>
            <option value="baixo">baixo</option>
            <option value="medio">medio</option>
            <option value="alto">alto</option>
          </select>
          <select name="operator" defaultValue={operatorFilter} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            <option value="">Operador (todos)</option>
            {operators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
          </select>
          <input name="from" type="date" defaultValue={from} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="to" type="date" defaultValue={to} className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <div className="md:col-span-6 flex gap-2 flex-wrap">
            <button type="submit" className="badge py-2 cursor-pointer">Filtrar</button>
            <Link className="pill" href={`/projetos/${id}/operacoes/`}>Limpar</Link>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Carteira de operações</h2><span className="kpi-chip">{filtered.length} registros</span></div>
        {rows.length === 0 ? <div className="mt-4"><EmptyState title="Sem operações neste filtro" description="Ajuste os filtros ou registre uma nova operação para alimentar a carteira." /></div> : null}
        <div className="mt-4 space-y-3">
          {rows.map((o) => (
            <div key={o.id} className="rounded-[24px] border border-slate-800 bg-slate-950/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/projetos/${id}/operacoes/${o.id}/`} className="font-medium text-cyan-300 hover:underline">{o.id.slice(0, 8)}</Link>
                    <StatusPill label={OPERATION_STATUS_FLOW.find((s) => s.value === o.status)?.label || o.status} tone={o.status === "cancelada" ? "bad" : o.status === "pendente_aprovacao" || o.status === "pendente_formalizacao" || o.status === "em_correcao" || o.status === "em_correcao_formalizacao" ? "warn" : o.status === "formalizada" || o.status === "aprovada" ? "good" : "neutral"} />
                    <StatusPill label={o.modality || o.op_type} tone="info" />
                  </div>
                  <div className="mt-2 text-sm text-slate-300">{o.notes || "Sem comentário operacional."}</div>
                  <div className="mt-2 text-xs text-slate-500">{o.counterparty_name || "-"} · {o.fund_name || "-"} · operador: {o.operator_name || "-"} · ref: {o.document_ref || "-"}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm min-w-[260px]">
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Bruto</div><div className="mt-1 font-medium text-white">{brl(o.gross_amount)}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Líquido</div><div className="mt-1 font-medium text-white">{brl(o.net_amount)}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Empresa</div><div className="mt-1 font-medium text-white">{brl(Number(o.company_fee || 0))}</div></div>
                  <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Risco</div><div className={`mt-1 font-medium ${o.risk_level === "alto" ? "text-rose-300" : o.risk_level === "medio" ? "text-amber-300" : "text-emerald-300"}`}>{o.risk_level}</div></div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-2 text-xs text-slate-400">
                <span>Data op.: <b className="text-slate-200">{o.business_date}</b></span>
                <span>Venc.: <b className="text-slate-200">{o.due_date || "-"}</b></span>
              </div>

              <form action={`/api/projects/${id}/operacoes/${o.id}/status`} method="post" className="grid md:grid-cols-[1fr_1.5fr_auto] gap-2 mt-4 text-sm">
                <input type="hidden" name="csrf_token" value={csrf} />
                <select name="status" defaultValue={o.status} className="w-full bg-slate-950/40 border border-slate-700 rounded px-3 py-2">
                  {OPERATION_STATUS_FLOW.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input name="note" placeholder="nota de atualização" className="w-full bg-slate-950/40 border border-slate-700 rounded px-3 py-2" />
                <button type="submit" className="pill">Salvar</button>
              </form>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            {currentPage > 1 ? <Link className="pill" href={`?q=${encodeURIComponent(q)}&op_type=${opTypeFilter}&status=${statusFilter}&risk=${riskFilter}&operator=${operatorFilter}&from=${from}&to=${to}&page=${currentPage - 1}`}>Anterior</Link> : null}
            {currentPage < totalPages ? <Link className="pill" href={`?q=${encodeURIComponent(q)}&op_type=${opTypeFilter}&status=${statusFilter}&risk=${riskFilter}&operator=${operatorFilter}&from=${from}&to=${to}&page=${currentPage + 1}`}>Próxima</Link> : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

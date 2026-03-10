import Link from "next/link";
import { AppShell } from "@/components/AppShell";
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <AppShell user={user} title="Projeto · Operações" subtitle="Esteira operacional + carteira de operações em visão gerencial">
      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Esteira de status</h2><span className="kpi-chip">Fase A</span></div>
        <div className="grid md:grid-cols-4 gap-3">
          {byStatus.map((item) => (
            <div key={item.value} className="metric">
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className={`text-lg font-semibold mt-1 ${STATUS_CLASS[item.value]}`}>{item.count}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Nova operação</h2><span className="kpi-chip">Cadastro operacional</span></div>
        <form action={`/api/projects/${id}/operacoes/create`} method="post" className="grid md:grid-cols-4 gap-2 text-sm">
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
          <input name="notes" placeholder="comentários" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />

          <button type="submit" className="badge py-2 cursor-pointer">Registrar operação</button>
        </form>
        {query.saved ? <div className="alert ok-bg mt-3">Operação atualizada/registrada.</div> : null}
        {query.error ? <div className="alert bad-bg mt-3">Erro: {query.error}</div> : null}
      </section>

      <section className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Valor bruto</div><div className="text-lg font-semibold mt-1">{brl(totals.bruto)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Valor líquido</div><div className="text-lg font-semibold mt-1">{brl(totals.liquido)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Empresa / custo</div><div className="text-lg font-semibold mt-1">{brl(totals.empresa)}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Filtro operacional</h2><span className="kpi-chip">Carteira</span></div>
        <form method="get" className="grid md:grid-cols-6 gap-2 text-sm">
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
        <div className="section-head"><h2 className="title">Todas as operações</h2><span className="kpi-chip">{filtered.length} registros</span></div>
        <div className="table-wrap">
          <table className="min-w-[2200px] text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Operação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Status</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Modalidade</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Operador</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Contraparte</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Fundo</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Valor bruto</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Principal</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Desembolsado</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Empresa</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Valor líquido</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Data op.</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Venc.</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Risco</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Ref.</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Atualizar status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={16} className="px-2 py-3 text-center text-slate-400">Sem operações para o filtro.</td></tr>
              ) : rows.map((o) => (
                <tr key={o.id} className="odd:bg-slate-900/30 align-top">
                  <td className="px-2 py-2 border-b border-slate-900">
                    <div className="font-medium">{o.id.slice(0, 8)}</div>
                    <div className="text-[11px] text-slate-500">{o.notes || "-"}</div>
                  </td>
                  <td className={`px-2 py-2 border-b border-slate-900 font-medium ${STATUS_CLASS[o.status]}`}>{OPERATION_STATUS_FLOW.find((s) => s.value === o.status)?.label || o.status}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.modality || o.op_type}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.operator_name || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.counterparty_name || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.fund_name || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(o.gross_amount)}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(Number(o.principal_amount || 0))}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(Number(o.disbursed_amount || 0))}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(Number(o.company_fee || 0))}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(o.net_amount)}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.business_date}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.due_date || "-"}</td>
                  <td className={`px-2 py-2 border-b border-slate-900 ${o.risk_level === "alto" ? "text-rose-300" : o.risk_level === "medio" ? "text-amber-300" : "text-emerald-300"}`}>{o.risk_level}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{o.document_ref || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">
                    <form action={`/api/projects/${id}/operacoes/${o.id}/status`} method="post" className="space-y-1">
                      <input type="hidden" name="csrf_token" value={csrf} />
                      <select name="status" defaultValue={o.status} className="w-full bg-slate-950/40 border border-slate-700 rounded px-2 py-1">
                        {OPERATION_STATUS_FLOW.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <input name="note" placeholder="nota" className="w-full bg-slate-950/40 border border-slate-700 rounded px-2 py-1" />
                      <button type="submit" className="pill">Salvar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
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

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode, isProjectOnboardingComplete } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { ensureCsrfCookie } from "@/lib/csrf";
import {
  getOperationById,
  listOperationComments,
  listOperationDocuments,
  listOperationEvents,
  listOperationTitles,
  OPERATION_STATUS_FLOW,
  OPERATION_TITLE_STATUS_OPTIONS,
} from "@/lib/operations";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function OperationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; opId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { id, opId } = await params;
  const query = await searchParams;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Operação"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Operação"><div className="alert bad-bg">Sem permissão.</div></AppShell>;
  const onboardingComplete = isProjectOnboardingComplete(project);
  if (!onboardingComplete) return <AppShell user={user} title="Projeto · Operação"><div className="alert bad-bg">Onboarding incompleto.</div></AppShell>;

  const [operation, comments, documents, events, titles, csrf] = await Promise.all([
    getOperationById(project.id, opId),
    listOperationComments(project.id, opId),
    listOperationDocuments(project.id, opId),
    listOperationEvents(project.id, opId),
    listOperationTitles(project.id, opId),
    ensureCsrfCookie(),
  ]);

  if (!operation) return <AppShell user={user} title="Projeto · Operação"><div className="alert bad-bg">Operação não encontrada.</div></AppShell>;

  const currentIdx = OPERATION_STATUS_FLOW.findIndex((s) => s.value === operation.status);
  const carteiraResumo = {
    total: titles.reduce((s, t) => s + Number(t.face_value || 0), 0),
    aVencer: titles.filter((t) => t.carteira_status === "a_vencer").reduce((s, t) => s + Number(t.face_value || 0), 0),
    vencido: titles.filter((t) => t.carteira_status === "vencido").reduce((s, t) => s + Number(t.face_value || 0), 0),
    liquidado: titles.filter((t) => t.carteira_status === "liquidado").reduce((s, t) => s + Number(t.face_value || 0), 0),
    recompra: titles.filter((t) => t.carteira_status === "recomprado").reduce((s, t) => s + Number(t.face_value || 0), 0),
  };

  return (
    <AppShell user={user} title="Projeto · Visualizar Operação" subtitle="Resumo, histórico, documentos, comentários e carteira da operação">
      <section className="card mb-4">
        <div className="section-head">
          <h2 className="title">Esteira da operação</h2>
          <Link href={`/projetos/${id}/operacoes`} className="pill">Voltar para operações</Link>
        </div>
        <div className="grid md:grid-cols-4 gap-2 text-xs">
          {OPERATION_STATUS_FLOW.map((step, idx) => (
            <div key={step.value} className={`rounded-lg border px-3 py-2 ${idx <= currentIdx ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-800 bg-slate-950/30"}`}>
              {step.label}
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="card md:col-span-2">
          <div className="section-head"><h2 className="title">Resumo da operação</h2><span className="kpi-chip">{operation.status}</span></div>
          <div className="grid md:grid-cols-2 gap-2 text-sm mt-3">
            <div className="row"><span>ID</span><b>{operation.id}</b></div>
            <div className="row"><span>Modalidade</span><b>{operation.modality || operation.op_type}</b></div>
            <div className="row"><span>Operador</span><b>{operation.operator_name || "-"}</b></div>
            <div className="row"><span>Contraparte</span><b>{operation.counterparty_name || "-"}</b></div>
            <div className="row"><span>Fundo</span><b>{operation.fund_name || "-"}</b></div>
            <div className="row"><span>Risco</span><b>{operation.risk_level}</b></div>
            <div className="row"><span>Data da operação</span><b>{operation.business_date}</b></div>
            <div className="row"><span>Vencimento</span><b>{operation.due_date || "-"}</b></div>
            <div className="row"><span>Documento ref.</span><b>{operation.document_ref || "-"}</b></div>
            <div className="row"><span>Aprovador</span><b>{operation.approver_name || "-"}</b></div>
          </div>
        </div>

        <div className="card">
          <div className="section-head"><h2 className="title">Resumo financeiro</h2><span className="kpi-chip">Valores</span></div>
          <div className="space-y-2 text-sm mt-3">
            <div className="row"><span>Valor bruto</span><b>{brl(operation.gross_amount)}</b></div>
            <div className="row"><span>Principal</span><b>{brl(Number(operation.principal_amount || 0))}</b></div>
            <div className="row"><span>Desembolsado</span><b>{brl(Number(operation.disbursed_amount || 0))}</b></div>
            <div className="row"><span>Taxa</span><b>{Number(operation.fee_percent || 0).toFixed(2)}%</b></div>
            <div className="row"><span>Empresa</span><b>{brl(Number(operation.company_fee || 0))}</b></div>
            <div className="row"><span>Líquido</span><b>{brl(operation.net_amount)}</b></div>
            <div className="row"><span>Limite fundo</span><b>{brl(Number(operation.fund_limit || 0))}</b></div>
            <div className="row"><span>Recebível disp.</span><b>{brl(Number(operation.receivable_available || 0))}</b></div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-5 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Carteira total</div><div className="text-lg font-semibold mt-1">{brl(carteiraResumo.total)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">A vencer</div><div className="text-lg font-semibold mt-1 text-emerald-300">{brl(carteiraResumo.aVencer)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Vencido</div><div className="text-lg font-semibold mt-1 text-rose-300">{brl(carteiraResumo.vencido)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Liquidado</div><div className="text-lg font-semibold mt-1 text-cyan-300">{brl(carteiraResumo.liquidado)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Recomprado</div><div className="text-lg font-semibold mt-1 text-amber-300">{brl(carteiraResumo.recompra)}</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Carteira / Títulos</h2><span className="kpi-chip">Fase C</span></div>
        <form action={`/api/projects/${id}/operacoes/${opId}/title`} method="post" className="grid md:grid-cols-4 gap-2 text-sm mb-4">
          <input type="hidden" name="csrf_token" value={csrf} />
          <input name="title_ref" placeholder="nosso número / título" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" required />
          <input name="debtor_name" placeholder="sacado / devedor" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="debtor_doc" placeholder="cpf/cnpj devedor" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <select name="carteira_status" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2">
            {OPERATION_TITLE_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <input name="face_value" type="number" step="0.01" placeholder="valor de face" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" required />
          <input name="present_value" type="number" step="0.01" placeholder="valor presente" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="due_date" type="date" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="expected_settlement_date" type="date" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />

          <input name="payment_method" placeholder="forma de baixa" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <input name="note" placeholder="observação" className="md:col-span-2 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <button type="submit" className="badge py-2 px-3 cursor-pointer">Adicionar título</button>
        </form>

        {query.saved ? <div className="alert ok-bg mb-3">{query.saved === "comment" ? "Comentário salvo." : query.saved === "document" ? "Documento salvo." : query.saved === "title" ? "Título salvo." : query.saved === "title_status" ? "Status do título atualizado." : "Atualizado."}</div> : null}
        {query.error ? <div className="alert bad-bg mb-3">Erro: {query.error}</div> : null}

        <div className="table-wrap">
          <table className="min-w-[1800px] text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Título</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Sacado</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Documento</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Face</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Presente</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Vencimento</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Liquidação esperada</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Baixa</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Status carteira</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Observação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Ação</th>
              </tr>
            </thead>
            <tbody>
              {titles.length === 0 ? <tr><td colSpan={11} className="px-2 py-3 text-center text-slate-400">Sem títulos vinculados ainda.</td></tr> : null}
              {titles.map((title) => (
                <tr key={title.id} className="odd:bg-slate-900/30 align-top">
                  <td className="px-2 py-2 border-b border-slate-900">{title.title_ref}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.debtor_name || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.debtor_doc || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(title.face_value)}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{brl(title.present_value)}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.due_date || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.expected_settlement_date || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.payment_method || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.carteira_status}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{title.note || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">
                    <form action={`/api/projects/${id}/operacoes/${opId}/title/${title.id}/status`} method="post" className="space-y-1">
                      <input type="hidden" name="csrf_token" value={csrf} />
                      <select name="carteira_status" defaultValue={title.carteira_status} className="w-full bg-slate-950/40 border border-slate-700 rounded px-2 py-1">
                        {OPERATION_TITLE_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                      <input name="payment_method" placeholder="forma baixa" className="w-full bg-slate-950/40 border border-slate-700 rounded px-2 py-1" />
                      <input name="note" placeholder="nota" className="w-full bg-slate-950/40 border border-slate-700 rounded px-2 py-1" />
                      <button type="submit" className="pill">Salvar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Histórico / timeline de eventos</h2><span className="kpi-chip">Timeline</span></div>
          <div className="text-sm text-slate-300 whitespace-pre-wrap mt-2">{operation.notes || "Sem observações gerais."}</div>
          <div className="text-xs text-slate-500 mt-3">Última atualização: {operation.updated_at || operation.created_at}</div>
          {operation.approval_note ? <div className="alert muted-bg mt-3">Nota de aprovação/status: {operation.approval_note}</div> : null}
          <div className="space-y-2 mt-3 text-sm">
            {events.length === 0 ? <div className="alert muted-bg">Sem eventos ainda.</div> : null}
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-800 p-3">
                <div className="text-xs text-slate-500">{event.created_at} · {event.actor_name || "sistema"}</div>
                <div className="font-medium mt-1">{event.event_label}</div>
                <div className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{JSON.stringify(event.payload, null, 2)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Comentários</h2><span className="kpi-chip">Colaboração</span></div>
          <form action={`/api/projects/${id}/operacoes/${opId}/comment`} method="post" className="space-y-2 mb-3">
            <input type="hidden" name="csrf_token" value={csrf} />
            <textarea name="body" required placeholder="Adicionar comentário operacional" className="w-full min-h-24 bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
            <button type="submit" className="badge py-2 px-3 cursor-pointer">Salvar comentário</button>
          </form>
          {comments.length === 0 ? <div className="alert muted-bg">Sem comentários ainda.</div> : null}
          <div className="space-y-2 text-sm">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-slate-800 p-3">
                <div className="text-xs text-slate-500">{comment.author_name || "-"} · {comment.created_at}</div>
                <div className="mt-1 text-slate-300 whitespace-pre-wrap">{comment.body}</div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Documentos</h2><span className="kpi-chip">Base</span></div>
        <form action={`/api/projects/${id}/operacoes/${opId}/document`} method="post" className="grid md:grid-cols-3 gap-2 text-sm mb-4">
          <input type="hidden" name="csrf_token" value={csrf} />
          <input name="document_type" placeholder="tipo do documento" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" required />
          <input name="document_ref" placeholder="link / ref / protocolo" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" required />
          <input name="note" placeholder="observação" className="bg-slate-950/40 border border-slate-700 rounded-lg px-3 py-2" />
          <button type="submit" className="badge py-2 px-3 cursor-pointer">Adicionar documento</button>
        </form>
        <div className="table-wrap">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Tipo</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Referência</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Observação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? <tr><td colSpan={4} className="px-2 py-3 text-center text-slate-400">Sem documentos ainda.</td></tr> : null}
              {documents.map((doc) => (
                <tr key={doc.id} className="odd:bg-slate-900/30">
                  <td className="px-2 py-2 border-b border-slate-900">{doc.document_type}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{doc.document_ref}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{doc.note || "-"}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{doc.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

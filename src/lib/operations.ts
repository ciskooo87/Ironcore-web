import { dbQuery } from "@/lib/db";

export type OperationStatus =
  | "em_elaboracao"
  | "em_correcao"
  | "pendente_aprovacao"
  | "aprovada"
  | "em_correcao_formalizacao"
  | "pendente_formalizacao"
  | "formalizada"
  | "cancelada";

export type OperationTitleStatus = "a_vencer" | "vencido" | "liquidado" | "recomprado" | "prorrogado" | "inadimplente";

export const OPERATION_STATUS_FLOW: { value: OperationStatus; label: string }[] = [
  { value: "em_elaboracao", label: "Em elaboração" },
  { value: "em_correcao", label: "Em correção" },
  { value: "pendente_aprovacao", label: "Pendente de aprovação" },
  { value: "aprovada", label: "Aprovada" },
  { value: "em_correcao_formalizacao", label: "Em correção de formalização" },
  { value: "pendente_formalizacao", label: "Pendente de formalização" },
  { value: "formalizada", label: "Formalizada" },
  { value: "cancelada", label: "Cancelada" },
];

export const OPERATION_TITLE_STATUS_OPTIONS: { value: OperationTitleStatus; label: string }[] = [
  { value: "a_vencer", label: "A vencer" },
  { value: "vencido", label: "Vencido" },
  { value: "liquidado", label: "Liquidado" },
  { value: "recomprado", label: "Recomprado" },
  { value: "prorrogado", label: "Prorrogado" },
  { value: "inadimplente", label: "Inadimplente" },
];

export type FinancialOperation = {
  id: string;
  business_date: string;
  due_date: string | null;
  op_type: "desconto_duplicata" | "comissaria" | "fomento" | "intercompany";
  modality: string | null;
  status: OperationStatus;
  risk_level: "baixo" | "medio" | "alto";
  gross_amount: number;
  principal_amount: number | null;
  disbursed_amount: number | null;
  fee_percent: number;
  company_fee: number | null;
  net_amount: number;
  fund_limit: number | null;
  receivable_available: number | null;
  operator_name: string | null;
  counterparty_name: string | null;
  fund_name: string | null;
  document_ref: string | null;
  approver_name: string | null;
  approval_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type OperationComment = {
  id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

export type OperationDocument = {
  id: string;
  document_type: string;
  document_ref: string;
  note: string | null;
  created_at: string;
};

export type OperationEvent = {
  id: string;
  event_type: string;
  event_label: string;
  payload: Record<string, unknown>;
  actor_name: string | null;
  created_at: string;
};

export type OperationTitle = {
  id: string;
  title_ref: string;
  debtor_name: string | null;
  debtor_doc: string | null;
  face_value: number;
  present_value: number;
  due_date: string | null;
  expected_settlement_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  carteira_status: OperationTitleStatus;
  note: string | null;
  created_at: string;
};

export async function listOperations(projectId: string, limit = 50) {
  try {
    const q = await dbQuery<FinancialOperation>(
      `select id, business_date::text, due_date::text, op_type, modality, status, risk_level,
              gross_amount::float8, principal_amount::float8, disbursed_amount::float8,
              fee_percent::float8, company_fee::float8, net_amount::float8, fund_limit::float8,
              receivable_available::float8, operator_name, counterparty_name, fund_name,
              document_ref, approver_name, approval_note, notes, created_at::text, updated_at::text
       from financial_operations
       where project_id=$1
       order by business_date desc, created_at desc
       limit $2`,
      [projectId, limit]
    );
    return q.rows;
  } catch {
    return [] as FinancialOperation[];
  }
}

export async function getOperationById(projectId: string, opId: string) {
  const q = await dbQuery<FinancialOperation>(
    `select id, business_date::text, due_date::text, op_type, modality, status, risk_level,
            gross_amount::float8, principal_amount::float8, disbursed_amount::float8,
            fee_percent::float8, company_fee::float8, net_amount::float8, fund_limit::float8,
            receivable_available::float8, operator_name, counterparty_name, fund_name,
            document_ref, approver_name, approval_note, notes, created_at::text, updated_at::text
     from financial_operations where project_id=$1 and id=$2`,
    [projectId, opId]
  );
  return q.rows[0] || null;
}

export async function listOperationComments(projectId: string, opId: string) {
  const q = await dbQuery<OperationComment>(
    `select id, author_name, body, created_at::text
     from operation_comments
     where project_id=$1 and operation_id=$2
     order by created_at desc`,
    [projectId, opId]
  );
  return q.rows;
}

export async function listOperationDocuments(projectId: string, opId: string) {
  const q = await dbQuery<OperationDocument>(
    `select id, document_type, document_ref, note, created_at::text
     from operation_documents
     where project_id=$1 and operation_id=$2
     order by created_at desc`,
    [projectId, opId]
  );
  return q.rows;
}

export async function listOperationEvents(projectId: string, opId: string) {
  const q = await dbQuery<OperationEvent>(
    `select id, event_type, event_label, payload, actor_name, created_at::text
     from operation_events
     where project_id=$1 and operation_id=$2
     order by created_at desc`,
    [projectId, opId]
  );
  return q.rows;
}

export async function listOperationTitles(projectId: string, opId: string) {
  const q = await dbQuery<OperationTitle>(
    `select id, title_ref, debtor_name, debtor_doc,
            face_value::float8, present_value::float8,
            due_date::text, expected_settlement_date::text, paid_at::text,
            payment_method, carteira_status, note, created_at::text
     from operation_titles
     where project_id=$1 and operation_id=$2
     order by due_date asc nulls last, created_at desc`,
    [projectId, opId]
  );
  return q.rows;
}

function inferRiskLevel(input: { grossAmount: number; fundLimit: number; receivableAvailable: number; feePercent: number }) {
  const overFund = input.fundLimit > 0 && input.grossAmount > input.fundLimit;
  const overReceivable = input.receivableAvailable > 0 && input.grossAmount > input.receivableAvailable;
  if (overFund || overReceivable || input.feePercent >= 5 || input.grossAmount >= 250000) return "alto" as const;
  if (input.feePercent >= 3 || input.grossAmount >= 100000) return "medio" as const;
  return "baixo" as const;
}

export async function createOperation(input: {
  projectId: string;
  businessDate: string;
  dueDate?: string | null;
  opType: FinancialOperation["op_type"];
  modality?: string | null;
  grossAmount: number;
  principalAmount?: number | null;
  disbursedAmount?: number | null;
  feePercent: number;
  companyFee?: number | null;
  fundLimit: number;
  receivableAvailable: number;
  operatorName?: string;
  counterpartyName?: string;
  fundName?: string;
  documentRef?: string;
  notes: string;
  createdBy: string | null;
}) {
  const net = Math.max(0, (input.disbursedAmount ?? input.grossAmount) * (1 - input.feePercent / 100) - (input.companyFee || 0));
  const riskLevel = inferRiskLevel({
    grossAmount: input.grossAmount,
    fundLimit: input.fundLimit,
    receivableAvailable: input.receivableAvailable,
    feePercent: input.feePercent,
  });
  const q = await dbQuery<{ id: string }>(
    `insert into financial_operations(
      project_id,business_date,due_date,op_type,modality,status,risk_level,gross_amount,principal_amount,
      disbursed_amount,fee_percent,company_fee,net_amount,fund_limit,receivable_available,
      operator_name,counterparty_name,fund_name,document_ref,notes,created_by,updated_at
    ) values($1,$2,$3,$4,$5,'em_elaboracao',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now()) returning id`,
    [
      input.projectId,
      input.businessDate,
      input.dueDate || null,
      input.opType,
      input.modality || input.opType,
      riskLevel,
      input.grossAmount,
      input.principalAmount || input.grossAmount,
      input.disbursedAmount || input.grossAmount,
      input.feePercent,
      input.companyFee || 0,
      net,
      input.fundLimit,
      input.receivableAvailable,
      input.operatorName || null,
      input.counterpartyName || null,
      input.fundName || null,
      input.documentRef || null,
      input.notes,
      input.createdBy,
    ]
  );
  const id = q.rows[0]?.id;
  if (id) {
    await addOperationEvent({
      projectId: input.projectId,
      operationId: id,
      eventType: "operation_created",
      eventLabel: "Operação criada",
      payload: { modality: input.modality || input.opType, grossAmount: input.grossAmount, netAmount: net, riskLevel },
      actorName: input.operatorName || null,
    });
  }
  return { id, netAmount: net, riskLevel };
}

export async function updateOperationStatus(input: {
  projectId: string;
  opId: string;
  status: OperationStatus;
  note?: string;
  approverName?: string | null;
}) {
  await dbQuery(
    `update financial_operations
     set status=$3,
         approval_note=coalesce(nullif($4,''), approval_note),
         approver_name=coalesce(nullif($5,''), approver_name),
         updated_at=now()
     where id=$1 and project_id=$2`,
    [input.opId, input.projectId, input.status, input.note || null, input.approverName || null]
  );
  await addOperationEvent({
    projectId: input.projectId,
    operationId: input.opId,
    eventType: "status_updated",
    eventLabel: "Status da operação atualizado",
    payload: { status: input.status, note: input.note || null },
    actorName: input.approverName || null,
  });
}

export async function addOperationComment(input: {
  projectId: string;
  operationId: string;
  body: string;
  authorUserId: string | null;
  authorName: string | null;
}) {
  await dbQuery(
    `insert into operation_comments(operation_id, project_id, author_user_id, author_name, body)
     values($1,$2,$3,$4,$5)`,
    [input.operationId, input.projectId, input.authorUserId, input.authorName, input.body]
  );
  await addOperationEvent({
    projectId: input.projectId,
    operationId: input.operationId,
    eventType: "comment_added",
    eventLabel: "Comentário adicionado",
    payload: { body: input.body },
    actorName: input.authorName || null,
  });
}

export async function addOperationDocument(input: {
  projectId: string;
  operationId: string;
  documentType: string;
  documentRef: string;
  note?: string | null;
  createdBy: string | null;
}) {
  await dbQuery(
    `insert into operation_documents(operation_id, project_id, document_type, document_ref, note, created_by)
     values($1,$2,$3,$4,$5,$6)`,
    [input.operationId, input.projectId, input.documentType, input.documentRef, input.note || null, input.createdBy]
  );
  await addOperationEvent({
    projectId: input.projectId,
    operationId: input.operationId,
    eventType: "document_added",
    eventLabel: "Documento adicionado",
    payload: { documentType: input.documentType, documentRef: input.documentRef },
    actorName: null,
  });
}

export async function addOperationTitle(input: {
  projectId: string;
  operationId: string;
  titleRef: string;
  debtorName?: string;
  debtorDoc?: string;
  faceValue: number;
  presentValue?: number;
  dueDate?: string | null;
  expectedSettlementDate?: string | null;
  paymentMethod?: string | null;
  carteiraStatus: string;
  note?: string;
  createdBy: string | null;
}) {
  await dbQuery(
    `insert into operation_titles(
      operation_id, project_id, title_ref, debtor_name, debtor_doc, face_value, present_value,
      due_date, expected_settlement_date, payment_method, carteira_status, note, created_by
    ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      input.operationId,
      input.projectId,
      input.titleRef,
      input.debtorName || null,
      input.debtorDoc || null,
      input.faceValue,
      input.presentValue || input.faceValue,
      input.dueDate || null,
      input.expectedSettlementDate || null,
      input.paymentMethod || null,
      input.carteiraStatus,
      input.note || null,
      input.createdBy,
    ]
  );
  await addOperationEvent({
    projectId: input.projectId,
    operationId: input.operationId,
    eventType: "title_added",
    eventLabel: "Título adicionado à carteira",
    payload: { titleRef: input.titleRef, faceValue: input.faceValue, carteiraStatus: input.carteiraStatus },
    actorName: null,
  });
}

export async function updateOperationTitleStatus(input: {
  projectId: string;
  titleId: string;
  carteiraStatus: string;
  paymentMethod?: string;
  note?: string;
}) {
  const q = await dbQuery<{ operation_id: string }>(
    `update operation_titles
     set carteira_status=$3,
         payment_method=coalesce(nullif($4,''), payment_method),
         note=coalesce(nullif($5,''), note),
         paid_at=case when $3='liquidado' then current_date else paid_at end
     where project_id=$1 and id=$2
     returning operation_id`,
    [input.projectId, input.titleId, input.carteiraStatus, input.paymentMethod || null, input.note || null]
  );
  const operationId = q.rows[0]?.operation_id;
  if (operationId) {
    await addOperationEvent({
      projectId: input.projectId,
      operationId,
      eventType: "title_status_updated",
      eventLabel: "Status do título atualizado",
      payload: { titleId: input.titleId, carteiraStatus: input.carteiraStatus, paymentMethod: input.paymentMethod || null, note: input.note || null },
      actorName: null,
    });
  }
}

export async function addOperationEvent(input: {
  projectId: string;
  operationId: string;
  eventType: string;
  eventLabel: string;
  payload?: Record<string, unknown>;
  actorName?: string | null;
}) {
  await dbQuery(
    `insert into operation_events(operation_id, project_id, event_type, event_label, payload, actor_name)
     values($1,$2,$3,$4,$5::jsonb,$6)`,
    [input.operationId, input.projectId, input.eventType, input.eventLabel, JSON.stringify(input.payload || {}), input.actorName || null]
  );
}

export async function sumNetOperations(projectId: string) {
  const q = await dbQuery<{ total: number }>("select coalesce(sum(net_amount),0)::float8 as total from financial_operations where project_id=$1", [projectId]);
  return Number(q.rows[0]?.total || 0);
}

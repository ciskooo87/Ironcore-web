import { dbQuery } from "@/lib/db";
import { runReconciliation } from "@/lib/conciliacao";
import { listProjectAlerts, evaluateAlerts } from "@/lib/alerts";
import { buildDeliveryPayload } from "@/lib/delivery";
import { listOperations, listOperationTitles } from "@/lib/operations";
import { getFidcPanel } from "@/lib/fidc";
import { evaluateMovementDecision } from "@/lib/movement-decision";

export type RoutineRun = {
  id: string;
  business_date: string;
  status: "success" | "warning" | "blocked";
  summary: Record<string, unknown>;
  created_at: string;
};

export async function listRoutineRuns(projectId: string, limit = 20) {
  try {
    const q = await dbQuery<RoutineRun>(
      "select id, business_date::text, status, summary, created_at::text from routine_runs where project_id = $1 order by created_at desc limit $2",
      [projectId, limit]
    );
    return q.rows;
  } catch {
    return [] as RoutineRun[];
  }
}

export async function runDailyRoutine(projectId: string, businessDate: string, projectCode = "projeto") {
  const recon = await runReconciliation(projectId, businessDate);
  const alerts = await listProjectAlerts(projectId);
  const evalAlerts = evaluateAlerts(alerts, {
    diff: Number((recon.details.diff as number | undefined) || 0),
    pending: recon.pending,
  });
  const [operations, fidcPanel] = await Promise.all([
    listOperations(projectId, 200),
    getFidcPanel(projectId),
  ]);
  const titlesNested = await Promise.all(operations.slice(0, 100).map((op) => listOperationTitles(projectId, op.id)));
  const titles = titlesNested.flat();

  const opPendingApproval = operations.filter((o) => ["pendente_aprovacao", "pendente_formalizacao", "em_correcao_formalizacao"].includes(o.status)).length;
  const opApprovedToday = operations.filter((o) => o.status === "aprovada" && o.business_date === businessDate).length;
  const carteiraVencida = titles.filter((t) => t.carteira_status === "vencido" || t.carteira_status === "inadimplente").reduce((s, t) => s + Number(t.face_value || 0), 0);
  const carteiraRecompra = titles.filter((t) => t.carteira_status === "recomprado").reduce((s, t) => s + Number(t.face_value || 0), 0);

  const riskLevel = recon.pending === 0 && carteiraVencida === 0 ? "baixo" : (recon.pending <= 3 && carteiraVencida < 50000 ? "medio" : "alto");
  const status: RoutineRun["status"] = evalAlerts.hasBlocking
    ? "blocked"
    : recon.status === "ok"
      ? "success"
      : recon.status === "warning"
        ? "warning"
        : "blocked";

  const decision = evaluateMovementDecision({
    routineStatus: status,
    reconciliationStatus: recon.status,
    reconciliationPending: recon.pending,
    hasBlockingAlert: evalAlerts.hasBlocking,
    opPendingApproval,
    carteiraVencida,
    carteiraRecompra,
    fidcRecompra: fidcPanel.recompraOperacoes || fidcPanel.recompras,
  });

  const decisionSummary = {
    opPendingApproval,
    opApprovedToday,
    carteiraVencida,
    carteiraRecompra,
    fidc: {
      carteira: fidcPanel.carteiraOperacoes || fidcPanel.totalCarteira,
      vencido: fidcPanel.vencidoOperacoes || fidcPanel.vencidos,
      aVencer: fidcPanel.aVencerOperacoes || fidcPanel.aVencer,
      recompra: fidcPanel.recompraOperacoes || fidcPanel.recompras,
    },
    blockingReasons: decision.blockingReasons,
    attentionReasons: decision.attentionReasons,
    releaseSignals: decision.releaseSignals,
    suggestedActions: [
      ...decision.suggestedActions,
      opApprovedToday > 0 ? "Confirmar documentação e títulos das operações aprovadas hoje." : null,
    ].filter(Boolean),
    gatingStatus: decision.gatingStatus,
    recommendation: decision.recommendation,
  };

  const delivery = buildDeliveryPayload({
    projectCode,
    businessDate,
    status,
    reconciliationPending: recon.pending,
    riskLevel,
  });

  const summary = {
    movementProcessed: true,
    aiAnalysis: {
      explainability: true,
      riskLevel,
      recommendation: decisionSummary.recommendation,
    },
    cashflow90d: {
      basedOn: "daily+projected+operations+fidc",
      note: recon.pending > 0 ? "Há impacto potencial por pendências de conciliação" : carteiraVencida > 0 ? "Há pressão potencial por carteira vencida" : "Fluxo estável",
    },
    operationalDecision: decisionSummary,
    reconciliation: recon,
    alertsTriggered: evalAlerts.hits.map((h) => ({ name: h.name, severity: h.severity, block: h.block_flow })),
    delivery,
  };

  const q = await dbQuery<{ id: string }>(
    "insert into routine_runs(project_id, business_date, status, summary) values($1,$2,$3,$4::jsonb) returning id",
    [projectId, businessDate, status, JSON.stringify(summary)]
  );

  return { id: q.rows[0]?.id, status, summary };
}

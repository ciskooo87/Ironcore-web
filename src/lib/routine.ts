import { dbQuery } from "@/lib/db";
import { runReconciliation } from "@/lib/conciliacao";
import { listProjectAlerts, evaluateAlerts } from "@/lib/alerts";
import { buildDeliveryPayload } from "@/lib/delivery";
import { listOperations, listOperationTitles } from "@/lib/operations";
import { getFidcPanel } from "@/lib/fidc";

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

  const blockingReasons = [
    evalAlerts.hasBlocking ? "alerta bloqueante ativo" : null,
    recon.status === "blocked" ? "conciliação bloqueada" : null,
    recon.pending > 5 ? "pendências elevadas de conciliação" : null,
    carteiraVencida > 100000 ? "carteira vencida acima do limite" : null,
    fidcPanel.recompraOperacoes > 50000 ? "recompra relevante na carteira" : null,
  ].filter(Boolean);

  const releaseSignals = [
    recon.status !== "blocked" && recon.pending === 0 ? "conciliação zerada" : null,
    recon.status !== "blocked" && opPendingApproval === 0 ? "sem pendência de aprovação" : null,
    recon.status !== "blocked" && carteiraVencida === 0 ? "sem carteira vencida" : null,
  ].filter(Boolean);

  const suggestedActions = [
    blockingReasons.includes("alerta bloqueante ativo") ? "Revisar alertas críticos no painel de risco e remover bloqueio somente após saneamento." : null,
    blockingReasons.includes("pendências elevadas de conciliação") ? "Executar conciliação manual dos itens pendentes antes de novas decisões." : null,
    blockingReasons.includes("carteira vencida acima do limite") ? "Priorizar cobrança, renegociação ou revisão dos títulos vencidos da carteira." : null,
    blockingReasons.includes("recompra relevante na carteira") ? "Validar impacto de recompra no funding e reavaliar alocação do dia." : null,
    opPendingApproval > 0 ? "Concluir aprovação e formalização das operações pendentes." : null,
    opApprovedToday > 0 ? "Confirmar documentação e títulos das operações aprovadas hoje." : null,
  ].filter(Boolean);

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
    blockingReasons,
    releaseSignals,
    suggestedActions,
    gatingStatus: blockingReasons.length > 0 ? "bloqueado" : releaseSignals.length >= 2 ? "liberado" : "atencao",
    recommendation:
      blockingReasons.length > 0
        ? `Bloquear novas decisões: ${blockingReasons.join(", ")}.`
        : opPendingApproval > 0
          ? "Priorizar aprovação/formalização das operações pendentes antes de novas alocações."
          : carteiraRecompra > 0
            ? "Monitorar recompras e validar impacto no funding do dia."
            : "Operação apta para seguir com monitoramento diário e validação de funding.",
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

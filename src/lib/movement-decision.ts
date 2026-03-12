export type MovementDecisionInput = {
  routineStatus: "success" | "warning" | "blocked";
  reconciliationStatus: "ok" | "warning" | "blocked";
  reconciliationPending: number;
  hasBlockingAlert: boolean;
  opPendingApproval: number;
  carteiraVencida: number;
  carteiraRecompra: number;
  fidcRecompra: number;
};

export type MovementDecisionLevel = "liberado" | "atencao" | "bloqueado";

export type MovementDecisionOutput = {
  gatingStatus: MovementDecisionLevel;
  blockingReasons: string[];
  attentionReasons: string[];
  releaseSignals: string[];
  suggestedActions: string[];
  recommendation: string;
};

const HIGH_PENDING_THRESHOLD = 5;
const WARNING_PENDING_THRESHOLD = 1;
const HIGH_OVERDUE_THRESHOLD = 100_000;
const WARNING_OVERDUE_THRESHOLD = 0;
const HIGH_REPURCHASE_THRESHOLD = 50_000;

export function evaluateMovementDecision(input: MovementDecisionInput): MovementDecisionOutput {
  const blockingReasons = [
    input.hasBlockingAlert ? "alerta bloqueante ativo" : null,
    input.routineStatus === "blocked" ? "rotina diária bloqueada" : null,
    input.reconciliationStatus === "blocked" ? "conciliação bloqueada" : null,
    input.reconciliationPending > HIGH_PENDING_THRESHOLD ? "pendências elevadas de conciliação" : null,
    input.carteiraVencida > HIGH_OVERDUE_THRESHOLD ? "carteira vencida acima do limite" : null,
    input.fidcRecompra > HIGH_REPURCHASE_THRESHOLD ? "recompra relevante na carteira" : null,
  ].filter(Boolean) as string[];

  const attentionReasons = [
    blockingReasons.length === 0 && (input.routineStatus === "warning" || input.reconciliationStatus === "warning")
      ? "rotina/conciliação em atenção"
      : null,
    blockingReasons.length === 0 && input.reconciliationPending >= WARNING_PENDING_THRESHOLD
      ? "existem pendências de conciliação" 
      : null,
    blockingReasons.length === 0 && input.opPendingApproval > 0
      ? "existem operações pendentes de aprovação/formalização"
      : null,
    blockingReasons.length === 0 && input.carteiraVencida > WARNING_OVERDUE_THRESHOLD
      ? "há carteira vencida para acompanhamento"
      : null,
    blockingReasons.length === 0 && input.carteiraRecompra > 0
      ? "há recompra na carteira para monitorar"
      : null,
  ].filter(Boolean) as string[];

  const releaseSignals = [
    blockingReasons.length === 0 && input.reconciliationStatus === "ok" && input.reconciliationPending === 0 ? "conciliação zerada" : null,
    blockingReasons.length === 0 && input.opPendingApproval === 0 ? "sem pendência de aprovação" : null,
    blockingReasons.length === 0 && input.carteiraVencida === 0 ? "sem carteira vencida" : null,
    blockingReasons.length === 0 && input.carteiraRecompra === 0 && input.fidcRecompra === 0 ? "sem recompra relevante" : null,
  ].filter(Boolean) as string[];

  const suggestedActions = [
    blockingReasons.includes("alerta bloqueante ativo") ? "Revisar alertas críticos no painel de risco antes de liberar o movimento." : null,
    blockingReasons.includes("rotina diária bloqueada") || blockingReasons.includes("conciliação bloqueada")
      ? "Executar saneamento operacional e reprocessar a rotina diária."
      : null,
    blockingReasons.includes("pendências elevadas de conciliação") ? "Conciliar manualmente os itens pendentes antes de seguir." : null,
    blockingReasons.includes("carteira vencida acima do limite") ? "Priorizar cobrança, renegociação ou revisão dos títulos vencidos." : null,
    blockingReasons.includes("recompra relevante na carteira") ? "Validar impacto de recompra no funding e reavaliar alocação do dia." : null,
    blockingReasons.length === 0 && attentionReasons.some((x) => x.includes("pendências de conciliação"))
      ? "Revisar pendências remanescentes antes da decisão final."
      : null,
    blockingReasons.length === 0 && input.opPendingApproval > 0
      ? "Concluir aprovação e formalização das operações pendentes."
      : null,
    blockingReasons.length === 0 && input.carteiraVencida > 0
      ? "Monitorar e atacar carteira vencida ao longo do dia."
      : null,
  ].filter(Boolean) as string[];

  const gatingStatus: MovementDecisionLevel = blockingReasons.length > 0
    ? "bloqueado"
    : attentionReasons.length > 0
      ? "atencao"
      : "liberado";

  const recommendation = gatingStatus === "bloqueado"
    ? `Bloquear novas decisões: ${blockingReasons.join(", ")}.`
    : gatingStatus === "atencao"
      ? `Seguir com atenção: ${attentionReasons.join(", ")}.`
      : "Operação liberada para seguir com monitoramento normal.";

  return {
    gatingStatus,
    blockingReasons,
    attentionReasons,
    releaseSignals,
    suggestedActions,
    recommendation,
  };
}

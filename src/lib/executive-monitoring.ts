import { dbQuery } from "@/lib/db";

export type ExecutiveMonitoringSnapshot = {
  latestClosurePeriod: string | null;
  latestValidationDecision: string | null;
  latestValidationAt: string | null;
  faturamento: number;
  resultadoOperacional: number;
  carteiraVencida: number;
  alertasCriticos: number;
  conciliacoesBloqueadas: number;
  narrative: string;
};

export async function getExecutiveMonitoringSnapshot(projectId: string): Promise<ExecutiveMonitoringSnapshot> {
  const [closureQ, validationQ, alertsQ] = await Promise.all([
    dbQuery<{ period_ym: string; snapshot: Record<string, unknown> }>(
      `select period_ym, snapshot from monthly_closures where project_id=$1 order by created_at desc limit 1`,
      [projectId]
    ),
    dbQuery<{ decision: string; validated_at: string }>(
      `select decision, validated_at::text from closure_validations where project_id=$1 order by validated_at desc limit 1`,
      [projectId]
    ),
    dbQuery<{ critical_alerts: number }>(
      `select count(*)::int as critical_alerts from project_alerts where project_id=$1 and severity='critical'`,
      [projectId]
    ),
  ]);

  const snapshot = (closureQ.rows[0]?.snapshot || {}) as Record<string, any>;
  const resumo = (snapshot.resumoMensal || {}) as Record<string, number>;
  const obs = (snapshot.observaveis || {}) as Record<string, number>;
  const accounting = (snapshot.accountingFeed || {}) as Record<string, any>;

  return {
    latestClosurePeriod: closureQ.rows[0]?.period_ym || null,
    latestValidationDecision: validationQ.rows[0]?.decision || null,
    latestValidationAt: validationQ.rows[0]?.validated_at || null,
    faturamento: Number(resumo.faturamento || accounting?.dre?.receitaBruta || 0),
    resultadoOperacional: Number(resumo.resultadoOperacional || accounting?.dre?.resultadoOperacional || 0),
    carteiraVencida: Number(accounting?.carteira?.vencido || 0),
    alertasCriticos: Number(obs.alertasCriticosAtivos || alertsQ.rows[0]?.critical_alerts || 0),
    conciliacoesBloqueadas: Number(obs.conciliacoesBloqueadas || 0),
    narrative: String(snapshot.narrativaExecutiva || ''),
  };
}

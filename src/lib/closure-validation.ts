import { dbQuery } from "@/lib/db";

export type ClosureValidation = {
  id: string;
  decision: "aprovado" | "ajustar" | "bloquear";
  note: string | null;
  summary_text: string | null;
  validated_at: string;
};

export async function listClosureValidations(projectId: string, limit = 20) {
  const q = await dbQuery<ClosureValidation>(
    `select id, decision, note, summary_text, validated_at::text
     from closure_validations
     where project_id=$1
     order by validated_at desc
     limit $2`,
    [projectId, limit]
  ).catch(() => ({ rows: [] as ClosureValidation[] }));
  return q.rows;
}

export function buildClosureValidationSummary(input: {
  projectCode: string;
  periodYm: string;
  decision: string;
  note?: string;
  narrativaExecutiva?: string;
  faturamento?: number;
  resultadoOperacional?: number;
  alertasCriticos?: number;
  conciliacoesBloqueadas?: number;
}) {
  return [
    `Projeto: ${input.projectCode}`,
    `Período: ${input.periodYm}`,
    `Decisão do fechamento: ${input.decision}`,
    `Faturamento: ${(input.faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    `Resultado operacional: ${(input.resultadoOperacional || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    `Alertas críticos: ${input.alertasCriticos || 0}`,
    `Conciliações bloqueadas: ${input.conciliacoesBloqueadas || 0}`,
    `Narrativa: ${input.narrativaExecutiva || '-'}`,
    `Nota: ${input.note || '-'}`,
  ].join(' | ');
}

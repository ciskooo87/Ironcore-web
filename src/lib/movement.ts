import { dbQuery } from "@/lib/db";

export type MovementValidation = {
  id: string;
  decision: "aprovado" | "ajustar" | "bloquear";
  note: string | null;
  summary_text: string | null;
  validated_at: string;
};

export async function listMovementValidations(projectId: string, limit = 20) {
  const q = await dbQuery<MovementValidation>(
    `select id, decision, note, summary_text, validated_at::text
     from movement_validations
     where project_id=$1
     order by validated_at desc
     limit $2`,
    [projectId, limit]
  ).catch(() => ({ rows: [] as MovementValidation[] }));
  return q.rows;
}

export function buildValidatedMovementSummary(input: {
  projectCode: string;
  businessDate: string;
  decision: string;
  note?: string;
  recommendation?: string;
  gatingStatus?: string;
  blockingReasons?: string[];
  releaseSignals?: string[];
}) {
  return [
    `Projeto: ${input.projectCode}`,
    `Data: ${input.businessDate}`,
    `Decisão validada: ${input.decision}`,
    `Status decisório: ${input.gatingStatus || '-'}`,
    `Recomendação: ${input.recommendation || '-'}`,
    `Bloqueios: ${(input.blockingReasons || []).join(', ') || '-'}`,
    `Liberação: ${(input.releaseSignals || []).join(', ') || '-'}`,
    `Nota: ${input.note || '-'}`,
  ].join(' | ');
}

import { dbQuery } from "@/lib/db";

export type HistoricalDiagnosisValidation = {
  id: string;
  decision: "aprovado" | "ajustar" | "bloquear";
  note: string | null;
  summary_text: string | null;
  validated_at: string;
};

export async function listHistoricalDiagnosisValidations(projectId: string, limit = 20) {
  const q = await dbQuery<HistoricalDiagnosisValidation>(
    `select id, decision, note, summary_text, validated_at::text
     from historical_diagnosis_validations
     where project_id=$1
     order by validated_at desc
     limit $2`,
    [projectId, limit]
  ).catch(() => ({ rows: [] as HistoricalDiagnosisValidation[] }));
  return q.rows;
}

export function buildHistoricalValidationSummary(input: {
  projectCode: string;
  decision: string;
  note?: string;
  provider?: string;
  model?: string;
  createdAt?: string;
  response?: string;
}) {
  return [
    `Projeto: ${input.projectCode}`,
    `Decisão: ${input.decision}`,
    `Provider: ${input.provider || '-'}`,
    `Modelo: ${input.model || '-'}`,
    `Gerado em: ${input.createdAt || '-'}`,
    `Resposta: ${input.response || '-'}`,
    `Nota: ${input.note || '-'}`,
  ].join(' | ');
}

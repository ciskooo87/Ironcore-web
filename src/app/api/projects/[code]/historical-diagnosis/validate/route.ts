import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { dbQuery } from "@/lib/db";
import { updateSopStep } from "@/lib/sop";
import { buildHistoricalValidationSummary } from "@/lib/historical-validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=forbidden`));

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=csrf`));

  const inferenceRunId = String(form.get("inference_run_id") || "").trim();
  const decision = String(form.get("decision") || "").trim();
  const note = String(form.get("note") || "").trim();
  if (!inferenceRunId || !decision) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=required`));

  const dbUser = await getUserByEmail(user.email);
  const runQ = await dbQuery<{ provider: string; model: string | null; created_at: string; response: string | null }>(
    `select provider, model, created_at::text, response from ai_inference_runs where id=$1 and project_id=$2 limit 1`,
    [inferenceRunId, project.id]
  );
  const run = runQ.rows[0];
  const summaryText = buildHistoricalValidationSummary({
    projectCode: project.code,
    decision,
    note,
    provider: run?.provider,
    model: run?.model || undefined,
    createdAt: run?.created_at,
    response: run?.response || undefined,
  });

  await dbQuery(
    `insert into historical_diagnosis_validations(project_id, inference_run_id, decision, note, summary_text, validated_by)
     values($1,$2,$3,$4,$5,$6)`,
    [project.id, inferenceRunId, decision, note || null, summaryText, dbUser?.id || null]
  );

  await updateSopStep({
    projectId: project.id,
    stepKey: "validacao_diagnostico",
    status: decision === "aprovado" ? "concluido" : decision === "bloquear" ? "bloqueado" : "em_execucao",
    evidence: `validacao diagnostico inference:${inferenceRunId} decisao:${decision}`,
    note: note || `Decisão diagnóstico: ${decision}`,
    updatedBy: dbUser?.id || null,
  });

  await dbQuery(
    `insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [project.id, dbUser?.id || null, 'historical.diagnosis.validate', 'ai_inference_runs', inferenceRunId, JSON.stringify({ decision, note, summaryText })]
  );

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?saved=historical_validation`));
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { can } from "@/lib/rbac";
import { getUserByEmail } from "@/lib/users";
import { dbQuery } from "@/lib/db";
import { updateSopStep } from "@/lib/sop";
import { buildValidatedMovementSummary } from "@/lib/movement";
import { dispatchRoutineSummary } from "@/lib/notify";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "routine.run")) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?error=forbidden`));

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?error=csrf`));

  const routineRunId = String(form.get("routine_run_id") || "").trim();
  const decision = String(form.get("decision") || "").trim();
  const note = String(form.get("note") || "").trim();
  const sendSummary = String(form.get("send_summary") || "0") === "1";
  if (!routineRunId || !decision) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?error=required`));

  const dbUser = await getUserByEmail(user.email);
  const runQ = await dbQuery<{ business_date: string; summary: Record<string, unknown> }>(
    `select business_date::text, summary from routine_runs where id=$1 and project_id=$2 limit 1`,
    [routineRunId, project.id]
  );
  const run = runQ.rows[0];
  const summary = (run?.summary || {}) as Record<string, any>;
  const op = (summary.operationalDecision || {}) as Record<string, any>;
  const ai = (summary.aiAnalysis || {}) as Record<string, any>;
  const validatedSummary = buildValidatedMovementSummary({
    projectCode: project.code,
    businessDate: run?.business_date || '-',
    decision,
    note,
    recommendation: String(ai.recommendation || '-'),
    gatingStatus: String(op.gatingStatus || '-'),
    blockingReasons: Array.isArray(op.blockingReasons) ? op.blockingReasons : [],
    releaseSignals: Array.isArray(op.releaseSignals) ? op.releaseSignals : [],
  });

  await dbQuery(
    `insert into movement_validations(project_id, routine_run_id, decision, note, summary_text, validated_by)
     values($1,$2,$3,$4,$5,$6)`,
    [project.id, routineRunId, decision, note || null, validatedSummary, dbUser?.id || null]
  );

  await dbQuery(
    `insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [project.id, dbUser?.id || null, "movement.validate", "routine_runs", routineRunId, JSON.stringify({ decision, note })]
  );

  await updateSopStep({
    projectId: project.id,
    stepKey: "validacao_movimento",
    status: decision === "aprovado" ? "concluido" : decision === "bloquear" ? "bloqueado" : "em_execucao",
    evidence: `validacao movimento run:${routineRunId} decisao:${decision}`,
    note: note || `Decisão humana: ${decision}`,
    updatedBy: dbUser?.id || null,
  });

  await updateSopStep({
    projectId: project.id,
    stepKey: "movimento_diario",
    status: decision === "aprovado" ? "concluido" : decision === "bloquear" ? "bloqueado" : "aguardando_validacao",
    evidence: `movimento run:${routineRunId} decisao:${decision}`,
    note: note || `Decisão humana: ${decision}`,
    updatedBy: dbUser?.id || null,
  });

  if (sendSummary) {
    await dispatchRoutineSummary(validatedSummary);
  }

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?saved=validation`));
}

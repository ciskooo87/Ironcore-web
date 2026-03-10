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
import { buildClosureValidationSummary } from "@/lib/closure-validation";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fechamento-mensal/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "closure.create")) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fechamento-mensal/?error=forbidden`));

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fechamento-mensal/?error=csrf`));

  const closureId = String(form.get("closure_id") || "").trim();
  const decision = String(form.get("decision") || "").trim();
  const note = String(form.get("note") || "").trim();
  if (!closureId || !decision) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fechamento-mensal/?error=required`));

  const dbUser = await getUserByEmail(user.email);
  const closureQ = await dbQuery<{ period_ym: string; snapshot: Record<string, unknown> }>(
    `select period_ym, snapshot from monthly_closures where id=$1 and project_id=$2 limit 1`,
    [closureId, project.id]
  );
  const closure = closureQ.rows[0];
  const snapshot = (closure?.snapshot || {}) as Record<string, any>;
  const resumo = (snapshot.resumoMensal || {}) as Record<string, number>;
  const obs = (snapshot.observaveis || {}) as Record<string, number>;
  const summaryText = buildClosureValidationSummary({
    projectCode: project.code,
    periodYm: closure?.period_ym || '-',
    decision,
    note,
    narrativaExecutiva: String(snapshot.narrativaExecutiva || ''),
    faturamento: Number(resumo.faturamento || 0),
    resultadoOperacional: Number(resumo.resultadoOperacional || 0),
    alertasCriticos: Number(obs.alertasCriticosAtivos || 0),
    conciliacoesBloqueadas: Number(obs.conciliacoesBloqueadas || 0),
  });

  await dbQuery(
    `insert into closure_validations(project_id, closure_id, decision, note, summary_text, validated_by)
     values($1,$2,$3,$4,$5,$6)`,
    [project.id, closureId, decision, note || null, summaryText, dbUser?.id || null]
  );

  await updateSopStep({
    projectId: project.id,
    stepKey: "validacao_fechamento",
    status: decision === "aprovado" ? "concluido" : decision === "bloquear" ? "bloqueado" : "em_execucao",
    evidence: `validacao fechamento closure:${closureId} decisao:${decision}`,
    note: note || `Decisão fechamento: ${decision}`,
    updatedBy: dbUser?.id || null,
  });

  await updateSopStep({
    projectId: project.id,
    stepKey: "monitoramento_diretoria",
    status: decision === "aprovado" ? "aguardando_validacao" : decision === "bloquear" ? "bloqueado" : "nao_iniciado",
    evidence: `fechamento ${closure?.period_ym || '-'} pronto para monitoramento`,
    note: decision === "aprovado" ? "Fechamento validado e pronto para diretoria" : note || `Decisão fechamento: ${decision}`,
    updatedBy: dbUser?.id || null,
  });

  await dbQuery(
    `insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [project.id, dbUser?.id || null, 'closure.validate', 'monthly_closures', closureId, JSON.stringify({ decision, note, summaryText })]
  );

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fechamento-mensal/?saved=validation`));
}

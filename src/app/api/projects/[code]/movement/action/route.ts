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
  const action = String(form.get("action_key") || "").trim();
  const dbUser = await getUserByEmail(user.email);

  let linkedEntity: string | null = null;
  let linkedEntityId: string | null = routineRunId || null;
  let note = action;

  if (/concilia/i.test(action)) {
    linkedEntity = "sop_step_status";
    await updateSopStep({
      projectId: project.id,
      stepKey: "movimento_diario",
      status: "bloqueado",
      evidence: `acao automatica run:${routineRunId || '-'} conciliar_pendencias`,
      note: action,
      updatedBy: dbUser?.id || null,
    });
  } else if (/aprova|formaliza/i.test(action)) {
    linkedEntity = "sop_step_status";
    await updateSopStep({
      projectId: project.id,
      stepKey: "validacao_movimento",
      status: "em_execucao",
      evidence: `acao automatica run:${routineRunId || '-'} aprovar_formalizar`,
      note: action,
      updatedBy: dbUser?.id || null,
    });
  } else if (/cobran|vencid|renegocia/i.test(action)) {
    linkedEntity = "sop_step_status";
    await updateSopStep({
      projectId: project.id,
      stepKey: "painel_risco",
      status: "em_execucao",
      evidence: `acao automatica run:${routineRunId || '-'} carteira_vencida`,
      note: action,
      updatedBy: dbUser?.id || null,
    });
  }

  const actionInsert = await dbQuery<{ id: string }>(
    `insert into movement_actions(project_id, routine_run_id, action_key, action_label, status, linked_entity, linked_entity_id, note, executed_by, executed_at)
     values($1,$2,$3,$4,'done',$5,$6,$7,$8,now()) returning id`,
    [project.id, routineRunId || null, action, action, linkedEntity, linkedEntityId, note, dbUser?.id || null]
  );

  await dbQuery(
    `insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [project.id, dbUser?.id || null, "movement.action.execute", "movement_actions", actionInsert.rows[0]?.id || null, JSON.stringify({ action, linkedEntity, linkedEntityId })]
  );

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?saved=action`));
}

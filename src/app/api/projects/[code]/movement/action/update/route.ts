import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { can } from "@/lib/rbac";
import { getUserByEmail } from "@/lib/users";
import { dbQuery } from "@/lib/db";
import { addOperationEvent } from "@/lib/operations";

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

  const actionId = String(form.get("action_id") || "").trim();
  const mode = String(form.get("mode") || "").trim();
  const assigneeName = String(form.get("assignee_name") || "").trim();
  const note = String(form.get("note") || "").trim();
  const dbUser = await getUserByEmail(user.email);

  const q = await dbQuery<{ linked_entity: string | null; linked_entity_id: string | null; action_label: string }>(
    `update movement_actions
     set assignee_name = case when $3 <> '' then $3 else assignee_name end,
         status = case when $2='done' then 'done' when $2='reopen' then 'open' else status end,
         closed_note = case when $2='done' then nullif($4,'') else closed_note end,
         executed_by = $5,
         executed_at = case when $2='done' then now() else executed_at end,
         reopened_at = case when $2='reopen' then now() else reopened_at end
     where id=$1 and project_id=$6
     returning linked_entity, linked_entity_id, action_label`,
    [actionId, mode, assigneeName, note, dbUser?.id || null, project.id]
  );

  const row = q.rows[0];
  if (row?.linked_entity === 'financial_operations' && row.linked_entity_id) {
    await addOperationEvent({
      projectId: project.id,
      operationId: row.linked_entity_id,
      eventType: mode === 'reopen' ? 'movement_action_reopened' : 'movement_action_done',
      eventLabel: mode === 'reopen' ? 'Ação do movimento reaberta' : 'Ação do movimento concluída',
      payload: { actionId, actionLabel: row.action_label, note, assigneeName },
      actorName: user.email,
    });
  }

  await dbQuery(
    `insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [project.id, dbUser?.id || null, `movement.action.${mode}`, 'movement_actions', actionId, JSON.stringify({ assigneeName, note })]
  );

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/movimento-diario/?saved=action_update`));
}

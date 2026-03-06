import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { can } from "@/lib/rbac";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { dbQuery } from "@/lib/db";
import { assertSopPermission, updateSopStep, type SopStatus } from "@/lib/sop";

const ALLOWED_STATUS: SopStatus[] = ["nao_iniciado", "em_execucao", "aguardando_validacao", "concluido", "bloqueado"];

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);

  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "routine.run")) {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=forbidden`));
  }

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=csrf`));

  const stepKey = String(form.get("step_key") || "").trim();
  const status = String(form.get("status") || "").trim() as SopStatus;
  const evidence = String(form.get("evidence") || "").trim();
  const note = String(form.get("note") || "").trim();

  if (!stepKey || !ALLOWED_STATUS.includes(status)) {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=sop_payload`));
  }

  try {
    assertSopPermission({ role: user.role, stepKey, status });

    const dbUser = await getUserByEmail(user.email);
    const out = await updateSopStep({
      projectId: project.id,
      stepKey,
      status,
      evidence,
      note,
      updatedBy: dbUser?.id || null,
    });

    await dbQuery(
      "insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data) values($1,$2,$3,$4,$5,$6::jsonb)",
      [project.id, dbUser?.id || null, "sop.step.update", "sop_step_status", out.step, JSON.stringify(out)]
    );

    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?sop_saved=1`));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "sop_error";
    if (msg === "evidence_required") {
      return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=evidence_required`));
    }
    if (msg === "step_not_found") {
      return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=step_not_found`));
    }
    if (msg === "approval_role_required") {
      return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=approval_role_required`));
    }
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=sop_error`));
  }
}

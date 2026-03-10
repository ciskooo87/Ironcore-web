import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { can } from "@/lib/rbac";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { updateOperationStatus, type OperationStatus } from "@/lib/operations";
import { getUserByEmail } from "@/lib/users";
import { dbQuery } from "@/lib/db";

const ALLOWED = new Set([
  "em_elaboracao",
  "em_correcao",
  "pendente_aprovacao",
  "aprovada",
  "em_correcao_formalizacao",
  "pendente_formalizacao",
  "formalizada",
  "cancelada",
]);

export async function POST(req: Request, ctx: { params: Promise<{ code: string; opId: string }> }) {
  const { code, opId } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "ops.create")) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/?error=forbidden`));

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/?error=csrf`));

  const status = String(form.get("status") || "").trim() as OperationStatus;
  const note = String(form.get("note") || "").trim();
  if (!ALLOWED.has(status)) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/?error=status`));

  const dbUser = await getUserByEmail(user.email);
  await updateOperationStatus({ projectId: project.id, opId, status, note, approverName: user.email });
  await dbQuery(
    "insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data) values($1,$2,$3,$4,$5,$6::jsonb)",
    [project.id, dbUser?.id || null, "operation.status.update", "financial_operations", opId, JSON.stringify({ status, note })]
  );

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/?saved=1`));
}

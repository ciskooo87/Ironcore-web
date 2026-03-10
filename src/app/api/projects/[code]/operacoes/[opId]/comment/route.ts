import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { addOperationComment } from "@/lib/operations";

export async function POST(req: Request, ctx: { params: Promise<{ code: string; opId: string }> }) {
  const { code, opId } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=forbidden`));

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=csrf`));

  const body = String(form.get("body") || "").trim();
  if (!body) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=required`));

  const dbUser = await getUserByEmail(user.email);
  await addOperationComment({ projectId: project.id, operationId: opId, body, authorUserId: dbUser?.id || null, authorName: user.email });
  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?saved=comment`));
}

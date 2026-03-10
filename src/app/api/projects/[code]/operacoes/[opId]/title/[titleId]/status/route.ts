import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { updateOperationTitleStatus } from "@/lib/operations";

export async function POST(req: Request, ctx: { params: Promise<{ code: string; opId: string; titleId: string }> }) {
  const { code, opId, titleId } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=forbidden`));

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=csrf`));

  const carteiraStatus = String(form.get("carteira_status") || "").trim();
  const paymentMethod = String(form.get("payment_method") || "").trim();
  const note = String(form.get("note") || "").trim();

  await updateOperationTitleStatus({ projectId: project.id, titleId, carteiraStatus, paymentMethod, note });
  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?saved=title_status`));
}

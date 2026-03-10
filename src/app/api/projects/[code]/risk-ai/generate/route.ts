import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { generateRiskSuggestion } from "@/lib/risk-ai";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?error=forbidden`));

  const form = await req.formData();
  const report = String(form.get('report') || '').trim();
  const opportunity = String(form.get('opportunity') || '').trim();
  if (!report) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?error=required`));

  const dbUser = await getUserByEmail(user.email);
  await generateRiskSuggestion({
    projectId: project.id,
    projectCode: project.code,
    summary: project.project_summary || '',
    report,
    opportunity,
    createdBy: dbUser?.id || null,
  });

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?saved=ai`));
}

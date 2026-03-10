import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { listRiskSuggestions, markRiskSuggestion } from "@/lib/risk-ai";
import { createProjectAlert } from "@/lib/alerts";
import { updateSopStep } from "@/lib/sop";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?error=forbidden`));

  const form = await req.formData();
  const suggestionId = String(form.get('suggestion_id') || '').trim();
  const action = String(form.get('action') || '').trim();
  const dbUser = await getUserByEmail(user.email);
  const suggestions = await listRiskSuggestions(project.id, 50);
  const suggestion = suggestions.find((s) => s.id === suggestionId);
  if (!suggestion) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?error=not_found`));

  if (action === 'approve') {
    const r = suggestion.response as Record<string, any>;
    await createProjectAlert({
      projectId: project.id,
      name: String(r.title || 'Risco sugerido por IA'),
      severity: (String(r.severity || 'medium') as any),
      blockFlow: Boolean(r.blockFlow),
      rule: { rationale: r.rationale || '', recommendations: r.recommendations || [] },
    });
    await markRiskSuggestion(project.id, suggestionId, 'approved');
    await updateSopStep({
      projectId: project.id,
      stepKey: 'riscos',
      status: 'concluido',
      evidence: `risk_ai approved:${suggestionId}`,
      note: 'Sugestão de risco IA aprovada e convertida em alerta',
      updatedBy: dbUser?.id || null,
    });
  } else {
    await markRiskSuggestion(project.id, suggestionId, 'discarded');
  }

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/riscos-alertas/?saved=ai_apply`));
}

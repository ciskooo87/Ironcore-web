import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { publicUrl } from "@/lib/request-url";
import { can } from "@/lib/rbac";
import { getUserByEmail } from "@/lib/users";
import { buildAccountingFeed, saveAccountingFeed } from "@/lib/accounting";
import { updateSopStep } from "@/lib/sop";
import { dbQuery } from "@/lib/db";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/dre-dfc/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "closure.create")) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/dre-dfc/?error=forbidden`));

  const form = await req.formData();
  const periodYm = String(form.get("period_ym") || "").trim();
  if (!/^\d{4}-\d{2}$/.test(periodYm)) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/dre-dfc/?error=period`));

  const dbUser = await getUserByEmail(user.email);
  const payload = await buildAccountingFeed(project.id, periodYm);
  const feedId = await saveAccountingFeed(project.id, periodYm, payload, dbUser?.id || null);

  await updateSopStep({
    projectId: project.id,
    stepKey: "alimentacao_contabil",
    status: "concluido",
    evidence: `accounting_feed ${periodYm} feed:${feedId || '-'}`,
    note: "DRE/DFC consolidado gerado no sistema",
    updatedBy: dbUser?.id || null,
  });

  await dbQuery(
    `insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [project.id, dbUser?.id || null, "accounting.generate", "accounting_feeds", feedId || null, JSON.stringify({ periodYm, payload })]
  );

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/dre-dfc/?saved=1`));
}

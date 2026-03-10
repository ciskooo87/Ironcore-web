import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { dbQuery } from "@/lib/db";
import { createHistoricalDiagnosis } from "@/lib/historical-diagnosis";
import { updateSopStep } from "@/lib/sop";
import { assertProjectOnboardingComplete } from "@/lib/onboarding-guard";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=forbidden`));

  try {
    assertProjectOnboardingComplete(project);
  } catch {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=onboarding_incomplete`));
  }

  try {
    const dbUser = await getUserByEmail(user.email);
    const out = await createHistoricalDiagnosis({
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      projectSummary: project.project_summary || "",
    });

    await dbQuery(
      "insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data) values($1,$2,$3,$4,$5,$6::jsonb)",
      [project.id, dbUser?.id || null, "historical.diagnosis.run", "ai_inference_runs", String(out.inferenceId || ""), JSON.stringify(out)]
    );

    await updateSopStep({
      projectId: project.id,
      stepKey: "analise_base_historica",
      status: "concluido",
      evidence: `diagnóstico histórico inference:${out.inferenceId || "-"}`,
      note: `provider=${out.provider} status=${out.status}`,
      updatedBy: dbUser?.id || null,
    });

    await updateSopStep({
      projectId: project.id,
      stepKey: "validacao_diagnostico",
      status: "aguardando_validacao",
      evidence: `diagnóstico histórico inference:${out.inferenceId || "-"}`,
      note: "Diagnóstico histórico gerado e aguardando validação final",
      updatedBy: dbUser?.id || null,
    });

    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?saved=historical_diagnosis`));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "historical_diagnosis_error";
    if (msg === "historical_upload_missing") {
      return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=historical_upload_missing`));
    }
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/fluxo-trabalho/?error=historical_diagnosis_error`));
  }
}

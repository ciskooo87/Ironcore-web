import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { assertProjectOnboardingComplete } from "@/lib/onboarding-guard";
import { canAccessProject } from "@/lib/permissions";
import { runDailyRoutine } from "@/lib/routine";
import { dbQuery } from "@/lib/db";
import { getUserByEmail } from "@/lib/users";
import { dispatchRoutineSummary } from "@/lib/notify";
import { withRetry } from "@/lib/retry-policy";
import { validateCsrf } from "@/lib/csrf";
import { can } from "@/lib/rbac";
import { publicUrl } from "@/lib/request-url";
import { getSopStepStatus, updateSopStep } from "@/lib/sop";
import { deepseekChat } from "@/lib/deepseek";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "routine.run")) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=forbidden`));
  try {
    assertProjectOnboardingComplete(project);
  } catch {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=onboarding_incomplete`));
  }

  const form = await req.formData();
  const csrfOk = await validateCsrf(form);
  if (!csrfOk) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=csrf`));

  const businessDate = String(form.get("business_date") || "");
  if (!businessDate) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=date`));
  const autoDelivery = String(form.get("auto_delivery") || "1") === "1";

  const [cadastroStep, uploadStep] = await Promise.all([
    getSopStepStatus(project.id, "cadastro"),
    getSopStepStatus(project.id, "upload_base_diaria"),
  ]);

  if (!cadastroStep || cadastroStep.status === "nao_iniciado") {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=sop_prereq_cadastro`));
  }
  if (!uploadStep || uploadStep.status === "nao_iniciado") {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?error=sop_prereq_upload_base_diaria`));
  }

  const out = await runDailyRoutine(project.id, businessDate, project.code);
  const dbUser = await getUserByEmail(user.email);
  const summaryText = String((out.summary.delivery as Record<string, unknown> | undefined)?.summaryText || "Rotina executada");
  const deliveries = autoDelivery
    ? await withRetry(() => dispatchRoutineSummary(summaryText))
    : [{ channel: "telegram", target: null, status: "skipped", message: "Envio automático desativado na execução" }];

  for (const d of deliveries) {
    await dbQuery(
      "insert into delivery_runs(project_id, routine_run_id, channel, target, status, provider_message, payload) values($1,$2,$3,$4,$5,$6,$7::jsonb)",
      [project.id, out.id || null, d.channel, d.target || null, d.status, d.message, JSON.stringify({ summaryText, autoDelivery })]
    );
  }

  await dbQuery(
    "insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data) values($1,$2,$3,$4,$5,$6::jsonb)",
    [project.id, dbUser?.id || null, "routine.run", "routine_runs", out.id || null, JSON.stringify({ ...out, deliveries })]
  );

  const routineEvidence = `rotina diária ${businessDate} run:${out.id || "-"} status:${out.status}`;
  await updateSopStep({
    projectId: project.id,
    stepKey: "painel_risco",
    status: out.status === "blocked" ? "bloqueado" : "concluido",
    evidence: routineEvidence,
    note: "Atualizado automaticamente pela rotina diária",
    updatedBy: dbUser?.id || null,
  });

  await updateSopStep({
    projectId: project.id,
    stepKey: "movimento_diario",
    status: out.status === "blocked" ? "bloqueado" : "aguardando_validacao",
    evidence: routineEvidence,
    note: out.status === "blocked" ? "Bloqueio por alerta/pendência" : "Aguardando validação humana da decisão diária",
    updatedBy: dbUser?.id || null,
  });

  // Diagnóstico IA (DeepSeek) acoplado ao fluxo de risco/SOP — best effort
  try {
    const summary = out.summary as Record<string, any>;
    const context = {
      projectCode: project.code,
      projectName: project.name,
      businessDate,
      routineStatus: out.status,
      summary,
      alertLevel: summary?.alertsTriggered?.some?.((a: any) => a?.severity === "critical" || a?.block === true)
        ? "critical"
        : out.status === "blocked"
          ? "high"
          : out.status === "warning"
            ? "medium"
            : "low",
      riskPanelStatus: summary?.reconciliation?.status,
      todayDecision: summary?.aiAnalysis?.recommendation,
    };

    const ai = await deepseekChat([
      {
        role: "system",
        content:
          "Você é o motor de diagnóstico operacional do IronCore. Responda apenas JSON com diagnosis, risks, recommendations e decision_confidence (0-1).",
      },
      {
        role: "user",
        content: `Faça o diagnóstico operacional para o fechamento diário com base no contexto:\n${JSON.stringify(context)}`,
      },
    ]);

    await dbQuery(
      "insert into ai_inference_runs(project_id, routine_run_id, provider, model, latency_ms, status, prompt, response) values($1,$2,$3,$4,$5,$6,$7,$8)",
      [project.id, out.id || null, "deepseek", ai.model, ai.latencyMs, "ok", JSON.stringify(context), ai.content]
    );

    await dbQuery(
      "insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data) values($1,$2,$3,$4,$5,$6::jsonb)",
      [project.id, dbUser?.id || null, "ai.diagnose", "ai_inference_runs", out.id || null, JSON.stringify({ provider: "deepseek", model: ai.model, latencyMs: ai.latencyMs })]
    );
  } catch (e) {
    await dbQuery(
      "insert into ai_inference_runs(project_id, routine_run_id, provider, model, latency_ms, status, prompt, response, error) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [project.id, out.id || null, "deepseek", process.env.DEEPSEEK_MODEL || "deepseek-chat", 0, "error", JSON.stringify({ businessDate, projectCode: project.code }), "", String(e)]
    );
  }

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/rotina-diaria/?saved=1`));
}

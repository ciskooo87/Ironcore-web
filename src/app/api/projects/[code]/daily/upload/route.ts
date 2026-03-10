import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { getUserByEmail } from "@/lib/users";
import { insertDailyEntry } from "@/lib/daily";
import { dbQuery } from "@/lib/db";
import { parseUploadedFile } from "@/lib/upload";
import { diffDaysFromSaoPaulo } from "@/lib/time";
import { publicUrl } from "@/lib/request-url";
import { updateSopStep } from "@/lib/sop";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/diario/?error=forbidden`));

  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/diario/?error=forbidden`));

  const form = await req.formData();
  const businessDate = String(form.get("business_date") || "");
  const uploadKind = String(form.get("upload_kind") || "base_diaria");
  const historicalKinds = new Set([
    "historico_faturamento",
    "historico_contas_pagar",
    "historico_contas_receber",
    "historico_extratos",
    "historico_estoques",
    "historico_carteira",
    "historico_borderos",
    "historico_endividamento",
  ]);
  const file = form.get("file");
  const notes = String(form.get("notes") || "");

  const daysAgo = diffDaysFromSaoPaulo(businessDate);
  if (Number.isNaN(daysAgo) || daysAgo < 0 || daysAgo > 5) {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/diario/?error=date_limit`));
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/diario/?error=file_required`));
  }

  try {
    const parsed = await parseUploadedFile(file);
    const payload = {
      faturamento: uploadKind === "extrato" ? 0 : parsed.faturamento,
      contas_receber: uploadKind === "extrato" ? 0 : parsed.contas_receber,
      contas_pagar: uploadKind === "extrato" ? 0 : parsed.contas_pagar,
      extrato_bancario: uploadKind === "extrato" ? parsed.extrato_bancario || parsed.faturamento || parsed.contas_receber : parsed.extrato_bancario,
      duplicatas: uploadKind === "extrato" ? 0 : parsed.duplicatas,
      notes: `${notes} | upload_kind:${uploadKind} arquivo:${file.name} linhas:${parsed.lines}`.trim(),
      fidc_flags: uploadKind === "fidc_retorno"
        ? {
            vencidos: /vencid/i.test(notes),
            recompras: /recompra|recompras/i.test(notes),
            risco_concentrado: /concentrad|limite|inadimpl/i.test(notes),
          }
        : undefined,
    };

    const dbUser = await getUserByEmail(user.email);
    const id = await insertDailyEntry({
      projectId: project.id,
      businessDate,
      sourceType: "upload",
      payload,
      createdBy: dbUser?.id || null,
    });

    await dbQuery(
      "insert into audit_log(project_id, actor_user_id, action, entity, entity_id, after_data) values($1,$2,$3,$4,$5,$6::jsonb)",
      [project.id, dbUser?.id || null, "daily.upload", "daily_entries", id || null, JSON.stringify({ uploadKind, file: file.name, payload })]
    );

    if (historicalKinds.has(uploadKind)) {
      await updateSopStep({
        projectId: project.id,
        stepKey: "upload_base_historica",
        status: "concluido",
        evidence: `upload histórico ${uploadKind} arquivo:${file.name}`,
        note: `business_date=${businessDate}`,
        updatedBy: dbUser?.id || null,
      });

      await updateSopStep({
        projectId: project.id,
        stepKey: "analise_base_historica",
        status: "aguardando_validacao",
        evidence: `base histórica carregada via ${uploadKind}`,
        note: "Pronta para análise diagnóstica e validação",
        updatedBy: dbUser?.id || null,
      });
    } else if (uploadKind === "fidc_retorno") {
      await updateSopStep({
        projectId: project.id,
        stepKey: "painel_risco",
        status: "aguardando_validacao",
        evidence: `retorno FIDC ${businessDate} arquivo:${file.name}`,
        note: "Retorno FIDC enviado para atualização do painel de risco",
        updatedBy: dbUser?.id || null,
      });
    } else {
      await updateSopStep({
        projectId: project.id,
        stepKey: "upload_base_diaria",
        status: "concluido",
        evidence: `upload diário ${businessDate} arquivo:${file.name}`,
        note: `upload_kind=${uploadKind}`,
        updatedBy: dbUser?.id || null,
      });
    }

    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/diario/?saved=1`));
  } catch {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/diario/?error=upload_parse`));
  }
}

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { validateCsrf } from "@/lib/csrf";
import { publicUrl } from "@/lib/request-url";
import { getUserByEmail } from "@/lib/users";
import { addOperationTitle } from "@/lib/operations";

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

  const titleRef = String(form.get("title_ref") || "").trim();
  const debtorName = String(form.get("debtor_name") || "").trim();
  const debtorDoc = String(form.get("debtor_doc") || "").trim();
  const faceValue = Number(form.get("face_value") || 0);
  const presentValue = Number(form.get("present_value") || 0);
  const dueDate = String(form.get("due_date") || "").trim() || null;
  const expectedSettlementDate = String(form.get("expected_settlement_date") || "").trim() || null;
  const paymentMethod = String(form.get("payment_method") || "").trim();
  const carteiraStatus = String(form.get("carteira_status") || "a_vencer").trim();
  const note = String(form.get("note") || "").trim();

  if (!titleRef || faceValue <= 0) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?error=required`));

  const dbUser = await getUserByEmail(user.email);
  await addOperationTitle({
    projectId: project.id,
    operationId: opId,
    titleRef,
    debtorName,
    debtorDoc,
    faceValue,
    presentValue,
    dueDate,
    expectedSettlementDate,
    paymentMethod,
    carteiraStatus,
    note,
    createdBy: dbUser?.id || null,
  });

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/operacoes/${opId}/?saved=title`));
}

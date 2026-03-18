import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessionUser } from "@/lib/auth";
import { getProjectByCode, updateProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { can } from "@/lib/rbac";
import { publicUrl } from "@/lib/request-url";

type ImportedSupplier = {
  supplier: string;
  type?: string;
  nature?: string;
  subclassification?: string;
  classification?: string;
  movement?: string;
  flow?: string;
};

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const user = await getSessionUser();
  const project = await getProjectByCode(code);
  if (!user || !project) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=forbidden`));
  const allowed = await canAccessProject(user, project.id);
  if (!allowed || !can(user.role, "project.edit")) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=forbidden`));

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=file`));
  const lowerName = file.name.toLowerCase();
  if (!(lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsm"))) {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=file_type`));
  }
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=file_size`));
  }

  const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: "buffer" });
  const suppliersSheet = wb.Sheets[wb.SheetNames.find((s) => s.toLowerCase().includes("fornecedor")) || ""];
  const planoSheet = wb.Sheets[wb.SheetNames.find((s) => s.toLowerCase().includes("plano")) || ""];
  if (!suppliersSheet || !planoSheet) return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?error=sheet`));

  const supplierRows = XLSX.utils.sheet_to_json<any[]>(suppliersSheet, { header: 1, defval: "" }).slice(1);
  const planoRows = XLSX.utils.sheet_to_json<any[]>(planoSheet, { header: 1, defval: "" }).slice(1);

  const suppliersBase = supplierRows
    .map((r) => ({ supplier: String(r[0] || "").trim(), type: String(r[1] || "").trim() }))
    .filter((r) => r.supplier);

  const planoMap = new Map<string, ImportedSupplier>();
  for (const r of planoRows) {
    const supplier = String(r[0] || "").trim();
    if (!supplier) continue;
    planoMap.set(supplier, {
      supplier,
      type: String(r[1] || "").trim(),
      nature: String(r[2] || "").trim(),
      subclassification: String(r[3] || "").trim(),
      classification: String(r[4] || "").trim(),
      movement: String(r[5] || "").trim(),
      flow: String(r[6] || "").trim(),
    });
  }

  const merged: ImportedSupplier[] = suppliersBase.map((row) => {
    const detailed = planoMap.get(row.supplier);
    return detailed || row;
  });

  const accountPlan = Array.from(new Set(planoRows.map((r) => String(r[4] || "").trim()).filter(Boolean)));

  await updateProjectByCode(code, {
    name: project.name,
    cnpj: project.cnpj,
    legalName: project.legal_name,
    segment: project.segment,
    timezone: project.timezone,
    partners: project.partners || [],
    accountPlan: accountPlan.length ? accountPlan : (project.account_plan || []),
    projectSummary: project.project_summary || "",
    financialProfile: {
      tx_percent: Number((project.financial_profile as any)?.tx_percent || 0),
      float_days: Number((project.financial_profile as any)?.float_days || 0),
      tac: Number((project.financial_profile as any)?.tac || 0),
      cost_per_boleto: Number((project.financial_profile as any)?.cost_per_boleto || 0),
    },
    supplierClasses: merged,
  });

  return NextResponse.redirect(publicUrl(req, `/projetos/${code}/cadastro/?saved=import`));
}

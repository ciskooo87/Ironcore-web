import { dbQuery } from "@/lib/db";

export type SupplierClass = {
  supplier: string;
  account?: string;
  type?: string;
  nature?: string;
  subclassification?: string;
  classification?: string;
  movement?: string;
  flow?: string;
};

export type FinancialProfile = {
  tx_percent: number;
  float_days: number;
  tac: number;
  cost_per_boleto: number;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  cnpj: string;
  legal_name: string;
  partners: string[];
  segment: string;
  timezone: string;
  account_plan: string[];
  project_summary: string;
  financial_profile: Partial<FinancialProfile>;
  supplier_classes: SupplierClass[];
};

export type OnboardingCheck = {
  key: string;
  label: string;
  done: boolean;
};

const BASE_SELECT = "id, code, name, cnpj, legal_name, partners, segment, timezone, account_plan, project_summary, financial_profile, supplier_classes";

export async function listProjects() {
  try {
    const q = await dbQuery<Project>(`select ${BASE_SELECT} from projects order by created_at desc`);
    return q.rows;
  } catch {
    return [] as Project[];
  }
}

export async function listProjectsForUser(email: string, role: string) {
  if (role === "admin_master" || role === "diretoria" || role === "head") return listProjects();
  try {
    const q = await dbQuery<Project>(
      `select p.${BASE_SELECT} from projects p
       join project_permissions pp on pp.project_id = p.id
       join users u on u.id = pp.user_id
       where u.email = $1
       order by p.created_at desc`,
      [email.toLowerCase()]
    );
    return q.rows;
  } catch {
    return [] as Project[];
  }
}

export async function getProjectByCode(code: string) {
  try {
    const normalized = String(code).trim();
    const numeric = normalized.match(/^0+\d+$/) ? String(Number(normalized)) : normalized;
    const q = await dbQuery<Project>(`select ${BASE_SELECT} from projects where code::text = $1 or code::text = $2`, [normalized, numeric]);
    return q.rows[0] || null;
  } catch {
    return null;
  }
}

export async function createProject(input: {
  code: string;
  name: string;
  cnpj: string;
  legalName: string;
  segment: string;
  partners: string[];
  timezone: string;
  accountPlan: string[];
}) {
  const q = await dbQuery(
    "insert into projects(code,name,cnpj,legal_name,segment,partners,timezone,account_plan) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb) returning id",
    [input.code, input.name, input.cnpj, input.legalName, input.segment, JSON.stringify(input.partners), input.timezone, JSON.stringify(input.accountPlan)]
  );
  return q.rows[0];
}

export function getProjectOnboardingChecks(project: Project): OnboardingCheck[] {
  const fp = project.financial_profile || {};
  return [
    { key: "name", label: "Nome do projeto preenchido", done: Boolean(project.name?.trim()) },
    { key: "cnpj", label: "CNPJ preenchido", done: Boolean(project.cnpj?.trim()) },
    { key: "legal_name", label: "Razão social preenchida", done: Boolean(project.legal_name?.trim()) },
    { key: "segment", label: "Segmento preenchido", done: Boolean(project.segment?.trim()) },
    { key: "project_summary", label: "Resumo do projeto preenchido", done: Boolean(project.project_summary?.trim()) },
    { key: "account_plan", label: "Plano de contas preenchido", done: (project.account_plan || []).length > 0 },
    { key: "supplier_classes", label: "Classificação de fornecedores preenchida", done: (project.supplier_classes || []).length > 0 },
    { key: "tx_percent", label: "TX configurada", done: fp.tx_percent !== undefined && Number(fp.tx_percent) >= 0 },
    { key: "float_days", label: "Float configurado", done: fp.float_days !== undefined && Number(fp.float_days) >= 0 },
    { key: "tac", label: "TAC configurado", done: fp.tac !== undefined && Number(fp.tac) >= 0 },
    { key: "cost_per_boleto", label: "Custo por boleto configurado", done: fp.cost_per_boleto !== undefined && Number(fp.cost_per_boleto) >= 0 },
  ];
}

export function isProjectOnboardingComplete(project: Project) {
  return getProjectOnboardingChecks(project).every((item) => item.done);
}

export async function updateProjectByCode(code: string, input: {
  name: string;
  cnpj: string;
  legalName: string;
  segment: string;
  partners: string[];
  timezone: string;
  accountPlan: string[];
  projectSummary: string;
  financialProfile: FinancialProfile;
  supplierClasses: SupplierClass[];
}) {
  const normalized = String(code).trim();
  const numeric = normalized.match(/^0+\d+$/) ? String(Number(normalized)) : normalized;
  await dbQuery(
    `update projects
     set name=$3, cnpj=$4, legal_name=$5, segment=$6, partners=$7::jsonb, timezone=$8,
         account_plan=$9::jsonb, project_summary=$10, financial_profile=$11::jsonb, supplier_classes=$12::jsonb,
         updated_at=now()
     where code::text=$1 or code::text=$2`,
    [
      normalized,
      numeric,
      input.name,
      input.cnpj,
      input.legalName,
      input.segment,
      JSON.stringify(input.partners),
      input.timezone,
      JSON.stringify(input.accountPlan),
      input.projectSummary,
      JSON.stringify(input.financialProfile),
      JSON.stringify(input.supplierClasses),
    ]
  );
}

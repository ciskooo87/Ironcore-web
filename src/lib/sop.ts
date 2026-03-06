import { dbQuery } from "@/lib/db";
import type { UserRole } from "@/lib/auth";

export type SopStatus = "nao_iniciado" | "em_execucao" | "aguardando_validacao" | "concluido" | "bloqueado";

type SopPhase = "IMPLEMENTACAO" | "OPERACAO_DIARIA" | "FECHAMENTO";
type SopApproveRole = "consultor" | "head" | "diretoria";

export type SopStepDefinition = {
  key: string;
  phase: SopPhase;
  order: number;
  title: string;
  slaHours?: number;
  concludeMinRole?: SopApproveRole;
};

export const SOP_STEPS: readonly SopStepDefinition[] = [
  { key: "cadastro", phase: "IMPLEMENTACAO", order: 1, title: "Cadastro", concludeMinRole: "head" },
  { key: "riscos", phase: "IMPLEMENTACAO", order: 2, title: "Riscos", concludeMinRole: "head" },
  { key: "upload_base_historica", phase: "IMPLEMENTACAO", order: 3, title: "Upload Base Histórica", concludeMinRole: "head" },
  { key: "analise_base_historica", phase: "IMPLEMENTACAO", order: 4, title: "Análise Base Histórica", concludeMinRole: "head" },
  { key: "validacao_diagnostico", phase: "IMPLEMENTACAO", order: 5, title: "Validação do Diagnóstico", concludeMinRole: "diretoria" },
  { key: "upload_base_diaria", phase: "OPERACAO_DIARIA", order: 1, title: "Upload Base Diária", slaHours: 24, concludeMinRole: "consultor" },
  { key: "painel_risco", phase: "OPERACAO_DIARIA", order: 2, title: "Painel de Risco", slaHours: 24, concludeMinRole: "consultor" },
  { key: "movimento_diario", phase: "OPERACAO_DIARIA", order: 3, title: "Movimento Diário", slaHours: 24, concludeMinRole: "head" },
  { key: "validacao_movimento", phase: "OPERACAO_DIARIA", order: 4, title: "Validação do Movimento Diário", slaHours: 24, concludeMinRole: "head" },
  { key: "alimentacao_contabil", phase: "FECHAMENTO", order: 1, title: "Alimentação Contábil", slaHours: 24, concludeMinRole: "consultor" },
  { key: "fechamento_mensal", phase: "FECHAMENTO", order: 2, title: "Fechamento Mensal", concludeMinRole: "head" },
  { key: "validacao_fechamento", phase: "FECHAMENTO", order: 3, title: "Validação do Fechamento", concludeMinRole: "diretoria" },
  { key: "monitoramento_diretoria", phase: "FECHAMENTO", order: 4, title: "Monitoramento Diretoria", slaHours: 24, concludeMinRole: "diretoria" },
] as const;

type SopStepRow = {
  step_key: string;
  status: SopStatus;
  evidence: string | null;
  note: string | null;
  updated_at: string;
};

export type SopStepView = SopStepDefinition & {
  status: SopStatus;
  evidence: string;
  note: string;
  updated_at: string | null;
  slaState: "ok" | "atrasado" | "n/a";
};

const STEP_MAP = new Map(SOP_STEPS.map((s) => [s.key, s]));
const ROLE_ORDER: Record<SopApproveRole | "admin_master", number> = {
  consultor: 1,
  head: 2,
  diretoria: 3,
  admin_master: 99,
};

function parseIsoDateSafe(input: string | null): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeSlaState(step: SopStepDefinition, updatedAt: string | null): SopStepView["slaState"] {
  if (!step.slaHours) return "n/a";
  const updated = parseIsoDateSafe(updatedAt);
  if (!updated) return "atrasado";
  const elapsedHours = (Date.now() - updated.getTime()) / 3_600_000;
  return elapsedHours > step.slaHours ? "atrasado" : "ok";
}

function hasRoleAtLeast(role: UserRole, minRole: SopApproveRole) {
  if (role === "admin_master") return true;
  const current = ROLE_ORDER[role as SopApproveRole] || 0;
  return current >= ROLE_ORDER[minRole];
}

export function assertSopPermission(input: { role: UserRole; stepKey: string; status: SopStatus }) {
  const step = STEP_MAP.get(input.stepKey);
  if (!step) throw new Error("step_not_found");

  if (input.status === "concluido" && step.concludeMinRole && !hasRoleAtLeast(input.role, step.concludeMinRole)) {
    throw new Error("approval_role_required");
  }
}

export async function listSopSteps(projectId: string): Promise<SopStepView[]> {
  let rows: SopStepRow[] = [];
  try {
    const q = await dbQuery<SopStepRow>(
      "select step_key, status, evidence, note, updated_at::text from sop_step_status where project_id=$1",
      [projectId]
    );
    rows = q.rows;
  } catch {
    rows = [];
  }

  const byKey = new Map(rows.map((r) => [r.step_key, r]));

  return SOP_STEPS.map((step) => {
    const found = byKey.get(step.key);
    const updatedAt = found?.updated_at || null;
    return {
      ...step,
      status: found?.status || "nao_iniciado",
      evidence: found?.evidence || "",
      note: found?.note || "",
      updated_at: updatedAt,
      slaState: computeSlaState(step, updatedAt),
    };
  });
}

export async function getSopStepStatus(projectId: string, stepKey: string): Promise<SopStepView | null> {
  const def = STEP_MAP.get(stepKey);
  if (!def) return null;

  try {
    const q = await dbQuery<SopStepRow>(
      "select step_key, status, evidence, note, updated_at::text from sop_step_status where project_id=$1 and step_key=$2 limit 1",
      [projectId, stepKey]
    );
    const found = q.rows[0];
    const updatedAt = found?.updated_at || null;
    return {
      ...def,
      status: found?.status || "nao_iniciado",
      evidence: found?.evidence || "",
      note: found?.note || "",
      updated_at: updatedAt,
      slaState: computeSlaState(def, updatedAt),
    };
  } catch {
    return {
      ...def,
      status: "nao_iniciado",
      evidence: "",
      note: "",
      updated_at: null,
      slaState: computeSlaState(def, null),
    };
  }
}

export async function updateSopStep(input: {
  projectId: string;
  stepKey: string;
  status: SopStatus;
  evidence?: string;
  note?: string;
  updatedBy: string | null;
}) {
  const def = STEP_MAP.get(input.stepKey);
  if (!def) throw new Error("step_not_found");

  const evidence = (input.evidence || "").trim();
  const note = (input.note || "").trim();

  if (input.status === "concluido" && !evidence) {
    throw new Error("evidence_required");
  }

  await dbQuery(
    `insert into sop_step_status(project_id, step_key, phase, step_order, title, status, evidence, note, updated_by, updated_at)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
     on conflict(project_id, step_key)
     do update set status=excluded.status, evidence=excluded.evidence, note=excluded.note, updated_by=excluded.updated_by, updated_at=now()`,
    [input.projectId, def.key, def.phase, def.order, def.title, input.status, evidence || null, note || null, input.updatedBy]
  );

  return { step: def.key, status: input.status, evidence };
}

import { dbQuery } from "@/lib/db";

export type SopStatus = "nao_iniciado" | "em_execucao" | "aguardando_validacao" | "concluido" | "bloqueado";

export type SopStepDefinition = {
  key: string;
  phase: "IMPLEMENTACAO" | "OPERACAO_DIARIA" | "FECHAMENTO";
  order: number;
  title: string;
};

export const SOP_STEPS: readonly SopStepDefinition[] = [
  { key: "cadastro", phase: "IMPLEMENTACAO", order: 1, title: "Cadastro" },
  { key: "riscos", phase: "IMPLEMENTACAO", order: 2, title: "Riscos" },
  { key: "upload_base_historica", phase: "IMPLEMENTACAO", order: 3, title: "Upload Base Histórica" },
  { key: "analise_base_historica", phase: "IMPLEMENTACAO", order: 4, title: "Análise Base Histórica" },
  { key: "validacao_diagnostico", phase: "IMPLEMENTACAO", order: 5, title: "Validação do Diagnóstico" },
  { key: "upload_base_diaria", phase: "OPERACAO_DIARIA", order: 1, title: "Upload Base Diária" },
  { key: "painel_risco", phase: "OPERACAO_DIARIA", order: 2, title: "Painel de Risco" },
  { key: "movimento_diario", phase: "OPERACAO_DIARIA", order: 3, title: "Movimento Diário" },
  { key: "validacao_movimento", phase: "OPERACAO_DIARIA", order: 4, title: "Validação do Movimento Diário" },
  { key: "alimentacao_contabil", phase: "FECHAMENTO", order: 1, title: "Alimentação Contábil" },
  { key: "fechamento_mensal", phase: "FECHAMENTO", order: 2, title: "Fechamento Mensal" },
  { key: "validacao_fechamento", phase: "FECHAMENTO", order: 3, title: "Validação do Fechamento" },
  { key: "monitoramento_diretoria", phase: "FECHAMENTO", order: 4, title: "Monitoramento Diretoria" },
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
};

const STEP_MAP = new Map(SOP_STEPS.map((s) => [s.key, s]));

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
    return {
      ...step,
      status: found?.status || "nao_iniciado",
      evidence: found?.evidence || "",
      note: found?.note || "",
      updated_at: found?.updated_at || null,
    };
  });
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

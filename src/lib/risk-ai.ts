import { deepseekChat } from "@/lib/deepseek";
import { dbQuery } from "@/lib/db";

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("empty_ai_response");
  try {
    return JSON.parse(trimmed);
  } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("json_not_found");
  return JSON.parse(match[0]);
}

function normalizeRiskResponse(obj: any, fallbackReport: string) {
  const title = String(obj?.title || obj?.risk || obj?.nome || "Risco identificado pela IA").trim();
  const severityRaw = String(obj?.severity || obj?.level || obj?.criticidade || "medium").toLowerCase();
  const severity = severityRaw.includes("crit") || severityRaw.includes("high") || severityRaw.includes("alto")
    ? "critical"
    : severityRaw.includes("low") || severityRaw.includes("baixo")
      ? "low"
      : "medium";
  const blockFlow = Boolean(obj?.blockFlow ?? obj?.block_flow ?? obj?.bloqueia_fluxo ?? severity === "critical");
  const rationale = String(obj?.rationale || obj?.analysis || obj?.justificativa || fallbackReport).trim();
  const recommendations = Array.isArray(obj?.recommendations)
    ? obj.recommendations.map((x: unknown) => String(x)).filter(Boolean)
    : String(obj?.recommendations || obj?.recommendation || "").split(/\n|;/).map((x) => x.trim()).filter(Boolean);
  return { title, severity, blockFlow, rationale, recommendations };
}

export type RiskSuggestion = {
  id: string;
  provider: string | null;
  model: string | null;
  status: 'suggested' | 'approved' | 'discarded';
  response: Record<string, unknown>;
  created_at: string;
};

export async function generateRiskSuggestion(input: {
  projectId: string;
  projectCode: string;
  summary: string;
  report: string;
  opportunity?: string;
  createdBy: string | null;
}) {
  const prompt = {
    projectCode: input.projectCode,
    summary: input.summary,
    report: input.report,
    opportunity: input.opportunity || '',
  };

  let provider = 'fallback';
  let model = 'local-fallback';
  let response: Record<string, unknown> = {
    title: 'Risco operacional sugerido',
    severity: 'medium',
    blockFlow: false,
    rationale: `Fallback: não foi possível estruturar a resposta da IA para o relato informado (${input.report.slice(0, 240)}).`,
    recommendations: ['Revisar manualmente o relato e validar se o risco deve virar alerta formal.'],
    source: 'fallback',
  };

  try {
    const out = await deepseekChat([
      {
        role: 'system',
        content: 'Você é o motor de risco do Ironcore. Analise o relato e responda APENAS um JSON válido com os campos: title, severity, blockFlow, rationale, recommendations. severity deve ser low, medium ou critical. recommendations deve ser array de strings.',
      },
      {
        role: 'user',
        content: `Analise o contexto operacional abaixo e sugira UM risco principal claro, específico e aplicável.\n\nProjeto: ${input.projectCode}\nResumo: ${input.summary}\nRelato: ${input.report}\nOportunidade: ${input.opportunity || '-'}\n\nResponda apenas JSON.`,
      },
    ]);
    provider = 'deepseek';
    model = out.model;
    const parsed = extractJsonObject(out.content || '');
    response = { ...normalizeRiskResponse(parsed, input.report), source: 'deepseek' };
  } catch (error) {
    response = {
      ...response,
      ai_error: error instanceof Error ? error.message : String(error),
    };
  }

  const q = await dbQuery<{ id: string }>(
    `insert into risk_ai_suggestions(project_id, provider, model, prompt, response, created_by)
     values($1,$2,$3,$4::jsonb,$5::jsonb,$6)
     returning id`,
    [input.projectId, provider, model, JSON.stringify(prompt), JSON.stringify(response), input.createdBy]
  );

  return { id: q.rows[0]?.id || null, provider, model, response };
}

export async function listRiskSuggestions(projectId: string, limit = 20) {
  const q = await dbQuery<RiskSuggestion>(
    `select id, provider, model, status, response, created_at::text
     from risk_ai_suggestions
     where project_id=$1
     order by created_at desc
     limit $2`,
    [projectId, limit]
  ).catch(() => ({ rows: [] as RiskSuggestion[] }));
  return q.rows;
}

export async function markRiskSuggestion(projectId: string, suggestionId: string, status: 'approved' | 'discarded') {
  await dbQuery(
    `update risk_ai_suggestions set status=$3 where project_id=$1 and id=$2`,
    [projectId, suggestionId, status]
  );
}

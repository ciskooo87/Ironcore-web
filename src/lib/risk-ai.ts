import { deepseekChat } from "@/lib/deepseek";
import { dbQuery } from "@/lib/db";

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
    rationale: 'Sugestão fallback baseada no relato informado.',
    recommendations: ['Revisar manualmente o relato e validar se o risco deve virar alerta formal.'],
  };

  try {
    const out = await deepseekChat([
      {
        role: 'system',
        content: 'Você é o motor de risco do Ironcore. Responda apenas JSON com title, severity, blockFlow, rationale e recommendations.',
      },
      {
        role: 'user',
        content: `Analise o contexto e sugira um risco para o projeto:\n${JSON.stringify(prompt)}`,
      },
    ]);
    provider = 'deepseek';
    model = out.model;
    response = JSON.parse(out.content || '{}');
  } catch {}

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

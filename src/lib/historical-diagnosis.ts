import { dbQuery } from "@/lib/db";
import { deepseekChat } from "@/lib/deepseek";

export type HistoricalUploadAggregate = {
  totalUploads: number;
  byKind: Record<string, number>;
  totals: {
    faturamento: number;
    contasReceber: number;
    contasPagar: number;
    extratoBancario: number;
    duplicatas: number;
  };
  latestBusinessDate: string | null;
};

export async function getHistoricalUploadAggregate(projectId: string): Promise<HistoricalUploadAggregate> {
  const q = await dbQuery<{
    business_date: string;
    payload: Record<string, unknown>;
  }>(
    `select business_date::text, payload
     from daily_entries
     where project_id=$1
       and source_type='upload'
       and (
         coalesce(payload->>'notes','') ilike '%upload_kind:historico_%'
       )
     order by business_date desc, created_at desc`,
    [projectId]
  );

  const byKind: Record<string, number> = {};
  const totals = {
    faturamento: 0,
    contasReceber: 0,
    contasPagar: 0,
    extratoBancario: 0,
    duplicatas: 0,
  };

  for (const row of q.rows) {
    const payload = row.payload || {};
    const notes = String(payload.notes || "");
    const match = notes.match(/upload_kind:([a-z_]+)/i);
    const kind = match?.[1] || "historico_indefinido";
    byKind[kind] = (byKind[kind] || 0) + 1;

    totals.faturamento += Number(payload.faturamento || 0);
    totals.contasReceber += Number(payload.contas_receber || 0);
    totals.contasPagar += Number(payload.contas_pagar || 0);
    totals.extratoBancario += Number(payload.extrato_bancario || 0);
    totals.duplicatas += Number(payload.duplicatas || 0);
  }

  return {
    totalUploads: q.rows.length,
    byKind,
    totals,
    latestBusinessDate: q.rows[0]?.business_date || null,
  };
}

export async function createHistoricalDiagnosis(input: {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectSummary: string;
}) {
  const aggregate = await getHistoricalUploadAggregate(input.projectId);
  if (aggregate.totalUploads === 0) {
    throw new Error("historical_upload_missing");
  }

  const prompt = {
    projectCode: input.projectCode,
    projectName: input.projectName,
    projectSummary: input.projectSummary,
    aggregate,
  };

  const fallback = JSON.stringify({
    diagnosis: aggregate.totalUploads > 0 ? "Base histórica recebida parcialmente e pronta para revisão humana." : "Sem base histórica.",
    risks: [
      aggregate.totals.contasPagar > aggregate.totals.contasReceber ? "Pressão potencial de caixa no histórico consolidado." : "Sem pressão relevante de caixa identificada pela consolidação simples.",
    ],
    recommendations: [
      "Validar cobertura de todas as categorias históricas exigidas pela planilha.",
      "Revisar relação entre faturamento, pagar, receber e extrato para fechar diagnóstico final.",
    ],
    executiveSummary: `Uploads históricos: ${aggregate.totalUploads}. Última base: ${aggregate.latestBusinessDate || "n/a"}.`,
  });

  let provider = "fallback";
  let model = "local-fallback";
  let latencyMs = 0;
  let response = fallback;
  let status: "ok" | "error" = "ok";
  let error = "";

  try {
    const ai = await deepseekChat([
      {
        role: "system",
        content:
          "Você é o motor de diagnóstico histórico do Ironcore. Responda apenas JSON com diagnosis, risks, recommendations e executiveSummary, de forma objetiva e acionável.",
      },
      {
        role: "user",
        content: `Gere o diagnóstico histórico do projeto com base no contexto:\n${JSON.stringify(prompt)}`,
      },
    ]);
    provider = "deepseek";
    model = ai.model;
    latencyMs = ai.latencyMs;
    response = ai.content || fallback;
  } catch (e) {
    status = "error";
    error = String(e);
  }

  const insert = await dbQuery<{ id: number }>(
    `insert into ai_inference_runs(project_id, provider, model, latency_ms, status, prompt, response, error)
     values($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
     returning id`,
    [input.projectId, provider, model, latencyMs, status, JSON.stringify(prompt), response, error || null]
  );

  return {
    inferenceId: insert.rows[0]?.id || null,
    provider,
    model,
    latencyMs,
    status,
    aggregate,
    response,
  };
}

export async function getLatestHistoricalDiagnosis(projectId: string) {
  const q = await dbQuery<{
    id: number;
    provider: string;
    model: string | null;
    status: "ok" | "error";
    response: string | null;
    error: string | null;
    created_at: string;
    prompt: Record<string, unknown>;
  }>(
    `select id, provider, model, status, response, error, created_at::text, prompt
     from ai_inference_runs
     where project_id=$1 and routine_run_id is null
     order by created_at desc
     limit 1`,
    [projectId]
  );

  return q.rows[0] || null;
}

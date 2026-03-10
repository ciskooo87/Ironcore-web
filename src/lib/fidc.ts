import { dbQuery } from "@/lib/db";

export type FidcPanel = {
  totalRetornos: number;
  totalCarteira: number;
  vencidos: number;
  aVencer: number;
  recompras: number;
  riscoConcentrado: number;
  byModalidade: Array<{ modalidade: string; valor: number }>;
  latestDate: string | null;
  latestNotes: string | null;
};

function detectModalidade(notes: string) {
  const lower = notes.toLowerCase();
  if (lower.includes("sacado")) return "sacado";
  if (lower.includes("duplicata")) return "duplicata";
  if (lower.includes("cheque")) return "cheque";
  if (lower.includes("cartao") || lower.includes("cartão")) return "cartao";
  return "geral";
}

export async function getFidcPanel(projectId: string): Promise<FidcPanel> {
  const q = await dbQuery<{ business_date: string; payload: Record<string, unknown> }>(
    `select business_date::text, payload
     from daily_entries
     where project_id=$1
       and source_type='upload'
       and coalesce(payload->>'notes','') ilike '%upload_kind:fidc_retorno%'
     order by business_date desc, created_at desc`,
    [projectId]
  );

  let totalCarteira = 0;
  let vencidos = 0;
  let aVencer = 0;
  let recompras = 0;
  let riscoConcentrado = 0;
  const modalidadeMap = new Map<string, number>();

  for (const row of q.rows) {
    const payload = row.payload || {};
    const notes = String(payload.notes || "");
    const modalidade = detectModalidade(notes);
    const baseValor =
      Number(payload.contas_receber || 0) +
      Number(payload.duplicatas || 0) +
      Math.max(0, Number(payload.faturamento || 0));

    totalCarteira += baseValor;
    modalidadeMap.set(modalidade, (modalidadeMap.get(modalidade) || 0) + baseValor);

    if (/vencid/i.test(notes)) vencidos += baseValor;
    else aVencer += baseValor;

    if (/recompra|recompras/i.test(notes)) recompras += baseValor;
    if (/concentrad|limite|inedimpl/i.test(notes)) riscoConcentrado += baseValor;
  }

  return {
    totalRetornos: q.rows.length,
    totalCarteira,
    vencidos,
    aVencer,
    recompras,
    riscoConcentrado,
    byModalidade: Array.from(modalidadeMap.entries())
      .map(([modalidade, valor]) => ({ modalidade, valor }))
      .sort((a, b) => b.valor - a.valor),
    latestDate: q.rows[0]?.business_date || null,
    latestNotes: q.rows[0] ? String(q.rows[0].payload?.notes || "") : null,
  };
}

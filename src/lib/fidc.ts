import { dbQuery } from "@/lib/db";

export type FidcPanel = {
  totalRetornos: number;
  totalCarteira: number;
  vencidos: number;
  aVencer: number;
  recompras: number;
  riscoConcentrado: number;
  operacoesVinculadas: number;
  carteiraOperacoes: number;
  vencidoOperacoes: number;
  aVencerOperacoes: number;
  recompraOperacoes: number;
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
  const [uploads, titles] = await Promise.all([
    dbQuery<{ business_date: string; payload: Record<string, unknown> }>(
      `select business_date::text, payload
       from daily_entries
       where project_id=$1
         and source_type='upload'
         and coalesce(payload->>'notes','') ilike '%upload_kind:fidc_retorno%'
       order by business_date desc, created_at desc`,
      [projectId]
    ),
    dbQuery<{ carteira_status: string; modality: string | null; face_value: number }>(
      `select ot.carteira_status, fo.modality, ot.face_value::float8
       from operation_titles ot
       join financial_operations fo on fo.id = ot.operation_id
       where ot.project_id=$1`,
      [projectId]
    ),
  ]);

  let totalCarteira = 0;
  let vencidos = 0;
  let aVencer = 0;
  let recompras = 0;
  let riscoConcentrado = 0;
  const modalidadeMap = new Map<string, number>();

  for (const row of uploads.rows) {
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
    if (/concentrad|limite|inedimpl|inadimpl/i.test(notes)) riscoConcentrado += baseValor;
  }

  const operacoesVinculadas = new Set(titles.rows.map((r) => `${r.modality || 'geral'}:${r.carteira_status}`)).size;
  const carteiraOperacoes = titles.rows.reduce((s, r) => s + Number(r.face_value || 0), 0);
  const vencidoOperacoes = titles.rows.filter((r) => r.carteira_status === 'vencido' || r.carteira_status === 'inadimplente').reduce((s, r) => s + Number(r.face_value || 0), 0);
  const aVencerOperacoes = titles.rows.filter((r) => r.carteira_status === 'a_vencer' || r.carteira_status === 'prorrogado').reduce((s, r) => s + Number(r.face_value || 0), 0);
  const recompraOperacoes = titles.rows.filter((r) => r.carteira_status === 'recomprado').reduce((s, r) => s + Number(r.face_value || 0), 0);

  for (const row of titles.rows) {
    modalidadeMap.set(row.modality || 'operacao', (modalidadeMap.get(row.modality || 'operacao') || 0) + Number(row.face_value || 0));
  }

  return {
    totalRetornos: uploads.rows.length,
    totalCarteira,
    vencidos,
    aVencer,
    recompras,
    riscoConcentrado,
    operacoesVinculadas,
    carteiraOperacoes,
    vencidoOperacoes,
    aVencerOperacoes,
    recompraOperacoes,
    byModalidade: Array.from(modalidadeMap.entries())
      .map(([modalidade, valor]) => ({ modalidade, valor }))
      .sort((a, b) => b.valor - a.valor),
    latestDate: uploads.rows[0]?.business_date || null,
    latestNotes: uploads.rows[0] ? String(uploads.rows[0].payload?.notes || "") : null,
  };
}

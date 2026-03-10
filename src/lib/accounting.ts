import { dbQuery } from "@/lib/db";

export type AccountingFeed = {
  id: string;
  period_ym: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export async function buildAccountingFeed(projectId: string, periodYm: string) {
  const [dailyAgg, opsAgg, titlesAgg, closuresAgg] = await Promise.all([
    dbQuery<{ faturamento: number; receber: number; pagar: number; extrato: number; duplicatas: number }>(
      `select
        coalesce(sum((payload->>'faturamento')::numeric),0)::float8 as faturamento,
        coalesce(sum((payload->>'contas_receber')::numeric),0)::float8 as receber,
        coalesce(sum((payload->>'contas_pagar')::numeric),0)::float8 as pagar,
        coalesce(sum((payload->>'extrato_bancario')::numeric),0)::float8 as extrato,
        coalesce(sum((payload->>'duplicatas')::numeric),0)::float8 as duplicatas
       from daily_entries
       where project_id=$1 and to_char(business_date,'YYYY-MM')=$2`,
      [projectId, periodYm]
    ),
    dbQuery<{ bruto: number; liquido: number; empresa: number }>(
      `select
        coalesce(sum(gross_amount),0)::float8 as bruto,
        coalesce(sum(net_amount),0)::float8 as liquido,
        coalesce(sum(company_fee),0)::float8 as empresa
       from financial_operations
       where project_id=$1 and to_char(business_date,'YYYY-MM')=$2`,
      [projectId, periodYm]
    ),
    dbQuery<{ carteira: number; vencido: number; liquidado: number; recompra: number }>(
      `select
        coalesce(sum(face_value),0)::float8 as carteira,
        coalesce(sum(face_value) filter (where carteira_status in ('vencido','inadimplente')),0)::float8 as vencido,
        coalesce(sum(face_value) filter (where carteira_status='liquidado'),0)::float8 as liquidado,
        coalesce(sum(face_value) filter (where carteira_status='recomprado'),0)::float8 as recompra
       from operation_titles
       where project_id=$1 and to_char(created_at,'YYYY-MM')=$2`,
      [projectId, periodYm]
    ),
    dbQuery<{ total: number }>(
      `select count(*)::int as total from monthly_closures where project_id=$1 and period_ym=$2`,
      [projectId, periodYm]
    ),
  ]);

  const faturamento = Number(dailyAgg.rows[0]?.faturamento || 0);
  const receber = Number(dailyAgg.rows[0]?.receber || 0);
  const pagar = Number(dailyAgg.rows[0]?.pagar || 0);
  const extrato = Number(dailyAgg.rows[0]?.extrato || 0);
  const duplicatas = Number(dailyAgg.rows[0]?.duplicatas || 0);
  const bruto = Number(opsAgg.rows[0]?.bruto || 0);
  const liquido = Number(opsAgg.rows[0]?.liquido || 0);
  const empresa = Number(opsAgg.rows[0]?.empresa || 0);
  const carteira = Number(titlesAgg.rows[0]?.carteira || 0);
  const vencido = Number(titlesAgg.rows[0]?.vencido || 0);
  const liquidado = Number(titlesAgg.rows[0]?.liquidado || 0);
  const recompra = Number(titlesAgg.rows[0]?.recompra || 0);

  return {
    period: periodYm,
    dre: {
      receitaBruta: faturamento,
      custosOperacionais: pagar,
      resultadoOperacional: receber - pagar,
      resultadoLiquidoProxy: faturamento - pagar - empresa,
    },
    dfc: {
      entradasOperacionais: receber,
      saidasOperacionais: pagar,
      saldoCaixaProxy: extrato,
      duplicatas,
    },
    operacoes: {
      bruto,
      liquido,
      empresa,
    },
    carteira: {
      total: carteira,
      vencido,
      liquidado,
      recompra,
    },
    fechamento: {
      hasMonthlyClosure: Number(closuresAgg.rows[0]?.total || 0) > 0,
    },
  };
}

export async function saveAccountingFeed(projectId: string, periodYm: string, payload: Record<string, unknown>, createdBy: string | null) {
  const q = await dbQuery<{ id: string }>(
    `insert into accounting_feeds(project_id, period_ym, payload, created_by)
     values($1,$2,$3::jsonb,$4)
     returning id`,
    [projectId, periodYm, JSON.stringify(payload), createdBy]
  );
  return q.rows[0]?.id;
}

export async function listAccountingFeeds(projectId: string, limit = 12) {
  const q = await dbQuery<AccountingFeed>(
    `select id, period_ym, payload, created_at::text
     from accounting_feeds
     where project_id=$1
     order by created_at desc
     limit $2`,
    [projectId, limit]
  ).catch(() => ({ rows: [] as AccountingFeed[] }));
  return q.rows;
}

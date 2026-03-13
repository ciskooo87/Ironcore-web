import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PrintButton } from "@/components/PrintButton";
import { EmptyState, ProductHero, StatusPill } from "@/components/product-ui";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { getHistoricalUploadAggregate, getLatestHistoricalDiagnosis } from "@/lib/historical-diagnosis";
import { listHistoricalDiagnosisValidations } from "@/lib/historical-validation";
import { dbQuery } from "@/lib/db";
import { listOperations } from "@/lib/operations";
import { listProjectAlerts } from "@/lib/alerts";

type ParsedDiagnosis = {
  diagnosisText: string;
  executiveSummary: string;
  risks: string[];
  recommendations: string[];
  riskGroups: Array<{ label: string; items: string[] }>;
  recommendationGroups: Array<{ label: string; items: string[] }>;
  diagnosisHighlights: Array<{ label: string; value: string }>;
};

function br(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function n(v: number) {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

function cleanJsonFence(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function labelize(key: string) {
  const map: Record<string, string> = {
    high: "Risco alto",
    medium: "Risco médio",
    low: "Risco baixo",
    immediate: "Ação imediata",
    shortTerm: "Curto prazo",
    strategic: "Estratégico",
    dataCoverage: "Cobertura de dados",
    dataQuality: "Qualidade dos dados",
    temporalAlignment: "Alinhamento temporal",
    financialHealthIndicators: "Indicadores financeiros",
    receivablesToPayablesRatio: "Relação receber/pagar",
    liquidityCoverage: "Cobertura de liquidez",
    salesConsistency: "Consistência de faturamento",
  };
  return map[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function flattenValue(value: unknown, prefix = ""): string[] {
  if (value == null) return [];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [prefix ? `${prefix}: ${String(value)}` : String(value)];
  }
  if (Array.isArray(value)) return value.flatMap((item) => flattenValue(item, prefix));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      flattenValue(nested, prefix ? `${prefix} · ${labelize(key)}` : labelize(key))
    );
  }
  return [];
}

function extractGroups(value: unknown): Array<{ label: string; items: string[] }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => ({ label: labelize(key), items: flattenValue(nested) }))
    .filter((group) => group.items.length > 0);
}

function extractDiagnosisHighlights(value: unknown): Array<{ label: string; value: string }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    if (nested == null) return [];
    if (typeof nested === "string" || typeof nested === "number" || typeof nested === "boolean") {
      return [{ label: labelize(key), value: String(nested) }];
    }
    if (typeof nested === "object" && !Array.isArray(nested)) {
      return Object.entries(nested as Record<string, unknown>).map(([subKey, subVal]) => ({
        label: `${labelize(key)} · ${labelize(subKey)}`,
        value: String(subVal),
      }));
    }
    return [{ label: labelize(key), value: flattenValue(nested).join(" | ") }];
  });
}

function parseDiagnosisSections(raw: string | null): ParsedDiagnosis | null {
  if (!raw) return null;
  const cleaned = cleanJsonFence(raw);

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const diagnosisValue = parsed.diagnosis;
    const risksValue = parsed.risks;
    const recommendationsValue = parsed.recommendations;
    const executiveSummary = typeof parsed.executiveSummary === "string" ? parsed.executiveSummary : "";

    return {
      diagnosisText: flattenValue(diagnosisValue).join("\n") || cleaned,
      executiveSummary,
      risks: flattenValue(risksValue),
      recommendations: flattenValue(recommendationsValue),
      riskGroups: extractGroups(risksValue),
      recommendationGroups: extractGroups(recommendationsValue),
      diagnosisHighlights: extractDiagnosisHighlights(diagnosisValue),
    };
  } catch {
    return {
      diagnosisText: cleaned,
      executiveSummary: cleaned,
      risks: [],
      recommendations: [],
      riskGroups: [],
      recommendationGroups: [],
      diagnosisHighlights: [],
    };
  }
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

export default async function HistoricalDiagnosisExecutivePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Diagnóstico Histórico"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Diagnóstico Histórico"><div className="alert bad-bg">Sem permissão.</div></AppShell>;

  const [aggregate, latestDiagnosis, validations, operations, alerts, firstUpload, lastUpload] = await Promise.all([
    getHistoricalUploadAggregate(project.id),
    getLatestHistoricalDiagnosis(project.id),
    listHistoricalDiagnosisValidations(project.id, 20),
    listOperations(project.id, 200),
    listProjectAlerts(project.id),
    dbQuery<{ d: string }>(`select min(business_date)::text as d from daily_entries where project_id=$1 and source_type='upload' and coalesce(payload->>'notes','') ilike '%upload_kind:historico_%'`, [project.id]),
    dbQuery<{ d: string }>(`select max(business_date)::text as d from daily_entries where project_id=$1 and source_type='upload' and coalesce(payload->>'notes','') ilike '%upload_kind:historico_%'`, [project.id]),
  ]);

  const parsed = parseDiagnosisSections(latestDiagnosis?.response || null);
  const finance = project.financial_profile || {};
  const grossOps = operations.reduce((s, o) => s + Number(o.gross_amount || 0), 0);
  const netOps = operations.reduce((s, o) => s + Number(o.net_amount || 0), 0);
  const avgFee = operations.length > 0 ? operations.reduce((s, o) => s + Number(o.fee_percent || 0), 0) / operations.length : 0;
  const pressure = aggregate.totals.contasPagar - aggregate.totals.contasReceber;
  const marginProxy = aggregate.totals.faturamento > 0 ? ((aggregate.totals.contasReceber - aggregate.totals.contasPagar) / aggregate.totals.faturamento) * 100 : 0;
  const coverageKinds = Object.keys(aggregate.byKind).length;
  const totalFinancialBase = aggregate.totals.contasReceber + aggregate.totals.contasPagar + Math.abs(aggregate.totals.extratoBancario) + aggregate.totals.duplicatas;
  const receivableShare = pct(aggregate.totals.contasReceber, totalFinancialBase);
  const payableShare = pct(aggregate.totals.contasPagar, totalFinancialBase);
  const bankShare = pct(Math.abs(aggregate.totals.extratoBancario), totalFinancialBase);
  const duplicatesShare = pct(aggregate.totals.duplicatas, totalFinancialBase);

  const executiveNarrative = parsed?.executiveSummary || (
    pressure > 0
      ? `A leitura consolidada da base histórica indica pressão financeira sobre o projeto ${project.name}, com contas a pagar superiores às contas a receber no recorte enviado.`
      : `A leitura consolidada da base histórica do projeto ${project.name} não aponta, neste momento, pressão relevante de caixa pela comparação simples entre contas a receber e contas a pagar.`
  );

  const mainAction = aggregate.totalUploads === 0
    ? "Subir base histórica suficiente para abrir um diagnóstico confiável."
    : !latestDiagnosis
      ? "Gerar o diagnóstico histórico executivo pela primeira vez."
      : validations.length === 0
        ? "Validar o diagnóstico histórico atual e consolidar a versão oficial."
        : "Usar o diagnóstico validado para orientar o plano de ação do projeto.";

  const mainRisk = pressure > 0
    ? `Contas a pagar superam contas a receber em ${br(pressure)}.`
    : alerts.length > 0
      ? `${alerts.length} alerta(s) ativo(s) podem contaminar a leitura histórica.`
      : aggregate.totalUploads < 4
        ? "Cobertura histórica ainda parcial para uma leitura profunda."
        : "Sem risco dominante explícito além da necessidade de validação contínua.";

  const analysisRows = [
    ["Faturamento consolidado", br(aggregate.totals.faturamento), aggregate.totals.faturamento > 0 ? "Base suficiente para leitura inicial de escala e performance." : "Sem faturamento histórico relevante na base atual."],
    ["Contas a receber", br(aggregate.totals.contasReceber), aggregate.totals.contasReceber > 0 ? "Os recebíveis já sustentam análise de liquidez e funding." : "Sem recebíveis históricos relevantes."],
    ["Contas a pagar", br(aggregate.totals.contasPagar), aggregate.totals.contasPagar > 0 ? "Os passivos históricos pressionam a leitura de caixa." : "Sem passivos históricos relevantes."],
    ["Extrato bancário", br(aggregate.totals.extratoBancario), aggregate.totals.extratoBancario !== 0 ? "Há movimento bancário suficiente para confrontar o fluxo." : "O extrato histórico ainda está fraco na consolidação."],
    ["Duplicatas", br(aggregate.totals.duplicatas), aggregate.totals.duplicatas > 0 ? "Existe sinal de antecipação/duplicatas na base." : "Não há materialidade relevante de duplicatas."],
  ];

  return (
    <AppShell user={user} title="Projeto · Diagnóstico Histórico" subtitle="Leitura executiva da base histórica com foco em risco, estrutura financeira e próximos passos">
      <div className="report-print-only mb-4 text-sm">
        <div className="font-semibold">Diagnóstico Histórico Executivo · {project.name}</div>
        <div>{project.legal_name} · CNPJ {project.cnpj}</div>
      </div>

      <ProductHero
        eyebrow="leitura histórica"
        title="Diagnóstico histórico precisa virar decisão executiva, não dump de análise."
        description="A tela agora organiza o histórico do projeto em comando executivo, risco principal, base analítica e recomendações acionáveis."
      >
        <StatusPill label={`Uploads: ${aggregate.totalUploads}`} tone={aggregate.totalUploads > 0 ? "good" : "warn"} />
        <StatusPill label={`Validações: ${validations.length}`} tone={validations.length > 0 ? "good" : "neutral"} />
        <Link href={`/projetos/${id}/fluxo-trabalho`} className="pill">Fluxo de Trabalho</Link>
        <form action={`/api/projects/${id}/historical-diagnosis/run`} method="post">
          <button type="submit" className="badge py-2 px-3 cursor-pointer">Atualizar diagnóstico</button>
        </form>
        <PrintButton />
      </ProductHero>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Comando do diagnóstico</h2><span className="kpi-chip">prioridade executiva</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Próxima ação</div>
              <div className="mt-2 text-lg font-semibold text-white">{mainAction}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">Risco principal</div>
              <div className="mt-2 text-sm text-slate-300">{mainRisk}</div>
            </div>
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/30 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Checkpoint</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Janela histórica</div><div className="mt-1 font-medium text-white">{firstUpload.rows[0]?.d || "-"} → {lastUpload.rows[0]?.d || "-"}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Cobertura</div><div className="mt-1 font-medium text-white">{coverageKinds} tipo(s)</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Alertas ativos</div><div className="mt-1 font-medium text-amber-200">{alerts.length}</div></div>
                <div className="rounded-2xl border border-slate-800 p-3"><div className="text-xs text-slate-400">Operações</div><div className="mt-1 font-medium text-white">{operations.length}</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Dados da empresa</h2><span className="kpi-chip">base do projeto</span></div>
          <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
            <div><div className="text-slate-400 text-xs">Razão social</div><div className="font-medium mt-1">{project.legal_name}</div></div>
            <div><div className="text-slate-400 text-xs">Projeto</div><div className="font-medium mt-1">{project.name}</div></div>
            <div><div className="text-slate-400 text-xs">CNPJ</div><div className="font-medium mt-1">{project.cnpj}</div></div>
            <div><div className="text-slate-400 text-xs">Segmento</div><div className="font-medium mt-1">{project.segment}</div></div>
            <div><div className="text-slate-400 text-xs">Sócios</div><div className="font-medium mt-1">{(project.partners || []).join(", ") || "Não informado"}</div></div>
            <div><div className="text-slate-400 text-xs">Resumo</div><div className="font-medium mt-1">{project.project_summary || "Sem resumo executivo ainda."}</div></div>
          </div>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Resumo executivo</h2><span className="kpi-chip">leitura principal</span></div>
        <div className="mt-4 rounded-[24px] border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-300 whitespace-pre-wrap">
          {executiveNarrative}
        </div>
      </section>

      {parsed?.diagnosisHighlights?.length ? (
        <section className="card mb-4">
          <div className="section-head"><h2 className="title">Highlights do diagnóstico</h2><span className="kpi-chip">leitura estruturada</span></div>
          <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
            {parsed.diagnosisHighlights.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-lg border border-slate-800 p-3">
                <div className="text-xs text-slate-400">{item.label}</div>
                <div className="font-medium mt-1 text-slate-200">{item.value}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Faturamento histórico</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.faturamento)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Contas a receber</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.contasReceber)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Contas a pagar</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.contasPagar)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Margem proxy</div><div className={`text-lg font-semibold mt-1 ${marginProxy < 0 ? "text-rose-300" : "text-emerald-300"}`}>{marginProxy.toFixed(1)}%</div></div>
      </section>

      <section className="grid md:grid-cols-3 gap-3 mb-4 text-sm">
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-slate-400 text-xs">Configuração financeira base</div>
          <div className="font-medium mt-1">TX {Number(finance.tx_percent || 0).toFixed(2)}%</div>
          <div className="text-slate-500 text-xs mt-1">Float {Number(finance.float_days || 0)} dias · TAC {br(Number(finance.tac || 0))}</div>
        </div>
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-slate-400 text-xs">Pressão histórica de caixa</div>
          <div className={`font-medium mt-1 ${pressure > 0 ? "text-rose-300" : "text-emerald-300"}`}>{br(pressure)}</div>
          <div className="text-slate-500 text-xs mt-1">Diferença entre pagar e receber consolidados</div>
        </div>
        <div className="rounded-lg border border-slate-800 p-3">
          <div className="text-slate-400 text-xs">Funding / operações</div>
          <div className="font-medium mt-1">{br(netOps)}</div>
          <div className="text-slate-500 text-xs mt-1">Bruto {br(grossOps)} · Taxa média {avgFee.toFixed(2)}%</div>
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Comparativos visuais</h2><span className="kpi-chip">base consolidada</span></div>
        <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
          <div className="rounded-lg border border-slate-800 p-3">
            <div className="font-medium mb-3">Composição da base financeira</div>
            {[
              ["Recebíveis", receivableShare, br(aggregate.totals.contasReceber)],
              ["Pagamentos", payableShare, br(aggregate.totals.contasPagar)],
              ["Extrato", bankShare, br(Math.abs(aggregate.totals.extratoBancario))],
              ["Duplicatas", duplicatesShare, br(aggregate.totals.duplicatas)],
            ].map(([label, value, raw]) => (
              <div key={String(label)} className="mb-3 last:mb-0">
                <div className="flex justify-between gap-2 text-xs mb-1"><span>{label}</span><span>{raw} · {n(Number(value))}%</span></div>
                <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${value}%` }} /></div></div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-800 p-3">
            <div className="font-medium mb-3">Comparativo situacional</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between gap-2 text-xs mb-1"><span>Receber x Pagar</span><span>{br(aggregate.totals.contasReceber)} vs {br(aggregate.totals.contasPagar)}</span></div>
                <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${pct(aggregate.totals.contasReceber, Math.max(aggregate.totals.contasReceber, aggregate.totals.contasPagar, 1))}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between gap-2 text-xs mb-1"><span>Funding líquido x bruto</span><span>{br(netOps)} vs {br(grossOps)}</span></div>
                <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${pct(netOps, Math.max(grossOps, 1))}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between gap-2 text-xs mb-1"><span>Cobertura histórica</span><span>{coverageKinds} tipos mapeados</span></div>
                <div className="report-bar-track"><div className="report-bar-fill" style={{ width: `${pct(coverageKinds, 8)}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Riscos identificados</h2><span className="kpi-chip">atenção executiva</span></div>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            {parsed?.riskGroups?.length ? parsed.riskGroups.map((group) => (
              <div key={group.label} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium mb-2">{group.label}</div>
                <ul className="space-y-2">{group.items.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            )) : (
              <ul className="space-y-2">
                {(parsed?.risks.length ? parsed.risks : [
                  pressure > 0 ? "Contas a pagar historicamente superiores às contas a receber consolidadas." : "Sem pressão histórica material de caixa pela consolidação simples atual.",
                  aggregate.totalUploads < 4 ? "Cobertura histórica ainda parcial; ampliar a base enviada para elevar qualidade analítica." : "Base histórica com cobertura relevante para aprofundamento do diagnóstico.",
                  alerts.length > 0 ? `Existem ${alerts.length} alertas ativos exigindo correção operacional.` : "Sem alertas ativos relevantes no momento.",
                ]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            )}
          </div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Recomendações</h2><span className="kpi-chip">próximos passos</span></div>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            {parsed?.recommendationGroups?.length ? parsed.recommendationGroups.map((group) => (
              <div key={group.label} className="rounded-lg border border-slate-800 p-3">
                <div className="font-medium mb-2">{group.label}</div>
                <ul className="space-y-2">{group.items.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            )) : (
              <ul className="space-y-2">
                {(parsed?.recommendations.length ? parsed.recommendations : [
                  "Concluir a cobertura das categorias históricas definidas na implementação.",
                  "Validar a consistência entre faturamento, extrato, contas a receber e contas a pagar.",
                  "Priorizar governança de caixa, funding e rotina de validação diária caso a pressão histórica permaneça elevada.",
                ]).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Leitura situacional</h2><span className="kpi-chip">diagnóstico completo</span></div>
          <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{parsed?.diagnosisText || executiveNarrative || project.project_summary || "Sem leitura situacional disponível ainda."}</div>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Validações registradas</h2><span className="kpi-chip">trilha decisória</span></div>
          <div className="mt-3 space-y-2 text-sm">
            {validations.length ? validations.map((v) => (
              <div key={v.id} className="rounded-2xl border border-slate-800 p-4">
                <div className="font-medium text-white">{v.decision}</div>
                <div className="text-xs text-slate-500 mt-1">{v.validated_at}</div>
                <div className="text-slate-300 mt-2 whitespace-pre-wrap">{v.summary_text || v.note || '-'}</div>
              </div>
            )) : <EmptyState title="Nenhuma validação histórica ainda" description="Quando o diagnóstico começar a ser validado, a trilha executiva vai aparecer aqui." />}
          </div>
        </section>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Análises históricas</h2><span className="kpi-chip">base consolidada</span></div>
        <div className="table-wrap mt-3">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Indicador</th>
                <th className="text-right px-2 py-2 border-b border-slate-800">Valor</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Leitura</th>
              </tr>
            </thead>
            <tbody>
              {analysisRows.map(([label, value, note]) => (
                <tr key={String(label)} className="odd:bg-slate-900/30">
                  <td className="px-2 py-2 border-b border-slate-900">{label}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{value}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-slate-300">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

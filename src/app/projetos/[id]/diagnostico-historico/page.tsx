import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/guards";
import { getProjectByCode } from "@/lib/projects";
import { canAccessProject } from "@/lib/permissions";
import { getHistoricalUploadAggregate, getLatestHistoricalDiagnosis } from "@/lib/historical-diagnosis";
import { dbQuery } from "@/lib/db";
import { listOperations } from "@/lib/operations";
import { listProjectAlerts } from "@/lib/alerts";

function br(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function parseDiagnosisSections(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      diagnosis?: string;
      risks?: string[];
      recommendations?: string[];
      executiveSummary?: string;
    };
  } catch {
    return {
      diagnosis: raw,
      risks: [],
      recommendations: [],
      executiveSummary: raw,
    };
  }
}

export default async function HistoricalDiagnosisExecutivePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const project = await getProjectByCode(id);

  if (!project) return <AppShell user={user} title="Projeto · Diagnóstico Histórico"><div className="alert bad-bg">Projeto não encontrado.</div></AppShell>;
  const allowed = await canAccessProject(user, project.id);
  if (!allowed) return <AppShell user={user} title="Projeto · Diagnóstico Histórico"><div className="alert bad-bg">Sem permissão.</div></AppShell>;

  const [aggregate, latestDiagnosis, operations, alerts, firstUpload, lastUpload] = await Promise.all([
    getHistoricalUploadAggregate(project.id),
    getLatestHistoricalDiagnosis(project.id),
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

  const macroActions = [
    {
      action: "Diagnóstico e governança do projeto",
      area: "Gestão do Projeto",
      objective: "Consolidar entendimento situacional do negócio e garantir disciplina de acompanhamento.",
      description: "Usar o cadastro e as bases históricas para estruturar a visão inicial, riscos, premissas operacionais e trilha de monitoramento.",
    },
    {
      action: "Implantação de controles periódicos de gestão e reporte",
      area: "Controladoria / Financeiro",
      objective: "Dar visibilidade recorrente aos números e desvios do negócio.",
      description: "Padronizar envio de bases, validar históricos, acompanhar variações e transformar o diagnóstico em leitura gerencial contínua.",
    },
    {
      action: "Estruturar modelo de controle e gestão por operações",
      area: "Operações / Tesouraria",
      objective: "Amarrar caixa, recebíveis, pagamentos e funding à tomada de decisão.",
      description: "Conectar histórico, risco, operações e fluxo de caixa para previsibilidade e redução de rupturas.",
    },
    {
      action: "Planejamento e recomposição financeira",
      area: "Diretoria / Financeiro",
      objective: "Reequilibrar liquidez e ampliar margem de manobra.",
      description: "Avaliar endividamento, limites, recebíveis e alternativas de funding a partir das evidências históricas consolidadas.",
    },
    {
      action: "Plano de ação macro e governança executiva",
      area: "Diretoria / Áreas",
      objective: "Transformar diagnóstico em execução com responsáveis e cadência.",
      description: "Calendarizar as ações prioritárias e usar o Ironcore como trilha oficial de validação e monitoramento.",
    },
  ];

  return (
    <AppShell user={user} title="Projeto · Diagnóstico Histórico Executivo" subtitle="Entregável situacional consolidado a partir do cadastro e das bases históricas">
      <section className="card mb-4">
        <div className="section-head">
          <h2 className="title">Dados da empresa</h2>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/projetos/${id}/fluxo-trabalho`} className="pill">Fluxo de Trabalho</Link>
            <form action={`/api/projects/${id}/historical-diagnosis/run`} method="post">
              <button type="submit" className="badge py-2 px-3 cursor-pointer">Atualizar diagnóstico</button>
            </form>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
          <div><div className="text-slate-400 text-xs">Razão social</div><div className="font-medium mt-1">{project.legal_name}</div></div>
          <div><div className="text-slate-400 text-xs">Nome fantasia / projeto</div><div className="font-medium mt-1">{project.name}</div></div>
          <div><div className="text-slate-400 text-xs">CNPJ</div><div className="font-medium mt-1">{project.cnpj}</div></div>
          <div><div className="text-slate-400 text-xs">Atividade principal</div><div className="font-medium mt-1">{project.segment}</div></div>
          <div><div className="text-slate-400 text-xs">Sócios</div><div className="font-medium mt-1">{(project.partners || []).join(", ") || "Não informado"}</div></div>
          <div><div className="text-slate-400 text-xs">Janela histórica</div><div className="font-medium mt-1">{firstUpload.rows[0]?.d || "-"} até {lastUpload.rows[0]?.d || "-"}</div></div>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Faturamento histórico consolidado</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.faturamento)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Contas a receber</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.contasReceber)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Contas a pagar</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.contasPagar)}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Extrato bancário consolidado</div><div className="text-lg font-semibold mt-1">{br(aggregate.totals.extratoBancario)}</div></div>
      </section>

      <section className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="metric"><div className="text-xs text-slate-400">Uploads históricos</div><div className="text-lg font-semibold mt-1">{aggregate.totalUploads}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Alertas ativos</div><div className="text-lg font-semibold mt-1">{alerts.length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Operações registradas</div><div className="text-lg font-semibold mt-1">{operations.length}</div></div>
        <div className="metric"><div className="text-xs text-slate-400">Margem proxy histórica</div><div className={`text-lg font-semibold mt-1 ${marginProxy < 0 ? "text-rose-300" : "text-emerald-300"}`}>{marginProxy.toFixed(1)}%</div></div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Indicadores gerais e pontos de atenção</h2><span className="kpi-chip">Big Numbers</span></div>
        <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
          <div className="rounded-lg border border-slate-800 p-3">
            <div className="text-slate-400 text-xs">TX configurada</div>
            <div className="font-medium mt-1">{Number(finance.tx_percent || 0).toFixed(2)}%</div>
            <div className="text-slate-500 text-xs mt-1">Float: {Number(finance.float_days || 0)} dias</div>
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
        </div>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Leitura situacional</h2><span className="kpi-chip">Diagnóstico</span></div>
        <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{parsed?.executiveSummary || parsed?.diagnosis || project.project_summary || "Sem leitura situacional disponível ainda."}</div>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mb-4">
        <section className="card">
          <div className="section-head"><h2 className="title">Riscos identificados</h2><span className="kpi-chip">Atenção</span></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(parsed?.risks && parsed.risks.length > 0 ? parsed.risks : [
              pressure > 0 ? "Contas a pagar historicamente superiores às contas a receber consolidadas." : "Sem pressão histórica material de caixa pela consolidação simples.",
              aggregate.totalUploads < 4 ? "Cobertura histórica ainda parcial; ampliar a base enviada para leitura mais confiável." : "Base histórica com cobertura relevante para aprofundamento do diagnóstico.",
              alerts.length > 0 ? `Existem ${alerts.length} alertas ativos exigindo correção operacional.` : "Sem alertas ativos relevantes no momento.",
            ]).map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="section-head"><h2 className="title">Recomendações</h2><span className="kpi-chip">Próximos passos</span></div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(parsed?.recommendations && parsed.recommendations.length > 0 ? parsed.recommendations : [
              "Concluir a cobertura das categorias históricas definidas na implementação para fortalecer o diagnóstico.",
              "Validar a consistência entre faturamento, extrato, contas a receber e contas a pagar antes da versão final do relatório.",
              "Priorizar governança de caixa e funding se a pressão histórica permanecer positiva sobre o contas a pagar.",
            ]).map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </section>
      </section>

      <section className="card mb-4">
        <div className="section-head"><h2 className="title">Análises históricas</h2><span className="kpi-chip">Base consolidada</span></div>
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
              {[
                ["Faturamento consolidado", br(aggregate.totals.faturamento), aggregate.totals.faturamento > 0 ? "Base com faturamento histórico carregado." : "Sem faturamento histórico identificado."],
                ["Contas a receber", br(aggregate.totals.contasReceber), aggregate.totals.contasReceber > 0 ? "Recebíveis históricos capturados no consolidado." : "Sem recebíveis históricos relevantes."],
                ["Contas a pagar", br(aggregate.totals.contasPagar), aggregate.totals.contasPagar > 0 ? "Passivos operacionais presentes na base histórica." : "Sem passivos históricos relevantes."],
                ["Extrato bancário", br(aggregate.totals.extratoBancario), aggregate.totals.extratoBancario !== 0 ? "Movimento bancário histórico já aparece no consolidado." : "Extrato histórico ainda fraco/inexistente na base."],
                ["Duplicatas", br(aggregate.totals.duplicatas), aggregate.totals.duplicatas > 0 ? "Há sinal de antecipação/duplicatas na base consolidada." : "Sem duplicatas históricas relevantes."],
              ].map(([label, value, note]) => (
                <tr key={String(label)} className="odd:bg-slate-900/30">
                  <td className="px-2 py-2 border-b border-slate-900">{label}</td>
                  <td className="px-2 py-2 border-b border-slate-900 text-right">{value}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-head"><h2 className="title">Plano de ação macro sugerido</h2><span className="kpi-chip">Execução</span></div>
        <div className="table-wrap mt-3">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80">
              <tr>
                <th className="text-left px-2 py-2 border-b border-slate-800">Ação</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Descrição</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Área(s)</th>
                <th className="text-left px-2 py-2 border-b border-slate-800">Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {macroActions.map((item) => (
                <tr key={item.action} className="odd:bg-slate-900/30 align-top">
                  <td className="px-2 py-2 border-b border-slate-900 font-medium">{item.action}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{item.description}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{item.area}</td>
                  <td className="px-2 py-2 border-b border-slate-900">{item.objective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-slate-500 mt-4">Disclaimer: material gerado com base nas informações cadastradas e nas bases históricas enviadas para o Ironcore. O relatório é um entregável gerencial/situacional e não substitui auditoria ou parecer técnico-contábil formal.</div>
      </section>
    </AppShell>
  );
}

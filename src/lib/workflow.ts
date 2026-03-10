import type { UserRole } from "@/lib/auth";
import type { Project } from "@/lib/projects";
import { dbQuery } from "@/lib/db";
import { SOP_STEPS, type SopStatus, type SopStepView } from "@/lib/sop";

export type WorkflowUsage = "único no início" | "diário obrigatório" | "mensal obrigatório" | "contínuo por demanda";

export type WorkflowStepRuntime = {
  key: string;
  phase: string;
  order: number;
  title: string;
  usage: WorkflowUsage;
  ownerRole: UserRole | "head/diretoria";
  mode: string;
  status: SopStatus;
  health: "funciona" | "parcial" | "nao_funciona";
  reason: string;
  evidence: string;
  note: string;
  updatedAt: string | null;
  counts?: Record<string, number>;
};

type WorkflowFacts = {
  alerts: number;
  historicalUploads: number;
  fidcUploads: number;
  dailyUploads: number;
  routineRuns: number;
  closures: number;
  deliveryRuns: number;
};

const META: Record<string, { usage: WorkflowUsage; ownerRole: WorkflowStepRuntime["ownerRole"]; mode: string }> = {
  cadastro: {
    usage: "único no início",
    ownerRole: "head",
    mode: "Cadastro completo da empresa, plano de contas, classificação de fornecedores e perfil financeiro.",
  },
  riscos: {
    usage: "único no início",
    ownerRole: "head",
    mode: "Relato do projeto, identificação de risco, validação e ativação dos riscos relevantes.",
  },
  upload_base_historica: {
    usage: "único no início",
    ownerRole: "head",
    mode: "Upload estruturado da base histórica por categoria operacional/financeira.",
  },
  analise_base_historica: {
    usage: "único no início",
    ownerRole: "head",
    mode: "Análise histórica, diagnóstico, alertas, plano de ação e leitura executiva.",
  },
  validacao_diagnostico: {
    usage: "único no início",
    ownerRole: "diretoria",
    mode: "Revisão do diagnóstico, aprovação e emissão da versão final.",
  },
  upload_base_diaria: {
    usage: "diário obrigatório",
    ownerRole: "consultor",
    mode: "Envio diário das bases, normalização, conciliação inicial e validação do dado de entrada.",
  },
  painel_risco: {
    usage: "diário obrigatório",
    ownerRole: "consultor",
    mode: "Atualização do painel de risco, incluindo retorno FIDC e leitura consolidada de recebíveis.",
  },
  movimento_diario: {
    usage: "diário obrigatório",
    ownerRole: "head",
    mode: "Decisão operacional diária com caixa, risco, elegibilidade, reserva e efetivação.",
  },
  validacao_movimento: {
    usage: "diário obrigatório",
    ownerRole: "head",
    mode: "Resumo operacional do dia, validação humana e envio aos envolvidos.",
  },
  alimentacao_contabil: {
    usage: "mensal obrigatório",
    ownerRole: "consultor",
    mode: "Consolidação para DRE, DFC e material executivo mensal.",
  },
  fechamento_mensal: {
    usage: "mensal obrigatório",
    ownerRole: "head",
    mode: "Fechamento do mês com snapshot, narrativa executiva e visão consolidada.",
  },
  validacao_fechamento: {
    usage: "mensal obrigatório",
    ownerRole: "diretoria",
    mode: "Aprovação do fechamento e publicação da versão oficial.",
  },
  monitoramento_diretoria: {
    usage: "mensal obrigatório",
    ownerRole: "diretoria",
    mode: "Monitoramento executivo, uso e indicadores disponibilizados à diretoria.",
  },
};

function hasCadastroCompleto(project: Project) {
  const fp = project.financial_profile || {};
  return Boolean(
    project.name?.trim() &&
      project.cnpj?.trim() &&
      project.legal_name?.trim() &&
      project.segment?.trim() &&
      (project.account_plan || []).length > 0 &&
      (project.supplier_classes || []).length > 0 &&
      project.project_summary?.trim() &&
      fp.tx_percent !== undefined &&
      fp.float_days !== undefined &&
      fp.tac !== undefined &&
      fp.cost_per_boleto !== undefined
  );
}

async function loadFacts(projectId: string): Promise<WorkflowFacts> {
  const [alerts, uploads, routineRuns, closures, deliveryRuns] = await Promise.all([
    dbQuery<{ n: number }>("select count(*)::int as n from project_alerts where project_id=$1", [projectId]),
    dbQuery<{ historical: number; fidc: number; daily: number }>(
      `select
        count(*) filter (where coalesce(payload->>'notes','') ilike '%upload_kind:historico_%')::int as historical,
        count(*) filter (where coalesce(payload->>'notes','') ilike '%upload_kind:fidc_retorno%')::int as fidc,
        count(*) filter (where source_type='upload' and coalesce(payload->>'notes','') not ilike '%upload_kind:historico_%')::int as daily
       from daily_entries
       where project_id=$1`,
      [projectId]
    ),
    dbQuery<{ n: number }>("select count(*)::int as n from routine_runs where project_id=$1", [projectId]),
    dbQuery<{ n: number }>("select count(*)::int as n from monthly_closures where project_id=$1", [projectId]),
    dbQuery<{ n: number }>("select count(*)::int as n from delivery_runs where project_id=$1", [projectId]),
  ]);

  return {
    alerts: Number(alerts.rows[0]?.n || 0),
    historicalUploads: Number(uploads.rows[0]?.historical || 0),
    fidcUploads: Number(uploads.rows[0]?.fidc || 0),
    dailyUploads: Number(uploads.rows[0]?.daily || 0),
    routineRuns: Number(routineRuns.rows[0]?.n || 0),
    closures: Number(closures.rows[0]?.n || 0),
    deliveryRuns: Number(deliveryRuns.rows[0]?.n || 0),
  };
}

function assess(step: SopStepView, project: Project, facts: WorkflowFacts): Pick<WorkflowStepRuntime, "health" | "reason" | "counts"> {
  switch (step.key) {
    case "cadastro": {
      const complete = hasCadastroCompleto(project);
      return complete
        ? { health: "funciona", reason: "Cadastro-base completo com parâmetros financeiros e classificação preenchidos." }
        : { health: "parcial", reason: "Existe módulo de cadastro, mas ainda faltam campos obrigatórios/checklist para concluir a implementação." };
    }
    case "riscos":
      return facts.alerts > 0
        ? { health: "parcial", reason: "Riscos/alertas operam manualmente no sistema, mas o fluxo IA + validação formal ainda não está completo.", counts: { alertas: facts.alerts } }
        : { health: "nao_funciona", reason: "Sem riscos/alertas cadastrados para o projeto ainda.", counts: { alertas: 0 } };
    case "upload_base_historica":
      return facts.historicalUploads > 0
        ? { health: "parcial", reason: "Já há upload histórico registrado, mas ainda sem pipeline completo por todas as categorias da planilha.", counts: { uploadsHistoricos: facts.historicalUploads } }
        : { health: "nao_funciona", reason: "Ainda não há upload histórico dedicado registrado no projeto." };
    case "analise_base_historica":
      return facts.historicalUploads > 0
        ? { health: "parcial", reason: "Base histórica já pode ser enviada, mas o diagnóstico histórico executivo ainda depende de costura de análise/IA." }
        : { health: "nao_funciona", reason: "Não há base histórica carregada para suportar a análise." };
    case "validacao_diagnostico":
      return { health: step.status === "concluido" ? "funciona" : "nao_funciona", reason: step.status === "concluido" ? "Diagnóstico marcado como validado." : "A validação formal do diagnóstico ainda não foi concluída." };
    case "upload_base_diaria":
      return facts.dailyUploads > 0
        ? { health: "funciona", reason: "Upload diário operacional ativo no projeto.", counts: { uploadsDiarios: facts.dailyUploads } }
        : { health: "nao_funciona", reason: "Ainda não há upload diário registrado." };
    case "painel_risco":
      return facts.fidcUploads > 0
        ? { health: "parcial", reason: "Há insumo de retorno FIDC, mas o painel consolidado ainda não cobre toda a segregação da planilha.", counts: { retornosFidc: facts.fidcUploads } }
        : { health: "parcial", reason: "Existe visão de risco/alerta, mas sem retorno FIDC dedicado neste projeto ainda." };
    case "movimento_diario":
      return facts.routineRuns > 0
        ? { health: "parcial", reason: "Rotina diária roda e produz decisão operacional base, mas o motor decisório completo ainda é parcial.", counts: { rotinas: facts.routineRuns } }
        : { health: "nao_funciona", reason: "Nenhuma rotina diária executada ainda." };
    case "validacao_movimento":
      return facts.deliveryRuns > 0
        ? { health: "parcial", reason: "Já existe trilha de delivery/resumo, mas a validação formal completa ainda depende de aprovação explícita.", counts: { envios: facts.deliveryRuns } }
        : { health: "nao_funciona", reason: "Sem entregas/resumos vinculados ao movimento diário ainda." };
    case "alimentacao_contabil":
      return facts.closures > 0
        ? { health: "parcial", reason: "Fechamento já produz base mensal, mas a costura total DRE/DFC/apresentação ainda é parcial.", counts: { fechamentos: facts.closures } }
        : { health: "nao_funciona", reason: "Ainda não há evidência operacional de alimentação contábil consolidada." };
    case "fechamento_mensal":
      return facts.closures > 0
        ? { health: "funciona", reason: "Fechamento mensal com snapshot já está operando.", counts: { fechamentos: facts.closures } }
        : { health: "nao_funciona", reason: "Nenhum fechamento mensal gerado ainda." };
    case "validacao_fechamento":
      return { health: step.status === "concluido" ? "funciona" : "parcial", reason: step.status === "concluido" ? "Fechamento já validado formalmente." : "Fechamento pode ser gerado, mas a validação formal ainda depende de aprovação superior." };
    case "monitoramento_diretoria":
      return facts.deliveryRuns > 0
        ? { health: "parcial", reason: "Há sinais de monitoramento/entrega, mas ainda não é uma esteira executiva completa da diretoria.", counts: { envios: facts.deliveryRuns } }
        : { health: "nao_funciona", reason: "Ainda não há trilha clara de monitoramento diretoria neste projeto." };
    default:
      return { health: "parcial", reason: "Etapa mapeada, porém sem regra de avaliação específica ainda." };
  }
}

export async function buildWorkflowRuntime(project: Project, sopSteps: SopStepView[]): Promise<WorkflowStepRuntime[]> {
  const facts = await loadFacts(project.id);

  return sopSteps.map((step) => {
    const meta = META[step.key] || {
      usage: "contínuo por demanda" as WorkflowUsage,
      ownerRole: "head" as WorkflowStepRuntime["ownerRole"],
      mode: "Fluxo operacional ainda sem descrição detalhada.",
    };
    const assessed = assess(step, project, facts);
    return {
      key: step.key,
      phase: step.phase,
      order: step.order,
      title: step.title,
      usage: meta.usage,
      ownerRole: meta.ownerRole,
      mode: meta.mode,
      status: step.status,
      health: assessed.health,
      reason: assessed.reason,
      evidence: step.evidence,
      note: step.note,
      updatedAt: step.updated_at,
      counts: assessed.counts,
    };
  });
}

export type NavSection = "home" | "operacao" | "financeiro" | "implantacao" | "governanca";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  order: number;
  section: NavSection;
  action?: string;
  projectScoped?: boolean;
  description?: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "dashboard", label: "Cockpit", href: "/dashboard", order: 1, section: "home", action: "project.view", description: "Centro de comando da operação" },
  { key: "projetos", label: "Projetos", href: "/projetos", order: 2, section: "home", action: "project.view", description: "Carteira ativa e entrada por projeto" },

  { key: "movimento_diario", label: "Movimento Diário", href: "/projetos/:id/movimento-diario", order: 10, section: "operacao", action: "project.view", projectScoped: true, description: "Decisão operacional do dia" },
  { key: "rotina", label: "Rotina Diária", href: "/projetos/:id/rotina-diaria", order: 11, section: "operacao", action: "routine.run", projectScoped: true, description: "Execução e resumo operacional" },
  { key: "riscos", label: "Riscos & Alertas", href: "/projetos/:id/riscos-alertas", order: 12, section: "operacao", action: "alert.manage", projectScoped: true, description: "Painel de risco e bloqueios" },
  { key: "diario", label: "Base Diária", href: "/projetos/:id/diario", order: 13, section: "operacao", action: "daily.write", projectScoped: true, description: "Upload e lançamento diário" },
  { key: "conciliacao", label: "Conciliação", href: "/projetos/:id/conciliacao", order: 14, section: "operacao", action: "reconcile.run", projectScoped: true, description: "Pendências e consistência" },
  { key: "operacoes", label: "Operações", href: "/projetos/:id/operacoes", order: 15, section: "operacao", action: "ops.create", projectScoped: true, description: "Funding, títulos e formalização" },
  { key: "delivery", label: "Delivery", href: "/projetos/:id/delivery", order: 16, section: "operacao", action: "delivery.view", projectScoped: true, description: "Entregas e reenvios" },
  { key: "workflow", label: "Fluxo de Trabalho", href: "/projetos/:id/fluxo-trabalho", order: 17, section: "operacao", action: "project.view", projectScoped: true, description: "Trilha macro do projeto" },

  { key: "fluxo", label: "Fluxo 90d", href: "/projetos/:id/fluxo-caixa", order: 20, section: "financeiro", action: "project.view", projectScoped: true, description: "Caixa e projeções" },
  { key: "dredfc", label: "DRE / DFC", href: "/projetos/:id/dre-dfc", order: 21, section: "financeiro", action: "project.view", projectScoped: true, description: "Leitura financeira gerencial" },
  { key: "fechamento", label: "Fechamento", href: "/projetos/:id/fechamento-mensal", order: 22, section: "financeiro", action: "closure.create", projectScoped: true, description: "Fechar mês e validar" },

  { key: "cadastro", label: "Cadastro", href: "/projetos/:id/cadastro", order: 30, section: "implantacao", action: "project.edit", projectScoped: true, description: "Base estrutural do projeto" },
  { key: "diagnostico_historico", label: "Diagnóstico Histórico", href: "/projetos/:id/diagnostico-historico", order: 31, section: "implantacao", action: "project.view", projectScoped: true, description: "Leitura executiva da base histórica" },

  { key: "monitoramento_diretoria", label: "Monitoramento Diretoria", href: "/projetos/:id/monitoramento-diretoria", order: 40, section: "governanca", action: "project.view", projectScoped: true, description: "Visão executiva e validação final" },
  { key: "auditoria", label: "Auditoria", href: "/auditoria-uso", order: 41, section: "governanca", action: "audit.view", description: "Trilha de uso e evidências" },
  { key: "statusops", label: "Status Ops", href: "/admin/status", order: 42, section: "governanca", action: "admin.status", description: "Saúde operacional da plataforma" },
  { key: "admin", label: "Admin", href: "/admin", order: 43, section: "governanca", action: "admin.status", description: "Controles administrativos" },
  { key: "processo", label: "Blueprint", href: "/processo", order: 44, section: "governanca", action: "project.view", description: "Mapa da lógica interna" },
] as const;

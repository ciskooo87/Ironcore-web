export type NavItem = {
  key: string;
  label: string;
  href: string;
  order: number;
  section: "geral" | "projeto" | "governanca";
  action?: string;
  projectScoped?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", order: 1, section: "geral", action: "project.view" },
  { key: "projetos", label: "Projetos", href: "/projetos", order: 2, section: "geral", action: "project.view" },

  { key: "cadastro", label: "Cadastro", href: "/projetos/:id/cadastro", order: 10, section: "projeto", action: "project.edit", projectScoped: true },
  { key: "riscos", label: "Riscos & Alertas", href: "/projetos/:id/riscos-alertas", order: 11, section: "projeto", action: "alert.manage", projectScoped: true },
  { key: "diario", label: "Upload/Diário", href: "/projetos/:id/diario", order: 12, section: "projeto", action: "daily.write", projectScoped: true },
  { key: "conciliacao", label: "Conciliação", href: "/projetos/:id/conciliacao", order: 13, section: "projeto", action: "reconcile.run", projectScoped: true },
  { key: "operacoes", label: "Operações", href: "/projetos/:id/operacoes", order: 14, section: "projeto", action: "ops.create", projectScoped: true },
  { key: "fluxo", label: "Fluxo 90d", href: "/projetos/:id/fluxo-caixa", order: 15, section: "projeto", action: "project.view", projectScoped: true },
  { key: "dredfc", label: "DRE / DFC", href: "/projetos/:id/dre-dfc", order: 16, section: "projeto", action: "project.view", projectScoped: true },
  { key: "rotina", label: "Rotina Diária", href: "/projetos/:id/rotina-diaria", order: 17, section: "projeto", action: "routine.run", projectScoped: true },
  { key: "movimento_diario", label: "Movimento Diário", href: "/projetos/:id/movimento-diario", order: 18, section: "projeto", action: "project.view", projectScoped: true },
  { key: "workflow", label: "Fluxo de Trabalho", href: "/projetos/:id/fluxo-trabalho", order: 19, section: "projeto", action: "project.view", projectScoped: true },
  { key: "diagnostico_historico", label: "Diagnóstico Histórico", href: "/projetos/:id/diagnostico-historico", order: 19, section: "projeto", action: "project.view", projectScoped: true },
  { key: "delivery", label: "Delivery", href: "/projetos/:id/delivery", order: 20, section: "projeto", action: "delivery.view", projectScoped: true },
  { key: "fechamento", label: "Fechamento", href: "/projetos/:id/fechamento-mensal", order: 21, section: "projeto", action: "closure.create", projectScoped: true },
  { key: "monitoramento_diretoria", label: "Monitoramento Diretoria", href: "/projetos/:id/monitoramento-diretoria", order: 22, section: "projeto", action: "project.view", projectScoped: true },

  { key: "auditoria", label: "Auditoria", href: "/auditoria-uso", order: 30, section: "governanca", action: "audit.view" },
  { key: "admin", label: "Admin", href: "/admin", order: 31, section: "governanca", action: "admin.status" },
  { key: "statusops", label: "Status Ops", href: "/admin/status", order: 32, section: "governanca", action: "admin.status" },
  { key: "processo", label: "Processo 13 Abas", href: "/processo", order: 33, section: "governanca", action: "project.view" },
] as const;

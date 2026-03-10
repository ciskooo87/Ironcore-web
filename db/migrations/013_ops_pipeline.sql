alter table financial_operations
  add column if not exists status text not null default 'em_elaboracao'
    check (status in ('em_elaboracao','em_correcao','pendente_aprovacao','aprovada','em_correcao_formalizacao','pendente_formalizacao','formalizada','cancelada')),
  add column if not exists operator_name text,
  add column if not exists counterparty_name text,
  add column if not exists document_ref text,
  add column if not exists due_date date,
  add column if not exists modality text,
  add column if not exists risk_level text not null default 'medio'
    check (risk_level in ('baixo','medio','alto')),
  add column if not exists principal_amount numeric(14,2),
  add column if not exists disbursed_amount numeric(14,2),
  add column if not exists company_fee numeric(14,2),
  add column if not exists fund_name text,
  add column if not exists approver_name text,
  add column if not exists approval_note text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_financial_operations_project_status_date
  on financial_operations(project_id, status, business_date desc);

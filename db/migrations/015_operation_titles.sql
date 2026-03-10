create table if not exists operation_titles (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references financial_operations(id) on delete cascade,
  project_id uuid not null references projects(id),
  title_ref text not null,
  debtor_name text,
  debtor_doc text,
  face_value numeric(14,2) not null default 0,
  present_value numeric(14,2) not null default 0,
  due_date date,
  expected_settlement_date date,
  paid_at date,
  payment_method text,
  carteira_status text not null default 'a_vencer'
    check (carteira_status in ('a_vencer','vencido','liquidado','recomprado','prorrogado','inadimplente')),
  note text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_operation_titles_operation on operation_titles(operation_id, created_at desc);
create index if not exists idx_operation_titles_project_status on operation_titles(project_id, carteira_status, due_date);

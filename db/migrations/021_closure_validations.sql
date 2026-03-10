create table if not exists closure_validations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  closure_id uuid not null references monthly_closures(id) on delete cascade,
  decision text not null check (decision in ('aprovado','ajustar','bloquear')),
  note text,
  summary_text text,
  validated_by uuid references users(id),
  validated_at timestamptz not null default now()
);

create index if not exists idx_closure_validations_project_date on closure_validations(project_id, validated_at desc);

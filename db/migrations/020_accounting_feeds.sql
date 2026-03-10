create table if not exists accounting_feeds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  period_ym text not null,
  payload jsonb not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_accounting_feeds_project_period on accounting_feeds(project_id, period_ym, created_at desc);

create table if not exists risk_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  provider text,
  model text,
  status text not null default 'suggested' check (status in ('suggested','approved','discarded')),
  prompt jsonb,
  response jsonb,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_risk_ai_suggestions_project_date on risk_ai_suggestions(project_id, created_at desc);

create table if not exists ai_inference_runs (
  id bigserial primary key,
  project_id uuid not null references projects(id),
  routine_run_id uuid references routine_runs(id),
  provider text not null,
  model text,
  latency_ms integer not null default 0,
  status text not null check (status in ('ok','error')),
  prompt jsonb,
  response text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_inference_runs_project_created on ai_inference_runs(project_id, created_at desc);
create index if not exists idx_ai_inference_runs_routine on ai_inference_runs(routine_run_id);

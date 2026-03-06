create table if not exists sop_step_status (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  step_key text not null,
  phase text not null,
  step_order int not null,
  title text not null,
  status text not null check (status in ('nao_iniciado','em_execucao','aguardando_validacao','concluido','bloqueado')),
  evidence text,
  note text,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now(),
  unique(project_id, step_key)
);

create index if not exists idx_sop_step_status_project on sop_step_status(project_id, phase, step_order);

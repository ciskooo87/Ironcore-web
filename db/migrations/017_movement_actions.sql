create table if not exists movement_actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  routine_run_id uuid references routine_runs(id) on delete set null,
  action_key text not null,
  action_label text not null,
  status text not null default 'open' check (status in ('open','done')),
  linked_entity text,
  linked_entity_id text,
  note text,
  executed_by uuid references users(id),
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create index if not exists idx_movement_actions_project_created on movement_actions(project_id, created_at desc);

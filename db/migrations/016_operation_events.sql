create table if not exists operation_events (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references financial_operations(id) on delete cascade,
  project_id uuid not null references projects(id),
  event_type text not null,
  event_label text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_operation_events_operation on operation_events(operation_id, created_at desc);

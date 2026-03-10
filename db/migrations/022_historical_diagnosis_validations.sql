create table if not exists historical_diagnosis_validations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  inference_run_id bigint not null references ai_inference_runs(id) on delete cascade,
  decision text not null check (decision in ('aprovado','ajustar','bloquear')),
  note text,
  summary_text text,
  validated_by uuid references users(id),
  validated_at timestamptz not null default now()
);

create index if not exists idx_historical_diagnosis_validations_project_date on historical_diagnosis_validations(project_id, validated_at desc);

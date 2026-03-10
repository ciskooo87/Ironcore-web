create table if not exists operation_comments (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references financial_operations(id) on delete cascade,
  project_id uuid not null references projects(id),
  author_user_id uuid references users(id),
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists operation_documents (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references financial_operations(id) on delete cascade,
  project_id uuid not null references projects(id),
  document_type text not null,
  document_ref text not null,
  note text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_operation_comments_operation on operation_comments(operation_id, created_at desc);
create index if not exists idx_operation_documents_operation on operation_documents(operation_id, created_at desc);

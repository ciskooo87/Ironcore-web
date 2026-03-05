create table if not exists lp_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_lp_leads_created_at on lp_leads(created_at desc);

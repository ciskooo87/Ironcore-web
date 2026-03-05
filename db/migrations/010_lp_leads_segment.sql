alter table if exists lp_leads
  add column if not exists segment text;

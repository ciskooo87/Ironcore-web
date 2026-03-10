alter table movement_actions
  add column if not exists assignee_name text,
  add column if not exists closed_note text,
  add column if not exists reopened_at timestamptz;

alter table public.content_versions
  add column is_ai_generated boolean not null default false;

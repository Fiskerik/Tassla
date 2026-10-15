-- Add owner-selected life context without changing existing dogs or historical records.
begin;
alter table public.dogs
  add column senior_confirmed boolean not null default false,
  add column end_of_life boolean not null default false;
grant update (senior_confirmed, end_of_life) on public.dogs to authenticated;
commit;

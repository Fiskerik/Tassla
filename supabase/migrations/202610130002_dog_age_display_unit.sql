-- Persist the owner's preferred age presentation without changing age-based targeting.
begin;

alter table public.dogs
  add column age_display_unit text not null default 'weeks'
  check (age_display_unit in ('weeks', 'months', 'years'));

grant update (age_display_unit) on public.dogs to authenticated;

commit;

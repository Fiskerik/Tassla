-- Owner-controlled local reminder preferences for planned health events.
begin;

alter table public.dog_health_plans
  add column reminder_enabled boolean not null default false,
  add column reminder_minutes integer,
  add constraint dog_health_plans_reminder_minutes_range
    check (reminder_minutes is null or reminder_minutes between 0 and 1439),
  add constraint dog_health_plans_reminder_time_required
    check (not reminder_enabled or reminder_minutes is not null);

create index dog_health_plans_reminders_due
  on public.dog_health_plans(dog_id, due_on, reminder_minutes, id)
  where reminder_enabled = true;

grant insert(reminder_enabled, reminder_minutes) on public.dog_health_plans to authenticated;
grant update(reminder_enabled, reminder_minutes) on public.dog_health_plans to authenticated;

commit;

begin;

alter table public.dog_health_plans
  add column due_time time(0) without time zone,
  add constraint dog_health_plans_due_time_minute
    check (due_time is null or (due_time < time '24:00:00' and extract(second from due_time) = 0));

grant insert(due_time) on public.dog_health_plans to authenticated;
grant update(due_time) on public.dog_health_plans to authenticated;

commit;

-- Run separately AFTER 202610060002_plan_reminders.sql in an isolated development project.
-- Synthetic users and dogs only; this probe always rolls back and is not a live-database result.
begin;
insert into auth.users(id, email) values
  ('10000000-0000-4000-8000-000000000001', 'reminder-owner-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'reminder-owner-b@example.invalid');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('test.reminder_dog_a', public.create_dog('Synthetic reminder A', 'unknown', current_date - 70)::text, true);
insert into public.dog_health_plans(id, dog_id, event_type, due_on, description)
values ('50000000-0000-4000-8000-000000000011', current_setting('test.reminder_dog_a')::uuid,
  'vaccination', current_date + 1, 'Synthetic plan');

do $$ begin
  if not exists(select 1 from public.dog_health_plans where id = '50000000-0000-4000-8000-000000000011'
      and reminder_enabled = false and reminder_minutes is null) then
    raise exception 'New plans must default to reminders off with no selected time';
  end if;
  update public.dog_health_plans set reminder_enabled = true, reminder_minutes = 540
    where id = '50000000-0000-4000-8000-000000000011';
  if not exists(select 1 from public.dog_health_plans where id = '50000000-0000-4000-8000-000000000011'
      and reminder_enabled = true and reminder_minutes = 540) then
    raise exception 'Owner could not save a selected local reminder time';
  end if;
  begin
    update public.dog_health_plans set reminder_minutes = null
      where id = '50000000-0000-4000-8000-000000000011';
    raise exception 'Enabled reminder accepted a missing time';
  exception when check_violation then null; end;
  begin
    update public.dog_health_plans set reminder_enabled = false, reminder_minutes = 1440
      where id = '50000000-0000-4000-8000-000000000011';
    raise exception 'Reminder time accepted a value outside the local-day range';
  exception when check_violation then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select set_config('test.reminder_dog_b', public.create_dog('Synthetic reminder B', 'mixed', current_date - 80)::text, true);
do $$ declare affected integer; begin
  if exists(select 1 from public.dog_health_plans where id = '50000000-0000-4000-8000-000000000011') then
    raise exception 'Other owner read a reminder choice';
  end if;
  update public.dog_health_plans set reminder_enabled = false, reminder_minutes = null
    where id = '50000000-0000-4000-8000-000000000011';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other owner updated another owner reminder choice'; end if;
end $$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin
    update public.dog_health_plans set reminder_enabled = false, reminder_minutes = null;
    raise exception 'Anonymous reminder update was granted';
  exception when insufficient_privilege then null; end;
end $$;

rollback;

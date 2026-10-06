-- Run separately AFTER 202610060001_planned_health.sql in a new development project.
-- Synthetic users and dog data only; this transaction is always rolled back.
begin;
insert into auth.users(id, email) values
  ('10000000-0000-4000-8000-000000000001', 'planned-owner-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'planned-owner-b@example.invalid');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('test.planned_dog_a', public.create_dog('Synthetic plan A', 'unknown', current_date - 70)::text, true);
insert into public.dog_health_plans(id, dog_id, event_type, due_on, description) values
  ('50000000-0000-4000-8000-000000000001', current_setting('test.planned_dog_a')::uuid, 'vaccination', current_date + 1, 'Planned only');
insert into public.dog_events(id, dog_id, event_type, occurred_on, description) values
  ('50000000-0000-4000-8000-000000000002', current_setting('test.planned_dog_a')::uuid, 'vaccination', current_date, 'Performed separately');

do $$ begin
  if (select count(*) from public.dog_health_plans where dog_id = current_setting('test.planned_dog_a')::uuid) <> 1 then
    raise exception 'Owner cannot read the planned record';
  end if;
  if (select count(*) from public.dog_events where dog_id = current_setting('test.planned_dog_a')::uuid and event_type = 'vaccination') <> 1 then
    raise exception 'Completed history was not stored separately';
  end if;
  update public.dog_health_plans set due_on = current_date - 1
    where id = '50000000-0000-4000-8000-000000000001';
  update public.dog_health_plans set description = 'Corrected overdue plan'
    where id = '50000000-0000-4000-8000-000000000001';
  if not exists(select 1 from public.dog_health_plans where id = '50000000-0000-4000-8000-000000000001'
      and due_on = current_date - 1 and description = 'Corrected overdue plan') then
    raise exception 'Overdue plan could not be corrected without changing its date';
  end if;
  begin
    update public.dog_health_plans set event_type = 'vet_visit' where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'Authenticated owner changed immutable event_type';
  exception when insufficient_privilege then null; end;
  begin
    update public.dog_health_plans set dog_id = gen_random_uuid() where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'Authenticated owner reassigned immutable dog_id';
  exception when insufficient_privilege then null; end;
  begin
    update public.dog_health_plans set id = gen_random_uuid() where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'Authenticated owner changed immutable id';
  exception when insufficient_privilege then null; end;
  begin
    update public.dog_health_plans set created_at = now() where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'Authenticated owner changed created_at';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select set_config('test.planned_dog_b', public.create_dog('Synthetic plan B', 'mixed', current_date - 80)::text, true);
do $$ declare affected integer; begin
  if exists(select 1 from public.dog_health_plans where id = '50000000-0000-4000-8000-000000000001') then
    raise exception 'Other owner read a planned record';
  end if;
  update public.dog_health_plans set description = 'Other owner edit' where id = '50000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other owner updated a planned record'; end if;
  delete from public.dog_health_plans where id = '50000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other owner deleted a planned record'; end if;
  begin
    insert into public.dog_health_plans(id, dog_id, event_type, due_on, description) values
      ('50000000-0000-4000-8000-000000000003', current_setting('test.planned_dog_a')::uuid, 'vet_visit', current_date + 1, null);
    raise exception 'Other owner inserted a plan for another dog';
  exception when insufficient_privilege then null; end;
end $$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin
    perform * from public.dog_health_plans;
    raise exception 'Anonymous read was granted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.dog_health_plans(id, dog_id, event_type, due_on, description) values
      (gen_random_uuid(), current_setting('test.planned_dog_b')::uuid, 'vaccination', current_date + 1, null);
    raise exception 'Anonymous insert was granted';
  exception when insufficient_privilege then null; end;
  begin
    update public.dog_health_plans set description = 'Anonymous edit';
    raise exception 'Anonymous update was granted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.dog_health_plans;
    raise exception 'Anonymous delete was granted';
  exception when insufficient_privilege then null; end;
end $$;

rollback;

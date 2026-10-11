-- Run after 202610110003_dog_event_details.sql in a development database.
-- Synthetic owners only; all fixtures and checks are rolled back.
begin;

insert into auth.users(id, email) values
  ('10000000-0000-4000-8000-000000000001', 'log-details-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'log-details-b@example.invalid');

do $$
declare policy_count integer;
begin
  if has_table_privilege('authenticated', 'public.dog_events', 'UPDATE') then
    raise exception 'authenticated has table-wide dog_events UPDATE';
  end if;
  if not has_column_privilege('authenticated', 'public.dog_events', 'accident_kind', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.dog_events', 'amount', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.dog_events', 'amount_unit', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.dog_events', 'food_type', 'UPDATE') then
    raise exception 'new detail columns are not updateable';
  end if;
  if has_column_privilege('authenticated', 'public.dog_events', 'dog_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.dog_events', 'actor_id', 'UPDATE') then
    raise exception 'dog identity columns became updateable';
  end if;
  select count(*) into policy_count from pg_policies
  where schemaname = 'public' and tablename = 'dog_events';
  if policy_count <> 4
    or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'dog_events' and policyname = 'event_read' and cmd = 'SELECT' and qual like '%owns_dog%')
    or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'dog_events' and policyname = 'event_insert' and cmd = 'INSERT' and with_check like '%owns_dog%' and with_check like '%auth.uid%')
    or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'dog_events' and policyname = 'event_update' and cmd = 'UPDATE' and qual like '%owns_dog%' and with_check like '%owns_dog%' and with_check like '%auth.uid%')
    or not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'dog_events' and policyname = 'event_delete' and cmd = 'DELETE' and qual like '%owns_dog%') then
    raise exception 'dog_events owner RLS policies changed';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('test.log_details_dog_a', public.create_dog('Synthetic Log A', 'unknown', current_date - 70)::text, true);

insert into public.dog_events(id, dog_id, event_type, occurred_at, accident_kind)
values ('50000000-0000-4000-8000-000000000001', current_setting('test.log_details_dog_a')::uuid, 'accident', now(), 'both');
insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit, food_type)
values ('50000000-0000-4000-8000-000000000002', current_setting('test.log_details_dog_a')::uuid, 'food', now(), 80, 'g', 'Synthetic food');
insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
values
  ('50000000-0000-4000-8000-000000000003', current_setting('test.log_details_dog_a')::uuid, 'water', now(), 900, 'ml'),
  ('50000000-0000-4000-8000-000000000004', current_setting('test.log_details_dog_a')::uuid, 'water', now(), 9, 'dl'),
  ('50000000-0000-4000-8000-000000000005', current_setting('test.log_details_dog_a')::uuid, 'food', now());

do $$
begin
  if not exists (select 1 from public.dog_events where id = '50000000-0000-4000-8000-000000000005' and accident_kind is null and amount is null and amount_unit is null and food_type is null) then
    raise exception 'legacy-style NULL details were not accepted';
  end if;
  update public.dog_events set amount = 120, amount_unit = 'g', food_type = 'Updated synthetic food'
  where id = '50000000-0000-4000-8000-000000000002';
  if not exists (select 1 from public.dog_events where id = '50000000-0000-4000-8000-000000000002' and amount = 120 and amount_unit = 'g') then
    raise exception 'owner could not update detail columns';
  end if;

  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), 50, null);
    raise exception 'amount without unit was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), null, 'g');
    raise exception 'unit without amount was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, accident_kind)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'pee', now(), 'pee');
    raise exception 'accident kind on pee was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, accident_kind)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'accident', now(), 'sleep');
    raise exception 'invalid accident kind was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), 50, 'ml');
    raise exception 'food amount with ml was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'water', now(), 50, 'g');
    raise exception 'water amount with g was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), 0, 'g');
    raise exception 'zero amount was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), 2000.01, 'g');
    raise exception 'food amount over technical cap was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'water', now(), 10000.01, 'ml');
    raise exception 'water ml amount over technical cap was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, amount, amount_unit)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'water', now(), 100.01, 'dl');
    raise exception 'water dl amount over technical cap was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'water', now(), 'Synthetic food');
    raise exception 'food type on water was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), ' Synthetic food');
    raise exception 'untrimmed food type was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), E' \t\r\nSynthetic food\n\r\t ');
    raise exception 'untrimmed ASCII whitespace was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), E' \t\r\n ');
    raise exception 'whitespace-only food type was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), repeat('a', 61));
    raise exception 'food type over 60 code points was accepted';
  exception when check_violation then null; end;
  insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
  values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), repeat('🐕', 60));
  begin
    insert into public.dog_events(id, dog_id, event_type, occurred_at, food_type)
    values (gen_random_uuid(), current_setting('test.log_details_dog_a')::uuid, 'food', now(), repeat('🐕', 61));
    raise exception 'food type over 60 Unicode code points was accepted';
  exception when check_violation then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select set_config('test.log_details_dog_b', public.create_dog('Synthetic Log B', 'unknown', current_date - 80)::text, true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.dog_events where id = '50000000-0000-4000-8000-000000000001') then
    raise exception 'other owner read event details';
  end if;
  update public.dog_events set accident_kind = 'pee' where id = '50000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'other owner changed event details'; end if;
end $$;

rollback;

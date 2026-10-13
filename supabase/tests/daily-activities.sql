-- Synthetic R02-2 security and behavior probes.
-- Run as postgres after foundation and 202610130001_daily_activities.sql in a NEW dev database.
-- All fixtures, ownership changes, progress and purge results roll back at the end.
begin;
insert into auth.users(id,email) values
  ('10000000-0000-4000-8000-000000000001','daily-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002','daily-b@example.invalid');
insert into public.breeds(id,name) values
  ('daily-activity-probe','Daily Activity Probe'),('daily-activity-other','Daily Activity Other')
on conflict (id) do nothing;
insert into public.dogs(id,name,breed_id,birth_date) values
  ('20000000-0000-4000-8000-000000000001','Daily A','daily-activity-probe',current_date-70),
  ('20000000-0000-4000-8000-000000000002','Daily B','daily-activity-probe',current_date-80);
insert into public.dog_memberships(dog_id,user_id) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
insert into public.content_items(id,slug,content_type) values
  ('30000000-0000-4000-8000-000000000001','daily-activity-probe-program','training_program');
insert into public.content_versions(id,content_id,version,title,body,min_age_weeks,max_age_weeks,status) values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',1,'Daily v1','Synthetic only.',0,20,'draft'),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001',2,'Daily v2','Synthetic only.',0,5,'draft'),
  ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001',3,'Daily v3','Synthetic only.',0,20,'draft'),
  ('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001',4,'Daily v4','Synthetic only.',20,null,'draft');
insert into public.training_steps(id,program_version_id,step_key,position,title,instruction) values
  ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','one',1,'Version one','Synthetic only.'),
  ('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','one',1,'Step one','Synthetic only.'),
  ('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','two',2,'Step two','Synthetic only.'),
  ('50000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000002','three',3,'Step three','Synthetic only.'),
  ('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000003','one',1,'Breed targeted step','Synthetic only.'),
  ('50000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000004','one',1,'Too young step','Synthetic only.');
insert into public.content_breed_targets(content_version_id,breed_id)
  values('40000000-0000-4000-8000-000000000003','daily-activity-other');
update public.content_versions set status='published', reviewed_at=clock_timestamp(), review_reference='synthetic probe', published_at=clock_timestamp()
where id in ('40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.dog_daily_routines(id,dog_id,label) values
  ('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Morning routine A');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into public.dog_daily_routines(id,dog_id,label) values
  ('60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Morning routine B');

do $$ declare guard_source text; begin
  if has_table_privilege('anon','public.dog_daily_routines','SELECT') or has_table_privilege('anon','public.dog_daily_routine_days','SELECT') or has_table_privilege('anon','public.dog_daily_training_selections','SELECT') then
    raise exception 'anon can read daily activity data';
  end if;
  if has_table_privilege('authenticated','public.dog_daily_routines','TRUNCATE') or has_table_privilege('authenticated','public.dog_daily_routine_days','TRUNCATE') or has_table_privilege('authenticated','public.dog_daily_training_selections','TRUNCATE') then
    raise exception 'authenticated has TRUNCATE';
  end if;
  if has_table_privilege('authenticated','public.dog_daily_routines','REFERENCES') or has_table_privilege('authenticated','public.dog_daily_routine_days','REFERENCES') or has_table_privilege('authenticated','public.dog_daily_training_selections','REFERENCES') then
    raise exception 'authenticated has REFERENCES';
  end if;
  if has_column_privilege('authenticated','public.dog_daily_routine_days','completed_at','INSERT') or not has_column_privilege('authenticated','public.dog_daily_routine_days','completed_at','UPDATE') then
    raise exception 'routine completion column grants are incorrect';
  end if;
  if has_column_privilege('authenticated','public.dog_daily_training_selections','program_version_id','UPDATE')
    or has_column_privilege('authenticated','public.dog_daily_training_selections','step_id','UPDATE')
    or has_column_privilege('authenticated','public.dog_daily_training_selections','date_key','UPDATE')
    or has_column_privilege('authenticated','public.dog_daily_training_selections','time_zone','UPDATE') then
    raise exception 'training selection source is mutable';
  end if;
  if has_function_privilege('authenticated','private.purge_expired_daily_activity_selections()','EXECUTE') or has_function_privilege('anon','private.purge_expired_daily_activity_selections()','EXECUTE') then
    raise exception 'daily selection purge is not service-only';
  end if;
  select pg_get_functiondef('private.guard_daily_routine_day()'::regprocedure) into guard_source;
  if position('for update' in lower(guard_source)) = 0 or position('clock_timestamp()' in lower(guard_source)) = 0
    or position('for update' in lower(guard_source)) > position('clock_timestamp()' in lower(guard_source)) then
    raise exception 'daily routine trigger must capture wall clock after row locks';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare
  local_today date := (clock_timestamp() at time zone 'UTC')::date;
  saved_at timestamptz;
  affected integer;
begin
  insert into public.dog_daily_routine_days(id,dog_id,routine_id,date_key,time_zone)
    values('70000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',local_today,'UTC');
  begin
    insert into public.dog_daily_routine_days(id,dog_id,routine_id,date_key,time_zone)
      values('70000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002',local_today,'UTC');
    raise exception 'composite dog/routine relationship accepted another dog routine';
  exception when foreign_key_violation then null; end;

  update public.dog_daily_routine_days set completed_at='2000-01-01T00:00:00Z' where id='70000000-0000-4000-8000-000000000001';
  select completed_at into saved_at from public.dog_daily_routine_days where id='70000000-0000-4000-8000-000000000001';
  if saved_at is null or saved_at < clock_timestamp()-interval '1 minute' then raise exception 'completion timestamp was not server stamped'; end if;
  update public.dog_daily_routine_days set completed_at=null where id='70000000-0000-4000-8000-000000000001' and completed_at='2000-01-01T00:00:00Z';
  get diagnostics affected = row_count;
  if affected <> 0 or not exists(select 1 from public.dog_daily_routine_days where id='70000000-0000-4000-8000-000000000001' and completed_at=saved_at) then raise exception 'stale undo changed a newer completion'; end if;
  update public.dog_daily_routine_days set completed_at=null where id='70000000-0000-4000-8000-000000000001' and completed_at=saved_at;
  if not exists(select 1 from public.dog_daily_routine_days where id='70000000-0000-4000-8000-000000000001' and completed_at is null) then raise exception 'compare-and-set undo failed'; end if;
  begin
    update public.dog_daily_routine_days set date_key=local_today+1 where id='70000000-0000-4000-8000-000000000001';
    raise exception 'authenticated changed immutable daily scope';
  exception when insufficient_privilege then null; end;
  insert into public.dog_daily_routines(id,dog_id,label)
    values('60000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','Delete cascade routine');
  insert into public.dog_daily_routine_days(id,dog_id,routine_id,date_key,time_zone)
    values('70000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000003',local_today,'UTC');
  delete from public.dog_daily_routines where id='60000000-0000-4000-8000-000000000003';
  if exists(select 1 from public.dog_daily_routine_days where id='70000000-0000-4000-8000-000000000002') then raise exception 'routine deletion did not cascade daily selection'; end if;

  insert into public.training_progress(dog_id,program_version_id,step_id)
    values('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002');

  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',local_today,'UTC');
    raise exception 'older superseded published version was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000098','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004',local_today,'UTC');
    raise exception 'out-of-order training step was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000095','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000005',local_today,'UTC');
    raise exception 'breed-mismatched program was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000094','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000006',local_today,'UTC');
    raise exception 'too-young program was accepted';
  exception when invalid_parameter_value then null; end;

  insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
    values('80000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000003',local_today,'UTC');
  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000097','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004',local_today,'UTC');
    raise exception 'later training step became selectable before step two was saved';
  exception when invalid_parameter_value then null; end;
  insert into public.training_progress(dog_id,program_version_id,step_id)
    values('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000003');
  insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
    values('80000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004',local_today,'UTC');
  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000096','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000003',local_today,'UTC');
    raise exception 'already completed training step was selectable again';
  exception when invalid_parameter_value then null; end;
end $$;

reset role;
update public.content_versions set status='withdrawn' where id='40000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ declare local_today date := (clock_timestamp() at time zone 'UTC')::date; begin
  begin
    insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
      values('80000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004',local_today,'UTC');
    raise exception 'withdrawn training source was accepted';
  exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.dog_daily_routines where dog_id='20000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_daily_routine_days where dog_id='20000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_daily_training_selections where dog_id='20000000-0000-4000-8000-000000000001') then
    raise exception 'owner B read owner A daily activity data';
  end if;
  begin
    insert into public.dog_daily_routines(id,dog_id,label) values('60000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','Foreign');
    raise exception 'owner B created routine for owner A';
  exception when insufficient_privilege then null; end;
end $$;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
  begin perform 1 from public.dog_daily_routines; raise exception 'anon read daily routines'; exception when insufficient_privilege then null; end;
  begin perform private.purge_expired_daily_activity_selections(); raise exception 'anon invoked purge'; exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Seed historical rows as synthetic maintenance data, bypassing only current-day guards.
alter table public.dog_daily_routine_days disable trigger guard_daily_routine_day;
alter table public.dog_daily_training_selections disable trigger guard_daily_training_selection;
insert into public.dog_daily_routine_days(id,dog_id,routine_id,date_key,time_zone) values
  ('70000000-0000-4000-8000-000000000030','20000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',((clock_timestamp() at time zone 'UTC')::date-30),'UTC'),
  ('70000000-0000-4000-8000-000000000031','20000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',((clock_timestamp() at time zone 'UTC')::date-29),'UTC'),
  ('70000000-0000-4000-8000-000000000032','20000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',((clock_timestamp() at time zone 'America/Los_Angeles')::date-30),'America/Los_Angeles'),
  ('70000000-0000-4000-8000-000000000033','20000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002',((clock_timestamp() at time zone 'UTC')::date-29),'UTC');
insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone) values
  ('80000000-0000-4000-8000-000000000030','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004',((clock_timestamp() at time zone 'America/Los_Angeles')::date-30),'America/Los_Angeles');
alter table public.dog_daily_routine_days enable trigger guard_daily_routine_day;
alter table public.dog_daily_training_selections enable trigger guard_daily_training_selection;

set local role service_role;
select private.purge_expired_daily_activity_selections();
reset role;
do $$ begin
  if exists(select 1 from public.dog_daily_routine_days where id in ('70000000-0000-4000-8000-000000000030','70000000-0000-4000-8000-000000000032'))
    or exists(select 1 from public.dog_daily_training_selections where id='80000000-0000-4000-8000-000000000030') then raise exception '30-day local-zone cutoff row survived purge'; end if;
  if not exists(select 1 from public.dog_daily_routine_days where id='70000000-0000-4000-8000-000000000031') then raise exception 'newer routine day was purged'; end if;
  if not exists(select 1 from public.dog_daily_routine_days where id='70000000-0000-4000-8000-000000000033' and dog_id='20000000-0000-4000-8000-000000000002') then raise exception 'newer owner B activity was purged'; end if;
  if not exists(select 1 from public.dog_daily_routines where id='60000000-0000-4000-8000-000000000001') then raise exception 'routine template was purged'; end if;
  if has_function_privilege('authenticated','private.purge_expired_daily_activity_selections()','EXECUTE') then raise exception 'authenticated gained purge execute'; end if;
end $$;

-- The fixture is single-session. Lock-wait-over-midnight requires two DB sessions:
-- session A holds the dog lock over local midnight; session B submits a previous-day
-- completion after waiting. The trigger must use its post-lock timestamp for both checks.
-- Keep this runtime result NOT TESTABLE until a local synthetic database is available.
-- Manual two-session probe for that runtime once a disposable local Supabase DB exists:
-- 1. As postgres, create and COMMIT this dedicated fixture before the test night:
--      begin;
--      insert into auth.users(id,email) values
--        ('10000000-0000-4000-8000-000000000099','daily-midnight@example.invalid') on conflict do nothing;
--      insert into public.breeds(id,name) values ('daily-midnight-probe','Daily Midnight Probe') on conflict do nothing;
--      insert into public.dogs(id,name,breed_id,birth_date) values
--        ('20000000-0000-4000-8000-000000000099','Daily Midnight Probe','daily-midnight-probe',current_date-70) on conflict do nothing;
--      insert into public.dog_memberships(dog_id,user_id) values
--        ('20000000-0000-4000-8000-000000000099','10000000-0000-4000-8000-000000000099') on conflict do nothing;
--      select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000099","role":"authenticated"}',true);
--      insert into public.dog_daily_routines(id,dog_id,label) values
--        ('60000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000099','Midnight probe routine') on conflict do nothing;
--      insert into public.dog_daily_routine_days(id,dog_id,routine_id,date_key,time_zone) values
--        ('70000000-0000-4000-8000-000000000099','20000000-0000-4000-8000-000000000099',
--         '60000000-0000-4000-8000-000000000099',
--         (clock_timestamp() at time zone 'America/Los_Angeles')::date,'America/Los_Angeles') on conflict do nothing;
--      commit;
-- 2. In session A, start roughly 15 seconds before Los Angeles local midnight:
--      begin;
--      select id from public.dogs where id='20000000-0000-4000-8000-000000000099' for update;
--      do $$ declare z text := 'America/Los_Angeles'; t timestamptz := clock_timestamp(); m timestamptz;
--         begin m := (((t at time zone z)::date+1)::timestamp at time zone z);
--           if m-t > interval '15 minutes' then raise exception 'run close to local midnight'; end if;
--           perform pg_sleep(greatest(0::double precision,extract(epoch from (m-clock_timestamp()))-5));
--           perform pg_sleep(10);
--         end $$;
--      commit;
-- 3. In session B, while A is sleeping and before local midnight, run this block as owner A.
--    It captures today's date before the trigger waits, then asserts the stale write is rejected:
--      begin;
--      set local role authenticated;
--      select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000099","role":"authenticated"}',true);
--      do $$ declare z text := 'America/Los_Angeles'; d date := (clock_timestamp() at time zone z)::date;
--         begin
--           begin
--             update public.dog_daily_routine_days set completed_at=clock_timestamp()
--             where id='70000000-0000-4000-8000-000000000099' and date_key=d and completed_at is null;
--             raise exception 'stale completion crossed local midnight';
--           exception when invalid_parameter_value then
--             if sqlerrm <> 'Only today can be marked or undone' then raise; end if;
--           end;
--           if exists(select 1 from public.dog_daily_routine_days
--             where id='70000000-0000-4000-8000-000000000099' and completed_at is not null) then
--             raise exception 'stale completion changed the row';
--           end if;
--         end $$;
--      rollback;
-- 4. After both sessions finish, as postgres delete fixture dog then auth user. This probe has not run here.
rollback;
select 'R02-2 synthetic daily activity probes passed; all fixture changes rolled back' as result;

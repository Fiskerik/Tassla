-- Synthetic development probe after 202610300002. All fixtures roll back.
begin;
insert into auth.users(id,email) values
 ('95100000-0000-4000-8000-000000000001','training-a@example.invalid'),('95100000-0000-4000-8000-000000000002','training-b@example.invalid');
insert into public.breeds(id,name) values('active-selection-a','A'),('active-selection-b','B');
insert into public.dogs(id,name,breed_id,birth_date) values
 ('95200000-0000-4000-8000-000000000001','A','active-selection-a',current_date-70),
 ('95200000-0000-4000-8000-000000000002','Same owner','active-selection-a',current_date-70),
 ('95200000-0000-4000-8000-000000000003','B','active-selection-a',current_date-70);
insert into public.dog_memberships(dog_id,user_id) values
 ('95200000-0000-4000-8000-000000000001','95100000-0000-4000-8000-000000000001'),
 ('95200000-0000-4000-8000-000000000002','95100000-0000-4000-8000-000000000001'),
 ('95200000-0000-4000-8000-000000000003','95100000-0000-4000-8000-000000000002');
insert into public.content_items(id,slug,content_type) values
 ('95000000-0000-4000-8000-000000000001','active-selection-journey','training_program'),
 ('95000000-0000-4000-8000-000000000002','active-selection-legacy','training_program');
insert into public.content_versions(id,content_id,version,title,body,min_age_weeks,max_age_weeks,status,reviewed_at,review_reference,published_at) values
 ('95300000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001',1,'Journey','Synthetic',0,20,'draft',now(),'synthetic-only',now()),
 ('95300000-0000-4000-8000-000000000002','95000000-0000-4000-8000-000000000002',1,'Legacy','Synthetic',0,100,'draft',now(),'synthetic-only',now());
insert into public.content_breed_targets(content_version_id,breed_id) values('95300000-0000-4000-8000-000000000001','active-selection-a');
insert into public.training_steps(id,program_version_id,step_key,position,title,instruction) values
 ('95400000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','one',1,'One','Synthetic'),
 ('95400000-0000-4000-8000-000000000002','95300000-0000-4000-8000-000000000001','two',2,'Two','Synthetic'),
 ('95400000-0000-4000-8000-000000000003','95300000-0000-4000-8000-000000000001','three',3,'Three','Synthetic'),
 ('95400000-0000-4000-8000-000000000004','95300000-0000-4000-8000-000000000002','one',1,'Legacy one','Synthetic'),
 ('95400000-0000-4000-8000-000000000005','95300000-0000-4000-8000-000000000002','two',2,'Legacy two','Synthetic');
update public.content_versions set status='published' where id in ('95300000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000002');
insert into public.training_journeys(id,dog_id,program_version_id,active_step_id,state,last_operation_id) values
 ('95600000-0000-4000-8000-000000000001','95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000002','active',gen_random_uuid()),
 ('95600000-0000-4000-8000-000000000002','95200000-0000-4000-8000-000000000002','95300000-0000-4000-8000-000000000002','95400000-0000-4000-8000-000000000005','active',gen_random_uuid());
set local role authenticated;
set local request.jwt.claim.sub='95100000-0000-4000-8000-000000000001';

-- Admission assertions
do $$ declare v_before jsonb; v_bad record; begin
 select to_jsonb(j) into v_before from public.training_journeys j where j.id='95600000-0000-4000-8000-000000000001';
 insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
  values('95500000-0000-4000-8000-000000000001','95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000002',current_date,'UTC');
 for v_bad in select * from (values
  ('95300000-0000-4000-8000-000000000001'::uuid,'95400000-0000-4000-8000-000000000003'::uuid,current_date,'UTC','22023'),
  ('95300000-0000-4000-8000-000000000001'::uuid,'95400000-0000-4000-8000-000000000004'::uuid,current_date,'UTC','23503'),
  ('95300000-0000-4000-8000-000000000001'::uuid,'95400000-0000-4000-8000-000000000002'::uuid,current_date-1,'UTC','22023'),
  ('95300000-0000-4000-8000-000000000001'::uuid,'95400000-0000-4000-8000-000000000002'::uuid,current_date,'invalid-zone','22023'),
  ('95300000-0000-4000-8000-000000000002'::uuid,'95400000-0000-4000-8000-000000000005'::uuid,current_date,'UTC','22023')
 ) as t(version_id,step_id,day,zone,expected) loop
  begin
   insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
    values(gen_random_uuid(),'95200000-0000-4000-8000-000000000001',v_bad.version_id,v_bad.step_id,v_bad.day,v_bad.zone);
   raise exception 'Invalid selection accepted';
  exception when others then if sqlstate<>v_bad.expected then raise; end if; end;
 end loop;
 insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
  values(gen_random_uuid(),'95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000002','95400000-0000-4000-8000-000000000004',current_date,'UTC');
 if (select to_jsonb(j) from public.training_journeys j where j.id='95600000-0000-4000-8000-000000000001') is distinct from v_before
  or exists(select 1 from public.training_sessions) or exists(select 1 from public.training_milestones) or exists(select 1 from public.training_progress)
  then raise exception 'Selection mutated progression'; end if;
end $$;

reset role;
update public.training_journeys set state='paused' where id='95600000-0000-4000-8000-000000000001';
set local role authenticated;
-- An already-existing exact replay remains idempotent after pause.
insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
 values('95500000-0000-4000-8000-000000000001','95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000002',current_date,'UTC') on conflict do nothing;
do $$ begin
 begin
  insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
   values(gen_random_uuid(),'95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000002',current_date,'UTC');
  raise exception 'Paused new choice accepted';
 exception when invalid_parameter_value then null; end;
end $$;

reset role;
update public.training_journeys set state='maintenance', active_step_id='95400000-0000-4000-8000-000000000003' where id='95600000-0000-4000-8000-000000000001';
insert into public.training_progress(dog_id,program_version_id,step_id) values('95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000003');
update public.dogs set birth_date=current_date-700,breed_id='active-selection-b' where id='95200000-0000-4000-8000-000000000001';
insert into public.content_versions(id,content_id,version,title,body,min_age_weeks,max_age_weeks,status,reviewed_at,review_reference,published_at) values
 ('95300000-0000-4000-8000-000000000003','95000000-0000-4000-8000-000000000001',2,'New version','Synthetic',0,null,'published',now(),'synthetic-only',now());
set local role authenticated;
do $$ begin
 begin
  insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
   values(gen_random_uuid(),'95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000002',current_date,'UTC');
  raise exception 'Stale new choice accepted';
 exception when invalid_parameter_value then null; end;
end $$;
-- The saved current journey version remains usable outside starting age/breed and legacy completion.
insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
 values('95500000-0000-4000-8000-000000000003','95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000003',current_date,'UTC');

set local request.jwt.claim.sub='95100000-0000-4000-8000-000000000002';
do $$ begin
 if exists(select 1 from public.dog_daily_training_selections where dog_id='95200000-0000-4000-8000-000000000001') then raise exception 'Other owner read choices'; end if;
 begin
  insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
   values(gen_random_uuid(),'95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000003',current_date,'UTC');
  raise exception 'Other owner chose step';
 exception when insufficient_privilege then null; end;
end $$;

reset role;
update public.content_versions set status='withdrawn' where id='95300000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub='95100000-0000-4000-8000-000000000001';
insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
 values('95500000-0000-4000-8000-000000000003','95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000003',current_date,'UTC') on conflict do nothing;
do $$ begin
 begin
  insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone)
   values(gen_random_uuid(),'95200000-0000-4000-8000-000000000001','95300000-0000-4000-8000-000000000001','95400000-0000-4000-8000-000000000003',current_date,'UTC');
  raise exception 'Withdrawn new choice accepted';
 exception when invalid_parameter_value then null; end;
end $$;
reset role;
do $$ begin
 if (select count(*) from public.dog_daily_training_selections)<>3 then raise exception 'Denied choice changed row count'; end if;
 if has_function_privilege('authenticated','private.guard_daily_training_selection()','execute') or has_function_privilege('anon','private.guard_daily_training_selection()','execute')
  then raise exception 'Trigger execution granted'; end if;
end $$;
rollback;

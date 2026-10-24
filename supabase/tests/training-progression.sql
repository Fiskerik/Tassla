-- Synthetic persistence, ownership, idempotency and legacy-contract probes.
-- Run as postgres after foundation, daily-activities and training-progression migrations.
-- All fixture rows and deletes roll back at the end.
begin;

insert into auth.users(id,email) values
  ('11000000-0000-4000-8000-000000000001','progression-a@example.invalid'),
  ('11000000-0000-4000-8000-000000000002','progression-b@example.invalid');
insert into public.breeds(id,name) values ('progression-probe','Progression Probe') on conflict (id) do nothing;
insert into public.dogs(id,name,breed_id,birth_date) values
  ('21000000-0000-4000-8000-000000000001','Progression A','progression-probe',current_date-100),
  ('21000000-0000-4000-8000-000000000002','Progression B','progression-probe',current_date-110);
insert into public.dog_memberships(dog_id,user_id) values
  ('21000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001'),
  ('21000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000002');
insert into public.content_items(id,slug,content_type) values
  ('31000000-0000-4000-8000-000000000001','training-progression-probe','training_program');
insert into public.content_versions(id,content_id,version,title,body,min_age_weeks,status) values
  ('41000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001',1,'Progression v1','Synthetic only.',0,'draft'),
  ('41000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000001',2,'Progression v2','Synthetic only.',0,'draft');
insert into public.training_steps(id,program_version_id,step_key,position,title,instruction) values
  ('51000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','one',1,'Step one','Synthetic only.'),
  ('51000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000001','two',2,'Step two','Synthetic only.'),
  ('51000000-0000-4000-8000-000000000003','41000000-0000-4000-8000-000000000002','one',1,'Other version step','Synthetic only.');
update public.content_versions set status='published', reviewed_at=clock_timestamp(),
  review_reference='synthetic training-progression probe', published_at=clock_timestamp()
where id in ('41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002');
insert into public.training_progress(dog_id,program_version_id,step_id) values
  ('21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001');

do $$ begin
  if has_table_privilege('anon','public.training_journeys','SELECT')
    or has_table_privilege('anon','public.training_sessions','SELECT')
    or has_table_privilege('anon','public.training_milestones','SELECT')
    or has_table_privilege('anon','public.training_operation_receipts','SELECT') then
    raise exception 'anon can read training progression data';
  end if;
  if has_table_privilege('authenticated','public.training_journeys','INSERT')
    or has_table_privilege('authenticated','public.training_journeys','UPDATE')
    or has_table_privilege('authenticated','public.training_journeys','DELETE')
    or has_table_privilege('authenticated','public.training_sessions','INSERT')
    or has_table_privilege('authenticated','public.training_sessions','UPDATE')
    or has_table_privilege('authenticated','public.training_sessions','DELETE')
    or has_table_privilege('authenticated','public.training_milestones','INSERT')
    or has_table_privilege('authenticated','public.training_milestones','UPDATE')
    or has_table_privilege('authenticated','public.training_milestones','DELETE')
    or has_table_privilege('authenticated','public.training_operation_receipts','SELECT')
    or has_table_privilege('authenticated','public.training_operation_receipts','INSERT')
    or has_table_privilege('authenticated','public.training_operation_receipts','UPDATE')
    or has_table_privilege('authenticated','public.training_operation_receipts','DELETE') then
    raise exception 'authenticated has a direct write or receipt grant';
  end if;
  if not has_function_privilege('authenticated','public.apply_training_operation(uuid,uuid,uuid,text,uuid,text)','EXECUTE')
    or has_function_privilege('anon','public.apply_training_operation(uuid,uuid,uuid,text,uuid,text)','EXECUTE') then
    raise exception 'training RPC execute grants are incorrect';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$
declare
  started jsonb;
  started_again jsonb;
  session_result jsonb;
  session_replay jsonb;
  milestone_result jsonb;
  advanced jsonb;
  backed jsonb;
  paused jsonb;
  resumed jsonb;
  legacy_count integer;
begin
  select count(*) into legacy_count from public.training_progress
    where dog_id='21000000-0000-4000-8000-000000000001';

  started := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000001','start_or_resume',null,null);
  started_again := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000002','start_or_resume',null,null);
  if started->>'journey_id' is distinct from started_again->>'journey_id'
    or (select count(*) from public.training_journeys where dog_id='21000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'repeated start created a second journey';
  end if;
  if started->>'active_step_id' <> '51000000-0000-4000-8000-000000000001' then
    raise exception 'new journey did not begin at the first step';
  end if;

  session_result := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000003','record_session','51000000-0000-4000-8000-000000000001','practice_more');
  session_replay := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000003','record_session','51000000-0000-4000-8000-000000000001','practice_more');
  if session_result is distinct from session_replay
    or (select count(*) from public.training_sessions where dog_id='21000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'session retry was not idempotent';
  end if;
  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000003','record_session','51000000-0000-4000-8000-000000000001','worked_as_planned');
    raise exception 'operation ID accepted a changed payload';
  exception when invalid_parameter_value then null; end;

  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000004','confirm_step','51000000-0000-4000-8000-000000000002',null);
    raise exception 'confirmation accepted for a noncurrent step';
  exception when invalid_parameter_value then null; end;

  milestone_result := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000004','confirm_step','51000000-0000-4000-8000-000000000001',null);
  if (select count(*) from public.training_milestones where journey_id=(started->>'journey_id')::uuid) <> 1 then
    raise exception 'owner-confirmed milestone was not recorded';
  end if;
  advanced := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000005','next','51000000-0000-4000-8000-000000000001',null);
  if advanced->>'active_step_id' <> '51000000-0000-4000-8000-000000000002' then
    raise exception 'explicit next did not move to the next version-bound step';
  end if;
  backed := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000006','back','51000000-0000-4000-8000-000000000002',null);
  if backed->>'active_step_id' <> '51000000-0000-4000-8000-000000000001'
    or (select count(*) from public.training_milestones where journey_id=(started->>'journey_id')::uuid) <> 1 then
    raise exception 'back changed the explicit milestone';
  end if;
  paused := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000007','pause','51000000-0000-4000-8000-000000000001',null);
  if paused->>'state' <> 'paused' then raise exception 'pause state was not saved'; end if;
  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000008','record_session','51000000-0000-4000-8000-000000000001','paused_early');
    raise exception 'session was accepted while paused';
  exception when invalid_parameter_value then null; end;
  resumed := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000009','start_or_resume',null,null);
  if resumed->>'state' <> 'active' or resumed->>'active_step_id' <> '51000000-0000-4000-8000-000000000001' then
    raise exception 'resume did not preserve the exact saved step';
  end if;
  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000010','record_session','51000000-0000-4000-8000-000000000003','worked_as_planned');
    raise exception 'step from another program version was accepted';
  exception when invalid_parameter_value then null; end;

  if (select count(*) from public.training_progress where dog_id='21000000-0000-4000-8000-000000000001') <> legacy_count then
    raise exception 'new progression changed legacy training_progress';
  end if;
end $$;

select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ declare started jsonb; begin
  started := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002',
    '61000000-0000-4000-8000-000000000020','start_or_resume',null,null);
  perform public.apply_training_operation(
    '21000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002',
    '61000000-0000-4000-8000-000000000021','record_session','51000000-0000-4000-8000-000000000003','practice_more');
  perform public.apply_training_operation(
    '21000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002',
    '61000000-0000-4000-8000-000000000022','confirm_step','51000000-0000-4000-8000-000000000003',null);
end $$;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',true);

do $$ begin
  if not exists(select 1 from public.training_journeys where dog_id='21000000-0000-4000-8000-000000000001')
    or not exists(select 1 from public.training_sessions where dog_id='21000000-0000-4000-8000-000000000001')
    or not exists(select 1 from public.training_milestones where dog_id='21000000-0000-4000-8000-000000000001') then
    raise exception 'owner A could not read its own progression data';
  end if;
  if exists(select 1 from public.training_journeys where dog_id='21000000-0000-4000-8000-000000000002')
    or exists(select 1 from public.training_sessions where dog_id='21000000-0000-4000-8000-000000000002')
    or exists(select 1 from public.training_milestones where dog_id='21000000-0000-4000-8000-000000000002') then
    raise exception 'owner A saw another owner or rows leaked through RLS';
  end if;
  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002',
      '61000000-0000-4000-8000-000000000011','start_or_resume',null,null);
    raise exception 'owner A wrote another owner dog';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
update public.content_versions set status='withdrawn'
where id='41000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ declare replay jsonb; begin
  replay := public.apply_training_operation(
    '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000003','record_session','51000000-0000-4000-8000-000000000001','practice_more');
  if replay->>'operation_id' <> '61000000-0000-4000-8000-000000000003'
    or replay ? 'instructions' or replay ? 'content' then raise exception 'withdrawn-source replay returned more than the saved result'; end if;
  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000012','start_or_resume',null,null);
    raise exception 'new journey started for a withdrawn program';
  exception when invalid_parameter_value then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  begin
    perform public.apply_training_operation(
      '21000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000003','record_session','51000000-0000-4000-8000-000000000001','practice_more');
    raise exception 'another owner replayed a receipt';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
delete from public.dogs where id='21000000-0000-4000-8000-000000000002';
do $$ begin
  if exists(select 1 from public.training_journeys where dog_id='21000000-0000-4000-8000-000000000002')
    or exists(select 1 from public.training_sessions where dog_id='21000000-0000-4000-8000-000000000002')
    or exists(select 1 from public.training_milestones where dog_id='21000000-0000-4000-8000-000000000002')
    or exists(select 1 from public.training_operation_receipts where dog_id='21000000-0000-4000-8000-000000000002') then
    raise exception 'dog deletion did not cascade progression rows';
  end if;
end $$;
delete from auth.users where id='11000000-0000-4000-8000-000000000001';
do $$ begin
  if exists(select 1 from public.dogs where id='21000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_journeys where dog_id='21000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_sessions where dog_id='21000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_milestones where dog_id='21000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_operation_receipts where dog_id='21000000-0000-4000-8000-000000000001') then
    raise exception 'account deletion did not cascade progression rows';
  end if;
end $$;

rollback;

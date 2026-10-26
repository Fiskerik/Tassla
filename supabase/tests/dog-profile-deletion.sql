-- Synthetic owner-scoped dog deletion and stale-create replay probe.
-- Run as postgres after all migrations in a disposable development database.
-- Every row and setting is rolled back; this never uses a live account.
begin;

do $$
declare
  rpc_oid oid := 'public.delete_owned_dog_profile(uuid)'::regprocedure;
  rpc_owner text;
begin
  if not has_function_privilege('authenticated', rpc_oid, 'EXECUTE')
    or has_function_privilege('anon', rpc_oid, 'EXECUTE')
    or has_function_privilege('service_role', rpc_oid, 'EXECUTE') then
    raise exception 'dog deletion RPC EXECUTE must be authenticated-only';
  end if;
  if has_table_privilege('authenticated', 'public.dogs', 'DELETE')
    or has_table_privilege('authenticated', 'public.dog_memberships', 'DELETE') then
    raise exception 'authenticated must not have direct dog or membership DELETE';
  end if;
  select pg_catalog.pg_get_userbyid(p.proowner) into rpc_owner from pg_catalog.pg_proc p where p.oid = rpc_oid;
  if rpc_owner in ('authenticated', 'anon', 'public') then
    raise exception 'dog deletion SECURITY DEFINER is owned by an untrusted client role';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_proc p
    where p.oid = rpc_oid and p.prosecdef
      and 'search_path=""' = any(p.proconfig)
      and p.proargnames = array['requested_dog_id']::text[]
  ) then raise exception 'dog deletion RPC must be SECURITY DEFINER, empty-search-path, and accept no owner selector'; end if;
  if exists (
    select 1 from pg_catalog.pg_constraint c
    where c.contype = 'f' and c.confrelid = 'public.dogs'::regclass
      and c.conrelid <> 'private.dog_creation_requests'::regclass
      and c.confdeltype <> 'c'
  ) then raise exception 'a dog-owned foreign key does not cascade with its dog'; end if;
  if not exists (
    select 1 from pg_catalog.pg_constraint c
    where c.contype = 'f' and c.conrelid = 'private.dog_creation_requests'::regclass
      and c.confrelid = 'public.dogs'::regclass and c.confdeltype = 'n'
  ) then raise exception 'dog creation receipt must become a tombstone with ON DELETE SET NULL'; end if;
end;
$$;

insert into auth.users(id, email) values
  ('91000000-0000-4000-8000-000000000001','dog-delete-a@example.invalid'),
  ('91000000-0000-4000-8000-000000000002','dog-delete-b@example.invalid');
insert into public.breeds(id, name) values ('qa-dog-delete-breed','Synthetic dog deletion breed');
insert into public.kennels(id, name, distribution_code) values
  ('92000000-0000-4000-8000-000000000001','Synthetic deletion kennel','QA-DOG-DELETE');
insert into public.dogs(id, name, breed_id, birth_date) values
  ('93000000-0000-4000-8000-000000000001','Delete A1','qa-dog-delete-breed',current_date-60),
  ('93000000-0000-4000-8000-000000000002','Delete A2','qa-dog-delete-breed',current_date-80),
  ('93000000-0000-4000-8000-000000000003','Keep B','qa-dog-delete-breed',current_date-90);
insert into public.dog_memberships(dog_id,user_id) values
  ('93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000002');
insert into public.dog_attribution(dog_id,kennel_id) values
  ('93000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000003','92000000-0000-4000-8000-000000000001');
insert into private.dog_creation_requests(user_id,request_id,dog_id) values
  ('91000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001'),
  ('91000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000002');
insert into public.beta_metrics_consents(user_id,enabled) values
  ('91000000-0000-4000-8000-000000000001',true),
  ('91000000-0000-4000-8000-000000000002',true);
insert into public.product_events(id,user_id,event_type) values
  ('95000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','dog_created'),
  ('95000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002','dog_created');
insert into public.dog_events(id,dog_id,actor_id,event_type,occurred_on,description) values
  ('96000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','vaccination',current_date,'synthetic dog A1'),
  ('96000000-0000-4000-8000-000000000002','93000000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000002','vet_visit',current_date,'synthetic dog B');
insert into public.reminders(id,dog_id,title,due_on,enabled) values
  ('97000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Synthetic reminder',current_date+1,true);
insert into public.dog_health_plans(id,dog_id,event_type,due_on,description) values
  ('98000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','vaccination',current_date+1,'synthetic plan');

insert into public.content_items(id,slug,content_type) values
  ('99000000-0000-4000-8000-000000000001','synthetic-dog-deletion-program','training_program');
insert into public.content_versions(id,content_id,version,title,body,min_age_weeks,max_age_weeks) values
  ('9a000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000001',1,'Synthetic dog deletion','No advice.',0,null);
insert into public.training_steps(id,program_version_id,step_key,position,title,instruction) values
  ('9b000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','probe',1,'Synthetic step','No advice.');
update public.content_versions set status='published', reviewed_at=clock_timestamp(),
  review_reference='synthetic dog deletion probe', published_at=clock_timestamp()
where id='9a000000-0000-4000-8000-000000000001';
insert into public.training_progress(dog_id,program_version_id,step_id) values
  ('93000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001');
insert into public.dog_checklist_progress(dog_id,template_id,item_key) values
  ('93000000-0000-4000-8000-000000000001','review-v1:first-days','quiet-start');
insert into public.dog_checklist_custom_items(id,dog_id,template_id,title) values
  ('9c000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','review-v1:first-days','Synthetic custom item');
insert into public.dog_checklist_preferences(dog_id,context) values
  ('93000000-0000-4000-8000-000000000001','first_days');

select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.dog_daily_routines(id,dog_id,label) values
  ('9d000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Synthetic routine');
insert into public.dog_daily_routine_days(id,dog_id,routine_id,date_key,time_zone) values
  ('9e000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001',(clock_timestamp() at time zone 'UTC')::date,'UTC');
insert into public.dog_daily_routine_day_skips(day_id,dog_id,routine_id,date_key,time_zone,routine_label_snapshot,
  checklist_snapshot,completed_item_ids,is_recurring_occurrence,routine_revision_snapshot,routine_day_revision,last_state_mutation_id)
values ('9f000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001',
  (clock_timestamp() at time zone 'UTC')::date,'UTC','Synthetic routine','[{"id":"9d000000-0000-4000-8000-000000000001","label":"Synthetic routine"}]',
  '[]',false,1,2,'9f000000-0000-4000-8000-000000000002');
insert into public.dog_daily_training_selections(id,dog_id,program_version_id,step_id,date_key,time_zone) values
  ('9f000000-0000-4000-8000-000000000003','93000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001',
   '9b000000-0000-4000-8000-000000000001',(clock_timestamp() at time zone 'UTC')::date,'UTC');

insert into public.training_journeys(id,dog_id,program_version_id,active_step_id,last_operation_id) values
  ('a0000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001',
   '9b000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002');
insert into public.training_sessions(id,journey_id,dog_id,program_version_id,step_id,operation_id,feedback) values
  ('a1000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001',
   '9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','worked_as_planned');
insert into public.training_milestones(id,journey_id,dog_id,program_version_id,step_id,confirmation_operation_id) values
  ('a2000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001',
   '9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','a2000000-0000-4000-8000-000000000002');
insert into public.training_operation_receipts(user_id,dog_id,operation_id,request,result) values
  ('91000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','{}','{}');

do $$
declare
  result boolean;
  replacement_id uuid;
begin
  -- Anonymous, foreign-owner and unknown IDs have the same false result.
  perform pg_catalog.set_config('request.jwt.claims','{}',true);
  if public.delete_owned_dog_profile('93000000-0000-4000-8000-000000000001') then raise exception 'anonymous delete succeeded'; end if;
  perform pg_catalog.set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
  if public.delete_owned_dog_profile('93000000-0000-4000-8000-000000000003') then raise exception 'foreign dog delete succeeded'; end if;
  if public.delete_owned_dog_profile('93000000-0000-4000-8000-000000000099') then raise exception 'unknown dog delete succeeded'; end if;
  if not public.delete_owned_dog_profile('93000000-0000-4000-8000-000000000001') then raise exception 'owned dog delete was not confirmed'; end if;

  if exists(select 1 from public.dogs where id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_memberships where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_attribution where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_events where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.reminders where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_health_plans where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_progress where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_checklist_progress where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_checklist_custom_items where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_checklist_preferences where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_daily_routines where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_daily_routine_days where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_daily_routine_day_skips where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.dog_daily_training_selections where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_journeys where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_sessions where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_milestones where dog_id='93000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.training_operation_receipts where dog_id='93000000-0000-4000-8000-000000000001') then
    raise exception 'dog-owned child data remained after deletion';
  end if;
  if not exists(select 1 from private.dog_creation_requests where user_id=auth.uid()
    and request_id='94000000-0000-4000-8000-000000000001' and dog_id is null) then
    raise exception 'dog create receipt was not retained as a minimal tombstone';
  end if;

  begin
    perform public.create_dog_with_homecoming('Stale A1','qa-dog-delete-breed',current_date-60,null,
      '94000000-0000-4000-8000-000000000001',null,null);
    raise exception 'stale idempotency request recreated deleted dog A1';
  exception when sqlstate 'PT001' then
    if sqlerrm <> 'Dog creation request has been retired' then raise; end if;
  end;

  if not public.delete_owned_dog_profile('93000000-0000-4000-8000-000000000002') then raise exception 'last owned dog delete was not confirmed'; end if;
  if exists(select 1 from public.dog_memberships where user_id=auth.uid()) then raise exception 'last dog membership remains'; end if;
  if not exists(select 1 from auth.users where id=auth.uid()) then raise exception 'dog-only delete removed the account'; end if;
  if not exists(select 1 from public.beta_metrics_consents where user_id=auth.uid() and enabled)
    or not exists(select 1 from public.product_events where user_id=auth.uid()) then raise exception 'dog-only delete removed account-scoped data'; end if;

  begin
    perform public.create_dog('Stale A2','qa-dog-delete-breed',current_date-80,null);
    raise exception 'legacy fixed-ID create recreated deleted dog A2';
  exception when sqlstate 'PT001' then
    if sqlerrm <> 'Dog creation request has been retired' then raise; end if;
  end;

  replacement_id := public.create_dog_with_homecoming('Replacement A','qa-dog-delete-breed',current_date-40,null,
    '94000000-0000-4000-8000-000000000002',null,null);
  if not exists(select 1 from public.dogs where id=replacement_id and name='Replacement A') then
    raise exception 'fresh create request did not create a replacement dog';
  end if;
  if not exists(select 1 from auth.users where id='91000000-0000-4000-8000-000000000002')
    or not exists(select 1 from public.dogs where id='93000000-0000-4000-8000-000000000003' and name='Keep B')
    or not exists(select 1 from public.dog_events where id='96000000-0000-4000-8000-000000000002')
    or not exists(select 1 from public.beta_metrics_consents where user_id='91000000-0000-4000-8000-000000000002' and enabled)
    or not exists(select 1 from public.product_events where user_id='91000000-0000-4000-8000-000000000002') then
    raise exception 'dog A deletion changed owner B or account-level data';
  end if;

  -- Full account removal still clears the profile-free request tombstone.
  delete from auth.users where id='91000000-0000-4000-8000-000000000001';
  if exists(select 1 from private.dog_creation_requests where user_id='91000000-0000-4000-8000-000000000001') then
    raise exception 'full account deletion retained dog creation tombstones';
  end if;
end;
$$;

rollback;
select 'Dog profile deletion probe passed; synthetic data rolled back' as result;

-- Synthetic owner-cascade probe for a NEW Supabase development project only.
-- Run as postgres after the foundation, planned-health and reminder migrations.
-- No live account is used; every change, including the deliberate failure, rolls back.
begin;

insert into auth.users(id,email) values
  ('91000000-0000-4000-8000-000000000001','delete-a@example.invalid'),
  ('91000000-0000-4000-8000-000000000002','keep-b@example.invalid');
insert into public.breeds(id,name) values ('qa-delete-breed','Synthetic QA breed');
insert into public.kennels(id,name,distribution_code) values
  ('92000000-0000-4000-8000-000000000001','Synthetic QA kennel','QA-DELETE-ONLY');
insert into public.dogs(id,name,breed_id,birth_date) values
  ('93000000-0000-4000-8000-000000000001','Delete A','qa-delete-breed',current_date-60),
  ('93000000-0000-4000-8000-000000000002','Keep B','qa-delete-breed',current_date-70);
insert into public.dog_memberships(dog_id,user_id) values
  ('93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002');
insert into public.dog_attribution(dog_id,kennel_id) values
  ('93000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000002','92000000-0000-4000-8000-000000000001');
insert into public.dog_events(id,dog_id,actor_id,event_type,occurred_on,description) values
  ('94000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','vaccination',current_date,'synthetic A'),
  ('94000000-0000-4000-8000-000000000002','93000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002','vet_visit',current_date,'synthetic B');
insert into public.reminders(id,dog_id,title,due_on,enabled) values
  ('95000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','Synthetic A reminder',current_date+1,true),
  ('95000000-0000-4000-8000-000000000002','93000000-0000-4000-8000-000000000002','Synthetic B reminder',current_date+2,true);
insert into public.dog_health_plans(id,dog_id,event_type,due_on,description) values
  ('96000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','vaccination',current_date+1,'synthetic A plan'),
  ('96000000-0000-4000-8000-000000000002','93000000-0000-4000-8000-000000000002','vet_visit',current_date+2,'synthetic B plan');
insert into public.content_items(id,slug,content_type) values
  ('97000000-0000-4000-8000-000000000001','synthetic-account-deletion-program','training_program');
insert into public.content_versions(id,content_id,version,title,body) values
  ('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001',1,'Synthetic deletion probe','No advice.');
insert into public.training_steps(id,program_version_id,step_key,position,title,instruction) values
  ('99000000-0000-4000-8000-000000000001','98000000-0000-4000-8000-000000000001','qa-step',1,'Synthetic step','No advice.');
insert into public.training_progress(dog_id,program_version_id,step_id) values
  ('93000000-0000-4000-8000-000000000001','98000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000001'),
  ('93000000-0000-4000-8000-000000000002','98000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000001');
insert into public.product_events(id,user_id,event_type) values
  ('99100000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','dog_created'),
  ('99100000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000002','dog_created');

-- Fail after the normal owner-dog cleanup trigger has fired. PostgreSQL must roll back
-- the whole auth.users DELETE statement, including the first trigger's child deletes.
create function private.qa_abort_owner_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.id = '91000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'synthetic account deletion rollback probe';
  end if;
  return old;
end;
$$;
create trigger zz_qa_abort_owner_delete before delete on auth.users
for each row execute function private.qa_abort_owner_delete();
do $$ begin
  begin
    delete from auth.users where id='91000000-0000-4000-8000-000000000001';
    raise exception 'expected synthetic trigger failure';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'synthetic account deletion rollback probe' then raise; end if;
  end;
  if not exists(select 1 from auth.users where id='91000000-0000-4000-8000-000000000001') then raise exception 'failed delete was not rolled back'; end if;
  if not exists(select 1 from public.dogs where id='93000000-0000-4000-8000-000000000001') then raise exception 'owner dog cleanup escaped failed transaction'; end if;
  if not exists(select 1 from public.dog_health_plans where id='96000000-0000-4000-8000-000000000001') then raise exception 'planned-health cascade escaped failed transaction'; end if;
end $$;
drop trigger zz_qa_abort_owner_delete on auth.users;
drop function private.qa_abort_owner_delete();

delete from auth.users where id='91000000-0000-4000-8000-000000000001';
do $$ begin
  if exists(select 1 from auth.users where id='91000000-0000-4000-8000-000000000001') then raise exception 'owner A auth row remains'; end if;
  if exists(select 1 from public.dogs where id='93000000-0000-4000-8000-000000000001') then raise exception 'owner A dog remains'; end if;
  if exists(select 1 from public.dog_memberships where user_id='91000000-0000-4000-8000-000000000001') then raise exception 'owner A membership remains'; end if;
  if exists(select 1 from public.dog_attribution where dog_id='93000000-0000-4000-8000-000000000001') then raise exception 'owner A attribution remains'; end if;
  if exists(select 1 from public.dog_events where dog_id='93000000-0000-4000-8000-000000000001' or actor_id='91000000-0000-4000-8000-000000000001') then raise exception 'owner A event remains'; end if;
  if exists(select 1 from public.reminders where dog_id='93000000-0000-4000-8000-000000000001') then raise exception 'owner A reminder remains'; end if;
  if exists(select 1 from public.dog_health_plans where dog_id='93000000-0000-4000-8000-000000000001') then raise exception 'owner A health plan remains'; end if;
  if exists(select 1 from public.training_progress where dog_id='93000000-0000-4000-8000-000000000001') then raise exception 'owner A training progress remains'; end if;
  if exists(select 1 from public.product_events where user_id='91000000-0000-4000-8000-000000000001') then raise exception 'owner A product events remain'; end if;

  if not exists(select 1 from auth.users where id='91000000-0000-4000-8000-000000000002' and email='keep-b@example.invalid') then raise exception 'owner B auth row changed'; end if;
  if not exists(select 1 from public.dogs where id='93000000-0000-4000-8000-000000000002' and name='Keep B') then raise exception 'owner B dog changed'; end if;
  if not exists(select 1 from public.dog_memberships where dog_id='93000000-0000-4000-8000-000000000002' and user_id='91000000-0000-4000-8000-000000000002') then raise exception 'owner B membership changed'; end if;
  if not exists(select 1 from public.dog_attribution where dog_id='93000000-0000-4000-8000-000000000002') then raise exception 'owner B attribution changed'; end if;
  if not exists(select 1 from public.dog_events where id='94000000-0000-4000-8000-000000000002' and actor_id='91000000-0000-4000-8000-000000000002') then raise exception 'owner B event changed'; end if;
  if not exists(select 1 from public.reminders where id='95000000-0000-4000-8000-000000000002') then raise exception 'owner B reminder changed'; end if;
  if not exists(select 1 from public.dog_health_plans where id='96000000-0000-4000-8000-000000000002') then raise exception 'owner B health plan changed'; end if;
  if not exists(select 1 from public.training_progress where dog_id='93000000-0000-4000-8000-000000000002') then raise exception 'owner B training progress changed'; end if;
  if not exists(select 1 from public.product_events where user_id='91000000-0000-4000-8000-000000000002') then raise exception 'owner B product events changed'; end if;
end $$;

rollback;
select 'Account deletion cascade probe passed; synthetic data rolled back' as result;

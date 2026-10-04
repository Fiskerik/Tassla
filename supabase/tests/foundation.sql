-- Run separately AFTER the migration, only in a new development project.
-- All fixtures are synthetic and all test changes are rolled back.
begin;
insert into auth.users(id,email) values
('10000000-0000-4000-8000-000000000001','owner-a@example.invalid'),
('10000000-0000-4000-8000-000000000002','owner-b@example.invalid');
insert into public.content_items(id,slug,content_type) values
('20000000-0000-4000-8000-000000000001','test-published','training_program'),
('20000000-0000-4000-8000-000000000002','test-draft','article');
insert into public.content_versions(id,content_id,version,title,body) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',1,'Synthetic test','No advice'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',1,'Synthetic draft','No advice');
insert into public.training_steps(id,program_version_id,step_key,position,title,instruction) values
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','synthetic',1,'Synthetic step','No advice');
update public.content_versions set status='published', reviewed_at=now(), review_reference='SYNTHETIC TEST ONLY',published_at=now()
where id='30000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('test.dog_a',public.create_dog('Synthetic A','unknown',current_date-70)::text,true);
insert into public.dog_events(id,dog_id,event_type,occurred_at)
values('50000000-0000-4000-8000-000000000001',current_setting('test.dog_a')::uuid,'pee',now());
insert into public.reminders(dog_id,title,due_on) values(current_setting('test.dog_a')::uuid,'Synthetic reminder',current_date+1);
insert into public.training_progress(dog_id,program_version_id,step_id) values
(current_setting('test.dog_a')::uuid,'30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001');
do $$ begin
  if (select count(*) from public.dogs) <> 1 then raise exception 'Own dog not visible'; end if;
  if not exists(select 1 from public.content_items where id='20000000-0000-4000-8000-000000000001') then raise exception 'Published parent missing'; end if;
  if exists(select 1 from public.content_versions where id='30000000-0000-4000-8000-000000000002') then raise exception 'Draft leaked'; end if;
  begin
    insert into public.dog_events(id,dog_id,event_type,occurred_on) values
    ('50000000-0000-4000-8000-000000000009',current_setting('test.dog_a')::uuid,'weight',current_date);
    raise exception 'Missing weight accepted';
  exception when check_violation then null; end;
  begin
    insert into public.dog_memberships(dog_id,user_id) values(current_setting('test.dog_a')::uuid,auth.uid());
    raise exception 'Direct membership write accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.product_events(id,event_type) values(gen_random_uuid(),'home_viewed');
    raise exception 'Metrics enabled without mandate';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select set_config('test.dog_b',public.create_dog('Synthetic B','mixed',current_date-80)::text,true);
do $$ declare affected integer; begin
  if exists(select 1 from public.dogs where id=current_setting('test.dog_a')::uuid) then raise exception 'Other dog leaked'; end if;
  if exists(select 1 from public.dog_events where dog_id=current_setting('test.dog_a')::uuid) then raise exception 'Other log leaked'; end if;
  if exists(select 1 from public.reminders where dog_id=current_setting('test.dog_a')::uuid) then raise exception 'Other reminder leaked'; end if;
  if exists(select 1 from public.training_progress where dog_id=current_setting('test.dog_a')::uuid) then raise exception 'Other progression leaked'; end if;
  update public.dog_events set description='Unauthorized' where dog_id=current_setting('test.dog_a')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other event updated'; end if;
  delete from public.dog_events where dog_id=current_setting('test.dog_a')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other event deleted'; end if;
  begin
    insert into public.dog_events(id,dog_id,event_type,occurred_at) values(gen_random_uuid(),current_setting('test.dog_a')::uuid,'food',now());
    raise exception 'Cross-owner insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.dog_events(id,dog_id,actor_id,event_type,occurred_at) values
    (gen_random_uuid(),current_setting('test.dog_b')::uuid,'10000000-0000-4000-8000-000000000001','food',now());
    raise exception 'Forged actor accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.dog_events set dog_id=current_setting('test.dog_b')::uuid where id='50000000-0000-4000-8000-000000000001';
    raise exception 'Dog reassignment privilege accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.content_versions set status='published' where id='30000000-0000-4000-8000-000000000002';
    raise exception 'Client publication accepted';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
do $$ begin
  begin
    update public.content_items set content_type='article' where id='20000000-0000-4000-8000-000000000001';
    raise exception 'Content type changed despite existing versions';
  exception when check_violation then null; end;
  begin
    update public.content_versions set body='Edited' where id='30000000-0000-4000-8000-000000000001';
    raise exception 'Published body changed';
  exception when check_violation then null; end;
  begin
    update public.training_steps set instruction='Edited' where id='40000000-0000-4000-8000-000000000001';
    raise exception 'Published child changed';
  exception when check_violation then null; end;
  begin
    delete from public.training_steps where id='40000000-0000-4000-8000-000000000001';
    raise exception 'Published child deleted';
  exception when check_violation then null; end;
end $$;
-- Withdrawal hides steps; completion history remains attached to the original version.
update public.content_versions set status='withdrawn' where id='30000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
  if exists(select 1 from public.training_steps where id='40000000-0000-4000-8000-000000000001') then raise exception 'Withdrawn step leaked'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  if not exists(select 1 from public.training_progress where dog_id=current_setting('test.dog_a')::uuid) then raise exception 'Progression lost after withdrawal'; end if;
end $$;
reset role;
delete from auth.users where id='10000000-0000-4000-8000-000000000001';
do $$ begin
  if exists(select 1 from public.dogs where id=current_setting('test.dog_a')::uuid) then raise exception 'Orphaned owner dog'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  begin
    perform public.create_dog('Stale account','unknown',current_date-70);
    raise exception 'Deleted account recreated data';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
select set_config('request.jwt.claims','{}',true);
do $$ begin
  begin perform 1 from public.dogs; raise exception 'Anonymous dog access';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Foundation tests completed; synthetic data rolled back' as result;

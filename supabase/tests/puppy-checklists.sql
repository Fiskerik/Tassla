-- Run after the foundation and puppy-checklists migrations in a dev database.
-- Synthetic users only. This probe is transactional and rolls back its fixtures.
begin;
insert into auth.users(id, email) values
  ('10000000-0000-4000-8000-000000000001', 'checklist-owner-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'checklist-owner-b@example.invalid');
insert into public.breeds(id, name) values ('checklist-probe', 'Checklist Probe') on conflict (id) do nothing;

do $$
declare catalog_count integer; relation_name text;
begin
  select count(*) into catalog_count from public.checklist_template_items where template_id like 'review-v1:%';
  if catalog_count <> 18 then raise exception 'expected 18 review-v1 catalogue items, got %', catalog_count; end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.dog_checklist_progress'::regclass and contype = 'p') then raise exception 'progress tuple uniqueness missing'; end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.dog_checklist_custom_items'::regclass and conname = 'dog_checklist_custom_items_title_check') then raise exception 'custom title limit missing'; end if;
  if has_table_privilege('authenticated', 'public.checklist_templates', 'SELECT') or has_table_privilege('authenticated', 'public.checklist_template_items', 'SELECT') then raise exception 'catalogue is exposed through SQL'; end if;
  if has_table_privilege('authenticated', 'public.checklist_templates', 'INSERT') or has_table_privilege('authenticated', 'public.checklist_template_items', 'INSERT') then raise exception 'authenticated catalogue writes were granted'; end if;
  if has_table_privilege('authenticated', 'public.dog_checklist_progress', 'TRUNCATE') or has_table_privilege('authenticated', 'public.dog_checklist_custom_items', 'TRUNCATE') or has_table_privilege('authenticated', 'public.dog_checklist_preferences', 'TRUNCATE') then raise exception 'unexpected TRUNCATE privilege'; end if;
  if has_table_privilege('authenticated', 'public.dog_checklist_progress', 'REFERENCES') or has_table_privilege('authenticated', 'public.dog_checklist_custom_items', 'REFERENCES') or has_table_privilege('authenticated', 'public.dog_checklist_preferences', 'REFERENCES') then raise exception 'unexpected REFERENCES privilege'; end if;
  if not has_column_privilege('authenticated', 'public.dog_checklist_progress', 'dog_id', 'INSERT') or has_column_privilege('authenticated', 'public.dog_checklist_progress', 'dog_id', 'UPDATE') then raise exception 'progress column grants are too broad'; end if;
  if not has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'title', 'UPDATE') or has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'id', 'UPDATE') or has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'dog_id', 'UPDATE') or has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'template_id', 'UPDATE') then raise exception 'custom item column grants are too broad'; end if;
  if not has_column_privilege('authenticated', 'public.dog_checklist_preferences', 'context', 'UPDATE') or has_column_privilege('authenticated', 'public.dog_checklist_preferences', 'dog_id', 'UPDATE') then raise exception 'preference column grants are too broad'; end if;
  foreach relation_name in array array['public.checklist_templates','public.checklist_template_items','public.dog_checklist_progress','public.dog_checklist_custom_items','public.dog_checklist_preferences'] loop
    if has_table_privilege('authenticated', relation_name, 'TRUNCATE') or has_table_privilege('authenticated', relation_name, 'REFERENCES') then raise exception 'authenticated has an unexpected table privilege on %', relation_name; end if;
    if has_table_privilege('anon', relation_name, 'TRUNCATE') or has_table_privilege('anon', relation_name, 'REFERENCES') then raise exception 'anon has an unexpected table privilege on %', relation_name; end if;
  end loop;
  if has_table_privilege('anon', 'public.checklist_templates', 'SELECT') or has_table_privilege('anon', 'public.checklist_template_items', 'SELECT') then raise exception 'anon can read the private review catalogue'; end if;
  if has_table_privilege('authenticated', 'public.checklist_templates', 'UPDATE') or has_table_privilege('authenticated', 'public.checklist_template_items', 'DELETE') then raise exception 'authenticated can mutate the private review catalogue'; end if;
  if not exists (select 1 from pg_policies where tablename = 'dog_checklist_progress' and policyname = 'checklist_progress_owner' and qual like '%owns_dog%' and with_check like '%owns_dog%') then raise exception 'progress owner policy missing'; end if;
  if not exists (select 1 from pg_policies where tablename = 'dog_checklist_custom_items' and policyname = 'checklist_custom_owner' and qual like '%owns_dog%' and with_check like '%owns_dog%') then raise exception 'custom owner policy missing'; end if;
  if not exists (select 1 from pg_policies where tablename = 'dog_checklist_preferences' and policyname = 'checklist_preference_owner' and qual like '%owns_dog%' and with_check like '%owns_dog%') then raise exception 'preference owner policy missing'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('test.checklist_dog_a', public.create_dog('Checklist Probe A', 'checklist-probe', current_date - 80)::text, true);
insert into public.dog_checklist_progress(dog_id, template_id, item_key)
values (current_setting('test.checklist_dog_a')::uuid, 'review-v1:before-homecoming', 'safe-space');
insert into public.dog_checklist_custom_items(id, dog_id, template_id, title, completed)
values ('50000000-0000-4000-8000-000000000001', current_setting('test.checklist_dog_a')::uuid, 'review-v1:before-homecoming', 'Egen punkt', false);
insert into public.dog_checklist_preferences(dog_id, context)
values (current_setting('test.checklist_dog_a')::uuid, 'first_days');
do $$ begin
  if (select count(*) from public.dog_checklist_progress where dog_id=current_setting('test.checklist_dog_a')::uuid) <> 1 then raise exception 'owner cannot read own standard progress'; end if;
  update public.dog_checklist_custom_items set title='Ändrad punkt', completed=true where id='50000000-0000-4000-8000-000000000001';
  if not exists (select 1 from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000001' and title='Ändrad punkt' and completed) then raise exception 'owner cannot update own custom item'; end if;
  update public.dog_checklist_preferences set context='by_age' where dog_id=current_setting('test.checklist_dog_a')::uuid;
  if not exists (select 1 from public.dog_checklist_preferences where dog_id=current_setting('test.checklist_dog_a')::uuid and context='by_age') then raise exception 'owner cannot update own preference'; end if;
  delete from public.dog_checklist_progress where dog_id=current_setting('test.checklist_dog_a')::uuid and template_id='review-v1:before-homecoming' and item_key='safe-space';
  insert into public.dog_checklist_progress(dog_id,template_id,item_key) values (current_setting('test.checklist_dog_a')::uuid,'review-v1:before-homecoming','safe-space');
  delete from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000001';
  insert into public.dog_checklist_custom_items(id,dog_id,template_id,title,completed) values ('50000000-0000-4000-8000-000000000001',current_setting('test.checklist_dog_a')::uuid,'review-v1:before-homecoming','Ändrad punkt',true);
  begin
    update public.dog_checklist_custom_items set dog_id=gen_random_uuid() where id='50000000-0000-4000-8000-000000000001';
    raise exception 'owner changed immutable custom dog_id';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select set_config('test.checklist_dog_b', public.create_dog('Checklist Probe B', 'checklist-probe', current_date - 90)::text, true);
do $$ declare affected integer; begin
  if exists (select 1 from public.dog_checklist_progress where dog_id=current_setting('test.checklist_dog_a')::uuid) then raise exception 'other owner read standard progress'; end if;
  if exists (select 1 from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000001') then raise exception 'other owner read custom point'; end if;
  if exists (select 1 from public.dog_checklist_preferences where dog_id=current_setting('test.checklist_dog_a')::uuid) then raise exception 'other owner read preference'; end if;
  update public.dog_checklist_custom_items set completed=false where id='50000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'other owner updated custom point'; end if;
  delete from public.dog_checklist_progress where dog_id=current_setting('test.checklist_dog_a')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'other owner deleted standard progress'; end if;
  delete from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'other owner deleted custom point'; end if;
  update public.dog_checklist_preferences set context='by_age' where dog_id=current_setting('test.checklist_dog_a')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'other owner updated preference'; end if;
  begin
    insert into public.dog_checklist_progress(dog_id, template_id, item_key) values (current_setting('test.checklist_dog_a')::uuid, 'review-v1:before-homecoming', 'safe-space');
    raise exception 'other owner inserted progress for another dog';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.dog_checklist_custom_items(id,dog_id,template_id,title) values (gen_random_uuid(),current_setting('test.checklist_dog_a')::uuid,'review-v1:before-homecoming','Cross dog');
    raise exception 'other owner inserted custom point for another dog';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.dog_checklist_preferences(dog_id,context) values (current_setting('test.checklist_dog_a')::uuid,'by_age');
    raise exception 'other owner inserted preference for another dog';
  exception when insufficient_privilege then null; end;
end $$;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin perform 1 from public.dog_checklist_progress; raise exception 'anon read checklist progress'; exception when insufficient_privilege then null; end;
  begin insert into public.dog_checklist_preferences(dog_id,context) values (current_setting('test.checklist_dog_b')::uuid,'by_age'); raise exception 'anon inserted preference'; exception when insufficient_privilege then null; end;
  begin insert into public.dog_checklist_progress(dog_id,template_id,item_key) values (current_setting('test.checklist_dog_b')::uuid,'review-v1:before-homecoming','safe-space'); raise exception 'anon inserted progress'; exception when insufficient_privilege then null; end;
  begin insert into public.dog_checklist_custom_items(id,dog_id,template_id,title) values (gen_random_uuid(),current_setting('test.checklist_dog_b')::uuid,'review-v1:before-homecoming','Anon'); raise exception 'anon inserted custom point'; exception when insufficient_privilege then null; end;
  begin update public.dog_checklist_custom_items set title='Anon edit'; raise exception 'anon updated custom point'; exception when insufficient_privilege then null; end;
  begin update public.dog_checklist_progress set item_key='safe-space'; raise exception 'anon updated progress'; exception when insufficient_privilege then null; end;
  begin update public.dog_checklist_preferences set context='by_age'; raise exception 'anon updated preference'; exception when insufficient_privilege then null; end;
  begin delete from public.dog_checklist_custom_items; raise exception 'anon deleted custom point'; exception when insufficient_privilege then null; end;
  begin delete from public.dog_checklist_progress; raise exception 'anon deleted progress'; exception when insufficient_privilege then null; end;
  begin delete from public.dog_checklist_preferences; raise exception 'anon deleted preference'; exception when insufficient_privilege then null; end;
end $$;

reset role;
delete from auth.users where id='10000000-0000-4000-8000-000000000001';
do $$ begin
  if exists (select 1 from public.dogs where id=current_setting('test.checklist_dog_a')::uuid)
    or exists (select 1 from public.dog_checklist_progress where dog_id=current_setting('test.checklist_dog_a')::uuid)
    or exists (select 1 from public.dog_checklist_custom_items where dog_id=current_setting('test.checklist_dog_a')::uuid)
    or exists (select 1 from public.dog_checklist_preferences where dog_id=current_setting('test.checklist_dog_a')::uuid) then raise exception 'account deletion did not cascade checklist data'; end if;
end $$;
rollback;

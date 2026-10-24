-- Run after foundation.sql, puppy-checklists migration, and 202610230001.
-- Synthetic users only; this transactional probe rolls back all fixtures.
begin;
insert into auth.users(id, email) values
  ('10000000-0000-4000-8000-000000000011', 'checklist-icons-owner-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000012', 'checklist-icons-owner-b@example.invalid');
insert into public.breeds(id, name) values ('checklist-icons-probe', 'Checklist Icons Probe') on conflict (id) do nothing;

do $$ begin
  if not has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'icon', 'INSERT')
    or not has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'icon', 'UPDATE') then raise exception 'authenticated icon column grant missing'; end if;
  if has_column_privilege('anon', 'public.dog_checklist_custom_items', 'icon', 'INSERT')
    or has_column_privilege('anon', 'public.dog_checklist_custom_items', 'icon', 'UPDATE') then raise exception 'anon icon write grant is too broad'; end if;
  if has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'dog_id', 'UPDATE')
    or has_column_privilege('authenticated', 'public.dog_checklist_custom_items', 'template_id', 'UPDATE') then raise exception 'custom item update grants include identity columns'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.dog_checklist_custom_items'::regclass and conname='dog_checklist_custom_items_icon_check') then raise exception 'icon allowlist check missing'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000011","role":"authenticated"}', true);
select set_config('test.checklist_icon_dog_a', public.create_dog('Checklist Icon Probe A', 'checklist-icons-probe', current_date - 80)::text, true);

-- An older client omits icon on insert; the new column stays nullable.
insert into public.dog_checklist_custom_items(id,dog_id,template_id,title,completed)
values ('50000000-0000-4000-8000-000000000011',current_setting('test.checklist_icon_dog_a')::uuid,'review-v1:before-homecoming','Legacy point',false);
-- A newer client chooses an icon; an older update which omits icon must preserve it.
insert into public.dog_checklist_custom_items(id,dog_id,template_id,title,completed,icon)
values ('50000000-0000-4000-8000-000000000012',current_setting('test.checklist_icon_dog_a')::uuid,'review-v1:before-homecoming','Icon point',false,'water-outline');
update public.dog_checklist_custom_items set title='Legacy client edit', completed=true
where id='50000000-0000-4000-8000-000000000012';
do $$ begin
  if not exists (select 1 from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000011' and icon is null) then raise exception 'legacy nullable point failed'; end if;
  if not exists (select 1 from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000012' and title='Legacy client edit' and completed and icon='water-outline') then raise exception 'legacy update changed persisted icon'; end if;
  update public.dog_checklist_custom_items set icon='paw' where id='50000000-0000-4000-8000-000000000012';
  if not exists (select 1 from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000012' and icon='paw') then raise exception 'owner could not change icon'; end if;
  begin
    update public.dog_checklist_custom_items set icon='not-an-ionicon' where id='50000000-0000-4000-8000-000000000012';
    raise exception 'invalid icon value was accepted';
  exception when check_violation then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000012","role":"authenticated"}', true);
select set_config('test.checklist_icon_dog_b', public.create_dog('Checklist Icon Probe B', 'checklist-icons-probe', current_date - 90)::text, true);
do $$ declare affected integer; begin
  if exists (select 1 from public.dog_checklist_custom_items where id='50000000-0000-4000-8000-000000000012') then raise exception 'second owner read another dog icon'; end if;
  update public.dog_checklist_custom_items set icon='paw' where id='50000000-0000-4000-8000-000000000012';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'second owner changed another dog icon'; end if;
  begin
    insert into public.dog_checklist_custom_items(id,dog_id,template_id,title,icon)
    values ('50000000-0000-4000-8000-000000000013',current_setting('test.checklist_icon_dog_a')::uuid,'review-v1:before-homecoming','Foreign point','paw');
    raise exception 'second owner inserted an icon for another dog';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
delete from auth.users where id='10000000-0000-4000-8000-000000000011';
rollback;

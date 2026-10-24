-- Run after foundation.sql, puppy_checklists.sql, checklist custom icons,
-- and 202610240002_knowledge_catalog.sql. All fixture writes are rolled back.
begin;

do $$
declare
  privilege_name text;
  catalog_table_name text;
  role_name text;
  expected boolean;
  expected_mapping_count integer;
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.content_items'::regclass
      and conname = 'content_items_content_type_check'
      and pg_get_constraintdef(oid) like '%faq%'
  ) then raise exception 'FAQ content type is not allowed'; end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_versions' and column_name = 'context'
      and is_nullable = 'YES'
  ) then raise exception 'Content version context column is missing or not nullable'; end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.checklist_templates'::regclass
      and conname = 'checklist_templates_context_check'
  ) then raise exception 'Checklist template context check is missing'; end if;

  with expected(template_id, context, slug) as (
    values
      ('review-v1:before-homecoming', 'before_homecoming', 'phase-before-homecoming'),
      ('review-v1:first-days', 'first_days', 'phase-first-days'),
      ('review-v1:8-12-weeks', 'by_age', 'phase-8-12-weeks'),
      ('review-v1:3-6-months', 'by_age', 'phase-3-6-months'),
      ('review-v1:6-12-months', 'by_age', 'phase-6-12-months'),
      ('review-v1:over-1-year', 'by_age', 'phase-over-1-year')
  ), actual as (
    select t.id as template_id, t.context, i.slug
    from public.checklist_templates t
    join public.content_items i on i.id = t.content_item_id
  )
  select count(*) into expected_mapping_count
  from expected e
  join actual a using (template_id, context, slug);

  if expected_mapping_count <> 6
    or (select count(*) from public.checklist_templates where content_item_id is not null) <> 6
    or (select count(*) from public.content_items where slug in (
      'phase-before-homecoming', 'phase-first-days', 'phase-8-12-weeks',
      'phase-3-6-months', 'phase-6-12-months', 'phase-over-1-year'
    )) <> 6 then
    raise exception 'The six stable phase root mappings do not match the approved mapping';
  end if;

  if (select count(*) from public.content_version_checklist_items) <> 0
    or exists (
      select 1 from public.content_versions v
      join public.checklist_templates t on t.content_item_id = v.content_id
    ) then
    raise exception 'Migration unexpectedly created phase versions or child content';
  end if;

  with expected(template_id, item_key) as (
    values
      ('review-v1:before-homecoming', 'safe-space'),
      ('review-v1:before-homecoming', 'supplies'),
      ('review-v1:before-homecoming', 'vet-contact'),
      ('review-v1:first-days', 'quiet-start'),
      ('review-v1:first-days', 'routine'),
      ('review-v1:first-days', 'rest'),
      ('review-v1:8-12-weeks', 'name'),
      ('review-v1:8-12-weeks', 'handling'),
      ('review-v1:8-12-weeks', 'alone'),
      ('review-v1:3-6-months', 'recall'),
      ('review-v1:3-6-months', 'settle'),
      ('review-v1:3-6-months', 'walks'),
      ('review-v1:6-12-months', 'review'),
      ('review-v1:6-12-months', 'focus'),
      ('review-v1:6-12-months', 'breaks'),
      ('review-v1:over-1-year', 'enjoy'),
      ('review-v1:over-1-year', 'adapt'),
      ('review-v1:over-1-year', 'play')
  ), actual as (
    select template_id, item_key from public.checklist_template_items
  )
  select count(*) into expected_mapping_count
  from expected e join actual a using (template_id, item_key);

  if expected_mapping_count <> 18
    or (select count(*) from public.checklist_template_items) <> 18 then
    raise exception 'Stable checklist template keys changed';
  end if;

  if not exists (
    select 1
    from pg_index i
    join pg_class index_table on index_table.oid = i.indexrelid
    where i.indrelid = 'public.content_versions'::regclass
      and i.indisunique
      and index_table.relname = 'content_versions_one_published_per_item'
      and pg_get_expr(i.indpred, i.indrelid) ilike '%status%'
      and pg_get_expr(i.indpred, i.indrelid) ilike '%published%'
  ) then raise exception 'Published-version uniqueness index is missing'; end if;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.content_versions'::regclass
      and tgname = 'a_validate_content_version_context' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.content_versions'::regclass
      and tgname = 'b_protect_checklist_version_identity' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.content_versions'::regclass
      and tgname = 'c_validate_checklist_version_publish' and not tgisinternal
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.content_version_checklist_items'::regclass
      and tgname = 'protect_content_version_checklist_item' and not tgisinternal
  ) then raise exception 'Knowledge catalog integrity triggers are incomplete'; end if;

  if not (select relrowsecurity from pg_class where oid = 'public.checklist_templates'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.content_version_checklist_items'::regclass) then
    raise exception 'Published catalog tables must have RLS enabled';
  end if;

  foreach catalog_table_name in array array[
    'content_items',
    'content_versions',
    'checklist_templates',
    'checklist_template_items',
    'content_version_checklist_items'
  ] loop
    foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] loop
      foreach role_name in array array['anon', 'authenticated', 'service_role'] loop
        expected :=
          (role_name = 'authenticated' and privilege_name = 'SELECT'
            and catalog_table_name in ('content_items', 'content_versions', 'checklist_templates', 'content_version_checklist_items'))
          or (role_name = 'service_role'
            and catalog_table_name in ('content_items', 'content_versions'));

        if has_table_privilege(role_name, 'public.' || catalog_table_name, privilege_name) is distinct from expected then
          raise exception 'Unexpected % privilege for % on public.%', privilege_name, role_name, catalog_table_name;
        end if;
      end loop;
    end loop;
  end loop;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'checklist_templates'
      and policyname = 'checklist_template_published_mapping_read'
      and (qual not ilike '%published%' or qual not ilike '%content_item_id%')
  ) or not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'checklist_templates'
      and policyname = 'checklist_template_published_mapping_read'
  ) then raise exception 'Published-only template mapping RLS policy is missing'; end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'content_version_checklist_items'
      and policyname = 'content_version_checklist_items_published_read'
      and qual ilike '%published%'
  ) then raise exception 'Published-only checklist child RLS policy is missing'; end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dog_checklist_progress'::regclass and contype = 'p'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dog_checklist_progress'::regclass and contype = 'f'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dog_checklist_custom_items'::regclass
      and conname = 'dog_checklist_custom_items_icon_check'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dog_checklist_custom_items'
      and column_name = 'icon' and is_nullable = 'YES'
  ) then raise exception 'Existing progress/custom icon schema contract changed'; end if;
end;
$$;

insert into public.content_items(id, slug, content_type) values
  ('20000000-0000-4000-8000-000000000011', 'knowledge-test-faq', 'faq'),
  ('20000000-0000-4000-8000-000000000012', 'knowledge-test-article', 'article'),
  ('20000000-0000-4000-8000-000000000013', 'knowledge-test-unmapped-checklist', 'checklist');

insert into public.content_versions(id, content_id, version, title, body, context) values
  ('30000000-0000-4000-8000-000000000011',
    (select content_item_id from public.checklist_templates where id = 'review-v1:before-homecoming'),
    1, 'Synthetic phase', 'Synthetic only', 'before_homecoming'),
  ('30000000-0000-4000-8000-000000000012',
    '20000000-0000-4000-8000-000000000011',
    1, 'Synthetic FAQ', 'Synthetic only', 'first_days'),
  ('30000000-0000-4000-8000-000000000013',
    '20000000-0000-4000-8000-000000000012',
    1, 'Synthetic article', 'Synthetic only', null),
  ('30000000-0000-4000-8000-000000000014',
    '20000000-0000-4000-8000-000000000013',
    1, 'Synthetic unlinked checklist', 'Synthetic only', null),
  ('30000000-0000-4000-8000-000000000016',
    (select content_item_id from public.checklist_templates where id = 'review-v1:first-days'),
    1, 'Synthetic empty mapped phase', 'Synthetic only', 'first_days');

do $$ begin
  begin
    insert into public.content_versions(id, content_id, version, title, body)
    values ('30000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000011', 1, 'Missing FAQ context', 'Synthetic only');
    raise exception 'FAQ accepted a version with no context';
  exception when check_violation then null; end;

  begin
    insert into public.content_versions(id, content_id, version, title, body, context)
    values ('30000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000012', 1, 'Wrong article context', 'Synthetic only', 'by_age');
    raise exception 'Article accepted a catalog context';
  exception when check_violation then null; end;

  begin
    insert into public.content_versions(id, content_id, version, title, body, context)
    values (
      '30000000-0000-4000-8000-000000000023',
      (select content_item_id from public.checklist_templates where id = 'review-v1:before-homecoming'),
      2, 'Wrong phase context', 'Synthetic only', 'first_days'
    );
    raise exception 'Mapped checklist accepted a mismatched context';
  exception when check_violation then null; end;

  begin
    insert into public.content_versions(id, content_id, version, title, body, context)
    values ('30000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000013', 1, 'Unmapped checklist context', 'Synthetic only', 'by_age');
    raise exception 'Unmapped checklist accepted a catalog context';
  exception when check_violation then null; end;

  begin
    update public.checklist_templates set context = 'first_days'
    where id = 'review-v1:before-homecoming';
    raise exception 'Checklist template context changed';
  exception when check_violation then null; end;

  begin
    update public.checklist_templates
    set content_item_id = (select content_item_id from public.checklist_templates where id = 'review-v1:first-days')
    where id = 'review-v1:before-homecoming';
    raise exception 'Checklist template content mapping changed';
  exception when check_violation then null; end;

  begin
    update public.content_items set content_type = 'article'
    where slug = 'phase-over-1-year';
    raise exception 'Mapped checklist content type changed';
  exception when check_violation then null; end;
end $$;

insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
select
  '30000000-0000-4000-8000-000000000011',
  k.template_id,
  k.item_key,
  row_number() over (order by k.item_key)::integer,
  k.title
from public.checklist_template_items k
where k.template_id = 'review-v1:before-homecoming';

do $$ begin
  begin
    insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
    values ('30000000-0000-4000-8000-000000000011', 'review-v1:before-homecoming', 'not-a-stable-key', 4, 'Synthetic invalid key');
    raise exception 'Checklist child accepted an unknown key';
  exception when foreign_key_violation then null; end;

  begin
    insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
    values ('30000000-0000-4000-8000-000000000011', 'review-v1:first-days', 'rest', 4, 'Synthetic wrong template');
    raise exception 'Checklist child accepted another template identity';
  exception when check_violation then null; end;

  begin
    update public.content_versions
    set content_id = (select content_item_id from public.checklist_templates where id = 'review-v1:first-days'),
        context = 'first_days',
        version = 2
    where id = '30000000-0000-4000-8000-000000000011';
    raise exception 'Checklist version identity changed after children were inserted';
  exception when check_violation then null; end;

  begin
    update public.content_versions set status = 'published', reviewed_at = now(), review_reference = 'SYNTHETIC ONLY', published_at = now()
    where id = '30000000-0000-4000-8000-000000000016';
    raise exception 'Empty mapped checklist was published';
  exception when check_violation then null; end;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from public.checklist_templates where id = 'review-v1:before-homecoming') then
    raise exception 'Draft phase mapping leaked to authenticated';
  end if;
  if exists (select 1 from public.content_versions where id = '30000000-0000-4000-8000-000000000011') then
    raise exception 'Draft phase version leaked to authenticated';
  end if;
  if exists (select 1 from public.content_version_checklist_items where content_version_id = '30000000-0000-4000-8000-000000000011') then
    raise exception 'Draft checklist child rows leaked to authenticated';
  end if;
end $$;
reset role;

update public.content_versions
set status = 'reviewed', reviewed_at = now(), review_reference = 'SYNTHETIC ONLY'
where id = '30000000-0000-4000-8000-000000000011';

set local role authenticated;
do $$ begin
  if exists (select 1 from public.checklist_templates where id = 'review-v1:before-homecoming')
    or exists (select 1 from public.content_versions where id = '30000000-0000-4000-8000-000000000011') then
    raise exception 'Reviewed phase content leaked to authenticated';
  end if;
end $$;
reset role;

update public.content_versions
set status = 'published', published_at = now()
where id = '30000000-0000-4000-8000-000000000011';

set local role authenticated;
do $$ begin
  if (select count(*) from public.checklist_templates where id = 'review-v1:before-homecoming') <> 1
    or (select count(*) from public.checklist_templates) <> 1 then
    raise exception 'Only the mapping with a published version should be visible';
  end if;
  if (select count(*) from public.content_versions where id = '30000000-0000-4000-8000-000000000011') <> 1
    or (select count(*) from public.content_version_checklist_items where content_version_id = '30000000-0000-4000-8000-000000000011') <> 3 then
    raise exception 'Published phase version and children are not visible';
  end if;

  begin
    insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
    values ('30000000-0000-4000-8000-000000000011', 'review-v1:before-homecoming', 'safe-space', 4, 'Client write');
    raise exception 'Authenticated wrote checklist catalog content';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

update public.content_versions
set status = 'reviewed', reviewed_at = now(), review_reference = 'SYNTHETIC ONLY'
where id = '30000000-0000-4000-8000-000000000012';
update public.content_versions
set status = 'published', published_at = now()
where id = '30000000-0000-4000-8000-000000000012';

set local role authenticated;
do $$ begin
  if (select count(*) from public.content_items where slug = 'knowledge-test-faq') <> 1
    or (select count(*) from public.content_versions where id = '30000000-0000-4000-8000-000000000012') <> 1
    or exists (select 1 from public.content_items where slug = 'knowledge-test-article') then
    raise exception 'FAQ published-only content read did not follow status';
  end if;
end $$;
reset role;

update public.content_versions set status = 'withdrawn'
where id = '30000000-0000-4000-8000-000000000012';
set local role authenticated;
do $$ begin
  if exists (select 1 from public.content_items where slug = 'knowledge-test-faq')
    or exists (select 1 from public.content_versions where id = '30000000-0000-4000-8000-000000000012') then
    raise exception 'Withdrawn FAQ remained visible to authenticated';
  end if;
end $$;
reset role;

insert into public.content_versions(id, content_id, version, title, body, context)
values (
  '30000000-0000-4000-8000-000000000015',
  (select content_item_id from public.checklist_templates where id = 'review-v1:before-homecoming'),
  2, 'Synthetic second phase', 'Synthetic only', 'before_homecoming'
);
insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
select
  '30000000-0000-4000-8000-000000000015',
  k.template_id,
  k.item_key,
  row_number() over (order by k.item_key)::integer,
  k.title
from public.checklist_template_items k
where k.template_id = 'review-v1:before-homecoming';
do $$ begin
  begin
    update public.content_versions
    set status = 'published', reviewed_at = now(), review_reference = 'SYNTHETIC ONLY', published_at = now()
    where id = '30000000-0000-4000-8000-000000000015';
    raise exception 'A second published version for one item was accepted';
  exception when unique_violation then null; end;
end $$;

do $$ begin
  begin
    update public.content_version_checklist_items set title = 'Changed after publish'
    where content_version_id = '30000000-0000-4000-8000-000000000011' and item_key = 'safe-space';
    raise exception 'Published checklist child was edited';
  exception when check_violation then null; end;

  begin
    delete from public.content_version_checklist_items
    where content_version_id = '30000000-0000-4000-8000-000000000011' and item_key = 'safe-space';
    raise exception 'Published checklist child was deleted';
  exception when check_violation then null; end;

  update public.content_versions set status = 'withdrawn'
  where id = '30000000-0000-4000-8000-000000000011';
end $$;

set local role authenticated;
do $$ begin
  if exists (select 1 from public.checklist_templates where id = 'review-v1:before-homecoming')
    or exists (select 1 from public.content_versions where id = '30000000-0000-4000-8000-000000000011')
    or exists (select 1 from public.content_version_checklist_items where content_version_id = '30000000-0000-4000-8000-000000000011') then
    raise exception 'Withdrawn phase content remained visible to authenticated';
  end if;
end $$;
reset role;

rollback;

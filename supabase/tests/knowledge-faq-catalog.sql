-- Disposable PostgreSQL probe after the import script has run twice and the
-- separate publish script has run twice. This file always rolls back its fixture.
-- It does not connect to or target live Supabase.
begin;

create temporary table faq_probe_owner_counts on commit drop as
select
  (select count(*) from public.dog_checklist_progress) as progress_count,
  (select count(*) from public.dog_checklist_custom_items) as custom_count,
  (select count(*) from public.dog_checklist_preferences) as preference_count;

do $catalog_checks$
begin
  if (select count(*) from public.content_items where content_type = 'faq'
    and id in (
      '66000000-0000-4000-8000-000000000001'::uuid,
      '66000000-0000-4000-8000-000000000002'::uuid,
      '66000000-0000-4000-8000-000000000003'::uuid,
      '66000000-0000-4000-8000-000000000004'::uuid
    )) <> 4 then
    raise exception 'FAQ catalog must have exactly four stable FAQ roots';
  end if;
  if (select count(*) from public.content_versions where id in (
      '67000000-0000-4000-8000-000000000001'::uuid,
      '67000000-0000-4000-8000-000000000002'::uuid,
      '67000000-0000-4000-8000-000000000003'::uuid,
      '67000000-0000-4000-8000-000000000004'::uuid
    ) and status = 'published' and is_ai_generated is true and context is not null and published_at is not null) <> 4 then
    raise exception 'FAQ catalog must contain exactly four AI-marked published versions';
  end if;
end;
$catalog_checks$;

-- A synthetic draft under a FAQ root must stay hidden from the application role.
insert into public.content_versions(
  id, content_id, version, title, body, min_age_weeks, max_age_weeks, context, status, is_ai_generated
)
values (
  '67000000-0000-4000-8000-000000000099'::uuid,
  '66000000-0000-4000-8000-000000000001'::uuid,
  99, 'Synthetic hidden draft', 'Probe-only content', 0, null, 'first_days', 'draft', true
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
do $published_only$
begin
  if (select count(*) from public.content_versions v
      join public.content_items i on i.id = v.content_id
      where i.content_type = 'faq' and v.status = 'published') <> 4 then
    raise exception 'Authenticated role must see exactly four published FAQ versions';
  end if;
  if exists (select 1 from public.content_versions where id = '67000000-0000-4000-8000-000000000099'::uuid) then
    raise exception 'Authenticated role can see a synthetic draft FAQ version';
  end if;
end;
$published_only$;

reset role;
do $owner_data_unchanged$
begin
  if (select count(*) from public.dog_checklist_progress) <> (select progress_count from pg_temp.faq_probe_owner_counts)
    or (select count(*) from public.dog_checklist_custom_items) <> (select custom_count from pg_temp.faq_probe_owner_counts)
    or (select count(*) from public.dog_checklist_preferences) <> (select preference_count from pg_temp.faq_probe_owner_counts) then
    raise exception 'FAQ catalog probe changed dog-owned checklist data';
  end if;
end;
$owner_data_unchanged$;

rollback;

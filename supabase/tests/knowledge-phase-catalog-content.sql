-- Verification probe for a disposable PostgreSQL database after both Knowledge scripts.
-- Writes one synthetic draft version/child, checks authenticated published-only visibility,
-- verifies owner data counts are unchanged and rolls all fixture writes back.
begin;

create temporary table knowledge_probe_owner_counts on commit drop as
select
  (select count(*) from public.dog_checklist_progress) as progress_count,
  (select count(*) from public.dog_checklist_custom_items) as custom_count,
  (select count(*) from public.dog_checklist_preferences) as preference_count;

insert into public.content_versions(
  id, content_id, version, title, body, min_age_weeks, max_age_weeks, context, status, is_ai_generated
)
select '65000000-0000-4000-8000-000000000099'::uuid, t.content_item_id, 99,
  'Synthetic hidden draft', 'Probe fixture only', 0, 7, 'before_homecoming', 'draft', true
from public.checklist_templates t where t.id = 'review-v1:before-homecoming';
insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
values ('65000000-0000-4000-8000-000000000099', 'review-v1:before-homecoming', 'safe-space', 1, 'Synthetic hidden child');

do $owner_checks$
begin
  if (select count(*) from public.checklist_templates) <> 6 then
    raise exception 'Owner session cannot see the complete six-phase checklist mapping';
  end if;
  if (select count(*) from public.content_versions v join public.checklist_templates t on t.content_item_id = v.content_id where v.status = 'published') <> 6 then
    raise exception 'Owner session does not have six published phase versions';
  end if;
  if (select count(*) from public.content_version_checklist_items c join public.content_versions v on v.id = c.content_version_id where v.status = 'published') <> 18 then
    raise exception 'Owner session does not have 18 published phase items';
  end if;
  if (select count(*) from public.dog_checklist_progress) <> (select progress_count from pg_temp.knowledge_probe_owner_counts)
    or (select count(*) from public.dog_checklist_custom_items) <> (select custom_count from pg_temp.knowledge_probe_owner_counts)
    or (select count(*) from public.dog_checklist_preferences) <> (select preference_count from pg_temp.knowledge_probe_owner_counts) then
    raise exception 'Knowledge catalog probe changed existing owner checklist data';
  end if;
end;
$owner_checks$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $published_only$
begin
  if (select count(*) from public.checklist_templates) <> 6 then
    raise exception 'Authenticated role cannot read the six published checklist mappings';
  end if;
  if (select count(*) from public.content_versions v join public.checklist_templates t on t.content_item_id = v.content_id where v.status = 'published') <> 6 then
    raise exception 'Authenticated role cannot read exactly the six published phase versions';
  end if;
  if exists (select 1 from public.content_versions where id = '65000000-0000-4000-8000-000000000099') then
    raise exception 'Authenticated role can read the synthetic draft phase version';
  end if;
  if (select count(*) from public.content_version_checklist_items) <> 18 then
    raise exception 'Authenticated role cannot read exactly the published phase children';
  end if;
  if exists (select 1 from public.content_version_checklist_items where content_version_id = '65000000-0000-4000-8000-000000000099') then
    raise exception 'Authenticated role can read the synthetic draft phase child';
  end if;
end;
$published_only$;

rollback;

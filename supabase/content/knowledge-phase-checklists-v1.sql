-- Reviewed, unpublished phase checklist catalog v1.
-- Generated from docs/content/knowledge-phase-checklists-v1.json.
-- Import only after the approved Knowledge catalog and AI-origin migrations.
-- This script does not publish content and does not touch dog-owned progress.
-- Run only in an explicitly approved development database as postgres/supabase_admin.
-- Before execution, run `python -X utf8 tools/validate_knowledge_catalog.py`; SQL does not recompute the JSON digest.
begin;

do $trusted_import$
begin
  if current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Knowledge checklist import requires a trusted database owner/admin session';
  end if;
  if nullif(current_setting('request.jwt.claim.role', true), '') is not null then
    raise exception 'Knowledge checklist import cannot run under an application JWT role';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('tassla.knowledge.phase-checklists.v1', 0));
end;
$trusted_import$;

create temporary table knowledge_phase_bundle on commit drop as
select * from jsonb_to_recordset($phase_catalog$[{"template_id":"review-v1:before-homecoming","slug":"phase-before-homecoming","context":"before_homecoming","version_id":"64000000-0000-4000-8000-000000000001","version":1,"title":"Inför hemkomsten","body":"Förbered det som kan göra starten lugn och trygg.","min_age_weeks":0,"max_age_weeks":7,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare","https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment"],"items":[{"key":"safe-space","position":1,"title":"Ordna en lugn, ostörd viloplats."},{"key":"supplies","position":2,"title":"Plocka undan sådant som kan skada hunden."},{"key":"vet-contact","position":3,"title":"Ta reda på närmaste veterinär."}]},{"template_id":"review-v1:first-days","slug":"phase-first-days","context":"first_days","version_id":"64000000-0000-4000-8000-000000000002","version":1,"title":"Första dagarna hemma","body":"Låt hunden landa i sin egen takt.","min_age_weeks":0,"max_age_weeks":null,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment","https://www.dogstrust.org.uk/dog-advice/training/home/create-routine"],"items":[{"key":"quiet-start","position":1,"title":"Ge hunden tid att landa i en lugn miljö med ostörd vila."},{"key":"routine","position":2,"title":"Börja med en enkel vardagsrutin som passar hunden."},{"key":"rest","position":3,"title":"Låt hunden vila ostört på en lugn plats."}]},{"template_id":"review-v1:8-12-weeks","slug":"phase-8-12-weeks","context":"by_age","version_id":"64000000-0000-4000-8000-000000000003","version":1,"title":"8–12 veckor","body":"I läget Efter ålder väljs en lista utifrån hundens ålder. Punkterna är förslag, inte mål.","min_age_weeks":8,"max_age_weeks":12,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare","https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/leftalone","https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf","https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf"],"items":[{"key":"name","position":1,"title":"Om ni vill öva på namnet: belöna när hunden söker kontakt."},{"key":"handling","position":2,"title":"Låt valpen vänja sig vid hantering gradvis. Pausa och gör nästa steg lättare vid tecken på obehag."},{"key":"alone","position":3,"title":"Börja med mycket korta stunder. Öka bara när hunden verkar lugn; korta stunden och backa vid tecken på oro."}]},{"template_id":"review-v1:3-6-months","slug":"phase-3-6-months","context":"by_age","version_id":"64000000-0000-4000-8000-000000000004","version":1,"title":"3–6 månader","body":"I läget Efter ålder väljs en lista utifrån hundens ålder. Punkterna är förslag, inte mål.","min_age_weeks":13,"max_age_weeks":25,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/come","https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf","https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf"],"items":[{"key":"recall","position":1,"title":"Om ni vill öva inkallning: börja på en inhägnad plats eller i långlina. Belöna när hunden kommer och öka avståndet stegvis."},{"key":"settle","position":2,"title":"Belöna när hunden själv kommer till ro; undvik att tvinga fram stillhet."},{"key":"walks","position":3,"title":"Låt hunden utforska trygga miljöer i sin takt. Öka avståndet till sådant som oroar hunden, eller avsluta mötet vid tecken på rädsla eller överstimulering."}]},{"template_id":"review-v1:6-12-months","slug":"phase-6-12-months","context":"by_age","version_id":"64000000-0000-4000-8000-000000000005","version":1,"title":"6–12 månader","body":"I läget Efter ålder väljs en lista utifrån hundens ålder. Punkterna är förslag, inte mål.","min_age_weeks":26,"max_age_weeks":51,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare","https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf"],"items":[{"key":"review","position":1,"title":"Belöna önskade beteenden."},{"key":"focus","position":2,"title":"Öva korta kontaktövningar i lugn miljö och belöna frivillig kontakt."},{"key":"breaks","position":3,"title":"Planera in pauser under aktivitet."}]},{"template_id":"review-v1:over-1-year","slug":"phase-over-1-year","context":"by_age","version_id":"64000000-0000-4000-8000-000000000006","version":1,"title":"Över ett år","body":"I läget Efter ålder väljs en lista utifrån hundens ålder. Punkterna är förslag, inte mål.","min_age_weeks":52,"max_age_weeks":null,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/leftalone","https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf"],"items":[{"key":"enjoy","position":1,"title":"Om ni vill, välj en vardagsfärdighet att öva med belöningsbaserade metoder."},{"key":"adapt","position":2,"title":"Vid ensamhetsträning: anpassa tiden efter hundens reaktion och backa ett steg vid tecken på oro."},{"key":"play","position":3,"title":"Avsluta gärna träningen med en belöning som hunden uppskattar."}]}]$phase_catalog$::jsonb) as row(template_id text, slug text, context text, version_id uuid, version integer, title text, body text, min_age_weeks integer, max_age_weeks integer, sources text[], items jsonb);

-- This static payload is checked against the reviewed JSON by validate_knowledge_catalog.py before execution.
-- reviewed payload SHA-256: 3835d86531ea3ecd7450bdb982e4c2b0cead2be55e0b6ad54434125f9a61e7a8

do $validate_bundle$
declare
  root_count integer;
  distinct_template_count integer;
  distinct_version_count integer;
  item_count integer;
  distinct_item_count integer;
begin
  select count(*), count(distinct template_id), count(distinct version_id)
  into root_count, distinct_template_count, distinct_version_count
  from pg_temp.knowledge_phase_bundle;
  if root_count <> 6 or distinct_template_count <> 6 or distinct_version_count <> 6 then
    raise exception 'Knowledge checklist import stopped: bundle must contain six distinct phase and version IDs';
  end if;
  if exists (
    (select template_id, slug, context, version_id, version from (values
      ('review-v1:before-homecoming', 'phase-before-homecoming', 'before_homecoming', '64000000-0000-4000-8000-000000000001'::uuid, 1),
      ('review-v1:first-days', 'phase-first-days', 'first_days', '64000000-0000-4000-8000-000000000002'::uuid, 1),
      ('review-v1:8-12-weeks', 'phase-8-12-weeks', 'by_age', '64000000-0000-4000-8000-000000000003'::uuid, 1),
      ('review-v1:3-6-months', 'phase-3-6-months', 'by_age', '64000000-0000-4000-8000-000000000004'::uuid, 1),
      ('review-v1:6-12-months', 'phase-6-12-months', 'by_age', '64000000-0000-4000-8000-000000000005'::uuid, 1),
      ('review-v1:over-1-year', 'phase-over-1-year', 'by_age', '64000000-0000-4000-8000-000000000006'::uuid, 1)
    ) expected(template_id, slug, context, version_id, version)
    except select template_id, slug, context, version_id, version from pg_temp.knowledge_phase_bundle)
    union all
    (select template_id, slug, context, version_id, version from pg_temp.knowledge_phase_bundle
     except select template_id, slug, context, version_id, version from (values
      ('review-v1:before-homecoming', 'phase-before-homecoming', 'before_homecoming', '64000000-0000-4000-8000-000000000001'::uuid, 1),
      ('review-v1:first-days', 'phase-first-days', 'first_days', '64000000-0000-4000-8000-000000000002'::uuid, 1),
      ('review-v1:8-12-weeks', 'phase-8-12-weeks', 'by_age', '64000000-0000-4000-8000-000000000003'::uuid, 1),
      ('review-v1:3-6-months', 'phase-3-6-months', 'by_age', '64000000-0000-4000-8000-000000000004'::uuid, 1),
      ('review-v1:6-12-months', 'phase-6-12-months', 'by_age', '64000000-0000-4000-8000-000000000005'::uuid, 1),
      ('review-v1:over-1-year', 'phase-over-1-year', 'by_age', '64000000-0000-4000-8000-000000000006'::uuid, 1)
    ) expected(template_id, slug, context, version_id, version))
  ) then
    raise exception 'Knowledge checklist import stopped: bundle phase identities differ from the reviewed six';
  end if;
  select count(*), count(distinct (b.template_id, item.key))
  into item_count, distinct_item_count
  from pg_temp.knowledge_phase_bundle b
  cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text);
  if item_count <> 18 or distinct_item_count <> 18
    or exists (
      select template_id, item_key from public.checklist_template_items
      where template_id in ('review-v1:before-homecoming', 'review-v1:first-days', 'review-v1:8-12-weeks', 'review-v1:3-6-months', 'review-v1:6-12-months', 'review-v1:over-1-year')
      except
      select b.template_id, item.key from pg_temp.knowledge_phase_bundle b
      cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
    ) or exists (
      select b.template_id, item.key from pg_temp.knowledge_phase_bundle b
      cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
      except
      select template_id, item_key from public.checklist_template_items
      where template_id in ('review-v1:before-homecoming', 'review-v1:first-days', 'review-v1:8-12-weeks', 'review-v1:3-6-months', 'review-v1:6-12-months', 'review-v1:over-1-year')
    ) or exists (
      select 1 from pg_temp.knowledge_phase_bundle b
      cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
      group by b.template_id having count(*) <> 3 or count(distinct item.position) <> 3
        or min(item.position) <> 1 or max(item.position) <> 3
    ) then
    raise exception 'Knowledge checklist import stopped: bundle must contain the exact eighteen stable keys and positions';
  end if;
end;
$validate_bundle$;

do $verify_roots$
declare root_count integer;
begin
  with mapped as (
  select b.*, t.content_item_id
  from pg_temp.knowledge_phase_bundle b
  join public.checklist_templates t on t.id = b.template_id and t.context = b.context
  join public.content_items i on i.id = t.content_item_id and i.slug = b.slug and i.content_type = 'checklist'
)
  select count(*) into root_count from mapped;
  if root_count <> 6 or (select count(*) from public.checklist_templates where content_item_id is not null) <> 6 then
    raise exception 'Knowledge checklist import stopped: all six exact stable roots must exist';
  end if;
  if exists (
    select 1 from public.content_versions v
    join public.checklist_templates t on t.content_item_id = v.content_id
    where t.id in ('review-v1:before-homecoming',
      'review-v1:first-days',
      'review-v1:8-12-weeks',
      'review-v1:3-6-months',
      'review-v1:6-12-months',
      'review-v1:over-1-year')
      and (v.version <> 1 or v.id not in ('64000000-0000-4000-8000-000000000001'::uuid,
      '64000000-0000-4000-8000-000000000002'::uuid,
      '64000000-0000-4000-8000-000000000003'::uuid,
      '64000000-0000-4000-8000-000000000004'::uuid,
      '64000000-0000-4000-8000-000000000005'::uuid,
      '64000000-0000-4000-8000-000000000006'::uuid))
  ) then
    raise exception 'Knowledge checklist import stopped: unexpected versions already exist for the six roots';
  end if;
end;
$verify_roots$;

with mapped as (
  select b.*, t.content_item_id
  from pg_temp.knowledge_phase_bundle b
  join public.checklist_templates t on t.id = b.template_id and t.context = b.context
  join public.content_items i on i.id = t.content_item_id and i.slug = b.slug and i.content_type = 'checklist'
)
insert into public.content_versions(
  id, content_id, version, title, body, min_age_weeks, max_age_weeks, context,
  status, is_ai_generated, reviewed_at, review_reference, sources
)
select version_id, content_item_id, version, title, body, min_age_weeks, max_age_weeks, context,
  'reviewed', true, '2026-10-26T00:00:00Z'::timestamptz, 'docs/content/knowledge-phase-checklists-review-v1.md#payload-sha256=3835d86531ea3ecd7450bdb982e4c2b0cead2be55e0b6ad54434125f9a61e7a8', sources
from mapped
on conflict (id) do nothing;

insert into public.content_version_checklist_items(content_version_id, template_id, item_key, position, title)
select b.version_id, b.template_id, item.key, item.position, item.title
from pg_temp.knowledge_phase_bundle b
cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
on conflict (content_version_id, item_key) do nothing;

do $verify_import$
declare
  matching_versions integer;
  matching_items integer;
  actual_items integer;
begin
  with mapped as (
  select b.*, t.content_item_id
  from pg_temp.knowledge_phase_bundle b
  join public.checklist_templates t on t.id = b.template_id and t.context = b.context
  join public.content_items i on i.id = t.content_item_id and i.slug = b.slug and i.content_type = 'checklist'
)
  select count(*) into matching_versions
  from mapped b join public.content_versions v on v.id = b.version_id
  where v.content_id = b.content_item_id and v.version = b.version and v.title = b.title
    and v.body = b.body and v.min_age_weeks = b.min_age_weeks
    and v.max_age_weeks is not distinct from b.max_age_weeks and v.context = b.context
    and v.status = 'reviewed' and v.is_ai_generated is true
    and v.reviewed_at = '2026-10-26T00:00:00Z'::timestamptz
    and v.review_reference = 'docs/content/knowledge-phase-checklists-review-v1.md#payload-sha256=3835d86531ea3ecd7450bdb982e4c2b0cead2be55e0b6ad54434125f9a61e7a8' and v.sources = b.sources
    and v.published_at is null;
  if matching_versions <> 6 then
    raise exception 'Knowledge checklist import stopped: version rows differ from the reviewed bundle';
  end if;

  with expected_items as (
    select b.version_id, b.template_id, item.key, item.position, item.title
    from pg_temp.knowledge_phase_bundle b
    cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
  )
  select count(*) into matching_items
  from expected_items e join public.content_version_checklist_items c
    on c.content_version_id = e.version_id and c.template_id = e.template_id
    and c.item_key = e.key and c.position = e.position and c.title = e.title;
  select count(*) into actual_items from public.content_version_checklist_items c
  where c.content_version_id in ('64000000-0000-4000-8000-000000000001'::uuid,
      '64000000-0000-4000-8000-000000000002'::uuid,
      '64000000-0000-4000-8000-000000000003'::uuid,
      '64000000-0000-4000-8000-000000000004'::uuid,
      '64000000-0000-4000-8000-000000000005'::uuid,
      '64000000-0000-4000-8000-000000000006'::uuid);
  if matching_items <> 18 or actual_items <> 18
    or exists (
      select b.version_id, b.template_id, item.key, item.position, item.title
      from pg_temp.knowledge_phase_bundle b
      cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
      except
      select c.content_version_id, c.template_id, c.item_key, c.position, c.title
      from public.content_version_checklist_items c
      where c.content_version_id in (select version_id from pg_temp.knowledge_phase_bundle)
    ) or exists (
      select c.content_version_id, c.template_id, c.item_key, c.position, c.title
      from public.content_version_checklist_items c
      where c.content_version_id in (select version_id from pg_temp.knowledge_phase_bundle)
      except
      select b.version_id, b.template_id, item.key, item.position, item.title
      from pg_temp.knowledge_phase_bundle b
      cross join lateral jsonb_to_recordset(b.items) as item(key text, position integer, title text)
    ) then
    raise exception 'Knowledge checklist import stopped: child rows differ from all 18 reviewed keys';
  end if;
end;
$verify_import$;

commit;

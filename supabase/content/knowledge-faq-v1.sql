-- Reviewed FAQ catalog v1. Imports four unpublished versions; does not publish. Validate before use.
begin;
do $trusted_import$
begin
  if current_user not in ('postgres', 'supabase_admin') then raise exception 'Knowledge FAQ import requires a trusted database owner/admin session'; end if;
  if nullif(current_setting('request.jwt.claim.role', true), '') is not null then raise exception 'Knowledge FAQ import cannot run under an application JWT role'; end if;
  perform pg_advisory_xact_lock(hashtextextended('tassla.knowledge.faq.v1', 0));
end;
$trusted_import$;
create temporary table faq_bundle on commit drop as
select * from jsonb_to_recordset($faq_catalog$[{"content_id":"66000000-0000-4000-8000-000000000001","slug":"faq-first-night","context":"first_days","version_id":"67000000-0000-4000-8000-000000000001","version":1,"title":"Hur kan första natten bli lugnare?","body":"Förbered natten med en lugn sovplats där hunden kan vila ostört och dra sig undan. Håll miljön enkel och trygg. Kontakta veterinär om något oroar dig kring hälsan.","min_age_weeks":0,"max_age_weeks":null,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare","https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment"]},{"content_id":"66000000-0000-4000-8000-000000000002","slug":"faq-alone-time","context":"first_days","version_id":"67000000-0000-4000-8000-000000000002","version":1,"title":"Hur börjar träningen på att vara ensam?","body":"Börja med mycket korta stunder och öka gradvis utifrån hundens reaktion. Om hunden verkar orolig, gör nästa försök lättare. Det finns ingen tidsplan som passar alla.","min_age_weeks":0,"max_age_weeks":null,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/leftalone"]},{"content_id":"66000000-0000-4000-8000-000000000003","slug":"faq-child-contact","context":"before_homecoming","version_id":"67000000-0000-4000-8000-000000000003","version":1,"title":"Hur möter barn hunden på ett tryggt sätt?","body":"Låt en vuxen aktivt hålla uppsikt under hela mötet. Håll kontakten lugn och positiv, och ge hunden möjlighet att gå undan och vila ostört.","min_age_weeks":0,"max_age_weeks":null,"sources":["https://www.dogstrust.org.uk/dog-advice/getting-dog/dog-ready/when-you-have-children","https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment","https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf"]},{"content_id":"66000000-0000-4000-8000-000000000004","slug":"faq-puppy-course","context":"by_age","version_id":"67000000-0000-4000-8000-000000000004","version":1,"title":"När passar en valpkurs?","body":"En valpkurs kan passa när hunden kan delta i lugn takt. Välj belöningsbaserade metoder. Fråga kursarrangören om upplägget och veterinär vid osäkerhet om ålder, vaccination eller smittskydd.","min_age_weeks":0,"max_age_weeks":null,"sources":["https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf","https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf","https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare"]}]$faq_catalog$::jsonb) as row(
  content_id uuid, slug text, context text, version_id uuid, version integer, title text, body text,
  min_age_weeks integer, max_age_weeks integer, sources text[]
);
-- reviewed payload SHA-256: 170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288
do $validate_bundle$
declare root_count integer; distinct_content_count integer; distinct_version_count integer;
begin
  select count(*), count(distinct content_id), count(distinct version_id) into root_count, distinct_content_count, distinct_version_count from pg_temp.faq_bundle;
  if root_count <> 4 or distinct_content_count <> 4 or distinct_version_count <> 4 then raise exception 'Knowledge FAQ stopped: expected four distinct roots and versions'; end if;
if exists (
    (select slug, context, content_id, version_id, version from (values
      ('faq-first-night', 'first_days', '66000000-0000-4000-8000-000000000001'::uuid, '67000000-0000-4000-8000-000000000001'::uuid, 1),
      ('faq-alone-time', 'first_days', '66000000-0000-4000-8000-000000000002'::uuid, '67000000-0000-4000-8000-000000000002'::uuid, 1),
      ('faq-child-contact', 'before_homecoming', '66000000-0000-4000-8000-000000000003'::uuid, '67000000-0000-4000-8000-000000000003'::uuid, 1),
      ('faq-puppy-course', 'by_age', '66000000-0000-4000-8000-000000000004'::uuid, '67000000-0000-4000-8000-000000000004'::uuid, 1)
    ) expected(slug, context, content_id, version_id, version)
    except select slug, context, content_id, version_id, version from pg_temp.faq_bundle)
    union all
    (select slug, context, content_id, version_id, version from pg_temp.faq_bundle
     except select slug, context, content_id, version_id, version from (values
      ('faq-first-night', 'first_days', '66000000-0000-4000-8000-000000000001'::uuid, '67000000-0000-4000-8000-000000000001'::uuid, 1),
      ('faq-alone-time', 'first_days', '66000000-0000-4000-8000-000000000002'::uuid, '67000000-0000-4000-8000-000000000002'::uuid, 1),
      ('faq-child-contact', 'before_homecoming', '66000000-0000-4000-8000-000000000003'::uuid, '67000000-0000-4000-8000-000000000003'::uuid, 1),
      ('faq-puppy-course', 'by_age', '66000000-0000-4000-8000-000000000004'::uuid, '67000000-0000-4000-8000-000000000004'::uuid, 1)
    ) expected(slug, context, content_id, version_id, version))
  ) then raise exception 'Knowledge FAQ stopped: stable FAQ IDs/contexts differ from reviewed mapping'; end if;
  if exists (select 1 from pg_temp.faq_bundle b join public.content_items i on i.id = b.content_id where i.slug <> b.slug or i.content_type <> 'faq')
    or exists (select 1 from pg_temp.faq_bundle b join public.content_items i on i.slug = b.slug where i.id <> b.content_id or i.content_type <> 'faq') then
    raise exception 'Knowledge FAQ stopped: a reserved root identity is already mapped differently';
  end if;
  if exists (select 1 from public.content_versions v join pg_temp.faq_bundle b on b.content_id = v.content_id where v.id <> b.version_id or v.version <> b.version) then
    raise exception 'Knowledge FAQ stopped: an unexpected version already exists for a FAQ root';
  end if;
end;
$validate_bundle$;
insert into public.content_items(id, slug, content_type) select content_id, slug, 'faq' from pg_temp.faq_bundle on conflict (id) do nothing;
insert into public.content_versions(id, content_id, version, title, body, min_age_weeks, max_age_weeks, context, status, is_ai_generated, reviewed_at, review_reference, sources)
select version_id, content_id, version, title, body, min_age_weeks, max_age_weeks, context, 'reviewed', true,
  '2026-10-28T00:00:00Z'::timestamptz, 'docs/content/knowledge-faq-review-v1.md#payload-sha256=170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288', sources from pg_temp.faq_bundle on conflict (id) do nothing;
do $verify_import$
declare matching_roots integer; matching_versions integer;
begin
  select count(*) into matching_roots from pg_temp.faq_bundle b join public.content_items i on i.id=b.content_id and i.slug=b.slug and i.content_type='faq';
  select count(*) into matching_versions from pg_temp.faq_bundle b join public.content_versions v on v.id=b.version_id and v.content_id=b.content_id
    and v.version=b.version and v.title=b.title and v.body=b.body and v.min_age_weeks=b.min_age_weeks
    and v.max_age_weeks is not distinct from b.max_age_weeks and v.context=b.context and v.status='reviewed' and v.is_ai_generated is true
    and v.reviewed_at='2026-10-28T00:00:00Z'::timestamptz and v.review_reference='docs/content/knowledge-faq-review-v1.md#payload-sha256=170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288' and v.sources=b.sources and v.published_at is null;
  if matching_roots <> 4 or matching_versions <> 4 then raise exception 'Knowledge FAQ stopped: rows differ from the reviewed unpublished bundle'; end if;
end;
$verify_import$;
commit;

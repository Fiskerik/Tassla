-- Publish only runtime-supported, owner-approved v1 content versions.
-- Prerequisites: apply 202610180002_content_ai_origin.sql, then mvp-content-v1.sql and verify exact draft parity.
-- Approval evidence: docs/content/mvp-content-approval-v1.md.
-- before-homecoming stays draft until runtime enforces its onboarding-only context.
begin;

do $lock_content_rows$
begin
  perform v.id from public.content_versions v
  where v.id = any(array[
    '62000000-0000-4000-8000-000000000001'::uuid,
    '62000000-0000-4000-8000-000000000002'::uuid,
    '62000000-0000-4000-8000-000000000003'::uuid,
    '62000000-0000-4000-8000-000000000004'::uuid,
    '62000000-0000-4000-8000-000000000005'::uuid,
    '62000000-0000-4000-8000-000000000006'::uuid,
    '62000000-0000-4000-8000-000000000007'::uuid,
    '62000000-0000-4000-8000-000000000008'::uuid,
    '62000000-0000-4000-8000-000000000009'::uuid,
    '62000000-0000-4000-8000-000000000010'::uuid,
    '62000000-0000-4000-8000-000000000011'::uuid
  ])
  order by v.id
  for update;
end
$lock_content_rows$;

do $verify_publish_input$
declare expected_count integer := 10;
begin
  if (with expected(id, content_id, version, slug, content_type, title, min_age, max_age, body_hash, sources_hash) as (values
      ('62000000-0000-4000-8000-000000000002'::uuid, '61000000-0000-4000-8000-000000000002'::uuid, 1, 'first-week', 'article', 'Första veckan hemma', 8, 12, 'e246413b15c3a1950059c75ba6248ce3', '521b9fa9065da9723ca91c9e517f5d86'),
      ('62000000-0000-4000-8000-000000000003'::uuid, '61000000-0000-4000-8000-000000000003'::uuid, 1, 'daily-log-routines', 'article', 'Vardagslogg och rutiner i Tassla', 0, null, 'd9b52d6b39764e170f8300b03dbea811', 'cffa2b44cad25c3e55f4db0760a66bef'),
      ('62000000-0000-4000-8000-000000000004'::uuid, '61000000-0000-4000-8000-000000000004'::uuid, 1, 'handling-guide', 'article', 'Trygg hantering bygger på frivillighet', 13, 16, '304984851c104a360ef0407ce1e00266', 'a355ab5e00c5b1ce3c66e753f1bf0cfc'),
      ('62000000-0000-4000-8000-000000000005'::uuid, '61000000-0000-4000-8000-000000000005'::uuid, 1, 'environment-checklist', 'checklist', 'Trygghet i nya miljöer', 17, 26, '75ad2e763539cc9a7f9960173dcb253d', '957e2e2a8bbea4008517f22b06d0fa45'),
      ('62000000-0000-4000-8000-000000000006'::uuid, '61000000-0000-4000-8000-000000000006'::uuid, 1, 'being-alone-guide', 'article', 'Hjälp valpen att vara själv en liten stund', 27, 52, '0fa352e0280e9ea7874a0c4c404ec7b5', 'd4311831a69480cd62ff95c261a8dfba'),
      ('62000000-0000-4000-8000-000000000007'::uuid, '61000000-0000-4000-8000-000000000007'::uuid, 1, 'weight-history-guide', 'article', 'Så fungerar vikthistoriken', 0, null, '79be6097559a037cdc66abfc884cc0ad', 'a07687bd0f253b1fb02da4ad3f7d5454'),
      ('62000000-0000-4000-8000-000000000008'::uuid, '61000000-0000-4000-8000-000000000008'::uuid, 1, 'health-records-guide', 'article', 'Registrera en utförd vaccination eller ett veterinärbesök', 0, null, '38d9c3bfb053777a341a53552bfd7a14', 'f57bb78bbb56341a184dfdfb72c4bd13'),
      ('62000000-0000-4000-8000-000000000009'::uuid, '61000000-0000-4000-8000-000000000009'::uuid, 1, 'handling-program', 'training_program', 'Trygg hantering i små steg', 8, null, '9d2735b9f772b7785552b96f72b7f103', 'a355ab5e00c5b1ce3c66e753f1bf0cfc'),
      ('62000000-0000-4000-8000-000000000010'::uuid, '61000000-0000-4000-8000-000000000010'::uuid, 1, 'environment-program', 'training_program', 'Utforska miljön med trygghet', 8, null, 'b71fa2c053d278fb98213b62fd3e9716', '0f6ec9ad0b55ad99c0e4b30fe43ab249'),
      ('62000000-0000-4000-8000-000000000011'::uuid, '61000000-0000-4000-8000-000000000011'::uuid, 1, 'being-alone-program', 'training_program', 'Öva på att vara själv i hundens takt', 8, null, 'b8aa055c1d373b2f9ffd796555aec371', 'd4311831a69480cd62ff95c261a8dfba')
  ) select count(*) from expected e
    join public.content_versions v on v.id=e.id
    join public.content_items i on i.id=v.content_id
    where v.content_id=e.content_id and v.version=e.version and i.slug=e.slug
      and i.content_type=e.content_type and v.title=e.title
      and v.min_age_weeks=e.min_age and v.max_age_weeks is not distinct from e.max_age
      and md5(v.body)=e.body_hash
      and md5(array_to_string(array(select unnest(v.sources) order by 1), E'\n'))=e.sources_hash
      and v.is_ai_generated=true and v.status in ('draft','published')) <> expected_count then
    raise exception 'approved content identity/title/body/source changed since verified import';
  end if;
end
$verify_publish_input$;

update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000002'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000003'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000004'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000005'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000006'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000007'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000008'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000009'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000010'::uuid and status='draft';
update public.content_versions
set is_ai_generated=true, status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000011'::uuid and status='draft';

do $verify_publication$
declare expected uuid[] := array[
  '62000000-0000-4000-8000-000000000002'::uuid,
  '62000000-0000-4000-8000-000000000003'::uuid,
  '62000000-0000-4000-8000-000000000004'::uuid,
  '62000000-0000-4000-8000-000000000005'::uuid,
  '62000000-0000-4000-8000-000000000006'::uuid,
  '62000000-0000-4000-8000-000000000007'::uuid,
  '62000000-0000-4000-8000-000000000008'::uuid,
  '62000000-0000-4000-8000-000000000009'::uuid,
  '62000000-0000-4000-8000-000000000010'::uuid,
  '62000000-0000-4000-8000-000000000011'::uuid
];
begin
  if (select count(*) from public.content_versions where id = any(expected)
      and status='published' and reviewed_at='2026-10-08T00:00:00Z'
      and review_reference='docs/content/mvp-content-approval-v1.md'
      and published_at='2026-10-08T00:00:00Z' and is_ai_generated=true) <> cardinality(expected) then
    raise exception 'approved content publication mismatch';
  end if;
  if (select count(*) from public.content_versions
      where id='62000000-0000-4000-8000-000000000001'::uuid
      and content_id='61000000-0000-4000-8000-000000000001'::uuid and version=1
      and title='Förbered hemmet före valpens ankomst'
      and min_age_weeks=0 and max_age_weeks=0
      and md5(body)='b37f18ebb096a5a39c180cb43bd012be'
      and md5(array_to_string(array(select unnest(sources) order by 1), E'\n'))='3a80da64b658b7a61b571b62156a84f8'
      and status='draft' and is_ai_generated=true) <> 1 then
    raise exception 'onboarding-only content must exist exactly once as an AI-origin draft until context-aware runtime exists';
  end if;
end
$verify_publication$;

commit;

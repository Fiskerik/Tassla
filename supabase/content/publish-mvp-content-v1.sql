-- Publish only runtime-supported, owner-approved v1 content versions.
-- Prerequisite: apply mvp-content-v1.sql and verify its exact draft parity first.
-- Approval evidence: docs/content/mvp-content-approval-v1.md.
-- before-homecoming stays draft until runtime enforces its onboarding-only context.
begin;

update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000002'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000003'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000004'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000005'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000006'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000007'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000008'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000009'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
    review_reference='docs/content/mvp-content-approval-v1.md',
    published_at='2026-10-08T00:00:00Z'
where id='62000000-0000-4000-8000-000000000010'::uuid and status='draft';
update public.content_versions
set status='published', reviewed_at='2026-10-08T00:00:00Z',
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
      and published_at='2026-10-08T00:00:00Z') <> cardinality(expected) then
    raise exception 'approved content publication mismatch';
  end if;
  if exists (select 1 from public.content_versions
      where id='62000000-0000-4000-8000-000000000001'::uuid and status <> 'draft') then
    raise exception 'onboarding-only content must remain draft until context-aware runtime exists';
  end if;
end
$verify_publication$;

commit;

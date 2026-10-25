-- Run after all migrations in a disposable database; every change is rolled back.
begin;
do $$
declare
  source constant text := '1fRBAmcWvjYY7qZhNJNfIqELQ6WgGvfcc';
  prior_review constant text := 'owner-confirmed:2026-10-24:01_Forsta_dygnet_hemma.docx:app-format-v1';
  restored_review constant text := 'owner-confirmed:2026-10-25:restore-original-generic-copy:forsta-dygnet-hemma';
  old_payload jsonb;
  current_payload jsonb;
  next_payload jsonb;
  old_version uuid;
  current_version uuid;
  next_version uuid;
  replay uuid;
begin
  select payload, version_id into old_payload, old_version
    from private.article_import_receipts
    where source_id = source and review_reference = prior_review;
  select payload, version_id into current_payload, current_version
    from private.article_import_receipts
    where source_id = source and review_reference = restored_review;

  if old_version is null or current_version is null or old_version = current_version then
    raise exception 'Expected immutable receipts for both reviewed article versions';
  end if;
  if (select status from public.content_versions where id = old_version) <> 'withdrawn' or
     (select status from public.content_versions where id = current_version) <> 'published' then
    raise exception 'Restored revision did not withdraw the prior version';
  end if;
  if current_payload->>'body' like '%{{dog.%' then
    raise exception 'Restored article still contains dog-specific placeholders';
  end if;

  if public.import_drive_article(current_payload) <> current_version then
    raise exception 'Exact current receipt replay returned another version';
  end if;
  replay := public.import_drive_article(old_payload);
  if replay <> old_version or
     (select status from public.content_versions where id = old_version) <> 'withdrawn' then
    raise exception 'Prior receipt replay resurrected the withdrawn version';
  end if;

  begin
    perform public.import_drive_article(jsonb_set(current_payload, '{body}', to_jsonb('Conflicting reviewed body'::text)));
    raise exception 'Conflicting payload under an existing review receipt was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Conflicting source receipt' then raise; end if;
  end;

  next_payload := current_payload || jsonb_build_object(
    'title', current_payload->>'title' || ' (synthetic review probe)',
    'review_reference', 'synthetic:article-review-revision:later',
    'reviewed_at', now() + interval '1 minute'
  );
  next_version := public.import_drive_article(next_payload);
  if next_version = current_version or
     (select status from public.content_versions where id = current_version) <> 'withdrawn' or
     (select status from public.content_versions where id = next_version) <> 'published' then
    raise exception 'A newer review with the same Drive hash and timestamp did not publish a new version';
  end if;
  if (select count(*) from private.article_import_receipts where source_id = source) < 3 then
    raise exception 'Review receipts were overwritten instead of preserved';
  end if;
  if public.import_drive_article(next_payload) <> next_version then
    raise exception 'Exact newer-review retry returned another version';
  end if;

  next_payload := current_payload || jsonb_build_object(
    'review_reference', 'synthetic:article-review-revision:not-newer',
    'reviewed_at', current_payload->>'reviewed_at'
  );
  begin
    perform public.import_drive_article(next_payload);
    raise exception 'A non-newer review timestamp was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Changed source requires renewed review' then raise; end if;
  end;

  next_payload := current_payload || jsonb_build_object(
    'source_hash', repeat('b', 64),
    'modified_at', (current_payload->>'modified_at')::timestamptz - interval '1 day',
    'review_reference', 'synthetic:article-review-revision:stale-source',
    'reviewed_at', now() + interval '1 minute'
  );
  begin
    perform public.import_drive_article(next_payload);
    raise exception 'An older Drive modification timestamp was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Stale source revision' then raise; end if;
  end;

  if (select status from public.content_versions where id = old_version) <> 'withdrawn' or
     (select count(*) from public.article_version_metadata m
       join public.content_versions v on v.id = m.content_version_id
       where v.content_id = (select content_id from public.content_versions where id = old_version)
         and v.status = 'published') <> 1 then
    raise exception 'Review history or single-published-version invariant was lost';
  end if;
end;
$$;
rollback;

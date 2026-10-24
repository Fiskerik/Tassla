-- Run after all migrations in a disposable database; every change is rolled back.
begin;
do $$
declare payload jsonb; old_version uuid; new_version uuid; replay uuid;
begin
  if (select count(*) from public.content_versions v join public.article_version_metadata m on m.content_version_id=v.id where v.status='published') <> 3 then
    raise exception 'Expected the three initial published articles';
  end if;
  select r.payload, r.version_id into payload, old_version from private.article_import_receipts r
    where r.source_id='1fRBAmcWvjYY7qZhNJNfIqELQ6WgGvfcc';
  if public.import_drive_article(payload) <> old_version then raise exception 'Receipt replay mismatch'; end if;
  if public.import_drive_article(payload || jsonb_build_object('modified_at','2026-10-24T00:00:00Z')) <> old_version then
    raise exception 'Unchanged source with later Drive metadata failed replay'; end if;
  begin
    perform public.import_drive_article(jsonb_set(payload,'{body}',to_jsonb('Conflicting body'::text)));
    raise exception 'Conflicting same-hash payload accepted';
  exception when raise_exception then
    if sqlerrm <> 'Conflicting source receipt' then raise; end if;
  end;
  begin
    update public.article_targeting_rules set end_days=-1 where content_version_id=old_version;
    raise exception 'Published rules were mutable';
  exception when check_violation then null;
  end;
  payload := payload || jsonb_build_object('source_hash',repeat('a',64),'modified_at','2026-10-24T01:00:00Z');
  begin
    perform public.import_drive_article(payload);
    raise exception 'Changed content reused stale review';
  exception when raise_exception then
    if sqlerrm <> 'Changed source requires renewed review' then raise; end if;
  end;
  payload := payload || jsonb_build_object('review_reference','synthetic-renewed-review-2','reviewed_at',now());
  new_version := public.import_drive_article(payload);
  if new_version=old_version or (select status from public.content_versions where id=old_version)<>'withdrawn' then
    raise exception 'Atomic version transition failed';
  end if;
  if (select count(*) from public.content_versions where content_id=(select content_id from public.content_versions where id=old_version) and status='published')<>1 then
    raise exception 'Expected one active version';
  end if;
  select public.import_drive_article(r.payload) into replay from private.article_import_receipts r where r.version_id=old_version;
  if replay<>old_version or (select status from public.content_versions where id=old_version)<>'withdrawn' then
    raise exception 'Old replay resurrected withdrawn article';
  end if;
  payload := payload || jsonb_build_object('source_hash',repeat('b',64),'modified_at','2026-10-18T00:00:00Z');
  begin
    perform public.import_drive_article(payload);
    raise exception 'Stale revision accepted';
  exception when raise_exception then
    if sqlerrm <> 'Stale source revision' then raise; end if;
  end;
end;
$$;

insert into auth.users(id,email) values ('10101010-1010-4010-8010-101010101010','article-owner-a@example.invalid'),('20202020-2020-4020-8020-202020202020','article-owner-b@example.invalid');
set local role authenticated;
select set_config('request.headers','{}',true);
do $$ begin
  if exists(select 1 from public.content_versions where delivery_contract=2) then raise exception 'Legacy client received unsupported article format'; end if;
end; $$;
select set_config('request.headers','{"x-client-info":"tassla-content/2"}',true);
select set_config('request.jwt.claims','{"sub":"10101010-1010-4010-8010-101010101010","role":"authenticated"}',true);
select public.create_dog_with_homecoming('Nemo','mixed','2026-08-01',null,'30303030-3030-4030-8030-303030303030','2026-12-15','male');
do $$
declare dog_id uuid;
begin
  select id into dog_id from public.dogs where name='Nemo';
  if not exists(select 1 from public.dogs where id=dog_id and expected_homecoming_date='2026-12-15' and sex='male') then
    raise exception 'Profile values were not persisted';
  end if;
  update public.dogs set expected_homecoming_date='2026-12-20',sex='female' where id=dog_id;
  perform public.create_dog_with_homecoming('Nemo','mixed','2026-08-01',null,'30303030-3030-4030-8030-303030303030','2026-12-15','male');
  if not exists(select 1 from public.dogs where id=dog_id and expected_homecoming_date='2026-12-20' and sex='female') then
    raise exception 'Creation replay overwrote later profile edit';
  end if;
  if (select count(*) from public.article_version_metadata)<>3 then raise exception 'Published library missing'; end if;
  if exists(select 1 from public.article_version_metadata m join public.content_versions v on v.id=m.content_version_id where v.status<>'published') then raise exception 'Unpublished metadata exposed'; end if;
  if has_function_privilege('authenticated','public.import_drive_article(jsonb)','execute') or
    has_function_privilege('anon','public.import_drive_article(jsonb)','execute') then raise exception 'Client can invoke editorial import'; end if;
  if has_table_privilege('authenticated','public.article_targeting_rules','insert') then raise exception 'Client can edit targeting'; end if;
end;
$$;
select set_config('request.jwt.claims','{"sub":"20202020-2020-4020-8020-202020202020","role":"authenticated"}',true);
do $$
declare changed integer;
begin
  if exists(select 1 from public.dogs where name='Nemo') then raise exception 'Cross-owner profile read'; end if;
  update public.dogs set sex='male', expected_homecoming_date=null where name='Nemo';
  get diagnostics changed = row_count;
  if changed<>0 then raise exception 'Cross-owner profile update'; end if;
end;
$$;
select set_config('request.jwt.claims','{"sub":"10101010-1010-4010-8010-101010101010","role":"authenticated"}',true);
update public.dogs set expected_homecoming_date=null,sex=null where name='Nemo';
do $$ begin
  if not exists(select 1 from public.dogs where name='Nemo' and expected_homecoming_date is null and sex is null) then raise exception 'Optional fields could not be cleared'; end if;
end; $$;
reset role;
delete from auth.users where id='10101010-1010-4010-8010-101010101010';
do $$ begin
  if exists(select 1 from public.dogs where name='Nemo') then raise exception 'Account deletion retained profile fields'; end if;
end; $$;
set local role anon;
do $$ begin
  if has_table_privilege('anon','public.article_version_metadata','select') or has_table_privilege('anon','public.article_targeting_rules','select') then raise exception 'Anonymous catalog access widened'; end if;
end; $$;
rollback;

begin;

-- New article bodies require the token/callout-aware reader. Older installed
-- clients must not see raw placeholders or apply age-only targeting to them.
alter table public.content_versions add column delivery_contract smallint not null default 1 check (delivery_contract in (1,2));
drop policy version_read on public.content_versions;
create policy version_read on public.content_versions for select to authenticated using (
  status = 'published' and (delivery_contract = 1 or
    coalesce(nullif(current_setting('request.headers', true),'')::jsonb->>'x-client-info','') = 'tassla-content/2')
);

alter table public.dogs add column expected_homecoming_date date;
alter table public.dogs add column sex text check (sex in ('male','female'));
grant update(expected_homecoming_date,sex) on public.dogs to authenticated;

-- A new RPC name avoids ambiguity with older clients' exact five-argument RPC.
create function public.create_dog_with_homecoming(
  dog_name text, dog_breed_id text, dog_birth_date date, kennel_code text,
  request_id uuid, expected_homecoming_date date, dog_sex text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare dog_id uuid; replay boolean;
begin
  -- Serialize before checking the receipt: replays must never overwrite later profile edits.
  perform 1 from auth.users where id = auth.uid() for update;
  replay := exists(select 1 from private.dog_creation_requests r where r.user_id = auth.uid() and r.request_id = create_dog_with_homecoming.request_id);
  dog_id := private.create_dog_with_request(request_id, dog_name, dog_breed_id, dog_birth_date, kennel_code, false);
  if not replay then
    update public.dogs d set expected_homecoming_date = create_dog_with_homecoming.expected_homecoming_date, sex = dog_sex where d.id = dog_id;
  end if;
  return dog_id;
end;
$$;
revoke all on function public.create_dog_with_homecoming(text,text,date,text,uuid,date,text) from public, anon;
grant execute on function public.create_dog_with_homecoming(text,text,date,text,uuid,date,text) to authenticated;

create table public.article_version_metadata (
  content_version_id uuid primary key references public.content_versions(id),
  topic_code text not null check (topic_code in ('homecoming_first_day','house_training','puppy_sleep','general')),
  editorial_scope text not null,
  related_source_refs text[] not null default '{}'
);
create table public.article_targeting_rules (
  content_version_id uuid not null references public.article_version_metadata(content_version_id),
  rule_key text not null check (rule_key ~ '^[a-z][a-z0-9_]{0,63}$'),
  min_age_weeks integer not null check (min_age_weeks >= 0),
  max_age_weeks integer check (max_age_weeks >= min_age_weeks),
  event_kind text not null check (event_kind in ('none','expected_homecoming')),
  start_days integer,
  end_days integer,
  primary key(content_version_id, rule_key),
  check ((event_kind = 'none' and start_days is null and end_days is null) or
    (event_kind = 'expected_homecoming' and start_days is not null and end_days is not null and start_days between -365 and 0 and end_days between start_days and 0))
);
create trigger protect_article_metadata before insert or update or delete on public.article_version_metadata
  for each row execute function private.protect_content_child();
create trigger protect_article_targeting before insert or update or delete on public.article_targeting_rules
  for each row execute function private.protect_content_child();

alter table public.article_version_metadata enable row level security;
alter table public.article_targeting_rules enable row level security;
revoke all on public.article_version_metadata, public.article_targeting_rules from public, anon, authenticated;
grant select on public.article_version_metadata, public.article_targeting_rules to authenticated;
grant all on public.article_version_metadata, public.article_targeting_rules to service_role;
create policy article_metadata_read on public.article_version_metadata for select to authenticated
  using (exists(select 1 from public.content_versions v where v.id = content_version_id and v.status = 'published'));
create policy article_rules_read on public.article_targeting_rules for select to authenticated
  using (exists(select 1 from public.content_versions v where v.id = content_version_id and v.status = 'published'));

create table private.article_import_sources (
  source_id text primary key,
  content_id uuid not null unique references public.content_items(id),
  modified_at timestamptz not null,
  review_reference text not null,
  reviewed_at timestamptz not null
);
create table private.article_import_receipts (
  source_id text not null references private.article_import_sources(source_id),
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null,
  version_id uuid not null unique references public.content_versions(id),
  primary key(source_id, source_hash)
);
revoke all on private.article_import_sources, private.article_import_receipts from public, anon, authenticated;

-- Only the dedicated server endpoint holds the service-role credential. The runner
-- receives an editorial sync token, never database or dog-data access.
create function public.import_drive_article(article jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  source text := article->>'source_id';
  v_source_hash text := article->>'source_hash';
  head private.article_import_sources;
  receipt private.article_import_receipts;
  content uuid;
  new_version uuid;
  next_version integer;
  rule jsonb;
  expected_keys text[] := array['source_id','source_hash','modified_at','slug','title','body','min_age_weeks','max_age_weeks','breed_ids','topic_code','editorial_scope','related_source_refs','rules','review_reference','reviewed_at','is_ai_generated','sources'];
begin
  if article is null or jsonb_typeof(article) <> 'object' or
    (select count(*) from jsonb_object_keys(article)) <> cardinality(expected_keys) or
    exists(select 1 from jsonb_object_keys(article) k where not k = any(expected_keys)) or
    source is null or source !~ '^[A-Za-z0-9_-]{10,160}$' or
    v_source_hash is null or v_source_hash !~ '^[a-f0-9]{64}$' or
    article->>'slug' is null or article->>'slug' !~ '^[a-z][a-z0-9-]{1,100}$' or
    nullif(btrim(article->>'body'),'') is null or length(article->>'body') > 100000 or
    length(btrim(article->>'title')) not between 1 and 160 or
    jsonb_typeof(article->'is_ai_generated') <> 'boolean' or
    nullif(btrim(article->>'review_reference'),'') is null or
    (article->>'reviewed_at')::timestamptz > now() + interval '5 minutes' or
    (article->>'reviewed_at')::timestamptz is null or
    (article->>'modified_at')::timestamptz is null or
    jsonb_typeof(article->'rules') <> 'array' or jsonb_array_length(article->'rules') > 10 or
    jsonb_typeof(article->'breed_ids') <> 'array' or jsonb_array_length(article->'breed_ids') > 200 or
    jsonb_typeof(article->'sources') <> 'array' or
    jsonb_typeof(article->'related_source_refs') <> 'array'
  then raise exception 'Invalid reviewed article payload' using errcode = '23514'; end if;

  perform pg_advisory_xact_lock(hashtextextended(source, 0));
  select * into receipt from private.article_import_receipts r where r.source_id = source and r.source_hash = v_source_hash;
  if found then
    if (receipt.payload - 'modified_at') <> (article - 'modified_at') then raise exception 'Conflicting source receipt'; end if;
    return receipt.version_id; -- Never resurrect an old withdrawn version on retry.
  end if;
  select * into head from private.article_import_sources s where s.source_id = source for update;
  if found then
    if (article->>'modified_at')::timestamptz <= head.modified_at then raise exception 'Stale source revision'; end if;
    if article->>'review_reference' = head.review_reference or (article->>'reviewed_at')::timestamptz <= head.reviewed_at
      then raise exception 'Changed source requires renewed review'; end if;
    content := head.content_id;
    if not exists(select 1 from public.content_items i where i.id = content and i.slug = article->>'slug' and i.content_type = 'article')
      then raise exception 'Source identity cannot change'; end if;
  else
    -- A new Drive file cannot silently take ownership of an existing slug.
    insert into public.content_items(slug, content_type) values(article->>'slug', 'article') returning id into content;
    insert into private.article_import_sources values(source, content, (article->>'modified_at')::timestamptz, article->>'review_reference', (article->>'reviewed_at')::timestamptz);
  end if;
  perform 1 from public.content_items where id = content for update;
  select coalesce(max(version),0)+1 into next_version from public.content_versions where content_id = content;
  insert into public.content_versions(content_id, version, title, body, min_age_weeks, max_age_weeks, is_ai_generated, reviewed_at, review_reference, sources, delivery_contract)
  values(content, next_version, article->>'title', article->>'body', (article->>'min_age_weeks')::integer,
    (article->>'max_age_weeks')::integer, (article->>'is_ai_generated')::boolean,
    (article->>'reviewed_at')::timestamptz, article->>'review_reference',
    array(select jsonb_array_elements_text(article->'sources')), 2) returning id into new_version;
  insert into public.article_version_metadata values(new_version, article->>'topic_code', article->>'editorial_scope', array(select jsonb_array_elements_text(article->'related_source_refs')));
  for rule in select jsonb_array_elements(article->'rules') loop
    if (select count(*) from jsonb_object_keys(rule)) <> 6 or not rule ?& array['rule_key','min_age_weeks','max_age_weeks','event_kind','start_days','end_days'] then
      raise exception 'Invalid article targeting rule';
    end if;
    insert into public.article_targeting_rules values(new_version, rule->>'rule_key', (rule->>'min_age_weeks')::integer,
      (rule->>'max_age_weeks')::integer, rule->>'event_kind', (rule->>'start_days')::integer, (rule->>'end_days')::integer);
  end loop;
  insert into public.content_breed_targets select new_version, jsonb_array_elements_text(article->'breed_ids');
  update public.content_versions set status = 'withdrawn' where content_id = content and status = 'published';
  update public.content_versions set status = 'published', published_at = now() where id = new_version;
  update private.article_import_sources set modified_at = (article->>'modified_at')::timestamptz,
    review_reference = article->>'review_reference', reviewed_at = (article->>'reviewed_at')::timestamptz where source_id = source;
  insert into private.article_import_receipts values(source, v_source_hash, article, new_version);
  return new_version;
end;
$$;
revoke all on function public.import_drive_article(jsonb) from public, anon, authenticated;
grant execute on function public.import_drive_article(jsonb) to service_role;
commit;

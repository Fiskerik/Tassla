#!/usr/bin/env python3
"""Generate recall source data, a guarded draft import and a release migration."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/content/recall-program-draft-v1.md'
JSON_FILE = ROOT / 'docs/content/recall-program-v1.json'
SQL_FILE = ROOT / 'supabase/content/recall-program-draft-v1.sql'
RELEASE_FILE = ROOT / 'supabase/migrations/202610270001_recall_training_program.sql'
PREFIX = 'https://tassla.app/content/recall-program/v1/'
SOURCES = [
    'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/come',
    'https://www.dogstrust.org.uk/dog-advice/training/basics/recall-training',
    'https://www.dogstrust.org.uk/dog-advice/understanding-your-dog/signs-your-dog-may-be-stressed',
    'https://www.dogstrust.org.uk/dog-advice/training/unwanted-behaviours/chasing',
    'https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf',
]


def stable_id(name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, PREFIX + name))


def build_payload() -> dict:
    text = SOURCE.read_text(encoding='utf-8')
    intro = re.search(r'^## Inledning\s*\n(.*?)\n(?=## 1\. )', text, re.MULTILINE | re.DOTALL)
    sections = list(re.finditer(r'^## ([1-6])\. ([^\n]+)\n(.*?)(?=^## (?:[1-6]\. |Källor och avgränsning)|\Z)', text, re.MULTILINE | re.DOTALL))
    if not intro or len(sections) != 6 or [int(match.group(1)) for match in sections] != list(range(1, 7)):
        raise ValueError('Expected one introduction and six ordered steps')
    steps = []
    for match in sections:
        position = int(match.group(1))
        instruction = match.group(3).strip()
        for heading in ('Du behöver', 'Så gör ni', 'Gör det lättare', 'Gör det svårare', 'Trygg träning'):
            if f'### {heading}\n' not in instruction:
                raise ValueError(f'Step {position} lacks {heading}')
        if 'Vid oro: pausa' not in instruction or 'utan att jaga' not in instruction:
            raise ValueError(f'Step {position} lacks individual safety guidance')
        if position >= 4 and 'Håll långlinan under uppsikt och dra inte i den.' not in instruction:
            raise ValueError(f'Step {position} lacks long-line guidance')
        steps.append({'id': stable_id(f'step-{position}'), 'step_key': f'recall-{position}',
                      'position': position, 'title': match.group(2).strip(), 'instruction': instruction})
    return {'schema_version': 1, 'content_id': stable_id('content'), 'version_id': stable_id('version'),
            'slug': 'inkallning-i-sma-steg', 'version': 1, 'title': 'Inkallning i små steg',
            'body': intro.group(1).strip(), 'min_age_weeks': 0, 'max_age_weeks': None,
            'status': 'draft', 'is_ai_generated': True, 'sources': SOURCES, 'steps': steps,
            'review': {'dog_expert': 'ai-assisted-pass-with-step-safety', 'human_review': 'not-recorded',
                       'reference': 'docs/content/recall-program-draft-v1.md'}}


def build_sql(payload: dict) -> str:
    document = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    if '$recall$' in document or '$publish$' in document:
        raise ValueError('SQL delimiter is present in the content')
    return f'''-- Generated from docs/content/recall-program-draft-v1.md; draft only, no publication.
-- Use only in an explicitly selected development database after review.
begin;
do $guard$
begin
  if current_user not in ('postgres', 'supabase_admin') or nullif(current_setting('request.jwt.claim.role', true), '') is not null then
    raise exception 'Recall draft import requires a trusted database owner/admin session';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('tassla.recall-program.v1', 0));
end;
$guard$;
create temporary table recall_draft_payload on commit drop as select $recall${document}$recall$::jsonb as value;
do $validate$
declare d jsonb; n integer;
begin
  select value into d from pg_temp.recall_draft_payload;
  if d->>'status' <> 'draft' or jsonb_array_length(d->'steps') <> 6 then raise exception 'Invalid recall draft'; end if;
  select count(distinct s.step_key) into n from jsonb_to_recordset(d->'steps') as s(id uuid, step_key text, position integer, title text, instruction text);
  if n <> 6 then raise exception 'Recall steps must have unique keys'; end if;
end;
$validate$;
insert into public.content_items(id, slug, content_type)
select (value->>'content_id')::uuid, value->>'slug', 'training_program' from pg_temp.recall_draft_payload
on conflict (id) do nothing;
do $item_check$
declare d jsonb;
begin
  select value into d from pg_temp.recall_draft_payload;
  perform 1 from public.content_items where id=(d->>'content_id')::uuid for update;
  if not exists(select 1 from public.content_items where id=(d->>'content_id')::uuid and slug=d->>'slug' and content_type='training_program') then
    raise exception 'Recall content identity differs from existing data';
  end if;
end;
$item_check$;
insert into public.content_versions(id, content_id, version, title, body, min_age_weeks, max_age_weeks, status, is_ai_generated, sources)
select (value->>'version_id')::uuid, (value->>'content_id')::uuid, (value->>'version')::integer,
  value->>'title', value->>'body', (value->>'min_age_weeks')::integer, null, 'draft', true,
  array(select jsonb_array_elements_text(value->'sources'))
from pg_temp.recall_draft_payload on conflict (id) do nothing;
do $version_check$
declare d jsonb;
begin
  select value into d from pg_temp.recall_draft_payload;
  perform 1 from public.content_versions where id=(d->>'version_id')::uuid for update;
  if not exists(select 1 from public.content_versions v where v.id=(d->>'version_id')::uuid
    and v.content_id=(d->>'content_id')::uuid and v.version=(d->>'version')::integer
    and v.title=d->>'title' and v.body=d->>'body' and v.min_age_weeks=(d->>'min_age_weeks')::integer
    and v.max_age_weeks is null and v.status='draft' and v.is_ai_generated=true
    and v.reviewed_at is null and v.review_reference is null and v.published_at is null
    and to_jsonb(v)->>'context' is null and coalesce(to_jsonb(v)->>'delivery_contract', '1')='1'
    and v.sources=array(select jsonb_array_elements_text(d->'sources'))) then
    raise exception 'Recall version already exists with different content or status';
  end if;
end;
$version_check$;
insert into public.training_steps(id, program_version_id, step_key, position, title, instruction)
select s.id, (d.value->>'version_id')::uuid, s.step_key, s.position, s.title, s.instruction
from pg_temp.recall_draft_payload d, jsonb_to_recordset(d.value->'steps') as s(id uuid, step_key text, position integer, title text, instruction text)
on conflict (id) do nothing;
do $step_check$
declare d jsonb;
begin
  select value into d from pg_temp.recall_draft_payload;
  if (select count(*) from public.training_steps where program_version_id=(d->>'version_id')::uuid) <> 6
    or exists(select 1 from jsonb_to_recordset(d->'steps') as s(id uuid, step_key text, position integer, title text, instruction text)
      where not exists(select 1 from public.training_steps t where t.id=s.id and t.program_version_id=(d->>'version_id')::uuid
        and t.step_key=s.step_key and t.position=s.position and t.title=s.title and t.instruction=s.instruction)) then
    raise exception 'Recall steps differ from the generated draft';
  end if;
end;
$step_check$;
commit;
'''


def build_release_sql(payload: dict) -> str:
    document = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    if '$recall$' in document or '$publish$' in document:
        raise ValueError('SQL delimiter is present in the content')
    digest = hashlib.sha256(document.encode('utf-8')).hexdigest()
    reference = f'ai-assisted-dog-expert:recall-v1:2026-10-27:sha256={digest}'
    return f'''-- Generated from docs/content/recall-program-draft-v1.md.
-- Publishes the AI-assisted, source-checked program. No human review is represented.
-- Existing conflicting versions or steps fail closed; published data is never overwritten.
begin;
do $publish$
declare
  d jsonb := $recall${document}$recall$::jsonb;
  v public.content_versions%rowtype;
  s record;
begin
  perform pg_advisory_xact_lock(hashtextextended('tassla.recall-program.v1', 0));
  if d->>'status' <> 'draft' or jsonb_array_length(d->'steps') <> 6 then
    raise exception 'Invalid recall payload';
  end if;

  insert into public.content_items(id, slug, content_type)
    values ((d->>'content_id')::uuid, d->>'slug', 'training_program') on conflict (id) do nothing;
  perform 1 from public.content_items where id=(d->>'content_id')::uuid for update;
  if not exists(select 1 from public.content_items where id=(d->>'content_id')::uuid
      and slug=d->>'slug' and content_type='training_program') then
    raise exception 'Recall content identity differs from existing data';
  end if;

  insert into public.content_versions(id, content_id, version, title, body, min_age_weeks, max_age_weeks, status, is_ai_generated, sources)
    values ((d->>'version_id')::uuid, (d->>'content_id')::uuid, (d->>'version')::integer,
      d->>'title', d->>'body', (d->>'min_age_weeks')::integer, null, 'draft', true,
      array(select jsonb_array_elements_text(d->'sources'))) on conflict (id) do nothing;
  select * into v from public.content_versions where id=(d->>'version_id')::uuid for update;
  if not found or v.content_id is distinct from (d->>'content_id')::uuid
    or v.version is distinct from (d->>'version')::integer or v.title is distinct from d->>'title'
    or v.body is distinct from d->>'body' or v.min_age_weeks is distinct from (d->>'min_age_weeks')::integer
    or v.max_age_weeks is not null or v.is_ai_generated is distinct from true
    or v.sources is distinct from array(select jsonb_array_elements_text(d->'sources'))
    or to_jsonb(v)->>'context' is not null or coalesce(to_jsonb(v)->>'delivery_contract', '1') <> '1'
    or v.status not in ('draft', 'published') then
    raise exception 'Recall version differs from generated content';
  end if;
  if v.status='draft' and (v.reviewed_at is not null or v.review_reference is not null or v.published_at is not null) then
    raise exception 'Recall draft already contains review or publication metadata';
  end if;
  if v.status='published' and (v.review_reference is distinct from '{reference}' or v.reviewed_at is null or v.published_at is null) then
    raise exception 'Published recall provenance differs';
  end if;
  if exists(select 1 from public.content_breed_targets where content_version_id=v.id) then
    raise exception 'Recall program must not have unexpected breed targets';
  end if;

  if v.status='draft' then
    for s in select * from jsonb_to_recordset(d->'steps') as x(id uuid, step_key text, position integer, title text, instruction text) loop
      insert into public.training_steps(id, program_version_id, step_key, position, title, instruction)
        values (s.id, v.id, s.step_key, s.position, s.title, s.instruction) on conflict (id) do nothing;
    end loop;
  end if;
  if (select count(*) from public.training_steps where program_version_id=v.id) <> 6
    or exists(select 1 from jsonb_to_recordset(d->'steps') as x(id uuid, step_key text, position integer, title text, instruction text)
      where not exists(select 1 from public.training_steps t where t.id=x.id and t.program_version_id=v.id
        and t.step_key=x.step_key and t.position=x.position and t.title=x.title and t.instruction=x.instruction)) then
    raise exception 'Recall steps differ from generated content';
  end if;

  if v.status='draft' then
    update public.content_versions set status='published', reviewed_at='2026-10-27T00:00:00Z'::timestamptz,
      published_at=pg_catalog.clock_timestamp(), review_reference='{reference}' where id=v.id;
  end if;
end;
$publish$;
commit;
'''


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    payload = build_payload()
    outputs = {JSON_FILE: json.dumps(payload, ensure_ascii=False, indent=2) + '\n', SQL_FILE: build_sql(payload), RELEASE_FILE: build_release_sql(payload)}
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != content:
                raise SystemExit(f'Generated file differs: {path.relative_to(ROOT)}')
        else:
            path.write_text(content, encoding='utf-8')
    print('PASS: six source-traced recall steps, deterministic JSON, guarded draft and release migration')


if __name__ == '__main__':
    main()

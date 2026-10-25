-- Versioned FAQ and phase-checklist catalog metadata.
-- This migration creates root identities only; it imports no advice or versions.
begin;

-- Refuse ambiguous live state before changing the schema. The migration never
-- chooses which duplicate published version should remain active.
do $$
begin
  if exists (
    select 1
    from public.content_versions
    where status = 'published'
    group by content_id
    having count(*) > 1
  ) then
    raise exception 'Knowledge catalog migration stopped: duplicate published content versions exist';
  end if;

  if (select count(*) from public.checklist_templates) <> 6
    or exists (
      select 1 from public.checklist_templates
      where id not in (
        'review-v1:before-homecoming',
        'review-v1:first-days',
        'review-v1:8-12-weeks',
        'review-v1:3-6-months',
        'review-v1:6-12-months',
        'review-v1:over-1-year'
      )
    ) then
    raise exception 'Knowledge catalog migration stopped: checklist template set differs from the approved six-template mapping';
  end if;

  if exists (
    select 1 from public.content_items
    where slug in (
      'phase-before-homecoming',
      'phase-first-days',
      'phase-8-12-weeks',
      'phase-3-6-months',
      'phase-6-12-months',
      'phase-over-1-year'
    )
  ) then
    raise exception 'Knowledge catalog migration stopped: a reserved phase content slug already exists';
  end if;
end;
$$;

alter table public.content_items
  drop constraint if exists content_items_content_type_check;
alter table public.content_items
  add constraint content_items_content_type_check
  check (content_type in ('article', 'guide', 'checklist', 'training_program', 'faq'));

alter table public.content_versions
  add column context text,
  add constraint content_versions_context_check
    check (context is null or context in ('before_homecoming', 'first_days', 'by_age'));

alter table public.checklist_templates
  add column context text,
  add column content_item_id uuid;

insert into public.content_items(slug, content_type) values
  ('phase-before-homecoming', 'checklist'),
  ('phase-first-days', 'checklist'),
  ('phase-8-12-weeks', 'checklist'),
  ('phase-3-6-months', 'checklist'),
  ('phase-6-12-months', 'checklist'),
  ('phase-over-1-year', 'checklist');

create function private.protect_checklist_template_identity() returns trigger
language plpgsql set search_path = '' as $$
declare mapped_content_type text;
begin
  if tg_op = 'DELETE' then
    raise exception 'Checklist template identity cannot be deleted' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and (
    (old.context is not null and new.context is distinct from old.context)
    or (old.content_item_id is not null and new.content_item_id is distinct from old.content_item_id)
  ) then
    raise exception 'Checklist template context and content mapping are immutable' using errcode = '23514';
  end if;

  if new.context is null or new.context not in ('before_homecoming', 'first_days', 'by_age') then
    raise exception 'Checklist template requires a supported context' using errcode = '23514';
  end if;

  if new.content_item_id is not null then
    select i.content_type into mapped_content_type
    from public.content_items i
    where i.id = new.content_item_id
    for update;

    if not found or mapped_content_type <> 'checklist' then
      raise exception 'Checklist template must map to an existing checklist content item' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_checklist_template_identity
before insert or update or delete on public.checklist_templates
for each row execute function private.protect_checklist_template_identity();

update public.checklist_templates t
set context = mapping.context,
    content_item_id = i.id
from (
  values
    ('review-v1:before-homecoming', 'before_homecoming', 'phase-before-homecoming'),
    ('review-v1:first-days', 'first_days', 'phase-first-days'),
    ('review-v1:8-12-weeks', 'by_age', 'phase-8-12-weeks'),
    ('review-v1:3-6-months', 'by_age', 'phase-3-6-months'),
    ('review-v1:6-12-months', 'by_age', 'phase-6-12-months'),
    ('review-v1:over-1-year', 'by_age', 'phase-over-1-year')
) as mapping(template_id, context, slug)
join public.content_items i on i.slug = mapping.slug and i.content_type = 'checklist'
where t.id = mapping.template_id;

do $$
begin
  if (select count(*) from public.checklist_templates where content_item_id is not null) <> 6
    or exists (
      select 1 from public.checklist_templates
      where context is null or content_item_id is null
    ) then
    raise exception 'Knowledge catalog migration stopped: phase root mapping was incomplete';
  end if;
end;
$$;

alter table public.checklist_templates
  alter column context set not null,
  add constraint checklist_templates_context_check
    check (context in ('before_homecoming', 'first_days', 'by_age')),
  add constraint checklist_templates_content_item_id_key unique (content_item_id),
  add constraint checklist_templates_content_item_id_fkey
    foreign key (content_item_id) references public.content_items(id) on delete restrict;

create table public.content_version_checklist_items (
  content_version_id uuid not null references public.content_versions(id) on delete cascade,
  template_id text not null,
  item_key text not null,
  position integer not null check (position > 0),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  primary key (content_version_id, item_key),
  unique (content_version_id, position),
  foreign key (template_id, item_key)
    references public.checklist_template_items(template_id, item_key) on delete restrict
);

create index content_version_checklist_items_template
  on public.content_version_checklist_items(template_id, content_version_id);

create or replace function private.protect_content_type() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.content_type is distinct from old.content_type and (
    exists(select 1 from public.content_versions where content_id = old.id)
    or exists(select 1 from public.checklist_templates where content_item_id = old.id)
  ) then
    raise exception 'Content type cannot change after versions or checklist mappings exist' using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.validate_content_version_context() returns trigger
language plpgsql set search_path = '' as $$
declare
  mapped_template_id text;
  mapped_context text;
  mapped_content_type text;
begin
  -- Lock in the approved order: template mapping first, then content item.
  select t.id, t.context into mapped_template_id, mapped_context
  from public.checklist_templates t
  where t.content_item_id = new.content_id
  for update;

  select i.content_type into mapped_content_type
  from public.content_items i
  where i.id = new.content_id
  for update;

  if not found then
    raise exception 'Content version requires an existing content item' using errcode = '23503';
  end if;

  if mapped_content_type = 'faq' then
    if new.context is null then
      raise exception 'FAQ content version requires a context' using errcode = '23514';
    end if;
  elsif mapped_content_type = 'checklist' and mapped_template_id is not null then
    if new.context is distinct from mapped_context then
      raise exception 'Phase checklist context must match its template mapping' using errcode = '23514';
    end if;
  elsif new.context is not null then
    raise exception 'Context is only valid for FAQ and mapped phase checklist versions' using errcode = '23514';
  end if;

  return new;
end;
$$;

create function private.protect_checklist_version_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.content_id is distinct from old.content_id or new.version is distinct from old.version)
    and exists (
      select 1 from public.content_version_checklist_items i
      where i.content_version_id = old.id
    ) then
    raise exception 'Checklist version identity cannot change after child rows exist' using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.validate_checklist_version_publish() returns trigger
language plpgsql set search_path = '' as $$
declare
  mapped_template_id text;
  mapped_context text;
  mapped_item_id uuid;
  item_type text;
  expected_count integer;
  actual_count integer;
begin
  if new.status <> 'published' then
    return new;
  end if;

  select t.id, t.context, t.content_item_id
  into mapped_template_id, mapped_context, mapped_item_id
  from public.checklist_templates t
  where t.content_item_id = new.content_id
  for update;

  select i.content_type into item_type
  from public.content_items i
  where i.id = new.content_id
  for update;

  if not found then
    raise exception 'Published content version requires an existing content item' using errcode = '23503';
  end if;

  if item_type <> 'checklist' or mapped_template_id is null then
    return new;
  end if;

  if new.context is distinct from mapped_context or mapped_item_id is distinct from new.content_id then
    raise exception 'Published phase checklist context and parent mapping must match' using errcode = '23514';
  end if;

  select count(*) into expected_count
  from public.checklist_template_items k
  where k.template_id = mapped_template_id;

  select count(*) into actual_count
  from public.content_version_checklist_items c
  where c.content_version_id = new.id and c.template_id = mapped_template_id;

  if expected_count = 0 or actual_count <> expected_count or exists (
    select 1
    from public.checklist_template_items k
    where k.template_id = mapped_template_id
      and not exists (
        select 1 from public.content_version_checklist_items c
        where c.content_version_id = new.id
          and c.template_id = mapped_template_id
          and c.item_key = k.item_key
      )
  ) then
    raise exception 'Published phase checklist must contain every stable template item exactly once' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.content_version_checklist_items c
    where c.content_version_id = new.id
      and c.template_id <> mapped_template_id
  ) then
    raise exception 'Published phase checklist contains an item from another template' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger a_validate_content_version_context
before insert or update on public.content_versions
for each row execute function private.validate_content_version_context();

create trigger b_protect_checklist_version_identity
before update on public.content_versions
for each row execute function private.protect_checklist_version_identity();

create trigger c_validate_checklist_version_publish
before insert or update on public.content_versions
for each row execute function private.validate_checklist_version_publish();

create function private.protect_content_version_checklist_item() returns trigger
language plpgsql set search_path = '' as $$
declare
  old_version uuid;
  new_version uuid;
  parent_id uuid;
  parent_content_id uuid;
  parent_context text;
  mapped_template_id text;
  mapped_context text;
  mapped_content_item_id uuid;
  mapped_content_type text;
begin
  if tg_op <> 'INSERT' then old_version := old.content_version_id; end if;
  if tg_op <> 'DELETE' then new_version := new.content_version_id; end if;

  -- Serialize child changes with publication/withdrawal using the parent first.
  for parent_id in
    select v.id from public.content_versions v
    where v.id in (old_version, new_version)
    order by v.id
    for update
  loop
    if exists (
      select 1 from public.content_versions v
      where v.id = parent_id and v.status in ('published', 'withdrawn')
    ) then
      raise exception 'Published checklist child rows are immutable' using errcode = '23514';
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;

  select t.id, t.context, t.content_item_id
  into mapped_template_id, mapped_context, mapped_content_item_id
  from public.checklist_templates t
  where t.id = new.template_id
  for update;

  if not found then
    raise exception 'Checklist child requires an existing template' using errcode = '23503';
  end if;

  select i.content_type into mapped_content_type
  from public.content_items i
  where i.id = mapped_content_item_id
  for update;

  if not found or mapped_content_type <> 'checklist' then
    raise exception 'Checklist child requires a mapped checklist content item' using errcode = '23514';
  end if;

  select v.content_id, v.context into parent_content_id, parent_context
  from public.content_versions v
  where v.id = new.content_version_id;

  if not found
    or parent_content_id is distinct from mapped_content_item_id
    or parent_context is distinct from mapped_context then
    raise exception 'Checklist child parent, template and context must match' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger protect_content_version_checklist_item
before insert or update or delete on public.content_version_checklist_items
for each row execute function private.protect_content_version_checklist_item();

create unique index content_versions_one_published_per_item
  on public.content_versions(content_id)
  where status = 'published';

alter table public.content_version_checklist_items enable row level security;
create policy checklist_template_published_mapping_read
  on public.checklist_templates for select to authenticated
  using (
    content_item_id is not null
    and exists (
      select 1 from public.content_versions v
      where v.content_id = checklist_templates.content_item_id
        and v.status = 'published'
    )
  );
create policy content_version_checklist_items_published_read
  on public.content_version_checklist_items for select to authenticated
  using (
    exists (
      select 1 from public.content_versions v
      where v.id = content_version_checklist_items.content_version_id
        and v.status = 'published'
    )
  );

revoke all on table public.content_version_checklist_items from public, anon, authenticated, service_role;
grant select on table public.checklist_templates, public.content_version_checklist_items to authenticated;

revoke all on function private.protect_checklist_template_identity(),
  private.validate_content_version_context(),
  private.protect_checklist_version_identity(),
  private.validate_checklist_version_publish(),
  private.protect_content_version_checklist_item()
  from public, anon, authenticated, service_role;

commit;

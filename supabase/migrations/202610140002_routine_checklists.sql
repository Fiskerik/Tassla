-- Add named, independently editable routines, frozen daily copies, and recurrence.
-- Apply only in the disposable/development project after static Security review.
begin;

lock table public.dog_daily_routines, public.dog_daily_routine_days in access exclusive mode;
drop trigger guard_daily_routine on public.dog_daily_routines;
drop trigger guard_daily_routine_day on public.dog_daily_routine_days;

alter table public.dog_daily_routines
  add column checklist jsonb,
  add column checklist_revision integer,
  add column legacy_single_item boolean,
  add column repeat_unit text,
  add column repeat_interval integer,
  add column repeat_anchor_date date;
alter table public.dog_daily_routine_days
  add column routine_label_snapshot text,
  add column checklist_snapshot jsonb,
  add column completed_item_ids jsonb,
  add column is_recurring_occurrence boolean not null default false,
  add column routine_revision_snapshot integer,
  add column routine_day_revision integer not null default 1,
  add column last_state_mutation_id uuid;

-- Existing single-label routines become one stable checklist item whose UUID is
-- the routine UUID. Existing selected days receive an exact frozen copy.
update public.dog_daily_routines r
set checklist = pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('id', r.id::text, 'label', r.label)),
    checklist_revision = 1,
    legacy_single_item = true;

update public.dog_daily_routine_days d
set routine_label_snapshot = r.label,
    checklist_snapshot = r.checklist,
    completed_item_ids = case when d.completed_at is null then '[]'::jsonb else pg_catalog.jsonb_build_array(r.id::text) end,
    routine_revision_snapshot = r.checklist_revision
from public.dog_daily_routines r
where r.dog_id = d.dog_id and r.id = d.routine_id;

alter table public.dog_daily_routines
  alter column checklist set default '[]'::jsonb,
  alter column checklist set not null,
  alter column checklist_revision set default 1,
  alter column checklist_revision set not null,
  alter column legacy_single_item set default true,
  alter column legacy_single_item set not null,
  add constraint dog_daily_routines_checklist_array check (pg_catalog.jsonb_typeof(checklist) = 'array'),
  add constraint dog_daily_routines_revision_positive check (checklist_revision > 0),
  add constraint dog_daily_routines_repeat_valid check (
    (repeat_unit is null and repeat_interval is null and repeat_anchor_date is null)
    or (repeat_unit is not null and repeat_unit in ('day', 'week', 'month')
      and repeat_interval is not null and repeat_interval between 1 and 30 and repeat_anchor_date is not null)
  );
alter table public.dog_daily_routine_days
  alter column routine_label_snapshot set not null,
  alter column checklist_snapshot set default '[]'::jsonb,
  alter column checklist_snapshot set not null,
  alter column completed_item_ids set default '[]'::jsonb,
  alter column completed_item_ids set not null,
  alter column routine_revision_snapshot set not null,
  add constraint dog_daily_routine_days_checklist_array check (pg_catalog.jsonb_typeof(checklist_snapshot) = 'array'),
  add constraint dog_daily_routine_days_completed_array check (pg_catalog.jsonb_typeof(completed_item_ids) = 'array'),
  add constraint dog_daily_routine_days_revision_positive check (routine_revision_snapshot > 0 and routine_day_revision > 0);

create table public.dog_daily_routine_day_skips (
  day_id uuid not null unique,
  dog_id uuid not null,
  routine_id uuid not null,
  date_key date not null,
  time_zone text not null check (pg_catalog.char_length(time_zone) between 1 and 100),
  routine_label_snapshot text not null,
  checklist_snapshot jsonb not null check (pg_catalog.jsonb_typeof(checklist_snapshot) = 'array'),
  completed_item_ids jsonb not null check (pg_catalog.jsonb_typeof(completed_item_ids) = 'array'),
  completed_at timestamptz,
  is_recurring_occurrence boolean not null,
  routine_revision_snapshot integer not null check (routine_revision_snapshot > 0),
  routine_day_revision integer not null check (routine_day_revision > 1),
  last_state_mutation_id uuid not null,
  primary key (dog_id, routine_id, date_key),
  foreign key (dog_id, routine_id) references public.dog_daily_routines(dog_id, id) on delete cascade
);
create index dog_daily_routine_day_skips_date on public.dog_daily_routine_day_skips(dog_id, date_key);
alter table public.dog_daily_routine_day_skips enable row level security;
revoke all on table public.dog_daily_routine_day_skips from public, anon, authenticated;
grant all on table public.dog_daily_routine_day_skips to service_role;
grant select on table public.dog_daily_routine_day_skips to authenticated;
create policy daily_routine_day_skips_owner on public.dog_daily_routine_day_skips for select to authenticated
  using (private.owns_dog(dog_id));

create function private.valid_daily_routine_checklist(p_checklist jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_item jsonb;
  v_id text;
  v_label text;
  v_seen text[] := '{}'::text[];
  v_count integer;
begin
  if p_checklist is null or pg_catalog.jsonb_typeof(p_checklist) <> 'array' then return false; end if;
  v_count := pg_catalog.jsonb_array_length(p_checklist);
  if v_count < 1 or v_count > 50 then return false; end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_checklist) as entries(value) loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object' or pg_catalog.jsonb_object_length(v_item) <> 2
      or not (v_item ? 'id') or not (v_item ? 'label')
      or pg_catalog.jsonb_typeof(v_item -> 'id') <> 'string'
      or pg_catalog.jsonb_typeof(v_item -> 'label') <> 'string' then return false; end if;
    v_id := v_item ->> 'id';
    v_label := v_item ->> 'label';
    if v_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or pg_catalog.char_length(v_label) not between 1 and 160
      or v_label <> pg_catalog.btrim(v_label)
      or v_id = any(v_seen) then return false; end if;
    v_seen := pg_catalog.array_append(v_seen, v_id);
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_daily_routine_checklist(jsonb) from public, anon, authenticated;

create function private.valid_daily_routine_repeat(p_unit text, p_interval integer) returns boolean
language sql immutable set search_path = '' as $$
  select case when p_unit is null then p_interval is null
    else p_unit in ('day', 'week', 'month') and p_interval is not null and p_interval between 1 and 30 end
$$;
revoke all on function private.valid_daily_routine_repeat(text, integer) from public, anon, authenticated;

create function private.is_daily_routine_due(p_date date, p_unit text, p_interval integer, p_anchor date) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_elapsed integer;
  v_months integer;
  v_anchor_day integer;
  v_last_day integer;
begin
  if p_date is null or p_anchor is null or p_date < p_anchor
    or not private.valid_daily_routine_repeat(p_unit, p_interval) or p_unit is null then return false; end if;
  if p_unit = 'day' then
    v_elapsed := p_date - p_anchor;
    return mod(v_elapsed, p_interval) = 0;
  end if;
  if p_unit = 'week' then
    v_elapsed := p_date - p_anchor;
    return mod(v_elapsed, p_interval * 7) = 0;
  end if;
  v_months := (extract(year from p_date)::integer - extract(year from p_anchor)::integer) * 12
    + extract(month from p_date)::integer - extract(month from p_anchor)::integer;
  if v_months < 0 or mod(v_months, p_interval) <> 0 then return false; end if;
  v_anchor_day := extract(day from p_anchor)::integer;
  v_last_day := extract(day from (pg_catalog.date_trunc('month', p_date::timestamp)
    + interval '1 month' - interval '1 day'))::integer;
  return extract(day from p_date)::integer = least(v_anchor_day, v_last_day);
end;
$$;
revoke all on function private.is_daily_routine_due(date, text, integer, date) from public, anon, authenticated;

create function private.guard_daily_routine_checklist() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_legacy_label text;
begin
  if tg_op = 'UPDATE' and (new.id is distinct from old.id or new.dog_id is distinct from old.dog_id) then
    raise exception using errcode = '22023', message = 'Daily routine scope is immutable';
  end if;
  if not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  new.label := pg_catalog.btrim(new.label);
  if pg_catalog.char_length(new.label) not between 1 and 160 then
    raise exception using errcode = '22023', message = 'Routine label must contain 1 to 160 characters';
  end if;

  if tg_op = 'INSERT' then
    if new.checklist is null or new.checklist = '[]'::jsonb then
      new.checklist := pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('id', new.id::text, 'label', new.label));
      new.legacy_single_item := true;
    else
      if not private.valid_daily_routine_checklist(new.checklist) then
        raise exception using errcode = '22023', message = 'Routine checklist is invalid';
      end if;
      new.legacy_single_item := false;
    end if;
    if not private.valid_daily_routine_repeat(new.repeat_unit, new.repeat_interval)
      or (new.repeat_unit is null and new.repeat_anchor_date is not null)
      or (new.repeat_unit is not null and new.repeat_anchor_date is null) then
      raise exception using errcode = '22023', message = 'Routine repeat rule is invalid';
    end if;
    new.checklist_revision := 1;
    return new;
  end if;

  if new.checklist_revision = old.checklist_revision then
    if new.checklist is distinct from old.checklist or new.legacy_single_item is distinct from old.legacy_single_item
      or new.repeat_unit is distinct from old.repeat_unit or new.repeat_interval is distinct from old.repeat_interval
      or new.repeat_anchor_date is distinct from old.repeat_anchor_date then
      raise exception using errcode = '22023', message = 'Routine checklist revision is server controlled';
    end if;
    if new.label is not distinct from old.label then return new; end if;
    if old.legacy_single_item then
      v_legacy_label := new.label;
      new.checklist := pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('id', old.id::text, 'label', v_legacy_label));
    end if;
    new.checklist_revision := old.checklist_revision + 1;
    return new;
  end if;

  if new.checklist_revision <> old.checklist_revision + 1 or new.legacy_single_item
    or not private.valid_daily_routine_repeat(new.repeat_unit, new.repeat_interval)
    or (new.repeat_unit is null and new.repeat_anchor_date is not null)
    or (new.repeat_unit is not null and new.repeat_anchor_date is null) then
    raise exception using errcode = '22023', message = 'Routine replacement revision is invalid';
  end if;
  if not private.valid_daily_routine_checklist(new.checklist) then
    raise exception using errcode = '22023', message = 'Routine checklist is invalid';
  end if;
  return new;
end;
$$;
create trigger guard_daily_routine before insert or update on public.dog_daily_routines
for each row execute function private.guard_daily_routine_checklist();
revoke all on function private.guard_daily_routine_checklist() from public, anon, authenticated;

create function public.create_daily_routine(
  p_dog_id uuid,
  p_routine_id uuid,
  p_label text,
  p_checklist jsonb,
  p_repeat_unit text,
  p_repeat_interval integer,
  p_time_zone text
) returns public.dog_daily_routines
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.dog_daily_routines%rowtype;
  v_saved public.dog_daily_routines%rowtype;
  v_label text;
  v_anchor date;
begin
  if p_dog_id is null or p_routine_id is null or p_time_zone is null
    or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = '22023', message = 'Routine creation scope is invalid';
  end if;
  if not private.owns_dog(p_dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  select r.* into v_current from public.dog_daily_routines r
    where r.dog_id = p_dog_id and r.id = p_routine_id for update;
  v_label := pg_catalog.btrim(p_label);
  if found then
    if v_current.label = v_label and v_current.checklist = p_checklist
      and v_current.repeat_unit is not distinct from p_repeat_unit
      and v_current.repeat_interval is not distinct from p_repeat_interval then
      return v_current;
    end if;
    raise exception using errcode = '23505', message = 'Routine ID is already used by a different routine';
  end if;
  if v_label is null or pg_catalog.char_length(v_label) not between 1 and 160
    or not private.valid_daily_routine_checklist(p_checklist)
    or not private.valid_daily_routine_repeat(p_repeat_unit, p_repeat_interval) then
    raise exception using errcode = '22023', message = 'Routine name, checklist, or repeat rule is invalid';
  end if;
  if p_repeat_unit is not null then
    v_anchor := (pg_catalog.clock_timestamp() at time zone p_time_zone)::date;
  end if;
  insert into public.dog_daily_routines(id, dog_id, label, checklist, checklist_revision, legacy_single_item,
    repeat_unit, repeat_interval, repeat_anchor_date)
  values (p_routine_id, p_dog_id, v_label, p_checklist, 1, false, p_repeat_unit, p_repeat_interval, v_anchor)
  returning * into v_saved;
  return v_saved;
end;
$$;
revoke all on function public.create_daily_routine(uuid, uuid, text, jsonb, text, integer, text) from public, anon;
grant execute on function public.create_daily_routine(uuid, uuid, text, jsonb, text, integer, text) to authenticated;

create function public.replace_daily_routine(
  p_dog_id uuid,
  p_routine_id uuid,
  p_expected_revision integer,
  p_label text,
  p_checklist jsonb,
  p_repeat_unit text,
  p_repeat_interval integer,
  p_time_zone text
) returns public.dog_daily_routines
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.dog_daily_routines%rowtype;
  v_saved public.dog_daily_routines%rowtype;
  v_label text;
  v_anchor date;
begin
  if p_dog_id is null or p_routine_id is null or p_expected_revision is null or p_expected_revision < 1
    or p_time_zone is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = '22023', message = 'Routine replacement scope is invalid';
  end if;
  if not private.owns_dog(p_dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  select r.* into v_current from public.dog_daily_routines r
    where r.dog_id = p_dog_id and r.id = p_routine_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Routine is unavailable'; end if;
  v_label := pg_catalog.btrim(p_label);
  if v_label is null or pg_catalog.char_length(v_label) not between 1 and 160
    or not private.valid_daily_routine_checklist(p_checklist)
    or not private.valid_daily_routine_repeat(p_repeat_unit, p_repeat_interval) then
    raise exception using errcode = '22023', message = 'Routine name, checklist, or repeat rule is invalid';
  end if;
  -- A retry after a committed CAS must return the original anchor, even after midnight.
  if v_current.checklist_revision = p_expected_revision + 1 and v_current.label = v_label
    and v_current.checklist = p_checklist and v_current.repeat_unit is not distinct from p_repeat_unit
    and v_current.repeat_interval is not distinct from p_repeat_interval then
    return v_current;
  end if;
  if v_current.checklist_revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Routine changed before replacement';
  end if;
  if p_repeat_unit is not null then
    if v_current.repeat_unit is not distinct from p_repeat_unit
      and v_current.repeat_interval is not distinct from p_repeat_interval then
      v_anchor := v_current.repeat_anchor_date;
    else
      v_anchor := (pg_catalog.clock_timestamp() at time zone p_time_zone)::date;
    end if;
  end if;
  update public.dog_daily_routines r
    set label = v_label,
        checklist = p_checklist,
        legacy_single_item = false,
        repeat_unit = p_repeat_unit,
        repeat_interval = p_repeat_interval,
        repeat_anchor_date = v_anchor,
        checklist_revision = v_current.checklist_revision + 1
    where r.dog_id = p_dog_id and r.id = p_routine_id and r.checklist_revision = p_expected_revision
    returning r.* into v_saved;
  if not found then raise exception using errcode = '40001', message = 'Routine changed before replacement'; end if;
  return v_saved;
end;
$$;
revoke all on function public.replace_daily_routine(uuid, uuid, integer, text, jsonb, text, integer, text) from public, anon;
grant execute on function public.replace_daily_routine(uuid, uuid, integer, text, jsonb, text, integer, text) to authenticated;

create function private.guard_daily_routine_checklist_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_routine public.dog_daily_routines%rowtype;
  v_skip public.dog_daily_routine_day_skips%rowtype;
  v_mutation_text text;
  v_mutation_id uuid;
  v_ids_changed boolean;
  v_at_changed boolean;
  v_item_id text;
  v_requested text[] := '{}'::text[];
  v_snapshot_count integer;
  v_completed_count integer;
  v_canonical jsonb;
begin
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id or new.dog_id is distinct from old.dog_id
    or new.routine_id is distinct from old.routine_id or new.date_key is distinct from old.date_key
    or new.time_zone is distinct from old.time_zone
    or new.routine_label_snapshot is distinct from old.routine_label_snapshot
    or new.checklist_snapshot is distinct from old.checklist_snapshot
    or new.is_recurring_occurrence is distinct from old.is_recurring_occurrence
    or new.routine_revision_snapshot is distinct from old.routine_revision_snapshot
    or new.routine_day_revision is distinct from old.routine_day_revision
    or new.last_state_mutation_id is distinct from old.last_state_mutation_id
  ) then
    raise exception using errcode = '22023', message = 'Daily routine selection snapshot is immutable';
  end if;
  if not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = new.time_zone) then
    raise exception using errcode = '22023', message = 'Expected an IANA time zone';
  end if;

  if tg_op = 'INSERT' then
    select r.* into v_routine from public.dog_daily_routines r
      where r.id = new.routine_id and r.dog_id = new.dog_id for update;
    if not found then raise exception using errcode = '23503', message = 'Routine does not belong to this dog'; end if;
    v_now := pg_catalog.clock_timestamp();
    if new.date_key <> (v_now at time zone new.time_zone)::date then
      raise exception using errcode = '22023', message = 'Daily selection date is no longer today';
    end if;
    select s.* into v_skip from public.dog_daily_routine_day_skips s
      where s.dog_id = new.dog_id and s.routine_id = new.routine_id and s.date_key = new.date_key for update;
    if found then
      if v_skip.date_key <> (v_now at time zone v_skip.time_zone)::date then
        raise exception using errcode = '22023', message = 'Skipped routine date is no longer today';
      end if;
      v_mutation_text := nullif(pg_catalog.current_setting('tassla.daily_routine_skip_mutation_id', true), '');
      v_mutation_id := case when v_mutation_text is null then gen_random_uuid() else v_mutation_text::uuid end;
      new.id := v_skip.day_id;
      new.time_zone := v_skip.time_zone;
      new.routine_label_snapshot := v_skip.routine_label_snapshot;
      new.checklist_snapshot := v_skip.checklist_snapshot;
      new.completed_item_ids := v_skip.completed_item_ids;
      new.completed_at := v_skip.completed_at;
      new.is_recurring_occurrence := v_skip.is_recurring_occurrence;
      new.routine_revision_snapshot := v_skip.routine_revision_snapshot;
      new.routine_day_revision := v_skip.routine_day_revision + 1;
      new.last_state_mutation_id := v_mutation_id;
      delete from public.dog_daily_routine_day_skips s
        where s.dog_id = v_skip.dog_id and s.routine_id = v_skip.routine_id and s.date_key = v_skip.date_key;
      return new;
    end if;
    if new.completed_at is not null then
      raise exception using errcode = '22023', message = 'Routine completion is server controlled';
    end if;
    new.routine_label_snapshot := v_routine.label;
    new.checklist_snapshot := v_routine.checklist;
    new.completed_item_ids := '[]'::jsonb;
    new.completed_at := null;
    new.is_recurring_occurrence := private.is_daily_routine_due(new.date_key, v_routine.repeat_unit,
      v_routine.repeat_interval, v_routine.repeat_anchor_date);
    new.routine_revision_snapshot := v_routine.checklist_revision;
    new.routine_day_revision := 1;
    new.last_state_mutation_id := null;
    return new;
  end if;

  select r.* into v_routine from public.dog_daily_routines r
    where r.id = new.routine_id and r.dog_id = new.dog_id for update;
  if not found then raise exception using errcode = '23503', message = 'Routine does not belong to this dog'; end if;

  v_ids_changed := new.completed_item_ids is distinct from old.completed_item_ids;
  v_at_changed := new.completed_at is distinct from old.completed_at;
  if v_ids_changed and v_at_changed then
    raise exception using errcode = '22023', message = 'Update either checklist completion IDs or legacy completion timestamp';
  end if;
  if not v_ids_changed and not v_at_changed then return new; end if;
  v_now := pg_catalog.clock_timestamp();
  if new.date_key <> (v_now at time zone new.time_zone)::date then
    raise exception using errcode = '22023', message = 'Only today can be marked or undone';
  end if;

  v_snapshot_count := pg_catalog.jsonb_array_length(old.checklist_snapshot);
  if v_ids_changed then
    if pg_catalog.jsonb_typeof(new.completed_item_ids) <> 'array' then
      raise exception using errcode = '22023', message = 'Completion IDs must be an array';
    end if;
    for v_item_id in select value from pg_catalog.jsonb_array_elements_text(new.completed_item_ids) as entries(value) loop
      if v_item_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or not exists (select 1 from pg_catalog.jsonb_array_elements(old.checklist_snapshot) as points(item) where points.item ->> 'id' = v_item_id)
        or v_item_id = any(v_requested) then
        raise exception using errcode = '22023', message = 'Completion ID is invalid or repeated';
      end if;
      v_requested := pg_catalog.array_append(v_requested, v_item_id);
    end loop;
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(points.item ->> 'id') order by points.ordinality), '[]'::jsonb)
      into v_canonical
      from pg_catalog.jsonb_array_elements(old.checklist_snapshot) with ordinality as points(item, ordinality)
      where points.item ->> 'id' = any(v_requested);
    new.completed_item_ids := v_canonical;
    v_completed_count := pg_catalog.cardinality(v_requested);
    if v_completed_count = v_snapshot_count then
      new.completed_at := coalesce(old.completed_at, v_now);
    else
      new.completed_at := null;
    end if;
    return new;
  end if;

  -- Old binaries toggle only completed_at. Convert their intent to the new ID set.
  if old.completed_at is null and new.completed_at is not null then
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(points.item ->> 'id') order by points.ordinality), '[]'::jsonb)
      into new.completed_item_ids
      from pg_catalog.jsonb_array_elements(old.checklist_snapshot) with ordinality as points(item, ordinality);
    new.completed_at := v_now;
    return new;
  end if;
  if old.completed_at is not null and new.completed_at is null then
    new.completed_item_ids := '[]'::jsonb;
    return new;
  end if;
  raise exception using errcode = '22023', message = 'Invalid legacy completion transition';
end;
$$;
create trigger guard_daily_routine_day before insert or update on public.dog_daily_routine_days
for each row execute function private.guard_daily_routine_checklist_day();
revoke all on function private.guard_daily_routine_checklist_day() from public, anon, authenticated;

create function private.preserve_skipped_daily_routine_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_routine public.dog_daily_routines%rowtype;
  v_mutation_text text;
  v_mutation_id uuid;
begin
  -- FK cascades and expiry purge remove data; neither is a user skip action.
  if pg_catalog.pg_trigger_depth() > 1 then return old; end if;
  if not private.owns_dog(old.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = old.dog_id for update;
  select r.* into v_routine from public.dog_daily_routines r
    where r.id = old.routine_id and r.dog_id = old.dog_id for update;
  if not found then return old; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = old.time_zone) then
    raise exception using errcode = '22023', message = 'Expected an IANA time zone';
  end if;
  v_now := pg_catalog.clock_timestamp();
  if old.date_key > (v_now at time zone old.time_zone)::date - 30
    and (old.is_recurring_occurrence or private.is_daily_routine_due(old.date_key, v_routine.repeat_unit,
      v_routine.repeat_interval, v_routine.repeat_anchor_date)) then
    v_mutation_text := nullif(pg_catalog.current_setting('tassla.daily_routine_skip_mutation_id', true), '');
    v_mutation_id := case when v_mutation_text is null then gen_random_uuid() else v_mutation_text::uuid end;
    insert into public.dog_daily_routine_day_skips(
      day_id, dog_id, routine_id, date_key, time_zone, routine_label_snapshot, checklist_snapshot,
      completed_item_ids, completed_at, is_recurring_occurrence, routine_revision_snapshot,
      routine_day_revision, last_state_mutation_id
    ) values (
      old.id, old.dog_id, old.routine_id, old.date_key, old.time_zone, old.routine_label_snapshot,
      old.checklist_snapshot, old.completed_item_ids, old.completed_at, old.is_recurring_occurrence,
      old.routine_revision_snapshot, old.routine_day_revision + 1, v_mutation_id
    );
  end if;
  return old;
end;
$$;
create trigger preserve_skipped_daily_routine_day before delete on public.dog_daily_routine_days
for each row execute function private.preserve_skipped_daily_routine_day();
revoke all on function private.preserve_skipped_daily_routine_day() from public, anon, authenticated;

create function public.ensure_due_daily_routine_days(
  p_dog_id uuid,
  p_date_key date,
  p_time_zone text
) returns setof public.dog_daily_routine_days
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_routine public.dog_daily_routines%rowtype;
begin
  if p_dog_id is null or p_date_key is null or p_time_zone is null
    or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = '22023', message = 'Daily routine date or time zone is invalid';
  end if;
  if not private.owns_dog(p_dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  v_now := pg_catalog.clock_timestamp();
  if p_date_key <> (v_now at time zone p_time_zone)::date then
    raise exception using errcode = '22023', message = 'Only the current local date can be prepared';
  end if;
  for v_routine in select r.* from public.dog_daily_routines r
    where r.dog_id = p_dog_id order by r.id for update
  loop
    if private.is_daily_routine_due(p_date_key, v_routine.repeat_unit, v_routine.repeat_interval, v_routine.repeat_anchor_date)
      and not exists (select 1 from public.dog_daily_routine_day_skips s
        where s.dog_id = p_dog_id and s.routine_id = v_routine.id and s.date_key = p_date_key) then
      insert into public.dog_daily_routine_days(id, dog_id, routine_id, date_key, time_zone)
      values (gen_random_uuid(), p_dog_id, v_routine.id, p_date_key, p_time_zone)
      on conflict (dog_id, routine_id, date_key) do nothing;
    end if;
  end loop;
  return query select d.* from public.dog_daily_routine_days d
    where d.dog_id = p_dog_id and d.date_key = p_date_key order by d.id;
end;
$$;
revoke all on function public.ensure_due_daily_routine_days(uuid, date, text) from public, anon;
grant execute on function public.ensure_due_daily_routine_days(uuid, date, text) to authenticated;

create function public.set_daily_routine_day_skipped(
  p_dog_id uuid,
  p_routine_id uuid,
  p_date_key date,
  p_time_zone text,
  p_expected_revision integer,
  p_mutation_id uuid,
  p_skipped boolean
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_routine public.dog_daily_routines%rowtype;
  v_day public.dog_daily_routine_days%rowtype;
  v_skip public.dog_daily_routine_day_skips%rowtype;
begin
  if p_dog_id is null or p_routine_id is null or p_date_key is null or p_time_zone is null
    or p_expected_revision is null or p_expected_revision < 1 or p_mutation_id is null or p_skipped is null
    or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = '22023', message = 'Routine day state is invalid';
  end if;
  if not private.owns_dog(p_dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  select r.* into v_routine from public.dog_daily_routines r
    where r.dog_id = p_dog_id and r.id = p_routine_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Routine is unavailable'; end if;
  v_now := pg_catalog.clock_timestamp();
  if p_date_key <> (v_now at time zone p_time_zone)::date then
    raise exception using errcode = '22023', message = 'Only the current local date can be skipped';
  end if;
  select d.* into v_day from public.dog_daily_routine_days d
    where d.dog_id = p_dog_id and d.routine_id = p_routine_id and d.date_key = p_date_key for update;
  select s.* into v_skip from public.dog_daily_routine_day_skips s
    where s.dog_id = p_dog_id and s.routine_id = p_routine_id and s.date_key = p_date_key for update;

  if p_skipped then
    if found and v_skip.last_state_mutation_id = p_mutation_id then return pg_catalog.to_jsonb(v_skip); end if;
    if v_day.id is null then raise exception using errcode = 'P0002', message = 'Routine day is unavailable'; end if;
    if v_day.time_zone is distinct from p_time_zone
      or p_date_key <> (v_now at time zone v_day.time_zone)::date then
      raise exception using errcode = '22023', message = 'Routine day is no longer current';
    end if;
    if v_day.routine_day_revision <> p_expected_revision then
      raise exception using errcode = '40001', message = 'Routine day changed before skip';
    end if;
    if not (v_day.is_recurring_occurrence or private.is_daily_routine_due(p_date_key, v_routine.repeat_unit,
      v_routine.repeat_interval, v_routine.repeat_anchor_date)) then
      raise exception using errcode = '22023', message = 'Only a recurring routine can be skipped';
    end if;
    perform pg_catalog.set_config('tassla.daily_routine_skip_mutation_id', p_mutation_id::text, true);
    delete from public.dog_daily_routine_days d
      where d.dog_id = p_dog_id and d.id = v_day.id and d.routine_id = p_routine_id
        and d.date_key = p_date_key and d.routine_day_revision = p_expected_revision;
    select s.* into v_skip from public.dog_daily_routine_day_skips s
      where s.dog_id = p_dog_id and s.routine_id = p_routine_id and s.date_key = p_date_key;
    if not found or v_skip.day_id <> v_day.id or v_skip.routine_day_revision <> p_expected_revision + 1
      or v_skip.last_state_mutation_id <> p_mutation_id then
      raise exception using errcode = '40001', message = 'Routine skip could not be confirmed';
    end if;
    return pg_catalog.to_jsonb(v_skip);
  end if;

  if v_day.id is not null and v_day.last_state_mutation_id = p_mutation_id then return pg_catalog.to_jsonb(v_day); end if;
  if v_skip.day_id is null then raise exception using errcode = 'P0002', message = 'Skipped routine is unavailable'; end if;
  if v_skip.time_zone is distinct from p_time_zone
    or p_date_key <> (v_now at time zone v_skip.time_zone)::date then
    raise exception using errcode = '22023', message = 'Skipped routine date is no longer current';
  end if;
  if v_skip.routine_day_revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Routine day changed before re-add';
  end if;
  perform pg_catalog.set_config('tassla.daily_routine_skip_mutation_id', p_mutation_id::text, true);
  insert into public.dog_daily_routine_days(id, dog_id, routine_id, date_key, time_zone)
    values (v_skip.day_id, p_dog_id, p_routine_id, p_date_key, v_skip.time_zone);
  select d.* into v_day from public.dog_daily_routine_days d
    where d.dog_id = p_dog_id and d.routine_id = p_routine_id and d.date_key = p_date_key;
  if not found or v_day.id <> v_skip.day_id or v_day.routine_day_revision <> p_expected_revision + 1
    or v_day.last_state_mutation_id <> p_mutation_id then
    raise exception using errcode = '40001', message = 'Routine re-add could not be confirmed';
  end if;
  return pg_catalog.to_jsonb(v_day);
end;
$$;
revoke all on function public.set_daily_routine_day_skipped(uuid, uuid, date, text, integer, uuid, boolean) from public, anon;
grant execute on function public.set_daily_routine_day_skipped(uuid, uuid, date, text, integer, uuid, boolean) to authenticated;

create or replace function private.purge_expired_daily_activity_selections() returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_deleted bigint := 0;
  v_count bigint := 0;
begin
  delete from public.dog_daily_routine_days r
  where r.date_key <= ((v_now at time zone r.time_zone)::date - 30);
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;
  delete from public.dog_daily_routine_day_skips s
  where s.date_key <= ((v_now at time zone s.time_zone)::date - 30);
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + v_count;
  delete from public.dog_daily_training_selections s
  where s.date_key <= ((v_now at time zone s.time_zone)::date - 30);
  get diagnostics v_count = row_count;
  return v_deleted + v_count;
end;
$$;
revoke all on function private.purge_expired_daily_activity_selections() from public, anon, authenticated;
grant execute on function private.purge_expired_daily_activity_selections() to service_role;

revoke all on table public.dog_daily_routines, public.dog_daily_routine_days from public, anon, authenticated;
grant select, delete on public.dog_daily_routines to authenticated;
grant insert (id, dog_id, label, checklist) on public.dog_daily_routines to authenticated;
grant update (label) on public.dog_daily_routines to authenticated;
grant select, delete on public.dog_daily_routine_days to authenticated;
grant insert (id, dog_id, routine_id, date_key, time_zone) on public.dog_daily_routine_days to authenticated;
grant update (completed_at, completed_item_ids) on public.dog_daily_routine_days to authenticated;

commit;

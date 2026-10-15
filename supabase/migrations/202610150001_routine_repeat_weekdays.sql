begin;

alter table public.dog_daily_routines add column repeat_weekdays smallint[];

create function private.valid_daily_routine_weekdays(p_unit text, p_weekdays smallint[]) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_day smallint;
  v_previous smallint := 0;
begin
  if p_weekdays is null then return true; end if;
  if p_unit is distinct from 'week' or coalesce(pg_catalog.array_ndims(p_weekdays), 0) <> 1
    or pg_catalog.array_lower(p_weekdays, 1) <> 1 or pg_catalog.cardinality(p_weekdays) not between 1 and 7 then return false; end if;
  foreach v_day in array p_weekdays loop
    if v_day is null or v_day not between 1 and 7 or v_day <= v_previous then return false; end if;
    v_previous := v_day;
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_daily_routine_weekdays(text, smallint[]) from public, anon, authenticated;

alter table public.dog_daily_routines add constraint dog_daily_routines_repeat_weekdays_valid
  check (private.valid_daily_routine_weekdays(repeat_unit, repeat_weekdays));

create function private.is_daily_routine_due(
  p_date date, p_unit text, p_interval integer, p_anchor date, p_weekdays smallint[]
) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_elapsed integer;
  v_months integer;
  v_anchor_day integer;
  v_last_day integer;
  v_anchor_week_start date;
  v_date_week_start date;
begin
  if p_date is null or p_anchor is null or p_date < p_anchor
    or not private.valid_daily_routine_repeat(p_unit, p_interval) or p_unit is null
    or not private.valid_daily_routine_weekdays(p_unit, p_weekdays) then return false; end if;
  if p_unit = 'day' then
    v_elapsed := p_date - p_anchor;
    return mod(v_elapsed, p_interval) = 0;
  end if;
  if p_unit = 'week' then
    v_elapsed := p_date - p_anchor;
    if p_weekdays is null then return mod(v_elapsed, p_interval * 7) = 0; end if;
    v_anchor_week_start := p_anchor - (extract(isodow from p_anchor)::integer - 1);
    v_date_week_start := p_date - (extract(isodow from p_date)::integer - 1);
    return mod((v_date_week_start - v_anchor_week_start) / 7, p_interval) = 0
      and extract(isodow from p_date)::smallint = any(p_weekdays);
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
revoke all on function private.is_daily_routine_due(date, text, integer, date, smallint[]) from public, anon, authenticated;

create function private.guard_daily_routine_weekdays() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  if not private.valid_daily_routine_weekdays(new.repeat_unit, new.repeat_weekdays) then
    raise exception using errcode = '22023', message = 'Routine weekdays are invalid';
  end if;
  if tg_op = 'UPDATE' and new.repeat_weekdays is distinct from old.repeat_weekdays
    and new.checklist_revision <> old.checklist_revision + 1 then
    raise exception using errcode = '22023', message = 'Routine weekdays are server controlled';
  end if;
  return new;
end;
$$;
create trigger zz_guard_daily_routine_weekdays before insert or update on public.dog_daily_routines
for each row execute function private.guard_daily_routine_weekdays();
revoke all on function private.guard_daily_routine_weekdays() from public, anon, authenticated;

create function private.apply_daily_routine_weekday_occurrence() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_routine public.dog_daily_routines%rowtype;
begin
  if not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  if new.last_state_mutation_id is not null then return new; end if;
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  select r.* into v_routine from public.dog_daily_routines r where r.id = new.routine_id and r.dog_id = new.dog_id;
  if not found then raise exception using errcode = '23503', message = 'Routine does not belong to this dog'; end if;
  new.is_recurring_occurrence := private.is_daily_routine_due(new.date_key, v_routine.repeat_unit,
    v_routine.repeat_interval, v_routine.repeat_anchor_date, v_routine.repeat_weekdays);
  return new;
end;
$$;
create trigger zz_apply_daily_routine_weekday_occurrence before insert on public.dog_daily_routine_days
for each row execute function private.apply_daily_routine_weekday_occurrence();
revoke all on function private.apply_daily_routine_weekday_occurrence() from public, anon, authenticated;

create function private.preserve_weekday_daily_routine_skip() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_routine public.dog_daily_routines%rowtype;
  v_mutation_text text;
  v_mutation_id uuid;
begin
  if pg_catalog.pg_trigger_depth() > 1 then return old; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = old.time_zone) then
    raise exception using errcode = '22023', message = 'Expected an IANA time zone';
  end if;
  v_now := pg_catalog.clock_timestamp();
  if old.date_key <= (v_now at time zone old.time_zone)::date - 30 then return old; end if;
  if not private.owns_dog(old.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  if exists (
    select 1 from public.dog_daily_routine_day_skips s
    where s.dog_id = old.dog_id and s.routine_id = old.routine_id and s.date_key = old.date_key
  ) then return old; end if;
  perform 1 from public.dogs d where d.id = old.dog_id for update;
  select r.* into v_routine from public.dog_daily_routines r where r.id = old.routine_id and r.dog_id = old.dog_id for update;
  if not found then return old; end if;
  if old.is_recurring_occurrence or private.is_daily_routine_due(old.date_key, v_routine.repeat_unit,
      v_routine.repeat_interval, v_routine.repeat_anchor_date, v_routine.repeat_weekdays) then
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
    ) on conflict (dog_id, routine_id, date_key) do nothing;
  end if;
  return old;
end;
$$;
drop trigger preserve_skipped_daily_routine_day on public.dog_daily_routine_days;
create trigger zz_preserve_weekday_daily_routine_skip before delete on public.dog_daily_routine_days
for each row execute function private.preserve_weekday_daily_routine_skip();
revoke all on function private.preserve_weekday_daily_routine_skip() from public, anon, authenticated;

create function public.create_daily_routine_v2(
  p_dog_id uuid, p_routine_id uuid, p_label text, p_checklist jsonb,
  p_repeat_unit text, p_repeat_interval integer, p_repeat_weekdays smallint[], p_time_zone text
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
  select r.* into v_current from public.dog_daily_routines r where r.dog_id = p_dog_id and r.id = p_routine_id for update;
  v_label := pg_catalog.btrim(p_label);
  if found then
    if v_current.label = v_label and v_current.checklist = p_checklist
      and v_current.repeat_unit is not distinct from p_repeat_unit
      and v_current.repeat_interval is not distinct from p_repeat_interval
      and v_current.repeat_weekdays is not distinct from p_repeat_weekdays then return v_current; end if;
    raise exception using errcode = '23505', message = 'Routine ID is already used by a different routine';
  end if;
  if v_label is null or pg_catalog.char_length(v_label) not between 1 and 160
    or not private.valid_daily_routine_checklist(p_checklist)
    or not private.valid_daily_routine_repeat(p_repeat_unit, p_repeat_interval)
    or not private.valid_daily_routine_weekdays(p_repeat_unit, p_repeat_weekdays) then
    raise exception using errcode = '22023', message = 'Routine name, checklist, or repeat rule is invalid';
  end if;
  if p_repeat_unit is not null then v_anchor := (pg_catalog.clock_timestamp() at time zone p_time_zone)::date; end if;
  insert into public.dog_daily_routines(id, dog_id, label, checklist, checklist_revision, legacy_single_item,
    repeat_unit, repeat_interval, repeat_weekdays, repeat_anchor_date)
  values (p_routine_id, p_dog_id, v_label, p_checklist, 1, false,
    p_repeat_unit, p_repeat_interval, p_repeat_weekdays, v_anchor)
  returning * into v_saved;
  return v_saved;
end;
$$;
revoke all on function public.create_daily_routine_v2(uuid, uuid, text, jsonb, text, integer, smallint[], text) from public, anon;
grant execute on function public.create_daily_routine_v2(uuid, uuid, text, jsonb, text, integer, smallint[], text) to authenticated;

create function public.replace_daily_routine_v2(
  p_dog_id uuid, p_routine_id uuid, p_expected_revision integer, p_label text, p_checklist jsonb,
  p_repeat_unit text, p_repeat_interval integer, p_repeat_weekdays smallint[], p_time_zone text
) returns public.dog_daily_routines
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.dog_daily_routines%rowtype;
  v_saved public.dog_daily_routines%rowtype;
  v_label text;
  v_anchor date;
  v_weekdays smallint[];
  v_same_rule boolean;
  v_anchor_weekday smallint;
begin
  if p_dog_id is null or p_routine_id is null or p_expected_revision is null or p_expected_revision < 1
    or p_time_zone is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = '22023', message = 'Routine replacement scope is invalid';
  end if;
  if not private.owns_dog(p_dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  select r.* into v_current from public.dog_daily_routines r where r.dog_id = p_dog_id and r.id = p_routine_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Routine is unavailable'; end if;
  v_label := pg_catalog.btrim(p_label);
  if v_label is null or pg_catalog.char_length(v_label) not between 1 and 160
    or not private.valid_daily_routine_checklist(p_checklist)
    or not private.valid_daily_routine_repeat(p_repeat_unit, p_repeat_interval)
    or not private.valid_daily_routine_weekdays(p_repeat_unit, p_repeat_weekdays) then
    raise exception using errcode = '22023', message = 'Routine name, checklist, or repeat rule is invalid';
  end if;
  v_same_rule := v_current.repeat_unit is not distinct from p_repeat_unit
    and v_current.repeat_interval is not distinct from p_repeat_interval
    and v_current.repeat_weekdays is not distinct from p_repeat_weekdays;
  if not v_same_rule and v_current.repeat_unit = 'week' and v_current.repeat_weekdays is null
    and p_repeat_unit = 'week' and p_repeat_weekdays is not null and v_current.repeat_anchor_date is not null then
    v_anchor_weekday := extract(isodow from v_current.repeat_anchor_date)::smallint;
    v_same_rule := pg_catalog.cardinality(p_repeat_weekdays) = 1 and p_repeat_weekdays[1] = v_anchor_weekday;
  end if;
  if v_same_rule then v_weekdays := v_current.repeat_weekdays; else v_weekdays := p_repeat_weekdays; end if;
  if v_current.checklist_revision = p_expected_revision + 1 and v_current.label = v_label
    and v_current.checklist = p_checklist and v_current.repeat_unit is not distinct from p_repeat_unit
    and v_current.repeat_interval is not distinct from p_repeat_interval
    and (v_current.repeat_weekdays is not distinct from p_repeat_weekdays or v_same_rule) then return v_current; end if;
  if v_current.checklist_revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Routine changed before replacement';
  end if;
  if p_repeat_unit is not null then
    if v_same_rule then v_anchor := v_current.repeat_anchor_date;
    else v_anchor := (pg_catalog.clock_timestamp() at time zone p_time_zone)::date; end if;
  end if;
  update public.dog_daily_routines r set label = v_label, checklist = p_checklist, legacy_single_item = false,
    repeat_unit = p_repeat_unit, repeat_interval = p_repeat_interval, repeat_weekdays = v_weekdays,
    repeat_anchor_date = v_anchor, checklist_revision = v_current.checklist_revision + 1
  where r.dog_id = p_dog_id and r.id = p_routine_id and r.checklist_revision = p_expected_revision returning r.* into v_saved;
  if not found then raise exception using errcode = '40001', message = 'Routine changed before replacement'; end if;
  return v_saved;
end;
$$;
revoke all on function public.replace_daily_routine_v2(uuid, uuid, integer, text, jsonb, text, integer, smallint[], text) from public, anon;
grant execute on function public.replace_daily_routine_v2(uuid, uuid, integer, text, jsonb, text, integer, smallint[], text) to authenticated;

create or replace function public.create_daily_routine(
  p_dog_id uuid, p_routine_id uuid, p_label text, p_checklist jsonb,
  p_repeat_unit text, p_repeat_interval integer, p_time_zone text
) returns public.dog_daily_routines
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.dog_daily_routines%rowtype;
  v_weekdays smallint[];
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
  if found and v_current.label = pg_catalog.btrim(p_label) and v_current.checklist = p_checklist
    and v_current.repeat_unit is not distinct from p_repeat_unit
    and v_current.repeat_interval is not distinct from p_repeat_interval then
    v_weekdays := v_current.repeat_weekdays;
  end if;
  return public.create_daily_routine_v2(p_dog_id, p_routine_id, p_label, p_checklist,
    p_repeat_unit, p_repeat_interval, v_weekdays, p_time_zone);
end;
$$;
revoke all on function public.create_daily_routine(uuid, uuid, text, jsonb, text, integer, text) from public, anon;
grant execute on function public.create_daily_routine(uuid, uuid, text, jsonb, text, integer, text) to authenticated;

create or replace function public.replace_daily_routine(
  p_dog_id uuid, p_routine_id uuid, p_expected_revision integer, p_label text, p_checklist jsonb,
  p_repeat_unit text, p_repeat_interval integer, p_time_zone text
) returns public.dog_daily_routines
language plpgsql security definer set search_path = '' as $$
declare
  v_current public.dog_daily_routines%rowtype;
  v_weekdays smallint[];
begin
  if p_dog_id is null or p_routine_id is null or p_expected_revision is null or p_expected_revision < 1
    or p_time_zone is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = '22023', message = 'Routine replacement scope is invalid';
  end if;
  if not private.owns_dog(p_dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  select r.* into v_current from public.dog_daily_routines r where r.dog_id = p_dog_id and r.id = p_routine_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Routine is unavailable'; end if;
  if v_current.repeat_unit is not distinct from p_repeat_unit
    and v_current.repeat_interval is not distinct from p_repeat_interval then v_weekdays := v_current.repeat_weekdays; end if;
  return public.replace_daily_routine_v2(p_dog_id, p_routine_id, p_expected_revision, p_label, p_checklist,
    p_repeat_unit, p_repeat_interval, v_weekdays, p_time_zone);
end;
$$;
revoke all on function public.replace_daily_routine(uuid, uuid, integer, text, jsonb, text, integer, text) from public, anon;
grant execute on function public.replace_daily_routine(uuid, uuid, integer, text, jsonb, text, integer, text) to authenticated;

create or replace function public.ensure_due_daily_routine_days(
  p_dog_id uuid, p_date_key date, p_time_zone text
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
  for v_routine in select r.* from public.dog_daily_routines r where r.dog_id = p_dog_id order by r.id for update loop
    if private.is_daily_routine_due(p_date_key, v_routine.repeat_unit, v_routine.repeat_interval,
      v_routine.repeat_anchor_date, v_routine.repeat_weekdays)
      and not exists (select 1 from public.dog_daily_routine_day_skips s
        where s.dog_id = p_dog_id and s.routine_id = v_routine.id and s.date_key = p_date_key) then
      insert into public.dog_daily_routine_days(id, dog_id, routine_id, date_key, time_zone)
      values (gen_random_uuid(), p_dog_id, v_routine.id, p_date_key, p_time_zone)
      on conflict (dog_id, routine_id, date_key) do nothing;
    end if;
  end loop;
  return query select d.* from public.dog_daily_routine_days d where d.dog_id = p_dog_id and d.date_key = p_date_key order by d.id;
end;
$$;
revoke all on function public.ensure_due_daily_routine_days(uuid, date, text) from public, anon;
grant execute on function public.ensure_due_daily_routine_days(uuid, date, text) to authenticated;

create or replace function public.set_daily_routine_day_skipped(
  p_dog_id uuid, p_routine_id uuid, p_date_key date, p_time_zone text,
  p_expected_revision integer, p_mutation_id uuid, p_skipped boolean
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
  select r.* into v_routine from public.dog_daily_routines r where r.dog_id = p_dog_id and r.id = p_routine_id for update;
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
    if v_day.time_zone is distinct from p_time_zone or p_date_key <> (v_now at time zone v_day.time_zone)::date then
      raise exception using errcode = '22023', message = 'Routine day is no longer current';
    end if;
    if v_day.routine_day_revision <> p_expected_revision then
      raise exception using errcode = '40001', message = 'Routine day changed before skip';
    end if;
    if not (v_day.is_recurring_occurrence or private.is_daily_routine_due(p_date_key, v_routine.repeat_unit,
      v_routine.repeat_interval, v_routine.repeat_anchor_date, v_routine.repeat_weekdays)) then
      raise exception using errcode = '22023', message = 'Only a recurring routine can be skipped';
    end if;
    perform pg_catalog.set_config('tassla.daily_routine_skip_mutation_id', p_mutation_id::text, true);
    delete from public.dog_daily_routine_days d where d.dog_id = p_dog_id and d.id = v_day.id
      and d.routine_id = p_routine_id and d.date_key = p_date_key and d.routine_day_revision = p_expected_revision;
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
  if v_skip.time_zone is distinct from p_time_zone or p_date_key <> (v_now at time zone v_skip.time_zone)::date then
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

notify pgrst, 'reload schema';
commit;

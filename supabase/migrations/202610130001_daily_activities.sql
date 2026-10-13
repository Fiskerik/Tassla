-- R02-2: owner-selected daily routines and versioned training selections.
-- Apply only to a development project after the foundation migration.
begin;

create table public.dog_daily_routines (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  label text not null check (pg_catalog.char_length(pg_catalog.btrim(label)) between 1 and 160),
  unique (dog_id, id)
);

create table public.dog_daily_routine_days (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  routine_id uuid not null,
  date_key date not null,
  time_zone text not null check (pg_catalog.char_length(time_zone) between 1 and 100),
  completed_at timestamptz,
  unique (dog_id, routine_id, date_key),
  foreign key (dog_id, routine_id) references public.dog_daily_routines(dog_id, id) on delete cascade
);
create index dog_daily_routine_days_date on public.dog_daily_routine_days(dog_id, date_key);

create table public.dog_daily_training_selections (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  program_version_id uuid not null,
  step_id uuid not null,
  date_key date not null,
  time_zone text not null check (pg_catalog.char_length(time_zone) between 1 and 100),
  unique (dog_id, program_version_id, step_id, date_key),
  foreign key (step_id, program_version_id) references public.training_steps(id, program_version_id) on delete cascade
);
create index dog_daily_training_selections_date on public.dog_daily_training_selections(dog_id, date_key);

alter table public.dog_daily_routines enable row level security;
alter table public.dog_daily_routine_days enable row level security;
alter table public.dog_daily_training_selections enable row level security;
revoke all on table public.dog_daily_routines, public.dog_daily_routine_days, public.dog_daily_training_selections from public, anon, authenticated;
grant all on table public.dog_daily_routines, public.dog_daily_routine_days, public.dog_daily_training_selections to service_role;
grant usage on schema private to service_role;
grant select, delete on public.dog_daily_routines to authenticated;
grant insert (id, dog_id, label) on public.dog_daily_routines to authenticated;
grant update (label) on public.dog_daily_routines to authenticated;
grant select, delete on public.dog_daily_routine_days to authenticated;
grant insert (id, dog_id, routine_id, date_key, time_zone) on public.dog_daily_routine_days to authenticated;
grant update (completed_at) on public.dog_daily_routine_days to authenticated;
grant select, delete on public.dog_daily_training_selections to authenticated;
grant insert (id, dog_id, program_version_id, step_id, date_key, time_zone) on public.dog_daily_training_selections to authenticated;

create policy daily_routines_owner on public.dog_daily_routines for all to authenticated
  using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
create policy daily_routine_days_owner on public.dog_daily_routine_days for all to authenticated
  using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
create policy daily_training_selections_owner on public.dog_daily_training_selections for all to authenticated
  using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));

-- Serialize source selection against concurrent training-progress inserts.
-- This is a lock-only guard; it does not change training_progress data or grants.
create function private.lock_daily_activity_training_progress() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform 1 from public.dogs d where d.id = old.dog_id for update;
    return old;
  end if;
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  return new;
end;
$$;
create trigger lock_daily_activity_training_progress
before insert or delete on public.training_progress
for each row execute function private.lock_daily_activity_training_progress();
revoke all on function private.lock_daily_activity_training_progress() from public, anon, authenticated;

create function private.guard_daily_routine() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.id is distinct from old.id or new.dog_id is distinct from old.dog_id) then
    raise exception using errcode = '22023', message = 'Daily routine scope is immutable';
  end if;
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  if not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  new.label := pg_catalog.btrim(new.label);
  if pg_catalog.char_length(new.label) not between 1 and 160 then
    raise exception using errcode = '22023', message = 'Routine label must contain 1 to 160 characters';
  end if;
  return new;
end;
$$;
create trigger guard_daily_routine before insert or update on public.dog_daily_routines
for each row execute function private.guard_daily_routine();
revoke all on function private.guard_daily_routine() from public, anon, authenticated;

create function private.guard_daily_routine_day() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_exists boolean;
begin
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id or new.dog_id is distinct from old.dog_id
    or new.routine_id is distinct from old.routine_id or new.date_key is distinct from old.date_key
    or new.time_zone is distinct from old.time_zone
  ) then
    raise exception using errcode = '22023', message = 'Daily routine selection scope is immutable';
  end if;
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  if not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  perform 1 from public.dog_daily_routines r
    where r.id = new.routine_id and r.dog_id = new.dog_id for update;
  if not found then
    raise exception using errcode = '23503', message = 'Routine does not belong to this dog';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = new.time_zone) then
    raise exception using errcode = '22023', message = 'Expected an IANA time zone';
  end if;

  if tg_op = 'INSERT' then
    select exists (
      select 1 from public.dog_daily_routine_days r
      where r.dog_id = new.dog_id and r.routine_id = new.routine_id and r.date_key = new.date_key
        and r.id = new.id and r.time_zone = new.time_zone
    ) into v_exists;
    if v_exists then return new; end if;
    v_now := pg_catalog.clock_timestamp();
    if new.date_key <> (v_now at time zone new.time_zone)::date then
      raise exception using errcode = '22023', message = 'Daily selection date is no longer today';
    end if;
    if new.completed_at is not null then
      raise exception using errcode = '22023', message = 'Routine completion is server controlled';
    end if;
    return new;
  end if;

  if new.completed_at is not distinct from old.completed_at then return new; end if;
  v_now := pg_catalog.clock_timestamp();
  if new.date_key <> (v_now at time zone new.time_zone)::date then
    raise exception using errcode = '22023', message = 'Only today can be marked or undone';
  end if;
  if old.completed_at is null and new.completed_at is not null then
    new.completed_at := v_now;
    return new;
  end if;
  if old.completed_at is not null and new.completed_at is null then
    return new;
  end if;
  raise exception using errcode = '22023', message = 'Invalid routine completion transition';
end;
$$;
create trigger guard_daily_routine_day before insert or update on public.dog_daily_routine_days
for each row execute function private.guard_daily_routine_day();
revoke all on function private.guard_daily_routine_day() from public, anon, authenticated;

create function private.guard_daily_training_selection() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_dog public.dogs%rowtype;
  v_version public.content_versions%rowtype;
  v_item public.content_items%rowtype;
  v_step public.training_steps%rowtype;
  v_first_incomplete uuid;
  v_eligible boolean;
  v_exists boolean;
begin
  perform 1 from public.dogs d where d.id = new.dog_id for update;
  select d.* into v_dog from public.dogs d where d.id = new.dog_id;
  if not found or not private.owns_dog(new.dog_id) then
    raise exception using errcode = '42501', message = 'Dog ownership is required';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = new.time_zone) then
    raise exception using errcode = '22023', message = 'Expected an IANA time zone';
  end if;
  perform 1 from public.content_versions v where v.id = new.program_version_id for update;
  select v.* into v_version from public.content_versions v where v.id = new.program_version_id;
  if not found then
    raise exception using errcode = '23503', message = 'Training version is unavailable';
  end if;
  perform 1 from public.content_items i where i.id = v_version.content_id for update;
  select i.* into v_item from public.content_items i where i.id = v_version.content_id;
  perform 1 from public.content_versions v where v.content_id = v_version.content_id order by v.id for update;
  perform 1 from public.content_breed_targets t
    join public.content_versions v on v.id = t.content_version_id
    where v.content_id = v_version.content_id order by t.content_version_id, t.breed_id for update of t;
  perform 1 from public.training_steps s where s.id = new.step_id and s.program_version_id = new.program_version_id for update;
  select s.* into v_step from public.training_steps s where s.id = new.step_id and s.program_version_id = new.program_version_id;
  if not found then
    raise exception using errcode = '23503', message = 'Training step does not belong to this version';
  end if;

  select exists (
    select 1 from public.dog_daily_training_selections s
    where s.dog_id = new.dog_id and s.program_version_id = new.program_version_id
      and s.step_id = new.step_id and s.date_key = new.date_key
      and s.id = new.id and s.time_zone = new.time_zone
  ) into v_exists;
  if v_exists then return new; end if;

  v_now := pg_catalog.clock_timestamp();
  if new.date_key <> (v_now at time zone new.time_zone)::date then
    raise exception using errcode = '22023', message = 'Daily selection date is no longer today';
  end if;
  if v_version.status <> 'published' or v_item.content_type <> 'training_program' then
    raise exception using errcode = '22023', message = 'Training program is not currently published';
  end if;
  if exists (
    select 1 from public.content_breed_targets t
    where t.content_version_id = new.program_version_id and t.breed_id <> v_dog.breed_id
  ) then
    raise exception using errcode = '22023', message = 'Training program is not available for this breed';
  end if;

  select exists (
    select 1 from public.training_progress p
    where p.dog_id = new.dog_id and p.program_version_id = new.program_version_id and p.step_id = new.step_id
  ) into v_exists;
  if v_exists then
    raise exception using errcode = '22023', message = 'Completed training cannot be selected again';
  end if;

  select not exists (
    select 1 from public.content_versions other
    join public.content_items other_item on other_item.id = other.content_id
    where other.content_id = v_version.content_id and other.status = 'published'
      and other_item.content_type = 'training_program'
      and (not exists (select 1 from public.content_breed_targets t where t.content_version_id = other.id)
        or exists (select 1 from public.content_breed_targets t where t.content_version_id = other.id and t.breed_id = v_dog.breed_id))
      and other.version > v_version.version
      and exists (select 1 from public.training_progress p where p.dog_id = new.dog_id and p.program_version_id = other.id)
  ) and exists (
    select 1 from public.training_progress p where p.dog_id = new.dog_id and p.program_version_id = new.program_version_id
  ) into v_eligible;

  if not v_eligible then
    select not exists (
      select 1 from public.content_versions resumed
      join public.content_items resumed_item on resumed_item.id = resumed.content_id
      where resumed.content_id = v_version.content_id and resumed.status = 'published'
        and resumed_item.content_type = 'training_program'
        and (not exists (select 1 from public.content_breed_targets t where t.content_version_id = resumed.id)
          or exists (select 1 from public.content_breed_targets t where t.content_version_id = resumed.id and t.breed_id = v_dog.breed_id))
        and exists (select 1 from public.training_progress p where p.dog_id = new.dog_id and p.program_version_id = resumed.id)
    ) and v_dog.birth_date <= new.date_key
      and pg_catalog.floor((new.date_key - v_dog.birth_date)::numeric / 7) between v_version.min_age_weeks and coalesce(v_version.max_age_weeks, 2147483647)
      and not exists (
        select 1 from public.content_versions newer
        join public.content_items newer_item on newer_item.id = newer.content_id
        where newer.content_id = v_version.content_id and newer.status = 'published'
          and newer_item.content_type = 'training_program' and newer.version > v_version.version
          and pg_catalog.floor((new.date_key - v_dog.birth_date)::numeric / 7) between newer.min_age_weeks and coalesce(newer.max_age_weeks, 2147483647)
          and (not exists (select 1 from public.content_breed_targets t where t.content_version_id = newer.id)
            or exists (select 1 from public.content_breed_targets t where t.content_version_id = newer.id and t.breed_id = v_dog.breed_id))
      ) into v_eligible;
  end if;
  if not v_eligible then
    raise exception using errcode = '22023', message = 'Training version is not the active eligible version';
  end if;

  select s.id into v_first_incomplete
  from public.training_steps s
  where s.program_version_id = new.program_version_id
    and not exists (
      select 1 from public.training_progress p
      where p.dog_id = new.dog_id and p.program_version_id = s.program_version_id and p.step_id = s.id
    )
  order by s.position
  limit 1;
  if v_first_incomplete is distinct from new.step_id then
    raise exception using errcode = '22023', message = 'Only the next incomplete training step can be selected';
  end if;
  return new;
end;
$$;
create trigger guard_daily_training_selection before insert on public.dog_daily_training_selections
for each row execute function private.guard_daily_training_selection();
revoke all on function private.guard_daily_training_selection() from public, anon, authenticated;

create function private.purge_expired_daily_activity_selections() returns bigint
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
  delete from public.dog_daily_training_selections s
  where s.date_key <= ((v_now at time zone s.time_zone)::date - 30);
  get diagnostics v_count = row_count;
  return v_deleted + v_count;
end;
$$;
revoke all on function private.purge_expired_daily_activity_selections() from public, anon, authenticated;
grant execute on function private.purge_expired_daily_activity_selections() to service_role;

commit;

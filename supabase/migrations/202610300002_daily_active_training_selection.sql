-- A daily choice follows the saved journey without changing training progression.
begin;

create or replace function private.guard_daily_training_selection() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_dog public.dogs%rowtype;
  v_version public.content_versions%rowtype;
  v_item public.content_items%rowtype;
  v_step public.training_steps%rowtype;
  v_first_incomplete uuid;
  v_journey public.training_journeys%rowtype;
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
  select j.* into v_journey from public.training_journeys j
    where j.dog_id = new.dog_id and j.program_version_id = new.program_version_id for update;
  if found then
    if v_journey.state not in ('active', 'maintenance') or v_journey.active_step_id is distinct from new.step_id then
      raise exception using errcode = '22023', message = 'Only the current active journey step can be selected';
    end if;
    return new;
  end if;

  if exists (
    select 1 from public.content_breed_targets t
    where t.content_version_id = new.program_version_id
  ) and not exists (
    select 1 from public.content_breed_targets t
    where t.content_version_id = new.program_version_id and t.breed_id = v_dog.breed_id
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
revoke all on function private.guard_daily_training_selection() from public, anon, authenticated;

commit;

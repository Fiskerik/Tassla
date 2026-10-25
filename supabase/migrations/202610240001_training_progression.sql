-- Version-bound training sessions and owner-assessed progression.
-- Apply only to a development database after the daily-activities migration.
begin;

create table public.training_journeys (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  program_version_id uuid not null references public.content_versions(id),
  active_step_id uuid not null,
  state text not null default 'active' check (state in ('active','paused','maintenance')),
  last_operation_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dog_id, program_version_id),
  unique (id, dog_id, program_version_id),
  foreign key (active_step_id, program_version_id)
    references public.training_steps(id, program_version_id)
);
create index training_journeys_home on public.training_journeys(dog_id, updated_at desc, program_version_id);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  program_version_id uuid not null references public.content_versions(id),
  step_id uuid not null,
  operation_id uuid not null,
  feedback text not null check (feedback in ('worked_as_planned','practice_more','paused_early')),
  performed_at timestamptz not null default now(),
  unique (dog_id, operation_id),
  foreign key (journey_id, dog_id, program_version_id)
    references public.training_journeys(id, dog_id, program_version_id) on delete cascade,
  foreign key (step_id, program_version_id)
    references public.training_steps(id, program_version_id)
);
create index training_sessions_journey on public.training_sessions(journey_id, performed_at desc, id);

create table public.training_milestones (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  program_version_id uuid not null references public.content_versions(id),
  step_id uuid not null,
  confirmation_operation_id uuid not null,
  confirmed_at timestamptz not null default now(),
  unique (dog_id, program_version_id, step_id),
  unique (dog_id, confirmation_operation_id),
  foreign key (journey_id, dog_id, program_version_id)
    references public.training_journeys(id, dog_id, program_version_id) on delete cascade,
  foreign key (step_id, program_version_id)
    references public.training_steps(id, program_version_id)
);
create index training_milestones_journey on public.training_milestones(journey_id, confirmed_at, id);

-- Receipts are private to the RPC. The persisted request prevents reusing an ID
-- for another action; the original result makes timeout retries idempotent.
create table public.training_operation_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  operation_id uuid not null,
  request jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dog_id, operation_id)
);

alter table public.training_journeys enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_milestones enable row level security;
alter table public.training_operation_receipts enable row level security;

revoke all on table public.training_journeys, public.training_sessions,
  public.training_milestones, public.training_operation_receipts from public, anon, authenticated;
grant all on table public.training_journeys, public.training_sessions,
  public.training_milestones, public.training_operation_receipts to service_role;
grant select on public.training_journeys, public.training_sessions, public.training_milestones to authenticated;

create policy training_journeys_owner_read on public.training_journeys for select to authenticated
  using (private.owns_dog(dog_id));
create policy training_sessions_owner_read on public.training_sessions for select to authenticated
  using (private.owns_dog(dog_id));
create policy training_milestones_owner_read on public.training_milestones for select to authenticated
  using (private.owns_dog(dog_id));

create function public.apply_training_operation(
  p_dog_id uuid,
  p_program_version_id uuid,
  p_operation_id uuid,
  p_action text,
  p_step_id uuid default null,
  p_feedback text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_receipt public.training_operation_receipts%rowtype;
  v_version_status text;
  v_content_type text;
  v_step_id uuid;
  v_next_step_id uuid;
  v_state text;
  v_journey public.training_journeys%rowtype;
  v_session_id uuid;
  v_milestone_id uuid;
  v_result jsonb;
begin
  if v_user_id is null or not private.owns_dog(p_dog_id) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  if p_operation_id is null or p_program_version_id is null or p_action is null or p_action not in (
    'start_or_resume','record_session','confirm_step','next','back','repeat','pause','maintenance'
  ) then
    raise exception 'Invalid training operation' using errcode = '22023';
  end if;
  if p_action = 'record_session' then
    if p_step_id is null or p_feedback is null or p_feedback not in ('worked_as_planned','practice_more','paused_early') then
      raise exception 'Session feedback is required' using errcode = '22023';
    end if;
  elsif p_action in ('confirm_step','next','back','repeat','pause','maintenance') then
    if p_step_id is null or p_feedback is not null then
      raise exception 'A current step is required' using errcode = '22023';
    end if;
  elsif p_step_id is not null or p_feedback is not null then
    raise exception 'Start or resume does not accept step feedback' using errcode = '22023';
  end if;

  v_request := pg_catalog.jsonb_build_object(
    'dog_id', p_dog_id,
    'program_version_id', p_program_version_id,
    'action', p_action,
    'step_id', p_step_id,
    'feedback', p_feedback
  );

  -- Serialize mutations per dog and recheck ownership after waiting for the lock.
  perform 1 from public.dogs d where d.id = p_dog_id for update;
  if not found or not private.owns_dog(p_dog_id) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  select * into v_receipt from public.training_operation_receipts r
    where r.user_id = v_user_id and r.dog_id = p_dog_id and r.operation_id = p_operation_id;
  if found then
    if v_receipt.request is distinct from v_request then
      raise exception 'Operation ID was already used for another action' using errcode = '22023';
    end if;
    return v_receipt.result;
  end if;

  select v.status, i.content_type into v_version_status, v_content_type
    from public.content_versions v join public.content_items i on i.id = v.content_id
    where v.id = p_program_version_id
    for share of v;
  if v_version_status is distinct from 'published' or v_content_type is distinct from 'training_program' then
    raise exception 'Published training program required' using errcode = '22023';
  end if;

  if p_action = 'start_or_resume' then
    select s.id into v_step_id from public.training_steps s
      where s.program_version_id = p_program_version_id order by s.position, s.id limit 1;
    if v_step_id is null then
      raise exception 'Training program has no steps' using errcode = '22023';
    end if;
    insert into public.training_journeys(dog_id, program_version_id, active_step_id, state, last_operation_id)
      values (p_dog_id, p_program_version_id, v_step_id, 'active', p_operation_id)
      on conflict (dog_id, program_version_id) do nothing;
    select * into v_journey from public.training_journeys j
      where j.dog_id = p_dog_id and j.program_version_id = p_program_version_id for update;
    update public.training_journeys set state = 'active', last_operation_id = p_operation_id,
      updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
  else
    select * into v_journey from public.training_journeys j
      where j.dog_id = p_dog_id and j.program_version_id = p_program_version_id for update;
    if not found then raise exception 'Training journey has not started' using errcode = '22023'; end if;
    if p_step_id is distinct from v_journey.active_step_id then
      raise exception 'Training step changed; reload the journey' using errcode = '22023';
    end if;
    v_step_id := v_journey.active_step_id;
    v_state := v_journey.state;
    if p_action in ('record_session','confirm_step','next','back','repeat') and v_state = 'paused' then
      raise exception 'Resume the training journey first' using errcode = '22023';
    end if;

    if p_action = 'record_session' then
      insert into public.training_sessions(journey_id, dog_id, program_version_id, step_id, operation_id, feedback)
        values (v_journey.id, p_dog_id, p_program_version_id, v_step_id, p_operation_id, p_feedback)
        returning id into v_session_id;
      update public.training_journeys set last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    elsif p_action = 'confirm_step' then
      if not exists (select 1 from public.training_sessions s where s.journey_id = v_journey.id and s.step_id = v_step_id) then
        raise exception 'Log a training session before confirming this step' using errcode = '22023';
      end if;
      insert into public.training_milestones(journey_id, dog_id, program_version_id, step_id, confirmation_operation_id)
        values (v_journey.id, p_dog_id, p_program_version_id, v_step_id, p_operation_id)
        on conflict (dog_id, program_version_id, step_id) do nothing;
      select m.id into v_milestone_id from public.training_milestones m
        where m.journey_id = v_journey.id and m.step_id = v_step_id;
      update public.training_journeys set last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    elsif p_action = 'next' then
      if not exists (select 1 from public.training_milestones m where m.journey_id = v_journey.id and m.step_id = v_step_id) then
        raise exception 'Confirm this step before moving on' using errcode = '22023';
      end if;
      select s.id into v_next_step_id from public.training_steps current_step
        join public.training_steps s on s.program_version_id = current_step.program_version_id
          and s.position > current_step.position
        where current_step.id = v_step_id and current_step.program_version_id = p_program_version_id
        order by s.position, s.id limit 1;
      if v_next_step_id is null then raise exception 'This is the last training step' using errcode = '22023'; end if;
      update public.training_journeys set active_step_id = v_next_step_id, last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    elsif p_action = 'back' then
      select s.id into v_next_step_id from public.training_steps current_step
        join public.training_steps s on s.program_version_id = current_step.program_version_id
          and s.position < current_step.position
        where current_step.id = v_step_id and current_step.program_version_id = p_program_version_id
        order by s.position desc, s.id limit 1;
      if v_next_step_id is null then raise exception 'This is the first training step' using errcode = '22023'; end if;
      update public.training_journeys set active_step_id = v_next_step_id, last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    elsif p_action = 'pause' then
      update public.training_journeys set state = 'paused', last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    elsif p_action = 'maintenance' then
      update public.training_journeys set state = 'maintenance', last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    else
      update public.training_journeys set last_operation_id = p_operation_id,
        updated_at = pg_catalog.clock_timestamp() where id = v_journey.id returning * into v_journey;
    end if;
  end if;

  v_result := pg_catalog.jsonb_build_object(
    'operation_id', p_operation_id,
    'action', p_action,
    'journey_id', v_journey.id,
    'dog_id', p_dog_id,
    'program_version_id', p_program_version_id,
    'active_step_id', v_journey.active_step_id,
    'state', v_journey.state,
    'session_id', v_session_id,
    'milestone_id', v_milestone_id
  );
  insert into public.training_operation_receipts(user_id, dog_id, operation_id, request, result)
    values (v_user_id, p_dog_id, p_operation_id, v_request, v_result);
  return v_result;
end;
$$;

revoke all on function public.apply_training_operation(uuid,uuid,uuid,text,uuid,text) from public, anon;
grant execute on function public.apply_training_operation(uuid,uuid,uuid,text,uuid,text) to authenticated;

commit;

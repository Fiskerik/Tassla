-- Undo one explicitly selected confirmation without losing saved sessions or other steps.
-- A receipt and expected milestone ID make retries idempotent and prevent stale deletion.
begin;
create function public.undo_training_milestone(
  p_dog_id uuid,
  p_program_version_id uuid,
  p_operation_id uuid,
  p_step_id uuid,
  p_expected_milestone_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_receipt public.training_operation_receipts%rowtype;
  v_journey public.training_journeys%rowtype;
  v_removed uuid;
  v_result jsonb;
begin
  if v_user_id is null or not private.owns_dog(p_dog_id) then
    raise exception 'Owner access required' using errcode='42501';
  end if;
  if p_dog_id is null or p_program_version_id is null or p_operation_id is null
    or p_step_id is null or p_expected_milestone_id is null then
    raise exception 'A current confirmation is required' using errcode='22023';
  end if;
  v_request := pg_catalog.jsonb_build_object('dog_id',p_dog_id,'program_version_id',p_program_version_id,
    'action','undo_step','step_id',p_step_id,'feedback',p_expected_milestone_id::text);
  perform 1 from public.dogs d where d.id=p_dog_id for update;
  if not found or not private.owns_dog(p_dog_id) then
    raise exception 'Owner access required' using errcode='42501';
  end if;
  select * into v_receipt from public.training_operation_receipts r
    where r.user_id=v_user_id and r.dog_id=p_dog_id and r.operation_id=p_operation_id;
  if found then
    if v_receipt.request is distinct from v_request then
      raise exception 'Operation ID was already used for another action' using errcode='22023';
    end if;
    return v_receipt.result;
  end if;
  perform v.id from public.content_versions v join public.content_items i on i.id=v.content_id
    where v.id=p_program_version_id and v.status='published' and i.content_type='training_program' for share of v;
  if not found then
    raise exception 'Published training program required' using errcode='22023';
  end if;
  select * into v_journey from public.training_journeys j
    where j.dog_id=p_dog_id and j.program_version_id=p_program_version_id for update;
  if not found or v_journey.active_step_id is distinct from p_step_id then
    raise exception 'Training step changed; reload the journey' using errcode='22023';
  end if;
  if v_journey.state='paused' then
    raise exception 'Resume the training journey first' using errcode='22023';
  end if;
  delete from public.training_milestones m
    where m.id=p_expected_milestone_id and m.journey_id=v_journey.id and m.dog_id=p_dog_id
      and m.program_version_id=p_program_version_id and m.step_id=p_step_id
    returning m.id into v_removed;
  if v_removed is null then
    raise exception 'Confirmation changed; reload the journey' using errcode='22023';
  end if;
  update public.training_journeys set last_operation_id=p_operation_id, updated_at=pg_catalog.clock_timestamp()
    where id=v_journey.id returning * into v_journey;
  v_result := pg_catalog.jsonb_build_object('operation_id',p_operation_id,'action','undo_step',
    'journey_id',v_journey.id,'dog_id',p_dog_id,'program_version_id',p_program_version_id,
    'active_step_id',v_journey.active_step_id,'state',v_journey.state,'session_id',null,'milestone_id',v_removed);
  insert into public.training_operation_receipts(user_id,dog_id,operation_id,request,result)
    values (v_user_id,p_dog_id,p_operation_id,v_request,v_result);
  return v_result;
end;
$$;
revoke all on function public.undo_training_milestone(uuid,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.undo_training_milestone(uuid,uuid,uuid,uuid,uuid) to authenticated;
commit;

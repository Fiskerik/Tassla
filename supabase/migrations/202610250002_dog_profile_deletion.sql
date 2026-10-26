begin;

-- Preserve the idempotency receipt as a minimal tombstone when its dog is
-- removed. Only owner/request/time remain; dog_id and profile data do not.
alter table private.dog_creation_requests
  drop constraint dog_creation_requests_dog_id_fkey;
alter table private.dog_creation_requests
  alter column dog_id drop not null;
alter table private.dog_creation_requests
  add constraint dog_creation_requests_dog_id_fkey
  foreign key (dog_id) references public.dogs(id) on delete set null;

-- A replay whose receipt was tombstoned is a terminal state. Never recreate
-- the deleted profile under the same idempotency key.
create or replace function private.create_dog_with_request(
  requested_request_id uuid,
  requested_name text,
  requested_breed_id text,
  requested_birth_date date,
  requested_kennel_code text,
  only_first_dog boolean
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid;
  existing_dog_id uuid;
  new_dog_id uuid;
  source_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null or requested_request_id is null then
    raise exception 'Active authenticated account and request required' using errcode = '42501';
  end if;

  -- Serialize all creation for the account before looking up a receipt.
  perform 1 from auth.users where id = current_user_id for update;
  if not found then
    raise exception 'Active authenticated account required' using errcode = '42501';
  end if;

  select dog_id into existing_dog_id
    from private.dog_creation_requests
    where user_id = current_user_id and request_id = requested_request_id;
  if found then
    if existing_dog_id is null then
      raise exception 'Dog creation request has been retired' using errcode = 'PT001';
    end if;
    return existing_dog_id;
  end if;

  if only_first_dog and exists (
    select 1 from public.dog_memberships where user_id = current_user_id
  ) then
    raise exception 'Use the multi-dog creation flow for additional dogs' using errcode = '23505';
  end if;

  if requested_kennel_code is not null then
    select id into source_id from public.kennels
      where distribution_code = upper(btrim(requested_kennel_code)) and active;
    if source_id is null then raise exception 'Invalid kennel code'; end if;
  end if;

  insert into public.dogs(name, breed_id, birth_date)
    values (btrim(requested_name), requested_breed_id, requested_birth_date)
    returning id into new_dog_id;
  insert into public.dog_memberships(dog_id, user_id)
    values (new_dog_id, current_user_id);
  if source_id is not null then
    insert into public.dog_attribution(dog_id, kennel_id) values (new_dog_id, source_id);
  end if;
  insert into private.dog_creation_requests(user_id, request_id, dog_id)
    values (current_user_id, requested_request_id, new_dog_id);

  return new_dog_id;
end;
$$;

-- Delete only the currently authenticated owner's exact dog. NO KEY UPDATE
-- allows child FK KEY SHARE locks while still conflicting with create's
-- FOR UPDATE lock on the auth.users row.
create function public.delete_owned_dog_profile(requested_dog_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid;
  deleted_rows integer;
begin
  current_user_id := auth.uid();
  if current_user_id is null or requested_dog_id is null then return false; end if;

  perform 1 from auth.users where id = current_user_id for no key update;
  if not found then return false; end if;

  if not exists (
    select 1 from public.dog_memberships m
    where m.user_id = current_user_id and m.dog_id = requested_dog_id
  ) then
    return false;
  end if;

  perform 1 from public.dogs d where d.id = requested_dog_id for update;
  if not found then return false; end if;

  -- Recheck after waiting on the dog lock. Foreign and absent IDs remain
  -- indistinguishable to callers.
  if not exists (
    select 1 from public.dog_memberships m
    where m.user_id = current_user_id and m.dog_id = requested_dog_id
  ) then
    return false;
  end if;

  delete from public.dogs d where d.id = requested_dog_id;
  get diagnostics deleted_rows = row_count;
  return deleted_rows = 1;
end;
$$;

revoke all on function public.delete_owned_dog_profile(uuid) from public, anon, authenticated;
grant execute on function public.delete_owned_dog_profile(uuid) to authenticated;

commit;

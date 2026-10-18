begin;

-- Keep one owner per dog while allowing one owner to have multiple dogs.
alter table public.dog_memberships
  drop constraint dog_memberships_user_id_key;

create index dog_memberships_owner_created
  on public.dog_memberships(user_id, created_at, dog_id);

create table private.dog_creation_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id),
  unique (dog_id)
);
revoke all on table private.dog_creation_requests from public, anon, authenticated;

create function private.create_dog_with_request(
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

  -- Serialize all dog creation for this account before looking up a receipt.
  perform 1 from auth.users where id = current_user_id for update;
  if not found then
    raise exception 'Active authenticated account required' using errcode = '42501';
  end if;

  select dog_id into existing_dog_id
    from private.dog_creation_requests
    where user_id = current_user_id and request_id = requested_request_id;
  if found then return existing_dog_id; end if;

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
revoke all on function private.create_dog_with_request(uuid,text,text,date,text,boolean) from public, anon, authenticated;

create function public.create_dog_idempotent(
  dog_name text,
  dog_breed_id text,
  dog_birth_date date,
  kennel_code text,
  request_id uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  return private.create_dog_with_request(
    request_id, dog_name, dog_breed_id, dog_birth_date, kennel_code, false
  );
end;
$$;
revoke all on function public.create_dog_idempotent(text,text,date,text,uuid) from public, anon;
grant execute on function public.create_dog_idempotent(text,text,date,text,uuid) to authenticated;

-- Replace the exact legacy signature. Its fixed request ID makes retries safe,
-- and the helper limits this path to the account's first dog.
drop function public.create_dog(text,text,date,text);
create function public.create_dog(
  dog_name text,
  dog_breed_id text,
  dog_birth_date date,
  kennel_code text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  return private.create_dog_with_request(
    '00000000-0000-4000-8000-000000000001'::uuid,
    dog_name, dog_breed_id, dog_birth_date, kennel_code, true
  );
end;
$$;
revoke all on function public.create_dog(text,text,date,text) from public, anon;
grant execute on function public.create_dog(text,text,date,text) to authenticated;

commit;

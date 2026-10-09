begin;

create function public.owned_dog_attribution_details(requested_dog_id uuid)
returns table (code text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select kennel.distribution_code, kennel.name
  from public.dog_attribution attribution
  join public.kennels kennel on kennel.id = attribution.kennel_id
  where attribution.dog_id = requested_dog_id
    and private.owns_dog(requested_dog_id);
$$;

revoke all on function public.owned_dog_attribution_details(uuid) from public, anon;
grant execute on function public.owned_dog_attribution_details(uuid) to authenticated;

create function public.set_owned_dog_attribution(requested_dog_id uuid, requested_kennel_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare selected_kennel_id uuid;
begin
  if requested_dog_id is null or not private.owns_dog(requested_dog_id) then return false; end if;
  if nullif(btrim(requested_kennel_code), '') is null then
    delete from public.dog_attribution where dog_id = requested_dog_id;
    return true;
  end if;
  select id into selected_kennel_id
  from public.kennels
  where distribution_code = upper(btrim(requested_kennel_code)) and active;
  if selected_kennel_id is null then raise exception 'Invalid kennel code'; end if;
  insert into public.dog_attribution(dog_id, kennel_id)
    values (requested_dog_id, selected_kennel_id)
    on conflict (dog_id) do update set kennel_id = excluded.kennel_id;
  return true;
end;
$$;

revoke all on function public.set_owned_dog_attribution(uuid, text) from public, anon;
grant execute on function public.set_owned_dog_attribution(uuid, text) to authenticated;

commit;

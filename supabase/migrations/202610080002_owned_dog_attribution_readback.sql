-- Confirms only whether the signed-in owner's dog has the requested source code.
create function public.owned_dog_attribution_matches(
  requested_dog_id uuid,
  requested_kennel_code text
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select case
    when requested_dog_id is null or not private.owns_dog(requested_dog_id) then false
    when requested_kennel_code is null then not exists (
      select 1 from public.dog_attribution attribution
      where attribution.dog_id = requested_dog_id
    )
    else exists (
      select 1
      from public.dog_attribution attribution
      join public.kennels kennel on kennel.id = attribution.kennel_id
      where attribution.dog_id = requested_dog_id
        and kennel.distribution_code = upper(btrim(requested_kennel_code))
    )
  end;
$$;

revoke all on function public.owned_dog_attribution_matches(uuid, text) from public, anon;
grant execute on function public.owned_dog_attribution_matches(uuid, text) to authenticated;

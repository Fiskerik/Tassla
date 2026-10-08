-- Run after migrations in a development database only. All data is synthetic; rollback restores fixtures.
begin;
insert into auth.users(id, email) values
  ('11000000-0000-4000-8000-000000000001', 'p08-owner-a@example.invalid'),
  ('11000000-0000-4000-8000-000000000002', 'p08-owner-b@example.invalid');
insert into public.kennels(id, name, distribution_code, active) values
  ('22000000-0000-4000-8000-000000000001', 'Synthetic kennel A', 'P08-TEST-A', true),
  ('22000000-0000-4000-8000-000000000002', 'Synthetic kennel inactive', 'P08-TEST-OFF', false);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('test.p08_dog_a', public.create_dog('Synthetic P08 A', 'unknown', current_date - 70, 'P08-TEST-A')::text, true);
do $$ begin
  if not public.owned_dog_attribution_matches(current_setting('test.p08_dog_a')::uuid, 'P08-TEST-A') then
    raise exception 'Owner could not verify exact source attribution';
  end if;
  if public.owned_dog_attribution_matches(current_setting('test.p08_dog_a')::uuid, 'P08-OTHER') then
    raise exception 'Wrong source code matched';
  end if;
  if public.owned_dog_attribution_matches(current_setting('test.p08_dog_a')::uuid, null) then
    raise exception 'Attributed dog matched a source-free create';
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$ begin
  begin
    perform public.create_dog('Synthetic inactive', 'unknown', current_date - 70, 'P08-TEST-OFF');
    raise exception 'Inactive source code was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Invalid kennel code' then raise; end if;
  end;
  if public.owned_dog_attribution_matches(current_setting('test.p08_dog_a')::uuid, 'P08-TEST-A') then
    raise exception 'Another owner verified attribution for a dog they do not own';
  end if;
end $$;
rollback;

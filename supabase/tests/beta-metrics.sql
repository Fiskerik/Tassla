-- Synthetic probe. Run as postgres after foundation, planned-health, reminders and P09 migrations.
-- The transaction is rolled back so no fixture or event persists.
begin;
insert into auth.users(id, email) values
  ('a9000000-0000-4000-8000-000000000001','metrics-a@example.invalid'),
  ('a9000000-0000-4000-8000-000000000002','metrics-b@example.invalid');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a9000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ declare first_id uuid; duplicate_id uuid; begin
  if public.get_beta_metrics_consent() then raise exception 'Consent must default off'; end if;
  if public.record_product_event('home_viewed') is not null then raise exception 'Event accepted without consent'; end if;
  if not public.set_beta_metrics_consent(true) then raise exception 'Could not enable consent'; end if;
  first_id := public.record_product_event('home_viewed');
  duplicate_id := public.record_product_event('home_viewed');
  if first_id is null or duplicate_id <> first_id then raise exception 'Event missing or short retry not deduplicated'; end if;
  begin
    perform public.record_product_event('health_weight_changed');
    raise exception 'Non-allowlisted event accepted';
  exception when invalid_parameter_value then null; end;
  begin
    insert into public.product_events(id, user_id, event_type) values(gen_random_uuid(), auth.uid(), 'home_viewed');
    raise exception 'Direct event write granted';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"a9000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
  if public.get_beta_metrics_consent() then raise exception 'Owner B inherited owner A consent'; end if;
  if public.record_product_event('home_viewed') is not null then raise exception 'Owner B event accepted without consent'; end if;
  if exists(select 1 from public.beta_metrics_consents where user_id='a9000000-0000-4000-8000-000000000001') then
    raise exception 'Owner B can read owner A consent';
  end if;
  if not public.set_beta_metrics_consent(true) then raise exception 'Owner B could not opt in independently'; end if;
  if public.record_product_event('training_completed') is null then raise exception 'Owner B opted-in event missing'; end if;
end $$;

reset role;
-- Create an expired synthetic event and verify the bounded purge removes only expired data.
insert into public.product_events(id,user_id,event_type,occurred_at) values
  ('aa000000-0000-4000-8000-000000000001','a9000000-0000-4000-8000-000000000001','meaningful_return',now()-interval '31 days');
do $$ begin
  if public.purge_expired_product_events() < 1 then raise exception 'Expired event was not purged'; end if;
  if exists(select 1 from public.product_events where id='aa000000-0000-4000-8000-000000000001') then raise exception 'Expired event remains'; end if;
  if not exists(select 1 from public.product_events where user_id='a9000000-0000-4000-8000-000000000001' and event_type='home_viewed') then raise exception 'Recent event was purged'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a9000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
  if not public.set_beta_metrics_consent(false) then raise exception 'Could not withdraw consent'; end if;
  if public.get_beta_metrics_consent() then raise exception 'Withdrawal did not disable consent'; end if;
end $$;

set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
  begin
    perform public.set_beta_metrics_consent(true);
    raise exception 'Anonymous consent call succeeded';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
do $$ begin
  if exists(select 1 from public.product_events where user_id='a9000000-0000-4000-8000-000000000001') then raise exception 'Withdrawal did not erase events'; end if;
  if not exists(select 1 from public.product_events where user_id='a9000000-0000-4000-8000-000000000002' and event_type='training_completed') then raise exception 'Owner A withdrawal erased owner B events'; end if;
  if not exists(select 1 from public.beta_metrics_consents where user_id='a9000000-0000-4000-8000-000000000002' and enabled) then raise exception 'Owner A withdrawal changed owner B consent'; end if;
end $$;
delete from auth.users where id='a9000000-0000-4000-8000-000000000001';
do $$ begin
  if exists(select 1 from public.beta_metrics_consents where user_id='a9000000-0000-4000-8000-000000000001') then raise exception 'Consent survived account deletion'; end if;
  if exists(select 1 from public.product_events where user_id='a9000000-0000-4000-8000-000000000001') then raise exception 'Events survived account deletion'; end if;
  if not exists(select 1 from auth.users where id='a9000000-0000-4000-8000-000000000002') then raise exception 'Owner B account changed'; end if;
end $$;
rollback;
select 'P09 metrics RLS/consent/retention probe passed; synthetic data rolled back' as result;

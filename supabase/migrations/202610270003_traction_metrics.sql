-- Opt-in-only traction signals. Existing events and withdrawal behavior remain unchanged.
begin;
alter table public.product_events drop constraint product_events_event_type_check;
alter table public.product_events add constraint product_events_event_type_check check (event_type in
  ('onboarding_opened','referral_opened','dog_created','home_viewed','first_log','training_started','training_completed','routine_completed','meaningful_return'));

create or replace function public.record_product_event(p_event_type text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  event_id uuid;
  event_time timestamptz := now();
begin
  if owner_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_event_type is null or p_event_type not in ('onboarding_opened','referral_opened','dog_created','home_viewed','first_log','training_started','training_completed','routine_completed','meaningful_return') then
    raise exception 'event type not allowed' using errcode = '22023';
  end if;
  -- Locking the consent row makes an event and withdrawal serialize for this account.
  perform 1 from public.beta_metrics_consents c
    where c.user_id = owner_id and c.enabled = true for update;
  if not found then return null; end if;
  delete from public.product_events where user_id = owner_id and occurred_at < event_time - interval '30 days';
  if (select count(*) from public.product_events e
      where e.user_id = owner_id and e.occurred_at >= date_trunc('day', event_time)) >= 100 then
    return null;
  end if;
  select e.id into event_id from public.product_events e
    where e.user_id = owner_id and e.event_type = p_event_type
      and e.occurred_at >= event_time - interval '2 seconds'
    order by e.occurred_at desc limit 1;
  if event_id is not null then return event_id; end if;
  event_id := gen_random_uuid();
  insert into public.product_events(id, user_id, event_type, occurred_at)
    values(event_id, owner_id, p_event_type, event_time);
  return event_id;
end;
$$;


-- Completed UTC cohorts only: each account contributes at most once and only while
-- its opted-in events remain within the existing 30-day retention period.
create function public.beta_traction_report(p_from date, p_to date)
returns table(cohort_size bigint, referral bigint, dog_created bigint, home_viewed bigint, first_value bigint, d1 bigint, d7 bigint)
language plpgsql security definer set search_path = '' as $$
declare today_utc date := (now() at time zone 'UTC')::date;
begin
  if p_from is null or p_to is null or p_from > p_to or p_from < today_utc - 21 or p_to > today_utc - 9 then
    raise exception 'Choose completed cohorts between 21 and 9 UTC days ago' using errcode = '22023';
  end if;
  return query
  with first_open as (
    select e.user_id, min(e.occurred_at) as started
    from public.product_events e
    join public.beta_metrics_consents c on c.user_id = e.user_id and c.enabled
    where e.event_type = 'onboarding_opened' and e.occurred_at >= now() - interval '30 days'
    group by e.user_id
  ), cohort as (
    select f.user_id, f.started from first_open f
    where (f.started at time zone 'UTC')::date between p_from and p_to
  ), dog_stage as (
    select c.*,
      (select min(e.occurred_at) from public.product_events e where e.user_id = c.user_id
        and e.event_type = 'dog_created' and e.occurred_at >= c.started) as dog_at
    from cohort c
  ), home_stage as (
    select d.*,
      (select min(e.occurred_at) from public.product_events e where e.user_id = d.user_id
        and e.event_type = 'home_viewed' and e.occurred_at >= d.dog_at - interval '30 seconds') as home_at
    from dog_stage d
  ), flags as (
    select c.user_id,
      bool_or(e.event_type = 'referral_opened' and e.occurred_at between c.started - interval '10 minutes' and c.started + interval '1 day') as referral,
      c.dog_at is not null as dog_created,
      c.home_at is not null as home_viewed,
      bool_or(e.event_type in ('first_log', 'training_started', 'routine_completed') and e.occurred_at >= c.home_at) as first_value,
      bool_or(e.event_type = 'home_viewed' and e.occurred_at >= c.started + interval '1 day' and e.occurred_at < c.started + interval '2 days') as d1,
      bool_or(e.event_type = 'home_viewed' and e.occurred_at >= c.started + interval '7 days' and e.occurred_at < c.started + interval '8 days') as d7
    from home_stage c join public.product_events e on e.user_id = c.user_id
    group by c.user_id, c.dog_at, c.home_at
  ), totals as (
    select count(*) as n, count(*) filter (where f.referral) as referral,
      count(*) filter (where f.dog_created) as dog_created, count(*) filter (where f.home_viewed) as home_viewed,
      count(*) filter (where f.first_value) as first_value, count(*) filter (where f.d1) as d1, count(*) filter (where f.d7) as d7
    from flags f
  )
  select case when n >= 5 then n end,
    case when n >= 5 and totals.referral >= 5 then totals.referral end,
    case when n >= 5 and totals.dog_created >= 5 then totals.dog_created end,
    case when n >= 5 and totals.home_viewed >= 5 then totals.home_viewed end,
    case when n >= 5 and totals.first_value >= 5 then totals.first_value end,
    case when n >= 5 and totals.d1 >= 5 then totals.d1 end,
    case when n >= 5 and totals.d7 >= 5 then totals.d7 end from totals;
end;
$$;
revoke all on function public.beta_traction_report(date,date) from public, anon, authenticated;
grant execute on function public.beta_traction_report(date,date) to service_role;

commit;

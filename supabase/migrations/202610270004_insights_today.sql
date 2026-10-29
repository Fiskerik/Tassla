-- Extend the existing owner-scoped Insights RPC with the current local day.
create or replace function public.dog_event_insights(
  p_dog_id uuid,
  p_period text,
  p_timezone text
) returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_as_of timestamptz := pg_catalog.statement_timestamp();
  v_observed_through date;
  v_first_log_day date;
  v_period_start date;
  v_period_end_exclusive date;
  v_bucket text;
  v_days jsonb;
begin
  if not private.owns_dog(p_dog_id) then
    raise exception 'Insufficient privilege' using errcode = '42501';
  end if;

  if p_period is null or p_period not in ('today', 'week', 'month', 'since_first_log') then
    raise exception 'Invalid period' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names z
    where z.name = p_timezone
      and (z.name = 'UTC' or pg_catalog.strpos(z.name, '/') > 0)
  ) then
    raise exception 'Invalid timezone' using errcode = '22023';
  end if;

  v_observed_through := (v_as_of at time zone p_timezone)::date;

  select pg_catalog.min((e.occurred_at at time zone p_timezone)::date)
  into v_first_log_day
  from public.dog_events e
  where e.dog_id = p_dog_id
    and e.event_type in ('pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water')
    and e.occurred_at <= v_as_of;

  if p_period = 'today' then
    v_period_start := v_observed_through;
    v_period_end_exclusive := v_observed_through + 1;
    v_bucket := 'day';
  elsif p_period = 'week' then
    v_period_start := v_observed_through - (pg_catalog.date_part('isodow', v_observed_through::timestamp)::integer - 1);
    v_period_end_exclusive := v_period_start + 7;
    v_bucket := 'day';
  elsif p_period = 'month' then
    v_period_start := pg_catalog.date_trunc('month', v_observed_through::timestamp)::date;
    v_period_end_exclusive := (v_period_start + interval '1 month')::date;
    v_bucket := 'day';
  else
    v_period_start := v_first_log_day;
    v_period_end_exclusive := case when v_first_log_day is null then null else v_observed_through + 1 end;
    v_bucket := 'month';
  end if;

  if p_period = 'since_first_log' then
    with event_rows as (
      select (e.occurred_at at time zone p_timezone)::date as local_day,
        e.event_type,
        e.accident_kinds
      from public.dog_events e
      where e.dog_id = p_dog_id
        and e.event_type in ('pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water')
        and e.occurred_at <= v_as_of
        and v_first_log_day is not null
        and (e.occurred_at at time zone p_timezone)::date >= v_first_log_day
    ), month_counts as (
      select pg_catalog.date_trunc('month', r.local_day::timestamp)::date as month_start,
        pg_catalog.count(*) filter (where r.event_type = 'pee'
          or (r.event_type = 'accident' and r.accident_kinds @> array['pee']::text[])) as pee_count,
        pg_catalog.count(*) filter (where r.event_type = 'poop'
          or (r.event_type = 'accident' and r.accident_kinds @> array['poop']::text[])) as poop_count,
        pg_catalog.count(*) filter (where r.event_type = 'accident' and r.accident_kinds is null) as unclassified_accident_count,
        pg_catalog.count(*) filter (where r.event_type = 'sleep') as sleep_count,
        pg_catalog.count(*) filter (where r.event_type = 'awake') as awake_count
      from event_rows r
      group by 1
    )
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'date', pg_catalog.to_char(m.month_start, 'YYYY-MM'),
      'peeCount', m.pee_count,
      'poopCount', m.poop_count,
      'unclassifiedAccidentCount', m.unclassified_accident_count,
      'sleepCount', m.sleep_count,
      'awakeCount', m.awake_count
    ) order by m.month_start), '[]'::jsonb)
    into v_days
    from month_counts m;
  else
    with calendar_days as (
      select generated.day::date as local_day
      from pg_catalog.generate_series(v_period_start::timestamp, v_observed_through::timestamp, interval '1 day') generated(day)
    ), event_rows as (
      select (e.occurred_at at time zone p_timezone)::date as local_day,
        e.event_type,
        e.accident_kinds
      from public.dog_events e
      where e.dog_id = p_dog_id
        and e.event_type in ('pee', 'poop', 'food', 'sleep', 'awake', 'walk', 'accident', 'water')
        and e.occurred_at <= v_as_of
        and e.occurred_at >= (v_period_start::timestamp at time zone p_timezone)
        and e.occurred_at < (v_period_end_exclusive::timestamp at time zone p_timezone)
    ), day_counts as (
      select r.local_day,
        pg_catalog.count(*) filter (where r.event_type = 'pee'
          or (r.event_type = 'accident' and r.accident_kinds @> array['pee']::text[])) as pee_count,
        pg_catalog.count(*) filter (where r.event_type = 'poop'
          or (r.event_type = 'accident' and r.accident_kinds @> array['poop']::text[])) as poop_count,
        pg_catalog.count(*) filter (where r.event_type = 'accident' and r.accident_kinds is null) as unclassified_accident_count,
        pg_catalog.count(*) filter (where r.event_type = 'sleep') as sleep_count,
        pg_catalog.count(*) filter (where r.event_type = 'awake') as awake_count
      from event_rows r
      group by r.local_day
    )
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'date', pg_catalog.to_char(c.local_day, 'YYYY-MM-DD'),
      'peeCount', coalesce(d.pee_count, 0),
      'poopCount', coalesce(d.poop_count, 0),
      'unclassifiedAccidentCount', coalesce(d.unclassified_accident_count, 0),
      'sleepCount', coalesce(d.sleep_count, 0),
      'awakeCount', coalesce(d.awake_count, 0)
    ) order by c.local_day), '[]'::jsonb)
    into v_days
    from calendar_days c
    left join day_counts d on d.local_day = c.local_day;
  end if;

  return pg_catalog.jsonb_build_object(
    'period', p_period,
    'timezone', p_timezone,
    'asOf', v_as_of,
    'periodStartLocal', case when v_period_start is null then null else pg_catalog.to_char(v_period_start, 'YYYY-MM-DD') end,
    'periodEndExclusiveLocal', case when v_period_end_exclusive is null then null else pg_catalog.to_char(v_period_end_exclusive, 'YYYY-MM-DD') end,
    'observedThroughLocal', pg_catalog.to_char(v_observed_through, 'YYYY-MM-DD'),
    'firstLogDay', case when p_period = 'since_first_log' and v_first_log_day is not null then pg_catalog.to_char(v_first_log_day, 'YYYY-MM-DD') else null end,
    'bucket', v_bucket,
    'days', v_days
  );
end;
$$;

revoke all on function public.dog_event_insights(uuid, text, text) from public, anon, authenticated;
grant execute on function public.dog_event_insights(uuid, text, text) to authenticated;

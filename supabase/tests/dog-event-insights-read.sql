-- Run only in a dedicated development database after 202610220002_dog_event_insights_read.sql.
-- Synthetic fixtures are rolled back. This does not verify production RLS or two-session snapshot behavior.
begin;

insert into auth.users(id, email) values
  ('10000000-0000-4000-8000-000000000071', 'insights-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000072', 'insights-b@example.invalid');
insert into public.breeds(id, name) values ('insights-probe', 'Insights Probe');
insert into public.dogs(id, name, breed_id, birth_date) values
  ('20000000-0000-4000-8000-000000000071', 'Insights A', 'insights-probe', current_date - 90),
  ('20000000-0000-4000-8000-000000000072', 'Insights B', 'insights-probe', current_date - 90);
insert into public.dog_memberships(dog_id, user_id) values
  ('20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071'),
  ('20000000-0000-4000-8000-000000000072', '10000000-0000-4000-8000-000000000072');

insert into public.dog_events(id, dog_id, actor_id, event_type, occurred_at, accident_kinds) values
  ('50000000-0000-4000-8000-000000000071', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'walk', pg_catalog.clock_timestamp() - interval '2 months', null),
  ('50000000-0000-4000-8000-000000000072', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'pee', pg_catalog.clock_timestamp() - interval '2 days', null),
  ('50000000-0000-4000-8000-000000000073', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'accident', pg_catalog.clock_timestamp() - interval '1 day', null),
  ('50000000-0000-4000-8000-000000000074', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'accident', pg_catalog.clock_timestamp() - interval '1 day', array['poop']::text[]),
  ('50000000-0000-4000-8000-000000000075', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'sleep', pg_catalog.clock_timestamp() - interval '1 day', null),
  ('50000000-0000-4000-8000-000000000076', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'awake', pg_catalog.clock_timestamp() - interval '12 hours', null),
  ('50000000-0000-4000-8000-000000000077', '20000000-0000-4000-8000-000000000071', '10000000-0000-4000-8000-000000000071', 'food', pg_catalog.clock_timestamp() - interval '5 hours', null),
  ('50000000-0000-4000-8000-000000000078', '20000000-0000-4000-8000-000000000072', '10000000-0000-4000-8000-000000000072', 'pee', pg_catalog.clock_timestamp() - interval '1 hour', null);
insert into public.dog_events(id, dog_id, actor_id, event_type, occurred_on, weight_kg)
values ('50000000-0000-4000-8000-000000000079', '20000000-0000-4000-8000-000000000071',
  '10000000-0000-4000-8000-000000000071', 'weight', current_date, 8.2);

do $$
declare
  function_oid regprocedure := 'public.dog_event_insights(uuid,text,text)'::regprocedure;
  function_row record;
begin
  select p.provolatile, p.prosecdef, p.proconfig, p.proacl, p.proowner
  into function_row
  from pg_catalog.pg_proc p
  where p.oid = function_oid;
  if function_row.provolatile <> 's' then raise exception 'Insights function must be STABLE'; end if;
  if function_row.prosecdef then raise exception 'Insights function must be SECURITY INVOKER'; end if;
  if not (function_row.proconfig @> array['search_path=""']::text[]) then raise exception 'Insights function search_path is not empty'; end if;
  if has_function_privilege('authenticated', function_oid, 'EXECUTE') is not true then raise exception 'authenticated cannot execute Insights'; end if;
  if has_function_privilege('anon', function_oid, 'EXECUTE') is not false then raise exception 'anon can execute Insights'; end if;
  if exists (
    select 1 from pg_catalog.aclexplode(coalesce(function_row.proacl, pg_catalog.acldefault('f', function_row.proowner))) acl
    where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ) then raise exception 'PUBLIC can execute Insights'; end if;
end $$;

set local role authenticated;
select pg_catalog.set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000071","role":"authenticated"}', true);

do $$
declare
  result jsonb;
  history_result jsonb;
  week_result jsonb;
  month_result jsonb;
  foreign_state text;
  unknown_state text;
  foreign_message text;
  unknown_message text;
  first_event_day text;
  current_event_day text;
  error_state text;
begin
  result := public.dog_event_insights('20000000-0000-4000-8000-000000000071', 'since_first_log', 'UTC');
  if (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(result)) <> 9 then raise exception 'Unexpected top-level JSON shape'; end if;
  if result->>'period' <> 'since_first_log' or result->>'bucket' <> 'month' or result->>'timezone' <> 'UTC' then raise exception 'Unexpected history metadata'; end if;
  if (select pg_catalog.count(*) from pg_catalog.jsonb_array_elements(result->'days')) < 2 then raise exception 'History must contain sparse months with ordinary log events'; end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(result->'days') entry(value)
    where (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(entry.value)) <> 6
  ) then raise exception 'Monthly bucket does not have the exact six-field shape'; end if;
  if (select coalesce(pg_catalog.sum((entry.value->>'peeCount')::bigint), 0) from pg_catalog.jsonb_array_elements(result->'days') entry(value)) <> 1 then raise exception 'Pee count is wrong'; end if;
  if (select coalesce(pg_catalog.sum((entry.value->>'poopCount')::bigint), 0) from pg_catalog.jsonb_array_elements(result->'days') entry(value)) <> 1 then raise exception 'Explicit accident classification was not counted'; end if;
  if (select coalesce(pg_catalog.sum((entry.value->>'unclassifiedAccidentCount')::bigint), 0) from pg_catalog.jsonb_array_elements(result->'days') entry(value)) <> 1 then raise exception 'Unclassified accident count is wrong'; end if;
  if (select coalesce(pg_catalog.sum((entry.value->>'sleepCount')::bigint), 0) from pg_catalog.jsonb_array_elements(result->'days') entry(value)) <> 1
    or (select coalesce(pg_catalog.sum((entry.value->>'awakeCount')::bigint), 0) from pg_catalog.jsonb_array_elements(result->'days') entry(value)) <> 1 then raise exception 'Sleep/awake markers were not counted separately'; end if;
  if result::text like '%50000000-%' or result::text like '%weight%' then raise exception 'Private identifiers or health type leaked'; end if;

  history_result := result;
  first_event_day := history_result#>>'{firstLogDay}';
  if first_event_day is null or pg_catalog.left(first_event_day, 7) <> history_result#>>'{days,0,date}' then raise exception 'First log day does not bound sparse history'; end if;

  week_result := public.dog_event_insights('20000000-0000-4000-8000-000000000071', 'week', 'UTC');
  current_event_day := week_result->>'observedThroughLocal';
  if week_result->>'bucket' <> 'day' or week_result->>'firstLogDay' is not null then raise exception 'Unexpected week metadata'; end if;
  if (week_result->'days'->-1->>'date') <> current_event_day then raise exception 'Week contains a future day or omits the observed day'; end if;
  if (select pg_catalog.count(*) from pg_catalog.jsonb_array_elements(week_result->'days')) not between 1 and 7 then raise exception 'Week must contain 1–7 observed dates'; end if;

  month_result := public.dog_event_insights('20000000-0000-4000-8000-000000000071', 'month', 'UTC');
  if month_result->>'bucket' <> 'day' or (month_result->'days'->-1->>'date') <> month_result->>'observedThroughLocal' then raise exception 'Month must end at the observed local date'; end if;
  if (select pg_catalog.count(*) from pg_catalog.jsonb_array_elements(month_result->'days')) not between 1 and 31 then raise exception 'Month must contain 1–31 observed dates'; end if;

  begin
    perform public.dog_event_insights('20000000-0000-4000-8000-000000000072', 'week', 'UTC');
    raise exception 'Foreign dog was accepted';
  exception when insufficient_privilege then
    get stacked diagnostics foreign_state = returned_sqlstate, foreign_message = message_text;
  end;
  begin
    perform public.dog_event_insights('20000000-0000-4000-8000-000000000099', 'week', 'UTC');
    raise exception 'Unknown dog was accepted';
  exception when insufficient_privilege then
    get stacked diagnostics unknown_state = returned_sqlstate, unknown_message = message_text;
  end;
  if foreign_state <> unknown_state or foreign_message <> unknown_message then raise exception 'Foreign and unknown dog errors differ'; end if;

  begin
    perform public.dog_event_insights('20000000-0000-4000-8000-000000000071', 'quarter', 'UTC');
    raise exception 'Invalid period was accepted';
  exception when invalid_parameter_value then get stacked diagnostics error_state = returned_sqlstate;
  end;
  if error_state <> '22023' then raise exception 'Invalid period used an unexpected error'; end if;
  begin
    perform public.dog_event_insights('20000000-0000-4000-8000-000000000071', 'week', 'Not/A_Timezone');
    raise exception 'Invalid timezone was accepted';
  exception when invalid_parameter_value then get stacked diagnostics error_state = returned_sqlstate;
  end;
end $$;

reset role;
rollback;
select 'dog_event_insights synthetic owner/shape/period probe passed; no live deployment or multi-session snapshot check' as result;

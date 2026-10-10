alter table public.dog_events
  add column occurred_time time(0) without time zone;

-- Keep the foundation shape contract while reserving the new wall-clock field for performed health history.
alter table public.dog_events
  drop constraint dog_events_check;

alter table public.dog_events
  add constraint dog_events_check check (
    (event_type in ('pee','poop','food','sleep','awake','walk','accident','water')
      and occurred_at is not null and occurred_on is null and occurred_time is null and weight_kg is null)
    or (event_type = 'weight' and occurred_on is not null and occurred_at is null and occurred_time is null
      and weight_kg is not null and weight_kg > 0 and weight_kg <= 200 and duration_minutes is null)
    or (event_type in ('vaccination','vet_visit') and occurred_on is not null and occurred_at is null
      and weight_kg is null and duration_minutes is null)
  );

alter table public.dog_events
  add constraint dog_events_occurred_time_check check (
    (event_type in ('vaccination','vet_visit') and
      (occurred_time is null or (occurred_time < time '24:00:00' and extract(second from occurred_time) = 0)))
    or (event_type not in ('vaccination','vet_visit') and occurred_time is null)
  );

grant update(occurred_time) on public.dog_events to authenticated;

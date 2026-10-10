begin;

alter table public.dog_events drop constraint if exists dog_events_event_type_check;
alter table public.dog_events add constraint dog_events_event_type_check
  check (event_type in ('pee','poop','food','sleep','awake','walk','accident','water','weight','vaccination','vet_visit'));

alter table public.dog_events drop constraint if exists dog_events_check;
alter table public.dog_events add constraint dog_events_check
  check (
    (event_type in ('pee','poop','food','sleep','awake','walk','accident','water') and occurred_at is not null and occurred_on is null and weight_kg is null)
    or (event_type = 'weight' and occurred_on is not null and occurred_at is null and weight_kg is not null and weight_kg > 0 and weight_kg <= 200 and duration_minutes is null)
    or (event_type in ('vaccination','vet_visit') and occurred_on is not null and occurred_at is null and weight_kg is null)
  );

commit;

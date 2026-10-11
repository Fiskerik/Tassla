begin;

alter table public.dog_events
  add column accident_kind text,
  add column amount numeric,
  add column amount_unit text,
  add column food_type text;

alter table public.dog_events
  add constraint dog_events_accident_kind_check check (
    accident_kind is null
    or (event_type = 'accident' and accident_kind in ('pee', 'poop', 'both'))
  );

alter table public.dog_events
  add constraint dog_events_amount_unit_check check (
    (amount is null and amount_unit is null)
    or (
      amount is not null and amount_unit is not null and amount > 0
      and (
        (event_type = 'food' and amount_unit = 'g' and amount <= 2000)
        or (event_type = 'water' and amount_unit = 'ml' and amount <= 10000)
        or (event_type = 'water' and amount_unit = 'dl' and amount <= 100)
      )
    )
  );

alter table public.dog_events
  add constraint dog_events_food_type_check check (
    food_type is null
    or (
      event_type = 'food'
      and food_type = btrim(food_type, E' \t\r\n')
      and char_length(food_type) between 1 and 60
    )
  );

grant update (accident_kind, amount, amount_unit, food_type) on public.dog_events to authenticated;

commit;

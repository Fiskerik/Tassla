alter table public.dog_events
  add column accident_kinds text[];

alter table public.dog_events
  add constraint dog_events_accident_kinds_valid check (
    (event_type = 'accident' and (
      accident_kinds is null
      or accident_kinds is not distinct from array['pee']::text[]
      or accident_kinds is not distinct from array['poop']::text[]
      or accident_kinds is not distinct from array['pee', 'poop']::text[]
    ))
    or (event_type <> 'accident' and accident_kinds is null)
  );

create function private.guard_dog_event_accident_kinds() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.event_type <> 'accident' then
    if new.accident_kinds is not null then
      raise exception 'Only accident events can have accident kinds' using errcode = '23514';
    end if;
    return new;
  end if;

  if new.accident_kinds is not null then
    if new.accident_kinds is distinct from array['pee']::text[]
      and new.accident_kinds is distinct from array['poop']::text[]
      and new.accident_kinds is distinct from array['pee', 'poop']::text[] then
      raise exception 'Accident events require a canonical kind selection' using errcode = '23514';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.event_type = 'accident' and old.accident_kinds is null then
      return new;
    end if;
  end if;

  raise exception 'New or typed accident events require at least one kind' using errcode = '23514';
end;
$$;

create trigger dog_event_accident_kinds_guard
before insert or update on public.dog_events
for each row execute function private.guard_dog_event_accident_kinds();

revoke all on function private.guard_dog_event_accident_kinds() from public, anon, authenticated;
grant update(accident_kinds) on public.dog_events to authenticated;

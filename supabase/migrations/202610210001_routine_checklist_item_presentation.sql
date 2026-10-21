-- Extend existing owner-owned routine checklist metadata; no table, grant, RLS,
-- RPC signature, revision, or historical snapshot contract changes.
begin;

create or replace function private.valid_daily_routine_checklist(p_checklist jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_item jsonb;
  v_id text;
  v_label text;
  v_icon text;
  v_description text;
  v_seen text[] := '{}'::text[];
  v_count integer;
  v_keys integer;
begin
  if p_checklist is null or pg_catalog.jsonb_typeof(p_checklist) <> 'array' then return false; end if;
  v_count := pg_catalog.jsonb_array_length(p_checklist);
  if v_count < 1 or v_count > 50 then return false; end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_checklist) as entries(value) loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object' then return false; end if;
    v_keys := pg_catalog.jsonb_object_length(v_item);
    if v_keys not in (2, 3, 4) or not (v_item ? 'id') or not (v_item ? 'label')
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(v_item) as keys(key)
        where key not in ('id', 'label', 'icon', 'description')
      ) then return false; end if;
    if (v_item ? 'icon' and pg_catalog.jsonb_typeof(v_item -> 'icon') <> 'string')
      or (v_item ? 'description' and pg_catalog.jsonb_typeof(v_item -> 'description') <> 'string') then return false; end if;
    if pg_catalog.jsonb_typeof(v_item -> 'id') <> 'string'
      or pg_catalog.jsonb_typeof(v_item -> 'label') <> 'string' then return false; end if;

    v_id := v_item ->> 'id';
    v_label := v_item ->> 'label';
    v_icon := v_item ->> 'icon';
    v_description := v_item ->> 'description';
    if v_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or pg_catalog.char_length(v_label) not between 1 and 160
      or v_label ~ '^[[:space:]]|[[:space:]]$'
      or (v_item ? 'icon' and v_icon not in (
        'paw', 'water-outline', 'walk-outline', 'bed-outline', 'sunny-outline', 'leaf-outline',
        'heart-outline', 'flower-outline', 'brush-outline', 'bandage-outline', 'medkit-outline',
        'restaurant-outline', 'moon-outline', 'football-outline', 'fitness-outline', 'sparkles-outline',
        'home-outline', 'school-outline', 'rose-outline', 'star-outline'
      ))
      or (v_item ? 'description' and (
        pg_catalog.char_length(v_description) not between 1 and 160
        or v_description ~ '^[[:space:]]|[[:space:]]$'
      ))
      or v_id = any(v_seen) then return false; end if;
    v_seen := pg_catalog.array_append(v_seen, v_id);
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_daily_routine_checklist(jsonb) from public, anon, authenticated;

commit;

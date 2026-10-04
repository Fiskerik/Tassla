-- Run once in a NEW Supabase development project, as postgres (SQL Editor).
-- The transaction rolls back completely if any statement fails.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.breeds (
  id text primary key,
  name text not null check (char_length(name) between 1 and 100)
);
create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  breed_id text not null references public.breeds(id),
  birth_date date not null check (birth_date <= current_date),
  created_at timestamptz not null default now()
);
create table public.dog_memberships (
  dog_id uuid primary key references public.dogs(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  created_at timestamptz not null default now()
);
create table public.kennels (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  distribution_code text not null unique check (distribution_code ~ '^[A-Z0-9-]{4,40}$'),
  active boolean not null default true
);
create table public.dog_attribution (
  dog_id uuid primary key references public.dogs(id) on delete cascade,
  kennel_id uuid not null references public.kennels(id),
  created_at timestamptz not null default now()
);
create table public.dog_events (
  id uuid primary key,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  actor_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('pee','poop','food','sleep','awake','walk','weight','vaccination','vet_visit')),
  occurred_at timestamptz,
  occurred_on date,
  weight_kg numeric(6,3),
  duration_minutes integer check (duration_minutes between 0 and 1440),
  description text check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  check (
    (event_type in ('pee','poop','food','sleep','awake','walk') and occurred_at is not null and occurred_on is null and weight_kg is null)
    or (event_type = 'weight' and occurred_on is not null and occurred_at is null and weight_kg is not null and weight_kg > 0 and weight_kg <= 200 and duration_minutes is null)
    or (event_type in ('vaccination','vet_visit') and occurred_on is not null and occurred_at is null and weight_kg is null and duration_minutes is null)
  ),
  check (duration_minutes is null or event_type in ('sleep','walk'))
);
create index dog_events_history on public.dog_events(dog_id, occurred_at desc, occurred_on desc);
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  due_on date not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);
create index reminders_dog on public.reminders(dog_id);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  content_type text not null check (content_type in ('article','guide','checklist','training_program'))
);
create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id),
  version integer not null check (version > 0),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null,
  min_age_weeks integer not null default 0 check (min_age_weeks >= 0),
  max_age_weeks integer check (max_age_weeks >= min_age_weeks),
  status text not null default 'draft' check (status in ('draft','reviewed','published','withdrawn')),
  reviewed_at timestamptz,
  review_reference text,
  sources text[] not null default '{}',
  published_at timestamptz,
  unique(content_id, version),
  check (status not in ('reviewed','published','withdrawn') or (reviewed_at is not null and nullif(btrim(review_reference),'') is not null)),
  check (status not in ('published','withdrawn') or published_at is not null)
);
create index content_versions_feed on public.content_versions(status, min_age_weeks);
create table public.content_breed_targets (
  content_version_id uuid not null references public.content_versions(id) on delete cascade,
  breed_id text not null references public.breeds(id),
  primary key(content_version_id, breed_id)
);
create table public.training_steps (
  id uuid primary key default gen_random_uuid(),
  program_version_id uuid not null references public.content_versions(id),
  step_key text not null,
  position integer not null check (position > 0),
  title text not null,
  instruction text not null,
  unique(program_version_id, step_key),
  unique(program_version_id, position),
  unique(id, program_version_id)
);
create table public.training_progress (
  dog_id uuid not null references public.dogs(id) on delete cascade,
  program_version_id uuid not null references public.content_versions(id),
  step_id uuid not null,
  completed_at timestamptz not null default now(),
  primary key(dog_id, program_version_id, step_id),
  foreign key(step_id, program_version_id) references public.training_steps(id, program_version_id)
);
create table public.product_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('dog_created','home_viewed','first_log','training_started','training_completed','meaningful_return')),
  occurred_at timestamptz not null default now()
);
-- No client metrics grants until purposes, retention and event definitions are approved.

create function private.owns_dog(target_dog uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.dog_memberships m join auth.users u on u.id = m.user_id
    where m.dog_id = target_dog and m.user_id = auth.uid()
  );
$$;
revoke all on function private.owns_dog(uuid) from public, anon;
grant execute on function private.owns_dog(uuid) to authenticated;

create function public.create_dog(dog_name text, dog_breed_id text, dog_birth_date date, kennel_code text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_dog uuid; current_user_id uuid; source_id uuid;
begin
  current_user_id := auth.uid();
  perform 1 from auth.users where id = current_user_id for update;
  if not found then raise exception 'Active authenticated account required' using errcode = '42501'; end if;
  if exists(select 1 from public.dog_memberships where user_id = current_user_id) then
    raise exception 'Pilot supports one dog per account';
  end if;
  if kennel_code is not null then
    select id into source_id from public.kennels where distribution_code = upper(btrim(kennel_code)) and active;
    if source_id is null then raise exception 'Invalid kennel code'; end if;
  end if;
  insert into public.dogs(name, breed_id, birth_date) values (btrim(dog_name), dog_breed_id, dog_birth_date) returning id into new_dog;
  insert into public.dog_memberships(dog_id, user_id) values (new_dog, current_user_id);
  if source_id is not null then insert into public.dog_attribution(dog_id, kennel_id) values (new_dog, source_id); end if;
  return new_dog;
end;
$$;
revoke all on function public.create_dog(text,text,date,text) from public, anon;
grant execute on function public.create_dog(text,text,date,text) to authenticated;

-- Published content is immutable except withdrawal; new corrections get new versions.
create function private.protect_content_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.status in ('published','withdrawn') then
    if tg_op = 'DELETE' then raise exception 'Published history cannot be deleted' using errcode='23514'; end if;
    if old.status = 'published' and new.status = 'withdrawn'
      and (to_jsonb(new) - 'status') = (to_jsonb(old) - 'status') then return new; end if;
    raise exception 'Create a new content version instead' using errcode='23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger protect_content_version before update or delete on public.content_versions
for each row execute function private.protect_content_version();

create function private.protect_content_child() returns trigger
language plpgsql set search_path = '' as $$
declare old_version uuid; new_version uuid; parent_id uuid;
begin
  if tg_op <> 'INSERT' then
    old_version := case when tg_table_name = 'training_steps' then (to_jsonb(old)->>'program_version_id')::uuid else (to_jsonb(old)->>'content_version_id')::uuid end;
  end if;
  if tg_op <> 'DELETE' then
    new_version := case when tg_table_name = 'training_steps' then (to_jsonb(new)->>'program_version_id')::uuid else (to_jsonb(new)->>'content_version_id')::uuid end;
  end if;
  -- Lock parents so publication and child edits cannot race.
  for parent_id in select id from public.content_versions where id in (old_version,new_version) order by id for update loop
    if exists(select 1 from public.content_versions where id = parent_id and status in ('published','withdrawn')) then
      raise exception 'Published child records are immutable' using errcode='23514';
    end if;
  end loop;
  if tg_table_name = 'training_steps' and tg_op <> 'DELETE' and not exists (
    select 1 from public.content_versions v join public.content_items i on i.id = v.content_id
    where v.id = new_version and i.content_type = 'training_program'
  ) then raise exception 'Training step requires a training program'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger protect_training_step before insert or update or delete on public.training_steps
for each row execute function private.protect_content_child();
create trigger protect_breed_target before insert or update or delete on public.content_breed_targets
for each row execute function private.protect_content_child();

create function private.protect_content_type() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.content_type <> old.content_type and exists(select 1 from public.content_versions where content_id=old.id) then
    raise exception 'Content type cannot change after versions exist' using errcode='23514';
  end if;
  return new;
end;
$$;
create trigger protect_content_type before update on public.content_items
for each row execute function private.protect_content_type();

-- Auth deletion cleans up the sole-owned dog before memberships cascade.
create function private.cleanup_owner_dogs() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.dogs where id in (select dog_id from public.dog_memberships where user_id = old.id);
  return old;
end;
$$;
create trigger cleanup_owner_dogs before delete on auth.users for each row execute function private.cleanup_owner_dogs();
revoke all on function private.protect_content_version(), private.protect_content_child(), private.protect_content_type(), private.cleanup_owner_dogs() from public, anon, authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['breeds','dogs','dog_memberships','kennels','dog_attribution','dog_events','reminders','content_items','content_versions','content_breed_targets','training_steps','training_progress','product_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end;
$$;
grant select on public.breeds, public.dogs, public.dog_memberships, public.dog_attribution,
  public.content_items, public.content_versions, public.content_breed_targets, public.training_steps to authenticated;
grant update(name, breed_id, birth_date) on public.dogs to authenticated;
grant select, insert, delete on public.dog_events, public.reminders, public.training_progress to authenticated;
grant update(event_type, occurred_at, occurred_on, weight_kg, duration_minutes, description) on public.dog_events to authenticated;
grant update(title, due_on, enabled) on public.reminders to authenticated;

create policy breed_read on public.breeds for select to authenticated using (true);
create policy dog_read on public.dogs for select to authenticated using (private.owns_dog(id));
create policy dog_update on public.dogs for update to authenticated using (private.owns_dog(id)) with check (private.owns_dog(id));
create policy membership_read on public.dog_memberships for select to authenticated using (private.owns_dog(dog_id));
create policy attribution_read on public.dog_attribution for select to authenticated using (private.owns_dog(dog_id));
create policy event_read on public.dog_events for select to authenticated using (private.owns_dog(dog_id));
create policy event_insert on public.dog_events for insert to authenticated with check (private.owns_dog(dog_id) and actor_id = auth.uid());
create policy event_update on public.dog_events for update to authenticated using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id) and actor_id = auth.uid());
create policy event_delete on public.dog_events for delete to authenticated using (private.owns_dog(dog_id));
create policy reminder_owner on public.reminders for all to authenticated using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
create policy version_read on public.content_versions for select to authenticated using (status = 'published');
create policy item_read on public.content_items for select to authenticated using (exists(select 1 from public.content_versions v where v.content_id = content_items.id and v.status = 'published'));
create policy target_read on public.content_breed_targets for select to authenticated using (exists(select 1 from public.content_versions v where v.id = content_version_id and v.status = 'published'));
create policy step_read on public.training_steps for select to authenticated using (exists(select 1 from public.content_versions v where v.id = program_version_id and v.status = 'published'));
create policy progress_read on public.training_progress for select to authenticated using (private.owns_dog(dog_id));
create policy progress_insert on public.training_progress for insert to authenticated with check (
  private.owns_dog(dog_id) and exists(select 1 from public.content_versions v where v.id = program_version_id and v.status = 'published')
);
create policy progress_delete on public.training_progress for delete to authenticated using (private.owns_dog(dog_id));

insert into public.breeds(id,name) values ('unknown','Okänd ras'),('mixed','Blandras');
commit;

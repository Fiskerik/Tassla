-- Owner-entered planned vaccinations and veterinary visits; separate from completed dog_events.
begin;

create table public.dog_health_plans (
  id uuid primary key,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  event_type text not null check (event_type in ('vaccination','vet_visit')),
  due_on date not null,
  description text check (description is null or char_length(description) <= 500),
  created_at timestamptz not null default now()
);
create index dog_health_plans_due on public.dog_health_plans(dog_id, due_on, id);

alter table public.dog_health_plans enable row level security;
revoke all on table public.dog_health_plans from public, anon, authenticated;
grant all on table public.dog_health_plans to service_role;
grant select, delete on public.dog_health_plans to authenticated;
grant insert(id, dog_id, event_type, due_on, description) on public.dog_health_plans to authenticated;
grant update(due_on, description) on public.dog_health_plans to authenticated;

create policy dog_health_plans_read on public.dog_health_plans for select to authenticated
  using (private.owns_dog(dog_id));
create policy dog_health_plans_insert on public.dog_health_plans for insert to authenticated
  with check (private.owns_dog(dog_id));
create policy dog_health_plans_update on public.dog_health_plans for update to authenticated
  using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
create policy dog_health_plans_delete on public.dog_health_plans for delete to authenticated
  using (private.owns_dog(dog_id));

commit;

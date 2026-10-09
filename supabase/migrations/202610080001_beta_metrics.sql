begin;

create table public.beta_metrics_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.beta_metrics_consents enable row level security;
revoke all on table public.beta_metrics_consents from public, anon, authenticated;
grant all on table public.beta_metrics_consents to service_role;
revoke all on table public.product_events from public, anon, authenticated;

create index product_events_user_occurred_idx on public.product_events(user_id, occurred_at desc);

create policy beta_metrics_consent_read_own on public.beta_metrics_consents
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.beta_metrics_consents to authenticated;

create function public.get_beta_metrics_consent() returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  return coalesce((select c.enabled from public.beta_metrics_consents c where c.user_id = owner_id), false);
end;
$$;

create function public.set_beta_metrics_consent(p_enabled boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  insert into public.beta_metrics_consents(user_id, enabled, updated_at)
    values(owner_id, p_enabled, now())
  on conflict(user_id) do update set enabled = excluded.enabled, updated_at = excluded.updated_at;
  if not p_enabled then
    delete from public.product_events where user_id = owner_id;
  end if;
  return true;
end;
$$;

create function public.record_product_event(p_event_type text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  event_id uuid;
  event_time timestamptz := now();
begin
  if owner_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_event_type is null or p_event_type not in ('dog_created','home_viewed','first_log','training_started','training_completed','meaningful_return') then
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

-- Invoke from a daily Supabase scheduled database job. Purge is bounded and service-only.
create function public.purge_expired_product_events() returns bigint
language plpgsql security definer set search_path = '' as $$
declare deleted_count bigint;
begin
  delete from public.product_events where occurred_at < now() - interval '30 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.get_beta_metrics_consent() from public, anon;
revoke all on function public.set_beta_metrics_consent(boolean) from public, anon;
revoke all on function public.record_product_event(text) from public, anon;
revoke all on function public.purge_expired_product_events() from public, anon, authenticated;
grant execute on function public.get_beta_metrics_consent() to authenticated;
grant execute on function public.set_beta_metrics_consent(boolean) to authenticated;
grant execute on function public.record_product_event(text) to authenticated;
grant execute on function public.purge_expired_product_events() to service_role;

commit;

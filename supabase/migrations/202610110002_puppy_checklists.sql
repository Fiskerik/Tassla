-- Immutable review-v1 checklist catalogue and private, dog-owned progress.
create table public.checklist_templates (
  id text primary key,
  title text not null,
  check (length(id) between 1 and 100),
  check (length(btrim(title)) between 1 and 160)
);
insert into public.checklist_templates(id, title) values
('review-v1:before-homecoming','Inför hemkomsten'),
('review-v1:first-days','Första dagarna hemma'),
('review-v1:8-12-weeks','8–12 veckor'),
('review-v1:3-6-months','3–6 månader'),
('review-v1:6-12-months','6–12 månader'),
('review-v1:over-1-year','Över ett år');
create table public.checklist_template_items (
  template_id text not null,
  item_key text not null,
  title text not null,
  primary key (template_id, item_key),
  foreign key (template_id) references public.checklist_templates(id) on delete restrict,
  check (length(template_id) between 1 and 100),
  check (length(item_key) between 1 and 100),
  check (length(btrim(title)) between 1 and 160)
);

insert into public.checklist_template_items(template_id, item_key, title) values
('review-v1:before-homecoming','safe-space','Ordna en trygg viloplats'),
('review-v1:before-homecoming','supplies','Förbered det viktigaste hemma'),
('review-v1:before-homecoming','vet-contact','Ta reda på närmaste veterinär'),
('review-v1:first-days','quiet-start','Håll de första dagarna lugna'),
('review-v1:first-days','routine','Börja med enkla vardagsrutiner'),
('review-v1:first-days','rest','Låt valpen vila ostört'),
('review-v1:8-12-weeks','name','Öva på namnet med belöning'),
('review-v1:8-12-weeks','handling','Vänj valpen varsamt vid hantering'),
('review-v1:8-12-weeks','alone','Börja mycket kort med egentid'),
('review-v1:3-6-months','recall','Öva inkallning på trygg plats'),
('review-v1:3-6-months','settle','Belöna lugn och vila'),
('review-v1:3-6-months','walks','Utforska omgivningen tillsammans'),
('review-v1:6-12-months','review','Repetera sådant som fungerar'),
('review-v1:6-12-months','focus','Öva kontakt i lugn miljö'),
('review-v1:6-12-months','breaks','Planera in pauser under aktivitet'),
('review-v1:over-1-year','enjoy','Välj en vardagsfärdighet att öva'),
('review-v1:over-1-year','adapt','Anpassa svårigheten efter hunden'),
('review-v1:over-1-year','play','Avsluta med något hunden uppskattar');

create table public.dog_checklist_progress (
  dog_id uuid not null references public.dogs(id) on delete cascade,
  template_id text not null,
  item_key text not null,
  primary key (dog_id, template_id, item_key),
  foreign key (template_id, item_key) references public.checklist_template_items(template_id, item_key) on delete restrict
);
create table public.dog_checklist_custom_items (
  id uuid not null,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  template_id text not null,
  title text not null,
  completed boolean not null default false,
  primary key (dog_id, id),
  foreign key (template_id) references public.checklist_templates(id) on delete restrict,
  check (length(btrim(title)) between 1 and 160)
);
create table public.dog_checklist_preferences (
  dog_id uuid primary key references public.dogs(id) on delete cascade,
  context text not null check (context in ('before_homecoming','first_days','by_age'))
);

alter table public.checklist_template_items enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.dog_checklist_progress enable row level security;
alter table public.dog_checklist_custom_items enable row level security;
alter table public.dog_checklist_preferences enable row level security;
create policy checklist_progress_owner on public.dog_checklist_progress for all to authenticated using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
create policy checklist_custom_owner on public.dog_checklist_custom_items for all to authenticated using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
create policy checklist_preference_owner on public.dog_checklist_preferences for all to authenticated using (private.owns_dog(dog_id)) with check (private.owns_dog(dog_id));
revoke all on public.checklist_templates, public.checklist_template_items, public.dog_checklist_progress, public.dog_checklist_custom_items, public.dog_checklist_preferences from public, anon;
revoke all on public.checklist_templates, public.checklist_template_items, public.dog_checklist_progress, public.dog_checklist_custom_items, public.dog_checklist_preferences from authenticated;
grant select, delete on public.dog_checklist_progress to authenticated;
grant insert (dog_id, template_id, item_key) on public.dog_checklist_progress to authenticated;
grant select, delete on public.dog_checklist_custom_items to authenticated;
grant insert (id, dog_id, template_id, title, completed) on public.dog_checklist_custom_items to authenticated;
grant update (title, completed) on public.dog_checklist_custom_items to authenticated;
grant select on public.dog_checklist_preferences to authenticated;
grant insert (dog_id, context) on public.dog_checklist_preferences to authenticated;
grant update (context) on public.dog_checklist_preferences to authenticated;

-- Generated from docs/content/recall-program-draft-v1.md.
-- Publishes the AI-assisted, source-checked program. No human review is represented.
-- Existing conflicting versions or steps fail closed; published data is never overwritten.
begin;
do $publish$
declare
  d jsonb := $recall${"schema_version":1,"content_id":"15711f2f-19e5-51f2-909a-69b300b4ad0f","version_id":"e3176338-849e-54ee-bd9c-ed0a8aa75f64","slug":"inkallning-i-sma-steg","version":1,"title":"Inkallning i små steg","body":"Inkallning övas med belöning i en lugn miljö. Börja nära och gör en sak svårare i taget. Använd en säker inhägnad plats eller en långlina fäst i en välpassande sele utomhus och håll linan under uppsikt. Om hunden inte kommer, vänta lugnt och gå vid behov fram utan att jaga; ryck eller dra inte i linan. Gör nästa försök lättare genom att gå närmare eller öka avståndet till störningen. Pausa eller avsluta om hunden visar oro eller obehag. Straffa inte hunden för att komma tillbaka, och belöna även om återkomsten tog tid. Vid ny beteendeförändring eller misstanke om smärta, kontakta veterinär. Vid träningssvårigheter kan en kvalificerad belöningsbaserad tränare hjälpa.","min_age_weeks":0,"max_age_weeks":null,"status":"draft","is_ai_generated":true,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/come","https://www.dogstrust.org.uk/dog-advice/training/basics/recall-training","https://www.dogstrust.org.uk/dog-advice/understanding-your-dog/signs-your-dog-may-be-stressed","https://www.dogstrust.org.uk/dog-advice/training/unwanted-behaviours/chasing","https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf"],"steps":[{"id":"b64d623f-9815-57de-9846-3488dc5cc3fa","step_key":"recall-1","position":1,"title":"Kom nära inomhus","instruction":"### Du behöver\nEn lugn plats och en belöning som hunden uppskattar.\n\n### Så gör ni\n1. Stå nära hunden och vänta tills uppmärksamheten finns hos dig.\n2. Säg en kort inkallningssignal med vänlig röst, ta ett steg bakåt och ge hunden tid att svara innan signalen upprepas.\n3. Beröm och belöna när hunden kommer fram.\n\n### Gör det lättare\nMinska avståndet och ta bort störningar.\n\n### Gör det svårare\nProva från en annan plats i samma rum när övningen känns trygg.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."},{"id":"38067fbf-488e-5385-a201-4a6602bfcdfa","step_key":"recall-2","position":2,"title":"Lite mer avstånd","instruction":"### Du behöver\nSamma belöning och en säker plats inomhus.\n\n### Så gör ni\n1. Öka avståndet lite när det korta avståndet fungerar.\n2. Ge samma inkallningssignal och belöna när hunden kommer.\n3. Variera var ni står utan att göra avståndet längre varje gång.\n\n### Gör det lättare\nGå närmare igen.\n\n### Gör det svårare\nProva från ett intilliggande rum när vägen mellan er är fri.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."},{"id":"ec870570-d9fb-53a5-8652-6d7235733ce1","step_key":"recall-3","position":3,"title":"En lätt störning","instruction":"### Du behöver\nBelöning och en lugn, kontrollerad miljö.\n\n### Så gör ni\n1. Lägg till en mild, kontrollerad vardagsstörning på avstånd. Låt inte hunden behöva närma sig något som skrämmer eller överväldigar.\n2. Börja nära hunden och ge inkallningssignalen när hunden har möjlighet att uppmärksamma dig.\n3. Belöna när hunden kommer och ta sedan en paus.\n\n### Gör det lättare\nÖka avståndet till störningen eller ta bort den.\n\n### Gör det svårare\nVariera störningen försiktigt när hunden kan fokusera.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."},{"id":"c035577a-ce6e-589f-b90e-dd1f84760e3d","step_key":"recall-4","position":4,"title":"Utomhus i lugn miljö","instruction":"### Du behöver\nBelöning och en säker inhägnad plats eller långlina fäst i en välpassande sele.\n\n### Så gör ni\n1. Välj en lugn utomhusplats och kontrollera att inhägnaden är säker, eller använd långlina i sele. Håll linan under uppsikt utan att rycka eller dra.\n2. Börja nära och använd samma inkallningssignal som inomhus.\n3. Beröm och belöna när hunden kommer.\n\n### Gör det lättare\nGå närmare eller välj en lugnare plats.\n\n### Gör det svårare\nÖka avståndet lite när hunden är redo.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."},{"id":"db7aac1e-6a24-5677-97da-326b95161f1e","step_key":"recall-5","position":5,"title":"Mer som händer runtomkring","instruction":"### Du behöver\nBelöning och långlina i sele eller en säker inhägnad plats.\n\n### Så gör ni\n1. När den lättare miljön fungerar, välj en plats där en mild, kontrollerad störning finns på tillräckligt avstånd.\n2. Börja med kort avstånd mellan dig och hunden och använd signalen.\n3. Belöna när hunden kommer och anpassa nästa försök efter hur det gick.\n\n### Gör det lättare\nÖka avståndet till störningen och gå närmare hunden.\n\n### Gör det svårare\nVariera antingen avstånd eller störning gradvis, inte båda samtidigt.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."},{"id":"2fdda6d8-f8ba-5d3b-90dc-520d2cfbf098","step_key":"recall-6","position":6,"title":"Öva i vardagen","instruction":"### Du behöver\nBelöning och en säker inhägnad plats eller långlina fäst i sele.\n\n### Så gör ni\n1. Välj en lugn vardagsmiljö på en säker inhägnad plats eller med långlina fäst i sele.\n2. Börja enkelt och belöna när hunden kommer på signalen.\n3. Låt gärna hunden fortsätta med en trygg aktivitet efter belöningen, när situationen tillåter.\n\n### Gör det lättare\nÅtergå till en välbekant plats eller kortare avstånd.\n\n### Gör det svårare\nProva en ny lugn miljö med samma säkerhet och börja nära igen.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."}],"review":{"dog_expert":"ai-assisted-pass-with-step-safety","human_review":"not-recorded","reference":"docs/content/recall-program-draft-v1.md"}}$recall$::jsonb;
  v public.content_versions%rowtype;
  s record;
begin
  perform pg_advisory_xact_lock(hashtextextended('tassla.recall-program.v1', 0));
  if d->>'status' <> 'draft' or jsonb_array_length(d->'steps') <> 6 then
    raise exception 'Invalid recall payload';
  end if;

  insert into public.content_items(id, slug, content_type)
    values ((d->>'content_id')::uuid, d->>'slug', 'training_program') on conflict (id) do nothing;
  perform 1 from public.content_items where id=(d->>'content_id')::uuid for update;
  if not exists(select 1 from public.content_items where id=(d->>'content_id')::uuid
      and slug=d->>'slug' and content_type='training_program') then
    raise exception 'Recall content identity differs from existing data';
  end if;

  insert into public.content_versions(id, content_id, version, title, body, min_age_weeks, max_age_weeks, status, is_ai_generated, sources)
    values ((d->>'version_id')::uuid, (d->>'content_id')::uuid, (d->>'version')::integer,
      d->>'title', d->>'body', (d->>'min_age_weeks')::integer, null, 'draft', true,
      array(select jsonb_array_elements_text(d->'sources'))) on conflict (id) do nothing;
  select * into v from public.content_versions where id=(d->>'version_id')::uuid for update;
  if not found or v.content_id is distinct from (d->>'content_id')::uuid
    or v.version is distinct from (d->>'version')::integer or v.title is distinct from d->>'title'
    or v.body is distinct from d->>'body' or v.min_age_weeks is distinct from (d->>'min_age_weeks')::integer
    or v.max_age_weeks is not null or v.is_ai_generated is distinct from true
    or v.sources is distinct from array(select jsonb_array_elements_text(d->'sources'))
    or to_jsonb(v)->>'context' is not null or coalesce(to_jsonb(v)->>'delivery_contract', '1') <> '1'
    or v.status not in ('draft', 'published') then
    raise exception 'Recall version differs from generated content';
  end if;
  if v.status='draft' and (v.reviewed_at is not null or v.review_reference is not null or v.published_at is not null) then
    raise exception 'Recall draft already contains review or publication metadata';
  end if;
  if v.status='published' and (v.review_reference is distinct from 'ai-assisted-dog-expert:recall-v1:2026-10-27:sha256=9f05613903b96c6502b43a8e76141c2b97a03c977f955afc3639046a3b7b2ba1' or v.reviewed_at is null or v.published_at is null) then
    raise exception 'Published recall provenance differs';
  end if;
  if exists(select 1 from public.content_breed_targets where content_version_id=v.id) then
    raise exception 'Recall program must not have unexpected breed targets';
  end if;

  if v.status='draft' then
    for s in select * from jsonb_to_recordset(d->'steps') as x(id uuid, step_key text, position integer, title text, instruction text) loop
      insert into public.training_steps(id, program_version_id, step_key, position, title, instruction)
        values (s.id, v.id, s.step_key, s.position, s.title, s.instruction) on conflict (id) do nothing;
    end loop;
  end if;
  if (select count(*) from public.training_steps where program_version_id=v.id) <> 6
    or exists(select 1 from jsonb_to_recordset(d->'steps') as x(id uuid, step_key text, position integer, title text, instruction text)
      where not exists(select 1 from public.training_steps t where t.id=x.id and t.program_version_id=v.id
        and t.step_key=x.step_key and t.position=x.position and t.title=x.title and t.instruction=x.instruction)) then
    raise exception 'Recall steps differ from generated content';
  end if;

  if v.status='draft' then
    update public.content_versions set status='published', reviewed_at='2026-10-27T00:00:00Z'::timestamptz,
      published_at=pg_catalog.clock_timestamp(), review_reference='ai-assisted-dog-expert:recall-v1:2026-10-27:sha256=9f05613903b96c6502b43a8e76141c2b97a03c977f955afc3639046a3b7b2ba1' where id=v.id;
  end if;
end;
$publish$;
commit;

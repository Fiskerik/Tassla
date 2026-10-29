-- Generated from docs/content/recall-program-draft-v1.md; draft only, no publication.
-- Use only in an explicitly selected development database after review.
begin;
do $guard$
begin
  if current_user not in ('postgres', 'supabase_admin') or nullif(current_setting('request.jwt.claim.role', true), '') is not null then
    raise exception 'Recall draft import requires a trusted database owner/admin session';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('tassla.recall-program.v1', 0));
end;
$guard$;
create temporary table recall_draft_payload on commit drop as select $recall${"schema_version":1,"content_id":"15711f2f-19e5-51f2-909a-69b300b4ad0f","version_id":"e3176338-849e-54ee-bd9c-ed0a8aa75f64","slug":"inkallning-i-sma-steg","version":1,"title":"Inkallning i små steg","body":"Inkallning övas med belöning i en lugn miljö. Börja nära och gör en sak svårare i taget. Använd en säker inhägnad plats eller en långlina fäst i en välpassande sele utomhus och håll linan under uppsikt. Om hunden inte kommer, vänta lugnt och gå vid behov fram utan att jaga; ryck eller dra inte i linan. Gör nästa försök lättare genom att gå närmare eller öka avståndet till störningen. Pausa eller avsluta om hunden visar oro eller obehag. Straffa inte hunden för att komma tillbaka, och belöna även om återkomsten tog tid. Vid ny beteendeförändring eller misstanke om smärta, kontakta veterinär. Vid träningssvårigheter kan en kvalificerad belöningsbaserad tränare hjälpa.","min_age_weeks":0,"max_age_weeks":null,"status":"draft","is_ai_generated":true,"sources":["https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/come","https://www.dogstrust.org.uk/dog-advice/training/basics/recall-training","https://www.dogstrust.org.uk/dog-advice/understanding-your-dog/signs-your-dog-may-be-stressed","https://www.dogstrust.org.uk/dog-advice/training/unwanted-behaviours/chasing","https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf"],"steps":[{"id":"b64d623f-9815-57de-9846-3488dc5cc3fa","step_key":"recall-1","position":1,"title":"Kom nära inomhus","instruction":"### Du behöver\nEn lugn plats och en belöning som hunden uppskattar.\n\n### Så gör ni\n1. Stå nära hunden och vänta tills uppmärksamheten finns hos dig.\n2. Säg en kort inkallningssignal med vänlig röst, ta ett steg bakåt och ge hunden tid att svara innan signalen upprepas.\n3. Beröm och belöna när hunden kommer fram.\n\n### Gör det lättare\nMinska avståndet och ta bort störningar.\n\n### Gör det svårare\nProva från en annan plats i samma rum när övningen känns trygg.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."},{"id":"38067fbf-488e-5385-a201-4a6602bfcdfa","step_key":"recall-2","position":2,"title":"Lite mer avstånd","instruction":"### Du behöver\nSamma belöning och en säker plats inomhus.\n\n### Så gör ni\n1. Öka avståndet lite när det korta avståndet fungerar.\n2. Ge samma inkallningssignal och belöna när hunden kommer.\n3. Variera var ni står utan att göra avståndet längre varje gång.\n\n### Gör det lättare\nGå närmare igen.\n\n### Gör det svårare\nProva från ett intilliggande rum när vägen mellan er är fri.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."},{"id":"ec870570-d9fb-53a5-8652-6d7235733ce1","step_key":"recall-3","position":3,"title":"En lätt störning","instruction":"### Du behöver\nBelöning och en lugn, kontrollerad miljö.\n\n### Så gör ni\n1. Lägg till en mild, kontrollerad vardagsstörning på avstånd. Låt inte hunden behöva närma sig något som skrämmer eller överväldigar.\n2. Börja nära hunden och ge inkallningssignalen när hunden har möjlighet att uppmärksamma dig.\n3. Belöna när hunden kommer och ta sedan en paus.\n\n### Gör det lättare\nÖka avståndet till störningen eller ta bort den.\n\n### Gör det svårare\nVariera störningen försiktigt när hunden kan fokusera.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare."},{"id":"c035577a-ce6e-589f-b90e-dd1f84760e3d","step_key":"recall-4","position":4,"title":"Utomhus i lugn miljö","instruction":"### Du behöver\nBelöning och en säker inhägnad plats eller långlina fäst i en välpassande sele.\n\n### Så gör ni\n1. Välj en lugn utomhusplats och kontrollera att inhägnaden är säker, eller använd långlina i sele. Håll linan under uppsikt utan att rycka eller dra.\n2. Börja nära och använd samma inkallningssignal som inomhus.\n3. Beröm och belöna när hunden kommer.\n\n### Gör det lättare\nGå närmare eller välj en lugnare plats.\n\n### Gör det svårare\nÖka avståndet lite när hunden är redo.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."},{"id":"db7aac1e-6a24-5677-97da-326b95161f1e","step_key":"recall-5","position":5,"title":"Mer som händer runtomkring","instruction":"### Du behöver\nBelöning och långlina i sele eller en säker inhägnad plats.\n\n### Så gör ni\n1. När den lättare miljön fungerar, välj en plats där en mild, kontrollerad störning finns på tillräckligt avstånd.\n2. Börja med kort avstånd mellan dig och hunden och använd signalen.\n3. Belöna när hunden kommer och anpassa nästa försök efter hur det gick.\n\n### Gör det lättare\nÖka avståndet till störningen och gå närmare hunden.\n\n### Gör det svårare\nVariera antingen avstånd eller störning gradvis, inte båda samtidigt.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."},{"id":"2fdda6d8-f8ba-5d3b-90dc-520d2cfbf098","step_key":"recall-6","position":6,"title":"Öva i vardagen","instruction":"### Du behöver\nBelöning och en säker inhägnad plats eller långlina fäst i sele.\n\n### Så gör ni\n1. Välj en lugn vardagsmiljö på en säker inhägnad plats eller med långlina fäst i sele.\n2. Börja enkelt och belöna när hunden kommer på signalen.\n3. Låt gärna hunden fortsätta med en trygg aktivitet efter belöningen, när situationen tillåter.\n\n### Gör det lättare\nÅtergå till en välbekant plats eller kortare avstånd.\n\n### Gör det svårare\nProva en ny lugn miljö med samma säkerhet och börja nära igen.\n\n### Trygg träning\nVid oro: pausa och ge hunden utrymme. Om hunden inte kommer, ge tid och gå vid behov lugnt fram utan att jaga. Gör nästa försök lättare. Håll långlinan under uppsikt och dra inte i den."}],"review":{"dog_expert":"ai-assisted-pass-with-step-safety","human_review":"not-recorded","reference":"docs/content/recall-program-draft-v1.md"}}$recall$::jsonb as value;
do $validate$
declare d jsonb; n integer;
begin
  select value into d from pg_temp.recall_draft_payload;
  if d->>'status' <> 'draft' or jsonb_array_length(d->'steps') <> 6 then raise exception 'Invalid recall draft'; end if;
  select count(distinct s.step_key) into n from jsonb_to_recordset(d->'steps') as s(id uuid, step_key text, position integer, title text, instruction text);
  if n <> 6 then raise exception 'Recall steps must have unique keys'; end if;
end;
$validate$;
insert into public.content_items(id, slug, content_type)
select (value->>'content_id')::uuid, value->>'slug', 'training_program' from pg_temp.recall_draft_payload
on conflict (id) do nothing;
do $item_check$
declare d jsonb;
begin
  select value into d from pg_temp.recall_draft_payload;
  perform 1 from public.content_items where id=(d->>'content_id')::uuid for update;
  if not exists(select 1 from public.content_items where id=(d->>'content_id')::uuid and slug=d->>'slug' and content_type='training_program') then
    raise exception 'Recall content identity differs from existing data';
  end if;
end;
$item_check$;
insert into public.content_versions(id, content_id, version, title, body, min_age_weeks, max_age_weeks, status, is_ai_generated, sources)
select (value->>'version_id')::uuid, (value->>'content_id')::uuid, (value->>'version')::integer,
  value->>'title', value->>'body', (value->>'min_age_weeks')::integer, null, 'draft', true,
  array(select jsonb_array_elements_text(value->'sources'))
from pg_temp.recall_draft_payload on conflict (id) do nothing;
do $version_check$
declare d jsonb;
begin
  select value into d from pg_temp.recall_draft_payload;
  perform 1 from public.content_versions where id=(d->>'version_id')::uuid for update;
  if not exists(select 1 from public.content_versions v where v.id=(d->>'version_id')::uuid
    and v.content_id=(d->>'content_id')::uuid and v.version=(d->>'version')::integer
    and v.title=d->>'title' and v.body=d->>'body' and v.min_age_weeks=(d->>'min_age_weeks')::integer
    and v.max_age_weeks is null and v.status='draft' and v.is_ai_generated=true
    and v.reviewed_at is null and v.review_reference is null and v.published_at is null
    and to_jsonb(v)->>'context' is null and coalesce(to_jsonb(v)->>'delivery_contract', '1')='1'
    and v.sources=array(select jsonb_array_elements_text(d->'sources'))) then
    raise exception 'Recall version already exists with different content or status';
  end if;
end;
$version_check$;
insert into public.training_steps(id, program_version_id, step_key, position, title, instruction)
select s.id, (d.value->>'version_id')::uuid, s.step_key, s.position, s.title, s.instruction
from pg_temp.recall_draft_payload d, jsonb_to_recordset(d.value->'steps') as s(id uuid, step_key text, position integer, title text, instruction text)
on conflict (id) do nothing;
do $step_check$
declare d jsonb;
begin
  select value into d from pg_temp.recall_draft_payload;
  if (select count(*) from public.training_steps where program_version_id=(d->>'version_id')::uuid) <> 6
    or exists(select 1 from jsonb_to_recordset(d->'steps') as s(id uuid, step_key text, position integer, title text, instruction text)
      where not exists(select 1 from public.training_steps t where t.id=s.id and t.program_version_id=(d->>'version_id')::uuid
        and t.step_key=s.step_key and t.position=s.position and t.title=s.title and t.instruction=s.instruction)) then
    raise exception 'Recall steps differ from the generated draft';
  end if;
end;
$step_check$;
commit;

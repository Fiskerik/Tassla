-- Re-review the same Drive source bytes without replacing prior review receipts or article versions.
begin;

alter table private.article_import_receipts add column review_reference text;
update private.article_import_receipts
  set review_reference = payload->>'review_reference';
alter table private.article_import_receipts alter column review_reference set not null;
alter table private.article_import_receipts drop constraint article_import_receipts_pkey;
alter table private.article_import_receipts add constraint article_import_receipts_pkey
  primary key (source_id, source_hash, review_reference);

create or replace function public.import_drive_article(article jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  source text := article->>'source_id';
  v_source_hash text := article->>'source_hash';
  head private.article_import_sources;
  receipt private.article_import_receipts;
  content uuid;
  new_version uuid;
  next_version integer;
  rule jsonb;
  expected_keys text[] := array['source_id','source_hash','modified_at','slug','title','body','min_age_weeks','max_age_weeks','breed_ids','topic_code','editorial_scope','related_source_refs','rules','review_reference','reviewed_at','is_ai_generated','sources'];
begin
  if article is null or jsonb_typeof(article) <> 'object' or
    (select count(*) from jsonb_object_keys(article)) <> cardinality(expected_keys) or
    exists(select 1 from jsonb_object_keys(article) k where not k = any(expected_keys)) or
    source is null or source !~ '^[A-Za-z0-9_-]{10,160}$' or
    v_source_hash is null or v_source_hash !~ '^[a-f0-9]{64}$' or
    article->>'slug' is null or article->>'slug' !~ '^[a-z][a-z0-9-]{1,100}$' or
    nullif(btrim(article->>'body'),'') is null or length(article->>'body') > 100000 or
    length(btrim(article->>'title')) not between 1 and 160 or
    jsonb_typeof(article->'is_ai_generated') <> 'boolean' or
    nullif(btrim(article->>'review_reference'),'') is null or
    (article->>'reviewed_at')::timestamptz > now() + interval '5 minutes' or
    (article->>'reviewed_at')::timestamptz is null or
    (article->>'modified_at')::timestamptz is null or
    jsonb_typeof(article->'rules') <> 'array' or jsonb_array_length(article->'rules') > 10 or
    jsonb_typeof(article->'breed_ids') <> 'array' or jsonb_array_length(article->'breed_ids') > 200 or
    jsonb_typeof(article->'sources') <> 'array' or
    jsonb_typeof(article->'related_source_refs') <> 'array'
  then raise exception 'Invalid reviewed article payload' using errcode = '23514'; end if;

  perform pg_advisory_xact_lock(hashtextextended(source, 0));
  select * into receipt from private.article_import_receipts r where r.source_id = source and r.source_hash = v_source_hash and r.review_reference = article->>'review_reference';
  if found then
    if (receipt.payload - 'modified_at') <> (article - 'modified_at') then raise exception 'Conflicting source receipt'; end if;
    return receipt.version_id; -- Never resurrect an old withdrawn version on retry.
  end if;
  select * into head from private.article_import_sources s where s.source_id = source for update;
  if found then
    if (article->>'modified_at')::timestamptz < head.modified_at then raise exception 'Stale source revision'; end if;
    if article->>'review_reference' = head.review_reference or (article->>'reviewed_at')::timestamptz <= head.reviewed_at
      then raise exception 'Changed source requires renewed review'; end if;
    content := head.content_id;
    if not exists(select 1 from public.content_items i where i.id = content and i.slug = article->>'slug' and i.content_type = 'article')
      then raise exception 'Source identity cannot change'; end if;
  else
    -- A new Drive file cannot silently take ownership of an existing slug.
    insert into public.content_items(slug, content_type) values(article->>'slug', 'article') returning id into content;
    insert into private.article_import_sources values(source, content, (article->>'modified_at')::timestamptz, article->>'review_reference', (article->>'reviewed_at')::timestamptz);
  end if;
  perform 1 from public.content_items where id = content for update;
  select coalesce(max(version),0)+1 into next_version from public.content_versions where content_id = content;
  insert into public.content_versions(content_id, version, title, body, min_age_weeks, max_age_weeks, is_ai_generated, reviewed_at, review_reference, sources, delivery_contract)
  values(content, next_version, article->>'title', article->>'body', (article->>'min_age_weeks')::integer,
    (article->>'max_age_weeks')::integer, (article->>'is_ai_generated')::boolean,
    (article->>'reviewed_at')::timestamptz, article->>'review_reference',
    array(select jsonb_array_elements_text(article->'sources')), 2) returning id into new_version;
  insert into public.article_version_metadata values(new_version, article->>'topic_code', article->>'editorial_scope', array(select jsonb_array_elements_text(article->'related_source_refs')));
  for rule in select jsonb_array_elements(article->'rules') loop
    if (select count(*) from jsonb_object_keys(rule)) <> 6 or not rule ?& array['rule_key','min_age_weeks','max_age_weeks','event_kind','start_days','end_days'] then
      raise exception 'Invalid article targeting rule';
    end if;
    insert into public.article_targeting_rules values(new_version, rule->>'rule_key', (rule->>'min_age_weeks')::integer,
      (rule->>'max_age_weeks')::integer, rule->>'event_kind', (rule->>'start_days')::integer, (rule->>'end_days')::integer);
  end loop;
  insert into public.content_breed_targets select new_version, jsonb_array_elements_text(article->'breed_ids');
  update public.content_versions set status = 'withdrawn' where content_id = content and status = 'published';
  update public.content_versions set status = 'published', published_at = now() where id = new_version;
  update private.article_import_sources set modified_at = (article->>'modified_at')::timestamptz,
    review_reference = article->>'review_reference', reviewed_at = (article->>'reviewed_at')::timestamptz where source_id = source;
  insert into private.article_import_receipts(source_id, source_hash, payload, version_id, review_reference)
    values(source, v_source_hash, article, new_version, article->>'review_reference');
  return new_version;
end;
$$;

revoke all on function public.import_drive_article(jsonb) from public, anon, authenticated;
grant execute on function public.import_drive_article(jsonb) to service_role;

select public.import_drive_article($article$
{"source_id":"1fRBAmcWvjYY7qZhNJNfIqELQ6WgGvfcc","source_hash":"57cd53e1518a20df1244288d7907521ec1e9e5a33f54d3d9e992cf648074b959","modified_at":"2026-10-18T11:46:25Z","slug":"forsta-dygnet-hemma","title":"Första dygnet hemma","body":"När ni precis har kommit hem är allt nytt för valpen. Den har lämnat sin mamma, sina syskon och den enda miljö den hittills har känt till. De första dygnen behöver ni därför inte fokusera på självständighet, rumsrenhet eller koppelträning. Det kommer senare. Nu handlar det om att låta valpen landa och känna sig trygg i sitt nya hem.\n\n## Låt valpen landa\n\nNär valpen kommer hem är det mesta nytt: ljuden, dofterna, människorna och platsen där den ska sova. Planera därför en stillsam första dag. Låt valpen undersöka ett begränsat, valpsäkrat område i egen takt. Sitt gärna nära och låt den själv söka kontakt. Vänta med besök och stora utflykter.\n\n## Börja med en rastningsplats\n\nGå till en lugn plats där valpen får möjlighet att kissa direkt när ni kommer hem. Beröm stillsamt när det händer ute. En olycka inne är ingen anledning att säga till; avbryt inte med skrämsel, utan städa och erbjud nästa rastning tidigare. Logga gärna rastningarna i Tassla. När du börjar se mönster i valpens rutiner blir det lättare att veta när det är dags att gå ut.\n\n## Mat och vatten\n\nHa alltid färskt vatten tillgängligt. Fråga uppfödaren om valpens foder, mängd och mattider och försök behålla samma rutiner till en början. Valpen kan ha lite sämre aptit direkt efter flytten, så låt den äta i lugn och ro. Om valpen inte vill äta alls, verkar slö eller får andra sjukdomssymtom ska du kontakta veterinär.\n\n## Första natten\n\nVälj en lugn sovplats där valpen får vila utan att störas av barn eller andra djur. Många valpar söker närhet de första nätterna. Placera gärna bädden nära där du sover och hjälp valpen att komma till ro. En valp som är rädd eller behöver kissa ska inte lämnas att gråta sig till sömns. Målet första natten är trygghet och möjlighet att få sina behov tillgodosedda, inte att lära valpen klara sig ensam. Räkna med att behöva gå ut även nattetid. Håll rastningen lugn och kort, utan lek. Gå sedan tillbaka till sovplatsen.\n\n## Följ valpens rytm\n\nErbjud rastning efter sömn, mat och lek. Växla korta vakna stunder med vila. Du behöver inte skapa ett minutstyrt schema första dagen: följ valpens signaler och justera när ni lär känna varandra.","min_age_weeks":6,"max_age_weeks":16,"breed_ids":[],"topic_code":"homecoming_first_day","editorial_scope":"Händelsen hemkomst kan inte identifieras genom enbart ålder. Åldersurvalet är inte en automatisk dag-1-trigger.","related_source_refs":["08_checklista_infor_valpen","03_valpens_somn","09_valpsakra_hemmer"],"rules":[{"rule_key":"planned_preparation","min_age_weeks":6,"max_age_weeks":52,"event_kind":"expected_homecoming","start_days":-7,"end_days":0}],"review_reference":"owner-confirmed:2026-10-25:restore-original-generic-copy:forsta-dygnet-hemma","reviewed_at":"2026-10-25T00:00:00Z","is_ai_generated":false,"sources":[]}
$article$::jsonb);

select public.import_drive_article($article$
{"source_id":"1GmbcxvE7mWDibrgUFbE3ZsCDwVte4U-P","source_hash":"f98a3577bf20e2ded47b1d4a821abe158c30faf9802d74e9ca17ec462dadce00","modified_at":"2026-10-18T11:41:19Z","slug":"rumsrenhet","title":"Rumsrenhet – så hjälper du valpen att lyckas","body":"En liten valp kan ännu inte hålla sig som en vuxen hund. Därför behöver du hjälpa den att komma ut i rätt tid. Börja logga kiss och bajs i Tassla redan från första dagen, så får du efter hand bättre koll på när just din valp brukar behöva gå ut.\n\n## När ska ni gå ut?\n\nBörja med att gå ut när valpen vaknar, efter mat eller dryck och efter lek. Försök lära dig de tecken som avslöjar att det börjar bli dags såsom att valpen börjar nosa intensivt, gå runt eller söka sig undan. I början kan det behövas mycket täta tillfällen. Hur ofta beror på ålder, individ och aktivitet; följ valpens faktiska mönster i stället för att bara gå efter klockan.\n\n## Så gör du ute\n\nGå till en relativt lugn plats och ge valpen tid att nosa. När den kissar eller bajsar kan du lugnt berömma och ge en liten belöning direkt efteråt. Fortsätt gärna promenaden en stund så att rastningen inte alltid tar slut så snart valpen är klar.\n\n## Om det händer inne\n\nSäg inte till, tryck aldrig nosen i fläcken och straffa inte. Valpen lär sig då inte var den ska kissa och kan bli osäker på att göra sina behov nära dig. Städa med ett medel som tar bort lukt och fundera på om nästa rastning behöver ske tidigare. Om du upptäcker att valpen just är på väg kan du lugnt erbjuda att gå ut.\n\n## Logga varje rastning och olycka i Tassla\n\nGör det enkelt: öppna Tassla och logga varje gång valpen kissar eller bajsar. Efter några dagar kan du gå tillbaka och jämföra tiderna. När ett mönster börjar synas kan du erbjuda rastning precis innan det brukar vara dags. Fortsätt logga när rutinerna förändras – exempelvis när valpen börjar sova längre på morgonen. Ju mer konsekvent du registrerar, desto mer användbar blir överblicken.\n\n## När framstegen går långsamt\n\nRumsrenhet utvecklas olika snabbt. Följ framstegen i Tassla-loggen och justera rastningarna efter valpens mönster. Sker olyckorna vid ungefär samma tillfällen? Prova att gå ut lite tidigare just då. Se också över om valpen får tillräckligt med tid och lugn för att göra sina behov ute.\n\nKissar valpen ute och sedan inne kort efteråt? Då kan den behöva stanna ute lite längre eller få en extra rastning. Fundera också på vad som händer när valpen är klar. Brukar ni gå in direkt? Om utevistelsen alltid tar slut så fort valpen har gjort sina behov kan den lära sig att vänta för att få vara ute längre. Låt därför gärna valpen få en liten stund till utomhus efteråt.\n\n## När veterinär bör kontaktas\n\nTäta små kissningar, smärta, blod i urinen, ökad törst, svårighet att kissa eller plötslig försämring hos en tidigare rumsren hund bör bedömas av veterinär. Kan hunden inte kissa alls är det akut.","min_age_weeks":8,"max_age_weeks":52,"breed_ids":[],"topic_code":"house_training","editorial_scope":"Gäller grundläggande valpträning. Äldre hundars problem med urinering/avföring kan ha andra orsaker.","related_source_refs":["08_checklista_infor_valpen","04_ensamhetstraning","03_valpens_somn"],"rules":[{"rule_key":"primary","min_age_weeks":8,"max_age_weeks":52,"event_kind":"none","start_days":null,"end_days":null}],"review_reference":"owner-confirmed:2026-10-25:restore-original-generic-copy:rumsrenhet","reviewed_at":"2026-10-25T00:00:00Z","is_ai_generated":false,"sources":[]}
$article$::jsonb);

select public.import_drive_article($article$
{"source_id":"12s7ykNsBiyqGReyWrTdQj9JfI2VHyLEn","source_hash":"9fd60b0640c3990e2c661e094b9169e9791160e8af71e067cf147f1438012a7d","modified_at":"2026-10-18T11:42:01Z","slug":"valpens-somn","title":"Hur mycket ska en valp sova?","body":"En valp sover och vilar stora delar av dygnet. Behovet varierar med ålder, individ, aktivitet och hur mycket nytt valpen upplever. Uppgifter om ett exakt antal timmar per dygn är grova riktvärden, inte en norm som varje valp måste uppfylla. Titta därför mer på hur valpen mår och fungerar än på en enskild totalsiffra.\n\n## Sömn kommer i omgångar\n\nValpar växlar ofta mellan kortare perioder av aktivitet och vila. Efter lek, träning, besök eller en ny miljö kan de behöva återhämta sig. En övertrött valp kan bli mer intensiv, börja bita mer eller få svårt att komma till ro. Märker du att det ofta händer efter lek eller många nya intryck kan du prova att erbjuda vila lite tidigare.\n\n## Hjälp valpen att komma till ro\n\nOrdna en trygg, lugn sovplats och låt valpen sova ostört. Anpassa familjens aktiviteter när den behöver vila. Barn behöver veta att en sovande valp ska lämnas ifred. En del valpar slappnar lättare av med en lugn och trygg människa nära; närhet under första tiden är inget misslyckande.\n\n## Om valpen har svårt att sova\n\nKontrollera om miljön är stökig, om valpen behöver rastas, är hungrig enligt sin vanliga matrytm eller söker trygghet. Minska intrycken och ge möjlighet till vila. Försök inte trötta ut valpen med mer och mer aktivitet; det kan göra det svårare att varva ned.\n\n## Få koll på hundens sömn med Tassla\n\nBörja gärna använda sömnloggen I Tassla redan från första dagen. Registrera när valpen somnar och vaknar, så får du en överblick över hur mycket den sover och när på dygnet den brukar vila. Efter några dagar kan du börja upptäcka mönster. Kanske har valpen svårare att komma till ro på eftermiddagen, eller behöver den en extra vilostund efter en aktiv förmiddag? Använd loggen för att lära känna valpens rytm och planera dagen efter dess behov.\n\n## När är tröttheten ett varningstecken?\n\nKontakta veterinär om valpen är ovanligt svårväckt, kraftigt slö även när den är vaken, verkar ha ont eller plötsligt sover mycket mer än vanligt tillsammans med andra symtom. Andningsbesvär kräver omedelbar veterinärkontakt.","min_age_weeks":8,"max_age_weeks":52,"breed_ids":[],"topic_code":"puppy_sleep","editorial_scope":"Fokuserar på valpens sömn och vila; ingen individuell sömnbedömning.","related_source_refs":["09_valpsakra_hemmet","02_rumsrenhet","04_ensamhetstraning"],"rules":[{"rule_key":"primary","min_age_weeks":8,"max_age_weeks":52,"event_kind":"none","start_days":null,"end_days":null}],"review_reference":"owner-confirmed:2026-10-25:restore-original-generic-copy:valpens-somn","reviewed_at":"2026-10-25T00:00:00Z","is_ai_generated":false,"sources":[]}
$article$::jsonb);

commit;

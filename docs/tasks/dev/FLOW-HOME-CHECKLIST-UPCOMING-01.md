# FLOW-HOME-CHECKLIST-UPCOMING-01 — R3c: verkliga kommande aktiviteter

Version 10 · 2026-10-17 · Status: implementation, Security implementation review, QA och Reviewer PASS; lokal checkpoint klar
Branch: codex/mvp-v2-panel4-checklists-2026-10-16
Beroende: FLOW-HOME-CHECKLIST-WEEK-01 (done)
Risk: H — hundavgränsade data, befintliga RLS-källor och lokalt datum/tidszon.

## Mål

Lägg till en villkorad Kommande-flik i daglig Checklista. Visa endast ägarens konkreta framtidsplaner från befintliga datakällor. Visa inte rutinmallar utan upprepning som planerade och hitta inte på framtida träningspass.

## Verifierade källor och beslut

- Lägg till en dog-scopead läsning för kommande dog_health_plans i befintliga workspace-data. Filtrera på dog_id och due_on > dailyDateKey före den befintliga 40-radersgränsen; sortera på due_on och id. Validera varje rad mot aktuell hund och använd befintlig owns_dog SELECT-policy. Äldre/förfallna planer kan inte tränga undan framtida. Kommande visar de 40 närmaste planerna. Välj endast listfälten id, dog_id, event_type, due_on, due_time och description. due_on är kalenderdatum utan UTC-konvertering; due_time visas som sparad lokal tid. Vid tryck hämtas den valda planens fulla post med befintlig fetchPlannedHealthById.
- Gör en separat, skrivskyddad läsning av dog_daily_routines med dog_id-filter och befintlig ägarpolicy. Välj bara id, dog_id, label, repeat_unit, repeat_interval, repeat_weekdays och repeat_anchor_date. Läsningen hämtar mallens upprepning utan att anropa ensure_due_daily_routine_days. Den befintliga dagsläsningen för Idag/Denna vecka/Alla fortsätter oförändrad.
- Använd isRoutineDueOnDate och befintlig date-key-aritmetik för högst nästa framtida datum per upprepande mall. repeat_unit=null är inte schemalagd. En framtida rad är bara en härledd vy; skapa inte dagsrad, completion, skip eller notifiering.
- ensure_due_daily_routine_days är en befintlig dags-RPC som kan skapa dagens rader och avvisar andra datum än dagens datum i IANA-tidszonen. R3c anropar den inte från Kommande eller dess Retry och anropar den aldrig för framtida datum.
- Träningsval är dagsbundna och ingen befintlig källa anger framtida träningsdatum. De ingår inte.
- Båda läsningarna har en egen generation/abort-fence och ignorerar svar vars scope inte längre är aktuellt. Scopet omfattar owner/account generation, dog id, dailyDateKey och dailyTimeZone. Använd inte enbart den befintliga plannedHealthLifetime som kan vara snävare.
- Använd Checklistas validerade dailyDateKey och dailyTimeZone. Jämför date-key direkt; konvertera inte date-only-värden till UTC. Kommande börjar efter idag.

## UX-flöde och tillstånd

- Läs planerade hälsohändelser och rutinmallar som två separata källor med varsin loading/ready/error-status och Retry. Retry för en källa läser endast den källan; Kommande använder inte dag-/träningsläsningens sammansatta state.
- Visa Kommande under laddning eller fel så användaren alltid når rätt Retry. Dölj fliken vid ny inresa först när båda källorna är färdiglästa och listan är tom. Om en källa lyckas och den andra laddar/felar visas bekräftade rader med en tydlig ofullständig-lista-varning. Om användaren redan står på Kommande och sista raden försvinner, behåll vyn och visa Inga kommande aktiviteter.
- Sortera stigande på datum; vid samma datum sorteras planerad hälsohändelse före rutin, därefter stabilt på namn och id.
- Vid tryck på en hälsoplan: hämta den fulla posten med fetchPlannedHealthById under aktuellt owner/account-generation-, hund- och date-scope; avbryt navigation om scope ändrats eller posten inte längre ägs av hunden. Skicka selectedPlanId som initialEditId till PlannedHealthScreen och öppna exakt den posten i redigeringsläge när den är inläst. Tillbaka-knappen ska ha synlig text och accessibilityLabel “Checklista” och återgå till samma Kommande-tab. När samma skärm öppnas från Hälsa ska den behålla “Hälsa” och befintlig destination. Dirty guards och mutation/readback ska fortsätta gälla.
- Rutinraden saknar checkbox och completion-text. Hantera rutin öppnar befintlig rutinmanager fokuserad på just den mallen. Ändring påverkar mallen och det härledda datumet; dagsspecifika val, till exempel Välj för idag, gäller uttryckligen idag. Ingen framtida completion eller skip skapas.
- Efter bekräftad create/update/delete av en rutinmall ska den separata Kommande-rutinläsningen hämtas igen under samma aktuella account/dog/date/timezone-scope. Korrigeringen lägger inte till någon ytterligare dags- eller träningsläsning; befintlig awaited dags-reload efter sparning bevaras. Retry är fortfarande källspecifik och inga framtida dagsrader skapas.
- Hund-/konto-/lokaldag-/tidszonbyte döljer tidigare resultat omedelbart. Befintliga mutationer och editorfences bevaras.

## Skrivomfång

Produktionsfiler:
- src/features/home/DailyChecklistScreen.tsx
- src/features/home/ProductWorkspace.tsx
- src/features/home/daily-activity-model.ts
- src/features/home/daily-activity-data.ts
- src/features/home/README.md
- src/data/workspace-data.ts
- src/features/health/PlannedHealthScreen.tsx

Plan, rapport och evidens:
- docs/tasks/dev/FLOW-HOME-CHECKLIST-UPCOMING-01.md
- docs/plans/FLOW-HOME-CHECKLIST-UPCOMING-01-ux-spec.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md
- docs/design/evidence/vision-rev02/checklist/UPCOMING-01/

V4–V6 lägger endast till QA-underlag i de redan kända testerna och den befintliga visuella fixturen:
- tests/daily-activity-data.test.mjs
- tests/workspace-data.test.mjs
- tests/daily-activity-ui.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/verify.py

R3c:s produktionskod ändras inte inom v4–v6-omfånget. Om QA hittar en beteendebrist pausas arbetet och en separat, granskad korrigeringsplan skapas före produktionsändring.

Skrivskyddat:
- Supabase migrations/policies/RPCs, auth och dog-scope-kontrakt.
- Träningskällor, logg-/hälsohistorik, reminder schedule/delivery och övriga flikar.

Inga schema-, RPC-, grant-, RLS-, data-purpose-, dependency- eller backendändringar. Läsningarna använder befintliga tabeller, ändamål och ägarpolicyer.

## Acceptans

1. En explicit upprepande rutin visar högst nästa framtida kalenderdatum. Dag/vecka/månad och intervall följer isRoutineDueOnDate; engångs-/aldrig-rutin visas inte.
2. Kommande hälsoplaner hämtas med due_on > dailyDateKey före 40-radersgränsen, är hundscopeade och sorteras stigande. Historiska planer kan inte dölja kommande poster. Datum och sparad tid bevaras.
3. Framtida träningspass eller mallar utan explicit schema visas aldrig.
4. Källornas loading/error/partial state visas sanningsenligt. Varje Retry är källspecifik. Fliken är åtkomlig vid loading/fel och saknas vid ny inresa först när båda källorna lyckats tomma. Scope-/dag-/tidszonbyte döljer gamla rader omedelbart.
5. Hälsoplan hämtas igen under aktuell scope och öppnar exakt vald post i redigering. Checklista-entry visar synlig/accessibility back label “Checklista” och återgår till samma Kommande-tab. Hälsa-entry behåller label/destination “Hälsa”. Rutinhandling öppnar rätt mall; dagsspecifik handling är tydligt märkt Idag. Bekräftad rutinmalländring gör en ny, endast-rutin-Kommande-läsning; failed/unknown write får inte visas som bekräftad.
6. Ingen framtida rutin markeras klar, hoppas över eller materialiseras. Ingen notifiering, kalenderintegration, schema, dataändamål eller träningsprogress ändras.
7. Befintliga Idag/Denna vecka/Alla, retur från Träning, osparade formulär/dirty guards, dog/account/date/timezone fences och R3b framtidsvecko-kontrakt består.
8. UI återanvänder Tabs/ListRow/IconChip/tokens, har åtkomliga datum, labels och handlingar, fungerar med stor text/scroll och följer design-rules §14. Vid 140 % textproxy ska Kommande-fliken kunna scrollas helt synlig i sin horisontella tabbrad utan dokumentbredd över viewporten. Referensbildens innehåll behandlas inte som datakälla.

## Verifiering och granskningsgrind

- Architect APPROVE och Critic PROCEED krävs på exakt planversion före produktionskod. Risk H kräver Security plan review och implementation review.
- Planerad QA omfattar recurrence dag/vecka/månad och datumgränser, mer än 40 historiska planer före kommande planer, datum/tidszon, dog/account switch, empty/loading/error/partial, källspecifika Retry, direktöppning av icke-första valda plan, synlig och tillgänglig returtext från båda ursprung, rutinhanteringens Idag-semantik, 375×844/430×844/375×667 och 140 % text.
- V3:s begränsning mot tester gällde den dåvarande körningen. Eriks senare beställning att slutföra hela R3 och genomföra full lokal kontroll ersätter den för R3c QA. V4–V6 tillåter endast tester och syntetiska UI-fixtures på de exakta vägarna ovan; de ändrar inte produktionsbeteende eller backend.
- Riktad automatiserad täckning verifierar den installerade Supabase-klientens verkliga query-API, minimal projection, dog/date-fences, sortering före sidgräns, reject av fel scope och att framtidsläsning inte anropar dagens materialiserande RPC. Domäntester täcker daily/weekly/monthly recurrence, veckodagsurval, månadsgräns och avsaknad av upprepning.
- Dedikerad visuell scope `r3c-upcoming` i befintlig verifierare täcker ready rows, sortering/datum/tid, loading/error/partial och source-specific retry, tomt utfall, direktöppning av vald hälsoplan i editläge, Checklista-retur till samma Kommande-tab, rutinmall utan completion-control, och stor text/scroll vid 375×844, 430×844 och 375×667. Körs public och review med enbart syntetiska uppgifter och utan backend.
- Fokuserad kontroll: `node --experimental-strip-types --test tests/daily-activity-data.test.mjs tests/workspace-data.test.mjs tests/daily-activity-ui.test.mjs`; kör `tools/visual-check/verify.py` public och review med `$env:TASSLA_UI_SCOPE='r3c-upcoming'`, `$env:TASSLA_UI_EVIDENCE` pekande på respektive public/review-evidensmapp, och respektive `$env:TASSLA_UI_BASE_URL`; därefter `pnpm check`, `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate` och `git diff --check`.
- Den fulla R3c-visuella/automatiserade QA-checkpointen kräver oberoende QA och Reviewer. Ingen PASS på live Supabase/RLS, installerad TestFlight, native Dynamic Type/VoiceOver eller fysisk enhetsdata hävdas.
- python tools/dev_flow.py validate och git diff --check är dokument-/diffkontroller, inte funktionsbevis.
- Live Supabase/RLS, installerad TestFlight, native Dynamic Type/VoiceOver och fysisk resedata är NOT TESTABLE lokalt.

## Granskning

- V1: Architect CHANGES för sidgräns och flikåtkomst; Critic PROCEED WITH CHANGES för direktöppning, rutinsemantik och retrygräns; Security CHANGES om den sammansatta dagsläsningens same-day-RPC.
- V2: Architect APPROVE och Security PASS för datakällor. Critic PROCEED WITH CHANGES: specificera selectedPlanId/initialEditId och synlig/accessibility back label för rätt ursprung.
- V3: Architect APPROVE, Critic PROCEED och Security PASS 2026-10-17 för exakt plan/UX-spec v3. Reviewerna godkänner planen och datakällorna, inte implementationens runtime-beteende.
- V4: QA-only plan delta. Architect APPROVE, Critic PROCEED WITH CHANGES och Security PASS för exakt plan v4 / UX v4. Critic begär regressioner för v3-reviewns tre fynd, statisk kontroll av ProductWorkspace-kopplingen eftersom visual-fixturen äger callbacks, och §14 punkt 16 med separat bedömning av sex delområden samt NOT TESTABLE där panelreferens saknas. Security bekräftade syntetisk isolering, inga datainventeringsändringar och inga anrop till live Supabase; live RLS/native är fortsatt NOT TESTABLE. Inga QA-filer ändrades.
- V5: reviderat QA-only plan delta efter v4-review. Architect **APPROVE** och Critic **PROCEED**, Security **CHANGES** för exakt plan v5 / UX v5. Security kräver fail-closed URL-originvalidering och browser-request interception, plus bevarad synthetic `.invalid`-klient och strikt avvisning av oväntade requests. V6 lägger till dessa isoleringskrav; inga kod- eller testfiler ändrades.
- V6: Arkitekt/Architect hittade tre kvarvarande V4–V5-scopegränser i plantexten; dessa är korrigerade till V4–V6. För exakt korrigerad v6: Architect **APPROVE**, Critic **PROCEED**, Security **PASS**. Security godkände pre-launch HTTP loopback/explicit-port-validering, exakt-origin request guard med abort/logg/fel, synthetic `.invalid`-client med avstängd auth state och fail-closed handlers utan nätverksfallback. Datainventering: ingen ändring; inga juridiska frågor; live RLS/auth/native/physical data fortsatt NOT TESTABLE. Alla v5 regressioner, separat ProductWorkspace wiring och §14.16 sexdimensionella NOT TESTABLE-gräns bevaras. V3-produktionskod ligger utanför scope; funktionsbrist kräver separat granskad fixplan.

## Implementation checkpoint 2026-10-17

Kodad v3 inom angivna produktionsfiler: separata minimala, hundscopeade läsningar; `Kommande` med source-specifik status/Retry; recurrence-hjälpare som bara ger nästa framtida datum; full by-id readback och edit mode för vald hälsoplan; entry-originstyrd tillbakaetikett/destination; rutinmanager fokuserad på vald mall med befintlig dagswrite-gate. Efter oberoende review har bekräftat rutinmalländring kopplats till en omläsning av framtidsprognosen, pågående planöppning invalideras direkt vid tab-/sidbyte, och editorn har nu dirty-guard med bekräftelse innan osparade rättningar lämnas.

Oberoende Reviewer gav PASS efter omgranskning av samtliga tre fynd och den saknade-baseline-kanten. Inga tester har lagts till eller körts. Ingen live/RLS/native/visuell PASS hävdas; funktionell QA återstår. `python tools/dev_flow.py validate` och `git diff --check` är dokument-/diffhygien, inte funktionsbevis. Ingen commit/push ingår i den här implementationsturnen.

## QA-plan delta v4 — 2026-10-17

Efter R4a:s lokala closeout återupptas R3c i planerat läge. Ägarens senare begäran att slutföra R3 omfattar nu full lokal QA, så v4 ersätter v3:s körningsspecifika förbud mot tester. Endast de tre namngivna testfilerna, den existerande `tools/visual-check`-fixturen/verifieraren och checkpointdokumentation ingår; R3c-produktionsfiler förblir oförändrade. Architect, Critic och Security granskar exakt v4 före dessa test-/fixtureändringar. Vid funktionsfynd stoppas v4 i stället för att kodas utanför granskat omfång.

Architects v4-besked: **APPROVE**. QA-deltat är avgränsat till befintliga test- och visual-harness-filer och syntetiska fixtures; Supabase-klient och public/review-visualisering kan användas med installerade verktyg. Inga tester kördes i granskningen. V4 granskades därefter av Critic (PROCEED WITH CHANGES) och Security (PASS); v5 uppdaterar planen efter Criticens villkor.

V4-granskning: Architect **APPROVE**; Critic **PROCEED WITH CHANGES** med tre fynd dokumenterade ovan; Security **PASS**. Security verifierade att klienttester använder `.invalid`, syntetisk nyckel, avstängd sessionpersistens och injicerad fetch och att visual-fixturen inte skapar live Supabase-session. Datainventering: ingen ändring. V4 ersätts av v5 efter Criticens förbättringskrav.

## QA-plan delta v5 — 2026-10-17

V5 är fortsatt QA-only och begränsad till samma tre testfiler, visual-fixture/verifierare och befintlig R3c-evidenskatalog. Utöka testerna med uttryckliga regressioner för de tre tidigare Reviewer-fynden: (1) efter bekräftad rutinmalländring ska framtidsrutinkällan läsas om så prognosen inte är stale; (2) en plan-readback som blir gammal efter tab-/sid-/scopebyte får inte navigera; (3) osparad planredigering ska bevara ändringar om användaren stannar kvar och bara lämna efter uttryckligt val. Lägg till statiska wiringassertioner i `daily-activity-ui.test.mjs` för ProductWorkspace-vald plan → `initialEditId`/rätt ursprung/retur och fokuserad rutinhantering. Dessa assertioner kompletterar men ersätter inte browser-fixturens presentation/interaktionsbevis.

Den visuella kontrollen sparar jämförbara public/review-skärmbilder och bedömer §14.16 separat för komposition, färg, typografi, komponentformer, bildspråk och innehållstäthet. Eftersom ingen direkt Kommande-panelreferens finns ska den relevanta likheten markeras NOT TESTABLE per saknat underlag; de sex delfälten får inte sammanfattas som visuell PASS utan verifierad referens. Browserfixturen äger sina callbacks och verifierar inte ensam ProductWorkspace wiring. Inga faktiska användarkonton eller live endpoints får nås.

Vid varje bekräftat beteendefynd stoppas v5 innan kod utanför QA-scope ändras. Särskilt den befintliga källäsningen för framtida rutinmallar ser statiskt ut att vara beroende av inläsning/Retry; regressionen ska avgöra om mutation uppdaterar den. Om inte, skapas och granskas en separat korrigeringsplan före produktionsfix. Architect **APPROVE** och Critic **PROCEED** är dokumenterade för v5; Security gav **CHANGES**. V5 ersätts av v6 innan QA-filer ändras.

## QA-plan delta v6 — 2026-10-17

Securitys två medelstora fynd från v5 byggs in som acceptansvillkor. Innan Playwright startas validerar verifieraren den fullständiga `TASSLA_UI_BASE_URL`: endast HTTP-loopback (`127.0.0.1`, `localhost` eller `::1`), giltig explicit port och inga credentials/query/fragment får accepteras. En route guard tillåter endast exakt samma origin för samtliga nätverksrequests; alla andra requests avbryts, registreras som fel och gör körningen röd. Public/review använder varsin explicit lokal fixture-origin. Ingen extern URL, användarkonto, live Supabase eller nätverkstjänst får nås.

De nya workspace/daily-data-testerna använder enbart befintligt mönster med `https://local-test.supabase.invalid`, syntetisk publishable key, `autoRefreshToken: false`, `persistSession: false` och injicerad `global.fetch`. Testhandlern kastar på varje odefinierad method/path/RPC; verifiera uttryckligen att inga auth endpoints, dagsmaterialiserande RPC eller oväntade requests förekommer. Ingen handler får falla tillbaka till nätverk.

V6 behåller alla v5-regressioner, wiringassertioner och §14.16-krav oförändrade. Architect **APPROVE**, Critic **PROCEED** och Security **PASS** är dokumenterade för exakt korrigerad v6 / UX v6. QA-filer får nu ändras inom listade paths. Om testerna visar produktionsbrist stoppas v6, och separat granskad produktionsfixplan krävs.

## Korrigerings- och QA-plan v7 — 2026-10-17

V6 stannade före test- och fixtureändringar. Kontroll av faktisk ProductWorkspace-wiring bekräftade att create/update/delete-rutinmall efter `saved` endast anropar `reloadDailyActivity`; `upcomingRoutineRetryToken` ändras bara av manuell Retry. Därför kan Kommande fortsätta visa den tidigare härledda förekomsten tills scope eller användaren själv startar Retry. Detta motsäger den äldre Reviewer-closeout-raden ovan; closeouten beskriver avsedd implementation men verifieringen visar att koden i branchen saknar uppdateringen.

V7 tillåter produktionsändring endast i `src/features/home/ProductWorkspace.tsx`. Före routine-template-writen fångas aktuell `upcomingScopeKey` (owner, accountGeneration, dog, dailyDateKey och dailyTimeZone). Efter att den bekräftade mutationens befintliga awaited `reloadDailyActivity` har slutförts får den separata Kommande-rutinsnapshotten invalideras och dess retry-token ökas endast om komponenten fortfarande är mountad, daily lifetime är densamma och `upcomingScopeRef.current` fortfarande matchar exakt den fångade scope-nyckeln. Uppdateringen av Kommande får inte hoppas över om dagens reload returnerar fel; visa i så fall båda källornas fel korrekt. Befintliga generation/abort-fences kör om endast `fetchUpcomingDailyRoutineSchedules`. Dagsspecifika val, completion/skip och träning refresha inte framtidskällan. Failed/unknown writes får inte trigga refresh eller märkas som sparade.

QA inom befintliga paths: utöka `tests/daily-activity-ui.test.mjs` så ProductWorkspace wiringregressionen verifierar att: saved create/update/delete refresha endast Kommande-rutinkällan; failed/unknown och saved select/remove/complete/training inte gör det; byte av owner/accountGeneration/dog/dailyDateKey/dailyTimeZone under awaited dags-reload förhindrar invalidate/refetch i den nya scopen; och samma-scope bekräftad malländring ändå refresha Kommande även om dagens reload misslyckas. Kör sedan v6:s fokuserade data-/recurrence-/UI-test och synthetic public/review visual-fixture kontroller; därefter `pnpm check`, py_compile, queue validation och diffcheck. Rapporterna skiljer querybevis och fixturebevis från ProductWorkspace statisk wiring. Ingen live RLS/native PASS hävdas.

Exakta v7-skrivvägar: produktionskod endast `src/features/home/ProductWorkspace.tsx`; QA-kod i `tests/daily-activity-data.test.mjs`, `tests/workspace-data.test.mjs`, `tests/daily-activity-ui.test.mjs`, `tools/visual-check/app.tsx` och `tools/visual-check/verify.py`; befintliga R3c-plan-, UX-, kö-, rapport-, master-logg- och evidenspaths. De övriga sex R3c-produktionsfilerna ingår inte i v7-redigeringen. Inga schema-, RPC-, grant-, RLS-, data-purpose-, dependency-, content- eller backendändringar. Architect och Critic granskar exakt v7 före kod; Security godkänner plan och implementation för risk H. QA-only-deltat och dess isoleringskrav i v6 är återbekräftade i v7. Planreviews inväntas; ingen v7-kod får ändras innan planen godkänns.

Första exakta v7-granskningen: Critic begärde att UX-specen skulle innehålla samma bekräftad/failed/unknown-kontrakt och tillstånd som taskplanen; UX v7 kompletterades och Critic gav därefter **PROCEED**. Architect begärde ett enda produktions-write-path (ProductWorkspace) och en efter-await fence mot hela fångade upcomingScopeKey samt ytterligare scope-/write-/reload-failure-regressioner; dessa är nu införda i exakt v7. Security gav PASS på föregående v7; eftersom planen ändrats inväntas färsk Architect/Critic/Security-review på den korrigerade versionen.


## V7 implementation och QA-checkpoint (återöppnad) — 2026-10-17

V7-planen fick Architect **APPROVE**, Critic **PROCEED** och Security **PASS** före implementation. Den bekräftade routine-template-refreshen finns i `ProductWorkspace.tsx`; ingen annan produktionsfil ändrades i v7. Fokuserade data-/UI-regressioner passerade 31/31. Den dedikerade syntetiska `r3c-upcoming`-verifieraren passerade 11/11 scenarier i både public och review vid 375×844, 430×844 och 375×667 samt 140 % textproxy. Den kontrollerade planöppning/retur, fokuserad rutinhantering, ordning, separat loading/error/Retry, partial och empty. Nätverksvakten blockerade inga requests i public/review; en extern HTTPS-bas-URL avvisades före browserstart.

§14.16-jämförelsen har sex separata **NOT TESTABLE**-utfall eftersom `vision_rev02.jpg` saknar en dedikerad Kommande-referens. Syntetisk rendering är inte live Supabase/RLS eller native/TestFlight. Oavhängigt QA-, Reviewer- och implementation-Security-besked inväntas före lokal checkpoint-closeout. Evidens: `docs/design/evidence/vision-rev02/checklist/UPCOMING-01/`.


## Korrigerings- och QA-plan v8 (ersatt efter granskning) — 2026-10-17

V8 svarar på de två oberoende closeout-fynden. Risk och datakontrakt är oförändrade; inga nya datakällor, backendändamål, dependencies eller skrivningar till framtida dagsrader införs. V8 måste granskas på exakt denna version av Architect och Critic samt Security före fortsatt implementation.

**En enda refresh per rutinmanager-route:** Home-managern skickar `origin: 'home'`; efter bekräftad create/update/delete gör ProductWorkspace den redan planerade Kommande-rutin-invalideringen och bara den separata rutinläsningen. Checklistans “Alla”-manager skickar `origin: 'all'`; dess befintliga `DailyChecklistScreen` wrapper anropar `onRetryUpcomingRoutines` en gång efter ett bekräftat `saved`-resultat. ProductWorkspace får därför inte också refresha `origin: 'all'`. Failed/unknown writes och dagsspecifika select/remove/complete/skip/training gör ingen sådan refresh.

`onRetryUpcomingRoutines`-callbacken som ProductWorkspace skickar till Checklistan fångar vid render den fullständiga `upcomingScopeKey`. Vid callback-anrop agerar den bara om komponenten fortfarande är mountad och `upcomingScopeRef.current` fortfarande är exakt samma scope. Om ett äldre Checklist-manager-save avslutas efter konto-, hund-, lokal-dag- eller tidszonsbyte blir dess callback en no-op och får inte starta en läsning i den nya scopen. Home- och Checklist-vägarna behåller sina separata befintliga owners, utan ny gemensam abstrahering.

QA inom redan godkända test-/fixture-paths lägger till en regressionsassertion för refresh-owner per route, bekräftar att den sparade checklist-wrappern anropar callbacken exakt en gång och att ProductWorkspace inte gör en andra `origin: 'all'` refresh, samt kontrollerar att callback-fence avvisar gammal scope. Browser-fixturen provar saved/failed/unknown-interaktion med syntetisk callback; ProductWorkspace-wiringtestet kompletterar den och rapporterar uttryckligen att en fixture inte är live persistensbevis.

För 140 %-textproxy förstoras texten som tidigare. Därefter scrollar verifieraren den verkliga horisontella `Avsnitt`-tabbraden tills den aktiva Kommande-fliken är helt synlig och verifierar att dess tab-/label-bounds ryms inom tabradens viewport. Dokumentet får inte overflowa horisontellt. Evidensskärmbilden tas efter den kontrollerade scrollningen. Detta är ingen ändring av gemensamma Tabs eller annan skärm; kontrollen erkänner att alla tabbnamn inte kan visas samtidigt vid stor text. Om verklig text fortfarande klipps efter scrollning stoppas R3c och en ny produktionsplan krävs.

**Exakta v8-skrivvägar:** `src/features/home/ProductWorkspace.tsx`; QA-only i `tests/daily-activity-data.test.mjs`, `tests/workspace-data.test.mjs`, `tests/daily-activity-ui.test.mjs`, `tools/visual-check/app.tsx` och `tools/visual-check/verify.py`; samt R3c task/UX/queue/rapport/master-logg/evidens. `DailyChecklistScreen.tsx`, gemensamma Tabs, data-/backendfiler och övriga produktionsfiler är skrivskyddade för v8. Befintliga R3c-local checks körs om i public och review efter ändringen; därefter `pnpm check`, verifierarens `py_compile`, `python tools/dev_flow.py validate` och `git diff --check`. Live Supabase/RLS, native Dynamic Type/VoiceOver och TestFlight förblir NOT TESTABLE.


V8-granskning: Architect **CHANGES** identifierade att en senare `origin: 'all'` retry som blir `saved` inte passerar Checklistans ursprungliga saved-wrapper; om all origin-refresh blockeras blir prognosen stale. Critic gav **PROCEED WITH CHANGES** och identifierade dessutom A→B→A som ett återanvänt scope-key-fall. V8 är därför ersatt av följande v9.

## Korrigerings- och QA-plan v9 — 2026-10-17

### Full scope-lifetime-fence

Utöver den serialiserade `upcomingScopeKey` använder ProductWorkspace en monoton `upcomingScopeGeneration` som ökas vid varje committed scope-övergång. Asynkrona rutinmutationer fångar key och generation innan await. Efter dagens awaited reload får Kommande-rutinsnapshot/token uppdateras endast om komponenten är mountad, daily lifetime fortfarande matchar, aktuell key matchar fångad key och generationen matchar fångad generation. Därmed avvisas även A→B→A där samma key återkommer men scope-livslängden är ny. Checklistans `onRetryUpcomingRoutines` callback fångar samma key/generation och tillämpar samma mounted + exact-key + exact-generation fence innan den ändrar state.

### En ägare per route och bekräftad retry

- `origin: 'home'`: ProductWorkspace äger exakt en Kommande-rutin-refresh efter bekräftad `saved`, både initial write och senare retry.
- `origin: 'all'`, initial write: `DailyChecklistScreen` saved-wrapper äger callbacken och anropar den en gång efter bekräftat `saved`. ProductWorkspace triggar ingen ytterligare refresh för den första sparningen.
- `origin: 'all'`, retry (`retry === true`) som återkommer `saved`: ProductWorkspace äger exakt en refresh eftersom Checklist-wrappern inte får retry-resultatet. Refreshen måste klara samma captured key/generation, mounted, daily-lifetime och aktuell-scope fence.
- Failed/unknown, dagsspecifika val/complete/skip/remove och träningswrites refresha inte rutinprognosen. Om dagens reload fallerar efter bekräftad sparning gäller fortfarande samma-scope Kommande-refresh och separata sanningsenliga felstatusar.

### Korrigerande QA och visuell kontroll

I befintliga tester verifieras parent/child refresh ownership per route, inledande `origin: 'all'` saved = en child callback och ingen parent refresh, failed/unknown = noll, `origin: 'all'` failed/unknown följt av saved retry = en parent refresh, Home saved = en parent refresh, samt ingen refresh för orelaterade mutationer. Exakta key + monotonic generation fences testas för same-scope, A→B, och A→B→A; gammal callback eller sen mutation får inte invalidate:a/omläsa den nya livslängden. Visual-fixturens saved/failed/unknown-räknare testar bara syntetisk callbackorkestrering; statisk ProductWorkspace-wiringtest styrker routeägarskapet men är inte integration med live Persistens.

Vid 140 % textproxy scrollar verifieraren den horisontella `Avsnitt`-tabbraden tills aktiva Kommande-fliken och dess label är helt inom scrollporten. Verifiera tab- och textbounds, dokumentbredd utan horisontellt overflow, och spara screenshot efter scroll. Alla tabbnamn behöver inte synas samtidigt. Om labeln fortfarande klipps efter scrollning stoppas R3c och ny plan för produktionslayout krävs.

### Exakta v9–v10-skrivvägar och reviews

Produktionskod ändras endast i `src/features/home/ProductWorkspace.tsx`. QA-kod ligger endast i `tests/daily-activity-data.test.mjs`, `tests/workspace-data.test.mjs`, `tests/daily-activity-ui.test.mjs`, `tools/visual-check/app.tsx` och `tools/visual-check/verify.py`. Checkpoint ändras endast i R3c task/UX/queue/rapport/master-logg/evidensvägarna som redan listas i v7/v8. `DailyChecklistScreen.tsx`, delade Tabs, andra produktionsfiler och alla data-/backendkontrakt är skrivskyddade. Exakt v9 kräver ny Architect APPROVE, Critic PROCEED och Security PASS före implementation; efteråt krävs oberoende QA och Reviewer samt Security implementation recheck. Kör befintliga fokuserade tester, public/review `r3c-upcoming`, `pnpm check`, `python -m py_compile tools/visual-check/verify.py`, queue validation och `git diff --check`. Live Supabase/RLS, native Dynamic Type/VoiceOver och TestFlight är fortsatt NOT TESTABLE.

V9 exact plan review: Architect **APPROVE**, Critic **PROCEED**, Security **PASS** (data inventory delta: none). ProductWorkspace remains the only production write path. These verdicts apply only to plan/UX v9 and do not pre-approve implementation or QA results.

## Korrigerings- och QA-delta v10

Oberoende QA blockerade v9 efter att `pnpm check` ESLint stoppat på `react-hooks/refs`: renderfunktionen läste `upcomingScopeRef.current` och `upcomingScopeGeneration.current`. Ändra endast den godkända produktionsfilen `src/features/home/ProductWorkspace.tsx` och den befintliga regressionsfilen `tests/daily-activity-ui.test.mjs` för denna rättning.

Behåll `upcomingScopeGeneration` som en monoton ref för post-await- och callbackfences. Lägg till `upcomingScopeGenerationForRender` i React-state, initialt 0; ingen `.current` får läsas under render. Den befintliga scope-`useLayoutEffect` jämför och uppdaterar scope-refen, ökar generationsrefen exakt en gång per ändrad scope och uppdaterar render-state funktionellt (`previous => previous + 1`). Oförändrad scope och StrictMode dubbelkörning är idempotenta. Alla handlers fångar generationen från den renderade state-versionen och jämför den mot refen först i händelse-/await-path, aldrig vid render. A→B→A ska ge två generationsteg och avvisa den äldre callbacken.

Uppdatera den befintliga regressionen så den exekverar scope-effektens setter och verifierar initial A=0, no-op A=0, A→B=1 och B→A=2; den ska också kontrollera att generationens render-värde kommer från `useState` och att den relevanta render-sektionen saknar `.current`-läsningar. Upprepa `node --experimental-strip-types --test tests/daily-activity-ui.test.mjs`, hela fokuserade R3c-testtrion, `pnpm check`, public/review `r3c-upcoming`, `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate` och `git diff --check`.

Inga källor, mutationsemantik, datamodell, RLS, nätverksregler, produkt-UX, dependencies eller andra produktionsfiler ändras. §14.16 Kommande-jämförelse, live Supabase/RLS, native Dynamic Type/VoiceOver och TestFlight fortsätter som NOT TESTABLE enligt evidensen.

Exact v10 plan review: Architect APPROVE, Critic APPROVE, Security PASS (data-inventory delta: none). Independent QA v10 PASS: pnpm check (569/569), focused R3c trio 31/31, public and review browser 12/12 each, no page errors or blocked requests, active Kommande and label bounds fit at 140%, py_compile, queue validation and diff-check PASS. Independent Reviewer v10 evidence recheck **PASS** after queue-history correction and documentation sync; no code or evidence finding remains. Security implementation review v10 **PASS**: reads remain on existing dog-scoped/RLS-bound sources, with no query, RPC, schema, dependency, endpoint, grant, or RLS change; the synthetic browser harness remains restricted to its exact loopback origin. Live Supabase/RLS and native behavior are NOT TESTABLE.
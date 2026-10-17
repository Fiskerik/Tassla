# FLOW-HOME-CHECKLIST-UPCOMING-01 — R3c: verkliga kommande aktiviteter

Version 3 · 2026-10-17 · Status: v3 godkänd före kod av Architect APPROVE, Critic PROCEED och Security PASS; implementation lokal, funktionell QA återstår
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

Skrivskyddat:
- Supabase migrations/policies/RPCs, auth och dog-scope-kontrakt.
- Träningskällor, logg-/hälsohistorik, reminder schedule/delivery och övriga flikar.

Inga schema-, RPC-, grant-, RLS-, data-purpose-, dependency- eller backendändringar. Läsningarna använder befintliga tabeller, ändamål och ägarpolicyer.

## Acceptans

1. En explicit upprepande rutin visar högst nästa framtida kalenderdatum. Dag/vecka/månad och intervall följer isRoutineDueOnDate; engångs-/aldrig-rutin visas inte.
2. Kommande hälsoplaner hämtas med due_on > dailyDateKey före 40-radersgränsen, är hundscopeade och sorteras stigande. Historiska planer kan inte dölja kommande poster. Datum och sparad tid bevaras.
3. Framtida träningspass eller mallar utan explicit schema visas aldrig.
4. Källornas loading/error/partial state visas sanningsenligt. Varje Retry är källspecifik. Fliken är åtkomlig vid loading/fel och saknas vid ny inresa först när båda källorna lyckats tomma. Scope-/dag-/tidszonbyte döljer gamla rader omedelbart.
5. Hälsoplan hämtas igen under aktuell scope och öppnar exakt vald post i redigering. Checklista-entry visar synlig/accessibility back label “Checklista” och återgår till samma Kommande-tab. Hälsa-entry behåller label/destination “Hälsa”. Rutinhandling öppnar rätt mall; dagsspecifik handling är tydligt märkt Idag.
6. Ingen framtida rutin markeras klar, hoppas över eller materialiseras. Ingen notifiering, kalenderintegration, schema, dataändamål eller träningsprogress ändras.
7. Befintliga Idag/Denna vecka/Alla, retur från Träning, osparade formulär/dirty guards, dog/account/date/timezone fences och R3b framtidsvecko-kontrakt består.
8. UI återanvänder Tabs/ListRow/IconChip/tokens, har åtkomliga datum, labels och handlingar, fungerar med stor text/scroll och följer design-rules §14. Referensbildens innehåll behandlas inte som datakälla.

## Verifiering och granskningsgrind

- Architect APPROVE och Critic PROCEED krävs på exakt planversion före produktionskod. Risk H kräver Security plan review och implementation review.
- Planerad QA omfattar recurrence dag/vecka/månad och datumgränser, mer än 40 historiska planer före kommande planer, datum/tidszon, dog/account switch, empty/loading/error/partial, källspecifika Retry, direktöppning av icke-första valda plan, synlig och tillgänglig returtext från båda ursprung, rutinhanteringens Idag-semantik, 375×844/430×844/375×667 och 140 % text.
- Denna Codex-körning får inte lägga till eller köra tester. Koden lämnas som ofärdig QA-checkpoint tills verifiering senare uttryckligen begärs. Ingen PASS på funktion/native/live hävdas utan faktisk kontroll.
- python tools/dev_flow.py validate och git diff --check är dokument-/diffkontroller, inte funktionsbevis.
- Live Supabase/RLS, installerad TestFlight, native Dynamic Type/VoiceOver och fysisk resedata är NOT TESTABLE lokalt.

## Granskning

- V1: Architect CHANGES för sidgräns och flikåtkomst; Critic PROCEED WITH CHANGES för direktöppning, rutinsemantik och retrygräns; Security CHANGES om den sammansatta dagsläsningens same-day-RPC.
- V2: Architect APPROVE och Security PASS för datakällor. Critic PROCEED WITH CHANGES: specificera selectedPlanId/initialEditId och synlig/accessibility back label för rätt ursprung.
- V3: Architect APPROVE, Critic PROCEED och Security PASS 2026-10-17 för exakt plan/UX-spec v3. Reviewerna godkänner planen och datakällorna, inte implementationens runtime-beteende.

## Implementation checkpoint 2026-10-17

Kodad v3 inom angivna produktionsfiler: separata minimala, hundscopeade läsningar; `Kommande` med source-specifik status/Retry; recurrence-hjälpare som bara ger nästa framtida datum; full by-id readback och edit mode för vald hälsoplan; entry-originstyrd tillbakaetikett/destination; rutinmanager fokuserad på vald mall med befintlig dagswrite-gate. Efter oberoende review har bekräftat rutinmalländring kopplats till en omläsning av framtidsprognosen, pågående planöppning invalideras direkt vid tab-/sidbyte, och editorn har nu dirty-guard med bekräftelse innan osparade rättningar lämnas.

Oberoende Reviewer gav PASS efter omgranskning av samtliga tre fynd och den saknade-baseline-kanten. Inga tester har lagts till eller körts. Ingen live/RLS/native/visuell PASS hävdas; funktionell QA återstår. `python tools/dev_flow.py validate` och `git diff --check` är dokument-/diffhygien, inte funktionsbevis. Ingen commit/push ingår i den här implementationsturnen.

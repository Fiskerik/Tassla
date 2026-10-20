# FLOW-HOME-CHECKLIST-FILTERS-01 — filter- och Kommande-resan

Datum: 2026-10-20
Version: v1 — skickas för Product, Architect, Critic och Security review
Status: planutkast; ingen implementation påbörjad
MVP: `docs/MVP-EXPERIENCE-CONTRACT.md` panel 4; `docs/design/vision-rev02-screen-contracts.md` panel 4

## Mål och avgränsning

Efter Idag-slicen ska hundägaren kunna byta mellan **Idag**, **Denna vecka**, **Alla** och **Kommande**, förstå om en rad är utförd eller bara planerad, och nå den befintliga källan utan att uppgifter försvinner, skapas eller räknas två gånger. Samma inloggade konto och aktiva hund gäller hela resan. Filterknappar visas bara tillsammans med fungerande urval och fullständiga tillstånd; inga dekorativa/inaktiva segment.

Detta är klassat H i kön: läsningen ändras för ägarens hundägda aktivitets- och hälsoplanrader och måste granskas av Security. Inget nytt dataändamål, delning, migration, RLS-policy, schema, dependency, persistens, notifiering eller analytik ingår. Läsningen är hundägarens befintliga dagsaktivitet och ägarregistrerade hälsoplaner inom samma konto/hund. Befintliga dagsmutationer och ägarens hälsoplaner ändras inte av filtrering.

## Föreslagen databetydelse

Alla datum är giltiga `YYYY-MM-DD`-nycklar och beräknas som kalenderdatum utan UTC-/DST-förskjutning. Den fångade laddningsnyckeln innehåller konto-/hundlivstid, hund-ID, tidszon, filter och datumgränser. Varje svar kontrolleras efter `await`; byte av hund, konto, tidszon, filter eller vy får inte publicera gamla rader. Sparade rader behåller sin `date_key` och sin sparade `time_zone`; historiska tider flyttas inte om därför att enheten bytt tidszon.

| Filter | Datakälla och gräns | Visning/status |
|---|---|---|
| **Idag** | Oförändrad befintlig dagsladdare och bekräftade dagsaktiviteter. | Oförändrad checkbox-/träningskälla och dagens progress. |
| **Denna vecka** | Aktiv ISO-vecka, måndag–söndag, räknad från dagens lokala datum. Endast redan sparade `dog_daily_routine_days` med frysta checklist-snapshots och `dog_daily_training_selections` inom veckans nycklar. Läs alla sidor; kör inte occurrence-creation-RPC:n för andra datum och härled aldrig uteblivna historiska dagar från dagens rutinmall. | Gruppera sparade aktiviteter efter lokalt datum. Klara/oklara rader följer sparade rutinstatusar och exakt träningsversion/step/datum. En eventuell sparad framtida dagsrad märks Planerad; den får ingen checkbox och påverkar inte completed-progress. |
| **Alla** | Rullande 30 lokala kalenderdatum inklusive idag: `today - 29` till och med `today`. Endast sparade dagsrader/urval; ingen mall, återkommande tillbakaberäkning eller obegränsad historik. Den lokala gränsen gäller även om serverns retention-jobb inte körts. | Gruppera efter sparat datum. Visa bara bekräftad count när alla källsidor och nödvändiga aktivitetsnamn har laddats. Gränsen gäller vyurvalet och påstår inte att äldre serverdata har raderats. |
| **Kommande** | De sju framtida lokala kalenderdatumen från imorgon till och med `today + 7`. (1) Aktuella ägarvalda återkommande `dog_daily_routines`, projicerade enbart för reglernas giltiga datum med befintlig `isRoutineDueOnDate`-semantik; ej engångsmallar. (2) Hundägda `dog_health_plans` med `due_on` i samma inklusiva datumintervall. Future training visas inte: den befintliga urvalskällan/SQL-guard skapar inte framtida val. Om ett godkänt framtida urval senare finns måste det vara sparat och planreview förnyas före ändring. | Varje rad är **Planerad**, saknar checkbox och ingår aldrig i klar-/dagsprogress. Rutinrad öppnar fokuserad rutinhantering av källan utan åtgärd för dagens dagsval; hälsoplan öppnar befintliga Planerade hälsohändelser med tillgängligt bakåtnamn och retur till Checklistan. Ingen framtida vårdhändelse kallas utförd. |

Denna vecka och Alla backfillar aldrig förekomster genom att köra `ensure_due_daily_routine_days`: dess serverkontrakt accepterar endast aktuell lokal dag och skulle annars både skriva data och riskera att skapa missade dagar. Kommande rutinposter är en beräknad presentation av en uttrycklig, aktuell ägarstyrd återfallsregel, inte sparade occurrence-rader; därför märks de alltid Planerad. Rutinregelns ankare, intervall, ISO-veckodagar och månadsslut måste matcha den befintliga modellen och SQL-kontraktet.

Training selection finns med i sparad vecka/historik, men en rad vars publicerade versionsbundna steg inte längre kan återges får inte tyst försvinna eller räknas i ett komplett totalvärde. Rendera ett begränsat “aktivitetens träningskälla är inte tillgänglig” och tillståndet Delvis hämtad, utan fabricerad titel eller completion. Public/review-fixtures använder endast godkända publicerade steg; synthetic review-innehåll får aldrig se ut som verklig ägaraktivitet.

## Användarflöde och UI-tillstånd

1. Öppna befintlig underordnad Hem-route **Checklista**. Idag är initialt valt.
2. Tryck ett av de fyra fungerande segmenten. Den valda markeringen är tydlig och följer befintlig `Tabs` segmented-variant. Segmentskifte återställer listan till dess datumgrupp/toppen; Idag återanvänder befintlig dagskälla.
3. Visa grupperade rader i datumordning och stabil källordning. Historiska dagsrader är skrivskyddad presentation; befintlig completion ändras bara via Idag och dess normala källhandlingar. Kommande saknar checkbox/progress.
4. Tryck på en planerad rutin för att öppna befintlig rutinhantering med rätt rutin i fokus och endast dess mall/återfallsredigering. Dölj “Lägg till/Ta bort från Hemskärmen” i den här kontexten eftersom det avser idag; ändra inte dagsval genom att öppna en framtida rad. Ta inte bort rutinens befintliga uttryckliga destruktiva bekräftelse.
5. Tryck på en planerad hälsohändelse för att öppna den befintliga planvyn. Tillbaka går till samma Kommande-filter i Checklistan. Den planerade posten behåller befintlig copy “Planerad – inte genomförd.”

Tydliga tillstånd för varje serverhämtat filter:

- **Laddar:** listan ersätts med befintlig tokeniserad skeleton; inga gamla hund-/filterrader visas.
- **Komplett/tom:** säkert tomläge för det aktuella filtret; ingen falsk 0-av-0-progress.
- **Komplett/data:** alla required sources är fullständigt paginerade/validerade; datumgrupper och totaler beskriver exakt listan.
- **Delvis hämtad:** minst en källa/sida misslyckades eller en saved training selection inte kan resolve:as. Visa en synlig kort förklaring och endast rader från lyckade kompletta källor; visa ingen total/progress som antyder komplett lista; erbjud Försök igen.
- **Fel:** inga källor kunde läsas; inga rader eller tomläge; retry i samma hund/filter/datumscope.
- **Föråldrad scope/avbruten request:** ignorera utan fel-/tomfeedback i den nya vyn.

## Visuellt/interactionellt kontrakt

- Följ `docs/design-rules.md` §0–4 och §14 samt Panel 4. Återanvänd befintliga token och `Tabs`-segment; lägg inte till färger, kortstaplar eller dekorativa kontroller.
- Högst en primär handling per synligt sammanhang. Filter är val, inte fyra primära CTA:er. Planerade rader får konsekvent “Planerad” + källaikon/namn; färg är aldrig ensam statusbärare.
- Håll datumgrupper, texter och felhjälp korta. Behåll tillräcklig vertikal separation via spacing tokens; föredra en sammanhållen lista med diskreta avdelare före box-i-box-kort. Ingen ny skugga eller accentlinje om den inte redan krävs av designkontraktet.
- Inga nya animationer eller dependencies. Återanvänd befintlig segment-/skärmrörelse bara om den inte döljer laddning eller byter kontext; reducerad rörelse fortsätter fungera.
- Touch-/screen-reader-namn beskriver filter, datum, källa och Planerad-status. Färg kompletterar men ersätter inte label/state. Minst 44×44 pt för tryckbara segment/åtgärder; lång svenska och 140 % text får växa och scrolla.

## Filer och skyddade ytor

Exakta avsedda skrivvägar, inga ändringar utanför listan utan ny planversion/review:

- `src/features/home/DailyChecklistScreen.tsx`
- `src/features/home/DailyActivityManagerSheet.tsx` — valfri rutin-only-kontekst från Kommande; befintligt defaultflöde lämnas oförändrat
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/daily-activity-data.ts`
- `src/features/home/daily-activity-model.ts`
- `src/features/home/README.md`
- `src/data/workspace-data.ts` — fullständigt hundscope:ad datumintervalläsare för planerad hälsa
- `src/features/health/PlannedHealthScreen.tsx` — tillgängligt bakåtnamn/returtext via opt-in prop; Hälsa-default oförändrad
- `tests/daily-activity-range.test.mjs`
- `tests/daily-checklist-filters.test.mjs`
- `tests/daily-activity-model.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `tools/visual-check/README.md`
- `docs/design/evidence/flow-home-checklist-filters-2026-10-20/`
- `docs/tasks/dev/FLOW-HOME-CHECKLIST-FILTERS-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md`
- Vid avslut/checkpoint: `docs/releases/HISTORY-2026.md` och `docs/decisions/MASTER-LOG.md`

Skyddat: migrations-/RLS-filer, tabell-/RPC-/grant-kontrakt, `dog_events`, loggflöde, kunskaps-/åldersurval, träningsprogressmutationer, account/dog-selection architecture, dependencies, auth och andra paneler. Inga historiska uppgifter skrivs om eller återskapas.

## Acceptance och verifiering

1. Fyra filter är klickbara/namngivna och kopplade till respektive verkliga scope. Idag är oförändrad och saknar dubblerade återkommande fetch/write.
2. ISO-vecka testar måndag, söndag, nyår och lokal/DST-gräns. Endast sparade dagsrader visas; ett historiskt datum utan materialiserad row förblir tomt även om dagens mall skulle ha förfallit då.
3. Alla använder exakt 30 datum från idag−29 till idag; inga mallar eller framtida projektioner. RLS dog-scope och query-date range valideras i dataläsaren.
4. Kommande inkluderar imorgon och `today + 7`, exkluderar idag och `today + 8`; daglig/veckovis/varannan-vecka/månadsregel, ankare före/efter range och månadens sista dag testas. Ingen `ensure_due_daily_routine_days`-RPC. Framtida health är hundscope:ad, paginerad och read-only. Inga fabricerade framtida training-val.
5. Paginering provar 0, exakt en full sida, flera sidor, instabil/malformerad/cross-dog response och andra sidans fel för varje source. Inga halvfärdiga page-resultat blir komplett/empty; timeout/abort följer captured scope.
6. Rutin-/healthplan-destinationer, korrekt tillbaka till samma filter, inga framtida checkboxar/progress, stale hund-/account-/filter-/timezone-svar, retry efter partial/error och Idag-regression testas.
7. Riktad testkörning: `node --experimental-strip-types --test tests/daily-activity-range.test.mjs tests/daily-checklist-filters.test.mjs tests/daily-activity-model.test.mjs`; därefter `pnpm check`, `pnpm bundle:ios`, `git diff --check` och `python -X utf8 tools/dev_flow.py validate`.
8. Rendera public/review med fullständig syntetisk fixture för Idag/Denna vecka/Alla/Kommande: empty/loading/partial/error/populated, repetition, sparad historik, framtida rutin + planerad hälsa, source navigation och retur. Viewports 375×844, 430×844, 375×667 och 140 % text; arkivera exakta bilder/browser-resultat/§14 punkterna 1–18 med build/viewport/scenario/commit. Sätt endast verkliga pass.
9. Live Supabase/RLS och native VoiceOver, Dynamic Type, fysiska gester/TestFlight redovisas var för sig. Inte verifierade miljöer är NOT TESTABLE och får inte ges PASS; tillämpa Eriks policy att native-test inte stoppar lokalt checkpoint-arbete. Om query kräver en migration/policyändring ska implementeringen stanna och planen granskas om.

## Rollgranskning och status

- Product: granska datumdefinitioner, rutin/health-rows, destinationsval, labels och om den här read-only presentationen ligger inom befintlig användarnytta.
- Architect: verifiera befintliga SDK-/query-/SQL-/RLS-kontrakt, sidläsning, abort/lifetime, recurrence parity, route/back och nödvändiga skrivvägar. Ingen implementation före APPROVE.
- Critic: pröva om filter, counts, Planerad-status, partial UI och destinationsmodeller är begripliga/kompletta i kritiska empty/error/användarresor.
- Security: verifiera syfte/minimering (samma konto/hund och befintlig användning), hund-ID på varje query, RLS-förutsättningar, abort/stale-scope och att inga nya writes/RPC-anrop sker.

Valda skills: `.agents/skills/tassla-consumer-ux/SKILL.md`, `.agents/skills/mobile-ios-design/SKILL.md`, `docs/design-rules.md`; använd de relevanta repo-/session-skillsen för data/security när deras instruktioner träffar implementationen. Artikeln Refactoring UI används endast som Tassla-anpassade finishprinciper i `tassla-consumer-ux`, under token-, kontrast- och planreglerna.

Beslut/status vid v1: **öppen för review; ingen Architect/Critic/Product/Security-APPROVE sparad; inga appfiler ändrade.** Ändrad produktbetydelse eller write path kräver v2 och nya godkännanden.

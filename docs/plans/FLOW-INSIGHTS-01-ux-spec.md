# FLOW-INSIGHTS-01 — Insikter med full period och synlig täckning

Datum: 2026-10-21

MVP: rev02, Panel 8

Status: exakt implementationsplan; Architect CHANGES åtgärdade, Critic/Security före kod

Risk: H — ny hundscopad läsresa av befintliga privata logghändelser; ingen ny datatyp eller ändamål

## Mandat och spårbarhet

Målbild: panel 8 i `vision_rev02.jpg`; bindande objekt- och navigationskontrakt: `docs/design/vision-rev02-screen-contracts.md` Panel 8 och `docs/MVP-EXPERIENCE-CONTRACT.md` Panel 8. Ägaren har beställt fortsatt rev02-UI-arbete med fokus på tydliga, synliga framsteg. Oberoende Reviewer är uppskjuten till MVP-closeout enligt `docs/decisions/MASTER-LOG.md`.

Panel 8 ska summera verkliga Kiss- och Bajsloggar för aktiv hund, låta ägaren välja Vecka/Månad/Sedan start och visa hur mycket data som faktiskt täcks. Vyn nås från Logga → Översikt och återgår till exakt valt Logga-datum, aktiv Loggflik och scrollposition. `ScreenTransition` avmonterar föregående route, så `ProductWorkspace` äger datumvalet och skickar det kontrollerat till LogScreen; en persistent LogScreen-instans antas inte. Logga och Insikter ingår i samma bevarade AppScreen-scrollflöde men har separata route keys och offsets. Bottenfliken Insikter markeras som Logg. Den lokala ändringen ger ingen sömnvaraktighet: nuvarande sömnhändelse saknar start-/slutintervall, så en tidslinje skulle hitta på data. Visa därför en kort sanningsenlig sömnstatus i stället för graf tills ett godkänt intervallkontrakt finns.

## Leverans och kodvägar

- Lägg till `src/features/puppy-log/insights-model.ts` för lokala periodgränser, täckning och bucket-/räkneprojektion.
- Lägg till `src/features/puppy-log/InsightsScreen.tsx` som äger presentation och periodval, inte dataåtkomst.
- Lägg till en smal `fetchDogInsightsEvents`-läsare i `src/data/workspace-data.ts`; den returnerar endast `id,event_type,occurred_at`.
- Ändra `src/features/home/ProductWorkspace.tsx` för aktiv hund/session/tidszon-scope, avbruten/versionsskyddad läsning, route `insights` och ägt `logSelectedDate`-state.
- Ändra `src/features/puppy-log/LogScreen.tsx` för kontrollerat datum (`selectedDate`/`onSelectedDateChange`) och Idag/Översikt-kapseln. Översikt öppnar Insikter; bottenfliken förblir Logg. Routes har separata AppScreen-scrollnycklar inom samma bevarade scrollflöde.
- Bevara separata offsets för `log` och `insights` under samma routeflöde via `AppScreen` keyed scroll offsets. Insikter öppnar från toppen första gången; dess egen scroll får aldrig skriva över Loggas sparade offset. Lämna flödet så återställs dess offsets enligt befintligt AppScreen-beteende.
- Ändra `src/components/AppPrimitives.tsx` för att lagra/återställa ett offset per route-key inom bevarat flöde, samtidigt som checklistflödets befintliga gemensamma offset/resetbeteende behålls.
- Gör `InsightsScreen` kontrollerad: tar emot period och data/status och skickar `onPeriodChange`/`onRetry`; ProductWorkspace äger period, aktivt scope, fetch, abort, fel och stale-svarsskydd.
- Lägg till riktade tester i `tests/insights-model.test.mjs`, `tests/insights-data.test.mjs`, `tests/insights-screen-policy.test.mjs` och en interaktiv verifierare `tools/visual-check/verify-insights-flow.py`. Uppdatera befintlig Logga-verifiering/evidens; lägg inte till en fristående demo som ersätter produktkomponenten.
- Lägg screenshots och manifest i befintliga `docs/design/evidence/flow-insights-01/{public,review}/` samt sammanfattningen i `docs/design/evidence/flow-insights-01/VERIFICATION.md`.
- Uppdatera befintlig Logga-README, taskrapport, kö, releasehistorik och screen-contract efter verkligt utfall.

## Data- och scopekontrakt

1. Använd appens autentiserade `SupabaseClient`, befintlig `dog_events`-tabell och RLS. Varje query filtrerar på aktivt `dog_id` och exakt eventtypen `pee`/`poop`; läs aldrig anteckning, beskrivning, olycksinnehåll, kontoexport eller andra hundar. Ingen service-role, RPC, migration, write eller ny permission.
2. Endast Kiss/Bajs-historik ingår. Vecka är `[lokal ISO-måndag 00:00, nästa måndag 00:00)`. Månad är `[lokal månadstart 00:00, nästa månadstart 00:00)`. Sedan start är `(-∞, lokal morgondag 00:00)` och omfattar endast sparade Kiss/Bajs-händelser. Datumgränser beräknas från enhetens IANA-tidszon till ISO-instants; tester täcker precis före, vid och efter båda gränser, årsskifte och DST.
3. Sidning sker i fallande `(occurred_at,id)`-ordning med strikt tuple-keyset (`occurred_at < cursor` eller lika tid och `id < cursor.id`), limit 250 och en kumulativ deadline för hela traversal; deadline nollställs inte per sida. Cursorvärden valideras; upprepad/icke-framåtriktad cursor och sidfel kan aldrig ge falsk completion. Timeout efter minst en komplett sida returnerar endast ärlig `partial`-täckning; timeout före första sidan är error, aldrig tomt/klart. `dog_id`, `event_type`, periodgränser och exakt projektion tillämpas på varje sida.
4. `Sedan start`-läsningen har ett hårt skydd om 10 000 poster. Att läsa exakt 10 000 poster markeras konservativt `partial` eftersom en full sista sida inte bevisar att historiken tog slut; ingen 10 001:a sentinel läses. `partial` redovisar faktiskt täckt datumintervall och bucketar beräknas endast från laddat intervall; visa copy som tydligt säger att äldre loggar kan saknas och vilket datumintervall som faktiskt täcks. Markera dessutom äldsta laddade bucket som partiell när utelämnade poster kan dela dess lokala datum, så grafen inte antyder full dagstäckning. Visa ingen retry-knapp för cap-partial eftersom samma fasta gräns inte kan hämtas förbi med ett nytt försök. Ett nytt försök börjar om från aktuell scope vid återhämtningsbart timeout-/transportfel. Testa 9 999, 10 000 och 10 001+ poster.
5. Läsningen invalidieras vid session-/hundbyte, period-/tidszonsbyte, stängning eller unmount. Abort/generation och läsningens fullständiga scope förebygger att inaktuellt svar skrivs in. Ingen cache delas mellan hundar eller perioder. Öppning av Insikter hämtar aktuell period på nytt.
6. Summera bara explicita `pee`- och `poop`-event. `accident` hålls separat och blandas inte in utan produktbeslut. Varje grafstapel, legend och summering kommer från samma fullständiga modellresultat.
7. Bucketar: Vecka visar sju lokala dagar, Månad grupperar månadens dagar per kalendervecka, Sedan start grupperar efter lokal månad (eller år när faktiskt laddat intervall är längre än två år). Labels och början/slut på täckning beräknas ur laddade poster och periodgränser; tom, partiell och okänd dataläsning är separata. Testa tvåårsgränsen och etikett-/stapelbarhet vid 375 px.
8. Om sömn visas: använd en kort neutralt formulerad status om saknat start-/slutintervall. Ingen stapel, sömnduration, normalitetsbedömning eller extrapolering tills intervalldata faktiskt finns och ett separat kontrakt godkänns.

## Synlig komposition

Tillbaka + `Insikter` → kapselsegment Vecka/Månad/Sedan start → varmt `Kiss & bajs`-kort med grön/brun grupperad stapelbild och tydliga bucketetiketter → en kort numerisk total och täckningsrad → `Sömn`-kort med ärlig status. Återanvänd befintliga Card/Tabs/tokens och små vyprimitiver; ingen diagramdependency eller chart library. Lägg inte till introduktionsstycke, tillfälliga debugbanners eller fiktiva innehållskort. Varje period-/statusbyte ska direkt påverka synligt innehåll.

## Acceptans

- Monterat route-test kör Logga → Översikt → Insikter → tillbaka: Insikter öppnas vid toppen även om Logga är skrollad; skrollning i Insikter skriver inte över den separata Logga-offseten; tillbaka bevarar exakt Logga-datum, flik och ursprunglig offset. Insikter markerar Loggfliken. LogScreen kan avmonteras under detaljresan eftersom datumet ägs av ProductWorkspace.
- Vecka/Månad/Sedan start ger rätt lokala halvöppna gränser, full sidning eller ärlig partiell täckning, antal per eventtyp och korrekt grupperade bucketar. Empty, loading, error/retry, partial och ready är skilda. Cap-partial visar saknade äldre loggar och faktiskt datumspann utan missvisande retry. Exakta gränser testas före/på/efter start och slut; paging-test har identiska tidsstämplar över 250-radsgräns utan saknade eller dubbla poster; cap täcker 9 999/10 000/10 001. Tvåårsbytet verifieras vid 375 px.
- Kiss- och Bajslegend, verkliga tal, sammanfattning och visuell höjd-/färgskillnad går att jämföra med `vision_rev02.jpg` panel 8 vid 375×844, 430×844 och 375×667; avvikelser listas i §14.16.
- Querykontrakt och scope/fel/abort/cursor täcks med installerad Supabase-klienttestdouble som fångar den faktiska builderkedjan på varje sida: exakt projection, hund-/event-/periodfilter, `.or('occurred_at.lt.<ts>,and(occurred_at.eq.<ts>,id.lt.<uuid>)')`, sorteringsordning och lika tidsstämplar vid 250-radsgränsen utan lucka/dubblett; även duplicate/nonprogressing cursor och kumulativ deadline. Scope-/aborttester täcker session, hund, period, tidszon och route. Inga credentials eller verkliga ägardata används. Live RLS är separat NOT TESTABLE om ingen godkänd syntetisk testmiljö finns.
- Sömn visar inget påhittat intervall. Full panelacceptans för sömndiagram förblir öppen tills källmodellen kan styrka intervall.
- Riktad svit, `pnpm check`, public iOS JS-export, public/review RN Web-render, exact build/branch/commit, `git diff --check` och `python -X utf8 tools/dev_flow.py validate` passerar. Ingen signerad build/TestFlight påstås av dessa steg.
- 140 %/stor text, VoiceOver/TalkBack, reducerad rörelse, numeriska kontrastmått och hit-area-audit är inte MVP-grindar. Funktionella labels, val, retry och back behålls.

## Reviewbeslut

Architect — CHANGES åtgärdade 2026-10-21 (route unmount/state-lift, aktiv flik, exakta datumgränser, verklig builder-/sidgränstest och konservativ cap). Critic — PROCEED efter att routens separata scroll-offset, cap-copy utan retry och 375 px tvåårsgränstest lades till. Security — APPROVE WITH IMPLEMENTATION CONDITIONS 2026-10-21: kumulativ deadline över hela traversal; äldsta cap-bucket markeras partiell; query-, cursor-, cap- och scope-aborttester enligt §4.6. Dessa villkor är införda ovan och är obligatoriska för QA. En ändring i datakolumner, tabell, permission, ändamål eller intervalldefinition kräver reviderad plan-/Security-review. Reviewer sparas till MVP-closeout.

# FLOW-HOME-CHECKLIST-01 — implementeringsplan v9

Datum: 2026-10-20
Status: v9 amendment efter oberoende Reviewer-fynd; Architect APPROVE 2026-10-20 före offset-reset
MVP-spårning: docs/MVP-EXPERIENCE-CONTRACT.md panel 4; docs/design/vision-rev02-screen-contracts.md panel 4

## Beslutad avgränsning

Denna första vertikala checkpoint levererar den fullständiga **Idag**-resan: Hem → full dagslista → rutinhantering eller exakt träningskälla → tillbaka till Checklistan/Hem. Den använder samma aktiva konto, hund, lokala datum, tidszon, dagslista, bekräftade rutinstatus och källhärledda träningsstatus som Hem.

Detta är en checkpoint inom panel 4, inte full acceptans av panelen. Denna slice visar inga dekorativa eller inaktiva segment för Denna vecka, Alla eller Kommande. FLOW-HOME-CHECKLIST-01 måste därför begränsas till Idag i kön. En separat efterföljande köpost, FLOW-HOME-CHECKLIST-FILTERS-01, ska leverera resterande filter med verkliga gränser och data enligt panelkontraktet. Hälsoplaner, återkommande framtida rutiner och historiska dagar blandas inte in i dagens räknare.

Mandatet kommer från Eriks beslut 2026-10-06 att färdigställa godkänd MVP i ordning, bekräftat av 2026-10-15-beslutet om åtta funktionella panelresor. Inget nytt persondataändamål, schema, migration, dependency eller extern tjänst ingår.

## Användaruppgift och upplevelse

En hundägare ska kunna öppna hela dagens uppgiftslista oavsett om dagen har 0, 1, 5 eller fler aktiviteter, förstå vad som är klart och gå direkt till rätt handling utan att Hemmet behöver visa alla rader.

- Hem behåller sin kompakta sammanfattning och separata Hantera-funktion. En enda alltid synlig Checklista-länk ersätter nuvarande villkorade “Visa alla”; synlig etikett är “Checklista” och tillgängligt namn är “Öppna dagens checklista”. Den dupliceras inte bredvid Hantera.
- Checklistan öppnas som en detaljvy under Hem med synlig bakåtknapp, rubriken Checklista och begripligt lokalt datum. När det finns uppgifter visas verklig total/bekräftad count, progress och samtliga dagens uppgifter i en sammanhållen lista; när listan är tom visas varken “0 av 0” eller en tom progressindikator.
- Idag är enda segmentet i denna slice. Filtersegment lämnas helt dolda tills alla filter som visas har fungerande dataurval.
- Tomt läge säger neutralt att det inte finns några aktiviteter idag och erbjuder en tydlig väg till befintlig rutin-/träningshantering. Hantering går också att nå från Checklistan när listan innehåller rader.
- Rutinradens fyrkantiga checkbox är en separat minst 44×44 pt handling. Träningsraden är en öppningshandling till exakt programversion och steg; den har ingen andra checkbox eller separat completion-skrivning.
- Detaljrader följer panel 4: minst 56–64 pt när två textrader behövs, får växa, ämnessymbol och kort hjälprad där den ger värde, diskreta avdelare, fullständigt tillgängliga namn. Ingen extra knapptext som “Visa” på varje rad.
- Pending, confirmed, failed och unknown följer befintlig readback- och retrylogik. Ett oklart skrivsvar får aldrig öka progressen.
- En träningsrad går via en särskild Home-underordnad detaljrutt, inte huvudfliken Träning. Rutten fokuserar på exakt programversion/step-id. Bottenmenyn behåller Hem som aktiv och huvudflikssvep är avstängt.
- Stängning, bekräftad completion eller bekräftad avmarkering återför till Checklistan med tidigare scrollposition bevarad och den uppdaterade källraden synlig. Failed/unknown lämnar användaren i rätt källsteg med sparad återhämtningshandling; ingen retur sker före bekräftad readback.
- Checklista och träningsdetaljen markeras som underordnade Hem i bottennavigationen. De deltar inte i huvudflikssvep.

## Kod- och datagräns

Återanvänd ProductWorkspace:s existerande dailyActivities, dagssnapshot, konto-/hund-/datum-/tidszonsscope, reloadDailyActivity och runDailyMutation. Läs/skriv inte en separat kopia och introducera inte en egen completed-flagga. Träning öppnar program och steg via befintlig versionsbunden PublishedTrainingScreen; bara dess befintliga completion-/avmarkering får ändra training_progress. Kontrollerad routing ska också bevara en retur till Checklistan när träningsarket stängs.

Fokuserad Security-förhandsgranskning hittade att ProductWorkspace:s befintliga completeStep saknar den aktiva selection-lifetime-kontroll som unmarkStep redan har. Den nya fokusvägen måste fånga aktuell konto-/hund-/programurvalslifetime och accountDeletionInvalidated innan skrivning och kontrollera dem igen efter varje await innan den laddar om eller publicerar status, fel, analytics eller busy-state. En callback som startar efter scopebyte eller bekräftad kontoradering ska inte anropa insertTrainingProgress. En redan skickad och korrekt hundscope:ad skrivning kan inte återkallas, men ett sent svar får aldrig påverka den nya hundens vy eller status. Busy/fel-cleanup ska ägas av rätt mutation/lifetime så ett gammalt finally inte rensar en ny scopes status.

Ingen SQL, migrering, RLS-policy, persisted cache, ny dependency eller ändring av befintlig dagsmodell.

## Scope och tidsskiften

- Dagens lokala datum och validerad tidszon förblir datakällans auktoritet. Checklistan använder samma dagsscope som Hem och ingen separat date_key.
- Lägg Checklistan till i befintlig klock-/foreground-refresh. Vid midnatt eller ändrad enhetstidszon laddas det nya lokala dagens snapshot; den gamla listan blir inte synlig som dagens lista. En redan fokuserad träningsstep-rutt stängs och fokus rensas innan den nya dagen visas.
- Konto-/hundscopeändring aborterar eller ignorerar gamla svar med befintliga generation/lifetime-guards, rensar träningsfokus och återför till giltigt Hem. En gammal dagscallback får inte ändra den nya hundens synliga lista.
- Den separata träningsdetaljrutten bevarar normal Träning-flik. Den öppnas med den valda aktivitetens program-version-ID och step-ID; om källprogram eller steg saknas visas ett ärligt fel-/retryläge och ingen annan övning väljs automatiskt.

## Designmatris

| Mål/nuvarande läge | Ändring | Verifiering |
|---|---|---|
| Hem visar högst fem rader; nuvarande “Visa alla” är villkorad och överlappar Hantera | Ersätt den med en enda permanent Checklista-länk, skild från Hantera | Loading/error/0/1/5/7 aktiviteter, ingen dublett, knappmål och tillgängligt namn |
| Ingen fullskärmschecklista finns | Lägg till detaljvy med tillbaka, datum, verklig count/progress och samtliga rader | Population och confirmed-count-paritet med Hem |
| Träningsrader öppnar generell träningslandning | Öppna en Home-underordnad fokusroute för exakt programversion/steg; återvänd efter close eller bekräftad completion/undo | Klick visar rätt steg; close/completion/undo returnerar; failure/unknown stannar kvar; ingen extra skrivning |
| Daglig klock-/refresh-livscykel körs för Hem/Träning | Inkludera Checklistan i samma scope-/foreground-refresh; ny local day/timezone rensar gammalt steg och laddar om; scopebyte aborterar gammal vy | Dagsbyte, tidszon, hundbyte, app foreground, sen callback och stale/pending/unknown-regression |
| Undersidor markeras i dag som Mer | Mappa Checklista och träningskällans detalj till Hem; lås huvudflikssvep i underflödet | navigationstester och renderad back-/tabresa |
| Panel 4 visar filter men kontraktet förbjuder låtsasfilter | Utelämna segment tills efterföljande dataurvalspaket | visuell granskning mot panel 4, öppet panelgap redovisat |

## Avgränsade delmoment

1. Implementera DailyChecklistScreen med samma dagslista och radtillstånd; separat designvariant får läggas till i den befintliga DailyActivityItem om det är minsta återanvändbara lösning.
2. Lägg till Hem-ingång, underordnad ProductWorkspace-route, scope-/foreground-/midnattslivscykel och returväg till exakt träningssteg. Scope-/dags-/tidszonsbyte måste ändra den faktiska ProductWorkspace-rutten till Hem, så refresh och huvudflikssvep inte ligger kvar i en dold child-route. Behåll dagens mutationer och hanteringssheet.
3. Ge AppScreen en opt-in scroll-restoration-nyckel som endast används för Checklista-flödet: Checklistan sparar sitt offset, träningsdetaljen börjar vid toppen med synlig AppBar/bakåtknapp och återkomst återställer Checklistans sparade offset. Standardbeteendet på övriga AppScreen-vyer förblir oförändrat.
4. Utöka befintlig visual-check-fixture för den verkliga produktionskomponenten, synthetic states och routeinteraktioner; verifiera synlig detalj-AppBar/bakåtknapp och återställd lägre källrad. Komplettera riktade tester för stale scope callbacks.
5. Gör avgränsad läsbarhetsstädning, kör tester och rendering, dokumentera §14 separat inklusive punkt 16 som delvis panelgap, lämna till oberoende QA och Security, därefter Reviewer och commit/push enligt repots hookar.

## Ändringsytor

Förväntade skrivfiler, inga övriga utan ny review:

- src/features/home/DailyChecklistScreen.tsx (ny)
- src/features/home/HomeScreen.tsx
- src/features/home/ProductWorkspace.tsx
- src/components/AppPrimitives.tsx (opt-in scroll restoration for the Home checklist child flow only)
- src/features/home/main-navigation.ts
- src/features/home/home-today.ts
- src/components/ui/DailyActivityItem.tsx
- src/features/training/PublishedTrainingScreen.tsx
- src/features/home/README.md
- tests/daily-checklist-screen.test.mjs (ny)
- tests/daily-checklist-route.test.mjs (ny)
- tests/daily-activity-ui.test.mjs
- tests/home-vision.test.mjs
- tests/training-step-mutation-scope.test.mjs (ny)
- tests/main-navigation.test.mjs
- tests/home-today.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/verify.py
- tools/visual-check/README.md
- docs/design/evidence/flow-home-checklist-2026-10-20/
- docs/tasks/dev/FLOW-HOME-CHECKLIST-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md
- docs/decisions/MASTER-LOG.md
- docs/plans/FLOW-HOME-CHECKLIST-01-ux-spec.md

Ändringsytorna är exakta för det godkända slice-målet. Om implementation visar behov av annan app-/testyta ska arbetet stanna före ändringen tills planversionen och Architect-granskningen förnyas.

## Acceptans

1. Hem har exakt en alltid synlig Checklista-ingång med etiketten “Checklista” och tillgängligt namn “Öppna dagens checklista”, även vid loading, error och 0/1/5/7 uppgifter. Den ersätter villkorade “Visa alla” och dupliceras inte med separat Hantera.
2. Fullskärmslistan har exakt samma aktiva scope, dagens datum, population och bekräftade count som Hem, inklusive alla rader över fem. Vid 0 uppgifter visas ett neutralt tomläge och hanteringsväg, aldrig “0 av 0” eller tom progress.
3. Rutinbock visar pending och ändrar först status efter befintlig bekräftelse/readback. Failed/unknown lämnar tidigare bekräftad progress och erbjuder befintlig återhämtning.
4. Träningsrad öppnar korrekt publicerad programversion och steg i en Home-underordnad route. Detaljvyn börjar överst med synlig AppBar och bakåtknapp; close och bekräftad completion/undo återgår till Checklistan med föregående scrollposition bevarad och uppdaterad källrad synlig. Failed/unknown stannar vid källsteget med retry. Ett 7-radersprov öppnar en nedre träningsrad och verifierar synlig detaljnavigation samt samma rad/count vid retur. Status hämtas från befintlig training_progress; ingen parallell checkbox eller extra completion-write introduceras.
5. Rutin-CRUD, dagsval, borttagning, undo, retur och tidigare Home/Training-flöden regressionskontrolleras.
6. Vid lokalt dags-/tidszonsskifte uppdateras checklistans datum och population; konto-/hund-/dags-/tidszonsscopebyte ändrar den faktiska rutten till Hem, rensar child route/fokus och återställer korrekt refresh-/huvudfliksbeteende. A→B→A kan inte återuppliva en gammal child route. En gammal träningscallback gör ingen ny write efter scopebyte eller bekräftad kontoradering, och sent write-/readback-/finally-svar ändrar inte ny scopes data, fel eller busy-indikator.
7. Loading, tomt, read error/retry, refresh error, pending, failed och unknown kan särskiljas; läsfel visas aldrig som 0/0.
8. Alla berörda interaktioner har korrekt skärmläsarnamn/-status, minst 44×44 pt relevant mål och följer reducerad rörelse; vanliga uppgiftstitlar hålls korta och fulla namn är tillgängliga.
9. Renderad RN Web-evidens jämför Checklistans Idag-slice med panel 4 vid 375×844 och 430×844, 375×667, normal och 140 % text, public/review-läge, 0/1/5/7 uppgifter samt loading/error/confirmed/pending/unknown. Hem visar exakt en Checklista-ingång i varje relevant state; tomläget saknar falsk count/progress; detaljens synliga AppBar/bakåtknapp, start vid toppen och återställd lägre 7-raders källrad verifieras i browsern. §14 punkterna 1–18 besvaras var för var; #16 anger explicit att filterblocket ännu saknas och att panel 4 är öppen. Ingen native eller live RLS-verifiering påstås.
10. Dokumentation och queue checkpoint skiljer denna lokala Idag-slice från hel panel 4. Denna vecka/Alla/Kommande förblir öppna tills efterföljande paket verifierats.

## Risk och verifieringsplan

Risk: M. Motivering: ny navigeringsresa exponerar befintlig konto-/hund-/datumscopad dagsläsning och mutation i en ny vy, men ingen ny datakälla, persistens, schema, RLS-yta, hälsopost eller dataanvändning tillkommer.

En fokuserad oberoende Security-review krävs före implementation eftersom befintlig konto-/hund-/datumscope exponeras via en ny route och samma befintliga write callbacks nu kan triggas där. Granskningen ska kontrollera att routebyte, hund-/kontobyte, stale read/write callback och training focus aldrig korsar scope. Detta är en statisk review av lokala kontrollflöden och innebär inte live RLS-verifiering. Ingen migrering, ny permission eller backendändring planeras.

Planerade kontroller efter implementation:

- node --experimental-strip-types --test tests/daily-checklist-screen.test.mjs tests/daily-checklist-route.test.mjs tests/daily-activity-ui.test.mjs tests/home-vision.test.mjs tests/training-step-mutation-scope.test.mjs tests/main-navigation.test.mjs tests/home-today.test.mjs
- pnpm check
- pnpm bundle:ios
- git diff --check
- python -X utf8 tools/dev_flow.py validate
- Public/review-render via tools/visual-check/build.cjs och verifiering via tools/visual-check/verify.py; spara exakta bilder, browserresultat, commit, viewport, font scale, scenario och §14-bedömning under evidenskatalogen.

NOT TESTABLE för live Supabase/RLS, native VoiceOver/Dynamic Type, fysiskt svep eller TestFlight hålls separat och blockerar inte den avgränsade lokala checkpointen enligt Eriks TestFlight-policy. Renderade bilder och en lyckad lokal check bevisar inte de miljöerna.

## Plan amendment v8 — 2026-10-20

Oberoende UX/acceptance-review stoppade den första implementationen med två reproducerbara problem: träningsdetaljen ärvde Checklistans scroll-offset och kunde därför öppnas utan synlig tillbaka-navigation; vid scopebyte visade `visiblePage` Hem medan den interna ProductWorkspace-rutten låg kvar som child-route. Route-invalidation och regressionsprov finns redan inom v7:s godkända ProductWorkspace-ytor. Scroll restoration kräver nu en uttrycklig opt-in ändring i `src/components/AppPrimitives.tsx`, därför läggs den till i exakt `write_paths` före implementering.

V8 begränsar scroll-stateförändringen till Checklista-flödet. Övriga `AppScreen`-konsumenter behåller sitt nuvarande reset-till-toppen-beteende. Browser acceptance kräver synlig Träningssteg-AppBar/bakåtknapp vid öppning från en nedre rad, därefter återställd Checklistan-offset när användaren går tillbaka. Architect **APPROVE** v8:s exakta extra path och acceptance 2026-10-20. Securitys statiska PASS för scope lease/invalidation gäller; den faktiska routeövergången och scrollfixen ska granskas i slutdiffen.

## Nästa paket efter denna checkpoint

FLOW-HOME-CHECKLIST-FILTERS-01 ska bära kvarvarande full-panelarbete. Föreslagen semantik för dess egen planreview:

- Denna vecka = ISO-måndag till söndag i den aktiva hundens sparade lokala datumkontext. Visa bara verkliga sparade förekomster med frysta snapshotnamn. Härled inte missade historiska dagar från en rutinmall som kan ha ändrats.
- Alla = alla faktiskt sparade dagsaktiviteter som fortfarande finns kvar enligt den dokumenterade 30-dagars gallringen; inte mallar och inte obegränsad historik.
- Kommande = ett tydligt begränsat fönster på de kommande sju lokala kalenderdagarna. Visa verkliga planposter separat märkta Planerad, utan checkbox eller completed-progress. Föreslaget innehåll är framtida ägarvalda återkommande rutindagar och ägarens befintliga dog_health_plans; hälsoobjekt öppnar Hälsa och betyder aldrig utförd vaccination. Framtida träningsval visas bara om ett verkligt framtida val finns via godkänd källa; nuvarande trigger avvisar framtida träningsurval.
- Fullständigt sid-/datumurval, hund-/kontoscope, lokala tidszoner/DST, recurrence-ankare, complete-vs-partial/error, gallringsgräns, tomma lägen, navigation och 375/430/667/140 %-rendering testas innan segment visas. Ingen halv laddning markeras som komplett.

Health-plan-inclusion är Product-rekommendationen från den aktuella produktgranskningen, inte en redan sparad ägarfras. Den är en read-only presentation på samma konto/hund och följer panelkontraktets krav att en framtida vaccinationsplan aldrig är utförd. Arkitekt/Critic/Security ska verifiera detta uttryckligen i den efterföljande paketplanen innan kod. Om det visar sig utgöra ett nytt persondataändamål eller scope ska just den Kommande-ändringen invänta ägarbeslut, medan övriga lokala köpaket fortsätter.

Filtren visas först när de riktiga urvalen är klara. Detta efterföljande paket har ännu inte godkänd plan och får inte beskrivas som färdigt här.

## Plan amendment v9 — 2026-10-20

Oberoende UX/acceptance-review bekräftade att träningsdetaljen öppnas högst upp och att scope-/dagsbyte nu ändrar den faktiska ProductWorkspace-rutten till Hem. Ett kvarvarande scrollfel innebär att `AppScreen` behåller checklistans offset efter att underflödet lämnats, så en senare nyöppning kan återställa en gammal position. Inom samma redan godkända filyta ska den cachade checklistpositionen därför nollställas när `preserveScrollKey` blir `undefined`. Nyckeln förblir aktiv i Checklistan och träningsdetaljen, så retur till checklistan inom samma flöde bevarar positionen. Lägg till browser-verifiering för lämna via “Tillbaka till Hem” → öppna Checklista igen → rubrik/topprad synlig och scrollläge högst upp. Detta kompletterar befintlig A→B→A scope-/dygnsinvalidering; inget nytt datalager, filområde eller backendbeteende tillkommer. Architect — APPROVE v9 2026-10-20. Godkännandet gäller samma exakta write paths och lägger endast till offset-reset vid exit samt leave/reopen- och scope-återöppningsevidens.
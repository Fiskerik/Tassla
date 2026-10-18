# DOG-PROFILE-BREED-CATALOG-01 + R6/R7 — samlad implementation

Plan v7.1 — snävt R7-scrollscope-tillägg; ersätter den R5-only-plan som godkändes i v2. Den befintliga katalogförberedelsen behålls. Färsk Architect APPROVE, Critic PROCEED och Security PASS för v7 är mottagna; implementation startar inom det godkända scope. Security granskar H-klassad dataläsning och katalogmigration.

## Beställning och avgränsning

Eriks instruktion 2026-10-18: välj FCI-ras från en alfabetisk, fritextsökbar lista med Blandras förvalt; lägg masterplanens R6 Dagens framsteg och R7 Insikter i samma arbetspaket och samma slutliga push. Beskedet om paketordning bekräftades: **raskatalogen → masterplanens R6/R7**. Masterplanens R5 Utvecklingsresa skjuts upp. R6/R7 körs som separata, sekventiella QA-checkpoints innan en samlad commit/push; inga parallella skrivare.

Paketet följer befintliga MVP v2-resor och lägger inte till datamodeller, ändamål, dependencies, betalningar eller externa tjänster. Mix-delraser, Home-identitetsfält, R5 Utvecklingsresa och sömngraf/varaktighetsberäkning ligger utanför. Sömn är uttryckligen uppskjuten tills ett godkänt intervallkontrakt kan härleda varaktighet; ett enskilt sleep-event räcker inte. Ingen live-migration eller release ingår.

## Genomförandeordning och checkpointar

1. **DOG-PROFILE-BREED-CATALOG-01 — katalog och picker.** Färdigställ befintliga v2-förberedelser, skapa väljaren och koppla in nyregistrering/profilredigering. Stäng med riktad kod-, datakäll-, tillstånds- och visuell QA.
2. **FLOW-PROGRESS-01 — Panel 3.** Bygg egen Dagens framsteg-vy från samma redan laddade `dailyActivities`, datum och state som Hem. Inga egna progressrader eller veckomål. Stäng med dagsmängd/ring/lista/källhandling och återgång verifierade.
3. **FLOW-INSIGHTS-01 — Panel 8.** Lägg till Logg → Översikt → periodvy. Läs alla sidor för vald hund, räkna endast stödda kiss-/bajsdata, skilj tom period från läsfel och visa tidszon/täckningsförklaring. Stäng med periodgräns, sidning, numerisk tillgänglig motsvarighet och återgång verifierade.

Efter varje del görs dess avgränsade verifiering, cleanup, oberoende review och dokumenterade lokala checkpoint i rapporten/kön. Delarna committas inte var för sig. När alla tre är `done` och `pnpm check`, iOS-bundlekontroll, kövalidering och diffkontroll passerar görs en samlad commit och push. Appens TestFlight-/telefonprov och remote Supabase/RLS verifieras inte av lokala resultat och rapporteras separat.

## DOG-PROFILE-BREED-CATALOG-01 — exakt plan

### Källa och fast snapshot

- Källa: https://github.com/paiv/fci-breeds, revision `88aaca5c0726b2a4c6cf6aa06a1ffb359f9262f2`, `fci-breeds.csv`.
- SHA-256 upstream: `2D2C60256F62E4712F5FEE732EA0BA869588B1AAB802D952FC25373A893DA9A2`.
- Underliggande nomenklatur: https://www.fci.be/en/nomenclature/.
- MIT, copyright Pavel Ivashkov (2016); hela licensen sparas intill data.
- Hämtad/verifierad 2026-10-18: 360 rader med 360 unika numeriska FCI-ID:n; källnamn max 49 tecken. Checksumma för transformerad UTF-8-snapshot SHA-256: `F7623A7D42D7329AE61B7A8CD31E47348C8B7B1383944D66B08B4CBC1E10F84B` (360 rader; verifierad från arbetsfilen). Snapshotten är ett FCI-utdrag, inte en fullständig världsomspännande raslista.
- Endast ID och rasnamn importeras. Databas-ID `fci-{id}`; etikett i titelstil. Ingen övrig källtext, bild eller standard-PDF.

### Beteende och data

- Befintliga `public.breeds`-schema, `mixed`, `unknown`, foreign key, `create_dog`, grants, policies och RLS lämnas oförändrade. Additiv migration använder vanlig insert och misslyckas vid ID-kollision; aldrig ignore/update.
- Blandras visas först och är förvald för nyregistrering. Resterande lista sorteras svensk-lokalt; sökning ignorerar skiftläge och diakritiska tecken. Fritext kan aldrig skickas som ras-ID. Okänd ras bevaras.
- Samma sökbara väljare används i nyregistrering och profilredigering. Editorn startar från sparad ras och behåller befintlig readback-, konflikt-, success-, failure- och unsure-save-recovery-semantik. Regressionen verifierar att vald `breed_id` följer med befintlig registrering och att saving, bekräftad success, failure och unsure-save recovery fungerar oförändrat.
- Väljaren skiljer loading, load error/retry, laddad tom katalog och no-match åt. No-match säger uttryckligen att rasen saknas i FCI-listan och erbjuder befintliga `Okänd ras` och `Blandras` som tydliga alternativ. Modalens sökfält, val, stängning och återfört fokus uppfyller UX-spec och installerade React Native-mönster. Virtualiserad lista placeras inte i vertikalt rullande sheet.

## FLOW-PROGRESS-01 — R6 / Panel 3

### Data och beteende

- Hem länkar till en egen detalj med synlig tillbaka-knapp. `ProductWorkspace` skickar in exakt samma fullständiga `dailyActivities`, `dailyDateKey`, scope, state, refresh/error och mutationsfeedback som Hem använder. Dagsmängden förblir härledd från snapshoten, rutiner/checklistor och träningsval; logghändelser räknas inte in.
- Visa samma bekräftade mängd i ring, tal och aktivitetslista. Loading, läsfel, tom dag och partiella/okända statusar har skilda tillstånd; okänd status eller misslyckad refresh kan aldrig bli full ring eller falskt nollresultat. Tid visas endast om den finns i källan: träningssteg får använda den exakta `completedAtByStepId`-stämpeln, medan rutiner inte får återanvända en hel rutinrads `completed_at` som tid för varje deluppgift.
- Lägg till exakt tillgänglig träningsstämpel i härledd `HomeDailyActivity` via `daily-activity-model.ts`; rutinradens completion använder den befintliga muteringsgatewayn, inklusive pending/failed/unknown/readback och retry. Träningsrad öppnar exakt befintligt version-/stegmål och återgår till Dagens framsteg; efter tillbaka till Hem är samma snapshot-/progresskälla synlig. Källselektion som inte längre matchar current scope får inte öppna gammalt mål.
- Ingen separat lagrad progress, ingen logg som daglig uppgift och inget veckomål utan definierad population/period/källa. Avvikelsen är dokumenterad tills ett riktigt veckomål finns.
- Vyns egen navigation mappar tillbaka till Hem-fliken; `AppScreen` behåller befintlig scrollposition per route key.

### UI-mål

Tillbaka + centrerad titel → tydlig progressring med `{klart} av {bekräftade}` → “Det här har ni gjort idag” med källbaserade rader → kort varm sammanfattning. Tomt läge visar neutral ring; okänt underlag märks tydligt. Ring, lista och count jämförs separat mot panel 3 och designregler §14.

### R6 visuell korrigering — v1.2 med ringkantförfining

Architect APPROVE för v1.2. Den gamla vågiga 96-segmentsringen ersattes med 360 steg utan ny dependency. Efter ny ägarskärmbild ersattes de kvarvarande rundade segmentändarna med raka tangentiella remsor, vars bredd är 2,5 gånger båglängden per steg. Detta är en avgränsad presentationsteknisk förfining av samma godkända acceptans, utan ändring av scope, data eller interaktion. Architect recheck godkände den exakta geometrin; oberoende QA v1.3 PASS bekräftar 24 fall + 5 interaktioner och kontinuerlig skarp ring vid båda bredderna. Ny oberoende Reviewer-granskning återstår. Datumraden, inramningen runt ringen och den dubblerade count-raden är borttagna; varm sammanfattningsyta behölls. Jämförelsebilden använder tre representativa uppgifter. Separat sexradsbild kontrollerar att produktionslistan inte kapas.

Ny reducerad-rörelse-fångst visar jämn full, halv, partiell och okänd ring vid 375/430 px. Manifestet bekräftar 360 segment, exakt 180 gröna i halv läge, 360 gröna i full läge och de 8 amber-segmenten för okänd status. Browsermatris 24 fall + 5 interaktioner, inga page errors eller blockerade anrop; fokuserat UI-kontrakt 22/22; `pnpm check`, iOS review-export, queue validation och `git diff --check` ska köras på denna senaste geometri innan QA closeout. Oberoende QA v1.3 är PASS och Architect recheck är APPROVE; Reviewer granskar den aktuella snapshoten. §14 punkt 16 förblir **Nej** för full referensmatchning; personligt porträtt, live Supabase/RLS och native app-tillgänglighet saknas.

## FLOW-INSIGHTS-01 — R7 / Panel 8

### Läsning, period och analys

- Logg har en tydlig **Översikt**-ingång som öppnar egen Insikter-detalj och återgår till samma Logg-vy, valt datum och scrollposition.
- Val: aktuell Vecka (måndag–söndag), aktuell Månad och Sedan start (första registrerade händelsens lokala datum–idag). Vecka och Månad kan bläddras bakåt/framåt; framtida period kan inte väljas. Tom historik har ett eget tomt läge.
- Läsningen använder en ny `fetchDogInsightEventsPage` med minimal projektion `id,dog_id,event_type,occurred_at,accident_kinds` och endast eventtyperna `pee`,`poop`,`accident`; fri text/beskrivningar, sömn, mat, vatten, promenad och övriga fält hämtas inte. Alla sidor fortsätter tills samtliga relevanta rader har lästs. Varje sida använder samma deterministiska totalordning `occurred_at DESC, id DESC` före `range`-offset, så en oförändrad resultatuppsättning inte kan byta ordning mellan sidor. Varje begäran är `.eq('dog_id', dogId)`-scopad och går genom befintlig event-read-serialisering. Läser on-demand, avbryter vid route/hund/konto-/sessionsbyte och ignorerar sena resultat med aktiv konto-generation + hund + request generation som scope. Varje sida begär exact count; om count ändras under sidningen, ID:n dupliceras eller lästa rader inte matchar count visas retrybart läsfel utan partiell graf. Sidning är inte databastransaktion/snapshot isolation; resultatet märks som inlästa sparade loggar och kan behöva uppdateras om en annan klient ändrar historik samtidigt.
- Gruppera `occurred_at` efter en validerad IANA-tidszon från enheten och visa tidszonen i vyn. Tidsstämplar innehåller inte historisk tidszon; nuvarande enhetstidszon är den uttryckliga tolkningsregeln. Felaktig/otillgänglig tidszon ger unknown/error, inte felaktiga lokala datum.
- Grafen visar Kiss och Bajs per lokalt datum; olyckor räknas till de valda kanoniska `accident_kinds` enligt befintligt `summarizePottyPatterns`. Legacy-olyckor med okänd typ räknas inte in i någon av dem. Andra loggtyper blandas inte in i denna panel. Sammanfattningen är beskrivande; inga medicinska eller träningsmässiga slutsatser.
- Ett lyckat sidvarv validerar count-konsistens och unika ID:n och kan upptäcka vissa sidningsfel. Kontrollerna kan inte upptäcka alla samtidiga ändringar med oförändrat antal, exempelvis en borttagning och en insättning; de garanterar därför inte en sammanhängande komplett mängd under samtidiga skrivningar. Läsningen är best-effort, kan uppdateras och bevisar inte att ägaren loggat varje verklig händelse. Dagar/månader utan sparade poster visas i grafen som lucka och i numerisk motsvarighet som `Ej loggat`, aldrig som nollpunkt/-stapel eller linje som överbryggar luckan. Fel/retry, laddning, tom historik, tom vald period och observerade händelser hålls isär.
- Vecka/Månad visar högst 7/31 lokala dagsbuckar; Sedan start grupperas per lokal kalendermånad för att undvika obegränsat antal dagstaplar. Diagram har explicit legend, lokala datumaxlar och text/tabell med samma tal för hjälpmedel och varje saknad period redovisas som `Ej loggat`. Sömnvaraktighet, vakenintervall och imputering av luckor ingår inte. Den här checkpointen stänger endast den beskrivande Kiss/Bajs-delen; Panel 8 förblir öppen tills en separat godkänd sömnintervallmodell och dess implementation/QA finns.

### UI-mål

Tillbaka + titel → Vecka/Månad/Sedan start → periodnavigation → Kiss/Bajs-diagram med legend, datum och numeriskt alternativ → kort neutral förklaring av läsning/täckning. Datautdrag ur Loggs första sida får aldrig användas som periodunderlag. Diagram påstås inte representera komplett beteende när endast de sparade loggarna är kända.

## Planerade filer och skrivgränser

Katalogens implementation får endast skriva: `supabase/data/fci-breeds-2026-10.csv`, `supabase/data/fci-breeds-MIT-LICENSE.txt`, `supabase/migrations/202610180001_fci_breed_catalog.sql`, `src/features/onboarding/breed-picker-model.ts`, `src/features/onboarding/SearchableBreedPicker.tsx`, `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/onboarding/README.md`, `supabase/README.md`, `tests/breed-picker.test.mjs`, `tools/visual-check/app.tsx`, `docs/plans/DOG-PROFILE-BREED-CATALOG-01-ux-spec.md`, `docs/tasks/dev/DOG-PROFILE-BREED-CATALOG-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md` och `docs/design/evidence/vision-rev02/onboarding/BREED-CATALOG-01/`.

R6 får endast skriva: `src/features/home/DailyProgressScreen.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/features/home/main-navigation.ts`, `src/features/home/daily-activity-model.ts`, relevanta befintliga daily-activity testfiler eller en ny `tests/daily-progress-ui.test.mjs`, `tools/visual-check/app.tsx`, `docs/features/daily-progress.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md` och `docs/design/evidence/vision-rev02/daily-progress/`.

R7 får endast skriva: `src/components/AppPrimitives.tsx` (endast AppScreen route-key offset-handoff), `tests/app-screen-ux.test.mjs`, `src/features/puppy-log/InsightsScreen.tsx`, `src/features/puppy-log/insights-model.ts`, `src/features/puppy-log/LogScreen.tsx`, `src/features/puppy-log/README.md`, `src/features/home/ProductWorkspace.tsx`, `src/features/home/main-navigation.ts`, `src/data/workspace-data.ts`, `tests/insights-model.test.mjs`, relevanta `tests/workspace-data.test.mjs`/`tests/log-screen-policy.test.mjs`, `tools/visual-check/app.tsx`, `docs/features/insights.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md` och `docs/design/evidence/vision-rev02/insights/`.

R7-undantaget i AppPrimitives är begränsat till att bevara AppScreen offset per route key över content replacement, ignorera transient noll-event från utgående route och fortsätta spara användarens scroll. Inga andra globala komponenter, migrations utöver ras-snapshotten, RLS, RPC, auth, analytics, sleep-interval-data eller dependencies ändras. `ProductWorkspace.tsx`, `main-navigation.ts`, queue, rapport och MASTER-LOG berörs i sekvens, aldrig av samtidiga uppgifter.

## Verifiering och risk

Alla tre tasks är H på grund av dog-scope, katalogmigration och fullständig ägaravgränsad periodläsning. Security granskar plan/diff och särskilt `dog_id`-filter; Architect godkänner exakt plan; Critic granskar begriplighet och produktkontrakt. Slutlig QA och Reviewer sker separat per slice. Dog Expert behövs inte: inga råd, hälsopåståenden eller tolkningar av utveckling införs. Compliance behövs inte: ingen ny persondatakategori, ändamål, analys, delning eller leverantör införs. Insikter är ett ägarinitierat, beskrivande gränssnitt för samma privata dog-loggsyfte; ingen sekundär analys, profilering eller delning tillkommer. Inga nya beroenden eller remote-databasåtgärder.

Kommandon per slice: riktade Node-tester för modell-/querykontrakt, `pnpm check`, `pnpm bundle:ios`, `python tools/dev_flow.py validate` och `git diff --check`. Kör lokal migreringstest endast om isolerad lokal Supabase/Docker finns. Gör syntetisk visuell kontroll vid 375/430 px och 140 % textproxy med §14-checklistan. Remote Supabase/RLS, VoiceOver/Dynamic Type på telefon och TestFlight-build är separat evidens och får inte rapporteras PASS utan körning.

## V2 reviewhistorik (ersatt av v7)

- Plan v2 gällde bara rasväljaren. Architect APPROVE, Critic PROCEED och Security PASS plan-only. Dessa omdömen gäller inte det utökade paketet.
- Under den tidigare v2-planen skapades CSV-snapshot, MIT-licens, additiv SQL-migration och isolerad `breed-picker-model.ts`. UI-väljaren och anslutning till registrering/profil är inte byggda. Dessa befintliga filer behålls men har inte QA-granskats som del av den kombinerade planen. V2-köstatusen `blocked` och den då föreslagna v3-grinden är historik; v3 fick CHANGES från Critic och Security. Den aktuella v7-grinden är uppfylld: färska besked från Architect, Critic och Security finns innan tasken går till ready.

## Reviewhistorik för kombinerat scope

- V3 Architect: APPROVE med implementeringsvillkor för sidning, route mapping och avbrutna läsningar.
- V3 Critic: CHANGES — kräv synliga `Ej loggat`-luckor, håll Panel 8 öppen för sömnintervall, förklara FCI-täckning och testa rasens spar-/återhämtningsflöden.
- V3 Security: CHANGES — minimera loggprojektion/eventtyper, inkludera konto-/sessionsscope, undvik övertolkning av offset-läsning och ange befintligt privat loggsyfte.
- V4 Critic: PROCEED. V4 Architect review väntar fortfarande; V4 Security: CHANGES, kräv uttrycklig totalordning för offset-pagination.
- V5: Architect APPROVE; Critic CHANGES endast för en föråldrad grindformulering; Security-besked saknas.
- V6: Architect APPROVE; Critic PROCEED; Security CHANGES — count/ID-validering kan missa samtidiga ändringar med oförändrat antal.
- V7: Architect APPROVE; Critic PROCEED; Security PASS, plan-only. Concurrent same-count delete/insert och saknad snapshot isolation redovisade; katalog migrationen additiv och remote migration ej körd. Se implementationvillkoren ovan.

## Checkpoint 1 closeout — 2026-10-18

Implementation complete. Independent QA PASS, Reviewer PASS, Security PASS. Focused 6/6; pnpm check 593/593; iOS review bundle; public/review 11/11 each; exact 360 CSV/SQL row parity; corrected modal screenshots; queue and diff checks pass. Review outcome and NOT TESTABLE limits are recorded in docs/tasks/dev/rapport.md and docs/decisions/MASTER-LOG.md. No live Supabase migration or native phone verification was run. The checkpoint remains uncommitted for the requested combined package; next sequence is FLOW-PROGRESS-01 then FLOW-INSIGHTS-01.


## R6 closeout — 2026-10-18

R6 v1.2 completed after Architect geometry recheck APPROVE, independent QA v1.3 PASS and independent Reviewer v1.3 PASS. The ring uses 360 sharp tangential segments and is continuous across four states at 375/430 px. Reports are in `docs/design/evidence/vision-rev02/daily-progress/`. §14.16 remains No for full rev02 match; live Supabase/RLS, persisted mutation/readback and native device/accessibility checks are NOT TESTABLE. Continue with R7; keep all three checkpoints local for the combined commit/push.


### R7 scope amendment v7.1

Observed browser regression: Logg scrollTop 120 is overwritten by a transient 0 while Insights replaces the shared AppScreen content; returning to Logg restores its date but not its offset. The amendment adds only src/components/AppPrimitives.tsx for AppScreen route-key handoff and tests/app-screen-ux.test.mjs. Acceptance covers nonzero Logg offset, saved Insights offset, first-visit zero, transient transition zero, same-key rerenders, late events, post-navigation user scrolling, and return to the same Logg date/offset. No ProductWorkspace routing, data or persistence changes. Architect APPROVE received 2026-10-18 before editing these added paths.

## R7 closeout — 2026-10-18

FLOW-INSIGHTS-01 closed locally after Architect APPROVE v7.1, Security PASS, independent QA PASS and Reviewer PASS. Latest checks: 43/43 focused, full `pnpm check` 618/618, browser 16 cases + 6 interactions with zero failures/errors/blocked requests, queue validation and diff-check PASS. Evidence is in `docs/design/evidence/vision-rev02/insights/`. Live Supabase/RLS/readback and native device/accessibility/timezone behavior remain NOT TESTABLE; pagination is best-effort rather than snapshot isolation. The overall catalog + R6/R7 package remains uncommitted for the requested combined push. The subsequent R6 SVG ring correction is tracked separately from historical R6 v1.2 approval; Erik approved its `react-native-svg@15.15.4` dependency on 2026-10-18.


## R6 SVG ring follow-up — 2026-10-18

Erik approved `react-native-svg@15.15.4`. The ring uses the package’s SVG circles and passed independent QA v1.4: 26 public/review viewport-state cases + 5 interactions, including stale at 430 px in both modes; focused UI contract 5/5; half/full/unknown geometry and truthful accessibility semantics pass. Fresh screenshots and the exact 12 px strokes/dash lengths are documented in `docs/design/evidence/vision-rev02/daily-progress/`. Active feature, evidence and historical-plan pointers now describe v1.3 while preserving v1.2 as the prior approval record. Architect APPROVE for the synchronized amendment was recorded on 2026-10-18; independent SVG Reviewer PASS is recorded in docs/design/evidence/vision-rev02/daily-progress/REVIEW-REPORT-v1.4.md; the local checkpoint is closed. Live Supabase/RLS, native rendering, VoiceOver and device Dynamic Type remain NOT TESTABLE.

# VISION-R02-2 — korrigeringsplan v10

**Historisk godkänd basplan.** Portrait-regeln i punkt 6 och public/review-bilden i acceptanspunkt 8 har fått ett ägarbeställt visuellt tillägg i `vision-rev02-r02-2-v11.md`; v11 gäller vid fortsatt Home-implementation. V10:s datakontrakt, SQL, muteringsflöden och övriga Home-kontrakt står kvar.

Datum: 2026-10-13 · Status: **Plan approved; local implementation complete, independent QA/reviewer pending.** Architect APPROVE, Critic PROCEED, Security APPROVE for SQL delta. Review record: `vision-rev02-r02-2-v10-reviews.md`.
Uppgift: `VISION-R02-2`. Kökedjan har gått från v8 `blocked` via v10 `planned → ready → implementing`; v8 QA-grinden är bevarad och korrigerad.

## Mandat och mål

Erik har godkänt R02-1, R02-2 och R02-3 som samma arbetspaket och bett att Hemskärmen nu formas efter det uppdaterade designregelverket och `vision_rev02.jpg`. Denna plan korrigerar den avgränsade R02-2-checkpointen efter att oberoende QA underkänt v8 både funktionellt och visuellt. Separat `HOME-REV02-VISUAL-01` ersätts av denna integrerade korrigeringsplan eftersom dess filscope överlappar Hem- och dagsaktivitetsimplementationen.

**MVP-spårning:** `docs/mvp.md`, produkt-MVP → Skärm 1. Personligt Home/Today.
**Användaruppgift:** snabbt se hundens ålder och relevant hjälp, förstå dagens val och nå Logg, Träning eller Kunskap.
**Huvudhandling:** markera en egen rutin som klar eller öppna Träning från ett valt träningssteg.
**Beroenden:** `VISION-R02-1` är avslutad; `VISION-R02-3` fortsätter vänta på R02-2.

## QA-fynd som v10 måste rätta

1. SQL-guardens rasregel i migrationen avvisar giltiga träningsversioner med flera ras mål när ett av målen matchar hundens ras. Appen använder “inga mål eller minst ett matchande mål”. SQL måste följa samma regel. En version med endast icke-matchande mål avvisas fortsatt. Lägg till SQL-regressioner för alla tre utfall: inga mål, blandade mål där minst ett matchar och endast icke-matchande mål.
2. Home-vyn upprepar “Ta bort”-länkar på dagsrader och skjuter de tre färgade destinationerna utanför första vyn. Detta underkändes enligt §14 och målpanel 1. Home-vyn ska följa `docs/design-rules.md` §0–4 och §14 samt `docs/plans/HOME-REV02-visual-ux-spec.md`.

QA-evidens är sparad i `docs/design/evidence/vision-rev02/r02-2/QA-REPORT.md`. V8-handoffens gröna lokala kommandon är rapporterade resultat, inte bevis för Supabase-runtime eller full visuell acceptans.

## Datakontrakt som bevaras

- Ägaren väljer egna rutiner per lokal dag; ingen automatisk recurrence.
- Rutincompletion bekräftas först efter lyckad sparning och exakt readback.
- Träningscompletion härleds bara från sparad, versionsbunden `training_progress` för vald lokal dag.
- Guideöppning, vårdplan och olänkad logg räknas inte som färdiga dagsuppgifter.
- Antalet avser hela aktiva dagsmängden även om Hem visar högst fem rader.
- Rutinmallar och dagsval förblir separata objekt. Borttagning från en dag är skild från radering av rutinmallen.
- RLS, grants, gallring, idempotenta retries, account deletion och post-lock `clock_timestamp()`-regler från v8 bevaras. Ingen live-/produktionsdata, ny datainsamling eller ändrat ändamål.

## UI-kontrakt för integrerad Hem-korrigering

1. Hem använder en sammanhållen varm gräddvit yta och separata blå Logga-, gröna Träna- och lila Kunskap-kort. Tips-/solsymbol har gul accent; progress är ljusare grön. Följ befintlig färgtabell och tokenregel, utan ad hoc-hex i skärmfiler.
2. Ordning enligt panel 1: hälsning/ålder/porträtt, Just nu-kort, en enda “Dagens att göra”-yta med räknare och progress, sedan tre synliga destinationer. Ta bort den redundanta “Idag”-rubriken och de duplicerade Loggat/Nästa steg/Planerat-grupperna från den första Home-kompositionen.
3. Dagsrader grupperas utan individuella kort. Rutin har fyrkantig separat checkbox och sparstatus på samma rad. Separat rutintext/chevron öppnar samma hanteringssheet fokuserad på rutinens detaljer; checkboxen ändrar bara completion. Träningssteg har ingen checkbox; hela raden öppnar befintlig Träning-callback. Visa stegtitel i raden och full programtitel i fördjupning/Träning. Rader visar inte upprepade “Visa” eller “Ta bort”; borttagning från dagens urval ligger i hanteringssheeten.
4. Ett “Visa alla” och dagsrubrikens chevron öppnar samma verkliga `BottomSheet`-fördjupning. Sheet behåller alla befintliga create/edit/delete/select/remove/retry-flöden. Tomt läge leder till samma sheet. `BottomSheet`-API och `ProductWorkspace` callbacks återanvänds.
5. Rutinförändring som startar från en Hem-checkbox visar pending, failed/unknown och exakt befintlig retry vid samma rutinrad. Bocken ändras först efter bekräftad sparning/readback; optimism används inte. Mutation som startar i sheeten visar sin återkoppling och retry där. Ändra inte den befintliga mutationsnyckeln eller serversemantiken.
6. Public Home använder sanningsenlig varm `dog-mascot.png`-illustration när personligt foto saknas. Endast den syntetiska review-fixturen får en porträttbild. Lägg till `assets/images/review-puppy-portrait.png`, kopierad från nygenererade syntetiska retrieverporträttet `/workspace/generated_images/exec-7d0e0642-b5b5-4a39-9f8b-6f3628fd50f9.png` (1254×1254; genererad 2026-10-13 för detta reviewläge). Bevara originalet där. Manifestet beskriver att asseten är AI-genererad, fixture-only och aldrig användarfoto eller public-innehåll. Visa den i 120×120 med `cover` utan filter. Ingen personlig fotofunktion byggs.
7. Samma komponenter används av public Home och review-fixtur. Review-bannern ligger ovanför en separat 375×844/430×844 app-viewport; i review verifieras den totala sidan vid 375×876/430×876 och bannern redovisas som externt fixture-innehåll. Bannerhöjden får inte minska appens viewport eller skapa ett falskt fit-PASS. Färg, bildroll, densitet, kort-/radform, typografi och komposition jämförs var för sig mot originalet.
8. Nya varianter av `Card`, `DestinationTile`, `DailyActivityItem` och tokens är opt-in; befintliga props/defaults och andra skärmars standardutseende är oförändrade. Lägg regressionkontroll för den befintliga delade komponentstandarden.

## Skrivfiler — exakt v10-scope

### Befintlig R02-2 och datakälla

- `src/features/home/daily-activity-model.ts`
- `src/features/home/daily-activity-data.ts`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/DailyActivityManagerSheet.tsx` (ny)
- `src/features/home/README.md`
- `src/components/ui/DailyActivityItem.tsx`
- `src/components/ui/DestinationTile.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/ComponentGalleryScreen.tsx`
- `src/theme/tokens.ts`
- `src/data/workspace-data.ts`
- `src/data/README.md`
- `supabase/migrations/202610130001_daily_activities.sql`
- `supabase/tests/daily-activities.sql`
- `supabase/tests/account-deletion.sql`
- `supabase/daily-activities-retention-job.sql`
- `supabase/README.md`
- `tests/daily-activity-model.test.mjs`
- `tests/daily-activity-data.test.mjs`
- `tests/daily-activity-ui.test.mjs`
- `tests/training-activity-date.test.mjs`
- `tests/account-delete.test.mjs`
- `tests/home-vision.test.mjs`
- `tests/planned-health.test.mjs` (stale Home-presentation assertion only; no data or Health behavior change)
- `tests/ui-library-policy.test.mjs`
- `assets/images/review-puppy-portrait.png` (ny, fixture-only)
- `assets/images/README.md`
- `tools/visual-check/app.tsx`
- `tools/visual-check/README.md`
- `tools/visual-check/verify.py`
- `docs/design/evidence/vision-rev02/r02-2/`
- `docs/mvp.md`
- `docs/privacy/beta-information.md`
- `docs/dev/beta-data-lifecycle.md`

### Task-, gransknings- och checkpointfiler

- `docs/tasks/dev/vision-rev02-r02-2-v10.md`
- `docs/tasks/dev/vision-rev02-r02-2-v10-reviews.md`
- `docs/tasks/dev/vision-rev02.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/VISION-REV02.md`
- `docs/tasks/dev/HOME-REV02-VISUAL-01.md` (endast markera superseded och länka v10)

Ingen fil utanför denna lista ändras. Auth, tabbordning, andra skärmars kod, schemaändringar utöver rättning av rasguardens predicate, dependencies, innehållspublicering och betaaktivering är skyddade.

## Acceptans

### Funktion/data

1. Rutin- och progressreglerna i v8 kvarstår utan semantisk ändring.
2. SQL-rasguard accepterar version utan ras mål och version med minst ett mål som matchar hunden. Den avvisar version med mål men utan matchande ras. SQL-regression täcker alla tre utfall; appen och SQL ger samma eligibility-beslut.
3. Övriga v8-krav kvarstår: tvåägar-RLS/minsta grants, hund-/rutin-FK, tidszon/gallring, låsning/clock guard, stale undo och idempotenta readback. Träningskälla som senare dras tillbaka exkluderas fortfarande från Hemmets dagsmängd och count. Konto-/hundradering bevaras.
4. Migration, RLS, purge/scheduler och tvåsessions-midnattstest redovisas bara som verifierade efter faktisk körning i disponibel lokal Supabase. Utan sådan miljö blir de NOT TESTABLE och tasken får inte gå till `done`.

### Hem-design/beteende

5. Vid 375×844 och 430×844 visas hälsning/ålder/porträtt, Just nu, “Dagens att göra”, fem första dagsrader och alla tre färgade destinationskort i första vyn med minst 16 pt före fast nav. Kort ska inte kännas som ett kort per rad.
6. Vid 375×667, 140 % text, svenska långtitlar och reducerad rörelse får innehållet scrolla utan överlapp/klippning/horisontell overflow. Skärmläsare får korrekt checkbox kontra träningsrad semantics; alla handlingar minst 44×44 pt.
7. Rutintext och separat chevron öppnar rutinens detaljer i hanteringssheeten; checkboxen har ingen detaljnavigation. Visa alla/rubrikchevron/tomt läge öppnar samma sheet. Tidigare create/update/delete/select/remove/retry-flöden fungerar. Spara-fel och okänd status bevarar tidigare bekräftad completion och visar exakt retry nära handlingen som startade mutationen.
8. Public Home innehåller inte syntetiska dagsuppgifter eller review-porträtt; den visar tydlig fallback. Generated review-bannern ligger utanför och ovanför 375×844/430×844 app-viewport och påverkar inte fit-mätningen. Review-porträttets proveniens är dokumenterad och det visas bara i syntetiskt läge.
9. §14-evidens bedömer separat komposition, färger, typografi, former, bildroll och innehållstäthet med jämförbara renderbilder. DOM/geometrimått ensamt kan inte ge visuellt PASS.
10. Planerade hälsohändelser räknas inte som Home-dagsuppgifter och visas inte i Home-count; den befintliga separata Hälsa → planerade händelser-resan bevaras. Endast den inaktuella presentationstesten uppdateras.

## Verifiering

- Rätta först v8-QA-fynden. Gör bounded readability cleanup enligt `docs/dev/ui-and-code-standards.md` och kontrollera importer/API:er mot installerade definitioner.
- Kör det fokuserade testkommandot `node --experimental-strip-types --test tests/daily-activity-model.test.mjs tests/daily-activity-data.test.mjs tests/daily-activity-ui.test.mjs tests/training-activity-date.test.mjs tests/account-delete.test.mjs tests/home-vision.test.mjs tests/planned-health.test.mjs tests/ui-library-policy.test.mjs`, därefter `pnpm check`, `git diff --check`, `python tools/dev_flow.py validate` och public iOS-export enligt befintliga hookar. Lägg inga nya dependencies till.
- Bygg public + syntetisk review React Native Web och spara jämförbara 375/430 initialbilder under `docs/design/evidence/vision-rev02/r02-2/correction-v10/{public,review}/` enligt `tools/visual-check/README.md`.
- Kör exakta kontroller (installera UI-verktygen endast om `/tmp/tassla-ui-tools/node_modules/.bin/esbuild` saknas; installen ändrar inte projektets beroenden):
  - `npm install --prefix /tmp/tassla-ui-tools --no-package-lock react-native-web@0.21.2 react-dom@19.2.3 esbuild@0.25.12`
  - Public build: `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/r02-2-v10/public node tools/visual-check/build.cjs`
  - Review build: `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/r02-2-v10/review node tools/visual-check/build.cjs`
  - Serve each output in a separate run: `python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/r02-2-v10/public` (then use review output in the next run).
  - Public verification: `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-2/correction-v10/public python tools/visual-check/verify.py`
  - Review verification: `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-2/correction-v10/review python tools/visual-check/verify.py`
- Review verifier captures app-only geometry at 375×844/430×844; review screenshots include a 32 px outer banner so total screenshot viewport is 375×876/430×876. Also capture 375×667, 140 % text, reduced motion, empty/error/loading, sheet, routine-detail and retry states; store each image in the matching evidence folder.
- QA och Reviewer gör oberoende funktionell och §14-granskning. SQL-runtime och native-beteende redovisas separat; NOT TESTABLE blockerar bara de acceptancepunkter som de kräver.

## Sekvensering och granskningsgrind

1. Spara v8 QA-resultatet. Registrera `qa → blocked`; gör ingen sourceändring före förnyad review.
2. Architect godkänner exakt v10:s ändrade SQL predicate, UI-kontrakt, API-återanvändning, opt-in-varianter, banner-/viewport-kontroll, filscope och checks. Critic granskar Home-komposition, rutinradsnavigation, begriplighet och scope. Security granskar SQL-guard-deltat mot tidigare v8 Security APPROVE. Alla tre exakta resultat sparas i checkpointen.
3. Före `blocked → planned` uppdaterar koordinatorn queue-postens planversion, exakta skrivfiler, acceptans och körbara checks till v10; v8-felhistoriken bevaras.
4. Vid godkännande återför koordinatorn tasken `blocked → planned → ready → implementing` enligt dev-flow. R02-3 förblir `planned` och beroende av R02-2.
5. Ingen ändring i R02-3:s filer. Tasken går till `qa` efter kod/checkpoint; QA och Reviewer måste passera innan `done`. Databas-runtime som inte går att köra här rapporteras NOT TESTABLE och lämnas öppen.

## Implementationscheckpoint — 2026-10-13

V10-koden och syntetiska public/review-renderingar finns i skrivfilerna ovan. Hemkompositionen använder varm bakgrund, tipskort, en samlad dagslista, blå/grön/lila destinationskort och en gemensam hanteringssheet. Rutinbock, träningsrad och mutationernas retry följer separata befintliga callbacks. SQL-rasguardens blandade mållista har korrigerats; testfilen täcker utan mål, blandade mål med minst en träff och mål utan träff. Ingen live-databas, produktionsdata eller R02-3-kod har ändrats.

Lokal reviewrendering har klarat `tools/visual-check/verify.py` vid 375/430 px med appens 844 px viewport, manager sheet och rutin-detalj-/pending-/failed-/unknown-/readback-tillstånd. Oberoende QA hittade därefter ett negativt SQL-fixturefall som inte isolerade rasguard, Home-kategoriplattor i dagsrader och en lintfråga i sheeten. Första två är rättade; lintkorrigering ersätter synkron state-reset med state som härleds från sheetens öppna/fokuskontext. Kritiker och Architect godkände även den avgränsade tilläggsfilen `tests/planned-health.test.mjs`, eftersom dess äldre assertion förväntade den nu borttagna “Planerat idag”-raden. Testen ska fortsatt säkra den separata Hälsa-resan; inga Health- eller datakällor ändras. Resultat för slutlig fokuskörning, `pnpm check`, iOS-export, QA och review kompletteras efter genomförande. Supabase SQL-runtime/RLS/purge/scheduler och nativebeteende kvarstår `NOT TESTABLE` tills de körts i respektive miljö.

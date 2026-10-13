# VISION-R02-2 — korrigeringsplan v9


Datum: 2026-10-13 · Status: väntar på Architect, Critic och Security.
Uppgift: `VISION-R02-2`, nuvarande köstatus `blocked`; v8 QA-grind får inte kringgås.

## Mandat och mål

Erik har godkänt R02-1, R02-2 och R02-3 som samma arbetspaket och bett att Hemskärmen nu formas efter det uppdaterade designregelverket och `vision_rev02.jpg`. Denna plan korrigerar den avgränsade R02-2-checkpointen efter att oberoende QA underkänt v8 både funktionellt och visuellt. Separat `HOME-REV02-VISUAL-01` ersätts av denna integrerade korrigeringsplan eftersom dess filscope överlappar Hem- och dagsaktivitetsimplementationen.

**MVP-spårning:** `docs/mvp.md`, produkt-MVP → Skärm 1. Personligt Home/Today.
**Användaruppgift:** snabbt se hundens ålder och relevant hjälp, förstå dagens val och nå Logg, Träning eller Kunskap.
**Huvudhandling:** markera en egen rutin som klar eller öppna Träning från ett valt träningssteg.
**Beroenden:** `VISION-R02-1` är avslutad; `VISION-R02-3` fortsätter vänta på R02-2.

## QA-fynd som v9 måste rätta

1. SQL-guardens rasregel i migrationen avvisar giltiga träningsversioner med flera ras mål när ett av målen matchar hundens ras. Appen använder “inga mål eller minst ett matchande mål”. SQL måste följa samma regel. En version med endast icke-matchande mål avvisas fortsatt. Lägg till SQL-regressioner för båda fallen.
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
3. Dagsrader grupperas utan individuella kort. Rutin har fyrkantig separat checkbox och sparstatus på samma rad. Träningssteg har ingen checkbox; raden öppnar befintlig Träning-callback. Visa stegkort titel i raden och full programtitel i fördjupning/Träning. Rader visar inte upprepade “Visa” eller “Ta bort”; borttagning från dagens urval ligger i hanteringssheeten.
4. Ett “Visa alla” och dagsrubrikens chevron öppnar samma verkliga `BottomSheet`-fördjupning. Sheet behåller alla befintliga create/edit/delete/select/remove/retry-flöden. Tomt läge leder till samma sheet. `BottomSheet`-API och `ProductWorkspace` callbacks återanvänds.
5. Rutinförändring som startar från en Hem-checkbox visar pending, failed/unknown och exakt befintlig retry vid samma rutinrad. Bocken ändras först efter bekräftad sparning/readback; optimism används inte. Mutation som startar i sheeten visar sin återkoppling och retry där. Ändra inte den befintliga mutationsnyckeln eller serversemantiken.
6. Public Home använder sanningsenlig varm `dog-mascot.png`-illustration när personligt foto saknas. Endast den syntetiska review-fixturen får en porträttbild. Skapa `assets/images/review-puppy-portrait.png` genom att beskära den glada valpen från det användarlevererade referensarket `vision_rev02.jpg` (källcrop cirka x=194–302, y=32–137). Klipp bort statusrad/telefonram och verifiera motivet i 120×120 innan cropen godkänns. Asseten märks i manifest och fixture som en syntetisk, referenshärledd granskningsbild och får aldrig visas i public. Ingen personlig fotofunktion byggs.
7. Samma komponenter används av public Home och review-fixtur. Review-banner ligger fast utanför scrollcontainern. Färg, bildroll, densitet, kort-/radform, typografi och komposition jämförs var för sig mot originalet.

## Skrivfiler — exakt v9-scope

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
- `assets/images/review-puppy-portrait.png` (ny, fixture-only)
- `assets/images/README.md`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `docs/design/evidence/vision-rev02/r02-2/`
- `docs/mvp.md`
- `docs/privacy/beta-information.md`
- `docs/dev/beta-data-lifecycle.md`

### Task-, gransknings- och checkpointfiler

- `docs/tasks/dev/vision-rev02-r02-2-v9.md`
- `docs/tasks/dev/vision-rev02.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/VISION-REV02.md`
- `docs/tasks/dev/HOME-REV02-VISUAL-01.md` (endast markera superseded och länka v9)

Ingen fil utanför denna lista ändras. Auth, tabbordning, andra skärmars kod, schemaändringar utöver rättning av rasguardens predicate, dependencies, innehållspublicering och betaaktivering är skyddade.

## Acceptans

### Funktion/data

1. Rutin- och progressreglerna i v8 kvarstår utan semantisk ändring.
2. SQL-rasguard accepterar version utan ras mål och version med minst ett mål som matchar hunden. Den avvisar version med mål men utan matchande ras. SQL-regression täcker båda; appen och SQL ger samma eligibility-beslut.
3. Övriga v8-krav kvarstår: tvåägar-RLS/minsta grants, hund-/rutin-FK, tidszon/gallring, låsning/clock guard, stale undo, idempotenta readback, konto-/hundradering och borttagen source-exclusion från synligt count.
4. Migration, RLS, purge/scheduler och tvåsessions-midnattstest redovisas bara som verifierade efter faktisk körning i disponibel lokal Supabase. Utan sådan miljö blir de NOT TESTABLE och tasken får inte gå till `done`.

### Hem-design/beteende

5. Vid 375×844 och 430×844 visas hälsning/ålder/porträtt, Just nu, “Dagens att göra”, fem första dagsrader och alla tre färgade destinationskort i första vyn med minst 16 pt före fast nav. Kort ska inte kännas som ett kort per rad.
6. Vid 375×667, 140 % text, svenska långtitlar och reducerad rörelse får innehållet scrolla utan överlapp/klippning/horisontell overflow. Skärmläsare får korrekt checkbox kontra träningsrad semantics; alla handlingar minst 44×44 pt.
7. Visa alla/rubrikchevron/tomt läge öppnar samma hanteringssheet. Tidigare create/update/delete/select/remove/retry-flöden fungerar. Spara-fel och okänd status bevarar tidigare bekräftad completion och visar exakt retry nära handlingen som startade mutationen.
8. Public Home innehåller inte syntetiska dagsuppgifter eller review-porträtt; den visar tydlig fallback. Review-bannern är permanent i fixtur; porträttet är tydligt syntetiskt och härlett från användarens referensark.
9. §14-evidens bedömer separat komposition, färger, typografi, former, bildroll och innehållstäthet med jämförbara renderbilder. DOM/geometrimått ensamt kan inte ge visuellt PASS.

## Verifiering

- Rätta först v8-QA-fynden. Gör bounded readability cleanup enligt `docs/dev/ui-and-code-standards.md` och kontrollera importer/API:er mot installerade definitioner.
- Kör fokuserade R02/Home-tester, `pnpm check`, `git diff --check`, `python tools/dev_flow.py validate` och public iOS-export enligt befintliga hookar. Lägg inga nya dependencies till.
- Bygg public + syntetisk review React Native Web och spara jämförbara 375/430 initialbilder samt 375×667, 140 % text, reduced motion, empty/error/loading, sheet och retry-scenarier.
- QA och Reviewer gör oberoende funktionell och §14-granskning. SQL-runtime och native-beteende redovisas separat; NOT TESTABLE blockerar bara de acceptancepunkter som de kräver.

## Sekvensering och granskningsgrind

1. Spara v8 QA-resultatet. Registrera `qa → blocked`; gör ingen sourceändring före förnyad review.
2. Architect godkänner exakt v9:s ändrade SQL predicate, UI-kontrakt, API-återanvändning, filscope och checks. Critic granskar Home-komposition, begriplighet och scope. Security granskar endast SQL-guard delta mot tidigare v8 Security APPROVE. Alla tre exakta resultat sparas i checkpointen.
3. Vid godkännande återför koordinatorn tasken `blocked → planned → ready → implementing` enligt dev-flow. R02-3 förblir `planned` och beroende av R02-2.
4. Ingen ändring i R02-3:s filer. Tasken går till `qa` efter kod/checkpoint; QA och Reviewer måste passera innan `done`. Databas-runtime som inte går att köra här rapporteras NOT TESTABLE och lämnas öppen.

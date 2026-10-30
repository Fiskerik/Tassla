# UI-MVP-BUILD-FEEDBACK-01 — läsbara övningar och tydligare kontroll-/källytor

Status: `done` · Plan v2 · Bas: `601f17d` på `fix/mvp-build-feedback`. Skrivägare: huvudsessionen.

Mandat: Eriks sju uttryckliga återkopplingspunkter och iPhone-bilder 2026-10-29. Senaste instruktionen ersätter äldre val om numeriska källor och åldersbåge ovanpå fotografiet. Neutralt artikel-/träningsinnehåll, kalenderålder skild från färdighet, versions-/hundscope och alla bekräftelse-/unknown-skydd bevaras. Ingen serverändring, radering, migration, ny publicering, dependency eller extern distribution ingår. Kontoraderingsfelet följs separat; endast knappens layout ändras här.

Risk M: presentationsform för befintliga träningsinstruktioner samt delad källänk-/modallayout ändras. API:er och sparad progression ändras inte. UI Critic BRIEF/REVIEW, Architect-planreview, read-only innehållsråd, oberoende QA och Reviewer används.

## Avsedd ändring och synlig acceptans

1. Dölj vertikala indikatorer i delade appmodalers ScrollViews; naturlig scroll, swipe-dismiss och nåbara handlingar bevaras.
2. Kända befintliga träningssteg får en kort, neutral målbeskrivning och numrerade originalinstruktioner. Presentationen binds till titel och exakt normaliserad instruktion; okänd/ändrad version behåller originaltext utan ett påhittat mål. Återgivningen bevarar alla ord och säkerhetsvillkor. Inkallning behåller befintliga rubriker, numrerade punkter, lättare/svårare och trygghetsråd; Så gör ni visas som Steg för steg. Ingen automatisk färdighetsbedömning tillkommer. Samma läsning används i modal/fokuserad/historisk övning. Nya innehållsversioner ska ha uttryckligt mål och steglista i innehållsregeln.
3. Hundbild i träningsmodal och resebanner får avsiktlig fokalbeskärning via befintlig KnowledgeImage/knowledgeImageLayout så hela ansiktet syns i det låga formatet.
4. Kontoraderingens befintliga knapp flyttas till rubrikradens högra kant. Alla disabled-/bekräftelse-/unknown-guards är oförändrade.
5. Utveckling visar foto och åldersbåge i separata ytor. Grön förfluten ålder och läsbar neutral bana visas mot jämn kortyta; kalender-/datumregler och hjälpmedelsvärden bevaras.
6. Delad kompakt källänkvy visar registrerad sidtitel/utgivare i horisontellt rullbara länkar, inte enbart siffror. Säkra okända URL:er får värdnamn som ärlig fallback, osäkra länkar förblir icke klickbara. Återanvänd säker URL-validering och skydd för huvudflikssvep. Ingen ny nätinläsning av metadata. Artikel-, FAQ-, checklist- och programkällor använder vyn. Ta bort rutinmässig öppnad-status; misslyckad länk visar fortsatt fel.
7. Hem får statisk liten etikett Ungefärlig fas och en kompakt klickbar valp/unghund/vuxen-länk med minst 44 pt träffyta. Ingen ändring av ålders-/fasberäkningen.

## Jämförelse och verifiering

- Befintliga panel 1/2/6/7-kontrakt samt ägarens nya skärmbilder styr motsvarande ytor. Bågen flyttas uttryckligen på ägarens beställning; källor får sidtitlar trots äldre sifferregel.
- Baselinebilder: development-panel-composition-01/public/development-375.png och training-exercise-modal-ux-01/public/active-exercise-modal-375x844.png. Skapa aktuella före-/efterbilder och composite i taskens egen evidensmapp.
- RN Web riktad verifiering vid 375/430×844, 375×667 och 140 % textproxy: mål/lista läsbara och scrollbarhet bevarad, långa instruktioner/säkerhet nåbara, ansiktet inom bild, båge utanför foto, valplänk liten men 44 pt mål, soptunna på rubrikrad, källtitel/url och länkfel utan successmeddelande. Behåll programloggning/bekräftelse/nästa-steg och rätt retur.
- Beteendetester skyddar exakt instruktionstext/säkerhetsparitet, okänd version och strukturerad inkallning. Relevanta befintliga tester uppdateras till nytt synligt kontrakt.
- Full pnpm check, diff/path-/kövalidering och separata Critic/QA/Reviewer-verdicts. Native iPhone/VoiceOver/Dynamic Type och live backend kan inte verifieras i RN Web.

## Skrivvägar

- `src/components/ui/BottomSheet.tsx`
- `src/components/ui/Dialog.tsx`
- `src/components/AppPrimitives.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/DevelopmentScreen.tsx`
- `src/theme/tokens.ts`
- `src/features/account/AccountSettingsScreen.tsx`
- `src/features/account/README.md`
- `src/features/knowledge/ContentSources.tsx`
- `src/features/knowledge/source-links.ts`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/PuppyChecklistScreen.tsx`
- `src/features/knowledge/FAQScreen.tsx`
- `src/features/knowledge/README.md`
- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/training/training-step-presentation.ts`
- `src/features/training/README.md`
- `src/features/home/README.md`
- `tests/training-step-presentation.test.mjs`
- `tests/content-delivery.test.mjs`
- `tests/checklist-ui.test.mjs`
- `tests/knowledge-faq-content.test.mjs`
- `tests/training-progression-ui.test.mjs`
- `tests/training-screen-policy.test.mjs`
- `tests/development-screen-model.test.mjs`
- `tests/home-vision.test.mjs`
- `tests/knowledge-training-empty-feedback.test.mjs`
- `tests/ui-modal-centering.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-mvp-build-feedback.py`
- `docs/design/evidence/ui-mvp-build-feedback-01`
- `docs/design-rules.md`
- `docs/tasks/dev/UI-MVP-BUILD-FEEDBACK-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`
- `docs/decisions/MASTER-LOG.md`

## Checkpoint

Architect APPROVE v1: befintliga API:er passar, inget nytt arkitekturlager behövs. UI Critic BRIEF öppnade båda jämförelserna och aktuell övningsbild: prioritera tydligt mål/steglista, båge på separat jämn yta, bevarad scroll utan indikator, helt ansikte, kompakta titellänkar, soptunna till höger och liten gemen faslänk. Samtliga sju konkreta acceptanser finns ovan.

Architect förtydligade: normalisera bara whitespace i instruktionens exact-match, bevara befintlig strukturerad parser, låt säkra okända källor få värdnamn i stället för att filtreras bort, behåll öppningsfel och fulla raderingsguards. Det ligger inom v1:s befintliga acceptans. Innehållsråd från read-only specialist: mål är övningens avsikt, inte bevisad förmåga; bevara originalmeningar och alla säkerhetsvillkor. Konfigurerad dog_expert/architect gpt-5.6-sol finns inte i denna runtime; gpt-6.1-sol medium används som närmast tillgängliga efterföljare. Övriga roller använder sina tillgängliga konfigurerade modeller.

Plan v2 begränsar ändringen till två ytterligare befintliga kontrakttester: full check visade att de kräver äldre sifferlänkar och exakt ScrollView-propordning. Acceptans, produktkod och risk är oförändrade. Architect APPROVE v2: uppdatera källkontraktet och gör TimePicker-testet propordningsoberoende, behåll scrollbarhets-/säkerhetskontroller. Första full check 99/101 är misslyckad checkpoint; ny körning krävs.

### Implementations- och rendercheckpoint 2026-10-29

Root ensam skrivägare; samtliga faktiska ändrade paths matchar v2. Avgränsad cleanup tog bort ersatta källstilar, oanvänd import och separat bannercropstate. Inga sparhandlers, authguards, databasfält eller råd har tagits bort. Read-only innehållsråd PASS efter två preciseringar: bekvämt avstånd vid störning och namngiven tidigare övning för återgång till steg 1. AI-råd ersätter inte veterinärsignoff.

Verifierat: `CI=1 pnpm check` PASS (101/101 testfiler), `EXPO_NO_TELEMETRY=1 EXPO_OFFLINE=1 EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false TASSLA_BUILD_CHANNEL=public CI=1 pnpm bundle:ios` PASS; `python tools/visual-check/verify-mvp-build-feedback.py` PASS. Det första exportförsöket hade fel kanalvariabel och det andra stoppades av Expo-telemetrikatalogens sandbox; rättade miljöargument gav lyckad export utan produktändring. `git diff --check` och deklarerad path-audit PASS.

RN Web: React19.2.3/RNWeb0.21.2 via tempdependencies utanför repot; Chromium, 375/430×844, 375×667, 140 % CSS-textproxy. Stabilt innehåll fångas500ms efter handling. Första bilden fångades mitt i animation och ersattes, inga visuella slutsatser från den. `final/results.json` och `final/panel2-after.png`, `panel6-after.png`, konto/Hem/käll-/modal-/resebannerbilder sparar beviset. Source-fixture är syntetisk och använder befintlig text plus registrerade/okända/osäkra länkar för att verifiera återgivning. Ingen livekälla, verklig progression eller radering anropades.

UI Critic REVIEW: inga kvarvarande visuella blockerare för sju avgränsade ändringar. Öppnade stabila kompositer, 375/430/667/140, scrollade kontroller, titellänkar och båda resebannerbilderna. Fullt ansikte, tydligt mål/lista/säkerhet, separat båge, liten valp-länk och högerställd soptunna. Hela panel2/6 markeras inte färdiga av detta stödskärmsbevis. Native iPhone, VoiceOver, riktig Dynamic Type, livebackend och signerad release är NOT TESTABLE här. Oberoende QA PASS för denna lokala avgränsning: egen pnpmcheck101/101; öppnade panel2/panel6, Hem140, källvy, konto och resebanner. Exakta API:er/verifierade versioner och pathaudit utan scope creep. Native/live och helpaneler förblir NOT TESTABLE; Frozen Reviewer PASS utan fynd: full diff, imports/API, skydd, actualscreens och loggar kontrollerade. Lokal avgränsad uppgift färdig; native/live verifieras separat.

Nästa steg: hållbar commit av denna slutgranskade UI-checkpoint, därefter separat avgränsad endpointkoppling för swift-api/bright-task enligt Eriks korrigerade URL-besked. Ingen automatisk reset/retry av tidigare okänd radering.

# Lokal UI-verifiering

Den här isolerade provytan renderar produktionskomponenterna via React Native Web med syntetiska uppgifter. Den ingår inte i appens routes eller Codemagic-bundle. `app.tsx` håller testdata i minnet. `native.jsx` ersätter PDF/delning, typsnittsladdning och safe-area med testimplementationer. Ionicons använder projektets riktiga font och glyfer. Inga konton eller nätdata används. I R02-2 v10 är review-bannern ett separat element ovanför den 844 pt höga app-viewporten; total sidvy är därför 876 pt. Bannerhöjden räknas inte som apphöjd.

Buildverktyget föredrar React Native Webs `.web`-moduler före native entrypoints, i linje med Metro, så plattformsspecifika paket som `react-native-svg` kan renderas i samma harness. Installera själva renderverktygen separat:

```sh
npm install --prefix /tmp/tassla-ui-tools --no-package-lock react-native-web@0.21.2 react-dom@19.2.3 esbuild@0.25.12
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/site
```

I en annan terminal, med Python Playwright och `/usr/bin/chromium` installerade:

```sh
python tools/visual-check/verify.py
```

QA-11-resultat och skärmbilder sparas som standard i `docs/design/QA-11/evidence/`. `TASSLA_UI_EVIDENCE` kan styra resultatkatalogen. Home-verifiering avgränsas med `TASSLA_UI_SCOPE=home` så att den inte kör äldre Kunskapsflödesassertioner. Checklistan i designregler §14 och oberoende renderade skärmdumpar jämförda med `vision_rev02.jpg` är obligatoriska QA-grindar; saknad evidens är inte ett godkännande.

## VISION-R02-2 v11 Home

Bygg public och syntetisk review separat; spara bilder/resultat i `docs/design/evidence/vision-rev02/r02-2/correction-v11/{public,review}/`. App-only fit mäts vid 375×844 och 430×844. Reviewens totala skärmbild blir 375×876 respektive 430×876 på grund av den 32 pt banner som ligger ovanför appen och visar `AI-GENERERAD STANDARDBILD`. Båda lägena använder samma runda AI-genererade generiska portrait asset och visar `Standardbild` med solid varm bakning; verifieraren mäter etikett- och veckonummerkontrast, läsbarhet vid standardskrift och 140 % text, porträtt-/remsöverlapp, z-ordning och exakt markörfade.

Publicläge:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/r02-2-v11/public node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/r02-2-v11/public
TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-2/correction-v11/public python tools/visual-check/verify.py
```

Reviewläge:

```sh
TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/r02-2-v11/review node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/r02-2-v11/review
TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-2/correction-v11/review python tools/visual-check/verify.py
```

Home-harnessen täcker varm Home-komposition, porträttets public/review-roll, fem dagsrader och tre destinationskort, rutinhantering, träningsradsnavigation, pending/failed/unknown/readback samt loading/empty/error, 375/430 px, 375×667, 140 % text, reducerad rörelse och navigation. `homeScenario` väljer syntetiska tillstånd; `TASSLA_UI_REVIEW` avgör om reviewfixture byggs in. Verifieringen av initialfit sker före scroll och kontrollerar appens egna viewportgränser. Detta är en React Native Web-rendering med syntetiska data, inte native Dynamic Type/VoiceOver eller databas/RLS-verifiering.

## 2026-10-21 — Hem / panel 1 checkpoint

`vision-r02-home-panels-app.tsx` renderar produktions-`HomeScreen` och `DailyChecklistScreen` i en fristående RN Web-yta. Publicläget använder tom dagsdata och visar därför det riktiga tomläget; syntetiska aktivitetsrader finns bara i reviewläget. Reviewmärkningen ligger utanför appens 844 pt viewport. Verifieraren sparar 375/430, kort 375×667, 140 %-text samt loading/empty/error/unknown/partial-state och kontrollerar destinationsmarginal, pil-only 44×44-knappen, Checklistor-routen, vanlig rutintryckning till fokuserad manager, managerpennan och verkligt långt pointer-tryck till editläge. Den kontrollerar att långtryck inte öppnar vanlig tap-vy eller ändrar checkboxen, att den synliga hjälpen har exakt instruktion och att samma instruktion skickas i komponentens native `accessibilityHint`. RN Web exponerar inte den native-egenskapen i DOM-trädet; därför verifieras hint-prop-ledet direkt i källan/testerna. Separat verifieras pending och syntetisk checkboxbekräftelse; inget av detta provar backend eller RLS.

Installera renderverktygen utanför projektets dependencies enligt kommandot ovan. Bygg och servera public-läget:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_ENTRY=tools/visual-check/vision-r02-home-panels-app.tsx TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/home/public node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/home/public
TASSLA_UI_REVIEW=false TASSLA_UI_BASE_URL=http://127.0.0.1:4173 TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/home/public python tools/visual-check/verify-vision-r02-home-panels.py
```

Bygg review i en separat katalog och kör en separat server för samma verifierare med `TASSLA_UI_REVIEW=true` och evidencekatalogen `.../home/review`. Reviewbilder är syntetisk UI-evidens. De verifierar inte native Dynamic Type/VoiceOver, live ägardata, Supabase/RLS eller betaacceptans.

### FLOW-INSIGHTS-01 — panel 8 och ingång från Hundprofil

Samma harness kan öppna den faktiska `EditDogProfileScreen` och produktions-`LogScreen`/`InsightsScreen`. Public bygger tomma loggar; review bygger tydligt syntetiska antal och gles historik. URL-parametrarna `screen=profile`, `screen=insights&origin=profile`, `insightsState=loading|error|empty|ready` och `insightsPeriod=week|month|since_first_log` väljer vyn. Verifieraren provar profilens utkastsspärr, den gemensamma periodvyn, explicit retur till profilen, Idag/Översikt-retention, loading/error/empty, månadsglapp, senaste månaden, kort viewport och 140 % textproxy. Detta är RN Web- och syntetisk evidens. Den bekräftar inte live-RPC/RLS, migration i målmiljö, native VoiceOver/Dynamic Type eller sömnintervall.

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_ENTRY=tools/visual-check/vision-r02-home-panels-app.tsx TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/panel7-insights/public node tools/visual-check/build.cjs
python -m http.server 5203 --bind 127.0.0.1 --directory /tmp/tassla-preview/panel7-insights/public
TASSLA_UI_PANEL=insights TASSLA_UI_REVIEW=false TASSLA_UI_BASE_URL=http://127.0.0.1:5203 TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/insights/public python tools/visual-check/verify-vision-r02-home-panels.py
```

Bygg en andra separat bundle med `TASSLA_UI_REVIEW=true`, servera på port 5204 och kör verifieraren med samma miljöflagga samt `.../insights/review` som evidence-katalog. Inspektera sparade vyer och registrera §14 i `insights/VERIFICATION.md`.

### FLOW-PANELS-6-7 — bildvariation i aktiva Kunskap- och Träning-vyer

Samma produktionsskärmar kan öppnas med `?screen=knowledge&imageFixture=knowledge` respektive `?screen=training&imageFixture=training`. Publicläge visar det ärliga tomläget; review innehåller tre tydligt märkta guidebilder och en syntetisk fortsättningsövning. Verifieraren mäter ID/version-bundna motiv, 200/132 pt Knowledge-bilder, Training-kortets 88×88 pt-bild, faktisk Home-navigering till rätt guide/steg, 375/430 px, 375×667 och 140 % CSS-textproxy. Hemmets aktiva `Just nu`-kort är textbaserat; den fristående gamla `HomeCarousel` är inte monterad och används inte som visuell evidens.

Bygg public/review-var för sig med harness-kommandona ovan. Kör separat verifiering mot respektive server:

```sh
TASSLA_UI_PANEL=image-diversity TASSLA_UI_REVIEW=false TASSLA_UI_BASE_URL=http://127.0.0.1:5203 TASSLA_UI_EVIDENCE=docs/design/evidence/vision-r02/2026-10-21-panels-6-7-image-diversity/public python tools/visual-check/verify-vision-r02-home-panels.py
TASSLA_UI_PANEL=image-diversity TASSLA_UI_REVIEW=true TASSLA_UI_BASE_URL=http://127.0.0.1:5204 TASSLA_UI_EVIDENCE=docs/design/evidence/vision-r02/2026-10-21-panels-6-7-image-diversity/review python tools/visual-check/verify-vision-r02-home-panels.py
```

RN Web och syntetiska callbacks verifierar inte native VoiceOver/Dynamic Type, live Supabase/RLS, migrering i målmiljön eller full panel-§14-acceptans.

KNOW-02 har en separat entry/output och skriver till `docs/design/KNOW-02/evidence/`:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx TASSLA_UI_OUTPUT=/tmp/tassla-preview/site/know02 TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs
python tools/visual-check/verify-know02.py
```

Browserklockan låses till 2026-10-11 kl. 15 UTC för reproducerbara loggtider. `?screen=log&mutation=failed` respektive `unsure` provar återhämtning utan backend. `?state=empty|loading|error` provar lästillstånd.

React Native Web-harnessen registrerar RN `Alert`-alternativen och kan anropa en vald callback via `window.__tasslaAlertActions`; detta verifierar menyvalens kopplade åtgärder, inte native Alert-visning, tangentbords-/VoiceOver-beteende, native PDF eller databas/RLS. Harnessen verifierar inte animationers native bildfrekvens. 140 % text är ett layoutprov, inte fullständig Dynamic Type-verifiering.

## Historical Training continuation checkpoint — 2026-10-15 (superseded)

The production `PublishedTrainingScreen` historically rendered with `?screen=training&trainingScenario=default|unstarted|half|complete|several|long-title|unknown-age`. Use `state=empty` and `state=error` for its read states. `TASSLA_UI_REVIEW=false|true` builds public and review fixtures separately. The content is synthetic; no account or backend data is read. Archived captures and the prior §14 assessment are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/continue-card/`. Current Panel 6 rendering is documented below under FLOW-TRAINING-01.

For `UX-TRAINING-UNMARK-01`, use `?screen=training&trainingScenario=later-completed` to render two completed steps with one unfinished step between them. Open `Mina`, choose `Utforska i egen takt`, then select `Avmarkera`. `trainingUnmark=pending` keeps the previous progress visible while the operation is pending and then confirms; `trainingUnmark=failed|unknown` keeps progress and shows one retry state without a success message. The confirmed fixture removes only the chosen step, leaving `Vila nära` checked. These fixtures exercise the production screen with synthetic callbacks; they do not validate Supabase/RLS or native accessibility. Evidence and the §14 delta are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/training-unmark/`.

## UX-FIX 2026-10-15 — Knowledge checklist cache

The Knowledge review fixture exposes `window.__know02UnmountRoute`, `__know02RemountRoute` and `__know02ChangeScope` for a manual warm-return/scope check. Set `window.__know02ReadDelayMs` before opening a previously unseen phase to inspect its honest loading state. `?state=detail-newer` returns a newer synthetic progress row from the template-detail read than from its overview read, exposing summary/detail reconciliation. The fixture counts reads in `__know02ChecklistReads`; expected behavior is three overview reads on cold entry, three more on first phase open, none when reopening that phase or remounting within the same scope, and three fresh reads after changing the synthetic account/dog scope. Captures and §14 delta notes are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/knowledge-cache/`. The fixture uses synthetic review content and does not verify live Supabase, native accessibility, or persistent cache behavior.

## FLOW-HOME-CHECKLIST-01

`TASSLA_UI_CHROMIUM` can point to Playwright Chromium on Windows or another host without `/usr/bin/chromium`; when unset, the verifier uses the documented Linux path. Run the public and review bundles separately with `TASSLA_UI_SCOPE=home`, `TASSLA_UI_BASE_URL` set to the served bundle, and `TASSLA_UI_EVIDENCE` set to the matching evidence folder. The checklist cases cover 0/1/5/7 rows, 375/430 px, 375×667, 140% text, loading/error, return from a lower training row with confirmed count and preserved scroll position, leave/reopen at the top, and dog-scope invalidation/reopen at the top (`checklistScopeReset=true`). All data is synthetic; browser rendering does not verify live RLS, native VoiceOver/Dynamic Type, or a physical device.

### A02 — rutinpunkternas valbara ikoner

`verify-checklist-icons.py` använder den aktuella Checklistan och syntetiska rutinmallar. Den provar långtryck till rätt rutinpunkt, alla 20 tillgängligt namngivna 44×44-ikoner vid 375×844, 430×844 och 375×667, sparat val/readback, skapande av en rutin med vald ikon, oförändrad status på dagens frysta checklistrad samt båda ikonknapparnas separata bekräftelsetexter och bekräftade/avbrutna handlingar. Kör public och review var för sig:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/a02/public node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/a02/public
TASSLA_UI_BASE_URL=http://127.0.0.1:4173 TASSLA_UI_EVIDENCE=docs/design/evidence/flow-home-checklist-filters-2026-10-20/a02/public python tools/visual-check/verify-checklist-icons.py
```

Bygg review separat i `/tmp/tassla-preview/a02/review`, servera den på en annan port och kör samma verifierare med `TASSLA_UI_REVIEW=true` och evidenskatalogen `.../a02/review`. Bilderna visar syntetiskt React Native Web; de bekräftar inte native Alert/VoiceOver/gestures, Supabase/RLS, migrationsutrullning eller TestFlight. Den framåtriktade SQL-migrationen körs inte av denna kontroll.

### A04 — rutinändringar som misslyckas, är okända eller har konflikt

`verify-routine-save-recovery.py` öppnar Checklistor och redigerar en syntetisk rutin med både ändrad text och ikon. `routineMutation=failed` kontrollerar att utkastet behålls och att ägaren kan trycka Spara igen; `unknown` kontrollerar låst utkast och exakt retry; `conflict` kontrollerar read-only-utkast, uttrycklig ersättning med senaste revisionen och att en ny redigering efter ersättningen kan sparas. Public och review körs separat vid 375 och 430 px. Resultat och skärmbilder skrivs till `docs/design/evidence/flow-home-checklist-filters-2026-10-20/a04/{public,review}/`.

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/a04/public node tools/visual-check/build.cjs
python -m http.server 4193 --bind 127.0.0.1 --directory /tmp/tassla-preview/a04/public
TASSLA_UI_BASE_URL=http://127.0.0.1:4193 TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/flow-home-checklist-filters-2026-10-20/a04/public python tools/visual-check/verify-routine-save-recovery.py
```

Bygg review i `/tmp/tassla-preview/a04/review`, servera på port 4194 och kör verifieraren med `TASSLA_UI_REVIEW=true`, motsvarande bas-URL och `.../a04/review` som evidenskatalog. Båda lägena använder syntetiska callbacks; de bekräftar inte live Supabase/RLS, applicerad migration, äldre klienters runtime, native VoiceOver/Dynamic Type eller TestFlight.

### A03 — Checklistans fyra filter och källresor

`verify-checklist-filters.py` renderar produktionsskärmarna från `vision-r02-home-panels-app.tsx`. Public visar tomläget med lokal syntetisk data; review injicerar tydligt märkt syntetiskt innehåll för filter, kommande rutin/hälsoplan och historiskt träningssteg. Verifieraren täcker fyra filter i 375/430 pt-bredder, 44×44-mål, horisontell overflow, Kommande loading/empty/partial/error, historisk och planerad read-only-semantik samt öppning/retur från exakt källa. Review provar även 375×667 med CSS-skalad 140 %-text; detta är ett layoutproxyprov, inte native Dynamic Type. Kör public och review som separata byggen:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_ENTRY=tools/visual-check/vision-r02-home-panels-app.tsx TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/a03/public node tools/visual-check/build.cjs
python -m http.server 45674 --bind 127.0.0.1 --directory /tmp/tassla-preview/a03/public
TASSLA_UI_REVIEW=false TASSLA_UI_BASE_URL=http://127.0.0.1:45674 TASSLA_UI_EVIDENCE=docs/design/evidence/flow-home-checklist-filters-2026-10-20/a03/public python tools/visual-check/verify-checklist-filters.py
```

```sh
TASSLA_UI_REVIEW=true TASSLA_UI_ENTRY=tools/visual-check/vision-r02-home-panels-app.tsx TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/a03/review node tools/visual-check/build.cjs
python -m http.server 45673 --bind 127.0.0.1 --directory /tmp/tassla-preview/a03/review
TASSLA_UI_REVIEW=true TASSLA_UI_BASE_URL=http://127.0.0.1:45673 TASSLA_UI_EVIDENCE=docs/design/evidence/flow-home-checklist-filters-2026-10-20/a03/review python tools/visual-check/verify-checklist-filters.py
```

Välj andra lediga loopback-portar om dessa är upptagna. Resultat och skärmbilder sparas i `docs/design/evidence/flow-home-checklist-filters-2026-10-20/a03/{public,review}/`. Körningen gav 10/10 public och 19/19 review-kontroller. Detta är avgränsad syntetisk RN Web-verifiering, inte full §14-granskning, oberoende QA/Reviewer, live Supabase/RLS, migrations-/äldre-klientruntime, native VoiceOver/Dynamic Type, fysiska gester eller TestFlight.

## FLOW-TRAINING-01 — aktuell Panel 6-render

Bygg `tools/visual-check/app.tsx` separat för public/review och servera respektive output. Kör `tools/visual-check/verify-flow-training.py` med `TASSLA_UI_BASE_URL`, `TASSLA_UI_REVIEW` och `TASSLA_UI_EVIDENCE`. Syntetiska fixture-program märks i visningsläget; inga konton eller backenddata läses.

Verifieraren täcker 375×844, 430×844, 375×667, två olika 4:3 standardbilder, fortsättkort, alla tre tabbar, exakt öppnad övning, okänd ålder med sparad progress, ingen matchande rekommendation med väg till Alla övningar, pausad äldre version, läsfel med fungerande retry, slutfört program, lång svensk text och 140 %-proxy utan horisontell overflow. Bevisen sparas i `docs/design/evidence/flow-training-01/{public,review}/`. RN Web täcker inte native VoiceOver/Dynamic Type, live content/RLS eller iOS-buildens native beteende.

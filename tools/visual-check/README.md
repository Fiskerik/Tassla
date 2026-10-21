# Lokal UI-verifiering

Den här isolerade provytan renderar produktionskomponenterna via React Native Web med syntetiska uppgifter. Den ingår inte i appens routes eller Codemagic-bundle. `app.tsx` håller testdata i minnet. `native.jsx` ersätter PDF/delning, typsnittsladdning och safe-area med testimplementationer. Ionicons använder projektets riktiga font och glyfer. Inga konton eller nätdata används. I R02-2 v10 är review-bannern ett separat element ovanför den 844 pt höga app-viewporten; total sidvy är därför 876 pt. Bannerhöjden räknas inte som apphöjd.

Installera verktygen separat så att appens låsfil förblir oförändrad:

```sh
npm install --prefix /tmp/tassla-ui-tools --no-package-lock react-native-web@0.21.2 react-dom@19.2.3 esbuild@0.25.12
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/site
```

I en annan terminal, med Python Playwright och `/usr/bin/chromium` installerade:

```sh
python tools/visual-check/verify.py
```

QA-11-resultat och skärmbilder sparas som standard i `docs/design/QA-11/evidence/`. `TASSLA_UI_EVIDENCE` kan styra resultatkatalogen. Home-verifiering avgränsas med `TASSLA_UI_SCOPE=home` så att den inte kör äldre Kunskapsflödesassertioner. Funktionell browserverifiering och proportionerlig jämförelse mot `vision_rev02.jpg` gäller enligt aktuell task. Ägarbeslutet 2026-10-21 skjuter systematisk tillgänglighetsverifiering till efter MVP-release och godkännande; standardvyns labels och faktiska produktbeteenden ingår fortsatt.

## VISION-R02-2 v11 Home

Bygg public och syntetisk review separat; spara bilder/resultat i `docs/design/evidence/vision-rev02/r02-2/correction-v11/{public,review}/`. App-only fit mäts vid 375×844 och 430×844. Reviewens totala skärmbild blir 375×876 respektive 430×876 på grund av den 32 pt banner som ligger ovanför appen och visar `AI-GENERERAD STANDARDBILD`. Båda lägena använder samma runda AI-genererade generiska portrait asset och visar `Standardbild` med solid varm bakning; verifieraren kontrollerar etikettens placering, porträtt-/remsöverlapp, z-ordning och markörfade i standardvyn. Ingen numerisk kontrast- eller stortextgrind körs för MVP.

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

Home-harnessen täcker varm Home-komposition, porträttets public/review-roll, fem dagsrader och tre destinationskort, rutinhantering, träningsradsnavigation, pending/failed/unknown/readback samt loading/empty/error, relevanta standardviewportar och navigation. `homeScenario` väljer syntetiska tillstånd; `TASSLA_UI_REVIEW` avgör om reviewfixture byggs in. Förhandsvisningen Kommande kontrollerar rubrik, innehåll och inline-knappen för hela listan i loading, empty, partial och error; samtliga måste rymmas ovanför den fasta navigeringen före skärmbilden. Verifieringen av initialfit sker före scroll och kontrollerar appens egna viewportgränser. Detta är en React Native Web-rendering med syntetiska data, inte native eller databas/RLS-verifiering.

## FLOW-KNOWLEDGE-01 — Kunskap, FAQ och faschecklistor

KNOW-02 använder `tools/visual-check/know02-app.tsx` och separata public/review-bundles. Alla fixtures är syntetiska. Public bygger guide-/artikelkort men inga FAQ-/checklist-exempel; verifieraren kräver att public FAQ saknar inaktiva kontextval och att Checklistor gör noll läsningar och skrivningar. Review innehåller separat FAQ/checklist- och guideexempel. Evidens går till nya FLOW-KNOWLEDGE-mapparna, inte äldre KNOW-02-evidens.

Bygg båda varianterna, låt dem ligga på samma katalogstruktur (`know02/index.html`), och serva respektive rot separat:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-knowledge/public/know02 node tools/visual-check/build.cjs
TASSLA_UI_REVIEW=true TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-knowledge/review/know02 node tools/visual-check/build.cjs
python -m http.server 4176 --bind 127.0.0.1 --directory /tmp/tassla-knowledge/public
python3 tools/visual-check/verify-know02.py --base-url http://127.0.0.1:4176/know02/ --output-dir docs/design/evidence/flow-knowledge-01/public --bundle-file /tmp/tassla-knowledge/public/know02/know02-app.js
python -m http.server 4177 --bind 127.0.0.1 --directory /tmp/tassla-knowledge/review
python3 tools/visual-check/verify-know02.py --base-url http://127.0.0.1:4177/know02/ --output-dir docs/design/evidence/flow-knowledge-01/review --bundle-file /tmp/tassla-knowledge/review/know02/know02-app.js --review
```

Kör varje server i en egen terminal och verifieraren medan respektive build serveras. Välj lediga portar om 4176/4177 redan används och håll server-/verifierarbasadressen ihop. Båda lägena sparar `browser-results.json` med branch, commit, browser, route, viewport, fixture, SHA-256 för skriptet som webbläsaren laddade och SHA-256 för den namngivna byggfilen; körningen misslyckas om hasharna skiljer sig. `captures` listar varje sparad bild med faktisk viewport och route/state. Public fångar Knowledge, FAQ-tomläge och Checklistor-tomläge i 375×844, 430×844 och 375×667, plus Knowledge-genvägar; review täcker dessa tre vybredder för Kunskap, FAQ-kontext/svar och checklistöversikt/detalj, samt sök/läs/tillbaka, Träningens rundresor och befintliga skriv-/felåterhämtningar. Ingen 140 %- eller systematisk a11y-matris ingår i denna MVP-körning.

Browserklockan låses till 2026-10-11 kl. 15 UTC för reproducerbara loggtider. `?screen=log&mutation=failed` respektive `unsure` provar återhämtning utan backend. `?state=empty|loading|error` provar lästillstånd.

React Native Web-harnessen registrerar RN `Alert`-alternativen och kan anropa en vald callback via `window.__tasslaAlertActions`; detta verifierar menyvalens kopplade åtgärder, inte native Alert-visning, tangentbords-/skärmläsarbeteende, native PDF eller databas/RLS. Harnessen verifierar inte animationers native bildfrekvens. Systematisk tillgänglighetsverifiering är uppskjuten tills MVP:n är släppt och godkänd.

## DOG-PROFILE-SEARCH-PILOT-01

Rasväljarens syntetiska vyer använder produktionskomponenterna från `ProfileScreen`, `EditDogProfileScreen` och `SearchableBreedPicker`, men läser/skriver inte konto- eller databasdata. `profile-create`, `profile-add` och `profile-edit` visar de tre callsites. Sätt `profileScenario=loading|error|empty|without-unknown|missing-breed` för hämtning, tom katalog, verklig-rad-fallback och saknat sparat ras-ID. `state=saving|pending` provar redigeringsväljaren när den är låst.

Bygg public och review var för sig enligt avsnittet ovan och serva den faktiska katalogen mellan build och verifiering. Kör den interaktiva kontrollen i samma läge som bundle:n:

```sh
python tools/visual-check/verify-dog-profile-breed-search.py --base-url http://127.0.0.1:4173/
```

Verifieraren kontrollerar att skapa/lägg till saknar förval, sökning och stängning inte väljer ras, uttryckliga katalograder och befintlig Okänd ras använder resultat, edit bevarar vald eller saknad ras, tom katalog hålls skild från inga sökträffar, retry fungerar och busy/pending låser edit. Den fångar syntetiska skärmbilder vid 375×844, 430×844 och 375×667 samt relevanta sök-/fellägen. Ange `--output-dir` för att styra capture-mappen; QA sparar public och review i `docs/design/evidence/vision-rev02/dog-profile-breed-search/{public,review}/`. Skärmbilderna visar inte live Supabase/RLS, native tangentbord eller skärmläsare. Exact profilpanelmatchning mot `vision_rev02.jpg` är ej tillämplig eftersom ingen sådan panel finns; bedöm stödskärmens egenskaper mot dess dokumenterade kontrakt och redovisa övriga NOT TESTABLE-kontroller.

## FLOW-TRAINING-01

Bygg public och review i separata mappar, starta server för aktuell bundle och kör verifieraren i motsvarande läge. `trainingScenario=home-ordering` placerar ett opåbörjat syntetiskt program före ett pågående i källordningen; verifieringen ska visa att Träning och Hem ändå väljer samma pågående steg. Publicflödet bekräftar markering, Hem → Logg → Träning, avmarkering och en ny flikresa. Review provar sanningsenlig copy och att de borttagna filtren saknas; dess lokala markeringar påstås inte leva kvar efter avmontering.

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/flow-training/public node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/flow-training/public
python tools/visual-check/verify-training-flow.py --base-url http://127.0.0.1:4173/ --output-dir docs/design/evidence/flow-training-2026-10-21/public
```

Bygg om med `TASSLA_UI_REVIEW=true` och servera `/tmp/tassla-preview/flow-training/review`; kör sedan `verify-training-flow.py --review --output-dir docs/design/evidence/flow-training-2026-10-21/review`. Aktuell renderkontroll omfattar standardvyerna 375×844, 430×844 och 375×667. Äldre 140 %-bilder behålls endast som historisk evidens och ingår inte i framtida MVP-acceptans. Native, Supabase/RLS och verkligt publicerat innehåll verifieras inte här. `--no-capture` kör interaktionerna utan att skriva bilder.

## FLOW-LOG-01 — panel 5

Verifieraren monterar produktions-`LogScreen` i `AppScreen`. Public och review använder syntetiska data; de verifierar inte `ProductWorkspace`-konto-/hundscope, live RLS, native runtime eller TestFlight. Byggmanifestet binder den exakta `app.js`-filen till branch, commit och verifierarens SHA-256. Sätt branch och commit från samma checkout före respektive build.

Hämta först de exakta värdena från kassan med `git branch --show-current` och `git rev-parse HEAD`; exportera dem som `TASSLA_UI_BRANCH` respektive `TASSLA_UI_COMMIT`. Bygg public, serva katalogen och kör verifieraren mot exakt `app.js`:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-log/public TASSLA_UI_REVIEW=false TASSLA_UI_VERIFIER=tools/visual-check/verify-log-flow.py node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-log/public
python tools/visual-check/verify-log-flow.py --base-url http://127.0.0.1:4173/ --output-dir docs/design/evidence/flow-log-01/public --bundle-file /tmp/tassla-log/public/app.js
```

Bygg review separat med `TASSLA_UI_REVIEW=true`, eget output och samma exporterade branch/commit; serva reviewkatalogen på en ledig port och lägg till `--review` för verifieraren. Den kräver att aktuellt branch-/commitvärde, buildmanifest, `app.js` och verifierarhash stämmer ihop. Körningarna täcker 375×844, 430×844 och 375×667; Fler stängt/öppet; etttryck/undo; long-press för layout; datumval och kalenderns markör-/tom-/laddnings-/fel-/återförsökstillstånd; tidslinjeredigering/radering; samt CTA inom scrollområdet ovanför fast navigation. Browserbilder jämförs separat mot panel 5 i `vision_rev02.jpg`; kvarvarande skillnader dokumenteras i `docs/design/evidence/flow-log-01/VERIFICATION.md` i stället för att hävda pixelidentitet. `--no-capture` kör interaktionerna utan att skriva resultat.

## FLOW-INSIGHTS-01 — panel 8

`verify-insights-flow.py` använder produktions-`LogScreen` och `InsightsScreen` med syntetiska fixture-data. Den täcker Vecka/Månad/Sedan start, sju synliga och icke-avkortade veckodagsetiketter, empty/loading/error/retry/partial-cap/partial-timeout, Logga → Översikt → tillbaka med exakt datum, aktiv Loggflik och separata route-offsets. En Logga-bild vid 375×844 samt Insights-bilder vid 375×844, 430×844 och 375×667 sparas. Den visuella statusen bedöms separat mot panel 8; ingen bild på denna fixture verifierar live RLS, native eller release.

Bygg public och review var för sig med `TASSLA_UI_VERIFIER=tools/visual-check/verify-insights-flow.py`, samma aktuella branch/commit som verifieraren, och egna kataloger. Servera varje katalog separat. Kör `python tools/visual-check/verify-insights-flow.py --base-url http://127.0.0.1:<port>/ --output-dir <evidence>/public --bundle-file <build>/app.js` och lägg till `--review` för review-builden. `--no-capture` kör samma interaktioner utan att spara screenshots eller manifest. Verifieraren avbryter om branch, commit, bundlehash eller verifierarhash avviker.

## UX-FIX 2026-10-15 — Training continuation

The production `PublishedTrainingScreen` can be rendered with `?screen=training&trainingScenario=default|unstarted|half|complete|several|long-title|unknown-age`. Use `state=empty` and `state=error` for its existing read states. `TASSLA_UI_REVIEW=false|true` builds public and review fixtures separately. The content is synthetic; no account or backend data is read. Current captures and the §14 assessment are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/continue-card/`.

For `UX-TRAINING-UNMARK-01`, use `?screen=training&trainingScenario=later-completed` to render two completed steps with one unfinished step between them. Open `Mina`, choose `Utforska i egen takt`, then select `Avmarkera`. `trainingUnmark=pending` keeps the previous progress visible while the operation is pending and then confirms; `trainingUnmark=failed|unknown` keeps progress and shows one retry state without a success message. The confirmed fixture removes only the chosen step, leaving `Vila nära` checked. These fixtures exercise the production screen with synthetic callbacks; they do not validate Supabase/RLS or native accessibility. Evidence and the §14 delta are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/training-unmark/`.

## UX-FIX 2026-10-15 — Knowledge checklist cache

The Knowledge review fixture exposes `window.__know02UnmountRoute`, `__know02RemountRoute` and `__know02ChangeScope` for a manual warm-return/scope check. Set `window.__know02ReadDelayMs` before opening a previously unseen phase to inspect its honest loading state. `?state=detail-newer` returns a newer synthetic progress row from the template-detail read than from its overview read, exposing summary/detail reconciliation. The fixture counts reads in `__know02ChecklistReads`; expected behavior is three overview reads on cold entry, three more on first phase open, none when reopening that phase or remounting within the same scope, and three fresh reads after changing the synthetic account/dog scope. Captures and §14 delta notes are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/knowledge-cache/`. The fixture uses synthetic review content and does not verify live Supabase, native accessibility, or persistent cache behavior.

## FLOW-HOME-CHECKLIST-01

`TASSLA_UI_CHROMIUM` can point to Playwright Chromium on Windows or another host without `/usr/bin/chromium`; when unset, the verifier uses the documented Linux path. Run the public and review bundles separately with `TASSLA_UI_SCOPE=home`, `TASSLA_UI_BASE_URL` set to the served bundle, and `TASSLA_UI_EVIDENCE` set to the matching evidence folder. The checklist cases cover 0/1/5/7 rows, exact 375×844, 430×844 and 375×667 viewports, loading/error, return from a lower training row with confirmed count and preserved scroll, filter-change scroll reset, leave/reopen at the top, and dog-scope invalidation/reopen at the top (`checklistScopeReset=true`). Systematic accessibility, larger text, screen-reader, reduced-motion, focus and target-size audits are deferred across MVP checkpoints until MVP release and owner acceptance. All data is synthetic; browser rendering does not verify live RLS, native behavior, or a physical device.

## FLOW-HOME-CHECKLIST-FILTERS-01

This verifier covers the panel-4 flow with three reference segments plus an Idag Kommande preview, and all four functioning date scopes in range views. It checks grouped rows, distinct loading/empty/partial/error states, preview CTA availability in each state, read-only historical training, planned routine/health source return, routine edit refresh and confirmed delete, filter scroll reset, short viewport, source scroll preservation, exit/reopen and scope change. The v4 detail checks remain: compact Home versus richer Checklist rows, varied routine icons and optional descriptions, normal tap vs checkbox vs long-press editing, one icon button adjacent to each checklist-item title field, icon selection, an icon-only choice grid with no visible labels, and a frozen current-day snapshot after template edits. The v5 check verifies that the first 375×844 and 430×844 views show the three-row preview above fixed navigation, that preview rows contain only planned routines/health (no saved training rows), and that full Kommande keeps all four scopes. Each preview loading/empty/partial/error capture is saved at 375×844 before tapping its CTA, followed by a separate capture of the full Kommande destination; the preview heading is checked for visual truncation. It uses synthetic data and checks React Native Web only.

Build the public and review bundles separately, serve each bundle, and run the verifier against the exact `app.js` file that the server serves:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-flow-checklist/public TASSLA_UI_REVIEW=false node tools/visual-check/build.cjs
python -m http.server 4180 --bind 127.0.0.1 --directory /tmp/tassla-flow-checklist/public
TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_BASE_URL=http://127.0.0.1:4180/ TASSLA_UI_BUILD_FILE=/tmp/tassla-flow-checklist/public/app.js TASSLA_UI_EVIDENCE=docs/design/evidence/flow-home-checklist-filters-2026-10-20/public python tools/visual-check/verify.py
```

For review, build to `/tmp/tassla-flow-checklist/review` with `TASSLA_UI_REVIEW=true`, serve on port 4181, then run the same verifier with `TASSLA_UI_REVIEW=true`, the review base URL/build path, and the `.../review` evidence directory. The generated `flow-home-checklist-filters-results.json` records branch, commit, app bundle SHA-256, verifier SHA-256, actual browser dimensions, captures, assertions and page errors. Both modes must render at exactly 375×844, 430×844 and 375×667. Review mode includes a visible synthetic-content banner inside that viewport; it is a fixture label, not production UI.

Compare the captures to `vision_rev02.jpg` panel 4 and record the match, deviation and status in `RENDER-REPORT.md`. Owner-approved v5 uses three segments on Idag plus a compact same-screen Kommande preview; full date ranges keep the fourth segment. Checklist count/progress covers routine points only, and same-day training remains a separate **Träningsprogram** group after the preview. Record remaining visual differences rather than claiming pixel identity. Screenshots are synthetic; live Supabase/RLS, production data, native behavior and device acceptance remain separate.

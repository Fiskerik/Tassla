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

KNOW-02 har en separat entry/output och skriver till `docs/design/KNOW-02/evidence/`:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx TASSLA_UI_OUTPUT=/tmp/tassla-preview/site/know02 TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs
python tools/visual-check/verify-know02.py
```

Browserklockan låses till 2026-10-11 kl. 15 UTC för reproducerbara loggtider. `?screen=log&mutation=failed` respektive `unsure` provar återhämtning utan backend. `?state=empty|loading|error` provar lästillstånd.

React Native Web-harnessen registrerar RN `Alert`-alternativen och kan anropa en vald callback via `window.__tasslaAlertActions`; detta verifierar menyvalens kopplade åtgärder, inte native Alert-visning, tangentbords-/VoiceOver-beteende, native PDF eller databas/RLS. Harnessen verifierar inte animationers native bildfrekvens. 140 % text är ett layoutprov, inte fullständig Dynamic Type-verifiering.

## UX-FIX 2026-10-15 — Training continuation

The production `PublishedTrainingScreen` can be rendered with `?screen=training&trainingScenario=default|unstarted|half|complete|several|long-title|unknown-age`. Use `state=empty` and `state=error` for its existing read states. `TASSLA_UI_REVIEW=false|true` builds public and review fixtures separately. The content is synthetic; no account or backend data is read. Current captures and the §14 assessment are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/continue-card/`.

For `UX-TRAINING-UNMARK-01`, use `?screen=training&trainingScenario=later-completed` to render two completed steps with one unfinished step between them. Open `Mina`, choose `Utforska i egen takt`, then select `Avmarkera`. `trainingUnmark=pending` keeps the previous progress visible while the operation is pending and then confirms; `trainingUnmark=failed|unknown` keeps progress and shows one retry state without a success message. The confirmed fixture removes only the chosen step, leaving `Vila nära` checked. These fixtures exercise the production screen with synthetic callbacks; they do not validate Supabase/RLS or native accessibility. Evidence and the §14 delta are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/training-unmark/`.

## UX-FIX 2026-10-15 — Knowledge checklist cache

The Knowledge review fixture exposes `window.__know02UnmountRoute`, `__know02RemountRoute` and `__know02ChangeScope` for a manual warm-return/scope check. Set `window.__know02ReadDelayMs` before opening a previously unseen phase to inspect its honest loading state. `?state=detail-newer` returns a newer synthetic progress row from the template-detail read than from its overview read, exposing summary/detail reconciliation. The fixture counts reads in `__know02ChecklistReads`; expected behavior is three overview reads on cold entry, three more on first phase open, none when reopening that phase or remounting within the same scope, and three fresh reads after changing the synthetic account/dog scope. Captures and §14 delta notes are in `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/knowledge-cache/`. The fixture uses synthetic review content and does not verify live Supabase, native accessibility, or persistent cache behavior.

## FLOW-HOME-CHECKLIST-IDAG-01 — Panel 4, Idag

Use `TASSLA_UI_SCOPE=home-checklist` with the public or review build produced by `build.cjs`. It exercises the always-visible Home entry at 0, 1–5, and more than 5 activities; distinct loading, empty, and read-error states; exact training-step open/return with Träning active and Hem restored on checklist return; missing training source with unconfirmed status and no action; confirmed progress that excludes unavailable sources and reports them separately on both Home and checklist; checklist-based routine management including adding/removing a routine for today, same-date/list return, and scroll restoration after closing the focused manager from a scrolled routine row; Home and checklist scroll restoration; and 375×844, 430×844, 375×667, and 140% text-proxy layouts. Review uses synthetic routine and training data. The verifier sets `prefers-reduced-motion: reduce` because its frozen browser date otherwise stalls the React Native `ScreenTransition` opacity animation at zero; Home's separate scope still checks standard and reduced-motion navigation behavior. Screenshots fast-forward CSS transitions to their resting state. Evidence and the Panel 4 comparison note are in `docs/design/evidence/vision-rev02/checklist/IDAG-01/`.

On Windows, set `TASSLA_UI_CHROMIUM` to a specific Chromium executable only when Playwright cannot locate its installed browser automatically. The Windows procedure and temporary tool paths are recorded in `docs/tasks/dev/FLOW-HOME-CHECKLIST-IDAG-01.md`; fixtures remain outside the app bundle and no dependency or lockfile is added to the repository.

## FLOW-HOME-CHECKLIST-ALL-01 — Panel 4, Alla

Use `TASSLA_UI_SCOPE=checklist-all` with the public and review builds. The verifier checks all dog-owned templates, selected and unselected day states, choosing and restoring a skipped routine through the current-day callback, loading/error/empty states, read-only behavior during refresh/failure/stale mode, and 375×844, 430×844, 375×667 and 140% text-proxy layouts. The model tests exercise the exact 60-second boundary, live IANA-local date at action time, the shared mutation gateway and retry origin. Public/review browser cases also cover expired callbacks with zero writes, pristine-session close, a delayed delete confirmation captured before refresh, dirty draft preservation and explicit discard, an operation that resolves after expiry, unknown outcome retained through a successful read, and dirty/pending scope reset. Review and public use synthetic in-memory fixtures; they do not certify live Supabase/RLS, native Alert behavior, device accessibility or native presentation.

PowerShell from the repository root, using the temporary tools and Python environment created for `FLOW-HOME-CHECKLIST-IDAG-01`:

```powershell
$toolRoot = Join-Path $env:TEMP 'tassla-ui-tools'
$venvRoot = Join-Path $env:TEMP 'tassla-ui-venv'
$uiPython = Join-Path $venvRoot 'Scripts/python.exe'
$outputRoot = Join-Path $env:TEMP 'tassla-checklist-ALL-01'
$env:TASSLA_UI_TOOLS = $toolRoot
$env:TASSLA_UI_OUTPUT = Join-Path $outputRoot 'public'
$env:TASSLA_UI_REVIEW = 'false'
node tools/visual-check/build.cjs
$env:TASSLA_UI_OUTPUT = Join-Path $outputRoot 'review'
$env:TASSLA_UI_REVIEW = 'true'
node tools/visual-check/build.cjs
$env:TASSLA_UI_SCOPE = 'checklist-all'
$publicOutput = Join-Path $outputRoot 'public'
$publicServer = Start-Process -FilePath $uiPython -ArgumentList @('-m','http.server','4173','--bind','127.0.0.1','--directory',$publicOutput) -WindowStyle Hidden -PassThru
try {
  $env:TASSLA_UI_BASE_URL = 'http://127.0.0.1:4173/'
  $env:TASSLA_UI_REVIEW = 'false'
  $env:TASSLA_UI_EVIDENCE = (Join-Path (Get-Location) 'docs/design/evidence/vision-rev02/checklist/ALL-01/public')
  & $uiPython tools/visual-check/verify.py
} finally { Stop-Process -Id $publicServer.Id -Force }
$reviewOutput = Join-Path $outputRoot 'review'
$reviewServer = Start-Process -FilePath $uiPython -ArgumentList @('-m','http.server','4174','--bind','127.0.0.1','--directory',$reviewOutput) -WindowStyle Hidden -PassThru
try {
  $env:TASSLA_UI_BASE_URL = 'http://127.0.0.1:4174/'
  $env:TASSLA_UI_REVIEW = 'true'
  $env:TASSLA_UI_EVIDENCE = (Join-Path (Get-Location) 'docs/design/evidence/vision-rev02/checklist/ALL-01/review')
  & $uiPython tools/visual-check/verify.py
} finally { Stop-Process -Id $reviewServer.Id -Force }
```

Screenshots and UTF-8 `browser-results.json` are stored under `docs/design/evidence/vision-rev02/checklist/ALL-01/{public,review}/`. Compare both rendered variants with Panel 4 and complete the applicable §14 checklist; a passing synthetic interaction run does not mark the whole panel complete.

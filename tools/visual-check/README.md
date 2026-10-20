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

## FLOW-HOME-CHECKLIST-01

`TASSLA_UI_CHROMIUM` can point to Playwright Chromium on Windows or another host without `/usr/bin/chromium`; when unset, the verifier uses the documented Linux path. Run the public and review bundles separately with `TASSLA_UI_SCOPE=home`, `TASSLA_UI_BASE_URL` set to the served bundle, and `TASSLA_UI_EVIDENCE` set to the matching evidence folder. The checklist cases cover 0/1/5/7 rows, 375/430 px, 375×667, 140% text, loading/error, return from a lower training row with confirmed count and preserved scroll position, leave/reopen at the top, and dog-scope invalidation/reopen at the top (`checklistScopeReset=true`). All data is synthetic; browser rendering does not verify live RLS, native VoiceOver/Dynamic Type, or a physical device.

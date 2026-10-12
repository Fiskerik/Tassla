# HOME-NEXT-01 v7.2 — final correction QA

**Result: GODKÄND.** The final Home correction passes the dense first-fold fit check at 375 px and 430 px in both public and review mode. All three action tiles and the “Vad vill du göra nu?” heading end above the fixed navigation. At both widths the tile boxes are y=706, height 78, bottom y=784; navigation begins at y=785 (1 px gap). “Visa dagens logg” is a 44 px target and opens Logg.

Renders and browser result files are under `/tmp/tassla-home-next-01-v7.2/final-correction/{public,review}`. Earlier failed evidence remains preserved in `first-fit-failure/`, `rerun/`, and `final/`.

## §14 checklist against `vision_rev02.jpg`

| # | Result | Finding |
|---|---|---|
| 1 | Ja | Home has no primary action button. |
| 2 | Ja | The three action tiles use the same visual treatment. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | No per-row Edit/Delete links. |
| 5 | Ja | Home spacing uses tokens with a consistent section hierarchy. |
| 6 | Ja | Inspected Home/BottomNav diff uses tokens; no added hardcoded colors or pixel values. |
| 7 | Ja | Existing icon set is used; no emoji icons observed. |
| 8 | Ja | Log, training and health categories use consistent colored icon chips. |
| 9 | Ja | Icons are understandable beside their labels. |
| 10 | Ja | No saved/owner status badge on normal rows; review content retains its required temporary label. |
| 11 | Ja | No informational banner is shown. |
| 12 | Ja | No prohibited technical wording observed in rendered Home copy. |
| 13 | Ja | Visible explanatory text is concise and uses the warm Swedish tone. |
| 14 | Ja | Ready, loading, empty, error, no-program, stale-selection, and review states rendered. FAQ and Checklistor tabs remain available in Knowledge. |
| 15 | Ja | Action tiles are 78 px high and the log link is 44 px high. At 375 px, 140% text with reduced motion has no horizontal overflow; “Kunskap” wraps across two lines but remains visible and accessible. |
| 16 | Ja | The approved v7.2 source groups replace the target’s speculative checklist. All dense Home groups, heading, link and three tiles fit above the nav at 375/430 px. |
| 17 | Ja | Five-tab navigation is present with selected state; CTA opens Logg; More exposes Health and Tassla-pass, with More remaining selected on Health. |
| 18 | Ja | Actual dog name and age appear. The dog silhouette is a friendly placeholder because no dog photo is available. |

## Rendered checks

| Check | Public | Review |
|---|---|---|
| Home verifier, 375 px | PASS | PASS |
| Home verifier, 430 px | PASS | PASS |
| Full tile and heading bounds end above nav | PASS: bottom 784, nav top 785 | PASS: bottom 784, nav top 785 |
| “Visa dagens logg” target/destination | PASS: 44 px; Logg selected | PASS: 44 px; Logg selected |
| Review training step / temporary label | Absent | Present; routes to Training |
| FAQ and Checklistor tabs in Knowledge | Available | Available |
| 140% text + reduced motion, 375 px | PASS; no horizontal overflow | PASS; no horizontal overflow |
| Selected tabs, More → Health | PASS | PASS |
| Uncaught browser errors | None | None |

## Commands and outcomes

| Command | Result |
|---|---|
| `node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs tests/planned-health.test.mjs` | PASS, exit 0; all 4 files pass. |
| `pnpm check` | PASS, exit 0; 39 tests pass, 38 lint warnings, 0 errors. |
| `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7.2/expo-home TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` | PASS, exit 0. |
| `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/final-correction/public/site node tools/visual-check/build.cjs` | PASS, exit 0. |
| `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/final-correction/review/site node tools/visual-check/build.cjs` | PASS, exit 0. |
| `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/final-correction/public python tools/visual-check/verify.py` | PASS, exit 0: Home source states/layout at both widths; navigation, review gate, reduced motion and 140% text pass. Vaccination-row accessible-name locator reaches and passes geometry. |
| `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/final-correction/review python tools/visual-check/verify.py` | PASS, exit 0 with the same checks. |
| `QA_MODE=public QA_OUT=/tmp/tassla-home-next-01-v7.2/final-correction/public python /tmp/tassla-home-next-v72-qa-rerun.py` | PASS, exit 0; independent navigation/content matrix and full bounds pass at both widths. |
| `QA_MODE=review QA_OUT=/tmp/tassla-home-next-01-v7.2/final-correction/review python /tmp/tassla-home-next-v72-qa-rerun.py` | PASS, exit 0; independent review-gate/destination matrix and full bounds pass at both widths. |
| `git diff --check` | PASS, exit 0. |
| `python tools/dev_flow.py validate` | PASS, exit 0; task remains in QA. |

These are local rendered checks only; no native device, backend/RLS, or TestFlight behavior is claimed.

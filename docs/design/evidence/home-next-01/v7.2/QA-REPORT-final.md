# HOME-NEXT-01 v7.2 — final independent QA

**Result: UNDERKÄND.** The latest correction moved “Idag” into the Today card but the action tiles still overlap the fixed navigation by 11 px at both 375 px and 430 px, in public and review renders. Each tile is 78 px high, starts at y=718 and ends at y=796; the navigation starts at y=785. In `final/public/home-ready-375.png`, the tile labels are visibly clipped by the nav. §14 point 16 remains a blocker.

Previous evidence is preserved: the first 47 px overlap is under `first-fit-failure/`, the second 11 px overlap is under `rerun/`, and this final rerun is under `/tmp/tassla-home-next-01-v7.2/final/{public,review}`. Coordinator can copy the final evidence if desired.

## §14 review against `vision_rev02.jpg`

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
| 14 | Ja | Ready, loading, empty, error, no-program, stale-selection, and review states rendered. |
| 15 | Ja | Tiles are 78 px high and the log link is 56 px high. At 375 px, 140% text with reduced motion has no horizontal overflow. |
| 16 | **Nej** | Every tile ends at y=796 while fixed nav begins at y=785: 11 px overlap at both widths and modes. The target keeps all three tiles above nav. |
| 17 | Ja | Five-tab navigation is present with selected state; CTA opens Logg; More exposes Health and Tassla-pass, with More remaining selected on Health. |
| 18 | Ja | Actual dog name and age appear. The dog silhouette is a friendly placeholder because no dog photo is available. |

## Rendered checks

| Check | Public | Review |
|---|---|---|
| Dense fixture / tiles fit above nav, 375 px | **Fail: 11 px overlap** | **Fail: 11 px overlap** |
| Dense fixture / tiles fit above nav, 430 px | **Fail: 11 px overlap** | **Fail: 11 px overlap** |
| “Visa dagens logg” opens Logg | Pass | Pass |
| Main tab selected state; More → Health | Pass | Pass |
| Review training step and temporary label | Absent | Present; opens Training |
| FAQ and Checklistor tabs in Knowledge | Available | Available |
| 140% text + reduced motion, 375 px | Pass, no horizontal overflow | Pass, no horizontal overflow |
| Uncaught browser errors | None | None |

## Commands and exact outcomes

| Command | Result |
|---|---|
| `node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs tests/planned-health.test.mjs` | PASS, exit 0; 4 files pass. |
| `pnpm check` | PASS, exit 0; 39 tests pass, 38 lint warnings, 0 errors. |
| `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7.2/expo-home TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` | PASS, exit 0. |
| `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/final/public/site node tools/visual-check/build.cjs` | PASS, exit 0. |
| `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/final/review/site node tools/visual-check/build.cjs` | PASS, exit 0. |
| `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/final/public python tools/visual-check/verify.py` | FAIL, exit 1 at `verify.py:28`: `get_by_text('Vaccination idag', exact=True)` cannot find the compact row, whose accessible button name is `16:30, Vaccination idag`. The updated `Mat` locator passed; verifier stopped before geometry. |
| `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/final/review python tools/visual-check/verify.py` | Same FAIL, exit 1 at `verify.py:28`; the updated `Mat` locator passes, then the vaccination exact-text locator fails before geometry. |
| `QA_MODE=public QA_OUT=/tmp/tassla-home-next-01-v7.2/final/public python /tmp/tassla-home-next-v72-qa-rerun.py` | Exit 0; independent matrix records tile-fit FAIL at both widths and remaining listed checks pass. |
| `QA_MODE=review QA_OUT=/tmp/tassla-home-next-01-v7.2/final/review python /tmp/tassla-home-next-v72-qa-rerun.py` | Exit 0; independent matrix records tile-fit FAIL at both widths and remaining listed checks pass. |
| `git diff --check` | PASS, exit 0. |
| `python tools/dev_flow.py validate` | PASS, exit 0; task remains in QA. |

The verifier now recognizes the log row by accessible name, but still fails its next exact-text locator before reaching the geometry assertion. The independent matrix measured the full tile and navigation bounds directly. These are local rendered checks; no native device, backend/RLS or TestFlight behavior is claimed.

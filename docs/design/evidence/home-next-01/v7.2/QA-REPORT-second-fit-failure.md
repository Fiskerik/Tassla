# HOME-NEXT-01 v7.2 correction rerun — QA result

**Result: UNDERKÄND.** Compact Home rows moved the action tiles upward 36 px, but did not make them fit above the fixed navigation. The layout assertion still fails at both widths and in both modes: tiles start at y=718 and are 78 px high (bottom y=796); navigation starts at y=785. Each tile overlaps the navigation by 11 px. The screenshots show tile labels partly hidden by the nav. The original first-fit failure and evidence remain preserved under `first-fit-failure/`; this rerun is kept separately under `rerun/`.

## §14 checklist (1–18)

| # | Result | Finding |
|---|---|---|
| 1 | Ja | Home contains no primary action button. |
| 2 | Ja | The three action tiles use the same styling. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | No per-row Edit/Delete links. |
| 5 | Ja | Home spacing uses spacing tokens and the section hierarchy is consistent. |
| 6 | Ja | Inspected Home/BottomNav diff uses tokens; no added hardcoded colors or pixel values. |
| 7 | Ja | Icons use the existing icon set; no emoji icons observed. |
| 8 | Ja | Log, training and health categories use consistent colored icon chips. |
| 9 | Ja | Visible icons are understandable beside their labels. |
| 10 | Ja | No saved/owner status badge on normal rows; review-only temporary example label remains in review mode. |
| 11 | Ja | No informational banner is shown. |
| 12 | Ja | No prohibited technical wording observed in rendered Home copy. |
| 13 | Ja | Visible explanatory copy is concise and uses the intended warm Swedish tone. |
| 14 | Ja | Ready, loading, empty, error, no-program, stale-selection, review and checklist gating states were rendered. |
| 15 | Ja | Action tiles are 78 px high and link is 56 px high. 140% text with reduced motion has no horizontal overflow at 375 px. |
| 16 | **Nej** | Tiles extend 11 px into fixed navigation at 375 and 430 px in public and review. The target shows all three tiles fully above the nav. Reduce/reflow the Home first fold until all tile bounds end above nav. |
| 17 | Ja | Five-tab navigation is present with selected state; `Visa dagens logg` opens Logg; More exposes Health and Tassla-pass, and Health remains a More destination. |
| 18 | Ja | Actual dog name/age are displayed. The silhouette is a friendly placeholder because no dog photo is available. |

## Rerun results

| Check | Public | Review |
|---|---|---|
| Dense Home and all tiles fit above nav, 375 px | **Fail: 11 px overlap** | **Fail: 11 px overlap** |
| Dense Home and all tiles fit above nav, 430 px | **Fail: 11 px overlap** | **Fail: 11 px overlap** |
| 140% text + reduced motion, 375 px, no horizontal overflow | Pass | Pass |
| Home tab selected state | Pass | Pass |
| “Visa dagens logg” destination | Pass: Logg selected | Pass: Logg selected |
| Review training gating | Synthetic review step and label absent | Synthetic review step and temporary label present |
| Review training destination | N/A | Pass: Training |
| FAQ/checklist tabs in Knowledge | Available | Available |
| More → Health and More selected state | Pass | Pass |
| Browser page errors | None | None |

## Exact commands and outcomes

| Command | Result |
|---|---|
| `node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs tests/planned-health.test.mjs` | PASS, exit 0; 4 test files pass. |
| `pnpm check` | PASS, exit 0; 39 tests passed, 38 lint warnings, 0 errors. |
| `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7.2/expo-home TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` | PASS, exit 0. |
| `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/rerun/public/site node tools/visual-check/build.cjs` | PASS, exit 0. |
| `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/rerun/review/site node tools/visual-check/build.cjs` | PASS, exit 0. |
| `QA_MODE=public QA_OUT=/tmp/tassla-home-next-01-v7.2/rerun/public python /tmp/tassla-home-next-v72-qa-rerun.py` | Exit 0; matrix recorded fit FAIL at both widths; remaining checks passed. |
| `QA_MODE=review QA_OUT=/tmp/tassla-home-next-01-v7.2/rerun/review python /tmp/tassla-home-next-v72-qa-rerun.py` | Exit 0; matrix recorded fit FAIL at both widths; remaining checks passed. |
| `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/rerun/public python tools/visual-check/verify.py` | FAIL, exit 1 at `verify.py:26`: exact-text locator `get_by_text('Mat', exact=True)` does not match the compact row’s button accessible name `12:05, Mat`; verifier stops before its geometry assertion. |
| `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/rerun/review python tools/visual-check/verify.py` | Same FAIL, exit 1 and locator mismatch at `verify.py:26`. |
| `git diff --check` | PASS, exit 0. |
| `python tools/dev_flow.py validate` | PASS, exit 0; task remains in QA. |

The independent matrix measured geometry directly and saved screenshots despite the stale exact-text verifier locator. The review build has no separate checklist task card on Home, consistent with v7.2's rule that the Today source card is not a checklist; checklistprogress stays in Knowledge. Screenshots and JSON results are in `rerun/public/` and `rerun/review/`. These are local rendered checks only; no native device, backend/RLS, or TestFlight behavior is claimed.

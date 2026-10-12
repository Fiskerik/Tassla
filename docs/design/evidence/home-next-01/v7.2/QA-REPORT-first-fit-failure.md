# HOME-NEXT-01 v7.2 — QA result

**Result: UNDERKÄND.** Visual acceptance is blocked by §14 point 16: on both 375 px and 430 px renders, the three Home action tiles extend behind the fixed bottom navigation. No product or visual harness files were changed by QA. The rendered results and screenshots are in `public/` and `review/` beside this report.

## §14 checklist

| # | Result | Finding |
|---|---|---|
| 1 | Ja | Home contains no primary action button. |
| 2 | Ja | No same-group button variants to compare; visible action tiles share the same treatment. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | No per-row Edit/Delete links. |
| 5 | Ja | Home spacing uses spacing tokens and section hierarchy is consistent. |
| 6 | Ja | Inspected Home/BottomNav diff contains token references; no added hardcoded colors or pixel values. |
| 7 | Ja | Icons use the existing icon set; no emoji icons observed. |
| 8 | Ja | Log, training and health categories use consistent colored icon chips in the dense card. |
| 9 | Ja | The visible icons are understandable with their adjacent labels. |
| 10 | Ja | No saved/owner status badge on normal rows. The review-only temporary example label is retained as required. |
| 11 | Ja | No informational banner is shown. |
| 12 | Ja | No prohibited technical wording observed in rendered Home copy. |
| 13 | Ja | Visible explanatory copy is concise and consistent with the warm Swedish tone. |
| 14 | Ja | Ready, loading, empty, error, no-program, stale-selection, and review states were captured. |
| 15 | Ja | Link and action tiles are at least 44 px high; 140% text with reduced motion has no horizontal overflow at 375 px. |
| 16 | **Nej** | Action tiles start at y=754 and are 78 px high; fixed nav starts at y=785, so 47 px of each tile lies behind the nav at both widths. Target `vision_rev02.jpg` shows all three compact tiles fully above the nav. Keep this as a blocking mismatch until the Home layout fits. |
| 17 | Ja | Five-tab navigation is present; selected state is exposed. Health and Tassla-pass remain accessible from More; Health remains a Health destination. |
| 18 | Ja | Actual dog name/age are shown. The silhouette is an explicit friendly placeholder because no dog photo is available. |

### Rendered behavior checks

| Check | Public | Review |
|---|---|---|
| 375 px tile fit above fixed nav | **Fail** | **Fail** |
| 430 px tile fit above fixed nav | **Fail** | **Fail** |
| 140% text + reduced motion, 375 px, no horizontal overflow | Pass | Pass |
| Home tab selected state | Pass | Pass |
| Review training step absent / present with temporary label | Absent | Present; opens Training |
| Checklist card absent / present with temporary label | Absent | Present |
| FAQ remains available | Pass | Pass |
| Health route via More and selected More state | Pass | Pass |
| Browser page errors | None | None |

## Commands and results

| Command | Result |
|---|---|
| `node --experimental-strip-types --test tests/home-today.test.mjs tests/main-navigation.test.mjs tests/knowledge-review-content.test.mjs tests/planned-health.test.mjs` | PASS, exit 0 |
| `pnpm check` | PASS, exit 0; 39 tests passed, 38 lint warnings, 0 errors |
| `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7.2/expo-home TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` | PASS, exit 0 |
| `git diff --check` | PASS, exit 0 |
| `python tools/dev_flow.py validate` | PASS, exit 0; queue valid, task remains in QA |
| `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/public/site node tools/visual-check/build.cjs` | PASS, exit 0 |
| `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-home-next-01-v7.2/review/site node tools/visual-check/build.cjs` | PASS, exit 0 |
| `QA_MODE=public QA_OUT=/tmp/tassla-home-next-01-v7.2/public python /tmp/tassla-home-next-v72-qa.py` (Chromium on `127.0.0.1:4173`) | Browser checks completed; visual-fit criterion fails at both widths. |
| `QA_MODE=review QA_OUT=/tmp/tassla-home-next-01-v7.2/review python /tmp/tassla-home-next-v72-qa.py` (Chromium on `127.0.0.1:4173`) | Browser checks completed; visual-fit criterion fails at both widths. |
| `TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/public python tools/visual-check/verify.py` (public build served at `127.0.0.1:4173`) | FAIL, exit 1 at the first-fit assertion: Logga box `{x:24,y:754,width:103.65625,height:78}` overlaps nav `{x:0,y:785,width:375,height:59}`. |
| `TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01-v7.2/review python tools/visual-check/verify.py` (review build served at `127.0.0.1:4173`) | FAIL, exit 1 at the same first-fit assertion and geometry. |

Local browser rendering only was tested. No native device, backend/RLS, or TestFlight behavior is claimed.

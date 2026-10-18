# FLOW-INSIGHTS-01 / R7 — Independent QA

Date: 2026-10-18<br>
Latest evidence reviewed: `browser-results.json`, generated 2026-10-18 15:22 UTC<br>
Plan: `docs/plans/DOG-PROFILE-BREED-CATALOG-01-ux-spec.md` v7.1<br>
Verdict: **PASS** (implementation QA; browser data is synthetic)

## Prior findings and current result

- **Zero-count colored bars — resolved.** `InsightsScreen.tsx` now renders a pee or poop bar only when that count is positive. In both public and review matrix runs, the Oct 16 pee-only fixture asserts the pee bar exists and the poop bar is absent. Inspected current 375 px and 430 px screenshots agree; numeric and chart representation match.
- **Empty selected period — resolved.** The selected range displays “Ingen räknad logg i perioden” and explains the “Ej loggat” gaps. The current public/review period-empty cases check the copy, state test ID, chart and gap disclosure. The model test uses older-only history and verifies seven empty buckets. Empty history and read failure remain separate states.

## Acceptance review

| Criterion | Result | Evidence / limits |
|---|---|---|
| Selected-dog scope, minimal projection, supported event types, cancellation/stale-result guard | PASS | Query and workspace source scope results to the selected dog and supported pee/poop/accident rows, select only the approved five columns, forward abort, and discard stale route/scope/generation results. Live Supabase/RLS is not exercised. |
| All-page read, exact-count drift, stable order and duplicate/incomplete-page rejection | PASS | Focused workspace-data tests cover pagination, stable order, drift, duplicates, incomplete pages, foreign dogs, malformed categories and cancellation. Offset pagination remains documented best effort, not snapshot isolation. |
| Week/month/since-start periods, local IANA time zone and no-future navigation | PASS | Model tests cover calendar boundaries, local grouping, no-future navigation and explicit Europe/Stockholm spring-forward and fall-back DST bucket grouping. |
| Saved-log truth, unknown accidents, gaps and chart/numbers parity | PASS | Unknown legacy accident kinds do not count; unlogged days remain gaps; zero-count bars are absent. Public/review browser assertions and 375/430 screenshots verify the one-category case. |
| Empty history, empty selected period and load failure | PASS | Distinct empty-history and empty-period copy; error state remains retryable and shows no partial chart. The dedicated empty-period state is in the latest public/review matrix. |
| Log date/route offset restore, first visit, same-key rerender and late events | PASS | The browser runner obtains the active DOM scroller's actual React Native Web `onScroll` function, invokes the captured old Log callback after navigating to Insights and the old Insights callback after returning to Log, then verifies both saved offsets restore. All related interactions pass, including first visit at zero and same-key rerender. |
| Responsive presentation and readable alternative | PASS (synthetic browser only) | Latest public/review matrix covers 375×844, 430×844, 375×667 and 140% text with no horizontal page overflow. Inspected current phone-size and 140% captures; numeric list and legend remain available. Native VoiceOver/device Dynamic Type are not tested. |

## Verification on the current snapshot

- Focused model, Log UI policy, workspace-data and AppScreen tests: **43/43 PASS**.
- `pnpm check`: **618 passed, 0 failed**, including app and edge typecheck plus lint.
- Latest `browser-results.json`: **16 viewport/state cases + 6 interactions**, 0 failures, 0 page errors, 0 blocked requests.
- `python tools/dev_flow.py validate`: PASS.
- `git diff --check`: PASS.
- Inspected public/review captures: 375 px and 430 px normal layout, 375 px at 140%, and empty-selected-period state. The pee-only date has no brown poop bar; the empty-period card is explicit.

## Limits and evidence note

The browser cases use synthetic saved-log fixtures. Live Supabase readback/RLS, native iOS/Android behavior, VoiceOver, device Dynamic Type and runtime time-zone changes are not claimed. `IMPLEMENTATION-REPORT.md` has since been refreshed and now records 43/43 focused tests, 618 full-suite tests, and 16 viewport/state cases + 6 interactions, matching the evidence checked in this QA report.

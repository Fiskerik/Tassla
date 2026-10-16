# R2b independent QA recheck — PASS

Date: 2026-10-17\
Task: `UIUX-REVAMP-R2B-SHARED-SHEET-01`\
Scope: exact approved v2 task/UX spec and current source/evidence. QA performed read-only; no repository files changed during the recheck.

| Criterion | Independent verification | Result |
|---|---|---|
| Cancelled claimed header touch restores focus | Inspected the source and assertion; fresh public/review browser runs report focus `true → true`. | PASS |
| Dirty drag and explicit choices | Stay retains the draft; explicit “Lämna utan att spara” closes only after the deferred confirmation and produces no write. A second drag leaves the already-open prompt authoritative. | PASS |
| Owner guard and clean close | Production `LogScreen`/`BottomSheet` are used; clean drag closes through owner state with zero writes and one controlled close request. | PASS |
| Locked states and opt-out | Pending, failed, and unsure preserve status/draft without extra writes; Add-event stays on the no-responder/no-wrapper opt-out path. | PASS |
| Threshold, direction, cancel, reduced motion | Browser verifies held movement, 119 pt rejection, 130 pt acceptance, upward/horizontal non-takeover, touch cancel and reduced-motion reset; focused tests cover the 120 pt boundary. | PASS |
| Public/review and evidence | Both bundles rebuilt from current source; screenshots and README reviewed. Each run is 11/11 with zero page errors. | PASS |
| Native/live behavior | Not exercised by this local browser scope. | NOT TESTABLE |

## Checks

- `node --experimental-strip-types --test tests/bottom-sheet-gesture.test.mjs tests/log-screen-policy.test.mjs tests/main-navigation.test.mjs` — **19/19 passed**.
- `pnpm check` — **exit 0**; TypeScript, edge typecheck, ESLint, **547/547 tests passed**.
- `python -m py_compile tools/visual-check/verify.py` — **exit 0**.
- `python tools/dev_flow.py validate` — **exit 0**; R2b was still in `qa` at check time.
- `git diff --check` — **exit 0**, line-ending warnings only.
- Fresh public and review `log-sheet-gesture` runs — **11/11 each**, zero page errors; focus is `true` before and after in both.

## Limits

Native iOS/Android touch, real keyboard/focus behavior, VoiceOver, physical Dynamic Type, Modal/system-back priority, live Supabase/RLS, mutation persistence and an installed build remain **NOT TESTABLE**. This QA PASS covers the local R2b checkpoint only; independent Reviewer is still required.

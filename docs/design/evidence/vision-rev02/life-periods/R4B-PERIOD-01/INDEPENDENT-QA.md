# R4b independent QA — 2026-10-17

Task and exact plan: `docs/tasks/dev/UIUX-REVAMP-R4B-PERIOD-01.md` v2.

| Criterion | Result | Evidence |
|---|---|---|
| 1. Deterministic period for valid birth/today; missing, invalid and future return null | PASS | Focused domain tests, including invalid date/today and future birth. |
| 2. Continuous before/on/after boundaries, approximate 12-week seam, months, month-end, leap dates, years and 10+ | PASS | Focused domain suite now checks 55/56/57 days and 83/84/85 days; Jan31→Apr30 clamped seam; before/on/after 6/12 months and 2/4/6/8/10 years; Feb29→Feb28. |
| 3. Period changes as today advances; no write/persistence | PASS (model scope) | Same birth resolves differently across boundaries; resolver only takes dates and returns an object. This does not prove complete Scenario C. |
| 4. Existing age format/stage and content grants remain unchanged; 6/24-month stage boundaries | PASS | Existing helper functions unchanged; focused tests check VALP/UNGHUND/VUXEN on 6/24-month dates. |
| 5. README accurately describes resolver, date semantics, checks and non-medical limits | PASS | README command and description match implementation. |
| Complete Scenario C selection plus retention, native app, live Supabase/RLS | NOT TESTABLE | Explicitly outside this model-only checkpoint and remain open. |

## Commands

- `node --experimental-strip-types --test tests/domain.test.mjs tests/profile-edit.test.mjs` — 36/36 PASS after correction.
- `pnpm check` — app typecheck, edge-account typecheck, ESLint and 574/574 tests PASS after correction.
- `python tools/dev_flow.py validate` — PASS.
- `git diff --check` — PASS; only standard LF/CRLF notices.

QA v1 initially found missing day-after assertions at 8 and literal 12 weeks. The test-only correction added days 57 and 85 and both independent rechecks confirmed they stay in the approximate `8–12 weeks` band until the clamped third calendar-month date. Recheck verdict: criteria 1–5 PASS. QA made no repository edits.

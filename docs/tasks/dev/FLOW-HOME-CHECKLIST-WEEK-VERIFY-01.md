# FLOW-HOME-CHECKLIST-WEEK-VERIFY-01 — correct stale Panel 4 verifier expectations

Date: 2026-10-18\
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`\
Plan version: v2\
Mandate: MVP v2 implementation ordered by Erik on 2026-10-06; this is a test-harness correction only.

## Finding

The fresh `FLOW-HOME-CHECKLIST-01` integration run exposed two stale harness expectations. No production behavior has been changed or shown defective.

1. `tests/daily-activity-ui.test.mjs` reads `verify.py` as raw UTF-8. The test's R3c large-text start marker contains LF, but the current verifier file contains CRLF, so the exact start lookup fails. The existing end-label prefix does match the file; it is not the cause.
2. The `checklist-week` verifier returns from training to Home with `homeScenario=checklist`. The empty-advice Home card is then the accessible checklist entry, while the ordinary `Visa dagens checklista` button is intentionally hidden. The verifier currently waits for that hidden button.

## Exact changes and scope

- In `tests/daily-activity-ui.test.mjs`, normalize CRLF to LF in a local verifier-source string before locating the existing R3c large-text start and end markers. Keep both marker texts and every origin-guard, active-tab-scroll, label-bound, and text-proxy assertion unchanged.
- In `tools/visual-check/verify.py`, in the checklist-week confirmed-program-reset scenario, locate and click the single visible Home card whose accessible name starts with `Just nu med <dog name>: inget publicerat råd. Öppna dagens checklista`. Assert it is present exactly once and visible before clicking. Preserve the expected return to the week checklist and all progress assertions.

No production component, fixture data, navigation behavior, API, network configuration, or dependencies change. Do not weaken, remove, or broaden any other assertions.

## Acceptance

1. The focused integration test suite passes, including the R3c static-origin and large-text harness test.
2. `pnpm check` passes typecheck, edge typecheck, lint, and full test suite.
3. `checklist-week` passes in public and review with pageErrors empty, including the confirmed reset flow back through the actual Home checklist entry.
4. `r3c-upcoming` passes in public and review with pageErrors empty, including the 140% active-tab bounds scenario; it is included because the corrected static test and the verifier file are shared.
5. `py_compile`, queue validation, and `git diff --check` pass. Save manifests and relevant screenshots in the new WEEK-VERIFY-01 evidence directory.
6. Live Supabase/RLS and native iOS/Android/accessibility remain NOT TESTABLE; this task is only synthetic harness evidence.

## Risk and review

Risk L: test and local synthetic verifier only; no app runtime, data access, persistence, navigation, or security boundary changes. Exact plan requires Architect APPROVE and Critic PROCEED before implementation. Security is not applicable. Independent QA and Reviewer are required before closing.

## Write paths

- `tests/daily-activity-ui.test.mjs`
- `tools/visual-check/verify.py`
- `docs/tasks/dev/FLOW-HOME-CHECKLIST-WEEK-VERIFY-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/checklist/WEEK-VERIFY-01/`

## Checks

- `node --experimental-strip-types --test tests/main-navigation.test.mjs tests/daily-activity-model.test.mjs tests/daily-activity-data.test.mjs tests/daily-activity-ui.test.mjs tests/workspace-data.test.mjs`
- `pnpm check`
- Public and review `TASSLA_UI_SCOPE=checklist-week` against the corresponding local bundles.
- Public and review `TASSLA_UI_SCOPE=r3c-upcoming` against the corresponding local bundles.
- `python -m py_compile tools/visual-check/verify.py`
- `python tools/dev_flow.py validate`
- `git diff --check`

## Plan review history

- v1 Critic: PROCEED for the accessible Home card and intended r3c-upcoming scope.
- v1 Architect: CHANGES. The v1 diagnosis targeted the end label, but the real mismatch is the LF start marker versus CRLF in raw verifier source. No source files were edited.
- v2 Architect: APPROVE.
- v2 Critic: PROCEED.
- Security: not applicable for the read-only test harness scope.


## Implementation v2

Only the approved harness-only changes were made:

- The static R3c test normalizes CRLF to LF in a local source string before slicing with its unchanged start and end markers. Its existing origin guard, tab-scroll, label-bound and text-proxy assertions remain.
- The weekly reset verifier locates the single visible accessible empty-advice Home card and clicks it before asserting return to the week view and the reset total.

Verification:
- Focused navigation/daily-activity/workspace tests: 56/56 PASS.
- pnpm check: typecheck, edge typecheck, lint and 581/581 tests PASS.
- checklist-week: public 7/7 and review 7/7; confirmed reset return passes.
- r3c-upcoming: public 12/12 and review 12/12; active-tab bounds at 140% pass.
- Browser manifests report pageErrors: [] in all four runs. Evidence and screenshots: docs/design/evidence/vision-rev02/checklist/WEEK-VERIFY-01/{public,review}/.
- python -m py_compile tools/visual-check/verify.py, python tools/dev_flow.py validate and git diff --check: PASS.
- No production component or fixture data changed. Live Supabase/RLS and native/device accessibility: NOT TESTABLE.
- Independent QA and Reviewer pending.


## Independent QA — PASS

QA independently reviewed the implementation and reran the focused tests, pnpm check, and all four public/review visual scopes. Detailed verdict: docs/design/evidence/vision-rev02/checklist/WEEK-VERIFY-01/QA-REPORT.md.

QA confirmed 56/56 focused tests; pnpm check exit 0 and full suite 581/581; checklist-week 7/7 in public and review; r3c-upcoming 12/12 in public and review; zero page errors in all four manifests and zero blocked requests in the two R3c manifests. py_compile, queue validation and diff-check passed. The independent rerun outputs were in a temporary directory and could not be recovered after QA's sandbox switched; the canonical implementation-run evidence remains saved under public/review. Live backend and native/device accessibility remain NOT TESTABLE. Next gate: independent Reviewer.


## Independent Reviewer — PASS

Reviewer inspected the exact v2 plan, the child-specific stable hunks in `tests/daily-activity-ui.test.mjs` and `tools/visual-check/verify.py`, the QA report, canonical public/review manifests, and checklist-week/R3c screenshots.

- CRLF normalization is local to the test source string; both markers and origin, active-tab-scroll, label-bound, and text-proxy assertions remain intact.
- Weekly reset return asserts one visible accessible Home card, then the weekly saved-activities view and baseline total.
- Canonical checklist-week manifests pass 7/7 in each mode; R3c passes 12/12 in each mode, with empty page errors and no blocked requests. Active Kommande tab and label fit at 140%; prior tab is partially clipped by horizontal scrolling.
- No code findings. QA's independent temporary rerun artifacts could not be inspected because they were unavailable after its sandbox switch; canonical implementation evidence was inspected, consistent with the QA report.
- Live Supabase/RLS and native/device accessibility remain NOT TESTABLE.

Reviewer report: `docs/design/evidence/vision-rev02/checklist/WEEK-VERIFY-01/review/REVIEW-REPORT.md`. This test-only correction is ready to close.

# FLOW-HOME-CHECKLIST-ALL-VERIFY-01 — correct delayed-delete end-state assertion

Datum: 2026-10-18\
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`\
Planversion: v2\
Mandat: MVP v2 implementation ordered by Erik on 2026-10-06; this is a test-harness correction only.

## Fynd

Panel 4 integration attempt v1 ran the existing `checklist-all` public verifier. The delayed delete callback is deliberately confirmed only after the rendered snapshot expires. The expected product behavior is that the manager sheet closes, the callback is rejected, the automatic refresh runs, and the active routine remains visible in the Alla list. The v1 plan incorrectly expected the manager sheet to remain open.

Independent QA returned **CHANGES** for v1. The public/review captures show the manager closed after expiry; a temporary diagnostic using the manager-scoped locator also found it absent. The earlier 16/16 runs were therefore not sufficient evidence for the v1 acceptance criterion, even though the guard showed zero writes and one refresh.

## Exact change

Update only the delayed-delete-after-expiry assertion at the identified `checklist-all` scenario in `tools/visual-check/verify.py`. After invoking the delayed callback and retaining the exact zero-write/one-refresh guard assertion, verify all of the following:

- the `Rutiner och aktiviteter` manager heading is absent because the expired session has closed;
- the `Alla rutinmallar` heading remains visible;
- exactly one visible/accessibility-tree `Morgonrutin` heading remains in Alla, and it is visible.

Do not perform a separate close action: expiry and refresh should close the clean manager session. Assert its absence before checking the list state, so the routine heading assertion resolves to the active routine template. Keep all other selectors and assertions unchanged. Do not modify production code, fixtures, data, network policy or dependencies.

## Acceptans

1. In the delayed-delete-after-expiry scenario, the manager sheet closes, its stale confirmation cannot mutate, the guard reports exactly one refresh and zero writes, and the active `Morgonrutin` remains in the Alla list.
2. The test explicitly checks manager closure, the `Alla rutinmallar` collection, and one visible `Morgonrutin` heading. No global strictness is weakened and no other assertion is removed or relaxed.
3. The complete existing `checklist-all` verifier passes in separate public and review bundles with zero page errors. New results go under `ALL-VERIFY-02/{public,review}/`; preserve the v1 evidence and canonical `ALL-01` evidence.
4. Live Supabase/RLS and native modal/accessibility behavior remain separate and are not inferred from this test-harness correction.

## Risk, dependencies and reviewers

Risk L: a narrow Playwright assertion correction in synthetic verification; no app behavior, data access or user-visible copy changes. Depends on `FLOW-HOME-CHECKLIST-ALL-01` (done). Exact plan v2 requires fresh Architect **APPROVE** and Critic **PROCEED** before implementation because v1 acceptance was wrong. Security is not applicable: no runtime, data boundary, network, or security behavior changes. Independent QA and Reviewer remain required before closeout.

## Skrivvägar

- `tools/visual-check/verify.py`
- `docs/tasks/dev/FLOW-HOME-CHECKLIST-ALL-VERIFY-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/checklist/ALL-VERIFY-02/`

## Kontroller

- `python -m py_compile tools/visual-check/verify.py`
- Run existing `TASSLA_UI_SCOPE=checklist-all` in separate public and review bundles per `tools/visual-check/README.md`; screenshots and manifests under `ALL-VERIFY-02/{public,review}/`.
- Confirm both manifests have every existing assertion passed and `pageErrors: []`.
- Independent QA verifies the delayed callback outcome, list persistence, captures and all manifests.
- Independent Reviewer checks the stable diff and saved evidence.
- `python tools/dev_flow.py validate`
- `git diff --check`

## Planreview — v1 (historical)

- Architect: **APPROVE** after Critic PROCEED.
- Critic: **PROCEED**.
- Security: not applicable.
- Independent QA: **CHANGES**. The manager-scoped heading assertion conflicts with the expected post-expiry state and is absent/flaky after the sheet closes. Existing v1 runs passed 16/16 per mode, but the screenshots and a separate diagnostic show the sheet closed; those runs do not satisfy the incorrect v1 acceptance.

## Implementation and v1 evidence (historical; not accepted as closeout)

The one-line v1 change scoped the routine title to the manager region. No production or fixture code changed.

- `python -m py_compile tools/visual-check/verify.py`: **PASS**.
- Public and review: **16/16** each, `pageErrors: []`, 22 screenshots each under `ALL-VERIFY-01/{public,review}/`.
- QA's diagnostic: **CHANGES**. The delayed-delete screenshot shows the manager closed and the routine retained in Alla; the v1 locator is absent/flaky.
- `python tools/dev_flow.py validate` and `git diff --check`: **PASS**.
- Live Supabase/RLS and native modal/accessibility behavior: **NOT TESTABLE**.

## Replan v2 review record

- Architect: **APPROVE — plan v2**, rechecked after wording clarification. No separate close action is taken; expiry/refresh must close the clean manager, whose absence is asserted before the retained routine is checked in Alla.
- Critic: **PROCEED — plan v2**, rechecked after wording clarification. The result is non-vacuous: manager absent, Alla collection visible, exactly one retained routine heading, and one refresh with zero writes.
- Security: not applicable; this is a test-only selector/assertion change with no runtime or data-boundary changes.

Exact plan review complete. No source change for v2 began before these verdicts.


## Implementation v2 and local verification

Only the delayed-delete-after-expiry assertion in `tools/visual-check/verify.py` changed for v2. It now asserts natural manager closure, the visible Alla collection, exactly one visible `Morgonrutin` heading and the existing one-refresh/zero-write guard. Production and fixture code are unchanged.

- `python -m py_compile tools/visual-check/verify.py`: **PASS**.
- Public `checklist-all`: **16/16 PASS**, `pageErrors: []`, 22 screenshots under `ALL-VERIFY-02/public/`.
- Review `checklist-all`: **16/16 PASS**, `pageErrors: []`, 22 screenshots under `ALL-VERIFY-02/review/`.
- The delayed-delete screenshot shows Alla selected, the `Alla rutinmallar` section, the retained `Morgonrutin` card, and no open manager.
- `git diff --check`: **PASS**.
- Independent QA and Reviewer remain pending.
- Live Supabase/RLS and native modal/accessibility behavior remain **NOT TESTABLE**.

## Oberoende QA — PASS

QA independently reviewed the v2 plan and verifier diff, reran the full public and review scopes, and inspected both delayed-delete captures. Each run passed 16/16 with pageErrors empty and 22 screenshots. In both captures, expiry/refresh has closed the manager, Alla remains selected, and the active Morgonrutin is still visible. The existing guard confirms one refresh and zero writes. py_compile, queue validation, and diff-check passed. Durable copies of both QA manifests and delayed-delete screenshots are in docs/design/evidence/vision-rev02/checklist/ALL-VERIFY-02/independent-qa/; the full implementation screenshot sets remain in the public/review directories. Live Supabase/RLS and native modal/accessibility behavior remain NOT TESTABLE. Independent Reviewer PASS is recorded below.


## Independent Reviewer — PASS

The independent Reviewer checked verify.py lines 1741–1755, the v2 plan, queue entry, all public/review and QA manifests, and four delayed-delete screenshots. The assertions preserve the one-refresh/zero-write guard, check natural manager closure, and verify the visible Alla collection with exactly one retained Morgonrutin heading. No other assertion was removed or relaxed. Reviewer confirmed the four captures show Alla selected, routine retained and manager closed. Reviewer did not rerun the suite; independent QA did. Live Supabase/RLS and native modal/accessibility remain NOT TESTABLE.

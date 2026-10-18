# Independent QA — FLOW-PROGRESS-01 v1.2 / R6 geometry correction

**Verdict: PASS**

Reviewed the current R6 source, approved v1.2 plan, UI test, evidence runner, 24-case browser manifest, all full/half/partial/unknown captures at 375 and 430 px, and §14. No product code was changed.

## Acceptance review

- **Ring geometry:** Source uses 360 straight tangential bars, width `2.5 × (2πr / 360)`, height 12, radius 0. This matches the approved v1.2 correction. At 375 and 430 px the full, half, partial/unknown and full-known-plus-unknown rings appear continuous, sharp and free of visible seams or scalloped edges.
- **Counts and colors:** Browser evidence verifies exactly 180 green bars for 3/6, 360 green bars for 6/6, and the expected eight amber unknown bars at the final segment indexes. Unknown bars are identified by exact computed amber RGB (`rgb(245, 182, 63)`), not just by counting distinct colors. The 24 manifest cases all have passing assertions.
- **Completion/list parity:** The full-known captures show 6/6 and visibly checked routine and training rows. The training completion marker is now green with a white check; the prior v1.2 finding is resolved. The screen maps all activities in source order and does not truncate the production list.
- **Truthful data and states:** Progress derives from the shared daily activity snapshot; unavailable items are excluded from the confirmed denominator and disclosed separately. Stale/loading/error/empty states and recovery paths remain. Only exact `completedAt` plus its timezone can produce a training time; routines do not gain fabricated times.
- **Accessibility and navigation:** Fully confirmed states expose progressbar value and label; unknown/stale states omit complete progress semantics and provide visible status copy. Routine checkboxes expose checked state; training actions identify their exact target and completion state. Existing back/scroll restoration behavior remains covered by the interaction matrix.
- **Visual residuals:** §14 point 16 correctly remains **No** for full rev02 fidelity. Composition, row typography/density and the generic portrait remain different; the unsupported weekly-goal block is omitted. These are documented residuals, separate from the accepted ring correction.

## Verification

- `pnpm check`: **PASS** — typecheck, edge typecheck and lint passed; 598 tests passed, 0 failed.
- iOS review export: **PASS** — review content guard passed; Metro bundled 1,450 modules.
- `python tools/dev_flow.py validate`: **PASS** — FLOW-PROGRESS-01 validates and remains in `qa`.
- `git diff --check`: **PASS** — no whitespace errors; Git reports only line-ending normalization warnings.
- `browser-results.json`: **24 viewport/state cases + 5 interactions**, zero page errors and zero blocked requests. Reduced motion is emulated before navigation and screenshot animations are disabled.

## Not testable in this environment

Live Supabase/RLS and persisted mutation/readback, native VoiceOver, real Dynamic Type, device safe-area behavior and physical iOS/Android rendering remain untested. The 140% text view is a browser proxy. §14 records these limitations.

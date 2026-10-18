# Independent QA — FLOW-PROGRESS-01 v1.2

**Verdict: CHANGES**

Reviewed current `DailyProgressScreen.tsx`, the R6 UI test, approved v1.2 UX spec, browser matrix, public/review captures, and §14. No product code was changed.

## Findings

1. **Full-state training completion is not visibly represented.**
   `review-daily-progress-full-known-375x844.png` says “6 av 6”, but the “Vila nära” training row shows an empty-looking status circle. `TrainingRow` renders a white checkmark for `activity.completed` (around lines 184–187), while `trainingStatus` remains a transparent, gray-outlined circle (around lines 251–252). The synthetic `progress-full` fixture marks every activity complete, so the screenshot indicates the completed training state is visually indistinguishable from incomplete. Give the completed marker a visible checked style and assert it in the UI/evidence check.

2. **The approved state/viewport matrix is incomplete.**
   `browser-results.json` contains 19 viewport/state cases and 5 interactions. Full-known, partial/unknown and full-known-plus-unknown are captured only at 375 px; there is no exact half-progress case at either width and no corresponding special-state captures at 430 px. The baseline 375/430 screenshots look smooth, and full/partial/unknown screenshots look smooth at 375 px, but the v1.2 requirement to visually verify full, half, partial and unknown at both 375 and 430 px is not demonstrated.

3. **Unknown-color assertion is too permissive.**
   The runner sets `ringHasUnknownColor` from `colors.length >= 3`, which would pass for any three distinct colors. The current manifest records the expected amber `rgb(245, 182, 63)` alongside green and track colors, and the 375 px screenshot visibly shows the amber unknown segment; however, the automated predicate does not prove that the unknown segment has the expected color or position. Assert the expected color on the relevant segment(s).

## Checks and evidence

- `pnpm check`: **PASS**, typecheck, edge typecheck and lint completed; 598 tests passed, 0 failed.
- iOS review export: **PASS**, review content guard passed; Metro bundled 1,450 modules.
- `python tools/dev_flow.py validate`: **PASS**, FLOW-PROGRESS-01 remains in `qa`.
- `git diff --check`: **PASS**, no whitespace errors (Git emitted line-ending normalization warnings).
- Browser manifest: **19 cases + 5 interactions**; no page errors or blocked requests. Reduced motion is emulated before navigation and CSS animations are disabled for screenshots.
- 360 ring segments and one-degree source geometry are supported by the 360-child check and the source angle formula. The current ring looks smooth at 375/430 px baseline and at 375 px in full/partial/unknown captures.
- The full activity array is mapped to rows in source order; progress counts exclude unavailable statuses from the confirmed denominator. Training time is rendered only from `completedAt` with its timezone. Unknown and stale states omit progressbar semantics. These data and accessibility checks pass by source inspection and automated evidence.
- §14 point 16 correctly remains **No** for full reference fidelity; its composition, typography, portrait and density residuals are disclosed separately from functional status.

## Not testable here

Live Supabase/RLS and persisted readback, native VoiceOver, real Dynamic Type, native safe-area behavior and physical iOS/Android rendering are not covered by the synthetic React Native Web fixture. The 140% text screenshot is a browser proxy.

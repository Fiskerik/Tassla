# FLOW-PROGRESS-01 — ring SVG amendment

Plan v1.3 — Erik approved the dependency 2026-10-18; Architect APPROVE 2026-10-18
Date: 2026-10-18<br>
Baseline: R6 checkpoint and approved plan v1.2. This amendment changes only ring rendering and the visual harness.

## User request

Replace the visibly wavy outer edge of the daily progress ring with a sharp, smooth contour. Preserve the current count, track, confirmed-progress and unknown-status meaning.

## Proposed implementation

Replace the 360 positioned React Native rectangles with concentric `Circle` strokes from Expo SDK 57-compatible `react-native-svg` 15.15.4. The track remains a full circle; confirmed progress uses a precise SVG dash length; unknown status uses a separate amber dash with the existing gap. Keep the 220 pt rendered SVG size, 100 SVG-unit radius, 12 SVG-unit stroke, colors, accessible progress semantics and all surrounding layout/data behavior.

Erik explicitly approved retaining `react-native-svg@15.15.4` on 2026-10-18. Architect APPROVED this exact amendment after evidence and active R6 documentation sync on 2026-10-18; independent Reviewer PASS was saved in docs/design/evidence/vision-rev02/daily-progress/REVIEW-REPORT-v1.4.md; the local checkpoint is closed.

## Scope

- `package.json`, `pnpm-lock.yaml`
- `src/features/home/DailyProgressScreen.tsx`
- `tests/daily-progress-ui.test.mjs`
- `tools/visual-check/build.cjs` (select the package's web entry for the synthetic RN Web bundle)
- `docs/design/evidence/vision-rev02/daily-progress/capture-evidence.mjs` and refreshed R6 captures/manifest
- R6 rendering descriptions in `docs/features/daily-progress.md`, `docs/plans/FLOW-PROGRESS-01-ux-spec.md`, `docs/design/evidence/vision-rev02/daily-progress/`, and `docs/tasks/dev/`

No data, storage, navigation, activity calculation, database, RLS, colors, layout, or user-facing behavior changes are in scope.

## Acceptance

- Half, full, partial, unknown and stale states render a continuous circular stroke without scalloped edges at 375 and 430 px.
- SVG dash lengths match the confirmed ratio and the separate 8-degree unknown arc; the ring remains 12 SVG units wide.
- Counts, list parity, labels and progress accessibility remain correct; unknown/stale data is never announced as complete progress.
- Fresh public/review capture verifies SVG circles directly, 26 viewport/state cases and 5 interactions, with zero page errors, blocked requests and horizontal overflow. Stale state is captured at both 375 and 430 px in public and review.
- `pnpm check`, `pnpm bundle:ios`, queue validation and `git diff --check` pass. Live RLS and native-device/VoiceOver behavior remain separately labeled NOT TESTABLE.

## Review gates

1. Owner decision: Erik approved `react-native-svg@15.15.4` on 2026-10-18.
2. Architect re-reviewed this exact amendment after documentation sync and APPROVED on 2026-10-18.
3. Independent QA PASS is saved in `docs/design/evidence/vision-rev02/daily-progress/QA-REPORT-v1.4.md`; Reviewer PASS is saved in docs/design/evidence/vision-rev02/daily-progress/REVIEW-REPORT-v1.4.md.

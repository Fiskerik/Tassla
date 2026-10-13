# R02-1 visual QA — blocked pending fit correction

Independent QA measured the public and review Home against the approved 16 pt gap above bottom navigation.

## Result

**BLOCK.** In public mode at both 375 and 430 px, each destination tile ends at y=792 while fixed navigation begins at y=785. This is a 7 px overlap and misses the required 16 px clearance by 23 px. Screenshots show clipped tiles.

In review mode the synthetic banner stays fixed, the five local fixture checkboxes toggle 2/5 → 1/5 → 2/5, and destination navigation works. However, the verifier scrolls before measuring destinations. Initial destination tile positions are below navigation (375: y=834, 430: y=794), so review-mode initial composition does not pass the same first-screen fit criterion.

## Other checks

- Focused tests: PASS
- `pnpm check`: PASS, 41 tests passed; 38 lint warnings, 0 errors
- Public iOS bundle: PASS
- Public and review visual builds: PASS
- `git diff --check`: PASS
- `python tools/dev_flow.py validate`: PASS
- Large text / reduced motion and short-screen scrolling: PASS for reachability
- Public synthetic-data boundary and review-only local toggle: PASS
- §14 rendered layout acceptance: BLOCK because both initial compositions fail fit

## Correction boundary

Architect confirms this is covered by the existing R02-1 plan: make Home-local density adjustments, optionally compact `DestinationTile` while preserving 44×44 pt targets, and assert review geometry before any scrolling. At 375 and 430 px, all three public and review destinations must be visible on the initial 844 pt viewport and end at least 16 pt above fixed navigation. Keep the five-row fixture, permanent synthetic banner, source content, navigation, touch targets, shared spacing tokens, and all other approved behavior intact. No new plan or product scope is introduced.

## Evidence

Failure screenshots, measurements and render matrices are saved next to this report. They are retained for comparison after the correction.

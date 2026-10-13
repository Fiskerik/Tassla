# Independent QA — VISION-R02-1 correction 2

**Verdict: BLOCK.** Public Home passes the initial geometry verifier. Review Home still misses the required 16pt free space at both standard widths. Per Coordinator direction, QA stopped after capturing the initial review geometry and did not continue review interactions or full §14 scoring until the same-scope fit correction is coordinated.

## Initial geometry

Nav bounds are y=785, height=59 at both 375×844 and 430×844. Each review destination tile is height 74, y=698, and ends at y=772, leaving 13px before nav. The contract requires at least 16px, so all three tiles are 3px short.

| Mode / viewport | Logga | Träna | Kunskap | Nav top | Result |
|---|---:|---:|---:|---:|---|
| Public 375×844 | Official verifier PASS | Official verifier PASS | Official verifier PASS | 785 | PASS, ≥16px clearance |
| Public 430×844 | Official verifier PASS | Official verifier PASS | Official verifier PASS | 785 | PASS, ≥16px clearance |
| Review 375×844 | y=698–772 | y=698–772 | y=698–772 | 785 | FAIL, 13px gap |
| Review 430×844 | y=698–772 | y=698–772 | y=698–772 | 785 | FAIL, 13px gap |

Fresh screenshots and exact bounds: `review/home-initial-geometry-375.png`, `review/home-initial-geometry-430.png`, `review/initial-geometry.json`. Public and review official verifier output is under `public/` and `review/`.

## Commands and results

- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3 test files.
- `pnpm check` — PASS, 41 tests; lint reported 38 warnings and 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c2 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; public Expo export completed.
- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-2-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-2-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-2/public python tools/visual-check/verify.py` — PASS at 375px and 430px; navigation, public review-gating, reduced motion and 140% text checks passed.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-2/review python tools/visual-check/verify.py` — FAIL at initial 375px geometry, before scrolling: `Öppna Logga` y=698,h=74 vs nav y=785; official assertion requires bottom ≤ nav top−16.
- `git diff --check && python tools/dev_flow.py validate` — PASS; queue validation completed.

## §14 status

The visual gate fails criterion 5 (spacing/free nav clearance) and criterion 16 (match to panel composition) in review mode. Full §14 scoring and review-mode 375×667, 140% text/reduced motion, checkbox/banner behavior and route checks are deferred because the required initial review fit still fails. No device, native runtime, or backend behavior was assessed.

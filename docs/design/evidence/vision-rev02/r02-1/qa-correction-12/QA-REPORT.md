# R02-1 independent QA — correction 12 large-text wheel path

Date: 2026-10-13

**Verdict: PASS.** Fresh public and review builds pass. Both Home verifiers pass at 375/430 with 140% text and reduced motion. The final destination is fully visible above fixed navigation after the scroll path. In review mode, the banner position is captured after text scaling and is unchanged after scrolling at both widths.

## Results

| Check | Result | Evidence |
|---|---|---|
| Public verifier, 375/430 | PASS | `public/browser-results.json`; initial and scrolled large-text screenshots at both widths. |
| Review verifier, 375/430 | PASS | `review/browser-results.json`; five fixture rows, fixed banner, initial and scrolled large-text screenshots at both widths. |
| Final destination after scroll | PASS | Verifier assertion requires tile bottom <= nav top. At 375/430, the destination is fully visible above fixed navigation. |
| Review banner after scaling and scroll | PASS | Banner is measured after 140% text scaling; y remains 2 before and after scroll at both widths. |
| Browser errors | PASS | Both verifier outputs have empty `pageErrors`. |
| Build results | PASS | Public and review visual-check builds both succeeded. |

## Scroll position and geometry

The verifier first calls `scroll_into_view_if_needed()` on the final destination, then sends a real 48 px mouse-wheel input over that button. The scroll range explains the resulting offsets:

| Mode | Width | Initial scrollTop | After `scroll_into_view_if_needed` | After wheel | Result |
|---|---:|---:|---:|---:|---|
| Public | 375 | 0 / max 144 | 144 (max) | 144 (wheel is a no-op at end) | Last tile y=601.19,h=82; verifier confirms it is fully above nav. |
| Public | 430 | 0 / max 116 | 61 | 109 | Wheel moves scroll by 48 px; last tile moves y=684.19→636.19 and clears nav. |
| Review | 375 | 0 / max 244 | 244 (max) | 244 (wheel is a no-op at end) | Last tile y=601.20,h=82; nav top=738.59, 55.39 px clearance. |
| Review | 430 | 0 / max 129 | 73 | 121 | Wheel moves scroll by 48 px; last tile moves y=685→637; nav top=766.59, 47.59 px clearance. |

At 375, the tile is already fully reachable and above the nav after `scroll_into_view_if_needed()` reaches the scroll limit. The wheel is therefore correctly a no-op at the end of scroll range. At 430, the wheel changes scrollTop and moves the button further above navigation.

Review banner bounds after text scaling and before/after scrolling:

| Width | Before scroll | After scroll |
|---:|---|---|
| 375 | x=12,y=2,w=351,h=28 | x=12,y=2,w=351,h=28 |
| 430 | x=12,y=2,w=406,h=28 | x=12,y=2,w=406,h=28 |

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-12-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-12-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01/qa-correction-12/public python tools/visual-check/verify.py` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/tmp/tassla-home-next-01/qa-correction-12/review python tools/visual-check/verify.py` — PASS.

## Evidence

- Report: `docs/design/evidence/vision-rev02/r02-1/qa-correction-12/QA-REPORT.md`
- Public captures: `docs/design/evidence/vision-rev02/r02-1/qa-correction-12/public/home-large-text-reduced-motion-{375,430}.png` and `home-large-text-scrolled-reduced-motion-{375,430}.png`.
- Review captures: `docs/design/evidence/vision-rev02/r02-1/qa-correction-12/review/home-large-text-reduced-motion-{375,430}.png` and `home-large-text-scrolled-reduced-motion-{375,430}.png`.
- Scroll offsets: `public/scrolltop.json`, `review/scrolltop.json`.
- Review banner and final geometry: `review/geometry.json`.
- Reference screenshots are render-only, React Native Web; no native-device behavior is claimed.

No repository files were edited.

# R02-1 independent QA — correction 11 large-text scroll check

Date: 2026-10-13

**Verdict: BLOCK for the existing review verifier.** Public Home verifier passes. Review mode confirms the banner remains fixed after 140% text is applied and after scrolling to the last destination, but the official verifier exits early because it compares the banner's post-scale position with a baseline captured before scaling. The review run therefore does not reach its 430 px official assertion. An independent measurement also finds the 430 px destination bottom is fractionally 0.406 px below nav top; rendered screenshot looks flush and the entire tile is visible, but the strict geometry condition would fail if reached.

## Results

| Check | Result | Evidence |
|---|---|---|
| Public initial and scrolled large-text Home at 375/430 | PASS | Official public verifier passed both widths; initial and scrolled screenshots captured. |
| Review large-text last destination visible at 375/430 | PASS visually | Independent Chromium screenshots and boxes show entire last destination in view. At 375 it has 55.39 px clearance; at 430 it ends at y=767, nav top is y=766.594 (0.406 px fractional overlap; screenshot appears flush with nav). |
| Review banner fixed during scrolling | PASS behavior | After scaling, banner y=2 before and after scroll at both widths. At 375, y=2 stays constant; at 430, y=2 stays constant. It grows from y=6,h=20 before text scaling to y=2,h=28 after scaling, then does not move during scroll. |
| Official review verifier | **FAIL** | Exits 1 at `tools/visual-check/verify.py:131`: `AssertionError: review banner moved while revealing the last destination at 140% text`. It compares post-scroll y=2 to the pre-scaling baseline y=6. |
| Builds | PASS | Fresh public and review visual-check builds both succeeded. |

## Geometry

Independent rendered measurement from the review build after reduced motion and 140% text:

| Width | Banner before scale | Banner after scale, before scroll | Banner after scroll | Last tile box | Nav box | Clearance |
|---:|---|---|---|---|---|---:|
| 375 | y=6,h=20 | y=2,h=28 | y=2,h=28 | y=601.20,h=82 | y=738.59 | 55.39 px |
| 430 | y=6,h=20 | y=2,h=28 | y=2,h=28 | y=685,h=82 (bottom 767) | y=766.59 | −0.406 px |

The banner's y changes only when its own text grows; it remains stationary across scroll at each width. At 430, the fractional boxes overlap by less than half a CSS pixel. The screenshot shows the whole tile at the top edge of navigation, appearing flush. Since the strict bottom <= nav-top assertion would fail by 0.406 px, report this rather than treating it as clearance.

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-11-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-11-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-11/public python tools/visual-check/verify.py` — PASS; 375/430 layout, nav, reduced motion and 140% text.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-11/review python tools/visual-check/verify.py` — FAIL at `verify.py:131` with the banner baseline mismatch above. It reaches and passes the 375 px last-tile check before that banner assertion.
- Independent diagnostic: `temporary QA diagnostic script (not included in repository)`; JSON measurements at `review/banner-measurements.json`.

Full `pnpm check` and iOS export were not rerun; the handoff said both passed after the app change and this change only touched the verifier.

## Evidence

- Report: `docs/design/evidence/vision-rev02/r02-1/qa-correction-11/QA-REPORT.md`
- Public initial/scrolled large-text shots: `docs/design/evidence/vision-rev02/r02-1/qa-correction-11/public/home-large-text-reduced-motion-{375,430}.png` and `home-large-text-scrolled-reduced-motion-{375,430}.png`.
- Review initial screenshots: `docs/design/evidence/vision-rev02/r02-1/qa-correction-11/review/large-initial-{375,430}.png`.
- Review scrolled screenshots: `docs/design/evidence/vision-rev02/r02-1/qa-correction-11/review/large-scrolled-{375,430}.png`.
- Banner/geometry measurements: `docs/design/evidence/vision-rev02/r02-1/qa-correction-11/review/banner-measurements.json`.

The QA agent made no repository edits; the coordinator archived this report and its rendered evidence.

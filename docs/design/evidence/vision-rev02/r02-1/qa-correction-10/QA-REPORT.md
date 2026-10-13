# R02-1 independent QA — correction 10

Date: 2026-10-13

**Verdict: PASS for the requested correction-10 checks.** The wrapper View paints an opaque cream background beneath the complete glyphs of weeks 12–14. Glyph-level contrast exceeds 4.5:1 for every week label at 375/430 px, with and without 140% text. Public and review builds plus both Home-scoped verifier runs passed.

## Findings

| Check | Result | Details |
|---|---|---|
| Week-label contrast, all labels | PASS | Weeks 8–14 measured at 375×844 and 430×844, normal and 140% text. Minimum measured was selected week 11 at 6.55:1; other labels were at least 12.45:1, including week 12 at 375×140%. Per-pixel data and screenshot pairs are in `review/week-glyph-contrast.json` and `review/week-glyph-{normal,underlay}-*.png`. |
| Wrapper backing | PASS | The cream fill is on a wrapping View around the text, so it covers full glyph bounds. In the screenshot it appears as a small rounded cream label behind weeks 13/14 where the dark portrait crosses the week strip; it is visually close to the reference's light labels over portrait imagery, without obscuring the portrait itself. |
| Portrait | PASS with note | The 120×124 frame contains a prominent placeholder illustration with an approximately 108×124 visible subject. It occupies the same general space and carries the portrait role in panel 1. It remains an illustration, not a photo of the user's dog. |
| Week dots | PASS with note | Active dot has 5.83:1 contrast; inactive dots are subtle at 1.21:1, consistent with the gray markers in the reference. |
| Initial destination fit | PASS | Public/review verifier checked all destinations before scrolling at 375 and 430. It asserts bottom <= fixed nav top−16. The prior measured positions for this unchanged flow are tile y=694–768 and nav top y=785, or 17 px clearance. |
| Public/review content gate | PASS | Public has no synthetic 2/5, checkboxes, fixture rows or review banner. Review has five rows and fixed banner; checkbox round trip 2/5→1/5→2/5 passes. |
| Responsive/accessibility checks | PASS | Home verifier passed 375×667 scroll reachability, 140% text, reduced motion, no horizontal overflow, selected tab, main destinations and More access. Browser page error lists are empty. |
| Focused tests/builds | PASS | Both public/review builds and three focused Home/UI policy tests pass. |

## Contrast results

Measured each glyph pixel by comparing normal and paired screenshots with only the week text made transparent, then sampling the exact underlying rendered pixel. All readings below are minimum glyph-pixel contrast ratios:

| Viewport | Weeks 8–10 | Week 11 current | Weeks 12–14 |
|---|---:|---:|---:|
| 375×844 | 12.45:1 | 6.55:1 | 12.45:1 |
| 430×844 | 12.45:1 | 6.55:1 | 12.45:1 |
| 375×844, text 140% | 12.45:1 | 6.55:1 | 12.45:1 |
| 430×844, text 140% | 12.45:1 | 6.55:1 | 12.45:1 |

The opaque wrapper backing is present beneath all week 13/14 glyph pixels where they cross the portrait; week 12 also clears 12.45:1 at 375/140%. The full output JSON includes pixel counts, bounds, colors and exact screenshot paths.

## Rendered state and interaction

- Public and review initial views pass at 375×844 and 430×844. Destination tiles remain above the fixed navigation with the required 16 px margin.
- Public retains actual-source groups, log action and three destination tiles without synthetic completion content.
- Review shows five rows and the persistent synthetic-mode banner. The count toggles from 2/5 to 1/5 and back to 2/5; scrolling at 375×667 keeps the banner in place and reaches the last destination.
- Main-tab selection, Home destinations, More access, reduced motion, large text and no horizontal overflow pass.
- Screenshots show the small cream backing reads as a localized label treatment rather than a card. The illustration itself remains visible and prominent.

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-10-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-10-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-10/public python tools/visual-check/verify.py` — PASS at 375/430.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-10/review python tools/visual-check/verify.py` — PASS at 375/430.
- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3/3.
- Temporary Chromium glyph-pixel script — PASS; all labels measured at all four sizes/scales.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS; queue reports VISION-R02-1 in QA.

Full `pnpm check` and iOS export were not rerun in this correction-specific pass; this pass focused on the wrapper visual change, builds, existing Home verifiers and the relevant focused tests.

## Evidence paths

The QA agent kept its output outside the repository because its handoff prohibited source, plan, queue and test edits. The coordinator archived the evidence here without changing the findings:

- Report: `docs/design/evidence/vision-rev02/r02-1/qa-correction-10/QA-REPORT.md`
- Public screenshots/verifier output: `docs/design/evidence/vision-rev02/r02-1/qa-correction-10/public/`
- Review screenshots/verifier output: `docs/design/evidence/vision-rev02/r02-1/qa-correction-10/review/`
- Glyph contrast pairs/data: `docs/design/evidence/vision-rev02/r02-1/qa-correction-10/review/week-glyph-normal-*.png`, `week-glyph-underlay-*.png`, `week-glyph-contrast.json`
- Reference: `/workspace/Tassla/vision_rev02.jpg`, panel 1.

No source, tests, docs, queue or visual harness files were edited.

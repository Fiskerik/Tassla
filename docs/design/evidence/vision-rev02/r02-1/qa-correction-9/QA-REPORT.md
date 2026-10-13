# R02-1 independent QA — correction 9

Date: 2026-10-13
Verdict: **BLOCK** — the Home layouts, routes, and fixture behavior pass; portrait size/prominence is restored. However, the small cream backings do not keep all week-label glyphs above the required 4.5:1 contrast when labels overlap the portrait. Lowest measured glyph contrast is 3.49:1 (week 13, 430×844, normal text).

## Acceptance summary

| Criterion | Result | Evidence |
|---|---|---|
| Public Home has no synthetic daily count, fixture rows, checkbox or review banner | PASS | Public verifier and `public/home-ready-{375,430}.png`; `public/browser-results.json` |
| Review fixture and permanent banner | PASS | Review verifier confirms five rows, initial 2/5 count, banner visibility and fixed position while scrolling |
| Review checkbox round trip | PASS | Verifier toggles 2/5 → 1/5 → 2/5 at both widths |
| All three initial-view destination bounds at 375/430 | PASS | Each tile is y=694..768; fixed nav begins y=785: 17 px clearance (required 16 px) |
| 375×667 scrolling, 140% text, reduced motion, navigation and no horizontal overflow | PASS | Public and review Home verifiers |
| Portrait visible subject size/prominence | PASS with note | Screenshot subject is approximately 108×124 px in the 120×124 frame and visually prominent at 70% opacity. The supplied asset is still an illustration, not the golden puppy photo in panel 1. The enlarged subject sits behind week labels. |
| Week-label glyph contrast >=4.5:1 at all requested widths/scales | **FAIL** | `review/week-glyph-contrast.json`; week 13 at 430 normal = 3.49:1, week 14 at 375 normal = 3.82:1 and 430 normal = 3.87:1. Week 14 at 375×140% = 7.54:1; at 430×140% = 10.53:1. Current week 11 = 5.83:1. |
| Week dots | PASS with note | Active dot 5.83:1; inactive dots 1.21:1 and visibly subtle, matching the gray marker treatment in the reference. Pixel captures in `review/week-dot-contrast.json`. |
| Overall §14 review | **BLOCK** | Point 8 fails because text over the portrait drops below 4.5:1. The portrait’s role/footprint now passes point 16; see table below. |

## §14 comparison to `vision_rev02.jpg`, panel 1

| # | Result | Finding |
|---|---|---|
| 1 | Ja | The view has a clear greeting, identity, age strip, current-help card, daily list and three next actions. |
| 2 | Ja | Logga, Träna and Kunskap tiles have equal weight and retain the target ordering at both widths. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | Rows do not repeat edit/delete controls. |
| 5 | Ja | Initial layout fits above fixed navigation. Review tiles end at y=768; nav top y=785 (17 px clearance). |
| 6 | Ja | Existing shared UI and design tokens remain in use. |
| 7 | Ja | Icons consistently identify log, training and knowledge destinations. |
| 8 | **Nej** | Labels 13/14 overlap the enlarged portrait, and their cream backing does not cover every glyph pixel. Measured 3.49:1 minimum at week 13, 430×844; see exact readings below. |
| 9 | Ja | Destination labels and routes match Logga, Träna and Kunskap; Mer exposes Hälsa and Tassla-pass. |
| 10 | Ja | Public has no synthetic completion count/checkbox. Review-only controls toggle fixture state 2/5 → 1/5 → 2/5. |
| 11 | Ja | The review banner stays fixed while the fixture list scrolls. |
| 12 | Ja | Labels and descriptions are concise and legible apart from the measured week-label contrast issue. |
| 13 | Ja | Greeting, context, daily tasks and destinations preserve the intended hierarchy. |
| 14 | Ja | Ready, loading, error, empty, no-program, complete and stale-selection states are covered by the Home verifier. |
| 15 | Ja | Render checks cover 140% text, reduced motion, 375×667 scrolling and responsive navigation. This is not native-device or VoiceOver certification. |
| 16 | Ja, with note | The illustration occupies approximately 108×124 px of the 120×124 frame and reads prominently at 70% opacity, close to the reference portrait’s space and visual role. It remains the approved placeholder illustration rather than a photo of the owner’s dog. The week strip overlays its lower area. |
| 17 | Ja | Main-tab selection and navigation were exercised; Home tiles route to their destinations, and More exposes Health and Tassla-pass. |
| 18 | Ja | Dog name and age are present and remain readable. The placeholder is decorative and is not presented as the owner’s actual photo. |

## Contrast measurements

Glyphs were measured from paired browser screenshots: one normal render and one with only the week-label text made transparent. Changed glyph pixels were compared to their exact rendered underlay pixels. The minimum observed ratio per week:

| Viewport | Week 8 | Week 9 | Week 10 | Week 11 current | Week 12 | Week 13 | Week 14 |
|---|---:|---:|---:|---:|---:|---:|---:|
| 375×844 | 12.45 | 12.45 | 12.45 | 5.83 | 12.45 | 12.34 | **3.82** |
| 430×844 | 12.45 | 12.45 | 12.45 | 5.83 | 12.45 | **3.49** | **3.87** |
| 375×844, text 140% | 12.45 | 12.45 | 12.45 | 5.83 | 12.45 | 12.45 | 7.54 |
| 430×844, text 140% | 12.45 | 12.45 | 12.45 | 5.83 | 12.45 | 12.45 | 10.53 |

The lowest pixel was week 13 at x=336,y=134 in the 430 px normal render: text `rgb(28,48,39)` over `rgb(110,133,109)`, 3.49:1. Week 14 was also below target at both normal widths. The backing is visually small, but it leaves part of the glyph over the portrait; therefore it does not satisfy the explicit contrast acceptance. The corrected backing needs to cover the full glyph shape where it crosses the image, or the overlap needs to be removed while preserving the visual scale/fit.

The screenshot comparison shows the dog silhouette is now strong and fills the portrait role. Unlike panel 1’s golden puppy photo, the approved placeholder has a flat green illustration style. The image element is clipped by the existing 120×124 frame; the shown screenshot confirms the visible silhouette spans approximately 108 px horizontally and the frame height vertically. It still renders beneath labels 12–14; the weak contrast is the blocker.

## Rendered fit and interactions

- At 375×844, the three destination tiles each start at y=694 and end at y=768. At 430×844, they have the same y bounds. The fixed nav begins at y=785 at both widths, leaving 17 px clearance.
- The public first view shows its real source groups, “Visa dagens logg”, “Vad vill du göra nu?” and all three tiles. No synthetic 2/5 count or checkbox is present.
- Review mode shows five synthetic rows and its fixed review banner. Both checkboxes and banner interactions passed; short viewport content is scroll reachable.
- Navigation checks passed for selected tabs, destinations and More access. Review-only training is gated in public and available through review.
- Browser verifier recorded no page errors. Checklist availability remains limited to the harness-provided route/client behavior; this run does not make product-data or device claims.

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-9-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-9-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/workspace/Tassla/docs/design/evidence/vision-rev02/r02-1/qa-correction-9/public python tools/visual-check/verify.py` — PASS at 375/430; all Home states, navigation, review gate, reduced motion, 140% text and geometry.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/workspace/Tassla/docs/design/evidence/vision-rev02/r02-1/qa-correction-9/review python tools/visual-check/verify.py` — PASS at 375/430; five fixture rows, checkbox round trip, fixed banner, short viewport, navigation, reduced motion, 140% text and geometry.
- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3/3.
- `pnpm check` — PASS; TypeScript, edge-account typecheck, lint and all 41 tests passed. ESLint reported 38 existing warnings and 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c9 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; public content guard and iOS export to `dist/ios`.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS; `VISION-R02-1` remains implementing for coordinator checkpoint.
- Temporary Chromium/Pillow scripts measured glyph and dot contrast; outputs are saved under `review/`.

## Evidence

- Public renders: `public/home-ready-375.png`, `public/home-ready-430.png`, `public/home-large-text-reduced-motion-{375,430}.png`, short viewport, navigation, and state captures.
- Review renders: corresponding files under `review/`, plus `review/home-review-fixture-scroll-{375,430}.png`.
- Glyph contrast normal/underlay screenshot pairs and summary: `review/week-glyph-normal-*.png`, `review/week-glyph-underlay-*.png`, `review/week-glyph-contrast.json`.
- Dot contrast screenshots/data: `review/dot-normal-*.png`, `review/dot-underlay-*.png`, `review/week-dot-contrast.json`.
- Official verifier outputs: `public/browser-results.json`, `review/browser-results.json`.
- Reference: `/workspace/Tassla/vision_rev02.jpg`, panel 1.

No source, visual harness, queue, or plan files were edited by QA. The blocking acceptance is label contrast on the image at normal text size. No native-device, real account, production-data or backend behavior is claimed.

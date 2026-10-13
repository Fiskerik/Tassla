# R02-1 independent QA — same-asset crop correction

Date: 2026-10-13
Verdict: **BLOCK** — portrait scale now fills the approved 120×124 px frame, but the enlarged opaque dog silhouette sits behind week labels 13 and 14. Those dates and their dots lose contrast in both normal and 140% text screenshots. §14 points 8 and 16 remain “Nej”.

## §14 review

| # | Result | Evidence / finding |
|---|---|---|
| 1 | Ja | Logg, Träning, and Kunskap remain the three clear next actions. |
| 2 | Ja | The three destination tiles have equal size and visual weight at 375/430. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | Home rows do not repeat edit/delete links. |
| 5 | Nej | The enlarged portrait overlaps the week strip’s 13/14 labels and dots. The content does not have clear separation in that area. |
| 6 | Ja | Shared UI components and tokens remain in use. |
| 7 | Ja | Destination and row icons render consistently. |
| 8 | **Nej** | The week labels/dots for 13/14 are drawn over the dark-green silhouette. On both standard and 140% screenshots their contrast is visibly reduced; the 13/14 labels are harder to read than the labels on the plain background. |
| 9 | Ja | Tile symbols and labels match their destinations; tapping Logg, Träning, or Kunskap selects its corresponding tab. Mer exposes Hälsa and Tassla-pass. |
| 10 | Ja | Public has no synthetic completion controls/count. In review, explicit local fixture checkboxes toggle 2/5 → 1/5 → 2/5. |
| 11 | Ja | The synthetic review banner remains visible while the list scrolls. |
| 12 | Ja | Home copy is concise and user-facing. |
| 13 | Ja | Greeting, help content, daily rows, and destinations follow the target hierarchy. The date/portrait collision is recorded under points 5, 8, and 16. |
| 14 | Ja | Loading, empty, error, partial, and complete Home states were rendered at both widths where applicable. |
| 15 | Ja | Official browser verifier passed 140% text, reduced motion, 375×667 scrolling, and navigation semantics. This is browser evidence, not native-device or VoiceOver certification. |
| 16 | **Nej** | Crop correction increases the visible figure to about 106×123 px within the 120×124 frame, close to the target portrait’s footprint. However, the enlarged subject now covers the week strip’s 13/14 text and dots, unlike the readable hierarchy in panel 1 of `vision_rev02.jpg`. The full composition therefore still does not match the reference. See standard and 140% captures below. |
| 17 | Ja | Main tab selection and More destinations were checked; active tab follows the current destination. |
| 18 | Ja | Dog name/age are shown; the placeholder remains a decorative illustration, not a claimed owner photo. |

## Geometry and rendered behavior

- 375×844 portrait frame: x=231,y=36,w=120,h=124. Thresholded visible silhouette: approximately x=238–343,y=36–158 (about 106×123 px). Name/age remains x=24,y=80,w=199,h=20; week strip remains x=24,y=120,w=327,h=56.
- 430×844 portrait frame: x=286,y=36,w=120,h=124. Visible silhouette: approximately x=293–398,y=36–158 (about 106×123 px). Name/age remains x=24,y=80,w=254,h=20; week strip remains x=24,y=120,w=382,h=56.
- Review tiles at both widths: y=694,h=74,bottom=768; fixed navigation begins y=785, giving 17 px clearance (required: 16 px). Public tiles also remain above navigation.
- Review fixture: all five rows render, 2/5 is shown, checkbox round-trip passes, and the banner remains fixed while scrolling. 375×667 scroll reaches the lower content. 140% text and reduced motion pass verifier checks, but the 13/14 week labels still sit over the dark portrait.
- Public captures have no synthetic review banner, task count, or checkboxes. FAQ/Checklistor entry points remain available; checklist content is not testable in this Home harness because no checklist client/dog is provided.
- Browser output reports no page errors.

## Commands and results

- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3/3.
- `pnpm check` — PASS; TypeScript and all 41 tests passed. ESLint reported 38 warnings and 0 errors.
- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-5-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-5-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-5/public python tools/visual-check/verify.py` — PASS at 375/430; states, navigation, reduced motion, and 140% text.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-5/review python tools/visual-check/verify.py` — PASS at 375/430; review fixture, geometry, toggles, banner, short viewport, navigation, reduced motion, and 140% text.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.

Public iOS export was not rerun for this browser-only crop adjustment; the previous correction-4 export passed. No product or visual harness files were changed by QA.

## Evidence

- Public screenshots: `public/home-ready-375.png`, `public/home-ready-430.png`, `public/home-large-text-reduced-motion-375.png`, `public/home-large-text-reduced-motion-430.png`.
- Review screenshots: corresponding files under `review/`, plus `review/home-review-fixture-scroll-375.png` and `review/home-review-fixture-scroll-430.png`.
- Verifier summaries: `public/browser-results.json` and `review/browser-results.json`.
- Reference: repository `vision_rev02.jpg`, panel 1.

No native device, production data, or backend behavior is claimed. R02-1 visual acceptance remains blocked by the week-strip contrast/overlap issue pending an approved same-scope correction and independent rerender.

# R02-1 independent QA — 64-band fade correction

Date: 2026-10-13
Verdict: **BLOCK** — the fade now looks smooth with no visible bands, but glyph-level color sampling still finds week labels over the portrait below 4.5:1: week 14 at both widths, plus week 12 at 375 px with 140% text. The strongly visible dog subject is also mostly its head/upper body; the lower body fades nearly to the background compared with the portrait in panel 1.

## §14 review

| # | Result | Evidence / finding |
|---|---|---|
| 1 | Ja | Logg, Träning, and Kunskap remain the three clear next actions. |
| 2 | Ja | The three destination tiles have equal visual weight and size at both widths. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | Home rows do not repeat edit/delete links. |
| 5 | Ja | Identity, week strip, content, and navigation boxes fit without layout collisions at 375/430. Review tile bottom is y=768; nav begins y=785, giving 17 px clearance. |
| 6 | Ja | Shared components and tokens remain in use. |
| 7 | Ja | Destination and row icons use consistent families. |
| 8 | **Nej** | Glyph-level rendered contrast falls below 4.5:1 for week 14 at all tested sizes (3.82 at 375 standard, 4.20 at 430 standard, 3.70 at 375/140%, 4.25 at 430/140%). Week 12 is 3.66 at 375/140%. Week 13 passes (minimum 5.58). Dots are visible but faint at 1.21:1. Exact foreground/background pixels are in `review/week-glyph-contrast.json`. |
| 9 | Ja | Tile labels and symbols match; tapping each selects Logg, Träning, or Kunskap. Mer exposes Hälsa and Tassla-pass. |
| 10 | Ja | Public has no synthetic completion controls/count. Review checkboxes are fixture-only; 2/5 → 1/5 → 2/5 toggling passes. |
| 11 | Ja | The synthetic review banner remains fixed while scrolling. |
| 12 | Ja | Copy remains concise and user-facing. |
| 13 | Ja | Greeting, helper content, daily rows, and actions retain the reference hierarchy. Portrait prominence is addressed under point 16. |
| 14 | Ja | Loading, empty, error, partial, and complete Home states were rendered at 375/430. |
| 15 | Ja | Browser checks pass reduced motion, 140% text, 375×667 scrolling, and navigation semantics. This is not native-device or VoiceOver certification. |
| 16 | **Nej** | The fade is now smooth, and the 120×124 frame is in the correct position, but high-contrast dog pixels occupy only about 100×59 px (x=244–343,y=36–94 at 375; x=299–398,y=36–94 at 430). The lower subject is washed almost entirely to cream to make the week row legible. Panel 1 shows a puppy portrait with the face and body both prominent. The current dark figure reads mostly as a head icon rather than a similarly weighted portrait, and week 14 still falls below 4.5:1 over the remaining faded subject. See review ready/large-text images compared with `vision_rev02.jpg` panel 1. |
| 17 | Ja | Main-tab selection, active state, and More destinations were checked. |
| 18 | Ja | Name/age are shown; the placeholder remains a decorative illustration, not an asserted owner photo. |

## Geometry, contrast, and visual comparison

- 375×844: portrait frame x=231,y=36,w=120,h=124; name/age x=24,y=80,w=199,h=20; week strip x=24,y=120,w=327,h=56.
- 430×844: portrait frame x=286,y=36,w=120,h=124; name/age x=24,y=80,w=254,h=20; week strip x=24,y=120,w=382,h=56. Name/age remain clear at both widths.
- The current week 11 pill is distinct. Labels 8–14 and their 8×8 dots remain present and visible. No obvious stepped bands remain in the screenshots.
- Contrast method: capture the same rendered page once with week text visible and once with only the week text made transparent; compare the actual glyph pixels to the underlying screenshot colors. The foreground is rgb(83,98,87). This avoids inferring contrast from a nearby pixel outside a glyph. Results: week 14 minimum 3.70–4.25 across tested combinations; week 12 at 375/140% 3.66; week 13 minimum 5.36. See `review/week-glyph-contrast-summary.json` and full raw bounds/pixels in `review/week-glyph-contrast.json`.
- Week dots are 8×8 px; rendered contrast against cream is 1.21:1. They remain visually discernible, though faint.
- Review destination tiles at both widths: y=694,h=74,bottom=768; nav top y=785; clearance 17 px (requirement 16 px). Public fit verifier passes too.
- Review fixture shows five rows and 2/5; checkbox round-trip passes; banner stays fixed. Content scrolls at 375×667. FAQ/Checklistor entry points remain available; checklist content is not testable in this Home harness because it passes no checklist client/dog.
- Official verifier outputs show no browser page errors.

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-7-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-7-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-7/public python tools/visual-check/verify.py` — PASS at 375/430; states, nav, reduced motion, and 140% text.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-7/review python tools/visual-check/verify.py` — PASS at 375/430; fixture, toggles, banner, short viewport, nav, reduced motion, and 140% text.
- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3/3.
- `pnpm check` — PASS; TypeScript and all 41 tests passed. ESLint reported 38 warnings and 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c7 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; exported `dist/ios`.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.

## Evidence

- Public captures: `public/home-ready-{375,430}.png`, `public/home-large-text-reduced-motion-{375,430}.png`.
- Review captures: the same files under `review/`, plus `review/home-review-fixture-scroll-{375,430}.png`.
- Glyph-level measurement images and data: `review/week-glyph-normal-*.png`, `review/week-glyph-underlay-*.png`, `review/week-glyph-contrast.json`, and summary JSON.
- Official verifier output: `public/browser-results.json`, `review/browser-results.json`.
- Reference: repository `vision_rev02.jpg`, panel 1.

No implementation, harness, queue, or plan files were changed by QA. Scoped blocker: the fade mask still leaves week 14 over enough of the illustration to miss contrast; lifting the fade enough to restore the lower portrait could worsen it. The same-scope correction needs to preserve both portrait prominence and ≥4.5:1 week text at 375/430 and 140% text. No native-device, production-data, or backend behavior is claimed.

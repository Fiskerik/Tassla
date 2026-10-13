# R02-1 independent QA — uniform opacity correction

Date: 2026-10-13
Verdict: **BLOCK** — text contrast now passes by a wide margin, but the portrait is substantially more muted than the target. The full figure fits inside the intended frame, yet its typical rendered silhouette-to-background contrast is only about 1.93:1; compared with the prominent warm puppy photo in panel 1, this reads as a faint gray watermark. §14 point 16 remains “Nej”.

## §14 review

| # | Result | Evidence / finding |
|---|---|---|
| 1 | Ja | Logg, Träning, and Kunskap remain the three clear next actions. |
| 2 | Ja | Destination tiles have equal size and visual weight at both widths. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | Home rows do not repeat edit/delete links. |
| 5 | Ja | Identity, week strip, sections, and fixed navigation fit without layout-box overlap. Review tiles bottom at y=768; nav top is y=785 (17 px clearance). |
| 6 | Ja | Shared UI components/tokens remain in use. |
| 7 | Ja | Destination and row icon families are consistent. |
| 8 | Ja, with note | Week text passes glyph-level contrast at all tested widths/scales (minimum 6.37:1; active week 11 is 6.55:1). Inactive 8×8 dots are visible but faint at 1.21:1; the reference also uses subtle gray markers. |
| 9 | Ja | Tile labels/icons match; each selects Logg, Träning, or Kunskap. Mer exposes Hälsa and Tassla-pass. |
| 10 | Ja | Public has no synthetic completion controls/count. Review-only fixture checkboxes toggle 2/5 → 1/5 → 2/5. |
| 11 | Ja | The synthetic review banner remains fixed while scrolling. |
| 12 | Ja | Copy is concise and user-facing. |
| 13 | Ja | Greeting, helper content, daily rows, and actions keep the target hierarchy. The illustration’s lower visual weight is assessed under point 16. |
| 14 | Ja | Loading, empty, error, partial, and complete Home states were rendered at 375/430. |
| 15 | Ja | Browser checks pass 140% text, reduced motion, 375×667 scrolling, and navigation semantics. This is not native-device or VoiceOver certification. |
| 16 | **Nej** | The image element is correctly placed at 120×124 and the recognizable dog silhouette spans about 110×124 px, but uniform 35% opacity reduces a typical filled silhouette pixel to rgb(170,179,162) against cream rgb(247,241,231), only 1.93:1. Panel 1’s golden puppy is a strong, full-color portrait that carries much more visual weight. The current figure reads as a pale watermark rather than a portrait of comparable prominence. See public/review ready screenshots beside `vision_rev02.jpg` panel 1. |
| 17 | Ja | Main-tab selection, active state, and More destinations were checked. |
| 18 | Ja | Name/age are present; the placeholder is decorative and not represented as the owner’s actual photo. |

## Geometry, contrast, and rendered behavior

- At 375×844, frame x=231,y=36,w=120,h=124; name/age x=24,y=80,w=199,h=20; week strip x=24,y=120,w=327,h=56.
- At 430×844, frame x=286,y=36,w=120,h=124; name/age x=24,y=80,w=254,h=20; week strip x=24,y=120,w=382,h=56. Name/age remain unobstructed.
- High-contrast figure pixels span approximately x=235–344,y=36–159 at 375 and x=292–399,y=36–159 at 430. Median sampled silhouette rgb(170,179,162) versus cream rgb(247,241,231) yields 1.93:1. Full bounds and the screenshots show that the shape occupies the slot, but its low opacity weakens its prominence.
- Glyph-level contrast was measured by comparing paired screenshots with the week text visible and temporarily transparent, then comparing each changed glyph pixel to its actual underlying rendered pixel. Weeks 8, 9, 10, 12, 13, and 14 all exceed 6.37:1 in standard and 140% renders. The current 11 pill is 6.55:1. See `review/week-glyph-contrast.json`, `review/week-glyph-contrast-summary.json`, and `review/current-week-contrast.json`.
- Week dots are 8×8 px and visibly distinguishable; inactive dot/background ratio is 1.21:1. Active week dot ratio is 5.83:1. Pixel results are in `review/week-dot-contrast.json`.
- Review tiles at both widths end at y=768; fixed navigation begins y=785, clearance 17 px versus required 16 px. Public fit checks also pass.
- Review fixture has five rows and a 2/5 count; checkbox round-trip works and banner stays fixed. The last content is reachable at 375×667. Public mode has no review banner/count/checkboxes. FAQ/Checklistor navigation remains; checklist content is not testable because the Home harness does not provide a checklist client/dog.
- No browser page errors were reported.

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-8-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-8-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-8/public python tools/visual-check/verify.py` — PASS at 375/430; states, nav, reduced motion, and 140% text.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-8/review python tools/visual-check/verify.py` — PASS at 375/430; review fixture, toggles, banner, short viewport, nav, reduced motion, and 140% text.
- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3/3.
- `pnpm check` — PASS; TypeScript and all 41 tests passed. ESLint reported 38 warnings, 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c8 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; exported `dist/ios`.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.

## Evidence

- Public screenshots: `public/home-ready-{375,430}.png` and `public/home-large-text-reduced-motion-{375,430}.png`.
- Review screenshots: the corresponding files under `review/`, plus `review/home-review-fixture-scroll-{375,430}.png`.
- Contrast captures/data: `review/week-glyph-normal-*.png`, `review/week-glyph-underlay-*.png`, `review/week-glyph-contrast.json`, `review/week-dot-contrast.json`, and current-week contrast JSON.
- Official verifier summaries: `public/browser-results.json` and `review/browser-results.json`.
- Reference: repository `vision_rev02.jpg`, panel 1.

No source, visual harness, queue, or plan files were changed by QA. The scoped blocker is portrait prominence: text now clears the contrast target, but the opacity setting makes the approved placeholder too faint relative to the reference. No native-device, production-data, or backend behavior is claimed.

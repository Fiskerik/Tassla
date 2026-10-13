# R02-1 independent QA — portrait correction-4

Date: 2026-10-13
Verdict: **BLOCK** — §14 point 16 fails on the visible portrait subject footprint. The portrait frame has the requested dimensions, but the illustration itself remains too small compared with panel 1 of `vision_rev02.jpg`.

## §14 review

| # | Result | Evidence / finding |
|---|---|---|
| 1 | Ja | Home presents the log, training, and knowledge destinations as the three clear next actions. |
| 2 | Ja | The three destination tiles have equal size and visual weight at both tested widths. |
| 3 | Ej tillämpligt | No delete action is present on Home. |
| 4 | Ja | Home rows do not repeat edit/delete links. |
| 5 | Ja | At 375×844 and 430×844, greeting, week strip, content, tiles, and fixed navigation fit without overlap. Standard review tiles end at y=768 and nav starts at y=785 (17 px clearance); public tiles end at y=748. |
| 6 | Ja | The Home composition uses the shared UI components and tokens. |
| 7 | Ja | The destination and row icons render consistently. |
| 8 | Ja | Destination/category color treatments are consistent and distinguishable in the captured views. |
| 9 | Ja | Tile symbols and labels match their destinations; Logg, Träning, and Kunskap select the corresponding tabs. Mer exposes Hälsa and Tassla-pass. |
| 10 | Ja | Public Home has no synthetic completion controls or count. Review checkboxes represent explicit local fixture completion; 2/5 → 1/5 → 2/5 toggling works. |
| 11 | Ja | The review banner remains visible while the list scrolls and is clearly marked synthetic. |
| 12 | Ja | Home copy is concise and user-facing. |
| 13 | Ja | The greeting, helpful content, task list, and destinations follow the reference hierarchy. The illustration scale issue is assessed separately under point 16. |
| 14 | Ja | Loading, empty, error, partial, and complete Home states were rendered at 375/430 where applicable. |
| 15 | Ja | Web verifier passed standard and 140% text checks, reduced motion, scrolling at 375×667, and navigation semantics. This is browser evidence, not native-device or VoiceOver certification. |
| 16 | **Nej** | The 120×124 px image element is correctly placed, but the visible dark-green dog silhouette is only about 59×78 px in the 375 and 430 captures (measured within the image frame; source illustration margins account for the difference). In panel 1 of `vision_rev02.jpg`, the portrait dog occupies nearly the full portrait area. The present figure reads as a small mascot inside a large pale square, not a portrait with comparable visual prominence. The target’s image role/scale is therefore not met. See `review/portrait-layout-375.png`, `review/portrait-layout-430.png`, and the reference `vision_rev02.jpg`. |
| 17 | Ja | Main tab selection and More destinations were checked; active tab follows the current destination. |
| 18 | Ja | The dog name and age are shown and the placeholder is decorative; it is not presented as the owner’s actual photo. |

### Comparison geometry

- 375×844: portrait frame x=231,y=36,w=120,h=124; visible dog silhouette approximately x=261–319,y=59–136 (59×78 px inclusive). Name/age x=24,y=80,w=199,h=20; week strip x=24,y=120,w=327,h=56. No name/age overlap.
- 430×844: portrait frame x=286,y=36,w=120,h=124; visible dog silhouette approximately x=316–374,y=59–136 (59×78 px inclusive). Name/age x=24,y=80,w=254,h=20; week strip x=24,y=120,w=382,h=56. No name/age overlap.
- Review initial destination tiles at both widths: y=694,h=74,bottom=768; fixed navigation top=785, giving 17 px clearance against the required 16 px.
- Review fixture: five rows visible; 2/5 count and checkbox round-trip pass; banner remains fixed. 375×667 scrolling, 140% text, and reduced-motion checks pass. Public captures contain no synthetic review banner, checklist/count, or completion controls.
- Checklist content could not be exercised in the Home visual harness because it supplies no checklist client/dog. FAQ and Checklistor entry points remain present; this is a harness limitation, not a claim that checklist content passed.

## Commands and results

- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS.
- `pnpm check` — PASS; TypeScript and all 41 tests passed. ESLint reported 38 existing warnings and 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c4 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; exported `dist/ios`.
- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-4-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-4-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-4/public python tools/visual-check/verify.py` — PASS at 375/430; public scenarios, reduced motion, 140% text, and navigation passed; no browser page errors.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-4/review python tools/visual-check/verify.py` — PASS at 375/430; review geometry, fixture, toggle, banner, short viewport, reduced motion, 140% text, and navigation passed; no browser page errors.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.

## Evidence

Fresh public and review renders are in `public/` and `review/` under this report directory. Portrait comparison captures are `review/portrait-layout-375.png` and `review/portrait-layout-430.png`; geometry is recorded in `review/portrait-geometry.json`. Official verifier output is in each mode’s `browser-results.json`. Reference: repository `vision_rev02.jpg`, panel 1.

No implementation or visual harness files were changed by QA. No native device, production data, or backend behavior is claimed. §14 point 16 blocks the R02-1 visual acceptance pending a same-scope portrait subject-scale correction and fresh independent review.

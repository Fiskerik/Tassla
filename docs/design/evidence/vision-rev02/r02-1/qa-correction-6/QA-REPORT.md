# R02-1 independent QA — cream fade correction

Date: 2026-10-13
Verdict: **BLOCK** — the cream fade restores the contrast of weeks 13/14, but the fade is visibly stepped and week 12 still falls below the required 4.5:1 text contrast in the 375 px, 140% text render. The required contrast check therefore does not pass across the complete 8–14 strip.

## §14 review

| # | Result | Evidence / finding |
|---|---|---|
| 1 | Ja | Logg, Träning, and Kunskap remain the three clear next actions. |
| 2 | Ja | Destination tiles have equal visual weight and size at both widths. |
| 3 | Ej tillämpligt | Home has no delete action. |
| 4 | Ja | Home rows do not repeat edit/delete links. |
| 5 | Ja | Name/age, week strip, Home sections, destinations, and fixed navigation fit at 375/430 without overlapping layout boxes. Review tiles end at y=768; nav starts y=785 (17 px clearance). |
| 6 | Ja | Shared components and tokens remain in use. |
| 7 | Ja | Destination and row icon families are consistent. |
| 8 | **Nej** | Rendered week-label foreground is rgb(83,98,87). On 375 px with 140% text, week 12 has only 3.57:1 contrast against adjacent rendered background rgb(189,195,179), below 4.5:1. Week 13/14 pass at 4.67:1 or better. Week dots are visible but faint: measured dot/background contrast is 1.21:1. See `review/week-contrast-summary.json` and raw `review/week-contrast.json`. |
| 9 | Ja | Tile labels and icons match their actions; the three tiles select Logg, Träning, and Kunskap. Mer exposes Hälsa and Tassla-pass. |
| 10 | Ja | Public mode has no synthetic completion UI. Review checkboxes are confined to the local fixture; 2/5 → 1/5 → 2/5 works. |
| 11 | Ja | The synthetic review banner remains fixed while scrolling. |
| 12 | Ja | Copy is concise and user-facing. |
| 13 | Ja | The portrait now has comparable visual prominence and does not collide with name/age. The stepped fade is assessed under point 16. |
| 14 | Ja | Loading, empty, error, partial, and complete Home states were rendered at 375/430. |
| 15 | Ja | Browser verifier passes reduced motion, 140% text, 375×667 scrolling, and navigation semantics. This is not native-device or VoiceOver certification. |
| 16 | **Nej** | The image now fills the portrait frame and weeks 13/14 sit on a cream fade, but the fade renders as conspicuous horizontal bands across the dog’s body rather than a smooth transition in panel 1 of `vision_rev02.jpg`. In addition, the narrow 375 px, 140% render leaves week 12 below 4.5:1. The composition still does not match the target cleanly. See `review/home-ready-375.png`, `review/home-large-text-reduced-motion-375.png`, and the corresponding 430 captures beside reference panel 1. |
| 17 | Ja | Main-tab selection, active state, and More destinations were checked. |
| 18 | Ja | Name/age are shown; the existing placeholder remains a decorative illustration and is not represented as the owner’s photo. |

## Geometry and measured contrast

- 375×844 identity: frame x=231,y=36,w=120,h=124; name/age x=24,y=80,w=199,h=20; week strip x=24,y=120,w=327,h=56.
- 430×844 identity: frame x=286,y=36,w=120,h=124; name/age x=24,y=80,w=254,h=20; week strip x=24,y=120,w=382,h=56.
- Visible dog outline fills approximately 106×123 px of the frame. Name/age stays clear. The active week 11 marker is distinct; 8–14 labels and dots remain present.
- Weeks 13 and 14: minimum adjacent-pixel rendered contrast is 4.67:1 at 375 and 430, with standard and 140% text. Weeks 8, 9, 10 and 12 are 5.75:1 at standard text. At 140%, week 12 is 3.57:1 at 375 and 5.75:1 at 430. The exact screenshot sample coordinates/colors and text bounds are in `review/week-contrast.json`.
- Week dots measure 8×8 px and are visibly distinguishable, but their rendered contrast is only 1.21:1 against the cream background. The source reference also uses subtle gray dots; record this as a low-contrast detail, not a text contrast pass.
- Review destinations at 375/430: bottom y=768; nav top y=785; clearance 17 px against the 16 px requirement. Public destinations also pass the initial-view geometry verifier.
- Review fixture shows five rows and 2/5; checkbox round-trip passes; banner remains fixed. 375×667 content is reachable by scrolling. Public screenshots contain no review banner, count, or checkboxes. FAQ/Checklistor navigation remains; checklist content is untestable in the Home harness because it provides no checklist client/dog.
- Official browser summaries show no page errors.

## Commands and results

- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-6-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-6-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-6/public python tools/visual-check/verify.py` — PASS at 375/430, including source states, navigation, reduced motion, and 140% text.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=docs/design/evidence/vision-rev02/r02-1/qa-correction-6/review python tools/visual-check/verify.py` — PASS at 375/430, including review rows/toggles/banner, short viewport, navigation, reduced motion, and 140% text.
- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3/3.
- `pnpm check` — PASS; TypeScript and all 41 tests passed. ESLint reported 38 warnings and 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c6 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; exported `dist/ios`.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.

## Evidence

- Screenshots: `public/home-ready-{375,430}.png`, `public/home-large-text-reduced-motion-{375,430}.png`, and corresponding files in `review/`.
- Week contrast details: `review/week-contrast.json` (raw bounds and sampled RGB values) and `review/week-contrast-summary.json`.
- Verifier summaries: `public/browser-results.json` and `review/browser-results.json`.
- Reference: repository `vision_rev02.jpg`, panel 1.

Scoped blocker: the HomeScreen fade leaves an insufficient cream background at the week-12 label in the narrow 140% render and uses visibly discrete bands. No product or harness files were changed by QA. A same-scope fade adjustment and fresh independent render are needed before point 8/16 can pass. No native device, production data, or backend behavior is claimed.

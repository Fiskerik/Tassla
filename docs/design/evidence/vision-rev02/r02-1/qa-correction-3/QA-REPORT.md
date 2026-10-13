# Independent QA — VISION-R02-1 correction 3

**Verdict: BLOCK on §14 visual acceptance.** The public and review Home first views now meet the 16pt destination clearance at both standard widths. The functional and responsive checks passed. Side-by-side comparison still finds the placeholder portrait occupies materially less visual space than the target portrait, against the R02-1 requirement to preserve the target’s image space; see §14 point 16.

## Standard first-view bounds

Nav starts at y=785 at both 375×844 and 430×844. Tile boxes below are x, y, width, height. All three tiles share the reported y and height in each mode.

| Mode / viewport | Tile boxes | Tile bottom | Nav top | Free space | Required | Result |
|---|---|---:|---:|---:|---:|---|
| Public 375×844 | Logga (24,674,103.7,74); Träna (135.7,674,103.7,74); Kunskap (247.3,674,103.7,74) | 748 | 785 | 37px | 16px | PASS |
| Public 430×844 | Logga (24,674,122,74); Träna (154,674,122,74); Kunskap (284,674,122,74) | 748 | 785 | 37px | 16px | PASS |
| Review 375×844 | Logga (24,694,103.7,74); Träna (135.7,694,103.7,74); Kunskap (247.3,694,103.7,74) | 768 | 785 | 17px | 16px | PASS |
| Review 430×844 | Logga (24,694,122,74); Träna (154,694,122,74); Kunskap (284,694,122,74) | 768 | 785 | 17px | 16px | PASS |

These are initial, unscrolled measurements. The review 4pt fixture gap makes the required margin pass by 1px at both widths.

## Scroll, review and navigation checks

- Official Home verifier passed in public and review at 375px and 430px.
- Review starts with five fixture rows and 2/5. Toggling the first checkbox changes 2/5 → 1/5 → 2/5. This is local fixture state only.
- Review banner remains fixed outside Home scroll content. Its container is 32px high at standard text; at 140% its label grows from 20px to 28px within that container. No clipping was observed.
- At 375×667 the last destination can be scrolled into view above nav; the banner remains fixed in review.
- With reduced motion and 140% text at both widths, horizontal overflow is absent and destination actions can be scrolled above nav. Large-text initial layouts are expected to scroll and were not treated as standard first-view failures.
- Home tile actions select Logg, Träning and Kunskap. More exposes Hälsa and Tassla-pass. FAQ content opens. The Checklistor tab remains available/clickable; checklist content is **NOT TESTABLE** in this web harness because the harness does not pass a checklist client/dog.
- Public has no synthetic banner, fixture rows, 2/5 count, or checkboxes. The review training example and temporary label are absent in public and visible in review.
- Browser page errors: none.

## §14 review

| # | Result | Finding |
|---:|---|---|
| 1 | Yes | Home has a clear next step and the three destinations remain equal secondary actions. |
| 2 | Yes | All three destination tiles have equal height, treatment, and visual weight. |
| 3 | N/A | No delete action on Home. |
| 4 | Yes | Home rows do not show repeated edit/delete actions. |
| 5 | Yes | Safe nav clearance is 37px public and 17px review in the standard initial view; scrolling works at short height and large text. |
| 6 | Yes | Shared token-based card, row, navigation, and destination components are used. |
| 7 | Yes | Destination and row icons use the verified Ionicons family; log, training and knowledge meanings are distinguishable. |
| 8 | Yes | Log, training and knowledge surfaces use consistent category colors. Visual contrast is clear; a numeric contrast audit was not part of this render run. |
| 9 | Yes | Labels and actions agree; each destination selects its expected tab. |
| 10 | Yes | Public has no synthetic completion state or badges; review checkboxes and count are clearly fixture-only. |
| 11 | Yes | Only review mode shows the fixed synthetic banner; no unsupported celebratory claim is shown. |
| 12 | Yes | Swedish copy is concise and user-facing. |
| 13 | Yes | Greeting, dog name, age, current guidance, task rows and destinations have a clear hierarchy. |
| 14 | Yes | Home loading, error, empty, no-program, all-complete and review fixture states were rendered. |
| 15 | Yes, web scope | 44px row/detail/checkbox targets and 74px destination tiles; reduced motion and 140% text were exercised. Native VoiceOver/Dynamic Type were not assessed. |
| 16 | **No** | The 375px public render uses a roughly 76×80px square illustration at the upper right. The target panel’s portrait occupies roughly 120×125px when scaled to the same panel width. The approved placeholder is the correct safe image role, but its visible footprint does not meet the plan’s “same visual space” requirement and reduces the portrait’s compositional weight. |
| 17 | Yes | Five main tabs remain in order; destinations select the matching tab and Health/Passport remain reachable from More. |
| 18 | Yes | The real dog name/age are shown. The placeholder is an illustration and is not presented as the owner’s photo. |

Because §14 point 16 is No, overall visual acceptance remains blocked despite the fit and behavior passes. The illustration is a documented content-role fallback; the remaining difference is its visible scale.

## Exact commands and outcomes

- `node --experimental-strip-types --test tests/home-vision.test.mjs tests/home-greeting.test.mjs tests/ui-library-policy.test.mjs` — PASS, 3 files.
- `pnpm check` — PASS, 41 tests; 38 lint warnings, 0 errors.
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-v8c3 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — PASS; public Expo export completed.
- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-3-public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/vision-r02-1-correction-3-review node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=false TASSLA_UI_EVIDENCE=/workspace/Tassla/docs/design/evidence/vision-rev02/r02-1/qa-correction-3/public python tools/visual-check/verify.py` — PASS, initial geometry at 375/430 and remaining public Home checks.
- `TASSLA_UI_SCOPE=home TASSLA_UI_REVIEW=true TASSLA_UI_EVIDENCE=/workspace/Tassla/docs/design/evidence/vision-rev02/r02-1/qa-correction-3/review python tools/visual-check/verify.py` — PASS, initial geometry before scrolling at 375/430 and review checks.
- Custom Chromium matrix `QA_MODE=public|review QA_OUT=... python /tmp/r02_1_v8_matrix.py` — PASS for checked fixture behavior/navigation; it records initial and large-text measurements in each mode’s `matrix.json`. Checklist detail content is limited by missing harness client/dog.
- `git diff --check && python tools/dev_flow.py validate` — PASS.

## Screenshots

- Public: `public/home-initial-375.png`, `public/home-initial-430.png`, `public/home-large-text-reduced-motion-375.png`, `public/home-large-text-reduced-motion-430.png`, `public/home-short-scrolled-375.png`, `public/home-navigation-more-375.png`.
- Review: `review/home-initial-375.png`, `review/home-initial-430.png`, `review/home-review-scrolled-375.png`, `review/home-large-text-scrolled-375.png`, `review/home-large-text-scrolled-430.png`, `review/home-short-scrolled-375.png`, `review/home-knowledge-checklist.png`.
- Exact initial bounds and banner ancestry: `public/matrix.json`, `review/matrix.json`.

No device, native runtime, production database or backend behavior was assessed. Prior correction-2 failure evidence remains unchanged in its separate folder.

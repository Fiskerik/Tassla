# Independent QA — FLOW-HOME-CHECKLIST-01 v7

**Verdict: CHANGES — functional integration passes; visual closeout cannot be marked done.**

## Independent reruns

The fresh public and review bundles in %TEMP%\tassla-panel4-integration-v7 were served on loopback ports 4271 and 4272. All eight browser runs passed:

| Mode | home-checklist | checklist-all | checklist-week | r3c-upcoming |
|---|---:|---:|---:|---:|
| public | 5/5 | 16/16 | 7/7 | 12/12 |
| review | 5/5 | 16/16 | 7/7 | 12/12 |

Every fresh manifest has pageErrors: []. The two R3c manifests also have blockedNetworkRequests: []. Screenshots and manifests are in qa/{public,review}/{scope}/; the run log is [qa/independent-rerun.log](qa/independent-rerun.log).

Other fresh checks:

- Focused Node command from the plan: 56/56 passed.
- pnpm check: exit 0, typecheck, edge typecheck and lint passed; 581/581 tests passed.
- python -m py_compile tools/visual-check/verify.py: exit 0.
- python tools/dev_flow.py validate: exit 0; queue status was not changed.
- git diff --check: exit 0; Git printed only line-ending normalization warnings.

## Artifact and visual review

I reviewed all eight stored canonical manifests and inspected contact sheets for all 110 canonical browser screenshots across public/review, plus the new reference crop, both composites, SECTION14.md, and representative fresh rerun screenshots. The crop is the correct Panel 4 region; the side-by-side comparison preserves the reference aspect ratio and compares app-content height after excluding the 44 px synthetic banner.

The functional claims are supported by the synthetic RN Web runs. The visible §14 “Nej” findings are also supported: the current checklist repeats generic paw chips, uses mostly unboxed rows and separators, leaves a large lower viewport empty after the training row, and differs in color distribution, typography, metadata hierarchy and composition from the reference's grouped cards and upcoming section. The fourth Kommande segment and active Hem parent also differ from the reference's three segments and active Logg. These visible differences are not resolved by passing interaction tests. The read-only integration must remain open for a separately planned/reviewed visual correction.

Reference and current images: [vision-rev02-panel4-reference-crop.png](vision-rev02-panel4-reference-crop.png), [panel4-today-public-vs-reference.png](panel4-today-public-vs-reference.png), and [panel4-today-review-vs-reference.png](panel4-today-review-vs-reference.png). Full ratings are in [SECTION14.md](SECTION14.md).

Two evidence caveats:
1. README.md says all eight manifests report zero blocked requests, but six Home/All/Week manifests have no blockedNetworkRequests field, and the verifier installs its exact-origin request guard only for r3c-upcoming. Limit that zero-request claim to R3c or add equivalent instrumentation for the other scopes before asserting it.
2. The 140% R3c screenshot keeps Kommande visible but shows only the trailing “g” of Denna vecka at the left edge. The current assertion checks the active tab bounds, not the neighboring segment labels. Assess this clipping in the visual follow-up.

## Limits

Fixtures and callbacks are synthetic; these runs do not verify live Supabase/RLS, applied migration parity, native iOS/Android, VoiceOver, device Dynamic Type, app resume, or installed-app behavior. No product/test/fixture files or queue status were changed by this QA.

## Coordinator evidence correction — 2026-10-18

The evidence summary was corrected: only the two R3c manifests assert `blockedNetworkRequests: []`; Home/All/Week do not record that field. The §14 checklist now records the 140% neighboring-tab clipping as a web visual failure under points 15 and 17, while native accessibility remains NOT TESTABLE. The original QA findings above remain preserved.


## Coordinator correction after independent Reviewer recheck

The original QA note above (including its summary reference) misidentifies the clipped tab. A fresh independent Reviewer rechecked the 140% public/review screenshots: only the final “g” of the leftmost `Idag` label is clipped; `Denna vecka` is fully visible. The clip itself is confirmed and remains a visual finding under §14 points 15 and 17. The active SECTION14, parent plan, and queue wording has been corrected; the original QA wording is retained here as audit history.

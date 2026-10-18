# Independent QA — FLOW-PROGRESS-01 SVG ring v1.3

Date: 2026-10-18<br>
Scope: R6 ring rendering and the SVG-specific evidence amendment only. Product code was not changed.

## Verdict

**PASS — SVG rendering and state/accessibility behavior reviewed.** The current rendered output is a continuous SVG circle, not the earlier 360-rectangle ring. The fresh synthetic browser evidence shows correct geometry and truthful states at 375 px and 430 px.

**CHANGES before amendment closeout:** active R6 documentation still describes the old segmented ring/no-dependency implementation. Also, this QA does not approve the new `react-native-svg` runtime dependency or the v1.3 amendment. The plan labels those as pending owner and Architect gates; they must be resolved separately.

## Acceptance review

| Criterion | Result | Evidence |
| --- | --- | --- |
| Current browser output uses SVG circles, not positioned segment rectangles | PASS | `capture-evidence.mjs` queries the live `[data-testid="daily-progress-ring"] circle` nodes and reads their strokes, width, dash array, offset, and rotation. Manifest has 2 circles for known states and 3 for unknown states. The capture runner's `smoothSvgRing` assertion requires the 12 px circle stroke and -90° green-ring rotation. |
| Half and full known progress | PASS | At both widths, half-known is 3/6 with a green dash of [314.159265, 314.159265] on a 628.318531 circumference (180°). Full-known is 6/6 with an undashed full green circle. Both expose `progressbar` and a numeric accessible label. |
| Partial and full confirmed progress with unknown status | PASS | At both widths, partial is 3/5 on the 351° confirmed arc: green dash [367.566340, 260.752190]. Full confirmed plus unknown is 5/5 over 351°: [612.610567, 15.707963]. The amber dash is 8° ([13.962634, 614.355897]) and begins after the separate 1° gap (offset -614.355897). Both states disclose the unavailable activity and omit progressbar semantics. |
| Ring contour and size | PASS | I inspected all eight fresh review screenshots: half-known, full-known, partial-unknown and full-known-plus-unknown at 375×844 and 430×844. The green/track/amber contours are smooth and visually sharp; no scalloped or stepped edge is apparent. Source sets a 220 px SVG, radius 100 px and 12 px stroke. |
| Stale/refresh-error truthfulness | PASS | The fresh stale-state interaction and new 430×844 public/review captures show a neutral track-only ring, em dash/last-confirmed context, no progressbar, and no overflow. Both new entries pass staleDisclosure, neutralStaleCount, noProgressbar, noOverflow, and smoothSvgRing; screenshots: public/public-daily-progress-stale-430x844.png and review/review-daily-progress-stale-430x844.png. |
| Count/list semantics and interaction regression | PASS | `pnpm exec node --experimental-strip-types --test tests/daily-progress-ui.test.mjs`: 5/5 passed. Tests cover shared snapshot/date/state/write/retry wiring, count/ring/list parity, synthetic route and refresh. Browser matrix records the 5 interaction flows. |
| Responsive and error-state browser evidence | PASS | Latest browser-results.json: 26 viewport/state cases + 5 interactions, captured with reduced motion; no failures, page errors or blocked requests. Public/review layouts include 375×844, 430×844, 375×667 and a 140% browser text proxy. Eight review state captures directly inspect half/full/partial/unknown SVG geometry at 375/430; the two new public/review stale captures directly verify the neutral SVG ring at 430. |
| Queue and whitespace checks | PASS | Independently ran `python tools/dev_flow.py validate` and `git diff --check`; both exited 0. Git printed line-ending normalization warnings for existing working-copy files, but no diff-check errors. |
| Full suite and iOS review bundle | PASS (recorded, not rerun here) | Latest implementation report records `pnpm check` at 618/618 and `pnpm bundle:ios` success at 1,564 modules with the current R6 dependency draft. I did not rerun these two broader commands for this independent visual checkpoint. |

## Documentation discrepancy to resolve

The current implementation is SVG, while these active R6 descriptions still document the prior segmented/no-new-dependency version:

- `docs/features/daily-progress.md` describes 360 tangential strips.
- `docs/plans/FLOW-PROGRESS-01-ux-spec.md` specifies strips and says no rendering dependency.
- `docs/design/evidence/vision-rev02/daily-progress/SECTION14.md` still claims 360 green segments / 180 half-ring segments.
- `docs/design/evidence/vision-rev02/daily-progress/README.md` still says exact green segment counts are checked.

These should be reconciled with v1.3 (or clearly labeled as superseded) before closing the amendment. Historical QA reports can remain historical if their checkpoint/version is explicit.

## Limits and gates

- All screenshots and browser interactions use synthetic React Native Web fixtures. They do not prove live Supabase writes/readback, RLS behavior, or production account data.
- Native iOS/Android VoiceOver, real Dynamic Type, physical safe-area behavior, and TestFlight rendering were not tested. The 140% capture is a web text-size proxy.
- This report verifies technical SVG behavior only. `react-native-svg` remains an unapproved runtime dependency under the v1.3 plan, and this report is not the required owner dependency decision or Architect approval.

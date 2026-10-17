# FLOW-HOME-CHECKLIST-WEEK-01 — evidence, 2026-10-17

Task plan: [FLOW-HOME-CHECKLIST-WEEK-01.md](../../../../../tasks/dev/FLOW-HOME-CHECKLIST-WEEK-01.md), v3. Branch `codex/mvp-v2-panel4-checklists-2026-10-16`. This checkpoint is grouped with R2a and R3a for the requested same-branch batch. The visual reference is [vision_rev02.jpg](../../../../../../vision_rev02.jpg); public and review evidence is saved in [public](public/) and [review](review/).

Independent gates passed for this scoped local checkpoint: [QA report](qa/QA-REPORT.md), [Security review](security/SECURITY-REVIEW.md), and [Reviewer report](review/REVIEW-REPORT.md). `pnpm check` passed 557/557 after the final scope fix. This closes only R3b's local weekly slice, not full Panel 4 or native/live integration verification.

## Evidence in this checkpoint

- Public and review React Native Web builds use synthetic fixture data and callbacks. Each `browser-results.json` records 7 passes, zero browser page errors, the viewport matrix and limitations.
- The browser checks seven 44×44 pt date targets at 375×844, 430×844 and 375×667, with text/background contrast at or above 4.5:1. It also covers read-only history, missing history, timezone mismatch, separate read errors, ignoring raw weekly data for today, exact current-day training open/return, and confirmed completion/unmark/reset readback into daily and weekly totals.
- Both bundles include a 140% web text proxy. Inspect screenshots beside the reference before claiming full Panel 4 visual acceptance.
- Model/data focused tests exercise ISO civil dates at DST/year/month/week edges, selected snapshot authority, exact training source, read-only dog/date query projections and scope-fence rejection when owner/account generation/dog/current local date/week start/timezone/daily snapshot version/public-review mode/generation/abort/mounted state changes.

The visual run exercises the production checklist screen and synthetic callbacks. It does not execute ProductWorkspace's actual Supabase callbacks or prove live RLS. App resume, real local-midnight transition, account/dog switching, iOS/Android native semantics, VoiceOver, physical Dynamic Type, safe area, TestFlight and the installed app remain **NOT TESTABLE** in RN Web.

## Screenshot index

| State | Public | Review |
|---|---|---|
| Week, 375×844 | [PNG](public/checklist-week-ready-375x844.png) | [PNG](review/checklist-week-ready-375x844.png) |
| Week, 430×844 | [PNG](public/checklist-week-ready-430x844.png) | [PNG](review/checklist-week-ready-430x844.png) |
| Week, 375×667 | [PNG](public/checklist-week-ready-375x667.png) | [PNG](review/checklist-week-ready-375x667.png) |
| Historical read-only row | [PNG](public/checklist-week-historical-read-only-375x844.png) | [PNG](review/checklist-week-historical-read-only-375x844.png) |
| Missing day / timezone mismatch | [browser results](public/browser-results.json) | [browser results](review/browser-results.json) |
| Weekly read error | [PNG](public/checklist-week-read-error-375x844.png) | [PNG](review/checklist-week-read-error-375x844.png) |
| Current-day daily read error | [PNG](public/checklist-week-today-error-375x844.png) | [PNG](review/checklist-week-today-error-375x844.png) |
| Exact current training target | [PNG](public/checklist-week-today-exact-training-375x844.png) | [PNG](review/checklist-week-today-exact-training-375x844.png) |
| 140% web text proxy | [PNG](public/checklist-week-large-text-140-375x844.png) | [PNG](review/checklist-week-large-text-140-375x844.png) |

## Design-rules §14 checklist

| Point | Status | Evidence / boundary |
|---|---|---|
| 1. Primary action and next step | Ja | Select one of the seven dates; selected day details follow. [Week view](public/checklist-week-ready-375x844.png) |
| 2. Equal actions have equal weight and size | Ja | Seven date targets are measured at ≥44×44 pt in all three mobile viewports. |
| 3. Delete separation and confirmation | Ej tillämpligt | The week reader adds no delete action. |
| 4. Home-row action density and single detail route | Ja | Historical/future week rows are static; only today's exact training row has an open action. [Historical](public/checklist-week-historical-read-only-375x844.png) |
| 5. Spacing, sections, safe area and margin | Ja i RN Web; native NOT TESTABLE | Three viewport screenshots and horizontal-overflow assertions; safe-area/device behavior needs a native run. |
| 6. Shared tokens and components | Ja | Existing Tabs, Button, IconChip, MessageCard, Typography and semantic color tokens are reused; selector gap derives from spacing token. |
| 7. Icon family and symbols | Ja | Existing IconChip/Ionicons; no new icon assets. |
| 8. Color distribution and contrast | Delvis | Date label contrast is measured ≥4.5:1. Exact color distribution against a dedicated weekly reference is NOT TESTABLE because the reference contains no weekly state. |
| 9. Symbol, label and action agree | Ja | Accessible date labels match weekdays; the only training action names the exact current step. |
| 10. Truthful status and confirmed completion | Ja | Confirmed totals update after readback; missing, empty, skipped, unknown, timezone mismatch and error remain separate. |
| 11. Banners and encouragement | Ja | No production banner or decorative encouragement is added; synthetic fixture banner is outside the product screen. |
| 12. Plain, correct copy | Ja | Swedish loading/error/missing/unknown copy describes the result without backend terminology. |
| 13. Copy, metadata and image hierarchy | Delvis | Dog/date context and saved routine/program labels render; weekly state has no dedicated reference content or image treatment. |
| 14. Loading, empty, error, partial and save states | Ja för berörda lägen | Weekly read error, today's read error, missing day, confirmed empty, unknown and timezone mismatch are tested. No week write/save state exists. |
| 15. 44×44, screen reader, large text and reduced motion | Delvis | RN Web target sizes, roles/labels, contrast and 140% text proxy pass; browser uses reduced motion. Native VoiceOver, Dynamic Type and touch are NOT TESTABLE. |
| 16. Reference composition, color, typography, shape, imagery and density | NOT TESTABLE för full panelmatch | The reference image has no dedicated weekly state. Screenshots document this implementation but cannot prove pixel/semantic match for an absent target. |
| 17. Headings, tabs, active parent and return | Ja i RN Web | Week tab, selected date and selected day persist after exact training return; Home remains the active parent. Native navigation is NOT TESTABLE. |
| 18. Dog context and relevant content | Ja för fixture; real account NOT TESTABLE | Synthetic dog name, week range, saved snapshots and exact training source render. No real dog account is read. |

## Focused commands

```powershell
pnpm exec node --experimental-strip-types --test tests/daily-activity-data.test.mjs tests/daily-activity-model.test.mjs tests/daily-activity-ui.test.mjs
pnpm check
python -m py_compile tools/visual-check/verify.py
python tools/dev_flow.py validate
git diff --check
```

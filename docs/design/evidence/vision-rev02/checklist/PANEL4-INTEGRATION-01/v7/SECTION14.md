# Design-rules §14 — Panel 4 v7

**Date:** 2026-10-18\
**Reference/current scale:** `vision_rev02.jpg` Panel 4 crop `(916,7,292,740)` → proportional 316×800; current app viewport 375×800 from the 375×844 RN Web capture after excluding its 44 px synthetic-fixture banner. Public and review screenshots and side-by-side composites are linked in [`README.md`](README.md). RN Web has no OS status bar/safe-area chrome; scale comparison is app-content height, not device chrome.

Answers use the rulebook's Ja/Nej/Ej tillämpligt; missing device evidence is `NOT TESTABLE`. The scope covers Home's daily checklist entry and the full daily Checklist surface.

| # | Status | Evidence / reason |
|---:|---|---|
| 1 | Ja | The checklist's completion checkboxes are the main user task; routine management and row details remain secondary. The active screen is clear, although repeated `Visa` labels are a visible reference delta covered below. |
| 2 | Ja | The four current segment controls use consistent height and selection treatment; same-kind row actions are consistent. |
| 3 | Ja | Destructive routine deletion is confined to the manager and separately styled/confirmed; Alla's delayed-delete scenario also verifies that a stale confirmation cannot write after expiry. See public/review `checklist-all` manifests. |
| 4 | Ja | On Home, rows have no category icons or repeated `Visa`/`Ändra`/`Ta bort` text links. The fresh `home-progress-unavailable-375.png` shows a single `Visa alla` path and a separate `Hantera` entry. Full-screen Checklist is a separate detail surface. |
| 5 | Nej | Current Checklist leaves a large lower viewport empty after one training row; the reference uses that space for a distinct upcoming section with three cards. The 375×800 app-only comparison is saved. |
| 6 | Ja | `DailyChecklistScreen` uses shared UI components (`AppBar`, `DailyActivityItem`, `ListRow`, `SectionHeader`, `Tabs`) and `tokens` for typography, spacing, colors, touch sizes and card shapes. |
| 7 | Nej | Current routine rows repeat the same footprint glyph for unlike tasks (kiss, water, leash, walk, paw cleaning); the reference uses task-relevant colored symbols. |
| 8 | Nej | The current screen is mostly flat warm beige/green with repetitive pale-yellow paw chips. Reference status and upcoming areas distribute green, blue, yellow, orange and purple across distinct surfaces and symbols. |
| 9 | Nej | The generic footprint does not describe each routine's label/action. Other navigation icons and labels are coherent. |
| 10 | Ja | Green checks represent completed rows; unchecked rows have no completion badge. Checklist state remains sourced from confirmed progress in the tested flows. |
| 11 | Ja | The synthetic fixture banner is excluded as harness chrome; the app viewport contains no noisy promotional banner or unsupported encouragement claim. |
| 12 | Ja | Visible Swedish copy is concise and everyday (`3 av 6 klara`, `Hantera rutiner`, `Visa`). No internal runtime/debug text is present in the app viewport. |
| 13 | Nej | Metadata and content hierarchy diverge: the current `Luna · 2026-10-11` line and single training row replace the target's compact in-card daily summary and upcoming section. |
| 14 | Ja | Public/review captures and manifests cover ready, loading, empty, read error, partial/unknown, expired/read-only, recovery and reset states across the four scopes. |
| 15 | Nej (RN Web 140%); native NOT TESTABLE | The 140% `r3c-upcoming` screenshot shows the leftmost `Idag` segment clipped at its final letter (“g”); the `Denna vecka` label remains fully visible, even though the active Kommande tab remains within its checked bounds. Web scenarios verify 44 pt date targets, accessible browser roles and reduced-motion behavior. Native hit targets, VoiceOver, device Dynamic Type and installed-app behavior were not exercised. |
| 16 | Nej — overall | The direct side-by-side comparison does not match the Panel 4 composition. Separate subcriteria follow. |
| 17 | Nej | The target shows Idag/Denna vecka/Alla and Logg active. Current adds the approved Kommande tab and keeps Hem active because Checklist is a Hem detail. At 140% text, the leftmost Idag label is clipped at its final “g”; Denna vecka remains fully visible, and only active Kommande bounds are asserted. These are visible deviations from the specific reference. |
| 18 | Ja | The current checklist is scoped to the displayed dog (`Luna`) and shows its routine/training items. The reference contains no dog portrait on Panel 4; no portrait is required here. |

## Point 16 — separate visual criteria

| Criterion | Status | Evidence |
|---|---|---|
| Composition | Nej | Current list and one training row occupy the upper half; the lower area is empty. Reference places daily checklist and upcoming cards in separate rounded sections through most of the viewport. |
| Color distribution | Nej | Current repetitive pale-yellow chips and green text/selection do not reproduce the reference's varied colored status/upcoming surfaces. |
| Typography | Nej | The current detail labels (`Visa`, routine names and subtitles) have a different hierarchy and weight distribution from the compact target rows and in-card summary. |
| Component shapes | Nej | The target groups progress, routine rows and upcoming items into rounded white cards; current Today view uses a segmented header and mostly unboxed rows with separators. |
| Imagery | Nej | The target uses distinct task-relevant colored symbols; current routine rows reuse a generic footprint glyph. |
| Content density | Nej | Current viewport ends after one training row with substantial unused space; target includes the upcoming section and three entries. Fixture totals are intentionally not compared as product truth. |

## Separate outcome statuses

- **Function:** locally verified in the synthetic public/review matrix; all 8 manifests pass (5/16/7/12 assertions per mode), empty `pageErrors` in all eight manifests; only the two R3c manifests additionally record empty `blockedNetworkRequests` (the other six do not instrument this field). Focused tests 56/56 and full `pnpm check` 581/581 pass.
- **Visual similarity:** `Nej` for direct Panel 4 match; §14 has explicit findings above. Parent v7 cannot close as a visually matching Panel 4 delivery until a separately planned and reviewed correction addresses the visible deltas or the owner narrows the target. This integration was read-only, so no production UI change was made.
- **Production data/runtime:** `NOT TESTABLE` for live Supabase/RLS, migration parity, native iOS/Android, VoiceOver/device Dynamic Type and installed app.

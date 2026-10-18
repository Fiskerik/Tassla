# UI-TRAINING-OVERVIEW-01 — UX-spec v3

## Goal and entry
From the Träning tab, quickly identify the next allowed exercise and resume the correct published program for the active dog. Data enters through the existing `PublishedTrainingScreen` props from `ProductWorkspace`.

## Journey
1. Scan `Nästa övning`; tap `Öva nu` to open the current step sheet.
2. Browse `Era program`, where in-progress items precede new and complete programs. Tap a program to see its version-bound exercise path.
3. Open any step to read it; the next incomplete step is explicitly labelled “Nästa övning”; completed and upcoming steps have textual status labels. Only the first incomplete step can be completed. Read program details and sources separately; go back to the program or overview.
4. Successful completion keeps existing confirmed persistence/toast behavior; reset remains confirmed, and unmark retains the existing separate action.

## States and behavior
- Empty fetched program list, zero-step program(s), all complete, unknown dog age, paused historical version, loading/error/retry, pending/failed/unknown completion, success, and review-only synthetic examples remain distinct. A zero-step program is never called complete; the all-complete message requires at least one program with steps and every listed program to have steps that are all complete.
- Status/count/percentage/reset-visibility helpers use only current-version step IDs and never mutate source arrays; stale-only progress displays 0 and no reset button. Stable sorting preserves source order within each status. Navigation state is local and does not write progress.
- Review progress stays in memory and review copy remains visible. Public data still comes only through the existing published loader.
- Accessibility labels name the exercise/program; all controls continue using shared `Button`, `Card`, `ListRow`, `Progress`, `AppBar`, and `BottomSheet` components and token sizing.

## Reference comparison and owner-approved direction

Deviation `DEV-UI-TRAINING-OVERVIEW-01` records the owner-approved Panel 6 composition override in the task plan. The task must not report the full Panel 6 visual acceptance as passed.
The attached patch explicitly removes the panel's three tabs, image-top recommendation grid and continue card. It replaces them with a next-exercise card and a status-grouped program list, then a readable exercise path. This is an owner-requested layout change from `vision_rev02` Panel 6. We keep it within this patch and do not claim panel-level visual approval; QA records both conformity to the requested direction and the remaining panel-contract deviation.

| Reference/requested element | Current | Change | Acceptance |
|---|---|---|---|
| Immediate next step | Tabs/cards/current selected program | One prominent `Nästa övning` action | Opens first incomplete step |
| Program discovery | Three overlapping tabs | `Era program` status-ordered list | All fetched items reachable |
| Program progression | Flat exercise rows in overview | Program detail with current exercise card and readable done/upcoming rows | Existing sequential completion guard retained |
| Review/progress feedback | Confirmed save and local review behavior | Same callbacks and guards under new presentation | No optimistic or cross-dog progress |

## Files and verification
Exact write paths and commands are in `docs/tasks/dev/UI-TRAINING-OVERVIEW-01.md`. Render and compare the production screen at 375×844, 430×844, 375×667 and 140% browser zoom; save public/review overview and program-detail captures plus a §14 assessment in the task evidence folder. Capture the scenario states supported by the production fixture. This visual gate is required for the M-risk task: a renderer/capture failure keeps QA blocked, never PASS/done, and prevents the completion commit/push.

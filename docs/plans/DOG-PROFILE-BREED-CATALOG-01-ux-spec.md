# Breed catalog + R6/R7 — UI/UX review v7.1

Status: v7 baseline was reviewed and approved. This v7.1 amendment adds a narrow AppScreen route-scroll restoration exception for a reproduced R7 regression; Architect APPROVE received 2026-10-18 for the exact added code/test paths; implementation may proceed.

## Shared design rules

- Follow `docs/design-rules.md` and section 14. Keep the current navigation model, real source data, clear loading/empty/error/retry states, readable text at 140%, accessible actions, and existing warm Tassla palette.
- Keep each new detail as a route pushed from its source screen. Give it a visible Back action, preserve the parent route's existing scroll/date state, and keep the parent tab selected in bottom navigation.
- No new dependency, global color changes, or decorative graph without accessible numbers.

## Breed catalog — registration and profile editor

### User task and entry

Choose the dog's breed during registration or change a saved breed from profile editing.

### Composition and behavior

- A compact field shows the currently selected breed and a down-chevron. It opens a modal headed “Välj ras” with search, a virtualized alphabetic list and an explicit close action.
- “Blandras” is first and selected by default for new dogs. Other FCI source names are alphabetized using Swedish collation. The editor starts on the saved value.
- Search is case/diacritic-insensitive. The user can select only a catalog ID; text typed into search can never be saved.
- Loading, load error/retry, successfully empty catalog, and no matching search have distinct copy and recovery actions. No-match says “Ingen träff i FCI-listan” and offers explicit “Okänd ras” and “Blandras” actions; it does not imply the FCI list covers every recognized breed.
- Modal has accessible open/current value, search, clear, close, selected state and selection labels. Focus enters the search input and returns to the opener on dismiss. Keep `FlatList` out of any same-direction `ScrollView`/sheet nesting.
- Keep the registration submission/recovery states and profile edit readback/conflict behavior intact. Verify the selected `breed_id` reaches the existing registration operation and saving/success/failure/unsure recovery remain functional.

### Visual verification

Check at 375/430 px and 140% text proxy: closed field, modal top/keyboard, scrolling long catalog, accented search results, selected value, no match, empty catalog, load retry, and profile editor layout. Verify no clipped modal footer or list nested-scroll conflict.

## R6 — Panel 3, Daily progress

### User task and entry

From Home, open a full view of today's confirmed routine/training activities and return to the same Home scroll position.

### Composition and behavior

- Header with visible back action and centered “Dagens framsteg”. A prominent ring and text use the exact `dailyActivities` summary from Home. Under it show “Det här har ni gjort idag” and the complete list in that same order and population.
- A ring is complete only when the full underlying snapshot is ready and every relevant status is known. Training completion time may use its exact `completedAtByStepId` source; a routine-day timestamp must not be presented as the completion time of each checklist item. Loading, source error, failed refresh, empty day and unknown/partial state are separately legible. Do not turn unknown into zero or 100%.
- Show completion time only if the source has a real timestamp. Never add dog-log events as daily checklist activity. No weekly target appears without its own approved goal population and period.
- Routine checkbox calls the existing mutation/readback gateway. Training opens the exact selected version/step and returns to this view; stale scope cannot open a removed target. Back from the detail returns to Home, preserving its route scroll.
- Summary copy may count recorded completions; it cannot imply a training outcome or improved behavior.

### Visual verification

At 375/430 px and 140%: empty, loading, full, partial/unknown and retry states; ring/count/list parity; many rows; long labels; completed/uncompleted routine; training target and return; Home scroll restoration; screen reader progress value and row semantics.

## R7 — Panel 8, Insights

### User task and entry

From Log, open a descriptive view of logged pee/poop events for Week, Month or Since start, then return to the same Log date and scroll position. The shared AppScreen scroll map must retain each route key's offset through content replacement.

### Composition and behavior

- Log contains a clear “Översikt” action. Detail has visible Back and “Insikter”, period tabs, previous/next period controls for Week/Month, a pee/poop chart and equivalent readable numbers.
- Dates are grouped in the device's validated current IANA time zone; show that time zone. The fetch reads only `id,dog_id,event_type,occurred_at,accident_kinds` for `pee`,`poop`,`accident`, never free-text notes or unrelated event types. It is owner/dog scoped, account-generation scoped and aborts/discards stale results. The database stores event instants, not the historical time zone, so current device time zone is the explicit display rule.
- Attempt to read all relevant dog events through every page, scoped by the active `dog_id`; use stable `occurred_at DESC, id DESC` ordering on every page, compare exact count, validate unique IDs and show a retryable error if count drifts or a page fails. These checks catch some inconsistencies but cannot detect every concurrent same-count delete/insert, so they do not guarantee one coherent complete set during concurrent writes. Offset pagination remains a refreshable best-effort read, not transaction snapshot isolation. Do not present a chart made from only the current 40-row Log page or from a failed partial read.
- Counts include pee and poop event types plus the matching canonical `accident_kinds`; legacy accidents with null type remain unknown and do not count. Other event categories are excluded from these two series.
- Clearly say the chart describes saved logs only. A date with no saved event is unknown/unrecorded, not proof of zero real-world events. Distinguish empty history, no events in selected period, and load failure.
- Sleep durations and awake intervals stay absent until an interval contract exists. No medical conclusions or interpolated gaps.

### Visual verification

At 375/430 px and 140%: all periods, period boundaries, dates across DST, backward/forward controls, no-future navigation, empty period/history, pagination spanning multiple pages, retry failure, correct accident categorization, timezone label, chart legend/numerical equivalence, screen reader text, and return to prior Log date/scroll. The AppScreen regression test covers nonzero Log and Insights offsets, first-visit zero, a transient zero during route replacement, same-key rerenders, late scroll events, post-navigation user scrolling, and return to the same Log date/offset. Confirm incomplete reads never look like zero.

## Explicitly deferred

Masterplan R5 Development journey, mixed-breed sub-breeds and Home identity fields are separate packages. Panel 8 sleep interval analysis remains a documented product/data gap; this package completes the supported descriptive pee/poop log insight only.


## R7 scope amendment v7.1

Architect review of the concrete Logg to Insikter to Logg browser reproduction recommended CHANGES because v7 excluded AppPrimitives.tsx. This amendment adds only AppScreen per-route scroll-offset handoff and the focused tests/app-screen-ux.test.mjs regression. It does not change ProductWorkspace routing, data scope, persistence, or other global components. Architect re-review: APPROVE, 2026-10-18.


- v7.1 amendment: Architect APPROVE received 2026-10-18 for AppScreen route-key scroll handoff and the focused regression test only. No data/routing/persistence scope changed.

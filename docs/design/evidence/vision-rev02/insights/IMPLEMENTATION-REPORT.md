# FLOW-INSIGHTS-01 / R7 — implementation checkpoint

Date: 2026-10-18<br>
Plan: combined v7 with Architect-approved narrow v7.1 AppScreen amendment<br>
Fixture scope: synthetic saved-log data only

## Result

R7 provides Logg → Översikt for Week, Month and Since start. It reads the selected dog's supported pee/poop/accident events with a minimal projection, stable paginated order and exact-count validation. It groups timestamps in the validated device IANA time zone, keeps unlogged periods visible, and offers a readable numeric equivalent. Logg date and per-route scroll position are restored on return. Sleep intervals are not inferred.

The browser reproduction found that a transient zero scroll event during shared-screen content replacement overwrote the Logg offset. The approved v7.1 change keys the AppScreen scroll container by route and ignores stale route events.

## Verification

- Focused R7 + AppScreen tests: 43/43 PASS, including Stockholm spring-forward and fall-back dates.
- `pnpm check`: PASS; 618 tests, app and edge typecheck, lint.
- `pnpm bundle:ios`: PASS in review channel; iOS export, 1564 modules with the current R6 SVG dependency draft.
- Public/review browser: 16 viewport/state cases + 6 interactions; 0 failures, 0 page errors, 0 blocked requests.
- Browser interactions cover first Insights visit at zero, Logg → Insights, same-key Insights rerender, late event isolation, return to same Logg date/offset, and return to the same Insights offset. The late-event check invokes the captured React Native `onScroll` callback directly after the route changes, then verifies both route offsets remain intact.
- python tools/dev_flow.py validate: PASS.
- git diff --check: PASS.

The earlier Reviewer CHANGES on detached DOM scroll events and missing DST coverage is resolved in the current evidence. Independent Reviewer re-review is in progress.

Public/review captures and browser-results.json are saved in this folder.

## Limits

This is synthetic UI/browser evidence. Live Supabase/RLS and saved event readback, native iOS/Android scroll behavior, VoiceOver, device Dynamic Type, midnight/time-zone changes and full reference-image fidelity are not claimed. R6 §14.16 remains No pending the remaining rev02 visual match.

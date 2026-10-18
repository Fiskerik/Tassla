# FLOW-HOME-CHECKLIST-UPCOMING-01 — R3c QA checkpoint

Datum: 2026-10-17
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`
Plan: [taskplan v10](../../../../../../docs/tasks/dev/FLOW-HOME-CHECKLIST-UPCOMING-01.md) and [UX-spec v10](../../../../../../docs/plans/FLOW-HOME-CHECKLIST-UPCOMING-01-ux-spec.md). Exact v10 pre-code review: Architect **APPROVE**, Critic **APPROVE**, Security **PASS** (no data-inventory delta). Independent QA v10 **PASS**; Security implementation review v10 **PASS**; independent Reviewer evidence recheck **PASS**. These verdicts close the local R3c checkpoint only.

## Local QA result

`pnpm check` passed typecheck, edge typecheck, lint, and the full suite **569/569**. The focused R3c data and UI suite passed **31/31**. It checks the minimal dog-scoped upcoming health and routine reads, future-only health filtering before the 40-row cap, recurrence across daily/weekly/monthly boundaries, and ProductWorkspace’s confirmed routine-template refresh. Failed/unknown and day/training mutations do not trigger the upcoming read; the mutation’s captured scope must remain current after the awaited daily reload, and a same-scope confirmed write still refreshes the upcoming routine source if that daily reload fails.

The dedicated synthetic browser suite passed **12/12 in public and 12/12 in review** after v10. It covers ready ordering and saved time/date, responsive renders at 375×844, 430×844 and 375×667, 140% web text proxy, exact non-first plan edit and return to Kommande, focused routine manager and the explicitly today-only choice, separate loading/error/Retry, confirmed partial rows, and an already-open empty Kommande view. At 140% text, Kommande tab bounds are x=227.33–348.89 inside the tab-row viewport x=24–351; the label also fits. See `public/browser-results.json` and `review/browser-results.json` plus their screenshots.

The verifier validates an explicit HTTP loopback origin and port before launching Chromium. The page route allows only that exact origin and aborts/logs any other request. Both runs report zero page errors and no blocked requests. An external HTTPS base URL was rejected before browser launch.

## Rev02 §14.16 visual assessment

`vision_rev02.jpg` has no dedicated Kommande panel. Functional rendering and fit are captured, but direct similarity to that missing target is not measurable. These six target-comparison dimensions remain separate and **NOT TESTABLE**:

| Dimension | Status | Evidence limit |
|---|---|---|
| Composition | NOT TESTABLE | No dedicated Kommande reference panel. |
| Color | NOT TESTABLE | No Kommande target palette/layout to compare. |
| Typography | NOT TESTABLE | No target typography sample for this view. |
| Component shapes | NOT TESTABLE | No target component treatment for this view. |
| Imagery | NOT TESTABLE | No target image/content treatment for Kommande. |
| Content density | NOT TESTABLE | No target density reference for this view. |

## Not verified here

`python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate`, and `git diff --check` pass. The fixture uses synthetic local records and callbacks; it is not production content or proof of Supabase/RLS behavior. Live ownership policies, real timezone changes at midnight, native iOS/Android presentation, VoiceOver, device Dynamic Type, and installed TestFlight behavior remain NOT TESTABLE. No native or live-backend PASS is claimed.

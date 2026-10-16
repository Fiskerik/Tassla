# FLOW-HOME-CHECKLIST-ALL-01 render evidence

Base: `main` at `00d4d4a3e38c08a6bb7d4c541cc509457126276f` (verified against GitHub's current `main` ref on 2026-10-16).

Both public and review builds were rendered from the local React Native Web production components with synthetic fixtures. Each run passed all eight `checklist-all` browser checkpoints with no page errors. The captured matrix covers 375×844, 430×844 and 375×667, selected and unselected routines, today selection, completion, skip restoration, loading, error, empty, stale and refreshing read-only states, long Swedish labels, and the 140% text-size proxy.

After QA found stale labels in the existing Idag verifier, the approved v6 correction updated only five `tools/visual-check/verify.py` selectors. Public and review reruns passed `home-checklist` (5/5 each), `home` (5/5 public, 6/6 review), and `checklist-all` (8/8 each), all with empty `pageErrors`. Per-scope browser results and screenshots are under `public-home-checklist`, `review-home-checklist`, `public-home`, `review-home`, `public-checklist-all` and `review-checklist-all`.

Visual comparison of `public/all-templates-375x844.png` and the matching review screenshot confirms the Panel 4 order: compact back icon on the left, centered “Checklista” title, readable dog/date context, then the `Idag`/`Alla` segment. The all-template list and current-day status remain visible below. No Week or Kommande segment is shown.

Verification: focused daily-activity tests 20/20 PASS; `pnpm check` PASS (app and edge type checks, lint, 498/498 tests); scoped ESLint PASS; `python tools/dev_flow.py validate` PASS; `git diff --check` PASS; `python -m py_compile tools/visual-check/verify.py` PASS. All six public/review scope result files record an empty `pageErrors` list.

This evidence covers local synthetic browser behavior only. Live Supabase/RLS isolation, deployed migration parity, production trigger/duplicate races, native VoiceOver/Dynamic Type behavior, and physical-device layout remain NOT TESTABLE here.

## V8 security follow-up — 2026-10-16

Both public and review builds were rebuilt from the current v8 source. The canonical `public-checklist-all/browser-results.json` and `review-checklist-all/browser-results.json` each record **16/16** passes, including event-time expiry with zero writes, pristine manager close, delayed delete confirmation rejected after a replacement snapshot, dirty draft preservation and discard, operation resolution after expiry without unlocking the old session, unknown outcome retained after successful refresh, and dirty/pending state cleared on scope change. Both have empty browser `pageErrors` arrays. Matching results are also stored in `public/` and `review/`; captures include the delayed-confirmation, unknown-outcome, dirty-session and scope-change states.

The same builds pass the existing `home-checklist` regression **5/5** each and `home` regression **5/5 public / 6/6 review**, with zero page errors. Captures and UTF-8 results are in `public/`, `review/`, `public-checklist-all/`, `review-checklist-all/`, `public-home-checklist-v8/`, `review-home-checklist-v8/`, `public-home-v8/`, and `review-home-v8/`. The unknown-result manager and delayed-delete public/review captures were inspected for legibility and state accuracy.

The focused daily-activity suite passes **24/24** and `pnpm check` passes **502/502**. The midnight case is a deterministic Europe/Stockholm clock fixture. These results do not test live Supabase/RLS, deployed migration parity, production duplicate races, native Alert, device accessibility, physical-device gestures, or OS timezone-change events; each remains NOT TESTABLE.

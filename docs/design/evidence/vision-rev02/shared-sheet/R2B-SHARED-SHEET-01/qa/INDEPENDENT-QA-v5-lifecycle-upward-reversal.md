# R2b independent QA v5/v6 — lifecycle and upward reversal

Date: 2026-10-17\
Scope: approved UIUX-REVAMP-R2B-SHARED-SHEET-01 v2 after the final Reviewer findings\
Verdict: **PASS**

## Findings retested

The production BottomSheet now fences `Animated.Value.stopAnimation` callbacks with a drag-session token invalidated on replacement, release/terminate, and effect cleanup. Its shared offset helper clamps the combined claimed and post-grant distance to zero relative to the sampled animation offset, so an upward reversal cannot move the sheet above that origin. The focused regression simulates deferred animation reads during upward reversal and after invalidation.

The active-spring browser case still measures origin, spring position, claimed position, continued finger tracking, no snap, and no second close request. A new post-return screenshot captures the visible sheet after the interrupted return spring settles. The earlier during-drag screenshot intentionally records the held point with the sheet below the viewport; the browser assertions, not that image, verify the transient position.

## Results

| Check | Result |
|---|---|
| Focused gesture, LogScreen policy, and navigation suite | **21/21** |
| `pnpm check` | PASS; app and edge typecheck, ESLint, **549/549 tests** |
| Fresh public/review RN Web builds | PASS |
| Public browser scope | **12/12**, zero page errors, focus `true → true` |
| Review browser scope | **12/12**, zero page errors, focus `true → true` |
| Python verifier syntax | `python -m py_compile tools/visual-check/verify.py` PASS |
| Queue validation | `python tools/dev_flow.py validate` PASS; task remains `review` |
| `git diff --check` | PASS; Git emitted only LF→CRLF warnings |

The Python Playwright binding was unavailable in the local runner. Independent QA used the installed Node Playwright package to execute the same 12 browser assertions against fresh public and review fixtures. The Python verifier itself passed syntax compilation.

## Persisted evidence recheck

Both repository result JSON files contain 12 passes, zero page errors, focus true before and after, and the active-spring re-drag assertion. The new `sheet-redrag-returned-after-active-spring-375x844.png` exists in both variants, visibly shows the returned sheet, and its SHA-256 matches the fresh temporary artifact. The result JSON hashes also match.

## Limits

This evidence covers synthetic RN Web fixtures. Physical iOS/Android gestures, OS keyboard and focus, VoiceOver, physical Dynamic Type, native Modal/system-back priority, live Supabase/RLS, persistent writes, and an installed build remain **NOT TESTABLE**.

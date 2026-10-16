# R2b independent QA v3 — rapid re-drag during return spring

Date: 2026-10-17\
Scope: approved UIUX-REVAMP-R2B-SHARED-SHEET-01 v2; follow-up to the first Reviewer BLOCK\
Verdict: **PASS**

## Reviewer finding retested

The first Reviewer found that a new header gesture could reset the sheet to its small claim distance while a denied-close spring was still returning. The implementation now stops the active animation, reads its current offset from the `stopAnimation` callback, and applies the new gesture from that offset. A per-gesture epoch ignores a late callback from an older gesture.

The public and review browser fixtures deny the first close, begin a second header drag while the spring is still returning, and assert that the sheet remains displaced from its original position and follows a further finger movement. The second movement remains below the close threshold. Both fresh runs passed the scenario. A representative public diagnostic was origin 709.00 px, spring sample 782.39 px, claimed position 774.71 px, and held position 806.71 px after a further 40 pt finger move. The production sheet remained visible and did not request another close.

## Results

| Check | Result |
|---|---|
| Rapid re-drag regression | PASS in fresh public and review builds |
| Full public browser scope | **12/12**, zero page errors, focus `true → true` |
| Full review browser scope | **12/12**, zero page errors, focus `true → true` |
| Focused Node suite | **19/19** |
| `pnpm check` | PASS; app and edge typecheck, ESLint, **547/547 tests** |
| `python -m py_compile tools/visual-check/verify.py` | PASS |
| `python tools/dev_flow.py validate` | PASS; R2b remains in `review` |
| `git diff --check` | PASS; line-ending warnings only |

## Persisted evidence recheck

The public and review `browser-results.json` files each contain 12 passes, zero page errors, `focusProbe` true before and after, and the rapid re-drag assertion. The corresponding `sheet-redrag-during-return-spring-375x844.png` files exist in both evidence folders. The evidence README and visual-check guide state 12/12 and describe the active-spring case. Queue validation succeeds.

## Limits

This evidence covers synthetic RN Web fixtures. Physical iOS/Android gestures, OS keyboard and focus, VoiceOver, physical Dynamic Type, native Modal/system-back priority, live Supabase/RLS, persistent writes, and an installed build remain **NOT TESTABLE**.

No code, evidence, or queue files were changed by the independent QA recheck itself.

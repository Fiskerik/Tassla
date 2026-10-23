# Insikter / Dog Profile route — local checkpoint

**Date:** 2026-10-22
**Branch:** `2026-10-22-panel7-insights-profile`
**Scope:** FLOW-INSIGHTS-01 checkpoint 4b, after the owner-reported Compliance approval for FLOW-INSIGHTS-01A.
**Data:** public empty fixture and clearly synthetic review fixture. No account or live Supabase rows were used.

## What was implemented

Hundprofil now has one `Insikter` action. It opens the same `LogScreen` overview and `InsightsScreen` used by Logga → Översikt. Unsaved profile edits, a pending profile write, conflict, unresolved attribution write, or busy state keep the action visible but disabled. Opening from a clean profile stores a scoped return target; returning restores that profile, while switching to the Logg tab clears the profile return target.

The initial period is Vecka. Only the selected period is read; period changes abort the old request and start the new one. The UI shows the logged counts, scope/coverage explanation, sparse month gaps, the current incomplete period, unclassified accidents, empty/error/loading states and a route to Logga. It does not invent sleep durations or health conclusions. One `SECURITY INVOKER` RPC and its migration provide the aggregate contract; the SQL probe is saved but was not run in this environment.

## Captures and results

- `public/RESULTS.json`: **7/7 PASS**. Dog Profile entry, draft gate, shared overview and scoped return at 375/430 px; retry; scroll at 375×667; no horizontal overflow in the 140% CSS text proxy.
- `review/RESULTS.json`: **11/11 PASS**. The same route checks, all-history current-month start, six accessible sparse-history gaps at 375/430 px, retry, short viewport and 140% CSS text proxy.
- Public iOS bundle: `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false EXPO_NO_TELEMETRY=1 pnpm bundle:ios` **PASS**, 1,581 JavaScript modules exported. This is a bundle/export check, not an installed-device run.
- Review fixtures use no private data. `page_errors` is empty for the Profile/Insights journeys.
- Selected captures: `public/profile-insights-entry-375.png`, `public/insights-week-profile-375.png`, `review/insights-history-sparse-375.png`, `review/insights-history-profile-430.png`, and `review/insights-text-140-375.png`.

## §14 review

| Item | Result | Evidence / limit |
|---|---|---|
| 1. Clear next action | Yes | Period selection, retry when needed, and a route to Logga are visible. |
| 2. Equal actions | Yes | The three period choices share the same control style. |
| 3. Delete confirmation | N/A | This view does not delete data. |
| 4. Home checklist rows | N/A | Not part of this view. |
| 5. Spacing, scroll and menu | Yes, local | 375×844, 430×844 and 375×667 renders; content scrolls above the fixed menu. Native safe-area fit is not tested here. |
| 6. Shared tokens/components | Yes, source reviewed | Existing app components and shared theme tokens are used. |
| 7. Icon family | Yes, source reviewed | Existing icon components; icon labels are not the only data representation. |
| 8. Color and contrast | Partial | Count series use the documented green/brown palette and readable text; this harness is not a native contrast audit. |
| 9. Icon meaning | Yes | Controls describe the period or action they operate. |
| 10. Honest status | Yes | Counts derive from the response; unknown/error is not presented as zero. |
| 11. Encouragement/banner | N/A | No success banner or inferred dog-state copy is used. |
| 12. Swedish copy | Yes | User-facing copy describes recorded events and data coverage. |
| 13. Type and hierarchy | Partial | Rendered screenshots reviewed at standard browser scale; full comparison with the native reference is still open. |
| 14. Read states | Yes, local | Public empty, review ready, loading, and error/retry were rendered. Live RPC failure behavior was not exercised. |
| 15. Touch/accessibility/large text | Partial | Web semantics and 140% CSS proxy were checked. Native VoiceOver/Dynamic Type for this feature was not re-run. |
| 16. Full rev02 match | Partial | This is a local panel checkpoint. Sleep intervals and full native/reference comparison remain open. |
| 17. Tabs and returns | Yes, local | Profile return, Logga-origin periods and clearing the return target by selecting Logg were rendered. |
| 18. Dog context | Partial | Active dog name/scope are wired; multi-account and live owner-boundary behavior were not exercised. |

## Not verified here

- `psql` and the Supabase CLI are unavailable, so `supabase/tests/dog-event-insights-read.sql` was **not run**.
- No migration was applied and no live RPC/RLS request was made. The user has reported that Supabase/RLS works generally; this new migration and RPC are not independently verified against that environment.
- No iOS device build was installed for this checkpoint. The user's general VoiceOver/Dynamic Type pass was not repeated specifically on this new view.
- The approved scope still excludes sleep interval charts until a valid interval contract exists.

This closes local UI/data-contract implementation evidence only. It does not claim full panel acceptance or live backend acceptance.

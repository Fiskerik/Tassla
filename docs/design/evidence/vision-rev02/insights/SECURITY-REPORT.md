# Independent Security Review — combined catalog + R6/R7

**Verdict: PASS** — frozen v7.1 snapshot; no security changes requested.

## Review

- R7 reads only `id,dog_id,event_type,occurred_at,accident_kinds`, filters exactly on the selected `dog_id`, and restricts types to `pee`, `poop`, and `accident`. Returned rows are checked against the requested dog and the supported event/category contract. Notes and unrelated event fields are not fetched.
- Each 200-row page uses deterministic `occurred_at DESC, id DESC` ordering and exact count. The reader rejects count drift, duplicate IDs, empty/incomplete pages, and mismatched rows before exposing a ready snapshot. Cancellation is forwarded into each Supabase request; route cleanup aborts and owner/account-generation, dog, retry, route, request-generation and mounted checks discard stale results.
- Offset paging is not snapshot isolation. A same-count concurrent delete/insert can evade these checks; the UX/task docs and implementation report explicitly disclose that limitation and characterize results as best-effort saved-log history. No claim of a coherent transactional snapshot was found.
- R7 is read-only and adds no schema, RLS/policy, grant, RPC, auth, analytics, or dependency changes. AppScreen’s approved route-key scroll change only preserves route-local UI offsets.
- The only new SQL is a plain additive insert into `public.breeds (id, name)` for the pinned FCI rows. There is no conflict handler or update; a colliding ID fails rather than changing an existing row. Existing `mixed`/`unknown` values and profile ownership paths are left intact.
- Local tests and browser evidence are described as mocked/synthetic. The implementation report explicitly says live Supabase/RLS, saved readback, native behavior/accessibility, and full reference fidelity were not verified. Therefore no local evidence overclaim found. Actual access remains dependent on the existing dog-event RLS policies, which this local review cannot validate against the remote project.

## Residual provenance note

The earlier breed-catalog Security closeout records that the upstream repository license is MIT but separate FCI rights were not independently established. This remains a catalog provenance caveat, not a defect in the additive migration or R7 read path.

Reviewed: approved v7.1 UX/task scope and FLOW-INSIGHTS-01 queue entry; `workspace-data.ts`; ProductWorkspace request wiring; InsightsScreen/model and LogScreen entry point; AppPrimitives scroll amendment; breed migration; associated focused tests and implementation/browser evidence.

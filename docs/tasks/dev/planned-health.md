# P03 — kommande ägarangivna hälsohändelser
Plan v1 2026-10-06. Erik full MVP mandate Luna medium. Implementation after P02 checkpoint; exact Architect/Critic/Security review pending.
## Goal
Separate planned vaccination/vet visit list with owner-entered date/note, create/edit/confirmed delete. No medical intervals, no automatic conversion/completion, no notification delivery before P07. Overdue plans remain plans, never appear completed. UI labels owner-entered and date overdue/today/future.
## Internal checkpoints
1. Narrow migration adds dog_health_plans table: id UUID PK supplied for stable retries, dog_id FK dogs cascade, event_type vaccination|vet_visit, due_on date, nullable description <=500 codepoints, created_at. Owner CRUD RLS using private.owns_dog and restricted column grants; index dog_id,due_on,id. Do not use current_date future CHECK because plans must remain editable/visible after becoming overdue; app new/edit dates real local today or future, notes can be corrected on overdue existing plan without forcing invented date (exact UI/data rules reviewed). No remote migration execution without reviewed development DB plan.
2. Data typed owner-plan CRUD and deadline/reconciliation. Stable IDs, dog/type/id filters, strict parser, Unicode trim/null, captured preimage conditional updates/delete, zero-row result readback. No mutation across session lifetime. Existing completed dog_events untouched.
3. Workspace independent plan rows/pending/mutation state; survives navigation; separate from weight and completed health. Load ascending due date/id, cap disclosed. UI add PlannedHealthScreen under Health, type/date/optional note, pending-safe cancel and explicit status check. Appropriate calendar/medical icons with text. Display overdue clearly, no inferred advice.
4. QA tests migration contract and real SDK queries, calendar/notes, owner boundaries, safe CRUD/unknown/conflict/retry/lifetime, upcoming not in completed history. pnpm check/bundle:ios/diff check, independent reviewer/security. Live migration/RLS NOT TESTABLE unless actual dev DB run. No new PHONE gate. README and release-log/checkpoint before P04.
## Ownership
Implementer: new supabase/migrations/202610060001_planned_health.sql, supabase/README.md, src/data/workspace-data.ts, src/features/home/ProductWorkspace.tsx, src/features/health/HealthScreen.tsx, new src/features/health/PlannedHealthScreen.tsx, health README. QA tests/planned-health.test.mjs, tests/README.md, new supabase/tests/planned-health.sql for transactionally rolled-back two-synthetic-owner probes. Coordinator task/queue/report/release-log.
## P07 link
Plan UUID is logical scheduling key; notification choice/link fields added only after precise P07 contract. P03 no pretend delivery. Manual recording performed occurrence and removal of plan remains explicit two actions; no one-tap conversion requiring transaction/RPC in this slice.
## Next
Exact planreview; do not code before P02 done. Suggested table isolates plans without reinterpreting completed dog_events or generic reminders.

## Plan v2 — precise review changes
Architect/Critic CHANGES v1 incorporated. INSERT due_on >= captured localToday. UPDATE allows captured original due_on unchanged even overdue; replacement date today/future only, never latest read as substitute preimage. Type immutable. INSERT grants id,dog_id,event_type,due_on,description; UPDATE grants due_on,description only; SELECT/DELETE grants; no anon. NOT NULL dog_id/event_type/due_on/created_at; created_at default now(); ENABLE RLS; SELECT/DELETE owner USING, INSERT owner WITH CHECK, UPDATE owner USING+WITH CHECK, private.owns_dog unchanged. Pending intent survives navigation. Conflict explicit reload-current-plan action that checks status first and shows current record; no automatic replay/overwrite and no cancel discarding unresolved writes. QA tests overdue note-only, past replacement reject, forbidden identity/type updates and cross-owner CRUD. Remote SQL execution separate.

Faktisk review v2: b2_reviewplan Architect APPROVE, Critic PROCEED, static Security APPROVE local synthetic schema/code contract; ingen deployed RLS-verifiering. Implementation efter P02 checkpoint, localToday fångas vid varje ny intent och hålls oförändrad i retries.

## Slutresultat lokal P03
2026-10-06: QA 31/31 fokuserat, pnpm check 160/160; iOS-export/diffcheck PASS. Oberoende Reviewer och statisk Security PASS efter correction1. Servermigration/RLS ej körda. Se release-log P03-PLANNED-HEALTH.md och rapport.md. Nästa P04.

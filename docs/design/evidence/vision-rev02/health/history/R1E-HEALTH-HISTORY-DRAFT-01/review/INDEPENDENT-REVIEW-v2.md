# R1e independent Reviewer — v2 implementation

Date: 2026-10-16\
Verdict: **BLOCK**\
Scope: read-only review of R1e implementation; no edits or tests by Reviewer.

## Findings

1. A saved health-history row can change `event_type` from vaccination to veterinary visit while its editor is open. The delete/update CAS uses the opening type, as intended, but `fetchHealthHistoryById` also filters by that type. The still-existing row is therefore returned as absent; delete can emit a false confirmed-delete event. The migration permits the column to be updated.
2. `HealthScreen` derives the editor's `initialType` from refreshed `historyRecords` each render and includes it in the editor React key. A concurrent type change can remount the editor and discard dirty fields before the owner chooses.

Readback must identify the row by dog + id independently of type and route the changed supported type to conflict recovery. Editor identity must retain the opening type until explicit recovery. See the exact v3 amendment before implementation.

Native Alert/Modal ordering and live Supabase/RLS timing remain **NOT TESTABLE** by RN Web.

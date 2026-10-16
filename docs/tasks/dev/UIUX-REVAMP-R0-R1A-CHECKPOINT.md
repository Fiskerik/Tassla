# UI/UX Revamp R0 — R1a implementation checkpoint

Date: 2026-10-16
Status: R1a local checkpoint done after independent QA and Reviewer PASS; uncommitted.

## Baseline and source of truth

- Repository: Tassla.
- Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`.
- Baseline HEAD: `61495699679e12d55e2978f9419a84585e80b213`; implementation remains uncommitted in the isolated worktree.
- The masterplan is `docs/plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md`, linked from `AGENTS.md`. It governs sequence and handoff. Product requirements come from MVP v2 and the experience contract; appearance from design rules, `vision_rev02.jpg`, and screen contracts; interaction and feedback from the consumer UX rules; implementation and checkpoints from the workflow and queue.
- Older rev01 inventories and dated proposal documents do not direct this implementation.
- Architect approved R1a plan v3; Critic recorded PROCEED for v3 and UX spec v1.

## Queue and order

The approved order is baseline, explicit breed choice, draft protection, navigation/sheets, then connected core journeys. `UIUX-REVAMP-R1A-BREED-01` is the active first implementation slice. The queue keeps `DOG-PROFILE-AGE-DISPLAY` and `DOG-PROFILE-BREED-MIX` blocked on their recorded evidence/dependencies; `FLOW-ONBOARD-01` remains planned, and `FLOW-HOME-CHECKLIST-WEEK-01` remains unchanged. R1a changes no age, catalog, or data contract.

`TASSLA-TEAM-MODEL-ROUTING-01` is planned and is sequenced after R1a because both tasks update the shared queue, report, and master log.

## R1a implementation and local evidence

The profile form now leaves the breed unselected after catalog load, shows accessible Swedish guidance for a ready non-empty list, and keeps Continue disabled until the owner selects a breed and existing required fields pass. An empty catalog shows an honest message and retry. Existing failed-fetch recovery remains. The synthetic harness covers a later catalog fetch preserving a chosen breed. `createDog`, save/readback, failure/unknown-result, status-check, ownership, and kennel attribution logic were not changed; kennel code remains optional.

Public and review React Native Web bundles each pass all seven profile-create assertions with zero browser page errors. Evidence under `docs/design/evidence/vision-rev02/onboarding/R1A-BREED-01/` includes ready/unselected at 375×667, 375×844, and 430×844; selected, loading, empty, catalog error, empty-retry recovery, and 140% text-proxy renders at 375 px. The verifier also checks the 140% proxy for horizontal overflow.

Local checks recorded:
- `pnpm check`: PASS; typecheck, edge typecheck, ESLint, and 502/502 Node tests.
- `python -m py_compile tools/visual-check/verify.py`: PASS.
- `git diff --check`: PASS.
- `python tools/dev_flow.py validate`: PASS before the final documentation update; rerun after checkpoint metadata is saved.
- Public profile-create verifier: 7/7 PASS, no browser errors.
- Review profile-create verifier: 7/7 PASS, no browser errors.

This is synthetic RN Web evidence and does not prove native VoiceOver/Dynamic Type, live Supabase/RLS, profile persistence/readback, physical-device behavior, or distribution. `vision_rev02.jpg` has no dedicated profile-create panel, so this is not a direct pixel-match claim.

## Next step

Independent QA reviewed the source, saved public/review verifier outputs, six screenshots, and recorded check results. It did not rerun shell checks after its first check attempt was interrupted. QA PASS is limited to this local checkpoint; native accessibility, live Supabase/RLS, persistence and device behavior remain NOT TESTABLE. The master-log outcome is recorded, R1a is done, and the next task is the approved Tassla Team model-routing slice.

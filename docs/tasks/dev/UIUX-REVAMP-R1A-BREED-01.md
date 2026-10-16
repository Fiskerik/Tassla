# UIUX-REVAMP-R1A-BREED-01 — explicit breed choice

Version: 3
Date: 2026-10-16
Status: local R1a checkpoint done after independent QA and Reviewer PASS; no commit or push.

## Goal

On a new dog profile, the breed catalog must not choose a breed on the owner's behalf. The owner explicitly chooses one of the available breeds before continuing. This is the first evidence-based fix in the sequence defined by docs/plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md.

## Authority and traceability

- Existing approved segment: full MVP beta delivery; Erik authorized in-scope MVP implementation on 2026-10-06.
- Current product contract: docs/mvp.md §4.1 and docs/MVP-EXPERIENCE-CONTRACT.md.
- Design and interaction guidance: docs/design-rules.md, docs/design/vision-rev02-screen-contracts.md, vision_rev02.jpg, and the tassla-consumer-ux skill.
- Masterplan finding: F01; first implementation slice: R1a.
- UX spec: docs/plans/UIUX-REVAMP-R1A-BREED-01-ux-spec.md v1.
- Baseline branch: codex/mvp-v2-panel4-checklists-2026-10-16 at 61495699679e12d55e2978f9419a84585e80b213.
- Queue prerequisite: MVP-V2-ADOPT-01 is done. The task does not depend on blocked DOG-PROFILE-AGE-DISPLAY or DOG-PROFILE-BREED-MIX because it makes no age or catalog changes.
- Proposed risk class: M. The required onboarding interaction changes; data shape, account/dog ownership, persistence, permissions, and storage do not.

## Current behavior and bounded change

ProfileScreen initializes breedId as empty, but after fetchBreeds resolves it fills an empty selection with options[0]. The Continue button then becomes enabled without an owner selecting the breed.

Change only this behavior and its necessary feedback states:
1. Leave breedId empty after a successful catalog fetch.
2. Keep it empty until the owner activates one breed radio option.
3. While the list is ready, has one or more options, and no option is selected, show concise Swedish guidance: “Välj en ras för att fortsätta.”
4. Expose that visible instruction as accessible text associated with the selection area; use a polite live announcement where supported, without relying on color or radio state alone.
5. Keep Continue disabled until the existing form conditions and an explicit breed selection are satisfied.
6. If the successful catalog response is empty, show an honest message and a retry action. Do not render an empty radio group as if there were choices.
7. Preserve the existing catalog loading and failed-fetch retry states.
8. Do not add any behavior that clears breedId during a later catalog fetch. The current retry action is only available after initial fetch failure, before a choice can be made; “selected choice survives retry” is therefore not a reachable user-flow acceptance criterion. The verifier will separately exercise a subsequent synthetic catalog fetch after a choice and confirm that selection remains, documenting that this is a state-preservation check rather than a current visible retry flow.
9. Retain existing accessible radiogroup/radio semantics and selected state.

Do not alter createDog, fetchBreeds, dog/profile data contracts, account-generation guards, save/readback behavior, error/unknown states, status-check retry, referral/kennel attribution, or the rule that kennel code is optional.

## Acceptance criteria

- A fresh profile remains without a selected breed after a successful non-empty catalog response.
- No first-item, random, or Mix value is selected implicitly.
- Continue is disabled until the owner explicitly selects a breed and all existing required fields are valid.
- Guidance is shown only after a successful non-empty catalog load with no selection, and is accessible as visible text.
- Selecting a breed updates the radio selected state, removes the no-selection guidance, and permits Continue once other existing fields are valid; kennel code remains optional.
- A successful empty catalog shows a clear message and retry action, with Continue disabled.
- A catalog failure retains the current error/retry behavior; a deterministic synthetic error-then-success fixture verifies the retry recovers to the ready/unselected state.
- A synthetic subsequent catalog fetch after a selection leaves that selection intact. This is a state-preservation check; the current product does not expose a retry after selection.
- Existing create, readback, failure, unknown-result, and status-check source paths remain untouched. The synthetic fixture does not claim successful persistence or validate live DB behavior.
- No schema, migration, RPC, RLS, auth, catalog snapshot, profile-edit, Home, navigation, draft-protection, notification, or PDF changes are included.

## Exact write paths

- src/features/onboarding/ProfileScreen.tsx
- tools/visual-check/app.tsx
- tools/visual-check/verify.py
- tools/visual-check/README.md
- docs/plans/UIUX-REVAMP-R1A-BREED-01-ux-spec.md
- docs/tasks/dev/UIUX-REVAMP-R0-R1A-CHECKPOINT.md
- docs/tasks/dev/UIUX-REVAMP-R1A-BREED-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md
- docs/design/evidence/vision-rev02/onboarding/R1A-BREED-01/ for actual generated evidence and its README

No other source or product-contract paths are authorized by this task plan. If review shows another path is necessary, revise the plan and obtain fresh Architect/Critic decisions before editing that path.

## Checks and visual evidence

Required local checks after implementation:
- Add a deterministic profile-create scenario to tools/visual-check/verify.py using the actual ProfileScreen component and synthetic client from tools/visual-check/app.tsx.
- Assert fresh non-empty catalog has no checked radio, no-selection guidance is visible, and Continue is disabled.
- Select a breed and fill valid name/date fields; assert Continue becomes enabled without a kennel code. Do not submit, because the fixture does not perform a real profile write.
- Trigger a subsequent synthetic catalog fetch after the explicit selection; assert the selection remains.
- Verify ready, empty, loading, failed-fetch and error-then-success retry states.
- Run the profile-create verifier against both public and review bundles at 375x844, 430x844, and 375x667; verify a 140% text proxy at 375 px without horizontal overflow. Save screenshots and machine-readable results in the evidence directory.
- pnpm check.
- git diff --check.
- python tools/dev_flow.py validate.
- Independent QA and Reviewer handoff according to docs/dev/workflow.md and AGENTS.md.
- Record each check and its actual result. Missing support is NOT TESTABLE, not inferred as PASS.

Design comparison:
- Use the closest grouped-form rules in docs/design-rules.md. vision_rev02.jpg has no dedicated profile-create panel, so do not claim direct pixel-match evidence for this screen.
- Verify text, disabled action, radio state, and empty/error feedback in screenshots. The web layout/text proxy is not native Dynamic Type or VoiceOver.

Explicit limitations:
- Live Supabase/RLS, successful profile creation/readback, native Dynamic Type/VoiceOver, physical keyboard/safe-area behavior, signed distribution, and actual phone build are NOT TESTABLE in this local fixture.
- Security/data-contract scope is unchanged; if review finds a data, auth, permission, storage, or network change, stop and obtain the required specialist review.

## Queue sequencing proposal for review

Register UIUX-REVAMP-R1A-BREED-01 as planned, priority P0, risk M, depending on MVP-V2-ADOPT-01. After approval, make this task a dependency of DOG-PROFILE-BREED-MIX and FLOW-ONBOARD-01 to prevent overlapping ProfileScreen work. Preserve those tasks' existing statuses and history. Leave FLOW-HOME-CHECKLIST-WEEK-01 unchanged and planned.

## Version 3 change

- Added docs/decisions/MASTER-LOG.md to the exact write paths because workflow step 5 requires the verified checkpoint outcome to be recorded there before review → done.
- No product behavior, acceptance criteria, risk, dependencies, or implementation scope changed.

## Review record

- Architect v2: CHANGES; required the master log in exact write paths.
- Critic v1: CHANGES on testability, fixture scope, retry reachability, UX spec, empty catalog and screen-reader guidance.
- Critic v2: PROCEED for plan v2 and UX spec v1.
- Architect v3: APPROVE; master-log path is included.
- Critic v3: PROCEED; all UX and verification corrections remain intact.
- QA: PASS for the local checkpoint after review of source, saved command results, public/review verifier outputs, and six screenshots. QA did not rerun shell checks after its first check attempt was interrupted.
- Reviewer: PASS for the local checkpoint; implementation, plans, queue, report, render evidence, and changed-path inventory verified. Live/native behavior remains NOT TESTABLE.
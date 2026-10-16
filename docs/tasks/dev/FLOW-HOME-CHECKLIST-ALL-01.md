# FLOW-HOME-CHECKLIST-ALL-01 — Panel 4: Alla rutinmallar

Status: **v8 implemented; focused/full QA PASS; Architect, Security and final independent Reviewer PASS; local checkpoint complete**

## Mandate and outcome

Owner authorization: Erik’s 2026-10-16 instruction to implement the approved MVP v2 plan in small checkpoints. The current product base is `main` at `00d4d4a3e38c08a6bb7d4c541cc509457126276f`. Panel 4’s all-tab decision is to show every saved active routine template for the selected dog, including templates not selected for any day.

Deliver the `Alla` part of Panel 4 after `FLOW-HOME-CHECKLIST-IDAG-01`: the owner can inspect every current routine template and add an unselected template to today using the existing confirmed selection action. Selected routines retain their exact day snapshot and existing completion controls. This is a local checkpoint, not a claim that Panel 4 is finished.

## Data and safety contract

The current `dog_daily_routines` model has no archive, active, or soft-delete field. The complete active set is therefore the rows returned for the selected dog by the existing daily snapshot; a saved row is active until the existing owner delete flow removes it. `fetchDailyActivitySnapshot` already loads that full dog-scoped set without a date filter, while day rows and skips are date-scoped. RLS and mutation contracts remain unchanged.

The UI will derive the list only from the current successful snapshot. `Alla` will show two working segments, `Idag` and `Alla`; it will not display placeholder Week or Kommande segments. For each routine, show its saved name, checklist template and repeat summary. Show one primary day state in this precedence: selected today, skipped today, scheduled today, not scheduled today; the repeat summary remains separate. A selected template shows completion items from its immutable day snapshot and keeps the existing completion action. An unselected or skipped template offers the day-specific `Välj för idag` action through an All-view callback that invokes the existing selection mutation, which already handles duplicate protection and reinstating a skipped row. In the manager, routine day-selection labels will say `Välj för idag`, `Välj igen idag`, and `Ta bort idag`, so they describe the existing current-day mutation accurately; routine deletion retains its separate destructive confirmation.

Loading, read-error, and genuinely empty template results remain distinct. A last-confirmed snapshot may remain visible while refreshing or after refresh failure, but `Alla` becomes read-only: no select/restore/checklist mutation, manager opening, or edit/delete action is possible until the current dog/date/account snapshot is ready, not refreshing, has no refresh error, has no same-scope read in flight, and is younger than `WORKSPACE_REFRESH_AFTER_MS` (60 seconds). The UI disables those actions and closes an already-open manager if freshness is lost. The All-view add callback independently rechecks this condition immediately before invoking the existing mutation, so stale render state cannot start a write. Dog/date scope is checked in pure derivation and interaction fixtures. No schema, RLS, RPC, network, dependency, or new persistence behavior is in scope.

## Exact write paths

- src/features/home/DailyChecklistScreen.tsx
- src/features/home/DailyActivityManagerSheet.tsx
- src/features/home/ProductWorkspace.tsx
- src/features/home/daily-activity-model.ts
- src/features/home/README.md
- tools/visual-check/app.tsx
- tools/visual-check/build.cjs
- tools/visual-check/verify.py
- tools/visual-check/README.md
- tests/daily-activity-model.test.mjs
- tests/daily-activity-ui.test.mjs
- docs/tasks/dev/FLOW-HOME-CHECKLIST-ALL-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md
- docs/design/evidence/vision-rev02/checklist/ALL-01

## Acceptance criteria

1. `Alla` lists every template in the successful snapshot for the current dog, even when it has no current-day selection. No other dog’s templates appear.
2. The template’s active status is grounded in the persisted-row model (there is no status/archive column); removed templates disappear only after the existing delete flow is confirmed by refresh.
3. A selected routine shows the current dog/date’s persisted day snapshot and its confirmed completion state. It never substitutes the newer template checklist for an already-created day snapshot.
4. An unselected or skipped routine can be added/restored for today through the existing mutation handler, with `Välj för idag` copy. Pending, failed, and unknown mutation outcomes remain truthful; selected routines do not show a second add action. Repeated activation cannot create duplicate day rows.
5. Loading, empty and read-error states are distinct. Failed reads show no actionable routine list. During refresh, refresh error, a same-scope read flight or snapshot age of 60 seconds or more, Alla is read-only and every action/retry callback is guarded at invocation. A pristine manager closes at expiry. A dirty, pending or unknown manager in the exact same account/user-generation, dog, date, timezone and content scope stays visible read-only with accessible refresh-needed feedback; only explicit local close/discard is allowed. A successful refresh does not unlock that old session: discard/close it, then reopen from the fresh snapshot. Any scope or ownership change immediately clears the old session, including dirty drafts. An operation started while fresh may resolve after expiry, but cannot unlock the stale session. A fresh new session restores actions.
6. `Idag` behavior and navigation/return state from the prior checkpoint regressions remain unchanged. No fake Week/Kommande controls appear.
7. Public and review synthetic render evidence covers selected and unselected templates, skip restoration, empty/loading/error, dog isolation, 375×844, 430×844, 375×667, long Swedish copy and 140%-text proxy, in accordance with `docs/design-rules.md` §14. Evidence describes synthetic browser behavior only; live RLS and native accessibility are reported separately as NOT TESTABLE.


## V5 visual-header delta — approved

The first rendered comparison found that the shared checklist detail still uses a standalone `Till Hem` text button above a left-aligned `PageHeading`. Panel 4 and its screen contract specify a back control at the left and a centered `Checklista` title. Align the existing checklist header with the already available compact `AppBar` Back variant, retain the dog/date context in readable supporting text, and leave the `Idag`/`Alla` segment directly below it. This affects only `src/features/home/DailyChecklistScreen.tsx`; it adds no dependency, route, data change or new user action. The existing v4 output and tests remain valid, while both public and review screenshots must be rebuilt and visually checked again after the correction.

Architect and Critic approved this exact, presentation-only delta before implementation. Queue status remains local and awaits QA and independent Reviewer.

The v5 renders and visual comparison are recorded in `docs/design/evidence/vision-rev02/checklist/ALL-01/RENDER-REPORT.md`. Both modes pass all eight scoped checkpoints with no browser errors.

## Risk and reviews

Risk class: **H** because the displayed rows and add action are dog-scoped personal data and persist a daily selection. The implementation reuses an already-approved snapshot and mutation path; it does not expand the query or data contract. Before runtime edits, obtain Architect APPROVE for this exact plan and Critic review of the visible states/actions. Obtain a focused Security review of dog scope, stale/error gating, and reuse of the existing authenticated write path. If a review requests query, authorization, migration, RPC, or purpose changes, stop and create a separately reviewed task before touching that contract.

## Verification

- `node --experimental-strip-types --test tests/daily-activity-model.test.mjs tests/daily-activity-ui.test.mjs tests/daily-activity-data.test.mjs`
- `pnpm exec eslint src/features/home/DailyChecklistScreen.tsx src/features/home/DailyActivityManagerSheet.tsx src/features/home/ProductWorkspace.tsx src/features/home/daily-activity-model.ts tools/visual-check/app.tsx tests/daily-activity-model.test.mjs tests/daily-activity-ui.test.mjs`
- `pnpm check`
- Public and review `TASSLA_UI_SCOPE=home-checklist`, `home` and `checklist-all` synthetic build/serve/verify per `tools/visual-check/README.md` §FLOW-HOME-CHECKLIST-ALL-01
- `git diff --check`
- `python tools/dev_flow.py validate`

Current v8 verification on 2026-10-16: focused daily-activity tests **24/24 PASS**; `pnpm check` **502/502 PASS**, including app/edge typecheck and lint; public and review `checklist-all` **16/16 each**, `home-checklist` **5/5 each**, and `home` **5/5 public / 6/6 review**, all with zero page errors. Evidence covers event-time expiry and zero writes, pristine close, captured delayed delete rejection after refresh, dirty draft preservation and explicit discard, a successful operation resolving after expiry without unlocking the old session, unknown outcome retained through a successful read, and dirty/pending scope reset. The focused model test also covers Europe/Stockholm midnight and mutation gateway categories. `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate`, scoped ESLint, and `git diff --check` pass. Screenshots and UTF-8 result files are stored under `docs/design/evidence/vision-rev02/checklist/ALL-01/`. Synthetic browser evidence does not certify live Supabase/RLS, deployed migration parity, production duplicate races, native Alert, VoiceOver/Dynamic Type, physical-device gestures, or OS timezone-change events; those remain NOT TESTABLE.

## Review record

- Architect: APPROVE — FLOW-HOME-CHECKLIST-ALL-01 plan v4. Confirmed all 15 write paths and both scoped ESLint entries; approved behavior and freshness tests.
- Critic: PROCEED — FLOW-HOME-CHECKLIST-ALL-01 plan v4. Confirmed the manager labels distinguish choose/restore/remove-today and keep deletion separately confirmed.
- Security: PASS — FLOW-HOME-CHECKLIST-ALL-01 plan v4. Same-scope freshness, refresh/error/read-flight gating and handler recheck are sufficient; live Supabase/RLS isolation, deployed migration parity, production trigger/RPC and duplicate-race behavior remain NOT TESTABLE.
- Architect: APPROVE — FLOW-HOME-CHECKLIST-ALL-01 v5 header delta. Confirmed the plan and queue match on all 15 paths; compact Back AppBar, centered title, readable dog/date and segment position preserve scope and mutation behavior.
- Critic: PROCEED — FLOW-HOME-CHECKLIST-ALL-01 v5 header delta. Centered “Checklista” title and compact back control match Panel 4; dog/date context before the segments makes scope clear and `onBack` still returns to Hem.
- QA v1: FAIL — implementation and Alla renders passed, but the existing `home-checklist` browser verifier still asserted retired manager labels at `tools/visual-check/verify.py:63,66,71`. QA manually confirmed the current choose/remove-today labels work and preserve date/return-to-Hem behavior. No production behavior defect was found; the test assertion must be corrected and rerun before this checkpoint can pass.

## QA correction v6 — stale Idag render assertions (approved)

The approved implementation changed the existing routine manager's accessible day-action copy to `Välj rutinen <rutin> för idag` and `Ta bort rutinen <rutin> från idag`. The Idag visual verifier still expects retired “på Hemskärmen” labels, so its regression run fails at old assertions even though QA manually confirmed the updated flow. Correct only the five stale selectors in `tools/visual-check/verify.py`: the two choose and two remove selectors in `home-checklist` (lines 63, 66, 71 and 72) and the remove-today selector in `home` (line 364), matching the actual accessible labels in `DailyActivityManagerSheet.tsx`. This correction changes no app behavior, accessibility copy or mutation path and stays within the existing v5 write paths. Architect approved this test-only selector correction and required the Home flow run as well.

Rebuild and run public and review `home-checklist`, `home` and `checklist-all` verification, then rerun focused daily-activity tests, `pnpm check`, `python tools/dev_flow.py validate` and `git diff --check`. QA must independently rerun the affected verification. Keep the current live RLS, production race, native and device boundaries as NOT TESTABLE.


Architect v6 verdict: APPROVE — confirmed all five stale selectors and exact current labels; public/review `home-checklist`, `home` and `checklist-all` reruns are required.

## Independent QA v2 and Reviewer v6

QA v2: PASS for the local synthetic checkpoint. Focused tests 20/20; `pnpm check` 498/498; `python tools/dev_flow.py validate` PASS; all six public/review browser result files parse with zero page errors and the screenshot header was inspected. Reviewer independently ran `git diff --check` for tracked files and found no trailing whitespace in the new untracked checklist screen.

Reviewer v6: BLOCK. At the 60-second snapshot-age boundary, the 30-second `dailyClock` update can leave render-time `canWriteTemplates` stale for up to 30 seconds. Selected checklist completion, opening the manager, and its edit/delete handlers do not all recheck freshness at invocation. This violates acceptance criterion 5. Add a synchronous same-scope freshness/read-flight guard to every affected interaction and force the UI read-only/close the manager at expiry; test the boundary between clock ticks. Reviewer also found this task status line outdated; corrected above. Live Supabase/RLS, deployed migration parity, production duplicate races, native accessibility and physical-device behavior remain NOT TESTABLE.

Queue was returned to `blocked` for a v7 correction plan; no Panel 4 completion is claimed.
## v7 freshness-expiry correction — approved

Reviewer v6 blocked the checkpoint because the rendered 60-second freshness gate only updates with a 30-second clock tick. This plan closes that window without changing the data contract.

Use the exact current DailyChecklistScreen owner and ProductWorkspace gate. The scope key already covers current user, account generation, selected dog, local date, timezone and public/review content mode; a scope-key change clears the screen/session even when a draft is dirty. The current daily and training snapshots are accepted together with one update timestamp; schedule expiry from that shared timestamp (use the earliest expiry if they become separate). Writability is false when now is earlier than updatedAt or when age is at least 60,000 ms, and still requires ready current data, no refresh/error and no relevant same-scope read flight.

The expiry timeout must re-evaluate the live predicate when it fires, update the UI at the exact boundary, and reschedule if it fired early. Clean up or reschedule on scope, page, successful snapshot refresh, AppState activation and unmount. Keep the existing AppState refresh behavior.

Every All-origin interaction checks the latest scope/ref and Date.now at invocation, not the render-time boolean: manager open, selected completion, add/restore/remove, routine create/update/delete/save, delayed native delete confirmation and retry. Preserve an All-origin marker in the single daily mutation gateway and any pending retry; the gateway rejects All-origin writes/retries before invoking the operation. Existing Home-origin behavior remains unchanged. Rejection invokes no write/open/draft-update callback, shows accessible refresh-needed feedback and joins the current same-scope refresh rather than starting duplicate reads.

At same-scope age expiry, close a pristine All manager. Keep a dirty, pending or unknown manager mounted and visible read-only, preserving the draft/outcome. Announce that the saved list needs refresh. Permit only explicit local close/discard; these never imply a server write or cancellation of an uncertain operation. A successful refresh does not unlock that old session. The user must discard/close and reopen from the fresh snapshot. An operation begun while fresh may finish after expiry; preserve its truthful result and do not unlock the old session. Any account/user generation, dog, date, timezone, content-mode or ownership-scope change clears the old session immediately, even if dirty.

Behavioral evidence must execute the shared predicate and actual callback/harness path, not rely only on source-pattern tests. Cover age below 60 seconds, exactly 60 seconds, future timestamps/clock rollback, early timer delivery and reschedule/cleanup, expiry closure/read-only preservation, fresh refresh not unlocking a dirty session, explicit discard, scope change while dirty/pending, open/completion/add/restore/remove/create/update/delete/delayed confirmation/retry after render-time freshness, zero blocked writes, and a single coalesced refresh. Public and review renders cover the expired, refreshing and error states plus large text.

Architect: APPROVE plan v7. Critic: PROCEED. Security: PASS with required wording above. Risk remains H. No query, schema, RLS, RPC, dependency or data-purpose change is authorized or needed. After implementation, rerun focused QA and full checks, obtain Security verification of the implemented gate/origin propagation, then an independent Reviewer re-review. Live Supabase/RLS and native/device evidence remain separate NOT TESTABLE limits.

## Security follow-up v8 — date rollover, unresolved outcome, and captured sessions

Security implementation review found that a fresh-age snapshot could still be attached to yesterday when an action landed after local midnight, and a successful refresh cleared an unresolved failed/unknown mutation message while its retry remained pending. A delayed native confirmation also needed proof that a callback captured from an older manager session could not be reused after refresh.

The All-origin gateway now compares the selected local date against the current instant in the same IANA timezone at action time. All-origin mutation callbacks also carry the snapshot version from the rendered session, and the shared gateway requires it to match the latest successful snapshot before invoking the operation. Thus an old manager callback or confirmation cannot act merely because a replacement snapshot is fresh. Pending retry state records whether the outcome was failed or unknown; a successful read retains the corresponding truthful message and retry control until the mutation is confirmed or the scope changes. Retry keeps its original Home/All origin and is checked against the current session version.

Behavioral proof includes a deterministic Europe/Stockholm midnight boundary; the production mutation-gateway helper used by `ProductWorkspace` across completion, restore, removal, create, update, delete, delayed confirmation and retry categories; a deferred Alert confirmation after expiry and refresh; a successful operation that resolves after expiry; an unknown outcome retained through successful refresh; and dirty-session scope reset. The test build shim gains a one-shot delayed Alert callback so the confirmation path can be exercised in the React Native Web harness. This is synthetic browser evidence, not native Alert or backend verification.

## v8 QA and security record

Architect: APPROVE — v8 is an in-scope security correction to the approved v7 plan. The live-date gate, snapshot-version token, preserved failed/unknown status and delayed-Alert harness add no data-contract, dependency or persistence change. Risk remains H.

Security implementation review: PASS. The action guard and central gateway compare the selected date with the current date in the same IANA timezone; All callbacks and retry carry the captured snapshot version; stale manager callbacks are rejected after replacement refresh; successful reads retain same-scope failed/unknown state; scope changes clear the old draft/retry. `daily-activity-data.ts`, `package.json`, `pnpm-lock.yaml` and tracked Supabase files match the base commit. Live Supabase/RLS, migration parity, production duplicate races, native Alert, device accessibility and OS timezone-change behavior remain NOT TESTABLE.

QA v3: PASS for the local v8 checkpoint. Focused daily-activity tests 24/24 and full `pnpm check` 502/502 pass. Public/review result JSONs record 16/16 `checklist-all`, 5/5 `home-checklist`, and 5/6 `home` passes respectively, with zero page errors. The stale-session unknown-outcome and delayed-confirmation captures were visually inspected. Queue validation, Python syntax, scoped ESLint and diff whitespace checks pass.

Reviewer v8 first re-review: BLOCK on stale checkpoint bookkeeping and older public evidence; no production-path defect found. The fresh Architect approval, current QA state and canonical public result files were recorded; both canonical public/review All results contain 16 passes and zero page errors.

Final Reviewer v8: PASS. Confirmed current All-origin guard/session-version wiring, scope reset, read-only preservation, delayed-confirmation behavior, queue/task consistency and matching public/review counts. This closes the local `FLOW-HOME-CHECKLIST-ALL-01` checkpoint only; Panel 4 still depends on the Week and Upcoming flows. Live backend, native/device and OS timezone-change limits remain NOT TESTABLE.

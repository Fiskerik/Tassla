# UI/UX accessibility phase 2–5 — implementation plan

**Plan version:** 6
**Date:** 2026-10-19
**Branch:** `codex/tassla-ui-ux-bundle-2026-10-18`
**Mandate:** Erik requested implementation of packages 2a, 2b, 3, 4 and 5, and asked for a clearer directional transition when navigating between main pages.
**Scope source:** `docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md`; this plan converts the accepted package list into reviewable checkpoints.

## Shared constraints

- Preserve existing product scope, dog/account filtering, writes, retry/unknown semantics, and the five named main tabs.
- No schema, RLS, data-purpose, dependency, or native-module changes.
- Keep work on the current branch. Implement one checkpoint at a time; each checkpoint gets its own QA, Reviewer, evidence and commit/push before the next starts.
- Use existing React Native `Animated`, `RefreshControl`, `AppScreen`, UI tokens, and current data reload functions. Do not introduce a second navigation/refresh system.
- Local evidence must state separately what code/tests, rendered UI, native accessibility, live Supabase and release prove. Native VoiceOver/Dynamic Type/gesture behavior and live DB remain NOT TESTABLE in this environment.
- For all four H-class 2b checkpoints, an independent Security review must pass before code changes and re-check the frozen diff. The review is narrowly about preserving existing permission, mutation/recovery, dog/account isolation, consent and export boundaries; no new security/data behavior is authorized.
- Each checkpoint runs the relevant focused suite, `pnpm check`, public `pnpm bundle:ios`, `git diff --check`, and `PYTHONUTF8=1 python tools/dev_flow.py validate`; hooks remain enabled for commits.

## UX decision: main-tab direction preview

The current main-page transition is already horizontal and direction-aware, but moves only 8 pt. Keep this as a separate checkpoint, `UI-MAIN-TAB-TRANSITION`, rather than broadening the accessibility package. Increase the incoming-page offset through a named `tokens.motion.pageDistance` token (28 pt) and expose an optional distance to `ScreenTransition`; keep the established 240 ms easing, opacity cue, stop-on-key-change behavior, and immediate switch with reduced motion. Animate only when both previous and current routes are main tabs; support screens retain the existing 8 pt transition. Suppress animation on initial mount. A leftward tab change brings the next page from the right; a rightward change brings the previous page from the left. This is a short committed transition after a swipe/tap, not a finger-following interactive pager. The user still gets the main tab label and selected state as non-motion feedback.

**Acceptance:** main-tab swipes and bottom-tab taps show the correct directional incoming page; child/support screens retain their current transition; a new navigation interrupts the previous animation; reduced motion switches immediately; no initial-mount animation. Check both directions and small/large viewports. If local animated rendering cannot be captured, mark that visual/native part NOT TESTABLE rather than inferring it from the token test.

## Checkpoints

### 2a — `UI-ACCESSIBILITY-HOME-LOG` (risk M)

**Goal:** make Home, daily activity rows, Log and error/undo feedback readable and recoverable at narrow widths and larger text. Main-tab transition code, tests and evidence belong only to `UI-MAIN-TAB-TRANSITION`.

**Write ownership:** `src/features/home/HomeScreen.tsx`, `src/components/ui/DailyActivityItem.tsx`, `src/features/puppy-log/LogScreen.tsx`, `src/components/ui/Toast.tsx`, focused files under `tests/`, the relevant feature README(s), and this task’s evidence/queue/report/history entries. Main-tab animation is owned only by the separate `UI-MAIN-TAB-TRANSITION` checkpoint.

**Acceptance:** Home dog switch, daily activity checkbox/open/retry, quick-log event choices, date navigation, toast undo/retry/cancel, and Log add/edit/delete controls expose contextual accessible names/state and at least 44 pt targets; labels/status do not clip at 375×667, 375×844, 430×844 and 140% web text; confirm, error and unknown states retain distinct visible actions; undo is announced as undo and Back as navigation; pending status and retry remain reachable. This local checkpoint does not close native accessibility acceptance.

**Evidence:** focused source/interaction tests; before/after captures for Home and Log at representative narrow/large text settings; design-rules §14 checklist, with every uncaptured native dimension marked NOT TESTABLE.

### 2b.1 — `UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS` (risk H)

**Goal:** keep routine management and notification preference actions readable and operable while preserving their existing permission, save, failed and unknown behavior.

**Write ownership:** `src/features/home/DailyActivityManagerSheet.tsx`, `src/features/notifications/NotificationSettingsScreen.tsx`, focused files under `tests/`, relevant README(s), and task evidence/queue/report/history entries.

**Acceptance:** `Hantera rutiner → redigera/spara eller avbryt → rutinhall` and `Mer → Notiser → spara/permission feedback → tillbaka` work at 375×667 and 140%; long peer actions wrap/stack without shrinking 44 pt targets; text labels remain where the action/permission needs explanation; disabled/saving/failed/unknown states and permission denial remain explicit; no permission request or data write is triggered by layout or focus.

**Evidence:** focused tests and screen captures for the changed support flows at 375×667 and 140%; §14 review; native keyboard, largest Dynamic Type and VoiceOver are separately NOT TESTABLE unless device evidence is provided.

### 2b.2 — `UI-ACCESSIBILITY-HEALTH` (risk H)

**Goal:** keep weight, health history and planned health controls readable while preserving owner-entered data and explicit save/recovery state.

**Write ownership:** `src/features/health/HealthScreen.tsx`, `src/features/health/WeightScreen.tsx`, `src/features/health/HealthHistoryScreen.tsx`, `src/features/health/PlannedHealthScreen.tsx`, focused files under `tests/`, relevant README(s), and task evidence/queue/report/history entries.

**Acceptance:** `Mer → Hälsa/vikt → visa/lägg till/rätta/avbryt → historik` remains available at 375×667 and 140%; form footers and date/time controls are reachable with the keyboard; long actions stack; labels, busy/disabled and failed/unknown states are explicit; destructive actions retain a clear cancel path. No medical advice, fields, data purpose, scope, or persistence behavior changes.

**Evidence:** focused tests and captures of relevant health forms/history at 375×667/140%; §14 review. Native keyboard, largest Dynamic Type and VoiceOver remain NOT TESTABLE until the separate device check.

### 2b.3 — `UI-ACCESSIBILITY-PROFILES` (risk H)

**Goal:** keep dog selection and profile editing readable and recoverable without merging user profile scope with dog-scoped content.

**Write ownership:** `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, focused files under `tests/`, `src/features/onboarding/README.md`, this phase plan, and task evidence/queue/report/history entries.

**Local implementation checkpoint acceptance:** source and interaction tests verify the responsive layout rules, selection/busy semantics, existing 44pt+ target contracts, and preservation of keyboard/save/error/unknown/create/recovery callbacks. No dog/account model, profile/content scope, or create/retry semantics change. This checkpoint may close only after static QA, independent Reviewer, frozen-diff Security approval, all listed local checks, and its checkpoint commit are recorded.

**Deferred rendered/native acceptance:** actual profile list/edit/add/recovery rendering at 375×667/140%, physical keyboard/footer reachability, largest Dynamic Type, VoiceOver/TalkBack, focus order and measured target bounds remain OPEN / NOT TESTABLE in this environment. No screenshot, visual, §14, or native PASS is claimed. These scenarios transfer to `UI-NATIVE-ACCESSIBILITY-VERIFY`; the full profile accessibility acceptance remains open until device evidence is recorded.

**Evidence:** focused tests and source-contract review; explicitly record `RN Web render 375×667/140% = NOT TESTABLE`. The device batch must capture profile list/selection, edit save/cancel, add-dog confirmed and unknown/recovery paths, errors/retry and returns, with actual device/OS/text settings and keyboard/screen-reader/target-bound evidence.

### 2b.4 — `UI-ACCESSIBILITY-PASSPORT` (risk H)

**Goal:** keep share selection and PDF actions readable and distinguishable without changing consent or export behavior.

**Write ownership:** `src/features/passport/PassportScreen.tsx`, focused files under `tests/`, `src/features/passport/README.md`, this phase plan, `docs/decisions/MASTER-LOG.md`, and task evidence/queue/report/history entries.

**Local implementation checkpoint acceptance:** source and interaction tests verify responsive layout rules, selection/checkbox names and state, busy/disabled/error/success semantics, existing 44pt+ target contracts, explicit owner-initiated export and unchanged consent/data scope. The PDF continues to reflect only the chosen sections; no selection, snapshot, file, share destination or recovery behavior changes. Close this local checkpoint only after static QA, independent Reviewer, frozen-diff Security approval, listed local checks and checkpoint commit are recorded.

**Deferred rendered/native acceptance:** actual rendering at 375×667/140%, §14 visual review, native share sheet, largest Dynamic Type, VoiceOver/TalkBack, focus order and measured target bounds remain OPEN / NOT TESTABLE here. No screenshot, visual, §14 or native PASS is claimed. Transfer these scenarios to `UI-NATIVE-ACCESSIBILITY-VERIFY`; full Passport UI acceptance remains open until device evidence exists.

**Evidence:** focused tests and source-contract review; explicitly record `RN Web render 375×667/140% = NOT TESTABLE`. The device batch verifies selection-sheet open/toggle/checkbox name-state-focus and retained selection; actual chosen versus unchosen sections in preview/PDF; explicit PDF creation and OS share-sheet open followed by cancel without selecting a recipient; busy/error/unavailable/dialog-closed feedback and return to Passport; and app-scoped file cleanup. Record actual device/OS/text-size settings and measured target bounds; mark each unrun platform/state NOT TESTABLE.

### 3 — `UI-KNOWLEDGE-SEARCH` (risk M)

**Goal:** search the active dog’s already-fetched, published, age/breed-filtered guide list.

**Write ownership:** `src/features/knowledge/KnowledgeScreen.tsx`, a small pure guide-search helper under `src/features/knowledge/`, `src/features/home/ProductWorkspace.tsx` only if a dog-name prop is required for clear scope, focused files under `tests/`, `src/features/knowledge/README.md`, and task evidence/queue/report/history entries.

**Acceptance:** match title, opening text and full parsed body; normalize Unicode with NFC, lowercase using Swedish locale and collapse whitespace; keep the currently selected dog’s content scope explicit in the field label/help; scope query state synchronously to `sessionKey + dogId` so the previous dog/account query cannot appear for even one render after a scope change; support result, no-result, clear, loading, error/retry, open/back and dog-switch flows. Search only filters `items` supplied to `KnowledgeScreen`; it must not fetch drafts or bypass publication, age or breed selection. Reuse `parseGuideBody` rather than adding a Markdown parser. Do not add topic/breed filters or a new content schema.

**Evidence:** helper unit tests for normalization and matching; screen/source contract for scope and query reset; captured result/no-result/loading/error states at 375/430; §14 review.

### 4 — `UI-REFRESH-HOME-LOG` (risk M)

**Goal:** add native pull-to-refresh to the app-owned Home and Log scroll view while reusing current scoped reload logic.

**Write ownership:** `src/components/AppPrimitives.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/features/puppy-log/LogScreen.tsx`, focused files under `tests/`, relevant README(s), and task evidence/queue/report/history entries.

**Acceptance:** pull refresh uses the current dog and local date; Home joins the existing daily/training read without superseding it unnecessarily; Log has distinct initial loading and refresh states, joins one in-flight read per account/dog scope, and fences every completion/finally update with dog/account generation, abort and unmount; old confirmed rows remain visible if refresh fails; refresh error is distinct from an empty list; no late response overwrites a switched dog/account; loading state ends on success, error, cancellation and unmount. Optional refresh wiring appears only for Home/Log.

**Evidence:** lifecycle/helper tests for join/failure/stale-scope and view ownership, source tests for native RefreshControl wiring, captured Home/Log refreshing and retained-data error states; actual pull gesture is NOT TESTABLE without native-device verification.

### 5a — `UI-EMPTY-FEEDBACK-HOME-LOG` (risk M)

**Goal:** make first-run, loading, empty, partial and failed Home/Log states lead to a named real next action without false success.

**Write ownership:** `src/features/home/HomeScreen.tsx`, `src/features/puppy-log/LogScreen.tsx`, `src/components/ui/EmptyState.tsx` only if a concrete shared gap is confirmed, focused files under `tests/`, relevant README(s), and task evidence/queue/report/history entries.

**Acceptance:** skeleton only while the matching source is genuinely loading; true empty states offer one relevant existing action; read errors offer retry and do not masquerade as empty; partial log pagination remains distinct; uncertain writes preserve the current input and provide status check/retry; no permanent saved badge or unsupported offline promise. Verify first-login fixture, empty fixture, error and partial data.

**State-to-action contract:** (1) Home with no daily items → `Hantera dagens aktiviteter` opens the routine/activity manager; add or select an activity, close only after its confirmed state, and return to the refreshed Home list. (2) Home with no selected guide/training item → existing `Kunskap` destination tile opens Knowledge; return to Home retains the same active dog. (3) Log with no entries for selected day → `Lägg till händelse` opens the event chooser; choosing/saving returns to the timeline with confirmed event only. (4) Home/Log read failure → named `Försök igen` action retries the same dog/date scope; any confirmed rows remain visible. (5) Partial Log pagination failure → keep loaded rows and `Visa äldre poster`/retry distinct from the empty-day state.

**Evidence:** focused tests for each mapping and return/retention behavior; screenshots for empty, loading, read-error, unsure and partial-log states; §14 review.

### 5b — `UI-EMPTY-FEEDBACK-KNOWLEDGE-TRAINING` (risk M)

**Goal:** apply the same truthful first-use/loading/error contract to the Knowledge and Training content journeys.

**Write ownership:** `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/training/PublishedTrainingScreen.tsx`, `src/features/home/ProductWorkspace.tsx` for scoped return routes and profile entry, focused files under `tests/`, relevant feature READMEs, and task evidence/queue/report/history entries.

**Acceptance:** loading skeletons appear only for actual scoped reads; a successful empty published result has a useful next action or clear explanation; fetch errors preserve retry and never reveal review examples as published content; training with no age, no matched program, an empty program and completed programs stays distinguishable; dog switch does not show previous-dog results or query state; no persistent “Sparat” badge.

**State-to-action contract:** (1) Knowledge with zero search matches → `Rensa sökning` restores the active dog’s list; zero published guides with no query → `Checklistor` or `FAQ` opens its existing tab and the return path restores `För dig`. (2) Training with unknown age → `Lägg till födelsedatum` opens the existing `Hundprofil` editor; `Hundprofil` Back and successful save return to Training, not More. (3) Training with a successful empty age-filtered selection → `Öppna Kunskap` opens Knowledge; the Knowledge back action returns to Training, not Home or More. (4) Training read failure → `Försök igen` retries; never display review examples. An empty individual program explains that it has no steps and returns to its program list; completed programs keep their existing continuation action. Store a scoped return destination in the existing `ProductWorkspace` navigation state; do not add a second navigation stack.

**Evidence:** focused tests for each mapping, dog-switch query clearing and return paths; captures for zero-search, zero-published, no-age, no-program, empty-program and read-error states; §14 review.

## Review record and execution order

Required plan review: Architect and UX Critic review this plan version before any app-code change. The order is 2a → `UI-MAIN-TAB-TRANSITION` → 2b.1 → 2b.2 → 2b.3 → 2b.4 → 3 → 4 → 5a → 5b. Re-review if files, behavior, dependency or data scope materially changes. Local code checkpoints may close after local QA/Reviewer, but the named native verification below remains open and the larger MVP panel is not thereby complete.

**Batched device verification remains planned:** `UI-NATIVE-ACCESSIBILITY-VERIFY` runs after the code checkpoints. On an owner-selected physical device, record VoiceOver/TalkBack names and focus order, largest Dynamic Type, keyboard/footer reachability, reduced-motion transitions, main-tab swipes and pull-to-refresh gestures. For Hundprofil exercise list/selection → edit → save or cancel → profile; add dog → confirmed result and unknown/recovery → profile; error/retry and return destinations. Keep the keyboard visible while editing/adding and record whether fields and save/cancel actions remain reachable. For Tassla-pass open the selection sheet, toggle each section, verify checkbox name/state/focus and 44pt+ targets, then close and confirm selected sections remain selected. Create a PDF explicitly, verify preview/PDF contains exactly selected sections, observe the native share sheet and cancel without choosing a recipient; verify truthful busy/error/unavailable/dialog-closed feedback, return to Passport, and app-scoped temp-file cleanup. Record actual device/OS/text-size settings and measured target bounds. Mark every unrun OS/platform/state NOT TESTABLE. No device result is implied by this plan or by a web fixture. The checkpoint stays open until an owner-selected device run records its real results.

### Plan review record

- v1 Architect: **CHANGES** — separate the tab transition or give it disjoint tests/ownership; name controls; split 2b; add LogScreen and account-generation fencing to refresh; give 5 concrete actions and include profile route in Training empty-age recovery.
- v1 UX Critic: **PROCEED WITH CHANGES** — keep native accessibility as a named open device check, split 2b into journey checkpoints, and name exact state-to-action mappings/evidence for 5a/5b.
- v2 Architect: **CHANGES** — split transition, add Security gates for H-class support journeys, scope Knowledge query synchronously, add LogScreen and account-generation fencing, and give Training profile/Knowledge routes explicit return destinations.
- v2 UX Critic: **PROCEED WITH CHANGES** — remove the stale transition phrase from the 2a goal; the transition belongs solely to `UI-MAIN-TAB-TRANSITION`.
- v4 Architect: **APPROVE** for `UI-ACCESSIBILITY-HOME-LOG`, `UI-MAIN-TAB-TRANSITION`, `UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS`, `UI-ACCESSIBILITY-HEALTH`, `UI-ACCESSIBILITY-PROFILES`, `UI-ACCESSIBILITY-PASSPORT`, `UI-KNOWLEDGE-SEARCH`, `UI-REFRESH-HOME-LOG`, `UI-EMPTY-FEEDBACK-HOME-LOG`, and `UI-EMPTY-FEEDBACK-KNOWLEDGE-TRAINING`. Rationale: bounded ownership, concrete state/return acceptance, correct transition interruption/reduced-motion behavior, safe dog/account query and refresh fences, and no new data or dependency behavior.
- v4 UX Critic: **PROCEED** with no unresolved objections. Confirmed all 2b user journeys have entry/action/feedback/cancel/return, empty-state actions are concrete, and native accessibility remains explicitly open under `UI-NATIVE-ACCESSIBILITY-VERIFY`.

After each checkpoint: implement and clean up only its files; run focused tests, full `pnpm check`, `pnpm bundle:ios`, diff and queue validation; create evidence; independent QA verifies acceptance; independent Reviewer reads the frozen diff; on both PASS, commit and push to the existing branch, then continue.

No Codemagic run is planned. `pnpm bundle:ios` verifies the public JavaScript iOS export; it is not a signed native build or TestFlight check.


### Plan amendment v5 — 2026-10-19

- Architect: **APPROVE WITH CONDITIONS** — close `UI-ACCESSIBILITY-PROFILES` only as a local implementation checkpoint after static QA, Reviewer, frozen-diff Security, checks and checkpoint commit; keep rendered/native profile acceptance OPEN / NOT TESTABLE and add the profile journeys to the existing device batch.
- UX Critic: **PROCEED WITH AMENDMENT** — the split preserves the user journeys and makes the remaining visual/device gap actionable; static QA can PASS only for the bounded local acceptance, never as a visual result.


### Plan amendment v6 — 2026-10-19

- Architect: **APPROVE WITH CONDITIONS** — close `UI-ACCESSIBILITY-PASSPORT` only as a local implementation checkpoint after static QA, Reviewer, frozen-diff Security, checks and commit; keep rendered/§14/native share and accessibility acceptance OPEN / NOT TESTABLE until device evidence.
- UX Critic: **PROCEED** — the split preserves owner-initiated export and makes the native share risks explicit. The device batch must confirm selected sections persist and that preview/PDF contains only selected data; dismissing the share sheet is not delivery confirmation.
- Security pre-review: **APPROVE** for responsive layout only; all consent, data-selection, dog/account lifetime, export, native share, cleanup and recovery contracts stay unchanged.

### Plan amendment v7 — UI-KNOWLEDGE-SEARCH, 2026-10-19

- Architect: **APPROVE WITH CONDITIONS** — local source/test checkpoint only; rendered 375/430 search result, zero, loading, error and dog-switch views plus §14 remain OPEN / NOT TESTABLE. Do not claim a visual/native pass. Preserve the approved search/data contract: filter only supplied KnowledgeScreen items, keep the published and age/breed/active-dog selection in ProductWorkspace, search title/opening/full parsed body with NFC, Swedish lowercase and collapsed whitespace, scope query synchronously to sessionKey+dogId, and add no fetch/schema/taxonomy/dependency. Transfer exact capture and dog-switch checks to UI-NATIVE-ACCESSIBILITY-VERIFY.
- UX Critic: **PROCEED WITH CHANGES** — show the active dog's name in visible search scope copy and the accessible field label; distinguish no eligible published articles from no matches; preserve query during loading/error/retry and article open/back; on dog switch clear it or apply it only after the new dog's eligible list has synchronously replaced the old list. Keep å/ä/ö distinct from a/o; whitespace-only is an empty query; do not add fuzzy matching.
- Security review is not required for this M-class local search because this amendment adds no persistence, network request, data scope, or purpose.
- Local renderer limitation: react-native-web and react-dom are not installed. The checkpoint may close only after helper/screen tests, full pnpm check, public iOS JS export, diff/queue validation, independent QA and Reviewer. Device evidence is not substituted by these checks.

### UI-KNOWLEDGE-SEARCH — local checkpoint closeout, 2026-10-19

Architect v7 conditions satisfied. Local search implementation passed focused tests, full local check, public iOS JS export, diff/queue validation, independent QA and Reviewer. Rendered 375/430 states, §14 and device accessibility remain OPEN / NOT TESTABLE; they are transferred to UI-NATIVE-ACCESSIBILITY-VERIFY. Continue to UI-REFRESH-HOME-LOG.

---
name: tassla-consumer-ux
description: Interaction, feedback and state quality for Tassla. Use whenever you create or change a user-facing screen, component, flow, interaction, state, or Swedish UI copy (logging, sheets, dialogs, toasts, forms, navigation, loading/empty/error/offline states). Also use when reviewing or testing such changes. Do not use for backend-only, data-model, or configuration tasks.
---

# Tassla Consumer UX (behavior and interaction)

Tassla should feel calm, trustworthy and effortless for a new puppy owner. This skill covers how the app BEHAVES (flows, states, feedback, accessibility). How it LOOKS (tokens, components, colors, icons, layout, copy rules, visual checklist) is owned by `docs/design-rules.md`. Do not duplicate or override it.

## Precedence (stop and ask on conflict)
1. The owner's explicit decisions in the task
2. `docs/design-rules.md` and the target image `vision_rev01.jpg`
3. This skill
4. Existing code

If these conflict, stop and ask. Never resolve a conflict silently.

## Scope limits
- Do not add features, tabs, fields, onboarding, personalized feeds, share links, notifications, data collection, or schema changes unless the task explicitly approves them. A picture or a component list is not approval.
- Product strategy (retention, distribution, feed design) is out of scope here. Ask the owner.
- Do not touch unrelated screens, navigation, copy, data contracts, or shared tokens/components without approval. Declare the files you intend to change before coding.
- Reuse existing components and tokens. New UI patterns or dependencies need justification and approval.
- Do not add new animations, haptics, or sound unless the task asks for them. If asked: subtle, purposeful, 120-350 ms, interruptible, never blocking input, respect reduced motion, never the only feedback channel, and centralize durations as tokens. Haptics need an approved dependency and must not be required for core UX.

## Principles
1. **One clear purpose per screen** and an obvious next action. Remove redundant headings, cards, explanations, and CTAs.
2. **Fast everyday actions.** Common logging should be one tap from its entry point, with a working undo. Extra details are optional and come after, not before.
3. **Honest, immediate feedback.** Every action shows pressed, loading, success, error, or disabled state as fitting. Never show "Sparat" until the write has actually succeeded. Optimistic UI must reconcile failures.
4. **Native conventions first.** Follow platform back behavior, sheets, safe areas, and keyboard handling. No hidden gesture as the only way to finish a task.
5. **All states designed:** first use, empty, loading, partial, offline, permission denied, error, success, undo.
6. **Accessible by default:** screen reader labels, dynamic type, contrast, touch targets, non-color status cues, reduced motion.

## Save-state pattern (use for every write)
```
Idle -> Pending  : show "Sparar..." on that item only; disable duplicate submits
Pending -> Saved : no label on the item; toast only if it helps ("Kiss loggat"); undo available only now
Pending -> Failed: toast "Kunde inte spara" + "Försök igen"; keep the user's input
Pending -> Unsure: toast "Vi kunde inte kontrollera om det sparades" + "Försök igen"; never show Saved
```
- Undo exists only for a write that truly persisted. If undo is not possible, show no undo action and say why in the report.
- Handle double taps, slow network, offline, and a write that fails after an optimistic update.
- Updating one entry must keep the timeline and any summaries consistent.

## Quick log pattern
- Primary action visible and reachable, with an accessible label (for example "Logga kiss").
- Instant visual acknowledgement, reliable persistence, truthful result, undo where possible.
- Prevent accidental duplicates (repeat tap within about 2 seconds; same category within about 2 minutes asks "Du har redan loggat det här. Lägga till ändå?"). State the thresholds you chose as an assumption.
- Detail editing (time, note) is optional and opens after the fast action, in a sheet.
- Deleting asks for confirmation or offers a working undo. Delete lives behind a menu or in the edit view, not as a text link on every row.

## Delivery workflow
1. **Inspect:** affected screens, components, references, acceptance criteria, current behavior.
2. **Specify (before coding):** write a short UX spec in `docs/plans/<TASK>-ux-spec.md` with user goal, entry point, happy path, all relevant states, feedback, accessibility, assumptions, and deviations from the target image.
3. **Scope:** list intended files and protected areas. Ask before leaving scope.
4. **Implement** with existing components and tokens.
5. **Verify:** run typecheck, lint, tests. Check accessibility behavior. Take screenshots in each state, small and large phone, large text. If there is no baseline or no rendering, mark it NOT TESTABLE. Never claim visual approval from code checks. Physical device or TestFlight testing only when the owner asks for it.
6. **Review:** a role other than the implementer (for example the Critic or visual QA role defined in AGENTS.md) reviews behavior and perceived quality. The reviewer reports findings and does not silently fix the code under review.
7. **Report (short):** what changed, files touched, tests run and results, screenshots, assumptions, limitations, and explicit approval requests.

## Behavior QA checklist
Visual points (tokens, spacing, icons, colors, contrast, touch size, copy rules, one primary button) are in `docs/design-rules.md` section 14. Do not repeat them here.
- [ ] The main action is clear without instructions.
- [ ] Pressed, loading, success, error, unsure, and undo states behave correctly.
- [ ] Success feedback matches real persisted state.
- [ ] Double taps, slow network, offline, and failed writes are handled.
- [ ] Keyboard, focus, scrolling, and safe areas work. Input is preserved on failure.
- [ ] Screen reader labels, dynamic text, and reduced motion are checked.
- [ ] No unintended changes outside the declared scope, and no new patterns or dependencies without approval.
- [ ] Tests pass, or failures are documented and block approval.

## Stop and escalate when
- A screen deviates from the approved design without authorization.
- A "minor" task would change navigation, dog-profile data, or the schema.
- The UI could show success after a failed or unconfirmed write.
- A critical accessibility check or regression test fails.
- Evidence is missing for a critical redesign (state NOT TESTABLE, do not approve).
- You find an out-of-scope change.

## Done means
The task is effortless for the user, feedback is trustworthy, edge states are covered, the approved design is preserved, and QA evidence is recorded. Rendering and working buttons alone are not done.

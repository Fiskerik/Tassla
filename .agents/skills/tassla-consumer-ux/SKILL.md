---
name: tassla-consumer-ux
description: Interaction, feedback and state quality for Tassla. Use whenever you create or change a user-facing screen, component, flow, interaction, state, or Swedish UI copy (logging, sheets, dialogs, toasts, forms, navigation, loading/empty/error/offline states). Also use when reviewing or testing such changes. Do not use for backend-only, data-model, or configuration tasks.
---

# Tassla Consumer UX (behavior and interaction)

Tassla should feel calm, trustworthy and effortless for a new puppy owner. This skill covers how the app BEHAVES (flows, states, feedback, accessibility). How it LOOKS (tokens, components, colors, icons, layout, copy rules, visual checklist) is owned by `docs/design-rules.md`. Do not duplicate or override it.

## Precedence and conflict handling
1. Current explicit owner decisions and the authorized task scope
2. Truthfulness, safety, and concrete applicable legal/platform requirements
3. `docs/design-rules.md`, its linked rev02 screen/object specifications, and the target image `vision_rev02.jpg`
4. This skill
5. Existing code

Apply the highest relevant rule. Design rules govern appearance; this skill governs behavior, feedback, and states. Do not reopen decisions already recorded in the task or governing documents. If the rules leave a material product decision unresolved, record the conflict and ask the owner before dependent work. Follow the repository plan/review gates for scope changes, data, dependencies, and security. A visual component variant explicitly required by an approved design contract is within that contract.

**Current MVP accessibility scope:** Eriks decision 2026-10-21 applies to every MVP checkpoint. Preserve existing visible labels, meaningful state and semantics without knowingly regressing them, but do not add a systematic accessibility audit, 140% zoom, large-text/Dynamic Type, screen-reader, reduced-motion, keyboard/focus or target-size matrix as a task acceptance gate. Plan broad accessibility adaptations after the first MVP release and approval. Test keyboard/control behavior when it is needed for the feature's functional journey. `AGENTS.md` and `docs/design-rules.md` are authoritative if generic skill advice below differs.

## iOS design skill
Use the repository's `mobile-ios-design` skill when designing iOS-facing UI. Apply its Apple Human Interface Guidelines principles through the Expo adaptation documented in that skill. This skill continues to govern interaction, feedback, and states. Follow Tassla's `docs/design-rules.md`, approved screen contracts, and recorded owner decisions wherever they are more specific. Use existing React Native components, Expo Router, Ionicons, and theme tokens; treat SwiftUI examples as references, not implementation instructions. Do not add dependencies or ask the owner to reconfirm decisions already recorded in the repository.

## Scope limits
- Do not add features, tabs, fields, onboarding, personalized feeds, share links, notifications, data collection, or schema changes unless the task explicitly approves them. A picture or a component list is not approval.
- Product strategy (retention, distribution, feed design) is out of scope here. Ask the owner.
- Work only in the approved task scope; declare intended files and protected areas before coding. Do not touch unrelated screens, navigation, copy, data contracts, or components.
- Reuse and adapt existing components/tokens where they meet the approved design contract. Add named opt-in variants and tokens when that contract requires them. Get plan approval for scope expansion; dependencies follow AGENTS.md and project gates.
- Do not add new animations, haptics, or sound unless the task asks for them. If asked: subtle, purposeful, 120-350 ms, interruptible, never blocking input, respect reduced motion, never the only feedback channel, and centralize durations as tokens. Haptics need an approved dependency and must not be required for core UX.

## Principles
1. **One clear purpose per screen** and an obvious next action. Remove redundant headings, cards, explanations, and CTAs.
2. **Fast everyday actions.** Common logging should be one tap from its entry point, with a working undo. Extra details are optional and come after, not before.
3. **Honest, immediate feedback.** Every action shows pressed, loading, success, error, or disabled state as fitting. Never show "Sparat" until the write has actually succeeded. Optimistic UI must reconcile failures.
4. **Native conventions first.** Follow platform back behavior, sheets, safe areas, and keyboard handling. No hidden gesture as the only way to finish a task.
5. **All states designed:** first use, empty, loading, partial, offline, permission denied, error, success, undo.
6. **Preserve the working baseline:** keep existing visible labels, understandable status and semantic names/states. Systematic screen-reader, Dynamic Type, target-size, contrast and reduced-motion adaptation follows the post-MVP owner decision; do not treat generic guidance as an MVP gate.

## Visual finishing tips (Tassla examples)
Appearance is still governed by `docs/design-rules.md`, its approved screen contracts, and the existing theme tokens. Use these Refactoring UI ideas as a practical review lens, not as permission to invent styles or override an owner decision. Preserve contrast, accessibility, and the approved visual target when an example below conflicts with a token or contract.

- **Create hierarchy with restraint.** Make the screen's job and next action easiest to scan using the existing type, weight, and semantic color tokens before increasing type size or adding another heading. For example, on the daily log, `Logga kiss` or `Logga vatten` can be the prominent action while date/context text stays secondary. Shorten labels instead of shrinking text or stacking explanatory copy into every button.
- **Give categories distinct, accessible meaning.** Do not make different quick-log actions look interchangeable. In Tassla, the owner's stated direction is a warm yellow treatment for `Kiss` and blue for `Vatten`; pair color with the existing icon and label so meaning never depends on color alone. If the approved token set does not yet express that distinction, record it as a token/design-rules change in the UX spec and get the normal plan review; do not hard-code a one-off color in a screen.
- **Use readable foregrounds on colored surfaces.** Do not place a generic muted-gray label on a tinted category tile when it is hard to read at standard scale. Select the approved foreground token for that surface.
- **Use spacing and surfaces before decoration.** When two related rows need separation, first use the spacing scale or an already approved surface distinction. Keep a border when it communicates a control boundary, grouping, or state; avoid drawing a border around every nested element just to make the layout feel finished. Example: group the date and its calendar affordance as one clearly tappable row instead of boxing the date, icon, and hint separately.
- **Keep elevation quiet.** Use an existing elevation/shadow only where the design system already calls for a floating layer or meaningful depth. Avoid adding a shadow to every card or increasing blur to manufacture hierarchy; prefer spacing, surface, and type tokens.
- **Size icons by their role.** Use the intended Ionicon size inside the approved `IconChip` or category shape. If a small icon feels lost, improve its container or alignment rather than scaling the glyph until its visual weight overwhelms the label.
- **Use accents sparingly and consistently.** An accent rail, dot, or tint should signal a real category, current selection, or state. Do not add a decorative colored stripe to every card; first check whether an existing token/component already expresses the meaning.
- **Make action priority obvious.** Reserve the filled primary button for the one main action, such as `Spara rutin`; use secondary or tertiary variants for `Avbryt` and optional information. Keep destructive actions contextual and clearly labeled, and only give them dominant styling when the destructive choice itself is the explicit task.

These principles are adapted from [Refactoring UI, “7 Practical Tips for Cheating at Design”](https://medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886). Apply the ideas through Tassla's tokens and review gates; do not copy a visual example blindly.

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
2. **Specify (before coding):** write a short UX spec in `docs/plans/<TASK>-ux-spec.md` with user goal, entry point, happy path, relevant functional states, feedback, baseline labels/semantics to preserve, and assumptions. For UI work, include a compact comparison: reference element → current difference → token/component/asset → acceptance. List only unresolved deviations from the target image; do not repeat decisions already made in the design contracts.
3. **Scope:** list intended files and protected areas. Ask before leaving scope.
4. **Implement** with existing components and tokens.
5. **Verify:** run typecheck, lint and relevant functional tests. Take screenshots for changed states/viewports when visual behavior is material. 140% zoom and broad accessibility matrices are optional/informational, not MVP gates. If required evidence has no baseline or rendering, mark it NOT TESTABLE. Never claim visual approval from code checks. Physical device or TestFlight testing only when the owner asks for it.
6. **Review:** local QA verifies behavior and perceived quality for each checkpoint. The independent Reviewer evaluates the aggregate MVP closeout, not every checkpoint; never report a deferred review as PASS.
7. **Report (short):** what changed, files touched, tests run and results, screenshots, assumptions, limitations, and explicit approval requests.

## Behavior QA checklist
Visual points (tokens, spacing, icons, colors, contrast, touch size, copy rules, one primary button) are in `docs/design-rules.md` section 14. Do not repeat them here.
- [ ] The main action is clear without instructions.
- [ ] Pressed, loading, success, error, unsure, and undo states behave correctly.
- [ ] Success feedback matches real persisted state.
- [ ] Double taps, slow network, offline, and failed writes are handled.
- [ ] Keyboard, focus, scrolling, and safe areas work. Input is preserved on failure.
- [ ] Existing labels and action/state semantics are preserved; broad screen-reader, Dynamic Type and reduced-motion audits are deferred until after MVP release and approval.
- [ ] No unintended changes outside the declared scope, and no new patterns or dependencies without approval.
- [ ] Tests pass, or failures are documented and block approval.

## Stop and escalate when
- A screen deviates from the approved design without authorization.
- A "minor" task would change navigation, dog-profile data, or the schema.
- The UI could show success after a failed or unconfirmed write.
- A concrete applicable legal/platform requirement or functional regression fails; broad accessibility adaptation follows the post-MVP decision.
- Evidence is missing for a critical redesign (state NOT TESTABLE, do not approve).
- You find an out-of-scope change.

## Done means
The task is effortless for the user, feedback is trustworthy, edge states are covered, the approved design is preserved, and QA evidence is recorded. Rendering and working buttons alone are not done.

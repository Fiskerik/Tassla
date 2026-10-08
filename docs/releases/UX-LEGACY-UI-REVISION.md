# Legacy UI revision — 2026-10-08

## Scope

Full user-visible UI revision against the Figma sandbox examples, using the repo `tassla-consumer-ux` skill and Figma references in `docs/plans/FIGMA-DS-02.md`. Product behavior and data flows remain protected; shared visual primitives receive only token-based affordance updates explicitly requested by the user.

## Implemented

- **LUI-01:** replaced legacy persistent “Stäng status” feedback with timed Toast confirmation in six legacy screens; errors and uncertain save states remain explicit.
- **LUI-02:** weight editing is inline in the selected history card; the add form is disabled while editing and confirmation stays near the edited card.
- **LUI-03:** training-reminder choice is actionable when master reminders are off; the time picker keeps typed value visible above the selectable list and retains 00:00–23:59 validation.
- **LUI-04:** “Ändra händelse” editor received token-based borders and tighter, compact action grouping without changing Logga mutation/status logic.
- **LUI-05:** Published Training screen now uses a Figma-inspired “VECKANS FOKUS” panel, grouped progress, and checklist-style exercise cards; no data or interaction logic changed.
- **Full-route pass:** account, onboarding, auth callback, home previews (including DevelopmentPreview), knowledge previews, training, health, passport, notifications and Logga surfaces now share the same tokenized cream/green hierarchy, compact cards and touch targets.
- **Motion:** Logga expansion and Training disclosure transitions respect Reduce Motion; no unsupported Figma motion was fabricated.
- **Buttons:** primary buttons receive restrained elevation/shadow; tertiary, destructive and icon buttons remain flat for hierarchy.

## Verification

- Focused QA and independent review passed for LUI-01–LUI-04.
- Focused QA passed for the current LUI-05 training slice; independent review found no source-level regression, while rendered alignment, native keyboard behavior, and 360/430/stor-text screenshots are **NOT TESTABLE** in this environment.
- `git diff --check` passes.
- Full typecheck/lint and native tests remain blocked by missing dependencies and registry/network permissions; no dependency files were changed.

## Next

Run device screenshot QA for every revised route at 360/430 pt and large text, then iterate remaining visual differences against the Figma sandbox. Live `ProductWorkspace` remains protected and was not changed in this pass; it needs a separately approved post-cutoff visual comparison if required.

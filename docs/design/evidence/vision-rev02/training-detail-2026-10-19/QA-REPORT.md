# Independent QA - UX-TRAINING-DETAIL-2026-10-19

**Verdict:** PASS
**Date:** 2026-10-19
**Scope:** Equal recommendation-card sizing addendum and current B implementation/evidence.

## Findings

- Public captures show both cards at 260 px high at 375 px and 430 px widths, including the long-title fixture. Review capture at the 140% CSS text proxy shows all recommendation cards at 364 px (260 x 1.4). Card widths adapt to the viewport as intended.
- The visible title clamp is three lines; the full title remains in the accessible button label. The card image fills the clipped interior. The opt-in `fill` layout is used only by `PublishedTrainingScreen` recommendation cards; component-gallery cards retain intrinsic height.
- Completed detail at 140% naturally scrolls from 0 to 49 px in a 573 px content area over a 512 px client, making `Avmarkera` visible. Actionable detail fits at 140%; completed detail fits at standard text size.
- `RENDER-REPORT.md`, `RENDER-REPORT.json`, current captures and browser measurements agree. Public/review browser errors are zero. Full Panel 6 visual acceptance remains explicitly open, and synthetic-fixture/native limitations are accurately stated.

## Post-QA correction check

The mandatory pre-commit check exposed that the nested success Toasts did not spell out the selected-program guard expected by the existing policy assertion. Explicit `&& Boolean(selectedProgram)` guards were added to both nested Toasts. Independent QA confirmed each is inside a branch that already requires a selected program, so runtime and previous visual evidence are unchanged.

## Verification

- `pnpm typecheck` - PASS
- Focused ESLint for `HeroCard.tsx`, `PublishedTrainingScreen.tsx`, and `tokens.ts` - PASS
- `git diff --check` - PASS (line-ending notices only)
- `python tools/dev_flow.py validate` - PASS
- The independent QA pass did not run a test suite or edit files. After the guard correction, the required `pnpm check` completed: typecheck, edge typecheck, lint and 618/618 tests PASS.

## Scope note

The three-line visual clamp applies to `training-image-top` HeroCards even when `fill` is false. Current component-gallery titles are short, so captured intrinsic layouts are unchanged; full accessible labels remain intact. This is non-blocking for the reviewed card-sizing request.

Native iOS/Android layout, VoiceOver/TalkBack and actual device Dynamic Type remain not testable in the RN Web harness; 140% is a CSS proxy.

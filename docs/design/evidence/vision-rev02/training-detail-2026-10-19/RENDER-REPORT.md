# Render report — UX-TRAINING-DETAIL-2026-10-19

Date: 2026-10-19
Status: implementation and browser renders captured; independent QA PASS and Reviewer PASS. This report does not claim full visual acceptance of Panel 6.

## Scope and owner addition

The exercise detail reuses `assets/images/puppy-training.png`, shows the selected step's real ordinal, title and full instruction, and adds token spacing. The continue card keeps its existing image source and width token; the image uses `cover` and fills the clipped card interior.

The owner’s follow-up requires program recommendation cards to remain the same size across resolutions. Their base height is 260 logical points at standard system text and follows `useWindowDimensions().fontScale` for larger system text. The visible title is capped at three lines; `HeroCard` retains the complete program title in its accessible button name.

## Render setup and result

- The public and review bundles render the existing `PublishedTrainingScreen` through `tools/visual-check/app.tsx` with synthetic fixture data. No database reads, live Supabase/RLS, or production persistence are established by these screenshots.
- Viewports captured: 375×844, 430×844, 375×667, and a 140% CSS text proxy. The short viewport uses the real BottomSheet ScrollView.
- Program card measurements: both cards are 260 px high at 375×844 and 430×844, and with a long title. Review cards are 364 px in the 140% proxy, matching the 260×1.4 height calculation. Width changes with viewport width as expected. The 140% proxy also shows wrapping/clipping in the shared tab row and bottom-navigation labels at 375 px; this training-card addendum does not claim large-text navigation acceptance.
- At 375×667, the actionable detail fits without scrolling at standard and 140% proxy sizes. The completed state fits at standard text. At 140%, its ScrollView content is 573 px in a 512 px client; natural sheet scrolling moves scrollTop from 0 to 49 px and makes Avmarkera visible.
- Continue-card geometry in public evidence: normal 327×110 with the image 84×108; long title 327×178 with image 84×176; 140% proxy 327×202.84 with image 84×200.84. The 1 px inset per edge is the outer border. At larger copy sizes, the full-height crop shows more vertical scene and less horizontal scene, while the dog and person remain visible.
- The fixed-height behavior is enabled through an opt-in HeroCard fill property used by PublishedTrainingScreen; the component gallery does not opt in and retains intrinsic card height. Public and review browser runs completed with zero page errors. TypeScript and focused ESLint checks passed. No UI-specific test suite was added; the required repository `pnpm check` later passed all 618 tests after the final guard correction (see QA-REPORT.md). Native iOS/Android rendering, VoiceOver/TalkBack, keyboard behavior and actual device Dynamic Type are NOT TESTABLE in this RN Web harness. The 140% rendering is a CSS proxy.

Independent gates: [QA-REPORT.md](QA-REPORT.md) (PASS) and [REVIEW-REPORT.md](REVIEW-REPORT.md) (PASS, including the final source recheck).

## Evidence

### Public

- [Program cards — 375×844](public/program-cards-375x844.png)
- [Program cards — 430×844](public/program-cards-430x844.png)
- [Program cards — long title](public/program-cards-long-title-375x844.png)
- [Actionable detail — 375×844](public/actionable-375x844.png)
- [Actionable detail — 430×844](public/actionable-430x844.png)
- [Actionable detail — short viewport](public/actionable-375x667-scrolled.png)
- [Actionable detail — 140% proxy](public/actionable-140-percent-375x667-scrolled.png)
- [Completed detail — short viewport](public/completed-step-375x667-scrolled.png)
- [Completed detail — 140% proxy](public/completed-step-140-percent-375x667.png)
- [Locked later step](public/locked-later-step-375x667.png)
- [Program information](public/program-information-375x667.png)
- [Pending unmark](public/unmark-pending-375x844.png)
- [Error feedback](public/error-feedback-375x844.png)
- [Continue card — normal](public/continue-card-normal-375x844.png)
- [Continue card — long title](public/continue-card-long-title-375x844.png)
- [Continue card — 140% proxy](public/continue-card-140-percent-375x844.png)
- [Public browser measurements](public/browser-results.json)

### Review

- [Review program cards — 375×844](review/review-program-cards-375x844.png)
- [Review program cards — 430×844](review/review-program-cards-430x844.png)
- [Review program cards — long title](review/review-program-cards-long-title-375x844.png)
- [Review program cards — 140% proxy](review/review-program-cards-140-percent-375x844.png)
- [Review actionable detail — 375×667](review/review-actionable-375x667.png)
- [Review actionable detail — 140% proxy](review/review-actionable-140-percent-375x667.png)
- [Review continue card — long title](review/review-continue-card-long-title-375x844.png)
- [Review continue card — 430×844](review/review-continue-card-430x844.png)
- [Review continue card — 140% proxy](review/review-continue-card-140-percent-375x844.png)
- [Review browser measurements](review/browser-results.json)

## Visual comparison

Panel 6 of [`vision_rev02.jpg`](../../../../../vision_rev02.jpg) shows the training overview with search/filter affordances, a larger recommendation image, two smaller image cards, and a compact continue card. The fresh render keeps the warm canvas, rounded photo cards, two-column recommendation area, green selected outline/progress, and landscape continuation card. The cards now have an equal, fixed logical height across the two tested viewport widths and long-title fixture.

The detail reference is [`owner-training-detail.jpg`](reference/owner-training-detail.jpg). It depicts a full-screen exercise view with ordinal, instruction, primary action, next exercise and program information. The shipped interaction remains a BottomSheet; the new sheet image and spacing are visible, but its composition is structurally different from that full-screen reference. The reference does not specify a personal dog portrait or the exact image used by Panel 6; the existing generic training image is reused as requested.

## §14 checklist

1. **Ja** — The selected exercise has one primary completion action; the completed state exposes the separate `Avmarkera` action.
2. **Ej tillämpligt** — No peer primary actions were introduced.
3. **Ej tillämpligt** — No delete action is part of this detail flow.
4. **Ej tillämpligt** — This is not a Home activity row.
5. **Ja** — Image, ordinal, title, instruction and note use token gaps; the action is visible at 375×667 including the 140% CSS proxy.
6. **Ja** — Existing `HeroCard`, shared spacing/radius/color tokens and the new training-card height token are used.
7. **Ja** — No new icon family or symbol was introduced.
8. **NOT TESTABLE** — Existing warm surfaces and green accents were inspected in the captures; a numeric contrast audit was not performed for this change.
9. **Ja** — Labels describe the action they perform; the exercise thumbnail is decorative and hidden from accessibility.
10. **Ja** — Completed state and progress follow the existing confirmed progress data; no new completion claim was added.
11. **Ej tillämpligt** — No motivational banner was changed.
12. **Ja** — Fixture-only text is marked synthetic; production copy and sources are preserved.
13. **Nej** — The full-screen owner reference has a wider page hierarchy and more surrounding context than the BottomSheet. The sheet’s exercise content remains readable but does not reproduce that full-screen density.
14. **Ja** — Public renders cover actionable, locked, completed, program-info, pending and error states; review renders cover actionable, locked and program-info states.
15. **NOT TESTABLE** — Web semantics and CSS text proxy were inspected, but native VoiceOver/TalkBack, keyboard behavior and device Dynamic Type require devices.
16. **Nej — full Panel 6 match is not claimed.**
    - **Composition: Nej.** The reference includes search/filter controls and a larger recommendation area not shown in the current screen.
    - **Color distribution: Ja.** The warm background, pale cards, muted text and green selected/progress accents follow the reference’s roles.
    - **Typography: Ja.** The heading/label/metadata hierarchy is consistent; exact device-rendered font metrics are not established by RN Web.
    - **Component shapes: Ja.** The rounded image cards, selected outline and compact landscape continuation card use the same visual family.
    - **Imagery: Nej.** The existing generic training photo is warm and relevant, but it is not the exact set of photos in Panel 6.
    - **Content density: Nej.** The current screen has two recommendation cards and a variable-height continue card; the reference has additional search/filter context and different card proportions. The new 260-point fixed card height solves the equal-size owner request but does not by itself close those broader Panel 6 gaps.
17. **Ja** — Existing tabs, program selection and return/navigation behavior are preserved in the inspected states.
18. **Nej** — Panel 6 shows the active dog’s name and personal portrait; this task uses the existing generic training image and does not add dog identity/profile media.

### §14.16 outcome

The equal-height request passes in public and review browser renders at 375 px and 430 px widths, and with a long title. The card height adapts to system fontScale by design. Broader Panel 6 visual acceptance remains **No** for the documented composition, image and density gaps; the reference screenshot does not make native or production-data behavior testable.

## Commands checked

- `pnpm check` — PASS (app/edge typecheck, lint, 618/618 tests; rerun after the selected-program toast guard correction)
- `pnpm typecheck` — PASS
- `pnpm exec eslint src/components/ui/HeroCard.tsx src/features/training/PublishedTrainingScreen.tsx src/theme/tokens.ts` — PASS
- Public and review RN Web bundle builds — PASS
- Public and review capture scripts — PASS; browser errors: 0
- `git diff --check` — PASS (Git reported line-ending normalization notices only)
- `python tools/dev_flow.py validate` — PASS

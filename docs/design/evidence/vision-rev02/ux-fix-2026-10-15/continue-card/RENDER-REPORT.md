# UX-CONTINUE-CARD-01 — render checkpoint

Date: 2026-10-15 · Implementer checkpoint · Base: `e4759e6` · Working tree changes are not committed.

## Scope and fixture

`PublishedTrainingScreen` was rendered from the production component through `tools/visual-check/app.tsx` with synthetic content. The public and review bundles were built separately. These routes select the relevant states:

- `?screen=training&trainingScenario=default` — 1/3 progress and another untouched 0/2 program.
- `?screen=training&trainingScenario=unstarted` — no saved progress; no continuation card.
- `?screen=training&trainingScenario=half` — a 1/2 continuation, from the second program.
- `?screen=training&trainingScenario=complete` — 2/2 under Mina; no continuation card.
- `?screen=training&trainingScenario=several` — multiple programs with progress.
- `?screen=training&trainingScenario=long-title` — long Swedish program and next-step titles.
- `?screen=training&trainingScenario=unknown-age` — saved continuation kept separate from age-based recommendations.
- `?screen=training&state=empty` / `?screen=training&state=error` — empty and error surfaces.

The review bundle used the same unknown-age case and kept its synthetic review banner visible. No account, owner data, or live backend was used. Source design reference: [vision_rev02.jpg](../../../../../vision_rev02.jpg), panel 6 in the lower row, second panel.

## Captures

All public captures are in [public/](./public/) and review capture in [review/](./review/). Main viewports are 375×844, 430×844, and 375×667. Filenames identify the fixture state and viewport; `long-title-375x844-text-140.png` is the 140% text proxy.

| Capture | What it shows |
|---|---|
| [default-375x844.png](./public/default-375x844.png) | Standard continuation card and recommendation cards |
| [default-430x844.png](./public/default-430x844.png) | Wide phone layout |
| [default-375x667.png](./public/default-375x667.png) | Short viewport; screen scroll remains available |
| [unstarted-375x844.png](./public/unstarted-375x844.png) | 0/2 state has no continuation card |
| [half-375x844.png](./public/half-375x844.png) | Correct next step from 1/2 progress |
| [complete-375x844.png](./public/complete-375x844.png) | Completed program does not continue |
| [complete-2-of-2-mine-375x844.png](./public/complete-2-of-2-mine-375x844.png) | Completed 2/2 remains under Mina |
| [several-375x844.png](./public/several-375x844.png) | Several started programs; one truthful continuation |
| [long-title-375x844.png](./public/long-title-375x844.png) | Long program and step copy wrap without truncation |
| [long-title-375x844-text-140.png](./public/long-title-375x844-text-140.png) | Text-only 1.4× proxy; card grows while image remains 84×76 px |
| [unknown-age-375x844.png](./public/unknown-age-375x844.png) | Saved progress is separate from age recommendations |
| [empty-375x844.png](./public/empty-375x844.png) | Empty training result |
| [error-375x844.png](./public/error-375x844.png) | Existing error toast with saved continuation retained |
| [unknown-age-375x844.png](./review/unknown-age-375x844.png) | Review continuation with the review banner visible |

The fixture text scaling is a browser layout proxy, not native Dynamic Type. The review banner is fixture-only and adds 44 px above the app viewport. Native safe-area, VoiceOver, and Dynamic Type are `NOT TESTABLE` in this render.

## Manual browser observations

- The normal 375 px card measures 327×110 px; at 430 px it measures 382×110 px. The image is 84×76 px at both widths and at 375×667.
- With multiple started programs, the card grows to 130 px. Long program/step names grow it to 178 px at default text and 259 px in the 140% text proxy; the image stays 84×76 px.
- Tapping the 1/2 continuation opens the matching program at its next step. No browser page errors occurred during inspected public/review renders.
- The image uses the existing dog-and-handler training asset. Progress and the next step are derived from the fixture program’s completed-step IDs and order; no continuation is shown at 0/2 or 2/2.

## §14 implementer self-assessment

Independent UI QA and Reviewer returned PASS 2026-10-15. The queue task is complete for the local RN Web slice; native accessibility, Dynamic Type, and safe-area behavior remain `NOT TESTABLE`.

| §14 | Status | Evidence / reason |
|---|---|---|
| 1. One primary action and clear next action | Ja | One whole-card action opens the next allowed step. |
| 2. Equal actions have matching weight | Ej tillämpligt | The card has one action. |
| 3. Delete confirmation/undo | Ej tillämpligt | No delete action in this slice. |
| 4. Home-row rules | Ej tillämpligt | Training destination, not a Home list. |
| 5. Spacing, sections, safe area | Ja lokalt; native safe area NOT TESTABLE | 24 px content inset, section heading, and independent fixed thumbnail; native inset is inherited from the app shell. |
| 6. Shared tokens/components | Ja | Image frame uses named theme size tokens; card uses existing MotionPressable and Progress. |
| 7. Icon family | Ej tillämpligt | No icon in the continuation card. |
| 8. Color distribution/contrast | Delvis | Warm canvas, pale-green card and green progress match panel 6; a formal contrast audit is not part of this local render. |
| 9. Symbol, label and action agree | Ja | Accessible label names the program and next step; manual activation opened that step. |
| 10. Confirmed state only | Ja i fixture | Progress uses existing completed-step IDs; no optimistic progress write was added. |
| 11. Banner/encouragement noise | Ja | Public card adds no banner or encouragement claim; review-only banner is clearly synthetic. |
| 12. Plain copy | Ja | Swedish copy names the continuation, program, step, and completed count. |
| 13. Copy, metadata and image hierarchy | Ja | Program title, next step and progress follow the small training photo. |
| 14. Relevant states | Ja lokalt | 0/2, 1/2, 2/2, multiple, unknown age, empty and error captured. Loading is owned by the upstream workspace and is not a prop of this component. |
| 15. Hit target/accessibility/large text/motion | Ja i RN Web-fixture; native NOT TESTABLE | Whole row is a button above 44 px high with an accessible label and hint; 1.4× text proxy grows content without resizing the image. Native SR/Dynamic Type and reduced-motion runtime are not verified here. |
| 16a. Composition | Ja lokalt | Recommendation tiles lead into a separate horizontal continuation row, matching panel 6. |
| 16b. Colors | Ja lokalt | Warm canvas, muted green surface, dark text and green progress are visible; no global theme change. |
| 16c. Typography | Ja lokalt | Section title, program, next step and progress use descending hierarchy. |
| 16d. Component shapes | Ja lokalt | One rounded, softly bordered row with a bounded image; no nested card stack. |
| 16e. Object and progress | Ja i fixture | Exact program, next incomplete step and completed count come from the provided program state. |
| 16f. Content density | Ja lokalt | Compact at default size; long copy wraps and allows the row to grow. |
| 16g. Image language | Ja lokalt; independent assessment pending | Existing dog-and-handler reward photo is meaningful for training and remains visually compact. |
| 17. Tabs/navigation | Ja lokalt | Existing segmented controls and training navigation remain; tapping continuation stays in the Training destination. |
| 18. Dog name/image role | Ej tillämpligt | Panel 6 continuation does not show the dog’s name or portrait. |

## Verification boundary

- Public and review RN Web builds: PASS.
- Scoped ESLint for `PublishedTrainingScreen.tsx`, `tokens.ts`, and `tools/visual-check/app.tsx`: PASS.
- Manual Chromium rendering/continuation interaction: PASS for the captured synthetic cases above.
- Independent UI QA: PASS 2026-10-15. QA confirmed panel 6 composition, bounded image, state coverage, accessible label/hint, and the 1/2 next-step action. No test suites were run.
- Independent Reviewer: PASS 2026-10-15. Reviewer confirmed the production component and public/review captures match panel 6; progress and next step use supplied program state, the image remains 84×76 px as copy grows, 0/2 and 2/2 show no continuation, 1/2 opens the correct step, and unknown-age/empty/error states are covered.
- `git diff --check` and `python3 tools/dev_flow.py validate`: PASS at the implementation checkpoint.
- `pnpm typecheck`: BLOCKED by the existing unrelated `src/components/ui/Motion.tsx:61` error: `hovered` is not in `PressableStateCallbackType`. No Motion code was changed in this slice.
- No test suite or database operation was run. Live product data, backend persistence, native accessibility and native safe-area behavior are not established by this evidence.

# UI-ACTIONS-ROWS — implementation plan v2

Status: DONE · 2026-10-19 · v2.1; independent QA and Reviewer PASS
Owner mandate: Erik's request to continue with package 1b in `docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md`, after delivered package 1a.
Risk: M — the event type selector interaction changes, but the selected data, save flow, and persistence contract do not.

## User task and scope

Make contextual row actions and choices fit the screen and remain understandable without clipped text:

- Routine rows show a create-outline pen icon instead of the visible word `Redigera`; retain the full accessible label `Redigera rutin {name}` and at least a 44×44 pt target. Save, delete, and cancel labels remain visible.
- The log editor shows the selected event as the existing circular `IconChip` plus a downward chevron. Opening it reveals a vertically readable list with an icon and Swedish name for each supported `LOG_ENTRY_TYPES` entry. The current event remains selected on open; choosing a different type uses the existing `changeType` behavior and closes the list. Preserve accident detail, date/time, note, submit, deletion, cancellation, and error behavior.
- Routine weekday choices show `Må, Ti, On, To, Fr, Lö, Sö` on one horizontal row at normal text. Each hit target remains at least 44×44 pt; horizontal scrolling accommodates narrow screens and larger text without truncating/scaling down labels. Full Swedish weekday names remain available to assistive technology.
- Keep the checklist item's existing `variant="icon"` edit button: the installed `Button` implementation renders only the icon for that variant and it already exposes `Ändra {title}`. Add a regression assertion for this behavior; change the screen only if implementation evidence contradicts it.

Do not change event or routine data models, persistence, date/time controls, navigation, broad icon policy, or other screens.

## User journey

1. From routine management, identify a named routine and activate its adjacent pen; understand the accessible action name; edit remains the same guarded draft.
2. In an existing log editor, identify its current category from the circular category icon, open the category selector, see all category names beside their symbols and the current choice marked, then select another category and continue editing.
3. In weekly routine repetition, scan all seven short weekday names in one row and toggle days. At larger text/narrow width, horizontally reach every day without reducing touch targets.

## Reference-to-current comparison

| Reference / contract | Current difference | Component or token | Intended correction | Acceptance evidence |
|---|---|---|---|---|
| Action inventory 1b: contextual edit is a pen | Routine manager uses an icon plus `Redigera`, which wraps/clips on narrow rows; checklist edit is already icon-only | Existing local `IconOnlyButton`, `tokens.size.touchMin`; existing `Button` icon variant | Use the local icon-only action for routine edit; preserve full accessible label; regression-check checklist variant | Render routine names at 375×844, 375×667 and 140%; inspect accessible labels and target geometry |
| Action inventory 1b: selected event icon opens choices; each choice has icon and name | Log editor renders all choices as text pills, taking vertical space | Existing `IconChip`, `LOG_ENTRY_TYPES`, `LOG_EVENT_LABELS`, Ionicons chevron, semantic tokens | Replace grid with a selected icon/chevron trigger and a collapsible vertical choice list; preserve chosen value and save semantics | Public/review render and interaction: open, preselection, switch category, accident subchoices, save/cancel/error states |
| Action inventory 1b: all weekdays in a row; short text with accessible full names | Current choices wrap 4+3 and use long abbreviations `Mån/Tis/Ons/...` | Existing `MotionPressable`, `ScrollView`, `tokens.size.touchMin`, `tokens.typography.caption` | Use requested `Må/Ti/On/To/Fr/Lö/Sö`; one non-wrapping horizontal row with natural text scaling and horizontal scroll | Render 375×844, 430×844, 375×667 and 140%; prove each target >=44×44 and all labels reachable |
| Primary, delete and cancel controls stay explicit | Existing visible labels already meet this | Existing Button | No change | Regression assertions and screenshot |

The affected Log surface is panel 5 (Logga); the weekly rule is a Home/daily-checklist support flow. This package changes only the relevant controls, not full visual acceptance of either panel. `PuppyChecklistScreen`'s existing edit action is explicitly checked against the real shared `Button` source.

## Files allowed to change

- `src/features/home/DailyActivityManagerSheet.tsx`
- `src/features/home/README.md`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/puppy-log/README.md`
- `tests/ui-actions-rows.test.mjs`
- `tests/log-screen-policy.test.mjs` only if its existing assertions need to reflect the new selector
- `docs/tasks/dev/UI-ACTIONS-ROWS.md`
- `docs/plans/UI-ACTIONS-ROWS-ux-spec.md`
- `docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/releases/HISTORY-2026.md`
- `docs/design/evidence/ui-actions-rows-2026-10-19/VERIFICATION.md` and related render evidence in that directory

No dependency or migration changes.

## Acceptance

1. Routine edit is a 44×44-or-larger icon-only pen; screen readers announce the routine-specific edit label. No clipped `Redigera` text remains on that row.
2. Checklist edit remains visually icon-only and accessible by its full label.
3. Log category trigger shows the selected category icon and chevron, has a category-specific accessible name and expanded state, and opens on activation.
4. Expanded category choices include all and only `LOG_ENTRY_TYPES`, each with the central category icon and localized name; selected state reflects the editor's current value.
5. Selecting a choice closes the picker, changes only the editor's existing category state, preserves legacy accident handling, and leaves the original save/date/note/delete/cancel/error contracts intact.
6. Weekday labels are exactly `Må, Ti, On, To, Fr, Lö, Sö`; row does not wrap at standard size, all target extents are at least 44×44, accessible names stay full, and horizontal overflow remains reachable at 140% and 375×667.
7. With the event list expanded at 375×667 and 140% text, date/time, note, delete/cancel, and the sheet footer save action remain reachable by scrolling the existing BottomSheet; scrolling back to the trigger and collapsing the list preserves the edited category/date/note draft.
8. Visible primary, destructive, and cancel actions retain text.
9. Store the 18-point visual review for the affected controls and actual render screenshots; rate only the applicable elements. Do not claim full panel acceptance from this package.
10. Independent QA and Reviewer pass the final scoped diff; `pnpm check`, public iOS JS bundle, `git diff --check`, and queue validation pass before closeout.

## Verification plan

- Focused: `node --experimental-strip-types --test tests/ui-actions-rows.test.mjs tests/log-screen-policy.test.mjs tests/daily-activity-ui.test.mjs tests/checklist-ui.test.mjs`
- Full: `CI=1 pnpm check`
- Bundle: `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`
- Visual: use `tools/visual-check` with public and review fixtures where practical; capture comparable relevant states at 375×844, 430×844, 375×667, plus 140% zoom. Compare the routine-manager and log-editor control details against current design rules and the accepted package contract. Record inaccessible native/Dynamic Type states as NOT TESTABLE.
- Hygiene: `git diff --check`; `python tools/dev_flow.py validate` with UTF-8 output.
- QA/Reviewer: independent review of plan completion, final source diff, interaction evidence and limits.

## Plan review

- Architect: **APPROVE plan v2**. Confirmed bounded existing-UI scope, M risk, live component/API contracts, dependency completion, and expanded-picker reachability.
- UX Critic: **PROCEED plan v2**. Required explicit 375×667/140% reachability for lower fields/actions/footer and preservation of category/date/time/note draft when collapsing; incorporated before implementation.
- Security/Compliance/Dog Expert: not required; no data, permission, medical-content, network, or purpose changes.

## Implementation checkpoint

- Routine management now uses the existing 44×44 icon-only pen with the routine-specific accessible name. Weekday labels are `Må, Ti, On, To, Fr, Lö, Sö` in a single horizontal `ScrollView`; full accessible names and target sizes remain.
- The log editor now shows the selected `IconChip` plus a down-chevron; the expanded list contains all seven existing event types with icon, Swedish name, selected checkmark and explicit `aria-checked`. `changeType`, accident detail, date/time/note, and existing save/delete/cancel behavior remain in place.
- Browser interaction exposed that React Native Web did not reflect the selected radio state from `accessibilityState` alone. Explicit `aria-checked` was added and verified in the rendered DOM and regression test.
- Synthetic screenshots and scoped 18-point review: `docs/design/evidence/ui-actions-rows-2026-10-19/VERIFICATION.md`.
- Local verification: focused 1b checks, full `CI=1 pnpm check` (545/545), public iOS JS export (1,446 modules), synthetic RN Web interaction/rendering at 375×844, 430×844, 375×667 and 140% CSS zoom, `git diff --check`, and `python tools/dev_flow.py validate` all PASS. Native Dynamic Type/VoiceOver, live Supabase/RLS, and signed Codemagic/Xcode build remain NOT TESTABLE here.
- The tenth capture verifies that the date (`2026-10-18`), time (`12:05`) and note draft remain after changing event type. Independent QA: **PASS**. Independent Reviewer: **PASS**; reviewed the source diff, shared components, type-change effects, regression tests and evidence, with no blocker.
- Full panel rev02 acceptance is outside this scoped checkpoint.

## Decisions and limits

- Existing `IconChip` is the source of category artwork and localized category labels. Do not add new icon assets or dependencies.
- Large-text weekday overflow uses horizontal reachability rather than wrap, as explicitly permitted by package 1b; text and targets retain natural size.
- The review harness is synthetic. It can establish local presentation and interaction only, not native VoiceOver, actual Dynamic Type sizing, Supabase/RLS, or TestFlight.
- Package completion does not mark panels 1, 4, or 5 complete; remaining release work is inventoried separately after this checkpoint.
- Handoff: next UI/UX package is `2a UI-ACCESSIBILITY-HOME-LOG`, followed by 2b, 3, 4 and 5 in the [release order](../../plans/UI-UX-NEXT-PACKAGES-2026-10-18.md).

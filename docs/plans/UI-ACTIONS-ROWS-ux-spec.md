# UI-ACTIONS-ROWS — UX-spec v2

Date: 2026-10-19. Scope: package 1b from `UI-UX-NEXT-PACKAGES-2026-10-18.md`.

## Goal

Reduce clipped contextual text, make event type selection compact but discoverable, and keep weekly choices in a single scan line without shrinking controls.

## Entry points

- `Hem → Hantera dagens aktiviteter → weekly routine → Eget intervall → Veckor`
- `Logg → existing event row → Ändra händelse`
- `Kunskap → Checklistor → own checklist item → edit` is a regression-only control; its current icon-only variant must stay so.

## Happy paths

- Routine: pen next to routine name → edit existing guarded draft → save or cancel with existing text controls.
- Event: selected category icon plus downward chevron → open readable category list → choose icon+name row → continue with date/time/note → save or cancel.
- Weekday: scan `Må Ti On To Fr Lö Sö` in one row → toggle desired days; at increased text size, swipe the row to reach remaining targets.

## States and feedback

- Event picker collapsed by default with the event's existing category selected; expanded state is announced. Category changes close the list and preserve existing error/retry/save states.
- Every routine weekday remains independently selected/disabled as today. Empty selection still shows the existing validation message.
- Disabled/loading/save/delete/cancel state is not redesigned.

## Short screens and preservation

The category rows expand inside the existing BottomSheet `ScrollView`; the sheet has a fixed footer outside that scroll area. At 375×667 and 140% text, scroll the expanded list and confirm date/time, note, secondary actions, and footer save remain reachable. Return to the trigger and collapse without resetting the event type, date, time, or note draft.

## Accessibility

- Routine pen name is `Redigera rutin {routine name}`.
- Checklist pen name remains `Ändra {item title}`.
- Event trigger name includes selected category; it announces expansion. Each option exposes the localized full category name and selected state; nested decorative icon is hidden from accessibility to prevent duplicate focus.
- Weekday visual labels are `Må, Ti, On, To, Fr, Lö, Sö`; labels for assistive technology remain `Måndag` through `Söndag`.
- All actionable targets stay at least 44×44 pt. No text is locally scaled down to fit.

## Design comparison

| Journey | Current | Target | Acceptance |
|---|---|---|---|
| Routine edit | Icon and visible word can wrap to a narrow vertical column | A pen aligned with the named routine; no visible word residue | Compare normal/short viewport and long routine name |
| Event type | Seven text choices occupy a wrapping grid | Selected circular event symbol with down arrow; open list shows a clear icon/name for each option | Verify all seven options and current selection; accident details remain below when relevant |
| Weekday selection | Seven buttons wrap and use longer abbreviations | A single horizontal row using requested short labels | Verify fit at normal size, then scrolling and target sizes under larger text |

## Assumptions

- The user's approved package table is the product decision for this scope.
- Existing `IconChip` maps each supported log type to its intended category artwork and color.
- A horizontal scroll container is the accessible overflow behavior for the weekday row; no new font-size override or smaller touch target is permitted.
- Checklist edit is already icon-only in the real Button implementation and needs regression coverage, not a redesign.

## Files and protected scope

Use the exact list in `docs/tasks/dev/UI-ACTIONS-ROWS.md`. Do not change persistence, data models, navigation, global Button defaults, event category semantics, or unrelated screens.

## Native limitations

RN Web screenshots and interaction are not native VoiceOver or Dynamic Type evidence. If native testing is unavailable, mark it NOT TESTABLE in the checkpoint and keep the package's claims scoped to local presentation and behavior.

# UIUX-POSTFLIGHT-CORRECTIONS-01 — implementation record

Plan: `docs/tasks/dev/UIUX-POSTFLIGHT-CORRECTIONS-01.md` v4 (Architect APPROVE).

## Implemented

- Log event editing uses the saved event's round category icon and a chevron; the expanded list presents each existing selectable event type with its icon and name. Accident subtype and legacy unknown behavior remain unchanged.
- Shared date/time triggers now use calendar/clock icons. Field labels and accessible button names remain; this applies to every `DatePickerField`/`TimePickerField` consumer.
- Routine edit labels stay on one line. Weekly repeat choices use `Må`, `Ti`, `On`, `To`, `Fr`, `Lö`, `Sö` in a single row with full accessible day names and 44 pt minimum targets.
- Weight correction actions have responsive save/cancel widths and separation before delete.
- The manager sheet remains mounted through dismissal. Its opt-in dismiss callback and 450 ms non-iOS fallback share a one-shot training handoff guard.
- Main navigation claims horizontal movement during responder capture while respecting `HorizontalGestureRegion` exclusions and the existing direction threshold.

## Verification status

- Static QA and independent Reviewer both PASS on plan v4 and the source diff; neither ran tests or commands.
- `python tools/dev_flow.py validate` PASS and `git diff --check` PASS after implementation. Existing test files are unchanged; no automated tests were added or run.
- Native modal dismissal, physical horizontal swipes, VoiceOver, Dynamic Type, and installed TestFlight behavior still require manual device verification. The 450 ms fallback is a platform safety delay, not proof that native dismissal completed.

## Manual TestFlight checks

1. Edit a Bajs event: verify the round icon and chevron, open the list, choose another type, then verify the saved type and accident Kiss/Bajs controls.
2. Open date and time controls in Logg, Vikt, Hälsa, Planerad hälsa, Hundprofil and Notisinställningar; confirm the calendar/clock icons open the same pickers and labels/values remain readable.
3. Edit a routine on a phone: verify Redigera remains horizontal and the seven weekly choices stay on one row and toggle/save correctly.
4. Correct a weight: verify save, cancel and delete are separated, reachable and retain their existing confirmation/result behavior.
5. From both Hem and Checklista, open Rutiner och aktiviteter → Öppna Träning; verify no frozen/backdrop-blocked app, then return to the originating screen.
6. Swipe left/right across Hem, Logg, Träning, Kunskap and Mer. Confirm vertical scrolling, the age strip and nested horizontal controls still work; confirm dirty forms keep their leave guard.

# UIUX-REVAMP-R1A-BREED-01 UX spec

Version: 1
Date: 2026-10-16
Status: reviewed with plan v3; implementation and local verification complete; independent QA and final Reviewer PASS.

## User goal and entry point

When creating a dog profile, the owner decides the dog's breed. The screen is reached from onboarding after authentication when no owned dog profile is available. Kennel code remains optional and is unrelated to breed selection.

## Happy path

1. The profile screen shows the breed catalog loading state.
2. When at least one breed is available, every option is unselected. A short instruction says “Välj en ras för att fortsätta.”
3. The owner activates one radio option; it becomes the sole selected option and the instruction disappears.
4. Continue stays disabled until the existing name, valid birth date, optional kennel conditions, and explicit breed choice all pass.
5. With valid name/date and no kennel code, Continue becomes available and enters the existing profile-create handler.
6. Existing save/readback/status behavior remains in place. This local fixture does not claim a persisted result.

## Relevant states and feedback

| State | UI | Action |
| --- | --- | --- |
| Catalog loading | Existing loading message; Continue disabled | Wait for catalog |
| Ready, non-empty, no choice | Unselected radio group and visible accessible instruction | Choose a breed |
| Ready, non-empty, selected | One selected radio; instruction removed | Continue when other fields are valid |
| Ready, empty | Clear “Raslistan är tom just nu.” message and retry button; Continue disabled | Retry catalog fetch |
| Catalog error | Existing error message and retry button; Continue disabled | Retry fetch |
| Error retry recovers | Loading then unselected ready state | Choose a breed |
| Profile write pending/saved/error/unknown | Existing save behavior and feedback | Unchanged by this task |

The current product shows retry only before the first successful catalog load, so there is no owner-selected value at that retry point. A harness-only repeated fetch checks that an existing selection is not cleared by another catalog response; it is not presented as a user-visible retry affordance.

## Accessibility and interaction

- Keep the existing radiogroup and radio roles, labels, selected state, and touch targets.
- The instruction is visible text that remains in the accessibility tree and is associated with the selection area. Announce its appearance politely where the platform supports live regions; VoiceOver/native announcement behavior remains NOT TESTABLE in RN Web.
- Empty and failed states expose a clearly named retry button; color does not carry the only distinction.
- Continue uses its existing disabled state; no hidden gesture is added.
- Do not add animation, haptic, sound, or new dependencies.

## Design comparison

| Reference element | Current difference | Reuse | Acceptance |
| --- | --- | --- | --- |
| Grouped profile form | The first fetched breed is selected without owner input | Existing 44+ px radio rows, form card, text tokens | Initial catalog leaves every radio unselected |
| Required field guidance | No explicit message identifies why the breed group blocks Continue | Existing form label and text/caption tokens | Visible concise guidance appears only with a ready non-empty unselected list |
| Catalog empty state | No message or retry appears when fetch succeeds with an empty array | Existing MessageCard and PrimaryButton | Clear empty message and retry; no disabled dead-end |
| Primary action | Existing Continue already enforces Boolean(breedId) | Existing PrimaryButton | Remains disabled without a deliberate choice and all other valid fields |

vision_rev02.jpg contains no dedicated profile-create panel. This comparison follows the nearest grouped-form design rule; it is not a direct pixel-match claim.

## Assumptions and exclusions

- Existing catalog contents and stable IDs are authoritative; this task does not add or reorder breeds, resolve catalog licensing, or implement Mix.
- No persistence, profile schema, create RPC, ownership, or kennel attribution contract changes.
- Native VoiceOver, Dynamic Type, physical keyboard/safe area, successful database write/readback, and distribution are outside local web evidence and remain NOT TESTABLE.
- Draft protection, navigation/sheets, and connected journeys remain later masterplan slices.

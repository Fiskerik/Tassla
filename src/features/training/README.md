# Träning

`PublishedTrainingScreen.tsx` is production Panel 6. The overview has **Rekommenderat**, **Alla övningar**, and **Mina** views, a maximum of two 4:3 recommendation cards, and a separate continuation card when confirmed progress has a next step. The views use published program versions, the active dog’s age/breed selection, and that dog’s `training_progress`.

## Data and behavior

`fetchTrainingWorkspace` returns only published versions and steps. Each program has `currentAgeBreedMatch`, which is true only if that exact version is selected by the current age/breed matcher. A started older version can remain resumable without being described as current-age-matched. The workspace route contract is unchanged.

`Rekommenderat` shows only age/breed-matched, unstarted programs with a real next step. Each entire card opens that exact step. `Visa alla` opens the full currently available program list. `Mina` contains programs with at least one confirmed completion in the displayed version and labels paused older versions separately. Unknown age removes age-based recommendations but keeps saved progress reachable.

The data contains no duration or subject taxonomy, so the UI does not fabricate time/category chips. Two distinct generated photos are decorative standard images without a visible badge after the owner’s 24 October cleanup request; image provenance remains in the manifest. The continuation card uses a third, distinct Corgi photo in a square 88×88 pt crop. Recommendation cards measure the whole copy block and share the largest natural height for the current width, font scale and content. The program name uses smaller regular metadata type than the bold exercise title. Cards keep full titles, and omit long step instructions from the overview; opening a card still reveals the full instruction. Home's current `Just nu` recommendation is text-only; it opens the same next exercise and does not show that photo.

A recommendation opens its exact exercise and exposes the journey start action in that same sheet. Program details place start/resume and confirmed journey totals before the step list. When a saved start, next, or back action returns before refreshed props arrive, the screen waits; it opens only the active step returned by the refreshed workspace. A paused journey has a direct resume action.

An exercise is saved with its published version ID and step ID through insert/readback. Legacy activity marking and unmarking stay available in a collapsed “Aktivitetsmarkeringar i programmet” section. Journey totals use logged sessions and unique owner-confirmed milestones; legacy activity counts do not stand in for journey progress. Only the first incomplete step can be marked. A confirmed step may be unmarked separately; the exact dog/version/step is deleted and re-read before Home updates. Failed or unknown writes do not appear as confirmed progress. The three views use shared accessible `Tabs`. In a program detail, reset is a 44 pt icon action that opens a named confirmation dialog bound to the exact current program; cancel does nothing, and confirmation calls the existing reset path once. The dialog does not promise an atomic reset. The interface describes the owner’s mark, not a verified skill.

The separate progression journey in a program detail is bound to one dog and one published version. A logged session uses one of three fixed feedback choices; a milestone requires a separate owner action after at least one saved session. Only the owner’s explicit `Fortsätt` action changes the saved step. Repeat, back, pause and maintenance preserve sessions and confirmed milestones. Unknown writes can be checked with the same operation ID. These counts remain separate from the older activity marks and Home’s daily list.

`TrainingScreen.tsx` and `training-model.ts` are local preview fixtures only. They are not production references. Review fixtures are memory-only; a real fetch error never falls back to examples. A real published-content read and RLS verification need a development Supabase environment.

## Verification

Focused model/data/screen tests are in `tests/training-overview.test.mjs`, `tests/training-activity-date.test.mjs`, `tests/workspace-data.test.mjs`, and `tests/training-screen-policy.test.mjs`. Public/review render evidence for the production screen is in `docs/design/evidence/flow-training-01/` and the current reset/tab review is in `docs/design/evidence/vision-rev02/ui-r02-04-panelhelhet/`. Panel 6 remains partial until its full panel review, native accessibility, and live published-content/RLS are verified.

## Historical record

An earlier local redesign temporarily removed the three views. That decision is superseded by `FLOW-TRAINING-01` and current panel 6 in `vision_rev02.jpg`; it does not govern the active component.


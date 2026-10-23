# FLOW-TRAINING-01 — Panel 6 recommendation and resume flow

- **Date:** 2026-10-22
- **Status:** implementation complete for the local UI slice. Independent QA and Reviewer pass; production-content/RLS verification remains open.
- **Source of truth:** panel 6 in `vision_rev02.jpg`, `docs/design/vision-rev02-screen-contracts.md`, and `docs/MVP-EXPERIENCE-CONTRACT.md`.
- **Purpose:** bring the production Training overview closer to the target composition while preserving the published-version and confirmed-progress rules already in production.

## Scope

1. Add three meaningful views: **Rekommenderat**, **Alla övningar**, and **Mina**. Recommendations contain only currently age- and breed-matched published versions. All exercises lists the currently available program versions and their steps. Mina contains programs with confirmed progress and clearly labeled paused versions.
2. Show up to two recommendation cards in a two-column 4:3 image layout. A card opens the exact next allowed exercise for its program. One item remains one card; never duplicate content to fill the row. `Visa alla` selects the all-exercises view.
3. Show **Fortsätt där ni var** only for confirmed, incomplete progress. The card names the exact program/version context, next allowed exercise, and confirmed progress. It opens that same exercise.
4. Use distinct decorative standard images for the two recommendation cards and retain the existing matching image for the Home/Training continuation action. Label generic recommendation imagery **Standardbild**; do not imply that a generated image is the user’s dog or proves an exercise took place.
5. Keep current source, review, error, saving, reset, unmark, historical-step, dog-scope and confirmed-readback behavior intact.

## Data and copy decisions

- `fetchTrainingWorkspace` loads published versions and confirmed progress. It returns the exact current age/breed-selected version together with each breed-compatible published version that has progress, deduplicated only by exact version ID. Saved progress from an older version must never replace or hide the current recommendation. Only IDs selected by the exact age/breed matcher carry `currentAgeBreedMatch: true`.
- A paused version keeps its published title and version number when that metadata is available. Progress for unavailable versions remains visible as one grouped status because RLS may not expose their historical title; internal UUIDs are not shown to users.
- No category, duration, favorite, difficulty, or recommendation-score field exists in the training contract. Do not invent category/time chips or a personalized ranking. The recommendation order remains the existing stable order with resumable work prioritized only in its separate continuation card.
- `Mina` means programs with at least one confirmed step, including fully completed programs. An unconfirmed, failed, or unknown write never adds a program to this view.
- When age is unknown, recommendations explain that a birth date is needed; the Mina view remains usable for saved progress. Empty, loading and failed content reads stay distinct.
- The continuation card uses the same exact next step and completion selector as the existing screen. A paused/withdrawn version is not presented as a current recommendation; complete versions do not produce a next action.

## Planned write paths

- `src/data/workspace-data.ts`
- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/training/training-overview.ts`
- `src/features/training/README.md`
- `assets/images/training-recommendation-puppy-black-tan-park.jpg`
- `tests/workspace-data.test.mjs`
- `tests/training-activity-date.test.mjs`
- `tests/training-overview.test.mjs`
- `tests/training-screen-policy.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/README.md`
- `tools/visual-check/verify-flow-training.py`
- `docs/design/evidence/flow-training-01/`
- `docs/tasks/dev/FLOW-TRAINING-01.md`

## Acceptance

- All three views have distinct, accessible selection state and a useful empty state.
- Recommendation state matches the real age/breed selector; an older resumable version can be continued without hiding the current version or being mislabeled as age-current.
- Each visible recommendation opens its own first incomplete step; the continuation card opens the exact in-progress step. Only the first incomplete step can be marked.
- Progress totals count only confirmed IDs from the currently displayed program version. No stale ID, failed/unknown state, duplicate item or invented time affects visible progress.
- The 4:3 photo cards have no fabricated metadata. The screen uses distinct dog images and explicitly labels generic recommendation images `Standardbild`.
- Render actual `PublishedTrainingScreen` public and review builds at 375×844, 430×844, 375×667 and 140% text proxy. Review one and two recommendations, no recommendation, unknown age, active progress, complete progress, paused version, error/retry and long localized titles. No horizontal overflow or clipped primary action.
- Run focused Training tests, `pnpm check`, public iOS content guard/export, `git diff --check` and `python -X utf8 tools/dev_flow.py validate`.
- Keep production-panel acceptance partial until published content and Supabase/RLS behavior are verified. Native VoiceOver/Dynamic Type remains NOT TESTABLE in the current browser environment.

## Risk review and mitigations

| Risk | Mitigation |
|---|---|
| A resumable version is outside the current age range but gets called a recommendation. | Carry the exact matched version IDs separately from the union used to resume saved work. |
| New imagery makes an unsupported claim about a particular exercise. | Treat the photos as decorative standard images, label them, and omit unsupported taxonomy and duration. |
| Recommendation cards duplicate an action or open the wrong step. | Each whole card opens one exact, next allowed step; `Visa alla` is the only separate navigation action. |
| A progress write fails or has unknown outcome but appears under Mina. | Reuse the existing confirmation/readback state; membership derives from confirmed `completedStepIds` only. |
| Small screens or larger text make the two-column row cramped. | Allow cards to shrink/wrap, collapse to one column at narrow/layout-scaled widths, and verify the actual component at the stated viewports. |
| Visual work changes a tested safety or review route. | Preserve component props and handlers for focus/history routes; keep review fixtures memory-only and retain all existing route/persistence tests. |

## Review status

- Owner authorization: existing request to complete the remaining panels against `vision_rev02.jpg`.
- Primary-agent plan and risk check: complete; implementation stayed in files disjoint from the active Panel 2 Reviewer ownership.
- Independent QA and Reviewer: PASS on 2026-10-22 after corrections to exact-version visibility, paused-version identity, and long-title clipping. Latest local evidence is in [VERIFICATION.md](../design/evidence/flow-training-01/VERIFICATION.md): 13/13 public and 13/13 review.
- Production data and native accessibility: NOT VERIFIED. Keep the panel's production status open.

The shared asset manifest and closeout queue/report are deferred while the frozen Panel 2 Reviewer owns those paths. Generated source: `/workspace/generated_images/exec-970245c5-72f7-4bc2-8cbc-e75252ee5887.png` (2,432,083 bytes); app JPEG: 1448×1086, quality 86, 270,862 bytes.

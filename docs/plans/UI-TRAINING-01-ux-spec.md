# UI-TRAINING-01 – UX-plan för Träning

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål och flöde

- Träning är tab-root med AppBar Title från workspace-shellen.
- Ett aktivt publicerat program visas som HeroCard med Progress och nästa steg.
- Utan publicerat program visas en enda EmptyState utan hero eller exempelprogram.
- Stegen visas som ChecklistItem. Allmän träningsvägledning blir kort caption eller Läs mer-rad.
- `Sparar…`, failed och unsure behåller befintligt beteende och visas endast vid avvikelse.

## Tillstånd och scope

- Loading, empty, error och normal renderas med Skeleton, EmptyState, InfoBanner/notice vid åtgärdsbehov och befintliga publicerade data.
- Ingen ändring av progressions-, sync-, save-, reset- eller contentlogik.

Avgränsade filer:

- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/home/ProductWorkspace.tsx` – endast route-state-wiring till skärmen, inte träningslogik.
- `tests/training-screen-policy.test.mjs`
- `docs/design-rules.md` section 14
- `docs/plans/UI-TRAINING-01-ux-spec.md`

## QA

Typecheck, lint, relevanta tester. Rendering NOT TESTABLE lokalt; Erik tar `Träning normal`, `Träning tom`, `Träning error`, `Träning stor text`.

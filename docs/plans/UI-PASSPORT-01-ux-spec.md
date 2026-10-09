# UI-PASSPORT-01 – UX-plan för Tassla-pass

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål och flöde

- Pushed route använder Back-AppBar från workspace-shellen.
- DogCard visar hundens riktiga namn, ras och ålder utan stockfoto.
- Godkända exportfält visas som info-rader med IconChip: hundprofil, senaste vikt och utförda hälsoposter.
- `Dela som PDF` är vyernas enda primära knapp och behåller den lokala/native share-logiken.
- Ärlighets-/legaltext visas som kort caption. Validering, lifetime guards, exportstatus och snapshot-kontrakt ändras inte.

## Tillstånd och scope

- Loading/empty/error för profil, vikt, historik och export visas med Skeleton, EmptyState eller högst en åtgärdskrävande InfoBanner.
- Inga planned rows eller oauktoriserade fält läggs till.

Avgränsade filer:

- `src/features/passport/PassportScreen.tsx`
- `tests/passport-screen-policy.test.mjs`
- `tests/passport.test.mjs` – endast UI-strukturassertions vid behov.
- `docs/design-rules.md` section 14
- `docs/plans/UI-PASSPORT-01-ux-spec.md`

Skyddat: passport-model, passport-export, storage, share och workspace-data.

## QA

Typecheck, lint, relevanta tester. Rendering NOT TESTABLE lokalt; Erik tar `Tassla-pass normal`, `Tassla-pass empty/error`, `Tassla-pass stor text` och native share-state.

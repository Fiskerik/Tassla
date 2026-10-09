# UI-MORE-01 – UX-plan för Mer

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål och flöde

- Mer är tab-root med centrerad AppBar Title `Mer`.
- Kunskap, Tassla-pass, Hundprofil, Påminnelser och Konto visas som ListRows med IconChip och chevron.
- `Logga ut` är en tertiary-knapp längst ned och behåller befintlig confirmation, busy-lock och felhantering.
- Inga nya destinationer eller dataflöden.

## Tillstånd och scope

- Normal, sign-out pending och sign-out error visas utan förklarande banner; fel visas endast när användaren behöver agera.
- Konto-/delete-lock, auth och route callbacks ändras inte.

Avgränsade filer:

- `src/features/home/ProductWorkspace.tsx` – endast extrahera/ansluta Mer-presentationen.
- `src/features/home/MoreScreen.tsx` – Mer-specifik presentation.
- `tests/more-screen-policy.test.mjs`
- `docs/design-rules.md` section 14
- `docs/plans/UI-MORE-01-ux-spec.md`

Skyddat: navigation destinations, auth, account deletion, storage och andra skärmar.

## QA

Typecheck, lint, relevanta tester. Rendering NOT TESTABLE lokalt; Erik tar `Mer normal`, `Mer sign-out error`, `Mer stor text`.

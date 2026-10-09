# UI-ACCOUNT-01 – UX-plan för Konto

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål och flöde

- Pushed route använder Back-AppBar från workspace-shellen.
- Beta-info och support visas som ListRows med IconChip och chevron.
- Frivillig användningsmätning behåller Switch och lagringslogik.
- Destruktiva kontoåtgärder använder Dialog, med befintliga tvåstegsbekräftelsen, busy-lock, marker-lock och truthful status.
- En primär knapp per vy: radering är destructive action; lokal utloggning är tertiary när den behövs.

## Tillstånd och scope

- Loading/pending/error/confirmed/unknown/blocked visas endast när relevant och högst en notice åt gången.
- Account deletion, sign-out, marker storage, analytics consent och support-link callbacks ändras inte.

Avgränsade filer:

- `src/features/account/AccountSettingsScreen.tsx`
- `tests/account-screen-policy.test.mjs`
- `tests/account-delete.test.mjs` – endast UI-strukturassertions vid behov.
- `docs/design-rules.md` section 14
- `docs/plans/UI-ACCOUNT-01-ux-spec.md`

Skyddat: account-delete.ts, AuthProvider, auth/callback, storage och serverkontrakt.

## QA

Typecheck, lint, relevanta tester. Rendering NOT TESTABLE lokalt; Erik tar `Konto normal`, `Konto error/locked`, `Konto stor text`.

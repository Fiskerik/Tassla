# MVP-COPY-01 — UI-copy och innehållsgrind

Datum: 2026-10-08
Paket: MVP-COPY-01
Status: Lokal copy-slice klar; visuell QA NOT TESTABLE

## Användarmål

En ny hundägare ska förstå vad som visas, vad som inte kunde sparas eller hämtas och vilket säkert nästa steg som finns — utan interna teknikord.

## Omfattning

- Granska primära MVP-ytor mot `docs/mvp.md`, `docs/design-rules.md`, `docs/content/README.md` och befintliga skärmkontrakt.
- Justera enbart befintliga status-, fel- och exporttexter när samma fakta och återhämtningsflöde redan finns i koden.
- Behålla publicerade innehållsurval tomma tills innehållet faktiskt har granskats och publicerats.
- Dokumentera sakgranskningsblockerare för innehåll och betaklar copy.

## Tillstånd och återkoppling

- Laddning beskriver vad appen gör med vardagliga ord.
- Fel säger vad användaren kan göra härnäst.
- Osäker sparning får inte beskrivas som sparad; visa kontrollåtgärd för samma post/profil.
- Tomt publicerat innehåll skiljs från laddningsfel och förklarar när innehåll blir synligt.

## Avgränsade filer

Skärmkopior: `src/features/home/ProductWorkspace.tsx`, `src/features/health/HealthHistoryScreen.tsx`, `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/passport/PassportScreen.tsx`, `src/features/account/AccountSettingsScreen.tsx`.

Dokumentation: denna plan och `docs/releases/MVP-COPY-01.md`.

Ingen ändring av schema, tjänster, innehållskroppar, påståenden, reviewstatus, publicering, navigering eller delade komponenter. Ingen ny medicinsk/träningsvägledning.

## Målbild och avvikelser

Varm, kort svensk copy enligt `docs/design-rules.md`. Ingen layoutändring planeras. Saknad skärmbild/native-rendering markeras NOT TESTABLE.

## Verifiering och begränsningar

- `git diff --check`: PASS.
- Native-rendering, skärmbilder, stor text och separerad visuell QA: NOT TESTABLE i denna slice.
- Inga claim bodies, reviewflaggor eller publiceringsstatusar ändrades.

## Godkännande

- Inga förbjudna teknikord i berörda användartexter.
- Varje ändrad recovery-copy motsvarar en befintlig handling.
- Utkast från MVP-bundlen visas inte som publicerat innehåll.
- Release-noten listar kvarvarande mänsklig sakgranskning och publiceringsbeslut.

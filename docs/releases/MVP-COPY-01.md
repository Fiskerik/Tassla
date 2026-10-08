# MVP-COPY-01 — copygranskning för beta

Datum: 2026-10-08
Paket-ID: MVP-COPY-01
Status: Lokal textändring klar; innehållspublicering blockerad av sakgranskning
Jämförelsebas: `fb91ae67b63577ca2cea22838fd5a436ed505a5a` till aktuell arbetskopia
Leveranscommit: ej skapad
TestFlight-version/build: okänd; ingen TestFlight-leverans

## Major changes

Inga. Ingen MVP-funktion eller innehållspost har publicerats.

## Minor changes

- Bytte internspråk om sparstatus till tydligare svenska i profil-, hälsa-, tränings-, påminnelse- och Tassla-pass-fel/återhämtning.
- Tog bort hänvisningar till servergräns i hälsans historikinformation och Tassla-pass; begränsningen på högst 50 hälsoposter beskrivs nu vardagligt.
- Behöll laddning, fel och väntande sparning skilda; inga lyckade resultat antyds.
- Ingen ändring av innehållsbundlens brödtexter eller granskningsstatus.

Berörda skärmfiler: `src/features/home/ProductWorkspace.tsx`, `src/features/health/HealthHistoryScreen.tsx`, `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/passport/PassportScreen.tsx`, `src/features/account/AccountSettingsScreen.tsx`.

## Bug-fixes

- Före: användartexter innehöll interna uttryck som ”sparstatus” och ”serverns svarstak”. Efter: meddelandena säger om Tassla kunde kontrollera en ändring och vad användaren kan göra.
- Inga data-, navigerings- eller API-beteenden ändrades.

## Verifiering och begränsningar

- `git diff --check`: PASS.
- Skärmbilder/native-rendering och visuell granskning: NOT TESTABLE.
- Typecheck, lint och apptester ingick inte i copy-slicen.
- Release eller push har inte skett.

## Mänskliga blockerare före innehållspublicering

- `docs/content/mvp-content-bundle-v1.json` har status `draft`; samtliga innehållsversioner har human reviewer `pending`.
- Hundexpertens granskning är inte slutligt godkänd. `docs/content/p04-dog-expert-review.md` anger kvarstående korrigeringar och förnyad expertgranskning; mänsklig sakgranskning väntar.
- Granskare behöver kontrollera att varje stycke och träningssteg täcks av claim-id och att angivna källor faktiskt stödjer innehållet. Strukturell validering räcker inte.
- Innehållets piloturval och publiceringsbeslut måste bekräftas. SQL-filen är en draft-import och har inte körts mot en databas; utkasten exponeras därför inte i runtime.
- `before-homecoming` är onboarding-only och saknar separat publicerad onboardingyta.

## Nästa paket

Fortsätt MVP-paket enligt huvudplanen. För innehåll: inför faktiska sakgranskningskorrigeringar, förnyad hundexpertgranskning och mänsklig käll-/claimgranskning innan separat publiceringsbeslut. Därefter behövs runtime-/databasverifiering för publicerade urval. Ingen pilotdistribution ingår här.

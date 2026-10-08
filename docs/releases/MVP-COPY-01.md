# MVP-COPY-01 — copygranskning för beta

Datum: 2026-10-08
Paket-ID: MVP-COPY-01
Status: Copy klar; godkänt innehåll publiceringsförberett för 10 runtimeversioner
Jämförelsebas: `fb91ae67b63577ca2cea22838fd5a436ed505a5a` till aktuell arbetskopia
Leveranscommit: ej skapad
TestFlight-version/build: okänd; ingen TestFlight-leverans

## Major changes

Inga. Ingen MVP-funktion eller innehållspost har publicerats.

## Minor changes

- Bytte internspråk om sparstatus till tydligare svenska i profil-, hälsa-, tränings-, påminnelse- och Tassla-pass-fel/återhämtning.
- Tog bort hänvisningar till servergräns i hälsans historikinformation och Tassla-pass; begränsningen på högst 50 hälsoposter beskrivs nu vardagligt.
- Behöll laddning, fel och väntande sparning skilda; inga lyckade resultat antyds.
- Innehållens brödtexter och claim-spår är oförändrade. Erik bekräftade 2026-10-08 att bundle v1 är godkänd och att hundexperten verifierat innehållet; godkännandet finns i `docs/content/mvp-content-approval-v1.md`.

Berörda skärmfiler: `src/features/home/ProductWorkspace.tsx`, `src/features/health/HealthHistoryScreen.tsx`, `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/passport/PassportScreen.tsx`, `src/features/account/AccountSettingsScreen.tsx`.

## Bug-fixes

- Före: användartexter innehöll interna uttryck som ”sparstatus” och ”serverns svarstak”. Efter: meddelandena säger om Tassla kunde kontrollera en ändring och vad användaren kan göra.
- Inga data-, navigerings- eller API-beteenden ändrades.

## Verifiering och begränsningar

- `git diff --check`: PASS.
- Skärmbilder/native-rendering och visuell granskning: NOT TESTABLE.
- Typecheck, lint och apptester ingick inte i copy-slicen.
- Release eller push har inte skett.

## Innehållspublicering

Tio versioner är markerade publicerade i bundle-metadata. `before-homecoming` förblir draft eftersom onboarding-only-kontext saknas i databasschema och runtime; annars kan åldersfeed exponera den. Kör `supabase/content/mvp-content-v1.sql` för draftimport och därefter `supabase/content/publish-mvp-content-v1.sql` i avsedd Supabase-miljö. Ingen SQL har körts här och runtime-data är därför inte verifierad.

## Nästa paket

Nästa steg är att köra de två SQL-filerna i ordning i Supabase, verifiera RLS/readback och bekräfta att appens publicerade urval visar samma versioner som bundle v1.

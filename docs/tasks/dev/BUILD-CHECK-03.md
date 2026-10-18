# BUILD-CHECK-03 — Codemagic validering av valfri kennelkälla

Planversion 5 · status: plan godkänd och implementation granskad; Codemagic/native iOS återstår · 2026-10-18

## Mål

Åtgärda Codemagic-felet i `Check application` utan att ta bort eller försvaga befintliga tester. `tests/profile-screen-policy.test.mjs` kräver att kennelkälla valideras endast när användaren uttryckligen har valt en kod.

## Scope

- `src/features/onboarding/ProfileScreen.tsx`
- `tests/app-data.test.mjs`
- `tests/profile-edit.test.mjs`
- `tests/home-vision.test.mjs`
- `docs/tasks/dev/BUILD-CHECK-03.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`

Ingen schema-, RPC-, datainsamlings- eller idempotencyändring. Återanvänd befintlig `ownedDogAttributionMatches` endast för en uttryckligen vald kod. En ny begäran utan vald kod verifieras via exakt hund-ID och profilfält, utan kennelattribution-anrop.

Innan create/retry läses ett eventuellt sparat request-ID. Ett redan sparat ID betyder att detta är en återhämtning: RPC:n kan returnera samma hund även om payloaden har ändrats sedan första försöket. Använd samma ID och kontrollera först exakt hundprofil. Om den återlästa profilen inte matchar de angivna fälten behålls befintligt `existingProfile`-tillstånd.

Kennelkällan kontrolleras bara när användaren valt en kod i det aktuella försöket (`referralCode !== null`). False eller RPC-fel är inte success: anropa inte `onCreated` och rensa inte request-ID. Om ett sparat request-ID återhämtas utan uttryckligen vald kod får flödet inte gå genom den vanliga vägen för en ny profil utan kennelkälla. Visa i stället att hundprofilen är bekräftad men att det inte går att bekräfta om en valfri kennelkälla kopplades. Erbjud två uttryckliga val: kontrollera igen med samma request-ID (och vald kennelkälla om användaren vill verifiera den), eller öppna den verifierade hundprofilen utan bekräftad kennelkoppling. Först när användaren väljer att öppna utan bekräftelse rensas request-ID och eventuell lokalt väntande kennelkälla; texten får inte påstå att servern saknar koppling. Därmed kan ett senare hundtillägg få en ny request-ID. Ett nytt anrop utan sparat request-ID och utan vald kod kan slutföras efter exakt profil-readback.

## Acceptans

1. `referralCode === null` hoppar över attribution-RPC för en ny request och behåller verifiering av hund-ID/profilfält.
2. Ett befintligt SecureStore request-ID behandlas alltid som recovery. Utan aktivt källval kan det inte tyst slutföras; användaren ser ett explicit val utan bekräftad koppling.
3. Vald kennelkälla verifieras mot samma återlästa hund. False/RPC-fel behåller request-ID tills retry eller uttryckligt öppna-utan-bekräftelse-val; den vägen påstår inte att serverkopplingen saknas.
4. Exakt profil-ID/fält mismatch ger inte kennelkopplingsmeddelandet eller `onCreated`; efter uttryckligt öppna-val rensas request-ID så nästa tillägg får en ny nyckel.
5. Tre Codemagic-fel som väntar på gamla kontrakt korrigeras i tester utan att ta bort täckning: createDog-testerna förväntar den aktuella idempotenta RPC:n och request-ID:t; Home-testet kontrollerar porträttets knappnamn samt generiska, icke-identitetsbärande bild.
6. Policytester för kennelkälla behålls och `pnpm check`, `git diff --check` och queue validation passerar.
7. Codemagic-konfigurationen använder redan `pnpm check`; inga andra workflows eller hemligheter ändras.

## Risk och granskning

Riskklass H eftersom ändringen berör en ägar-/hundscopad RPC; Security granskar read path och återhämtningsflöde. Architect och Critic granskar v4 före fortsatta kodändringar. Oberoende Reviewer granskar diffen efter kontroller. Ingen live Supabase/RLS-, Codemagic-cloud-, signing- eller Xcode-verifiering påstås utifrån lokal `pnpm check`.

## Planreview v3 (ersatt)

- Architect: APPROVE — sparat request-ID är recovery, retry återanvänder ID och ID:t rensas först efter uttryckligt öppna-val.
- Critic: PROCEED — recovery har en tydlig väg ut och senare hundtillägg får ett nytt ID; copy ska säga att en valfri kennelkälla inte kan bekräftas utan att antyda att den valdes.
- Security: APPROVE — ingen tyst no-source-finalisering vid sparat ID; exakt hund-readback och uttryckligt användarval före lokal cleanup.
- Implementationsnot: skriv recovery-copy som att det inte går att bekräfta om en valfri kennelkälla sparats. Påstå inte att serverkopplingen saknas eller har tagits bort.

V3 ersattes efter att hela Codemagic-loggen och den lokala `pnpm check`-körningen visade tre ytterligare testfel utanför dess scope. V4 lägger bara till de tre testfilerna vars assertions förväntade kontrakt som redan ändrats i den implementerade hund-/porträttresan.

## Planreview v4 (ersatt)

- Architect: APPROVE — testscope och kontrakt är avgränsade; createDog-testerna ska kontrollera RPC, giltigt request-ID och body; Home-testet behåller generisk porträttkontroll och testar byt-hund-knappens namn.
- Critic: PROCEED — uppdatera endast stale assertions och behåll befintliga payload-, request-ID-, abortsignal-, generiskt porträtt- och no-dog-identity-kontroller. Recovery-copy ska inte antyda att kennelkälla förväntades.
- Security: APPROVE — request-ID och återhämtningsregler från v3 kvarstår; kontrollera exakt request-ID i RPC-assertions.
- V5 förtydligar endast plantexten om optional kennelkälla; scope och acceptans är annars oförändrade.

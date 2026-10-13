# UX-spec — rev02 R02-4H: Inloggning och onboarding

Datum: 2026-10-13 · Version: 1 · Status: implementing · Ägardirektiv: fortsätt med återstående skärmar.

## Användaruppgift

En ny eller återkommande ägare ska kunna logga in med befintlig Google- eller e-postlänk, förstå om callbacken väntar eller har misslyckats och skapa en hundprofil med befintliga namn-, ras-, datum- och frivilliga kenneluppgifter.

## Avgränsning och skyddade beteenden

Endast presentationen i `SignInScreen`, `AuthCallbackScreen`, `ProfileScreen` och de synliga loading/error-stegen i `AppFlow`. Behåll PKCE/OAuth, callbackvärd/redirect, auth-lås, källredovisning, credential secrecy, SecureStore-referral, `create_dog`, ägarskap, generationsskydd, validering, unknown-status kontroll och alla befintliga knappar/callbacks. Inga nya auth-provider, routes, fält eller user promises.

## Visuell riktning

- Varm canvas, vänsterställd rubrik och sammanhängande gröna profil-/primärhandlingar; blå kontoaccent får bara användas i auth-informationssammanhang.
- Inloggning visar Google som första handling och e-post som tydligt separat alternativ. Samma formulärfält och orden för säker länk behålls.
- Callback får en lugn statusyta där väntar, ogiltig/förbrukad länk och väg tillbaka har egen visuell nivå; URL, code, token och råa fel visas aldrig.
- Profilskapandet grupperar namn, ras och födelsedatum i ett kort och den frivilliga kennelkopplingen i ett separat kort.
- Hjälptext och fel sitter nära aktuellt flöde; väntar-/pendinglägen har synlig status men ger inga löften om e-postleverans eller authresultat.

## Filer och render

- `src/features/account/SignInScreen.tsx`, `src/features/account/AuthCallbackScreen.tsx`
- `src/features/onboarding/ProfileScreen.tsx`, `src/features/home/AppFlow.tsx`
- `src/features/account/README.md`, `src/features/onboarding/README.md`, `tools/visual-check/app.tsx`
- Denna spec, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4h/`.

Rendera public/review vid 375×844, 430×844, 375×667 och 140 % browserzoom; sign-in idle/pending/unavailable/magic-link/Google success/error, callback waiting/error/preview, profile breed loading/ready/error och kennelval. Mockade auth-/dog-klienter får inte utföra riktiga nätverksskrivningar. Google-retur, e-postleverans, native callback, native keyboard/VoiceOver och RLS är **NOT TESTABLE**.

## §14 jämförelse

Ingen auth/onboardingpanel finns i `vision_rev02.jpg`. Jämför närmaste rubrik-, kort-, form-, färg- och tomlägesmönster; §14 punkt 16 ska vara Nej för exakt panelmatch och varje dimension redovisas.

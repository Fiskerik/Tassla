# Release-log — P08 uppfödarkod och onboarding

Datum: 2026-10-08. Status: implementation lokalt. Parser-/SecureStore-adaptertestet passerar; SDK-kontraktstester kunde inte starta eftersom `@supabase/supabase-js` saknas. Migration/SQL-test och native deep-link är inte verifierade i riktiga miljöer. Inte pushad eller tillgänglig i TestFlight. Jämförelsebas: arbetsbranchens P08-underlag vid `fb91ae6`; ingen GitHub Release finns enligt tidigare verifiering 2026-10-07. Leveranscommit och TestFlight-build: okända.

## Major changes

Appen tar emot `tassla://join?code=...` med Expo Linking, sparar endast normaliserad kod och fångstdatum i SecureStore och visar koden i hundprofilformuläret efter inloggning. Kennelkällan är frivillig och kräver ett separat aktivt val; användaren kan redigera eller ta bort den. Endast `create_dog` skapar attribution atomärt. En owner-scoped boolean RPC bekräftar att exakt inskickad kod hör till den inloggade ägarens hund utan att exponera kennel eller uppgifter.

## Minor changes

Parsern avvisar andra scheme/hosts/path, dubbla parametrar, extra parametrar, credentials och fragments. Pending-koden löper ut efter sju dagar och rensas efter verifierad skapning, bortval eller explicit utloggning. Ingen appdependency, pilotseed eller installations-URL har lagts till.

## Bug-fixes

Utvecklingsfel före första P08-leverans: okänt `create_dog`-resultat kunde tidigare acceptera vilken ägd hund som helst efter en vanlig läsning. Nu krävs exakt match på namn, ras, födelsedatum och attribution; annan profil skrivs inte över och okänd attribution visas inte som lyckad.

## Verifiering och begränsningar

`node --experimental-strip-types --test tests/referral.test.mjs` passerar (5 checks i en testfil). `tests/app-data.test.mjs` och `tests/profile-edit.test.mjs` kunde inte starta eftersom `@supabase/supabase-js` saknas. `git diff --check` passerar. `supabase/tests/kennel-attribution.sql` är syntetiskt tvåägartest men kräver verklig Supabase-databas efter migration; ej kört. Native iOS-länkstart/SecureStore och visuell skärmbild är NOT TESTABLE i nuvarande miljö. Inga verkliga kenneluppgifter eller kodseed användes. Fysisk tryckning och installation efter TestFlight är inte verifierade; inget påstående om mätt installation görs.

## Nästa sprint/paket

Kör full `pnpm check`, SQL-migration/test i Eriks Supabase-utvecklingsprojekt och installerad TestFlight-länkväg. Därefter slutför P09 separat. Pilotkonfiguration kräver att Erik anger verkliga pilotkennlar och beta-installationslänk; inget QR-underlag för faktisk distribution genereras före detta. Nästa releasegrind är P11 med dessa verifieringar och separat review.

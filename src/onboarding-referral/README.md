# Uppfödarkod – lokal förberedelse

`referral-model.ts` accepterar endast `tassla://join?code=...`, normaliserar koden och validerar en väntande referral med sju dagars livstid. `referral-storage.ts` sparar endast kod och tid via en liten nyckel/värde-adapter; `referral-secure-storage.ts` kopplar adaptern till den redan installerade Expo SecureStore.

Denna modul är inte ansluten till appstart, onboarding eller `create_dog`. Ingen attribution eller användarhändelse skapas. Datakontrakt, informations-/frivillighetsflöde och P08 deep-link-readback är fortfarande blockerade; aktivera inte modulen i appen före dessa beslut och reviews. Tester körs med `node --experimental-strip-types --test tests/referral.test.mjs` och syntetiska strängar.

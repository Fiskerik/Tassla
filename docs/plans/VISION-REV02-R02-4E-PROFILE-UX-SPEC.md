# UX-spec — rev02 R02-4E: Hundprofil och profilredigering

Datum: 2026-10-13 · Version: 1.1 · Status: local UI checkpoint complete · Ägardirektiv: fortsätt med återstående skärmar.

## Användaruppgift

Ägaren ska kunna läsa hundens befintliga profiluppgifter och, där redigeringsflödet finns, ändra namn, ras och födelsedatum med sparstatus och återhämtning tydligt samlade.

## Avgränsning och skyddade beteenden

Endast läsvisningen `DogProfilePage` och befintliga profilredigeringsvyn `EditDogProfileScreen`. Första profilskapandet i `ProfileScreen` tillhör R02-4H och ändras inte här. Rutter, ägarskap, formulärfält, validering, rasdata, attribution/kennellänk, preimage-konfliktkontroll, pending/unknown, retry, återläsning, toast och hundens identitet förblir oförändrade. Ingen ny profilfunktion, bilduppladdning eller datamodell införs.

## Visuell riktning

- Vänsterställd `Hundprofil`-rubrik och tydlig tillbakaåtgärd till Mer.
- Varm canvas, ljusa rundade kort och befintlig profilaccent från `tokens.colors.support.profile`.
- Läsvisningen visar namn, ras och födelsedatum som tre jämförbara fakta med rubrik, värde och diskret ikon.
- Redigeringsvyn grupperar profilfakta först, sedan formulär och frivillig kennelkoppling; status/error/conflict ligger intill den grupp de beskriver.
- Befintlig generisk hundbild behålls som dekoration och beskrivs inte som ägarens hundfoto.
- Långa rasnamn och felmeddelanden ska kunna radbrytas vid smal bredd/zoom. Tryckytor och sparknappar behåller befintliga minsta storlekar.

## Filer och render

- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/onboarding/DogProfileScreen.tsx` (extraherad presentation för befintlig läsvy)
- `src/features/home/ProductWorkspace.tsx`
- `src/features/onboarding/README.md`, `tools/visual-check/app.tsx`
- Denna spec, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4e/`.

Rendera public/review vid 375×844, 430×844, 375×667 och 140 % browserzoom. Visa läsprofil, redigeringsformulär samt där harnessens befintliga fixturekontrakt tillåter laddande/fel, pending/conflict, kennelkoppling och sparstatus. Browserbilder bekräftar inte verklig Supabase/RLS, tangentbord, native datumväljare eller tvåkontokonflikter; sådant ska markeras NOT TESTABLE.

## §14 jämförelse

Ingen profilpanel finns i `vision_rev02.jpg`. Redovisa därför punkt 16 som **NOT TESTABLE/ej tillämpligt** för exakt panelmatch; frånvaron av en jämförbar panel är inte ett negativt kvalitetsbetyg. Bedöm profilens stödskärm separat mot närmast relevanta rev02-mönster och redovisa kort, ikon, färg, rubrikhierarki samt övriga tillgängliga deldimensioner var för sig.

### Versionsnotis 1.1 — 2026-10-21

Förtydligar punkt 16 i linje med taskens befintliga acceptans och `docs/design-rules.md`: en saknad referenspanel markeras **NOT TESTABLE**, inte **Nej**. Ingen produktfunktion, visuell riktning eller övrig acceptans ändras.

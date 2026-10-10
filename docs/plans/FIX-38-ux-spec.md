# UX-specifikation FIX-38 — Toast-återkoppling

## Användarens mål och startpunkt

Efter en sparning, ett fel eller ett osäkert resultat behöver hundägaren förstå vad som hände och kunna använda den befintliga relevanta nästa åtgärden (ångra, försök igen eller avbryt). Toast visas av den aktuella funktionsskärmens ägare när den sätter `visible`.

## Normalflöde och tillstånd

- Synlig bekräftelse behåller kopplingen till en bekräftad sparning, visar nuvarande meddelande och eventuell Ångra-åtgärd och försvinner efter befintlig timer när den är konfigurerad.
- Synligt fel eller osäkert resultat behåller nuvarande meddelande och tillgängliga Försök igen-/Avbryt-åtgärder.
- När synlighet ändras till falskt ligger senast synliga innehåll kvar medan befintlig utgångsanimering avslutas; avslutningscallbacken körs en gång för aktuell övergång.
- När Toast är dold tas den bort ur renderingen och hjälpmedelsträdet.
- Reducerad rörelse hoppar över animeringen men behåller avvisning, callback- och tillgänglighetsbeteende.

## Återkoppling, tillgänglighet och antaganden

Behåll befintlig svensk text, åtgärdsetiketter, utseende, tryckbeteende, tidsinställningar och callback-ägarskap. Fortsätt att exponera det synliga meddelandet som en alert och dölja innehåll som lämnar från hjälpmedel. Behåll stöd för dynamisk text och reducerad rörelse. Ändringen rättar React Hooks-regler för ren rendering; den lägger inte till ett UI-tillstånd och ändrar inte godkänd målbild.

## Skyddat scope

Endast `src/components/ui/Toast.tsx` och eventuella direkt relevanta befintliga tester ingår i UI-scope. Ändra inte anropares text, tokens, layout, datakontrakt, navigation eller sparbeteende.

## Verifiering

En separat QA-/Reviewer-roll kontrollerar bekräftelse, fel, osäkert resultat, synlighet för Ångra/Försök igen/Avbryt, kvarhållet innehåll och callback vid utgång, timer, skärmläsaretiketter, dynamisk text och reducerad rörelse. Kontrollera relevanta skärmbilder vid liten och stor mobilbredd samt stor text; jämför med befintlig godkänd Toast-/UI-baslinje när den finns. Spara skärmbilder och checklista i `docs/design/FIX-38/`. Om appen, relevant baslinje, tillstånd eller tillgänglighetsmiljö inte går att rendera eller inspektera ska den punkten markeras **NOT TESTABLE** med saknad evidens och orsak; godkänn inte visuellt utifrån källkodskontroll.

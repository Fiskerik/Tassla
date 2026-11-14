# GAP-FIRST-DAY-ROUTINE-01: första dagens rutinförslag

## Syfte och avgränsning

Bas: `d122622645eefb3f4c44ce488afea7105624d878` med lokala GAP-ändringar. Ett frivilligt förslag gör det lättare att börja med en rutin utan att automatiskt skapa persondata. Status: **implementerat lokalt, begränsat verifierat**. Skrivägare: koordinatorn; kodytan är `src/features/home/DailyActivityManagerSheet.tsx`, med syntetisk kontroll i `tools/visual-check/verify-routine-suggestion.py`.

## Befintligt flöde och beslut

`DailyChecklistScreen` öppnar `DailyActivityManagerSheet`. Knappen Skapa rutin skapar ett redigerbart utkast med ett klientgenererat submissions-ID. `createRoutineForToday` sparar mallen och försöker därefter välja den för dagen; dess separata återhämtning hanterar osäker skrivning, ändrat konto/hund/datum och sparad mall som inte kunnat väljas. Ett förslag ska gå via samma utkast och samma Spara-åtgärd. Det ska inte skapa rutin, aktivera upprepning eller påstå att något sparats när användaren bara väljer förslaget.

Välj en enda neutral, redigerbar startpunkt med vardagsspråk, utan medicinska råd, ålderspåståenden, påstådd sakkunniggranskning eller fasta tider. Till exempel kan ett förslag öppna ett utkast med rubriken ”Lugn stund” och en punkt ”Ge plats för vila”; texten måste kvalitetsgranskas innan den exponeras. Det är ett allmänt exempel, inte en åldersanpassad rekommendation. Åldersanpassade hälsorutiner kräver källor och relevant mänsklig granskning enligt innehållsreglerna.

Utkastets ursprungliga jämförelsevärden behöver förbli tomma så att det förifyllda utkastet är ändrat och kan sparas; att lämna det ska använda befintlig bekräftelse för osparat innehåll. Ge varje utkast och punkt nya ID:n och behåll samma submissions-ID vid återförsök. Förslag ska inte ersätta ett befintligt utkast eller erbjudas under en olöst skrivning. Behåll manuellt skapande. Upprepning är av som standard.

Oberoende planreview: samma manager används från Hem och Checklista, så båda ingångarna och återhämtningen måste verifieras. Om förslaget begränsas till ett tomt bibliotek måste tomheten bygga på en lyckad avläsning: en tom array under laddning eller fel bevisar inte att biblioteket är tomt. Ett omförsök efter okänd mallsparning återupptar den ursprungliga skrivningen; det slutför inte automatiskt den separata dagkopplingen. Eventuellt meddelande om att mallen inte lagts till idag måste därför behållas.

## Verifiering innan checkpoint

- Prova med syntetiska data: förslaget fyller ett redigerbart utkast, Spara använder befintligt flöde, stängning skyddar osparat utkast och okänd sparstatus inte skapar en ny mutation.
- Prova konto-/hundbyte, datumbyte och misslyckad separat dagkoppling med befintlig återhämtningspolicy; kontrollera att inget automatiskt upprepas.
- Följ designreglerna, granska skärmbilder separat och kör relevanta beteendetester samt `pnpm check`. Verklig databas, native tillgänglighet och TestFlight redovisas separat.

Detta är en genomförbar första del av GAP-förslaget, inte bevis för en färdig uppsättning åldersanpassade rutiner eller en ett-trycksaktivering.

## Lokal checkpoint

Förslaget visas i den gemensamma hanteringen även när rutiner redan finns, så en tom array under laddning eller fel används inte som bevis för ett tomt bibliotek. Syntetisk RN Web-kontroll via Hem → Checklista och direkt Checklista visar redigerbart utkast; vägen via Hem verifierar även skydd vid försök att lämna, noll skrivningar före Spara och en skrivning efter Spara. En simulerad osäker dagkoppling kan kontrolleras igen med samma mutations-ID utan att skapa mallen på nytt. Vid simulerat definitivt fel på dagkopplingen visas att mallen sparades men inte lades till, utan att en dagpunkt visas. Oberoende kodgranskning fann inga blockerande fel; separat bildgranskning av 375 × 844 fann ingen synlig blockerare på ändringsytan. `pnpm check` passerade med 1 007 godkända och ett överhoppat test. Fel och osäkerhet i själva mallsparningen för just detta förslag, stor text, kontrastmätning, VoiceOver, verklig databas och iPhone/TestFlight är inte verifierade i denna checkpoint; befintliga generella återhämtningskontroller ersätter inte dessa prov.

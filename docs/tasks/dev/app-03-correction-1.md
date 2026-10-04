# APP-03 – korrigering 1: avgränsad rashämtning

2026-10-04. Reviewer BLOCK på lokal överlämning: fetchBreeds i src/data/app-data.ts saknar tidsgräns, så ProfileScreen kan bli kvar i laddning utan retry vid ett hängande nätanrop. Check38/iOS-export var gröna men verifierade inte detta fall. Erik-fråga ställd enligt AGENTS.md; kodrättningen väntar på hans besked. Ingen överprövning av BLOCK.

Förslag: återanvänd befintlig withRequestDeadline med 12 sekunder för fetchBreeds och vidarebefordra AbortSignal till installerad Supabase select/order. Behåll befintligt generiskt fel och ProfileScreen error/retry. Inga nya paket, tabeller, scope eller UI-funktioner. Ingen generell nätverksrefaktorering.

1. Tech Lead granskar exakt denna korrigeringsplan, Erik godkänner återupptagning.
2. Implementer äger endast src/data/app-data.ts: samma deadline som fetchOwnedDog/createDog, liten cleanup. Returnerar verklig lokal kontroll; inga test-/dokumentändringar.
3. QA äger tests/app-data.test.mjs: test faktisk fetchBreeds med installerad SDK/lokal fetch, ett hängande svar får abort vid befintlig deadline och funktionen avvisar utan att dölja felet. Testa inga verkliga credentials eller API-anrop; använd Node-klocka om lämpligt, ingen test-only appabstraktion. Kontrollera ProfileScreen fel/retry statiskt.
4. Helcheck och diffcheck; tidigare export måste uppdateras om källan ändrats. Reviewer får ändra BLOCK till PASS först efter verifierad rättning. Phone/native crypto/RLS fortfarande separat.

Max två samtidiga roller med olika skrivområden. Kö blocked tills Erik har svarat; inga andra kodändringar i korrigeringen.

Erik har därefter svarat: "Ja, rätta och granska igen". Astra APPROVE för exakt denna plan är sparat i huvudrapporten. Korrigeringen återupptas; tidigare BLOCK är inte överprövat och kräver nytt Reviewer-verdict efter verifieringen.

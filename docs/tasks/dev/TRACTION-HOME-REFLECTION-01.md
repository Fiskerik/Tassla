# Traction P1 — personlig återblick på Hem

Status: implementerad lokalt; visuell och funktionell kontroll i RN Web genomförd. Detta är en del av det större upplevelsedokumentet, inte en markering att hela planen är färdig.

## Omfattning

På `knowledge/d3-catalog-delivery` visas ett kompakt återblickskort på Hem. Det väljer mellan den senaste hämtade logghändelsen och den senaste sparade, daterade träningsaktiviteten eller delmålsbekräftelsen för den aktiva hunden. Framtida och ogiltiga datum, andra hundar, otillgängliga programversioner och versioner med pågående/osäker ändring utesluts. Saknas historik visas ett tydligt märkt generellt åldersförslag när sådant finns; det räknas inte som genomfört. Laddning och läsfel visas separat. Kortet öppnar Logga, rätt träningsprogram eller Utveckling enligt innehållet. Händelser som inte ingår i den hämtade sidan av loggen hävdas inte vara genomgångna.

Ändrade produkt- och kontrollfiler: `src/features/home/HomeScreen.tsx`, `src/features/home/home-reflection.ts`, `tests/home-reflection.test.mjs` och `docs/design/evidence/traction-home-reflection-01/`. Ingen databasmigration eller ny dependency.

## Kontroll och nästa steg

- Modelltest täcker aktiv hund, senaste giltiga händelse, framtida/ogiltigt datum, tomt urval och årtal från tidigare år.
- `pnpm check` passerar: typecheck, edge typecheck, lint och 88/88 testfiler. `git diff --check` kontrolleras vid checkpointen.
- RN Web med syntetiska data: 375 och 430 px, loggad händelse, tomt läge, felläge, tillgängligt namn och navigation till Logga; inga page errors eller horisontellt överflöde. Bilder finns i `docs/design/evidence/traction-home-reflection-01/`.
- Native iOS/Android, VoiceOver/Dynamic Type och TestFlight är inte kontrollerade här. En samlad kontroll av initial vy med både pågående träningsresa och full dagslista återstår; den här delkontrollen bevisar inte att alla Hemblock ryms utan scroll.
- Därefter: färdigställ separat nästa-steg-ingång på Hem för fall utan pågående träningsresa; jämför sedan resterande P1–P5 mot upplevelsedokumentet. Befintliga funktioner behålls eller justeras efter faktiskt beteende.

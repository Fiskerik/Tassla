# FLOW-PANELS-6-7 — unika redaktionella hundbilder

- **Datum:** 2026-10-21
- **Uppgift:** uppdatera bildspråket i Träning och Kunskap enligt `vision_rev02.jpg`
- **Riskklass:** L — lokala dekorativa bilder och presentation; ingen persondata, persistence, navigation, datamodell eller API ändras.
- **Version:** v1
- **Status:** Historisk ursprungsplan; renderad komponentkontroll dokumenteras i uppdateringen 2026-10-22 nedan.

## Implementation update — 2026-10-22

Kontroll av aktiva routes visade att `HomeCarousel` inte är monterad i `HomeScreen` eller `ProductWorkspace`. Hemmets faktiska `Just nu`-kort är textbaserat i målbilden och öppnar vald guide eller träningsväg. Den inaktiva karusellens bild visas därför inte som produktfunktion och ingår inte i renderbeviset. Bildkravet för Home justeras till att öppna exakt guide-ID/nästa träningssteg; Home får ingen påhittad bildlayout.

Den aktiva Kunskap-vyn binder tre review-guider stabilt till tre olika foton; en saknad guidebild ger fortsatt textkort. Träning visar corgibilden i 88×88 pt på fortsättningskortet och öppnar samma nästa steg som Hemmets textkort. Faktisk React Native-komponentrendering samt §14-bedömning finns i `docs/design/evidence/vision-r02/2026-10-21-panels-6-7-image-diversity/`. Den äldre HomeCarousel-formuleringen i v1 nedan är supersederad av denna observation.

## Syfte

Ägaren bad om fler nya hundbilder så samma hund inte återanvänds överallt. Fem separata, fotorealistiska motiv har genererats: en lagotto i skog, en sheltie vid fönster, en cocker spaniel vid kuststig, en tax på träningsmatta och en närmare corgi på matta. Taxbilden var för liten i 88 pt-beskärningen och används inte i produktkoden. Motiven används som dekorativa bilder, inte som användarens hund, bevis på genomförd träning eller hälsopåstående.

Träning och Kunskap ska ha egna bilder som stödjer respektive innehåll. Kunskapens tre redaktionella platser använder lagotto-, sheltie- och cocker-bilderna. Bildtilldelning binds stabilt till guide-ID och versions-ID via deterministisk mappning. För de tre befintliga review-guiderna anges exakta ID/versioner nedan; övriga guide-ID:n får en stabil hashbaserad plats. Home-karusellens Kunskap-kort använder samma bild som den guide det faktiskt öppnar; Home Training-kortet och panelens nästa-övning-kort använder sin egen corgibild. Panel 6 visar corgibilden som en 88×88 pt miniatyr i nästa-övning-kortet, återanvändande befintlig `tokens.size.trainingImage`-token. Text, navigation, dataflöden och progression behålls.

## Exakt bild- och UI-scope

| Yta | Källa | Asset i appen | Mått och beskärning |
|---|---|---|---|
| Kunskap, rekommenderad guide | `/workspace/generated_images/exec-c0aaccd7-8d52-4944-a650-6160064fcd9f.png` — lagotto i skog | `knowledge-featured-puppy-lagotto-forest.jpg` | 1536×1024, JPEG q86; befintlig 200 pt hög hero med `cover` vid 375/430 pt |
| Kunskap, mindre guidekort A | `/workspace/generated_images/exec-5a2a21b3-d1a8-4997-af40-852b15cfeba8.png` — sheltie vid fönster | `knowledge-card-puppy-sheltie-window.jpg` | 1536×1024, JPEG q86; befintligt responsivt breddutsnitt med 132 pt bildhöjd, `cover` |
| Kunskap, mindre guidekort B | `/workspace/generated_images/exec-856c7906-2f8b-40a6-b411-5c2a9f3a2f58.png` — cocker spaniel vid kuststig | `knowledge-card-puppy-cocker-coast.jpg` | 1536×1024, JPEG q86; befintligt responsivt breddutsnitt med 132 pt bildhöjd, `cover` |
| Träning, aktuell övning | `/workspace/generated_images/exec-302611d4-5547-491a-983a-f7d8ac5bb58c.png` — corgi på träningsmatta | `training-next-step-puppy-corgi-home.jpg` | 1254×1254, JPEG q86; 88×88 pt vänsterminiatyr i nästa-övning-kortet, `cover`; ansikte/öron fyller utsnittet |

UI-ändringen är begränsad till att lägga till corgibilden i vänsterkolumnen av kortet för nästa övning, med befintlig 88 pt-bildtoken och kvadratisk `cover`-beskärning. Kortets text, knapp, slutförandeflöde och träningsdata ändras inte. Bilderna är dekorativa och får ingen synlig `Standardbild`-badge; befintliga badges på separata kontrakterade profilporträtt ändras inte.

## Skrivvägar

- `assets/images/knowledge-featured-puppy-lagotto-forest.jpg`
- `assets/images/knowledge-card-puppy-sheltie-window.jpg`
- `assets/images/knowledge-card-puppy-cocker-coast.jpg`
- `assets/images/training-next-step-puppy-corgi-home.jpg`
- `assets/images/README.md`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/README.md`
- `src/features/home/HomeCarousel.tsx`
- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/home/README.md`
- `src/features/knowledge/editorial-image-assignment.ts` (stable content/version mapping)
- `docs/design/evidence/vision-rev02/2026-10-21-panels-6-7-image-diversity/` (renderbilder och `RESULTS.json`)
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

PNG-källorna kopieras från `generated_images` tillfälligt för konvertering och tas sedan bort ur `assets/images`; originalen i `/workspace/generated_images/` behålls. Inga nya paket, bildnätverksanrop, användardataändamål, innehållsändringar, navigationer eller datakontrakt ingår.

Exakta stabila presentationstilldelningar för de tre lokala review-guiderna:

| Guide-ID | Version | Bild |
|---|---:|---|
| `review-v1:training:trygg-start` | 1 | Lagotto i skog |
| `review-v1:training:kontakt` | 1 | Sheltie vid fönster |
| `review-v1:training:vardagsro` | 1 | Cocker vid kuststig |

Övriga publicerade guides väljer plats deterministiskt från guide-ID + version. Samma rena helper används i Kunskap och HomeCarousel. Okänd/ogiltig identitet faller tillbaka till lagotto-platsen och får inte orsaka annan destination eller annan guideversion.

## Acceptans

- De tre lokala review-guiderna använder tre distinkta tillgångar i initiallistan. Deras guide-ID/version håller bildvalet stabilt efter sök/filter och omordning; `HomeCarousel` ger samma guide samma bild. Därmed minskar faktisk reuse utan att en platsberoende lista byter hund.
- Hemmets Kunskap-karusellkort använder samma bild som den guide det öppnar. Training-karusellens valda nästa steg och motsvarande panel 6-kort använder corgibilden. Övriga Home-karusellbilder byts inte.
- Träningens aktuella övningskort visar corgibilden utan att bilden antyder att övningen redan är utförd. Knappen öppnar samma övningsflöde som tidigare.
- Varje JPEG behåller källans pixelmått och har inga metadata. Kommandot är `magick <source.png> -strip -quality 86 <asset.jpg>`; behåll q86 och upplösningen. Varje JPEG är högst 350 KB; de fyra tillsammans högst 1.4 MB.
- Bildkvalitet och beskärning granskas genom verkliga komponenter vid 375×844, 430×844, 375×667 och 140% text: Kunskaps hero på 200 pt, mindre guidekort på 132 pt, Home-karusellens Knowledge/Training-bilder och Träningens 88×88 pt miniatyr. Kontrollera ansikte/anatomi, distinkta första tre Kunskap-bilder, nåbara kontroller och inget överlapp med bottennavigation. Corgiögon, ansikte och båda öronen ska vara tydliga i 88 pt. Om app-render inte kan tas rapporteras `NOT TESTABLE`; crop-simulering räcker inte för visuell panelacceptans.
- Bilderna är dekorativa för VoiceOver/TalkBack. De får inte etiketteras som hundens eget foto eller användas som tränings-/hälsobevis.
- Panel 8 fortsätter vara blockerad av befintlig Compliance-grind; denna bildplan ändrar inte den grinden.

## Verifiering och avgränsning

- Före commit, kontrollera referenser med `rg` och bilderna med `file`, `magick identify`, bytebudget samt metadatafria q86-JPEG-utdata; dokumentera resultaten och riktiga renderstatusar i evidenskatalogen.
- Rör inga bildkortens destinationer, handlers, guide-ID/version, innehåll, progress eller dataadapter. Källkodgranskning bekräftar att befintliga tryckmål och dataflöden är kvar.
- Detta är en bilddiversitetscheckpoint. Den slutför inte övriga UI-/funktionsluckor i panel 6 eller 7 och ändrar inte FLOW-TRAINING-01/FLOW-KNOWLEDGE-01-status utan deras separata acceptans.
- Lägg inte till testfiler i denna bildslice. Om användaren vill ha automatisk regressionstestning kan den beställas i separat plan; den här leveransen rapporterar endast faktiskt körda kontroller.
- `assets/images/README.md` ska för varje fil ange källväg och genererings-ID, datum/verktyg, prompt-/motivspårning, AI-genererad status, användningsrätt/termsreferens och begränsning (ingen tredjepartsbild/import, inte en användares hund), redaktionell roll, faktiska crop-ytor, dekorativ a11y-behandling, avsiktlig Home/Kunskap- eller Home/Träning-återanvändning, konverteringskommando samt original- och JPEG-dimensioner/bytes.

## Planreview

- Architect: **APPROVE** — risk, skrivvägar, stabil ID-/versionsmappning, cropgeometri, provenance/rättigheter, budget, renderkrav och checkpointgräns är explicita; corgin är lämplig i 88×88 pt.
- Critic: **PROCEED** — tre guider får distinkta stabila bilder, Home reuse följer samma innehåll, dekorrollen/a11y och assetbudget är tydliga; kvarstående faktisk render ska markeras NOT TESTABLE.

## Implementationsstatus

- Fyra JPEG-filer är konverterade. Källmått bevaras; storlek 1,106,442 B totalt, samtliga under 350 KB. Filerna har visuellt granskats som motiv; faktisk appbeskärning är separat.
- `editorial-image-assignment.ts` ger de tre review-guiderna varsin fast bild och binder övriga till guide-ID/version med reproducerbar hash. Kunskap och HomeCarousel använder samma funktion för samma guide.
- Träningens nästa-övning-kort visar corgin i befintlig 88×88 pt bildtoken; HomeCarousel använder samma bild för nästa träningssteg. Destination och completion-handling är oförändrade i ändringen.
- React Native-rendering, 375×844, 430×844, 375×667 och 140 % text är **NOT TESTABLE** i denna miljö. Inga skärmbilder finns och inget visuellt panel-PASS hävdas. Skärmbild och §14 krävs när en godkänd renderer finns.
- `pnpm check` PASS efter implementation: app-TypeScript, edge-TypeScript, ESLint och 63/63 tester. Ingen särskild bildbeskärningstestfil har lagts till; checken verifierar inte faktisk appbeskärning. Verklig komponentrender och §14 återstår.

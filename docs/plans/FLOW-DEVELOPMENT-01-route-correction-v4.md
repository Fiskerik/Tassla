# FLOW-DEVELOPMENT-01 — guide-retur, unik hero-bild och isolerat scrollminne

- **Datum:** 2026-10-21
- **Task:** `FLOW-DEVELOPMENT-01`
- **Grundplan:** `VISION-R02-HEM-2-3-8-2026-10-21-v8.md`, checkpoint 2
- **Version:** v4
- **Supersedes:** v3 to correct the shared AppScreen scroll-memory assumption discovered during route integration. V3 was approved by Architect and Critic.
- **Status:** väntar på exakt Architect- och Critic-review före scrollimplementation.

## Syfte och avgränsning

V8 kräver att en guide från Utveckling går tillbaka direkt till Utveckling, men den delade `KnowledgeScreen` har bara en generell guideretur. v3:s godkända route- och bildval behålls. Vid implementation hittades att `AppScreen` sparar en enda numerisk scrollposition, vilket inte kan hålla Hem och Checklistans befintliga flöde separat när båda ska kunna återställas. v4 lägger till nycklat scrollminne och scope-rensning för korrekt retur. Alla övriga panel-2-krav, datakontrakt, riskklass M och checkpoints i v8 gäller oförändrade. Ingen Insights-kod ingår.

## Skrivvägar

- `assets/images/development-hero-puppy-brindle.png`
- `assets/images/README.md`
- `src/components/AppPrimitives.tsx`
- `src/features/home/DevelopmentScreen.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/main-navigation.ts`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/theme/tokens.ts`
- `src/features/home/README.md`
- `tests/development-screen-model.test.mjs`
- `tests/home-panel-routes.test.mjs`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/development/`
- `docs/plans/FLOW-DEVELOPMENT-01-route-correction-v3.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

## Bildval och roll

`assets/images/development-hero-puppy-brindle.png` är en ny AI-genererad porträttbild av en brindle-/cremefärgad blandrashund på en varm stenlagd trädgårdsgång, fotograferad snett framifrån. Den har annan pälsfärg, pose, utsnitt och tydlig stenbakgrund än Hemmets golden retriever-närbild mot grönt. Bilden används endast i panel 2 och märks `Standardbild`; den föreställer inte ägarens hund. `assets/images/README.md` anger motiv, användning, genereringsdatum och AI-ursprung. Panel 3 får en annan bild i sin egen checkpoint.

## Returkontrakt

1. Endast när en versionerad, publicerad guide öppnas inifrån `development` sätts Knowledge-detailens föräldrakontext till Development. Detailen visar då `Tillbaka till Utveckling`, och handlingen anropar den befintliga route-returen till `development` samt stänger artikeldetaljen. Etikett och faktiskt callbackmål måste alltid överensstämma.
2. Guideöppning från vanlig Kunskap behåller befintlig label, navigation och callback till Kunskapens guidevy. Träningens artikel-/stegretur påverkas inte. Lägg inte till en ny bottennavflik.
3. Utveckling öppnar exakt den valda publicerade guideversionen. Detailen använder samma versionsspecifika content ID; v8:s publiceringsfilter och guideavgränsning gäller. Retur får inte ersätta versionen med en nyare artikel.
4. `activeMainTabDestination('development')` mappar till `home`; Utveckling och dess Knowledge-detail är barn i Hem-resan.

## Scope och scroll

- `AppScreen` lagrar offset per aktiv `scrollKey`, inte i en enda delad siffra. Den återställer endast nyckeln som matchar `preserveScrollKey`; nyckelbyten mellan Home, Utveckling, artikel och Checklista får inte skriva över varandras positioner. När `scrollMemoryScope` ändras eller användaren lämnar ett barnflöde till en fristående huvudflik rensas relevanta sparade offsetar. `ProductWorkspace` skickar den aktuella scope-nyckeln till `AppScreen`.
- Hem använder `home-detail-flow`; Checklistan behåller sin separata `home-checklist-flow`. Utveckling och dess Knowledge-detail använder egna aktiva scrollnycklar. Därmed kan respektive vy återställas direkt vid retur utan att ersätta Hem-positionen. Hemmets och Check-listans offsetar hålls oberoende.
- Scope-/fokusnyckeln inkluderar konto-ID, `accountGeneration`, hund-ID, ras, exakt födelsedatum, härledd ålder och review/public-kontext. Ändring av något av dessa värden invaliderar Development-routen och artikel-fokus; visa Hem med aktuell hund i stället för att återöppna en stale artikel. Exakt födelsedatum behövs även när ändringen inte flyttar hunden till en ny hel åldersvecka.
- Offset återställs endast när `scrollKey` matchar `preserveScrollKey`.

## Tester och acceptans

Utöka `tests/home-panel-routes.test.mjs` så testerna utövar faktiska callbackmål och stateövergångar, inte enbart etiketter:

- Development-guide: returtext `Tillbaka till Utveckling`; tryck stänger detail och landar direkt på Utveckling.
- Vanlig Kunskap-guide: befintlig returtext och callback till Kunskapens guidevy är oförändrade.
- Träningens befintliga detaljretur är oförändrad.
- Öppnad artikel är exakt vald publicerad version; review/ej publicerad artikel kan inte öppnas från Development.
- Konto-, hund-, ras-, exakt födelsedatum-/ålder- och review/public-scopebyte invaliderar route och artikel-fokus; födelsedatum ändrat inom samma åldersvecka täcks.
- Hemmets `home-detail-flow`-offset överlever Hem → Utveckling → artikel → Utveckling → Hem; Checklistans separat sparade offset blandas inte in; båda rensas vid scopebyte eller när användaren lämnar respektive flöde.
- Development räknas som Home i aktiv bottennavdestination.
- `assets/images/development-hero-puppy-brindle.png` visas i stor hero och som `Standardbild`.

Kör v8:s fokuserade tester och fulla kontroller för slice 2; gör ny public/review-render av Development och guide-returen, jämför med `vision_rev02.jpg`, och dokumentera de separata visuella kriterierna i §14. Ingen scroll-/routekod skrivs före Architect APPROVE och Critic PROCEED för exakt v4; v3:s bildasset är redan godkänd och finns lokalt.

## Oförändrade begränsningar

Ingen milstolpskälla eller milstolptext införs. Åldersbåge, åldersfaser, `Standardbild`, publicerade guider, loading/empty/error states och ärlig partiell panel följer v8. Inga migrations-, RPC-, nätverks-, telemetri-, ändamåls- eller dependencyändringar tillåts. Utvecklingspanelen förblir partiell tills en separat sakgranskad och publicerad milstolpskälla finns.

# FLOW-DEVELOPMENT-01 — rättning av guide-retur

- **Datum:** 2026-10-21
- **Task:** `FLOW-DEVELOPMENT-01`
- **Grundplan:** `VISION-R02-HEM-2-3-8-2026-10-21-v8.md`, checkpoint 2
- **Status:** INAKTIV — äldsta funktionsdubbletten; v2 tog över dess returkontrakt och lade till panelspecifik bild. Behålls endast som granskningshistorik.

## Syfte och avgränsning

Den godkända v8-planen kräver att en guide från Utveckling går tillbaka direkt till Utveckling, men den delade `KnowledgeScreen` har bara en generell guideretur. Den här korrigeringen lägger till ett kontextbundet returval och preciserar scope-/scrollbeteendet. Alla övriga panel-2-krav, datakontrakt, riskklass M och checkpoints i v8 gäller oförändrade. Ingen Insights-kod ingår.

## Skrivvägar

- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/main-navigation.ts`
- `tests/home-panel-routes.test.mjs`
- `src/features/home/README.md`
- `docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/development/`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

Uppdatera den befintliga panelguiden; skapa inte en parallell guide.

## Returkontrakt

1. Endast när en versionerad, publicerad guide öppnas inifrån `development` sätts Knowledge-detailens föräldrakontext till Development. Detailen visar då `Tillbaka till Utveckling`, och handlingen anropar den befintliga route-returen till `development` samt stänger artikeldetaljen. Etikett och faktiskt callbackmål måste alltid överensstämma.
2. Guideöppning från vanlig Kunskap behåller befintlig label, navigation och callback till Kunskapens guidevy. Träningens artikel-/stegretur påverkas inte. Lägg inte till en ny bottennavflik.
3. Utveckling öppnar exakt den valda publicerade guideversionen. Detaljen använder samma versionsspecifika content ID; v8:s publiceringsfilter och guideavgränsning gäller. Retur får inte ersätta versionen med en nyare artikel.
4. `activeMainTabDestination('development')` mappar till `home`; Utveckling och dess Knowledge-detail är barn i Hem-resan.

## Scope och scroll

- Scope-/fokusnyckeln inkluderar konto-ID, `accountGeneration`, hund-ID, ras, exakt födelsedatum, härledd ålder och review/public-kontext. Ändring av något av dessa värden invaliderar Development-routen och artikel-fokus; visa Hem med aktuell hund i stället för att återöppna en stale artikel. Exakt födelsedatum behövs även när ändringen inte flyttar hunden till en ny hel åldersvecka.
- När Hem öppnar ett barnflöde sparas dess scrolloffset med `scrollKey="home-detail-flow"`. Under Development och en guide som öppnats där ligger `preserveScrollKey` kvar som `home-detail-flow`. Retur till Utveckling och sedan Hem återställer samma offset. Lämnar användaren barnflödet till en annan bottennavdestination rensas offseten. Följ `AppScreen`-kontraktet: offset återställs endast när `scrollKey` matchar `preserveScrollKey`.
- Scopebyte rensar också sparad Hem-offset innan aktuell Hem-vy visas.

## Tester och acceptans

Utöka `tests/home-panel-routes.test.mjs` så testerna utövar faktiska callbackmål och stateövergångar, inte enbart etiketter:

- Development-guide: synlig returtext är `Tillbaka till Utveckling`; tryck stänger detail och landar direkt på Utveckling.
- Vanlig Kunskap-guide: befintlig returtext och callback till Kunskapens guidevy är oförändrade.
- Träningens befintliga detaljretur är oförändrad.
- Öppnad artikel är exakt vald publicerad version; review/ej publicerad artikel kan inte öppnas från Development.
- Konto-, hund-, ras-, exakt födelsedatum-/ålder- och review/public-scopebyte invaliderar route och artikel-fokus; födelsedatum ändrat inom samma åldersvecka täcks.
- Hemmets `home-detail-flow`-offset överlever Development → artikel → Development → Hem och rensas när flödet lämnas eller scope ändras.
- Development räknas som Home i aktiv bottennavdestination.

Kör v8:s fokuserade tester och fulla kontroller för slice 2; gör en ny public/review-render av Development och dess guide-retur, jämför med `vision_rev02.jpg`, och dokumentera de separata visuella kriterierna i §14. Ingen kod skrivs före Architect APPROVE och Critic PROCEED för den här exakta korrigeringen.

## Oförändrade begränsningar

Ingen milstolpskälla eller milstolptext införs. Åldersbåge, åldersfaser, generisk `Standardbild`, publicerade guider, loading/empty/error states och ärlig partiell panel följer v8. Inga migrations-, RPC-, nätverks-, telemetri-, ändamåls- eller dependencyändringar tillåts. Utvecklingspanelen förblir partiell tills en separat sakgranskad och publicerad milstolpskälla finns.

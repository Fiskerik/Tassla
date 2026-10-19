# UI/UX 2b — tillgänglighet i stödvyer

Version 1.6 · 2026-10-19 · Status: lokal checkpoint klar efter oberoende QA PASS och Reviewer PASS; native iPhone-kontroller återstår manuellt.

## Användaruppgift

Hundägaren ska kunna använda rutin-, notis-, hälsa/vikt-, profil- och Tassla-passvyer även när systemtexten är stor eller formulär visas med tangentbordet.

## Synlig information och huvudhandling

Varje befintlig vy behåller sin titel, innehåll, fält, status och primära handling. Datum-/tidskontroller visar datum med kalenderikon och tid med klockikon i stället för synliga knapptexter på alla skärmar som använder de delade komponenterna; deras fulla skärmläsarnamn och tryckyta bevaras. Formulärskaftet i Rutiner och utförd Hälsa ska ge plats åt innehåll och knappar när tangentbordet tar skärmyta. Vikthistorikens Spara/Avbryt staplas vid stor text/smal bredd.

## Layoutkontrakt

- Standardskala: bevara nuvarande kompaktlayout.
- Stor text eller smal viewport: använd naturlig vertikal tillväxt; stapla datum-/tidsväljare och viktåtgärder i stället för att krympa eller klippa text.
- I Loggs redigeringsark introduceras stapling när `fontScale > 1.2`; standard 1.0 behåller datum och tid på en rad och 1.4 staplar fälten. Detta förebygger att det fullständiga datumet klipps i 375 px/140 %-läget.
- Rutinkortets destruktiva åtgärd visas som soptunneikon utan synlig text, med minst 44×44 pt tryckyta och ett tillgängligt namn som anger namngiven rutin. Bekräftelse och radering lämnas oförändrade.
- Inventera varje knappetikett i alla fem stödresor vid standard och 140 %, och dokumentera per skärm aktuell etikett, vald kortare etikett/ikon eller beslut att behålla, skäl och fullständigt tillgängligt namn. I 140 % ska onödig kontext och upprepningar kortas så knappar inte tar oproportionerligt med skärmyta. Använd kort tydlig handling eller välkänd ikon när sammanhanget gör den begriplig direkt; behåll text när ikon/etikett annars blir tvetydig. Minska inte fontstorleken, trunkera inte och förkorta inte innebörden.
- Lägg inte till skör fontScale-detektion för att växla etiketter. Om befintliga komponenter inte stöder tillförlitlig skalstyrning, välj en tydlig kompakt etikett i alla skalor. Standardrenderingen ska annars behålla nuvarande copy.
- Bottom sheets med formulär: keyboard-aware scroll, bibehållna dismissal- och dirty-state-regler, formulärfält och primärhandling nåbara. Passport-avsnittsval och rutinhanteraren använder opt-in `pinPrimaryAction`: arket hålls inom viewporten, primärknappen ligger fast och list-/formulärinnehåll scrollar separat. Detta ändrar inte tangentbordsbeteendet i övriga sheets.
- Andra stödvyer som använder delade datum-/tidskontroller ingår i samma begränsade knapp-/layoutgranskning; ändra dem bara för verifierade problem enligt detta kontrakt.

## Tillstånd och hjälpmedel

Bevara befintliga ready/loading/error/pending/failed/unsure, validering och sparmeddelanden. Alla knappar och textfält behåller sina tillgängliga namn och roller. Vid keyboard submit på rutintextfältet stängs tangentbordet; det sparar inte automatiskt.

## Verifiering

RN Web public/review vid 375×667 och 375/430 px, standard och 140 %-proxy. För LogScreen ska standardfontScale 1.0 verifieras på en rad och 1.4 på staplade fält. Kontrollera inga horisontellt avklippta värden eller knappar, viktens redigeringsåtgärder, rutin-/hälsoformulärens scrollbarhet och de oändrade vyernas regression. Syntetisk banner/fixture ingår inte i produkten. Native iOS-tangentbord och fysisk Dynamic Type markeras NOT TESTABLE här.

## Acceptans

Render-rapporten innehåller knappinventering för standard och 140 % med etikett före/efter, beslut/motiv och tillgängligt namn, samt verifiering att hela datumet visas i Loggs redigeringsark efter att fälten staplats vid `fontScale > 1.2`; verifiera 1.0 en rad och 1.4 staplat. Passport- och rutinsheetens `Klar`-knapp ska vara helt synlig vid 375×667, 375×844 och 430×844, standard och 140 %-CSS-proxy, medan innehåll scrollar separat. Se task `UIUX-2B-SUPPORT-ACCESS-01` version 1.6. Layoutändringarna får inte ändra innehåll, destinationer, dataskrivning, medicinsk betydelse, behörighetsflöde, validering eller raderingssemantik. v1.5 Reviewer blockerade footeracceptansen eftersom sparade bilder visade Klar klippt. v1.6 ersätter de bilderna och dokumenterar aktuell viewport- och scrollverifiering; oberoende QA PASS och Reviewer PASS.

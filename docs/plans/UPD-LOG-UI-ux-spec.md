# UPD-LOG-UI – UX-specifikation

Status: v7 har Product/Critic PROCEED, Architect APPROVE, Eriks scopegodkännande 2026-10-12 samt oberoende QA, Security och Reviewer PASS; implementation commit `4f36b12` är pushad till `origin/codex/repo-grounding`

## Mål och startpunkt

Ägaren ska kunna registrera en snabb logghändelse direkt och vid behov komplettera den efteråt. Flödet börjar på Logga-sidan i en av de befintliga snabbvalsrutorna. Snabbregistreringen förblir en skrivning; detaljarket är valfritt och öppnas först efter bekräftad sparning för olycka, mat eller vatten.

## Flöde

- Olycka visar valfria checkboxar `Kiss` och `Bajs`; båda kan väljas. `Spara` skriver detaljerna på samma loggpost. `Hoppa över` stänger utan en andra skrivning.
- Mat visar valfri mängd i g och valfri fodertyp. Vatten visar valfri mängd i ml, med ml/dl-växling som bevarar volymen. Tidigare fodertyper kommer enbart från redan inlästa loggar för aktiv hund och märks som historik.
- Det befintliga redigeringsarket kan visa, ändra och rensa detaljer. Typbyte tar bort detaljer som inte gäller den nya typen.
- Loggrader visar endast de sparade detaljer som finns; befintlig daggruppering, sortering, sidning och snabbflöde fortsätter gälla.
- Den befintliga sammanfattningen `Dina senaste mönster` är stängd som standard när den befintliga datatröskeln är uppnådd. En sekundär knapp `Visa dina senaste mönster` öppnar den befintliga antal-/intervalltexten; knappen blir `Dölj dina senaste mönster` tills den stängs igen. Utan mönsterdata visas ingen knapp. Antal, intervall, tröskel och beräkning ändras inte. Visuell QA provar datafrånvaro, stängt och öppet läge.

## Sparning och feedback

Pending visar `Sparar…` och spärrar dubbel submit. Bara bekräftade writes får visas som sparade. Definitivt fel behåller inmatning och ger retry eller uttrycklig discard. Osäkert utfall får aldrig visas som sparat; en ny posts Undo väntar ut detaljwrite och tar bort samma bekräftade add. En osäker befintlig redigering kan stängas endast om utkast och synlig retry-status bevaras.

Arket får inte öppnas för pending, failed eller unsure snabb-add. Undo för den bekräftade adden visas där arket annars skulle täcka toasten. Vanliga snabbval utanför olycka, mat och vatten behåller nuvarande flöde.

## Tillgänglighet och gränser

Återanvänd befintligt `BottomSheet`, kontroller, tokens och ikoner. Tryckytor ska vara minst 44 pt; checkboxstatus ska vara tillgänglig för skärmläsare. Arket ska fungera med tangentbord, fokus, skrollning, stor text och reducerad rörelse. Ingen ny animation eller dependency.

Ingen hälsotolkning, foderrekommendation eller mängdrådgivning visas. Mängdtaken är tekniska fältgränser per loggpost. Inga nya fetches, dataändamål, skärmar eller datakontrakt tillkommer.

## Antaganden och målbild

UPD-1011 beställer uttryckligen ett valfritt detaljark efter den befintliga snabbregistreringen. QA fann att den befintliga senaste-mönster-sammanfattningen annars visas utan handling, vilket inte klarar designregel 11. Föreslagen minsta rättning är en visa/dölj-kontroll utan ändrad beräkning eller textinnehåll. Detaljarket är ett begränsat tillägg till målbildens 2×2 snabbval och kompakta dagsgrupperade logg; placering, navigering, färg/typografi och övriga kort ändras inte. `vision_rev01.jpg` och `docs/design-rules.md` styr utseendet. Visuell verifiering kräver renderade skärmbilder för relevanta tillstånd vid 375/430 px och 140 % text; utan rendering markeras den `NOT TESTABLE`.

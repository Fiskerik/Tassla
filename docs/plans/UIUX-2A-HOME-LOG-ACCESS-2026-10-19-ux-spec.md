# UI/UX 2a — tillgänglighet på Hem och Logg

Version 1.4 · 2026-10-19 · Status: lokal kodcheckpoint klar efter oberoende QA och Reviewer PASS; native iPhone-prov återstår. Mandat: Eriks beställning av paketen 2a–5.

## Användaruppgift

Ägaren ska kunna förstå och använda Hemmets dagslista och Loggs snabbregistrering/historik med större text eller skärmläsare, och ska kunna återhämta sig när en skrivning inte kan bekräftas.

## Ingång, synlig information och huvudhandling

- **Hem, panel 1:** hundens namn/ålder, dagens uppgifter, deras bekräftade status och hantering. Huvudhandling varierar med uppgift: öppna rätt detalj eller markera en egen rutin. Behåll befintlig två-raderspresentation vid standardskrift; vid större systemtext ska raderna kunna växa naturligt utan två-radersklämma.
- **Logg, panel 5:** datum, snabbval och tidslinje. Ett snabbval ska fortsatt starta samma en-trycksloggning; en post öppnas för redigering.
- **Delad huvudmeny:** alla fem svenska tabnamn ska förbli fullt synliga vid större text, med oförändrad ordning, destination, selected-state och tillgängligt fullnamn.
- Osäkert sparresultat ligger nära den berörda posten/formuläret och erbjuder endast den befintliga kontroll-/retry-handlingen.

## Tillstånd och återkoppling

Bevara befintliga `pending`, `saved`, `failed` och `unsure`-kontrakt. Success visas bara efter bekräftad skrivning; failed/unsure lämnar synligt vad som behöver göras, behåller formulärintention och erbjuder en nåbar retry. Ingen obekräftad Home-bock eller Loggpost blir permanent synlig.

## Tillgänglighet

- Interaktiva namn beskriver den verkliga handlingen och berörd post/hund; checkboxar och progress exponerar värde/status, inte bara färg eller ikon. En pågående Hem-skrivning exponerar busy och `Sparar`/aktuell status på den berörda kontrollen/raden.
- Text fortsätter använda systemets skalning och naturlig scrollning; knappar och fält förblir nåbara vid låga skärmhöjder.
- Endast den lyckade snabbregistreringstoast som innehåller `Ångra` får en längre livstid för VoiceOver-användare, tills handlingen används eller ersätts av en ny logghändelse. Vanligt läge och övriga delade Toast-instanser behåller befintlig/konfigurerad livstid.
- Befintlig reduced-motion-hook förhindrar rörelse som inte behövs för begriplighet.
- Native VoiceOver och Dynamic Type kontrolleras separat från RN Web-semantik och 140 %-webbproxy. Det ena bevisar inte det andra.

## Jämförelse med målbild

| Referens | Produktkomponent | Mål |
|---|---|---|
| Panel 1: hundidentitet, sammanhållen dagslista och progress | `HomeScreen`, `DailyActivityItem` | Samma läsbara innehåll och handlingar vid större text; status kan läsas med namn/state. |
| Panel 5: datum, snabbval, tidslinje och editor | `LogScreen`, `Toast` | Kompakt form vid standardskrift, men full text och trygg sparåterhämtning vid större text/skärmläsare. |

Endast konkreta avvikelser som visar sig i granskningen får rättas. Ingen refaktor av data-/write paths, schema, navigation, copy utanför handling/status eller global UI.

## Acceptans

1. Alla befintliga handlingar fungerar som före ändringen och har begripliga synliga och tillgängliga namn.
2. Checkbox, progress, pending/failed/unsure, retry och undo läses korrekt utan färg eller animation som enda signal; Home behåller två synliga rader för aktivitetsnamn vid standardskrift och släpper begränsningen när större systemtext kräver naturlig tillväxt.
3. 375/430 px, 375×667 och 140 % textproxy har ingen klippt handling eller horisontell overflow; formulär kan scrollas till primärknappen.
4. VoiceOver når `Ångra` efter lyckad snabbregistrering; med aktiv skärmläsare auto-försvinner inte just den toasten. Andra Toast-instanser behåller sina livstider.
5. Huvudmenyn visar Hem, Logg, Träning, Kunskap och Mer fullt och nåbart vid 140 % text i 375/430 px; ordning, destination, tabsemantik och selected-state bevaras.
6. Reducerad rörelse tar bort dekorativ slide/fade utan att ta bort status eller fördröja input.
7. Native VoiceOver, fysisk Dynamic Type och OS reducerad rörelse listas som manuella iPhone-prov när de inte kan köras här.

### QA-korrigering 1

- QA fann att Home-radens `Sparar…` var synligt men saknade tydlig busy/status-semantik i skärmläsarträdet. Den befintliga `DailyActivityItem` får exponera busy och aktuell status i de berörda kontrollnamnen; skriv-/retrylogiken är skyddad.
- QA saknade Logg-evidens vid stor text och kort viewport. Rendera 375×667 vid 140 % med editorn öppen; `Spara ändring` ska vara synlig/nåbar när formuläret scrollas.
- Rendera även befintliga Logg `failed` och `unsure` editfall och verifiera att retry visas utan att anteckningen försvinner.
- Architect APPROVE och Critic PROCEED för delta finns dokumenterade i task v1.6 före implementation.

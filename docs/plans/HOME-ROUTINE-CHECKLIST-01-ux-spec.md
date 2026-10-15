# UX-specifikation: samlad redigering av dagsrutin

Datum: 2026-10-14 · Version: 1 · Uppgift: `HOME-ROUTINE-CHECKLIST-01` · Plan: `daily-routines-checklists.md` v5

## Mål och ingång

Ägaren ska kunna förstå och redigera en rutin från ett ställe utan en rad knappar för varje checklistepunkt. Rutiner och aktiviteter öppnas från Hemmets befintliga hantering.

Varje sparad rutin visar sitt namn, sin checklista och en kort upprepningssammanfattning. En pennknapp med texten `Redigera` placeras direkt intill rutinens namn. Den öppnar rutinens kompletta redigeringsläge.

## Flöde och tillstånd

1. **Läs:** namn och punkter visas utan punktvisa redigeringsknappar eller redigeringsgester. Upprepning visas kortfattat. `Redigera` är den tydliga vägen till rutinens inställningar.
2. **Redigera:** ett tryck öppnar textfält för rutinens namn och alla punkter, plus den befintliga kontrollen för aldrig/dagligen/eget dags-, vecko- eller månadsintervall. En plusknapp lägger alltid till en tom punkt sist i listan med ett nytt stabilt ID. Varje rad har en minusknapp som tar bort just den radens ID; kvarvarande ID:n och ordning bevaras. Den sista kvarvarande raden kan inte tas bort. En rutin kan ha 1–50 punkter, med högst 160 tecken per namn/punkt. Bara en rutin kan vara i edit mode åt gången.
3. **Spara:** `Spara rutin` skickar namn, stabila punkt-ID:n, ordning, text och upprepning i en enda befintlig atomisk malluppdatering. Redigeringen lämnar inte läget förrän readback bekräftar sparningen. Retry återanvänder samma önskade payload och punkt-ID:n.
4. **Avbryt:** kastar hela det osparade utkastet och återgår till sparad läsvy.
5. **Sparfel/okänt resultat:** behåll alla fält och det exakta önskade utkastet. Visa befintlig fel-/retry-återkoppling; visa inte sparad status före bekräftad readback. Vid pending/unknown är fält, Avbryt och andra handlingar låsta tills retry/readback har löst resultatet.
6. **Laddning och osparat utkast:** stäng av dubbla sparningar. Medan edit mode är öppet blockeras `Redigera`, lägg till/ta bort från Hemskärmen, ta bort rutin och allt annat dagsurval (inklusive träningsval). Ägaren behöver spara eller trycka `Avbryt` innan en annan rutin eller dagsurval kan ändras.
7. **Stängning och scopebyte:** om utkastet är ändrat frågar sheetens stäng-/bakåtväg uttryckligen om ägaren vill kasta det; bekräftelse motsvarar `Avbryt`. Vid pending/unknown blockeras stängning och byte av rutin/dag tills readback eller exakt retry har löst skrivningen. En framtvingad konto-/session-unmount får rensa det hundbundna lokala utkastet utan att skriva.

Skapaformuläret börjar fortfarande med `Namn på rutin` och använder samma kompakta plus/minusmönster. Frekvensen och checklistan sparas tillsammans när en ny rutin skapas.

## Copy och visuell hierarki

| Referens/nuvarande skillnad | Ny kontroll | Godkännandekriterium |
| --- | --- | --- |
| Skärmbilden visar rutinens namn `Morgonrutin` följt av `Redigera namn` | En pennknapp `Redigera` på namnraden | Knappen redigerar hela rutinen, inte enbart namnet |
| Varje checklistepunkt har separat `Hantera`/pennväg | Ingen edit-kontroll i läsvyn | Checklistan förblir ren och lätt att skanna |
| Namn, punkter och frekvens redigeras i separata delsteg | Samlat edit mode | Samma spara/avbryt omfattar alla tre |
| Upprepad förklarande text | Kort sammanfattning; förklaringar bakom befintlig `(i)`-knapp | Ingen teknisk text upprepas per rutin/punkt |
| Radåtgärder har många etiketter | `+` sist i listan och `−` på varje rad i edit mode | Ikoner har tydliga tillgänglighetsnamn och minst 44×44 pt träffyta |

Åtgärden att lägga till/ta bort rutinen från Hemskärmen och bekräftad borttagning av en hel rutin ligger kvar utanför edit mode men är låst för alla rutiner medan ett utkast eller en mutation pågår. `(i)` visar bara nödvändig hjälp om dagsurval och upprepning.

## Tillgänglighet och inmatning

- Pennknappen har tillgängligt namn `Redigera rutin <namn>` och minst 44×44 pt träffyta.
- Plus/minus har tillgängliga namn som anger om en punkt läggs till eller vilken punkt tas bort. Båda har minst 44×44 pt träffyta.
- Namn och varje punktfält har egna tillgängliga etiketter. Upprepningsvalen behåller radio-semantik och markerat tillstånd.
- Ingen funktion kräver long-press. Textfält, fokus, tangentbord och scroll ska fungera i kort sheet och vid 140 % textproxy; knappar får inte klippas.
- Sparfel behåller inmatning; avbryt återställer endast det osparade rutinutkastet.
- Smutsigt utkast kan inte försvinna vid sheet-stängning eller scopebyte utan uttrycklig bekräftelse. Pending/unknown kan inte lämnas innan sparresultatet är känt. Rendera discard-bekräftelsen och failed/unknown-lägen med alla fält kvar.

## Avgränsning

Ändra bara `DailyActivityManagerSheet`-interaktionen, tillhörande Home-dokumentation, uppgiftsspecifikation, visuell fixture och renderbevis. Använd nuvarande data-/RPC-kontrakt och upprepningslogik. Ändra inte migration, träningsval, Hemkortets komposition eller andra skärmar. Ingen databasåtgärd ingår i denna UI-del.

Verifiera befintliga typecheck-/lint-/buildflöden och dokumentera manuella renderingar vid 375×844, 430×844, 375×667 och 140 % textproxy. Kör inga testsviter. Native Dynamic Type/VoiceOver och Supabase-runtime förblir separat verifiering.

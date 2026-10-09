# HÄLSA – UX-specifikation

## Användaruppgift och entry point

Ägaren ska kunna se registrerade och planerade hälsohändelser utan att vyn känns som en klinisk journal. Hälsa öppnas via befintlig bottennavigation och har befintlig tillbaka-navigation.

## Happy path

1. Appbaren visar Hälsa och tabs: Översikt, Vaccinationer, Veterinär och Vikt.
2. Översikt visar Kommande och Genomfört med ikon-chip, titel, relativ tid/datum och grön bock på genomförda poster.
3. Vaccinationer och Veterinär filtrerar samma befintliga ägarregistrerade data.
4. Vikt visar befintlig viktregistrering och historik.
5. “Lägg till händelse” är den tydliga primärhandlingen i hälsohistorikens kontext. Viktens befintliga viktformulär behåller sin egen kontextuella sparhandling.

## States och feedback

- Loading: skeleton/listläge för aktiv flik.
- Empty: aktiv lista förklarar lugnt när inga poster finns och behåller eventuell befintlig registreringshandling.
- Error/offline: ErrorState med återförsök; ingen teknisk driftbanner och ingen bekräftelse av osäker write.
- Pending: endast aktuell write blockeras och visar “Sparar…”.
- Saved: bekräftelse visas först efter bekräftad write; normala poster får ingen permanent statusetikett.
- Unsure/failed: befintlig status- och retryhantering behålls utan att visa “Sparat” vid osäkerhet.

## A11y och ton

Tabs exponeras som tablist/tab med vald state. Poster använder ikon och text, inte färg ensam. Genomförda poster har både checkikon och begriplig text. All information benämns som ägarregistrerad uppgift; ingen journal- eller klinisk auktoritet antyds.

## Avgränsningar och avvikelser

Endast befintliga vikt-, vaccinations-, veterinär- och planerade hälsohändelser används. Inga fält för medicin, allergi eller andra nya hälsoområden läggs till. Målbildens foto saknas i dessa data och ersätts inte med påhittad klinisk bild. Visuell status: **NOT TESTABLE** tills skärmdumpar finns.

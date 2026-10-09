# LOGGA – UX-specifikation

## Användaruppgift och entry point

Ägaren ska kunna logga en vanlig händelse med ett tryck och snabbt se vad som hänt idag. Logg öppnas från befintlig bottennavigation eller befintliga Hem-rader. Appbaren har tillbaka till Hem.

## Happy path

1. Användaren ser “Snabb logg” med Kiss, Bajs, Mat och Sömn i en 2×2-grid.
2. Ett tryck startar befintligt write-flöde; dubbla tryck blockeras och duplicate-confirmation behålls.
3. Efter verkligt lyckad write visas en kort bekräftelse och fungerande ångra för skapad post.
4. “Dagens logg” visar tid, händelse, eventuell detalj och chevron. Tryck öppnar befintlig redigering.

## States och feedback

- Loading: skeleton för 2×2-rutorna och listan.
- Normal: enhetliga Ionicons via `IconChip` och `categoryColors`; inga statusetiketter per normal rad.
- Empty: “Inget loggat än” med befintlig snabbhandling.
- Error: ErrorState med “Försök igen”.
- Pending: aktuell handling visar “Sparar…” och blockeras mot dubbletter.
- Saved: toast först efter bekräftad write; ångra erbjuds där det stöds.
- Failed: “Kunde inte spara” med återförsök och avbryt.
- Offline/unsure: befintligt flöde visar att sparstatus inte kunde kontrolleras; aldrig “Sparat”.

## A11y

Alla snabbknappar har tydliga labels, exempelvis “Logga kiss”. Kategorier kommuniceras med både ikon och text. ListRows har tid, händelse, detalj och ändringslabel. Touchytor, färger och typografi kommer från tokens/komponenter; färg är inte ensam bärare av status.

## Avgränsningar och avvikelser

Promenad och Vaken behåller befintligt beteende i editor/datamodell. Ingen ny snabbknapp, layout, navigation, loggtyp eller schemaändring införs. Målbildens fyra tile-kategorier används i snabbfältet.

Visuell status: **NOT TESTABLE** tills skärmdumpar finns för liten/stor telefon och stor text.

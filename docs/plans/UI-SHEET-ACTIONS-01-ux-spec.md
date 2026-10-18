# UI-SHEET-ACTIONS-01 — UX-spec v1

Mål: stäng en sheet med nedåtsvep utan att tappa utkast eller störa scrollning. Ingång: alla befintliga BottomSheet-anrop. Primär handling tillhör innehållets befintliga formulär. Synligt: diskret handtag, rubrik, Stäng-kryss, samma innehåll/footer.

| Element | Nuläge | Ändring/komponent | Acceptans |
|---|---|---|---|
| Sheetens överkant | Ingen dragyta | BottomSheet handtag/rubrik, befintliga tokens | Endast tydlig nedåtgest tar över |
| Stängning | Kryss/backdrop/Android back | Gemensam onRequestClose även för gest | Busy och discard-skydd följer föräldern |
| Lång text/formulär | ScrollView/KeyboardAvoidingView | Behåll struktur, drag utanför ScrollView | Scrollning och tangentbord stjäl inte stänggest |
| Avbruten/nekad stängning | Sheet på ursprungsplats | Kort fjäder tillbaka eller direkt vid reduced motion | Ingen panel fastnar förskjuten |

Normal: dra ned långt/snabbt, föräldern stänger. Kort eller avbrutet drag: återgå. Busy: samma föräldraspärr; återgå. Dirty: samma discard-dialog; återgå medan beslut väntar. Fel/unknown: befintlig input och retry består. Ny öppning börjar på noll. Skärmläsaren använder etiketterad Stäng-knapp; dekorhandtaget döljs. Ingen automatisk sparning eller ny positiv återkoppling.

Referens: rev02 reglerar den delade panelens form; användaren har nu uttryckligen valt tillägget med draghandtag. UI-evidens skiljs från native-gestprov. Kontrollera 375×844, 430×844, 375×667 och 140% text när render är möjlig. Punkt 14 i designreglerna rapporteras utan påhittat visuellt PASS.

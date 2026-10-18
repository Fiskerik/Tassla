# UI-ACTIONS-COMMON — UX-spec v2

Användaren känner igen tre låg-risk åtgärder utan överflödig text: Ångra i toast, kalender och klocka. Toasten fortsätter att säga vad som sparades; bara den riktade återställningsknappen blir ikon. Datum-/tidvärdet och fältets synliga etikett förblir synliga; ikonen öppnar urvalet.

| Tillstånd | Beteende |
|---|---|
| Sparat + återställbar loggning | Toastens endast-meddelande-Text annonseras som alert; den fokuserbara vända pilen är syskon med namnet ”Ångra: {händelse}”. Tryck anropar enda befintliga undo id |
| Pending/failed/unknown/radering | Ingen undo-knapp; retry/Avbryt behåller tydlig text |
| Toast avslutas/dold | Ikon blir disabled/osynlig tillsammans med befintlig toast lifecycle |
| Datum/tid disabled | Synliga fältetiketter/värden kvar; trigger disabled, ingen modal |
| Månadsväxling | Månad/år visas; accessible labels anger riktningshandling och aktuell månad |
| Tidutkast | Öppna kopierar sparat värde; bekräfta validerar och sparar; Avbryt/backdrop lämnar originalvärdet |

Symbolerna använder befintliga Ionicons. Ingen ikon är enda tillgänglighetsnamn; minsta träffyta 44×44pt för nya knappar och kalenderdagar vid 375pt viewport. Datumdialogens insets är 8pt vardera och kortpadding 8pt, vilket ger 343pt gridbredd (minst 308pt krävs). Månadsbyten använder ren hjälpare med körbara årsskiftestester. Ingen annan skrivning, data eller navigation ändras. Skärmbilder/native/Dynamic Type saknar renderer i miljön och redovisas NOT TESTABLE i stället för godkänd.

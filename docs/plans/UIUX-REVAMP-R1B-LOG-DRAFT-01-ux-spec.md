# UX-spec — UIUX-REVAMP-R1B-LOG-DRAFT-01

Version: 5

## Användaruppgift

Ändra en tidigare logghändelse och behålla den ändrade informationen om användaren råkar stänga, gå tillbaka eller växla flik.

## Huvudflöde

Öppna en sparad händelse → redigera → spara eller lämna. En dirty editor frågar **Osparade ändringar** / **Vill du lämna utan att spara?** med **Stanna kvar** och **Lämna utan att spara**. Stay behåller fält och route. Lämna kastar och går till den första begärda destinationen. Samma aktiva flik är en no-op. Fler navigeringsförsök medan frågan visas ignoreras.

## Sparstatus

- Clean/dirty behandlas utifrån kanoniskt innehåll, inte enbart validering.
- Pending/saving: en informativ yta säger **Ändringen sparas. Vänta tills resultatet har bekräftats innan du lämnar.**
- Failed: en enda fel-Toast säger **Ändringen sparades inte. Försök igen eller fortsätt redigera.**, med **Försök igen** och **Fortsätt redigera**. Åtgärden rensar endast failed save-intent; utkastet står kvar i editorn och kan fortfarande sparas eller uttryckligen avbrytas. `Toast` tar emot en valfri `cancelLabel`; utan prop är etiketten fortsatt **Avbryt** för alla befintliga konsumenter. Endast failed Loggeditorn skickar **Fortsätt redigera**, även i retained/exiting state.
- Unsure: en enda uncertainty-Toast säger **Vi kunde inte kontrollera om ändringen sparades. Kontrollera status innan du lämnar.** med Retry/readback. Ingen cancel medan utfall är okänt.
- **Avbryt ändring** är ett tydligt kassera-val i editorn när inget olöst mutationstillstånd finns.

## Tillgänglighet

Använd befintlig native Alert med namngivna val; locked pending copy använder MessageCardens befintliga polite live-region. Toast äger failed/unsure feedback utan samtidig extra banner. Native fokus, Alert-ordning, Android system-back och faktisk skärmläsare är NOT TESTABLE i webbharnessen.

## Målbild och avgränsning

Loggeditorn är en stödskärm utan egen panel i `vision_rev02.jpg`. Följ `docs/design-rules.md` §0–4/§14 och befintlig BottomSheet, Toast, MessageCard, knappstil, minst 44 pt touchmål samt 140 % text. Samma produktkomponent renderas i public/review. Harnessen testar Alert callbacks men inte Alertens native visuella form. Inga pixelmatchpåståenden görs mot annan panel.

## Omfattning

Skydda sheetens stängning, huvudfliksknapp och swipe i Logg samt bevara mutation och redigeringsvärden. Profil, Påminnelser och Hälsa är separata checkpoints. Ingen persistens-/API-/datamodell ändras.
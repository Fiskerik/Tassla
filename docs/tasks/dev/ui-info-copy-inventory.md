# Inventering: beskrivande text bakom informationsknapp

Datum: 2026-10-14 · Kodgranskning, inte generell copy-ändring

Syftet är att hitta återkommande introduktioner och förklaringar som kan döljas bakom en `(i)`-knapp så att själva uppgiften eller innehållet får mer plats. Kortets rubriker, fältetiketter, fel/återställning, beslutstext och information som behövs för säker användning ska ligga kvar synligt.

## Bra kandidater för `(i)` eller borttagning

| Vy | Synlig text i källan | Förslag |
| --- | --- | --- |
| Rutiner på Hem | Långa instruktioner om hur dagens urval fungerar | Redan förenklad: en `(i)` för hjälp; behåll namn, lista och upprepningssammanfattning synliga. |
| Hälsa | `Vikt, planerade och genomförda hälsohändelser.` under sidrubriken | Ta bort introduktionen; rubrikerna och innehållet förklarar sidan. |
| Planerad hälsa | `Egna planer för vaccinationer och veterinärbesök.` och återkommande `Läs information`-länk bredvid informationsmodellen | Ta bort sidintroduktionen och byt länktexten mot en tydlig `(i)`-ikon. Behåll statusen `Planerad – inte genomförd.` där den visas. |
| Hälsans historik | `Om hälsans historik` och `Läs information`-länkar | Ersätt de dubbla orden med en `(i)`-knapp. Behåll själva förklaringen i dialogen. |
| Lokala påminnelser | Inledande mening om att Tassla schemalägger påminnelser på enheten samt synlig dubbelrubrik till informationsdialogen | Ta bort den redundanta introduktionen och gör informationsöppnaren till `(i)`. Behåll text som beskriver vad varje val slår på/av. |
| Träning | `Små steg som bygger på frivillighet och belöning.` under sidrubriken | Ta bort den generiska sidintroduktionen. Behåll det valda programmets korta sammanfattning, stegtext och säkerhetsråd. |
| Valpprogression | Mallens introduktion visas både i översikt och detalj | Visa en kort sammanfattning i översikten och full mallförklaring en gång, eventuellt bakom `(i)`. Behåll instruktioner som styr ett konkret val. |
| Hundprofil / ändra hund | Introduktioner om att uppgifterna används för relevant innehåll | Ta bort eller flytta bakom `(i)`; formuläret har redan etiketter och fält. |
| Konto | `Se information om betan eller hantera ditt konto.` | Ta bort den generiska sidintroduktionen. Låt knapptexterna bära navigationen. |
| Mer | `Hantera din hund och appinställningar.` | Ta bort den redundanta sidintroduktionen; behåll menyernas egna korta etiketter och beskrivningar. |

## Behåll synligt

- Samtycke, integritet, datalagring och vad som delas; de påverkar användarens beslut.
- Felmeddelanden, sparstatus, återförsök, validering och nästa steg.
- Varnings-/säkerhetsråd där användaren utför åtgärden.
- Tydliga planer/statusar, exempelvis att en vaccination bara är planerad och inte genomförd.
- Kortinnehåll som hjälper användaren välja en artikel eller ett träningsprogram.
- Beskrivningen av vilken hunddata ett export-/delningsflöde inkluderar.

Detta dokument föreslår en fokuserad copy-uppföljning. Det ändrar inte de nämnda skärmarna; varje flytt behöver kontrolleras med skärmens befintliga informationsdialog och tillgängliga namn.

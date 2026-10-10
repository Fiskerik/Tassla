# UX-06 visuell QA-checklista

Datum: 2026-10-09
Berörda vyer: Hundprofil, Logga
Resultat: NOT TESTABLE – ingen native/renderad skärmbild kunde tas i miljön.

## 18-punktschecklista enligt `docs/design-rules.md`

| Punkt | Bedömning | Underlag/kommentar |
|---|---|---|
| 1. Max en primary | Ja, statisk kontroll | Kennelredigering använder secondary; befintlig profilspara är fortsatt enda primary. |
| 2. Knappar i grupp lika | NOT TESTABLE | Kräver renderad vy. |
| 3. Radera skiljer sig/bekräftelse | Ej tillämplig | Ta bort kennelkoppling är en reversibel, separat secondary-åtgärd. |
| 4. Inga stora Ändra/Radera-länkar | Ja, statisk kontroll | Inga nya stora textlänkar. |
| 5. Spacing/token-skala | Ja, statisk kontroll | Logghöjd, färger, spacing och tryckytor går via tokens. |
| 6. Inga hårdkodade färger/px | Ja, statisk kontroll | Nya komponentvärden använder tokens. |
| 7. En ikonuppsättning/inga emojis | Ja, statisk kontroll | IconChip/Ionicons används. |
| 8. Kategorifärger konsekventa | Ja, statisk kontroll | Olycka/Vatten ligger i centrala categoryColors. |
| 9. Ikoner begripliga | NOT TESTABLE | Kräver screenshot på liten/stor skärm. |
| 10. Inga normalstatusetiketter | Ja, statisk kontroll | Inga tekniska statusetiketter läggs till. |
| 11. Högst en informationsruta | NOT TESTABLE | Flera fel-/hjälptillstånd finns men måste bedömas i rendering. |
| 12. Inga förbjudna ord | Ja, statisk copykontroll | Copy är vardaglig; OAuth-förklaringen ligger i utvecklardokumentation. |
| 13. Förklarande text max två rader | NOT TESTABLE | Kräver stor text och faktisk bredd. |
| 14. Laddar/tom/fel/normal | Ja, statisk kontroll | Attribution har loading/error/ready/retry; logg återanvänder befintliga states. |
| 15. Tryckyta/stor text | NOT TESTABLE | Native accessibility behöver telefonprov. |
| 16. Matchar målbild/avvikelser | NOT TESTABLE | Kompakt logg och enkel layouteditor är statiskt implementerade. |
| 17. Appbar/flikar/bottenmeny | Ej tillämplig | Ändringen påverkar inte appens navigation. |
| 18. Foto/hundnamn | Ej tillämplig | Ändringen påverkar inte HeroCard. |

## Manuell QA när renderingsmiljö finns

- Skapa profil utan kennelkod och kontrollera att `Fortsätt` fungerar samt att `Kontrollera om profilen finns` inte visar ett attributionfel.
- Öppna Hundprofil, koppla en giltig kod, ta bort kopplingen och kontrollera retry/ogiltig kod.
- Kontrollera att standardytan visar fyra kompakta knappar och att Olycka/Vatten kan flyttas till/från Mer med håll-in.
- Kontrollera tidigare Vaken-poster och att nya snabbval inte visar Vaken.
- Kontrollera reducerad rörelse och stor text. Fånga skärmbilder för onboarding, Hundprofil, standardlogg, Mer och layouteditor.

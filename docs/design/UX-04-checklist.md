# UX-04 visuell QA-checklista

Datum: 2026-10-09  
Berörda vyer: Hem, Tassla-pass, gemensamma hundkort och Hem-carousel  
Målbild: `vision_rev01.jpg`, övre delen MVP – 6 skärmar

## Evidens

Renderad ny skärmdump kunde inte tas i denna miljö. `tools/visual-check` kräver separata React Native Web-verktyg som inte finns lokalt; installation skulle kräva nätverksåtkomst och ytterligare verktyg. Befintliga bilder i `docs/design/UI-RESET/` är äldre baseline och används inte som bevis för denna ändring.

Resultat: NOT TESTABLE – visuell QA får inte räknas som godkänd.

## Checklista enligt docs/design-rules.md avsnitt 14

| Punkt | Bedömning | Underlag/kommentar |
|---|---|---|
| 1. Max en primary | NOT TESTABLE | Kräver renderad Hem- och passvy. |
| 2. Knappar i grupp lika | NOT TESTABLE | Kräver renderad vy. |
| 3. Radera skiljer sig/bekräftelse | Ej tillämplig för carousel | Inga radera-kontroller ändras. |
| 4. Inga stora Ändra/Radera-länkar | Ej tillämplig för carousel | Carouselkort har en navigationshandling vardera. |
| 5. Spacing/token-skala | Ja, statisk kodkontroll | Nya avstånd använder tokens; slutlig rendering saknas. |
| 6. Inga hårdkodade färger/px | Ja, statisk kodkontroll | Nya UI-värden använder tokens eller dynamisk bredd. |
| 7. En ikonuppsättning/inga emojis | Ja, statisk kodkontroll | `IconChip` och Ionicons används. |
| 8. Kategorifärger konsekventa | Ja, statisk kodkontroll | Kategorier går genom `IconChip`. |
| 9. Ikoner begripliga | NOT TESTABLE | Kräver visuell granskning. |
| 10. Inga normalstatusetiketter | Ja, statisk kodkontroll | Inga statusbadges läggs till. |
| 11. Högst en informationsruta | Ej tillämplig för carousel | Ingen informationsruta läggs till. |
| 12. Inga förbjudna ord | Ja, statisk copykontroll | Nya texter är vardagliga och svenska. |
| 13. Förklarande text max två rader | NOT TESTABLE | Ingen rendering med större text. Texten får inte klippas. |
| 14. Laddar/tom/fel/normal | Ja, statiskt | Befintliga Home-/content-/planstates återanvänds; renderad kontroll saknas. |
| 15. Tryckyta/stor text | NOT TESTABLE | Native/Web-rendering saknas. |
| 16. Matchar målbild/avvikelser | NOT TESTABLE | Carouselen är ett tillägg under befintligt hund-/profilkort; HeroCard finns inte på Hem i nuvarande kod. |
| 17. Appbar/flikar/bottenmeny | NOT TESTABLE | Befintlig struktur återanvänds; rendering saknas. |
| 18. Foto/hundnamn | NOT TESTABLE | Kräver renderad jämförelse. |

Avvikelse: användarens formulering säger ”under HeroCard”, men Hem använder i nuvarande kod `DogCard`; `HeroCard` används på Träning/Kunskap enligt designreglerna. Carouselen placeras direkt under Hems befintliga hund-/profilkort för att inte skapa dubbla hero-kort.

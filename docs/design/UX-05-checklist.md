# UX-05 visuell QA-checklista

Datum: 2026-10-09  
Berörd vy: Hem  
Målbild: personlig, kompakt BabyJourney-lik startyta med befintliga Tassla-komponenter

## Evidens

Ingen ny renderad skärmdump kunde tas i miljön. Preview-site saknas och visual-checkens Chromium-körning avslutas med SIGTRAP. Äldre bilder i `docs/design/UI-RESET/` är baseline och räknas inte som evidens för denna ändring.

Resultat: NOT TESTABLE – fysisk/renderad QA återstår.

## 18-punktschecklista enligt `docs/design-rules.md`

| Punkt | Bedömning | Underlag/kommentar |
|---|---|---|
| 1. Max en primary | NOT TESTABLE | Hem har HeroCard och carouselkort; kräver rendering. |
| 2. Knappar i grupp lika | NOT TESTABLE | Kräver renderad vy. |
| 3. Radera skiljer sig/bekräftelse | Ej tillämplig | Ingen radering ändras. |
| 4. Inga stora Ändra/Radera-länkar | Ja, statisk kontroll | Inga sådana länkar i nya ytan. |
| 5. Spacing/token-skala | Ja, statisk kontroll | Nya värden använder befintliga tokens. |
| 6. Inga hårdkodade färger/px | Ja, statisk kontroll | Carousel/Home använder tokens och dynamisk bredd. |
| 7. En ikonuppsättning/inga emojis | Ja, statisk kontroll | `IconChip`/Ionicons används. |
| 8. Kategorifärger konsekventa | Ja, statisk kontroll | Kortens kategorier går via `IconChip`. |
| 9. Ikoner begripliga | NOT TESTABLE | Kräver visuell granskning. |
| 10. Inga normalstatusetiketter | Ja, statisk kontroll | Inga tekniska statusbadges läggs till. |
| 11. Högst en informationsruta | Ej tillämplig | Ingen informationsruta läggs till. |
| 12. Inga förbjudna ord | Ja, statisk copykontroll | Copy är vardaglig och handlingsorienterad. |
| 13. Förklarande text max två rader | NOT TESTABLE | Kräver stor text/renderad kontroll. |
| 14. Laddar/tom/fel/normal | Ja, statisk kontroll | Befintliga content-, logg- och planstates återanvänds. |
| 15. Tryckyta/stor text | NOT TESTABLE | Native/renderad kontroll saknas. |
| 16. Matchar målbild/avvikelser | NOT TESTABLE | HeroCard och carousel ligger i avsedd ordning; kräver screenshot. |
| 17. Appbar/flikar/bottenmeny | NOT TESTABLE | Befintlig AppBar/BottomNav bevaras; kräver screenshot. |
| 18. Foto/hundnamn | NOT TESTABLE | HeroCard använder befintlig hundbild och profilnamn; kräver screenshot. |

## Manuell QA när renderingsmiljö finns

- Kontrollera liten och stor bredd: HeroCard först, carousel direkt därefter, ingen horisontell layoutkollaps.
- Kontrollera 0–11 mån, 1 år 0 mån och 1 år 3 mån i HeroCard/carousel.
- Kontrollera reducerad rörelse: ingen snap/shift/scale som stör; tappning fungerar.
- Kontrollera kortens navigation och att BottomNav fortsatt visar aktuell yta.

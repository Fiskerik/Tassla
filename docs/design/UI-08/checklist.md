# UI-08 visuell QA

Datum: 2026-10-10  
Status: **NOT TESTABLE — inga nya skärmbilder kunde skapas**

## Skärmbilder

| Vy | 360 px | 430 px | 140 % text |
|---|---|---|---|
| Hem | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| Kunskap | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| Mer / footer | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| Träning / footer | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |
| Toast: Sparat / Kunde inte spara | NOT TESTABLE | NOT TESTABLE | NOT TESTABLE |

Försök att starta den befintliga RN Web-harnessen stoppades när sandboxen nekade localhost-bindning. Chromium avslutades också med `setsockopt: Operation not permitted`. Ingen renderad bild finns att jämföra med UI-07:s målbild. Därför markeras checklistan som NOT TESTABLE och ingen visuell PASS rapporteras.

## Checklista enligt `docs/design-rules.md` avsnitt 14

Alla punkter nedan kräver bildbaserad granskning, så ingen får ett Ja/Nej utan skärmbilder.

| # | Kontroll | Resultat |
|---:|---|---|
| 1 | Finns max en `primary`-knapp i vyn? | NOT TESTABLE |
| 2 | Är knappar i samma grupp lika höga och likadant stylade? | NOT TESTABLE |
| 3 | Skiljer sig Radera tydligt från Ändra, med bekräftelse eller ångra? | NOT TESTABLE |
| 4 | Saknas stora Ändra/Radera-länkar på varje listrad? | NOT TESTABLE |
| 5 | Följer avstånden spacingskalan och har sektionsrubriker jämn ovanmarginal? | NOT TESTABLE |
| 6 | Saknas hårdkodade färger eller px-värden i diffen? | NOT TESTABLE visuellt; källreview såg inga nya hårdkodade mått eller färger |
| 7 | Kommer ikoner från samma uppsättning, utan emoji? | NOT TESTABLE |
| 8 | Har kategorier rätt färg och samma ikon överallt? | NOT TESTABLE |
| 9 | Är ikoner begripliga utan förklaring? | NOT TESTABLE |
| 10 | Saknas statusetiketter på normala poster? | NOT TESTABLE |
| 11 | Finns högst en informationsruta som kräver handling? | NOT TESTABLE |
| 12 | Saknar texten förbjudna ord? | NOT TESTABLE |
| 13 | Är förklarande text högst två rader och i rätt ton? | NOT TESTABLE |
| 14 | Finns laddar-, tom-, fel- och normalläge? | NOT TESTABLE |
| 15 | Är tryckytor minst 44×44 pt och fungerar layout med stor text? | NOT TESTABLE |
| 16 | Matchar vyn målbilden, med avvikelser dokumenterade? | NOT TESTABLE |
| 17 | Har vyn appbar, flikar och bottenmeny enligt målbilden? | NOT TESTABLE |
| 18 | Används foto och hundens namn där målbilden gör det? | NOT TESTABLE |

## Käll- och buildkontroller (inte visuell QA)

- Figma Toast-huvudkomponenten `12:220` i filen `2UI5GtK3JjZH3ncCS9M35c` hade redan 1 px färgade ramar för success/error/övriga toner. Figma har inte ändrats.
- UI-källgranskning: PASS, inga konkreta fel rapporterade av oberoende reviewer.
- `pnpm typecheck`, `pnpm typecheck:edge-account`, `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`, `git diff --check`, `python tools/dev_flow.py validate`: PASS.
- `pnpm lint`: 0 fel, 33 varningar.
- `tests/log-screen-policy.test.mjs`: PASS.
- `pnpm check`: notifieringstestet `tests/notifications.test.mjs` fallerar i miljöns `spawnSync`-deltest (tom JSON-output). Den UI-relevanta policytestsviten passerar; detta behöver separat uppföljning.

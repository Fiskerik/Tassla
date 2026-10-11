# QA-11 – visuell QA

Datum: 2026-10-11
Spec: QA-11 v3.2
Status: Genomförd lokal QA – GODKÄND efter v3.2-korrigering.
Baseline: `vision_rev01.jpg`; referensbilderna för QA-11 i chatten saknas som lokala filer. Avvikelser från textbesluten i specen dokumenteras separat.

## Körning och evidens

- Lokal RN Web-rendering av produktionskomponenter med syntetiska fixturedata.
- Viewports: 375 px och 430 px; textstorleksprov: 140 %.
- Körkommandon och begränsningar: `tools/visual-check/README.md`.
- Skärmbilder/resultat: `docs/design/QA-11/evidence/`.
- Native, VoiceOver, fysisk enhet, backend och verkliga data: **NOT TESTABLE** i denna harness.
- Jämförelse med chattens fem mobilbilder: **NOT TESTABLE** eftersom bildfilerna inte finns i workspace.

## Checklista (design-rules avsnitt 14)

Varje punkt ska fyllas med Ja/Nej/NOT TESTABLE och evidens före slutresultat. Ett Nej underkänner visuell QA.

| # | Kontroll | Resultat | Evidens / notering |
|---|---|---|---|
| 1 | Högst en primary-knapp per vy. | Ja | Planerad hälsohändelse har en primary: Spara plan. Se `evidence/planned-health-375.png`. |
| 2 | Knappar i samma grupp har samma höjd och stil. | Ja | Samma gruppknappar i snabb loggning och planform har enhetlig komponentstil. Se `evidence/log-375.png` och `evidence/planned-health-375.png`. |
| 3 | Radera skiljer sig från Ändra och har bekräftelse eller fungerande ångra. | Ja* | Harnessen verifierar att Ta bort öppnar en uttrycklig bekräftelse, Avbryt bevarar posten och bekräftat Ta bort anropar delete-callback. Delete-alternativet är märkt destructive. Native Alert-utseendet och VoiceOver är NOT TESTABLE. Se `evidence/browser-results.json`. |
| 4 | Inga stora Ändra/Radera-textlänkar på varje listrad. | Ja | Varje planrad har ersatts med en 44×44 ellipsknapp. RN Web-testet verifierar måttet och action-label. Se `evidence/planned-health-375.png` och `evidence/browser-results.json`. |
| 5 | Avstånd följer spacingskalan; sektionsrubriker har jämn ovanmarginal. | Ja | Skärmbilderna visar jämna sektionsmarginaler och luft mellan toast och innehåll. Token-diff för Toast använder spacing-token. |
| 6 | Inga otillåtna hårdkodade färger eller px-värden i UI-diffen. | Ja | Sökning i QA-11 UI-diff fann inga tillagda `#hex`-färger eller `px`-värden. |
| 7 | Ikoner kommer från samma uppsättning; inga emoji. | Ja | Renderade Logg-, Träning-, Hälsa- och planvyer använder projektets Ionicons; inga emoji syns. |
| 8 | Kategorifärger och ikoner är avsedda och konsekventa. | Ja | Vaccination och veterinärbesök skiljs med samma chips/färger i Hälsa och sparade planer. |
| 9 | Ikoner går att förstå utan förklaring. | Ja | Kategoriikonernas etiketter ligger i samma rad. |
| 10 | Normala poster saknar statusetiketter. | Ja | `Påminnelse av` visas inte på planer utan vald påminnelsetid. Vald legacy-påminnelsetid behåller etiketten `Påminnelse HH:mm`. Se `evidence/planned-health-time-saved-375.png`. |
| 11 | Högst en informationsruta, och den kräver handling. | Ja | Planvyn har en informationslänk som öppnar detaljer på begäran; inga extra banners. |
| 12 | Copy saknar förbjudna ord. | Ja | Synlig copy i de granskade QA-11-vyerna matchar UX-reglerna; ingen copy som anges som förbjuden i specen hittades. |
| 13 | Förklaringar är högst två rader och följer målbildens ton. | Ja | Hero-copy är nu kortad och ryms på två rader vid 375 px. Se `evidence/planned-health-375.png`. |
| 14 | Laddar, tomt, fel och normalt tillstånd har design. | Ja | Harness fångar tomt/laddar/fel för Hem, Logg, Hälsa och Kunskap; planvyn visar normal och tom lista i implementationen. Native återhämtning testas inte. |
| 15 | Tryckytor är minst 44×44 pt och layouten fungerar vid stor text. | NOT TESTABLE | 140 % React Native Web-layout hade ingen horisontell overflow. Detta är inte Dynamic Type eller native touch-target-verifiering. |
| 16 | Layout, komponenter och innehåll matchar målbilden eller godkända avvikelser. | Ja | `vision_rev01.jpg` granskades bredvid Hem, Logg, Träning, Hälsa, Kunskap och Tassla-pass vid 375/430 px. Planvyn är en godkänd QA-11-utökning enligt v3.2. De fem separata chattbilderna saknas lokalt; de kunde inte användas för direkt jämförelse. |
| 17 | Appbar, flikar och bottenmeny följer målbilden på berörda skärmar. | Ja | AppBar Back syns på planvyn och bottenmenyn ligger kvar; se `evidence/planned-health-375.png`. Artikelläsarens retur testades. |
| 18 | Foto och hundnamn visas där målbilden gör det. | Ja | Hem visar det riktiga hundnamnet Luna. Profilbilden är Tasslas vänliga hundsilhuett-platshållare eftersom den syntetiska OwnedDog-fixturen saknar hundfoto, vilket tillåts i design-rules §2. Carousel-kortet visar en hundbild för innehållet. Se `evidence/home-375.png`. |

## QA-11-interaktioner som ska fångas

- Tidsväljare: öppna, ändra draft, avbryt med X/system-back, bekräfta tid; bekräftad tid hamnar i formuläret utan att visa sparad-feedback.
- Planvy: tid syns för planerad händelse även med notiser av; spara och redigera visar tid. Planerade och genomförda tider är separata.
- Hem och Hälsa: due_time visas; retry för historikfel återhämtar utan att maskera vanliga händelser.
- Toast: success/error/undo och gemensamt vertikalt avstånd; dold toast lämnar inte tom yta.
- Back: samma chevron/appbar på berörda undersidor, ingen dubblerad bakåtknapp.
- Maskot: frånvarande på Logga och Träning.

## Slutresultat

Resultat: **GODKÄND för lokal visuell QA**
Underkända punkter: inga.
Begränsningar: native Alert-rendering, VoiceOver, faktisk Dynamic Type, live-data/RLS och direkt jämförelse med de fem chattbilderna är NOT TESTABLE i lokal harness. Checklistpunkt 3 verifierar Alert-callbacks med en testshim, inte det native menyutseendet.

## Körresultat

- `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools node tools/visual-check/build.cjs`: PASS.
- `python tools/visual-check/verify.py`: PASS, 23 layout-/interaktionskontroller; 0 sidfel. Resultat i `evidence/browser-results.json`.
- `pnpm check`: PASS (typkontroll, edge-typkontroll, lint och 31 testfiler). Lint rapporterar 39 varningar, 0 fel.
- Tidspicker draft/avbryt/bekräfta/spara: PASS. Bekräfta-knappens ruta ligger helt inom 375×844-vyn; se `evidence/time-picker-modal-375.png` och `evidence/planned-health-time-saved-375.png`.
- Menyval Ändra, Avbryt, Ta bort samt raderingsbekräftelse/avbryt: PASS via RN Alert-callback-shim. Se `evidence/browser-results.json` och `evidence/planned-health-delete-confirmed-375.png`.
- Home-historikfel och återförsök medan planerade poster ligger kvar: PASS; se `evidence/home-history-retry.png`.

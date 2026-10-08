# Release-log – FIGMA-DS-02

Datum: 2026-10-08. Paket-ID: FIGMA-DS-02.
Status: **BLOCKERAD före Figma-implementation; lokalt dokumentcheckpoint**.
Jämförelsebas: repository-HEAD vid start `3eb9618030b46d5b1709418800e37f63976188b9`; Figma-version okänd. Ingen GitHub Release används som bas.
Leveranscommit: ingen skapad. Push/publicering: inte utfört.
TestFlight-version/build: ej tillämpligt, endast Figma/designunderlag.
Plan: [FIGMA-DS-02 v1](../plans/FIGMA-DS-02.md).

## Major changes

Inga implementerade användarflöden eller Figma-komponenter i detta paket. Planerat: befintligt komponentbibliotek rättas, saknade komponenter kompletteras, Foundations/Review byggs och Sandbox-test skapas enligt planens steg 1–7.

## Minor changes

Lokalt sparat: plan v1/checkpoint, taskkontrakt, RULES_PROPOSAL och kontrastunderlag för 15 dokumenterade färgpar. Det är dokumentförberedelse, inte implementerade Figma-ändringar. Primärfärg #186A4D matchar INVENTORY och DS-01; ingen färgändring utförd.

Separat QA-utlåtande sparat i [FIGMA-DS-02-QA](../design/FIGMA-DS-02-QA.md): samtliga Figma-krav 1–7 och visuella checklistpunkter 1–18 är NOT TESTABLE. Tre förbättringsförslag är dokumenterade; reproducerbart kontrastkommando och evidensregister har lagts till, faktisk Figma-evidens återstår. Det är ingen visuell sign-off eller färdig QA-omgång.

## Bug-fixes

Inga. DS-01:s dokumenterade Tabs-klippning, Toast-copy/tryckyta, Walk-ikon och Review-överflöde ska rättas i DS-02; de är inte rättade eller återverifierade här.

## Verifiering och kända begränsningar

Underlag läst och befintlig MVP-målbild visuellt inspekterad. Dokumenterade opaka tokenpar beräknade med WCAG:s relativa luminans: textPrimary/background 12,45:1; textSecondary/background 5,75:1; onPrimary/primary 6,55:1; danger/dangerSurface 6,15:1; success/successSurface 5,78:1; kategorier 4,97–6,15:1. Alla 15 dokumenterade par når 4,5:1. Detta verifierar inte Figma-bindningar eller aktuell fil.

Ljusa kontrollkanter klarar inte 3:1 om de ensamma identifierar kontroller. Förslag om controlBorder och granskning av gradient/opacitet är sparat men inte implementerat. Renderad Figma-QA, stor text, 360/430/390-layout och slutlig audit är NOT TESTABLE utan Figma-MCP/evidens.

Blockerare: sessionen saknar Figma-MCP och verktygssökning. Inga Figma-läs-/skrivanrop utförda. Tidigare Starter-gräns i DS-01 är historik; ingen aktuell kvotstatus verifierad. Inget kringgående, ingen webbläsarreservväg och inga inloggningsuppgifter efterfrågade.

Lokal repositorykontroll: `pnpm check` exit 0, 356 tester varav 355 pass och 1 skip, inga testfel; befintliga lint-/Node-varningar. Miljöns pnpm-wrapper installerade befintliga låsta dependencies inför check; inga dependencies eller låsfil ändrades. `git diff --check` samt nya dokuments lokala länkar, radslut och whitespace kontrollerade. Dessa kontroller bevisar inte Figma-layout, nativebeteende eller ångra/retry-funktion.

Beställda docs/DESIGN_RULES.md, docs/design/malbild.png och docs/plans/FIGMA-DS-01.md saknas. Befintliga design-rules.md, vision_rev01.jpg och docs/tasks/dev/figma-design-system-01.md används enligt planens dokumenterade avvikelse. Alla antaganden/återstående steg finns i planen. Bindande policy och appkod är oförändrade.

## Nästa sprint/paket

Fortsätt samma FIGMA-DS-02-paket från steg 1 när Figma-MCP med läs-/skrivstöd finns för målfilen. Minimal ID-hämtning, en samlad skrivning per familj; börja med AppBar/Tabs. Efter komponenter: Foundations, instansbaserad Review och märkt Sandbox, en slutlig audit, separat QA och högst två korrigeringar. Spara faktiska nodlänkar och nästa checkpoint. Ingen produktionsskärm, appimplementation eller publicering ingår.

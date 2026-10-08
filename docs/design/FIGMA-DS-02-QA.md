# FIGMA-DS-02 – separat QA av dokumentcheckpoint

Datum: 2026-10-08. Granskare: separat read-only QA-agent `qa_figma_ds_02`, gpt-6-luna medium enligt projektets QA-roll. Huvudsessionen sparar utlåtandet. Detta är **underlagsgranskning**, inte den beställda renderade slutgranskningen i steg 8.

Bedömning: checkpointen skiljer planerat arbete från utförd dokumentförberedelse och redovisar blockeraren sanningsenligt. Planens krav 1–7 är specificerade, men inga Figma-noder/renderingar är tillgängliga. Därför ges ingen visuell sign-off.

| Krav | Hur verifierat i underlaget | Figma-resultat |
|---|---|---|
| 1. Bredd/layout | Auto layout/fill, AppBar/Tabs/ListRow och 360/430 specificerade | NOT TESTABLE |
| 2. Komponentfel/typografi | Varianter, mått, Hero/Progress och tillstånd specificerade | NOT TESTABLE |
| 3. Ikoner | Kategori- och navmappning specificerad | NOT TESTABLE |
| 4. Saknade komponenter | Komponenter, varianter, properties och svenska texter specificerade | NOT TESTABLE |
| 5. Foundations | Innehåll och kontrastgränser specificerade; opaka tokenpar omräknade oberoende | NOT TESTABLE |
| 6. Review | Instans-/copy-/nodlänkskrav specificerade | NOT TESTABLE |
| 7. Sandbox | 390-bred TEST-yta specificerad | NOT TESTABLE |

## Designregler §14

Samtliga punkter nedan saknar renderad evidens. N/A kan motiveras för rena biblioteksvarianter när slutgranskningen görs; Sandbox och sammansatta exempel ska bedömas separat.

| Punkt | Kriterium | Resultat |
|---|---|---|
| 1 | Max en primary per sammansatt vy | NOT TESTABLE |
| 2 | Enhetliga knappar i samma grupp | NOT TESTABLE |
| 3 | Tydlig destructive och bekräftelse/ångra | NOT TESTABLE |
| 4 | Inga stora Ändra/Radera-länkar per rad | NOT TESTABLE |
| 5 | Spacingskala och sektionsmarginaler | NOT TESTABLE |
| 6 | Variabelbindningar, inga lokala stylingvärden | NOT TESTABLE |
| 7 | En ikonuppsättning, ingen emoji | NOT TESTABLE |
| 8 | Konsekvent kategoriikon/färg | NOT TESTABLE |
| 9 | Begripliga ikoner | NOT TESTABLE |
| 10 | Ingen statusbadge på normal post | NOT TESTABLE |
| 11 | Högst en nödvändig informationsruta | NOT TESTABLE |
| 12 | Inga förbjudna ord i copy | NOT TESTABLE |
| 13 | Kort förklarande copy och rätt ton | NOT TESTABLE |
| 14 | Laddar/tom/fel/normal | NOT TESTABLE |
| 15 | Minst 44×44 och stor text | NOT TESTABLE |
| 16 | Målbildens struktur och motiverade avvikelser | NOT TESTABLE |
| 17 | Rätt appbar/flikar/navigation | NOT TESTABLE |
| 18 | Foto/platshållare och hundnamn där tillämpligt | NOT TESTABLE |

Oberoende WCAG-beräkning matchar samtliga avrundade kontrastvärden i bilagan: 15/15 dokumenterade opaka par når 4,5:1; lägst 4,967913:1. Det bevisar inte Figma-bindningar, gradientkontrast eller kontrollkanter. Border 1,21–1,36:1 och dangerBorder 1,84:1 räcker inte som ensam kontrollsignal. Tokenförslag för kontrollkant och scrim är inte implementerade.

## Minst tre förbättringsförslag

1. Dokumentera faktiska node-id:n, ändrade properties/variabler och status per komponentfamilj efter varje batch. **Återstår tills Figma nås.**
2. Koppla krav 1–7 och §14 till namngivna skärmdumpar 360/430, stor text och Sandbox 390; motivera varje N/A. **Evidensregister förberett i planen; faktisk evidens saknas.**
3. Spara reproducerbart kontrastkommando och fortsätt med verkliga kontrollkanter, disabled/fokus och gradient efter färgblandning. **Kommandot tillagt i kontrastbilagan efter QA; renderingsdelen återstår.**

Tabs-klippning vid 360, textöverlapp vid stor text och svag kontrast längs Hero-gradienten är möjliga renderingsrisker, inte observerade DS-02-fel. DS-01:s dokumenterade fynd måste återverifieras efter korrigering; deras historik ger inte en aktuell bild av filen.

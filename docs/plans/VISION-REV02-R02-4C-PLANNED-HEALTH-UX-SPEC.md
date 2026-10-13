# UX-spec — rev02 R02-4C: Planerad hälsa

Datum: 2026-10-13 · Version: 1 · Status: implementing · Ägardirektiv: fortsätt med återstående skärmar.

## Användaruppgift

Ägaren ska kunna lägga till och hålla ordning på sina egna planerade vaccinationer och veterinärbesök, inklusive frivillig lokal påminnelse. Vyn ska tydligt visa att en plan inte betyder att händelsen är genomförd.

## Avgränsning och skyddade beteenden

Endast presentationen i `PlannedHealthScreen`. Behåll befintlig data source, rutt, formulärfält, datum-/tidsregler, lokala påminnelseval, bekräftelse, retry, unknown/pending/conflict, passtid, radering och bekräftelse. Ingen automatisk överföring till hälsans historik, medicinsk vägledning, schemaläggning eller notisleverans införs.

## Visuell riktning

- Vänsterställd rubrik och begriplig tillbakaåtgärd till Hälsa.
- Varm canvas och ljusa kort; kalender-/planmarkering använder bärnstensaccent för att skilja framtida/planerad status från befintlig blå/röd utförd-historik.
- Befintlig typikon/etikett anger vaccination eller veterinärbesök; synlig text anger `Planerad`, `Idag`, `Kommande` eller `Passerat datum`.
- Formuläret samlas som en tydlig yta; sparstatus, konflikt och fel ligger före formuläret/åtgärden de gäller.
- Tomlägets generiska vilobild behålls som redaktionell dekoration; den utger sig inte för att vara användarens hund.

## Filer och render

- `src/features/health/PlannedHealthScreen.tsx`
- `src/theme/tokens.ts` (endast opt-in `support.plannedHealth` accent)
- `src/features/health/README.md`, `tools/visual-check/app.tsx`
- Denna spec, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4c/`.

Rendera 375×844, 430×844, 375×667 och 140 % browserzoom; tom, fylld med passerad/idag/kommande plan, laddar/fel, formulär, pending/conflict där harnessen kan visa dem. Ingen native/database-/notisruntime-certifiering påstås.

## §14 jämförelse

Ingen specifik planerad-hälsa-panel finns i `vision_rev02.jpg`. Jämför mot närmaste rev02-kort-, ikon-, kategori- och tomlägesmönster. Markera punkt 16 Nej för exakt panelmatch och redovisa varje dimension, även om interaktionen fungerar.

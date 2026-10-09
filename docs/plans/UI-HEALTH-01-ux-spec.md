# UI-HEALTH-01 – UX-plan för Hälsa

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål

Hälsa ska ge en lugn översikt över ägarregistrerad vikt och utförd hälsohistorik. Ärlighetsinformationen visas som kort caption, inte som banner/kort. Befintlig save-, sync-, konflikt- och delete-logik ska vara oförändrad.

## Flöde och presentation

- Hälsa är tab-root med AppBar Title `Hälsa`; ingen egen Back-knapp.
- Viktsektionen visar en kort caption: uppgifterna är ägarregistrerade och inte en verifierad journal; Tassla tolkar inte viktförändringar.
- `Planerade hälsohändelser` blir en ListRow med IconChip och chevron som öppnar befintlig route.
- `Lägg till` öppnar en BottomSheet för viktregistrering. Sheet använder design-systemets fält: datum med svensk visning/native kalenderbeteende och nummerfält för kg. Den enda primära åtgärden i sheet är `Spara`.
- Historikposter visas som ListRow med IconChip, datum/anteckning och ActionMenu för Ändra/Radera. `Ägarregistrerad` visas högst som en gemensam caption, aldrig som badge per rad.
- Historikens befintliga add/edit-flöde behålls funktionellt men flyttas till ett sekundärt sheet/underflöde så att två primära knappar inte visas samtidigt.
- `Läs information` behåller befintlig InfoModal.

## Tillstånd

- Loading: Skeleton för vikt och historik.
- Empty: EmptyState för tom viktlista och tom historik utan exempeldata.
- Error: högst en InfoBanner/notice åt gången med relevant återförsök; konflikt/pending visas bara när det faktiskt kräver handling.
- Normal: Dog-/viktdata, ListRows och caption; inga generella förklaringskort eller normala statusetiketter.

## Beteende och tillgänglighet

- Befintliga callbacks och muteringshanterare används oförändrade: saved/failed/unsure, konfliktlösning, delete-confirmation och inputvalidering.
- Alla rader, menyer och sheet-kontroller har minst 44 pt tryckyta och fungerar med stor text.
- InfoModal för `Läs information` behålls.
- Inga nya dependencies, datafrågor, schemaändringar eller innehållsändringar.

## Avgränsade filer

Ändras endast:

- `src/features/health/HealthScreen.tsx` – Hälsa-layout, vikt-sheet och states.
- `src/features/health/HealthHistoryScreen.tsx` – historikens design-systemlayout och action menu.
- `src/features/health/health-date-field.tsx` – endast om en screen-specifik datumfält-wrapper krävs för sheetens svenska/native datumflöde.
- `tests/health-screen-policy.test.mjs` – UI-kontrakt och state/primitive-regler.
- `tests/health-history.test.mjs` – endast gamla strukturassertions som behöver uppdateras.
- `docs/design-rules.md` – section 14 för UI-HEALTH-01.
- `docs/plans/UI-HEALTH-01-ux-spec.md` – denna godkännandeplan.

Skyddat: `ProductWorkspace`-data/sync/save-logik, workspace-data, navigation, globala UI-komponenter/tokens och andra skärmar.

## QA

Kör typecheck, lint och relevanta tester. Rendering är NOT TESTABLE lokalt; Erik tar `Hälsa normal`, `Hälsa tom`, `Hälsa error` och `Hälsa stor text`.

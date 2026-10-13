# VISION-R02-GESTURES — korrigeringsplan v6

Datum: 2026-10-13 · Status: Architect APPROVE; Critic-review återstår före kodändring.

## Mandat och mål

Ägarens ursprungliga mandat gäller fortsatt: veckoremsan ska gå att bläddra åt höger och vänster, och sidgest ska byta huvudflik. v5 implementerades och granskades oberoende. QA fann att kunskapsartiklar och checklistdetaljer fortfarande tillåter sidbyte. Den här korrigeringen täpper till den detaljroute som v5 missade; den ändrar inte innehåll eller data.

UX-kontrakt: `docs/plans/VISION-REV02-GESTURES-UX-SPEC-v6.md`.

## Integrerad leverans

- **Ägare:** Implementer för den smala routespärren; QA verifierar faktisk route-logik och Reviewer granskar diffen.
- **Beroenden:** v5-koden och oberoende QA-fyndet i `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v5.md`.
- **Skrivfiler:** `src/features/home/ProductWorkspace.tsx`, `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/home/README.md`, `tools/visual-check/app.tsx`, denna plan, UX-specen och QA-evidens. Befintlig `MainSwipeNavigation`/`HorizontalGestureRegion` återanvänds.
- **Skyddat:** veckolistan och dess gränser, innehålls-/checklistdata, affärslogik, routes utanför Kunskap, tabbordning, schema, nätverk och övriga R02-4-ändringar.

## Korrigeringskontrakt

1. `KnowledgeScreen` rapporterar ett booleskt detaljtillstånd till `ProductWorkspace` när en kunskapsartikel eller checklistmall visas; det återställs när användaren lämnar detaljen.
2. `ProductWorkspace` inaktiverar huvudsidgesten när `page === 'knowledge'` och kunskapsdetaljen är öppen. Tillbaka-/bottennavigation ska fortsatt fungera.
3. Kunskapsöversikten och FAQ:s inline-expansion behåller huvudsidgesten; FAQ-svar är inte egna routes. Veckoremsa, tabs och Loggs anteckningsfält behåller sina befintliga exkluderingar.
4. Bytet till/från detaljläge får inte skriva data eller ändra aktiv destination. Stale detaljtillstånd får inte återaktivera fel detalj när användaren återvänder till Kunskap.

## Acceptans

- Öppnad artikel och öppnad checklistmall blockerar vänster-/högersvep till huvudflik; användarens befintliga Tillbaka-handling lämnar detaljen.
- Efter återgång till kunskapsöversikten fungerar vänster-/högersvep igen.
- FAQ:s expanderade svar, översiktsflikarna och övriga befintliga huvudflikar behåller definierat beteende.
- Veckoremsans implementation, gränser och dimningsgeometri ändras inte.
- `pnpm typecheck`, riktad ESLint för ändrade TS/TSX-filer, `git diff --check`, `python3 tools/dev_flow.py validate` och public/review visual-check builds körs.
- Ny QA granskar statiskt alla dessa states. Faktiska svep, renderingsbilder, modal/tangentbord och native-prioritet markeras NOT TESTABLE om miljön fortsatt blockerar dem. Tasken lämnar inte QA/review/done på grund av enbart build eller statisk logik.

## Befintlig implementering och evidens

v5:s ursprungliga Architect APPROVE och Critic PROCEED gäller endast v5 och kan inte återanvändas som godkännande för korrigeringen. v5:s implementerarkontroller finns i `docs/tasks/dev/vision-rev02-gestures.md`; dess oberoende QA är FAIL för Knowledge route-gating och övrigt bedöms enligt rapporten i QA-evidensfilen ovan. Browser/native-kontroller är NOT TESTABLE av dokumenterade miljöskäl.

## Granskning

- Product: ursprungligt IN MVP-beslut gäller fortsatt; denna korrigering bevarar kravet att detaljvyer inte oväntat byter huvudflik.
- Architect: **APPROVE** för exakt plan v6. Granskarens besked: `KnowledgeScreen` äger detaljtillstånden och `ProductWorkspace` sidnavigationen; en boolesk flagga stänger av sidgesten endast när artikel är vald eller checklistmall öppen. Flaggan återställs vid återgång och avmontering. FAQ:s inline-innehåll behåller sidgesten.
- Critic: väntar på granskning av exakt plan v6.

### Critic-resultat v6

Critic gav **PROCEED WITH CHANGES**: lägg till ett uttryckligt flöde där användaren öppnar checklistmall, lämnar Kunskap via bottenmenyn och återkommer till översikten med fungerande sidgest. Architect hade rekommenderat nollställning vid avmontering, men v6 testade inte denna väg uttryckligt. Kravet ingår i korrigeringsplan v7.

## Nästa steg

Få Architect APPROVE och Critic PROCEED för exakt v6, uppdatera köreferensen och flytta task från blocked till planned/ready. Ändra därefter bara de godkända filerna, spara verifieringsresultat och beställ ny oberoende QA och Reviewer.

# VISION-R02-GESTURES — korrigeringsplan v7

Datum: 2026-10-13 · Status: Architect APPROVE och Critic PROCEED; redo för korrigeringsimplementation.

## Mandat och mål

Ägarens ursprungliga mandat gäller fortsatt: veckoremsan ska gå att bläddra åt höger och vänster, och sidgest ska byta huvudflik. v5 implementerades och granskades oberoende. QA fann att kunskapsartiklar och checklistdetaljer fortfarande tillåter sidbyte. Den här korrigeringen täpper till den detaljroute som v5 missade; den ändrar inte innehåll eller data.

UX-kontrakt: `docs/plans/VISION-REV02-GESTURES-UX-SPEC-v7.md`.

## Integrerad leverans

- **Ägare:** Implementer för den smala routespärren; QA verifierar faktisk route-logik och Reviewer granskar diffen.
- **Beroenden:** v5-koden och oberoende QA-fyndet i `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v5.md`.
- **Skrivfiler:** `src/features/home/ProductWorkspace.tsx`, `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/home/README.md`, `tools/visual-check/app.tsx`, denna plan, UX-specen och QA-evidens. Befintlig `MainSwipeNavigation`/`HorizontalGestureRegion` återanvänds.
- **Skyddat:** veckolistan och dess gränser, innehålls-/checklistdata, affärslogik, routes utanför Kunskap, tabbordning, schema, nätverk och övriga R02-4-ändringar.

## Korrigeringskontrakt

1. `KnowledgeScreen` rapporterar ett booleskt detaljtillstånd till `ProductWorkspace` när en kunskapsartikel eller checklistmall visas; det återställs när användaren lämnar detaljen och nollställs uttryckligen när `KnowledgeScreen` avmonteras.
2. `ProductWorkspace` inaktiverar huvudsidgesten när `page === 'knowledge'` och kunskapsdetaljen är öppen. Tillbaka-/bottennavigation ska fortsatt fungera.
3. Kunskapsöversikten och FAQ:s inline-expansion behåller huvudsidgesten; FAQ-svar är inte egna routes. Veckoremsa, tabs och Loggs anteckningsfält behåller sina befintliga exkluderingar.
4. Bytet till/från detaljläge får inte skriva data eller ändra aktiv destination. Stale detaljtillstånd får inte återaktivera fel detalj när användaren återvänder till Kunskap.

## Acceptans

- Öppnad artikel och öppnad checklistmall blockerar vänster-/högersvep till huvudflik; användarens befintliga Tillbaka-handling lämnar detaljen.
- Efter återgång till kunskapsöversikten fungerar vänster-/högersvep igen.
- Livscykelväg: öppna checklistmall → lämna Kunskap med bottenmenyn till Hem → gå tillbaka till Kunskap med bottenmenyn. Översikten ska visas och vänster-/högersvep ska fungera. Samma reset gäller en artikel om detaljflaggan delas.
- FAQ:s expanderade svar, översiktsflikarna och övriga befintliga huvudflikar behåller definierat beteende.
- Veckoremsans implementation, gränser och dimningsgeometri ändras inte.
- `pnpm typecheck`, riktad ESLint för ändrade TS/TSX-filer, `git diff --check`, `python3 tools/dev_flow.py validate` och public/review visual-check builds körs.
- Ny QA granskar statiskt alla dessa states. Faktiska svep, renderingsbilder, modal/tangentbord och native-prioritet markeras NOT TESTABLE om miljön fortsatt blockerar dem. Tasken lämnar inte QA/review/done på grund av enbart build eller statisk logik.

## Befintlig implementering och evidens

v5:s ursprungliga Architect APPROVE och Critic PROCEED gäller endast v5 och kan inte återanvändas som godkännande för korrigeringen. v5:s implementerarkontroller finns i `docs/tasks/dev/vision-rev02-gestures.md`; dess oberoende QA är FAIL för Knowledge route-gating och övrigt bedöms enligt rapporten i QA-evidensfilen ovan. Browser/native-kontroller är NOT TESTABLE av dokumenterade miljöskäl.

## Granskning

- Product: ursprungligt IN MVP-beslut gäller fortsatt; denna korrigering bevarar kravet att detaljvyer inte oväntat byter huvudflik.
- Architect v6: APPROVE. Rekommendation: flaggan speglar vald artikel/öppen checklistmall och återställs vid återgång/avmontering; FAQ:s inline-innehåll behåller sidgesten.
- Critic v6: **PROCEED WITH CHANGES**. Begärde uttryckligt acceptansflöde för att lämna Kunskap via bottenmenyn från en öppen checklistmall och återvända till en fungerande översikt. Detta ingår nu i v7.
- Architect: **APPROVE** för exakt plan v7. Bekräftade att bottenmenyn fortfarande når Hem från checklistmall, att `KnowledgeScreen` nollställer detail-flaggan vid avmontering och att återgång visar översikten med aktiv huvudsidgest. Nuvarande wiring rensar `knowledgeFocus` när Kunskap väljs.
- Critic: **PROCEED** för exakt plan v7. Granskade lifecycle-raden och kravet att detail-flaggan nollställs vid avmontering; QA ska verifiera reset och återinträde. Ingen annan betydande UX-invändning.

## Implementationscheckpoint — 2026-10-13

- `KnowledgeScreen` rapporterar artikel-/checklistdetalj, rensar artikelfokus vid Tillbaka och skickar uttryckligen `false` vid avmontering.
- `ProductWorkspace` spärrar `MainSwipeNavigation` endast för `page === 'knowledge'` med öppen detalj. Bottenmenyn rensar eventuell kvarvarande detalj/fokus innan Kunskap öppnas igen; FAQ och översikten lämnar huvudsidgesten aktiv.
- Visual-check fixture använder syntetisk checklistläsning i reviewläge och delar samma detail-state-gating. Artikelvägen kan också lämnas via bottenmenyn och öppnas igen som översikt.
- `pnpm typecheck`: PASS.
- Riktad ESLint för `ProductWorkspace.tsx`, `KnowledgeScreen.tsx` och `tools/visual-check/app.tsx`: PASS, 0 fel. Fixturefilen har tre befintliga `no-unused-vars`-varningar (`setEvents`, `program`, `setProgram`).
- Public och review visual-check builds: PASS (`/tmp/tassla-v7-public`, `/tmp/tassla-v7-review`).
- `python3 tools/dev_flow.py validate`: PASS.
- `git diff --check`: PASS.
- Faktisk webbläsar-/native-interaktion: **NOT TESTABLE** i den här miljön. Tidigare Chromium-försök blockerades av `setsockopt: Operation not permitted` vid vanlig start och `net::ERR_BLOCKED_BY_ADMINISTRATOR` för `file://` efter escalation; ingen manuell svepverifiering eller screenshot tas som PASS. Inga testsviter kördes.

Implementeringen är redo för ny oberoende QA och Reviewer. Den får inte markeras QA/review/done enbart på grund av statisk verifiering och lyckade builds.

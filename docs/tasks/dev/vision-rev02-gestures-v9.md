# VISION-R02-GESTURES — korrigeringsplan v9

Datum: 2026-10-17 · Status: v9 complete locally after Architect/Critic approval, focused checks, independent QA PASS and Reviewer PASS.

## Mandat och mål

Ägarens ursprungliga mandat gäller fortsatt: veckoremsan ska gå att bläddra åt höger och vänster, och sidgest ska byta huvudflik. v5 implementerades och granskades oberoende. QA fann att kunskapsartiklar och checklistdetaljer fortfarande tillåter sidbyte. Den här korrigeringen täpper till den detaljroute som v5 missade; den ändrar inte innehåll eller data.

UX-kontrakt: `docs/plans/VISION-REV02-GESTURES-UX-SPEC-v9.md`.

## Integrerad leverans

Route-gate-implementationen och dess statiska v8-granskningar är historiskt underlag som redan är implementerat. v9 är en avgränsad closeout: aktiv åldersremsas gränsassertion och synkad dokumentation/evidens; aktuell v9-status står i v9-sektionerna nedan.

- **Ägare:** Implementer för den smala routespärren; QA verifierar faktisk route-logik och Reviewer granskar diffen.
- **Beroenden:** v5-koden och oberoende QA-fyndet i `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v5.md`.
- **Skrivfiler för v9-closeout:** `tests/home-today.test.mjs`, denna plan, UX-specen, kö-/rapportstatus och v9 QA-/Reviewer-evidens. v8:s redan implementerade produktionskod och visual-check-fixture är endast granskningsunderlag; v9 ändrar dem inte.
- **Skyddat:** veckolistan och dess gränser, innehålls-/checklistdata, affärslogik, routes utanför Kunskap, tabbordning, schema, nätverk och övriga R02-4-ändringar.

## Korrigeringskontrakt

1. `KnowledgeScreen` rapporterar ett booleskt detaljtillstånd till `ProductWorkspace` när en kunskapsartikel eller checklistmall visas; det återställs när användaren lämnar detaljen och nollställs uttryckligen när `KnowledgeScreen` avmonteras.
2. `ProductWorkspace` inaktiverar huvudsidgesten när `page === 'knowledge'` och kunskapsdetaljen är öppen. Tillbaka-/bottennavigation ska fortsatt fungera.
3. Kunskapsöversikten och FAQ:s inline-expansion behåller huvudsidgesten; FAQ-svar är inte egna routes. Veckoremsa, tabs och Loggs anteckningsfält behåller sina befintliga exkluderingar.
4. Ett tryck på den redan aktiva Kunskap-fliken medan artikel/checklistdetalj visas är en no-op för lokal detaljstate; det får inte rensa parent-spärren. Detaljen förblir synlig och huvudsidgesten fortsatt avstängd.
5. Varje verkligt utträde från Kunskap till annan huvudflik rensar `knowledgeFocus` och detaljspärren, både via bottenmeny och huvudsidgest. Återinträde via bottenmeny eller sidgest visar översikten; gammalt artikelval får inte återöppnas.
6. Hemmets uttryckliga `onOpenContent(contentId)`-navigering till Kunskap bevarar det valda artikel-id:t och öppnar just den artikeln; exit-reset får inte radera detta inkommande content-val.
7. Bytet till/från detaljläge får inte skriva data eller ändra aktiv destination. Stale detaljtillstånd får inte återaktivera fel detalj när användaren återvänder till Kunskap.

## Acceptans

- Öppnad artikel och öppnad checklistmall blockerar vänster-/högersvep till huvudflik; användarens befintliga Tillbaka-handling lämnar detaljen.
- Med en artikel eller checklistmall öppen, tryck på den redan aktiva Kunskap-fliken: detaljen finns kvar och sidgesten förblir spärrad.
- Efter återgång till kunskapsöversikten fungerar vänster-/högersvep igen.
- Livscykelväg: öppna checklistmall → lämna Kunskap med bottenmenyn till Hem → gå tillbaka till Kunskap med bottenmenyn. Översikten ska visas och vänster-/högersvep ska fungera. Samma reset gäller en artikel om detaljflaggan delas.
- Livscykelväg: stå på Kunskapsöversikten → svep till annan huvudflik → svep tillbaka till Kunskap. Ingen tidigare artikel/detalj återöppnas; översikten och båda svepriktningarna fungerar.
- Hemmets direkta guide-CTA till en uttryckligen vald artikel öppnar fortfarande den valda artikeln.
- FAQ:s expanderade svar, översiktsflikarna och övriga befintliga huvudflikar behåller definierat beteende.
- Veckoremsans implementation, gränser och dimningsgeometri ändras inte.
- v9 lägger endast till den specificerade regressionstestassertionen för den aktiva `homeAgeStrip`-sekvensen i `tests/home-today.test.mjs`; inga produktionsberäkningar eller data ändras. Kör fokustestet, `pnpm check`, `git diff --check` och `python tools/dev_flow.py validate`. Återanvänd sparade Chromium-interaktionsresultat eftersom v9 inte ändrar produktionskod eller fixture; de är inte en ny v9-build.
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
- Detta är den historiska v7-checkpointen: browser/native-interaktion var **NOT TESTABLE** då och inga testsviter kördes i den checkpointen. v9:s sparade Chromium-körning och bounded assertion redovisas separat nedan.

## QA v7 — 2026-10-13

Oberoende QA gav **FAIL** för aktiv Knowledge-flik medan en detaljvy är öppen. Den specificerade Home → Knowledge-lifecycle-vägen och vanliga detalj-/tillbakaflöden verifierades statiskt; browser/native-gester är **NOT TESTABLE**. Fyndet och full matris finns i `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v7.md`.

v7-originalplanen finns kvar i `docs/tasks/dev/vision-rev02-gestures-v7.md`. v8 föreslår: aktiv Kunskap-flik är no-op medan detaljen är öppen; varje faktiskt utträde från Kunskap rensar fokus/spärr så att återinträde via bottenmeny eller huvudsidgest visar översikten. Spegeländring krävs i visual-check-fixturen. Architect och Critic måste granska exakt v8 före källkodsändring.

### V8-granskning

- **Architect: APPROVE** för exakt v8-plan, UX-spec och köacceptans efter att de täckte aktiv Knowledge-flik, reset vid exits via bottenmeny och sidgest, stale focus på återinträde samt direkt Hem-CTA till valt artikel-id. Granskningen var read-only; ingen kod eller test kördes.
- **Critic: PROCEED** för exakt v8 efter Architect-review. Bekräftade att aktiv Knowledge-flik är no-op i detalj, alla faktiska exits via bottenmeny/sidgest rensar fokus/spärr, återinträde visar översikten och Hemmets explicita `onOpenContent(contentId)` bevarar artikel-id:t. Inga betydande UX-invändningar.
- Båda granskningarna var read-only; inga tester eller källkodsändringar ingick i planreviewn.

## Implementationscheckpoint — 2026-10-13

- `ProductWorkspace` skickar bottom-nav och huvudsidgest genom samma main-tab navigationregel: aktiv Kunskap-flik lämnar detaljstate orörd; faktiska exit/inträden från/till Kunskap rensar stale focus/detail.
- Hemmets `onOpenContent(contentId)` går kvar sin separata väg och bevarar uttryckligt valt artikel-id.
- Visual-check-fixturen speglar active-tab no-op, exit-reset för bottenmeny/sidgest och direct content-opening.
- `pnpm typecheck`: PASS.
- Riktad ESLint för `ProductWorkspace.tsx` och `tools/visual-check/app.tsx`: PASS, 0 fel och 3 befintliga fixturevarningar (`setEvents`, `program`, `setProgram`).
- Public/review visual-check builds: PASS (`/tmp/tassla-preview/gestures-v8/public`, `/tmp/tassla-preview/gestures-v8/review`).
- `git diff --check`: PASS; `python3 tools/dev_flow.py validate`: PASS.
- Inga tester/testsviter kördes. Faktisk browser-/native-swipe och visuell handpåläggning är **NOT TESTABLE** i nuvarande miljö.

## Oberoende QA — 2026-10-13

QA gav **PASS statiskt, utan blockerare**. Aktiv Kunskap-flik bevarar detaljen; faktiska exits och återinträde via båda navigationsvägar reset:ar stale focus/detail; Hemmets direkta content-id bevaras; overview/FAQ är fortsatt svepbara. `useEffect`-timing är runtime-gap utan statiskt belagd blockerare. Browser/native-gester är **NOT TESTABLE**. Full matris: `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v8.md`; v9 browserbevis: `docs/design/evidence/vision-rev02/gestures/runtime-2026-10-17/browser-results.json`.

## Reviewer — 2026-10-13

Reviewer gav **PASS, no blocking findings**. Main-tab routing, focus/reset rules, Home explicit article selection, fixture parity och avsaknad av data-/affärslogikändring matchar exakt v8.

## v8 historisk status

v8 blockerades eftersom faktisk browser/native-swipe saknade verifiering. v9:s Chromium-körning verifierar browserinteraktion; nativebeteende förblir separat NOT TESTABLE. v8:s krav att inte lägga till eller köra test är historiskt och superseded av den enda avgränsade v9-assertionen nedan.

## v9 precisering och beslutspunkt

Ägarens besked 2026-10-17 är att **avvakta** med att ersätta kalender-/veckoremsan med hundfaser. R2a behåller därför den befintliga browse-only-remsan och dess kanoniska gränser enligt `docs/plans/HOME-REV02-visual-ux-spec.md` §5.1: veckor 0–20, månader 0–12 fram till första födelsedagen och år 1 till aktuell helårsålder +3. Hundens aktuella ålder, dagsinnehåll, profilens sparade enhet och intern innehållsselektion ändras inte. Den nya fasbaserade presentationen är en **senare produktbeslutspunkt**, inte en R2a-acceptans.

Som framtida beslutspunkt ska Product ta ställning till om remsan ska visa generella utvecklingsfaser. Exakta intervall och etiketter ska då förankras i tidigare Dog Expert-underlag eller granskas på nytt före plan/kod; exempelintervall i ägarens meddelande är förslag, inte sakgranskat råd.

### Bounded endpoint assertion

Lägg till en enda fokuserad assertion i befintliga `tests/home-today.test.mjs` som direkt anropar den aktiva `homeAgeStrip`-hjälparen. Med födelsedatum `2026-06-01` verifieras 2026-10-19 (dag 140: weeks, markörer 0–20, aktuell 20), 2026-10-20 (dag 141: months, markörer 0–12, aktuell 4), 2027-06-01 (första födelsedagen: months, markörer 0–12, aktuell 12) och 2027-06-02 (dagen efter: years, markörer 1–4, aktuell 1). Varje sekvens ska ha exakt en aktuell markör. Detta testar befintliga gränser utan ändring av produktionsberäkningar, visning eller data. Kör `pnpm exec node --experimental-strip-types --test tests/home-today.test.mjs`. Befintlig datum-/renderingsmatris med dag 140/141, årsdag och dagen efter finns i `docs/design/evidence/vision-rev02/home-age-stages/RENDER-REPORT.md`; den kompletterar, men ersätter inte, assertionen.

### Browserbevis 2026-10-17

Public och review-fixtur: 99/99 kontroller passerade, noll browser page errors, Chromium mobile emulation med CDP-touch vid 375×844, 430×844 och 375×667. Verifierat: huvudflikssvep i båda riktningar och ändgränser, Knowledge-artikel/checklistdetalj-spärr, aktiv Kunskap-flik som no-op, fokusreset vid återinträde, FAQ/Tabs/TextInput/age-strip-gester som tillhör sina egna ytor, och oförändrad ålder/dagsdata. Färska skärmbilder och resultat finns i `docs/design/evidence/vision-rev02/gestures/runtime-2026-10-17/`. Touch på fysisk iOS/Android, native accessibility och native sheet/modal-prioritet är fortsatt NOT TESTABLE.

Efter färsk Architect APPROVE och Critic PROCEED för exakt v9 får endast den beskrivna assertionen i `tests/home-today.test.mjs` läggas till. Kör det fokuserade testet; därefter granskar oberoende QA och Reviewer assertionen tillsammans med befintlig källkod och browserbevis. Inga produktionskodändringar ingår. Checkpointen får slutföras när granskningarna passerat, med native-luckan uttryckligen noterad.


## v9 planreview och implementationscheckpoint — 2026-10-17

- Architect: **APPROVE** för exakt v9 efter att skrivvägarna begränsats till assertionen i `tests/home-today.test.mjs` och v9-dokumentation/evidens/status. Befintlig v8-produktionskod och visual-check-fixture är endast granskningsunderlag.
- Critic: **PROCEED** för samma exakta v9-avgränsning. Den uppskjutna fasbaserade presentationen ligger utanför R2a.
- Riktat test `pnpm exec node --experimental-strip-types --test tests/home-today.test.mjs`: **4/4 PASS**.
- `pnpm check`: **551/551 PASS**, app- och edge-typecheck samt ESLint PASS.
- `python tools/dev_flow.py validate` och `git diff --check`: **PASS**.
- Sparad public/review Chromium-touch-körning: **99/99 PASS**, noll browser page errors; native iOS/Android och native accessibility är fortsatt **NOT TESTABLE**.
- Inga produktionsfiler eller visual-check-fixture ändrades i v9. Oberoende QA och Reviewer återstår.


## v9 slutcheckpoint — 2026-10-17

- Oberoende QA: **PASS**, rapport `docs/design/evidence/vision-rev02/gestures/qa/QA-REPORT-v9.md`.
- Oberoende Reviewer: **PASS**, inga blockerande fynd, rapport `docs/design/evidence/vision-rev02/gestures/review/REVIEW-REPORT-v9.md`.
- R2a är stängd som lokal checkpoint. Browserresultat är Chromium-emulering med syntetisk data. Native iOS/Android, native accessibility, systeminteraktioner och native sheet/modal-prioritet är fortsatt **NOT TESTABLE**.
- Hundfasbaserad navigation är inte implementerad. Det är en separat senare produktbeslutspunkt.

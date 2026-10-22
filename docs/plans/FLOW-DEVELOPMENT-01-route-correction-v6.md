# FLOW-DEVELOPMENT-01 — guide-retur och isolerat scrollminne

- **Datum:** 2026-10-21
- **Task:** `FLOW-DEVELOPMENT-01`
- **Grundplan:** `VISION-R02-HEM-2-3-8-2026-10-21-v8.md`, checkpoint 2
- **Version:** v6
- **Supersedes:** v5 endast för rättad bildassetreferens och synkad evidenspekare; v1–v5 behålls som granskningshistorik.
- **Status:** Architect **APPROVE** och Critic **PROCEED** för exakt v6. Befintlig route-/scrollimplementation följer det korrigerade v6-kontraktet; tester och renderacceptans återstår.

## Syfte och avgränsning

V8 kräver att en guide från Utveckling går tillbaka direkt till Utveckling. Den delade `KnowledgeScreen` har bara en generell guideretur. Vid routeintegration hittades också att `AppScreen` bara lagrar en numerisk scrollposition. v5 rättade den gemensamma scrollmodellen så Hem, Utveckling och Checklistor kan återställa varsin position under ett aktivt Hemflöde. v5 bevarar beteendet för befintliga `AppScreen`-anrop som inte använder scrollnycklar. v6 rättar enbart bildassetväg och planpekare till den JPEG som faktiskt används i koden; route-, scroll-, datakontrakt, riskklass M och checkpoints i paketplan v8 ändras inte. Ingen Dagens framsteg- eller Insikter-kod ingår.

## Skrivvägar

- `assets/images/development-hero-puppy-black-tan-forest-wide.jpg`
- `assets/images/README.md`
- `src/components/AppPrimitives.tsx`
- `src/features/home/DevelopmentScreen.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/main-navigation.ts`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/theme/tokens.ts`
- `src/features/home/README.md`
- `tests/development-screen-model.test.mjs`
- `tests/home-panel-routes.test.mjs` (planerad; finns inte ännu)
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/development/`
- `docs/plans/FLOW-DEVELOPMENT-01-route-correction-v6.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

## Handoff till den aktiva kön

Efter att Architect och Critic har granskat exakt den här v6-filen ska `FLOW-DEVELOPMENT-01` i `docs/tasks/dev/queue.json` peka på v6 i stället för v5 för route correction. Den aktiva skrivvägen ska också uppdateras till v6. Behåll `FLOW-PANELS-2-3-image-optimization-v5.md` som separat aktiv assetplan; den ersätts inte av denna routekorrigering. Ta bort den föråldrade nästa-åtgärden om att börja implementationen: routekoden finns redan. Nästa steg omfattar både saknade testfiler (`tests/development-screen-model.test.mjs` och `tests/home-panel-routes.test.mjs`) enligt v8 checkpoint 2 och den här planens retur-/scrollkrav, samt riktig public/review-rendering och §14-bedömning. Ingen av testfilerna finns ännu. Tills dess står route-/skärmacceptans öppen och render-evidens som NOT TESTABLE; queue-/rapporttext får inte ange PASS eller klar panel.

v1–v5 behålls som granskningshistorik. Route-/scrollimplementationen följer tidigare granskade v5; v6 tillför endast korrekt JPEG-referens och synkad dokumentpekare.

## Bildval och roll

Panel 2 använder `assets/images/development-hero-puppy-black-tan-forest-wide.jpg`: en separat AI-genererad fotoestetisk svart-/tanvalp på en nordisk skogsstig, med öppet skogsutrymme för åldersbågen. Den skiljer sig tydligt från Hemmets golden retriever i närbild och används bara på Utveckling. Bilden är en generisk `Standardbild`, inte ägarens hund. Manifestet anger motiv, genereringsdatum, roll och beskärning.

## Returkontrakt

1. Endast en versionerad, publicerad guide som öppnats inifrån `development` får Knowledge-detailens föräldrakontext `development`. Detailen visar då `Tillbaka till Utveckling`, stänger artikeldetaljen och återgår till utvecklingsvyn. Label och callbackmål ska överensstämma.
2. Vanlig Kunskap behåller sin befintliga returtext, navigation och callback. Träningens artikel-/stegretur påverkas inte. Ingen ny bottennavflik införs.
3. Utveckling öppnar exakt den valda publicerade guideversionen genom versionsspecifikt content ID. V8:s publiceringsfilter och guideavgränsning gäller; retur får inte ersätta artikeln med en nyare version.
4. `activeMainTabDestination('development')` mappar till `home`; Utveckling och dess Knowledge-detail är barn i Hem-resan.

## Scrollnycklar och scope

- `AppScreen` lagrar offsetar i en map med nyckeln `scrollKey`. Den aktiva vyn uppdaterar endast offseten när `scrollKey === preserveScrollKey`. En vy som visas ovanpå en föräldrarutt får förälderns `preserveScrollKey` men en egen `scrollKey`; den får därmed inte skriva över förälderns sparade position.
- Exakt ruttmappning: Hem använder `home-detail-flow` för både `scrollKey` och `preserveScrollKey`; Utveckling använder `home-development-flow` för båda; en Utvecklingsguide använder en egen `scrollKey` och `preserveScrollKey='home-development-flow'`; Checklistor behåller `home-checklist-flow` för båda. Kunskapsdetaljer från vanlig Kunskap och Training behåller sina befintliga route-/returkontrakt.
- Mapen kan samtidigt hålla `home-detail-flow`, `home-development-flow` och `home-checklist-flow`. Att gå från Hem till Utveckling eller Checklistor tömmer inte Hempositionen; återgång till respektive vy återställer sin egen nyckel. Guide-detaljen lagrar inte en ersättande position under Utvecklingsnyckeln.
- När `scrollMemoryScope` ändras rensas hela offsetmapen före någon återställning i `useLayoutEffect`. Om användaren lämnar Hemmets barnflöde till en fristående huvudflik rensas mapen. `ProductWorkspace` skickar aktuell scope och lämnar inte kvar ett gammalt flöde efter scopebyte.
- Scope/fokus omfattar konto-ID, `accountGeneration`, hund-ID, ras, exakt födelsedatum, härledd ålder och review/public-kontext. Varje byte invaliderar Development-routen och artikel-fokus; visa Hem med aktuell hund. Födelsedatum inom samma åldersvecka täcks.
- `AppScreen` utan `scrollKey` och `preserveScrollKey` behåller sitt nuvarande beteende: ingen scrollposition sparas eller återställs för dessa anrop.

## Tester och acceptans

Skapa `tests/home-panel-routes.test.mjs`; filen finns inte i nuläget. Testa renderad route- och scrollsekvens mot de faktiska `AppScreen`- och `ProductWorkspace`-nycklarna, inte bara helper-state eller etiketter:

- Utöka/kör testfixturen så Hem, Utveckling och Checklistor har tre tydligt skilda offsetar. Scrolla varje vy, navigera Hem → Utveckling → guide → tillbaka till Utveckling → Hem och verifiera att varje vy återställs till sin egen position. Verifiera också retur till Checklistor med dess egen position.
- Byt konto, hund, ras, exakt födelsedatum inom samma åldersvecka, härledd ålder och review/public-scope. Offsetar och Development/artikelfokus ska rensas före nästa scrollåterställning. Lämna flödet till en annan huvudflik och verifiera att offsetarna inte återanvänds vid ny Hemresa.
- Development-guide visar `Tillbaka till Utveckling`; tryck stänger detail och landar direkt på Utveckling. Vanlig Kunskap och Träning behåller sina befintliga label-/callbackmål.
- Öppnad guide är exakt vald publicerad version; ej publicerad/review-only artikel kan inte öppnas från Utveckling. Development räknas som Home i bottennavigationen.
- Anrop av `AppScreen` utan nycklar ger samma nya-route-scrollbeteende som tidigare och får ingen återställd position från keyed views.
- `assets/images/development-hero-puppy-black-tan-forest-wide.jpg` visas i stor hero som märkt `Standardbild`.

Den nya ändringen i v6 godkänns endast när aktiva referenser pekar på JPEG-filen och manifestet beskriver samma generering/roll. v5:s tidigare route-/scrollacceptans och krav för panel 2 kvarstår: rendera public/review-vyerna vid relevanta viewportar, prova riktiga retur-/scrollflödet och jämför med `vision_rev02.jpg`; dokumentera §14 för komposition, färg, typografi, former, bildspråk och täthet. Tester/render av panel 2 som saknas förblir öppna och får inte rapporteras som godkända. Ingen panelstatus markeras klar utan separat funktions-, data- och visuell evidens.

## Oförändrade begränsningar

Ingen milstolpskälla eller milstolptext införs. Ålder, faser, `Standardbild`, publicerade guider, loading/empty/error/source-version och ärligt partiell panel följer v8. Inga migrations-, RPC-, nätverks-, telemetri-, ändamåls- eller dependencyändringar tillåts. Utvecklingspanelen förblir partiell tills en separat sakgranskad och publicerad milstolpskälla finns.

## Exakt planreview

- Architect: **APPROVE**. Bekräftade att handoffen byter routeplanens queue-pekare och aktiva skrivväg till v6, behåller den separata bildplanen v5, ersätter stale implementationssteget med saknade tester och public/review-render/§14, och lämnar acceptans öppen.
- Critic: **PROCEED**. Krävde att även `tests/development-screen-model.test.mjs` nämns eftersom både den och `tests/home-panel-routes.test.mjs` saknas. Punkten lades till och granskades på nytt; båda testfilerna, verklig render och §14 kvarstår som öppna verifieringskrav.

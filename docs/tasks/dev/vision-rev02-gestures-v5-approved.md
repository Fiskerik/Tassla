# VISION-R02-GESTURES — arbetsplan v5

Datum: 2026-10-13 · Status: implementation lokalt verifierad; QA och Reviewer återstår; browserinteraktion NOT TESTABLE.

## Mandat och mål

Ägaren bad uttryckligen att veckoremsan ska gå att bläddra åt höger/vänster och att svep ska byta sida i huvudmenyn. Det är tillägg till befintliga Hem- och huvudflikar; inga nya produktdata eller skrivningar ingår.

UX-kontrakt: `docs/plans/VISION-REV02-GESTURES-UX-SPEC-v5-approved.md` v5.

## Integrerad leverans

- **Ägare:** implementer (Codex); Product/Architect/Critic granskar plan, QA granskar beteende och Reviewer granskar diffen.
- **Beroenden:** aktiv hunds födelsedatum och befintlig huvudfliksordning/`MainSwipeNavigation`; `docs/plans/HOME-REV02-visual-ux-spec.md` och designregelverkets §14.
- **Skrivfiler:** `src/features/home/HomeScreen.tsx`, eventuellt `src/features/home/home-today.ts`, `src/components/ui/MainSwipeNavigation.tsx`, `src/components/ui/Tabs.tsx`, `src/components/ui/index.ts`, `src/features/puppy-log/LogScreen.tsx`, `tools/visual-check/app.tsx`, `src/features/home/README.md`, UX-spec, QA-bilder och renderingsrapport. `HomeCarousel.tsx` är inte routad och lämnas utanför. `ProductWorkspace.tsx` har redan rätt ordning/riktningshantering och lämnas oförändrad om verifieringen bekräftar det. Loggregionen placeras runt anteckningsfältet inne i `LogEventEditor`, som ligger i `BottomSheet`; hela Loggskärmen omsluts inte.
- **Skyddat:** schema, Supabase, logg-/tränings-/hälsohistorik, dagsuppgifter, datumbaserad selektion, portrait asset, BottomNav API och orelaterade skärmar.
- **Acceptans:** en virtualiserad horisontell lista med fasta celler vars extent inkluderar spacing använder samma geometri i `getItemLayout`, `initialScrollIndex = max(0, aktuellVecka - 3)` och dimning; den scrollar till vecka 0 eller aktuell ålder +12, medan aktuell ålder finns kvar i hälsningsraden och browse inte ändrar dagsinnehåll/progress/data. `HorizontalGestureRegion` signalerar synkront touch-start/end/cancel till yttergesten, nollställer även vid avmontering och tar inte över responder; veckoremsa, `Tabs` och Loggs anteckningsfält skyddar ytter-svepet även vid båda kanterna. Övriga huvudytor byter flik med vänstersvep framåt/högersvep bakåt utan wrap; vertikal scroll, tryck, detaljrutter och modal/sheet fortsätter fungera.

## Gemensamma kontroller

- Före implementation sparas Product-, Architect- och Critic-besked för denna planversion. Product rekommenderar IN MVP och browse-only-semantik. Architect gav CHANGES på v2/v3 och APPROVE på v5: regionen notifierar synkront vid touch-start/end/cancel utan responderövertagande, städar vid avmontering och använder fast item-extent inklusive spacing. Loggfältet är uttryckligen inom `LogEventEditor` i `BottomSheet`. V4:s sammanslagning till en integrerad uppgift kvarstår. Ändrad scope kräver ny review.
- Kör `pnpm typecheck`, riktad ESLint, `git diff --check`, `python3 tools/dev_flow.py validate`, public/review visual-check build och manuell browserrendering. Kör inte testsviter enligt denna arbetssessions instruktion.
- Dokumentera §14, gestens gränser, fixturedata, viewport/textskala, sidfel, vad webben/native inte verifierar och exakt nästa steg.
- Tasken får inte markeras `done` innan oberoende QA/Reviewer passerat. Owner QA är separat.

## Planreview

- Product: IN MVP; se Productreview i UX-spec v5.
- Architect: APPROVE för exakt plan v5. Rekommendationen och avgränsningen finns i agentens reviewbesked 2026-10-13; särskilt gäller placeringen av Loggs anteckningsfält i `LogEventEditor` inne i `BottomSheet`.
- Critic: PROCEED för exakt plan v5. Critic bekräftar browse-only-semantik, flikordningen, huvudroute-scope och att aktiva horisontella kontroller täcks. Implementation ska skydda den delade `Tabs`-komponenten för alla dess varianter, eftersom den används i Kunskap, Träning och Hälsa. Ingen blockerande produkt- eller UX-risk hittades.
- Ägarens mandat: uttryckligt i den aktuella chatten; implementation startar först när planreview är klar.

## Implementationscheckpoint

Implementerat inom den godkända planen: Hemmets veckoremsa är en horisontell virtualiserad lista från vecka 0 till aktuell ålder +12. Sju celler visas i startfönstret; `initialScrollIndex` är `max(0, aktuellVecka - 3)`. Cellbredden mäts från listans viewport, separatorn ingår i det fasta item-extentet för både `getItemLayout` och porträttdimningen. Hundens faktiska ålder står kvar i hälsningsraden. Bläddring ändrar inte dagsinnehåll eller sparad data.

`HorizontalGestureRegion` notifierar huvudrespondern synkront vid touch-start och återställer vid touch-end, touch-cancel och avmontering; regionen tar inte över respondern. Den omsluter veckoremsan, alla varianter av delade `Tabs` samt endast anteckningsfältet i `LogEventEditor` inne i `BottomSheet`. Huvudflikernas riktningsordning, gränser och routefilter verifierades i befintlig `ProductWorkspace`/`main-navigation`; de filerna behövde inte ändras. `HomeCarousel` är orörd.

### Implementerarkontroller

- `pnpm typecheck` — PASS.
- `pnpm exec eslint src/features/home/HomeScreen.tsx src/features/home/home-today.ts src/components/ui/MainSwipeNavigation.tsx src/components/ui/Tabs.tsx src/features/puppy-log/LogScreen.tsx tools/visual-check/app.tsx` — PASS, tre befintliga oanvända variabelvarningar i `tools/visual-check/app.tsx` (`setEvents`, `program`, `setProgram`); inga lintfel.
- `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/gestures/public node tools/visual-check/build.cjs` — PASS.
- `TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/gestures/review node tools/visual-check/build.cjs` — PASS.
- `git diff --check` — PASS.
- `python3 tools/dev_flow.py validate` — PASS; VISION-R02-GESTURES ligger kvar i `implementing` tills QA/Reviewer har granskat.
- Inga testfiler har lagts till och inga testsviter har körts.

### Interaktion och evidens

Browserinteraktion och skärmdumpar är **NOT TESTABLE i den här körmiljön**. Chromium utan eskalering avslutades med `setsockopt: Operation not permitted` från crashpad. Eskalerad Chromium startade men blockerade den lokala `file://`-renderingen med `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Ett försök att servera den byggda previewn via localhost stoppades av `EADDRINUSE` på port 4174. Därför finns ingen skärmbild eller manuellt verifierat svepresultat sparat. De två statiska public/review-byggena bevisar endast att UI-fixturen bundlas.

### Städning och nästa steg

Efter implementation granskades bara de tilldelade gestfilerna: den tidigare manuellt uppmätta cellkartan togs bort och ersattes av samma fasta cellgeometri som listan använder; inga produktdata, routes, tabordningar eller andra skärmar ändrades. Rerun av typecheck/lint och båda byggen är dokumenterad ovan. Nästa steg är oberoende QA och Reviewer: verifiera svep åt båda håll, veckogränserna, Tabs i Kunskap/Träning/Hälsa, Loggs anteckningsfält i sheet, huvudfliksgränser och att detaljerutter inte byter flik. Saknad browser/native-evidens ska förbli NOT TESTABLE tills en tillgänglig körmiljö granskat det.

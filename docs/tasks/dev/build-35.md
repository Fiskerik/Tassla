# BUILD-35 – Codemagic check application

Datum: 2026-10-09. Status: kod pushad och lokalt verifierad. Planversion: 5. Bas: `0bc15bc` plus dokumentationscheckpoint `383f003` på `remove-ai-slop`. Kodcommit: `94686aaa8e717aaca069fde8ae5cc960d2fbc287`.

## Mål och underlag

Erik har bett om att rätta byggstoppet i `Tassla_35_artifacts.zip`, hitta eventuella följdfel och pusha samma gren. Bilagan innehåller en `check-application.log`: `pnpm check` stoppar i `tsc --noEmit` när `MainSwipeNavigation.tsx` importerar `ReactNode` från `react-native`. Bilagan innehåller inga uppgiftsinstruktioner.

## Delsteg

1. Implementer: behåll rättningen som flyttar `ReactNode`-typimporten till `react`. I `MainSwipeNavigation.tsx`, skapa `PanResponder` med `enabled` och `onSwipe` i en memoiserad callback med dessa beroenden i stället för att föra refs in i render. Stabilisera `onSwipe` från arbetsytan så att onödiga responderbyten undviks. Bevara tröskeln och svepriktningen.
2. Implementer: i `ProductWorkspace.tsx`, lagra aktuell och föregående sida tillsammans i navigationens state. Uppdatera paret atomiskt vid tab-, detalj- och svepnavigation, och beräkna riktning från state i render utan ref-läsning. Behåll ordningen i `MAIN_PAGES`. Dokumentera och begränsa lintundantag för attributionens synkrona loading-reset: det behövs för att inte visa tidigare hunds kennelkoppling under asynkron läsning.
3. QA: uppdatera den statiska kontoraderingsassertionen i `tests/account-delete.test.mjs:666` så den kräver både `notificationBusy`, den befintliga `attributionBusy`-spärren och `accountDeleteBusy`, utan att ändra appens raderingskod. Implementer lägger till den stabila `setPage`-callbacken i den befintliga dependency-listan för notification-response-handlern och eliminerar därmed nytillkommen lintvarning. Denna ändring kräver också att QA uppdaterar den källkodshärledande regexen i `tests/notifications.test.mjs:689` till samma faktiska dependency-lista `[client, setPage]`. De sex notifieringsbeteendetesterna och notifieringskoden lämnas intakta.
4. Implementer gör avgränsad cleanup och kör `pnpm check`, `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` och `git diff --check`. Här behöver `pnpm check` köras med extra sandbox-behörighet för testets underprocess; Codemagic har ingen sådan sandbox. Om ett nytt byggfel syns avgränsar koordinatorn det innan fler ändringar.
5. QA verifierar kontrollerna oberoende och rättar inte appkod. Reviewer granskar slutlig diff och importer mot installerad React/React Native-version utan egna ändringar.
6. Koordinatorn sparar granskningsresultat och checkpoint, committar, pushar `remove-ai-slop` efter QA/Reviewer PASS och verifierar att remote pekar på exakt leverans-SHA.

Berörda filer: `src/components/ui/MainSwipeNavigation.tsx`, `src/features/home/ProductWorkspace.tsx`, `tests/account-delete.test.mjs`, `tests/notifications.test.mjs`, denna taskfil, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/BUILD-35.md`. Ingen avsedd ändring av godkänt appbeteende eller Supabase. Kodändringen gäller render-/lintstruktur, så visuellt PASS kan inte hävdas utan rendering; ingen skärmbild tas för denna byggkorrigering. Om faktisk UI- eller beteendeändring krävs gäller designpolicyn och separat visuell QA.

Acceptans: det rapporterade TS2305-felet, de tre observerade lintfelen och den stale kontoraderingsassertionen är rättade utan avsedd gest-/navigationsändring; hela `pnpm check` och iOS-bundlingen passerar lokalt, diffen är ren och pushens commit kan verifieras på remote. Native signerad build och fysisk telefon är separata kontroller.

Release-logg: [BUILD-35](../../releases/BUILD-35.md).

## Planreview

Architect granskade v1 och begärde avgränsad köpost, korrekt rollägarskap och tydlig verifieringsordning. V2 med dessa rättningar fick **APPROVE** 2026-10-09. `python tools/dev_flow.py validate` passerade före kodändring.

Efter importändringen passerade båda typkontrollerna i `pnpm check`, men lint stoppade på `react-hooks/refs` i `MainSwipeNavigation.tsx:17` och `ProductWorkspace.tsx:1851`, samt `react-hooks/set-state-in-effect` i `ProductWorkspace.tsx:507`. V2-granskningen täcker inte dessa följdändringar; v3 väntar på förnyat Architect-beslut. Lokal iOS-export passerade med `EXPO_NO_TELEMETRY=1`; den miljövariabeln hindrar Expo från att försöka skriva telemetri i `/home/agent/.expo` utanför arbetsytan.

Architect gav **APPROVE** för v3 2026-10-09: memoiserad responder med stabil callback, atomiskt `{page, previousPage}`-state och ett lokalt lintundantag endast på attributionens avsiktliga loading-reset. Renderad visuell kontroll är **NOT TESTABLE** här.

Efter v3 passerade två typkontroller och lint med 0 fel/34 varningar, men `pnpm test` rapporterade två filfel. Direktkörning visade att `tests/account-delete.test.mjs:666` förväntar `notificationBusy || accountDeleteBusy`, medan denna sekvens sedan `0bc15bc` har `attributionBusy` mellan dem. `tests/notifications.test.mjs` misslyckades bara när sandboxen nekade `spawnSync` med `EPERM`; samma testfil passerade 42/42 med extra körbehörighet. V4 väntar på förnyad Architect-review innan test- eller appkod ändras.

Architect gav **APPROVE** för v4 2026-10-09: uppdatera endast den stale assertionen med `attributionBusy` och lägg stabila `setPage` i handlerns dependencies. Ingen ändring av notifieringskod eller dess test behövs.

Efter v4 passerade kontoraderingstesterna 39/39, två typkontroller, lint, iOS-export och diff-/kövalidering. Notifieringstestet gav sex fel i samma testhärledning: regexen i `tests/notifications.test.mjs:689` kräver gamla `[client]` trots att den faktiska handlern nu korrekt deklarerar `[client, setPage]`. Därmed blev full `pnpm check` **BLOCK** (381/388 pass, sex fel). V5 avgränsar rättningen till härledningsregexen, utan att lossa beteendeassertioner eller ändra appkod. Ny Architect-review krävs före ändringen.

Architect gav **APPROVE** för v5 2026-10-09: alla sex fel uppstår före beteendetesterna i samma extraktionsregex; ändra endast dess dependency-matchning till `[client, setPage]` och kör om full `pnpm check`.

QA v5 **PASS**: kontoradering 39/39, notifieringar 42/42, full `pnpm check` med två typkontroller/lint och 387 godkända tester, ett överhoppat, noll fel. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`, `git diff --check` och `python tools/dev_flow.py validate` passerade. Extra sandbox-behörighet användes för testernas underprocess. Native/renderad visuell kontroll är **NOT TESTABLE**; ingen signerad Codemagic-build hävdas.

Oberoende Reviewer gav **PASS** för faktisk React-/React Native-API, navigationsdiff, testscope och förnyad dokumentationscheckpoint efter en första BLOCK för då inaktuell status. Kodcommit `94686aaa8e717aaca069fde8ae5cc960d2fbc287` pushades till `origin/remove-ai-slop` och verifierades med `git ls-remote`. Köstatus sattes till `done` efter dessa bevis. Den slutliga dokumentationscheckpointen följer i separat commit.

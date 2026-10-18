# UI-MAIN-SWIPE-01 — fånga huvudflikssvep utan att störa vertikal scroll

Plan v5 — 2026-10-18. Användarens bifogade `tassla-swipe-fix-och-bottomsheet.patch` och tidigare uttryckliga önskemål om huvudflikssvep utgör mandat för denna lokala UI-fix. v2 lade till uttrycklig visuell kontroll och svensk dokumentation efter Architect-granskning av v1. v3 förtydligade React Native-måtten efter UX-granskning av v2. v4 lade till överlämning vid axelbyte efter QA-fynd. v5 preciserar ett statiskt test av exakt överlämningsvillkor efter Architect-granskning av v4.

## Avgränsning från patchen

Patchens `BottomSheet`, `sheet-dismiss.ts`, `sheet-drag.ts` och `tests/sheet-dismiss.test.mjs` är redan implementerade och committade på den här branchen i en senare variant. Behåll befintlig `useLayoutEffect`-guardning/lifecycle och testa inte in patchens äldre sheet-version ovanpå den. Ny scope är patchens kvarvarande svepnavigering: riktningslåsning i `AppScreen`, tidig men axelbaserad responder-claim, testbara swipe-regler och dokumentation. Knowledge-detail-gate och huvudflikordning i `ProductWorkspace` är redan implementerade och skyddade.

## Mål

Vänster/högersvep byter mellan Hem, Logg, Träning, Kunskap och Mer enligt befintlig ordning/no-wrap. Svepet ska fånga innan vertikal `ScrollView` när den horisontella riktningen är tydlig, men lämna lodräta drag/scroll till sidan. Snabba, avsiktliga flikar ska fungera även med kortare drag. Horisontella underregioner (åldersremsa, Tabs, anteckningar) behåller egna gester och exkluderingar. Ingen ny sidstate eller dataskrivning.

## Berörda filer

Kod: `src/components/AppPrimitives.tsx`, `src/components/ui/MainSwipeNavigation.tsx`, ny ren regelmodul `src/components/ui/main-swipe-rules.ts`. Tester: `tests/main-swipe-rules.test.mjs` och ett källkontraktstest i befintlig `tests/`-suite för capture/wiring, regionexclusion och `directionalLockEnabled`. Guide: `src/components/README.md`. Evidens: `docs/design/evidence/ui-main-swipe-2026-10-18/VERIFICATION.md`; plan/spec, queue, rapport och master log.

## UX-/tillståndskontrakt

| Gest | Acceptans |
|---|---|
| Tydligt vågrätt drag | Fångstfasen tar gesten när `abs(dx)>12` och `abs(dx)>2×abs(dy)`; vid släpp byts flik efter 48 React Native-layoutpunkter eller vid avsiktlig snabbgest på minst 24 layoutpunkter med vx ≥0.5 layoutpunkt/ms i samma riktning |
| Lodrät scroll/diagonal gest | Lodrät och diagonalt dominerad rörelse tas inte över; om rörelsen blir lodrät efter en tidig vågrät fångst lämnas gesten över så `ScrollView` kan fortsätta scrolla. Gränsvärdes-, axelbytes- och riktningsförhållandetester täcker reglerna. |
| Utesluten horisontell region | Befintlig synkron exkludering hindrar huvudflikens gestmottagare medan barnkontrollen äger gesten och återställs vid touch end/cancel/avmontering |
| Kunskapsdetalj/inaktiv sida | Befintlig `enabled`-grind styr; inga svep-callbacks medan funktionen är inaktiv |
| Flikar/ingen rundgång | Befintlig ordning, callback, aktiv skärm och gränserna i `ProductWorkspace` förblir oförändrade |

React Native `PanResponder` rapporterar `dx`/`dy` i layoutkoordinater och beräknar `vx`/`vy` per millisekund (installerad källa: `node_modules/react-native/Libraries/Interaction/PanResponder.js`). `ScrollView.directionalLockEnabled` aktiveras på sidans gemensamma lodräta scrollvy. Prioriteringen av inbyggda gester varierar mellan plattformar och rapporteras EJ TESTBAR utan faktisk appkörning/enhet, även om de rena regeltesten passerar.

## Skyddat

`ProductWorkspace`/`KnowledgeScreen`-sidtillstånd, åldersremsans intervall och callbacks, flikordning, BottomSheet-gestkod, lagring, innehåll, navigeringsregler och all annan UX. Ingen ny dependency eller ändring av produktscope.

## Verifiering

- Testa rena gränsfall: fångsttröskel, axelförhållande, långt drag, snabbgest, hastighetens tecken, otillräcklig rörelse, diagonal rörelse och båda riktningarna.
- Statisk kontraktskontroll: PanResponder använder de rena reglerna i fångst- och rörelsefas; grindar för inaktiv sida/uteslutna regioner finns kvar; lodrät `ScrollView` har `directionalLockEnabled`; anroparen använder fortfarande `nextMainTabDestination`.
- Testa uttryckligen att `onPanResponderTerminationRequest` använder senaste gestens `dx`/`dy` med `shouldClaimMainSwipe` och tillåter överlämning när regeln blir falsk. En redan fångad gest får inte hindra scrollen om den byter till lodrät/diagonal rörelse.
- Kör riktade tester, `CI=1 pnpm check`, `pnpm bundle:ios` för offentlig iOS-bundle, `git diff --check` och kövalidering. Ingen komponentinventering behövs.
- Visuell evidens: öppna samma representativa huvudflik före/efter ändringen, fånga jämförbara renderbilder och fyll i checklista enligt designreglernas §14. Kontrollera att gestbehållaren inte ändrar layouten; om körbar render saknas, spara skälet och markera den visuella jämförelsen EJ TESTBAR. Ändringen förväntas inte påverka utseendet.
- Prioritering av inbyggda gester, verklig lodrät scroll, nästlade flikar och svep på fysisk enhet är EJ TESTBARA i denna miljö utan app-runtime/enhet. Detta paket stänger inte den blockerade föräldrauppgiften `VISION-R02-GESTURES`; det verifierar enbart den lokala svepbeslutsregeln.

Architect och UX-kritiker granskar v5 före korrigerande kodändringar. QA och oberoende Reviewer granskar efter korrigeringen. Committa och pusha därefter checkpointen till den redan beställda funktionsgrenen.

## Planreview v3

- Architect: **APPROVE**, 2026-10-18. Bekräftade scope, React Native 0.86.3-API:er, visuellt före/efter-bevis och tydlig EJ TESTBAR-avgränsning för inbyggd gestprioritet.
- UX Critic: **PROCEED**, 2026-10-18. Måtten angavs i RN-layoutpunkter och hastigheten i layoutpunkter per millisekund, enligt installerad `PanResponder.js`; inga kvarstående usability- eller MVP-scope-invändningar.
- Ägarens mandat: bifogad patch samt tidigare beställning av swipeändringen i denna tråd, 2026-10-18.
- QA första v3-körning: **BLOCK** — obetingat nej till responder-överlämning kan hindra `ScrollView` efter att en först vågrät gest bytt till lodrät/diagonal rörelse. v4 lägger till uttrycklig överlämning och testkrav.
- Planreview v5 efter QA-korrigering: Architect **APPROVE** och UX Critic **PROCEED**, 2026-10-18. Arkitektens önskade statiska assertion av senaste `dx`/`dy` i överlämningshandlern lades till före denna review.

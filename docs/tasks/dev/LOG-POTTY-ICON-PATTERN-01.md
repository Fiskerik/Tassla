# LOG-POTTY-ICON-PATTERN-01 — skilj Kiss från Vatten, gör Mat grön och förbättra mönsterkortet

**Status:** done · **Planversion:** v5 · **Risk:** L
**Bas:** `6222307bd68647c75c4fbe95fadf7e7da654feca` (`knowledge/d3-catalog-delivery`)

## Mål och mandat

Ägarens återkoppling 2026-10-28: Kiss och Vatten använder i vissa vyer samma blå droppsymbol; långtryck för att ordna snabbval visar dessutom en annan Kiss-symbol än snabbvalet. Kiss ska få en gul ton och en tydlig symbol med tre synliga droppformer, identisk i snabbval, historik, redigering och layoutredigering. Nuvarande symbol ser ut som tre streck och ska ersättas med faktiska droppsilhuetter. Mat ska få grön kategoriaccent i Logga. Sammanfattningen av Kiss/Bajs längst ned på Logga ska bli lättare att läsa och se mer avsiktligt formgiven.

Ändra endast ikon/presentation och den existerande lokala sammanfattningens layout. Mat får Logg-lokal grön förgrund/yta (`green700`/`green100`) i snabbval, historik, händelsetypväljare och layoutredigering; ändra inte globala färger eller andra vyer. Kiss ska använda tre upprätta fyllda droppsilhuetter (spets upp, rund kropp nedåt; en över två), inte tunna roterade streck. Rita dem med den befintliga `react-native-svg`-dependencyen och behåll amberkontrast. Vatten behåller en blå droppe. Behåll händelsemodell, sammanräkning, medianintervall, filtergräns, ordning, labels och persistens. Ingen schema-, RPC-, backend-, innehålls- eller dependencyändring.

## Uppgiftskontrakt

- **Skrivägare:** koordinator ensam, branch `knowledge/d3-catalog-delivery`; ingen ny branch/worktree.
- **Granskning:** UI Critic BRIEF och Architect godkänner plan v5 före ny kodändring; UI Critic REVIEW efter render; oberoende QA och Frozen Reviewer efteråt. Godkännanden för v4 gäller inte det utökade Mat-/droppformsomfånget.
- **Modell:** roller använder sessionens konfigurerade standardmodeller; inga modell- eller resonemangsöverskrivningar.
- **Läsunderlag:** `.agents/skills/tassla-consumer-ux/SKILL.md`, `docs/design-rules.md` §4/8/14, `src/features/puppy-log/README.md`, `IconChip`, `ListRow`, `QuickLogTile`, `LogScreen` och `summarizePottyPatterns`.
- **Relaterat, ej blockerande:** `UI-MODAL-CENTER-01` är klar; `LOGGA-QUICK` är blockerad på en separat native-bildgranskning. Ingen av uppgifterna blockerar denna lokala ikon-/presentationsändring; native-grinden förblir öppen.

## Designbrief

- Vatten behåller en enda blå vattendroppe. Kiss använder en tydlig tre-droppars symbol med gul/amber-förgrund och ljusgul yta.
- Varje Kiss-droppe ska vara en upprätt SVG-silhuett med spets upptill och bred, rund kropp nedtill. I en 24-enheters viewBox är varje droppe cirka 7–8×9–10 enheter; en placeras ovanför två. Vid 20/24 pt syns tre separata droppar utan förstoring; avståndet mellan de två nedre dropparna är minst 1.5 pt vid 20 pt ikonstorlek. Ingen rotation eller konturlinje. Bygg med redan installerade `react-native-svg`, utan dependencyändring. Samma geometri gäller den mindre Kiss-markören i Olycka.
- Mat använder Logg-lokala `green700`/`green100` i samtliga Logg-lägen; beräknad färgkontrast är minst 4.5:1. Andra vyers/global category tokens ändras inte.
- Samma kategori ska rendera samma Kiss-symbol i alla Logga-lägen: snabbval, historik, eventtypväljaren och långtryckets layoutredigerare. Lägg till en opt-in `ListRow`-prop `iconVariant?: IconChipVariant` som standard lämnar nuvarande ikonvariant oförändrad; sätt `iconVariant="rev02-log"` endast för Loggs layoutredigerar-rader. Andra ListRow-callsites påverkas inte.
- Använd befintlig ikon-/färgtoken: mörk amber på ljusgul yta, med minst 3:1 symbolkontrast mot färgytan. Ikon är dekorativ när den följs av synlig etikett `Kiss`; tillgänglighetsnamn för knappen fortsätter att säga vad som loggas.
- Byt den nedre två-raders textlistan mot ett rent sammanfattningskort med en tvådelad rad per kategori: första raden har ikon, kategori och tydligt antal (exempel `3 gånger`); andra raden har sekundärt ungefärligt medianintervall. Använd diskreta radavdelare och låt intervalltext radbrytas vid stor text; undvik trippelkolumn eller tom kategorirad. Behåll ordalydelsen `ungefär`/`var`; kalla inte intervallet ett schema eller löfte.
- Behåll filtret `count >= 2`, befintlig lokala datakälla och exakt beräkningssemantik. Kortet ska fungera när bara Kiss eller bara Bajs har tillräckligt med loggar.

## Skrivvägar

- `src/components/ui/IconChip.tsx`
- `src/components/ui/ListRow.tsx`
- `src/theme/tokens.ts`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/puppy-log/README.md`
- `tests/log-screen-policy.test.mjs`
- `tests/log-calendar-policy.test.mjs`
- `tests/ui-library-policy.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-flow-log.py`
- `docs/tasks/dev/LOG-POTTY-ICON-PATTERN-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/log-potty-icon-pattern-01`

## Acceptans och verifiering

| Kriterium | Kontroll |
|---|---|
| Kiss har gul/amber yta och tre synliga uppåtriktade droppformer; Vatten har fortsatt en blå droppe | IconChip policy-/renderassertion och öppnad public/review RN Web-bild; spets och kropp ska gå att urskilja vid 20/24 pt, symbolkontrast minst 3:1. Kontrollera också liten Kiss-symbol i Olycka. |
| Mat är grön i samtliga Logg-vyer utan att globala/andra vyers färger ändras | Logg-token policytest; public/review browser assertions/capture för snabbval, historik, typväljare och layoutredigering; green700/green100-kontrast minst 4.5:1. |
| Symbol/färg för Kiss är samma i snabbval, rad, typväljare och layoutredigerare | Fixtureväg fångar snabbval, historik, långtryckets layoutredigerare samt öppnad händelsetypväljare; test säkrar `iconVariant`. |
| Patternkortet har tvådelade rader: ikon/kategori/antal och sekundärt intervall | Public/review capture 375/430 och 375×667/140%; enbart Kiss, enbart Bajs och båda kategorierna. Om ingen typ har count ≥2 ska hela patternsektionen vara dold. |
| Count, gräns och medianintervall är oförändrade | Befintliga modelltester och `tests/log-screen-policy.test.mjs`; ingen ändring i `summarizePottyPatterns` eller `formatInterval`. |
| Ingen overflow, borttappad label eller förlorad kontrast | 375/430/short viewport + 140%-proxy, accessiblity label assertions och §14 check. |
| Endast skrivvägar ändras | Path audit, `python -X utf8 tools/dev_flow.py validate`, `git diff --check`. |

Kör fokuserade Logg-/UI-/kalendertester (`tests/log-calendar-policy.test.mjs` täcker kategorifärger och droppformer), `CI=1 pnpm check` och `python -X utf8 tools/visual-check/verify-flow-log.py`; spara public/review-bilder och `RESULTS.json` i taskens evidence-katalog. Native VoiceOver/TalkBack, fysisk Dynamic Type och full LOGGA-QUICK-panelparitet är utanför och redovisas som NOT TESTABLE/öppet.

## Granskning

- UI Critic BRIEF v1: PROCEED; rekommenderade tvådelad rad, mörk amberkontrast och tre-dropparsymbol även i små vyer. Infört i v2.
- UI Critic BRIEF v2: PROCEED; granskade den exakta reviderade planen, loggrader och kontrastvillkor.
- Architect v2: CHANGES: full base SHA/model standards; dependencies must be related/nonblocking; define `ListRow.iconVariant` wiring and sparse hidden state. Incorporated in v3.
- Architect v3: APPROVE; all 14 plan/queue write paths match, opt-in `iconVariant` is scoped to Logg, sparse states are defined, and related tasks are nonblocking.
- UI Critic REVIEW v4: PASS for the initial surfaces; focused event-type-selector re-review PASS after settled public/review captures, confirming three-drop amber Kiss and blue single-drop Water.
- UI Critic BRIEF v5: PROCEED; use upright filled droplet silhouettes (24-unit SVG paths; approx. 7–8×9–10 units, one above two, no rotation), set only Logg food to green700/green100, and verify the smaller accident icon. Critic measured green contrast at 5.59:1. Incorporated in plan v5.
- Architect v5: APPROVE; exact 15 plan/queue paths match; `react-native-svg` 15.15.4 is already installed; green Mat is restricted to the Logg token variant; the Kiss paths cover Logg and the small Olycka mark; existing filter, calculations, ordering and persistence remain unchanged.
- UI Critic REVIEW v5: PASS on `v5-result.png` and the public/review renders. Confirmed readable three-drop Kiss in quick/history/layout/type-selector and Olycka, green Mat across Logg surfaces, Water still blue/single-drop, and the v4 pattern card retained.
- `CI=1 pnpm check`: PASS, 831 tests passed and 1 skipped; public/review Logg browser verification each 22/22 with zero page errors; §14 and §14.16 evidence updated for v5.
- Independent behavior/visual QA v5: PASS. Confirmed all 15 paths, consistent Kiss and Mat visuals, unchanged `count >= 2`/pattern logic, browser results, §14 scope, queue validation and diff check.
- Frozen Reviewer v5: PASS. Confirmed declared paths, stable selector captures, allowed §14 statuses and attribution of other approved tasks. Native/device limits remain NOT TESTABLE.
- Architect v4: APPROVE; all 15 plan/queue write paths match. The stale calendar-policy assertion update is limited to the new three-drop Kiss and single-drop Water paths; default token and contrast assertions remain.
- Beteende-/visuell QA v1: CHANGES for missing rendered event-type selector, aggregate `RESULTS.json`, full §14 checklist/§14.16 dimensions and attribution of concurrent approved task files. First three evidence gaps are now addressed; QA re-review requested. Concurrent task files remain separately declared and reviewed under their own plans on the existing branch.
- Beteende-/visuell QA v2: CHANGES for mid-transition type-selector screenshots. Captures were regenerated after the modal settled; the new owner-requested v5 visual changes are awaiting fresh plan approval before code.
- Frozen Reviewer v1: BLOCK for missing §14 checklist; §14 and six separate §14.16 dimensions were added.
- Frozen Reviewer v2: BLOCK for invalid `Delvis` statuses and mid-transition selector images. Checklist now uses only `Ja`/`Nej`/`Ej tillämpligt`/`NOT TESTABLE`; both captures were regenerated after the sheet and selector settled. V5 re-review follows the new scope.
- Ägaruppföljning v5 2026-10-28: Mat ska vara grön och Kissymbolen ska visa tydliga droppformer i stället för streck. UI Critic BRIEF v5 PROCEED och Architect APPROVE registrerade före implementering.

## Checkpoint

Plan v5 adds green Mat and distinct visible three-drop Kiss silhouettes while preserving the completed v4 pattern-card layout. The current [v5 comparison](../../design/evidence/log-potty-icon-pattern-01/v5-result.png) shows the changed quick view, layout editor and type selector. UI Critic BRIEF v5 is PROCEED; Architect APPROVE, UI Critic REVIEW, independent behavior/visual QA and Frozen Reviewer all PASS. `CI=1 pnpm check` and public/review browser evidence (22/22 each) pass. The scoped task is done. Native VoiceOver/TalkBack, Dynamic Type and device hit targets remain NOT TESTABLE.

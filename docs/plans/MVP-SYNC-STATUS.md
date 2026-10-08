# MVP-SYNC-STATUS – inventering mot målbilden

Datum: 2026-10-08  
Typ: läsbar inventering; ingen kod och ingen Figma-fil ändrad  
Källor: `AGENTS.md`, `docs/mvp.md`, `docs/design-rules.md` (inkl. §4–10, §14), `vision_rev01.jpg` (övre ”MVP – 6 skärmar”), `docs/tasks/dev/mvp-beta-delivery.md`, `docs/tasks/dev/queue.json`, `docs/plans/`, `docs/tasks/dev/`, `src/theme/tokens.ts`, `src/components/ui/`, `app/` och `src/features/`. Figma-API/läsverktyg var inte tillgängliga; Figma-uppgifter och planer används som sekundär källa och osäkra uppgifter markeras `okänt`.

## 1. Skärminventering

Räkningen nedan är mekanisk: `rg -n '#[0-9A-Fa-f]{3,8}' FIL | wc -l` och `rg -n 'fontSize\s*:' FIL | wc -l`. Räknade rader är inte en visuell kvalitetsbedömning. `ProductWorkspace.tsx` innehåller flera sidor; counts anges därför per faktisk fil, inte som påhittade per komponent.

| Målbildsskärm | Finns/rutt och MVP-scope | DS/tokens; hårdkodat | Laddar/tom/fel/normal; sparstatus | Tester; visuell QA | Saknas / konkreta avvikelser | Arbete/ordning |
|---|---|---|---|---|---|---|
| Hem | Finns som `HomePage` i `src/features/home/ProductWorkspace.tsx`, route `page='home'`, nås via `BottomNavigation`. Scope: ja, `docs/mvp.md` Skärm 1; P05 i `mvp-beta-delivery.md`. | Delvis: UI-komponenter används i workspace men HomePage har egna `Shortcut`, `MenuRow` och styles. `ProductWorkspace.tsx`: 2 hex-rader, 17 inline-fontSize-rader. | Loading/error/ready finns för innehåll och träning; tomt innehåll finns. Ingen enhetlig full skeleton/empty-state som målbilden kräver. Home har sparstatus för vissa underflöden, inte en samlad Home-sparhandling. | `content-delivery`, `profile-edit`, `app-screen-ux`, `workspace-data`; ingen skärmspecifik renderad QA: `NOT TESTABLE`. | Saknar målbildens tydliga hundkort med foto/platshållare och veckoremsa; dagens lista är text-/egenlayout snarare än ListRow/sektioner; innehållskorten är inte HeroCard/Card-matrisen i produktion. | **Stor**, ordning 1 efter beslut om veckoremsa/foto och publicerat innehåll. |
| Logga | Finns som `LogScreen.tsx`, route `page='log'`. Scope: ja, `docs/mvp.md` Skärm 2; LOGGA-planen och köposten. | Delvis/godkänd QUICK-slice: AppBar, QuickLogTile, ListRow, IconChip, Toast, Dialog, BottomSheet, Skeleton och tokens. `LogScreen.tsx`: 0 hex, 0 inline-fontSize. | Laddar, tom, första hämtfel, normal och partial-load-error finns. Pending/failed/unsure/saved/undo följer sparmönstret; ingen normal SPARAD-rad. | `log-model`, `log-screen-policy`; QA/reviewer kod PASS, visuell QA `NOT TESTABLE`. | Målbildens 2×2 + Fler är implementerad; edit är ännu inline/transitional och slutlig LOGGA-EDIT, skärmdumpar och native keyboard/fokus saknas. | **Medel**, ordning 2: visuell checkpoint, därefter LOGGA-EDIT. |
| Träning | Finns som `PublishedTrainingScreen.tsx`, route `page='training'`; preview har även `TrainingScreen.tsx`. Scope: ja, `docs/mvp.md` Skärm 3; P04/P05. | Delvis: produktionen använder AppPrimitives och egna styles, inte HeroCard/ChecklistItem/Progress överallt. `PublishedTrainingScreen.tsx`: 2 hex, 8 inline-fontSize; preview `TrainingScreen.tsx`: 4 hex, 12 inline-fontSize. | ProductWorkspace har loading/error/ready; publicerad vy har tomprogram/tomma steg och normal. Sparning visar `Sparar…`, fel/okänt hanteras i workspace, men feedback är delvis MessageCard. | `training-model`, `workspace-data`, `content-bundle`, `profile-edit`; ingen renderad QA: `NOT TESTABLE`. | Målbildens flikar, HeroCard-foto, Progress och ChecklistItem är inte konsekvent konsumerade i produktvyn; copy innehåller säkerhetsförbehåll och avviker från kort målbildston. | **Stor**, ordning 3 efter P04-innehållsbeslut. |
| Hälsa | Finns som `HealthScreen.tsx` route `health`, `PlannedHealthScreen.tsx` route `planned-health`, samt `HealthHistoryScreen.tsx` i stödflöde. Scope: ja, `docs/mvp.md` Skärm 4; P01/P03. | Delvis: egna formulär/kort och AppPrimitives; Tokens används inte genomgående. `HealthScreen.tsx`: 3 hex, 10 inline-fontSize; `HealthHistoryScreen.tsx`: 5 hex, 20; `PlannedHealthScreen.tsx`: 8 hex, 22. | Loading/empty/error/normal finns för vikt, historik och planerad hälsa. Pending/failed/unknown finns i workspace/healthflöden; flera statusar är MessageCard snarare än lokal Toast. | `health-weight`, `health-history`, `planned-health`, `planned-health-feedback`; ingen renderad QA: `NOT TESTABLE`. | Målbildens fyra tabs (Översikt/Vaccinationer/Veterinär/Vikt) är inte en enda sammanhållen Tabs-vy; visuellt finns fler underskärmar än referensen. En primary ”Lägg till händelse” och Figma-ikonchips är inte konsekvent sammansatta. | **Stor**, ordning 4 efter beslut om tab-IA och historik/planerad separation. |
| Kunskap | Finns som `KnowledgeScreen.tsx`, route `page='knowledge'`, från Mer och Home-innehåll. Scope: ja som Skärm 5 i `docs/mvp.md`; P04/P05. Exakt tabbredd/FAQ är inte separat godkänd. | Delvis: egna `Pressable`/styles och AppPrimitives. `KnowledgeScreen.tsx`: 1 hex, 11 inline-fontSize. | Loading/empty/error/normal finns; ingen write/sparstatus i själva läsvyn. | `content-delivery`, `content-bundle`, `draft-preview`; ingen renderad QA: `NOT TESTABLE`. | Målbildens flikar För dig/Artiklar/Checklistor/FAQ saknas som Tabs; produktionen visar ett urval/filterflöde. HeroCard/foto och tvåkolumnskort är inte målbildsparitet. FAQ/sökning är uttryckligen inte krav för stort bibliotek. | **Medel**, ordning 5 efter innehållsurval och tabbeslut. |
| Tassla-pass | Finns som `PassportScreen.tsx`, route `page='passport'`, från Mer. Scope: ja, Skärm 6; P06. | Delvis: AppPrimitives och egna styles. `PassportScreen.tsx`: 4 hex, 15 inline-fontSize. | Loading/empty/error/normal för ras/vikt/historik och export-resultat finns; export har busy/failed/unavailable/dialog-closed, inte klassisk `Sparar…` eftersom export inte är en server-write. `SPARADE UPPGIFTER` visas i förhandsvisning. | `passport.test.mjs`; ingen renderad QA: `NOT TESTABLE`. | Målbildens sheet med hundkort, foto, fyra informationsrader, fullbredds ”Dela som PDF” + ikonknapp är inte verifierad visuellt; fälturvalet är delvis valt i plan men bildens Foder/Allergier/Medicin är inte godkända nya datakällor. | **Stor**, ordning 6 efter fastställt fälturval och native PDF/delning. |
| Mer/Inställningar | `MorePage`, `AccountSettingsScreen`, `NotificationSettingsScreen`, `BetaInfoScreen` finns som `page='more'` och undersidor i `ProductWorkspace.tsx`. Scope: Mer är godkänd BottomNav-destination enligt `docs/design-rules.md`; konto/notiser/P10/P07 är separata stödpaket. Exakt målbildsskärm för Mer är `okänt`. | Delvis: ProductWorkspace `2 hex/17 fontSize`; `AccountSettingsScreen.tsx` `2/2`; `NotificationSettingsScreen.tsx` `0/0`; egna AppPrimitives. | Mer normal/signout-error; konto har idle/confirmed/failed/unknown/unavailable/blocked; notiser har permission/loading/saved/error. | `account-delete`, `notifications`, `app-screen-ux`; visuell QA `NOT TESTABLE`. | Målbildens femte tab är enkel; nuvarande Mer innehåller fler kontoadministrativa funktioner och länkar, utan verifierad motsvarande målbild. | **Medel**, ordning 7 efter övriga kärnytor; konto-/notisdata ska inte breddas utan beslut. |

**Samlad scopebedömning:** de sex ytorna är godkända i `docs/mvp.md`; det betyder inte att varje visuell detalj, tab, bild, fält eller kanal i referensbilden är godkänd. Ingen av skärmarna har renderad visuell QA i denna miljö.

## 2. Komponentmatris

Figma-ramarna kunde inte öppnas med läsverktyg i denna session. Följande Figma-kolumn bygger på `docs/tasks/dev/figma-design-system-01.md`, `docs/plans/FIGMA-DS-02.md`, designreglerna och den inspekterade målbilden; faktisk live-Figma-verifiering är `NOT TESTABLE`.

| Figma-familj | Kodstatus | Bedömning mot produktion |
|---|---|---|
| AppBar | Finns | Avviker: kod har även Close/Title-varianter utöver DS-planens Home/Back; Logga använder Title. |
| Tabs | Finns | Finns i biblioteket men används inte konsekvent på MVP-skärmarna. |
| BottomNav | Finns | Används i ProductWorkspace med fem destinationer; strukturell match, visuell QA saknas. |
| ListRow | Finns | Används i Logga; övriga skärmar använder äldre egna rader/kort. |
| Card | Finns | Används i Logga; produktionen har parallella kortstilar. |
| HeroCard | Finns | Bibliotek/galleri, inte belagt i produktions-Hem/Träning/Kunskap. |
| QuickLogTile | Finns | Används i Logga; målbildens fyra primära rutor är täckta. |
| ChecklistItem | Finns | Bibliotek/galleri; produktions-Träning använder inte konsekvent komponenten. |
| Progress | Finns | Bibliotek/galleri och import i workspace; produktionsanvändning mot målbilden ej belagd. |
| Toast | Finns | Logga använder truthful success/error/uncertain; andra flöden har äldre MessageCard/ActionFeedbackModal. |
| IconChip | Finns | Del av ListRow/QuickLogTile; saknas som konsekvent språk i äldre skärmar. |
| Field | Finns | Bibliotek/galleri; skärmar använder AppPrimitives/egna inputs. |
| CheckboxCard | Finns | Bibliotek/galleri; ingen belagd MVP-produktionskonsument. |
| Dialog | Finns | Logga använder den; andra raderings-/statusflöden använder native Alert/äldre modal. |
| BottomSheet | Finns | Logga använder den; Tassla-pass är inte belagt som målbilds-sheet i produktion. |
| EmptyState | Finns | Bibliotek/galleri; flera produktionsvyer använder MessageCard i stället. |
| SectionHeader | Finns | Logga använder den; övriga skärmar blandar PageHeading/egna rubriker. |
| StatusBadge | Finns | Bibliotek/galleri; produktionskonsumenter är inte belagda. |
| ActionMenu | Finns | Bibliotek/galleri; Logga använder ännu inline/native Alert för radering, LOGGA-EDIT återstår. |
| Skeleton | Finns | Logga använder skeleton; övriga loadinglägen använder ofta text. |
| DogCard | Saknas | Ingen fil/export; behövs för Hem/Tassla-pass enligt målbildens hundkort. |
| PhotoPlaceholder | Saknas | Ingen fil/export; behövs när hundfoto saknas utan tom grå ruta. |
| InfoBanner | Saknas | Ingen fil/export; använd endast efter beslut att användaren måste agera. |

Kodmatrisen verifierades med `rg --files src/components/ui` och symbolanrop med `rg -l`; den säger inte att komponenterna är visuellt Figma-paritetsgranskade.

## 3. Tokenparitet

| Område | Figma-underlag enligt plan | `src/theme/tokens.ts` | Avvikelse/status |
|---|---|---|---|
| Färger | Primitives + semantiska alias, kategorier pee/poop/food/sleep/awake/walk/training/vaccination/deworming/veterinary | Samma primitiva färger, semantiska färger och kategoripar | Strukturellt nära/exakt enligt planen; live-Figma `NOT TESTABLE`. `theme.colors` legacyduplicerar värden. |
| Spacing | 4/8/12/16/24/32 + layoutroller | Samma skala och layoutroller | Paritet i dokumenterade värden. Äldre skärmar bryter ändå genom egna marginaler/padding. |
| Radier | 8/14/20/999 | `sm/md/lg/full` = 8/14/20/999 | Paritet i värden; legacy `theme.radius` är aliasliknande men separat API. |
| Storlekar | touch 44, button/nav 56, icon 20/24, chip 32/44, stroke 1, progress 4, hero 200 | Samma | Paritet i värden; produktion använder inte alltid komponenterna. |
| Typografi | Figma-plan: Inter proxy, 24/20/16/14/16 och lineHeight 32/28/24/20/24 | Native systemfont via `Platform.select`, samma storlek/lineHeight, weights 400/700/800 | Avsiktlig avvikelse: Inter finns bara som Figma-proxy; appen har ingen Inter-dependency. `display` är alias av title, Figma-planen lämnar Display öppet. |
| Övrigt | Figma har semantiska bindings/scopes | tokens har bindings som JS-objekt men ingen live Figma-audit här | `okänt` om live bindings/scopes fortfarande matchar efter Figma Starter-gränsen. |

## 4. Öppna ägarbeslut

| Beslut | Underlag/status | Alternativ och konsekvens |
|---|---|---|
| Veckoremsa på Hem | Målbild/designregler kräver den; `docs/mvp.md` kräver inte explicit veckoremsa. | A: bygg 5-dagarsremsa, bättre målbildsparitet men mer navigation/tillstånd. B: avstå i MVP, mindre scope men konkret visuell avvikelse. |
| Kunskap-flikarna För dig/Artiklar/Checklistor/FAQ | Kunskap är godkänd; exakt tab-IA och FAQ är inte godkänd, stort bibliotek/sökning är uttryckligen utanför. | A: tre tabs utan FAQ, liten scope. B: fyra tabs inkl. FAQ, större innehålls- och QA-scope. |
| Hälsa-tabs Veterinär och Vikt | Hälsa/vikt/veterinärhistorik är godkända; exakt samlad tablayout är inte verifierad i kod. | A: konsolidera i fyra Tabs, bättre målbild men större migrering. B: behåll separata underskärmar, lägre risk men avvikande IA. |
| Tassla-passfält | Planen godkänner namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser; Foder/Allergier/Medicin från bilden är inte nya krav. | A: endast godkända ägaruppgifter, säker/liten scope. B: lägg till extra fält, kräver nya databeslut, minimisering och Compliance/Security. |
| PDF och delning | Erik har godkänt lokal PDF/förhandsgranskning/ägarinitierad delning i senare plan; fysisk native-layout är inte verifierad. | A: lokal fil + systemdelning, spårbart. B: bara förhandsgranskning i MVP, mindre integrationsrisk men saknar leveranslöftet. |
| Foto-uppladdning | Målbilden visar foto; designregler kräver platshållare om foto saknas. Ingen godkänd upload-/lagringsfunktion i `docs/mvp.md`. | A: neutral PhotoPlaceholder, inget datasyfte. B: foto-upload, kräver storage, samtycke, radering och nya data-/säkerhetsbeslut. |
| Notiskanal | Äldre MVP-text lämnar kanal öppen; senare plan/Erik-beslut godkänner lokala notifieringar. Native leverans och telefonprov är fortfarande inte belagda. | A: fortsätt lokala notifieringar med explicit permission/status. B: datumstyrd appvisning utan push, mindre native-scope men svagare retentionhypotes. |
| Hundkort/DogCard | Målbilden kräver återanvändbart hundkort men kod saknar komponent. Ingen separat godkänd komponenttask hittad. | A: skapa delad DogCard inom P05/P06, bättre paritet. B: fortsätt egna kort, snabbare men mer designsystemskuld. |

## 5. Föreslagen ordning för återstående MVP

1. **MVP-SYNC-01 beslut och baslinje:** Erik låser veckoremsa, tabs, foto och Tassla-passfält. Beroende: denna inventering. Granskning: Product/Critic, Architect vid strukturell ändring.
2. **MVP-UI-FOUNDATION-01:** DogCard, PhotoPlaceholder, InfoBanner endast om beslutade; migreringskontrakt mot befintliga tokens. Beroende: 1; QA + visuell evidens.
3. **LOGGA-RENDER-01/EDIT:** native preview, skärmdumpsmatris, sedan edit/delete-sheet enligt befintlig LOGGA-kö. Beroende: 2 endast om shared components behövs; LOGGA-QUICK blockerad tills renderad QA.
4. **MVP-HEALTH-01:** konsolidera/eller dokumentera Tabs och verifiera Översikt/Vaccinationer/Veterinär/Vikt. Beroende: ägarbeslut 1, P01/P03; Security/Compliance vid dataändring.
5. **MVP-CONTENT-01:** lås publicerat urval, åldersfaser och tab-IA för Hem/Kunskap; använd samma versioner. Beroende: P04 innehållsgranskning och ägarbeslut om FAQ.
6. **MVP-TRAINING-01:** migrera HeroCard/Progress/ChecklistItem och verifiera progression/sparstatus. Beroende: publicerat innehåll från 5.
7. **MVP-PASS-01:** fastställ previewfält, PDF-HTML, native export/delning och filstädning. Beroende: 1, hälsodata från P01–P03, Security/Compliance.
8. **MVP-MORE-01:** konsolidera Mer/konto/notiser med godkänd IA och ärliga statusar. Beroende: 1 och P07/P10-beslut.
9. **MVP-BETA-QA-01:** sammanhängande Home → Logga/Träning/Kunskap/Hälsa → Pass, nätfel, session/hundbyte, two-account isolation, native kritiska prov. Beroende: 2–8; QA/Reviewer/Security/Erik.

## 6. Teknisk skuld och verifieringshinder

- **Två blockerande `pnpm check`-fel:** (1) `tests/notifications.test.mjs` misslyckas i spawnat Stockholm-DST-test med tom stdout/JSON; test och notification-källor är oförändrade från `37bf93f`. (2) `tests/ui-library-policy.test.mjs` förväntar `deworming: 'medical-outline'` medan baseline `src/components/ui/IconChip.tsx` har `bug-outline`; också oförändrat från `37bf93f`.
- **Lint-backlog:** senaste fulla lint kördes i tidigare checkpoint med 214 varningar, 0 fel; äldre featurefiler innehåller hårdkodad hex och inline `fontSize`. Inventeringen räknar exempelvis ProductWorkspace 2/17, PublishedTraining 2/8, HealthScreen 3/10, PlannedHealth 8/22, HealthHistory 5/20, Knowledge 1/11 och Passport 4/15.
- **Verifieringsmiljö:** ingen iOS-simulator, Android `adb`/emulator eller installerad `react-dom`/`react-native-web`; renderad skärmdumpsmatris och stor-text/safe-area/fokus/keyboard är `NOT TESTABLE`. Figma-läsverktyg/MCP var inte tillgängliga; live Figma-frame, binding och komponentstatus är därför `okänt` utöver planfilerna.
- **Designsystemskuld:** 24 efterfrågade Figma-familjer är inte lika med 24 produktionskonsumenter. DogCard, PhotoPlaceholder och InfoBanner saknas helt; många befintliga skärmar använder AppPrimitives och egna styles parallellt med `src/components/ui/`.

## Inventeringsmetod och explicit stopp

Ingen kod, ingen Figma-fil och inga produktionsdata ändrades. Underlag som inte kunde hittas: ingen separat live-Figma-read i denna session; ingen `docs/design/malbild.png` (designreglerna hänvisar till `vision_rev01.jpg` i roten). Denna rapport är en synk-/beslutsinventering, inte ett visuellt godkännande eller ett påstående att MVP:n är betaredo.

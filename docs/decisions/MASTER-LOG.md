# Tassla — samlat besluts- och leveransregister

Status: kanonisk sammanfattning för produkt-, design- och utvecklingsagenter. Baslinje för branchuppdateringen: codex/ux-rethink-2026-10-15 @ 2e230be44c1bdd74e74173064fdce5e60e7e9dbc. Senast sammanställd 2026-10-22.

Läs denna fil först när ett beslut eller tidigare paket efterfrågas. Läs sedan bara den länkade detaljplanen för uppgiften. Vid konflikt gäller senaste uttryckliga ägarbeslutet och den aktuella posten här. De numrerade beslutsfilerna behålls som historiska underlag; de är inte separata, uppdaterade styrkällor. Detaljerade testresultat finns i respektive task- och releaseunderlag.

## Aktuella ägarbeslut

### Stack och leveransbas

**Beslut 0001, 2026-10-04 — accepterat.** Expo, React Native, TypeScript, Expo Router, Supabase och Codemagic; iOS först. Stackbeslutet aktiverar inte en särskild integration, driftbudget, release eller databehandling. SQLite/offline, CMS-val och notifieringskanal kräver sina särskilda beslut. Hunddata ska isoleras med ägarskap/RLS; QR-attribution ger inte uppfödare åtkomst.

Källa: [0001-stack.md](0001-stack.md).

### Autentisering

**Beslut 0003, 2026-10-04 — accepterat med tillfälligt testundantag.** E-post med engångskod är målet. Magic link är uttryckligen tillåten tills SMTP gör kodmallen möjlig. Samma kontoidentitet ska bestå; klienten får inte slå ihop konton enbart på matchande e-post. Google är en separat authutökning och kräver verifierad identitetslänkning/callback innan den exponeras. Secrets och tokens lämnar inte säkra lagrings- och logggränser.

Källa: [0003-auth.md](0003-auth.md). Beslutet är inte bevis på fungerande runtime.

### MOTION-paket

**Beslut 0004, 2026-10-10 — accepterat.** Mikrorörelse, förstaanvändningstips och positiv/neutral valpfigur är godkänd scope. Använd React Natives inbyggda Animated; inga nya rörelseberoenden. Figuren får inte signalera sjukdom, skuld eller besvikelse.

**Beslut 0005, 2026-10-10 — accepterat undantag från 0004.** Lokala checkpoints, QA och Reviewer krävs per slice, men fysisk mobilkontroll får samlas till en senare gemensam mobil-QA-runda. Uppskjutna native-/telefonprov står som NOT TESTABLE tills de faktiskt körts.

Källor: [0004-motion-package.md](0004-motion-package.md), [0005-motion-batched-mobile-qa.md](0005-motion-batched-mobile-qa.md). Beslut 0005 ändrar bara samordningen av telefonprovet.

### MVP och användarresor

**Ägarbeslut 2026-10-15.** Samtliga åtta paneler i vision_rev02.jpg är obligatoriska, funktionella MVP-mål: Hem, Utveckling, Dagens framsteg, daglig Checklista, Logga, Träning, Kunskap och Insikter. Leveransmodellen är kompletta användarresor i små checkpoints. Granskningen är riskbaserad. Hela referensen omfattas; bildens exempeldata och råd är inte datakällor.

Varje resa ska nås i appen, utföra en verklig uppgift med korrekt källa, visa bekräftat eller ärligt okänt resultat och återvända med bekräftad data intakt. Alla synliga filter, perioder, mål, diagram och destinationer behöver faktisk funktion för att panelen ska bli klar. Bevara de ursprungliga sex användarområdena samt Hälsa, Tassla-pass, konto, onboarding, samtycken, notifieringar, distribution och mätning. Beslutet lägger inte till nya persondataändamål, kostnader, migrationskörningar, partneråtkomst eller publicering.

Källor: [MVP EXPERIENCE CONTRACT](../MVP-EXPERIENCE-CONTRACT.md), [MVP](../mvp.md), [utvecklingsflöde](../dev/workflow.md), [panelkontrakt](../design/vision-rev02-screen-contracts.md). Källa: Eriks uttryckliga beslut i konversationen ”GAP analys Tassla MVP”, 2026-10-15; fastställandet återges i den här sammanslagna posten.

## Risknivå för granskning

- **L:** lokal presentation/copy utan ändrad persistens eller semantik. Riktad funktions- och visuell QA, därefter oberoende Reviewer.
- **M:** ändrad användarresa eller befintlig datahantering. Prova lyckat, fel och osäker status, visuell QA och oberoende QA/Reviewer.
- **H:** auth, RLS, konto/hundscope, migration, radering, hälsa, notifiering, nya persondataändamål, extern integration eller oklar datamodell. M-bevis plus relevanta Architect/Security/Compliance/Dog Expert-granskningar och riktig integration där acceptansen kräver det.

Höj risk vid osäkerhet. pnpm check, föreskrivna kögrindar och oberoende Reviewer gäller fortsatt. Rapportera lokal render, kodtester, live DB/RLS, native/telefon och release separat. NOT TESTABLE är inte PASS.

## Leveransregister

Nya paket förs in i denna fil när deras queue-status övergår till done. Koordinatorn sammanfattar det faktiska utfallet efter oberoende Reviewer-pass och före den slutliga done-checkpointen. Varje post anger paket-ID, mål/ändrade delar, faktisk status, kontroller och resultat, QA/Reviewer/Security-verdict där relevant, commit eller dokumenterad checkpoint samt öppna luckor. Skilj lokal PASS, ägarrapport, live runtime och release. Länka taskens fulla underlag i stället för att kopiera långa loggar. Korrigera en post med datum och rättelse; skriv inte om historien tyst.

### Paket som redan är klara enligt vald branch

Följande är lokala köstatusar på 2e230be, inte ett påstående om live databas eller native verifiering. Fulla bevis och begränsningar finns i task- och renderunderlagen.

| Paket | Status på basbranchen | Sammanfattad leverans och kvarstående gräns |
|---|---|---|
| VISION-R02-1 | done | Hem-referens och delade aktivitetskomponenter; se köposten. |
| VISION-R02-2 | done | Ägarvalda dagsrutiner och källhärledd träningsprogress. Lokala public/review-renderingar verifierades; Supabase/RLS och native kvarstår. |
| VISION-R02-3 / 3B / 3C | done | Logga, Träning och Kunskap har avgränsade visuella migrationsposter. De stänger inte automatiskt hela panelresan. |
| VISION-R02-4A–4H | done | Stödskärmar har rev02-migreringar, bland annat hälsa, pass, profil, påminnelser, konto och onboarding. |
| UX-CONTINUE-CARD-01 | done | Panel 6:s fortsättkort renderat och granskat; native/Dynamic Type och liveprogress är separata kontroller. |
| UX-LOG-EDITOR-01 | done | Loggeditor, återhämtning, legacy-status och delta-review passerade lokala kontroller; native och live RLS ej testade. |
| UX-WORKSPACE-RETENTION-01 | done | Scopead in-memory data mellan flikar; lokal QA/Reviewer enligt rapport. Detta bevisar inte live databasretention. |
| UX-KNOWLEDGE-CACHE-01 | done | Scopad checklistcache och review-gating; runtime sign-out/servergränser separat. |
| UX-TRAINING-UNMARK-01 | done | Källstyrd avmarkering med readback och scope fence; Supabase/RLS och native separat. |
| HOME-ROUTINE-WEEKDAYS-01 | done | Veckodagsval och legacy NULL-regel; migrationen är inte applicerad och runtime-paritet ej verifierad. |
| HOME-ROUTINE-CHECKLIST-01 | done | Kompakt rutinhall och Hem-åtgärder passerade oberoende QA/Reviewer efter att helraderingsbekräftelsen korrigerats; fullskärmsresan för panel 4 är fortfarande separat. |
| VISION-R02-HEM-01 | done | Lokal Home/panel 1-checkpoint: pil-only till Checklistor och rutin-longpress-redigering. Commit `1b22370` pushad; QA/Reviewer PASS. Native/live/release kvarstår NOT TESTABLE. |

Tidigare MVP- och byggpaket har detaljerad historik i [HISTORY-2026.md](../releases/HISTORY-2026.md). Denna tabell ersätter inte dess exakta commit- och QA-notiser. Nya rev02-paket och efterföljande slutförda tasks får en egen post ovan med verkliga resultat.

## Beslut som inte följer automatiskt

- Planerad lokal notifiering innebär inte godkännande av remote push eller valfri notifiering.
- Raskatalog kräver källsnapshot med återanvändningsrätt; saknad licens eller data håller just den delen blockerad.
- Reviewinnehåll får inte visas som publicerat innehåll.
- Veckomål, utvecklingsmilstolpar, sömnperioder och grafvärden behöver definierade källor och komplett urval.
- Lokal dokumentation eller syntetisk UI-fixture godkänner inte migration, persondatabehandling, telefonprov, betapilot, TestFlight eller release.

## Historiska källfiler

Följande behålls för spårbarhet. Läs sammanfattningen ovan först; originalen är inte separata aktuella instruktioner:

- [0001-stack.md](0001-stack.md)
- [0003-auth.md](0003-auth.md)
- [0004-motion-package.md](0004-motion-package.md)
- [0005-motion-batched-mobile-qa.md](0005-motion-batched-mobile-qa.md)
- [0000-template.md](0000-template.md) — endast mall, inte ett godkänt beslut.

### HOME-ROUTINE-CHECKLIST-01 — lokal UI-slice klar, 2026-10-15

Rutinhallen har en gemensam kompakt yta, samlad redigering, sanningsenlig upprepning, dagsval och bekräftad helradering. Raderingsbekräftelsen anger nu att rutinen, dess dagskopior och sparade överhoppningar tas bort. Oberoende QA PASS och Reviewer PASS. App-/edge-typecheck, full ESLint och Node-testsviten passerade igen; 492/492 tester. Checkpoint: committen `fix: clarify routine deletion cascade` på `codex/ux-rethink-2026-10-15`. Underlag: [taskrapport](../tasks/dev/rapport.md) och [renderunderlag](../design/evidence/vision-rev02/routine-checklists/RENDER-REPORT.md). Live Supabase/RLS/migration, native Alert/tillgänglighet och fullskärmslistans filter är inte verifierade; denna slice stänger inte hela panel 4.

### CONTENT-PUBLISH-LABEL-01 — lokal kodcheckpoint, 2026-10-18

AI-ursprungsflaggan och svenska etiketten är implementerade för öppnade kunskapsartiklar, träningsprogram och träningssteg. SQL-artifakterna täcker 10 godkända runtimeversioner; `before-homecoming` behålls som draft. Content-bundle-validering, `pnpm check` (493/493), iOS JS-bundle-export och `git diff --check` passerade. Architect, Security, oberoende QA och Reviewer PASS för lokal/static granskning. Fjärtdatabas är NOT TESTABLE i denna miljö: saknas verifierad Supabase-anslutning/CLI/credentials, och ingen databas har ändrats. Fulla bevis och migrationsordning: [paketrapport](../tasks/dev/rapport.md) och [plan](../tasks/dev/CONTENT-PUBLISH-LABEL-01.md).


### UI-SHEET-ACTIONS-01 — lokal gestimplementation och UX-plan, 2026-10-18

BottomSheet kan dras ned via handtag/rubrik, med befintliga stängningsspärrar och rätt lifecycle-/reduced-motion-städning. Komplett statisk actioninventering (120 källfiler/416 platser) och framtida text-/ikon-/UX-paket finns i [paketplanen](../plans/UI-UX-NEXT-PACKAGES-2026-10-18.md). Architect APPROVE, Critic PROCEED, oberoende QA PASS och Reviewer PASS. 24 riktade tester, full pnpm check 517/517, public iOS JS-bundle, inventeringsregenerering, whitespace och kövalidering PASS. Kodcheckpoint i arbetsdiff, ingen commit/push. Native gest/tangentbord/VoiceOver och rev02-visuellt är NOT TESTABLE; caller-guards är källgranskade, inte testade som hela appflöden. Fullt underlag: [task](../tasks/dev/UI-SHEET-ACTIONS-01.md) och [evidens](../design/evidence/sheet-actions-2026-10-18/VERIFICATION.md). Nästa föreslagna paket är 1a, gemensamma Ångra-/datum-/tidskontroller.


### UI-ACTIONS-COMMON — lokalt verifierat, 2026-10-18

Gemensamma ikonåtgärder för bekräftad logg-undo, datum och tid enligt plan v2. Toastens alertmeddelande och undo-knapp är separata tillgänglighetselement; datumdialogen ryms för sju 44pt-dagceller vid 375pt. Architect APPROVE, UX Critic PROCEED. Oberoende QA PASS (12/12) och Reviewer PASS, utan blockerare. Riktade tester 12/12, `CI=1 pnpm check` 521/521, public iOS JS-export, inventory (121 filer/0 parsefel/416 actions), whitespace och queue validation PASS. Native/VoiceOver/visuell rendering NOT TESTABLE. [Paket och verifiering](../tasks/dev/UI-ACTIONS-COMMON.md), [evidens](../design/evidence/ui-actions-common-2026-10-18/VERIFICATION.md).

### UI-MAIN-SWIPE-01 — lokal swipe-regelcheckpoint, 2026-10-18

`MainSwipeNavigation` fångar nu tydliga horisontella rörelser tidigt, byter flik efter långdrag eller riktad snabbgest och lämnar en redan fångad gest när rörelsen upphör att vara tydligt horisontell. `AppScreen` aktiverar riktningslåsning. Inre horisontella regioner, knowledge-detail-gate, enabled-gate och befintlig huvudflikordning/no-wrap är bevarade. BottomSheet-delarna av den bifogade patchen var redan implementerade i nyare variant och ändrades inte.

Arkitekt APPROVE och UX Critic PROCEED för slutlig plan v5. Första QA-körningen blockerade ovillkorlig respondervägran som kunde hindra lodrät scroll efter axelbyte; korrigering godkändes i plan v5. Efter fix: riktade tester 8/8, `pnpm check` 529/529 och offentlig iOS JS-bundle PASS. `git diff --check` och queue validation PASS. Oberoende QA PASS och Reviewer PASS för lokal kod-/källpolicy.

Visuell jämförbar skärmbild kunde inte tas eftersom installerad Chromium misslyckade att starta på grund av Windows side-by-side-konfiguration. Faktisk native touchprioritet, lodrät scroll, inre kontroller och enhetssvep är EJ TESTBARA; `VISION-R02-GESTURES` förblir blockerad för dessa runtime-/visuella verifieringar. Detta checkpoint bevisar inte nativegestbeteende. Underlag: [plan](../tasks/dev/UI-MAIN-SWIPE-01.md), [verifiering](../design/evidence/ui-main-swipe-2026-10-18/VERIFICATION.md).


### UI-TRAINING-OVERVIEW-01 — ägarbeställd lokal träningsöversikt, 2026-10-19

Eriks uttryckliga begäran att implementera träningsredesignpatchen godkänner en avgränsad kompositionsavvikelse från rev02 Panel 6. Nästa övning och statusordnad programlista ersätter segmenterade flikar/bildkort i träningsöversikten. Detta beslut gäller bara den här skärmen och innebär inte att rev02-panelens fulla visuella acceptans är uppfylld. Oberoende QA och Reviewer PASS för lokal/static omfattning; live Supabase/RLS och native/enhetsbeteende är NOT TESTABLE. Checkpoint `b59169c` är pushad till `origin/`codex/tassla-ui-ux-bundle-2026-10-18. Se [paketrapport](../tasks/dev/rapport.md), [sluthistorik](../releases/HISTORY-2026.md#ui-training-overview-01) och [verifiering](../design/evidence/ui-training-overview-2026-10-18/VERIFICATION.md).
## UI-ACTIONS-ROWS — checkpoint 2026-10-19

Paket 1b är avslutat med oberoende QA PASS och Reviewer PASS. Ändringarna gäller rutinhallens ikonpennor/veckodagar och loggens kompakta händelsetypväljare. Lokal check och offentlig JS-bundle passerar; syntetisk visuellt/interaction-underlag är avgränsat och native-/produktionsgränser är uttryckligen NOT TESTABLE. Full panelacceptans hävdas inte. Nästa UI/UX-paket är 2a; den fullständiga öppna releaseinventeringen finns i den aktuella [UI/UX-planen](../plans/UI-UX-NEXT-PACKAGES-2026-10-18.md) och MVP-leveransplanen.


### UI-ACCESSIBILITY-HOME-LOG (2a) — lokal verifierat, 2026-10-19

Home-/dagsradsförbättringarna är implementerade enligt plan v4. Oberoende QA PASS och Reviewer PASS. Exakt fokuserad svit 22/22; QA:s utökade svit med `home-today` 25/25; full `pnpm check` 545/545; public iOS JS-export 1 446 moduler; syntetisk RN Web-interaktion/render, diffcheck och kövalidering PASS. Native/VoiceOver, Dynamic Type på enhet, live Supabase/RLS, signerad build och fullskärmsvisuell acceptans är NOT TESTABLE. Implementationens checkpointcommit är `c58f3fd` (`fix: improve home daily activity accessibility`); dokumentations-/releaseposten följs upp i nästa commit. Nästa paket är `UI-MAIN-TAB-TRANSITION`. Underlag: [rapport](../tasks/dev/rapport.md) och [evidens](../design/evidence/ui-accessibility-home-log-2026-10-19/VERIFICATION.md).

### UI-MAIN-TAB-TRANSITION — lokal checkpoint QA/Reviewer PASS, 2026-10-19

Huvudflikarnas riktningsstyrda övergång använder 28pt; stödvyerna behåller 8pt. QA och Reviewer PASS, full lokal check 547/547 och syntetisk riktnings-/reduced-motion-evidens finns i [rapporten](../tasks/dev/rapport.md) och [verifieringen](../design/evidence/ui-main-tab-transition-2026-10-19/VERIFICATION.md). Native touch, OS-reducerad rörelse och bildfrekvens är NOT TESTABLE. Implementationens checkpointcommit är `0d4ecad` (`feat: add directional main tab transition`).


### UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS (2b.1) — verifierat lokalt

Responsiv layout för rutinens peer actions och notisernas informationsrad. Independent QA PASS (47/47 targeted), Reviewer PASS, Security pre-review plus frozen-diff re-review APPROVE. `pnpm check` 549/549, public iOS JS bundle 1,446 modules, synthetic RN Web screenshot/interaction evidence PASS. No persistence, scope, permission timing or callback contract changed. Native/device/backend checks and full rev02 visual acceptance remain NOT TESTABLE. See `docs/design/evidence/ui-accessibility-routines-notifications-2026-10-19/VERIFICATION.md`. Implementation checkpoint: `5ee2065be80d28221eff8914203b38419eb2f119` (`fix: improve routine and reminder layouts`).

### UI-ACCESSIBILITY-HEALTH (2b.2) — avgränsad lokal UX-förbättring, 2026-10-19

Godkänd behandling av befintlig UI vid smal vy/stor text: stapla hälsans viktåtgärder, lägga historikens informationshandling under rubriken och låta datumfältets TextInput krympa så kalenderknappen stannar inom ramen. Säkerhetsgränserna är oförändrade: ingen medicinsk rådgivning, data-/scope-/lagringsändring, ny behörighet eller ny persistence. Oberoende QA PASS, Reviewer PASS samt Security pre-/final APPROVE. Native/backend/build och full panelacceptans är NOT TESTABLE. Se [paketrapport](../tasks/dev/rapport.md) och [verifiering](../design/evidence/ui-accessibility-health-2026-10-19/VERIFICATION.md).


### UI-ACCESSIBILITY-PASSPORT (2b.4) — plan amendment v6, 2026-10-19

Architect **APPROVE WITH CONDITIONS**: split local Passport source/test acceptance from deferred rendering and native share/accessibility acceptance. Close only the local implementation checkpoint after static QA, Reviewer, frozen-diff Security, checks and commit; keep 375×667/140%, §14, native share, Dynamic Type, VoiceOver/TalkBack, focus and target bounds OPEN / NOT TESTABLE until device evidence.

UX Critic **PROCEED**: preserve owner-initiated export and selection consent; native verification must confirm selection persists and the preview/PDF contains only selected sections. Dismissing share is not delivery. Security pre-review **APPROVE** for responsive layout only; preserve selected snapshot, owner/dog lifetime, export/share destination/options, file cleanup and all recovery semantics. No code changed during this plan amendment. See [phase plan v6](../tasks/dev/UI-ACCESSIBILITY-PHASE-2-5.md) and queue `UI-ACCESSIBILITY-PASSPORT`.

#### Slutlig checkpoint — UI-ACCESSIBILITY-PASSPORT (2b.4), 2026-10-19

Passport-vyn anpassar rubrik, valrader, förhandsvärden och informationsyta vid smal bredd eller stor text; varje valruta har ett tydligt tillgänglighetsnamn som innehåller sektion och detalj. Urval, samtycke, fryst PDF-snapshot, hund-/kontoscope, delningsmål, filrensning och återkopplingssemantik är oförändrade.

Architect APPROVE WITH CONDITIONS för lokal implementation checkpoint enligt plan v6; UX Critic PROCEED; Security pre-review och fryst-diff final APPROVE. Oberoende QA PASS (riktad svit 32/32; full pnpm check 555/555); Reviewer PASS. pnpm bundle:ios exporterade 1 446 moduler; git diff --check och python -X utf8 tools/dev_flow.py validate PASS. Commit- och push-hook passerade typecheck, edge-typecheck, lint och 555/555 tester. Commit 4ffa107 (fix: improve passport accessibility layout) är pushad till origin/codex/tassla-ui-ux-bundle-2026-10-18.

RN Web/DOM saknas, så renderad kontroll 375×667/140%, §14-visuell acceptans, native PDF-/share-sheet, VoiceOver/TalkBack, Dynamic Type, fokusordning och uppmätta mål är OPEN / NOT TESTABLE och överförda till UI-NATIVE-ACCESSIBILITY-VERIFY. Detta stänger endast lokal kodcheckpoint; ingen native eller fullskärmsacceptans hävdas. Nästa paket: UI-KNOWLEDGE-SEARCH (3).
### UI-KNOWLEDGE-SEARCH — plan amendment v7, 2026-10-19

Architect **APPROVE WITH CONDITIONS** for a local source/test implementation checkpoint only. The task's originally required rendered 375/430 search-result, no-result, loading, error, dog-switch evidence and §14 review remain OPEN / NOT TESTABLE because react-native-web and react-dom are absent. UX Critic **PROCEED WITH CHANGES**: name the current dog in search scope copy and input label; distinguish no published articles from no matches; retain query through loading/error/retry and article open/back; clear on dog switch or synchronously filter only the new dog's eligible items. Keep NFC, Swedish lowercase and whitespace normalization; å/ä/ö remain distinct from a/o. Search only the already-supplied published, age/breed-filtered active-dog items; no fetch, schema, taxonomy, or dependency changes. Exact visual and dog-switch checks are transferred to UI-NATIVE-ACCESSIBILITY-VERIFY. Security review is not required because risk class M and no persistence/scope/network contract changes.

### UI-KNOWLEDGE-SEARCH — lokal checkpoint, 2026-10-19

Architect v7 och UX Critic godkände local-only checkpoint med sökning begränsad till KnowledgeScreen items för aktiv hund. Oberoende QA PASS och frozen-diff Reviewer PASS. Full lokal check 564/564 och public iOS JS-export 1 447 moduler passerade. Viewport-, native-, §14- och deviceacceptans är fortsatt OPEN / NOT TESTABLE och överförd till UI-NATIVE-ACCESSIBILITY-VERIFY. Ingen data-/schema-/fetchändring. Nästa paket i ordning är UI-REFRESH-HOME-LOG.

### UI-REFRESH-HOME-LOG — lokal checkpoint, 2026-10-19

Architect v4 APPROVE, UX Critic PROCEED; Security pre-review APPROVE WITH CONDITIONS och fryst-diff final APPROVE. Oberoende QA PASS och Reviewer PASS. Hem och Logg har opt-in RefreshControl, samma-scope läsning, behållna bekräftade rader och återförsök utan att dölja olösta skrivningar. Både första sida och äldre Logg-sidor avbryts/fencas vid konto-/hundbyte. Riktad svit 11/11; `pnpm check` 571/571; publik `pnpm bundle:ios` 1 447 moduler; `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS. Commit `0c1c345` (`feat: add Home and Log pull-to-refresh`) är pushad till `origin/codex/tassla-ui-ux-bundle-2026-10-18`. Renderad refresh-/felvy vid 375/430, §14 och native pull-gesture är NOT TESTABLE i denna miljö; ingen live Supabase/RLS eller signerad build verifierades. Se [verifiering](../design/evidence/ui-refresh-home-log-2026-10-19/VERIFICATION.md). Nästa paket är UI-EMPTY-FEEDBACK-HOME-LOG (5a).

### UI-EMPTY-FEEDBACK-HOME-LOG — 5a, 2026-10-19

- Scope: sanningsenliga tom-, laddnings-, fel-, osäkra skriv- och partiella pagineringslägen för Hem och Logg; endast befintliga vägar.
- Verifierat: fokuserat Node-test 23/23; pnpm check (typecheck, edge typecheck, ESLint, 577/577) PASS; offentlig pnpm bundle:ios (1 447 moduler) PASS; git diff --check och python -X utf8 tools/dev_flow.py validate PASS.
- Renderad evidens: syntetisk stateful RN Web-fixture visar Logg tomläge → väljare → bekräftad Vatten-rad/toast. Den separata tempadapter som behövdes ligger utanför repot och verifierar inte live Supabase/RLS.
- Verdicts: oberoende QA PASS för lokal acceptance. Första Reviewer-granskning BLOCK endast på dokumentationskonsistens, utan kodfynd; efter rättning gav slutlig Reviewer **PASS**.
- Öppna gränser: native VoiceOver/TalkBack, Dynamic Type, riktiga enhetsytor, live Supabase/RLS, signerad build och full rev02-jämförelse är NOT TESTABLE.
- Checkpoint: commit 67424a4 (feat: improve empty-state feedback for home and log) pushad till origin/codex/tassla-ui-ux-bundle-2026-10-18 efter hook-PASS. Nästa: 5b UI-EMPTY-FEEDBACK-KNOWLEDGE-TRAINING.
- Nästa: 5b UI-EMPTY-FEEDBACK-KNOWLEDGE-TRAINING efter denna checkpoint.


## FLOW-HOME-CHECKLIST-01 — lokal Idag-slice, 2026-10-20

Implementera checklistans fulla Idag-resa som en underordnad Hem-vy med samma konto-/hund-/dag-/tidszonscope och bekräftade datakällor. Visa inga Denna vecka/Alla/Kommande-filter innan verkliga urval och fullständig paginering finns; de tillhör `FLOW-HOME-CHECKLIST-FILTERS-01`. Träningsdetaljen börjar överst; scrollposition bevaras endast inom checklistflödet och rensas vid exit eller scope-/dygnsinvalidering. Inga parallella completion writes, ny cache, schema eller dataändamål tillkommer. Mobile iOS Design skill från `origin/main` används enligt Tasslas React Native-anpassning; SwiftUI-exempel är inte implementeringskrav. Native, TestFlight och live RLS redovisas separat.


### VISION-R02-HEM-01 — lokal Home-checkpoint, 2026-10-21

Home visar endast pilen till Checklistor; rutinrader öppnar fokuserad hantering med vanligt tryck och redigering med longpress utan checkboxskrivning. QA verifierade v15-kod/render/evidens och v16/v17 dokumentationsrättningar. Oberoende QA PASS, Architect APPROVE, Critic PROCEED och frozen Reviewer PASS. `pnpm check` passerade vid commit (app/edge typecheck, ESLint, 63/63 filer); pre-push hook passerade 621/622 tester (1 skip). Public/review RN Web-evidens 25/25 och 35/35; content guard och direkt offline Expo iOS-export 1 450 moduler passerade. Commit `1b22370` (`feat: polish home checklist navigation`) pushades till `origin/2026-10-21-hem-utveckling-framsteg-insikter`. `pnpm bundle:ios`-wrappern är NOT VERIFIED efter sandbox-EPERM vid registry-attestering; native VoiceOver/Dynamic Type, live Supabase/RLS och signerad release är NOT TESTABLE. Full panelacceptans hävdas inte. Underlag: [Home-taskjournal](../tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md), [plan v17](../plans/VISION-R02-HEM-2-3-8-2026-10-21-v17.md) och [visuell verifiering](../design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/home/VERIFICATION.md).

### FLOW-HOME-CHECKLIST-FILTERS-01 — A02 lokal ikon-/handlingscheckpoint, 2026-10-22

Ikonval per rutinpunkt är återinfört i Checklista, med 20 val, long-press till rätt punkt och befintlig owner-scoped sparväg. Hem behåller kompakta ikonfria rader. Båda rutinhandlingarna är ikon-only och kräver bekräftelse i separat popup. A02 v5 fick oberoende QA PASS och frozen Reviewer PASS efter tokenbaserad, varierad visuell behandling; se [verifieringen](../design/evidence/flow-home-checklist-filters-2026-10-20/a02/VERIFICATION.md).

Detta stänger inte hela panel 4: Kommande, källnavigation/retur och full §14-acceptans återstår. Migrationen är endast källkod och har inte applicerats. Produktionsskrivning med ikonmetadata är spärrad tills separat migration/runtime-granskning och skydd mot gamla klienters läsning är uppfyllda. Ingen live RLS, native Alert/accessibility eller TestFlight-verifiering hävdas. Erik bekräftade manuella tester 1–4 som godkända; de hålls stängda.

### FLOW-HOME-CHECKLIST-FILTERS-01 — A03 lokal Kommande-/källresa, 2026-10-22

Panel-4:s fyra filter, read-only Kommande, exakta historiska träningskällor och retur med bibehållet filter/scroll är lokalt implementerade på `2026-10-22-checklist-kommande-navigation`. Riktad syntetisk RN Web-kontroll PASS: public 10/10, review 19/19. Check-hook: 642 passerade, 1 skip av 643 testfall. Commit `25bde34` pushad till `origin/2026-10-22-checklist-kommande-navigation`. Full panelacceptans, oberoende A03-review och live RLS är fortfarande öppna; native accessibility är NOT TESTABLE.

Erik vill att Kunskapens checklistor delar mer av Hemmets ikon- och radgrammatik. Fortsatt beslut: harmonisera presentation och återkoppling där de passar, men bevara skillnaden mellan publicerade fasuppgifter/egna fas-punkter och ägarens återanvändbara återfallsrutiner. Kunskapens egna punkter saknar sparat ikonfält; beständigt val kräver separat datakontrakt och granskning. A03 ändrar inte Kunskap. Skärmens generella `Kontrollera den föregående ändringen`-status bevisar inte saknad tabell: ikonändringen kräver en ännu icke-applicerad validator-migration i den befintliga rutindatakällan, inte en ny tabell.


### Rättelse — A03 och panel 4, 2026-10-22

Erik har efter den lokala A03-checkpointen bekräftat att `202610220001_daily_routine_checklist_icons.sql` är migrerad, extern QA för A03 är klar och manuella iOS-tester passerade. FLOW-HOME-CHECKLIST-FILTERS-01 stängs enligt ägarens rapport. Sessionen gjorde ingen ny live Supabase/RLS- eller enhetskontroll; se [taskunderlaget](../tasks/dev/FLOW-HOME-CHECKLIST-FILTERS-01.md).

### FLOW-PROGRESS-01 — ringbåge och sanningsenligt dagsläge, 2026-10-22

Panel 3 behåller MVP-kontraktets datakälla: samma `selectDailyProgress` används för ring och full lista. Den tidigare halvringslösningen gick tillbaka mot noll vid 50 %, så ringen byggdes om med 120 överlappande View-segment och en partiell sista bit; den geometrin är testad vid 0/1/49/50/51/99/100 % och ogiltig input. Ingen dependency eller schemaändring tillkom. Tid visas inte eftersom rutinpunkternas completion-tider saknas; veckomål utelämnas tills dess population/period/källa har beslutats. Fullklar-sammanfattningen visas endast när hela dagsurvalet är markerat.

Erik bad uttryckligen att de övriga panelerna fortsätter medan panel 2:s frysta Reviewer-re-review hanteras. Därför gjordes panel-3-implementationen och lokala test/renderkontroller nu; dess formella köstatus förblir `blocked` tills panel-2-checkpointen passerar Reviewer. Panel 3 väntar dessutom på oberoende QA/Reviewer och ett verkligt veckomål för full acceptans. Se [panel-3-verifiering](../design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/progress/VERIFICATION.md).

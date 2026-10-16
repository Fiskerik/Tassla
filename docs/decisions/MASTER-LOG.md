# Tassla — samlat besluts- och leveransregister

Status: kanonisk sammanfattning för produkt-, design- och utvecklingsagenter. Vald implementationbas: `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f` (2026-10-16). MVP v2 är styrande från 2026-10-16. Senast sammanställd 2026-10-16.

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

### MVP v2 och användarresor

**Ägarbeslut 2026-10-15/16.** MVP v2 gäller som produktdefinition från 2026-10-16; implementationen utgår från `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f`. Samtliga åtta paneler i vision_rev02.jpg är funktionella MVP-mål inom v2:s sex produktområden: Hem, Utveckling, Dagens framsteg, daglig Checklista, Logga, Träning, Kunskap och Insikter. Leveransmodellen är kompletta användarresor i små checkpoints. Granskningen är riskbaserad. Hela referensen omfattas; bildens exempeldata och råd är inte datakällor.

Varje resa ska nås i appen, utföra en verklig uppgift med korrekt källa, visa bekräftat eller ärligt okänt resultat och återvända med bekräftad data intakt. Alla synliga filter, perioder, mål, diagram och destinationer behöver faktisk funktion för att panelen ska bli klar. Panel 4 Alla visar samtliga aktiva rutinmallar oavsett dagsval. V2 behåller valp-först-positionering med nytta genom hundens liv och de sex produktområdena. Bevara konto, onboarding, samtycken, notifieringar, distribution och mätning. V2-antagandet lägger inte till nya persondataändamål, kostnader, live-migrationer, partneråtkomst, pilotrekrytering eller publicering.

Källor: [MVP EXPERIENCE CONTRACT](../MVP-EXPERIENCE-CONTRACT.md), [MVP](../mvp.md), [utvecklingsflöde](../dev/workflow.md), [panelkontrakt](../design/vision-rev02-screen-contracts.md). Källor: Eriks uttryckliga beslut i konversationen ”GAP analys Tassla MVP” 2026-10-15 och beskedet 2026-10-16 att utgå från senaste Main och MVP v2; fastställandet återges i den här sammanslagna posten.

## Risknivå för granskning

- **L:** lokal presentation/copy utan ändrad persistens eller semantik. Riktad funktions- och visuell QA, därefter oberoende Reviewer.
- **M:** ändrad användarresa eller befintlig datahantering. Prova lyckat, fel och osäker status, visuell QA och oberoende QA/Reviewer.
- **H:** auth, RLS, konto/hundscope, migration, radering, hälsa, notifiering, nya persondataändamål, extern integration eller oklar datamodell. M-bevis plus relevanta Architect/Security/Compliance/Dog Expert-granskningar och riktig integration där acceptansen kräver det.

Höj risk vid osäkerhet. pnpm check, föreskrivna kögrindar och oberoende Reviewer gäller fortsatt. Rapportera lokal render, kodtester, live DB/RLS, native/telefon och release separat. NOT TESTABLE är inte PASS.

## Leveransregister

Nya paket förs in i denna fil när deras queue-status övergår till done. Koordinatorn sammanfattar det faktiska utfallet efter oberoende Reviewer-pass och före den slutliga done-checkpointen. Varje post anger paket-ID, mål/ändrade delar, faktisk status, kontroller och resultat, QA/Reviewer/Security-verdict där relevant, commit eller dokumenterad checkpoint samt öppna luckor. Skilj lokal PASS, ägarrapport, live runtime och release. Länka taskens fulla underlag i stället för att kopiera långa loggar. Korrigera en post med datum och rättelse; skriv inte om historien tyst.

### Paket som redan är klara enligt vald Main-bas

Följande package-statusar finns dokumenterade i den valda Main-snapshotten. De är inte påståenden om live databas, native-verifiering eller att hela panelerna är klara. Fulla bevis och begränsningar finns i task- och renderunderlagen. Historiska branch- och commitreferenser nedan behålls som proveniens.

| Paket | Status i vald Main-snapshot | Sammanfattad leverans och kvarstående gräns |
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

### MVP-V2-ADOPT-01 — dokumentcheckpoint klar lokalt, 2026-10-16

MVP v2 är nu den enda aktuella definitionen i `docs/mvp.md`; v1 och det ursprungliga v2-förslaget ligger kvar i `docs/history/` som uttryckligen historiskt material. Agentinstruktioner, workflow, upplevelsekontrakt, skärmkontrakt, relevansmatris och kö är synkade. `docs/tasks/dev/FLOW-HOME-CHECKLIST-IDAG-01.md` v3 ingår i paketets godkända skrivomfång och är första nästa Panel 4-checkpoint; dess exakta kö- och datagrindar är dokumenterade.

Verifiering: `python -m json.tool docs/tasks/dev/queue.json`, `python tools/dev_flow.py validate`, parsing av alla 9 `.codex/agents/*.toml`, relevanta Markdown-länkar 31/31 och `git diff --check` PASS. Oberoende dokument-QA PASS; Architect APPROVE; Critic PROCEED; Reviewer final PASS efter att ett tidigare fynd om beständig evidens dokumenterats och rättats. Underlag: [adoptionsplan](../tasks/dev/mvp-v2-adoption.md) och [Idag-plan v3](../tasks/dev/FLOW-HOME-CHECKLIST-IDAG-01.md).

Detta är en **lokal, ocommittad dokumentcheckpoint** på `main` med bas `00d4d4a3e38c08a6bb7d4c541cc509457126276f`. Inga app-/databasfiler ändrades, och inga ändringar skrevs till GitHub. Nästa steg är att stänga `MVP-V2-ADOPT-01` i den lokala kön och därefter börja den godkända Idag-checkpointen när dess beroenden markerats klara. Dokumentpaketet i sig innebär inte att någon Rev02-panel är implementerad.

Tidigare MVP v1-krav finns i [det historiska arkivet](../history/mvp-v1-2026-10-15.md); det ursprungliga v2-utkastet finns [arkiverat här](../history/mvp-v2-source-proposal-2026-10-15.md). Tidigare MVP- och byggpaket har detaljerad historik i [HISTORY-2026.md](../releases/HISTORY-2026.md). Denna tabell ersätter inte dess exakta commit- och QA-notiser. Nya rev02-paket och efterföljande slutförda tasks får en egen post ovan med verkliga resultat.

### FLOW-HOME-CHECKLIST-ALL-01 — Panel 4 v8, lokal checkpoint klar, 2026-10-16

`Alla` listar alla sparade aktiva rutinmallar för aktuell hund, även utan dagsval. v8 lägger till skrivgrind för aktuellt IANA-lokalt datum och den snapshot-version som öppnade manager-sessionen. En försenad bekräftelse från en äldre session avvisas efter refresh. Failed/unknown-status bevaras efter lyckad omläsning tills den bekräftas eller scope ändras. Alla ändringar återanvänder befintligt data- och mutationskontrakt.

Architect APPROVE, Security PASS, QA PASS och final Reviewer PASS. QA: 24/24 fokuserade daily-activity-tester, full `pnpm check` 502/502, public/review `checklist-all` 16/16 vardera, Idag-regression 5/5 vardera, Home 5/5 public och 6/6 review; noll browser page errors. `python -m py_compile`, scoped ESLint, queue validation och `git diff --check` PASS. Underlag: [checkpointplan](../tasks/dev/FLOW-HOME-CHECKLIST-ALL-01.md), [körlogg](../tasks/dev/rapport.md) och [renderbevis](../design/evidence/vision-rev02/checklist/ALL-01/RENDER-REPORT.md). Köposten är stängd för denna checkpoint; Panel 4 som helhet är inte färdig.

Syntetisk webbrendering certifierar inte live Supabase/RLS, migrationens driftparitet, produktionsdubblett-races, native Alert/tillgänglighet, fysisk enhet eller OS-tidszonsbyte; dessa är NOT TESTABLE. Erik bad uttryckligen att de färdiggranskade ändringarna ska commit/pushas till en ny branch efter granskning.

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

### FLOW-HOME-CHECKLIST-IDAG-01 — lokal Panel 4-checkpoint klar, 2026-10-16

Hem öppnar nu en separat Idag-checklista med hela dagens källpopulation, samma hund-/datumscope och bevarad tillbakaresa genom träningssteg och rutinhantering. Bekräftad progress delas mellan Hem och checklistan: aktiviteter med otillgänglig källa räknas inte som ogjorda, utan visas separat som obekräftade. Träningslänken använder exakt valt publicerat versions-/stegpar; vuxna blockeras utan versionsspecifikt godkännande. Befintliga rutinmutationer och Hemmets generella träningsingång är bevarade.

Verifiering: `pnpm check` 494/494; fokuserade tester 15/15; public/review `home-checklist` med fem godkända steg vardera, inga browser page errors, UTF-8-JSON-resultat och skärmbevis. Delta-QA PASS och slutlig implementation Reviewer PASS. Architect godkände tillägget av den statiska Home-wiringtesten i exakt skrivomfång. Underlag: [plan](../tasks/dev/FLOW-HOME-CHECKLIST-IDAG-01.md), [körlogg](../tasks/dev/rapport.md) och [renderbevis](../design/evidence/vision-rev02/checklist/IDAG-01/README.md). Live Supabase/RLS, native VoiceOver/Dynamic Type och fysiska tillbaka-/scrollgester samt separat midnatt-/tidszon-/resume-runtimeprov är NOT TESTABLE. Lokal, ocommittad leverans på `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f`; ingen GitHub-write.

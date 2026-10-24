# Training Progression MVP — uppgiftsplan v4

> **Uppgift:** TRAINING-PROGRESSION-01
> **Status:** blocked efter oberoende QA. QA godkände den senaste UI-rättningen och sökvägsscope; samlad acceptans är blockerad av ej testade samtidiga DB-sessioner, live Supabase/PostgREST/JWT/RLS, native tillgänglighet och delvis visuell panelacceptans. QA PASS/ BLOCK-historik och lokala resultat finns i `docs/tasks/dev/queue.json` och `docs/design/evidence/training-progression-mvp/`. Ingen live-migration, release eller distribution har körts.
> **Bascommit:** e0c452f22d9d25ee85f0375187f42188c7277e59, branchen codex/agent-workflow-stabilization, baserad på senaste main 0b0f99f8660a392971b5caab71c19334f771f495.
> **Skrivägare:** huvudsessionen äger alla skrivningar. QA och Reviewer är oberoende och skrivskyddade.
> **Modellval:** Architect, Critic och Security använder sina konfigurerade gpt-5.6-sol med hög resonemangsnivå för den tvetydiga H-risk-resan och dataskyddet. Implementer, QA och Reviewer följer Eriks mandat om gpt-6-luna medel. Dog Expert granskar bara om träningsråd senare förs in i denna kodresa; rollen behåller gpt-5.6-sol medel. Rollernas permanenta standarder ändras inte.

## Mandat och läsordning

Ägarens uttryckliga instruktion 2026-10-24 är att börja med den bifogade Training Progression MVP:n. Arbetet håller sig till godkänd Träning, panel 6 i docs/MVP-EXPERIENCE-CONTRACT.md och träningsprogressionen i docs/mvp.md. Läs därtill endast relevanta delar av AGENTS.md, docs/dev/workflow.md, docs/design-rules.md, docs/design/vision-r02-screen-contracts.md, docs/decisions/MASTER-LOG.md och berörda README-filer.

Ursprungstexten innehåller rapporter om kod, godkännanden och testresultat som inte finns verifierade på bascommiten. De behandlas som obekräftade. V1-review ledde till ett avgränsat vertikalt flöde och tydliga mät-/skrivkontrakt i v2; v3 preciserade unik resa och receipt replay; v4 rättade reviewgrinden och ägarskapskontrollen. Den aktuella v4-texten fick Architect APPROVE, Critic PROCEED och Security APPROVE före implementation.

## Mål och avgränsning

Bygg en komplett, lokal verifierbar träningsresa från en befintlig publicerad programversion till sparad aktivitet, ägarbekräftat delmål, återupptagning och återgång. Resan kan startas från befintligt Träning-flöde eller Hemmets befintliga fortsättväg. Programversion och steg hålls stabila genom hela resan. Ägaren kan registrera ett pass med ett avgränsat återkopplingsval, uttryckligen bekräfta att stegets befintliga instruktion uppnåtts och sedan fortsätta, upprepa, gå tillbaka eller pausa/underhålla. Ett pass skapar aldrig färdighet eller nästa steg automatiskt.

Varje sparat pass räknas som ett loggat pass, inklusive ett pass som ägaren avslutar med att öva vidare eller pausa. Hemmets etikett ska säga loggade pass. Bekräftade delmål räknas som unika, uttryckligen bekräftade steg för samma resa och exakt programversion; visa dem som delmål, aldrig som en automatisk procentsats eller generell färdighetsbedömning. Hem visar aktivt sparat steg för den senast uppdaterade resan med deterministisk sortering och länk tillbaka till exakt version. Saknad/partiell läsning eller osäkert skrivsvar får inte visas som bekräftad data. Nya pass/delmål påverkar inte dagslistans äldre training_progress-kontrakt.

**Skriv- och datakontrakt som ska gälla oavsett fysisk tabell/RPC-form:**
- Separata training_journeys, training_sessions, training_milestones och operationskvitton. Journey binder hund + exakt programversion + aktivt steg + ägarstyrt tillstånd. Unik constraint per hund och programversion gör start/återuppta till samma resa även vid upprepade eller samtidiga startanrop; ny programversion får egen resa utan automatisk kopiering. Session binder hund/version/steg, tidsstämpel och ett fast återkopplingsval; inga fritextanteckningar eller diagnoser. Milstolpe är en explicit ägarbedömning för samma versionerade steg. Befintlig stegtext är kriteriets kontext; skapa inte nytt råd eller ändra publicerat innehåll.
- Ägarskap härleds på serversidan från auth.uid() och kontrolleras med befintlig private.owns_dog(dog_id). Alla barnrader har hundscope, versions-/stegkombinationen valideras med relationer, och hund-/kontoborttagning rensar dem via kaskad. Klienten får ingen direkt skrivrätt till dessa tabeller; begränsade authenticated RPC-funktioner kontrollerar ägarskap, status och version i transaktion. RLS skyddar läsning.
- Varje muterande RPC tar UUID-operation-ID. Kvitto och effekt sparas atomiskt och är unika per autentiserad ägare, hund och operation. Före varje replay kontrollerar RPC på nytt att auth.uid() fortfarande äger hunden. Samma ID med samma kanoniska åtgärd returnerar endast kvittots sparade resultat även om programversionen senare dras tillbaka; inget indraget programinnehåll returneras. Ett nytt start-/pass-/progressionsanrop kräver fortsatt tillgänglig publicerad källa. Samma ID med ändrad payload nekas. RPC använder tom search_path, begränsade EXECUTE-grants och validerar att steget hör till programversionen. Inga historiska training_progress-rader migreras eller räknas om.
- Klientens väntande åtgärd/payload/ID hålls per konto och hund. Kontobyte, hundbyte, avpublicerad källa och sena svar får inte skriva över aktuell arbetsyta. Vid unknown återanvänds samma ID först efter verifierande readback; inga automatiska offlineköer eller återspelningar efter processavslut införs.

Nytt innehåll, inklusive det planerade inkallningsutkastet, ingår inte i den här kodresan: bilagan saknar själva stegen och kriterierna. Hundexpertens granskning visar att ett separat draft kan källbeläggas, men exakt text och svensk lokal säkerhetsvägledning måste granskas innan den visas eller publiceras. Denna kodresa använder bara befintliga publicerade program och syntetiska tester. Ingen innehållspublicering.

**Utanför scope:** ändring/backfill av training_progress eller dagslistan, omskrivning av programtext, live-/produktionsmigration, innehållspublicering, release/distribution, ny persondataanvändning, analytics, partnerdelning, notifieringar, nya dependencies, veterinärdiagnos/behandling och ombyggnad av andra skärmar.

## Användarresa, tillstånd och evidens

Träning visar befintlig lista och steg. Ägaren startar eller återupptar exakt programversion; start för en redan existerande hund/version återupptar samma resa och samma sparade steg, aldrig en dubblett. Aktivt steg sparas. Ägaren avslutar ett övningstillfälle med fast återkoppling. Först efter bekräftad skrivning visas möjlighet att uttryckligen bedöma steget; bedömningen kräver en egen ägarhandling. Därefter väljer ägaren själv nästa steg, upprepning, backning eller paus. Hem läser tillbaka samma resa och visar rätt steg samt separata räknare. Fel behåller valet och operation-ID; retry återanvänder det. Osäker status visas som okänd, aldrig sparad. Byten av konto/hund/flik skyddar mot sena svar. Tillgänglighet, stor text, touchytor och reducerad rörelse följer de befintliga tokens och designreglerna.

## Skrivvägar

- docs/tasks/Training-progression-mvp.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md (checkpoint/closeout)
- docs/decisions/MASTER-LOG.md (endast efter slutlig review)
- src/data/workspace-data.ts
- src/data/README.md
- src/features/training/PublishedTrainingScreen.tsx
- src/features/training/training-progression.ts (ny)
- src/features/training/README.md
- src/features/home/ProductWorkspace.tsx
- src/features/home/HomeScreen.tsx
- src/features/home/README.md
- supabase/migrations/202610240001_training_progression.sql (ny; ingen live-körning)
- supabase/tests/training-progression.sql (ny)
- tests/workspace-data.test.mjs
- tests/training-progression-model.test.mjs (ny)
- tests/training-progression-ui.test.mjs (ny)
- tests/training-progression-data.test.mjs (ny)
- tools/visual-check/app.tsx
- tools/visual-check/verify-flow-training.py
- tools/visual-check/README.md
- docs/design/evidence/training-progression-mvp/

Enbart dessa paths får ändras. Befintliga visual-check/verify-flow-training.py återanvänds och utökas; skapa inte en parallell runner. Om granskning visar att någon path inte behövs ska listan krympas före implementation. Varje faktisk ny path måste finnas här och i köobjektet innan kod skrivs; scopeändring kräver en ny planversion och ny granskning.

## Acceptanskriterier och bevis

| Kriterium | Krävda bevis |
|---|---|
| En unik resa per hund/programversion återanvänds vid upprepad eller samtidig start. Nya pass-, delmåls- och operationsdata är versions- och hundscope:ade, ägarskap serverkontrollerat och klientens direkta skrivningar nekas. Account-/dog-deletion kaskaderar; resedata behålls för träningshistorik tills hunden/kontot tas bort. Äldre training_progress och dagslistan är oförändrade och inga rader backfillas. | Arkitekt och Security godkänner v4; SQL-kontraktstest visar RPC grants, cross-owner deny, version-/stegvalidering, kaskad, idempotent retry inklusive replay efter avpublicering, payloadkonflikt, samtidiga startanrop, kaskad och inga legacyändringar. |
| Ägaren kan starta/återuppta; logga pass med återkoppling; explicit bedöma steg; uttryckligen fortsätta, upprepa, backa eller pausa/underhålla. Ingen skrivning sätter färdighet eller nästa steg automatiskt. | Modell-, data- och komponenttester täcker varje övergång samt pending/saved/failed/unknown. Renderad verklig skärm visar tillstånden. |
| Hem visar deterministiskt aktivt steg och räknare endast från bekräftad data. Loggade pass är antal sparade passhändelser i den visade resan. Bekräftade delmål är antal unika ägarbekräftade steg i samma resa/version. Mätvärdena är skilda. | Fixtures med noll, en, upprepade pass, bekräftade/o-bekräftade steg, paus, partiell läsning och flera versioner; ingen unknown räknas. Dagslistan får inte ändras av nya pass. |
| Operation-ID återanvänds vid unknown; samma ID/payload är idempotent och annat payload avvisas. Sena svar eller konto-/hundbyte kan inte blanda resultat. | SQL/RPC och klienttester för dubblett, konflikt, timeout+readback, kontobyte, hundbyte, versionsbyte och sen respons. |
| UX behåller approved panel 6 composition, max en primär handling, existerande tokens, läsbara fel, scrollbar stor text och reducerad rörelse. | Oberoende public/review RN Web renders och §14-granskning med evidens vid 375×667, 375×844 och 430×844 samt stor text; faktisk verifieringsscript-körning utan page errors. Native och live Supabase redovisas separat om de inte går att testa. |
| Alla ändringar är inom godkända write paths och acceptans är oberoende verifierad. | QA PASS och Reviewer PASS på fryst diff; exakta kommandon/resultat och commit/checkpoint sparas i kö, rapport och MASTER-LOG. NOT TESTABLE lämnar berörd acceptans öppen. |

## Verifiering och kontrollpunkter

Före kod: v4 får Architect APPROVE, Critic PROCEED och inga blockerande Security-fynd. Då markeras köposten ready; sedan implementing. Efter varje sammanhållen del körs relevant fokuserat test och bounded cleanup innan nästa del. Före QA: gör kodcheckpoint och status qa. QA är skrivskyddad; vid PASS går uppgiften till review. Reviewer gör oberoende granskning av samma diff; inga ändringar efter review utan omtest och ny review.

Planerade kommandon: fokuserade modell/data/UI-tester; pnpm check; python -X utf8 tools/dev_flow.py validate; git diff --check; verklig SQL/PLpgSQL-kontraktstest i isolerad lokal runtime; python -X utf8 tools/visual-check/verify-flow-training.py. Inget live Supabase, inga produktionsdata och ingen publicering. Om SQL-runtime inte kan användas ska SQL-/RLS-kriterierna stå NOT TESTABLE och uppgiften får inte bli done. Lägg inte till dependency i projektet utan separat mandat.

## Relaterade beslut

- docs/MVP-EXPERIENCE-CONTRACT.md, panel 6 — träningsresa och evidens.
- docs/mvp.md, träningsprogression — steg, utförande och återupptagning.
- docs/design-rules.md och docs/design/vision-r02-screen-contracts.md — synlig struktur och §14.
- supabase/migrations/202610040001_foundation.sql — training_progress, private.owns_dog och kontoborttagning.
- supabase/migrations/202610130001_daily_activities.sql — äldre dagslistekontrakt och låsning av training_progress.
- docs/tasks/dev/FLOW-TRAINING-01.md och docs/plans/FLOW-TRAINING-01-panel6-v1.md — befintlig rekommendation/återupptagning, inte verifiering av ny dataresa.
- docs/decisions/MASTER-LOG.md — godkända scopebeslut.

## Ursprunglig bifogad fil — bevarad som obekräftat källmaterial

Mandat- och resultatpåståenden i den importerade texten nedan är bilagans egen text. De är inte godkännanden eller verifierade resultat för aktuell `main`.

~~~markdown
Mandat: ägarens uttryckliga beställning och bifogade `tassla_traningsprogram_progression_mvp.md` gäller framför äldre scope och godkännandekrav. Inkallning är första kompletta referensprogrammet. Ingen publicering eller live-migrering beställd. Skillval: cloud-environment-runtime, tassla-consumer-ux och mobile-ios-design.

## Delar, ansvar och acceptans
1. Datakontrakt (implementer): migration, dataadapter och tester. Beroende: planreview. Återanvänd `training_progress` för äldre aktivitetsmarkeringar; separera nya pass och ägarbedömda delmål utan att tolka gamla bockar som inlärning. Versions- och hundbundna data, idempotenta pass och skydd mot sena svar. Kontroll: modell/API-tester och SQL-kontrakt.
2. Komplett resa (huvudagent): `PublishedTrainingScreen`, ny delkomponent/modell, `ProductWorkspace`, inkallningsutkast och reviewfixtur. Beroende: datakontrakt. Starta/återuppta, feedback efter pass, kriteriebekräftelse, nästa steg, upprepa/backa/pausa och underhåll utan förlorade framsteg. Hem visar sparat steg och separata aktivitets-/färdighetsmått. Kontroll: beteendetester, pnpm check och lokal render om verktyg finns.
3. Oberoende granskning (QA/reviewer/security): isolering, fel/osäker status, regressionskontroll och dokumentation. Beroende: 1–2. Spara verkliga resultat; native/live RLS och sakkunnigpublicering redovisas separat.

## UX och jämförelse
Behåll panel 6:s varma ytor, bilder, tre flikar, befintliga tokens, sheets och tryckytor. Nuvarande bock blandar aktivitet och progression → visa passräknare respektive uppnådda delmål. Nuvarande nästa ej bockade övning → sparat aktivt steg med explicit fortsättning. Nuvarande engångsbock → snabb feedbackregistrering följd av separat, kriteriestyrd färdighetsbekräftelse. Fel behåller feedback och operations-ID; inga framsteg utan bekräftad skrivning. Stor text får scrolla. Historiska program och Hemmets dagslista bevaras.

## Checkpoint
Plan sparad. Hundexpertens förgranskning: belöningsbaserat inkallningsutkast möjligt, men nya steg/kriterier ska vara draft tills mänsklig sakkunniggranskning och inkallningsspecifik källa finns. V1-godkännandet får inte ärvas. Inga numeriska universalkriterier eller automatisk svårighetsökning.

## Checkpoint — implementation och granskning
- Arkitekt/critic godkände lokal implementation med uttryckligt separerade pass/delmål, idempotenta operationer, ingen automatisk svårighetsökning och oförändrad äldre dagslista.
- Slutligt datakontrakt: `training_sessions`, `training_journeys`, `training_milestones` och operationskvitton. `training_progress` återanvänds inte för nya färdigheter eftersom äldre dagslistor tolkar varje rad som genomförd aktivitet. Detta undviker falska aktivitetsdatum och att gamla bockar blir färdigheter.
- Inkallningsutkastet har sex steg med observerbara kriterier, instruktioner och välfärdsråd. SQL-innehållet är uttryckligen `draft`; inga sakkunnigreferenser eller källor har fabricerats. Inget innehåll har publicerats.
- Produktionskomponenterna skiljer pass från delmål. Start utan pass sparas. Paus/backning behåller allt. Bra feedback öppnar kriteriebekräftelse, aldrig automatisk avancering. Slutsteget kan tränas även efter sista delmålet.
- Hem visar sparat aktivt steg, separata totaler och senaste daterade delmål med väg till träningen. Tidigare dagslistor och deras träningsmarkeringar behåller sina kontrakt.
- Osäkra operationer behåller payload/ID per konto, kontogeneration och hund även om ålder/profilurval ändras eller användaren byter flik/hund under samma workspace-livstid. Kontrollerade fel låter användaren ändra feedback. Ingen beständig offlinekö eller automatisk återspelning efter avslutad appprocess ingår.
- Säkerhetsgranskningen kontrollerade ägarskap, RLS, RPC-rättigheter, FK, transaktion, payloadkonflikter och raderingskaskader. Rättat: connection SQLSTATE förblir unknown, identiskt kvitto kan återläsas efter avpublicering, testet seedar verkliga negativa rader för andra ägaren.
- Oberoende QA/reviewer: PASS för granskad modell/resa och fem riktade testfiler. Tester uppdaterades till fjärde reviewfixturen och gemensam övningsrouting med bibehållen äldre fallback.

## Lokal verifiering
- Lokal PostgreSQL/PGlite körde verklig foundation-migration, AI-origin-migration, ny journey-migration och `supabase/tests/training-journeys.sql` med syntetisk auth-stub. PASS: verklig SQL/PLpgSQL, ägarisolering, idempotens, feedback-/ordningskrav, draftskydd och retry efter avpublicering. Inkallningens draft-seed kördes: status draft, sex steg. Detta är inte driftens Supabase/PostgREST/JWT-verifiering.
- RN Web/Playwright: `tools/visual-check/verify-training-journey.py`, 10 beteendekontroller, inga page errors. Start/omladdning, dubbeltryck, separat delmål, avbruten kriteriebekräftelse, explicit nästa steg, svårare pass/backning/paus, flikbyte, osäker faktiskt sparad operation och kontrollerat fel. Syntetisk lagring med localStorage; ingen riktig backend påstås.
- Bilder och maskinresultat: `docs/design/evidence/training-progression-mvp/`. Bredder 375/430, höjd 667/844, 140 %-textproxy och reducerad rörelse. Första rendern var för texttung: programintroduktion visas nu endast före start och fördjupade kriterier/råd öppnas separat; kort välfärdsråd är alltid synligt och fulla kriterier visas före färdighetsbekräftelse.
- Slutlig pnpm check och whitespacekontroll registreras efter sista korrigering nedan.

## Visuell checklista §14
1–3 Ja: en primär pass-/starthandling, jämställda feedbackval; ingen ny radering. 4 Ej tillämpligt på nya detaljytan; Hemmets äldre dagsrader oförändrade. 5–7 Ja i RN Web: naturlig scroll, safe-area-ram från AppScreen, gemensamma tokens/komponenter/Ionicons. 8 Delvis: befintlig varm/grön träning och bildkort återanvänds; inget nytt färgsystem. Full separat kontrastmätning av hela skärmen inte utförd. 9–13 Ja i lokalt prov: etiketter motsvarar handlingar, bara bekräftade mått, konkret feedback och mänskligt bedömda färdigheter. 14 Ja för start, ready, paused, failed och unknown; nätläsfel bevarar tidigare arbetsytans felhantering. 15 Delvis: minsta tryckytor och stor-text-proxy, native VoiceOver/Dynamic Type inte provat. 16 Delvis: översiktens befintliga panelkomposition återanvänds; ny programdetalj följer denna beställda specifikation och saknar separat bildreferens i rev02. Ingen full visuell panelacceptans påstås. 17–18 Ja i lokalt prov: befintliga tre träningsflikar/huvudmeny, fungerande tillbakaresa och tydligt märkt syntetiskt inkallningsutkast.

## Kvarstående aktivering
Ingen live-migration, publicering eller distribution körd. Applicera migration i utvecklings-Supabase och kör SQL-fixtur/API-prov med riktiga JWT innan driftaktivering. Läs `supabase/content/recall-mvp-draft.sql` och ordna faktisk mänsklig träningsgranskning samt inkallningsspecifik källa före publicering. Fysisk iOS/VoiceOver och riktig Supabase/RLS kvarstår. Val av ytterligare två program, pilot och retentionmätning är fortsatt produktbeslut och behövs inte för inkallning som referensflöde.

## Slutlig rättning och omgranskning
QA fann en blockerare efter första PASS: rasbyte kunde dölja ett program med olöst skrivning. Rättat och omgranskat till **PASS**: explicit sparade/pending programversioner behålls vid ändrad ålder/ras och är fortsatt inte nya ålders-/rasrekommendationer. Om källan inte längre är tillgänglig finns en särskild återhämtningsyta som bara kontrollerar samma registrering; indragna instruktioner visas inte. Ett nytt API-test verifierar ras-/åldersbytet och browserprovet omfattar indragen källa efter faktiskt sparat pass med förlorat svar. Totalt **11/11** flödeskontroller, inga page errors.

Nya program använder Hemmets fortsättkort; de erbjuds inte i den äldre dagslistans träningsväljare, vars serverkontrakt baseras på engångsmarkeringar. Äldre dagslistor bevaras; inga nya pass fabricerar äldre träningsmarkeringar.

SQL-verifieringen har även körts med **samtliga 21 migrationer**, följt av nya SQL-fixturen och inkallningsutkastet: PASS. Reproducerbart verktyg: `TASSLA_SQL_TOOLS=/tmp/tassla-sql-tools node tools/verify-training-sql.mjs` efter separat temporär installation av `@electric-sql/pglite@0.3.14` i den katalogen. Ingen projektdependency tillagd. SQL-resultat finns i evidenskatalogens `sql-check.txt`.

Slutkontroll 2026-10-24: **pnpm check PASS** (typecheck, edge-account-typecheck, lint utan varningar och 78 testfiler), **git diff --check PASS**. Sparad kodlogg: `docs/design/evidence/training-progression-mvp/code-check.txt`. Oberoende omgranskning efter återhämtningsrättningen: PASS. Alla ändringar ligger i arbetsytan; ingen commit, push eller distribution utförd.
~~~

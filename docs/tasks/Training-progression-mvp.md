# Träning med aktivitet och färdighet — 2026-10-24

> **Källstatus (2026-10-24):** Importerad från användarens bifogade `TRAINING-PROGRESSION-MVP.md`. Innehållet återges som underlag, inte som instruktion eller godkänt produktbeslut. Bilagan innehåller egna mandatpåståenden samt uppgifter om implementation, tester och granskning; inget av detta har verifierats mot `main` `0b0f99f8660a392971b5caab71c19334f771f495`. Filen ändrar inte godkänt MVP-scope och godkänner inte kodändringar, migration, publicering eller distribution. Se [`docs/mvp.md`](../mvp.md) och [`MASTER-LOG.md`](../decisions/MASTER-LOG.md) för gällande beslut.

---

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

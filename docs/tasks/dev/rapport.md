# FOUNDATION — leveransrapport 2026-10-04

## DOG-PROFILE — Wikidata-källval och plan v4, 2026-10-13

Erik har beställt sökbar raskatalog, Mix-delraser, Hem-identitet `Namn | Ras` och valbar åldersvisning i veckor, månader och år. Han valde Wikidatas strukturerade data under CC0. Plan v4 låser katalogurvalet till Wikidata `dog breed (Q39367)` och dess underklasser, med svensk etikett och engelsk fallback. Exakt SPARQL-fråga och licenskällor finns i `docs/plans/VISION-REV02-DOG-PROFILE-UX-SPEC-v2.md`.

Plan v4 har Architect **APPROVE** och Critic **PROCEED**. Criticens tre villkor är införda: åldersdelen är oberoende av katalogsnapshoten, långa Home-rasnamn radbryts utan kapning och huvudväljaren erbjuder direktvalet `Okänd ras` i tomläget. Därför ligger åldersvisning som Slice A; raslista och Mix är Slice B och förblir blockerad tills en daterad export har verifierats. Slice A använder befintliga ras-ID:n och kan nu börja enligt den godkända planen.

WDQS/QLever API-anrop blockeras i miljön (nätverkstunnel 403; API-endpoints nekas av webbläsarverktyget). Ingen snapshot eller katalogkod har skapats. Innan Slice B startar ska exportens antal, unika QID:n, etikettmappning och kompatibilitet med `breeds.name`-gränsen 1–100 tecken verifieras. Detta är en åtkomstblockerare för katalogdelen, inte ett olöst källval.

Dokumentationskontroller: `python tools/dev_flow.py validate` **PASS** och `git diff --check` **PASS**. Inga testsviter har lagts till eller körts. Plan approval är inte SQL/RLS/runtime-godkännande.

## DOG-PROFILE — plan v5–v8 tillägg för PDF-ålder

Slice A:s godkända UI-kontrakt kräver samma valda åldersformat i Tassla-pass. För att detta även ska gälla den frysta PDF-snapshoten lade plan v5 till `src/features/passport/passport-model.ts` i write paths och lintkontrollen. Architect godkände v5; Critic begärde ett fryst `ageLabel`, samma `createdOn`, gemensam användning i preview/HTML samt kontroll av alla enheter och profil-off. Plan v6 fick Architect APPROVE och Critic PROCEED WITH CHANGES eftersom QA saknade explicit inspektion av `createPassportSnapshot` och `renderPassportHtml` för alla enheter. Plan v7 lade till kontrollen; Critic gav PROCEED WITH CHANGES och Architect CHANGES för kvarvarande v6-referenser. Plan v8 rättade dem och fick Architect **APPROVE** och Critic **PROCEED**. PDF-snapshoten implementerades först efter v8-godkännandet.

## DOG-PROFILE-AGE-DISPLAY — implementation handoff, 2026-10-13

Slice A är implementerad lokalt: migration för `age_display_unit`, validerad villkorad profiluppdatering/återläsning, svensk åldersformatterare i veckor/månader/år, Hem-identitet `Namn | Ras` med separat åldersrad, val i profilredigering, läsvy samt fryst Tassla-pass-`ageLabel` som återanvänds av preview och HTML. Raskatalog och Mix ingår inte i denna slice.

Efter första Reviewer-granskningen hittades två fel: sparstatusjämförelsen utelämnade `age_display_unit`, och årsformatets restmånader utgick från en klämd årsdag i stället för direkt från födelsedatumet. Båda rättades i `ProductWorkspace.tsx` och `dog.ts`. Färsk kontroll efter rättning: `pnpm typecheck` PASS; `pnpm typecheck:edge-account` PASS; riktad ESLint PASS med 0 fel och 3 befintliga varningar i `tools/visual-check/app.tsx`; public/review-byggen PASS; `git diff --check` PASS. Oberoende QA har granskat korrigeringarna och gav PASS för lokal/statisk acceptans; Reviewer gav PASS utan kvarvarande statiskt fynd; Security gav APPROVE och bekräftade att det låga inventeringsfyndet är stängt genom att uttryckligen ta med `dogs.age_display_unit` i åtkomst-/kopieuttag. Queue är blockerad för verklig Supabase-migration/RLS, sparad preferens, native PDF/share och native hjälpmedel, som är NOT TESTABLE i miljön. Ingen testsvit lades till eller kördes.

Wikidata CC0 är nu valt av Erik. En ny direkt GET och POST till den exakta WDQS-frågan returnerade HTTP 403; webbläsarverktyget kan inte öppna API-endpoints. Ingen katalogfil eller raslista är skapad och Slice B förblir blockerad tills ett daterat, verifierat snapshot kan hämtas.

## Förberett
Architecture-godkännande och mandat registrerade. Supabase migration skapar 13 tabeller, RLS/grants, atomärt hundskapande, versionsskydd, typvillkor och städning av ensamägd hund vid Auth-radering. Endast två rasnamn seedade. Analytics-klientåtkomst avstängd.

Separat SQL-test med två syntetiska konton och rollback omfattar egen/annan hund, utkast, publikation, aktörsförfalskning, hundflytt, viktvillkor, publicerad versions-/stegändring, indragning och sparad progression, Auth-radering och gammal session samt anonym åtkomst. Detta test är inte exekverat här.

README, .env.example, installationsguide och modulguider beskriver vad som finns. Rena TS-funktioner beräknar ålder/väljer relevant innehåll; kontrakt och designtokens är startunderlag. Expo/paket, faktisk auth/dataåtkomst, UI, PDF, notiser och Codemagic-konfiguration är ännu inte implementerade.

## Granskning och städning
Architect APPROVE plan v1. Statisk säkerhetsgenomgång visade inga åtkomstblockerare, men var inte oberoende av planreview. Separat QA/Reviewer hittade möjlig typändring efter publicering; skydd och negativt test tillagda. Reviewer omgranskade och gav PASS för förberedelseöverlämning, inte integration. Publicerings-/aktörs-/progressionstester kompletterade. Namn/ansvar samordnade; inga överflödiga appdependencies eller tomma skärmfunktioner skapade.

Implementationsartefakterna skrevs av huvudsessionen. Detta var inte en verifierad körning av alla konfigurerade Luna-roller; modellinställningar i rollfilerna ändrades inte. De oberoende delgranskningarna använde sessionens befintliga subagenter med tilldelade granskningsmandat.

## Verifiering
- Node v24.19: `node --experimental-strip-types --test tests/domain.test.mjs`, 3/3 passerar. Samma tester kördes självständigt av Reviewer.
- Foundation-diff/filformat kontrollerat lokalt. Fullständig TS-typkontroll är inte utförd; Node strippar typer och kör beteendet.
- PostgreSQL/Supabase saknas lokalt: schemaexekvering, RLS-runtime och SQL-test NOT TESTABLE. Ingen faktisk tjänst, datainsamling eller deployment körd.

## Exakt nästa steg
Uppdatering från Erik: migrations-/foundationtest slutfört i Supabase; skärmbilden visar ”Foundation tests completed; synthetic data rolled back”. URL/publishable key uppges vara tillagda i .env. Inga nyckelvärden har lästs eller loggats av Codex. Metodval 2026-10-04: e-post med engångskod initialt, Google senare (0003-auth.md). Detta är ägarens verifieringsunderlag, inte en omkörning av databastest här. OTP och själva appen återstår att verifiera.

Eriks uppsättning och testresultat finns nu rapporterade; kör inte den initiala migrationen igen. Spara skärmbilden som ägarens verifieringsunderlag. Nästa manuella steg är OTP-mejlmallen enligt 0003-auth.md; sedan återstår konkret Expo-plan och fungerande appflöde. Lägg bara URL/publishable key i befintlig .env; inga privilegierade nycklar i app.

Sedan konkret Expo-plan med godkända versionskompatibla paket, install/check-kommandon och konto/profil/Hem-flöde. Inloggningsmetod och publiceringsprocess behöver väljas före berörd implementation; inga verkliga uppgifter före nödvändiga databeslut.

## APP-04A-UX – lokal leverans 2026-10-05

Erik godkände APP-04A som första segment och GPT-5.6 Luna Medium för utförandet. Scope var utloggning under Mer samt tangentbordsanpassning i login, profil och loggredigering. Luna implementerade inom godkända app-/README-paths. Fysisk tangentbords-, VoiceOver-, stortext-, bottennavigation- och TestFlight-verifiering är separat APP-04A-PHONE och fortfarande NOT TESTABLE.

Första lokala leveransen blockerades av Reviewer/Security: auth-kontraktstester saknades och React-state garanterade inte synkront ett enda utloggningsanrop. Korrigering v8 godkändes av Architect. Auth-resultatet skiljer `localSessionCleared` från `serverRevocationConfirmed`; signed-out-varning visas när lokal rensning lyckas men serverrevokering inte bekräftas. Om lokal rensning misslyckas stannar användaren kvar och kan försöka igen. QA lade till installerade Supabase Auth/storage/fetch-kontraktstester.

Verifiering: `pnpm check` 44/44 PASS, `pnpm bundle:ios` PASS och `git diff --check` PASS. QA PASS, oberoende Reviewer PASS och Security PASS. Security noterade endast ett icke-blockerande framtida regressionstest för partiell SecureStore-rensning över AuthProvider; befintliga storage-tester täcker lagringsmodulen separat. Ingen ny dependency, datainsamling, permission, analytics eller extern datadelning.

Nästa steg är separat Erik-mandat och signerad build för APP-04A-PHONE. Starta inte Hälsa eller profil före den fysiska UX-grinden enligt beslutad ordning.

## APP-05 – återupptagning och cloud-checkpoint 2026-10-06

Eriks nya instruktion: ”Implementera APP-05 och fortsätt enligt MVP-population-2026-10-06.md. Använd GPT-6 Luna, high. Arbeta direkt i detta repository.” Implementer, QA och Reviewer är därför inställda på GPT-6 Luna high i rollfilerna; Architect/Security behåller sina granskningsmodeller. Luna high har gjort en planförberedelse, ingen appimplementation ännu.

Checkouten uppdaterades utan lokala ändringar genom fast-forward från `4f1a649` till `1abb005`. Rotfilen heter `mvp-population-2026-10-06.md` (gemener). Den dokumenterar APP-04A-PHONE som **användarrapporterat passerad 2026-10-06**. Telefonprovet ska inte upprepas enbart på grund av gammal köstatus; build/version och detaljer saknas fortfarande i underlaget. Ingen egen telefonverifiering gjordes här och kön har inte fått ett fabricerat PASS.

Erik preciserade betamålet: ”Nej, jag vill att mina betatestare ska kunna lägga in dummydata initialt. Innan release av app i App Store så rensar jag databasen på det istället”. Detta är inte ett godkännande av enbart intern syntetisk utveckling. Koppling till verkliga betakonton och radering före release behöver bedömas inom APP-05:s redan dokumenterade datagrind. Compliance har fått den konkreta avgränsningen för granskning; ingen rättslig grund eller leverantörskonfiguration har antagits.

### Verifierad utvecklingsmiljö

- Node 24.19.0, pnpm 11.19.0; `pnpm install --frozen-lockfile` PASS utan ändrad lockfil.
- `pnpm check` PASS: typkontroll/lint, 43 passerade tester och 1 tidszonsberoende test SKIP. Separat `TZ=Europe/Stockholm node --experimental-strip-types --test tests/log-model.test.mjs` PASS 7/7 inklusive det överhoppade testet.
- `CI=1 __UNSAFE_EXPO_HOME_DIRECTORY=/workspace/.expo-user pnpm bundle:ios` PASS. Första exporten föll på oskrivbar `/home/agent/.expo`; installerad Expo CLI stöder den använda shell-only-inställningen för skrivbar användarkatalog. Ingen ändring av appens konfiguration eller beroenden behövdes.
- Metro startades med `CI=1 __UNSAFE_EXPO_HOME_DIRECTORY=/workspace/.expo-user pnpm start:preview --offline --port 8081`. Lokal iOS-manifestrequest gav Tassla/launchAsset; utvecklingsbundlen gav HTTP 200 och 7 081 465 bytes med previewflaggan. Detta bevisar server/bundle, inte renderad telefon-UX. DevTools använde fallback på grund av oskrivbar hemmacache.
- `git diff --check` PASS före denna checkpoint. Inga Supabase-variabelnamn var injicerade i shellmiljön; inga värden lästes/loggades. Faktisk auth/databas/RLS och fysisk APP-05-UX är NOT TESTABLE i denna körning.

Cloud-draftens `install_script` och `start_skill` sparades bekräftat, med installations-, Expo-start- och verifieringsinstruktionerna. Draftsave publicerar inte miljön; granska/spara i environment settings och publicera när önskat. Ingen ändring av nätverkslistan eller secrets.

### Nästa steg

Spara Compliance-resultatet och precisera kvarstående betabeslut. Därefter exakt uppdaterad APP-05-plan → Architect/Critic → implementation med Luna high → QA → Reviewer/Security. Hälsokod, nya datainsamlingar och senare slices har inte startats medan den befintliga grinden utreds.

### APP-05 implementations- och QA-checkpoint

V4-planen godkändes av `app05_architect` (APPROVE) och `app05_critic` (PROCEED). `app05_compliance` godkände lokal full CRUD-kod med syntetiska tester efter v4-planjustering; verklig beta förblir BLOCK på de befintliga databesluten och runtimeverifieringen. Detta ersätter ovanstående tidiga väntestatus. Detaljer och källkontrollens 403-begränsning sparas i `app-05.md`.

Luna high implementerade separat viktkontrakt och hund-/typfiltrerad dataåtkomst, historik, skapa/rätta/bekräftat radera, datum/kg-validering, synkron dubbeltrycksspärr samt saved/failed/unknown. Okänd skrivning kontrolleras via samma id och fält före ett nytt försök; rättning/radering jämför även tidigare värden för att undvika att en senare ändring skrivs över. Preview utan data-props behåller en ärlig tom grund. README dokumenterar PostgREST-svarsgränsen och avsaknad av sidladdning.

Avgränsad städning genomförd. Under utveckling upptäcktes och rättades övergenerös decimalvalidering, insert-readback utan värdejämförelse samt en pending-spärr som blockerade första skrivningen. Dessa är rättade före fryst QA-diff; inga sådana mellanresultat räknas som leverans.

Oberoende `app05_qa` gav **PASS för lokal slice**: `TZ=Europe/Stockholm pnpm check` PASS, **64/64 tester utan SKIP**, `CI=1 __UNSAFE_EXPO_HOME_DIRECTORY=/workspace/.expo-user pnpm bundle:ios` PASS och `git diff --check` PASS. Nya tester använder installerad Supabase-klient med kontrollerade fetch-svar samt faktiska workspace-handlers extraherade genom installerad TypeScript till en isolerad harness. Första sparningen, direkt dubbeltryck, bekräftat lokalt resultat, spärr efter okänd skrivning och statusläsning utan extra insert är beteendetestade. Detta är inte en renderad React Native-telefonkörning eller verklig RLS-testning.

Kön är nu `review`. Nästa steg: oberoende Reviewer och Security på fryst diff, sedan hållbar checkpoint innan vidare arbete enligt MVP-population. Inga commits eller pushar har gjorts. Ändringarna finns i molncheckouten `/workspace/Tassla` på lokal branch `work`, inte i Eriks Windows-/OneDrive-mapp.

### APP-05 slutcheckpoint

Reviewer **PASS**, Security **PASS för lokal kod**, inga fynd. Security körde även fokuserade 20/20 tester samt egen typkontroll/diffcheck; Reviewer verifierade installerade API-definitioner och återanvände angiven QA-evidens utan att hävda egen testkörning. Underlagen är sparade i `app-05.md`. `tools/dev_flow.py` har checkpointat APP-05-B1-WEIGHT som **done för den lokala slicen**, och kövalidering/diffcheck passerar. Kvar: verklig Supabase/RLS, fysisk viktform, detaljerad PHONE-evidens och betans dataskyddsbeslut. Ingen beta, release, push eller databasrensning utförd.

Den beständiga checkpointen består av den verifierade lokala diffen, taskplanens oberoende granskningsresultat och köns historik. Arbetsmiljön anger `.git` som read-only; inga commits har gjorts. Nästa oberoende genomförbara steg enligt MVP-population är redaktionell innehållsinventering (enbart metadata, inga råd eller publicering). Nästa hälsoslice startas först efter separat exakt plan/granskning och kvarvarande berörda beslut.

### MVP-population slice 1 — innehållsinventering klar

Åtta ämnesförslag finns i `docs/content/mvp-content-inventory.json`, alla `proposed`, med tomma källor/evidens och explicita käll-/pilot-/expertgrindar. README förklarar redaktionella åldersfönster och att filen inte är publicerbar/importerbar. `tools/validate_content_inventory.py` använder enbart Python-stdlib och verifierar ett slutet metadataformat. Architect APPROVE; Critic PROCEED WITH CHANGES, införda före implementation; QA och Reviewer PASS. Originalet passerar och tio isolerade felaktiga fixtures underkänns. Ingen app-/SQL-ändring eller rådtext i denna slice. Detaljer i `mvp-content-inventory.md`.

APP-05 och metadata-slicen är färdiga lokalt. Verklig beta är inte aktiverad: kvarvarande uppgifter är ansvarig/rättslig grund/information/gallring/Supabase-underlag och faktisk APP-05-PHONE-DB. Fråga om redan beslutade beta-/gallrings-/Supabaseuppgifter skickad till Erik; inget obesvarat besked räknas som godkännande. Fortsatt implementation av vaccinations-/veterinärhistorik behöver separat exakt plan och relevanta granskningar. Content-fulltext/källurval kräver sakgranskning; inga källor eller publiceringsbeslut har hittats på.

### 2026-10-06 — B2-förberedelse och release-log
Erik begärde förberedelse av APP-04B2 och obligatorisk release-log per paket. app-04b2.md v1 är förberedd, inte implementationsgodkänd. Regeln är sparad i AGENTS.md, workflow.md och taskmallen. Loggar finns i docs/releases/HISTORY-2026.md#app-05 och APP-04B2.md. GitHub saknar Releases; senaste pushade commit e5327d1 verifierad via API. Tidigare uppgift om saknad push är inaktuell. Nästa steg: APP-05-PHONE-DB, exakt B2-planreview och därefter implementation enligt mandat. Inga app-/databasändringar eller nya appkontroller i denna dokumentationsuppgift.

### 2026-10-06 — hela MVP:n: planering och ändrad telefonpolicy
Erik beställer hela MVP:n till betaredo app, först samlad paketplan/checkpunkter. Plan i mvp-beta-delivery.md v1 och logg i docs/releases/MVP-BETA.md. Vikt/tangentbord användarrapporterat PASS, build okänd. TestFlight är inte längre grind efter varje paket; Erik väljer kritiska prov. RLS ej verifierat genom beskedet. Produktfrågor skickade; planreview nästa steg. Ingen ny appkod i detta planeringssteg.

Architect APPROVE samlad MVP-plan. Critic CHANGES; loggflöden, verklig pilot-QR, full engagemangsmätning och innehållsformat/åldersurval införda i plan v2. Förnyad Critic-kontroll följer.

## Betabeslut från Erik — 2026-10-06
Ansvarig: EriMali AB. Angiven postadress för support: Stenvallavägen 1. Gallringstid: betakonton och hunddata raderas 30 dagar efter avslutad beta. Postnummer/ort och support-e-post efterfrågade, inte kända. Backup-/loggretention och faktisk teknisk radering dokumenteras i P10; användarens gallringsbeslut är inte bevis att leverantörens backuper redan följer det. Lokal implementation behöver inte vänta på adresskompletteringen.

Kompletterad betakontakt enligt Erik: EriMali AB, Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Gallring 30 dagar efter avslutad beta. Dessa uppgifter används i P10:s information/support; inga meddelanden skickas genom detta beslut.

### Genomförande startat — P01 APP-04B2
Mandat Luna medel registrerat; 64/64 baslinjetester PASS. Exakt B2 v2 Architect APPROVE/Critic PROCEED/local data review APPROVE. Queue implementing. QA-data 33/33 efter upptäckt/rättat delete-id-fel. UI/workspace och slut-QA pågår; inte leverans-PASS ännu. P02/P03 exakta kontrakt förberedda och granskade inför senare start.

## Slutcheckpoint — APP-04B2 lokalt klart
Luna medium implementation. Independent QA profile_contract: health-history 38/38; pnpm check 102/102 inkl tsc/lint; pnpm bundle:ios PASS via godkänd filskrivningseskalering efter sandbox EPERM; git diff --check PASS. Reviewer b2_reviewplan PASS stable source; Security PASS lokal syntetisk utveckling, inga kvarstående fynd. Befintlig statisk authassertion justerad för sessionfält, runtime authtester fortsatt verifierade.
Rättade utvecklingsfel: radering måste matcha requested ID eller kontrollera target separat; formulär återställs efter direkt/reconciled radering och accepterad konflikt. Detta är inte fel i tidigare release. Native/RLS ej körda här och inte påstådda PASS. Inga dependencies/migration eller betaaktivering i B2. Nästa paket APP-04C kan starta direkt enligt Eriks telefonpolicy.

## Slutcheckpoint APP-04C — lokalt klart
Luna medium b2_contract implementation; correction1 reviewer BLOCK saved-besked vid osparat utkast åtgärdad och next_reviews renewed Reviewer PASS/Security local PASS. Independent QA profile_contract: profile 27/27, full pnpm check 129/129 inklusive type/lint, iOS-export PASS (dist/ios verifierad inom repo, eskalerad skrivning efter EPERM), diffcheck PASS. Faktiska SDK/localfetch, workspacehandlers/comparator och editorns statusuttryck provade; inga nya appdefekter observerade. Native/deployed RLS ej testade och inte påstådda PASS. Nästa P03 efter denna hållbara checkpoint, ingen PHONE-grind.

Lokal Git-checkpoint 4bbdb1b sparar B2 och APP-04C plus samlad MVP-plan, 129/129 QA och release-loggar. Inte pushat. P03 startas från denna verifierade bas.

## P03 slutcheckpoint — 2026-10-06
Luna medium Implementer source stable correction1; QA profile_contract 31/31 fokuserat, pnpm check 160/160, iOS-export PASS efter lokal EPERM-elevation, diffcheck PASS. next_reviews oberoende Reviewer PASS och statisk Security PASS. Oförändrat passerat datum tillåts vid anteckningsändring; separat planerad historik med immutable identitet/RLS och säker retry/lifetime. SQL tvåägarprov endast förberett; server/RLS och fysisk telefon ej testade. Release-log docs/releases/HISTORY-2026.md#p03-planned-health uppdaterad. Nästa P04 exakt v2 kontrakt granskas; inga nya rutinmässiga TestFlight-stopp.

## P04 final v5 checkpoint — 2026-10-06
Final QA51/51 fokuserat, pnpmcheck211/211 TypeScript/lint/tests PASS, diffcheckPASS. iOSexport redanPASS efter lokalpermissionretry före metadatafix; inga native/sourceUIändringar därefter. p04_final_review Luna medium renewed ReviewerPASS/statiskSecurityPASS. dog_expert faktisk förgranskning inga materiella blockerare; exakta sista valp→hund-korrigeringen verifierad i body. Mänskligreviewpending, draftimport aldrigkörd. Utformad läsbar granskningsfil docs/content/mvp-content-review-v1.md och expertunderlag p04-dog-expert-review.md. P04 lokal leverans färdig; publicerat innehåll/granskarapproval återstår inför beta. Nästa P05 enligt reviewad exaktplanv2.

## P05 slutcheckpoint — 2026-10-06
Luna medium QA12/12 fokuserat, full223/223 inklusive typecheck/lint PASS, iOSexport efter lokal EPERM-elevation och diffcheckPASS. p04_final_review oberoende renewed ReviewerPASS/statiskSecurityPASS, fixturemetadata-granskning bevarade assertions. Guidemarkörer renderas nu som native läsblock; Home plainpreview delar exakt fetchedversion, state/sourceURL/sluggrindkontroller verifierade lokalt. P04-råd fortfarande draft/humanpending. Release-log P05-CONTENT-UI.md aktuell. Nästa P06 enligt approved passport-pdfv2.

Erik bekräftade 2026-10-06 att mänsklig sakgranskning ännu inte är utförd. Innehållsutkast väntar fortsatt; oberoende tekniska MVP-paket fortsätter.

## P06 slutcheckpoint — 2026-10-06
Luna medium QA30/30, full253/253 inklusive typecheck/lint PASS, iOSexportPASS efter lokal EPERM-elevation, diffPASS. Renewed independent ReviewerPASS/staticSecurityPASS. Identisk preview/PDFsnapshot, valbara sparade fält, explicit lokal systemdelning och strikt cache/Print→ägt cacheprefix med best-effort cleanup. Native fysisk rendering/delning ej utförd; human contentreview fortsatt pending. Release-log P06-PASSPORT.md aktuell. Nästa P07exaktv3 faktisk ArchitectAPPROVE/CriticPROCEED/SecurityAPPROVE/ComplianceAPPROVE(localpurpose only).

P07 interna DATAcheckpoint: author typecheck/diffPASS; QA41/41 fokuserat (nya reminderquery/preimage plus befintliga planregressioner). Migration intekörd. Nativepaket57.0.22 verifierat, NATIVE/storage nästa.

## Återupptagning2026-10-07
Erik beställer fortsätt. Humancommitfc39347 fx fångade P07inprogress; worktreeclean vid återstart och bevaras. Implementer/QA/reviewer Luna medium återupptagna efterusageavbrott. P07TAP/cleanupfailure/retentionhardening återstår, fullQAejutförd. Sakgranskning/consent/installURL/testDBfrågor svarpending; inget implicitgodkännande. P11slutmatris förberedd utan distribution.

## P07 slutcheckpoint —2026-10-07
Luna medium QA78/78 fokuserat, full300/300 inkl TypeScript/lint PASS, iOSexportPASS efter EPERM-elevation och diffPASS. Independent renewedReviewerPASS/statiskSecurityPASS. Frivilligt master-/plan-/träningsval, strictframtidsurval, aktuelltägda notistap, genericcopy, actualSDK UTCcalendar/Androidvalue, kontosäkercleanup ochmasteroffavbokning. SQLprobe/nativeleverans ejutförda, ingenpublicering. Release-log P07-REMINDERS.md aktuell. P08/P09 affectedrealdata väntarpåErik; exaktgranskadP10lokalkandidat kanfortsätta obehindrat utanlivedeploy.

## GitHub-status verifierad 2026-10-07
GitHub Releases API returnerade 0 releaser. Remote main: fc393471d4ebd7317420782fded166dc0600540f (fx). P07 slutcommit 36b23d5 är lokal och ingår inte i detta verifierade remote-head. P10 pågår lokalt. Jämförelser ska använda dokumenterad commitbas och inte en påhittad senaste Release.
P10 privacy- och livscykelutkast förberedda i docs/privacy/beta-information.md och docs/dev/beta-data-lifecycle.md; inga driftjobb eller publicering.

## P10 QA slutcheckpoint — 2026-10-07
Luna medium QA profile_contract:39/39 riktade konto-/server-/SDK-/markör-/kötester PASS; full pnpmcheck339/339 inklusive app-TypeScript, edge-TypeScript och lint PASS. Godkänd exakt app-screen UX dependencyassertion4/4 PASS, övriga assertions bevarade. Root iOSexportPASS1315moduler, diffPASS. ActualSDKfakefetch+syntetisk storage bevisar PKCE/tokenPOST, session/events och signoutverifierstädning; React-native/UI/nativeauth inte bevisat av sourceharness. SQL tvåägarcascade/rollbackprobe förberedd men inte körd. Deno-runtime/liveAuth/RLS/deploy/realaccounts ejtestade. Queue review, slutlig oberoende Reviewer/staticSecurity väntar.
Release-loggar P08-ONBOARDING/P09-METRICS/P11-BETA-QA skapade för planstatus/checkpunkter; inga planerade funktioner listas som implementerade.

## P10 hållbar lokal leverans — 2026-10-07
Lokal commit e5611bc: Complete local beta account deletion candidate and checkpoints. Jämförelse 36b23d5..e5611bc. Slutlig ReviewerPASS/staticSecurityPASS faktisk; QA39/full339 och iOS/diffPASS. Ingen push, GitHubRelease, Edge-deploy eller TestFlightbuild genom arbetet. P01–P07 och P10lokalkandidat klara; hela MVP:n ännu inte betaredo.

## UX-01 slutcheckpoint — 2026-10-07

Ägarens skärmbilder och `UX-01-work-checkpoint.patch` användes som underlag, men patchen applicerades inte oförändrad. Planerad hälsa har nu en informationsmodal i stället för två skrymmande hjälpboxar, tidsbegränsad handlingspopup och exakt en synlig återställningsåtgärd. Popupen köas bakom informationsmodalen, gammal status spelas inte upp vid navigation och listuppdatering remonterar inte längre formuläret. Försvunnen redigerad post återställer formuläret säkert.

Architect APPROVE v1.5, Critic PROCEED, independent QA PASS och renewed Reviewer PASS. Faktiskt: riktat 7/7, `pnpm check` 346/346, iOS-export och diffkontroll PASS. CRLF-korrigeringen normaliserar bara testinläsning i tre filer. Native modal/fokus/timer/VoiceOver/stor text är fortsatt `NOT TESTABLE`. Ingen push, GitHub Release eller TestFlight-build gjordes. Release-logg: [UX-01](../../releases/HISTORY-2026.md#ux-01). Nästa exakta slice gäller övriga info/statusytor, datum/tid och tangentbordsknappar.

Lokal leveranscommit: `0ee9078` (`fix: improve planned health feedback UX`). Dokumentationscheckpointen som registrerar commit-ID:t följer separat; ingen push gjordes.
Nästa nödvändiga mänskliga svar: tidigare fråga om frivilligt separat samtycke för uppfödarkälla/betamätning eller bortvald individmätning; identifiera godkänd syntetisk Supabase-utvecklingsmiljö och redan körda migrationer; beta-installationslänk/pilotuppfödare inför verkligt utdelningsunderlag. Sakgranskning är uttryckligen inte klar. Leverantörs-/backupfakta och slutdatum saknas inför realbetadrift, ingen aktiv gallringsautomation.

## DESIGN-POLICY-01 — införd policy 2026-10-07
Erik begär skarpare UI/UX-regler och lämnar original DESIGN_RULES (1).md samt Tassla-design-policy.zip. Originalet införlivat i docs/design-rules.md; faktisk målbild vision_rev01.jpg visuellt läst. Alla nio aktiva rollfiler, AGENTS, UI-standarder, workflow och gemensamma SDK-instruktioner kopplade till policyn. Product/Critic granskar copy, separat QA/Reviewer bedömer renderad UI med 18 punkter. Max en primary, delade tokens/komponenter, kompakta flöden, inga tekniska banners/normalstatusbadges. Scope, nödvändig information, ärliga resultat och Eriks telefonbeslut bevaras. Appkod har inte ändrats eller visuellt rättats.
Riktad verifiering:9TOML+policyrefs och2PythonAST PASS, diffPASS. Ordinarie pnpmcheck FAIL på saknad lokal expo-notifications dependency i oförändrad appkod; ingen appcheckPASS påstås. Befintligt head6cbd5f4, inte tidigare historisk251f5b7. Release-log docs/releases/DESIGN-POLICY-01.md. Oberoende slutreview väntar; inga API-kostnader, externa meddelanden, push/deploy eller nya modeller/verktyg.

DESIGN-POLICY-01 slutreview: faktiskt ReviewerPASS/CriticPROCEED för instruktioner efter rättad canonicalreferens. Fullappcheck fortfarandeFAIL saknadlokaldependency, ingen UIleverans påstås. Befintliga appvyer kräver separat implementation, skärmdumpar och checklistan innan de rapporteras visuelltklara.

DESIGN-POLICY-01 lokal leveranscommit4f676b8, jämförelse6cbd5f4..4f676b8. Endast instruktioner/policy; ingen push.

## DS-CODE-01 implementationscheckpoint — 2026-10-07

Architect APPROVE plan v4 och Critic PROCEED WITH CHANGES tillämpades. Kodtokens, 18 beställda komponentfamiljer, central kategoriikonmappning, dev-only galleri, lintgrind och policytester är implementerade utan ändring av befintliga produktskärmar eller produktionsnavigation. Primary `#186A4D` behålls från dagens app/inventering/Figma-plan.

Faktiskt verifierat: frusen dependencyåterställning utan lockfileändring; `pnpm check` PASS med 355/355 tester, 0 lintfel och 238 dokumenterade legacyvarningar (62 hex, 176 numeriska fontSize i 18 filer); `git diff --check` PASS. Display=Title är tillfälligt alias, avmaskning=`medical-outline` är öppen ikonfråga och HeroCard använder overlayapproximation.

Visuell QA är NOT TESTABLE: Windowsmiljön saknar Android-enhet/emulator, iOS-simulator och webbruntime. Ingen skärmdump finns, så paketet är inte visuellt godkänt eller DONE. Release-logg: [DS-CODE-01](../../releases/DS-CODE-01.md). Nästa steg: oberoende QA/reviewer och därefter verklig gallerirendering på liten/stor bredd och stor text.

DS-CODE-01 korrigeringsförsök 1: Reviewer blockerade den oanvända `Button.fullWidth`-propen. Architect APPROVE v4.1; propen togs bort, vanliga knappar låstes till full bredd och ikonknappen till tokeniserad 44×44. Förnyad QA PASS fokuserat9/full356/diff; iOS-export PASS. Förnyad reviewer kod-PASS. Totalstatus förblir BLOCK eftersom renderade galleriskärmdumpar saknas; visuell QA är NOT TESTABLE och får inte ersättas av kodkontroll.
## LOG-UI-COMPONENTS kompletteringscheckpoint — 2026-10-08

Read-only Figma context och screenshot lästes för AppBar `13:113` efter metadata-inspektion av sidan `Design system`; inga Figma-skrivverktyg användes. Den befintliga DS-CODE-01-slicen kompletterades med BottomNav (fem MVP-destinationer), ActionMenu (Ändra/Radera), Skeleton, `Color/borderStrong`, Field states, ListRow time/detail/chevron och truthful Toast (`confirmed`/`uncertain` + retry). BottomSheet har ingen delningsstandardtext.

Product gav små copyändringar som är införda. Critic blockerade först på delningscopy, ListRow-kontrakt och statiskt pressed-state; alla tre är korrigerade. Typecheck/lint kunde inte starta då pnpm saknar lokalt installerade paket och registryåtkomst blockeras med EPERM. `git diff --check` passerar. Visuell QA, stor text, skärmläsare och gallery screenshots är NOT TESTABLE utan Expo-rendering.

## LOGGA-QUICK kod-/beteendecheckpoint — 2026-10-08

Utgångspunkt är remote `37bf93f feat: complete shared log UI component library`; `origin/main` verifierades på nytt till exakt denna commit. UX-specen sparades före appimplementationen i commit `80cc3ae` och har efter oberoende fynd korrigerats till v6. Logga använder bibliotekets AppBar, QuickLogTile, BottomSheet, ListRow, Dialog, Toast, Skeleton och tokens: 2×2 Kiss/Bajs/Mat/Sömn, Fler för Promenad/Vaken, mönster först vid minst två poster, kompakt datumgrupperad historik och bevarad rättning/radering fram till LOGGA-EDIT.

Sparmönstret är pending på berörd rad, bekräftad success-toast med Ångra endast för verkligt sparad insert, failed med retry/uttryckligt avbryt och unsure utan falsk success. Dubblettskyddet använder två sekunders snabbtrycksgrind och två minuters kategorifönster. Retry behåller samma UUID, readback visas som pending och flight-token gör att hund-/sessionsbyte omedelbart frigör nästa flöde utan att en gammal `finally` kan rensa en ny mutation. Unresolved edit behåller och låser typ, datum, tid och anteckning. Pendingstatus ingår i skärmläsaretiketten.

Architect APPROVE v6. Oberoende QA PASS och Reviewer PASS för kod/beteende efter två blockerande granskningsrundor och rättningar. Faktiskt verifierat: riktade loggtester PASS (18 tester i två filer; ett separat Stockholm-villkor hoppas över i denna UTC-miljö), app- och edge-TypeScript PASS, riktad ESLint 0 fel med 19 befintliga workspace-varningar, iOS-export PASS, `git diff 37bf93f --check` PASS och kövalidering PASS. Full `pnpm check` är fortsatt blockerad av två oförändrade baselinefel i `37bf93f`: notifications-testets spawnade Stockholm-kontroll ger tom stdout och UI-library-testet förväntar `medical-outline` medan baseline IconChip har `bug-outline`.

Renderade skärmdumpar saknas eftersom miljön inte har iOS-/Android-simulator eller webbberoenden. Liten/stor telefon, stor text, safe area, tangentbord/fokus och den fulla tillståndsmatrisens upplevda kvalitet är därför NOT TESTABLE. LOGGA-QUICK är blockerad, inte DONE, och LOGGA-EDIT har inte startats. Nästa steg kräver att Erik öppnar `pnpm start:preview` på en kompatibel telefon eller tillhandahåller native rendering; därefter fångas matrisen och en annan roll gör visuell QA. Ingen push, GitHub Release, TestFlight-build, dependency-, schema- eller databasändring har gjorts.

Lokal implementationscheckpoint: `230ad34` (`feat: redesign quick log experience`). Den är inte pushad. Dokumentationscommitten som registrerar checkpoint-ID:t följer separat.

## UX-03 lokal checkpoint — 2026-10-09

Implementerat `MainSwipeNavigation` för de sex MVP-ytorna Hem → Valplogg → Träning → Hälsa → Kunskap → Tassla-pass i `ProductWorkspace`, med befintlig Expo Router-ingång och `BottomNav` kvar. `ScreenTransition` stöder nu en tokeniserad horisontell variant för sidbyte, medan reducerad rörelse tar bort förflyttning och befintliga vertikala övergångar behåller y-axeln. `HomeCarousel` visar fyra/fem tappbara kort från befintliga tränings-, logg-, kunskaps- och hälsodata samt `Logga nu`; snap stängs av vid reducerad rörelse. Ingen dependency, lockfil, migration eller datamodell ändrad.

Plan/checkpoint: [UX-03](ux-03.md). Release-logg: [UX-03](../../releases/UX-03.md). `git diff --check` PASS. `pnpm typecheck`, `pnpm lint` och `pnpm test` kunde inte slutföras eftersom lokala paket saknas och återställning via registry ger EPERM; direkt Node-test gav 12 pass och 13 importfel. Native/renderad QA är NOT TESTABLE. Nästa steg är dependencyåterställning, full `pnpm check` och separat visuell/native QA av swipe/carousel på liten/stor skärm och reducerad rörelse.

## UX-04 lokal checkpoint — 2026-10-09

`formatDogAge` centraliserar all användarsynlig hundålder till `Y mån` eller `X år Y mån`; Hem, preview och Tassla-pass använder profilens födelsedatum. Interna veckor används fortsatt endast för befintliga åldersintervall i publicerat content/training och visas inte. Hem-carouselen kompletterades med åldersetikett i relevanta kort och tydligare Valplogg-copy; dess upstream-data är redan age-/breed-filtrerad.

`tasks.md` saknas i repot; detta är dokumenterat i UX-04. Riktad domain-test passerar och `git diff --check` passerar. Full typecheck/lint/test är blockerad av saknade paket/registry-EPERM. Visual-check försöktes men preview-site saknas och Chromium avslutas med SIGTRAP; skärmdumpmatrisen är NOT TESTABLE. Checklista och exakt avvikelse från “HeroCard på Hem” finns i [UX-04-checklist](../../design/UX-04-checklist.md). Release-logg: [UX-04](../../releases/UX-04.md).

## UX-05 lokal checkpoint — 2026-10-09

Hem använder nu den befintliga `HeroCard` överst med hundens profilnamn, profilbaserad ålder i år/månader och befintlig hundbild. `HomeCarousel` ligger direkt därefter och visar 4–5 ålders-/rasrelevanta, tappbara kort med befintliga komponenter/tokens. BottomNav, datumväljare och `Idag för [namn]`-flödet är bevarade; pressed-state och reducerad-rörelse följer gemensamma komponenter.

Riktad domain-test och `git diff --check` passerar. Full typecheck/lint/test är blockerad av saknade paket/registry-EPERM. Visual-check försöktes men preview-site saknas och Chromium avslutas med SIGTRAP; skärmdumpmatrisen är NOT TESTABLE. Ifylld checklista finns i [UX-05-checklist](../../design/UX-05-checklist.md). Release-logg: [UX-05](../../releases/UX-05.md).

## BUILD-35 lokal QA-checkpoint — 2026-10-09

Codemagic-loggen från `Tassla_35_artifacts.zip` visade TS2305 för `ReactNode` importerat från `react-native`. Importen kommer nu från `react`; följande lintfel rättades genom stabil svepresponder, atomiskt navigationsstate och ett lokalt motiverat undantag för attributionens synkrona loading-reset. Två källkodshärledande tester uppdaterades till redan befintlig busy-spärr och handlerns faktiska dependency-lista. Ingen avsedd användarflödesändring eller Supabase-ändring.

Architect APPROVE v5, oberoende QA PASS och oberoende Reviewer PASS efter rättad dokumentationscheckpoint: `pnpm check` med två typkontroller/lint samt 387 godkända tester, ett överhoppat, noll fel; notifieringar 42/42 och kontoradering 39/39. iOS-export, diffkontroll och kövalidering PASS. Testunderprocesser krävde extra lokal sandbox-behörighet, och Expo-telemetri stängdes av för exporten. Kodcommit `94686aaa8e717aaca069fde8ae5cc960d2fbc287` pushades till `origin/remove-ai-slop` och verifierades på remote; dokumentationscheckpoint följer separat. Native/renderad visuell QA, signerad Codemagic-build och TestFlight är NOT TESTABLE här. Plan: [BUILD-35](build-35.md). Release-logg: [BUILD-35](../../releases/HISTORY-2026.md#build-35).

## UI-06 lokal checkpoint — 2026-10-10

Hem + Logg: tydligare **Logga nu**, fotokarusell med fyra originalgenererade tillgångar (tre valpbilder och en generisk silhuett), faktiska dagsrader utan duplicerade carouselmål, ID-baserad plan-deduplicering endast mot faktiskt renderade dagsrader, diskret övergång för ny bekräftad loggrad samt Olycka-ikon med vatten + bajs sida vid sida. QA skärmdumpar och 18-punktschecklista: [UI-06](../design/UI-06/). `pnpm check` 387 pass / 1 skip / 0 fail, iOS-export, riktad v6 state-QA, code review, diff- och kövalidering PASS. Visuell helhet står fortfarande UNDERKÄND på punkt 15: Hem/Logg-etiketterna i delad bottenmeny går ihop vid 140 % text. Native rörelse, VoiceOver, tangentbord och fysisk safe area är NOT TESTABLE i RN Web. Plan: [UI-06](ui-06.md). Release-logg: [UI-06](../../releases/HISTORY-2026.md#ui-06). Nästa slice UI-07 åtgärdar centrerat varumärke och bottenmenyn; lokal checkpoint sparas före start.


## UI-07 lokal checkpoint — 2026-10-10

`AppBar` visar nu dämpat centrerat `Tassla` i alla varianter; sidtitlar och kontroller behåller plats/semantik. `AppScreen` ger footern full device-bredd och bottom inset endast när footer finns. `BottomNav` använder hela kolumnbredden; fem etiketter passerar vid 140 % och 360/430 px. QA verifierade Home notification, alla fem flikar, Back/Close och riktig sign-in utan footer. `pnpm check` 387 pass/1 skip, iOS-export, screenshots/checklista, independent review, diff- och kövalidering PASS. Fysisk safe area och native selected-state/Dynamic Type/motion/tangentbord/VoiceOver är NOT TESTABLE i RN Web. Plan: [UI-07](ui-07.md). Release-logg: [UI-07](../../releases/HISTORY-2026.md#ui-07). UI-06 checklistpunkt 15 godkändes på samma skärmdumpar.

## FIX-36 QA-checkpoint — 2026-10-10

Rättad tidsregex i Hälsa: giltig `HH:MM` avvisades eftersom mönstret matchade bokstaven `d`. Ny ren parser har gränstester `00:00 → 0`, `23:59 → 1439`, trimning, formatfel och intervallfel. Sparvägen skickar minuter när påminnelse är aktiv och fortsatt `null` när den är av. Lokalt `EventType`, logg-unioner, insertväg och migrationscheckar innehåller `accident`/`water`; befintliga migrationsfiler täcker typ- och shape-constraints.

Architect APPROVE/Critic PROCEED för FIX-36 v2; independent QA och Reviewer PASS. Fokuserat parserprov PASS; `pnpm check` PASS (389 pass, 1 skip, 0 fail; tidszonstestets barnprocess krävde tillfällig tilläggsåtkomst eftersom standardsandbox returnerade EPERM); iOS-export PASS, diff-/kövalidering PASS. Ingen migration/deploy och inga credentials lästa. Ingen Supabase CLI, `.env` eller länkat projekt hittades: fjärrens applicerade historik, aktuell live-constraint och insert/RLS-runtime är NOT TESTABLE. Lokal kod och migrationsfiler omfattar `accident`/`water`. FIX-36 checkpointas och pushas efter commit. Release-logg: [FIX-36](../../releases/HISTORY-2026.md#fix-36).

Leveranscommits efter att befintligt fjärrcommit `af1bc7a` bevarats: UI-06 `e50da50`, UI-07 `3adf73d`, FIX-36 `e29a5fb`. Push utförd till `origin/remove-ai-slop`; fjärrverifiering görs efter push.
## UI-08 lokal checkpoint — 2026-10-10

Toast i appen har nu semantiska 1 px-kanter enligt befintliga tokens. Figma-huvudkomponenten hade redan motsvarande färgade ramar, så ingen Figma-mutation behövdes. Hem visar karusellen före datumremsan och högst tre nyaste inlästa loggar för valt datum, med luft efter `Logga nu`. Mer-rader och bottenflikar har tokeniserad spacing. Kunskapskortens mindre rubriker och publicerade träningsrader använder kompakt befintlig typografisk token; övriga ListRow-anrop behåller standardstorleken.

Typecheck, edge-account typecheck, iOS-export, riktat `tests/log-screen-policy.test.mjs`, `git diff --check` och kövalidering passerar. Lint har 0 fel och 33 varningar. `pnpm check` fallerar bara i `tests/notifications.test.mjs`: sandboxens interna `spawnSync` ger tom output i timezone-deltestet; samma beräkning direkt returnerar förväntat resultat. Oberoende källreview fann inga UI-fel.

Visuell QA vid 360/430 px och 140 % är NOT TESTABLE: localhost-bind nekades och Chromium stoppade vid `setsockopt: Operation not permitted`. Inga nya skärmbilder skapades. Ingen visuell PASS eller färdiggranskning rapporteras. Checklista enligt designreglerna finns i [UI-08 visuell QA](../../design/UI-08/checklist.md), markerad NOT TESTABLE. Implementeringsdetaljer och ändrade appfiler finns i [UI-08](ui-08.md); sammanfattning finns i [release-loggen](../../releases/UI-08.md).

## MOTION-01 implementation — 2026-10-10

Implementerade tokeniserad React Native Animated-rörelse för Toast, Progress och bekräftad ChecklistItem samt uppdaterade toast-ägare i de åtta planerade vyerna. Ändrade även komponent-/themeguider och designregler. `TrainingScreen.tsx` och `ProductWorkspace.tsx` har ingen ny motionskod. Ingen dependency, sparsemantik, dubblettfönster, analytics eller data ändrades.

Verifiering efter rättningar: `node --experimental-strip-types --test tests/motion-policy.test.mjs` PASS (sex policykontroller i en testfil), `git diff --check` PASS och `python tools/dev_flow.py validate` PASS. `pnpm typecheck` kunde inte starta eftersom pnpm försökte hämta paket och nätverksanrop gav EPERM; full `pnpm check` saknar därför PASS.

Oberoende QA blockerade först på loggredigeringens feltoast och borttagen OS-rekommenderad timeout; båda är rättade. Vikt-toastens gamla exit callback skyddades mot att rensa nyare feedback. Förnyad QA hittade inga statiska fynd men native/visuella acceptanskriterier är NOT TESTABLE: timing, VoiceOver/TalkBack, stor text, reducerad rörelse och dold Toast-layoutgap saknar renderad evidens. Oberoende Reviewer gav code review PASS; full typecheck/lint och native QA återstår. MOTION-01 är inte DONE och MOTION-02 har inte startat. Eriks DS-CODE-01/LOGGA-QUICK-rapport avser inte MOTION-01. Se `docs/releases/HISTORY-2026.md#motion-01`.

## MOTION-02 implementation checkpoint — 2026-10-10

Plan/spec v4 hade Architect APPROVE och Critic PROCEED; LOGGA-EDIT och MOTION-01 avslutades enligt dokumenterade ägaraccepterade undantag före start. Efter Reviewer-blocker på replay vid reduced-motion-toggle konsumerar entrén nu mutationsnyckeln vid start och avslutar aktiv rörelse direkt när reduced motion slås på. Ny namngiven policy assertion täcker on-mid-entry → off utan replay. Architect APPROVE och Critic PROCEED för korrigerat kontrakt. Implementerat: en-gångs entré för bekräftad ny loggrad; in-place inert delete-snapshot med pending semantics, saved-only exit, reduced-motion direktborttagning och token-guard; träningsidentitet returneras först efter refresh/read-back av nytt specifikt steg; ListRow ger tillgänglig “Genomförd”-etikett och bockanimation endast på opt-in-raden. QuickLogTile, toast, undo och duplicate guards orörda.

Verifiering efter korrigering: `TZ=Europe/Stockholm pnpm check` PASS (399/399; 0 skip; lint 0 fel/35 varningar); fokuserade fyra policytestfiler PASS; `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS; `git diff --check` och `python tools/dev_flow.py validate` PASS. Full check behövde subprocessåtkomst för existerande timezone-test; standard-sandbox returnerade EPERM för dess child Node-process.

Förnyad oberoende code QA och Reviewer PASS på korrigerad diff: QA körde fyra policytestfiler och diffcheck; verifierade one-shot reduced-motion no-replay, delete, training-readback, accessibility och dubblettfönster. Commit `a020779` innehåller MOTION-02; `bff79b9` rättar äldre whitespace som krävdes av den nya branchens hook. Båda commits pushades till `motion-02-phone-qa` efter att pre-commit och pre-push passerade. Renderad skärmbild, VoiceOver/TalkBack, Dynamic Type på enhet och native animationsbeteende är NOT TESTABLE: React Native Web preview-dependencies saknas. Nästa steg är Codemagic-build och Eriks telefonprov. Release-logg: [MOTION-02](../../releases/HISTORY-2026.md#motion-02).

## MOTION-03 planering och återstående inventering — 2026-10-10

Erik bekräftade att APP-01-PHONE är klar: Google Sign-In/OAuth fungerar i Codemagic utan problem. Registrerat som användarrapporterat PASS; build/version är okänd och Codex har inte gjort en egen telefon- eller OAuth-körning. Köstatus är uppdaterad till `done` på ägarens uttryckliga godkännande.

## MD-struktur och MOTION-04 — 2026-10-10

Tjugotvå avslutade release-notiser har samlats i [HISTORY-2026.md](../../releases/HISTORY-2026.md); datum, status och commitreferenser har bevarats och okända uppgifter är inte ifyllda genom antaganden. Aktiva/blocked eller opushade paket behåller tillfälliga egna loggar. `docs/tasks.md` är märkt historiskt underlag, aktuell status finns i `queue.json`. Arbetsflödet och `AGENTS.md` uppdaterades för den nya arkivregeln. MOTION-03 (`117c406`) och MOTION-04 (`ac2b940`, dokumentcheckpoint `f2b1afc`) är nu pushade på `motion-03-first-use-tip` och deras releasnotiser arkiverades i den samlade historiken.

Erik begärde också att MOTION-04 byggs. Plan v1 och uppdaterat kökontrakt använder en transparent illustrerad valpfigur, reaktion endast efter bekräftad loggning/träningssteg, befintlig textfeedback och ingen ändring av Hem. Architect APPROVE och Critic PROCEED gavs på exakt v1 efter att LogScreen-mountnyckel och träningsskärmens avmonteringsspärr preciserats. MOTION-03 fick lokal QA/Reviewer PASS och commitcheckpoint `117c406`. Transparent 512×512 RGBA-asset (161,690 bytes) och metadata är skapade. `PublishedTrainingScreen` har befintlig lokal animationssekvens som ökar per bekräftad completion; efter reset får nästa bekräftade completion en ny sekvensnyckel. Reducerad rörelse inväntar nu samma hook-query/eventkälla innan engångsnyckeln förbrukas; stale query och fallback kan inte skriva över ett nyare event. Ingen persistent/affärsstatus för figuren införs. Slutlig `pnpm check` passerar med 30/30 testfiler och lint 0 fel/35 varningar; iOS-export med 1,418 moduler, diffcheck och queue validation PASS. Oberoende QA och Reviewer PASS. MOTION-04-implementationen (`ac2b940`) och checkpointdokumentationen (`f2b1afc`) är pushade på `motion-03-first-use-tip`. Renderad/native/VoiceOver/TalkBack/stor text/telefon är NOT TESTABLE här och lämnas till Eriks samlade mobil-QA. Samlad releasepost: [MOTION-04-historik](../../releases/HISTORY-2026.md#motion-04).

Erik godkände MOTION-02 för fortsatt arbete och begärde att senare kontrollera MOTION-paketen tillsammans. Det uttryckliga undantaget från stopp per slice finns i [beslut 0005](../../decisions/0005-motion-batched-mobile-qa.md). MOTION-02:s native/visuella kontroller förblir NOT TESTABLE tills den samlade granskningen.

Inventeringen i [MOTION-remaining-inventory.md](MOTION-remaining-inventory.md) listar resterande delar utanför MOTION-03. MOTION-04 kan implementeras efter MOTION-03:s egna plan-, QA-, Reviewer- och checkpointgrindar. DS-CODE-01, LOGGA-QUICK och UI-08 har separata renderings-/visuella artefakter kvar trots Eriks tidigare telefonrapporter. FOUNDATION-DB-VERIFY kräver underlag från Erik och får inte köra migration igen; APP-01-PHONE är användarrapporterat klart; APP-05-PHONE-DB kräver separat mandat och utvecklings-Supabase. APP-04A-PHONE finns som användarrapporterat PASS i annan checkpoint men saknar build/version.

Product rekommenderade att utelämna överflödiga Hem- och Hälsa-tips. Slutlig copy är “Tryck på Fler för fler loggtyper.” och beskriver en dold loggfunktion. Efter v1–v3-korrigeringar gav Architect APPROVE och Critic PROCEED för plan v4; queue validation var felfri före implementation. Implementation på `motion-03-first-use-tip` omfattar delad tip-komponent/hook, ägarspecifik SecureStore-status, LogScreen-avfärdning via kontrollaktivering, konto-raderingsstädning och guider. Ingen ny serverdata eller analytics.

Compliance granskade den ägarbundna SecureStore-flaggan 2026-10-10. Eftersom den kan knytas till ett konto är flaggan en personuppgift; den föreslagna enda användningen är att styra tipsets visning. Bedömningen tillåter den avgränsade implementationen med minimering, ägarseparation och radering vid bekräftad kontoborttagning. Inga nya DB-fält eller analytics ska införas. Källram: GDPR artiklarna 4(1)–(2), 5, 6, 13, 17 och 25; IMY:s vägledning; EDPB Guidelines 4/2019. Detta är inte juridisk rådgivning. Slutlig rättslig grund och integritetsinformation är fortfarande beta/release-grind enligt [beta-information](../../privacy/beta-information.md).

Planen begränsar denna första tipsslice till LogScreen. Visning och persistent flagga kräver ägare; endast kontrollaktivering avfärdar tipset; passiv scroll/fokus och tom yta räknas inte. Lagringsfel stänger av tipset för ägare/skärm under appprocessens återstående tid utan att hävda persistent sparning. Bekräftad kontoradering ska rensa nyckeln genom ProductWorkspace:s befintliga lokala cleanup.

Tassla Consumer UX-skill hittades i `.agents/skills/tassla-consumer-ux/SKILL.md` och lästes före implementation tillsammans med `docs/design-rules.md`. Policytester för ägarseparering, read/write-fel, stale concurrent read, radering, redo-grind, kontrollaktivering och stängning finns nu i `tests/first-use-tip-policy.test.mjs`; account-delete- och äldre LogScreen/notifications-assertioner uppdaterades mot det verifierade beteendet. Fokuserade tester passerade. Full `pnpm check`: typecheck PASS, edge-account typecheck PASS, lint 0 fel/35 varningar och 29/29 testfiler PASS. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`, `git diff --check` och `python tools/dev_flow.py validate` PASS. Oberoende QA PASS och Reviewer PASS efter rättning av skriv/remount- och skriv/raderingstävlingar. Visuell/native rendering, VoiceOver/TalkBack på enhet och stor text är NOT TESTABLE här och ingår i Eriks samlade mobil-QA. MOTION-03 checkpoint `117c406` är pushad på `motion-03-first-use-tip`; releasepost: [MOTION-03-historik](../../releases/HISTORY-2026.md#motion-03).
## UI-09 — 2026-10-10

Implementerade kompakt bekräftad success-toast med dekorativ grön bock och flyttade bekräftade add/edit/delete till efter primärsnabbvalen och före `Fler`. DogMascot och sparstatussemantik är bevarade. Lade till `tests/toast-compact-policy.test.mjs` och dokumenterade coverage i `tests/README.md`. Fokustest 4/4, `pnpm check` (31/31 testfiler), iOS-export (1 418 moduler), diffcheck och kövalidering passerade. ESLint har 35 varningar, 0 fel. Oberoende QA: kod PASS, visual NOT TESTABLE. Oberoende Reviewer: BLOCK endast för saknad renderad evidens; statisk granskning av API/sparstatus/undo/felhantering PASS. RN Web saknas; inga screenshots finns. Paketet står BLOCKED och inte visuellt klart. Ingen commit/push. Nästa steg: rendera smal/stor layout och stor text, inklusive success/error/undo och `Fler` stängt/öppet/valt, fyll design checklistan; se `docs/releases/UI-09.md`.

## HOME-TIME-01 — implementeringscheckpoint 2026-10-10

Erik korrigerade scope efter v6: snabb loggning ska fortsatt vara ett tryck med befintlig aktuell tid; tid för utförd vaccination/veterinär är frivillig. Plan v7.1 har Architect APPROVE, Critic PROCEED och Product APPROVE. Implementationen återställer ett-trycksflödet, skickar tom hälsotid som `NULL`, förifyller känd tid vid redigering, lämnar legacy `NULL` blank och behåller Home-tidslinjens visning av känd tid. Strict wire-normalisering, NULL-aware health readback/CAS och migrationens nullable kolumn kvarstår. Vikt och planerad hälsa är utanför scope.

Lokal implementation finns. Inga testfiler ändrades och inga check-, test- eller buildkommandon kördes. Migrationen kördes inte. Oberoende Security APPROVE, käll-QA utan blockerande gap och Reviewer utan blockerande kodfynd är klara; renderad/enhets-QA och automatiska kontroller återstår. Ingen commit/push/deploy. Detaljer: [HOME-TIME-01](../../releases/HOME-TIME-01.md).


## 2026-10-11 – QA-11 och KNOW-02 plancheckpoint

Ny lokal branch puppy-checklists-faq-qa11 från 617fb67. QA-11 v3.1 Architect APPROVE, Critic PROCEED: valfri händelsetid separat från påminnelsetid, strikt legacy-läsfallback, tidsbekräftelse, backchevron, Toast-luft och maskot bort. QA-11 implementer startad; separat visuell QA förbereder isolerad harness. KNOW-02 v2 Architect APPROVE/Critic PROCEED efter fyra slices och konkret synkkontrakt; depends_on QA-11. Dog Expert råd fortsatt utkast; Compliance privat konto-/hundprogress tillåten lokalt, livekontroller separata. Inga appändringar eller godkända testsiffror tills implementer faktiskt verifierat. Inget commit/push i detta checkpoint.

### QA-11 A – implementercheckpoint

Data/API: due_time, egna kolumngrants, CAS/readback och strikt occurred_time-läsfallback införda. Implementer körde tsc PASS, planned-health 36 PASS och health-history 41 PASS, diffcheck PASS. SQL inte körd. Detta är agentrapporterad teknisk delcheckpoint, slutlig oberoende QA/review återstår. B påbörjas inom samma exklusiva kodscope.

### QA-11 A – Security PASS

qa11_security verifierade verkliga Supabase/PostgREST 2.117.2 API-definitioner, narrow grants/RLS oförändrad, separat notifieringstid, strikt legacy fallback och syntetiska tester/diffcheck. Ett verkligt integritetsfel med HH:mm:ss→CAS fångades och rättades med regression fetch→update→delete. Security PASS för A; live SQL/grants/RLS NOT TESTABLE. PGRST204/auth/network explicita regressionsfall kompletteras före full QA.

### QA-11 B – implementercheckpoint

Tidsmodal draft med Bekräfta tid/avbryt och reduced motion, enhetlig AppBar Back i fastställda vyer, gemensam Toast marginVertical. Agentrapporterat tsc PASS, planned health 38, time 3, history 45, toast policy 5, diffcheck PASS. A kompletterad med PGRST204/auth/nätfel och canonical DB-time regression. C påbörjad. Slutlig QA/renderad evidens återstår.

### QA-11 C – stabil implementation

Hem/Hälsa/carousel visar händelsetid och äldre påminnelsetid med explicit etikett; direkt history retry; maskot bort från Logg/Träning. samePlannedHealth omfattar nu canonical due_time även vid statuskontroll/replay, regression för avvikande tid finns. Implementer pnpm check PASS (31 testfiler; lint0fel39varningar), diffcheck PASS. Skrivägarskap släppt till QA/review; live SQL/native fortsatt NOT TESTABLE. Separat rendering slutkontrolleras.

### QA-11 v3.2 – renderad korrigering1

Första QA/review underkänd på hero tre rader, stora ändra/radera och normal Påminnelse av. BLOCK registrerat, ny plan v3.2 Architect APPROVE/Critic PROCEED. Rättat enbart PlannedHealthScreen/test/README: kort hero,44pt ellipsmeny med samma bekräftelse/blocked, av-etikett endast för kvarvarande tid. Agent pnpm check/diff PASS. Oberoende omprov begärt; första BLOCK inte överprövat.

### QA-11 v3.2 – oberoende QA PASS

qa11_visual: korrigerad lokal visual QA GODKÄND, 23 Playwright-kontroller/0 sidfel, 375/430 och140% text, menu callback shim och bekräftelse inom375x844. Oberoende pnpm check PASS31filer/0lintfel39varningar, diffcheck PASS. Tidigare fynd4/10/13 rättade. Evidence/checklista docs/design/QA-11. Native Alert/VoiceOver/faktisk Dynamic Type/live SQL och jämförelse med icke-lokala chattbilder NOT TESTABLE. Ny Reviewer-granskning begärd på rättad diff.

### QA-11 avslut / KNOW-02 start

Reviewer PASS rättad v3.2 (qa11_reviewer), oberoende lokal QA GODKÄND, SecurityPASSA. Hållbar workingtreecheckpoint på branch puppy-checklists-faq-qa11, bas617fb67; ingen commit/push. Full pnpm check/diff och köverifiering passerade; migration/liveSQL/native luckor kvar redovisade. QA11 skrivägarskap släppt. KNOW02 v2 ArchitectAPPROVE/CriticPROCEED + explicit användarmandat. Starta A schema/API, sedan B checklistflow, CFAQ/Hem, Dreviewtraining/buildguard med respektive checkpoint.

Koordinatorförtydligande: QA11 behövliga testfixture-filer notifications.test.mjs (due_time:null) och motion-policy.test.mjs (owner removed mascot assertion) registrerade i write_paths; ingen utökad appfunktion. KNOW02 privacy/lifecycle-texter uppdaterade av koordinator med checkliständamål, rättighetsexport och cascade-verifieringskrav, inga livepåståenden.

### KNOW-02 A – implementercheckpoint

Schema/API/catalog review-v1 infört. Agent typecheck PASS, focused model/data tests3PASS, scoped diffPASS; liveSQL inte körd. Dog/template/item/title-validering, tuple-upsert/delete, fast customUUID, CAS/reconciliation och context readback. Catalogens FK kräver static parent checklist_templates(id,title) eftersom itemtabellens PK är template/item; extra statisk relation saknar persondata/client writes, targeted Architect bekräftelse begärd. B UI bygger samma godkända flödeskontrakt.

Architect targeted KNOW02 A: checklist_templates parenttabell bekräftad som minsta FK-implementationdetalj inom godkänd v2, ingen ny planreview krävs. Ingen ny persondata/klientskrivning eller ändamål.

KNOW02 Security tidiga fynd: explicit revokeALLauthenticated behövs för Supabase defaults, column grants ska hindra custom id/dog/template flytt. Preference mergeupsert ändras till insert-ignore/updatecontext för att fungera med column grant. Delete0rows behöver exakt återläsning för idempotent lostresponse replay. Korrigering och meningsfull PostgREST/SQL-probe komplettering skickad implementer innan slutlig QA. Inget fynd överprövat, securitygate fortsatt öppen.

KNOW02 A Security omkontroll: grant/CAS/idempotensfynd rättade, verklig Supabase/PostgREST API verifierad. Gate fortsatt öppen: SQL-probe ska omfatta verkliga syntetiska tvåägareCRUD/denied/cascade och abortmock ska respektera signal. B fynd/livscykel och dataminimerad översikt rättas parallellt inom samma agent/exklusiva scope, ingen vidare verifierad checkpoint ännu.

## Återupptagning 2026-10-11 kl13:36UTC

Erik: fortsätt. Agentkörningen avbröts tidigare av användningsgräns; nytt turn startat från faktisk arbetskopia, inte omstart. QA11done lokalgranskat kvarstår. KNOW02A/B under implementation (Puppy262rader/data114test/SQL81rader vid läsning), CFAQ/Home och Dreviewtraining/buildguard ännu inte implementerade. Samma implementer/security/visual uppdrag återupptagna, inga nya mandatfrågor. Inga commits/push/liveSQL.

KNOW02 A Security statisk PASS efter SQL105rader: tvåägareCRUD/nekningar/WITHCHECK/kolumngrants/REFERENCES/TRUNCATE/account→dogcascade. Aborttester signalmedvetna; liveSQL fortsatt NT. B kvarvarande exact-intent fynd rättas: normalizedpostimage och volatile ProductWorkspace snapshot peraccountgeneration+dog bevarar unknownUUID/form över tillåten navigation; ingen globalMap/persistentlagring. Child abort/generation och explicit Kontrollera före nya skriver; per-template freshdata för summary. Security bekräftar föreslagen parentrefimplementation som säkrare detalj inom godkänt kontrakt.

### KNOW-02 fortsättning — 2026-10-11

A: oberoende statisk Security/Reviewer har inga kvarvarande konkreta schema/API-fynd; verkligt SQL/RLS-prov är inte utfört. B: granskning av okända sparresultat och navigation pågår; avsikten ska bevaras före begäran och återställas med synlig Kontrollera. C/D byggs inom godkänd v2. Implementer får ändra endast bundle:ios-scriptet i package.json för att köra den redan planerade innehållsgrinden före Expo-export; inga beroenden eller versionsändringar. Filen har lagts till i skrivscope. Ingen commit, push eller migrering har utförts.

### KNOW-02 B/C/D – granskning pågår

Implementer rapporterar typecheck och fokuserade model/data/UI-kontroller PASS för B. Reviewer och Security bekräftar statiskt att de tidigare navigations- och återmonteringsfynden rättats: aktuell avsikt/form fryses vid cleanup före abort och Kontrollera visas vid återkomst. Oberoende körbara livscykel-/reconciliationprov återstår; B är inte slutligt QA-godkänd. Renderad QA återupptagen för faktisk B och därefter C/D. C:s generiska guidegrid får inte visas på FAQ/Checklistor; koordinator och Reviewer har skickat samma konkreta fynd för rättning. D:s bygggrind/workflows ser statiskt korrekta ut enligt Security; molnhandler-isolering och slutliga tester väntar.

KNOW-02: checklist-intent.ts har extraherats inom befintligt knowledge-scope för körbara saved/retry/conflict-prov; skärmen använder klassificeraren. review-training-state.ts registrerad i exakt skrivscope för samma godkända lokala reviewMode-progression. Ingen funktionsutökning eller nytt beroende. Slutlig QA av integrationen återstår.

KNOW-02 tidig renderad QA: matikon på checklistkort rättas till befintlig grön träningsikon. Vid misslyckad första läsning får översikten inte visa falskt 0 av 3; visa okänd progress eller dölj antal tills läsningen bekräftats. Dubbla retryåtgärder ska undvikas. Fynd skickade implementer, ingen slutlig visuell PASS ännu. Körbara tester för exakt intent och scope-hantering kompletteras; faktiskt unmount/remount och cloud-handler-isolering provas även i separat UI-harness.

KNOW-02 koordinator: review iOS-export PASS, 1427 moduler, dist/ios. Första försöket stoppades av saknad Expo-hemmapp i miljön; omkörning med EXPO_NO_TELEMETRY=1 och EXPO_OFFLINE=1 passerade utan HOME-ändring. Bygggrind review+true passerade. Public+false-export körs därefter. Detta är lokal export, ingen signerad/native build eller TestFlight-distribution.

KNOW-02 public iOS-export PASS med public+false och 1427 moduler. Oberoende pnpm check hittade två äldre källkontraktstest som behövde följa guidefilter-namnet/nya review-beroenden i testharness. Snäva korrigeringar i content-delivery.test.mjs och profile-edit.test.mjs granskade av koordinator och registrerade i scope; fokuserad omkörning PASS enligt implementer, full omkörning pågår. Inga tester avaktiverades.

### KNOW-02 A–D fryst checkpoint

Implementer bekräftar att fullcheck kördes efter samtliga rättningar: 37/37 testfiler, typechecks PASS, lint0fel38varningar och diffclean. Källa fryst för oberoende slutlig QA/Reviewer. Security slutligt PASS på faktisk A–D-kod och körbara API/intent/scope/cloud-isolationtester; inget öppet säkerhetsfynd. Levande SQL/RLS/grants/cascade och signerad native/TestFlight/App Store-process fortsatt NT. Byggguiden översatt till svenska utan ändrad policy. Queue KNOW02→qa via dev_flow med faktisk implementerevidens.

### KNOW-02 slutlig QA – riktad rättning

Körbar UI-QA hittade att custom-update-fel med exakt oförändrad gammal rad klassificerades som konflikt. Enligt befintligt kontrakt ska det vara failed/retry; postimage saved, ändrad rad conflict, oläsbar status unknown. Renderad detalj visar dessutom dubbla branded AppBars och flikar; v2 kräver ett Back-sidhuvud. QA har inte godkänt dessa tillstånd. Implementer återöppnad för två avgränsade rättningar och regression/fullcheck. Inga nya funktioner eller ändrade säkerhetsändamål; granskningar för slutligt fryst diff måste förnyas. Koordinatorns senaste export PASS hör till versionen före dessa rättningar.

KNOW-02 riktad korrigering verifierad: error-readback exactoldimage→failed, exactpostimage→saved, ändrad/saknad rad→conflict, oläsbar→unknown. Faktisk kod och HTTP-regression för försvunnen rad kontrollerade; ny fullcheck37testfiler/0fel38varningar+diffPASS enligt implementer. Security förnyad PASS efter aktuell omläsning. Dubbla sidhuvuden borttagna i detalj/översikt. Slutlig UI-QA med140% hittade klippt kategoritext; avgränsad flex/wrap-rättning pågår. Tabs har redan horisontell ScrollView; faktisk nåbarhet/fulltext/touchyta ska provas vid140% innan visuell bedömning, inte antas från stillbild. Slutlig QA/Reviewer och export för sista korrigerade källan kvarstår.

KNOW-02 slutlig korrigerad källa: pnpm check/diff PASS efter text-wrap och CAS/header-rättningar. Koordinator har exporterat om båda lägena efter dessa ändringar: review+true och public+false PASS, 1427 moduler vardera; guard PASS och metadata skrivna. Loggar /tmp/know02-ios-review-verified.log och /tmp/know02-ios-public-verified.log. Visuell QA/flödesmatrix och slutligt Reviewer-resultat återstår; inga ytterligare källändringar planeras.

### KNOW-02 slutresultat — 2026-10-11

A–D lokalt implementerat och granskat på branch puppy-checklists-faq-qa11, bascommit617fb67. Oberoende QA senaste clean rebuild44PASS/0FAIL/0pageerrors, 375/430px och140%text, faktisk scroll/tap/CRUD/failedretry/unknown/remount/scope/cloudhandler-isolering. Checklista/evidens: docs/design/KNOW-02. Oberoende pnpm check37testfilerPASS, typechecksPASS, lint0fel38varningar och diffPASS. Reviewer slutligt PASS efter rättningar; Security förnyad PASS. Koordinatorns båda sista iOS-exporter review+true/public+false PASS1427; inga källändringar därefter. Queue→review→done via dev_flow med verklig evidens.

Implementerat: sex faschecklistor med förvalda/egna punkter, antal/procent, ägarens kontextval och privata konto-/hundtabeller/API; exakt intent/reconciliation utan falsk sparstatus eller dubbel UUID vid navigation; fyra Kunskap-flikar, grön checklist-/lila FAQ-kategori och samma destinationer från Hem; tillfälliga FAQ och tre träningsprogram med guidepar, träning endast RAM-progress; explicita review/public Codemagic-flöden och fail-closed innehållsgrind/metadata. Inga podcasts, nya beroenden, AI-nätanrop eller partneröverföringar.

Begränsningar och nästa faktiska steg: inga commits/push eller körda migrationer genom detta paket. Två nya SQL-filer behöver tillämpas/verifieras i avsedd utvecklingsdatabas: 202610110001_planned_health_event_time.sql och 202610110002_puppy_checklists.sql. Verklig RLS/grants/cascade, signerad native/TestFlight, Alert/tangentbord/VoiceOver/riktig Dynamic Type är inte verifierade. Granskningsråden behöver mänsklig sakgranskning före publik release. Nästa distribution kräver separat commit/push/build och faktisk databasverifiering; ingen automatisk publicering.

Avslutande dokumentationsstädning: Knowledge README uppdaterad från tidigare treflikars/public-only-text till faktisk v2-data/intent/review-flow, migrationskrav och verifieringsbegränsningar. Codemagic-grindens genererade logg/metadata-katalog ignoreras i Git; .gitignore registrerad i scope och fortsatt artefakt i Codemagic. Ingen runtime-/test-/beroendeändring efter slutliga kontroller.

KNOW-02 levererat: commit `7b9da840d2ca2ac8f5d5ed998d73495858c98eae` (`feat: add puppy checklists and QA refinements`) på `puppy-checklists-faq-qa11`. Pushad till `origin` och `git ls-remote` bekräftade exakt samma SHA. Pre-commit och pre-push körde repots hooks; pnpm check PASS (461 pass, 1 skip; 37 testfiler; lint0fel38varningar), staged/ref diffcheck PASS. Inget --no-verify. TestFlight ej distribuerat.

## HOME-NEXT-01 — 2026-10-12

Erik godkände det avgränsade paketet för tränings- och checklistkort; FAQ ska vara oförändrad. Plan v6 har Architect APPROVE och Critic PROCEED. Implementationen gate:ar träning på redo träningsurval + aktuellt nästa steg och checklistkortet på befintlig reviewflagga. FAQ-kortets destination och flaggbeteende har regressionassertions. Visual-harnessen har separata public-/reviewbyggen, syntetiska träningsscenarier och reviewdestination.

Verifiering: Node regression 1/1 PASS; `pnpm check` 37/37 PASS, lint 0 fel/38 varningar; public iOS-bundle PASS; båda UI-byggena PASS. Efter en locatorrättning godkänd av Architect passerar Home-kontrollerna i public och review vid 375/430 px och 140 % text, inklusive reviewmarkering/destination. Båda fulla `verify.py`-körningarna avslutas senare med exit 1 i orelaterat Kunskapsflöde (“Läs Inför hemkomsten” saknas). `git diff --check` och `python tools/dev_flow.py validate` PASS.

Visuell kontroll mot `vision_rev01.jpg`: §14 punkt 16 Nej, eftersom befintlig Hem-layout placerar carousel före datumremsa/lista; punkt 17 Nej, eftersom Hemmets varumärke är centrerat i stället för vänsterställt. Övriga punkter Ja enligt QA. Därmed UNDERKÄND enligt designregeln att varje Nej underkänner. Screenshots och bedömning: [HOME-NEXT-01 evidens](../../design/evidence/home-next-01/); detalj och korrigeringsplan: [HOME-NEXT-01](HOME-NEXT-01.md).

Kön står BLOCKED. Ingen commit, push, release-note eller UI-layoutändring. Nästa steg kräver Eriks beslut om separat scope för att rätta Home-layout/appbar eller uttryckligen acceptera dokumenterade visuella avvikelser; nuvarande kortmandat utökas inte.

### HOME-NEXT-01 v7.1 planrevision — 2026-10-12

Erik utökade scope till vision_rev02. Architect granskade v7 och returnerade CHANGES: komplettera den typade `ComponentGalleryScreen`-ytan, namnge regressionstester med exakt kommando, precisera dagemantik och svepnavigering samt redovisa ägarskap för releaseanteckningen. v7.1 har nu dessa ändringar i plan, uppgift och kö. Dagens vy ska visa källriktiga grupper (”Loggat idag”, ”Nästa träningssteg”, ”Planerat idag”) och beskrivas som källöversikt, inte fullständig checklista. Svepordningen följer de fem flikarna; Hälsa och Tassla-pass nås via Mer. Regranskning av Architect och Critic pågår. Fortsatt status `planned`, ingen kodstart.

Architect har slutligt APPROVE på HOME-NEXT-01 plan v7.1 efter att acceptanskriterium 1 synkats med rubriken ”Idag” och de tre källriktiga grupperna. Critic PROCEED återstår; HOME-NEXT-01 står kvar som planned och ingen v7-implementation har startat.

Critic har lämnat PROCEED på HOME-NEXT-01 plan v7.1. Skälen: tydlig skillnad mellan ägarregistrerade loggar, tillgängligt träningssteg och planerade hälsoposter; inget stöd för 2/5-räknare; Health/Tassla-pass kan hittas under Mer och verifieras i QA. Architect APPROVE och Eriks scopemandat finns registrerade. Planen är redo för implementation inom ägarsatta sökvägar.

HOME-NEXT-01 har gått till `implementing` via dev_flow efter Architect APPROVE och Critic PROCEED på plan v7.1. Implementer arbetar endast i godkända produkt-/visual-harnessvägar; QA äger namngivna tester och koordinatorn docs/evidens. Ingen commit eller push.

Implementer har lämnat in HOME-NEXT-01 v7.1-diffen: `pnpm exec tsc --noEmit`, Python-syntaxkontroll för verifieraren, `git diff --check` samt public-/review-harnessbyggen passerade enligt handoff. V6-gating behållen. Queue flyttas `implementing → qa`; oberoende fullcheck och renderad designgranskning återstår.

## HOME-NEXT-01 v7.1 QA — UNDERKÄND och korrigeringsplan v7.2 — 2026-10-12

Oberoende QA bedömde renderad Home mot vision_rev02.jpg och designregler §14. Resultat UNDERKÄND: punkt 5 avstånd mellan sektioner (12 i stället för 24); punkt 6 rå storlek på hundplatshållaren (82 × 92); punkt 10 upprepad källetikett ”Ägarregistrerat”; punkt 16 eftersom dagens logglista skjuter nästa träningssteg, plan och genvägar under bottenmenyn vid 375/430. Punkterna 17–18 godkända.

Kontroller: fokuserade tre testfiler PASS; full pnpm check 38 pass/1 fail; iOS-export PASS med __UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-home-next-01-v7/expo-home; public/review UI-byggen PASS; manuella Home-tillstånd, navigation, More och review-gating PASS. Båda scoped verify.py-körningarna stoppade vid aria-selected-assertion trots manuell fungerande navigation/aktiv grön markering. Tester och rapporteringen av Home README pekar på gamla v7.1-antaganden. Ingen phone/backend/native-verifiering gjordes. QA:s slutliga rapport finns i agentens HOME-NEXT-01-resultat; renderade filer finns ännu endast under /tmp/tassla-home-next-01-v7/.

Korrigeringsplan v7.2 är sparad i docs/plans/HOME-NEXT-01-ux-spec-v7.2.md. Den förkortar Home till högst senaste logghändelsen och ”Visa dagens logg”, komprimerar ”Just nu”, anger 24-tokenen, storlekstoken, tar bort upprepad källa, kräver att alla grupper/tiles ryms ovanför menyn, rättar aktiv tab-semantik, gamla README-texter och utdaterade Home-assertioner i tests/planned-health.test.mjs. QA får den testfilen som ägd sökväg. Scope/schema/dataflöden/FAQ/checklistor förblir oförändrade. Kö flyttas qa → blocked → planned; v7.2 väntar på Architect APPROVE och Critic PROCEED. Inga v7.2-källändringar har gjorts.


### HOME-NEXT-01 v7.2 planrevision — 2026-10-12

Architect och Critic returnerade CHANGES på första v7.2-utkastet. Planen är sedan preciserad med en gemensam Idag-Card, listGap mellan dess grupper, borttagen förklaringsrad, befintlig kompakt QuickLogTile-variant, tät fixture med minst fem valploggshändelser samt inline-länk i loggruppens rubrik. ”Visa dagens logg” gäller endast valploggen; utförd hälsohistorik stannar i Hälsa. Redundanta metadata ”Tillgänglig handling” och ”Planerat” tas bort. Task och queue anger nu samma ägarskap och evidensväg `docs/design/evidence/home-next-01/v7.2/`. Därefter godkände Architect och Critic den synkade v7.2-planen; status ändrades planned → ready → implementing och källkorrigeringen startade inom tilldelade sökvägar.

Architect gav APPROVE och Critic gav PROCEED på synkad HOME-NEXT-01 v7.2-plan och task/queue den 2026-10-12. Båda bekräftade tät Home-fixture, valplogg kontra Hälsa, inline-länk, borttagna redundanta etiketter, evidensväg och ansvar. Queue får lämna planned; implementation är tillåten enbart inom v7.2:s ägarsatta sökvägar. §14 renderad QA förblir blockerande.

Implementer har lämnat v7.2-korrigeringen inom tilldelade sökvägar. `pnpm exec tsc --noEmit`, public/review harnessbyggen, Python syntaxkontroll och `git diff --check` PASS enligt handoff. Lokal Chromium-start misslyckades med `setsockopt: Operation not permitted`; därför återstår oberoende tester, renderad Home-layout och full §14-bedömning. Queue går implementing → qa. Ingen commit/push/release.


### HOME-NEXT-01 v7.2 QA — fit correction

Independent public/review QA UNDERKÄNDE endast §14 punkt 16. Vid 375/430 px tiles började på y=754, höjd 78, medan fast meny började på y=785: 47px hamnade bakom menyn. Focused tests 4/4 och `pnpm check` (39 tests) PASS; public iOS-export, båda builds, diffcheck och queue validation PASS. Public/review navigation, tab-val, More → Hälsa, review-gating, FAQ/checklista, 140% text/reduced motion och noll browser errors PASS. Renderad evidens + §14-matris: `docs/design/evidence/home-next-01/v7.2/QA-REPORT.md`. QA blockerade. Architect bekräftade att samma godkända plan/sökväg täcker korrigering med Home-lokala sammanfattningsrader vars tryckytor är minst 44pt. Queue har återgått planned→ready→implementing; ny renderad QA krävs.

Implementer ändrade enbart `HomeScreen.tsx`: de tre Today-raderna använder nu Home-lokala, tokeniserade tryckrader med minsta träffyta 44pt. Typecheck, public/reviewbyggen, verifierarsyntax och diffcheck PASS enligt handoff. Nuvarande queue-status `qa`; oberoende renderad matris och §14-omgranskning återstår.


### HOME-NEXT-01 v7.2 second QA rerun — UNDERKÄND

Kompakta Home-lokala tryckrader sparade 36px men räcker inte: tiles slutar y=796 och fast meny börjar y=785, alltså 11px överlapp vid både 375/430 i public/review. Alla övriga kontroller PASS, bland annat “Visa dagens logg” → Logg, vald tab, More → Hälsa, review-gate/destination, FAQ/checklista och 140%/reduced-motion. Fokustester, `pnpm check` (39 pass, 38 lintvarningar/0 fel), iOS-export, båda byggena, diffcheck och queue validation PASS. Den officiella Home-verifieraren stannar dessutom på en gammal exact-text-locator för `Mat`; dess geometry assertion behöver uppdateras för den kompakta raden. Rapport/evidens: `docs/design/evidence/home-next-01/v7.2/QA-REPORT-rerun.md`, screenshots i `rerun/public/` och `rerun/review/`; första felomgången bevaras i `first-fit-failure/`. Queue återgår `qa → blocked → planned`. Architect behöver bekräfta samma-scope korrigering i HomeScreen och verifieraren innan ny implementation; acceptansen är oförändrad.

Architect confirmed that v7.2 approval covers moving “Idag” inside the shared Today Card and updating the compact-row locator in `tools/visual-check/verify.py`; this is same-scope and does not alter acceptance, behavior, or write paths. Queue returns planned → ready → implementing for that correction.

Implementer flyttade “Idag” in i den gemensamma Today-Carden med befintlig headingGap och uppdaterade bara selektorn för den kompakta loggradens tillgängliga namn i `tools/visual-check/verify.py`. Endast `HomeScreen.tsx` och verifieraren ändrades i denna korrigering. Typecheck, public/reviewbyggen, Python syntax och diffcheck PASS enligt handoff. Queue → qa för oberoende renderad kontroll och §14.


### HOME-NEXT-01 v7.2 final QA — 2026-10-12

Oberoende QA UNDERKÄNDE §14 punkt 16 efter korrigeringen med gemensam Today-Card och flyttad ”Idag”-rubrik: tiles ligger y=718–796 och fast meny börjar y=785, alltså 11px överlapp vid 375/430 i både public och review. Slutbilden visar klippta tile-etiketter. CTA, tabbar, More → Hälsa, review-training-gating/destination, FAQ/checklist, 140% text/reduced motion och browser errors PASS. Fokustester 4 filer, `pnpm check` (39 pass, 38 varningar/0 fel), iOS-bundle, båda byggena, diffcheck och kövalidering PASS. Home-verifieraren passerar loggselektorn men stannar på exakt Vaccination-locator (`Vaccination idag` i stället för tillgängliga namnet `16:30, Vaccination idag`) innan geometriassertionen; oberoende matris mätte bounds.

Rapport: `docs/design/evidence/home-next-01/v7.2/QA-REPORT-final.md`; final public/review-renderingar och JSON är sparade under `docs/design/evidence/home-next-01/v7.2/final/`; tidigare failure evidence är orörd. Queue: `qa → blocked → planned`. Nästa föreslagna korrigering inom samma godkända scope är att låta den inline-tertiary-logglänken uppta minsta 44pt tryckyta i stället för 56px, vilket ger 12px höjd tillbaka, samt uppdatera Vaccination-selectorn. Varken data, navigation, acceptanskriterier eller FAQ/checklistbeteende ändras; Architect-bekräftelse inväntas före implementering och ny QA.


Architect bekräftade efter v7.2 final-QA att befintligt godkännande täcker HomeScreen-lokal 44pt inline-tertiary-länk och Vaccination-radens accessible-name-locator i `tools/visual-check/verify.py`. Ingen ändring av kriterier, beteende eller paths. Queue har gått `planned → ready → implementing`; implementer gör endast de två ändringarna. Oberoende public/review-QA vid 375/430 och §14 krävs efter handoff.


Implementer genomförde Architect-bekräftad korrigering i endast `HomeScreen.tsx` och `tools/visual-check/verify.py`. Inline-tertiary CTA behåller 44pt träffyta, tillgänglig roll/etikett/handling; verifieraren matchar `16:30, Vaccination idag` och fortsätter till geometriassertion. Typecheck, public/review builds, Python-syntax och diffcheck PASS enligt handoff. Queue → qa; ny oberoende fullrunda krävs.


### HOME-NEXT-01 v7.2 final-correction QA — 2026-10-12

Slutlig oberoende QA GODKÄND: verifierare och fixturematris pass i public/review vid 375/430; action tiles y=706–784 ovanför fast meny y=785 (1px marginal). Inline-CTA är 44px och öppnar Logg. Review-gate/destination, tab state, More → Health, FAQ/checklist, 140% text/reduced motion, inga browser errors och §14 1–18 PASS. Fokustester 4 filer, `pnpm check` 39 pass/38 varningar/0 fel, public iOS-bundle, båda UI-byggena, diffcheck och kövalidering PASS. Full rapport och exakta kommandon i `docs/design/evidence/home-next-01/v7.2/QA-REPORT-final-correction.md`; slutbilder/resultat under `final-correction/`, tidigare fail evidens oförändrad. Queue → review; oberoende read-only slutgranskning återstår.


### HOME-NEXT-01 final review — 2026-10-12

Separat read-only Reviewer PASS på fryst produkt-/navigation-/harnessdiff och slutbevis. Bekräftat: 44px logg-CTA; dense tiles bottom 784/nav top 785 i public/review 375/430; källriktiga logg/träning/plan-grupper; fem huvudflikar, More → Hälsa/Tassla-pass, vald tab och reviewgating/destination; FAQ/checklistskärmar och dataflöden oförändrade; §14 och äldre fail-evidens bevarade. Task → done. Begränsning: lokala React Native Web-renders med syntetiska data; ingen native device/backend/RLS/TestFlight-certifiering. Inga commits, pushar eller publiceringar.

## VISION-REV02 R02-1 — implementation och QA checkpoint

Plan v8 R02-1 implementerad inom godkänd scope. Första QA-rundan blockerade första-vy-fit: public tiles slutade y=792 mot nav y=785 vid 375/430; review-fixturens initialtiles låg under nav och verifieraren mätte efter scroll. Rapport och bevarad failure-evidens finns i `docs/design/evidence/vision-rev02/r02-1/qa-failure/`.

Architect bekräftade att samma plan täcker en Home-lokal korrigering utan sänkta spacing-token, borttagna fixture-rader eller ändrade globala defaults. Implementern har nu gjort Home-local tätare spacing, kompakt destinationsvariant och tagit bort endast syntetiska sekundärbeskrivningar i review-fixturen (full detalj finns kvar för skärmläsare). `tools/visual-check/verify.py` mäter review-kortens initialgeometri före scroll. Alla fem uppgifter, banner, verkligt public-innehåll, navigation och minst 44 pt träffytor är bevarade.

Korrigeringshandoff: `pnpm exec tsc --noEmit`, public/review builds, fokuserade tester 3/3, verifierarens Python syntax och `git diff --check` PASS enligt implementer. Oberoende renderad QA och Reviewer på korrigerad källa återstår. R02-2 v8 har Architect APPROVE, Critic PROCEED, Security APPROVE och Compliance APPROVE, men migrations-/datakod väntar tills R02-1 är klar.

Oberoende QA efter den första fit-korrigeringen: public initialkort lämnar 37 px till nav vid 375/430; syntetisk review överlappar nav 51 px. Efter Architect-godkänd review-tätning passade public; review nådde 13 px fri yta vid båda bredderna, tre px under 16 px-kravet. Rapporter och bilder bevarade separat i `qa-correction/` och `qa-correction-2/`. Efter ytterligare 4 pt review-heading-gap passerade normal första-vy-fit: public bottom y=748/nav y=785 (37 px), review bottom y=768/nav y=785 (17 px). Toggle, fixed banner, 375×667, stor text/reducerad rörelse och navigation passerar. Fokustester, `pnpm check` (41 pass, 38 varningar/0 fel), public iOS-export, båda byggena, diffcheck och queue validation passerar. §14 punkt 16 blockerade: Tassla-placeholdern upptar ca 76×80 px där målbilden har ca 120×125 px porträtt. Modellen saknar hundfoto; använd inte redaktionell bild som användarens hund. Rapport/bevis: `docs/design/evidence/vision-rev02/r02-1/qa-correction-3/QA-REPORT.md`. Architect har godkänt Home-lokal förstoring/absolut placering av befintlig illustration utan att öka layoutflödet samt namn+ålder i headern enligt panel 1; ras visas fortfarande i profil/data. Implementer arbetar med detta. Checklistans innehåll gick inte att testa i harness som saknar checklistklient/hund. R02-2 väntar på godkänd R02-1-checkpoint.

### VISION-REV02 R02-1 — correction-10 QA handoff

Corrections 5–9 gick tillbaka till samma R02-1 checkpoint efter oberoende §14-fel: först datumöverlapp, därefter glyphkontrast under 4,5:1 eller för svag illustration. Korrigeringar, arkitekturbekräftelser och varje QA-rapport/evidensmapp är bevarade i `docs/design/evidence/vision-rev02/r02-1/` och köhistoriken.

Correction 10 placerade den godkända gräddfärgade lokala bakgrunden på en wrapper-View runt veckotalen som möter porträttet. QA PASS: alla veckoglypher klarade minst 6,55:1 vid 375/430 px och 140 % text; portrait (~108×124 synlig illustration), dots, public/review initialvyer, 17 px navmarginal, syntetisk review-checkbox/scroll/banner, destinationsnavigation, stor text och reducerad rörelse passerade. Full evidens: `docs/design/evidence/vision-rev02/r02-1/qa-correction-10/QA-REPORT.md`.

Huvudsessionens fokustester (3/3), `pnpm check` (41 test; 38 lint-varningar, 0 fel), public iOS-export, Python syntax, `git diff --check` och `python tools/dev_flow.py validate` passerade. Correction-specifik QA återkörde public/review verifieringar och byggen samt fokustester; full pnpm-check och iOS-export återanvändes inte inom just QA-körningen. Checklistskärmens innehåll är ej testbart i harness utan checklistklient/hund; ingen native-device-granskning eller backendbeteende påstås. Reviewer gav därefter BLOCK på ett avgränsat evidensgap: verifieraren kontrollerade 140 % text men scrollade inte fram sista destinationen och jämförde den med bottennavigationen. Correction-11 QA hittade två harnessproblem: bannerbaslinjen mättes före textskalning och `scroll_into_view_if_needed` lämnade 0,406 px fractional överlapp vid 430. Correction 12 rättade verifierarens tidsordning och använde explicit scroll; QA PASS vid 375/430, 140 % text och reducerad rörelse. Separat Reviewer PASS bekräftade verifiering, scope och sanningsenlighet. Köstatus: `VISION-R02-1` done och `VISION-R02-2` implementing. R02-2 genomförs endast med syntetiska lokala data; ingen live migration eller produktionsdata.


## VISION-REV02 R02-2 — implementation handoff till QA, 2026-10-13

R02-2 v8 kopplar ägarvalda dagliga rutiner och urval av nästa tillåtna publicerade träningssteg till Hem. Rutincompletion skrivs först efter bekräftad save och serverstämplas; träningscompletion härleds från exakt hund/version/steg och sparad `training_progress.completed_at` projicerad till urvalets lokala dag. Dagsrader och count använder samma fulla datamängd; fem rader visas först och “Visa alla” expanderar listan. Progressindikatorn är tillgänglighetsmärkt. Rutinhantering och träningsval finns kvar inline men startar hopfällda för att hålla huvudlistan och initial fit i fokus; snapshot och lokal formulärtext scopesätts till konto/hund/dag/tidszon för att gamla data inte ska blinka fram vid byte.

`pnpm check` PASS: app-/edge-typecheck, lint med 36 varningar i andra filer och 45/45 tester. Fokuserade dagaktivitets-/workspace-/kontoraderingstester 5/5 PASS. Public iOS-export och `python tools/dev_flow.py validate` PASS. Lokal React Native Web-reviewrendering vid 375/430 utan browser errors: count 3/7, fem första rader och “Visa alla” expanderade till sju; rutinhanterare och träningsval öppnades. CTA-undersida till navigation: 20 px vid 375 och 40 px vid 430. Fixture och exakta screenshots finns i `docs/design/evidence/vision-rev02/r02-2/`; handoff är inte oberoende QA- eller Reviewer-PASS.

Migration, RLS, retention, scheduler och cross-session midnight-probe är `NOT TESTABLE`: Supabase CLI saknas och Docker-daemonen är inte åtkomlig. `supabase/tests/daily-activities.sql` innehåller syntetiskt single-session-prov samt manual för tvåsessionstest när en disposable lokal Supabase-miljö finns; inget sådant runtime-resultat hävdas. Köstatus `implementing → qa`; R02-3 ligger kvar planerad tills R02-2 har stabil QA-/Reviewer-checkpoint och R02-3:s exakta plan har godkänts.

### VISION-R02-2 v8 — oberoende QA blockerad

Eriks nya Hem-direktiv gäller inom den redan godkända rev02-beställningen. Oberoende QA lämnade **FAIL** för v8: SQL-triggern avvisar träningsversioner med blandade ras mål trots minst ett matchande mål; befintliga Home-reviewbilder placerar destinationskort under första vyn och upprepar “Ta bort” på rader. Fullt underlag i `docs/design/evidence/vision-rev02/r02-2/QA-REPORT.md`. Queue gick `qa → blocked`; R02-3 förblir planned. Handoffens tidigare gröna kommandon är inte omtolkade till runtime-verifiering.

Plan v2 för separat `HOME-REV02-VISUAL-01` fick **CHANGES** av Architect och Critic. V9 fick också CHANGES för användning av visionsskärmbild som UI-asset, saknad rutin-detaljhandling och otydlig banner-/viewport-mätning. V10 löser detta med genererad fixturebild, separat rutinåtgärd, utanförliggande banner, opt-in-varianter, exakt viewport/verifiering och queue-synk före unblock. Slutgranskningar: Architect **APPROVE**, Critic **PROCEED**, Security **APPROVE** för SQL-predikat/regressioner; underlag i `docs/tasks/dev/vision-rev02-r02-2-v10-reviews.md`. Ingen appkod är ännu ändrad; queue-posten ska synkas till v10 före `blocked → planned`.

`git push origin design/vision-rev02` försöktes efter Eriks uttryckliga push-besked. Nätverksåtkomst nådde GitHub men saknad HTTPS-inloggning stoppade pushen (`could not read Username for 'https://github.com'`). Commit `38e7b90` och dagens reviewplan/checkpoint ligger lokalt; uppdaterat bundle skapas efter verifierad korrigeringscheckpoint om autentisering fortsatt saknas.

### VISION-R02-2 v11 Home checkpoint — 2026-10-13

Home v11 är implementerad med rund generisk AI-hundbild, synlig `Standardbild`-etikett, fast AI-standardbildsmarkering i syntetisk reviewram och mätbar veckoremsa ovanpå porträttet. Färska visuella kontroller testar week-glyph-kontrast för veckorna 8–14 vid 375/430 och 140 % text.

- Exakt plan: `docs/tasks/dev/vision-rev02-r02-2-v11.md`; planreviews: `docs/tasks/dev/vision-rev02-r02-2-v11-reviews.md`.
- Handoff, oberoende QA och Reviewer PASS: `docs/design/evidence/vision-rev02/r02-2/correction-v11/`.
- Verifiering: `pnpm check` 45/45, 36 lintvarningar/0 fel; public iOS-export PASS; public/review RN Web-byggen och browser-evidens PASS; `git diff --check` och `python tools/dev_flow.py validate` PASS.
- QA korrigerade den föregående SQL-fixturebedömningen: hund B är 80 dagar gammal och v5:s åldersspann är 0–20 veckor, så breed-target-regressionen är åldersgiltig.
- Supabase SQL/RLS, retention job/scheduler, lock-wait-over-midnight och native Dynamic Type/VoiceOver är NOT TESTABLE här. Hundporträttet är genererad bildkonst, inte ett verkligt personligt fotografi.

Nästa: commit/push den verifierade checkpointen på `design/vision-rev02`, därefter exaktspecificerad och Architect/Critic-granskad plan för visuell migrering av resterande befintliga MVP- och stödskärmar. Migrera en skärm/resa åt gången; bevara befintliga produktkontrakt och panelunika färger.

### R02-3 — planreview för övriga skärmar

Efter Hem-checkpointen `96e6882` har Erik bett att resten av de befintliga sidorna får samma rev02-riktning. Exakt scope, vyordning, filscope, beteenden och acceptans finns i `docs/tasks/dev/vision-rev02-r02-3.md` och `docs/plans/VISION-REV02-REMAINING-UX-SPEC.md`. Kön är uppdaterad men `VISION-R02-3` står kvar `planned` tills Architect APPROVE och Critic PROCEED är dokumenterade. Första implementationen blir Logg; därefter Träning, Kunskap och stödskärmarna en slice i taget. Inga nya rev02-funktioner eller datakontrakt ingår. Ingen R02-3-källkod är ändrad ännu.

Push av `96e6882` är blockerad av saknad GitHub-autentisering i Codex-miljön. Full bundle finns i `/workspace/vision-rev02-96e6882.bundle` för senare push från användarens autentiserade miljö.

### R02-3 planreview v6 — datumresa och pagineringsfixture

Architects v2- och v3-reviews hittade att Logg saknade faktisk datumbläddring trots designkontraktets datumrad, att previewserver-kommandon inte var exakta och att persondata-renderingar behöver Security-grind. Architect godkände v4 efter att datumraden blev lokal dagsfiltrering över befintliga `occurred_at`-värden och befintlig paginering; snabbval från äldre dag återgår till idag och behåller ett tryck. Critic hittade sedan att befintlig visuell provyta inte kan nå sidgräns-/fel-/återförsökstillstånd; v5 lade till en pagineringsfixture, och Architect krävde dessutom synlig syntetisk banner samt uttryckligt lokal minnesstyrning utan tjänsteanrop/datawrites. v6 begränsar dessa ändringar till `tools/visual-check/app.tsx`. Sidladdning når slutet av vald dag: fortsätt tills äldsta inlästa händelse ligger på en lokaldag strikt tidigare än vald dag, eller historiken är uttömd, annars får listan inte visas som komplett/tom. Ingen ny tabell, tjänst, dataadapter eller `Idag/Översikt` utan fungerande Insikter-destination tillkommer. Serverportar och Security-review är angivna i plan/kö.

Critic PROCEED finns för v2/v5 och Architect APPROVE för v4. Exakt v6 behöver ny Architect/Critic-review innan implementation. Inga appkällor är ändrade. Automatiska testkommandon läggs inte till eller körs enligt arbetsinstruktionen; planen använder typecheck/lint, kö-/diffkontroller och manuell public/review-rendering. Kön står kvar `planned` tills exakt v6 har godkänts.

### VISION-R02-3A Logg checkpoint och R02-3B Träning handoff — 2026-10-13

R02-3A Logg har stängts efter QA:s slutliga markörkontroll: unikt namngivna bilder för pending/failed/unsure/sidfel visar granskningsmarkeringen. Reviewer och Security PASS; §14 fortsätter ärligt att markera Nej för hela panel 5 där befintliga funktioner saknas. Underlag: `docs/design/evidence/vision-rev02/r02-3a/RENDER-REPORT.md`.

R02-3B Träning är implementerad enligt godkänd v6.1: vänsterställd rubrik, kapselsegmenten Rekommenderat/Alla övningar/Mina, befintlig hundålder, bildkort i två kolumner, beskrivningar från befintlig programtext och ett liggande fortsättkort efter korten när bekräftad progress och nästa tillåtna steg finns. `Mina` i public följer bekräftade `completedStepIds`; reviewmarkeringar lever endast i lokal komponentstate och reviewbannern förblir synlig. `HeroCard`/`Tabs`-varianter är opt-in. Inga produktionsdata, skrivkontrakt eller träningsråd lades till. Kortbildens höjd sänktes efter manuell 375×667-rendering så fortsättkortet avslutas cirka 9 px före bottenmenyn.

Public/review React Native Web-renderingar sparas i `docs/design/evidence/vision-rev02/r02-3b/` med §14-egenkontroll och redovisad Nej-avvikelse för exakt panelmatch. `pnpm typecheck`, `pnpm lint` (0 fel; 36 befintliga varningar), `git diff --check`, public/review builds och `python tools/dev_flow.py validate` PASS; manuell browserrendering gav inga sidfel. Inga tester lades till eller kördes. Den ursprungliga implementation handoffen följdes av owner QA PASS och statisk Security PASS; en färsk Reviewer-closeout efter HOME-AGE v4.3 återstår. 3B står i `ready`; 3C är `blocked` tills dess closeout kan registreras. Native rendering, Dynamic Type/VoiceOver, RLS och produktionsprogrammen är NOT TESTABLE här.


### VISION-REV02 R02-4A–H — samlat implementeringshandoff, 2026-10-13

Erik bad om en fortsättning till samtliga kvarvarande befintliga sidor. R02-4A–H har nu varsin UX-spec, avgränsad presentation, public/review-fixtures, bildbevis och §14-rapport:

- Mer — `docs/design/evidence/vision-rev02/r02-4a/RENDER-REPORT.md`
- Hälsa, vikt och utförd historik — `docs/design/evidence/vision-rev02/r02-4b/RENDER-REPORT.md`
- Planerad hälsa — `docs/design/evidence/vision-rev02/r02-4c/RENDER-REPORT.md`
- Tassla-pass — `docs/design/evidence/vision-rev02/r02-4d/RENDER-REPORT.md`
- Hundprofil — `docs/design/evidence/vision-rev02/r02-4e/RENDER-REPORT.md`
- Påminnelser — `docs/design/evidence/vision-rev02/r02-4f/RENDER-REPORT.md`
- Konto/Beta — `docs/design/evidence/vision-rev02/r02-4g/RENDER-REPORT.md`
- Inloggning/onboarding — `docs/design/evidence/vision-rev02/r02-4h/RENDER-REPORT.md`

Ägarens QA-besked före dessa nya implementationer avsåg tidigare arbete genom R02-3C; ingen av R02-4A–H har därför märkts QA-godkänd. Samtliga väntar på ägar-QA och oberoende Reviewer/Security. Typkontroll, riktad ESLint, diffkontroll, kövalidering, public/review-byggen och manuella browser-renderingar passerade. Inga tester lades till eller kördes. Native UI, auth-provider, notisleverans, serverradering, backend/RLS och verkliga kontoåtgärder är NOT TESTABLE enligt respektive rapport. Inga commits eller pushar gjordes.

Efter oberoende QA-fynd kompletterades 4C:s tomkort och pending/unknown/conflict-renderingar; 4D:s urvalssheet fångades med valrader; 4E:s läsprofil fick en 140 %-render; 4F:s 375×667-bilder togs om utan infomodal. För 4H lades 12 px avstånd efter raslistans retry-knapp och sparades Google-startens `google-opened`-render från mockad callback. 4A/4B:s korrigeringar och evidens bevarades. Typkontroll, riktad ESLint (0 fel; tre befintliga harness-varningar), public/review-byggen, diffcheck och kövalidering passerade. Inga tester kördes. Alla R02-4-slices står fortsatt `blocked` för ägar-QA och oberoende Reviewer/Security; detta är en dokumenterad checkpoint, inte ett godkännande.

### R02-4A–H korrigeringsre-QA — 2026-10-13

Separata read-only QA-agenter gav **PASS för de konkreta rättade punkterna** i 4A–H: fixturet öppnar alla fem Mer-destinationer; Hälsas retry stannar på Hälsa och visar planresultatet; 4C:s tom/pending/unknown/conflict-lägen och 4D:s urvalsblad har synliga renders; 4E/F/H:s saknade profil-, 375×667- och google-opened-bilder finns nu; 4G:s tidigare webb-PASS står kvar. Full rapport: `docs/design/evidence/vision-rev02/r02-4/QA-REPORT-2026-10-13.md`. Detta ersätter de tidigare evidensluckorna men är varken helskärmsacceptans eller owner QA. R02-4A–H fortsätter vara `blocked` i kön för owner QA och oberoende Reviewer/Security. Server/RLS och nativeintegrationer är fortsatt NOT TESTABLE.
### VISION-R02-3 — planreview och Logg startad

Plan v6 godkänd av Architect (**APPROVE**) och Critic (**PROCEED**) 2026-10-13; besluten sparade i `vision-rev02-r02-3-reviews.md`. Köposten VISION-R02-3 flyttad till `implementing`. Scope är endast R02-3A Logg enligt godkänd plan. Träning/Kunskap samt övriga stödskärmar väntar på Loggs QA, Reviewer, Security, §14 och checkpoint. Ingen appkod ändrad ännu.

### VISION-R02-GESTURES v7 QA och v8-plan — 2026-10-13

Oberoende QA gav v7 **FAIL**: Knowledge-detail och den specificerade checklist-lämna/återvända-lifecyclen fungerar statiskt, men ett tryck på den redan aktiva Kunskap-fliken rensar parent-spärren medan lokal artikel-/checklistdetalj finns kvar. Visual-check-fixturen har samma route-state edge. Browser/native-gester är **NOT TESTABLE**. Rapport: `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v7.md`.

Kön flyttades `qa → blocked → planned → ready → implementing → qa → review → blocked` efter Architect APPROVE, Critic PROCEED, statisk QA PASS och Reviewer PASS. Korrigeringen implementerar active-Kunskap no-op i detalj, reset av fokus/detail vid varje verklig exit eller re-entry via bottom-nav/sidgest samt bevarande av Hemmets direkta artikel-CTA. Typecheck, riktad lint (0 fel; tre befintliga harness-varningar), public/review builds, diffcheck och queue validation PASS. Inga tester kördes. Browser/native-gest och exakt `useEffect`-timing är **NOT TESTABLE**, därför står hela gesture-tasken blocked. QA-matris: `docs/design/evidence/vision-rev02/gestures/QA-REPORT-v8.md`; Reviewer PASS dokumenterad i `docs/tasks/dev/vision-rev02-gestures-v8.md`.

### VISION-REV02 — preflight-fel rättade, 2026-10-13

Commit-preflighten stoppades först av sju äldre testassertioner som inte speglade den staged koden: flyttad sign-out-varning, Home-detail-state, åldersenhet, utökad bläddringsbar veckoremsa, snapshot-ålder, uppdaterad text för planerad hälsa och full profil-preimage med `age_display_unit`. Befintliga testkontrakt uppdaterades. Tassla-passets snapshot visar nu `Kan inte beräknas` om ett redan sparat födelsedatum är ogiltigt, så exporten fortsätter och HTML-escaping gäller även felaktig data. Dubblettimporten i `ChecklistItem.tsx` slogs ihop.

Slutlig `pnpm check`: app-/edge-typecheck PASS, ESLint 0 fel/0 varningar, 45/45 testfiler PASS. `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` exporterade iOS-bundlen; `git diff --check` och `python tools/dev_flow.py validate` PASS. Detta är lokal kod-/bundleverifiering, inte signerad iOS-build, Supabase migration/RLS eller native PDF-/tillgänglighetsprov.

Arbetet fortsätter på `design/vision-rev02` från lokala `f918825`; commit `6313b2f` innehåller felrättningarna och rev02-paketet. GitHub-anslutningen hittade `19ffb85`, som låg tre commits på en parallell gren från gemensamma `9128cdd` medan vision-branchen hade sex egna commits. Merge `4c7052e` tar nu med `19ffb85` och dess granskade artikelkällor utan att skriva om publicerad historik. Konflikten i `docs/design-rules.md` löstes genom att behålla branchens fullständiga vision_rev02-regelverk. Nästa utvecklingsslice är `DOG-PROFILE-BREED-MIX`, fortsatt `blocked` tills en verifierad Wikidata CC0-export finns. Slice A är fortsatt blockerad för verklig DB/RLS och nativeverifiering; övriga R02-slices följer respektive QA-/reviewgrind.

### CHECKLIST-UI-LUNA-01 — planreview, 2026-10-13

Erik bad efter branchuppdateringen att börja genomföra `docs/plans/checklist-ui-luna-plan.md`. Exakt plan v1 finns i `docs/tasks/dev/CHECKLIST-UI-LUNA-01.md` och UX-spec v1 i `docs/plans/CHECKLIST-UI-LUNA-01-ux-spec.md`. Scope är Kunskaps befintliga sex faschecklistor, inte daglig checklista. Tre köposter är skapade; detaljvy är första delen, fasöversikt och egna-punkter-sheet är beroende delar.

Architect gav **APPROVE** för `CHECKLIST-UI-LUNA-01`, UX-spec v1, och godkände `CHECKLIST-UI-LUNA-DETAIL` som första slice. Granskningen bekräftar gemensam progress-/uppgiftsyta, oförändrade data-/lagringskontrakt, exakt Knowledge-scope och att senare slices väntar på föregående QA/review/checkpoint. Critic-review pågår. Köstatus är fortsatt `planned`; ingen UI-kod har ändrats. `python tools/dev_flow.py validate` och `git diff --check` passerade för planutkastet; inga tester/builds kördes.

Critic identifierade att nollanrop när reviewflaggan är false saknade explicit verifieringskriterium. Plan v1 är därför superseded och får inte aktivera kod. V2 lägger till instrumenterad select-räknare i den syntetiska Knowledge-klienten, separat public-build och krav på noll checklistläsningar/noll skrivningar.

- Architect **APPROVE** för `CHECKLIST-UI-LUNA-01` task v2 / UX-spec v2: scope, skrivfiler, ordningsberoenden och buildflagga är synkade; endast detaljslicen kan starta.
- Critic **PROCEED** för task v2 / UX-spec v2: Knowledge-faschecklistor hålls åtskilda från panel 4:s dagliga checklista; bekräftad sparsemantik, loading/error/unknown och noll-I/O vid reviewflagga false är uttryckliga; webbnative/RLS-gränser är redovisade.
- Båda utlåtandena är read-only granskningar; inga tester eller builds kördes i reviewn. Förnyad `planned → ready → implementing`-övergång gäller endast detaljslicen. Overview/custom fortsätter `planned` tills föregående slice har QA, Reviewer och checkpoint.

### CHECKLIST-UI-LUNA-01 v3 — förnyad planreview, 2026-10-13

Vid jämförelse av befintlig detaljvy mot hela beställningen framkom att pending bara dämpade/inaktiverade raderna gemensamt; raden som faktiskt sparas fick ingen synlig ”Sparar…”-status. Task och UX-spec är därför uppdaterade till v3 med krav på synlig återkoppling endast på berörd rad och oförändrad bock/progress tills bekräftad save. Plan v2 är superseded; dess tidigare Architect APPROVE/Critic PROCEED gäller inte v3. Befintliga v2-implementationändringar finns i arbetsytan men ytterligare källarbete väntar på nya reviewbeslut. Köposten har återställts till `planned`; ingen QA- eller slice-checkpoint hävdas. `git diff --check` och `python tools/dev_flow.py validate` passerade efter planuppdateringen; inga tester/builds kördes. Nya read-only Architect/Critic-granskningar av exakt v3 är begärda.


V3-granskningsutfall: Architect **APPROVE** för task/UX v3. Critic **CHANGES** eftersom synlig status inte krävde exponering i checkboxens tillgängliga namn/state; med explicit `accessibilityLabel` kunde VoiceOver missa statusen. V3 är superseded. V4 uppdaterar task, spec och kö med semantisk pending-status samt en webbkontroll av checkboxens roll/namn/checked/busy state. Inga källändringar efter fyndet. Nya v4-granskningar krävs.


V4-granskningsutfall: Architect **APPROVE** och Critic **PROCEED** för `CHECKLIST-UI-LUNA-01` task v4 / UX-spec v4. Besluten bekräftar synlig ”Sparar…” endast på aktuell rad, pending-information i checkboxens tillgängliga namn/state, bekräftad-save-semantik, webbkoll av roll/namn/checked/busy samt bevarad reviewflagga/noll-I/O-grind. Endast `CHECKLIST-UI-LUNA-DETAIL` kan starta; overview/custom förblir planerade bakom QA/Reviewer/checkpoint. Inga tester/builds kördes i planreviewn.

### CHECKLIST-UI-LUNA-DETAIL — implementeringsöverlämning, 2026-10-13

Detaljvyn är implementerad enligt v4. Progress och befintliga standard-/egna punkter delar nu en Card med grupperade rader; AppBar-ändringen är opt-in. Reviewinformationen visas en gång. Den aktiva raden visar ”Sparar…” och webbcheckboxen exponerar aktuellt checked/busy-läge samt status i tillgängligt namn. Bock och progress väntar på bekräftad save. Public-fixturen gav 0 checklistläsningar och 0 checklistskrivningar; reviewfixturen gav en reviewmarkering. Typecheck, lint, public/review-build, diffcheck och kövalidering PASS. Manuell webbläsarkontroll visade korrekt pending/saved-state utan browser errors. Inga tester lades till eller kördes.

Renderingsbevis och begränsningar: `docs/design/evidence/vision-rev02/checklist-luna/detail/RENDER-REPORT.md`. Efter QA:s första CHANGES kompletterades 0/4-, 4/4-, loading-, error- och unknown/Kontrollera-bilderna; re-QA gav PASS. Webbläsarzoom 140 % används som proxy; befintlig global bottennavigation radbryter då ”Kunskap”, ett separat fynd utanför detaljslicensens skyddade scope. Native VoiceOver/Dynamic Type och Supabase/RLS är NOT TESTABLE. Reviewer gav PASS och detail är checkpointad; Overview/custom inväntar sina grindar.

### CHECKLIST-UI-LUNA-DETAIL — QA PASS, 2026-10-13

Oberoende read-only QA gav **PASS** efter kompletterade renderbevis för 0/4, 4/4, laddning, läsfel och unknown/Kontrollera. QA bedömer §14 godkänd för detaljslicen; ”Kunskap” radbryts vid 140 % zoom i den globala bottennavigationen men förblir synlig/användbar och är ett separat fynd utanför slicens scope. Normal-, pending- och saved-renderingar bekräftar bekräftad-save-semantik. QA ändrade inga filer och körde inga tester. Typecheck/lint/build i rapporten är implementerarens verifiering, inte QA-omkörning. Reviewer gav därefter PASS; overview/custom är fortsatt `planned`.

Oberoende read-only Reviewer gav **PASS** för exakt v4. Data/write-handlers och confirmed-save-kontrakt är oförändrade; komponentvarianter är opt-in; fixture, queue, dokumentation och renderbilder överensstämmer. Ingen testkörning eller filändring gjordes av Reviewer. Icke-blockerande notering: `verify-know02.py` sparar framtida verifierarbilder i äldre KNOW-02-katalog; befintlig detail-evidens ligger på ny dokumenterad sökväg. Köposten är `done` efter QA PASS/Reviewer PASS. Ingen commit/push; den frysta diff-checkpointen och verifieringen dokumenteras i `docs/design/evidence/vision-rev02/checklist-luna/detail/CHECKPOINT-DETAIL.md` innan Overview startar. Custom förblir `planned`.

### CHECKLIST-UI-LUNA-OVERVIEW — första planreview, 2026-10-13

Efter detail v4 QA PASS, Reviewer PASS och fryst checkpoint granskades Overview v4 separat. Architect gav **APPROVE** för scope, beroende, sparat kontextval kontra `by_age`, tre BottomSheet-val, rekommenderad fas plus fem övriga, alla sex routes och sanningsenlig loading/error. Critic gav **CHANGES**: acceptance/verifiering saknade explicit confirmed-save-semantik för kontextbyte. Tasken uppdaterades till v4.1: summary ändras först efter confirmed `saved`; pending/failed behåller föregående sparat värde eller fallback; unknown visar inte nytt val som sparat före reconciliation; verifiering täcker både preference-rad och fallback. Nya Architect/Critic-reviewer av exakt v4.1 krävs; Overview-kod har inte startat, kön förblir `planned`, Custom väntar.

Architects omgranskning av task v4.1 gav **CHANGES** eftersom queue-acceptance/checks ännu stod på v4-text. Efter synkning identifierade Architect också att feltoastens ”Försök igen” återläser listan i stället för att skicka om det misslyckade preference-valet. Tasken och kön uppdaterades till v4.2: retry skickar om samma context-target; tidigare sparat värde eller fallback visas tills confirmed saved; upprepad failure bevarar gamla värdet. Verifieringen kontrollerar samma target med både sparad preference och fallback. V4.2 väntar på förnyade Architect/Critic-beslut före `ready`; ingen Overview-kod har startat.

Architects v4.2-omgranskning gav **CHANGES**: verifieringen krävde inte att summary/rekommendation står kvar när även retry misslyckas. Task och kö synkades till v4.3. För både tidigare sparad preference och osparad `by_age`-fallback ska verifieringen nu låta retry misslyckas, kontrollera att gamla läget/rekommendationen står kvar och bekräfta att efterföljande retry återanvänder samma context-target. Architect gav därefter **APPROVE** och Critic **PROCEED** för exakt task v4.3 och synkad queue; båda bekräftade retry-failure-semantik, unknown/reconciliation och noll-I/O-gate. Read-only reviews körde inga tester och ändrade inga filer. Köstatus kan nu gå `planned → ready → implementing`; Overview-kod startar inom denna slice och Custom väntar på QA/Reviewer/checkpoint.

### CHECKLIST-UI-LUNA-OVERVIEW — implementeringsöverlämning, 2026-10-13

Översikten visar kompakt ”Er fas” med separat markering för sparat val kontra `by_age`-fallback. Ändra öppnar befintlig BottomSheet med de tre kontexterna. Bekräftad sparning är enda vägen som ändrar valt läge/rekommendation; failed och upprepad retry-failure visar synlig åtgärd intill summary och behåller gammalt läge, medan unknown har lokal Kontrollera/reconciliation. Rekommenderat kort visas först och andra fem ligger i egen lista. Reviewmarkeringen finns en gång, och loading/error saknar rekommendation och falska nollframsteg.

Typecheck, lint, public/review-build, diffcheck och queue-validering PASS. Manuell Chromium-kontroll täckte viewportar 375/430/667, 140 % zoomproxy, loading/error, sparat kontextval, `by_age`-fallback, pending, två upprepade skrivfel med identiskt target, bekräftad tredje retry, unknown/Kontrollera samt samtliga sex routes. Public-fixturen gav 0 läsningar och 0 skrivningar; ingen browser page error. Inga tester kördes. Evidens och begränsningar: `docs/design/evidence/vision-rev02/checklist-luna/overview/RENDER-REPORT.md`. Oberoende QA PASS 2026-10-13 efter unknown- och reconciled-renderbilderna togs om i reviewläge och exempelmarkeringen syns i båda. Första Reviewer-försöket gav BLOCK enbart för osynkad QA-status i kö/rapport och saknad exempelmarkering i reconciled-bilden; detta är korrigerat och Reviewern gav därefter **PASS** för Overview v4.3. Köstatus är `done`; nästa steg är att skapa och hashverifiera fryst diff-checkpoint innan Custom-slicen startar. Custom förblir `planned` tills checkpointen verifierats.

### CHECKLIST-UI-LUNA-CUSTOM — implementeringsöverlämning, 2026-10-13

Add/Edit/Delete för egna checklistpunkter ligger nu i BottomSheet med befintliga handlers och bekräftad-save/readback-semantik. Den separata editknappen är 44 pt. Att stänga sheetet bevarar draft/UUID; explicit Avbryt rensar utkastet; medan write pågår kan sheetet inte stängas. Kända fel har retry med samma add-UUID respektive rad-ID. Unknown håller Kontrollera i sheetet och efter stängning, och reconciliation uppdaterar först efter readback. Titelvalideringen godtar 160 Unicode-tecken och avvisar 161 före skrivning. En lång oavbruten titel hade gått bakom editknappen i webbrendering; minWidth/radbrytning korrigerade detta och `review-custom-long-title-160-375.png` visar resultatet.

Typecheck, lint, public/review-build, `git diff --check`, `python tools/dev_flow.py validate` och manuell Chromium-rendering PASS. Publiclägets fixture gav 0 checklistläsningar/skrivningar. Rendering täckte 375×844, 430×844, 375×667, 140 % zoomproxy, add/edit/delete pending/failure/unknown/retry, stängning/återöppning, återhämtning och 160/161-teckengränsen; browser errors saknades. `verify-know02.py` och testsviter kördes inte. Rapport/bildmatris: `docs/design/evidence/vision-rev02/checklist-luna/custom/RENDER-REPORT.md`. QA och Reviewer har inte utfört denna slice ännu; nästa steg är oberoende read-only QA. Native tangentbord/VoiceOver/Dynamic Type, iOS/Android och Supabase/RLS är `NOT TESTABLE`. Ingen commit/push.

### CHECKLIST-UI-LUNA-CUSTOM — QA-korrigering, 2026-10-14

Första read-only QA-rundan gav **CHANGES**. Den 140 %-bild som då lästes visade inte add-sheetet; reviewbilden har därefter ersatts med en där sheet, fält, Spara och Avbryt syns. QA jämförde grouped-checkboxen mot rev02-panel 4 och krävde fyrkantig form; `ChecklistItem` använder nu `square-outline`/`checkbox` endast i sin bakåtkompatibla `grouped`-variant. Koden har typkontrollerats, lintats och byggts i public/review-läge efter korrigeringen. Edit- och deletebilder för 430×844, 375×667 och 140 % är tillagda; delete-failure vid 140 % har även separat scrollad bottenbild och delete retry-success är nu tagen efter stängd sheet och stabil success-toast. Publicfixture: noll checklistläsningar/noll skrivningar; inga browserfel. Inga testsviter kördes. Den frysta Detail-/Overview-checkpointen har inte ändrats. Om-QA inväntas före Reviewer.


## CHECKLIST-UI-LUNA-CUSTOM — QA omgranskning 2026-10-14

Första oberoende read-only QA gav `CHANGES` på evidensmatrisen och den grupperade checkboxens form. Implementeringen korrigerade checkboxen till fyrkantig rev02-form, kompletterade add/edit/delete-bilderna för 430×844, 375×667 och 140 %-proxy, lade till den nedre 140 %-delete-bilden och fångade delete retry-success efter stabil stängning. Oberoende read-only QA verifierade korrigeringarna och relevanta §14-delar och gav **PASS 2026-10-14**. Renderbevis och begränsningar finns i `docs/design/evidence/vision-rev02/checklist-luna/custom/RENDER-REPORT.md`. Typecheck, lint, public/review-builds, `git diff --check` och queue-validering passerar; inga tester kördes. Native VoiceOver/tangentbord/Dynamic Type, iOS/Android och live Supabase/RLS är `NOT TESTABLE`. Oberoende Reviewer begärs nu.


## CHECKLIST-UI-LUNA-CUSTOM — Reviewer-fynd och fokuserad om-QA 2026-10-14

Första oberoende Reviewer-granskningen gav `CHANGES`: efter känd add/edit/delete-failure rensade explicit Avbryt formuläret och `failedFormAction`, men behöll felmeddelandet. Den yttre Toasten kunde då visa en retry-åtgärd utan samma skrivkontext. Avbryt rensar nu även meddelandet. Fokuserad oberoende read-only QA gav **PASS**: samma handler gäller add/edit/delete; X/backdrop/systemback bevarar fortfarande utkast och giltig retry; unknown behåller Kontrollera. Ingen interaktiv runtime-reproduktion av just cancel-tillståndet gjordes; QA-resultatet är statiskt. Efter korrigeringen passerar `pnpm typecheck`, `pnpm lint`, public/review-build, `git diff --check` och queue-validering. Ingen testsvit kördes. Native hjälpteknik/plattformar och live Supabase/RLS kvarstår `NOT TESTABLE`. Reviewer-omgranskning begärs.


Oberoende Reviewer omgranskade cancel-korrigeringen och gav **PASS 2026-10-14**. Reviewer verifierade att Avbryt nu döljer den gamla Toast/retry, att X/backdrop/systemback fortfarande bevarar samma retry-kontext och att unknown fortsatt visar Kontrollera. QA- och Reviewer-granskningen av denna sista korrigering var statisk, utan ny interaktiv cancel-reproduktion. Detail- och Overview-patcharnas SHA-256-sidofiler verifierades `OK`; Custom-checkpointen fryses efter dessa godkännanden. Ingen commit, push eller release har gjorts; extern QA ska upprepa kontrollen efter faktisk release.


## CHECKLIST-UI-LUNA — förberedelse för commit/push 2026-10-14

Obligatorisk pre-commit `pnpm check` hittade en föråldrad `checklist-ui.test.mjs`-förväntan på den gamla reviewtexten. Efter den uppdateringen riktat test kördes igen och fann ytterligare en föråldrad assertion för Add-knappens label. Båda assertionerna uppdaterades till aktuellt UI-kontrakt; riktat test passerar 5/5 subtests. Inga nya testfall lades till. Full `pnpm check` körs automatiskt i pre-commit och pre-push.


### VISION-R02-4A–H — closeout, 2026-10-14

Erik rapporterade att extern QA redan godkänt R02-4A–H och bad att paketet markeras klart. Oberoende Reviewer gav PASS utan blockerande kodfynd; statisk Security gav PASS utan blockerande fynd. Samtliga åtta köposter är stängda som lokal UI-leverans. Inga tester eller byggen kördes av dessa två granskare; deras resultat är separata från Eriks QA. Faktisk Supabase/RLS, kontoåtgärder, OAuth/e-post, notisleverans, native PDF/share och plattformstillgänglighet förblir NOT TESTABLE. Fullt closeout-underlag: `docs/tasks/dev/vision-rev02-r02-4-closeout.md`.

## 2026-10-14 — olyckstyper och Hemmets åldersfaser, plan v4.1

Erik beställde att olyckor kräver typval Kiss/Bajs (Kiss förvalt), att dessa val räknas in i respektive kiss-/bajsmönster, singularformerna `ungefär var N minut/timme`, och att Hem-remsan växlar veckor → månader → år med separata ungefärliga livsfaser. Han instruerade också att R02-4 ska räknas klar utifrån redan genomförd extern QA. R02-4 har separat closeout i `vision-rev02-r02-4-closeout.md`.

- Exakt plan v4.1 i `log-accident-home-age.md` fick Architect APPROVE och Critic PROCEED 2026-10-14 för A och B. A:s lokalcheckpoint begränsas till A-acceptansen och märker befintliga B-hunks ogranskade; B återöppnas separat efter A.
- LOG-ACCIDENT-DETAILS-01: lokal kod/UI-deluppgift. Live Supabase-persistens, readback, RLS och automatiserad mutationsregression får inte anges som verifierade. Separat `LOG-ACCIDENT-RUNTIME-VERIFY-01` kräver utvecklingsdatabasgranskning före live-/releasepåstående.
- HOME-AGE-LIFECYCLE-01: börjar efter A:s granskade lokala checkpoint; beroende på live DB-verifiering behövs inte.
- Ingen unit-/integrationstestsvit har lagts till eller körts.
- Content blockers (diagnos): Knowledge loaders frågar bara `content_versions.status = 'published'`. De godkända bundleposterna/import- och publiceringsskripten är lokala; draft-importen och efterföljande publiceringstransaktion har inte körts i Supabase. FAQ saknar runtime publicerade Q&A-poster och visar endast granskningsfixturer när review-flaggan är på. `before-homecoming` förblir draft eftersom onboarding-kontext inte finns i urvalsmodellen.
- A:s lokala kod/UI och renderunderlag finns; Dog Expert QA PASS, Security PASS, Architect APPROVE, Critic PROCEED och Reviewer PASS för A:s avgränsade scope är registrerade. B-hunks i delade filer är uttryckligen uteslutna från A:s acceptans. A:s lokala checkpoint får frysas som exact source-diff fingerprint; B:s kod/render räknas inte som checkpoint. Efter A granskas B separat och dess kontroller/render körs på nytt. Live Supabase/RLS och nativebeteende är NOT TESTABLE. Ingen unit-/integrationstestsvit eller extern SQL-körning.

## HOME-ROUTINE-CHECKLIST-01 — v2 arkitekturgranskning och v3

Architect CHANGES för v2: klientens `private.replace_daily_routine` kan inte anropas via PostgREST eftersom `private` inte är exponerat. v3 flyttar den enda kliententrypointen till `public.replace_daily_routine`, med `SECURITY DEFINER`, tom `search_path`, fullt kvalificerade referenser och explicit hundägarkontroll. EXECUTE ska nekas `PUBLIC`/`anon` och ges endast till `authenticated`; helpers och triggers ligger kvar i oexponerat `private`. Static Security och runtime-verifieringen med två ägare/PostgREST omfattar nu RPC:n. Plan och båda köposter är synkade till v3. Implementering väntar på exakt v3 Architect APPROVE/Critic PROCEED och på att HOME-AGE stänger delade Home-filer; ingen kod eller migration har startat.

### HOME-AGE-LIFECYCLE-01 B v4.3 — QA-handoff

Efter v4.3 UI-korrigeringen passerar `pnpm typecheck`, ESLint för samtliga ändrade B-filer, `git diff --check`, `python3 tools/dev_flow.py validate` och RN Web-bygge. Två fresh Chromium-renders visar unknown-age rekommenderat och Mina, med ofärdig sparad progression, separat Fortsätt där ni var och ingen Passar just nu-rubrik; klick från Rekommenderat till Mina behåller progressionen. Dog Expert QA PASS för korrigerad träningspresentation samt tidigare gränser, skottdagsbeteende, faser och neutralt okänt födelsedatum. Reviewer PASS efter att handoffstatus synkats; HOME-AGE-LIFECYCLE-01 är `done` som lokal source/UI-checkpoint. Inga tester, databaskörningar eller nativepåståenden.

### R02-3C v6.3 — null-age-copy och färsk render

Den godkända v6.3/v1.1-korrigeringen för Kunskap-checklistor är implementerad. När hundens ålder saknas och ägaren inte valt fas visas `Checklistkontext` / `Ingen fas vald` samt vägledning att ange födelsedatum eller välja fas själv; checklistor förblir öppna utan åldersrekommendation. Fresh public/review builds och Chromium-renderingar finns i `docs/design/evidence/vision-rev02/r02-3c/{public,review}/checklist-unknown-age-375x844.png`. Reviewrender verifierar den neutrala copyn och mallarnas tillgänglighet; public visar fortsatt korrekt tom/published-content-gate. `pnpm typecheck`, `pnpm lint`, `git diff --check`, queue validation och båda byggena passerar. Owner QA PASS och statisk Security PASS är tidigare registrerade; färsk Reviewer-granskning av den korrigerade null-age-rendern pågår. Native/Dynamic Type, live Supabase/RLS och publicerat liveinnehåll är **NOT TESTABLE**.

## HOME-ROUTINE-CHECKLIST-01 v4 — lokal implementation till QA, 2026-10-14

Erik lade till pennikon för checklistpunkter, kort hjälp bakom `(i)`, valfri daglig/egen dags-, vecko- eller månadsupprepning samt att hoppade förekomster inte återskapas. v4-planen hade Architect APPROVE och Critic PROCEED före implementation. Formuläret börjar med rutinens namn och egna checklista; upprepningen startar med `Aldrig`. Aktiva dagskopior förblir frysta, och upprepade rader får skip-tombstone som gör omladdning och återläggning idempotent. Migrationskällan innehåller create/replace/ensure/skip RPC och 30-dagars purge för skip-data; migrationen kördes inte.

Public- och reviewbundle byggdes. Manuell Chromium-capture täckte 375×844, 430×844, 375×667 samt 140 %-zoomproxy utan page errors. Aktuella bilder och begränsningar: `docs/design/evidence/vision-rev02/routine-checklists/RENDER-REPORT.md`. `pnpm typecheck`, ESLint för ändrade TS/TSX-filer, `git diff --check` och `python3 tools/dev_flow.py validate` passerar. Inga testsviter eller databasoperationer kördes. Köstatus är `qa`; ny oberoende UI QA/Reviewer och statisk Security-granskning av v4 återstår. Separat release-köpost kräver runtime/RLS-verifiering.

## HOME-ROUTINE-CHECKLIST-01 v5 — implementation och begränsat renderunderlag, 2026-10-14

Den efter v4-frågan godkända v5-interaktionen är implementerad inom de nio godkända skrivvägarna. Varje rutin har en enda `Redigera`-knapp vid namnet; namn, checklista och upprepning ingår i samma utkast/sparning. Plus skapar ett stabilt ID en gång per ny punkt, minus tar bort vald punkt och läsvyn har inga punktvisa redigeringskontroller/long-press. Utkastet låser rutin- och dagsval inklusive träningsval och hel-rutin-radering. Dirty close visar discard-bekräftelse. Pending/unknown låser och bevarar fälten tills befintlig retry/readback löser status. V4 data-, RPC- och migrationsfiler ändrades inte av v5.

`pnpm typecheck`, riktad ESLint för `DailyActivityManagerSheet.tsx` och `tools/visual-check/app.tsx`, `git diff --check` på v5-sökvägar och `python3 tools/dev_flow.py validate` passerar. Public- och reviewbundle byggdes tidigare i v5-arbetet. Ingen testsvit eller databasoperation kördes.

Tre reviewbilder finns för 375×844: läsvy, samlat edit mode och discard-bekräftelse. Återstående Playwright-renders kunde inte köras: `/usr/bin/chromium` avslutas vid start med `SIGTRAP` och `setsockopt: Operation not permitted` från crashpad, även med projektets headless- och no-sandbox-flaggor. Därför saknas 430×844, 375×667, 140 %-textproxy samt create/saved/failed/unknown/retry-lägen i färskt v5-underlag. Renderbegränsningen är dokumenterad i `docs/design/evidence/vision-rev02/routine-checklists/RENDER-REPORT.md`; detta är inte visuellt QA-godkännande. Queue är fortsatt `implementing` i väntan på fungerande rendering och oberoende UI QA/Reviewer. Native- och Supabase-runtime verifieras separat.

Eriks önskemål om mindre beskrivande text inventerades separat i `docs/tasks/dev/ui-info-copy-inventory.md`. Kandidater är redundanta introtexter i Hälsa, Träning, Mer, Konto, hundprofil och påminnelser samt dubbel informationslänk i historik/planerad hälsa. Integritets-/samtyckestext, säkerhetsråd, statushjälp, fel/återhämtning och artikel-/programsammanfattningar föreslås ligga kvar synligt. Ingen separat copyändring gjordes på dessa skärmar.

## UX-FIX — första lokala checkpoint (historisk), 2026-10-15

Nedanstående var status vid den första checkpointen och har senare kompletterats av aktuella slice-rapporter längre ned i dokumentet.

Arbetet fortsätter i den vanliga repoklonen på branchen `codex/ux-fix-2026-10-15`, baserad på kandidat `9a81815993f015478be480f9c8d19b0923b05f76`. Den bredare UX-FIX-planen är inte stängd: `HOME-ROUTINE-CHECKLIST-01` är fortsatt blockerad i väntan på de färska renderstorlekarna och tillstånden som står i kön.

`UX-FIX-BASELINE-WINDOWS-01` är klar efter oberoende QA och Reviewer PASS. De två testfilerna använder nu Windows-säker sökvägskonvertering och radslutsnormalisering utan att ta bort eller lätta på testassertioner. Riktat test passerar 10/10; full `pnpm check` passerar typecheck, edge typecheck, lint och 492/492 tester. `python tools/dev_flow.py validate` och `git diff --check` passerar.

`UX-FIX-BASELINE-MOTION-01` är blockerad, inte klar. Den typade implementationen i `src/components/ui/Motion.tsx` bevarar den konkreta Animated-stilen, skickar `{ pressed, hovered }` och kedjar callbacks; typkontroll, riktad lint och full check passerar. Oberoende QA och Reviewer hittade inget statiskt kodfel, men blockerar DONE eftersom RN Web-proben för hover/press, callbackantal, disable→enable och transform inte kan köras här: verktygen React Native Web, React DOM, esbuild, Playwright och Chromium saknas. Native-runtime är också NOT TESTABLE.

Nästa steg är att köra den godkända Motion-proben i den isolerade RN Web-harnessen och därefter återuppta den blockerade Home-rutin/UX-verifieringen enligt respektive köpost. Ingen Supabase-migration, runtime/RLS-kontroll, native- eller TestFlight-verifiering har utförts i denna checkpoint.

## UX-CONTINUE-CARD-01 — första UX-FIX-slicen, 2026-10-15

Efter Architect APPROVE och Critic PROCEED för exakt UX-FIX v2.1 är panel 6:s `Fortsätt där ni var` omarbetad. Rubriken ligger nu före raden, bildytan använder separata 84×76 pt theme-tokenvärden och är oberoende av radens text-höjd. Kortet fortsätter att öppna samma programversion och nästa ofärdiga steg. Sparad fortsättning visas också när åldern saknas, separat från åldersbaserade rekommendationer.

Public/review RN Web-bundles byggdes och färska Chromium-renders finns i `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/continue-card/`. 375×844, 430×844 och 375×667 samt 0/2, 1/2, 2/2, flera påbörjade program, lång titel, okänd ålder, tomt och fel renderades. Den manuella 1/2-klickresan öppnade rätt nästa steg. Under 140% textproxy växte långkortet 178→259 px medan bildytan förblev 84×76 px. Ingen browser page error observerades.

ESLint för de ändrade TS/TSX-filerna, `git diff --check`, kövalidering och RN Web-byggen passerar. `pnpm typecheck` stoppas av befintligt orelaterat fel i `src/components/ui/Motion.tsx:61`: `hovered` finns inte på `PressableStateCallbackType`. Inga testsviter eller databasoperationer kördes. Native Dynamic Type, VoiceOver, safe area och riktig publicerad progress är ej verifierade. §14-implementerbedömning och varje render finns i RENDER-REPORT; oberoende QA/Reviewer inväntas.

## UX-LOG-EDITOR-01 — implementering till QA, 2026-10-15

Panel 5 har nu en fast tidskolumn, semantiska olyckssymboler som läser sparade `accidentKinds`, läsbara datum-/tidsfält och en förankrad Spara-footer. Den gröna `Lägg till händelse`-knappen efter tidslinjen öppnar befintliga kompletterande loggtyper; snabbvalen, `Fler` och layoutredigeringen finns kvar. Äldre olyckor med `accident_kinds = NULL` behåller okänd status när typen växlas bort och tillbaka, och även efter sparning/återöppning. Render, målbildsjämförelse och §14 finns i `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/log-editor/RENDER-REPORT.md`.

Public/review RN Web-byggen och scoped ESLint passerar. Chromium-granskning täckte 375×844, 430×844, 375×667, kompletterande inmatning, add/undo, unknown toggle/save/reopen, delete cancel/confirm, failed/retry och 140 %-textproxy; inga browser errors. Critic/Security PASS efter rättning av legacy-unknown-hörnfallet. Oberoende QA PASS efter uppdaterad kontroll av CTA, tillgängliga supplemental types och legacy-beteende. `pnpm typecheck` stoppas endast av det befintliga, orelaterade `Motion.tsx:61`-felet. Inga testsviter eller DB-operationer kördes. Native keyboard/safe area, VoiceOver, Dynamic Type och reduced motion är NOT TESTABLE.

Första oberoende Reviewer-granskning gav BLOCK: valet av kompletterande typ kunde lämna `Lägg till händelse`-arket kvar över tidslinjen eller olycksselectorn. `LogScreen.tsx` stänger nu arket i den gemensamma `selectType`-dispatchern, också för dubblettflödet. Scoped ESLint för filen, nya public/review-byggen och manuell Chromium-granskning passerar. Nya bilderna `add-event-walk-selected-sheet-closed-375x844.png`, `add-event-accident-selector-only-375x844.png`, `add-event-duplicate-dialog-sheet-closed-375x844.png` och `add-event-duplicate-confirmed-sheet-closed-375x844.png` visar stängt ark vid val och bekräftelse. Oberoende delta-QA PASS; förnyad read-only Reviewer PASS. UX-LOG-EDITOR-01 är `done`; nästa checkpoint är `UX-WORKSPACE-RETENTION-01`.

### UX-WORKSPACE-RETENTION-01 — behavior checkpoint before code, 2026-10-15

**User goal:** Home- och träningsdata som redan bekräftats ska finnas kvar vid varm flikresa och medan en förfallen uppdatering pågår.

**Avgränsad UX/dataregel:** resursminnet ägs av `ProductWorkspace` och försvinner vid avmontering. Dagsnyckel omfattar konto, `accountGeneration`, hund, lokal dag, IANA-tidszon och public/review-läge. Tränings-/innehållsnyckel omfattar konto, `accountGeneration`, hund, relevant ras/ålder och public/review-läge. Samma-scope kallstart visar befintligt laddningstillstånd; varm refresh behåller hela senast bekräftade dags-/träningsunderlaget. Ett enda refreshfel visar senast bekräftat innehåll och en återförsökshandling; ofullständiga källor ger ingen fabricerad dags-total. Bekräftade writes invalidaterar läsningar med äldre revision.

**Refresh:** högst en läsning per scope-flight; inom det queue-godkända 60 s-fönstret gör de 20 kontrollresorna inga extra dags-/träningsrequests. Efter förfallotid eller explicit retry startar en bakgrundsläsning utan att först rensa samma-scope data. Konto-/hund-/dag-/zon-/lägesbyte rensar den gamla privata vyn före ny render; sena svar får inte appliceras.

**Tillgänglighet:** refreshindikatorn har en svensk accessible label; fel och Försök igen går att nå och aktivera utan färg eller dold gest. Ingen ändring av produktflikar, server/datamodell, persistent cache eller telemetri. Testfönstret använder endast syntetisk fixtur/request-trace; inga testsviter enligt v2.1.

### UX-WORKSPACE-RETENTION-01 — implementering och QA-handoff, 2026-10-15

`ProductWorkspace` återanvänder nu ett bekräftat dags-/träningssnapshot mellan Home och Training, med 60 sekunders in-memory-färskhet och delad läsning per scope. Scope omfattar konto och kontogeneration, hund, ras/ålderurval, lokal dag, IANA-tidszon och public/review-läge. Vid scopebyte aborteras äldre läsningar och gamla dags-/träningsdata rensas före ny synlig vy. Dagliga och träningsbaserade läsningar publiceras tillsammans när Home-snapshot saknas eller refresh lyckas; vid ett warm refreshfel behålls senast bekräftade data. Bekräftade writes supersederar äldre flights. Initialt fel med okänd datamängd visar ingen dags-total.

Home visar en accessible refreshindikator och en kort retry-väg när varm refresh misslyckas. README beskriver cachegräns och scope. Den isolerade visual fixture använder samma `workspaceSnapshotReadDecision`; public/review spårar 20 syntetiska Home → Training → Knowledge → Home-resor med 2 initiala fixture-läsningar, 1 join och 40 cacheträffar. Detta är inte live nätverks- eller Supabase-mätning.

Public/review RN Web-byggen och Chromium-renderingar passerar för Home ready/refreshing/refresh error/loading/empty/initial error, Training ready och fixture trace vid 375×844; inga page errors. Riktad ESLint, `git diff --check` och `python3 tools/dev_flow.py validate` passerar. `pnpm typecheck` stoppas av det befintliga orelaterade `Motion.tsx:61`-felet. Ingen testsvit eller databasoperation kördes. Render och implementerarens §14-bedömning finns i `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/workspace-retention/RENDER-REPORT.md`.

Queue är `qa`. Oberoende QA, separat statisk Security-review och Reviewer-signoff återstår; tills dess får slice 5 inte starta. Native VoiceOver, Dynamic Type, safe area och reduced motion är NOT TESTABLE.

### UX-KNOWLEDGE-CACHE-01 — QA/Security findings, 2026-10-15

Första oberoende QA-granskningen blockerade en möjlig sammanfattningsskillnad: overview och oläst detail hämtas parallellt, och en nyare detail-read uppdaterade cache men inte alltid den synliga översiktsräknaren. Detail-load sätter nu UI-summeringen från den cacheöversikt som detail-resultatet just uppdaterade. Den syntetiska `detail-newer`-rendern bekräftade 1/4 overview → 2/4 detail med två bockar → 2/4 varm overview; QA delta PASS.

Statisk Security-granskning bekräftade korrekt konto-/hund-/version-/review-scope och begränsad minnescache, men fann att sign-out avmonterar ProductWorkspace utan att ett nytt cache-scope mountas. En scope-specifik cleanup körs nu vid ProductWorkspace-unmount. Security delta PASS; runtime sign-out är fortsatt NOT TESTABLE. Reviewer PASS bekräftade scope, återhämtning och summary/detail consistency. `UX-KNOWLEDGE-CACHE-01` är stängd som lokal UI-/källkodsslice. Ingen testsvit eller databaskörning.

### UX-TRAINING-UNMARK-01 — lokal implementation och granskningar, 2026-10-15

Detaljbladet kan avmarkera ett enskilt genomfört steg. Public write path återanvänder `deleteTrainingProgress` för aktuell hund, programversion och steg; framgång visas först när en forced readback bekräftar att steget saknas. Samma refresh uppdaterar Mina, Fortsätt och Hemmets scoped snapshot. Senare steg ligger kvar; programåterställning är oförändrad och separat. Reviewexempel ändrar bara lokal komponentstate.

Oberoende Security hittade först en scope-fence-lucka vid hund-/konto-/urvalsbyte under nätanrop. `unmarkStep` fångar nu `currentSelectionKey` och avbryter status-/feluppdatering om scopen ändrats efter delete, readback eller fel. Security delta PASS, QA PASS och Reviewer PASS 2026-10-15. Reviewer noterade att retry först hämtar aktuell status; om steget fortfarande är markerat gör ägaren en separat Avmarkera-handling. Detta är dokumenterat i fixture-rapporten.

Typecheck, ESLint för de fyra ändrade TS/TSX-filerna, RN Web-build, Chromium pending/confirmed/failed/unknown-klickresor, `git diff --check` och kövalidering passerar. Syntetiskt 375×844-underlag finns i `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/training-unmark/RENDER-REPORT.md`. Inga testsviter eller databasoperationer kördes. Native tillgänglighet, Supabase/RLS och full panel-6-visuell acceptans är NOT TESTABLE i denna slice.

### HOME-ROUTINE-WEEKDAYS-01 — implementation till QA, 2026-10-15

Veckointervall kan nu välja en eller flera ISO-veckodagar. Sammanfattning, validering, equality/CAS/readback/retry och due-beräkning omfattar `repeat_weekdays`. Äldre `NULL` behåller exakt ankardags-/intervallregel och lämnas NULL vid namn-/checkliständring. De gamla create/replace RPC-namnen bevaras; gamla create-retries med matchande legacy-fält returnerar befintlig veckodagsregel utan att skriva om den. Migrationen är framåtriktad, oapplicerad.

Architect och Security har statiskt granskat den exakta SQL-/RPC-/legacy-källan och gett PASS. Rättningar omfattar legacy-create idempotens och att 30-dagars service-purge kan ta bort förfallna dagsrader utan att skapa skip-tombstones; ej utgångna klientrader kräver fortsatt ägarkontroll och skyddas av befintliga grants/RLS. Compliance PASS, Critic PROCEED och plan-Security PASS gäller oförändrat kontrakt.

`pnpm typecheck`, riktad ESLint, public/review RN Web-byggen, `git diff --check` och queue validation PASS. Manuell Chromium-kontroll vid 375×844 verifierar måndag/fredag selected state, fulla checkbox-namn, minst 44×44 pt, minimumfel med avstängd sparning och legacy-sammanfattning. Evidence: `docs/design/evidence/vision-rev02/ux-fix-2026-10-15/routine-weekdays/RENDER-REPORT.md`. Oberoende QA PASS och Reviewer PASS 2026-10-15. Ingen testsvit eller databasoperation kördes. Referensbild för panel 4 saknas i checkout; rutinhallens staplade separata block ska komprimeras i beroendeuppgiften `HOME-ROUTINE-CHECKLIST-01`; full rev02-visuell acceptans påstås inte.

### HOME-ROUTINE-CHECKLIST-01 — kompakt rutinöversikt till QA, 2026-10-15

Rutinhanteringen visar nu alla rutinmallar på en gemensam varm yta med diskreta avdelare. Namnradens enda `Redigera`-knapp är lågmäld. Dagsvalet `Lägg till på Hemskärmen`/`Ta bort från Hemskärmen` ligger bredvid helradering; den första åtgärden har mjuk grön yta, helradering röd kontur och bekräftelse. Vid aktivt create/edit-utkast döljs den fasta `Klar`-knappen, så `Spara rutin` är enda visuella huvudåtgärden. Stängning går via stängknappen och befintlig discard-bekräftelse.

Public/review RN Web-byggen och manuell Chromium QA passerar vid 375×844, 430×844, 375×667 och 140 % textproxy. Granskningen verifierade separata rutiner, create/saved, failed/unknown/exakt retry, fortsätt/discard, helraderingsbekräftelse med Avbryt och dagsmarkering på Hem utan browser errors. Webbkontrollerna är syntetiska; native Dynamic Type/VoiceOver och live Supabase/RLS/migration-runtime är NOT TESTABLE. `vision_rev02.jpg` finns, men full panel-4-jämförelse väntar på fullskärmslistans implementation.

Efter ägarens godkännande av obligatorisk hookcheck passerar den fulla lokala kontrollkedjan: app- och edge-typecheck, lint och testsvit. Stale assertions/fixtures för redan införda weekday-, Home-fixture-, training-, log- och scoped profile-read-kontrakt uppdaterades utan nya testfall. Ingen databasåtgärd gjordes. Underlag: `docs/design/evidence/vision-rev02/routine-checklists/RENDER-REPORT.md`.

QA hittade sedan att helraderingsbekräftelsen påstod att dagskopior behålls trots att migrationens cascade tar bort dem. Texten förklarar nu att rutinen, alla dagskopior och sparade överhoppningar tas bort. Den destruktiva knappen ensam anropar radering; Avbryt lämnar rutinen kvar. Oberoende QA PASS och Reviewer PASS. App-typecheck, edge-typecheck, full ESLint och Node-testsviten kördes i den isolerade källkopian igen och passerade; tester 492/492. `pnpm check`-samlaren kunde inte startas där eftersom den försökte installera beroenden via den temporära junctionen; samma fyra underliggande kontroller kördes direkt och passerade. Native Alert-rendering är NOT TESTABLE. Paketet är klart som lokal UI-/källkodsslice; live Supabase/RLS, migration och native kvarstår separat. Köstatus stängs i checkpointen efter denna notis.

### MotionPressable-typkontroll, 2026-10-15

`Motion.tsx:61` använder nu ett explicit typat hover-tillstånd för React Native Web utan att förlora den konkreta Animated-stilen eller `pressed`-callbacken. `pnpm typecheck` och full `pnpm check` passerar. Fixen finns i commit `617680b`; den separata UX-FIX-baseline Motion-posten har ytterligare runtime-kriterier och hålls åtskild från detta typfel.

### MULTI-DOG-HOME-01 — implementation till review, 2026-10-18

AppFlow hämtar nu samtliga ägda hundar med stabil ordning och håller valt hund-ID i rotflödet. Hundporträttet på Hem öppnar en väljare med namn, ålder och aktiv markering; byte monterar en ny hundnycklad ProductWorkspace. Home/Kunskap fortsätter använda den valda hundens födelsedatum, ras och ID för artikelurval och stale-response-skydd. Lägg till hund använder ägar-namespacad SecureStore-idempotensnyckel, RPC-kvitto och readback av exakt hundprofil innan aktivering. Avbryt hämtar nu om ägarlistan innan väljaren öppnas igen; bekräftad kontoradering städar även den lokala nyckeln före konto-generationens tidiga retur.

Migrationen möjliggör flera hundar per konto utan att ändra en-ägare-per-hund, återanvänder befintlig RLS och introducerar en privat idempotensfunktion med auth-radlås. Artiklar/drafts importerades eller publicerades inte. Ålders- och rasurvalet är kopplat till aktiv hund; om nuvarande publicerade rader ger synlig skillnad mellan exempelvis 12 och 1 år kräver databasens aktuella publicerade innehåll separat kontroll.

Kontroller: `pnpm typecheck`, `pnpm lint`, `git diff --check` och `python tools/dev_flow.py validate` passerar. Arkitekt, Security, oberoende QA och Reviewer har PASS för statisk granskning. Inga testsviter, SQL, live Supabase/RLS eller app-/enhetsflöden kördes. Publicerad åldersvariation och §14-skärmbilder vid 375×844, 430×844, 375×667 och 140 % text är NOT TESTABLE här. Erik bad uttryckligen att checkpoin­ta och pusha samt fortsätta planen; Slice A är därför `done` som kodcheckpoint men detta är inte ett runtime- eller visuellt PASS.

Slice A är pushad i commit `caa3d3a` på `codex/age-content-multi-dog`. Slice B plan v6 har godkänts av Architect, Critic och Security; v6 lade till `AppFlow.tsx` för att återställa Hundprofil efter add/avbryt från Inställningar. Slice A:s UI/runtime-evidens förblir separat NOT TESTABLE och räknas inte som PASS.


### MULTI-DOG-PROFILE-01 — implementation till review, 2026-10-18

Hundprofil i Inställningar visar nu alla RLS-listade hundar med namn, beräknad ålder och aktiv markering. Val av annan hund går via AppFlow-valideringen och öppnar Hem i den hundnycklade arbetsytan. `Lägg till hund` återanvänder samma ProfileScreen-, idempotency-key- och readback-flöde som Hem. Bekräftat tillägg aktiverar den bekräftade hunden och återgår till Hundprofil; avbryt återgår dit med föregående hund aktiv. Hundbyte/tillägg stängs av medan profil- eller kenneluppgifter har osparade ändringar. Ingen SQL, RPC eller datainsamling ändrades.

Kontroller: `pnpm typecheck`, `pnpm lint`, `git diff --check` och `python tools/dev_flow.py validate` passerar. Oberoende statisk Reviewer PASS omfattar routning, aktiv hund, idempotent återanvändning, konto-generation-skydd, dirty-state och tillgänglighet. Ingen testsvit kördes. Äkta appflöde, Supabase/RLS, native tillgänglighet och krävda §14-skärmbilder (375×844, 430×844, 375×667 och 140 % text) är NOT TESTABLE i denna checkpoint. Erik har därefter uttryckligen bett att committa och pusha kodcheckpointen så att den kan provas live. Slice B förblir öppen för app-/Supabase-/RLS- och visuell evidens; en push är inte ett runtime-PASS.

### BUILD-CHECK-03 — Codemagic-check korrigerad, 2026-10-18

Codemagic-loggen i `Tassla_55_artifacts.zip` stannar i `Check application`. Den visar fyra testfel: två förväntade den pensionerade `create_dog`-signaturen, ett använde det gamla Home-porträttets tillgänglighetskontrakt och ett policytest fångade en onödig kennelkällkontroll. `ProfileScreen` verifierar nu kennelkälla endast efter aktivt val och hanterar sparad request-ID som återhämtning. De tre inaktuella assertionerna är uppdaterade utan att ta bort tester eller försvaga no-identity-kontrollen.

Kontroller: `CI=1 pnpm check` PASS (TypeScript, edge typecheck, ESLint och 492/492 tester); Expo iOS bundle-export PASS; content/release guards PASS; `git diff --check` PASS. Oberoende QA PASS och statisk Reviewer PASS. Ingen annan Codemagic-fas finns i det bifogade utdraget, så det bevisar varken fel eller PASS för prebuild, CocoaPods, signering eller Xcode-arkivering. Expo iOS prebuild/native archive är NOT TESTABLE på denna Windows-miljö; verklig Mac/Codemagic-körning saknas.

Erik har nu uttryckligen bett att committa och pusha efter de lokala gates. Erik har förtydligat att commit/push inte ska vänta på Codemagic. Samtliga lokala icke-Mac-gates är gröna; den fjärrkörningen är inte verifierad här. Om Codemagic visar ett nytt fel efter pushen ska felet rättas från steploggen före nästa push.

### CONTENT-PUBLISH-LABEL-01 — lokal implementation klar, databasesteg väntar, 2026-10-18

De publicerade kunskaps- och träningsdetaljerna visar nu etiketten ”AI-genererat innehåll” när ursprungsfältet är sant. Båda publicerade content-loaders validerar och mappar fältet. Importen markerar de elva versionsraderna som AI-genererade; transaktionell publicerings-SQL kontrollerar och låser de elva kända raderna, publicerar tio runtime-versioner och håller `before-homecoming` som draft.

Kontroller: content-bundle publication check PASS; `pnpm check` PASS (493/493); `pnpm bundle:ios` PASS; `git diff --check` PASS. Arkitekt, Security, QA och Reviewer har PASS för plan/källkod och statisk SQL-granskning. Fjärtdatabas migration/import/publicering/readback är NOT TESTABLE: ingen Supabase CLI, länkad projektref, credential eller databasverktyg finns i körmiljön. Inga DB-rader ändrades. Kör migrationsfilen, innehållsimporten och guarded publish-filen i den avsedda Supabase-miljön i dokumenterad ordning och verifiera readback före rollout. Underlag: [paketplan](CONTENT-PUBLISH-LABEL-01.md) och [UX-spec](../../plans/CONTENT-PUBLISH-LABEL-01-ux-spec.md).


### UI-SHEET-ACTIONS-01 — nedåtsvep och knapp-/UX-plan, 2026-10-18

Användarens BottomSheet-patch är applicerad och anpassad: handtag/rubrik är dragyta, samma parent-onRequestClose hanterar alla stängvägar, useLayoutEffect håller callbacken aktuell, och timers/animationer städas på ny dragning, hide/reopen, reduced motion och unmount. Ingen lokal visibility-state eller ändrad datalagring. Guardpredikaten i Health/Training/Log/Daily manager/checklistor är källgranskade; controller-testet modellerar nekad stängning, inte hela formuläret.

Reproducerbar knappinventering omfattar 120 källfiler, 0 parserfel och 416 kontroll-/actionplatser (303 app, 48 delade, 65 preview/galleri; 25 Alert-objekt och 8 system-API-platser ingår). Kodplatser är inte unika runtimeknappar. Samtliga bifogade UX-tips har nuläge, prioritet, avgränsning och testbara paket; framtida ikonbyten följer Eriks Ångra-pil och kontextuella penna men bevarar primär-/fel-/samtyckes-/destruktiv text. Inga breda knappbyten eller nya UX-funktioner byggdes utöver svepet.

Architect APPROVE, Critic PROCEED, oberoende QA PASS och Reviewer PASS för den lokala checkpointen. Riktade tester 24/24, full pnpm check 517/517, public iOS JS-export, verktygsregenerering, whitespace (inklusive nya filer) och kövalidering PASS. Native gest/tangentbord/VoiceOver, visuella jämförelsebilder och verkliga appflöden är NOT TESTABLE; ingen Mac/Codemagic/DB-körning påstås. Befintlig content-publish-diff bevaras. Ingen commit/push gjord. Nästa föreslagna paket: UI-ACTIONS-COMMON. Underlag: [plan](UI-SHEET-ACTIONS-01.md), [nästa paket](../../plans/UI-UX-NEXT-PACKAGES-2026-10-18.md), [inventering](../../design/UI-ACTION-INVENTORY-2026-10-18.md) och [verifiering](../../design/evidence/sheet-actions-2026-10-18/VERIFICATION.md).


### UI-ACTIONS-COMMON — lokal implementering, 2026-10-18

Gemensamma Ångra-/datum-/tidskontroller har uppdaterats enligt plan v2. Architect APPROVE och UX Critic PROCEED. Bekräftad logg-add får en separat fokuserbar `return-up-back-outline`-knapp med objektbundet a11y-namn; toastmeddelandet är ett message-only alert. Retry/Avbryt och callbacks är bevarade. Kalender-/tidsfält visar ikoner och fältbundna etiketter; månadsnavigering använder ikonknappar och ren helper. Kalendergrid vid 375pt har 343pt enligt tokeninsets, med 44×44pt dagrutor.

Riktade tester 12/12, `CI=1 pnpm check` 521/521, public `pnpm bundle:ios`, 121-filers/416-controls inventory-regenerering, `git diff --check` och `PYTHONUTF8=1 python tools/dev_flow.py validate` PASS. Se [verifieringsunderlag](../../design/evidence/ui-actions-common-2026-10-18/VERIFICATION.md). Native/VoiceOver/visuell pixeljämförelse NOT TESTABLE. Oberoende QA PASS (12/12) och Reviewer PASS; logik, tillgänglighetssemantik och 343pt/44pt gridberäkning granskade. Inga commits/pushar gjorda.

### UI-MAIN-SWIPE-01 — implementation till oberoende QA, 2026-10-18

Huvudflikssvepet fångar nu tydlig vågrät rörelse i PanResponder-fångstfasen med verifierade RN-layoutenheter, använder långdrags-/snabbgestregler och lämnar lodrät scroll till sidans riktningslåsning. Inre `HorizontalGestureRegion`-undantag, inaktiv sidgrind, kunskapsdetalj och befintlig no-wrap-navigering är bevarade. BottomSheet-koden från patchen var redan implementerad i nyare variant och är orörd.

Riktade tester PASS (8/8), `pnpm check` PASS (529/529), offentlig iOS JS-bundle PASS, `git diff --check` PASS och kövalidering PASS. React Native Web-fixturbundle byggdes; Chromium misslyckades att starta på Windows med side-by-side-konfigurationsfel, så skärmbildsjämförelse och §14-punkt 16 är EJ TESTBARA. Faktisk nativegestprioritet, inre scroll och telefonprov är också EJ TESTBARA. Ingen full UI-, visuell eller deviceacceptans hävdas. Underlag: `docs/tasks/dev/UI-MAIN-SWIPE-01.md`, `docs/design/evidence/ui-main-swipe-2026-10-18/VERIFICATION.md`.

QA hittade att ovillkorlig respondervägran kunde hindra lodrät scroll efter initialt vågrät fångst. Korrigeringsplan v5 godkändes av Architect/UX Critic; `onPanResponderTerminationRequest` lämnar nu över när senaste rörelsen inte längre uppfyller den tydligt vågräta regeln. Nytt källtest kontrollerar exakt dx/dy-villkor. Efter fix: riktade tester 8/8, `pnpm check` 529/529 och offentlig iOS-bundle passerar igen. Fysisk/native-scroll och visuell render är fortsatt EJ TESTBARA; oberoende QA körs om.

Oberoende QA v5: **PASS** för avgränsad lokal acceptance. Bekräftade att termination handler lämnar över när senaste `dx`/`dy` inte längre uppfyller svepregeln och att det statiska testet kontrollerar just villkoret. Visuell render och native gesture/scroll är fortsatt EJ TESTBARA och anges inte som PASS. Nästa steg: oberoende Reviewer av slutdiffen.

Oberoende Reviewer v5: **PASS** för lokal implementation och källkontrakt. Verifierade installerade React Native 0.86.3-API:er, fångst-/överlämningsvillkoret, exkludering, enabled-gate, riktning och bevarad no-wrap. Ingen visuell eller nativegest-PASS hävdas. Därefter checkpointas och pushas paketet till samma branch.


### UI-TRAINING-OVERVIEW-01 — träningsöversikt, lokal granskning klar, 2026-10-19

Bifogad träningsredesignpatch är implementerad på `codex/tassla-ui-ux-bundle-2026-10-18`. Översikten visar nästa övning och statusordnade publicerade program; programdetaljen visar klara, aktuell och kommande övningar. Versionsbunden progress, guarded completion, bekräftad save/error/retry, unmark/reset, källor och AI-etikett är bevarade. Oberoende QA och Reviewer PASS för begränsad lokal omfattning.

Riktade tester 13/13, `CI=1 pnpm check` 542/542, offentlig iOS JS-bundle (1446 moduler), `git diff --check` och queue validation PASS. Renderad public/review-evidens och §14-bedömning: [VERIFICATION.md](../../design/evidence/ui-training-overview-2026-10-18/VERIFICATION.md). Live Supabase/RLS, verkligt publicerat innehåll, native tillgänglighet/enhetsbeteende och telefonprov är NOT TESTABLE. 140% webzoom radbryter befintlig `Kunskap`-etikett. Den ägarbeställda kompositionsavvikelsen från rev02-panel 6 är avgränsad; full panelacceptans hävdas inte.

Implementationscheckpoint `b59169c` är pushad till `origin/`codex/tassla-ui-ux-bundle-2026-10-18; slutlig releasehistorik finns i `docs/releases/HISTORY-2026.md`. Ingen Codemagic/TestFlight-build påstås.
### UI-ACTIONS-ROWS — 1b avslutad, 2026-10-19

Rutinhallens redigering använder en ikonknapp med fullt tillgänglighetsnamn; veckodagarna visas som `Må, Ti, On, To, Fr, Lö, Sö` i en horisontellt åtkomlig rad. Loggens typväljare visar vald kategori som ikon, och öppnar en lista med ikon och namn för alla sju typer. Typbyte stänger listan och lämnar datum, tid och anteckningsutkast intakta. Radera/Avbryt/spara behåller text och befintliga flöden.

Oberoende QA **PASS** och Reviewer **PASS** för avgränsad kodändring. Riktade tester 20/20; `CI=1 pnpm check` 545/545; offentlig iOS JS-bundle (1446 moduler); `git diff --check`; kövalidering; 10 syntetiska RN Web-skärmbilder och interaktionskontroller PASS. Se [verifieringsunderlag](../../design/evidence/ui-actions-rows-2026-10-19/VERIFICATION.md). Native VoiceOver/TalkBack, Dynamic Type, Supabase/RLS och signerad iOS-build är NOT TESTABLE. Full acceptans av rev02-panelerna 1/4/5 hävdas inte.

Nästa UI/UX-paket: `2a UI-ACCESSIBILITY-HOME-LOG`; sedan 2b, 3 Kunskapssök, 4 Pull-to-refresh och 5 Tom-/laddnings-/felåterkoppling. Hela kvarvarande releaseinventeringen lämnades tillsammans med 1b-closeout.

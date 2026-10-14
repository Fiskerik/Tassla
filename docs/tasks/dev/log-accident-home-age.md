# Olyckstyper och Hemmets ålder/livsfas

Datum: 2026-10-14 · Version: 4.3 · Status: A och B lokalt checkpointade; runtime-verifiering är separat

## Ägarmandat

Erik bad 2026-10-14 att en olycka som loggas utan typ ska öppna ett val före skrivning: Kiss och Bajs som kryssrutor, Kiss förvalt och minst ett val krävs. Valda typer ska räknas som motsvarande Kiss/Bajs i mönsterberäkningen. Intervalltexten ska använda hans exakta singularformer `Var 12 minut` och `Var 22 timme`; befintligt `ungefär` och meningsform behålls.

På Hem ska åldersremsan använda veckor till och med 20 veckor, månader därefter fram till och med första födelsedagen och år från dagen efter. Hem ska visa en separat, uttryckligen ungefärlig livsfas. Detta ersätter tidigare veckoremsa 0–aktuell ålder+12 i `docs/mvp.md`, `docs/design/vision-rev02-spec.md` och den äldre Hem-specifikationen. Hundprofilens sparade enhetsval och innehållsurvalets interna veckor ändras inte.

## Deluppgift A — Olyckstyp och mönsterräkning

### Omfattning och skrivfiler

- `src/features/puppy-log/log-model.ts`
- `src/features/puppy-log/LogScreen.tsx`
- `src/components/ui/CheckboxCard.tsx` (explicit web checked state alongside native accessibility state)
- `src/features/puppy-log/README.md`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/DevelopmentPreview.tsx`
- `src/data/workspace-data.ts`
- `supabase/migrations/202610140001_accident_kinds.sql`
- `tools/visual-check/app.tsx`
- `docs/design/evidence/vision-rev02/log-accident-types/`
- `docs/tasks/dev/log-accident-home-age.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`

### Datakontrakt

- Appfältet heter `accidentKinds`; lagringskolumnen heter `accident_kinds text[]` på `dog_events`.
- Tillåtna värden är endast de kanoniskt ordnade mängderna `['pee']`, `['poop']` eller `['pee','poop']`. Ordningen är alltid Kiss först och Bajs sedan. Övriga eventtyper har `NULL`.
- `NULL` är tillåtet endast för redan lagrade historiska olyckor med okänd typ. Läsning får inte härleda Kiss/Bajs från händelsens ikon, anteckning eller mönster.
- Ny olycka kräver minst en typ både i UI/appgränsen och databasen. Ändring från annan eventtyp till `accident` kräver typ. En äldre `accident` med `NULL` får sparas om endast tid/anteckning ändras och typen lämnas okänd; när ägaren uttryckligen väljer typ ersätts `NULL` med valen. Om typen ändras bort från `accident` rensas fältet.
- Migreringen bevarar befintliga rader, sätter ingen default och installerar radkontroll samt BEFORE INSERT/UPDATE-guard. INSERT av olycka kräver en icke-tom giltig kanonisk mängd; UPDATE från annan typ till olycka kräver samma. Endast en redan historisk olycka vars gamla typfält är `NULL` får behålla `NULL` på update. En olycka med lagrade val får aldrig tömmas tillbaka till `NULL`. Icke-olyckor måste alltid ha `NULL`.
- Kolumnspecifik UPDATE-grant utökas med `accident_kinds` för `authenticated`, eftersom befintlig grant listar varje tillåtet fält uttryckligen. Övriga grants och RLS-policyer ändras inte.
- `EVENT_COLUMNS`, radtyper, validering, skrivpayload, readback, `matchesChanges`, fel-/osäker återhämtning och eventmappning bär samma typfält. Alla payloads och readbacks kräver kanonisk ordning; arrayjämförelse använder denna ordning konsekvent. Retry använder samma användarval och samma mutation-ID; ingen ny olycka skapas vid retry av osäker skrivning.

### Beteende- och tillståndskontrakt

- Snabbknappen Olycka öppnar typväljaren och skriver inget förrän Spara trycks. Gruppetiketten är `Vad hände?`; Kiss är förbockat; Kiss/Bajs är separata, tillgängliga kryssrutor vars checked-status exponeras för skärmläsare på native och web. Ny/omklassad olycka kräver minst en ruta och visar hjälptext `Välj Kiss, Bajs eller båda så räknas olyckan i dina mönster.` Om båda stängs av visas valideringsorsaken, inte bara en inaktiv Spara-knapp.
- Befintlig olycka med lagrade typer börjar med dessa rutor valda. Om ägaren stänger av samtliga typer kan den inte sparas som okänd; hjälptext förklarar att en sparad typ inte kan tömmas. Historisk olycka med `NULL` börjar med båda av och förklarar `Typen saknas på den äldre posten. Lämna den okänd eller välj bara det du vet.` Den får sparas fortsatt okänd när endast andra fält ändras; minst en typ krävs först när ägaren väljer att ange typ.
- Första giltiga tryck på Spara låser knappen omedelbart och skapar högst ett väntande intent med ett mutations-ID, tid och kanoniska val. Om möjlig dubblett kräver bekräftelse behåller dialogen samma fulla intent och val; Bekräfta skickar det. Avbryt, systemets bakåtknapp och stängning innan bekräftad skickning skriver inget och släpper det väntande intentet, men behåller checkboxvalen i formuläret; ett nytt tryck på Spara efter avbryt är en ny avsikt med nytt ID och tid. Retry av failed/unsure använder samma ID, tid och val; ett extra tryck skapar aldrig en andra intent.
- Befintlig dubblettkontroll, sparstatus, fel/osäkert-besked och retry gäller fortsatt. Misslyckad eller osäker sparning behåller valen; Saved visas först efter bekräftad readback.
- Redigering visar sparade val. Historisk olycka med `NULL` visas med båda rutorna av och en kort neutral förklaring; ägaren kan lämna den okänd, eller välja minst en typ. Oförändrad okänd post kan sparas utan att attribueras.
- Om eventtyp växlas från olycka rensas olycksvalen; växling tillbaka från en annan typ börjar med Kiss förvalt. Olyckans save-guard gäller endast nya/omklassade olyckor, inte andra eventtyper.
- Mönster räknar direkta `pee`/`poop` samt olyckor med motsvarande sparad typ. En olycka med båda räknas exakt en gång i vardera mönstret. Historisk `NULL` räknas inte i något av dem.
- Intervallens sifferlogik ändras inte. Synlig text behåller nuvarande `ungefär var …`-konstruktion men använder exakt singular `minut` respektive `timme`, även efter tal större än ett, enligt ägarens uttryckliga copy-beslut.

### Verifiering

- `pnpm typecheck`
- ESLint för berörda TypeScript-filer (kommandot finns i köposten).
- `git diff --check` och `python3 tools/dev_flow.py validate`.
- Granska hela create/edit → workspace → Supabase insert/update → readback/retry → pattern-summering, samt SQL-kontroller och bakåtkompatibilitet statiskt.
- Visuellt granskningsharness använder samma `LogScreen` och `LogEvent` som produktion och visar: ny Kiss, båda typer, legacy unknown, tomt/ogiltigt val, avbryt/bakåt samt pending/failed/unsure/retry och checkboxernas grupp-/hjälptext. Spara UI-bilder och §14 för relevanta tillstånd. Fixtur bevisar presentation, inte Supabase readback.
- Ingen unit-/integrationstestsvit läggs till eller körs i denna uppgift. Ingen verklig Supabase/RLS-körning påstås. SQL-write guard, lagring/readback, legacy-NULL-bevarande och retry är därför NOT TESTABLE. A är en lokal kod/UI-leverans: den får nå queue `done` efter typecheck/lint, statisk SQL/dataflödesgranskning, UI-rendergranskning och QA + Reviewer + Security för källkodens avgränsade acceptans. Detta betyder inte att DB-persistens godkänts; sådan verifiering har en egen köpost och krävs före release av olyckstypfunktionen.

## Deluppgift B — Automatisk Hem-ålder och ungefärlig livsfas

B:s godkända slutleverans sker efter att A:s lokala kod/UI-leverans har nått en dokumenterad, granskad checkpoint i kön. A och B delar `src/features/home/ProductWorkspace.tsx`, `tools/visual-check/app.tsx` och flera checkpoint-/rapportdokument. Den separat planerade DB-verifieringen blockerar inte B, men olyckstypfunktionen får inte beskrivas som live-verifierad eller release-verifierad före den.

**Sekvenseringsavvikelse 2026-10-14:** B:s kod och första renderunderlag hann skapas i den gemensamma arbetsdiffen innan A:s granskade checkpoint registrerades. Det räknas inte som en B-checkpoint eller QA/review. För A fryses den aktuella arbetsdiffens patch/fingerprint som ett lokalt checkpointunderlag; checkpointen kan innehålla B-hunks i de delade filerna, men de märks uttryckligen som befintliga och ogranskade. A:s QA/Reviewer/Security-resultat gäller endast A:s acceptans och de angivna A-hunkarna. Efter A:s checkpoint granskas B separat mot samma frysta bas; B:s kontroller och renderunderlag körs på nytt och eventuella hunkar reconcileras utan att A:s godkända kod skrivs över. Ett heltäckande typecheck/lintresultat kan omfatta båda feature-seten, men ger inte B-acceptans.

### Omfattning och skrivfiler

- `src/features/onboarding/dog.ts`
- `src/features/onboarding/README.md`
- `src/features/home/ProductWorkspace.tsx`
- `src/content/select-content.ts`
- `src/data/workspace-data.ts`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/PuppyChecklistScreen.tsx`
- `src/features/knowledge/checklist-model.ts`
- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/PreviewHomeScreen.tsx`
- `src/features/home/home-today.ts`
- `src/features/home/README.md`
- `tools/visual-check/app.tsx`
- `docs/design/evidence/vision-rev02/home-age-stages/`
- `docs/plans/HOME-REV02-visual-ux-spec.md`
- `docs/mvp.md`
- `docs/design/vision-rev02-spec.md`
- `docs/tasks/VISION-REV02.md`
- `docs/tasks/dev/log-accident-home-age.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`

### Datumskontrakt och ålder

- Datum tolkas som lokala kalenderdatum enligt befintlig `YYYY-MM-DD`-validering, utan tidszonsförskjutning. Saknat, ogiltigt eller framtida födelsedatum ger neutral presentation: ingen beräknad ålder, remsa eller fas; ingen vecka 0 eller krasch.
- `ProductWorkspace` tar en lokal kalenderdag per render och skickar samma `today` till Hem. Ålder, remsa, fas och innehållskort använder den. Visuell harness får injicera fixturens `today`; komponenter i samma Home-render läser inte klockan oberoende.
- Tröskel 1 är födelsedatum + 140 dagar. Från födelsedagen till och med dag 140 visas hela veckor (`floor(åldersdagar / 7)`), med 0–20 som remsvärden. Dag 141 byter till hela kalendermånader.
- Månadsläge gäller från dag 141 till och med första årsdagens kalenderdatum. Årsdagen beräknas med samma månads-klampning som befintlig kod: ett 29 februari-födelsedatum får 28 februari som årsdag under icke-skottår. Den dagen visas fortfarande 12 månader; årsläge börjar dagen efter.
- Årsläge visar hela kalenderår (`1 år`, `2 år`, …). Hemmets användarsynliga ålder är alltid ett enda heltal och en enhet (`N vecka/veckor`, `N månad/månader`, `N år`); inga kvarvarande veckor/månader läggs till.
- Vecko-/månads-/årspresentationen skapas av en gemensam automatisk Home-hjälpare. Profilens `age_display_unit` och dess användarvalda format lämnas oförändrade. Träning/innehållsfrågor fortsätter använda befintliga hela åldersveckor.

### Remsa, faser och interaktion

- Remsan visar enbart värden för aktuell enhet: veckor 0–20, månader 0–12, år 1 till aktuellt helt år + 3. Den ersätter enhetens datamängd vid gränsen.
- Aktuellt värde markeras. Startposition är `max(0, currentIndex - 3)` så den aktuella markören fortsätter ligga bland de sju synliga cellerna. Scrollning fortsätter vara en visuell åldersindikator; den väljer inte innehåll, dag eller träningsmål. Porträttlager, fade, swipe-arbitrering och övrigt befintligt gestbeteende bevaras.
- Remsans omslutande vy grupperar inte tillgänglighetsträdet och får ingen ensam enhetsetikett som kan dölja de enskilda cellerna. Varje cell annonserar tal + enhet + aktuell-status. Vid enhetsbyte får listan ny nyckel/initialposition så tidigare enhets scrolloffset inte läcker över.
- När födelsedatum saknas, är ogiltigt eller ligger i framtiden skickar `ProductWorkspace` `ageWeeks: null` till innehålls-/träningsurval. Urvalet ger inget åldersbundet valpprogram/checklista. Kunskapsvyn kan visa åldersoberoende innehåll. Redan påbörjad träningsprogress finns kvar under `Mina` och i en separat fortsättningssektion med rubriken `Fortsätt där ni var`; den får inte visas under `Passar just nu` när ålder är okänd. Ingen ålder eller åldersbaserad passform får antydas.
- Hemmets identitetsrad visar den automatiska åldern och en separat diskret etikett `Ungefärlig fas: VALP`, `… UNGHUND` eller `… VUXEN`. Etiketten använder samma åldersberäkning men är inte träningsmål, diagnos eller innehållsurval.
- Föreslagna produktgränser enligt lokal dog_expert: VALP före 6 fulla kalendermånader; UNGHUND från 6 till före 24 fulla kalendermånader; VUXEN från 24 månader. Ingen SENIOR-gräns införs. Gränserna är grova, märkta ungefärliga och påstås inte vara universella veterinärnormer.
- Det aktiva `HomeScreen`-kortet `Just nu` visar diskret metadata `Hundens ålder: {autoålder}` från samma hjälpare och `today` som identitetsraden; dess tillgänglighetslabel omfattar samma ålder. `HomeCarousel` är inte monterad i produktionen och ändras inte eller återkopplas inte här. Övriga profilytor fortsätter visa den uttryckligen valda profilenheten.

### Datumgränser som ska kunna granskas

För jämförbara fixturer ska render-/kontrollunderlaget omfatta:

1. 140 dagar: vecka 20 och sista veckaremsa.
2. 141 dagar: månadsläge och första månadsmarkering, enligt faktiskt födelsedatums fulla kalendermånader. Fixturen använder produktionshjälparen; ålderstexter hårdkodas inte i harness.
3. Första årsdag: 12 månader.
4. Dagen efter första årsdag: 1 år.
5. Födelsedatum 29 februari med årsdag 28 februari i icke-skottår, samt nästföljande dag.
6. Födelsedatum saknas/är ogiltigt/ligger i framtiden.
7. Fasmilstolpar vid 6 och 24 fulla kalendermånader.

Visuell jämförelse ska följa `docs/design-rules.md` §14 vid 375×844 och 430×844 samt relevant större text. Remsan och fasraden läggs inom befintlig identitetshierarki/tokens; ingen ny dekorativ sektion eller interaktiv kontroll tillkommer. Jämförelsematrisen noterar att nuvarande rev02-referens enbart ritar veckor, medan ägarbeslutet kräver enhetsbyte och fasetikett; visuella avvikelser i övriga Hem-kompositionen räknas separat och får inte tyst godkännas.

### Expertunderlag och begränsning

Lokal dog_expert-konsultation 2026-10-14 rekommenderade separata åldershjul och grova VALP/UNGHUND/VUXEN-intervall, samt att vänta med SENIOR. Experten kunde inte nå webbkällor; hänvisningen till AAHA Canine Life Stage Guidelines 2019 är därför inte verifierad i denna uppgift. Etiketterna får inte beskrivas som veterinärfastställda eller universella. Checklistornas åldersfönster är redaktionella urval och styr inte dessa faser.

### Verifiering

- `pnpm typecheck`
- ESLint för berörda TypeScript-filer (kommandot finns i köposten).
- `git diff --check` och `python3 tools/dev_flow.py validate`.
- Render-/evidensbilder för trösklarna ovan med aktuell presentation. Fyll i designregelverkets §14 och notera viewport, enhet, fixtur och plattformsbegränsningar.
- Home-fixturer renderar produktionshjälparen via `HomeScreen` med samma injicerade datum för identitet, remsa, fas och aktivt `Just nu`-kort; ingen fristående mock av åldersberäkningen.
- Ingen unit-/integrationstestsvit läggs till eller körs i denna uppgift. Kalendergränser inklusive skottår granskas statiskt och genom render-fixturer; inget testresultat eller native-/live-backend-resultat hävdas utan faktisk verifiering.

## Granskning och status

- Architect APPROVE och Critic PROCEED för exakt v4.1 mottagna 2026-10-14 för A och ursprungligt B-omfång. v4.1 preciserar dubblett-avbrytning och A/B-sekvensering. Reviewer hittade därefter två P2-fynd i B: tillgänglighetsgruppen kunde dölja celler och kodens null-age-skrivvägar låg utanför v4.1. v4.2 lade till exakt de granskade null-age-skrivfilerna och krävde att varje remscell förblir åtkomlig; Architect APPROVE och Critic PROCEED för synkroniserad v4.2 plan + queue mottagna 2026-10-14. Reviewer bekräftade dessa korrigeringar men hittade ett nytt P2: sparade fortsättningsprogram visades som `Passar just nu` när ålder är okänd. v4.3 klargör att träningsprogress ska visas endast i `Fortsätt där ni var`/`Mina` när `ageWeeks=null`; åldersbaserad passform får inte antydas. Architect APPROVE och Critic PROCEED för exakt B-only v4.3 plan + queue finns i köhistoriken, och den godkända UI-korrigeringen är implementerad. Inga tester lades till eller kördes under planreview. QA/Reviewer-granskning av A gäller endast dess acceptanskriterier.
- A: Dog Expert QA PASS, Reviewer PASS och statisk Security PASS 2026-10-14 för A:s acceptanskriterier. Faktiskt kört: `pnpm typecheck`, riktad ESLint för berörda TypeScript/TSX-filer, `git diff --check`, `python3 tools/dev_flow.py validate` och lokalt RN Web-bygge/render enligt [A:s rapport](../../design/evidence/vision-rev02/log-accident-types/RENDER-REPORT.md). Ingen unit-/integrationstestsvit lades till eller kördes. Källkodens lokala leverans är DONE efter registrerad patchfingerprint; live SQL/readback/RLS/mutation-regression ligger kvar NOT TESTABLE.
- `LOG-ACCIDENT-RUNTIME-VERIFY-01` är separat beroende på A: kör migration och authenticated read/insert/update i avsedd utvecklingsdatabas, inklusive legacy-NULL och retry/readback. Den måste bli godkänd före påstående om live- eller releaseverifierad olyckstypdata.
- B: Omslutande `accessible` gruppering borttagen; cellernas egna enhetsnamn bevarade. v4.2-checkar och alla 14 datum-/viewportrenders kördes på nytt, med webbtillgänglighetsträdet kontrollerat. v4.3 visar okänd ålder neutralt, placerar återupptagbar sparad träning i `Fortsätt där ni var` och behåller progress under `Mina`; två fresh renders visar rekommenderat- och Mina-flödet i [renderingsrapporten](../../design/evidence/vision-rev02/home-age-stages/RENDER-REPORT.md). Typecheck, riktad lint, diff-/kövalidering och RN Web-build PASS. Oberoende Dog Expert QA PASS och Reviewer PASS 2026-10-14; båda kontrollerade source, render och tidigare datum-/a11y-kontrakt. Lokal UI/source task `HOME-AGE-LIFECYCLE-01` är `done`. Native VoiceOver/TalkBack, Dynamic Type, safe area/gest och live backend är NOT TESTABLE och ändrar inte lokal checkpoint-status.
- R02-4 extern QA PASS är separat och inte bevis för dessa ändringar.
- Ingen SQL har körts mot en databas och ingen extern miljö har ändrats.

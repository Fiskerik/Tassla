# APP-05 – Hälsa B1: viktresa

Plan v4, 2026-10-06. Erik har uttryckligen begärt implementation av APP-05 och fortsatt arbete enligt rotfilen `mvp-population-2026-10-06.md`, med GPT-6 Luna high direkt i befintlig checkout. Planreview återstår före kod. APP-04A-PHONE är användarrapporterat passerad enligt rotfilen; build/version och detaljer saknas, telefonprovet upprepas inte enbart på grund av gammal köstatus.

## Mandat och ändring från v3

Eriks besked i denna session: ”Implementera APP-05 och fortsätt enligt MVP-population-2026-10-06.md. Använd GPT-6 Luna, high. Arbeta direkt i detta repository.” Därefter: ”Nej, jag vill att mina betatestare ska kunna lägga in dummydata initialt. Innan release av app i App Store så rensar jag databasen på det istället”. Detta ger segmentmandat och avsett funktionsändamål, men betyder inte att extern beta är aktiverad eller dataskyddsbesluten är klara.

Compliance-agent `app05_compliance` bedömde CHANGES: lokal CRUD-kod och syntetiska tester kan genomföras nu; verkliga betakonton är en separat aktiveringsgrind. Ingen rättslig grund behövs för rent syntetiska lokala tester. Påhittade vikter kopplade till verkliga konton är däremot personuppgiftsbehandling och rensning före release löser inte betaperiodens ansvar. Före verklig beta kvarstår ansvarig, preliminär rättslig grund, information, gallring/backuper och Supabase DPA/region/underbiträden. Agentens källhämtning nekades med HTTP 403; rättskällorna är inte live-verifierade i denna session och bedömningen är inte juridisk certifiering.

V4 separerar kodimplementation från betaaktivering. Äldre förbud mot kod i planeringscheckpointen ersätts av Eriks nya uttryckliga implementationsbegäran med denna avgränsning. Ingen deployment, verklig data, pilot eller App Store-release görs här. Kön använder APP-04A-UX som maskinellt kodberoende; PHONE:s användarrapporterade resultat dokumenteras här utan att fabricera detaljer eller oberoende QA. Den befintliga PHONE-taskens status lämnas oförändrad tills dess evidenscheckpoint kompletterats.

## Numrerade checkpointdelar inom en komplett B1-slice

1. **Datakontrakt och åtkomst — Implementer.** `src/data/workspace-data.ts`: separata vikttyper, strikt kalenderdatum/kg-validering före SDK, historikläsning och CRUD med återläsning. Beroende: befintligt schema och APP-04A-UX. Acceptans: hund-/typisolering, datum/id-sortering och saved/failed/unknown. QA verifierar installerad Supabase-klient via syntetisk fetch i `tests/health-weight.test.mjs`; ingen verklig RLS hävdas.
2. **Komplett viktresa — Implementer.** `HealthScreen.tsx`, `ProductWorkspace.tsx`, hälsans README: laddar/tomt/fel/historik, skapa/rätta/radera med bekräftelse och synkron dubbeltrycksspärr. Beroende: del 1. Acceptans: hela CRUD-flödet, korrekt okänd status och aktuell hund; preview och vardagslogg behåller befintligt beteende. Verifiering: typkontroll och QA:s data-/UI-kontrakt.
3. **Avgränsad städning och oberoende verifiering — Implementer → QA → Reviewer/Security; koordinator sparar.** Beroende: komplett del 2. `pnpm check`, `pnpm bundle:ios`, `git diff --check`, beteendetester och fryst diff-review. Rapport/köcheckpoint sparas innan nästa slice. Telefon och faktisk databas är separata NOT TESTABLE-resultat, inte lokal PASS-evidens.

## Scope

Bygg endast en komplett ägarregistrerad viktresa: visa historik, lägg till, rätta och radera viktposter. Återanvänd befintligt `dog_events`-schema (`event_type = weight`, `occurred_on`, `weight_kg`) och befintliga skriv-/reconciliationmönster. Ingen ny migration, dependency, notifiering, klinisk tolkning, viktkurva, målvikt eller foderrekommendation ingår.

**Datasyfte:** låta den inloggade hundägaren registrera, visa, rätta och radera hundens vikt för sin egen historiska översikt. Ingen analys, profilering, AI, partner-, kennel- eller veterinärdelning. Minimalt fälturval: `dog_id`, `actor_id`, datum, kg och nödvändiga tekniska ID/tidsstämplar; ingen anteckning, plats, foto, symptom eller produktdata.

**Separat datakontrakt:** inför `HealthWeightRecord`, `HealthWeightOperation` och `HealthWeightChanges` samt vikt-specifika `fetchHealthWeights`, `insertHealthWeight`, `updateHealthWeight` och `deleteHealthWeight`. De använder `occurred_on` + `weight_kg`, stabil sekundärsortering på `id` och får inte återanvända vardagsloggens `LogEventType`, `occurred_at` eller `DogEventOperation`.

**Compliance-grind:** Compliance bedömer plan v2 som CHANGES. Intern implementation med syntetiska data kan planeras, men verklig konto-/hunddata kräver Eriks beslut om personuppgiftsansvarig, preliminär rättslig grund, information vid första registrering, gallring för inaktiva konton/backuper samt Supabase DPA/region/underbiträden. Extern pilot/release är inte godkänd av denna task.

## Ägarskap och write paths

- **Implementer:** `src/features/health/HealthScreen.tsx`, `src/features/health/README.md`, `src/features/home/ProductWorkspace.tsx`, `src/data/workspace-data.ts`, samt berörda befintliga guider.
- **QA:** `tests/health-weight.test.mjs`, `tests/README.md`.
- **Koordinator:** `docs/tasks/dev/app-05.md`, `docs/tasks/dev/rapport.md`, `docs/tasks/dev/queue.json`.

## Acceptance

- Hälsan visar laddar-, tomt-, fel- och historikläge.
- Ägaren kan lägga till vikt i kg med datum; datum får inte ligga i framtiden och vikt följer befintligt databaskontrakt (över 0 och högst 200 kg).
- Ägaren kan rätta och bekräftat radera en egen viktpost.
- Viktmodellen använder ett separat health-event-kontrakt med `occurred_on`/`weight_kg`; den får inte tvingas in i vardagsloggens `LogEventType`/`occurred_at`-modell.
- Vardagsloggen förblir oförändrad och filtrerar fortsatt bort `weight` från sina sex snabbval.
- Historiken stöder flera poster, sorterade på datum fallande och stabilt `id`.
- Datum valideras som verkligt `ÅÅÅÅ-MM-DD` som inte ligger i framtiden; kg valideras till ett positivt tal med högst tre decimaler och högst 200 kg, före SDK-anrop.
- Insert/update/delete har dubbeltrycksspärr, återläsning/reconciliation och separata saved/failed/unknown-lägen; inget offlinekö-system byggs.
- Sparstatus skiljer bekräftad, misslyckad och okänd skrivning; dubbeltryck skapar inte dubbla poster.
- Varje post märks som ägarregistrerad. UI ger inga kliniska råd, mål, trender eller vårdscheman.
- All data är kopplad till aktuell hund och befintlig ägarisolering återanvänds.
- Telefon-/Supabase-runtime och RLS markeras NOT TESTABLE om de inte faktiskt körs; lokala kontraktstester får inte presenteras som verklig databasverifiering.

## Checks och grindar

- Före implementation: APP-04A-PHONE återges som användarrapporterat passerad; lokal implementation/testning använder enbart syntetiska uppgifter. Compliance-grindarna ovan gäller före verkliga betakonton, verklig data och release.
- Architect godkänner exakt plan. Critic granskar användarvärde/scope. Security granskar data-/skrivytan före merge.
- Implementering körs med GPT-6 Luna high. QA och Reviewer använder samma modellnivå för detta segment; Architect/Security behåller sina granskningsmodeller.
- Kör `pnpm check`, `pnpm bundle:ios`, `git diff --check`; SQL/RLS-runtime är separat och NOT TESTABLE utan utvecklingsdatabas.
- Efter implementation: bounded cleanup → QA → Reviewer/Security → checkpoint. Nästa APP-04B2 får inte starta före PASS.

## Preview och fysisk uppföljning

`DevelopmentPreview.tsx` fortsätter visa den ärliga tomma Hälsa-grunden utan props, lagring eller Supabase-anrop. B1 ändrar därför inte `DevelopmentPreview.tsx`; cloud-workspace kopplar explicit HealthScreen till viktkontrakten. En separat `APP-05-PHONE-DB`-task ska senare verifiera viktformens keyboard/decimal/raderingsdialog på telefon samt faktisk Supabase/RLS med två syntetiska konton. Varken fysisk UX eller RLS får räknas som PASS i B1.

## Öppna men avgränsade frågor

- Enheten är kg i denna slice; ingen lokaliserad enhetsväxling byggs.
- Värdena är ägarregistrerade och inte verifierad journal. Ändrad datalagring eller delning kräver ny compliance-/securitygrind.
- Förhandsvisningen fortsätter visa ett ärligt tomt Hälsa-läge utan Supabase-anrop; B1 ändrar endast det inloggade workspace-flödet och `DevelopmentPreview.tsx` behöver inte ändras.

## Compliance-underlag v4, 2026-10-06

Oberoende agent `app05_compliance` gav **APPROVE för lokal full CRUD-kod med syntetiska tester efter v4-planjusteringen**, **BLOCK för verkliga betakonton** tills de befintliga grindarna är klara. GDPR artikel 6.1(b) föreslogs preliminärt för den aktivt begärda viktloggstjänsten, men Erik har inte valt rättslig grund och ingen agent gör det åt honom. Hundvikten är inte i sig artikel 9-hälsodata om en människa; verkligt konto/ägarkoppling gör ändå behandlingen relevant för GDPR. Feedback, diagnostik och analys ingår inte.

Före beta: namnge personuppgiftsansvarig, välj preliminär rättslig grund, ge artikel 13-information, dokumentera radering av beta-/inaktiva konton och backuper samt verifiera Supabase DPA, faktisk region, underbiträden och överföringar. APP-05-PHONE-DB behöver faktiskt verifiera CRUD/RLS med två syntetiska konton och telefonform. Jurist behövs om biträdes-/överföringsvillkoren förblir oklara. Referenser: GDPR artiklar 6/13 och repositoryts officiella källunderlag i `docs/dev/compliance.md`, senast kontrollerat 2026-10-04. Försök till aktuell kontroll av EUR-Lex/IMY/Supabase den 2026-10-06 nekades med HTTP 403; ingen live-verifiering eller juridisk certifiering påstås.

## Critic v4, 2026-10-06

Oberoende `app05_critic`: **PROCEED**, inga betydande invändningar. Full CRUD följer explicit viktkravet i `docs/mvp.md`; korrigering/radering är motiverad för felinmatningar. Enkel datum/kg-inmatning och tydliga statuslägen håller scopet litet. Manuell vikthistoriks återkommande värde utan trendvy är ett produktantagande att pröva i senare godkänd beta, ingen blockerare för den redan beslutade MVP-funktionen.

## Architect v4, 2026-10-06

Oberoende `app05_architect`: **APPROVE — APP-05-B1-WEIGHT plan v4**. Mandat, MVP-spårning, ägarskap, APP-04A-UX-kodberoende och syntetisk lokal CRUD-avgränsning är konsekventa. Viktkontraktet ska hållas separat, datum/kg valideras före SDK, läs-/skrivväg filtrera aktuell hund och `weight`, sorteringen ha deterministiskt id och insert använda stabilt UUID för reconciliation. Alla mutationer kräver synkron in-flight guard. `actor_id` förblir schema/default/RLS-ansvar och exponeras/muteras inte av UI. Fetch-tester styrker SDK-kontrakt, inte RLS. Verklig beta förblir spärrad enligt Compliance och PHONE beskrivs enbart som användarrapporterat passerad.

## Slutgranskning och lokal leverans, 2026-10-06

- QA `app05_qa`: **PASS lokal slice**, `TZ=Europe/Stockholm pnpm check` 64/64 utan skip, iOS-export och `git diff --check` PASS. Installerad SDK med kontrollerad fetch samt faktiska workspace-handlers i isolerad TypeScript-harness; ingen renderad telefonintegration hävdas.
- Reviewer `app05_reviewer`: **PASS**, inga blockerande/major/minor fynd. Importer och metoder verifierades mot installerade Supabase PostgREST 2.117.2 och Expo Crypto (`abortSignal`, `maybeSingle`, `randomUUID`). Granskaren återanvände tydligt angiven QA-evidens, utan att hävda egen omkörning.
- Security `app05_security`: **PASS lokal kod**, inga security-fynd. Fokuserade tester 20/20, egen `pnpm exec tsc --noEmit` och scoped diffcheck PASS. Schema/default/RLS-granskning, hund-/typ-/id-filter, tillåtna payloadfält, preimage-kontroll vid retry, synkrona spärrar och session-/hundnycklad avmontering verifierades statiskt. Verklig beta/release förblir BLOCK.

APP-05-B1 är färdig som lokal kodleverans; faktisk Supabase/RLS och telefonform är fortfarande NOT TESTABLE här. Historiken saknar sidladdning och begränsas av projektets PostgREST-svarsgräns, dokumenterat i hälsans README. Ingen deployment, databasrensning eller GitHub-push utförd. Före nästa app-/cloud-hälsoslice krävs separat exakt plan och granskning; före beta även besluten och APP-05-PHONE-DB ovan.

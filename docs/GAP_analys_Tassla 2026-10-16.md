# Tassla – GAP-analys: MVP v2 mot GitHub

**Datum för granskning:** 2026-10-15\
**Repository:** [Fiskerik/Tassla](https://github.com/Fiskerik/Tassla)\
**Granskad gren:** [`codex/life-periods-2026-10-15`](https://github.com/Fiskerik/Tassla/tree/codex/life-periods-2026-10-15)\
**Granskad commit:** [`c71f5544eb9b8bd86a1aae78def6d86386f13f9a`](https://github.com/Fiskerik/Tassla/commit/c71f5544eb9b8bd86a1aae78def6d86386f13f9a) (15 oktober 2026 kl. 20:35 svensk tid)\
**Jämförelse mot `main`:** Grenen låg två commits före `main` och hade inga commits bakom vid granskning.\
**Mot dokument:** `Tassla-MVP-v2-forslag.md`, som ännu inte godkänts.

> **Viktig avgränsning:** Detta är en källkods- och dokumentgranskning av *angiven commit*, inte ett kört test i enhet, en ansluten Supabase-instans eller en slutlig UX-bedömning. Att funktionalitet finns i kod betyder inte automatiskt att den är driftsatt eller verifierad. Jag har inte ändrat GitHub-repot.

## 1. Sammanfattning för produktägarna

**Bedömning: Begränsad produktkomplettering krävs. Ingen ombyggnad av MVP:n rekommenderas.** Appens sex produktområden, dataåtkomst och de centrala mekanikerna för logg, rutiner, träning, hälsa och PDF finns redan i kod. De nya tio åldersperioderna och individuell livsfasbedömning finns på grenen.

**Största produktgapet:** Livsperioderna visas på Hem/profilen, men det finns ännu ingen sammanhängande godkänd innehålls- och prioriteringslogik som säkerställer att en vuxenhundsägare får rätt nytta. `HomeScreen.tsx` väljer i nuläget det första relevanta icke-träningsobjektet ur en redan filtrerad lista; `select-content.ts` filtrerar på veckointervall och ras, inte på den nya periodmodellen. Det är inte samma sak som relevant innehåll prioriterat efter aktuellt behov.

**Andra viktiga gapet:** Sluten produktloop är tekniskt *delvis* där genom dagens uppgifter, rutiner, träningssteg, kunskapslänkar och sparstatus, men ett fullständigt valp→vuxen-scenario med samma bekräftade progression är inte slutverifierat.

**Tredje gapet:** Nuvarande samtyckesstyrda mätning är avsiktligt dataminimerad och saknar hundålder/ras/kennel i eventpayload. Livsfassegmentering och längre uppföljning kan därför **inte** införas bara genom att lägga till eventfält; särskilt 30-dagars retention måste beaktas.

### Statusbegrepp

- **Kod finns:** Funktion och komponent kan identifieras i repo; faktisk drift kan fortfarande vara obevisad.
- **Delvis:** Viktigt beteende finns men v2-acceptanskriteriet uppfylls inte fullt eller har inte belagts.
- **Gap:** Saknat produktscope, nytt innehåll, ny beslutsregel eller nödvändig verifiering.
- **Overifierat:** Källa finns men faktiskt E2E-/native-/DB-resultat har inte verifierats i denna granskning.

## 2. Kravmatris – MVP v2 mot aktuellt repo

| ID | V2-krav | Bedömning | Belägg och skillnad |
|---|---|---|---|
| **M01** | En hundprofil för alla åldrar, ingen kennelplikt | **Kod finns** | `ProfileScreen.tsx` skapar hund med födelsedatum och frivillig kennelkod; `app-data.ts` och authflöden finns. Bekräfta i vuxenhunds-E2E. |
| **M02** | Permanent hund-ID, bevarad historik | **Kod finns, runtime overifierat** | `docs/Architecture.md`, hunddatakontrakt, `ProductWorkspace.tsx` och olika historikmoduler. Periodmigreringen är additiv, inte destruktiv. |
| **M03** | Tio kronologiska åldersperioder | **Kod finns på gren** | `src/features/onboarding/life-stages.ts` har tio perioder, `dog.ts` använder resolver, `HomeScreen.tsx` visar period och `tests/life-stages.test.mjs` har gränstester. Ingen ny innehållsproduktion ingår. |
| **M04** | Individuell senior-/slutskedesstatus | **Kod finns på gren, migration overifierad** | `EditDogProfileScreen.tsx`, `DogProfileScreen.tsx`, `src/data/app-data.ts`, `supabase/migrations/202610150002_dog_life_context.sql`. Backendmigreringen måste provas före appanvändning. |
| **M05** | Hem prioriterar rätt vuxenhundsinnehåll | **Gap P0** | `HomeScreen.tsx` tar första innehåll som inte är träningsprogram; `src/content/select-content.ts` filtrerar bara ålder-i-veckor/ras. Ingen explicit regel för kontextuell vuxenprioritet visas. |
| **M06** | Samma innehåll i Hem/Kunskap utan dubbelversioner | **Kod finns** | `ProductWorkspace.tsx` hämtar publicerat innehåll; `KnowledgeScreen.tsx` konsumerar innehåll med navigation. Verify att ålders-/rasfilter och innehållsdestination fungerar på native. |
| **M07** | Vuxenrelevant redaktionellt pilotinnehåll | **Delvis – redaktionellt gap P0** | Tre publika generella artiklar har 0–∞-åldersfönster (logg, vikt, hälsohistorik) och tre träningsprogram 8 veckor–∞. De flesta åldersspecifika guider handlar om valpar och det finns ännu inget beskrivet redaktionellt urval för de äldre perioderna. |
| **M08** | Snabb logg och ägarvalda genvägar | **Kod finns** | `LogScreen.tsx`, `quick-log-layout.ts`, `quick-log-layout-storage.ts` och `log-model.ts` innehåller snabbval, historik och ändringar. Kontextuell vuxenprioritering är inte särskilt definierad. |
| **M09** | Träningsprogram och sparad progression | **Kod finns, relevans behöver granskas** | `PublishedTrainingScreen.tsx`, `training_progress`-flöden i `ProductWorkspace.tsx`; tre publicerade program har i innehållspaketet maxålder null. Att de *kan* visas för vuxna är inte en sakgranskad bedömning av vuxenrelevans. |
| **M10** | Dagsrutiner, checklistor och sanningsenlig progress | **Kod finns, E2E overifierat** | `HomeScreen.tsx`, `DailyActivityManagerSheet.tsx`, `daily-activity-model.ts`, `daily-activity-data.ts`. Källor hålls åtskilda och sparstatus har separata lägen. Verifiera samma resultat efter navigation, återstart och periodbyte. |
| **M11** | Hälsa genom hundens liv | **Kod finns, runtime overifierat** | `HealthScreen.tsx`, `HealthHistoryScreen.tsx`, `PlannedHealthScreen.tsx`, `WeightScreen.tsx`, `workspace-data.ts`. Godkända ägarregistrerade datum/händelser, inga medicinska rekommendationer. |
| **M12** | Tassla-pass för vuxen hund | **Kod finns, native overifierat** | `PassportScreen.tsx`, `passport-model.ts`, `passport-export.ts`: profil/senaste vikt/hälsohändelser; preview och lokal PDF-delningsväg. Verklig iPhone-delning kräver prov. |
| **M13** | Frivilliga lokala påminnelser | **Kod finns, native overifierat** | `notification-service.ts`, `NotificationSettingsScreen.tsx`, `notification-model.ts`. Native permission, faktisk schemaläggning och tryckdestination kan inte verifieras genom läsning. |
| **M14** | Uppfödarkod/QR och fri onboarding | **Delvis, pilot overifierad** | `referral-model.ts`, `referral-secure-storage.ts`, `AppFlow.tsx` har custom deep links, kodhantering och manuell fallback. Verkliga kennel-QR, installation utan app och pilotutsändning är separat gate. |
| **M15** | Produktmätning och livsfasjämförelser | **Delvis – mätgap P1** | `analytics-model.ts`, `analytics-service.ts` och `202610080001_beta_metrics.sql` har strikt eventallowlist och 30 dagars retention. Inget livsfasfält finns; samtyckes-, backend- och rapportruntime är inte verifierade här. |
| **M16** | Sex sammanhängande områden och bibehållen UI-standard | **Kod finns; helhets-UX overifierad** | `ProductWorkspace.tsx` har Hem, Logg, Träning, Kunskap, Mer samt Hälsa/Pass under Mer; `docs/design-rules.md`. Skärmnivå-QA ger inte automatiskt ett godkänt vuxen-E2E. |

## 3. Prioriterade konkreta gap

### P0 – Måste lösas för att kunna godkänna v2:s nya produktlöfte

#### GAP-01. Relevant vuxenhunds-Hem – urvals- och prioriteringsregler

- **Fakta:** `HomeScreen.tsx` använder `content.find((item) => item.contentType !== 'training_program')`; `select-content.ts` filtrerar på publicering/ålder i veckor/ras. Den nya periodresolvern används för etikett och generell status men driver inte innehållsprioriteringen i denna kodväg.
- **Konsekvens:** En femårig hund kan få generiska funktionsguider i stället för relevant hjälp för sin livsperiod. Tillgängligt innehåll är inte nödvändigtvis mest relevant.
- **Minsta åtgärd:** Product/Head of Content definierar en enkel godkänd prioriteringsregel bland redan publicerade, tillämpliga objekt (t.ex. explicit redaktionell prioritet + livsfas/tillämpning + relevant träningssteg/fallback). Architect avgör om befintligt schema och versioner räcker. Återanvänd befintlig urvals- och Hem-komposition; bygg ingen rekommendationsmotor.
- **Acceptans:** Med syntetiska profiler 11 veckor och 5 år väljer Hem var sitt sakligt relevant innehåll eller ärligt tomläge; urvalet är deterministiskt, testat och öppnar rätt destination. Byte av hund/session kan inte visa fel hunds innehåll.
- **Ägare:** Head of Product + Head of Content → Architect/Implementer → QA.
- **Omfattning:** S–M, beroende på valt metadata-kontrakt.

#### GAP-02. Redaktionellt grundpaket efter valptiden

- **Fakta:** `docs/content/mvp-content-bundle-v1.json` har generella publicerade guider för logg/vikt/hälsohistorik med min 0/max null, och tre träningsprogram för 8 veckor till obegränsad ålder. Övriga åldersspecifika artiklar kretsar huvudsakligen kring valpens första tid. `docs/tasks/LIFE-PERIODS-2026-10-15.md` säger uttryckligen att senare perioder saknar nytt granskat material.
- **Konsekvens:** Vuxenhunds-Hem riskerar att upplevas som en tom funktionskatalog och inte en hundägarupplevelse.
- **Minsta åtgärd:** Innehållsansvarig granskar *först* vilka befintliga guider/program som faktiskt är lämpliga för vuxna hundar; komplettera därefter ett litet kvalitetsgranskat paket (föreslaget 3 användbara objekt). Varje objekt har id/version, faktagranskning, tillämpliga perioder och avsedd kontext. Inte tio nya innehållskategorier.
- **Acceptans:** En 5-årig hund erbjuds minst ett relevant handlingsorienterat innehåll; 11-veckors valp får bibehållet välriktat valpinnehåll. Ingen ändring av äldre publicerad version utan versionsbeslut.
- **Ägare:** Head of Content + Dog Expert + mänsklig sakgranskare + Product.
- **Omfattning:** S–M redaktionellt; låg kodomfattning om nuvarande metadata räcker.

#### GAP-03. Avgränsat vuxenhunds-E2E och kontinuitet mellan perioder

- **Fakta:** Enskilda faser har tester (`life-stages`, `home-today`, `daily-activity`, `training`, `passport`, m.fl.) men detta är inte belägg för en sammanhängande verifierad resa där en vuxen hund startar utan tidigare data och senare passerar en periodgräns.
- **Minsta åtgärd:** Inför acceptansscenarier B och C från MVP v2; prova på en riktig telefon och utvecklingsbackend utan att återimplementera befintliga flöden. Verifiera inloggning, profil, Hem, Kunskap, rutin/logg/träning, hälsa, PDF samt återstart.
- **Acceptans:** 5-årig hund får relevant värde och ett äkta sparat resultat; bevarad historik/rutin/träningsprogression före och efter periodbyte.
- **Ägare:** QA + Product (med användartestare); Architect endast för verkliga kontraktsfel.
- **Omfattning:** S för fixtures och testplan; varierar för påträffade buggar.

#### GAP-04. Senior- och periodetiketter som inte motsäger varandra

- **Fakta:** `life-stages.ts` kan beskriva en 13-årig hunds kronologiska period som ”Den äldre hunden” samtidigt som bred livsfas utan ägarval är ”Vuxen”. Perioden ”Seniorhunden” för 10–13 år kan samtidigt ha bred fas `VUXEN`.
- **Konsekvens:** Begriplighetsrisk om dessa två syns samtidigt i profilen. Det är inte automatiskt ett algoritmfel: seniorstatus är uttryckligen individuell.
- **Minsta åtgärd:** Product/Dog Expert bestämmer separata och begripliga etiketter: exempelvis ”Åldersperiod (kronologiskt)” kontra ”Livsfas (ditt val)”, eller mindre kategoriska kronologiska periodnamn. Ändra inte kliniska trösklar i smyg.
- **Acceptans:** En äldre hund utan vald seniorstatus ser inte två skenbart oförenliga påståenden. Ändring av ägarval fungerar och historiken består.
- **Ägare:** Product + Dog Expert; liten UX-/copy-slice.
- **Omfattning:** XS–S.

### P1 – Behövs inför seriöst pilottest och produktbeslut

#### GAP-05. Värdeflöde och verklig progression mellan existerande ytor

- **Fakta:** `HomeScreen.tsx` har dagsrutiner, uppgiftsräknare och träningsgenvägar; `DailyActivityManagerSheet` och `PublishedTrainingScreen` hanterar egna sparade handlingar. Det finns ännu ingen visad samlad manuell/telefonverifiering av loopen ”relevant hjälp → handling → bekräftad återkoppling → nästa steg”.
- **Minsta åtgärd:** Återanvänd befintliga komponenter och gör en end-to-end-QA med minst två verkliga flöden: (a) träningssteg från Hem → träning → tillbaka, (b) dagsrutin/logg → bekräftelse → Hem. Lägg endast till saknad navigation/status där testet fallerar.
- **Acceptans:** Samma bekräftade steg visas rätt efter skärmbyte/återkomst, ingen artikelöppning räknas som träning, okänt save blir inte klart.
- **Ägare:** Product + QA; små riktade kodändringar bara vid faktiska fel.
- **Omfattning:** S före eventuella felrättningar.

#### GAP-06. Mätspecifikation för livsfas och meningsfull återkomst

- **Fakta:** `src/analytics/analytics-model.ts` har endast `dog_created`, `home_viewed`, `first_log`, `training_started`, `training_completed`, `meaningful_return`; klienten skickar enbart eventtyp till RPC. I granskad `ProductWorkspace.tsx` är explicit spårning synlig för `home_viewed`, `first_log`/`meaningful_return` från logg samt `training_completed`; ett komplett kontrakt för aktiveringssekvens och kvalitativ vuxensegmentering är inte belagt av dessa anrop. Databasen gallrar individuella events efter 30 dagar.
- **Konsekvens:** En faktisk jämförelse valp/vuxen samt D90 går inte att hävda med nuvarande datamodell. Källkod för instrumentering är inte bevis på fungerande rapportkörning.
- **Minsta åtgärd:** Definiera vad pilotteamet ska kunna utvärdera. Använd kvalitativa manuella vuxentestresultat från början. Inför inte åldersfält i events utan separat Compliance/Security-beslut; bedöm om säkra minimerade kohortaggregat behövs. Kör sedan verkliga rapport-/samtyckes-/retentionstest i dev Supabase.
- **Acceptans:** Rapporten visar endast vad signalerna faktiskt stödjer. D1/D7/D30 bygger på definierade mogna fönster; ingen D90-påstådd observation utan beslutad rättslig/teknisk retention.
- **Ägare:** Product + Analytics + Compliance/Security.
- **Omfattning:** S för definitionsarbete; M om datakontrakt/rapport ska förändras.

#### GAP-07. Verklig distribution och beta-konfiguration

- **Fakta:** Kod för `tassla://join?code=...` och manuell kennelkoppling finns. `src/onboarding-referral/README.md` säger att verklig installationslänk/pilotkod, native deep linking och SQL behöver kontrolleras separat. P08-planen beskriver QR-underlag och oninstallerad-app-fallback.
- **Minsta åtgärd:** Fastställ verkliga pilotkoder och QR-underlag, genomför fysisk testning för installerad/oinstallerad iPhone och verifiera attribution i dev Supabase. Håll kennelns insyn till noll.
- **Acceptans:** Minst två pilotkoder kopplas korrekt till olika syntetiska hundar; utan kod fungerar vanlig onboarding, utan överrapportering av QR-skanningsdata.
- **Ägare:** Growth/Distribution + QA + Security.
- **Omfattning:** S–M beroende på installflöde.

#### GAP-08. Backend-, migrations-, native- och releaseverifiering

- **Fakta:** `docs/releases/MVP-BETA.md` och `docs/tasks/dev/mvp-beta-delivery.md` skiljer lokal kodgranskning från verifierad DB/RLS/native/PDF/notis/utdelad pilot. Ny `202610150002_dog_life_context.sql` måste exekveras innan fälten används i ansluten app.
- **Minsta åtgärd:** Verifiera tillämpliga migrationer, RLS/ägarisolering, fysisk notis och PDF-delning, signerad build/TestFlight och raderingskontrakt, i rätt ordning. Ange faktisk PASS/FAIL/NOT TESTED per kontroll.
- **Acceptans:** Samtliga kritiska pilotgrindar har verklig evidens på just aktuell commit/build och aktuell devmiljö; inga historiska lokala PASS återanvänds som bevis på driftsättning.
- **Ägare:** Architect, QA, Security/Compliance, Erik för beslut om distribution.
- **Omfattning:** M samordning och integration; ej automatisk krav på ny produktkod.

### P2 – Förbättringar som kan vänta tills pilotdata visar behovet

#### GAP-09. Konfigurerbar livsfasprioritering av loggsnabbval

`LogScreen.tsx` har redan sparbar snabbknappslayout. Verifiera med vuxenhundstest om defaultuppsättningen verkligen behöver skilja sig från valpens. Ändra inte ägarens personliga val eller loggmodellen utan stöd. **Status:** Hypotes; ej tvingande MVP-blockerare.

#### GAP-10. Mer utvecklad vuxenhunds-/seniorinnehållsstrategi

Innehåll för alla tio perioder och individanpassade seniorbehov kan byggas när pilotdata och tillräckligt granskat innehåll finns. MVP kräver *relevant minimum*, inte full 1177-liknande hundencyklopedi. **Status:** Roadmap efter pilot.

#### GAP-11. D90/90-dagars kohortmodell

Eventuell långsiktig kohortmätning kräver separat dataskydds- och lagringsbeslut eftersom produkten nu har 30 dagars retention för events. **Status:** Ej MVP-leveranskrav.

## 4. Föreslagen minimal leveransordning

**Innan någon ny kod:** Produktägarna godkänner eller ändrar MVP v2:s fem beslut och fastställer kvalitetsribban för vuxenhundspiloten.

| Slice | Leverans | Beroenden | Stopp/grind |
|---|---|---|---|
| **V2-01 Redaktionellt relevanskontrakt** | Gör en tillämpningsmatris för befintligt innehåll, vuxenrelevans, prioritering och period-/statusetiketter (GAP-01/02/04). | Product, Head of Content, Dog Expert. | Inga tysta ändringar av publicerad text/version. |
| **V2-02 Minsta innehållskomplettering** | Granska/återanvänd befintligt + endast nödvändiga godkända innehållsobjekt. | V2-01. | Faktagranskning/versionering/publicering verifierad. |
| **V2-03 Hem och urval** | Återanvänd `select-content`/Hem och inför endast beslutad prioritering. | V2-01/02. | 11 veckor/5 år testar deterministisk relevant output. |
| **V2-04 Progressions- och livsfase2e** | Riktade scenario A–F, med periodbyte, träningssteg, dagsrutin och felstatus. | V2-03 + befintliga flöden. | QA på verklig data, inga regressionsfel. |
| **V2-05 Pilotinstrumentering och distribution** | Verifiera consent/report i DB och två QR-fall; vuxen kvalitativ kohort utan mer persondata än godkänt. | Befintliga P08/P09 + V2-04. | Compliance/Security + faktisk telefon/dev-SQL. |
| **V2-06 Samlad betagate** | End-to-end native PDF/notiser, auth/RLS/radering, fysisk build, pilotbeslut. | Alla tidigare. | Product owner sign-off; ingen automatisk publicering. |

**Arbeta endast med ett aktivt vertikalt slice åt gången** när moduler har överlappande skrivområden, särskilt `ProductWorkspace.tsx`, innehållsurval och migrationer. Ändringar bör ske i ny gren eller efter medveten sammanfogning med pågående `life-periods`-grenen.

## 5. Förslag på fördelning i befintligt agentteam

| Roll | Ansvar |
|---|---|
| **Chief of Staff** | Gap → beslut → prioriterad kö, förhindrar dubbelarbete, håller godkännanden och blockerare synliga. |
| **Head of Product** | Fastställer användarresor, relevanskriterier, pilotmål och exakt minimal funktionell scope. |
| **Head of Content** | Innehållsmatris, sak-/målgruppsanpassning, nya innehållsobjekt och publiceringsunderlag; får inte ensidigt ändra produktarkitektur. |
| **Dog Expert + mänsklig granskare** | Kontrollerar råd, tillämpning på vuxna hundar och period-/seniorformuleringar. |
| **Architect + Implementer** | Minsta avgränsade lösning med befintlig modell; identifierar först var produkten redan stödjer kravet. |
| **QA/Reviewer** | Verifierar ett helt flöde, test/evidens och regression. Gult/overifierat får inte etiketteras grönt. |
| **Compliance/Security** | Dataändamål, samtycke, ny segmentering, migrations- och RLS-granskning, PDF/notify/distribution vid behov. |

## 6. Rekommenderat beslut

**Godkänn målbilden i MVP v2, men godkänn inte hela denna GAP-lista som implicit utvecklingsmandat.** Starta med **V2-01: redaktionellt relevanskontrakt och två riktiga personas (11 veckor och 5 år)**. Ett bra vuxen-Hem kan kanske nås genom ett litet innehållspaket och en avgränsad prioriteringsregel – inte genom nya skärmar, omfattande ny data eller ett AI-system.

**Säkra samtidigt:** Livsperiodsgrenen är två commits framför `main` vid granskningen, så kommande implementation måste explicit välja rätt bas och undvika parallella skrivningar mot samma filer.

## 7. Direktkällor (granskad gren)

- [MVP v1 – styrande scope](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/mvp.md)
- [Vision](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/vision.md)
- [Livsperiodsplanen](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/tasks/LIFE-PERIODS-2026-10-15.md)
- [Periodresolver – kod](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/src/features/onboarding/life-stages.ts)
- [Hem – render och urval](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/src/features/home/HomeScreen.tsx)
- [Publicerat innehållsurval](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/src/content/select-content.ts)
- [Innehållspaket v1](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/content/mvp-content-bundle-v1.json)
- [Träningsprogram – produktvy](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/src/features/training/PublishedTrainingScreen.tsx)
- [Dagsaktiviteter – kod](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/src/features/home/daily-activity-model.ts)
- [Produktmätning – kod](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/src/analytics/analytics-model.ts)
- [Samtycke/retention – SQL](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/supabase/migrations/202610080001_beta_metrics.sql)
- [Distributionsplan P08](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/tasks/dev/kennel-onboarding.md)
- [Beta-plan](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/tasks/dev/mvp-beta-delivery.md)
- [Beta-release-log](https://github.com/Fiskerik/Tassla/blob/codex/life-periods-2026-10-15/docs/releases/MVP-BETA.md)

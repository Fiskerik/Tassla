# Tassla — konkret plan för en levande och användbar app

Datum: **2026-10-24**. Beställning: efter borttagna tillfälliga Test/Preview-rutor, sammanfatta det som bör göras för att appen ska kännas levande och fungera naturligt för användaren.

**Utgångspunkt:** GAP-paketen UI01–04 är lokalt levererade i `69251d2`/`fe1c834`; den nya kopystädningen ligger på `2026-10-24-ui-copy-cleanup`. Denna plan prioriterar nästa användarresultat. [G01–G19-matrisen](../tasks/UI-UX-REV02-ACTIONPLAN-2026-10-23.md#12-slutavstämning-g01g19--2026-10-24) behåller fyndhistorik och verifieringsgränser. Äldre förslag före 16 oktober är inte bygginstruktioner. Målbilden är fortsatt `vision_rev02.jpg`.

## Bedömning efter städningen

Appen har nu ett tydligare visuellt grundspråk: varma ytor, bildkort, kompakta formulär, gemensamma ikoner och fungerande huvudnavigation. Det finns redan rasväljare, checklistikoner, Fortsätt i Träning, säkert återställ, loggens Ångra och kalender, exakta hälsoplaner och Insikter-rutter. Dessa ska återanvändas och provas genom hela resor.

Det största nästa lyftet kommer av att **innehåll, nästa handling och sparat resultat hänger ihop mellan sidorna**. Fler informationskort eller nya animationer löser inte det.

| Observation i aktuell kod/render | Konsekvens för användaren | Nästa förbättring |
|---|---|---|
| Hem väljer första tillgängliga relevanta artikel med `content.find(...)`; Kunskap sorterar titlar alfabetiskt och visar de första tre. | Stor bild och placering förklarar inte alltid varför just detta är relevant. | Bestäm ett begripligt urval inom befintlig hund-/ålders-/raskontext. Använd inte ”rekommenderat” utan grund. |
| Publik FAQ/faschecklista har fortfarande tom/review-gräns i koden. | En snygg ingång kan följas av en tunn eller tom upplevelse. | Koppla granskad, versionsmärkt publik katalog och bevara egna punkter/progress. |
| Träning har exakta steg och verklig progress; Hem och Checklistor visar samma aktiviteter. | Värdet uppstår först när genomförande och nästa steg märks i alla berörda vyer. | Prova och förfina hela kedjan från start till nästa användbara steg. |
| Insikter har diagram och perioder men registreringar är inte samma sak som sömnintervall eller råd. | Användaren behöver förstå vad siffran betyder och vart den leder. | Gör period, underlag och nästa handling begripliga utan medicinska tolkningar. |
| Hälsa, påminnelser och Tassla-pass finns som separata fungerande delar. | Användaren måste själv förstå hur plan, utförd händelse och delat dokument hänger ihop. | Slut en konkret planera→registrera→samla/dela-resa med rätt objekt/retur. |
| Utveckling har ålder/fas men saknar verifierat milstolpsunderlag. | Den lovar mer innehåll än den ännu kan leverera. | Ge sidan granskade fasguider och milstolpar som inte påstår individuellt uppnådda färdigheter. |

Skärmbilderna använder syntetiska data och produktionskomponenter. Tomma fixtures bevisar inte att en backend saknas. Inventera verklig publik innehållstäckning och de specifika läsningarna innan databasarbetets omfattning bestäms.

## Prioriterad arbetsordning

| Ordning | Arbetspaket | Det användaren ska känna | Förstakrav / beroende |
|---|---|---|---|
| **1 / P1** | **En bra första dag och en användbar Hemvy** | ”Jag förstår vad jag kan göra nu och ser direkt vad jag har gjort.” | Befintlig rutin-/träningsresa och dagens checklista återanvänds; D1 är inget startkrav här. |
| **2 / P1** | **Kunskap som hjälper mig att göra något** | ”Jag hittar ett svar som passar oss och kan använda det.” | D3: publik katalog och granskade versioner. D1 gäller egna punkters ikoner i faschecklistorna. |
| **3 / P1** | **Träning som leder vidare** | ”Jag vet hur vi börjar, vad som är klart och vad nästa steg är.” | Program/version och bekräftad progress; paket 2:s relevanta innehåll. |
| **4 / P1** | **Logg och Insikter som går att förstå tillsammans** | ”Det jag registrerar blir begriplig historik.” | D2: specifik Insikter-läsning verifieras. Sömnintervall har separat D5. |
| **5 / P2** | **Planera, kom ihåg och samla hundens uppgifter** | ”Jag hittar samma plan och rätt uppgifter hela vägen.” | Befintlig hälso-/notis-/PDF-resa och dess bekräftade data. |
| **6 / P2** | **Utveckling med verklig relevans** | ”Jag förstår fasen och hittar läsning som passar oss.” | D5: granskade milstolps-/fasunderlag; paket 2:s katalog. |
| **7 / Genomgående** | **Samma respons och flyt i hela appen** | ”Appen reagerar tydligt och jag tappar aldrig bort mig.” | Görs i varje paket och avslutas med samlad telefonresa. |

Starta med **paket 1**. Gör inventeringen för paket 2 tidigt så att brist på granskade texter inte upptäcks sist. Innehållsgranskning kan pågå medan en oberoende UI-resa färdigställs. Börja inte flera överlappande ombyggnader samtidigt.

## 1. En bra första dag och en användbar Hemvy

**Resa:** skapa/välj hund → Hem utan dagsuppgifter → skapa en rutin med två punkter → tillbaka → bocka en punkt → öppna dagens checklista → återvänd nästa dag.

### Gör

- Ge den nya användaren en tydlig ingång till den befintliga rutinskaparen eller ett tillgängligt träningssteg. Undvik en obligatorisk introduktionskarusell.
- Efter bekräftat sparande ska den nya aktiviteten synas på Hem utan manuell uppdatering. Checklistor och Framsteg ska visa samma bekräftade mängd.
- Gör helt klar dag till ett lugnt, användbart läge: visa vad som är klart och en väg till befintlig träning eller läsning. Skapa inte extra mål eller poäng.
- Bestäm ett enkelt urval för Just nu inom redan valt hund-/ålders-/rasinnehåll. Inventera vilka redaktionella fält som finns; saknad rangordning blir ett konkret delbeslut, ingen ny dold rekommendationsmodell.
- Visa nästa relevanta handling även när födelsedatum, innehåll eller dagsuppgifter saknas. Ett läsfel får fortsatt skiljas från en tom dag.

**Klart när:** en ny användare kan skapa och genomföra sin första aktivitet i den befintliga resan; egna bekräftade ändringar syns direkt; rätt hund/dag består vid navigation; återbesök och nästa dag fungerar; inga gamla bockar visas som dagens efter ofullständig läsning.

**Kodbas:** `HomeScreen`, `ProductWorkspace`, `DailyActivityManagerSheet`, befintligt dagsurval. A03 och panel 3 byggs inte om.

## 2. Kunskap som hjälper mig att göra något

**Resa:** aktuell guide på Hem → full guide och källor → relaterad faschecklista/FAQ → egen punkt med ikon → återöppna samma lista.

### Gör

- Inventera faktisk publik täckning för appens prioriterade faser. Lista exakt vilka guider, FAQ-svar, faslistor och träningsprogram som saknas eller bara finns i reviewläge.
- Koppla en riktig versionsmärkt publik källa för FAQ/faslistor. Publiceringsarbete innebär även läs-/ID-/progresskontrakt; att slå på reviewflaggan är ingen leverans.
- Återanvänd befintliga texter där de har rätt granskning och källor. Granska luckor med innehållsansvarig. Inga påhittade ”5 min”, ämnen eller hälsoråd för att fylla ett kort.
- Låt bildkortens urval och rubriker bära sidan. Behåll full läsning separat. Alfabetisk ordning kan vara bra för Alla guider; den ska inte framställas som en individuell rekommendation.
- Gör fortsättningen från läst innehåll begriplig genom befintlig relevant destination. En eventuell ny guide→checklista-länk måste knytas till verkligt innehåll/ID och specificeras i delplanen.
- Förfina sök-/tomlägen så att användaren kan söka om, se befintligt innehåll eller gå tillbaka utan återvändsgränd. Lägg inte till dekorativa ämnesfilter utan fungerande taxonomi.

**Klart när:** prioriterade faser har dokumenterad innehållstäckning; publikt läge kan öppna katalogens faktiska versioner; fulltext/källor går att läsa; egna punkter/ikoner och tidigare markeringar består vid publicerings-/versionsövergång; tomma sökresultat kan återhämtas.

**Kodbas:** `KnowledgeScreen`, `FAQScreen`, `PuppyChecklistScreen`, aktuella innehållsadaptrar. **D3** är leveransberoendet; **D1** verifierar nya egna punkters ikonpersistens.

**Täckningsinventering, read-only 2026-10-24:** Bundle v1 markerar sex artikelversioner och tre träningsprogram som `published`; Knowledge-guidefiltret kan visa artiklarna om motsvarande DB-versioner är publicerade. Live-status är okänd här. Den sjunde icke-programversionen är `environment-checklist` (`content_type=checklist`), inte en faschecklista och filtreras bort från guidevyn. FAQ saknar publicerad katalog; fyra review-exempel är flaggade. Faschecklistor saknar publik version: sex `review-v1`-mallar/18 punkter ligger bakom review-läget. Sex separata `draft`-artiklar finns som möjliga återanvändningskällor men är inte i bundle/importen. Exakta källor, UI-filter, ID-/progressrisk och live-Supabase-osäkerhet finns i [redaktionella innehållsstatusen](../content/README.md#aktuell-täckning-för-kunskap-och-träning--2026-10-24). D3-plan v5 och schema-/mappingförslaget godkändes av Architect/Security respektive Erik 2026-10-24. Implementationstask v5 har Architect APPROVE, Security PASS och Critic PROCEED och genomförs nu på samma branch. Ingen publicering eller live migration antas.

### KNOWLEDGE-D3-CATALOG-PLAN-01 — D3-kontrakt före implementation, v5

**Status:** Arkitekturriktning v1 fick Architect **APPROVE** och Security **PASS** för dokumentationscheckpointen. Schemaförslag v2 fick **CHANGES** från båda; v3 och v4 fick Architect **CHANGES** och Security **PASS**. v5 fick Architect **APPROVE**, Security **PASS**, oberoende QA **PASS** och Reviewer **PASS** den 2026-10-24. Erik godkände schema-/mappingförslaget 2026-10-24; detta stängde beslutsgrinden, inte implementationens Architect/Security-grind. **Bas:** `main@0b0f99f8660a392971b5caab71c19334f771f495` (hämtad på nytt; förfader) och arbetsbranch `codex/agent-workflow-stabilization@6fec63ee71f0e1c798fe65679152504a246b34e0`. **Skrivägare:** Codex-koordinator. **Risk:** H för katalog-/migrationsimplementationen; denna avslutade plancheckpoint ändrade bara dokumentation. **Mandat:** paket 2/D3 i denna användarplan och MASTER-LOG; ingen ny innehålls-, dataanvändnings- eller publiceringsbeställning.

**Mål:** välja och granska minsta tekniska kontrakt som kan ge FAQ och faschecklistor en riktig versionsmärkt publik källa, samtidigt som review-innehåll förblir avskilt och hundens befintliga progress, egenpunkter, ikoner och kontext inte tappas eller tyst omtolkas.

**Verifierade utgångspunkter:** `content_items.content_type` accepterar `article`, `guide`, `checklist` och `training_program`; `content_versions` har versions-ID, status, åldersfönster, källor och granskningsreferens men saknar FAQ-kontext och strukturerade checklistepunkter. FAQ är fyra lokala review-fixtures. Faslistorna är sex statiska `review-v1`-mallar i appen och seedade katalograder i databasen; katalogen saknar publiceringsstatus/version. Progress använder `(dog_id, template_id, item_key)`, egna punkter använder `template_id` och FK-skydd, och fasvalet lagras separat. Publik UI läser/visar inte de review-gatade katalogerna.

**Arkitekturbeslut efter Architect review — 2026-10-24, APPROVE för denna dokumentationsplan:** återanvänd `content_items`/`content_versions` för FAQ-identitet och immutable fråge-/svarsversioner med typat sammanhang och befintliga käll-, status- och granskningsfält; faslistor får en liten versionskopplad tabell med ordnade punkter och stabila nycklar, inte ett generellt checklist-ramverk. Den exakta typ-/kolumn-/FK-modellen är ännu inte fastställd. FAQ-kontexten motsvarar befintliga värden `before_homecoming`, `first_days`, `by_age`. Den befintliga `checklist`-posten `environment-checklist` får inte återanvändas som faslista.

Bevara `review-v1`-mall-ID:n och punktnycklar, hundprogress, egna punkter, nullable ikoner och valt sammanhang. Koppla bara samman poster där dokumenterad mapping visar samma ID och betydelse; ingen completion härleds för ändrade punkter. Omatchade och historiska rader ligger kvar. Före migrering krävs en mappingtabell och före/efter-paritetskontroll. Den konkreta planen ska utreda om stabila befintliga progress-ID:n kan behållas utan dataflytt; annars får ingen automatisk överföring ske utan verifierad radvis mapping och ägarbeslut.

**Security review — 2026-10-24, PASS för plancheckpointen:** den nya checklistepunkttabellen ska ha RLS och endast ge authenticated läsåtkomst när föräldraversionen är `published`; klientroller får inte skriva katalogen, som endast ändras via betrodd administrativ väg. FAQ använder samma publicerade versionsgrind, och reviewflaggan får aldrig exponera kataloginnehåll. Import av draft och publicering hålls separata och transaktionella med paritetskontroller. Review-v1-katalog och hunddata bevaras; migration granskar progress, egna punkter, ikoner och sammanhang med verifierad identitets-/betydelsematchning. Withdrawal döljer katalogposten men raderar eller skriver inte om progress eller historiska ID:n. Återställning får inte mappa om progress eller återpublicera indraget innehåll tyst. Granskningen gäller dokumentation endast; den godkänner inte schemaändringar, migration, import, publicering eller appändringar.

**Konkret schema-/mappningsförslag för Architect/Security och Erik (granskat i v5; Erik godkände 2026-10-24):**

- Utöka `content_items.content_type` med `faq`. Lägg en nullable `context` på `content_versions` med `CHECK (context IS NULL OR context IN ('before_homecoming','first_days','by_age'))`. En namngiven `BEFORE INSERT OR UPDATE`-trigger låser parent item och kräver context för FAQ; den förbjuder context på orelaterade typer och kräver fasens context när versionen är länkad till en checklistmall. Stabil FAQ-identitet är `content_items.slug`; versionens `title` är frågan, `body` är svaret, och befintliga `sources`, `status`, `reviewed_at`, `review_reference` och `published_at` används. De lokala `review-v1:faq:*` fixture-ID:na har ingen föreslagen persistent mapping och utgör inte godkända/persistenta FAQ-poster.
- Behåll faslistor som `content_type='checklist'`; det befintliga `environment-checklist` återanvänds inte. Migreringen fyller `context` för de sex befintliga `checklist_templates`-raderna och sätter därefter `NOT NULL CHECK (context IN ('before_homecoming','first_days','by_age'))`; lägg även en nullable, unik FK `content_item_id`. Stabil template-ID mappar en gång till en ny separat content item. Mapping och context initieras atomärt från NULL och blir sedan write-once: de kan aldrig ändras eller rensas. Versionens `title/body/min_age_weeks/max_age_weeks` innehåller fasnamn, intro och åldersfönster. En ny `content_version_checklist_items` har `content_version_id`, `template_id`, `item_key`, `position`, `title`; unikhet gäller `(content_version_id,item_key)` och `(content_version_id,position)`. Composite FK skyddar att `(template_id,item_key)` finns i den befintliga stabila `checklist_template_items`-nyckelkatalogen; trigger validerar `content_type='checklist'`, att versionens content item matchar mallens `content_item_id`, och att versionens context matchar mallens context.
- V1-publiceringen mappar exakt dessa befintliga ID:n, sammanhang, åldersfönster och punkter: `review-v1:before-homecoming` → `phase-before-homecoming`, `before_homecoming`, 0–7 veckor, `safe-space/supplies/vet-contact`; `review-v1:first-days` → `phase-first-days`, `first_days`, 0–null, `quiet-start/routine/rest`; `review-v1:8-12-weeks` → `phase-8-12-weeks`, `by_age`, 8–12, `name/handling/alone`; `review-v1:3-6-months` → `phase-3-6-months`, `by_age`, 13–25, `recall/settle/walks`; `review-v1:6-12-months` → `phase-6-12-months`, `by_age`, 26–51, `review/focus/breaks`; `review-v1:over-1-year` → `phase-over-1-year`, `by_age`, 52–null, `enjoy/adapt/play`. Contexten `before_homecoming`, `first_days`, `by_age` är samma enum och betydelse som i `dog_checklist_preferences`; befintliga preferensrader ändras inte. Dessa är de befintliga 18 keys med samma betydelse; bundle/seed-paritetstest kräver exakt match. FAQ-ID:n är stabila slugs och lokala FAQ-fixtures mappas inte implicit.
- `dog_checklist_progress`, `dog_checklist_custom_items`, ikonkolumnen och `dog_checklist_preferences` får inga användarradsändringar eller ID-byten i v1. Template- och katalograder är administrativa metadata och är de enda nya seed/link-skrivningarna; inga progress-, egenpunkts-, ikon- eller preferensrader migreras. Mappingen verifieras före import och efteråt; varje avvikelse stoppar importen. Ingen completion antas. Nya eller semantiskt ändrade punkter ligger utanför denna publicering och kräver ny stabil nyckel samt separat gammal-klient-/progresskompatibilitetsbeslut innan införande.
- RLS/grants för `checklist_templates` exponerar endast en koppling som har en `published` version; `content_version_checklist_items` får authenticated `SELECT` när dess parent-version är `published`. Inga klientroller får INSERT/UPDATE/DELETE på katalog- eller mappingtabellerna. FAQ går genom befintlig published-only-läsgrind. Importskriftvägen är betrodd administrativ SQL, skild från separat transaktionell publicering; publicering kontrollerar reviewmetadata, innehållsparitet och högst en aktiv publicerad version per item. Withdrawal tar bort aktiv publicerad status utan att radera historik eller hunddata.
- Schema-/seed-delen är en forward-only migration och körbart SQL-test i disposable PostgreSQL; inga användarrader skrivs i första släppet. Import och publish-script har separata paritetskontroller. Före/efter-prover verifierar att hundrader och de 18 ID-/nyckelmappningarna är oförändrade; RLS-prover täcker `draft`, `reviewed`, `published`, `withdrawn`, authenticated/anon/service-role och ägarscope. Live Supabase verifieras separat efter framtida godkännande.
- En `BEFORE UPDATE`-guard på `content_versions` avvisar ändring av `content_id` eller `version` när versionen har checklist-child rows. Publish-pathen validerar igen att varje child fortsatt matchar template, key, content item, type och context innan versionen publiceras. Därmed kan draft/reviewed-child rows inte bli kvar under en annan parent-identitet.
- Innehållskälla: `mvp-content-bundle-v1.json` förblir orörd eftersom den har exakt v1-approval. Återanvänd befintliga bundle- och importverktyg; om de inte kan representera FAQ-kontext plus ordnade checklistpunkter föreslås en minimal versionerad v2-källa, utan en ny fristående Markdown-plan. Exakt format och review reference fastställs med innehållsplanen. Faktuellt FAQ-/checklisteinnehåll skapas och granskas i en separat senare task; inget innehåll godkänns av detta schemaförslag.

**Obligatoriska databasvakter enligt Architect/Security re-review — CHANGES 2026-10-24:** `CHECK` kan inte se `content_items.content_type` från `content_versions`; en `BEFORE INSERT OR UPDATE`-trigger på versionen låser parent item och kräver tillåten `context` exakt för FAQ och länkad faslista, kontrollerar fasens context mot mallen och förbjuder context på orelaterade typer. Befintligt `protect_content_type` ska fortsatt blockera typbyte när versioner finns. För att undvika mapping-race har samtliga pathar en låsordning: `checklist_templates`-rad först, därefter berörda `content_items` sorterade på ID; versionens context-trigger för en fas låser den mappade templateraden före parent item. Mapping-triggern kräver vid första initiering att target item redan finns och har `content_type='checklist'`, och avvisar efterföljande ändring/radering av mapping eller context. Checklist-child-triggern kör för `INSERT`, `UPDATE` och `DELETE`, låser berörd parent version på samma sätt som befintlig `protect_content_child`, kräver parent type `checklist`, att versionens `content_id` matchar `checklist_templates.content_item_id` för samma `template_id`, att context matchar template, och att item key finns i stable-key-FK. Den avvisar child insert/update/delete när berörd version är `published` eller `withdrawn`; för update kontrolleras både gammal och ny parent. FK/triggers ger strukturell integritet även om administrativa grants felkonfigureras. Inget schemaarbete startar innan Architect/Security bekräftat att dessa skydd räcker.

**Security re-review v4 — PASS, dokumentationsförslag endast:** allowed contexts, cross-table validation/locking, immutable checklist children, published-only authenticated reads, no client catalog writes, duplicate preflight + unique index, transactionell draft/import/publicering och RLS-testmatris är tillräckligt konkreta för plancheckpoint. Implementations-tasken ska fortfarande verifiera exakt administrativ SQL-privilegieväg och gammal-klientbeteende. Ingen schema write godkändes.

**Architect re-review v4 — CHANGES 2026-10-24:** befintligt innehållsskydd tillåter redigering av draft/reviewed-versioner; `content_id`/`version` skulle kunna ändras efter att checklist-child rows skapats. v5 lägger därför till identity-update-guard och parent-/mapping-validering igen före publicering. Slutlig Architect/Security re-review återstår.

**Architect re-review v5 — APPROVE 2026-10-24:** identity-update-guard och publish-time revalidation stänger v4-fyndet inom befintliga immutability-/child-skydd. Architect godkänner plan v5 endast; Security, QA/Reviewer och Eriks schema-/mappingbeslut krävs före schema writes.

**Security re-review v5 — PASS 2026-10-24:** identity-update-guard och publish-time child-revalidation stänger parent-mismatch-risken utan ändring av godkänd RLS-/mappingriktning. Detta är dokumentationsgodkännande endast; inga schema writes är godkända.

**Oberoende dokumentations-QA — PASS 2026-10-24:** README-ankaret pekar på v5; alla sex ändrade paths ryms i planens och köpostens `write_paths`; plan, kö, Home-closeout, rapport och MASTER-LOG stämmer om reviewstatus. Queue JSON, `python -X utf8 tools/dev_flow.py validate` och `git diff --check` passerar. Diffen innehåller endast de sex godkända dokumentpaths. Ingen kod, SQL eller DB ändrades/användes.

**Oberoende Reviewer — PASS 2026-10-24:** sex skrivvägar och v5-ankare stämmer; plan, kö, rapport, Home-closeout och MASTER-LOG är samstämmiga; inga produkt-/schemaändringar eller Supabase-operationer påstås. D3-plancheckpointen är stängd. Eriks schema-/mappingbeslut och en separat implementationstask krävs före framtida writes.

Första publiceringen lägger inte till item keys eller ändrar befintliga nyckelbetydelser; publiceringsgrinden stoppar om lokal/integrationsparitet visar avvikelse. Före senare contentversioner granskas stödda klientversioner och gammal-klientens progressläsning. Vilka klientversioner som faktiskt finns ute är okänt och måste verifieras separat före release.

`checklist_templates.context` har en databas-`CHECK` för de tre tillåtna enumvärdena. En partial unique index på `content_versions(content_id) WHERE status='published'` är den databasspärr som begränsar varje item till en aktiv publicerad version. Migrationen gör read-only duplicate-preflight först och avbryts utan ändring om befintliga dubletter finns; den auto-withdrawar aldrig befintligt innehåll. Publiceringsskriptet tar content item-lås, withdrawar tidigare publicerad version och publicerar den nya i samma transaktion så unikhetsregeln gäller. Klienter läser enbart `status='published'` och väljer endast den aktiva publicerade versionen; de faller aldrig tillbaka till `reviewed`, `draft` eller `withdrawn`. Om ingen aktiv version finns visas befintligt tom-/otillgängligt tillstånd. Withdrawal eller ersättning ändrar inte hundrader eller gamla IDs; återställning kräver en ny granskad version.

Erik godkände schema-/mappningsförslaget den 2026-10-24. **Migrationer, seeds/importer, publiceringar och appändringar får börja först när den separata implementationstasken nedan har passerat Architect/Security-grinden.** Om granskning visar att nyckel-FK, RLS eller gammal klientparitet inte fungerar som beskrivet ska designen ändras och granskas på nytt.

Public read path ska uttryckligen avvisa `draft`, `reviewed` och `withdrawn`; tester körs i disposable PostgreSQL och täcker statusgrind, owner-isolering, mapping/paritet, och skriv/readback/retry. Live Supabase/RLS/readback är separat och får bara rapporteras som verifierad efter riktig miljöprobe. Architect bedömer implementationstasken inom D3 och panel 7; Eriks schema-/mappinggodkännande är registrerat, och implementationen inväntar Architect/Security-granskning. Dog Expert granskar faktiska råd före publicering.

**Föreslagna implementation paths för framtida tasken:** `supabase/migrations/202610240002_knowledge_catalog.sql` (kontrollera först mot uppdaterad main; endast migrationsfilens suffix ändras vid kollisionsrisk); `supabase/tests/knowledge-catalog.sql`; nytt strukturerat innehåll `docs/content/knowledge-catalog-v1.json` eftersom godkända `mvp-content-bundle-v1.json` inte kan uttrycka FAQ context eller ordnade phase items och dess approval förblir exakt; separata `supabase/content/knowledge-catalog-v1.sql` och `supabase/content/publish-knowledge-catalog-v1.sql`; uppdaterad `tools/validate_content_bundle.py` och `tests/content-bundle.test.mjs` för v1 oförändrad + D3-paritet. Befintliga klientpaths: `src/data/workspace-data.ts`; `src/features/knowledge/FAQScreen.tsx`, `PuppyChecklistScreen.tsx`, `checklist-model.ts`, `checklist-content.ts`, `checklist-data.ts`, `README.md`; riktade tester `tests/workspace-data.test.mjs`, `tests/checklist-data.test.mjs`, `tests/checklist-ui.test.mjs`, `tests/knowledge-review-content.test.mjs`; befintliga visual fixtures `tools/visual-check/app.tsx`, `tools/visual-check/know02-app.tsx` och `tools/visual-check/README.md`; render evidence i `docs/design/evidence/knowledge-d3-catalog-v1/`. Ny Markdown-spec behövs inte; innehållsstatus/approval indexeras i befintliga `docs/content/README.md`. Dessa är de föreslagna kod-/data-pathsen; taskens slutliga hashade write set fryses efter ägarbeslut. Ägarens beslut är nu registrerat; den aktuella första schema-taskens exakta write set står nedan, och senare import/publicering samt adapter/UI kräver egna tasks och reviews.

**Omfattning för denna plancheckpoint:** dokumentera riktning, dataflöde, ID-/progresskontrakt, publiceringsgrindar, föreslagna verifieringar och avgränsningar. UX Critic behövs inte eftersom ingen användarresa ändras. Dog Expert behövs inte för en datamodell utan nytt råd/innehåll, men granskar faktiska innehållsposter före publicering.

**Uttryckliga undantag:** inga produktkod- eller SQL-ändringar; ingen ny FAQ/checklisttext; ingen ändring av `content_type`, tabeller, ID:n, progress eller reviewflagga; ingen live Supabase-anslutning, migrering, import eller publicering; inga nya dependencies eller persondataändamål. Ägarens uppgift om migrerat senaste commit är rapporterad men inte live-verifierad.

**Klart för denna plancheckpoint:** Architect **APPROVE**, Security **PASS**, oberoende QA **PASS** och Reviewer **PASS** är registrerade; Erik godkände därefter schema-/mappingförslaget 2026-10-24. Detta stänger dokumentationsplanen och ägarbeslutsgrinden. Implementationstaskens write paths är frysta nedan; implementationstask v5 har senare fått Architect APPROVE, Security PASS, Critic PROCEED, oberoende QA PASS och Reviewer PASS utan fynd. Den lokala schema-tasken är stängd; commit/push följer som branch-checkpoint. Ingen innehållsimport, publicering eller live DB-operation ingår i första slicen.

**Skrivvägar för denna dokumentationsgrind:** befintlig användarplan, `docs/content/README.md` (innehållsstatus och planlänk), `docs/tasks/dev/HOME-FIRST-DAY-01.md` (stängd tasks nästa-stegslänk), `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md` och `docs/decisions/MASTER-LOG.md`. Ingen ny Markdown-plan eller taskfil skapas för denna dokumentationsgrind.

### KNOWLEDGE-D3-CATALOG-SCHEMA-01 — Schema och stabil fasidentitet, v5

**Status:** `done` som lokal schema-only task; implementationstask v5 har Architect **APPROVE**, Security **PASS**, Critic **PROCEED**, oberoende QA **PASS** och Reviewer **PASS** utan fynd. v1 fick Architect **APPROVE**/Security **CHANGES**; v2 fick Architect **CHANGES** om publicerad läsväg; v3 och v4 fick Architect **APPROVE**, Security **PASS** och Critic **PROCEED**. `supabase/tests/puppy-checklists.sql` uppdaterades till godkänd published-only mapping policy och passerar. `supabase/tests/training-progression.sql` publicerar nu syntetiska versioner sekventiellt; withdrawal-replay för v1 bevaras. Disposable PostgreSQL 16: D3-migrationsekvensen och fem direkt berörda SQL-prober **PASS**. `pnpm check` **PASS** (81/81), queue validation, JSON parse och `git diff --check` **PASS**. **Bas:** `codex/agent-workflow-stabilization@4ba74d126b272d8ab821e9de3a416dae0d7046ff`; färsk `origin/main@0b0f99f8660a392971b5caab71c19334f771f495` är förfader. **Ägargodkännande:** Erik godkände uttryckligen schema- och mappingförslaget i D3-plan v5 den 2026-10-24. **Skrivägare:** Codex-koordinator (ensam skrivare). **Risk:** H eftersom uppgiften inför schema, RLS/grants och migrationsbeteende. **Mandat:** godkänd `KNOWLEDGE-D3-CATALOG-PLAN-01` v5 och Eriks schema-/mappingbesked; inga nya innehålls-, publicerings- eller persondataändamål. Ingen live Supabase, import eller publicering har utförts; commit/push är branch-checkpointen.

**Architect re-review v5 — APPROVE 2026-10-24:** adding the directly affected training progression SQL probe is necessary because the approved unique partial index forbids two simultaneously published versions for one content item. The planned fixture sequence preserves withdrawn-version replay coverage.

**Security re-review v5 — PASS 2026-10-24:** the serialized synthetic publication changes no ACL/RLS or dog-data grants; the approved no-live-database boundary remains explicit.

**Critic scope review v5 — PROCEED 2026-10-24:** this is a compatibility correction to an existing SQL fixture, with no new user behavior, content or schema decision.

**Architect re-review v4 — APPROVE 2026-10-24:** the existing puppy-checklist SQL test path is directly affected by the approved published-only mapping read; its test correction and no-version visibility check are concrete and preserve the private key registry.

**Security re-review v4 — PASS 2026-10-24:** the test correction matches the published-only RLS contract; anon remains denied, authenticated cannot write or read the stable key registry, and no service_role or dog-data grants expand.

**Critic scope review v4 — PROCEED 2026-10-24:** this updates test expectations for the approved D3 contract without adding a user-facing change or content decision.

**Architect re-review v3 — APPROVE 2026-10-24:** authenticated published-only template mapping read restores the approved D3-plan v5 path; migration scope, preservation contracts and SQL acceptance are concrete.

**Security re-review v3 — PASS 2026-10-24:** authenticated can read mapped templates only for published content; anon is denied, catalog writes stay server/admin-only, no new service_role grants are added, and rollback fixtures test the hidden/published boundary.

**Critic scope review v3 — PROCEED 2026-10-24:** the change implements only the owner-approved schema/mapping contract and adds no advice, user journey or publication decision.

**Mål:** lägga till versions-/RLS-schemat och länka de sex befintliga `review-v1`-fasidentiteterna till separata stabila checklist-content items utan att skriva om hundägd progress, egna punkter, ikoner eller kontext.

**Ingår:** en forward-only migration med `faq`-typen, begränsad versionscontext, de sex template-contextvärdena och godkända `phase-*`-slugs, `content_version_checklist_items`, cross-table/parent-lock/identity/immutability guards, en aktiv publicerad version per content item samt published-only reads och admin-only catalog writes. Migrationen skapar och kopplar endast katalogens root metadata. En SQL-probe i disposable PostgreSQL testar constraints, triggers, mapping, RLS/grants, statusgrindar och befintliga progress-FK-kontrakt. Uppdatera befintlig innehållsstatus, denna plan, queue, rapport och MASTER-LOG med faktisk verifiering och nästa steg.

**Uttryckliga undantag:** migrationen skapar ingen FAQ-text, fas-/checklisttext, content-version eller checklist-child-rad; den importerar och publicerar inget innehåll. Disposable SQL-provet får skapa syntetiska versions-/child-fixtures endast i transaktion som rullas tillbaka. Inga draft-import-/publish-script; ingen klientadapter, skärm eller UI ändras; ingen förändring eller backfill av hundrader; ingen live Supabase-anslutning, migration eller readback; inga nya dependencies. Publicerat appinnehåll förblir oförändrat och publika FAQ-/faslistor förblir tomma efter migrationen. Innehållskälla, expertgranskning, adapters och UI hör till senare separata tasks.

**Datakontrakt:** migreringen utökar `content_items.content_type` med `faq`; `content_versions.context` har enum-CHECK och parent-lockad trigger för FAQ samt mappad faslista; befintligt `environment-checklist` återanvänds inte. `checklist_templates` får context och nullable unique FK `content_item_id`; de sex `phase-*`-slugs skapas som `checklist`-items och länkas write-once enligt mappingen i D3-plan v5. Den nya child-tabellen använder version-ID, stabilt `template_id`/`item_key`, position och titel, med composite FK till befintlig stabil key-registry. Triggers verifierar parent type/content/context och låser child rows efter publicering/withdrawal; versionens `content_id`/`version` blir orörliga medan child rows finns och alla children valideras före publish. En unique partial index på `(content_id) WHERE status='published'` föregås av duplicate preflight; dubbletter gör att migrationen avbryts utan automatisk ändring. `authenticated` får `SELECT` på `content_items`, `content_versions`, `checklist_templates` och checklist-child-tabellen. RLS på `checklist_templates` visar en mapping endast när dess `content_item` har en `published`-version; versions-, item- och child reads har published-only RLS. Rollen får inga katalogskrivningar och saknar åtkomst till `checklist_template_items`. `anon` saknar katalogrättigheter. Denna schema-only-slice behöver inte `service_role`: migrationens DB-ägare skapar root-items och mappingar. `service_role` behåller befintlig `ALL` på `content_items` och `content_versions` från foundation-migrationen och har inga rättigheter på `checklist_templates`, `checklist_template_items` eller den nya child-tabellen; migrationen ändrar inte dessa rättigheter. Ett framtida import-/publiceringssteg ska först specificera minsta nödvändiga privilegier för de nya tabellerna och granskas separat. Hundprogress, egna punkter, ikoner och preferenser behåller befintliga policyer, grants, FK och identiteter.

**Läsunderlag:** denna tasksektion och D3-plan v5 ovan; `docs/content/README.md`; `docs/decisions/MASTER-LOG.md`; `supabase/migrations/202610040001_foundation.sql`, `supabase/migrations/202610110002_puppy_checklists.sql`, `supabase/migrations/202610230001_checklist_custom_item_icons.sql`, branchens `supabase/migrations/202610240001_training_progression.sql`; samt `supabase/tests/foundation.sql`, `supabase/tests/puppy-checklists.sql`, `supabase/tests/checklist-custom-item-icons.sql` och `supabase/tests/training-progression.sql`. Läs endast angivna schema-/innehållskontrakt och direkt anropade definitionsfiler som behövs för kriterierna.

**Acceptans:**

1. Architect, Security och Critic godkänner samma implementationstaskversion före fortsatt kod; task v5 har Architect APPROVE, Security PASS och Critic PROCEED. Om planen eller write paths ändras ska berörda roller granska om.
2. Migrationen är syntaktiskt giltig och forward-only, stoppar säkert vid befintliga publicerade dubletter, installerar samtliga godkända constraints/triggers/index/RLS/grants och skapar exakt de sex godkända fas-rootmappningarna.
3. SQL-provet bekräftar alla sex template/context/slug-mappningar och de 18 oförändrade stabila nycklarna, type/context/parent/identity-regler, draft/reviewed/published/withdrawn-läsgrind och att katalogtabellernas rättigheter exakt följer rollmatrisen nedan. Syntetiska versions-/child-rader används endast i en rollbackad testtransaktion för att visa att mappingen är dold utan publicerad version och synlig när en giltig version publiceras. Provet verifierar även att progress/custom/icon/context-scheman, FK och grants inte byts ut, breddas eller backfillas.
4. Migrationen skapar inga innehållsversioner, FAQ-/fastexter eller checklist-child-rader och publicerar inget; inga appändringar eller live DB-operationer tillkommer. Syntetiska SQL-fixtures rullas tillbaka; docs anger att runtime-innehåll och faktisk live-migration fortfarande inte är verifierade.
5. Oberoende QA och Reviewer PASS, alla ändrade paths ryms i `write_paths`, och körda kontroller/resultat/luckor finns i queue, rapport och MASTER-LOG.

**Förväntad ACL-matris, verifierad per tabell** (`content_items`, `content_versions`, `checklist_templates`, `checklist_template_items`, `content_version_checklist_items`): `anon` har inga privilegier på någon tabell; `authenticated` har endast `SELECT` på `content_items`, `content_versions`, `checklist_templates` och `content_version_checklist_items`; RLS visar template-mappingen bara när dess content item har en publicerad version, och visar version-/item-/child-rader bara när versionen är publicerad. `authenticated` har inga rättigheter på `checklist_template_items`; `service_role` har `ALL` på `content_items` och `content_versions` enligt foundation-migrationen och inga privilegier på de tre övriga tabellerna. Migrationen ändrar inte befintliga template-/key-registry-ACL:er och ger ingen ny service_role-rättighet. Den använder DB-ägaren för att skapa de sex root-items och mappingarna. SQL-provet kontrollerar effektiv `SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER`-rättighet för varje roll/tabellpar, verifierar dold/synlig mapping med rollbackade syntetiska fixtures och kör befintliga progress-/ikonprober för oförändrade owner-grants.

**Kontroller:** disposable PostgreSQL kör migrationen, `supabase/tests/knowledge-catalog.sql`, `supabase/tests/puppy-checklists.sql`, `supabase/tests/checklist-custom-item-icons.sql` och `supabase/tests/training-progression.sql`; `pnpm check`; `python -X utf8 tools/dev_flow.py validate`; `git diff --check`. Live Supabase/RLS/readback är separat och inte del av denna task.

**Skrivvägar:** `supabase/migrations/202610240002_knowledge_catalog.sql`, `supabase/tests/knowledge-catalog.sql`, `supabase/tests/puppy-checklists.sql` (published-only template-mapping RLS, inga mappings före publicerad version), `supabase/tests/training-progression.sql` (sekventiell publicering/withdrawal av syntetiska versioner så probe respekterar en aktiv version per content item och fortsatt testar replay av indragen version), `docs/content/README.md`, denna användarplan, `docs/tasks/dev/HOME-FIRST-DAY-01.md` (stängd tasks nästa-stegslänk), `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md` och `docs/decisions/MASTER-LOG.md`. Ingen ny Markdown taskfil behövs; implementationstasken är denna sektion och dess queue-post.

**SQL-evidens:** Före v5-korrigeringen: disposable PostgreSQL 16 migrationsekvensen genom D3, `knowledge-catalog.sql`, `foundation.sql`, uppdaterad `puppy-checklists.sql` och `checklist-custom-item-icons.sql` **PASS**; `training-progression.sql` **FAIL** på två samtidigt publicerade synthetic versions för samma content item. Efter den granskade v5-korrigeringen passerar även `training-progression.sql` med sekventiell publicering och replay av indragen v1. Full `pnpm check` **PASS** (81/81 testfiler). Inga live Supabase- eller produktionsdatabasoperationer användes.

## 3. Träning som leder vidare

**Resa:** träningsrad på Hem → exakt instruktion → markera genomförd → bekräftad återkoppling → Hem med rätt status → Träning visar nästa tillåtna steg.

### Gör

- Följ en hel övning från varje befintlig ingång: rekommendationskort, Fortsätt, Mina och daglig checklista. Rätt programversion och steg ska vara tydligt.
- Förfina avslutningen efter genomförande så att användaren ser och kan öppna nästa tillåtna steg utan att leta upp programmet igen.
- Ett färdigt program får en lugn avslutning med återläsning eller fortsatt tillgänglig träning. Befintlig säker återställning behålls.
- Innehållsgranskningen ska säkerställa att instruktionen förklarar vad ägaren gör, hur man avslutar och när man pausar. Lägg inte nya råd eller tidskrav direkt i UI-kod.
- Använd befintlig bekräftad progress för återkoppling och liten förändringsanimation. En markerad övning betyder inte att hunden behärskar beteendet.

**Klart när:** samma genomförande stämmer i övning, Mina, Hem och dagslista; nästa steg följer rätt version; Avbryt/Avmarkera/Återställ påverkar rätt objekt; fel behåller sammanhanget och ger rätt återförsök.

**Kodbas:** aktiva `PublishedTrainingScreen`, `training-overview`, `ProductWorkspace`. Den äldre `TrainingScreen` är ingen produktionsbas.

## 4. Logg och Insikter som går att förstå tillsammans

**Resa:** snabbregistrera kiss → se tidslinjeraden → öppna Insikter → rätt periods antal uppdateras → tillbaka till samma Loggvy. Prova även ändra, radera och Ångra.

### Gör

- Verifiera den specifika Insikter-läsningen och att bekräftade ändringar uppdaterar rätt period. Utgå från befintlig adapter/RPC; bygg inte en parallell statistikmodell.
- Gör periodrubrik, siffror, legend och tomt/partiellt underlag lättare att skanna. Lägg förklaringar i fördjupning där det passar, men dölj inte läsfel eller ofullständig täckning.
- Första tomma Insikter ska förklara vad man kan börja registrera och ha en väg till befintlig Logg.
- Pröva som uttrycklig navigationsförbättring att välja en dag i diagrammet och öppna motsvarande befintliga loggdag. Den byggs bara om datum/returkontraktet kan bevaras.
- Fortsätt kalla sömn/vaken för registreringar tills ett faktiskt intervallkontrakt finns. Diagrammet ska inte ge medicinska slutsatser från små antal.

**Klart när:** snabbregistrering/ändring/radering/Ångra ger rätt bekräftade rader och antal; period och aktiv hund är rätt; gamla data döljs vid scopebyte; läsfel skiljs från noll; profil- och Logg-ingångarna har rätt retur.

**Kodbas:** `LogScreen`, `InsightsScreen`, befintlig Insikter-modell och `fetchDogEventInsights`. **D2** är specifik runtimeverifiering, inte ett antagande om saknad backend. **D5** gäller sömnintervall.

## 5. Planera, kom ihåg och samla hundens uppgifter

**Resa:** planera veterinärbesök → hitta samma plan i Kommande → ändra → välj påminnelser → registrera en faktiskt utförd händelse → se den i Tassla-pass → välj avsnitt och öppna delning.

### Gör

- Följ exakt plan-ID och återväg genom Hälsa och Checklistor. En plan ska aldrig automatiskt bli en utförd hälsohändelse.
- Gör vad som är aktiverat begripligt: sparade appval, telefonens tillstånd och den schemaläggningsstatus som befintlig tjänst faktiskt kan styrka. Ett sparat appval är inget leveranslöfte.
- När behörighet saknas eller en tid har passerat ska användaren ha en tydlig nästa handling, utan flera konkurrerande stora knappar.
- Låt tomma passavsnitt visa en relevant väg till befintlig inmatning där den vägen saknas. PDF och visad sammanställning ska använda samma valda, bekräftade data.
- Avbruten delning ska lämna användaren i ett begripligt läge utan påstående om att dokumentet skickats.

**Klart när:** rätt plan och retur består; avböjd behörighet kan förstås och hanteras; plan/utfört hålls isär; valda avsnitt matchar dokumentet; fel/återförsök och avbruten delning tappar inte användarens val.

**Kodbas:** befintliga hälso-/planvyer, `NotificationSettingsScreen`, befintlig notistjänst, `PassportScreen` och passmodell. Inga nya notifierings- eller delningstjänster behövs för grundresan.

## 6. Utveckling med verklig relevans

**Resa:** öppna aktuell fas på Hem → förstå ålder/fas → öppna en relevant guide → tillbaka till samma position.

### Gör

- Koppla granskade milstolps-/fasunderlag med rätt källor och åldersintervall. Kalenderålder är inte individuell färdighet.
- Prioritera läsbar fasöversikt och riktiga guider framför en permanent tom demonstrationssektion.
- Saknat/ogiltigt födelsedatum och vuxen hund ska fortfarande ge ett relevant, neutralt läge.
- Prova bildbeskärning, fasernas avstånd, ålderstoggle och guide-retur efter faktisk innehållskoppling. Förbättra konkreta avvikelser, återställ inga gamla skärmförslag.

**Klart när:** sidan har relevant granskad information, samma hund/ålder gäller genom resan, returpositionen består och inga milstolpar eller personliga bildanspråk hittas på.

**Kodbas:** `DevelopmentScreen`, Hem-ingången och befintlig innehållsläsning. **D5**: källorna är det materiella beroendet.

## 7. Samma respons och flyt i hela appen

Detta görs **i varje paket**, med en samlad avslutande runda.

- **Tryck märks:** återanvänd befintlig pressed-respons. En användarhandling ska få ett tydligt, relevant svar.
- **Sparande går att lita på:** Sparar/fel/osäkert/bekräftat hålls isär. Behåll inmatning och exakt intent vid återhämtning. Visa inte ett stort lyckat kort för varje liten händelse.
- **Förändringar känns sammanhängande:** använd befintlig diskret rörelse för öppning, återgång, ny rad eller bekräftad bock. Respektera reducerad rörelse; ingen ny animationsmotor eller ständig dekor behövs.
- **Man hittar tillbaka:** aktiv huvudflik, datum, filter, öppnad post och relevant scroll ska stämma från alla ingångar. X/back/swipe använder samma beslut för osparat formulär.
- **UI:t känns färdigt:** jämför färska integrerade skärmar mot rev02: bildandel, rubrikhierarki, ytor, kortstorlek och innehållstäthet. Ingen testcopy eller reserverade hål efter borttagna rutor. Rätta verklig menyöverlappning; tidigare separat accepterad Hem-marginal dokumenteras och kan prioriteras i denna samlade puts.
- **En bra första vy:** egna aktuella uppgifter och nästa användbara handling ska vara lätta att hitta på liten telefon. Längre innehåll får scrolla naturligt.

**Klart när:** samtliga sex huvudresor ovan går att utföra i en aktuell telefonbuild, med ny och återkommande användare, liten skärm, större text och relevanta fel. Både handling och resultat ska kunna förstås utan tekniska instruktioner.

## Beroenden, ansvar och beslut innan respektive del byggs

| Beroende | Ansvar / konkret nästa steg | Bevis som behövs |
|---|---|---|
| **D1 — egna faslist-ikoner** | Implementer/QA provar `202610230001_checklist_custom_item_icons.sql` i avsedd utvecklingsmiljö. | Sparat val återläses, äldre klient/grants och rätt ägare/hund fungerar. Rutinmigrationen/A03 återöppnas inte. |
| **D2 — specifik Insikter-RPC** | Implementer/QA kör befintlig riktad prob för `202610220002_dog_event_insights_read.sql`. | Rätt period/hund/scope, noll/partiellt/fel och nekad korsägarläsning. Generellt tidigare RLS-godkännande kvarstår. |
| **D3 — publik katalog** | Innehållsansvarig/Dog Expert och implementer inventerar, granskar och kopplar verkliga versioner. | Användbart publikt urval och bevarad progress/egna punkter; ingen reviewflagga som genväg. Faktisk publicering hanteras separat. |
| **D5 — milstolpar/sömnintervall** | Innehållsansvarig och implementer fastställer giltiga källor respektive det faktiska intervallkontraktet. | Åldersråd och tidsband bygger på underlag; annars kvarstår sanningsenlig begränsad presentation. |

Täckning och bevis avgör omfattningen. Uppskatta respektive paket efter den korta inventeringen; inga säkra dagestimat kan sättas enbart från UI-bilder.

## Genomförande och leverans

1. Ett paket i taget, med minsta kompletta resa först. Före kodning: kort exakt delplan, verkliga API:er/filer, konkreta tillstånd, godkända innehålls-/datakontrakt och riskbaserad review.
2. Återanvänd nuvarande kod. Samordna bara där samma användaruppgift fungerar olika; bygg inget generellt designsystemprojekt före resorna.
3. Efter varje resa: färska renderbilder, relevanta beteende-/dataprov, `pnpm check`, iOS-export när appkod ändras och oberoende QA/Reviewer. Dokumentera separata UI/data/native-statusar.
4. Commit/push av fungerande checkpoint och en kort telefonlista med vad som faktiskt ändrats. Telefonprov samlas när ägaren vill; tidigare A03/panel 3/VoiceOver/Dynamic Type/Supabase/RLS/Compliance-godkännanden begärs inte om igen.

**Den här beställningen tar fram planen.** Den startar inte automatiskt nya datamigrationer, innehållspublicering, foto-/lagringsfunktioner, pushnotiser, widgets, mål/poäng eller en ny navigator. Förbättringar som uttryckligen ändrar en befintlig route/urvalsregel specificeras i respektive delplan före implementation.

Planunderlag: nuvarande produktkomponenter, fryst GAP-status, färska rensade renders och separat Product/UX-genomgång. Critic: PROCEED WITH CHANGES; beroenderättelsen är införd: D1 hör till paket 2:s faschecklistor, inte paket 1:s dagsrutiner. Inga ytterligare materiella UX-invändningar. Granskningen gäller planen, inte framtida implementation.

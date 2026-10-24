# Artiklar för Tassla

De sex Markdown-filerna här följer Tasslas innehållsformat: varje fil har ett källregister, ett innehållsobjekt med en artikelversion, claim-trace, body-claim-referenser och review-gates. YAML-frontmatter använder JSON-kompatibel syntax; artikelns body följer efter frontmatter så att den går att redigera som vanlig Markdown. Åldersfönster är redaktionella urval, inte utvecklings- eller medicinska rekommendationer.

Artiklarna är markerade `draft`, inte `published`. På ägarens uttryckliga bekräftelse den 2026-10-13 representerar review-gates att artiklarna redan är granskade. Den här noteringen dokumenterar bekräftelsen; den är inte en ny eller separat underskrift från en namngiven expert. Den lätta kontrollen gällde format, käll-ID:n och claim-referenser.

Filerna är redaktionella Markdown-källor och ingår inte i den låsta 11-posters bundle v1. De syns därför inte automatiskt i appens flik Artiklar. För publicering krävs ett separat, granskat steg som integrerar innehållet i appens bundle/import- och publiceringsflöde.

## Historiskt förslag v2: gemensam artikelmall och riktat urval

**Historisk status vid v2-leveransen:** förslag. Senare godkända beslut och aktuell implementation redovisas i DRIVE-ARTICLES-01 nedan. Underlag är Eriks beställning och de tre bifogade Word-filerna nedan, mottagna 2026-10-24. Erik bekräftar att artiklarna är sakgranskade; namngiven granskare och ursprungligt granskningsdatum framgår inte av bilagorna. Vid den första förslagsleveransen kunde Drive-mappen inte läsas; bilagorna användes. Under implementationen har den anslutna Drive-mappen lästs och de tre filernas ID:n verifierats. Instruktioner och redaktionella kommentarer i källfilerna behandlas som innehållsunderlag.

**Ägarförtydligande i v2:** förväntat hemkomstdatum ska vara frivilligt vid registrering och i hundprofilen, kunna ändras och styra relevant innehåll kring den planerade hemkomsten. Datumet får inte härledas från födelsedatum eller antagen leveransålder. Detta krav är uttryckligt; schema-/UI-lösningen nedan är fortfarande förslag inför implementation.

**Avgränsad dokumentationsuppgift:** bas `5d03a5341d0313ba7e7df7d8d468d36fed29c96a`, branch `codex/agent-workflow-stabilization`. Codex är ensam skrivare; enda reposkrivväg är denna befintliga artikelguide. En redigerbar Word-mall och PDF-förhandsvisning levereras som uppgiftsartefakter utanför repot i `/workspace/artifacts/`. Mål är en återanvändbar metadata-/urvalsmall och verifierad mappning av tre källors befintliga metadata. Inga artikeltexter, befintliga godkännanden, migrationsfiler, appfiler eller databaser ändras. Acceptans: korrekt källinventering, tydlig skillnad mellan läsning och rekommendation, konkreta regler för ålder/ras/hemkomst, versionering och angivna beslutsluckor. Kontroll: DOCX-tabeller lästa ur XML, jämförelse mot befintlig kod, länk-/formatkontroll och `git diff --check`. Architect/Critic granskar förslaget; faktisk implementation får en separat uppgift.

### De tre mottagna artiklarna

Tabellen återger källornas värden; den föreslår inga ändrade åldersintervall. Alla tre har `Format = Artikel`, `Appsektion = Kunskap` och `Rasurval = Alla raser`.

| Källfil / titel | min_age_weeks | max_age_weeks | Ämneskategori i källan | Redaktionell avgränsning i källan |
|---|---|---|---|---|
| `01_Forsta_dygnet_hemma.docx` / Första dygnet hemma | 6 | 16 | Hemkomst – första dygnet | Händelsen hemkomst kan inte identifieras genom enbart ålder. Åldersurvalet är inte en automatisk dag-1-trigger. |
| `02_Rumsrenhet.docx` / Rumsrenhet – så hjälper du valpen att lyckas | 8 | 52 | Rumsrenhet | Gäller grundläggande valpträning. Äldre hundars problem med urinering/avföring kan ha andra orsaker. |
| `03_Valpens_somn.docx` / Hur mycket ska en valp sova? | 8 | 52 | Sömn | Fokuserar på valpens sömn och vila; ingen individuell sömnbedömning. |

Källornas SHA-256 för att knyta senare import och granskningsreferens till exakt mottagen fil:

- `01`: `57cd53e1518a20df1244288d7907521ec1e9e5a33f54d3d9e992cf648074b959`
- `02`: `f98a3577bf20e2ded47b1d4a821abe158c30faf9802d74e9ca17ec462dadce00`
- `03`: `9fd60b0640c3990e2c661e094b9169e9791160e8af71e067cf147f1438012a7d`

### Läsning och rekommendation är olika urval

Alla användare med appens befintliga läsbehörighet ska kunna hitta, söka och öppna alla publicerade artiklar, även om hundens ålder, ras eller situation inte matchar. Det innebär ingen ändring av nuvarande inloggnings-/anonbehörigheter. Draft och withdrawn blir inte läsbara genom detta förslag.

Rekommendationer för den aktiva hunden väljs separat ur samma publicerade bibliotek. Ålder, ras och bekräftad situation avgör vilka artiklar som får rekommenderas; de blir inte åtkomstspärrar. En manuellt öppnad artikel ska kunna läsas även när den inte rekommenderas. Ett tomt rekommendationsurval får inte fyllas med artiklar vars obligatoriska villkor inte matchar.

Nuvarande [selectContent](../../../src/content/select-content.ts) filtrerar på ålder **och** ras. [fetchHomeContent](../../../src/data/workspace-data.ts) använder det filtrerade urvalet, och [ProductWorkspace](../../../src/features/home/ProductWorkspace.tsx) skickar samma guideunderlag till [KnowledgeScreen](../../../src/features/knowledge/KnowledgeScreen.tsx). Därför krävs vid framtida implementation två tydliga resultat: hela publicerade artikelbiblioteket och de rekommenderade artikel-ID:na. Att bara ändra knapptexten till Alla artiklar räcker inte.

### Mall högst upp i varje artikel

Behåll Word-filernas tvåkolumnstabell och samma fältnamn i varje dokument. Lägg till de explicita fälten nedan. De sex befintliga fälten behålls. Presentationens färger, typsnitt och radordning ska inte styra importen; fältnamnen och `metadata_schema_version` är kontraktet.

Den levererade Word-mallen har 19 fältrader plus en sammanslagen rubrikrad i huvudtabellen (20 fysiska rader), och sju fältrader plus en rubrikrad i den valfria extratabellen (åtta fysiska rader). Rubrikraden är en tabellrubrik, inte ett metadatafält; den måste kännas igen separat vid import. Den gröna rubrikraden och växelvis tonade fältraderna återanvänder källornas tabellutseende.

| Fält | Exempel: Första dygnet hemma |
|---|---|
| metadata_schema_version | `1` |
| article_key | `forsta-dygnet-hemma` — föreslagen stabil nyckel; kontrolleras mot befintliga artiklar före import |
| version | `1` |
| Format | `Artikel` |
| Appsektion | `Kunskap` |
| min_age_weeks | `6` |
| max_age_weeks | `16` |
| Rasurval | `Alla raser` |
| breed_ids | Tom lista vid Alla raser; annars verkliga ID:n från rasregistret |
| Ämneskategori | `Hemkomst – första dygnet` |
| topic_code | `homecoming_first_day` |
| Händelsekrav | `homecoming` — föreslaget nytt, explicit urvalsvillkor |
| event_offset_start_days | `0` — föreslaget, antal kalenderdagar relativt bekräftad hemkomst |
| event_offset_end_days | `0` — föreslaget, hemkomstdatumet; se precision nedan |
| Redaktionell avgränsning | Källans avgränsning återges oförändrad; används inte som körbar filterregel |
| Sakgranskning | Bekräftad av innehållsägaren; referens till exakt källfil och bekräftelse |
| review_reference | Faktisk granskningsreferens; saknade uppgifter markeras som saknade |
| reviewed_at | Känt granskningsdatum eller uttryckligt saknad uppgift; datum gissas inte |
| Publiceringsstatus | Separat teknisk status; ingen automatisk publicering från en Word-etikett |

Den översta tabellen beskriver den primära målgruppen. Vid ytterligare målgrupper används en tilläggstabell med samma fältnamn i varje dokument; den lämnas tom om ingen extra målgrupp finns. Word-mallen använder två kolumner (fält/värde) även för extra målgrupper; gruppen kan upprepas. I jämförelsen nedan visas varje sådan grupp som en rad. Varje grupp är ett alternativ, och samtliga villkor inom gruppen måste matcha.

| rule_key | min_age_weeks | max_age_weeks | Händelsekrav | event_offset_start_days | event_offset_end_days | Nivå |
|---|---|---|---|---|---|---|
| `planned_new_home` | `0` | `null` | `expected_homecoming` | `-14` | `0` | `secondary` |
| `new_home_any_age` | `0` | `null` | `homecoming` | `0` | `0` | `secondary` |

Detta är föreslagna extra målgrupper för artikel 01 enligt Eriks önskemål, **inte metadata som redan finns i bilagan**. `-14..0` är ett konkret förslag för förberedande läsning från två veckor före planerad hemkomst till planerat datum, inte ett redan godkänt tidsintervall eller ett hundmedicinskt råd. Intervallet anges per artikel i metadata och behöver fastställas före publicering. Den planerade grenen presenteras som läsning inför hemkomst, aldrig som bekräftelse på att hunden redan är hemma.

Alternativen medger en senare hemkomst även när hunden blivit äldre än 16 veckor; huvudtabellens primära åldersintervall används inte en gång till som global spärr. Hela artikeln talar i dag om valp, mamma/syskon och uppfödare. Tillämpning på omplacerade vuxna ska därför aktiveras först när den förtydligats genom godkänd redaktionell anpassning. Originalets sakgranskning finns kvar som källbevis; en bearbetning får egen versions-/granskningsreferens. Ett alternativ är en separat vuxenanpassad artikel. Den ska i så fall ha eget `content_item`, eftersom två samtidiga målgruppsvarianter inte är samma sak som två revisioner av ett item.

Alla artiklar använder samma mall. Rumsrenhet och Sömn får `Händelsekrav = none`, båda event-offsetfält som `null` och en tom extra-målgruppstabell. Inga vuxenregler härleds från dessa två texters valpråd.

### Hur parametrarna mappas till databasen

Återanvänd nuvarande versionerade katalog. Bygg ingen parallell artikeldatabas och ändra inte den redan migrerade `202610240002_knowledge_catalog.sql`.

| Metadata | Befintlig eller föreslagen lagring |
|---|---|
| article_key / Format | Befintliga `content_items.slug` och `content_type = article`; intern UUID är stabil identitet |
| version / titel / text / källor / sakgranskning / publicering | Befintliga `content_versions` och dess gransknings-/publiceringsflöde |
| Rasurval / breed_ids | Befintliga `content_breed_targets`, gemensamt för artikelversionens målgrupper. Alla raser motsvarar inga specifika rastarget-rader, efter explicit validering av Alla raser |
| Appsektion / topic_code / redaktionell avgränsning / metadata_schema_version / källfilreferens | Föreslagen versionsbunden artikelmetadata, exempelvis en 1:1-tabell `article_version_metadata` med FK till `content_versions`. Konstanter som Artikel behöver inte lagras dubbelt |
| Primär målgrupp + extra målgrupper | Föreslagen `content_targeting_rules`: FK till version, unik rule_key, min/max ålder, händelsekrav, start-/slutoffset i kalenderdagar och primary/secondary. En primär regel skapas från huvudtabellen; endast extra regler skrivs i tilläggstabellen |
| Allas läsning | Befintlig published-läsbehörighet; hundens matchning används inte i läs-RLS |

Ämneskoderna föreslås vara `homecoming_first_day`, `house_training` och `puppy_sleep`. Svensk etikett visas i redaktionen/appen; stabil kod lagras i urval och import. Okända koder ska ge ett valideringsfel, inte tyst skapa en ny kategori. Flera fria taggar och en generell regelmotor behövs inte för dessa tre artiklar.

Befintliga `content_versions.min_age_weeks/max_age_weeks` och nuvarande selector används också av äldre innehåll och träning. Deras betydelse ändras inte genom dokumentförslaget. En framtida migration/adapter måste uttryckligen avgränsa övergången: för artiklar som får nya versionsbundna målgruppsregler är dessa regler auktoritativa för rekommendation, och primärgruppens 6–16 får inte åter appliceras som globalt AND-villkor efter en giltig extra vuxenregel. Äldre artiklar/träningsprogram ska följa tidigare kontrakt tills de separat flyttas över. Publicering kräver verifierad hantering av äldre klienter; sätt inte befintlig ålder till 0–null för att forcera vuxenvisning i äldre kod.

D3:s befintliga `content_versions.context` kan inte användas direkt: dess [validering](../../../supabase/migrations/202610240002_knowledge_catalog.sql) tillåter context för FAQ och mappade faslistor, medan artikelversioner ska ha null där. Artikelns händelsevillkor ska ligga i de föreslagna urvalsreglerna och införas genom en ny granskad forward-only migration.

### Matchning mot den aktiva hunden

Grundregeln är `publicerad OCH rätt rasurval OCH minst en matchande målgrupp`. Inom målgruppen gäller `rätt ålder OCH uppfyllt händelsekrav OCH rätt tidsfönster`. `null` som maxålder betyder ingen övre gräns, inte okänd ålder. Åldersgränserna är inkluderande, räknade i fyllda kalenderveckor med appens befintliga åldersberäkning.

Hundprofilen har i dag födelsedatum och ras men inget planerat eller bekräftat hemkomstdatum. Planerat och faktiskt datum har olika betydelse:

| Profiluppgift | Status och betydelse |
|---|---|
| `expected_homecoming_date` (`date`, nullable) | Ägarbeställt frivilligt fält vid registrering och i hundprofilen. Anger när ägaren förväntar sig att få hem den aktuella hunden. Används för `expected_homecoming`-regler |
| `homecoming_date` (`date`, nullable) | Föreslaget separat, uttryckligt bekräftat faktiskt hemkomstdatum. Behövs för regler som påstår faktisk hemkomst; det fylls aldrig i bara för att planerat datum passerat |

Datumuppgifterna hör till hundens aktuella hemsituation och ska följa befintlig ägar-/hundbehörighet. Vid eventuell framtida delning mellan flera hushåll måste ägandet av hemsituationen specificeras; det ingår inte att införa en ny delningsmodell här. Omplacering behöver inte registreras som en ny obligatorisk orsak för att känna igen en bekräftad hemkomst för en äldre hund.

Användarens bekräftade val ska styra; födelsedatum, kontots registreringstid, ordet valp eller registrerade olyckor får inte användas för att gissa hemkomst. Det befintliga manuella checklistkontextvalet Första dagarna bevisar inte ett datum. Ingen åldersbaserad schablon fyller i det frivilliga fältet.

Händelseoffset jämför lokala kalenderdatum: `-14..0` är från fjorton dagar före till och med händelsedatumet, och `0..0` är endast händelsedatumet. Det senare bevisar inte exakt de första 24 timmarna. Vill man rekommendera under exakt första dygnet krävs en separat definition med bekräftad tidpunkt och intervallet `0 <= förfluten tid < 24 timmar`; det ska inte räknas fram ur ett datum med antaget klockslag. Tidsfönstret är ett nytt redaktionellt urvalsbeslut, inte något som redan finns i källornas metadata.

Om planerat datum passerar utan bekräftad faktisk hemkomst uppstår ingen faktisk hemkomst automatiskt. Förslagets planeringsfönster avslutas; artikeln kan fortfarande läsas i biblioteket och ägaren kan ändra datumet. Vid ändring eller borttagning av planerat datum räknas rekommendationerna om från de bekräftat sparade uppgifterna. Ett valt datum efter hundens födelse får inte nekas enbart för att hunden då är äldre än en vanlig leveransålder.

Ålder eller händelse som saknas matchar inte en regel som kräver den uppgiften. Alla raser kan matcha även när rasen är okänd; rasspecifikt innehåll rekommenderas bara vid säker ID-matchning. Oavsett utebliven rekommendation finns den publicerade artikeln kvar i biblioteket.

Första enkla ordningen kan vara: matchning på bekräftad aktuell händelse, därefter primär åldersmålgrupp, därefter extra målgrupp; stabil artikelnyckel bryter lika utfall. Detta är föreslagen ordning, inte en befintlig eller dold poängmodell. Samma artikel visas bara en gång även om flera regler matchar. Ingen slump, ML eller automatisk diagnos behövs.

Vid hundbyte räknas urvalet om för aktiv hund. Cache-/urvalsnyckeln behöver även innehålla planerad och faktisk hemkomst, aktuell lokal dag och innehållets versioner; föregående hunds resultat ska inte hänga kvar.

### Frivilligt datum i registrering och hundprofil

Ägarbeställt beteende: ett fält med etiketten **Förväntad hemkomst (valfritt)** i den befintliga hundregistreringen och när hundprofilen redigeras, utan ett extra obligatoriskt registreringssteg. Föreslagen kort hjälptext: När tror du att hunden kommer hem till dig? Du kan ändra datumet senare. Kalendern återanvänder befintlig datumkomponent och följer [designreglerna](../../design-rules.md), `tassla-consumer-ux` och `mobile-ios-design`; ingen ny layout eller komponentimplementation ingår i dokumentförslaget.

Tomt fält lagras som `null`; enbart att öppna kalendern väljer inte dagens datum. Det ska gå att välja, ändra och ta bort datumet. Uppgiften hör till rätt aktiv hund, sparas i samma bekräftade profilflöde och finns kvar efter återöppning. Misslyckad eller okänd sparstatus behåller inmatningen och ändrar inte rekommendationerna som om datumet vore sparat. Befintligt datumvaliderings-, retry-, hundbytes- och kontobytesbeteende ska bevaras.

Exempel enligt ägarens förtydligande: hunden föds 1 augusti och förväntas komma hem **15 december**. Planeringens ankare är 15 december. Med det föreslagna fönstret `-14..0` visas relevant förberedande läsning **1–15 december**, inte vid någon automatiskt beräknad leveransålder i oktober/november. Hunden är då drygt 19 veckor, så den uttryckliga extra hemkomstregeln behövs även för denna valp; en global maxålder 16 skulle annars ge fel resultat. Datumexemplet är inte ett råd om normal leveransålder.

### Konkret urval för dessa artiklar

| Hundprofil / situation | Första dygnet hemma | Rumsrenhet | Valpens sömn | Kan läsa alla publicerade artiklar? |
|---|---|---|---|---|
| 10 veckor, bekräftad hemkomst samma kalenderdag | Rekommenderas enligt primärregeln | Rekommenderas | Rekommenderas | Ja |
| 10 veckor, hemkomst okänd eller tidigare dag | Ingen automatisk hemkomstrekommendation med föreslaget fönster | Rekommenderas | Rekommenderas | Ja |
| Född 1 augusti, planerad hemkomst 15 december, i dag 5 december | Förberedande läsning enligt föreslagen planregel, trots över 16 veckor; ingen faktisk hemkomst antas | Rekommenderas inom 8–52 | Rekommenderas inom 8–52 | Ja |
| 5 år, bekräftad omplacering/hemkomst i dag | Föreslagen extra målgrupp; inväntar godkänd vuxentillämpning | Ingen valpriktning | Ingen valpriktning | Ja |
| 5 år, ingen aktuell hemkomst | Ingen riktning från de tre reglerna | Ingen valpriktning | Ingen valpriktning | Ja |
| Okänd ålder och okänd hemkomst | Ingen säker matchning | Ingen säker åldersmatchning | Ingen säker åldersmatchning | Ja |

Tabellen visar rekommendationsmatchning, inte medicinsk lämplighetsbedömning. Uppgiften 6–16 veckor är ett redaktionellt urval och är varken hemkomstbevis eller ett råd om vid vilken ålder en valp ska flytta.

### Import och fortsatt implementation

1. Behåll originalfilerna som versionsspårat källunderlag. Extrahera tabell, rubriker, brödtext och Läs mer-referenser till ett validerat innehållsobjekt; ändra inte texten tyst. De tre filerna ersätter inte automatiskt den låsta v1-bundlen eller de sex äldre Markdown-artiklarna. Identifiera eventuella dubbletter och välj stabil identitet före import.
2. Validera obligatoriska fält, schema-version, numeriska åldrar, max >= min, godkända koder, ras-ID:n och komplett regeluppsättning. Dubbla/okända fält, tvetydiga tomvärden och saknad primärregel ska ge fel. Rubrik och tabellutseende får förändras utan att importen börjar gissa filter från brödtexten. Redaktionell avgränsning sparas som text, aldrig som körbar regel.
3. Planera en separat implementation för additiv schemaändring, import/återläsning och bibliotek kontra riktat urval. Bevara alla befintliga publicerade versions-/ID-/progresskontrakt. Förväntat hemkomstdatum i registrering/profil är uttryckligen beställt; dess persistens/åtkomst, faktisk hemkomst och urvalsreglernas exakta tidsfönster specificeras före berörd kodändring.
4. Granska exakt ändrad vuxentillämpning för artikel 01. För artikel 03 behöver även påståendet om att appen visar total sovtid stämmas av mot actionplanens D5: nuvarande kontrakt beskriver sömn/vaken som registreringar tills intervall är verifierade. Sakgranskning av hundråden verifierar inte appens funktioner. Detta förslag ändrar varken text eller sömnfunktion.
5. Lös riktiga Läs mer-länkar före publicering. Bilagorna hänvisar till 04/08/09 som inte bifogats; `09_valpsakra_hemmer` i artikel 01 skiljer sig dessutom från `09_valpsakra_hemmet` i artikel 03. Behåll originalreferensen för spårbarhet och mappa bara till faktiskt existerande mål; skapa inga påhittade destinationer.
6. Verifiera gränsåldrar 6/16 och 8/52, frånvaro av hemkomst, förväntad hemkomst bortom maxålder 16, ändrat/borttaget/passerat planerat datum, vuxen omplacering, alla/rasspecifikt/okänd ras, hundbyte och alla-artiklar-läsning utan profilmatchning. För registrering/profil ska frivillighet, save/readback, återförsök och scopebyte verifieras i riktiga komponenter med färsk §14-/tillgänglighetsevidens; ingen visuell acceptans påstås av dokumentförslaget. Publicering sker först när exakt innehåll, urval och klientkompatibilitet är granskat; en senare Word-ändring får inte skriva över publicerad historik automatiskt.

### Granskningsstatus för förslaget

Architect **APPROVE-for-proposal** och Critic **PROCEED-for-proposal**, 2026-10-24, för v2:s struktur. Granskningarna verifierar bland annat hela biblioteket kontra riktat urval, planerad kontra faktisk hemkomst, augusti/december-exemplet utanför 6–16 veckor och att D3:s context inte återanvänds felaktigt för artiklar. Det föreslagna `-14..0`-fönstret, faktisk hemkomst och vuxenanpassad text behöver fortfarande sina uttryckliga beslut före berörd implementation/publicering. Källornas sakgranskning är ägarbekräftad; den påstås inte vara utförd på nytt i denna dokumentationsuppgift. Dokumentationsförslaget gör ingen SQL-/appändring och publicerar inget.

Oberoende dokumentations-QA **PASS**: de tre verkliga DOCX-tabellernas metadata/titlar och filhashar matchar inventeringen; alla relativa fillänkar finns; Word-mallens 19+7 fält och rubrikrader matchar förslaget; tvåsidig PDF har renderats och granskats. Förväntad kontra faktisk hemkomst och frivilligt registrerings-/profilfält är korrekt avgränsade. Bara denna guide har ändrats i repot och `git diff --check` passerar. Ingen app-/DB-körning behövdes eller påstås i denna dokumentationsuppgift; faktisk registrerings-/profilrender och live persistens är ännu inte implementerade eller verifierade.

Fryst oberoende Reviewer **PASS** utan fynd: enda repodiffen är denna guide, mallartefakterna finns, källunderlaget och december-exemplet är korrekt beskrivna, och läsning/rekommendation samt förslag/implementation hålls isär. Detta stänger dokumentationsleveransen, inte kommande schema-/appimplementation.


## DRIVE-ARTICLES-01 — implementation 2026-10-24

Status: implementing. Bas: `3581dac25f526ebc687fbffc0cf24e3b08d3a6d9`, samma arbetsbranch. Ägare: root (enda skrivare). Mandat: Erik beställer automatisk Drive-import och anpassning av de tre sakgranskade artiklarna för nästa bygge. Det tidigare beställda frivilliga förväntade hemkomstdatumet ingår. Publicering av dessa artiklar är beställd; faktisk liveaktivering kräver driftåtkomst som saknas i denna miljö.

Sekventiella delar: (1) versionsbunden artikelmetadata, transaktionell import, källtrogna apptexter och separat publiceringsmigration; (2) komplett bibliotek och rekommendationer i befintlig läsare; (3) frivilligt hemkomstdatum med idempotent registrering och profilens befintliga spar-/återläsningskontrakt; (4) schemalagd Drive-synk och driftinstruktion. Ingen ny dependency, vuxenomskrivning, faktisk hemkomst, sömnfunktion, delningsmodell, eller extern liveåtgärd ingår.

Planerade skrivvägar: denna README; `supabase/migrations/202610240003_article_delivery.sql`; `supabase/migrations/202610240004_reviewed_drive_articles.sql`; `supabase/tests/article-delivery.sql`; `docs/content/artiklar/drive-articles-v1.json`; `tools/sync_drive_articles.py`; `tests/test_drive_articles.py`; `.github/workflows/sync-drive-articles.yml`; `src/content/article-targeting.ts`; `src/data/workspace-data.ts`; `src/data/app-data.ts`; `src/features/home/ProductWorkspace.tsx`; `src/features/knowledge/KnowledgeScreen.tsx`; `src/features/onboarding/ProfileScreen.tsx`; `src/features/onboarding/EditDogProfileScreen.tsx`; `tests/article-delivery.test.mjs`; `tools/visual-check/app.tsx`; `tools/visual-check/verify-drive-articles.py`; evidensfiler under `docs/design/evidence/drive-articles-2026-10-24/` (namnges vid render).

Acceptans: tre fullständiga artiklar utan metadatatabell/råa redaktionella länk-ID:n kan läsas med befintlig läsare; biblioteket omfattar alla publicerade artiklar; ålder/ras/datum begränsar bara rekommendation; okänd hemkomst gissas inte; registrering/profil hanterar null/ändring/borttagning och återförsök; importer validerar format/metadata och bevarar publicerad historik vid fel/återkörning; schemat har service-only import och published-only läsning; källrevisioner och importfel är spårbara. Bevis: riktade Python/Node/SQL-prov, pnpm check, iOS-bundle, renderade produktionskomponenter och oberoende QA/Reviewer. Live Google→Supabase och nästa signerade bygge markeras NOT TESTABLE tills verklig aktivering verifierats.

Driftrisk: backendens Google/Supabase-hemligheter saknas (runtime-status verifierad 2026-10-24). Drive-mappen kan läsas via chattens connector, vilket inte ger en schemalagd backend samma behörighet. Exakt förberedelsefönster har frågats parallellt; oberoende arbete fortsätter. Tidigare läsare bevarar primäråldersmetadata, nya regler får inte globalt begränsas av denna ålder.


Ägarförtydliganden under implementationen: förberedelsefönster **-7..0 kalenderdagar** är uttryckligen valt. Originaltexterna är skrivna utan AI. Tilltal ska anpassas med hundens namn och han/hon; frivilligt könsfält `male/female/null` i profilen och registreringen ingår därför. Ingen gissning av kön, ingen kopia per hund och ingen hunddata till Drive. En deterministisk platshållarmall ersätter endast uttryckligen markerade hänvisningar till den egna hunden. Allmänna råd och andra hundar förblir generiska. Inledningsvis är hemkomstartikelns förberedande regel avgränsad till valpålder 6–52 veckor; vuxentillämpning är fortsatt inte godkänd. Primärmetadata 6–16 bevaras men begränsar inte den separata förberedelseregeln.

Teknikgranskningen begränsade nyckelåtkomst: GitHub-runnern får endast en redaktionell sync-token; service-role ligger i en separat Supabase Edge Function som bara anropar import-RPC:n. Ändrad källfil kräver både ny review_reference och senare reviewed_at. Samma fil/hash returnerar befintligt kvitto och återpublicerar aldrig indragen historik; äldre modifieringstid nekas. Schemaläggning är best effort, inte garanterad realtid. GitHub schedule kör först när workflow finns på defaultbranchen; workflow_dispatch är också begränsad till defaultbranchen. Miljön article-publishing måste tillåta endast skyddad defaultbranch innan hemligheter läggs till. Inga faktiska hemligheter finns här.

Nödvändigt preciserade skrivvägar inom samma beställning: `src/features/onboarding/DogArticleProfileFields.tsx`; `supabase/config.toml`; `supabase/functions/sync-drive-article/index.ts`; `supabase/functions/sync-drive-article/handler.ts`; `supabase/functions/delete-account/tsconfig.json` (inkludera nya serverfunktionen i befintlig TS-kontroll); `docs/privacy/beta-information.md`; `docs/dev/beta-data-lifecycle.md`. Integritetsgranskaren godkänner lokal implementation och kräver att befintlig integritetsinventering beskriver artikelurval/tilltal samt nya råfält före aktivering. Datumets lagring efter passerad planering har frågats utan att stoppa oberoende arbete. Ingen ny extern mottagare för hundprofilen införs.


Integritetsbeslut: Erik valde att behålla passerat hemkomstdatum som redigerbar planeringsuppgift. Rekommendation upphör ändå efter metadatafönstret. Compliance APPROVE lokal implementation efter att detta ändamål dokumenterats; ingen ny godkännandefråga behövs.

Regressionstesterna behöver uppdateras för de uttryckligen ändrade kontrakten: skrivvägar `tests/app-data.test.mjs`, `tests/profile-edit.test.mjs`, `tests/content-delivery.test.mjs`, `tests/home-panel-routes.test.mjs`, `tests/knowledge-search-screen.test.mjs`, `tests/knowledge-training-empty-feedback.test.mjs`. Deras gamla femarguments-RPC, exakta select-listor och antagande om ett redan åldersfiltrerat bibliotek ersätts av den nya resans kriterier; fel-/scope-/replay-proven behålls.

Skrivväg preciserad för befintliga dekorativa artikelbilder: `src/features/knowledge/editorial-image-assignment.ts`. De tre kända artikelnycklarna får befintliga redaktionella bilder; nya okända artiklar använder befintlig textfallback. Bilden påstår inte att föreställa användarens hund.

### Drift och redaktion — genomförande för DRIVE-ARTICLES-01

Den äldre v2-texten ovan är historiskt förslagsunderlag. Ägarbesluten i implementationen gäller nu: 7 dagars förberedelse, frivilligt kön/tilltal och datum som behålls som redigerbar planeringsuppgift. Artikelmodellen använder de befintliga versionerna plus `article_version_metadata` och `article_targeting_rules`; befintligt `context` för FAQ/faslistor berörs inte.

För nästa bygge måste först **båda** nya migrationerna appliceras i ordning: `202610240003_article_delivery.sql` (schema, profilfält, RPC/RLS) och `202610240004_reviewed_drive_articles.sql` (de tre fullständiga publicerade artiklarna). Migration 004 kör samma transaktionella importer som Drive-flödet och använder exakt JSON-underlaget i `drive-articles-v1.json`. Ett bygge utan dessa migrationer kan inte visa artiklarna. Ingen inbyggd offlinekopia döljer fel eller ignorerar en senare indragning.

Källornas primärmetadata och originalhashar är bevarade. Appanpassningen lägger till uttryckliga hänvisningar till den egna hunden, tar bort redaktionstabellen och visar inte olösta Läs mer-ID:n. Källornas hänvisningar sparas i metadata för redaktionen, inte som påhittade länkar eller externa källor. Den felmarkerade långa rubriken under Rumsrenhet blir ett stycke. Sömnartikelns appinstruktion beskriver sömnmarkeringar/historik och lovar varken loggning av nya uppvaknanden eller total sovtid. Artikelråden i övrigt bevaras; vuxenversioner ingår inte. Inga externa källor eller oberoende veterinärunderskrifter fabriceras. Ursprung är `is_ai_generated=false` enligt Eriks uttryckliga uppgift om originalen; presentationens tokenmarkeringar dokumenteras som teknisk anpassning.

**Aktivera automatiken en gång:**

1. Dela endast den angivna publiceringsmappen med en Google-serviceidentitet med läsbehörighet och aktivera Drive API för den. Mappen är en redaktionell publiceringskö, inte arbetsutkast. Begränsa vilka personer som kan lägga dit färdiga granskade versioner.
2. Driftsätt Supabase-funktionen `sync-drive-article`; `verify_jwt=false` gäller endast denna endpoint eftersom den kontrollerar en separat stark Bearer-token. Sätt `ARTICLE_SYNC_TOKEN` till minst 32 slumpmässiga tecken i Supabase-hemligheter. Befintlig Supabase-service-roll används endast i serverfunktionen, aldrig i appen, repo eller GitHub-runnern.
3. Skapa GitHub-miljön `article-publishing`, tillåt endast den skyddade defaultbranchen och skydda workflow-/importkod med branchregler. Lägg `GOOGLE_DRIVE_SERVICE_ACCOUNT` (serviceidentitetens JSON) samma `ARTICLE_SYNC_TOKEN` och exakt `ARTICLE_SYNC_PROJECT_REF` (projektets 20-teckens referens) som **miljöhemligheter**, inte i filer. Miljövariabler: `GOOGLE_DRIVE_ARTICLES_FOLDER_ID=1jEIiGF3upCnO0smILK0gz1JCQQDZ8pGi` och `ARTICLE_SYNC_URL=https://<projekt>.supabase.co/functions/v1/sync-drive-article`. Sätt repositoryvariabel `ARTICLE_SYNC_ENABLED=true` först efter att schema, endpoint och miljöskydd är verifierade.
4. Efter integration till defaultbranchen: kör `Sync reviewed Drive articles` manuellt därifrån och kontrollera workflowstatus och Supabases publicerade versioner. Schemat går därefter ungefär var femte minut; GitHub kan försena/hoppa över körningar. Denna branch kan granskas/byggas men får inte ta emot de skyddade drifthemligheterna genom manuellt workflow.

Importen läser direkt under mappen, stöder DOCX och native Google Docs (export till DOCX), följer inte dokumentlänkar och hämtar inga hundprofiler. Inga nya applikationsdependencies installeras; Python standardbibliotek och runnerns OpenSSL används. Document-/arkiv-/textstorlek, metadata, kända fält, koder och format valideras. Fel lämnar senast publicerad version kvar och ger ett misslyckat workflow med fil-ID och kontrollerad feltyp. Radering/flytt i Drive raderar eller drar inte automatiskt in publicerad historik.

**Framtida dokument:** använd huvudtabellens metadatafält, fyll i stabil `article_key`, `metadata_schema_version=1`, godkänd ämneskod (`general`, `homecoming_first_day`, `house_training` eller `puppy_sleep`), riktiga åldrar och explicita ras-ID:n. `Händelsekrav` är i denna leverans `none` eller `expected_homecoming`; faktisk hemkomst är inte implementerad. Offset lämnas tom vid `none`; för förberedelse används explicit start/slut, exempelvis `-7`/`0`. Tillåtna värden är -365 till 0 inklusive, eftersom planerat datum aldrig bevisar faktisk hemkomst. Extra målgrupper använder den separata tabellens sju fält. Villkoren inom en grupp är AND, grupperna OR; ras gäller gemensamt. Målgrupper är rekommendation, aldrig läsbehörighet. En ny artikel kräver minst en explicit regel; bibliotekskopior skapas inte per målgrupp.

Till de äldre mallfälten behöver varje nytt dokument också **`is_ai_generated` = `true` eller `false`**. För publicering krävs **`Sakgranskning=Godkänd`**, **`Publiceringsstatus=Publicera`**, faktisk **`review_reference`** och ISO-tid **`reviewed_at`**. Vid ändring krävs både en ny granskningsreferens och ett senare granskningsdatum, annars behålls tidigare artikel. De tre ursprungliga sjufältsdokumenten har ett snävt undantag för exakt bekräftad fil/hash i JSON-underlaget; nya filer eller ändrade original får inte ärva detta godkännande. Fil-ID är källidentitet. `article_key` får inte ändras för samma fil; en kopierad fil får inte ta över en redan använd nyckel. Version i Word är redaktionell versionsuppgift (positivt heltal); databasens version räknas alltid upp transaktionellt.

Titeln ska använda Word-format Titel/Rubrik 1, underrubriker Rubrik 2/3, brödtext Normal och punktlista Punktlista/List Bullet. Behåll tabellen högst upp; dokumentets visuella typsnitt/färger följer inte med till appen. Bilder, inbäddade objekt, allmänna tabeller, interna Word-hyperlänkar och okänd Markdown nekas tills läsaren uttryckligen stöder dem. Ange eventuella externa källor som rena HTTPS-adresser efter rubriken Källor. Läs mer-ID:n sparas för senare länkmappning och påstås inte fungera som länkar i dagens läsare.

**Tilltal:** skriv `{{dog.name}}` (Nemo/Nala), `{{dog.subject}}` (han/hon/namnet), `{{dog.Subject}}` vid meningsstart, `{{dog.object}}` (honom/henne/namnet) och `{{dog.genitive}}` (Nemos/Nalas/Max). Använd dem endast om den egna hunden. Behåll generiska pluraler och allmänna hundråd. Exempel: `När {{dog.name}} kommer hem behöver {{dog.subject}} en trygg plats.` Ersättningen sker en gång inne i React Native Text efter att artikelstrukturen tolkats; ett hundnamn kan därför inte injicera rubriker, länkar eller nya platshållare. Läsarens kön/namn/planeringsdatum skickas inte till Drive-importen. All artikeltext sparas gemensamt i kanoniskt format.


Arkitektur- och säkerhetsförtydliganden: importendpointens exakta Supabase-projekt är pinnat via den skyddade miljöhemligheten `ARTICLE_SYNC_PROJECT_REF`; ändring av URL-variabeln till ett annat projekt nekas innan token skickas. Ingen Word-etikett publicerar från en arbetsmapp: endast den åtkomstbegränsade publiceringsmappen, explicit godkända dokumentfält och aktiverad betrodd serverväg kan publicera. Granskningsuppgifter är redaktionella attestationer från dessa behöriga publicister, inte kryptografiskt bevis på oberoende expertgranskning. Att ändra själva Word-filens granskningsfält innebär också en filändring; därför används ingen omöjlig regel som kräver att en inbäddad tidpunkt ska vara efter sin egen sista sparning. Exakt accepterad revision binds i stället till fil-ID, källfingerprint, kvitto och oföränderlig artikelversion. Publika appanvändare har ingen importer- eller målgruppsskrivbehörighet.


Ägarbeställt tillägg under pågående uppgift: läsvyn ska ha bilder, färgformatering och tipsrutor i Tasslas färgtema, med de bifogade läsvyerna som inspiration. Detta gäller gemensamt för artiklar/guider. Samma befintliga läsare får dekorativ hero, tonad ingress, gröna rubriker och explicita Tips/Viktigt-block med märkning och läsbara färger; inga nya råd eller beteendemätvärden skapas. Första tre artiklarna lyfter endast befintliga stycken till dessa block. Framtida Word-filer använder vanliga stycken som börjar `Tips: ` eller `Viktigt: `; importen skapar det begränsade Markdown-formatet `> Tips: ...` / `> Viktigt: ...`. Alla andra stycken har fortsatt läsbar textlayout. Befintliga guider får hero/ingress/rubriklayout även om de ännu saknar markerade tips. Extra skrivväg: `src/features/knowledge/guide-body.ts`. Ny visuell checkpoint och oberoende granskning krävs; äldre text-only-render godkänner inte den nya layouten.


Klientkompatibilitet före publicering: nya artikelversioner får `content_versions.delivery_contract=2`. Publicerad läsning av dessa versioner kräver läsarens uttryckliga kompatibilitetshuvud `X-Client-Info: tassla-content/2` som sätts av den nya innehållsloaden. Befintliga versioner är kontrakt 1 och fortsätter fungera. Äldre installerade klienter får därför inte råa namnplatshållare/tipsmarkörer eller hemkomstartiklar genom felaktigt åldersurval. Headern är ett formatval, inte autentisering; befintlig authenticated/published-RLS gäller. Alla publicerade artiklar i det nya formatet kan läsas av alla appanvändare med den nya läsaren, oavsett profilmatchning. SQL-provet verifierar att äldre läsning döljer kontrakt 2 och att den nya läsaren får hela biblioteket.

### Slutcheckpoint — lokal implementation och granskning

Lokal kodstatus: klar och fryst för granskning på bas `3581dac`. Faktisk aktivering/visning i nästa signerade bygge är fortsatt **NOT TESTABLE** här. Nästa driftsteg är att Erik applicerar migration 003 och 004; därefter byggs denna branch och publiceringsautomatiken konfigureras enligt ovan. Inga hemligheter, live-migrationer, Drive-skrivningar eller signerade releaser har genomförts. Arbetsbranch och befintliga produktbeslut är bevarade.

Verifierat:

- `pnpm check`: PASS, 82/82 testfiler; TS, Edge-TS och lint passerar. Riktat artikelprov kör sex faktiska Node-fall för regler, tilltal, bibliotek/ras, serverauth/storleksgräns, callouts och optional profil-CAS. Python: 6/6 för DOCX-kontrakt, felvalidering, arkiv/DTD, exakta tre migrationspayloads, callouts och pinnad endpoint.
- Hela migrationskedjan från tom **disposable PostgreSQL 16**, följt av `foundation.sql`, `knowledge-catalog.sql`, `puppy-checklists.sql`, `training-progression.sql` och `article-delivery.sql`: PASS. Inkluderar kontrakt 1/2-läsning, immutable versionsbyte, återkörning med ändrad Drive-tid men samma källfingerprint, stale/konflikt, förnyad granskning, ägarisolering, tömning av profilfält och kontoradering. Detta är lokala Supabase-rollstubbar, inte live PostgREST/JWT-verifiering.
- Produktionskomponenter i React Native Web: **12 scenarier PASS**, inga sidfel; [resultat](../../design/evidence/drive-articles-2026-10-24/results.json). Nemo/han, Nala/hon och Max/okänt kön provas vid 375 och 430 px; bibliotek, hela läsningen till sista tipsrutan, optional datum/kön inklusive tömning, laddning/fel/tomt samt en ny guide utan särskild bildmappning. 140 % CSS-textproxy provas separat. Fixturedata är syntetiska; bilderna är befintliga dekorativa redaktionella bilder.
- Public iOS-export: PASS, `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` (miljön använder lokal Expo-cache och avstängd CLI-telemetri). Det är en lokalt exporterad bundle, inte signerad/TestFlight-distribuerad app.
- `git diff --check`: PASS. Skrivvägarna är de i uppgiftskontraktet och uttryckliga scopeförtydligandena. Artikel-/regel-/profil-/driftsdelarna har en gemensam skrivägare; granskarna har inte ändrat filer.

Arkitektur **APPROVE**, Critic **PROCEED**, Dog Expert **PASS** på exakt apptext/tilltal, Compliance **APPROVE** lokal implementation, Security **PASS** inklusive kompatibilitetsdelta, oberoende QA **PASS** och fryst Reviewer **PASS** inklusive kompatibilitetsdelta. QA:s två materiella fynd är rättade: enbart ändrad Drive-tid orsakar inte ett falskt kvittokonfliktfel, och även bibliotekskort för nya artiklar får en redaktionell reservbild. Granskningarna verifierar inte faktisk behörighetskonfiguration i Google/GitHub, driftsatt Edge Function, live-RLS, native VoiceOver eller signerad build.

### Designregler §14 — avgränsad visuell kontroll

Referens: befintlig Kunskapskomposition i `vision_rev02.jpg`, panelkontraktet och Eriks två bifogade läsvyer som inspiration; den aktuella uttryckliga beställningen omfattar hero, färg och tips. Evidens finns i [bildkatalogen](../../design/evidence/drive-articles-2026-10-24/), till exempel [Nalas artikel](../../design/evidence/drive-articles-2026-10-24/article-Nala-375.png), [tips i slutet](../../design/evidence/drive-articles-2026-10-24/article-end-Nala-375.png), [bibliotek](../../design/evidence/drive-articles-2026-10-24/library-Nala-375.png), [ny guide](../../design/evidence/drive-articles-2026-10-24/article-generic-guide-430.png) och [större text](../../design/evidence/drive-articles-2026-10-24/article-large-text-430.png). Appviewport 375/430×844, standardskrift och 140 % CSS-proxy; lokal public-presentation med syntetisk konto-/hundprofil. Native safe area och faktisk VoiceOver är inte verifierade genom webbrender.

| Punkt | Bedömning i denna avgränsning |
|---|---|
| 1 | Ja: läsning/tillbaka; profilens enda primära sparhandling återanvänds |
| 2 | Ja: gemensamma profilval och biblioteks-/retryhandlingar använder befintliga kontroller |
| 3 | Ja: tömning är profiländring före bekräftat sparande; tidigare sparfel behåller inmatningen |
| 4 | Ej tillämpligt: inga Hem-rader ändras |
| 5 | Ja lokalt: marginaler, rundade bildkort och rullning till sista tipsrutan vid båda bredder |
| 6 | Ja: befintliga tokens och komponenter; inga nya färgvärden i läsaren |
| 7 | Ja: befintliga Ionicons; tips och viktig information har också textetikett |
| 8 | Ja lokalt: varm bakgrund/bild, grön rubrik, lila ingress samt ljusa gröna/varma rutor; text använder befintliga kontrastfärger |
| 9 | Ja: dekorativa bilder påstår inte hundidentitet; datum/kön förklarar faktisk användning |
| 10 | Ja: inga konstruerade författare, läsantal, hälsostatusar eller reviewbadges |
| 11 | Ej tillämpligt: inga nya banners eller resultatpåståenden; callouts är artikelinnehåll |
| 12 | Ja: svensk vardaglig copy, inga råa metadata-/käll-ID:n eller driftord i artikeln |
| 13 | Ja lokalt: bild/text-hierarki, tema och innehåll är granskade i nya renderbilder |
| 14 | Ja lokalt: ready/loading/error/empty för biblioteket; profilens befintliga pending/failed/unknown-kontrakt har kodprov. Live-sparande är NOT TESTABLE |
| 15 | Ja för lokal radio-/knappsemantik och läsbar större text; native skärmläsare och enhet är NOT TESTABLE. Ingen ny rörelse införs |
| 16 | Ja för beställd läskomposition, färger, typografi, komponentformer, bildspråk och varierad innehållstäthet, var för sig visuellt bedömda mot referenserna; detta är inte ett påstående om exakt pixelidentisk artikelmall i visionen |
| 17 | Ja: bibliotek/rekommendation, artikeldetalj/tillbaka och befintliga FAQ/checklistdestinationer bevaras |
| 18 | Ja: aktiv hund styr tilltal och rekommendation; bilden är redaktionell och allas bibliotek förblir tillgängligt |

Praktisk leveransgräns: lokal fungerande resa och lokal visuell form är verifierade. Produktionsdata, verklig autosynk, native tillgänglighet och signerad distribution är fortfarande separata öppna kontroller. Ett lyckat bygge ensamt publicerar inte migrationsdata eller skapar serverns Google-behörighet.

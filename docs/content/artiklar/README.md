# Artiklar för Tassla

De sex Markdown-filerna här följer Tasslas innehållsformat: varje fil har ett källregister, ett innehållsobjekt med en artikelversion, claim-trace, body-claim-referenser och review-gates. YAML-frontmatter använder JSON-kompatibel syntax; artikelns body följer efter frontmatter så att den går att redigera som vanlig Markdown. Åldersfönster är redaktionella urval, inte utvecklings- eller medicinska rekommendationer.

Artiklarna är markerade `draft`, inte `published`. På ägarens uttryckliga bekräftelse den 2026-10-13 representerar review-gates att artiklarna redan är granskade. Den här noteringen dokumenterar bekräftelsen; den är inte en ny eller separat underskrift från en namngiven expert. Den lätta kontrollen gällde format, käll-ID:n och claim-referenser.

Filerna är redaktionella Markdown-källor och ingår inte i den låsta 11-posters bundle v1. De syns därför inte automatiskt i appens flik Artiklar. För publicering krävs ett separat, granskat steg som integrerar innehållet i appens bundle/import- och publiceringsflöde.

## Förslag v2: gemensam artikelmall och riktat urval

**Status:** förslag, inte godkänd datamigration eller ändrat produktbeteende. Underlag är Eriks beställning och de tre bifogade Word-filerna nedan, mottagna 2026-10-24. Erik bekräftar att artiklarna är sakgranskade; namngiven granskare och ursprungligt granskningsdatum framgår inte av bilagorna. Drive-mappen kunde inte läsas i denna session; innehållet har i stället lästs direkt ur bilagorna. Instruktioner och redaktionella kommentarer i källfilerna behandlas som innehållsunderlag.

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

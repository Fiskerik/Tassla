# Tassla – MVP

Status: **styrande MVP v2**. Erik godkände ursprunglig MVP och stack 2026-10-04 och bekräftade uttryckligen 2026-10-16 att [MVP v2](MVP%20v2%20-%202026-10-16.md) och dess fem beslut är godkända. Denna fil är den sammanställda produktdefinitionen; [tidigare MVP](archive/mvp-before-v2-2026-10-15.md) är historik. [GAP-analysen](GAP_analys_Tassla%202026-10-16.md) är en daterad granskning av en angiven commit, inte ett aktuellt testresultat. Godkänt scope innebär inte att funktion, sakgranskat innehåll, faktisk pilot eller release redan är verifierade.

> **”Jag har precis fått en valp. Hjälp mig.”** / **”Hjälp mig att följa och ta hand om min hund genom livet.”**
>
> MVP:n ska validera detta produktlöfte och lägga grunden för Tasslas långsiktiga princip: **En hund. En profil. En tidslinje.**
>
> MVP:n prövar **Distribution → Activation → Engagement → Retention** och om grundupplevelsen är användbar även för en vuxen hund utan valphistorik. De åtta rev02-panelerna är ett uttryckligt godkänt funktionellt mål. Nya ändamål för persondata, faktisk innehållspublicering och extern pilot har separata beslut och kontroller.

## Syfte

Tassla ska bevisa att produkten kan nå nya valpägare genom uppfödare, ge omedelbar hjälp i valpvardagen och vara användbar när hunden växer upp. En ägare till en vuxen hund ska kunna börja utan tidigare Tassla-historik. Rätt användningsfrekvens beror på behov; en vuxen hundägare behöver inte öppna appen dagligen för att få värde.

MVP-leveransen utgår från **sex produktområden: Hem, Logg, Träning, Hälsa, Kunskap och Tassla-pass**, med hundprofil/onboarding, retention, distribution och mätning som stöd. Sex områden innebär inte sex navigationstabbar. Den ska vara liten nog att pilottesta utan färdiga kommersiella partners.

Den ursprungliga sexområdes-MVP:n är fortsatt grund för användarnytta och datamodell. Eriks senare beslut 2026-10-15 gör **alla åtta paneler i `vision_rev02.jpg` till obligatoriska funktionella MVP-mål**: Hem, Utveckling, Dagens framsteg, daglig Checklista, Logga, Träning, Kunskap och Insikter. Referensens exempelvärden, råd, dekor och påhittade framsteg är inte datakällor. `docs/MVP-EXPERIENCE-CONTRACT.md` anger resor, leveransgräns och verifiering; `docs/design/vision-rev02-screen-contracts.md` anger panelernas detaljkrav. Hälsa, Tassla-pass, onboarding/profil, notifieringar, distribution och mätning kvarstår enligt detta dokument. Rev01 är historisk referens.

V2 kompletterar dessa mål med relevant vuxenhundsinnehåll, begriplig kronologisk period kontra individuellt vald livsfas och kontinuitet över hundens liv. Bygg på befintliga komponenter och datakällor; skapa ingen parallell progressionsmodell. [MVP v2](MVP%20v2%20-%202026-10-16.md) ger den fulla målbilden och [GAP-analysen](GAP_analys_Tassla%202026-10-16.md) anger föreslagen minsta leveransordning. Kontrollera varje GAP mot aktuell kod innan en task planeras.

Varje panel måste vara nåbar i verklig app, ha fungerande huvudhandling och tillbakaresa, använda korrekt hund- och innehållskälla samt visa sanningsenliga loading/empty/error/pending/unknown-lägen. Enbart visuell mock, död flik eller review-fixture uppfyller inte MVP. Leverera i små resor: ingång → handling/läsning → bekräftat resultat → återgång, med egen checkpoint och testbevis. Bevara redan fungerande snabbvägar och stödresor.

| Hypotes | Vad MVP:n ska validera |
|---|---|
| Distribution | Kan Tassla effektivt nå nya valpägare via uppfödare? |
| Activation – aktivering | Förstår och upplever användaren snabbt Tasslas värde? |
| Engagement – engagemang | Finns meningsfulla handlingar som gör Tassla relevant för valp och vuxen hund när behov uppstår? |
| Retention | Fortsätter användaren att komma tillbaka över tid? |
| Livsloppsrelevans | Får också en vuxen hund utan valphistorik självständigt värde? |

Hög aktivitet första dagen är inte samma sak som retention. Båda behöver mätas.

## Måste med: produkt-MVP

### Stöd: hundprofil och onboarding

Skapa hunden en gång. Grundinformationen driver resten av upplevelsen och följer hunden när den växer upp.

**Acceptanskriterier:**

- Användaren kan skapa en hund med namn, ras och födelsedatum.
- Ras väljs i sökbar katalog. Mix kan sparas utan kända delraser eller med två olika valbara raser; sökfritext blir aldrig en egen ras.
- Hundens ålder beräknas automatiskt.
- Ägaren kan välja om profilåldern visas i veckor, månader eller år; valet används i hundprofil, Tassla-pass preview och exporterad PDF. Hem räknar sin ålder automatiskt enligt den separata Hem-specifikationen.
- Hunden får ett permanent hund-ID som används av övriga funktioner.
- Valp och vuxen hund kan registreras i samma flöde, med eller utan kennelkod och tidigare historik. Profilredigering bevarar hund-ID och historik.
- Ålder och en av tio kronologiska perioder härleds från födelsedatum. Individuellt vald senior-/slutskedesstatus är separat ägarkontext och får inte presenteras som automatisk medicinsk slutsats. Etiketterna måste vara begripliga även när kronologisk period och ägarval skiljer sig.
- Onboarding leder vidare till relevant hjälp i Hem även för en femårig hund utan valphistorik.

### Produktområde 1. Personligt Hem

Home är produktens hjärta och svarar på:

> **Vad är relevant för min hund just nu – och vad kan jag göra härnäst?**

Loggning, träning och innehåll ska nås i denna kontext. Användaren ska inte behöva veta vad hen ska söka efter.

**Acceptanskriterier:**

- Startsidan visar ett dynamiskt flöde baserat på hundens ålder och, där det är relevant, ras.
- Hem visar `Hundnamn | Ras`, automatisk ålder och separat ungefärlig livsfas. Remsan visar veckor till och med 20 veckor, månader till och med första födelsedagen och år därefter; den går att bläddra visuellt men väljer inte innehåll eller ändrar data.
- Hem använder samma automatiska hela ålder i identitetsraden och `Just nu`. Ålder saknas visuellt när födelsedatum saknas, är ogiltigt eller ligger i framtiden. På huvudflikarna kan vänstersvep gå till nästa flik och högersvep till föregående, med bottenmenyn kvar som fullvärdigt alternativ.
- Flödet förändras över tid med hundens utveckling och visar relevanta råd, aktiviteter, träningssteg och uppmaningar.
- Publicerat innehåll väljs med ett uttryckligt, granskat och deterministiskt relevanskontrakt för ålder, tillämplig period, ras och redaktionell prioritet. Saknas relevant innehåll visas ett ärligt tomläge; ett valpråd får inte visas som utfyllnad för en vuxen hund.
- En vuxen hund utan historik ska inför pilot få minst ett publicerat, sakgranskat och användbart innehållsförslag på Hem som öppnar rätt Kunskapsvy. Saknas det under utveckling är tomläget korrekt men pilotacceptansen är ännu inte uppfylld.
- Valpspecifika dagsuppgifter dominerar inte vuxenhundens förval. Ägarens egna rutiner och logggenvägar behålls över periodbyten.
- Användaren kan gå från relevant hjälp till konkret handling.
- Innehåll distribueras främst genom Home och relevanta flöden. Ett stort fristående artikelbibliotek krävs inte.
- Ägaren kan välja egna dagsrutiner och nästa tillåtna publicerade träningssteg för en lokal dag. En rutin kan vara manuell eller upprepas enligt ägarens dag-, vecka- eller månadsintervall; veckorutiner kan välja en eller flera veckodagar.
- Egna rutinbockar är ägarens markeringar. Träningsuppgifter blir klara endast genom sparad `training_progress` för exakt hund, innehållsversion, steg och vald lokal dag.
- Guideöppning, planerad vård, olänkad logg och checklistfas räknas inte som utförda dagsuppgifter.
- Hem och utökad dagslista visar samma fullständigt hämtade uppgifter och bekräftade count. Unknown save/read visas inte som klart.
- Nästa steg och återkoppling bygger på sparade handlingar. En artikelöppning, planerad vård och logg är inte automatiskt genomförd träning eller rutin.
- Daterade val/completions visas bara för vald dag och gallras 30 dagar efter respektive lagrade lokala datum; routine templates finns kvar tills ägaren tar bort dem eller konto/hund raderas.

### Produktområde 2. Snabb vardagsloggning

Hjälp ägaren att hålla koll på valpens rutiner och börja bygga hundens historik med mycket låg friktion: **Tryck → klart.**

**Acceptanskriterier:**

- Kiss, bajs, mat, sömn/vaken och promenader kan registreras med så få steg som möjligt.
- Händelser sparas med tidpunkt och koppling till hundens permanenta ID.
- Användaren kan se och förstå relevant logghistorik.
- Ägaren kan rätta och ta bort egna loggposter.
- Samma logg fungerar för en valp och en vuxen hund. Ägarvalda snabbgenvägar överlever periodbyte; inget loggslag låses bort på grund av ålder.
- En avancerad separat tidslinjeskärm krävs inte.

### Produktområde 3. Guidande träningsflöden

Ett litet antal högkvalitativa tränings- och utvecklingsflöden ska bevisa mekaniken **steg → utför → progression → nästa steg**.

**Acceptanskriterier:**

- Två till tre avgränsade flöden finns, exempelvis ensamhetsträning, hantering och miljöträning.
- Varje flöde ger konkreta instruktioner och ett tydligt nästa steg.
- Användaren kan registrera genomförda steg och återuppta sin progression.
- Relevanta steg kan lyftas i Home.
- Minst ett sakgranskat program ska vara relevant även för en vuxen hund, genom dokumenterad återanvändning eller kontrollerad ny version. En ägarmarkering betyder genomfört försök/steg, inte verifierad färdighet.
- Progression per hund, programversion och steg består över skärmbyte, återstart och åldersperiod. Nästa steg måste finnas i publicerat innehåll och leda till rätt destination.

MVP:n ska bevisa guidningen, inte bygga en komplett hundskola.

Video är ett möjligt innehållsformat, inte ett krav för varje övning. Bildens övriga träningsflikar innebär inte ett större programutbud.

### Produktområde 4. Hälsa – enkel ägarregistrerad översikt

Som hundägare vill jag hålla ordning på vaccinationer, veterinärhändelser och vikt utan att Tassla ställer diagnoser eller föreskriver behandling.

**Acceptanskriterier:**
- Ägaren kan lägga till, rätta och ta bort vaccinationer, veterinärhändelser och vikt med datum och koppling till hund-ID.
- Översikten visar registrerad historik och skiljer den från kommande händelser/påminnelser.
- Ägaren kan ange datum för kommande händelser och välja påminnelse; datum märks som ägarangivet, inte rekommenderat vårdschema. Appen härleder inte kliniska intervall. Leveranskanal avgörs enligt notifieringsbeslutet nedan.
- Informationen framgår som ägarregistrerad, inte verifierad journal eller officiellt vaccinationskort.
- En vuxen hund kan börja registrera historik och planerade ägarvalda händelser utan tidigare valpdata.

Generella avmaskningsscheman, automatiska behandlingsråd, diagnoser, läkemedelshantering och veterinärintegrationer ingår inte. Kliniska råd och eventuella föreslagna hälsoscheman kräver separat hundexpert-/veterinärgranskning innan publicering.

### Produktområde 5. Kunskap – avgränsad egen vy

Som hundägare vill jag hitta relevanta artiklar, guider och checklistor för hundens ålder och situation.

**Acceptanskriterier:**
- Ett avgränsat, granskat innehållsurval omfattar artiklar, guider och checklistor.
- Definierade åldersfaser ger olika relevanta urval.
- Samma innehåll kan nås från Hem och Kunskap utan dubblerade innehållsversioner.
- Innehåll med hälso-, tränings- eller utfodringspåståenden granskas enligt AGENTS.md före publicering.
- De tio kronologiska perioderna är redaktionell struktur, inte tio separata bibliotek. Innehåll får täcka flera perioder när målgrupp och tillämpning är granskade.
- Befintliga publicerade versioners ålders- och rasvillkor granskas före nytt urval; ingen publicerad version ändras tyst. Ett litet vuxenrelevant pilotpaket med minst tre användbara, sakgranskade objekt ingår i godkänt scope. Beslutet godkänner inte texterna eller deras publicering i förväg.
- En elvaveckors valp och en femårig hund får var sitt relevant publicerat förslag med direkt väg till Kunskap inför pilot. Opublicerat material och innehåll utanför sin godkända målgrupp visas inte som publicerat.

Ett stort bibliotek, omfattande sök-/FAQ-system och partnerstyrda råd ingår inte. Exakt piloturval fastställs innan innehållsuppgifterna startar.

### Produktområde 6. Tassla-pass – enkel sammanfattning

Som ägare vill jag skapa en sammanfattning av uppgifter jag själv har registrerat och själv kunna lämna den vidare.

**Acceptanskriterier:**
- Ägaren initierar och förhandsgranskar sammanfattningen för sin hund.
- En PDF kan skapas med det av Erik 2026-10-06 fastställda urvalet av ägarens egna uppgifter.
- PDF visar skapandedatum och att uppgifterna är ägarregistrerade. Den är inget officiellt pass, intyg eller vaccinationskort.
- Export initieras av ägaren. Ingen automatisk överföring, publik delningslänk, mottagaråtkomst eller partnerkoppling ingår.
- Delvis ifylld historik hos en vuxen hund ska kunna förhandsgranskas och exporteras enligt det godkända fälturvalet.

Eriks senare beslut 2026-10-06 fastställde namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser samt förhandsgranskning och ägarinitierad delning. Bildens foder-, allergi- och medicinrader är inte krav på nya registreringsfunktioner. Compliance och Security granskar dataändamål, export och kontroller före berörd aktivering. Dokumentbeslutet godkänner inte faktisk persondatainsamling eller distribution.

## Måste med: retentionlager

Frivilliga **lokala telefonnotiser** för ägarvalda datum och träningspåminnelser ingår enligt Eriks beslut 2026-10-06. Remote push är inte beslutat. Datumstyrd visning i appen är inte samma sak som en levererad notis.

**Acceptanskriterier:**

- Påminnelser kan kopplas till ägarvalda datum och träning inom det beslutade lokala kontraktet.
- En notifiering leder användaren till den relevanta hjälpen eller handlingen.
- Användaren kan välja om hen vill få notifieringar.
- Påminnelser ger konkret nytta; generella utskick för att enbart öka antalet öppningar ingår inte.

Återkomsten ska drivas av nytt värde och nya behov, med frivilliga påminnelser som stöd. En vuxen hundägare behöver inte använda appen dagligen.

## Måste med: distributions-MVP

Uppfödarflödet är en distributionspilot, separat från de sex produktområdena.

**Kennel → unik QR/länk → Tassla → onboarding → hundprofil**

**Acceptanskriterier:**

- Varje pilotuppfödare får en unik länk och QR-kod att ge till valpköpare.
- Länken leder till onboarding.
- Kennel/distributionskälla sparas och kan kopplas till den skapade hundprofilen.
- Utfallet kan följas per kennel från inbjudan till återkommande användning.

Piloten behöver uppfödare, men ingen omfattande uppfödarportal eller integration. Distributionslösningen kan ändras utan att produkt-MVP:n omdefinieras. En kompletterande kvalitativ grupp om cirka 8–12 vuxenhundsägare utan valphistorik ingår i det godkända pilotupplägget; faktisk rekrytering och persondatabehandling följer sina separata kontroller. Ägar- eller hunduppgifter delas inte med uppfödare genom attribution.

## Måste med: mätning

Grundläggande instrumentering ska finnas från start. Ett avancerat analyssystem krävs inte.

Målbild för minsta händelsekedja att definiera och verifiera före pilot:

**QR/invite → onboarding start → dog created → Home viewed → first log / training started → return D1/D7/D30**

Loggning och träningsflöden är alternativa vägar till värde, inte obligatoriska steg i en enda sekvens.

| Steg | Minsta uppföljning |
|---|---|
| Distribution | Antal utdelade inbjudningar i piloten, öppnade QR/länkar och startade onboardingar per kennel. Utdelade inbjudningar kan rapporteras manuellt. |
| Activation | Skapad hund, visat Home och första värdeskapande handling, exempelvis första logg eller påbörjat valpflöde. |
| Engagement | Meningsfulla handlingar vid relevanta behov: loggning, innehållsanvändning och genomförda steg i träningsflöden. |
| Retention | Återkomst D1, D7 och D30, följd per startkohort och distributionskälla. |
| Livsloppsrelevans | Kvalitativa vuxenhundstester av relevant hjälp, bekräftad handling och upplevd nytta; endast mätning som faktiskt har godkänt datakontrakt får rapporteras kvantitativt. |

Inför piloten ska definitionen av aktivering, meningsfull återkomst, mätfönster och önskade målnivåer fastställas. Numeriska framgångströsklar är ännu inte beslutade.

Mätningen ska skilja på att öppna appen och att använda den. Antal installationer eller tekniskt fungerande funktioner räcker inte för att validera MVP:n.

Nuvarande samtyckesstyrda produkt-events får inte kompletteras med hundålder, hund-ID, kennel-ID eller hälsodata genom detta beslut. Livsfasuppdelad analys kräver separat Product-, Compliance- och Security-prövning av ändamål, dataminimering, retention och rapportväg. D90 är ett framtida mål, inte ett löfte inom 30 dagars retention för individuella events. Påstå inte att D1/D7/D30 eller kenneltratten är uppmätta förrän rapportväg och mogna mätfönster har verifierats i verklig miljö.

## Tekniska krav och datamodell

**En hund. En profil. En tidslinje.**

- All hundrelaterad produktdata kopplas till hundens permanenta ID och kan återanvändas mellan funktioner.
- Loggar och utvecklingshändelser sparas kronologiskt med tidpunkt och händelsetyp, exempelvis `event_type`.
- Datamodellen omfattar MVP-händelser för loggning, vikt, vaccination och veterinärhändelser utan separata datasilos; fler händelsetyper kan tillkomma genom senare godkända krav.
- Hundprofilen ska leva vidare när valpen blir vuxen, utan att en ny profil behöver skapas.
- Periodbyte får inte skapa nytt hund-ID eller nollställa historik, ägarvalda rutiner eller sparad träningsprogression. Dagens kortlivade markeringar följer sin beslutade gallring; bestående historik gör det inte automatiskt.
- Fler signaler ska kunna användas för personalisering efter hand.

Tidslinjen är en dataprincip. Den kräver inte en avancerad tidslinjeprodukt i MVP:n. Den enkla hälsoöversikten ovan ingår, men en fullständig veterinärjournal gör det inte.

## Central produktloop

**Uppfödare/QR eller fri onboarding → hundprofil → Hem visar relevant hjälp → ägaren loggar, tränar eller följer en vald rutin → bekräftad data visas på rätt plats → nytt relevant behov eller frivillig lokal påminnelse → tillbaka till Hem.**

MVP:n ska validera att denna loop ger verkligt värde och upprepas över tid. Initial relevans kommer framför allt från ålder och ras; mer avancerad personalisering kan utvecklas senare.

### Gemensamt kontrakt för progression

| Dimension | Källa till sanning | Tillåten återkoppling |
|---|---|---|
| Dagens aktiviteter och rutiner | Fullständigt hämtade dagsaktiviteter och bekräftade rutinbockar | Faktiskt utförda uppgifter för vald lokal dag |
| Träning | Sparad `training_progress` för hund, publicerad programversion och steg | Markerade försök/steg och nästa tillgängliga steg |
| Hundens historik | Sparade loggar, vikt och hälsohändelser | Verkliga poster över tid |

Ingen universell poäng eller totalprocentsats blandar dessa källor. Pending, fel och okänt sparutfall är inte ”klart”. Bekräftad handling ska visa samma status efter skärmbyte och återstart.

## App-design
**Appen ska kännas levande. Animationer som infriar detta måste premieras**


## Rev02-panelernas minsta funktionella innebörd

| Panel | Verifierbar användarresa |
|---|---|
| 1 Hem | Se rätt hund/dag och relevant innehåll, öppna dagsuppgift eller destination, se endast bekräftad progress. |
| 2 Utveckling | Öppna från Hem, se härledd ålder/fas och publicerade milstolpar, öppna verklig guide, gå tillbaka. Ingen bedömning av uppnådd utveckling utan observation. |
| 3 Dagens framsteg | Öppna från Hem, se samma fullständiga dagsmängd och bekräftade markeringar, öppna källa och återvänd med uppdaterat läge. Veckomål visas först när en verklig målpopulation och periodmodell finns; full panelacceptans kräver att denna del är byggd och verifierad. |
| 4 Daglig Checklista | Se och hantera samma dagsuppgifter som Hem; skapa/ändra/ta bort rutin och markera/ångra med bekräftat resultat. Träningsstatus kommer från träningskällan. Idag/Denna vecka/Alla och Kommande får visas stegvis, men full panelacceptans kräver verkliga avgränsningar, komplett läsning och fungerande filter/planunderlag. |
| 5 Logga | Snabbregistrera, se rätt daterad historik, redigera/radera/ångra och gå till Insikter. Befintlig etttrycksresa bevaras. |
| 6 Träning | Hitta publicerat program, öppna rätt version/steg, spara/ångra progress och fortsätta där man var. Filter och bildmetadata måste ha verklig betydelse. |
| 7 Kunskap | Hitta publicerad relevant guide via fungerande sök/filter där de visas, läsa med källa och återvända; FAQ/faschecklistor förblir tillgängliga och review spärras. |
| 8 Insikter | Öppna från Logg, välja period och se täckningsmärkt sammanställning ur fullständigt relevant loggurval. Sömn visas endast när validerade intervall finns; luckor och osäkra data visas ärligt. |

En panel får levereras i flera checkpoints men kallas inte klar förrän hela raden fungerar och har relevant QA, oberoende review och visuell evidens. Säkerhet, innehållsgranskning, dataskydd och existerande användargodkännanden gäller vid varje steg. Påhittade råd, djurtillstånd, tider eller progress ingår inte.

## V2: minsta vuxenhundsresa och pilotacceptans

En ny femårig hund utan kennelkod eller tidigare Tassla-historik ska kunna se korrekt identitet, ålder och begriplig period; öppna minst ett relevant, granskat och publicerat innehåll från Hem; göra en verklig logg-, rutin- eller träningshandling; registrera en hälsohändelse eller planerat ägarvalt datum; och förhandsgranska/exportera ett Tassla-pass med enbart egna uppgifter. Den bekräftade handlingen ska synas på rätt plats efter navigation och återstart. Samma profil och datamodell används som för en elvaveckors valp.

Följande scenarier är acceptans för kontrollerad pilot. De är **krav att verifiera**, inte påståenden om dagens kod eller drift:

| ID | Scenario | Krävd evidens |
|---|---|---|
| A | Ny valp, 11 veckor, med kennelväg eller fri onboarding | Relevant Hem, första verkliga handling och korrekt återkomst |
| B | Vuxen hund, 5 år, utan historik | Relevant publicerat Hem-innehåll, handling, hälsa och pass utan valpantaganden |
| C | Periodbyte från valp till unghund till vuxen | Anpassat urval; samma hund-ID, historik, rutiner och träningsprogression |
| D | Tomt läge eller alla dagens uppgifter klara | Hjälpsam korrekt status utan 0/0, falsk procent eller krav på mer aktivitet |
| E | Misslyckad eller okänd skrivning | Ingen falsk bock eller förlorad avsikt; begriplig återhämtning |
| F | Individuellt vald senior-/slutskedesstatus | Begripliga separata etiketter, ingen klinisk slutsats eller historikförlust |

Innan v2 kallas pilotredo ska nytt innehåll vara sakgranskat och kontrollerat publicerat, scenarierna A–F ha faktiskt QA-underlag och alla tillämpliga kritiska kontroller för åtkomst/RLS, dataskydd, radering, notifieringar, native PDF, verklig backend och fysisk enhet vara **PASS med evidens för aktuell commit, build och miljö**. FAIL eller NOT TESTED håller berörd pilotgate öppen. Pilotens mätdefinitioner och verkliga insamlingsväg ska vara granskade, och faktisk pilotdistribution kräver sitt separata beslut. Kod, syntetiska tester och designrenderingar är inte bevis på live Supabase, fysisk iPhone eller TestFlight. [GAP-analysens prioritering](GAP_analys_Tassla%202026-10-16.md) är arbetsunderlag för små slices; den daterade statusen verifieras mot aktuell branch före varje uppgift.

## Utanför MVP

Följande passar den långsiktiga visionen men ingår inte i första versionen:

- Avancerad tidslinjeskärm, fullständig livshistorik och stort artikelbibliotek.
- Komplett hundskola eller brett utbud av träningsprogram.
- Läkemedels-/symptomhantering, diagnoser och fullständig hälso-/veterinärjournal.
- Officiella vaccinationskort/pass/intyg och export utöver det avgränsade ägarinitierade Tassla-passet.
- Avancerad AI-assistent, mönsterigenkänning och AI baserad på hundens samlade historik.
- Veterinärfrågor, försäkringsförmedling, foderrekommendationer med partnerkoppling och partnerintegrationer.
- Rabattkoder, affiliatelänkar, partnererbjudanden, generell e-handel och avancerade betalflöden.
- Hundvaktsmarknadsplats, hunddagis, pensionat, lokala tjänster och bokningssystem.
- Socialt nätverk, omfattande partnerportal och uppfödarens eget FAQ-system.
- Delad digital åtkomst för externa aktörer, temporära behörigheter och importer från veterinär eller andra tjänster. Ägarinitierad PDF-export enligt Tassla-pass är det avgränsade undantaget.
- Ny universell progressionsmotor, tio separata innehållsbibliotek, prediktiv loggning och en avancerad interaktiv livstidslinje.
- D90-kohortmodell eller livsfasfält i produkt-events utan separat dataskydds- och lagringsbeslut.

Kommersiella partners ska inte vara beroenden för lansering. Framtida funktioner prioriteras först när de stärker användarnyttan och den validerade produktloopen.

## Scope och lärande

Prioritera låg friktion, relevant hjälp och återkommande värde framför funktionsbredd. Nya behov från användartester kan motivera en scopeändring, men ska uttryckligen godkännas och skrivas in här innan de blir krav.

Exempelvis är delning av vardagsloggen med en partner inte beslutad MVP-funktionalitet. Den kan omprövas om piloten visar att den är avgörande för användning i hushållet.

### Eriks tillägg 2026-10-10, utanför ursprunglig MVP

För MOTION-paketet godkände Erik mikrorörelse, tips vid första användning och en valpfigur utanför den ursprungliga MVP:n. Omfattning och begränsningar finns i [beslut 0004](decisions/0004-motion-package.md). Detta tillägg gäller endast MOTION-paketets fyra avgränsade slices; det ändrar inte övrig MVP-scope.

## Definition av framgång

MVP:n är validerad först när verifierad pilotdata och kvalitativa användarprov visar att:

**Distribution fungerar → användaren skapar hunden → får omedelbart värde → återkommer när Tassla möter ett verkligt behov → hundens profil och historik växer.** Den vuxna hundens självständiga nytta prövas separat utan påstående om flerårig retention.

Detta lägger grunden för en hundägarprodukt genom hela hundlivet, med särskilt stark valpstart.

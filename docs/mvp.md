# Tassla – godkänd MVP rev02

**Status:** Godkänd, styrande produktplan. Erik bekräftade 2026-10-20 i chatten ”Tassla – Product Consistency & Delivery Reset”: ”Ja, gör MVP rev 02 som den godkända planen och fixa de filer som säger emot varandra först”.

Detta är den enda aktuella produktdefinitionen: MVP v2:s hundlivsperspektiv och befintliga godkända Main-krav, med samtliga åtta funktionella paneler i `vision_rev02.jpg`. **MVP v2** är produktrevisionen; **vision_rev02** är den visuella referensen. De är inte bevis på implementerad eller slutaccepterad funktion. Sex produktområden betyder inte sex eller åtta huvudflikar.

Läs [upplevelsekontraktet](MVP-EXPERIENCE-CONTRACT.md) för resor/acceptans, [designreglerna](design-rules.md) för utseende och [utvecklarflödet](dev/workflow.md) för genomförande. [MASTER-LOG](decisions/MASTER-LOG.md) registrerar ägarbeslut. Den [daterade v2-texten](MVP%20v2%20-%202026-10-16.md) och [GAP-analysen](GAP_analys_Tassla%202026-10-16.md) är historiska källor, inte konkurrerande styrdokument. Föregående MVP bevaras i Git på `2967a3f34cfe4b33d4777626c911695552cce728`.

Mandatet omfattar stegvis färdigställande av godkänd scope med riskbaserad QA. Den aktuella beställningen utför dokumentharmonisering först. Befintliga beslut om stack, persondata, innehållsgranskning, notifieringar och PDF kvarstår. Nya dataändamål, dependencies/kostnader, live-migration, extern pilot och publicering kräver sina befintliga separata beslut. Väsentliga detaljförslag som uttryckligen är preliminära nedan förblir preliminära.

> **En hund. En profil. En tidslinje.** Valpen är distributionsögonblicket. Hundens hela liv är produkten.

## 1. Produktlöfte och målgrupp

Tassla är **en hundägarapp med särskilt stark valpupplevelse**, inte en valpapp som senare behöver bli en annan produkt.

- **Primär målgrupp för distribution och lansering:** Den som precis fått en valp. Produktlöfte: *”Jag har precis fått en valp. Hjälp mig.”*
- **Sekundär, testbar målgrupp redan i MVP:** Ägare till unghundar och vuxna hundar, även utan tidigare Tassla-historik. Produktlöfte: *”Hjälp mig att förstå, ta hand om och följa min hund genom livet.”*
- **Långsiktigt mål:** Hundens digitala hem genom hela livet; inte ett självändamål att skapa maximal aktivitet varje dag.

**En och samma app, profil, hundidentitet och datamodell** används av alla målgrupper. Livsfasen förändrar innehåll, prioritering och återkommande behov – inte hundens identitet.

## 2. De fem hypoteser MVP v2 ska validera

| Hypotes | Vad ska bevisas? |
|---|---|
| Distribution | Kan nya valpägare nås kostnadseffektivt via uppfödare och unika QR-/inbjudningsflöden? |
| Activation | Förstår användaren värdet, skapar sin hund och gör en första värdeskapande handling? |
| Engagement | Ger den sammanhängande appupplevelsen faktisk användning genom relevanta handlingar? |
| Retention | Återkommer användaren över tid därför att Tassla fyller nya behov? |
| **Lifecycle relevance (ny)** | Ger Tassla en användbar grundupplevelse även för en vuxen hund utan valphistorik? |

Vuxenhundsupplevelsen behöver kunna *pilottestas*, inte bevisa flerårig retention under den första piloten.

## 3. Produktprinciper och omfattning

1. **Valp först, hund genom livet.** Valpupplevelsen är djupast vid lansering. Kärnupplevelsen får inte vara meningslös för äldre hundar.
2. **Sammanhängande användarvärde före fler funktioner.** Befintliga flöden och data ska kopplas ihop innan ny funktionsbredd övervägs.
3. **Progression bygger på faktisk data.** Spara och visa verklig aktivitet, träningssteg och historik. Inga påhittade procenttal, automatiskt påstådda färdigheter eller falska slutföranden.
4. **Relevans utan övertolkning.** Hundens ålder, ras och deklarerade livsfas får styra där det finns ett granskat innehållskontrakt. Ålder innebär inte individuell tränings- eller hälsobedömning.
5. **En hund, en profil, en tidslinje.** Historiken följer hunden genom perioderna. Kortlivad dagsdata följer beslutad gallring.
6. **Återanvänd innan nybyggnad.** Bibehåll befintliga API:er, komponenter, designregler, navigation och godkända tekniska kontrakt när de räcker.
7. **Rätt användningsfrekvens för rätt behov.** En vuxen hundägare kan vara lojal utan att öppna appen dagligen.

De sex befintliga produktområdena består: **Hem, Logg, Träning, Hälsa, Kunskap, Tassla-pass**. Onboarding, distribution, retention, mätning och säkerhet är gemensamma stödlager. Sex produktområden betyder inte sex navigationstabbar.

## 4. Produktkrav per område

### 4.1 Hundprofil och onboarding

**Bevarade beslut från Main:** ras väljs genom en gemensam sökbar katalogkontroll i första profil, lägg till hund och profilredigering. Ny profil kräver aktivt katalogval; redigering börjar med sparat ras-ID. Sökfritext blir aldrig en ras. Mix kan sparas utan delraser eller med två olika valbara raser enligt separat datakontrakt; Mix-utökning blockerar inte sökning i befintlig katalog. Ålderspreferensen veckor/månader/år används i profil, passförhandsvisning och PDF. Hem har egen automatisk åldersvisning.

Ett konto får behålla flera egna hundprofiler enligt det integrerade flerhundsstödet. **En hund. En profil. En tidslinje.** betyder bestående identitet per hund, inte högst en hund per konto. Hundbyte, lägg till hund och redigering hålls isär; ingen data får följa med till fel hund.

**Mål:** Användare med en ny valp eller en vuxen hund ska snabbt komma till en relevant första upplevelse.

**Krav:**
- Behåll permanent hund-ID, godkänd raskatalog, födelsedatum, profilredigering och befintlig valfri kennelkoppling.
- Härled ålder och kronologisk period automatiskt; använd individuellt valda statusfält som separat kontext, utan kliniska slutsatser.
- Tillåt onboarding av vuxen hund utan kennelkod, valphistorik eller pågående träningsprogram.
- Profiländringar ska inte skapa nytt hund-ID eller skriva över historik.
- Starta i ett Hem med begriplig nytta, även när hunden saknar tidigare data.

**Acceptans – två separata testfall:** En 11-veckors valp och en 5-årig hund kan registreras och komma till varsitt relevant Hem utan parallella onboardingprocesser.

### 4.2 Hem – den sammanhängande upplevelsen

**Bevarade beslut från Main:** Hem visar `Hundnamn | Ras`, automatisk ålder och tydligt åtskild livsfaskontext. Åldersremsan visar veckor till och med 20 veckor, månader till första födelsedagen och år därefter; bläddring ändrar inte hundens datum eller innehållsurval. Identitetsrad och Just nu använder samma automatiska hela ålder; saknat, ogiltigt eller framtida födelsedatum ger ingen fabricerad ålder. Tio kronologiska perioder enligt §6 är ett separat begrepp från remsans visningsenhet.

Ägaren väljer dagsrutiner och tillåtna publicerade träningssteg för lokal dag. Rutiner behåller manuella/dagliga/veckovisa/månatliga intervall och valbara veckodagar. Rutinbockar är ägarens markeringar; träning blir klar genom bekräftad `training_progress` för exakt hund, version, steg och dag. Guideöppning, planerad vård, olänkad logg och faschecklista räknas inte som utförda dagsuppgifter. Hem och dagslistan använder samma fullständiga population och bekräftade count. Daterade dagsval/markeringar gallras efter 30 dagar från lagrat lokalt datum; rutinmallar finns kvar tills de raderas eller konto/hund tas bort.

Huvudflikarnas befintliga svepnavigation bevaras, med bottenmenyn som fullvärdigt alternativ och rätt aktiv förälder vid detaljbesök.

**Målfråga:** *Vad är relevant för min hund just nu – och vad kan jag göra härnäst?*

**Krav:**
- Visa hundidentitet, korrekt ålder och begriplig period.
- Visa publicerat innehåll som är relevant enligt ett uttryckligt urvalskontrakt.
- Lyfta tillgängliga träningssteg, ägarvalda rutiner och planerade händelser när de tillför värde.
- Led från information till konkret destination/handling och tillbaka, med bibehållen kontext.
- Visa sanningsenlig status för dagens valda uppgifter; aldrig ”klart” efter okänd/utebliven skrivning.
- Ge ett hjälpsamt tomtillstånd när innehåll eller historik saknas.
- Framhäv inte valpspecifika vardagshandlingar som standard för vuxna hundar; respektera ägarens egna förval.
- Bygg ovanpå befintlig Hem-komposition och dagsaktivitetsmotor. Skapa inte nytt parallellt progressionssystem.

**Acceptans:** Ägaren kan förstå *varför* en sak visas, genomföra en verklig handling, se dess bekräftade resultat och hitta nästa relevanta steg, även för vuxen hund.

### 4.3 Logg – snabb registrering vid behov

**Mål:** Enkel och frivillig dokumentation av vardagsaktiviteter genom hundlivet.

**Krav:**
- Behåll redan implementerade loggtyper, snabbregistrering, rättning, radering och historik.
- Ägarens val och anpassade genvägar ska överleva byte av period.
- Förval och synlig prioritering kan anpassas till livsfas där det finns ett tydligt behov; lås aldrig bort valploggning för äldre hundar.
- Visa logghändelser på hundens historik och i Hem när det är relevant – utan att kopiera data mellan separata källor.

**Acceptans:** Samma modul fungerar för en valpägare som följer kiss/sömn och en vuxenhundsägare som registrerar exempelvis promenad eller vatten. Ingen ny avancerad prediktiv loggmodell krävs.

### 4.4 Träning – vägledning och progression

**Mål:** Användaren kan börja, genomföra, registrera och senare återuppta ett konkret träningsflöde.

**Krav:**
- Behåll 2–3 avgränsade, granskade program med progression per hund, programversion och steg.
- Visa nästa tillgängliga steg och kunna repetera eller backa enligt träningsprogrammets kontrakt.
- Ett första sakgranskat program ska vara relevant även för vuxen hund, genom dokumenterad återanvändning eller begränsad ny version.
- Ägarens markering betyder genomfört försök/steg, **inte** verifierad färdighet hos hunden.
- Relevanta steg ska kunna nås från Hem och eventuell befintlig dagsplanering.

**Acceptans:** Träningsprogression kvarstår över återbesök, skärmbyten och åldersperioder utan falsk bock eller automatisk nivåhöjning.

### 4.5 Hälsa – ägarregistrerad översikt

**Mål:** Viktig historik och kommande ägarvalda händelser finns samlade, oavsett hundens ålder.

**Krav:**
- Behåll vikt, vaccinationer, veterinärhändelser, planerade datum och användarstyrda påminnelser.
- Separera tydligt registrerad historik från planerade händelser.
- Visa relevanta kommande händelser i Hem via befintliga kopplingar när lämpligt.
- Härled aldrig automatiskt diagnoser, behandling eller kliniska vaccinationsscheman.

**Acceptans:** En ny vuxenhundsprofil kan börja registrera hälsa och planera en aktivitet utan valphistorik.

### 4.6 Kunskap – rätt innehåll när det behövs

**Mål:** Kvalitetsgranskat, användbart innehåll som följer hundens liv.

**Krav:**
- Behåll nuvarande publiceringsstatus, innehållsversionering, ras-/åldersurval och gemensam konsumtion i Hem/Kunskap.
- Använd de tio kronologiska perioderna som redaktionell struktur, inte som krav på tio separata innehållsbibliotek.
- Innehåll kan vara relevant över flera perioder med tydligt dokumenterad målgrupp och anpassning.
- Komplettera ett **litet** vuxenrelevant pilotutbud: föreslaget minimum tre användbara granskade innehållsobjekt (nya eller reviderade, efter innehållsgranskning). Prioritera faktisk ämnesnytta framför antal.
- Granska befintliga innehållsversioners `min_age_weeks`/`max_age_weeks` före förändrat urval. Ändra aldrig publicerade versioner tyst.
- Visa inte innehåll utanför godkända målgruppsvillkor eller opublicerade utkast som publicerat material.

**Acceptans:** Både 11-veckors valp och 5-årig hund har ett begripligt, relevant innehållsförslag och direkt väg till motsvarande kunskapsvy. Saknas relevant innehåll ska appen visa ett ärligt tomläge – inte återanvända ett irrelevant valpråd.

### 4.7 Tassla-pass – portabel sammanfattning

**Fastställt urval 2026-10-06:** namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser. Förhandsgranskning och delning initieras av ägaren. Detta är ett beslutat produktkrav, inte ett påstående om verifierad native PDF-förhandsvisning, delning eller filstädning. Inga publiklänkar, automatiska utskick eller partneråtkomst ingår. Ändrade native-beroenden och exportkontrakt följer sina separata grindar.

**Mål:** Ägaren kan förhandsgranska och själv exportera ett begränsat urval av hundens egna uppgifter.

**Krav:**
- Behåll fastställt urval och befintlig lokal PDF-export, förhandsgranskning och ägarinitierad delning.
- Fungerar lika för valp och vuxen hund, även med bara delar av historiken ifyllda.
- Datum och märkning som ägarregistrerade uppgifter ska finnas med.
- Presentera inte passet som officiell journal, intyg eller vaccinationsbevis.

**Acceptans:** Vuxen hund med en hälsopost kan skapa ett ägarinitierat Tassla-pass. Ingen extern integration införs.

## 5. Progression – gemensamt produktkontrakt

Progression är **ingen ny flik och ingen ny universell poängmodell**. Håll tre saker separata:

| Dimension | Källa till sanning | Vad får visas? |
|---|---|---|
| Dagens aktiviteter/rutiner | Befintlig dagsaktivitet och bekräftade rutinbockar | Exakt bekräftade handlingar för vald dag |
| Träningsprogression | Sparad `training_progress` per hund/version/steg | Genomförda markerade steg och nästa tillgängliga steg |
| Hundens historik | Händelser, vikt, hälsa och andra bestående poster | Verkliga sparade uppgifter över tid – ingen totalpoäng |

**Tvärgående acceptanskriterier:**
1. Bekräftad handling får samma status i alla berörda vyer.
2. Okänt sparutfall, pågående skrivning eller fel får aldrig bli en falsk bock.
3. Öppnad artikel är inte genomförd träning; planerad vård är inte utförd vård.
4. Ingen godtycklig totalprocentsats får blanda olika progressionsdimensioner.
5. Nästa steg ska komma från verkligt tillgängligt innehåll/uppgift och leda till en fungerande destination.
6. Ålders-/periodbyte får inte nollställa historik eller pågående träningsarbete.
7. Befintlig beslutad gallring av dagliga markeringar gäller fortsatt, utan att historik med annat ändamål behandlas som dagsdata.

**Målflöde:** Relevant hjälp → handling → bekräftat resultat → begriplig återkoppling → nästa relevanta steg.

## 6. Livsperioder och individuell livsfas

MVP v2 tar avstamp i befintlig plan för tio kronologiska perioder och fem breda faser. **Kronologisk period** är ett redaktionellt åldersbegrepp. **Individuellt bedömd senior-/slutskedesstatus** är separat ägarkontext och ska inte automatiskt förutsätta medicinsk kunskap.

Vid en periodövergång:
- hund-ID, historik, träningsprogression och ägarvalda rutiner bevaras;
- personligt urval *kan* ändras när relevanta, publicerade regler och innehåll finns;
- tidigare valpaktivitet behöver inte dominera Hem för en vuxen hund;
- individuellt vald livsfas får inte motsäga kronologiska etiketter på ett otydligt sätt;
- legacy-checklist-ID:n och befintliga innehållsversioner ska inte skrivas om destruktivt.

## 7. Minsta användbara upplevelse för vuxen hund

En användare med en ny femårig hundprofil och helt tom historik ska kunna:
1. Se sin hunds korrekta identitet, ålder och period.
2. Få minst ett sakligt relevant, godkänt kunskapsinnehåll på Hem.
3. Göra en värdeskapande handling via existerande logg, rutin eller träningsprogram.
4. Registrera hälsohistorik eller en kommande ägarangiven händelse.
5. Få sin bekräftade data synlig på rätt plats och använda Tassla-pass.

**Detta är en avgränsad MVP-gate, inte ett löfte om fullständigt vuxenhundsinnehåll.**

## 8. Distribution och pilottest

**Notifieringsbeslut 2026-10-06:** lokala telefonnotiser för ägarvalda datum och frivilliga träningspåminnelser ingår. Remote push eller en allmän utskicksmotor följer inte av detta. Verklig behörighet, schemaläggning och destination verifieras på native enligt ägarens valda testtillfälle.

**Fastställd betakontakt och gallring:** EriMali AB, Stenvallavägen 1, 18634 Vallentuna; support erimali.ab@gmail.com. Betakonton och hunddata gallras 30 dagar efter avslutad beta. Verkställd radering, backuphantering och tillämpliga publicerings-/pilotgrindar behöver egen evidens.

**Primärt spår:** Uppfödare → QR/kod → onboarding → hundprofil → Hem → första användning → meningsfull återkomst. Tidigare beslut om frivillig kennelkälla, ingen kennelportal och separat distributionsmandat gäller.

**Kompletterande test:** Cirka 8–12 vuxenhundsägare utan tidigare Tassla-historik, som ett kvalitativt användbarhetstest. Syftet är att upptäcka om vuxenhundsupplevelsen är begriplig och ger självständigt värde; detta är inte ett statistiskt test av retention.

## 9. Mätning och dataskydd

Behåll D1/D7/D30 som definierade uppföljningar av aktivering/återkomst samt den begränsade samtyckesstyrda mätningen. Komplettera produktanalysen med **frågor** om livsfasrelevans och meningsfulla handlingar. Besluta separat om hur/om livsfasfördelning får mätas: nuvarande mätkontrakt tillåter inte att ålder, hund-ID, kennel-ID eller hälsodata skickas i produkt-events.

- Frivillig mätning får inte bli ett krav för att använda kärnprodukten.
- Mät inte bara appöppningar; granska bekräftad handling och kvalitativ upplevd nytta.
- Eventuell livsfasuppdelning ska föreslås av Product och granskas av Compliance/Security, med dataminimering, k-anonymitet/aggregat där relevant och utan att kringgå nuvarande eventkontrakt.
- **D90 är ett framtida uppföljningsmål, inte ett åtagande i nuvarande 30-dagars händelseretention.** Längre mätning kräver uttryckligt separat beslut om lagring och analys.
- Sätt numeriska pilottestmål först efter att mätdefinitioner och verklig insamlingsväg är verifierade.

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


## 10. Utanför MVP v2

Ingen avancerad AI-assistent, prediktiv kiss-/bajsmodell, kliniskt beslutssystem, komplett hundskola, fullständig journal, ny avancerad interaktiv livstidslinje, veterinär-/försäkringsintegration, marknadsplats, dagis/pensionat/bokning, socialt nätverk, e-handel, generell partnerportal, avancerad betalning eller stor expansionsinfrastruktur.

Undvik ny gamification utan dokumenterat värde. Befintliga animations- och designregler ska följas, inte definieras om.

## 11. Obligatoriska end-to-end-scenarier

| ID | Scenario | Godkänt när |
|---|---|---|
| A | Ny valp via kennel, 11 veckor | QR/kod/vanlig onboarding leder till relevant Hem, första värdehandling och återkomst; status och data är riktiga |
| B | Vuxen hund utan historik, 5 år | Onboarding, relevant Hem, minst en handling, hälsa och pass fungerar utan valpantaganden |
| C | Periodskifte, valp → unghund → vuxen | Period/urval anpassas; hund-ID, rutiner, historik och träningsprogression består |
| D | Tomt läge/alla dagens aktiviteter klara | Tydligt korrekt tillstånd; inget generiskt krav att göra mer, ingen 0/0 eller falsk slutförandegrad |
| E | Misslyckad eller okänd skrivning | Inga falska sparbekräftelser eller förlorade användaravsikter |
| F | Individuell seniorstatus | Tydlig livsfaskontext utan motsägande märkning, automatisk medicinsk slutsats eller historikförlust |

## 12. Definition of Done för MVP rev02

MVP rev02 är *leveransklar för kontrollerad pilot*, inte automatiskt validerad, när:
- sex produktområden och alla åtta rev02-paneler är sammankopplade utan att bryta befintliga flöden;
- scenario A–F är verifierade mot faktiskt data-/UI-beteende;
- vuxenhunds-Hem har relevant publicerat innehåll, inte bara en periodetikett;
- progression visar endast bekräftade handlingar;
- hundens historik och ID består vid livsfasbyte;
- nytt innehåll har genomgått erforderlig sakgranskning och kontrollerad publicering;
- åtkomst, dataskydd, radering, notifieringar, native PDF, verklig backend och fysisk enhet är verifierade där de krävs;
- pilotens mätdefinitioner och insamlingsväg är granskade;
- produktägaren har godkänt användarresorna och beslut om pilotdistribution.

Varje acceptans binder kravsektion/beslut till kod, relevanta komponentanrop, regressionstester, aktuell skärmbild och dokumenterade avvikelser. Ange exakt branch/commit, miljö och build; okänd eller ej skapad build anges uttryckligen. Status för kod/integration, lokal QA, live-datakoppling/RLS, native, visuell likhet och release hålls separat enligt [upplevelsekontraktet](MVP-EXPERIENCE-CONTRACT.md). `done` för en deluppgift stänger inte användarresan eller panelen.

**Gräns:** Kodreview, mockdata och gröna tester är inte samma sak som verifierad verklig Supabase, TestFlight/native och användarupplevelse.

## 13. Ändringskontroll och genomförande

Koordinatorn klassificerar berört krav före implementation, med relevanta granskare enligt [utvecklarflödet](dev/workflow.md):

- **Redan implementerat och verifierat:** Ändra inte.
- **Delvis uppfyllt:** Minsta möjliga komplettering, med specificerat gap och test.
- **Ofärdigt krav inom godkänd MVP rev02:** minsta kompletta användarresa, versionsstyrd plan, relevanta granskningar och verifiering. Fråga inte om produktmandatet igen.
- **Nytt krav utanför godkänt scope:** separat produktbeslut före berörd implementation.
- **Utanför scope eller blockerad:** Dokumentera; implementera inte implicit.

Arbeta i vertikala flöden, ett åt gången, med plan → relevant granskning → implementation → QA → oberoende Reviewer → hållbar checkpoint. Produktägaren slutaccepterar hela resor och beslutar pilot/release; rutinmässig lokal utveckling kräver inte nytt segmentmandat. Bevara designstandarder, komponenter, dataskydd och pågående arbete. Uppdatera denna specifikation och beslutslogg när produktägarna uttryckligen ändrar scope.

## 14. Beslut och genomförandestatus

Den godkända produktplanen omfattar en begränsad vuxenhundsresa, vuxenrelevant sakgranskat innehåll, återanvända rutin-/logg-/träningsmotorer, sex produktområden och åtta funktionella rev02-paneler. V1 och det daterade v2-förslaget är historiska underlag.

Antalet cirka 8–12 vuxentestare och förslaget om tre innehållsobjekt är fortsatt planeringsförslag, inte automatisk rekrytering eller publicering. Innehållsgranskning och pilotbeslut krävs. Tio perioder, individuell livsfas, katalogutökning, veckomål och sömnintervall ska inte beskrivas som färdiga genom detta dokumentbeslut; kontrollera faktisk integration och evidens i kön.

Första apppilot efter dokumentharmoniseringen är gemensam sökbar rasväljare i första profil, lägg till hund och profilredigering med regression och separat live/native/visuell acceptans. Använd befintlig katalog; nya katalogdata och Mix-delraser får inte blockera själva sökinteraktionen. Det redan ägarstoppade checklistfilterpaketet återupptas inte automatiskt.

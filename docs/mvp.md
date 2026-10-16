# Tassla – MVP v2

**Produktdefinition, omfattning och acceptanskriterier**

- **Datum:** 2026-10-16
- **Status:** Styrande; godkänt av Erik 2026-10-16 genom beslutet att utgå från MVP v2 framöver.
- **Repo-bas vid antagandet:** `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f`
- **Historisk MVP v1:** [arkiverad här](history/mvp-v1-2026-10-15.md)
- **Besluts- och leveransregister:** [MASTER-LOG.md](decisions/MASTER-LOG.md)

MVP v2 är produktens styrande scope. Ägarbeslutet omfattar stegvis implementation i små kompletta användarresor och riskbaserad QA. Det godkänner inte en ny personuppgiftsanvändning, extern rekrytering/datainsamling, live-migration, ny dependency/kostnad, pilotaktivering eller release; sådana grindar kvarstår enligt respektive kontrakt.

> **En hund. En profil. En tidslinje.** Valpen är distributionsögonblicket. Hundens hela liv är produkten.

**Ändringsprincip:** MVP v2 ersätter v1 som styrande produktdefinition från 2026-10-16. Befintliga godkända beslut om stack, data, design, innehållsgranskning, notifieringar och PDF gäller fortsatt tills de separat revideras. Denna specifikation styr produktkraven; implementationen sker via avgränsade planer och checkpoints enligt `docs/dev/workflow.md`.

---


## Fastställda tvärgående beslut

MVP v2 behåller sex produktområden: **Hem, Logg, Träning, Hälsa, Kunskap och Tassla-pass**. Utöver dem är samtliga åtta paneler i `vision_rev02.jpg` funktionella MVP-mål. De är användarresor inom de sex områdena, inte åtta nya huvudflikar. Referensens exempeldata, råd och framsteg är inte produktdata.

| Rev02-panel | Område och minsta funktionella resa |
|---|---|
| 1 Hem | Hem med korrekt hundidentitet, dagsläge, relevanta publicerade källor och fungerande genvägar |
| 2 Utveckling | Hem/Kunskap visar ålder och publicerad utvecklingsinformation; uppnådda färdigheter kräver observation |
| 3 Dagens framsteg | Hem visar endast bekräftade dags- och träningsdata; okänt är inte klart |
| 4 Daglig Checklista | Hem → dagslista → rutinhandling/hantering → bekräftad Hem-status. **Alla** visar alla aktiva rutinmallar, även sådana som inte valts för någon dag. |
| 5 Logga | Snabbregistrering → bekräftat sparande → historik/rättning → tillbaka |
| 6 Träning | Publicerat program/steg → bekräftad eller ärligt okänd progress → återuppta |
| 7 Kunskap | Publicerat innehåll → fungerande sök/filter där det visas → källmärkt läsvy → tillbaka |
| 8 Insikter | Beskrivande sammanställning av befintliga logghändelser; ingen ny datakälla eller prediktion |

Leveransmodellen är **flöden**: ingång → verklig handling eller läsning → bekräftat/ärligt okänt resultat → återgång, ett avgränsat checkpointpaket i taget. QA-omfattningen följer riskklass L/M/H. Bevara fungerande funktioner, säkerhet, sanningsenlighet, tillgänglighet och befintliga användargodkännanden. En panel är inte färdig genom mock, fixture, skärmdump eller lokal kod enbart.

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

**Mål:** Användare med en ny valp eller en vuxen hund ska snabbt komma till en relevant första upplevelse.

**Krav:**
- Behåll permanent hund-ID, godkänd raskatalog, födelsedatum, profilredigering och befintlig valfri kennelkoppling.
- Härled ålder och kronologisk period automatiskt; använd individuellt valda statusfält som separat kontext, utan kliniska slutsatser.
- Tillåt onboarding av vuxen hund utan kennelkod, valphistorik eller pågående träningsprogram.
- Profiländringar ska inte skapa nytt hund-ID eller skriva över historik.
- Starta i ett Hem med begriplig nytta, även när hunden saknar tidigare data.

**Acceptans – två separata testfall:** En 11-veckors valp och en 5-årig hund kan registreras och komma till varsitt relevant Hem utan parallella onboardingprocesser.

### 4.2 Hem – den sammanhängande upplevelsen

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
- Komplettera ett **litet** vuxenrelevant pilotutbud: målbilden anger minst tre användbara, granskade innehållsobjekt (nya eller reviderade). Prioritera faktisk ämnesnytta framför antal. Adult applicability ska vara dokumenterad per version; ett öppet åldersintervall räcker inte.
- Den minsta funktionella vuxenresan i §7 kräver minst ett relevant objekt. Det är ett användbarhetstest av resan, inte automatiskt godkännande av pilotens innehållsgrind på tre objekt. Den exakta pilotgrinden ska bekräftas före pilotbeslut.
- Granska befintliga innehållsversioners `min_age_weeks`/`max_age_weeks` före förändrat urval. Ändra aldrig publicerade versioner tyst.
- Visa inte innehåll utanför godkända målgruppsvillkor eller opublicerade utkast som publicerat material.

**Acceptans:** Både 11-veckors valp och 5-årig hund har ett begripligt, relevant innehållsförslag och direkt väg till motsvarande kunskapsvy. Saknas relevant innehåll ska appen visa ett ärligt tomläge – inte återanvända ett irrelevant valpråd.

### 4.7 Tassla-pass – portabel sammanfattning

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

MVP v2:s målbild tar avstamp i en modell med tio kronologiska perioder och fem breda faser. Detta är ett produktkrav, inte ett påstående om att modellen redan finns på vald Main-bas. Main vid antagandet härleder tre breda åldersetiketter; utökad periodresolver är ett separat, planerat implementationgap. **Kronologisk period** är ett redaktionellt åldersbegrepp. **Individuellt bedömd senior-/slutskedesstatus** är separat ägarkontext och ska inte automatiskt förutsätta medicinsk kunskap.

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

**Primärt spår:** Uppfödare → QR/kod → onboarding → hundprofil → Hem → första användning → meningsfull återkomst. Tidigare beslut om frivillig kennelkälla, ingen kennelportal och separat distributionsmandat gäller.

**Kompletterande test:** Cirka 8–12 vuxenhundsägare utan tidigare Tassla-historik, som ett kvalitativt användbarhetstest. Syftet är att upptäcka om vuxenhundsupplevelsen är begriplig och ger självständigt värde; detta är inte ett statistiskt test av retention.

## 9. Mätning och dataskydd

Behåll D1/D7/D30 som definierade uppföljningar av aktivering/återkomst samt den begränsade samtyckesstyrda mätningen. Komplettera produktanalysen med **frågor** om livsfasrelevans och meningsfulla handlingar. Besluta separat om hur/om livsfasfördelning får mätas: nuvarande mätkontrakt tillåter inte att ålder, hund-ID, kennel-ID eller hälsodata skickas i produkt-events.

- Frivillig mätning får inte bli ett krav för att använda kärnprodukten.
- Mät inte bara appöppningar; granska bekräftad handling och kvalitativ upplevd nytta.
- Eventuell livsfasuppdelning ska föreslås av Product och granskas av Compliance/Security, med dataminimering, k-anonymitet/aggregat där relevant och utan att kringgå nuvarande eventkontrakt.
- **D90 är ett framtida uppföljningsmål, inte ett åtagande i nuvarande 30-dagars händelseretention.** Längre mätning kräver uttryckligt separat beslut om lagring och analys.
- Sätt numeriska pilottestmål först efter att mätdefinitioner och verklig insamlingsväg är verifierade.

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

## 12. Definition of Done för pilot-MVP v2

MVP v2 är *leveransklar för kontrollerad pilot*, inte automatiskt validerad, när:
- sex produktområden är sammankopplade utan att bryta befintliga flöden;
- scenario A–F är verifierade mot faktiskt data-/UI-beteende;
- vuxenhunds-Hem har relevant publicerat innehåll, inte bara en periodetikett;
- progression visar endast bekräftade handlingar;
- hundens historik och ID består vid livsfasbyte;
- nytt innehåll har genomgått erforderlig sakgranskning och kontrollerad publicering;
- åtkomst, dataskydd, radering, notifieringar, native PDF, verklig backend och fysisk enhet är verifierade där de krävs;
- pilotens mätdefinitioner och insamlingsväg är granskade;
- produktägaren har godkänt användarresorna och beslut om pilotdistribution.

**Gräns:** Kodreview, mockdata och gröna tester är inte samma sak som verifierad verklig Supabase, TestFlight/native och användarupplevelse.

## 13. Ändringskontroll och genomförande

Före varje implementation ska kön och den exakta planen klassificera kravet enligt:

- **Redan implementerat och verifierat:** Ändra inte.
- **Delvis uppfyllt:** Minsta möjliga komplettering, med specificerat gap och test.
- **Krav inom godkänd v2-scope:** avgränsa till minsta kompletta flöde, kontrollera vad som redan finns och skapa en versionsstyrd plan med beroenden, riskklass, acceptans och testbevis. Följ planreview och checkpointflöde i `docs/dev/workflow.md`.
- **Utanför scope, oklart eller blockerad:** dokumentera; implementera inte implicit. Nya dataändamål, tekniska beroenden/kostnader, live-migration, extern pilot och publicering kräver sina egna uttryckliga grindar.

Arbeta i vertikala flöden, ett åt gången, med plan → granskning → implementation → QA → oberoende Reviewer och hållbar checkpoint. Bevara fungerande funktioner, designstandarder, komponenter, dataskydd och tidigare användargodkännanden. Uppdatera denna specifikation och beslutslogg när produktägaren uttryckligen ändrar scope.

## 14. Ägarbeslut och kvarstående grindar

Erik antog MVP v2 som styrande produktdefinition 2026-10-16 och godkände att arbetet utgår från senaste Main. De fem ursprungliga rekommendationerna i förslagsversionen är därmed avgjorda för produkt-scope:

1. **Ja — vuxenhundsupplevelse ingår i MVP-scope.** Kvalitativ användbarhetsvalidering för vuxenhundar ingår i den framtida pilotmålbilden. Förslaget om cirka 8–12 deltagare är en planeringsreferens, inte tillstånd att rekrytera eller samla in deltagardata; pilotberedskap, samtycke och compliance granskas separat.
2. **Ja — vuxenrelevant innehåll ingår**, efter per-version sakgranskning. Minst ett relevant objekt behövs för att prova den funktionella resan. Om pilotens publiceringsgrind ska kräva tre objekt återstår att bekräfta innan pilotbeslut.
3. **Ja — återanvänd befintliga rutin-, logg- och träningsmotorer** när de uppfyller kraven. Ingen universell poängmodell eller parallellt progressionssystem.
4. **Ja — behåll sex produktområden och nuvarande huvudsakliga arkitektur.** Detta öppnar inte för ny stack, dependency, integration eller datamodell utan relevant granskning.
5. **Ja — MVP v2 är styrande och MVP v1 arkiveras som historik.**

Separata implementationer för tio-periodsmodellen, adult-relevansurvalet, ändrade innehållsvillkor och vuxenprogram kan fortfarande kräva egna planer och specialistgranskning. Extern pilot, insamling, release, live-databasändring och nya persondataändamål är inte godkända av v2-antagandet.

---

**Sammanfattning:** MVP v2 är Tasslas existerande valpfokuserade MVP, förstärkt så att en vuxen hund får självständigt värde, livsperioderna påverkar verklig relevans och användaren upplever bekräftad progression mellan redan existerande flöden – utan nya stora funktionsområden.

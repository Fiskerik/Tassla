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

# Actionplan — fyra sammanhängande UI-/UX-paket mot rev02

Datum: 2026-10-23. Beställare: Erik. Genomförande: Luna/implementer, med koordinator och riskbaserad granskning enligt projektets arbetsflöde.

**Status: genomförande pågår.** UI-R02-01A (sökbar rasväljare) har Architect APPROVE, Critic PASS, oberoende QA PASS (13/13 public och review) och oberoende Reviewer PASS på `2026-10-23-ui-01-profil`; implementation-commit/checkpoint återstår. UI-R02-01B och paketen 02–04 återstår. Native/live-kontroller redovisas separat och är inte godkända av denna lokala QA.

Detta är **den aktuella paketordningen** för fynden i [GAP-analysen 2026-10-23](../GAP-UI-UX-rev02-2026-10-23.md). Den ersätter paketordningen i GAP-analysens tidigare avsnitt 8 och [planen från 18 oktober](../plans/UI-UX-NEXT-PACKAGES-2026-10-18.md). GAP-analysen behåller belägg, skärmbilder, kodankare och G01–G19; de kopieras inte till en ny konkurrerande fellista.

## 1. Mål och prioritering

Ägaren ska kunna välja hund/ras, skapa och ändra checklistor, registrera vardagen och hitta relevant innehåll med samma begripliga kontroller. Skärmytan ska användas till innehållet. Knapprader, upprepade introduktioner och dubbla modalrubriker ska inte dominera.

Vi levererar fyra större paket med synligt resultat. Inuti varje paket görs kompletta resor i följd, med hållbara checkpoints. Ingen separat flerveckors ombyggnad av ett designsystem föregår förbättringarna: delade komponenter utvecklas i det flöde som faktiskt behöver dem och återanvänds i nästa paket.

| Ordning / ID | Leverans som märks i appen | Huvudsakligt omfång | Risk | Beroende |
|---|---|---|---|---|
| 1 / **UI-R02-01** | **Profil: välj ras och ändra hund utan en lång listsida** | Sökbar rasväljare, kompakt profil, samma skapa/ändra-mönster och säker avslutning | M; H om konto-/hundscope eller persistens ändras | Kort basavstämning nedan |
| 2 / **UI-R02-02** | **Checklistor: samma ikonval och kompakta redigering från båda ingångarna** | Egen punkt med sparad ikon, fokuserad rutin, gemensamma rader, åtgärder och återhämtning | H: ikonmetadata/migration och radering | 01:s gemensamma presentations-/avslutningskontrakt |
| 3 / **UI-R02-03** | **Logg och Hälsa: redigera i ett tydligt formulär** | Logg, vikt, utförd/planerad hälsa; en Spara-rad, samma datumval och rätt plan från alla ingångar | H: hälsodata och radering; presentationsdelar avgränsas | Verifierat formulär-/åtgärdsmönster från 01–02 |
| 4 / **UI-R02-04** | **En sammanhängande app: Kunskap, Träning och Insikter i rätt helhet** | Integrera befintligt brancharbete, bild-/korthierarki, konsekventa val/header/stödflöden och slutlig panelrunda | M; H för den nya Insikter-RPC:n och berörd datakoppling | 01–03 och aktuellt innehålls-/integrationsläge |

**Varför denna ordning:** raslistan är ett tydligt, självständigt fel som kan lösas med befintlig katalog. Checklistpaketet löser nästa uttryckliga ägarkrav och etablerar det kompakta mönstret i både rutin- och faslistan. Logg/Hälsa får därefter samma beprövade formulär. Sista paketet färdigställer helheten med redan skriven Insikter-/bildkod och en gemensam visuell avstämning.

Arbeta med ett paket och en intern resa åt gången. Ett databashinder får inte stoppa oberoende UI-arbete, men berörd persistensacceptans hålls öppen. Det krävs inget nytt ägarbeslut mellan redan beställda resor; faktiska granskningsgrindar och konkreta externa beroenden hanteras där de uppstår.

## 2. Kort basavstämning före första kodändringen

Ansvar: koordinator. Spårning: **G18**. Detta är en förberedelse inom första paketet, inte ett eget dokumentationspaket.

1. Läs [MASTER-LOG](../decisions/MASTER-LOG.md), [designreglerna](../design-rules.md), berört [skärmkontrakt](../design/vision-rev02-screen-contracts.md), GAP-fynden och den verkliga koden. Öppna [vision_rev02.jpg](../../vision_rev02.jpg). Tillämpa repo-skills `tassla-consumer-ux` och `mobile-ios-design`; föreslagna komponentnamn nedan är inte befintliga API:er.
2. Uppdatera jämförelsen mot GitHub och anteckna exakta SHA:n. Auditens huvudbas är `main@eea0984aba44ef17707e7d583b3f9bf6b165c7ee`; remote `2026-10-22-panel7-insights-profile@90d0d704c610ade7946557bf5f3b75a9310ff63e` innehåller 22 ändrade filer relativt den basen. Lokala `HEAD@3aeb6c9` ska inte likställas med någon av dem. Se [auditens baslinje](../design/evidence/gap-ui-ux-2026-10-23/baseline.json).
3. Bevara det lokala, ännu ocommittade GAP-/evidensarbetet. Dokumentera en hållbar checkpoint innan branchbyte. Utgå från aktuell integrationsbas efter jämförelsen; återställ inte äldre skärmfiler för att lösa en konflikt.
4. Markera befintlig branchkod som **återanvändning/integration**: Insikter, profil-/Logg-ingångar, den nya läs-RPC:n och senare Kunskaps-/Träningsbildgeometri. Den beställs inte på nytt. FAQ-/checklistsymbolerna är däremot fel även på den granskade arbetsbranchen.
5. Skapa endast första paketets exakta taskplan i `docs/tasks/dev/`, med numrerade interna steg, skrivfiler, ansvar, acceptans och relevanta granskningar. Synka motsägande köstatusar med daterade belägg enligt befintliga verktyg. Historiska PASS/`done` återges med sitt omfång, aldrig som nytt helhetsgodkännande.

**Bevara ägarbekräftat klart:** panel 3, A03, rutinernas ikonmigration `202610220001_daily_routine_checklist_icons.sql`, tidigare manuella iOS-prov, generell VoiceOver/Dynamic Type och Supabase/RLS samt Compliance för FLOW-INSIGHTS-01A. Nya förändringar får riktade regressionsprov. Tidigare generell RLS-status verifierar inte en ny metadata-migration eller ny RPC.

## 3. UI-R02-01 — Profil som fungerar på liten skärm

**Användarresultat:** öppna Profil, hitta ett fält, välj ras med sökning och spara utan att först scrolla igenom alla raser eller flera introduktionskort. Samma väljare används när hunden skapas och ändras.

### Omfång och interna checkpoints

1. **Välj och spara ras.** Bygg en gemensam `BreedPickerField` mot befintliga verkliga `BreedOption`-rader. Stängd väljare visar etikett, valt värde och chevron; öppnad modal har fast sökfält och en enda rullbar `FlatList`. Ingen virtualiserad lista inuti nuvarande `BottomSheet`-scrollview. Valet återför till formuläret; stäng utan val ändrar inget. Använd placeholder när inget val finns i stället för automatiskt första rasalternativ.
2. **Gör profilens första vy användbar.** Ersätt den stora hundlistan med kompakt aktiv hund + befintlig hundbytare. Lägg redigerbara fält före upprepad hjälptext. Samla information i en tydlig informationsingång och visa kennelkoppling sammanfattat. Samordna födelsedatumsfält i skapa/ändra, befintligt åldersval och kompakt detaljhuvud. Rätta kennelknappens hjälpmedelsnamn så det motsvarar aktuell handling.
3. **Lås ett återanvändbart formulärkontrakt i denna resa.** En tydlig Spara-footer, ikon för stäng, samma avslutningsväg för X/back/svep där respektive modal/route stöder det. Rent formulär stängs direkt; ändrat formulär ger Fortsätt redigera/Kasta ändringar. Pending/unknown behåller befintliga skydd. Inför bara de opt-in knapp-/fält-/header-varianter som faktiskt används här. Ingen generell ändring av alla knappars defaultstorlek.

**Skrivytor:** `src/features/onboarding/{ProfileScreen,EditDogProfileScreen,ProfileScreenHeader}.tsx`, befintlig `src/features/home/DogProfileSwitcherSheet.tsx` och profilens route i `ProductWorkspace.tsx` vid behov; en gemensam rasväljare och relevanta UI-/tokenvarianter samt modulguide/tester. `src/data/app-data.ts` är befintligt kontrakt att bevara, inte mandat för en profilmodellomskrivning.

### Klart när

- Skapa och ändra använder samma sökbara väljare. Prova 1/24/stor syntetisk lista, svensk lång etikett, träff/ingen träff, rensa, loading/error/retry och tangentbord. Inga nätverksanrop per tangenttryckning.
- Sparad ras överlever återläsning; befintlig ras behålls även om katalogen inte längre innehåller den. Andra fält försvinner inte när väljaren öppnas/stängs.
- Profilen visar redigerbara fält tidigt; rasalternativ visas bara i väljaren. Före/efter mäter fältplacering och scrollåtkomst. Knappar/tangentbord döljer inte Spara.
- X/back och hundbyte hanterar rent/ändrat/pending/unknown korrekt; sena svar från tidigare hund ignoreras. Avslutningskontraktet dokumenteras för nästa paket.
- Befintlig ålderspreferens, kennelkoppling och profil-/passdata fungerar. Ingen ny foto-/lagringsfunktion eller katalogimport krävs för UI-checkpointen.

**Spårning:** primärt G01/G08; gemensam bas för G03/G06; profilens delar av G10/G11/G12/G13/G16. Full raskatalog och Mix har eget kvarstående databeroende i avsnitt 8; det hindrar inte väljaren.

## 4. UI-R02-02 — Checklistor med samma redigeringsupplevelse

**Användarresultat:** skapa en egen punkt med rätt ikon direkt, ändra den utan en knappvägg och öppna en rutin utan att få alla andra rutiner i samma vy. Dagliga rutiner och faschecklistor använder samma visuella språk med sina respektive databetydelser bevarade.

### Omfång och interna checkpoints

1. **Skapa/ändra egen punkt inklusive sparad ikon.** Extrahera den befintliga granskade ikonuppsättningen/presentationen till en gemensam modul; både rutin och Kunskap använder den. Titel + ikontrigger finns redan vid skapande. Lås validerad, nullable ikonmetadata i exakt delplan; uppdatera läsning, insert/update, readback/CAS, intent/cache och en separat migration med riktad SQL-prob. Den redan migrerade rutintabellen ersätter inte denna nya metadata.
2. **En kompakt redigeringsfamilj.** Använd en primär Spara-footer, kompakt klart-checkbox där den är ändringsbar, penna/soptunna vid namngivet objekt och textad raderingsbekräftelse. X/back/svep följer 01:s avslutningskontrakt. Utveckla delade `Button`-/modal-/återkopplingsvarianter opt-in; föreslagna `IconAction`/formulärfooter är komponentförslag, inte påstådda befintliga exports. Behåll saklig text för retry/okänt/konflikt, men flytta förklaringen från knappetiketten till meddelandet.
3. **Fokusera rutiner och samordna listorna.** En vald rutin visar den rutinen. Hantera alla/skapa rutin har ett uttryckligt läge från Checklistor; träningsval ligger inte mitt i rutinredigeringen. Samordna checklistans radform, bock/öppning/redigering och synlig alternativväg till longpress. Komprimera faslistans upprepade information; reviewtextens Läs mer blir en begriplig Om exemplet-ingång. Reviewmärkningen består.

**Skrivytor:** `src/features/knowledge/PuppyChecklistScreen.tsx`, `checklist-{model,data,intent}.ts` och berörda innehållsgränser; `src/features/home/{DailyActivityManagerSheet,DailyChecklistScreen}.tsx`, `daily-routine-checklist-icons.ts`; gemensam ikonmodell/picker, `ChecklistItem`/berörd radkomponent, opt-in `Button`/`BottomSheet`/fält/feedback/tokens; separat `supabase/migrations/`-fil och SQL-prob samt modulguider/tester. `HomeScreen` ändras bara om en gemensam ändring kräver riktad regressionsrättning.

### Klart när

- Välj ikon före första sparandet, ändra titel/ikon på en befintlig punkt och återöppna/återstarta med samma bekräftade värden. Äldre rader utan ikon får neutral fallback; äldre klienters skrivningar fungerar och en ren bockning skriver inte bort ikonen.
- Edit-vyn har **en permanent primär handlingsrad**, jämfört med auditens fyra rader/260 px. Radering ligger i kontextuell ikon och en separat Avbryt/Radera-bekräftelse. Varje tryckyta är minst 44×44 pt; större text får öka höjden.
- Failed tillåter rätt återförsök med utkastet kvar; unknown behåller exakt intent/request-ID för kontroll; konflikt har en uttrycklig väg till senaste version. Ingen extra skrivning eller falsk sparbekräftelse. Ägar-/hundscope och smala grants provas för den nya metadatan.
- Öppna rutin A/B visar rätt rutin, rätt upprepning och rätt returposition. Ändra, hoppa över, ta bort från dagen/Hem och radera rutin behåller sina olika betydelser och bekräftelser. A04:s återhämtning består.
- Fyrfältaren Idag/Denna vecka/Alla/Kommande fungerar som tidigare. Historiska/framtida objekt behåller sina regler; träning öppnar källsteget utan en andra completion-write. Fasprogress nollställs inte med dagens rutiner.
- Hem behåller sin pil, kompakta ikonfria rader och tre genvägar; panel 3:s godkända ring/status ändras inte av en global komponentdefault.

**Spårning:** G02/G03/G05/G06/G07/G14; checklistornas delar av G04/G11/G12/G13/G16. **Den egna punktens ikonpersistens räknas inte klar förrän den nya migrationens riktiga integration är verifierad.** Oberoende UI-delar kan ändå checkpointas; live-migration körs inte automatiskt.

## 5. UI-R02-03 — Samma formulär i Logg och Hälsa

**Användarresultat:** öppna en post, ändra fälten och spara; vid borttagning används en tydlig soptunna/bekräftelse. En namngiven hälsoplan öppnar samma plan oavsett ingång.

### Omfång och interna checkpoints

1. **Loggens editresa.** Migrera händelseredigeringen till samma header, avslutningskontrakt, kontextuella handlingar, en Spara-footer och återkoppling som i 01–02. Behåll direkta snabbval, Fler, dubbeltrycksskydd, datumfilter, tidslinje och ångra. Kalender-/klocköppning har kompakt trigger men visar fortsatt valt datum/tid.
2. **Vikt och hälsans editresor.** Separera återanvändbara formulärfält från hela sidans ram så att modalen inte får dubbla rubriker, kort och sidmarginaler. Migrera vikt, utförd hälsa och planerad hälsa i följd till samma mönster. Samordna befintliga typval, datum-/tidsfält och stödtext; medicinsk betydelse och nödvändig säkerhetsinformation bevaras.
3. **Rätt plan och retur.** Skicka valt plan-ID och returkontext genom befintlig route från Hälsas namngivna rader. Prova både Hälsa och Checklistor med två olika planer. Bekräfta datum-/filter-/scrollretur och Kommande-lägets read-only-regler.

**Skrivytor:** `src/features/puppy-log/LogScreen.tsx` inklusive befintlig editor och berörda kalender-/tidkomponenter; `src/features/health/{HealthScreen,HealthHistoryScreen,WeightScreen,PlannedHealthScreen}.tsx`; planroute i `ProductWorkspace.tsx`, relevanta gemensamma fält/modal/feedback samt modulguider/tester. Lås verkliga hälsomodulsökvägar i taskplanen före edit. Ingen generell omskrivning av eventpersistens, datum-/tidszonsmodell eller medicinska kontrakt.

### Klart när

- Skapa/rätta/radera/ångra där funktionerna finns visar korrekta bekräftade poster. Status och utkast överlever relevanta failed/unknown/conflict-fall, avbruten edit och scopebyte.
- Varje edit har en tydlig huvuduppgift, ett huvud och en normal primär handlingsrad. Inga extra fullhöga Radera/Avbryt-rader eller dubbla sidramar. Tangentbord och liten skärm lämnar fälten och Spara åtkomliga.
- Samma datumkomponentfamilj respekterar olika gränser: framtida födelse-/loggdatum förbjuds enligt befintligt kontrakt; planerad hälsa får ha framtida datum. Loggkalenderns prickar och lokal dag fungerar.
- Plan A/B öppnas identiskt från sina namngivna ingångar och tillbaka går till rätt vy. En plan blir inte en utförd hälsohändelse genom en layout-/routeändring.
- Kort Spara i tydligt rubricerade formulär har full kontext i hjälpmedelsnamnet. Raderingsdialogen nämner rätt objekt och använder tydliga textval.

**Spårning:** G04/G09/G10/G19; alla berörda konsumenter av G03/G06/G07/G11/G12/G13/G16. Hälsodatans riktade granskning kvarstår även när ändringen främst syns i UI.

## 6. UI-R02-04 — Kunskap, Träning och Insikter i en sammanhängande app

**Användarresultat:** tydlig bildhierarki och begripliga symboler, enhetliga flikar och stödvyer samt fungerande Insikter från Hundprofil och Logg. Inga ingångar leder till en annan sorts vy än användaren valt.

### Omfång och interna checkpoints

1. **Ta vara på Insikter-/bildarbetet.** Jämför då aktuell `main` och arbetsbranch, integrera bara de relevanta verifierade ändringarna. Återanvänd Insikters skärm/modell/RPC och profil-/Logg-returer inom FLOW-INSIGHTS-01A:s godkända scope. Prova den nya läs-RPC:n särskilt. För Kunskap används den senare branchens bild-/kortlayout som utgångspunkt, följt av verklig rev02-jämförelse; 200/132 pt i kod är inte automatiskt visuell acceptans. Rätta checklist-/FAQ-symbolerna efter betydelse — de är fortfarande träningssymbol/måne även i den granskade branchkoden.
2. **Samordna huvud- och stödvyer.** Migrera Tränings segment/reset, resterande header-/info-/Visa alla-handlingar och påminnelsernas val till de verifierade familjerna. Samma val får samma visuella tyngd och semantik. Inställning i appen hålls skild från OS-behörighet. Gör en riktad kontroll av Mer, Tassla-pass, konto/auth, FAQ och läsvyer; rätta bara belagda kvarvarande familjeavvikelser inom beställt scope. Kontoradering, samtycke, autentisering, behörigheter och PDF-delning behåller begripliga synliga namn.
3. **Gör en samlad slutanvändarrunda.** Jämför de åtta panelernas aktuella integrerade vyer och berörda stödresor mot rev02. Störst synlig skillnad i komposition/bild/täthet rättas först. Kontrollera riktiga öppnings-/returvägar, inga kvarvarande knappväggar eller otillgängliga footerfält, och rätt aktiv huvudflik utifrån ingången. Spara en kort telefonchecklista för exakt build och panelstatus per nivå.

**Skrivytor:** befintlig `src/features/puppy-log/InsightsScreen.tsx` och tillhörande modell/data/RPC/tester, routes i `ProductWorkspace.tsx`; `src/features/knowledge/{KnowledgeScreen,FAQScreen}.tsx` och bildmanifest/kort; **aktiva** `src/features/training/PublishedTrainingScreen.tsx`; `src/features/notifications/NotificationSettingsScreen.tsx`; dokumenterade övriga konsumenter av `Tabs`/`AppBar`/informations-/ikonhandlingar. Kandidater från äldre `TrainingScreen` eller preview är inte automatiskt produktionsarbete. Exakta filer för befintlig branchintegration låses i basjämförelsen.

### Klart när

- Kunskap visar rätt huvudkort/mindre bildkort och meningsfulla FAQ-/checklistsymboler; samma guide öppnas via bild och text. Sökning fungerar över den angivna mängden. Bild saknas för okänd version → ärlig textfallback; inga slumpbilder eller tomma ämnesfilter.
- Träning behåller publicerad version, urval och progress, men använder enhetliga val/kontextuella handlingar. Fortsätt går till rätt hunds tillåtna steg. Återställning bekräftas; ingen påhittad tids-/ämnesmetadata.
- Insikter nås från Hundprofil och Logg, med respektive korrekta retur. Periodbyte, komplett/partiell/tom/felaktig läsning, synliga numeriska värden och scopebyte provas mot befintlig godkänd modell. Ingen sömnvaraktighet eller medicinsk slutsats hittas på.
- Gemensamma stödvyer har konsekventa rubriker, korta kontextuella handlingar och samma val/fält där uppgiften är densamma. Läsningens fulltext/källor och nödvändig information består.
- Slutmatrisen skiljer **UI klart**, **fungerande datakoppling**, **lokal/oberoende QA**, **nya live-prov**, **native-prov** och **finns i angiven build**. Äldre avklarade paneler öppnas bara för konkret regression eller relevant ny ändring. Kvarstående innehålls-/databeroenden från avsnitt 8 får inte döljas bakom ett godkänt fallbackläge.

**Spårning:** G11/G12/G13/G15/G16/G17 och slutavstämning av G18; konsumentkontroll av G03/G04/G06/G07. Publikt innehåll har ett eget verifierbart delresultat enligt nästa avsnitt; ett snyggt reviewläge stänger inte det.

## 7. Gemensamma beslut och filansvar

| Familj | Etableras i | Återanvänds i | Bindande regel |
|---|---|---|---|
| Rasväljare | 01 | Skapa/ändra profil; kommande Mix kan använda samma familj | Stängt fält + sökbar modal, stabilt värde, en lista |
| Formulärheader/footer och korta handlingar | 01; utökas med checklistbehov i 02 | 03 och 04 | Opt-in varianter; en primär Spara-rad, minst 44 pt träffyta, text får växa |
| Avslutning och utkast | Kontrakt och profil i 01 | Checklistor 02, Logg/Hälsa 03, berörda stödresor 04 | Samma handler för de faktiska stängvägarna inom formuläret; pending/unknown skyddas |
| Ikonmodell/picker och checklistans rad | 02 | Rutiner och egna faschecklistepunkter | En ikonuppsättning; samma presentation, olika verkliga progress-/upprepningsregler |
| Kontextuell penna/soptunna/reset | 02 | 03, Träning i 04 | Ikon vid identifierat objekt → tydlig textad bekräftelse vid destruktiv handling |
| Återhämtning | 02 | 03 och 04; profilens konsument följer samma kontrakt | Kort handlingsnamn + förklaring, en tydlig nästa handling, failed/unknown/conflict förblir olika |
| Datum-/tidsfält och val | Profil i 01, övriga datumfall i 03 | Resterande konsumenter 04 | Gemensam presentation med parametrerade gränser; ingen ny tidszonsmodell |
| Flikar, kompakt info/header och språk | Tidiga berörda vyer i 01–03; slutlig konsumentrunda 04 | Appens identifierade riktiga konsumenter | Meningsfull symbol/namn, vald status, ingen dekorativ funktion |

Varje familj har en skrivande implementer i det aktiva paketet. Nästa paket utökar den efter samma kontrakt; kopiera inte lokala helpers eller håll parallella varianter vid liv för samma uppgift. Ändrade delade komponenter får riktade kontroller av sina verkliga konsumenter, inklusive tidigare paket.

**Fast UI-policy:** använd etablerade ikoner för kontextuell ändring/radering, stäng, tillbaka och punktvis plus/minus. Behåll kort synlig text för huvudhandling, bekräftelse, retry/statuskontroll, valnamn och konsekvensrika konto-/samtyckeshandlingar. Byt inte artikelrubrik, hundnamn eller snabbval till anonyma symboler. Separera checkbox och öppningshandling utan nästlade dubbla tryckmål.

**Fast beteendepolicy:** inget nytt ramverk för alla formulärtillstånd. Återanvänd befintliga datamodeller/intents och dela bara det som faktiskt kan vara gemensamt. Pending låser samma operation; failed bevarar redigerbart utkast; unknown kontrollerar samma intent; konflikt ersätter inget tyst. Bekräftad återläsning styr status/räknare. Kontobyte/hundbyte tar inte med gamla svar till nästa scope.

## 8. Innehåll och data som följs separat från UI-checkpoints

Dessa punkter är relevanta kvarstående leveranser, inte skäl att behålla nuvarande otympliga UI. Koordinatorn anger ansvarig och faktiskt tillgänglig källa i det berörda paketets delplan.

| Beroende | Ansvar och nästa konkreta steg | Koppling till paket / vad det hindrar |
|---|---|---|
| **D1 — Ny ikonmetadata för egna faschecklistepunkter** | Implementer tar fram migration + kompatibilitet + grant/readback-prov; relevant Architect/Security granskar. Faktisk DB-körning/prov samordnas separat. | 02. Hindrar att sparad ikon rapporteras klar i aktuell miljö, inte oberoende kompakt UI. Rutinernas redan migrerade ikonkolumner räcker inte. |
| **D2 — Ny Insikter-läsning** | Återanvänd branchens `202610220002_dog_event_insights_read.sql` och riktade prob efter färsk basjämförelse; verifiera miljön och nya rättigheter. | 04. Befintligt generellt Supabase/RLS-godkännande ersätter inte prov av denna nya RPC. Compliance för 01A frågas inte om igen. |
| **D3 — Publicerade faschecklistor/FAQ** | Innehållsansvarig/Dog Expert granskar relevanta råd; implementer kopplar en riktig versionsmärkt publik katalog. Dokumentera hur review-progress/egna punkter bevaras utan tyst ID-/versionsbyte. | G17, 04. Krävs innan de publika resorna räknas levererade. Reviewflagga/märkning kringgås inte. UI-pariteten i 02 kan bli klar före innehållet. |
| **D4 — Full raskatalog och Mix** | Ta fram spårbar Wikidata CC0-snapshot enligt [profilplanen](../plans/VISION-REV02-DOG-PROFILE-UX-SPEC-v2.md), verifiera stabila ID:n/etiketter och lås Mix-kontraktets migrations-/rättighetsdel. Äldre formulering att även picker-UI måste invänta exporten ersätts av G01. | 01 återanvänder befintliga alternativ direkt. Full katalog/Mix förblir öppet som tidigare beställd dataleverans; hitta inte på alternativ och byt inte ut sparade ras-ID:n. Befintlig ålderspreferens bevaras. |
| **D5 — Innehålls-/intervallunderlag för full referens** | Stäm av publicerade milstolpskällor för Utveckling samt sömnens intervallkontrakt mot faktiskt godkänt scope och data. Dokumentera exakt vad som finns/saknas; bygg bara från giltiga källor. | 04:s slutmatris skiljer fungerande åldersvy/01A-översikt från full milstolps-/sömnleverans. Äldre önskemål om veckomål öppnar inte om ägarens godkända panel 3. |

Ingen UI-checkpoint publicerar innehåll, kör live-migration eller skapar en signerad release automatiskt. Om något av ovanstående saknas fortsätter nästa oberoende resa, medan det berörda slutkravet står öppet med ansvar och nästa steg.

## 9. Verifikation och leverans per paket

### Synlig kvalitet

- Före/efter med samma relevanta innehåll och jämförbar skala, sida vid sida med rätt rev02-panel eller stödflödets kontrakt. Granska komposition, färger, typografi, komponentformer, bildspråk och innehållstäthet separat enligt designreglernas §14.
- Viewports 375×844, 430×844 och kritiska formulär även 375×667; lång svensk text, större text och tangentbord. 140 % webtext är en proxy, inte ett nytt native-PASS. Ändrade nativekontroller provas riktat i den samlade telefonrundan.
- Mät det som ändras: handlingsytans höjd, första formulärfältets placering, bildandel och åtkomlighet. Checklistans 260 px är konkret före-värde, inte en generell gräns för alla formulär. Normal edit har en primär handlingsrad och tillgängliga kontextikoner.
- Endast Hem har kontraktet att alla standardblock ryms med minst 16 pt marginal över bottenmenyn. Övriga sidor får scrolla naturligt. Den tidigare separata 4 px-avvikelsen återöppnas inte automatiskt; gemensamma ändringar får inte introducera en faktisk ny överlappning.

### Funktion och kontroller

- Relevanta beteendetester för varje resa: lyckat/fel/okänt/konflikt, dubbeltryck, utkast/avslutning, återläsning, scopebyte och källa/retur. Testa verkliga stateövergångar och anrop, inte bara förekomst av text/JSX.
- Kör `pnpm check`, `git diff --check` och iOS-export med `pnpm bundle:ios` när appkod ändras. För 02 och den nya Insikter-RPC:n tillkommer riktade schema-/grants-/scope-/readback-prov i relevant miljö. Inga nya dependencies planeras.
- Riskbaserad planreview, oberoende QA och Reviewer enligt arbetsflödet. Relevant Security för berörd data/radering/RPC; Dog Expert för nytt sakinnehåll. Spara verkliga verdicts, inte förväntade PASS. Oändrade tidigare ägargodkännanden används med sina dokumenterade gränser.
- Varje checkpoint har exakt kodbas, ändrade filer, utfört prov, evidens, kvarstående luckor och första nästa steg. Ett paket stängs först när dess inkluderade resor och familjekonsumenter fungerar. Delar kan ha egen hållbar checkpoint utan att hela panelen kallas klar.

### Branch, commit och build

- Föreslagna paketbrancher: `2026-10-23-ui-01-profil`, `2026-10-23-ui-02-checklistor`, `2026-10-23-ui-03-logg-halsa`, `2026-10-23-ui-04-panelhelhet`; använd verkligt startdatum om arbetet sker senare. Inga nya brancher skapas av detta dokumentarbete.
- En sammanhängande paketbranch/PR per leverans, med mindre verifierade commits/checkpoints inuti. Nästa paket utgår från verifierad integrationsbas. Om föregående paket ännu inte är i `main`, dokumentera det staplade beroendet och PR-basen i stället för att låtsas att det redan är mergat.
- Håll gemensamma komponenter och `ProductWorkspace` under en skrivare. Jämför överlappande mergeändringar efter avsikt; återställ inte en hel äldre fil och kopiera inte hela gamla worktrees. Avlägsna bara ersatt kod efter referens-/routekontroll, inte gamla filer på chans för att förebygga konflikter.
- Commit/push efter genomförda kontroller enligt ägarens tidigare instruktioner. Rapportera faktisk branch, SHA, GitHub-länk och om den är mergad. Skilj push från signerad Codemagic-/TestFlight-build och skriv vilket SHA/buildnummer telefonprovet avser.
- Telefonprov kan samlas efter flera paket enligt befintligt beslut. Varje paket lämnar en kort lista över **det nya** att prova; slutlistan i 04 visar helheten utan att begära omprövning av redan godkända oändrade funktioner.

## 10. Full spårning av GAP-fynd

Huvudpaket ansvarar för att fyndet stängs; konsumentpaket behöver visa att deras berörda del följer samma kontrakt.

| Fynd | Huvudansvar | Konsumenter / avgränsning |
|---|---|---|
| G01 Rasväljare | 01 | Befintlig katalog först; D4 för full katalog/Mix |
| G02 Egen punkts ikon | 02 | D1 ingår i funktionsacceptansen |
| G03 För stor handlingsyta | 02 | Basvarianter i 01; Logg/Hälsa 03, resterande 04 |
| G04 Edit/delete/reset | 03 | Checklistmönster i 02, Tränings reset i 04 |
| G05 Rutinens fokus | 02 | Hem-pil och filter bevaras |
| G06 Avslutning/utkast | 01 | Checklistor 02, Logg/Hälsa 03, berörda stödflöden 04 |
| G07 Återhämtningens knappvägg | 02 | Profilens kontrakt i 01; Logg/Hälsa 03, slutkontroll 04 |
| G08 Profilens första vy | 01 | Befintlig hundbytare och guards bevaras |
| G09 Hälsoformulärets ram | 03 | Samma fält utan hela sidramen i modal |
| G10 Datum/fält | 03 | Profilens födelsedatum i 01 |
| G11 Val/flikar/checkbox | 04 | Profil 01, checklistor 02, hälsa 03 |
| G12 Detaljhuvud/info | 04 | Familjen används redan i berörda resor 01–03 |
| G13 Upprepad hjälptext | 04 | Profil 01, checklistans reviewhjälp 02, hälsa 03 |
| G14 Checklistans radgrammatik | 02 | Samma UI-språk, separata verkliga databetydelser |
| G15 Kunskaps bild/symbol | 04 | Integrera befintlig branchgeometri; symbolfix återstår |
| G16 Språk/hjälpmedelsnamn | 04 | Varje paket rättar egna konsumenter; kennelbugg i 01 |
| G17 Publika checklistor/FAQ | 04 + D3 | UI och publicerat innehåll har separata bevis |
| G18 Bas/status/äldre planer | Basavstämning och koordinator | Uppdateras vid varje checkpoint och i slutmatrisen |
| G19 Exakt hälsoplan | 03 | Både Hälsa och Checklistor, med rätt retur |

## 11. Startinstruktion till Luna

Gör den korta basavstämningen och börja med **UI-R02-01, checkpoint 1: välj och spara ras**. Läs G01/G08 och profilkontrakten; skriv den exakta delplanen med verkliga API:er och skrivfiler. Leverera samma sökbara väljare i skapa/ändra och kontrollera hela resan. Fortsätt inom paketet med profilens täthet och avslutning. Spara checkpoint innan nästa resa.

Därefter följer 02 → 03 → 04 enligt denna plan. Prioritera de största synliga avvikelserna och fungerande resor. Återanvänd bekräftad kod och aktuella gemensamma komponenter. Gamla planer ger historik och bevarade dataskydd; rev01, föråldrade knappregler och gamla köstatusar är inte aktuell bygginstruktion. Favoriter, offlinekö, widgets, generiska nya filter och en helt ny navigator ingår inte i dessa paket.

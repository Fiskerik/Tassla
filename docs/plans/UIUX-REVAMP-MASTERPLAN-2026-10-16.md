# Tassla — samlad UI/UX-masterplan för LUNA

Version 1.0 · 2026-10-16 · Analys och genomförandeunderlag för beställd totalöversyn.

## 1. Mandat och slutsats

Eriks aktuella beställning är en total UI/UX-översyn av appen på `codex/mvp-v2-panel4-checklists-2026-10-16`, konkreta ändringsförslag och ett tydligt styrunderlag för LUNA. Detta dokument är **ingång och arbetsordning för revampen**. Det kompletterar de kanoniska kraven nedan; det ändrar inte produkt-scope, publicerade innehållsvillkor eller dataändamål. Ingen appkod, migration eller distribution utförs i denna analysleverans.

**Bedömning:** appen har en relativt omfattande grund för sparande, återhämtning och flera produktområden, men inte en komplett MVP v2-upplevelse. Bristerna gäller saknade resor, inkonsekvent navigation/inmatning, innehållets relevans och verifiering lika mycket som layout och animationer. En total revamp ska därför genomföras som små kompletta resor. Behåll Expo/React Native, fungerande datakontrakt och befintliga skydd; skriv inte om appen i ett stort paket.

## 2. Vilka dokument LUNA ska följa

Läs denna masterplan först för aktuellt nuläge, prioritering och filankare. Läs därefter endast den aktuella resans nödvändiga kontrakt i följande ordning:

| Ansvar | Kanonisk källa | Användning |
| --- | --- | --- |
| Aktuella ägarbeslut och tidigare leveransers verkliga bevis | `AGENTS.md`, `docs/decisions/MASTER-LOG.md` | Aktuella uttryckliga ägarbeslut har företräde. Bevara sanningsenlighet, säkerhet och tillgänglighet. |
| Produkt-scope och verkligt användarvärde | `docs/mvp.md` | **Detta är den antagna MVP v2**, inklusive vuxenhundsnytta och scenario A–F. |
| När en hel panel/resa får kallas klar | `docs/MVP-EXPERIENCE-CONTRACT.md` | Ingång → uppgift → riktig källa → bekräftat/okänt resultat → tillbaka. |
| Utseende och visuell acceptans | `docs/design-rules.md`, `vision_rev02.jpg` | Gemensamt visuellt språk, tokens, former, bilder, hierarki, §14-checklista och §15-rörelse. |
| Exakt skärm- och objektkontrakt | `docs/design/vision-rev02-screen-contracts.md`, `docs/design/vision-rev02-objects.md` | Vilka block, handlingar och källor panelen behöver. För Hem även `docs/plans/HOME-REV02-visual-ux-spec.md`. |
| Beteende, återkoppling, sparstatus, tillgänglighet | `.agents/skills/tassla-consumer-ux/SKILL.md` | Pending/failed/unknown, formulär, stängning, fokus och begripliga återvägar. |
| Hur implementationen genomförs | `docs/dev/workflow.md`, `docs/dev/ui-and-code-standards.md` | Exakt versionsplan, riskklass, granskning, tester och checkpoint. |
| Aktuell körordning/status | `docs/tasks/dev/queue.json` | Samordna denna föreslagna omprioritering i nästa plancheckpoint. Historiska done/statusar skrivs inte om som om hela paneler är klara. |

Den daterade filen `docs/MVP v2 - 2026-10-16.md` är inte en konkurrerande källa framför `docs/mvp.md`. `docs/plans/MVP-SYNC-STATUS.md` är en inventering från 2026-10-08 mot **rev01** och innehåller numera inaktuella komponent-/skärmpåståenden. Den ska inte styra nästa implementation. Gamla release- och taskrapporter används bara som historik för sin exakta version.

Den tidigare `docs/tasks/UIUX-REVAMP-DIAGNOS-2026-10-16.md` är ett fördjupningsunderlag för gester och sheets. Denna masterplan ersätter dess begränsade omfattning och femstegsordning som ingång för totalrevampen.

## 3. Granskningsbas och bevisgräns

- GitHub-branchens granskade commit: `5ffb133f8b4bb330611a9b779fc4cf8686036070`. Alla kodankare nedan avser denna commit.
- Hela Git-trädet kartlades: 3 152 poster inklusive mappar, historik och bild-/evidensfiler. 273 relevanta textfiler i app, komponenter, data, innehållsurval, tester, Supabase, byggkonfiguration, verktyg och styrning kopierades till en temporär granskningskopia och verifierades byte-för-byte mot respektive Git-blob.
- Vid granskningens början låg arbetsytan på `work` och äldre `00d4d4a`. Källgranskningen gjordes därför i `/tmp/tassla-5ffb133`; den äldre arbetsytan användes inte som bevis för målbranchens nya funktioner. Inför Eriks efterföljande commit-/push-beställning flyttades dokumentändringarna till den angivna målbranchen ovanpå `5ffb133`; branchens nyare `AGENTS.md` bevarades.
- Visionsbilden och aktuella designkontrakt har lästs. Ingen färsk körande render av hela målbranchen eller installerad telefonbuild har inspekterats här. Källkod kan visa en strukturell avvikelse men kan inte godkänna visuell likhet, nativekänsla eller live DB/RLS.
- Fynd markeras som **belagt i kod**, **saknad funktion** eller **risk som behöver reproduceras**. Okänd telefonbuild hindrar inte oberoende lokal planering eller rättning av belagda kodproblem.

## 4. Inventering av produktens hela nåbara yta

För samtliga rader gäller: källstatus nedan är bedömd; aktuell visuell likhet, native och live-data är **inte verifierade i denna granskning**. Tidigare avgränsade QA-bevis finns i respektive task och ersätts inte av denna inventering.

| Yta / ingång | Vad som faktiskt finns i källan | Vad som behöver ändras eller färdigställas |
| --- | --- | --- |
| Inloggning → callback → profil | Google/magic-link, väntan, avbrott och fel; `AppFlow` väljer rätt workspace. | Native callback/retur och byggkanal verifieras. Bevara befintlig auth; skapa inte ny onboarding bara för ny stil. |
| Ny hundprofil | Namn, ras, födelsedatum, valfri kennelkälla och återhämtning vid okänt sparande. | Ta bort implicit första ras; explicit val/validering. Gör godkänd katalog sökbar utan att fabricera saknade raser/Mix-ID. Tydlig första värdehandling efter Hem. |
| Hem | Identitet, automatisk ålder/tre ungefärliga faser, generisk märkt Standardbild, scrollbar åldersremsa, Just nu, dagsrader och tre destinationskort. | Exakt träningsmål, tydligare enhetlig fördjupningsväg, bekräftad feedback, eventuellt relevant ägarvald plan i avgränsad befintlig yta. Åldersremsan är inte en utvecklingsresa. |
| Daglig Checklista / rutinhantering | Idag, Alla aktiva mallar, rutinpunkter, create/edit/delete, dagsval, upprepning, read-only/stale och dirty/unknown-skydd. | Denna vecka och Kommande återstår. Bevara Allas semantik och datum-/snapshotgrind. Minska komplexitet i hanteringen genom tydligare läs-/editläge, inte genom borttagna skydd. |
| Utveckling, panel 2 | Ålder/fas på Hem; ingen egen produktdestination eller komplett milstolpsresa. | Bygg Hem → publicerad ålders-/utvecklingsinformation → riktig guide → Hem. |
| Dagens framsteg, panel 3 | Dagsräknare/progress på Hem; ingen egen destination för ring/lista/källväg. | Bygg egen detalj på samma dagsmängd. Definiera veckomål/population innan det visas. |
| Logg / Fler / layout / olycka / editor | Snabbval, dubblettskydd, tidslinje, datumnavigation, rättning, radering/ångra, pending och unsure. | Bevara snabbheten. Rätta utkaststängning och returkontext. Tydliggör att snabbval loggar nu även när äldre dag visas. Rensa dubblering mellan Fler och Lägg till. |
| Träning / program / steg / Om / Mina | Publicerad versionsbunden progress, fortsättkort, markera/avmarkera, återupptagning, reset och pausad progress. | Gemensam relevanspolicy och exakta mål från alla ingångar. Rekommenderat ska ha en dokumenterad urvalsordning; Alla får inte låtsas vara hela katalogen när bara ett urval är läst. |
| Kunskap / artikel | För dig/Artiklar/Checklistor/FAQ, fulltext, källor och lästid. | Riktig sök/filter på definierat publicerat urval, tom sökning skild från fel, bildmetadata per innehåll och förutsägbar tillbaka. |
| Kunskaps faschecklistor | Egen checklistmodell, template-/versionsidentiteter, pending/återhämtning och public/review-gräns. | Behåll skillnaden från den dagliga checklistan och gör benämningar/ingångar begripliga. Bredda inte målgrupp med antaganden. |
| FAQ | Reviewfrågor och ärligt tomt publicläge. | Publicerad granskad FAQ-källa saknas; koppla riktig innehållskälla före löfte om svar i publicappen. |
| Insikter, panel 8 | Lokala mönstertexter i Logg; ingen egen produktdestination eller periodvy. | Logg → Översikt → fullständig periodläsning → tillgängliga grafer/tal → tillbaka. Sömntidslinje kräver intervallkontrakt. |
| Hälsa / vaccination / veterinär / vikt | Planerat skiljs från genomfört, historik, vikt och konflikt/unknown-hantering. | Bevara datakontrakten. Gemensam dirty-utträdesregel; synlig bekräftelse efter stängd editor; konsekvent detalj-/tillbakaflöde. |
| Planerade händelser / datum/tid | Create/edit/delete och lokala påminnelser med valda datum/tider och återhämtning. | Tydligare avgränsad formulärresa och bevarat utkast vid navigation; verifiera tangentbord och presentation. |
| Tassla-pass / förhandsvisning / export | Valbart fastställt urval, partial/empty/error och ägarinitierad lokal PDF/delning. | Återanvänd befintlig export. Kalibrera läs-/exporthierarki och prova native PDF/delning; lägg inte till journalfält från referensbilden. |
| Mer / hundprofil / kennelkoppling | Grupperade vägar till hälsa/pass/profil/påminnelser/konto; profilredigering och separat kennelkoppling. | Behåll upptäckbarhet. Skydda profilutkast och gör åldersvalets relation till Hem begriplig. Personligt foto kräver eget stöd, inte en skenfunktion. |
| Påminnelser | Frivilliga lokala preferenser, tillstånd, validering och sparande. | Skydda osparade val; bevara skillnaden mellan ägarval, OS-tillstånd och faktisk leverans. |
| Konto / samtycke / support / kontoradering | Samtyckesstyrd mätning, radering med confirmed/unknown och lokal utloggning. | Bevara fungerande återhämtning, synliga konsekvenser och nåbarhet. Lokal UI-polering ska inte bygga om auth eller radering. |
| Preview/galleri/visual harness | `DevelopmentPreview`, `TrainingScreen`, komponentgalleri och fristående syntetisk webbharness. | Separata från produktappen. `HomeCarousel` är inte monterad på produktens Hem. En demo eller källfil räknas inte som levererad produktfunktion. |
| Supabase / notiser / analytics / byggverktyg | Migrations-/RPC-/RLS-filer, adapters, avgränsade events och separata review/public-byggkanaler. SDK-teamverktyg är utvecklingsstöd. | Verifiera runtimeparitet och relevant integration, ändra inte datamodell/SDK-team av kosmetiska skäl. Ingen ny analytics behövs för grundläggande UI-fix. |

## 5. Prioriterade belagda fynd och ändringsförslag

### P0 — undvik felaktiga val, tappad inmatning och felaktiga leveranspåståenden

**F01. Onboarding förväljer första rasen.** `src/features/onboarding/ProfileScreen.tsx:43` fyller tomt rasval med `options[0].id`; submit på `:132` kräver bara ett värde. Användaren kan därmed fortsätta utan att aktivt ha valt ras, vilket också påverkar innehållsurval. Låt nytt val vara tomt tills ägaren väljer, behåll val vid retry och visa konkret validering. Acceptans: ingen hund får första databasrasen av misstag; valp och femårig hund kan skapas utan kennelkod.

**F02. Flera utträden kastar utkast utan motsvarande rutinskydd.** Loggeditorn stängs med `setEditingId(null)` i `LogScreen.tsx:339`; hälsosheeten stängs i `HealthScreen.tsx:44`; profilens tillbaka/Avbryt går direkt till `onBack` i `EditDogProfileScreen.tsx:147,235`. `Motion.tsx:91` nycklar om skärmträdet vid sidbyte. Belagt: lokal osparad inmatning har inte rutinhanteringens gemensamma leave-kontrakt. Inför en avgränsad, återanvändbar dirty/pending/unknown-regel. Explicit Avbryt får kasta enligt tydlig avsikt; oavsiktlig backdrop/swipe/tabb/back får inte tyst kasta. Börja med logg/profil och hälso-/påminnelseformulär; skydda mutationens ägare och återhämtning även om vyn byts.

**F03. Kod-/fixture-PASS har blandats ihop med produktförväntan.** Gesture-tasken är uttryckligen blocked för native/browser i befintligt underlag. `codemagic.yaml:21–22` använder reviewflagga och reviewkanal medan public-workflow har egen flagga. Reviewträning är medvetet lokal i `review-training-state.ts:18`; det är inte bevis på trasigt public-sparande. Registrera commit, kanal, flaggor och faktiskt provad resa i varje checkpoint. LUNA ska kunna fortsätta lokal rättning även om telefonens version är okänd.

### P1 — gör kärnresorna korrekta och sammanhängande

**F04. Gest- och sheetlagret motsvarar inte utlovad interaktion.** `MainSwipeNavigation.tsx:33` aktiveras sent, inne i `AppScreen`-scrollen (`AppPrimitives.tsx:25`, `ProductWorkspace.tsx:2447`). Konflikt är en reproduktionshypotes. `BottomSheet.tsx:11` saknar däremot belagt draghantering. Separera riktningslås från committröskel, lägg gestansvar på rätt viewportnivå och hantera cancel/terminate. Börja med sheetdrag i handtag/rubrik; all stängning går genom ägarens guard. Nekad stängning återställer draget, direkt vid reducerad rörelse.

**F05. Hem öppnar en generell träningsflik från en specifik uppgift.** `HomeScreen.tsx:209` använder `onGo('training')`; checklistan har redan exakt version/steg i `ProductWorkspace.tsx:2506–2509`. Återanvänd målidentiteten och samma behörighets-/tillgänglighetskontroll. Acceptans: rätt uppgift öppnas, rätt status återkommer och ursprungsvyn återställs. Ändringen får inte bredda vuxen-/publiceringsreglerna; osäker källa visas som otillgänglig.

**F06. Hem har flera konkurrerande vägar till samma dagsområde.** `HomeScreen.tsx:161–173,212–216` visar Hantera, Visa dagens checklista och vid fler rader Visa alla. Samla översikt/fördjupning i en tydlig rubrik-/chevronväg och placera rutinadministrationen där den behövs. Detta är ett UX-förslag: uppdatera Hem-kontraktet tillsammans med eventuell ändrad destinationssemantik, inte tyst i en komponent. Behåll tre jämställda genvägar och separat checkbox/detaljhandling.

**F07. Panel 4 saknar veckoresan och Kommande.** `DailyChecklistScreen.tsx:135` visar korrekt bara Idag/Alla. Nästa befintliga köpost är `FLOW-HOME-CHECKLIST-WEEK-01`; den ska inte märkas klar eller ersättas med dekorativa segment. Implementera verklig lokal vecka, dagsmängder och versionsbunden träning; därefter faktiska framtida plan-/schemakällor. Mallar i Alla är inte veckans utförda aktiviteter. Prova veckogräns, tidszon, partial, dagskopior och förändrad mall.

**F08. Vuxenrelevans/yturval är inte en gemensam produktpolicy.** `workspace-data.ts:914–922,947–966` väljer på publicering/ålder/ras och återupptagen progress. En tom vuxen-allowlist finns för daglig träning (`daily-activity-model.ts:180–182`) och exakt checklistmål spärras (`ProductWorkspace.tsx:2528`), men vanliga Träning använder programurvalet direkt (`:2562`). Detta är ett policygap, inte bevis på att visst olämpligt material nu visas. Definiera en gemensam per-version relevansmatris för målgrupp och yta innan navigation/urval breddas. Product/Dog Expert granskar saklig lämplighet; LUNA skapar inte medicinska eller redaktionella godkännanden. Behåll historisk progress och åtskild åtkomst till sparat arbete.

**F09. Livsperiodmodellen återstår.** `onboarding/dog.ts:14,66` ger tre breda faser, medan MVP v2 §6 beskriver tio perioder/fem faser och separat individuell kontext. Inför en testbar resolver med beslutade gränser och en egen avgränsad plan för individuell kontext. Det kräver inte ny hundidentitet. Individuell seniorstatus får inte härledas som medicinsk slutsats ur ålder.

**F10. Kunskap saknar full upptäcktsresa och publicerad FAQ.** `KnowledgeScreen.tsx:58,85` har tabbar men ingen textsökning eller ämnesfiltrering; `FAQScreen.tsx:16` ger alltid tom lista i publicläge. Bygg sök på en tydligt definierad publicerad population och verklig metadata; visa om mängden är begränsad. Publicera granskade FAQ-versioner genom befintlig innehållsprocess. Bevara källor, fulltext och reviewgränsen.

**F11. Hälsobekräftelse ägs av en vy som stängs.** `HealthScreen.tsx:53–54` stänger editorn när save/delete bekräftas; success-toast ligger inne i `HealthHistoryScreen.tsx:173` och initieras av dess effekt. Risk: återkopplingen försvinner med editorn. Flytta bekräftelsen till kvarvarande vy och visa rätt uppdaterad post. Detta behöver reproduceras i render/runtime; behåll fel/unknown och utkast inne i editorn.

### P2 — färdigställ återstående MVP-paneler och minska underhållsrisken

**F12. Panel 2, 3 och 8 har inga egna produktdestinationer.** `ProductWorkspace.tsx:131` saknar Utveckling, Dagens framsteg och Insikter. Bygg tre separata resor enligt upplevelsekontraktet; rita inte tre fristående demoskärmar. Dagsring och lista använder samma fullständiga bekräftade mängd; veckomål behöver definierad period/population. Insikter behöver fullständig periodläsning, sidning, numeriskt alternativ och täckningsstatus. Ett sömnevent ger inte sömnvaraktighet.

**F13. Hem får hälsodata som inte används.** `ProductWorkspace.tsx:2458–2463` skickar events/hälsohistorik/planer men `HomeScreen.tsx:33–49` destrukturerar/renderar dem inte. Koppla bara in en ägarvald/relevant kommande händelse när den tillför värde, med rätt källdestination och märkning planerad. Gör detta inom Hem-kontraktets komposition; skapa inte en extra stor dashboard eller räkna planen som genomförd aktivitet.

**F14. Navigationen är lokala vybyten, inte en produktstack.** `app/index.tsx` öppnar `AppFlow`; `ProductWorkspace.tsx:157–163` äger `page/previousPage`. `app/_layout.tsx`-stackens animation skapar inte automatiskt native push/back för dessa vyer. Gör först entry/return/dirty-regler explicita. Migrera därefter en detaljresa åt gången till befintlig Expo Router/native-stack, med workspace ovanför routade skärmar. Bevara aktiv huvudflik, datum/filter och redan införda `scrollOffsets`.

**F15. Workspace blandar många ansvar.** `ProductWorkspace.tsx` är 2 772 rader: navigation, cache/läsningar, mutationsköer, notiser, samtycke och rendering. `workspace-data.ts` är 1 269 rader med flera domäner. Extrahera en domäncontroller/hook åt gången med oförändrat API och testad scope-/generation-/readbacklogik. Inget generellt nytt statebibliotek eller allomfattande repositorylager behövs som förarbete.

**F16. Scroll och freshness behöver tydligt ägarskap.** Alla produktvyer ligger i en gemensam `ScrollView`; listor byggs ofta med `.map`. Låt långlistor äga `FlatList`/sektioner och gör skalets scrolling valbar i berörda resor; undvik nästlade vertikala listor. Innehåll läses i en urvalseffekt (`ProductWorkspace.tsx:922–938`), medan foreground-refresh främst gäller dagsaktivitet/träning (`:946–951`). Definiera selektiv revalidering av aktiv resurs och bevara bekräftat innehåll samt olösta mutationer. Prestanda/staleness är risker att mäta, inte redan reproducerade fel.

### P3 — visuellt system och taktil polering

**F17. Gemensamma komponenter finns men konsumtionen är ojämn.** `AppPrimitives`, `components/ui` och lokala skärmstilar blandas. Behåll fungerande varianter och inför konsekventa ScreenHeader, grupperad listyta, formulärfält, feedback och sheet-kontrakt som namngivna komponentvarianter. Föreslagna namn är inte befintliga API:er. Enhetliggör fokus/fel/disabled, titelstorlek, radtäthet, hörn, safe area och fasta formuläråtgärder per berörd resa. Uppdatera galleriet med samma komponenter, inte en alternativ produktskiss.

**F18. Bildval och rörelse är lokala snarare än innehållsstyrda.** Kunskap använder fast hero och indexbaserat bildval (`KnowledgeScreen.tsx:101,105`); Träning använder samma `trainingImage` för alla program (`PublishedTrainingScreen.tsx:9,98`). Definiera spårbar per-innehållsbild/fallback utan nytt personfotoflöde. Återanvänd befintlig Animated-bock/progress/toast; inför inte dubbel success-animation. Se rörelsekontraktet nedan.

## 6. Gemensamt UX- och rörelsekontrakt

- Fem huvudflikar kvar: Hem, Logg, Träning, Kunskap, Mer. De åtta panelerna är resor, inte åtta flikar. Detaljvyer har synlig tillbaka och rätt aktiv förälder.
- En primär uppgift per vy; Hemmets tre destinationskort är jämställda. Separera checkbox från detaljöppning. Snabbregistrering loggar med en handling; extra detaljer är valfria.
- Presentationsstate äger inte affärsresultat. Pending visar direkt återkoppling; bock, success och progression följer verkligt bekräftad källa. Unknown förblir kontrollerbart och kan inte döljas av animation.
- Föreslagen `ScreenShell` separerar safe area/header/footer från scroll. Controller/view-model äger aktuell resa; domänadaptrar behåller befintliga data-/RLS-kontrakt. Dessa är arkitekturriktningar, inte redan implementerade moduler.
- Drag följer fingret; släpp/cancel fjädrar till giltigt läge med dämpad `Animated.spring`. Knappar använder befintlig tryckskala 0,98 och snabb återgång. Tidsstyrda fades/check/progress ligger normalt 120–350 ms i tokens och kan avbrytas.
- Transform/opacity kan använda native driver; PanResponders move-logik kör fortfarande på JS-tråden. Utvärdera mätt nativeprestanda innan ett nytt gest-/animationsbibliotek föreslås.
- Reducerad rörelse ger direkt tillstånd/återställning. VoiceOver-fokus flyttas till öppnad sheet/detalj och tillbaka till utlösaren när den stängs; bakgrunden ska inte konkurrera med modalens fokus. Behåll 44×44 pt och stöd för minst 140 % text utan klippning.
- Native-stack push/back används för verkliga detaljer efter avgränsad migration. Sheet öppning/stängning och backdrop samordnas; dubbel Modal-slide plus egen translation undviks. `visible` och befintlig stängguard bestämmer slutligt resultat.
- `matchedGeometryEffect` är SwiftUI och ingår inte i React Native. Shared-element, Reanimated/Gesture Handler, haptics och ljud är separata eventuella förslag; de är inte nödvändiga för första rättningarna och inga nya dependencies införs här.

## 7. Arbetsordning för LUNA — små verifierbara checkpoints

Varje rad nedan är ett paket av **separata** kompletta checkpoints där flera resor anges. En aktiv checkpoint åt gången. Exact write_paths, riskklass och acceptans fastställs i aktuell taskplan före appkod; denna masterplan är inte en blanket-APPROVE.

| Ordning | Checkpoint / ägare | Beroende och tänkta skrivytor | Konkret slutvillkor |
| --- | --- | --- | --- |
| R0 | Baslinje, koordinering och reproduktion / LUNA + QA | `docs/tasks/`, aktuell köpost; tillfällig devdiagnostik där behövs. | Referens-SHA, buildkanal, källa för varje panel och explicit bevisstatus. Föreslagen prioritering jämkas med planerade Week-posten utan att historik skrivs om. Telefonens okända build stoppar inte övrigt lokalt arbete. |
| R1a | Explicit rasval / LUNA | `ProfileScreen.tsx`, relevanta profiltester. | Ingen implicit ras. Lyckat/fel/unknown för befintlig profilskapning består. |
| R1b–e | Utkast och kvarvarande feedback / LUNA, en formulärresa i taget | Loggeditor, profil, påminnelser, sedan hälsa med relevant riskreview. | Back/backdrop/tabb/cancel har testad semantik; osparad inmatning tappas inte tyst. Health-success syns efter editorstängning. |
| R2a | Huvudgest / LUNA | `MainSwipeNavigation`, `AppPrimitives`, workspacekoppling, gesttokens. | Vertikal scroll, horisontella regioner, sidgränser och cancel fungerar; ett drag ger högst ett sidbyte. Provtrösklar fastställs efter reproduktion. |
| R2b | Gemensam sheet / LUNA | `BottomSheet`, `Motion`, tokens och en migrerad konsument. | Fingerföljning, guarded close, nekad stängning och tangentbord fungerar utan att scroll stjäls. Övriga konsumenter migreras kontrollerat. |
| R3a | Hem → exakt uppgift → tillbaka / LUNA | `HomeScreen`, workspace navigation/callbacks. | Exakt källa/version/steg, nuvarande relevansgräns och rätt returkontext. Ingen ökad innehållsbehörighet. |
| R3b | Denna vecka / LUNA, Architect/Security enligt dataplan | Befintlig Week-task, dagsmodell/läsning och `DailyChecklistScreen`. | Riktig veckomängd, timezone/snapshot-paritet och återgång; Idag/Alla oförstörda. |
| R3c | Kommande / LUNA | Beror på R3b och verifierad framtida källa; separat Upcoming-task. | Faktiska framtida händelser/rutindatum; ingen påhittad completion eller dekorflik. |
| R4a | Gemensamt redaktionellt relevanskontrakt / Product + Dog Expert, sedan LUNA | Per-version matris, innehållsadaptrar/selectors, Hometräning/Kunskap. | Samma beslutade målgrupps-/ytregler för alla ingångar. Historisk progress består. Detta föregår breddat urval/navigation. |
| R4b | Periodresolver / LUNA med granskade produktgränser | `onboarding/dog.ts` eller avgränsad ny domänmodul; egen plan. | Periodgränser och scenario C fungerar utan ändrade hund-ID eller nollställd progress. Individuell kontext blir egen checkpoint vid nödvändig dataändring. |
| R4c | Publicerad FAQ / innehållsägare + LUNA | Granskad publiceringskälla och `FAQScreen`; ingen implicit publicering. | Publicläge kan läsa verkliga godkända frågor med källa; reviewutkast förblir review. |
| R4d | Kunskapssök/filter/bilder / LUNA | Kunskap, definierad metadata, innehållsurval, delade chips/kort. | Sökbar mängd/taxonomi är sann; ready/empty/query-empty/error; artikel/källa/tillbaka består. |
| R5 | Utvecklingsresa / LUNA + innehållsgranskning | Hemingång, ny detalj och publicerat underlag. | Ålder/milstolpe → riktig guide → Hem; inget antagande om hundens uppnådda färdighet. |
| R6 | Dagens framsteg / LUNA | Samma dagsselector som Hem/checklista, egen detalj. | Ring/lista/källa har samma bekräftade mängd; veckomål först med definierad källa. |
| R7 | Insikter / LUNA | Loggingång, periodläsning, numerisk och grafisk vy. | Full läsning/täckning/tidszon och korrekt återgång. Sömndelen separat tills intervallkontrakt finns. |
| R8 | Stödresor, komponentkonsekvens och navigationsmigration / LUNA, en resa i taget | Hälsa/pass/Mer/profil; delade primitiver; valda Expo-routes. | Bevarade API:er och rättigheter, konsekvent utseende, fasta/scrollbara ytor, fokus och återgång. Ingen bred förhandsrefaktorering. |
| R9 | Motionkalibrering och integrerad slut-QA / LUNA + QA/Reviewer | Tokens och faktiskt berörda komponenter. | Nativekänsla och A–F provade på avsedd nivå; visuella avvikelser rättade mot rev02. Funktion/data/native/release redovisas separat. |

Visuell kalibrering och tillgänglig interaktion ingår i **varje** relevant resa. R9 är samordnad slutpolering, inte tillstånd att lämna alla tidigare checkpoints som ofärdiga trådskisser.

## 8. Acceptans och teststrategi

Varje checkpoint dokumenterar fem separata kolumner: **kod/funktion**, **lokal QA**, **visuell likhet**, **live DB/RLS**, **native/build/distribution**. Skriv PASS bara för faktiskt genomförd kontroll; i övrigt konkret lucka/NOT TESTABLE. `done` för en checkpoint stänger inte en hel panel.

- För ändrad logik: meningsfulla enhetstester för gränser, konto/hundscope, stale response, dags-/veckobyte, dubbeltryck och misslyckad/okänd skrivning. Undvik tester som bara letar efter en viss källsträng när det är beteendet som behöver säkras.
- För ändrad UI: kör riktiga tryck-/scroll-/inmatningsresor och färska bilder av samma presentationskomponenter som produkten. Den separata webbharnessen stöttar layoutgranskning men kan missa workspaceintegration och native responder-/keyboardbeteende.
- Bildmatris enligt kontrakt: 375×844, 430×844, liten höjd 375×667, 140 % text, längre svensk text, reducerad rörelse och relevanta fel/unknown/tomlägen. Webbsimulerad stor text är inte native Dynamic Type/VoiceOver.
- Kör `pnpm check` och `git diff --check` för implementation, därefter relevant QA och oberoende Reviewer enligt risk. Auth/RLS/health/notiser/export och ändrat innehållsurval får relevant specialist-/integrationsgranskning. Telefonprov kan samlas enligt befintlig policy; ingen ny automatisk stoppgrind mellan varje paket införs.
- Slutresor A–F i `docs/mvp.md` omfattar ny valp, vuxen hund, periodskifte, tomt/allt klart, fel/unknown och individuell seniorstatus. Native callback, PDF, notisleverans och verkliga backendkontrakt verifieras där deras acceptans kräver det.

## 9. Faktiskt utförd verifiering och review

- 273 granskningsfiler matchade målbranchens Git-blobs; noll hashavvikelser. Detta verifierar basen, inte runtime.
- Befintliga Node-filer för domain, log-model, daily-activity-model, home-today, home-greeting, main-navigation, checklist-model, planned-health-time, content-release-guard och referral kördes i exakt källkopian med `node --experimental-strip-types --test --test-reporter=tap ...`. Resultat: exit 0, **10 testfiler godkända, 0 misslyckade**. Under själva analysen verifierades ingen full check, ny iOS-build, verklig DB/RLS eller nativegest. Efterföljande commit-/push-kontroller redovisas separat i leveransbeskedet.
- Product: **IN MVP** för identifierade resor; bevara fungerande grund och separera kod, visuellt och live/native.
- Architect: rekommenderar befintlig stack/datakontrakt och stegvis ansvarsfördelning. Rådgivning, inte exakt implementations-APPROVE.
- Critic: **PROCEED WITH CHANGES** som rådgivande masterplan. Infört: små separata R4-resor, tidigt utkastskydd även i stödflöden, relevansgrind före breddad navigation, tydlig inventering/bevisgräns och inget stopp för oberoende lokalt arbete vid okänd telefonbuild.
- Slutlig Critic-granskning av den sparade masterplanen: **PROCEED** för dokumentleveransen och rådgivande genomförandeordning; inga nya materiella sak-/scopeinvändningar. Detta ersätter inte taskspecifik implementationsgranskning.

**Nästa konkreta steg:** LUNA använder R0 för att spara en kort omplaneringscheckpoint och specificerar R1a som första lilla belagda buggfix; R1b:s utkastresa och R2:s reproduktion kan därefter följa utan att någon ny produkt-scopefråga behöver återöppnas. Den redan planerade Week-uppgiften står kvar med oförändrad historik tills den nya ordningen registrerats korrekt.

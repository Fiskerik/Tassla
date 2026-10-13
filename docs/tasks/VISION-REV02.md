# VISION-REV02 — sammanhängande design- och byggunderlag

Datum: 2026-10-13. Branch: `design/vision-rev02`. Bas: `9128cdd` på `work`; designunderlag commit `1686cca` är pushat till `origin/design/vision-rev02`.

## Beställning och leverans

Erik beställer specifikation, byggprompt för Hem, komponentutvecklingsunderlag och koppling av produktobjekt, sammanställda i ett uppdaterat designregelverk mot `vision_rev02.jpg`, på ny branch. Den 2026-10-13 bad Erik att R02-1, R02-2 och R02-3 ingår i samma implementationpaket efter att designunderlaget pushats.

Denna dokumentleverans konkretiserar hela förflyttningen. Komponent-API:er, nya produktobjekt och skärmar som beskrivs som föreslagna är ännu inte implementerade. Vid första dokumentleveransen låg layouten på bascommitten; R02-1/R02-2 har därefter implementerats. Se aktuella checkpointar nedan. Ingen backendmigrering eller innehållspublicering sker genom dokumentändringarna.

## Aktuell designprecisering — 2026-10-13

Erik jämförde R02-2:s Hem med rev02 och efterfrågade en specifikation som matchar layout, objekt, komponenter, innehåll **och färger**. Detta mandat avser nu en dokumentprecisering; dokumenten är inte en ny appimplementation eller visuell QA.

| # | Ägare | Beroende | Skrivfiler / resultat | Acceptans / status |
|---|---|---|---|---|
| V1 | Koordinator | Ägarens två bilder och kodinventering | Diagnos i `docs/plans/HOME-REV02-visual-ux-spec.md` | Klar: konkreta skillnader knutna till faktisk kod |
| V2 | Koordinator | V1 | Samma UX-spec, regelverk, skärmspec, objektstatus och byggprompt | Klar: färgtokens, måttbudget, bildroller, komponent-/innehållskontrakt och hanteringsvägar |
| V3 | Critic läsande, koordinator sparar | V2 | Denna checkpoint och slutlig dokumentkontroll | Klar: Critic PROCEED, diffcheck och lokala dokumentlänkar kontrollerade; ingen produktkod ändrad |

Nya kontraktet har företräde för Hem-presentationen. Tidigare R02-1-PASS gäller sin historiska version; den senare R02-2-bilden uppfyller inte det preciserade designmålet. R02-2 står kvar i QA och R02-3 är fortsatt separat kommande arbete. Ingen databasaktivering eller ny produktionsverifiering har utförts.

Critic hittade tre konkreta luckor i första utkastet: otydlig skillnad mellan rutincheckbox och träningsindikator, dold ingång till hantering samt 4 pt fel i dagskortets höjdsumma och otillräcklig progresskontrast. Dokumentet har rättats med två radvarianter, synlig rubrikchevron, korrekt summa 288 pt och progressfärg `#35875A` (3,51:1 mot banan). Förnyad Critic-granskning: **PROCEED**; inga betydande dokumentinvändningar kvarstår. Detta godkänner specifikationen som underlag, inte kod, interaktioner, bildasset eller visuell likhet. Diffcheck och lokala dokumentlänkar passerade; ingen app-/databasprovning har gjorts i detta dokumentpaket.

Nästa implementationssteg: konkret plan för Home-tokens/komponentvarianter och samma presentation i referensfixture och R02-2-adapter, följt av fungerande hanteringsfördjupning och bildasset. Exakta skrivfiler/review enligt arbetsflödet; inga ändringar av completion, auth eller schema för designens skull.

## Uppföljning: bindande designregler v2.2

Erik bad uttryckligen att även designreglerna skulle styra genomförandet mot vision_rev02 och utökade sedan dokumentbeställningen till övriga skärmar så att Codex kan bygga hela det sammanhängande uttrycket. Dokumentarbete inom befintligt mandat, inga UI-kodändringar.

1. Koordinator: precisera `docs/design-rules.md` med direkt färgtabell, obligatoriska Hem-former, jämförelsematris före kod och separat visuell acceptans per designområde. Beroende: föregående Hem-kontrakt. Utfört.
2. Koordinator: uppdatera `AGENTS.md` och `docs/dev/ui-and-code-standards.md` så att nya arbetspass följer samma krav. Beroende: 1. Utfört.
3. Koordinator: tillagt `docs/design/vision-rev02-screen-contracts.md` för samtliga åtta paneler/stödskärmar och `docs/prompts/build-rev02-screens.md`; länkat från skärmöversikt, regelverk, AGENTS och UI-guide. Beroende: 1–2. Utfört.
4. Critic läsande, koordinator sparar: kontrollera konsekvens med Hem-kontraktet och verifiera dokumentlänkar/diff. Beroende: 1–3. Klar: Critic PROCEED, lokala länkar och diffcheck passerade.

Första Critic-genomgången av åttapanelkontraktet hittade tre luckor: Loggs snabbregistrering riskerade ett extra tryck, matens gröna färg avvek från panelen, och tillbakaresorna för Framsteg/Insikter var visuellt oklara. Rättat med synliga primära snabbval och ett-trycksregel, varm matvariant samt synlig tillbaka-knapp som uttryckligt dokumenterad avvikelse i båda detaljvyerna. Förnyad granskning: **Critic PROCEED**, inga kvarstående betydande dokumentinvändningar. Dokumentgodkännandet avser byggunderlaget; faktisk navigation, renderkontrast och visuell panellikhet är ännu inte verifierade.

Acceptans: referensen styr även färg och komponentform; befintliga komponenter är anpassningsbara; avvikelser kan inte döljas bakom ett funktionellt PASS; sanningsenlighet, tillgänglighet och redan beslutat mandat bevaras. Kodrender och appstatus ändras inte av denna dokumentleverans.

## Deluppgifter

| # | Ägare | Leverans / filer | Beroende | Acceptans / verifiering |
|---|---|---|---|---|
| 1 | Koordinator + Product/Architect, läsande | Ny branch, inventering av målbild, komponenter och datakällor | Bascommit | Aktuell implementation skiljs från förslag; verkliga sökvägar |
| 2 | Koordinator | `docs/design-rules.md`, `docs/design/vision-rev02-spec.md`, `docs/design/vision-rev02-objects.md`, `docs/prompts/build-home-rev02.md` | 1 | Alla åtta målbildsvyer, Hem-kontrakt, komponenter, tillstånd, innehåll och dataflöden beskrivna |
| 3 | Koordinator | `.agents/skills/tassla-consumer-ux/SKILL.md`, `.codex/skills/SKILLS.md`, `docs/dev/ui-and-code-standards.md`, kort aktuell hänvisning i `AGENTS.md` | 2 | Aktiva anvisningar använder samma målbild; äldre paketrapporter bevaras |
| 4 | Architect, Critic läsande; koordinator sparar | Detta dokument: granskning och checkpoint | 2–3 | Inga påhittade fungerande API:er, inga falska progress-/QA-påståenden; lokal länkkontroll och diffcheck |

Produkt- och arkitekturinventering sker parallellt utan skrivåtkomst. Koordinatorn äger dokumentändringarna.

## Föreslagen byggordning efter dokumentleveransen

| Paket | Resultat | Berörda områden | Beroende / grind |
|---|---|---|---|
| R02-1 | Hem-referens, delade aktivitets-/destinationsrader och visuell struktur | `src/components/ui/`, `HomeScreen.tsx`, `tools/visual-check/` | Exakt plan i `docs/tasks/dev/vision-rev02.md`; Architect + Critic före kod; visuell evidens |
| R02-2 | Ägarvalda dagsrutiner och källhärledd träningsprogress på Hem | Daily-activity-modul, Supabase-migrering/RLS-test, workspace-integration | Eriks completion-regel är sparad i plan; ny exakt Architect/Critic/Compliance/Security-review före kod |
| R02-3 | Migrera Träning, Kunskap och Logg till matchande komponenter | Respektive feature + befintliga publicerade källor | Efter R02-2 checkpoint; separat exakt plan/review; bevara sparning, FAQ/checklistor och återhämtning |
| R02-4 | Utveckling, Dagens framsteg och Insikter | Nya detaljvyer och befintliga dataläsare | R02-2 där progress används; sakgranskat innehåll, kompletta perioddata |
| R02-5 | Valfritt personligt hundfoto | Profil, filhantering, lagringspolicy/radering | Separat konkret foto- och säkerhetskontrakt; blockerar inte redaktionella bildkort |

Varje rad delas i små vertikala implementationtasks med exakta skrivfiler, tester och oberoende QA/review enligt `docs/dev/workflow.md`. Paketen ovan är ordning och mål, inte färdiga tekniska godkännanden. Befintligt mandat återanvänds; fråga endast om en faktisk obesvarad produkt-/data-/kostnadsfråga behöver avgöras.

## Checkpoint

- Inventering slutförd; branch skapad med ren bas.
- Regelverk, skärmspecifikation, objektkontrakt och byggprompt är skrivna. De två skillkopiorna och aktiva designhänvisningar är synkade till rev02.
- Dokumentgranskning slutförd: Architect APPROVE för dokumentpaketet; Critic PROCEED. Se sparade granskningsresultat nedan.
- Ingen ny appkod, rendering eller databasverifiering har utförts i dokumentpaketet.
- Lokala kontroller: diffcheck utan fel, 10 relativa dokumentlänkar har befintliga mål, skillkopiorna är identiska. Inga apptester körda för rena dokumentändringar.
- Designunderlaget är commit `1686cca` och pushat. Implementationplan v8 för R02-1/2/3 finns i `docs/tasks/dev/vision-rev02.md`; R02-1 är done efter correction-10/12 QA PASS och Reviewer PASS; dess kodscope är avslutat. Correction-12 verifierar faktisk scroll och fast banner vid 140 % text. Exakt R02-2-plan v8 har Architect APPROVE, Critic PROCEED, Security APPROVE och Compliance APPROVE. R02-2 implementation är överlämnad till QA med syntetisk lokal rendering; oberoende QA/Reviewer och PostgreSQL runtime återstår.

## Sparad dokumentgranskning

Architect: **APPROVE för dokumentpaketet**. Källor och befintliga API:er stämmer med kodbasen och skiljs från förslag. Dokumenten är samstämmiga om okänd/ofullständig data, lokalt dygn och låst tidszon för aktivitetsinstanser, konto-/hundavgränsning, radering och 16 pt marginal över navigationen. Inga blockerande dokumentfel hittades.

Den ursprungliga dokumentgranskningen godkände designunderlaget, inte implementationen. Den efterföljande produktfrågan är nu besvarad: rutiner markeras av ägaren; träning härleds från sparad progress; guideöppning, vårdplan och olänkad logg räknas inte. Granskningsnoteringen ovan om att completion- och urvalsregeln återstod är historisk och har ersatts av implementationplan v8. R02-2:s exakta tekniska plan är godkänd för implementation efter R02-1-checkpoint; föreslagna API:er är inte befintliga API:er.

Critic: **PROCEED**. Alla åtta bildpaneler kopplas till komposition, användarflöde, befintliga källor/luckor och byggmål. Hem har detaljerat kontrakt och prompt; övriga vyer ligger i tydligt ordnade senare paket. Syntetiska dagsuppgifter begränsas till granskningsläge. §14 kräver jämförelse sida vid sida av layout, komponentformer, objekt, innehållstäthet och bilder; korrekta mått kan inte upphäva synligt fel komposition. Inga blockerande motsägelser hittades. Dokumentgranskningen innebär inte visuell acceptans av appen.

## Ny implementationbeställning 2026-10-13

Erik bad att R02-1, R02-2 och R02-3 genomförs som ett sammanhängande arbetspaket. Product rekommenderar tre sekventiella delgrindar för att Home-referens inte ska misstas för produktionsdata och för att sparad dagsmängd ska stabiliseras innan tre befintliga vyer migreras.

Erik valde uttryckligen: ägarvalda rutiner markeras av ägaren; valda träningssteg blir klara via befintlig sparad träningsprogress; guideöppning, vårdplan och olänkad logg räknas inte som klara. R02-2-plan v8 preciserar att ägaren uttryckligen väljer vilka egna rutiner som ingår varje lokal dag; automatisk återkomst byggs inte in. Träningsurval är begränsat till programmets nästa tillåtna steg. Architect, Critic, Compliance och Security godkände exakt v8; väntan på R02-1 Reviewer-checkpointen var den ursprungliga grinden och är nu historisk.

## R02-2 implementation checkpoint — 2026-10-13

Queue-status är `qa`. Implementerevidens, checkresultat och screenshots ligger i `docs/design/evidence/vision-rev02/r02-2/`. `pnpm check` passerade med 45/45 test, public iOS-export och dev-flow-validering passerade; 375/430 webbrenderingen använde uttryckligt syntetiskt granskningsläge och verifierade fem första rader, full expansion till sju och minst 20 px mellan “Visa alla” och bottennavigationen. Rutinhantering och träningsval är hopfällda som standard.

Supabase CLI saknas och Docker-daemonen är inte tillgänglig. Migration, SQL/RLS, serverstämpling, gallring/scheduler och tvåsessionsprovet över midnatt är `NOT TESTABLE`; SQL-filen innehåller separat instruktion för senare lokalt syntetiskt tvåsessionsprov. Därför är detta implementerens QA-handoff, inte QA- eller Reviewer-godkännande. R02-3 ligger kvar planerad till stabil R02-2-checkpoint och ny exakt planreview.

## Sparad inventering

Product bekräftar att målbilden innehåller åtta vyer och att befintligt Hem är en källöversikt. Daglig completion, milstolpar, progressring och fullständiga insiktsgrafer är nya produktkontrakt. Kunskapens faschecklista får inte beskrivas som en redan fungerande dagslista. Befintliga loggtyper och FAQ/checkliståtkomst ska bevaras.

Architect bekräftar exakta källor: `dogs`, `dog_events` (vardag, vikt och utförd hälsa med olika kontrakt), `dog_health_plans`, publicerade `content_versions`/`training_steps`, `training_progress` och hundens checklistdata. Rekommendationen är separata sanningskällor och härledda vyer, inte universell completed-flagga eller kopierad progress. Ny manuell dagsrutin är ett separat föreslaget objekt som behöver lagringskontrakt; källstyrd dagsstatus härleds från befintlig källa. Befintligt MVP-språk om utvecklingshändelser motsvaras ännu inte av en implementerad observationskälla.

Erik har uttryckligen beställt och godkänt att arbetspaketet omfattar R02-1, R02-2 och R02-3. Det godkännandet sätter produktomfattningen; tekniska säkerhets- och datagrindar för respektive del kvarstår enligt den exakta planen.

## Plan v6 — uppdateringar efter granskning

- R02-1 omfattar komponentgalleriet, tidsanpassad svensk hälsning med `Hej!`-fallback, tydliga destinationsikoner och en syntetisk review-banner som inte försvinner vid scroll. Public Home visar inga fixture-rader eller fejkade dagsantal och har ingen completion-checkbox före R02-2. Architect APPROVE och Critic PROCEED.
- R02-2 skiljer rutinmallar från uttryckliga dagval och träningsval. Rutiner återkommer inte automatiskt. Träning behåller `training_progress.completed_at` som enda completion-källa; `src/data/workspace-data.ts` ska exponera tidsstämpeln och få datumprojektionstest.
- R02-2-planen anger exakta nycklar/kolumngrants, sammansatt hund-/rutin-FK, publicerad hund-/datum-/ras-eligible träningskälla, serverstämplad completion med datumkontroll även efter midnatt, stabila idempotenta retries för alla create-val, 30-dagars gallring (bort vid nästa dagliga jobb, normalt inom 24 timmar), åtkomst-/kopieringsförfrågan för rutinmallar och daterade urval, RLS, konto-/hundradering och syntetisk tvåägarverifiering.
- MVP, betainformationens arbetsutkast och datalivscykel ska beskriva det nya ändamålet, dataminimering och gallring före beta. Det blockerar inte lokal syntetisk implementation; det godkänner inte live-beta eller publicering av integritetsinformation.
- R02-2 v5 preciserar service-only purge-behörighet och 30-dagars cutoff per IANA-zon, idempotent readback för rutinmallar och alla dagval, avvisning av redan avslutat träningssteg samt compare-and-set för stale undo.
- R02-2 v6 låser träningsval till nästa tillåtna steg och tar bort senare tillbakadraget program från dagsurval/count. Åtkomst-/kopiehantering är en beta-process, inte en ny exportvy.
- Architect/Critic/Security/Compliance ska godkänna den exakta R02-2-planen v6 innan dess dataimplementation startar. R02-3:s gemensamma komponentfil-lista skjuts till dess separata exakta plan. R02-1 kodning pågår; ingen R02-2 migrations-/datakod är ändrad.


## Plan v7 — trigger review och blocker

- R02-1-kod är implementerad inom godkänd scope. Den första korrigeringsrundan behövde oberoende render/§14-revision av fit, porträttets visuella storlek och datumkontrast; historiken och skärmbilderna är bevarade nedan och i respektive QA-mapp.
- R02-2 v7 lade till privat `SECURITY DEFINER`-triggerfunktion med tom `search_path`, fullt kvalificerade referenser, caller-ownership-check, inget direkt `EXECUTE` för klientroller och triggerbegränsad låsning utan bredare klientgrants. Critic lämnade PROCEED; Security hittade därefter blockerande midnattsrisk i transaktionstid `now()`.
- R02-2 förblir planerad tills R02-1 checkpoint är slutförd och alla fyra exakta planreviews är sparade. R02-3 är fortfarande separat grind efter stabil R02-2-checkpoint.


## Plan v8 — godkännanden och QA-checkpoint

- R02-2 v8 använder en enda `clock_timestamp()` tagen efter relevanta lås för både lokal-datumskontroll och completionstämpel. `now()` får inte användas för aktivitetsdatum-/completion-guards eftersom transaktionstid kan vara gammal efter en lång låsväntan. SQL-regression ska täcka ett skrivförsök som startar före midnatt och fortsätter efter låsning efter midnatt. Architect APPROVE, Critic PROCEED, Security APPROVE och Compliance APPROVE är registrerade för exakt v8. Förebyggande R02-1-checkpoint var grinden vid planbeslutet; den är stängd och implementationen är nu överlämnad till QA enligt checkpointen ovan.
- R02-1:s ursprungliga QA blockerades på första-vy-fit; rapport finns i `docs/design/evidence/vision-rev02/r02-1/qa-failure/`. Samma-scope korrigeringar passerade därefter public/review initialfit: kortens nederkant y=768 och nav börjar y=785, vilket ger 17 px marginal vid 375/430. Porträttet ökades till cirka 108×124 px synlig yta inom den fasta 120×124-ramen. Corrections 5–9 rapporterade först överlapp mellan illustration och datum, därefter underkänd glyphkontrast eller för svag illustration. Correction-10 flyttade den godkända gräddbakgrunden till en wrapper-View kring berörda veckotal; oberoende QA mätte minst 6,55:1 för alla veckoglypher vid 375/430 och 140 % text. Correction-12 verifierade scrollreachability vid 140 %: sista knappen lämnar 55,39 px till navigationen vid 375 och 47,59 px vid 430; reviewbannern är fast efter textskalning. Public/review fixture, destinationsnavigation, reducerad rörelse, stora texter, 17 px initial clearance och porträttnärvaro passerade. QA-evidens för slutgrind: `docs/design/evidence/vision-rev02/r02-1/qa-correction-12/`; tidigare omgångar och blockerande rapporter finns kvar under `r02-1/`. Checklistflikens innehåll är ej testbart i harness utan checklistklient/hund; native-enhet är inte testad. Huvudsessionen körde fokustester 3/3, `pnpm check` (41 test, 38 lint-varningar/0 fel), public iOS-export, Python syntax, diffcheck och queue validation med PASS. Separat Reviewer PASS. R02-1 queue→done; R02-2 implementing endast med syntetiska lokala data. Ingen live migration, produktion eller extern publicering.

# VISION-R02-3 — Logg, Träning och Kunskap enligt vision_rev02

Datum: 2026-10-14 · Version: 6.3 · Status: 3A/3B/3C checkpointade; R02-3C null-age-korrigering har färsk Reviewer PASS · Branch: `work`

## Mål

Fortsätt den godkända rev02-designriktningen från Hem till de tre andra huvudflikarna: Logg, Träning och Kunskap. Återanvänd den varma gräddvita grunden, tydlig typografi, grupperade ytor, avgränsade färgroller och verkliga redaktionella bilder där de redan finns. Stödskärmar under Mer och auth/onboarding omfattas av Eriks övergripande direktiv men får egna exakta planer, filscope och reviewgrindar efter att denna R02-3-sekvens är checkpointad.

Det här arbetet uppdaterar presentationen och de segmentnamn/layoutdetaljer som behövs för panel 5–7. Det lägger inte till vyer, produktobjekt, API:er, innehållstaxonomier, sparregler eller tjänster. Designpanelerna 2–4 och 8 är framtida mål, inte godkännande att bygga Utveckling, Dagens framsteg, Daglig checklista eller Insikter i detta paket. Utveckla inte de funktionerna här.

## Skyddade kontrakt

- `docs/design-rules.md`, §14 och `docs/design/vision-rev02-screen-contracts.md` styr visuell bedömning.
- Beteende, tillstånd, återkoppling, tillgänglighet och felåterhämtning följer `.agents/skills/tassla-consumer-ux/SKILL.md` och respektive skärm-README/UX-kontrakt.
- Behåll nuvarande route- och backrelationer, datakällor, formulärfält, spar-/retry-/undo-/delete-beteenden, kontogränser och public/review-avgränsning. Panelens segmentkontroller får namnges/stylas enligt kontraktet endast där nedan definierad befintlig datamängd ger en sanningsenlig betydelse.
- Ändra inte token-defaults så att skärmar som inte ingår i aktuell slice påverkas. Nya färger och komponentformer ska vara namngivna, semantiska och opt-in.
- Befintliga `dog-welcome.png`, `dog-resting.png` och `puppy-training.png` är redaktionella/generiska assets enligt `assets/images/README.md`; de föreställer inte användarens hund. Lägg inte till eller hitta på bildkopplingar till hundens identitet, ras, ålder eller råd.
- Ingen ny dependency, extern tjänst, migration, personligt fotostöd eller publiceringsändring.

## Skärminventering och sekvens

En slice i taget. Varje slice lämnar repot begripligt och komplett innan nästa börjar. Delade komponenter ändras bara när den aktiva slice behöver en tydligt namngiven variant; skärmar utanför slicen får inte byta utseende genom ett nytt globalt default.

### R02-3A — Logga (panel 5)

- **Användaruppgift:** registrera en vardagshändelse snabbt, se dagens/tidigare poster och rätta eller ta bort en post.
- **Ordning och datumresa:** vänsterställd titel `Logga`; datumrad med begripligt valt datum och föregående/nästa dag; därefter befintlig snabbvalsgrupp i sparad ordning med minst 44 pt träffytor och `Fler`/layoutredigering; sedan vald dags tidslinje med tid, händelsesymbol, titel/detalj och befintlig handling. Startdatum är dagens lokala datum; nästa dag är avstängd efter idag. Datumval filtrerar `occurred_at` enligt samma lokala datumfunktion som loggen. Eftersom `fetchDogEvents` hämtar nyaste först i sidor om 40, fortsätter befintlig paginering tills den äldsta inlästa händelsen har en lokal dag strikt före vald dag, eller `hasMore` är falskt. En dag med äldre sidor pågår inte som komplett eller tom; vid läsfel visas det befintliga retry-tillståndet och redan lästa poster ligger kvar. När snabbval trycks från en äldre dag återgår vyn till idag och startar samma ett-trycksregistrering med aktuell tid som förut. Rader visas i stigande tid inom vald dag. `Idag/Översikt`-kapseln väntar tills den befintliga Översikt-resan leder till en fungerande Insikter-detalj; ingen dekorativ flik läggs till här.
- **Färg/form:** varm canvas och ljusa kort; kategorifärger används enbart för sina händelser (kiss/vatten blå, bajs brun, mat varm beige/brun, sömn lila); gemensam listyta med tunna avdelare i stället för kort per rad; snabbvalen är kompakta, tydliga och färgkodade per kategori. Primär `Lägg till händelse` finns kvar i befintlig kompletterande inmatningsväg om den redan används; snabbval fortsätter vara ett tryck.
- **Opt-in API/tokens:** föreslagna `variant="rev02-log"` på `IconChip` och `QuickLogTile`, `variant="log-timeline"` plus `showDivider` på `ListRow`, och `tokens.colors.log.category.*` för panelens händelser. `food` får en varm beige/brun roll här utan ändring av `categoryColors.food` eller andra skärmar. Befintliga komponent-defaults ändras inte. Lägg till exempel på gamla och nya varianter i komponentgalleriet.
- **Filer:** `src/features/puppy-log/LogScreen.tsx`, `src/components/ui/QuickLogTile.tsx`, `IconChip.tsx`, `ListRow.tsx`, `ComponentGalleryScreen.tsx`, `src/theme/tokens.ts`, `src/features/puppy-log/README.md`, `tools/visual-check/app.tsx`. Datumbläddring använder befintlig `events`, `hasMore` och `onLoadMore`; harnessen får en deterministisk manuell visningsfixture vars paginering, loading och failure/retry drivs av lokalt minne. Den gör inga tjänsteanrop eller datawrites. Reviewrendern visar en synlig `Syntetiskt granskningsläge · loggfixture`-banner; märkningen finns endast i harnessen. Rör inte `ProductWorkspace.tsx`, `log-model.ts`, lagring eller Supabase.
- **Acceptans:** panel 5-komposition, fungerande datumbyte och kategorifärger jämförda mot `vision_rev02.jpg`; primär snabblogg fortsätter vara ett tryck, `Fler` och layoutedit fungerar, rad öppnar samma editor, destructive handling behåller bekräftelse och ångra, tom/laddar/fel/pending/failed/unsure/lång historik behåller sina tydliga lägen. Den manuella harnessfixturen kan visa en vald dag delad mellan sidor, komplettering till tidigare-lokal-dag-gränsen, laddning/fel/återförsök och full respektive tom vald dag. Ingen loggpost beskrivs som råd, sömnintervall eller medicinsk slutsats.
- **Review-fixture:** syntetiska Logg-data visas enbart i den lokala harnessen; reviewläget har synlig `Syntetiskt granskningsläge · loggfixture`-banner. Paginering, laddning, fel/återförsök och full/tom dag styrs av deterministisk minnestatus utan tjänsteanrop eller datawrites.
- **Kommandon/evidens:** kör `pnpm typecheck`, `pnpm lint`, `git diff --check`, `python tools/dev_flow.py validate`; bygg public/review med `tools/visual-check/build.cjs`; starta separata lokala servrar på port 4173/4174 och granska den manuella pagineringsfixturen samt andra loggtillstånd i browser. Spara public/review-skärmbilder/renderingsanteckningar under `docs/design/evidence/vision-rev02/r02-3a/{public,review}/` för 375×844, 430×844 och 375×667 samt 140 % text. Ingen testfil läggs till eller körs i detta arbetspaket.

### R02-3B — Träning (panel 6)

- **Användaruppgift:** hitta ett faktiskt tillgängligt program/steg, återuppta det och förstå vad en ägarmarkering betyder.
- **Ordning:** vänsterställd titel; panelens kapselsegment `Rekommenderat`, `Alla övningar`, `Mina`; `Passar just nu ({ålder})` och rekommenderade bildkort när data finns; `Fortsätt där ni var` för verklig progress; grupperade steg; källa och instruktion i befintlig detaljvy.
- **Färg/form:** varma neutrala ytor; befintlig `puppy-training.png` får användas som generisk redaktionell träningsbild enligt manifestet, utan innehålls- eller hundidentitetsanspråk; grön progress; två kort i bredd med bild ovanför text och ett liggande fortsättkort. Ingen rad med bara grön träningsikon ska ersätta panelens bildhierarki.
- **Tabbsemantik:** `Rekommenderat` är de publicerade versioner som befintliga `fetchTrainingWorkspace` väljer efter hundens ålder/ras, tillsammans med versioner som behöver återupptas från sparad progress; det är inte en ny rekommendationsmotor. `Alla övningar` visar samtliga steg i samma faktiskt hämtade programuppsättning. `Mina` i public-läge visar program med minst ett bekräftat `completedStepId` från `training_progress`; tomt läge visas när sådan progress saknas. I review-läge får samma sektion endast räkna den lokala `reviewCompleted`-state som tillfälliga reviewmarkeringar och den befintliga reviewmärkningen förblir synlig; copy får aldrig kalla den server-sparad progress. Inga favoriter, sparade-ID:n eller nya fält införs. Befintlig information om pausade tidigare versioner ligger kvar och blir fortsatt begriplig.
- **Fortsättkort:** visas endast om ett faktiskt valt program har bekräftade stegmarkeringar och ett nästa tillåtet steg; trycket öppnar samma befintliga detaljvy för det första ofärdiga steget i samma version. Program som saknar sådan progress ger inget falskt fortsättkort. Vid full completion ligger progress kvar i `Mina`; ingen automatisk reset eller nästa svårighetsgrad.
- **Opt-in API/tokens:** föreslagen `Tabs variant="rev02-segmented"` skapar varm kapsel med grön vald del; standard `underline` behålls. Föreslagen `HeroCard variant="training-image-top"` visar bild över text och lämnar befintlig `overlay`-variant orörd. Gallery demonstrerar båda formerna. `tokens.colors.training.*` används endast inom namngiven träningsvariant.
- **Filer:** `src/features/training/PublishedTrainingScreen.tsx`, `src/features/home/ProductWorkspace.tsx` (skicka befintlig ålder), `src/components/ui/HeroCard.tsx`, `src/components/ui/Tabs.tsx`, `src/components/ui/ComponentGalleryScreen.tsx`, `src/theme/tokens.ts`, `src/features/training/README.md`, `tools/visual-check/app.tsx` (endast deterministisk visningsfixture), samt `assets/images/README.md` endast om bildroll/beskärning behöver förtydligas. Granska referenserna före editering; ingen ny träningsmodell eller progresskälla.
- **Acceptans:** public- och reviewlägen behåller separata data och markeringssemantik; nästa steg, detalj/källor, återställning och fel-/tomma lägen fungerar; åldersurvalet kommer från befintlig hundprofil; `Mina` följer ovanstående public/review-regel. Den lokala harnessen skickar befintlig fixtureålder och visar två public-fixturekort med syntetisk markering respektive reviewprogram med reviewmarkering och endast lokal progress; inget tjänsteanrop eller någon skrivning sker. Ingen falsk rekommendation, favorit, duration eller färdighetspåstående införs.
- **Kommandon/evidens:** kör `pnpm typecheck`, `pnpm lint`, `git diff --check`, `python tools/dev_flow.py validate`; bygg public/review med `tools/visual-check/build.cjs`; starta separata lokala servrar på port 4173/4174 och spara manuella skärmbilder/renderingsanteckningar i `docs/design/evidence/vision-rev02/r02-3b/{public,review}/`. Använd 375×844, 430×844 och 375×667, 140 % text samt befintliga list-/detalj-/progress-scenarier. Ingen testfil läggs till eller körs i detta arbetspaket.

### R02-3C — Kunskap, artikel, FAQ och faschecklista (panel 7 + stödyta)

- **Användaruppgift:** hitta och läsa befintligt innehåll, öppna FAQ eller relevant faschecklista och komma tillbaka till rätt ingång.
- **Ordning:** vänsterställd `Kunskap`; befintliga fyra kapselval `För dig`, `Artiklar`, `Checklistor`, `FAQ`; befintliga genvägar på För dig; ett större redaktionellt bildkort över text följt av mindre bildkort; separat FAQ-/checklista-yta; läsvyn visar full text och källor med tydlig tillbakaåtgärd.
- **Färg/form:** varma redaktionella bilder över korttext, rundade kort, diskreta ämnesmarkeringar och vald grön flik/chip där den finns; lila kunskapsaccent används men hemmets blå/grön/lila destinationsfärger tvingas inte på guideinnehåll. Sök/filter läggs inte till: nuvarande kod har inget verkligt sök-/filterkontrakt.
- **Filer:** `src/features/knowledge/KnowledgeScreen.tsx`, `FAQScreen.tsx`, `PuppyChecklistScreen.tsx`, `src/features/knowledge/README.md`; `assets/images/README.md` endast vid specificerad ändring av bildroll/beskärning. Återanvänd redan införda segmentvarianten från 3B och befintliga semantiska bild-/korttokens. Bevara befintliga källor och review-gating.
- **Acceptans:** alla fyra befintliga destinationer går att nå; artikeltext/källor och säkra externa länkar bevaras; checklistans bockar, fasval, synkstatus, egna punkter, fel/konflikt/osäkert resultat och FAQ-funktion behåller samma kontrakt; ingen reviewtext läcker till public-läge. Öppen artikel/checklista återvänder till rätt tab och scroll-/detaljkontext när den redan stöds.
- **Kommandon/evidens:** kör `pnpm typecheck`, `pnpm lint`, `git diff --check`, `python tools/dev_flow.py validate`; bygg public/review med `tools/visual-check/build.cjs`; starta separata lokala servrar på port 4173/4174 och spara manuella Knowledge/FAQ/checklist-renderingar i `docs/design/evidence/vision-rev02/r02-3c/{public,review}/`. Använd 375×844, 430×844 och 375×667, 140 % text samt content loading/empty/error, FAQ, checklist partial/error/detail och checklistöversikt med saknat födelsedatum. Ingen testfil läggs till eller körs i detta arbetspaket.

## Stödskärmar i samma ägardirektiv — egna exakta uppgifter krävs

Efter att 3A–3C var för sig har fått QA, Reviewer och checkpoint skapas en separat plan och köpost per aktuell stödresa: Mer, Hälsa/vikt/historik/planerad hälsa, Tassla-pass, Hundprofil/onboarding samt konto/beta/notiser/auth. Varje uppgift låser sina konkreta skrivfiler, befintliga beteenden, färger, §14-evidens och faktiska kommandon före implementation. Security review läggs in där en slice faktiskt rör auth, hälsodata, kontodata eller notifieringsbehörigheter. Stödytorna förblir uttryckligen inom Eriks övergripande mandat; de startar inte som en monolitisk write-scope.

### Utvecklingspreview

`DevelopmentPreview`, `PreviewHomeScreen`, `PreviewProfileScreen` och interna `TrainingScreen` lämnas utanför produktmigreringen om de inte återanvänder en komponent som ändras i en slice. Om en delad ändring påverkar preview ska det dokumenteras och den berörda previewn ska hållas visuellt sammanhängande; intern preview får inte styra public produktbeslut.

## Gemensamma visuella och beteendemässiga kriterier

- Samma fem huvudflikar; aktiv ikon/etikett grön, övriga dämpade; detaljer behåller rätt aktiv förälder och tillbaka-väg.
- Canvas och kort använder namngivna rev02-tokens. Panelunika färger ligger på relevanta ytor, ikoner och data. Ingen enhetlig monokrom grön stil.
- Listor grupperas med diskreta separatorer; undvik ett stort kort runt varje rad. Primär rubrik, sektion, brödtext och metadata följer tokens och tydlig hierarki.
- Kort- och bildradier, safe area, marginaler, 44 pt tryckytor, kontrast ≥4.5:1 för normal text och ≥3:1 för kontrollgränser/status följer regelverket.
- Standardskrift, 140 % text, lång svensk copy, reducerad rörelse och tangentbords/skärmläsarsemantik bevaras. Webbsimulering redovisas inte som native VoiceOver/Dynamic Type-test.
- Public/review/renderings-fixture fortsätter använda samma produktpresentationskomponenter; syntetiskt innehåll har kvar sin synliga märkning och review-gating.
- Före/efter-bilder jämförs sida vid sida med rätt panel eller dokumenterat närmaste mönster och skala. §14 bedöms var för sig för layout, färgfördelning, typografi, komponentformer, bildspråk och innehållstäthet. Varje saknad bild eller data blir NOT TESTABLE/avvikelse, aldrig ett underförstått godkännande.
- Opt-in API som införs i dessa slices: `IconChip variant="rev02-log"`; `QuickLogTile variant="rev02-log"`; `ListRow variant="log-timeline"` med `showDivider`; `Tabs variant="rev02-segmented"`; `HeroCard variant="training-image-top"`. Varje komponent behåller nuvarande default; `ComponentGalleryScreen.tsx` visar default och ny variant sida vid sida med relevanta valda/disabled/long-text-lägen. Varken exakta API:er eller tokens är befintliga före implementation.

## Faktiska kontroller per slice

Gemensamma statiska kontroller per slice: `pnpm typecheck`, `pnpm lint`, `git diff --check`, `python tools/dev_flow.py validate`. Bygg befintlig produktpresentation från `tools/visual-check/app.tsx` med `tools/visual-check/build.cjs` och unik public/review-output i `/tmp/tassla-preview/r02-3{a,b,c}/{public,review}`. Starta public med `python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/r02-3a/public` och review med `python -m http.server 4174 --bind 127.0.0.1 --directory /tmp/tassla-preview/r02-3a/review`; motsvarande sökväg används för 3B/3C. Gör manuell visuell granskning/renderingsfångst i webbläsaren och jämför sida vid sida med panelen; dokumentera public/review-bilder och §14. Ingen testfil läggs till eller körs i detta arbetspaket.

| Slice | Render/viewporter | Evidence path | QA-fokus |
|---|---|---|---|
| 3A Logga | Public/review build: `TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/r02-3a/public node tools/visual-check/build.cjs` respektive `true`/`review`. Server: `python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/r02-3a/public` och separat port 4174 för review. | 375×844, 430×844, 375×667 och 140 % text; empty/loading/error samt failed/unsure och valda äldre dagar | `docs/design/evidence/vision-rev02/r02-3a/{public,review}/` | panel 5 datum→snabbval→tidslinje, fungerande bläddring, färgroller, listgruppering, tryckyta och ej avklippt tidslinje |
| 3B Träning | Public/review build med `/tmp/tassla-preview/r02-3b/{public,review}`; serverkommandon i kön använder port 4173 public och 4174 review. | 375×844, 430×844, 375×667 och 140 % text; no program, progress, detail, failed | `docs/design/evidence/vision-rev02/r02-3b/{public,review}/` | panel 6 bildandel, tvåkolumnskort, fortsättkort, tabs och sann progress-semantik |
| 3C Kunskap | Public/review build med `/tmp/tassla-preview/r02-3c/{public,review}`; serverkommandon i kön använder port 4173 public och 4174 review. | 375×844, 430×844, 375×667 och 140 % text; content loading/empty/error, FAQ, checklist partial/error/detail | `docs/design/evidence/vision-rev02/r02-3c/{public,review}/` | panel 7 bild/text-hierarki, separata ingångar, läsvy/källor, review-gate och tillbaka-väg |

Visuell render är webbevidens med syntetiska fixtures; den verifierar inte native VoiceOver/Dynamic Type, backend/RLS, behörigheter eller produktion.

## Checkpointar och beroenden

| ID | Ägare | Beroende | Avslutningskriterium |
|---|---|---|---|
| R02-3A Logga | Implementer + separat QA/Reviewer/Security | Hem commit `96e6882`; planreview APPROVE/PROCEED | Endast Logg, namngivna opt-in-komponenter, gallery; Security granskar fryst persondata-renderingsdiff före checkpoint; egen §14 |
| R02-3B Träning | Implementer + separat QA/Reviewer/Security | 3A checkpoint och inga öppna fel | Public/review tabs, bildkort och progress; Security granskar fryst progresspresentation före checkpoint; egen §14 |
| R02-3C Kunskap | Implementer + separat QA/Reviewer/Security | 3A checkpoint; owner override v6.2 tillåter implementation efter ägar-QA på 3B | Knowledge, FAQ, faschecklistor och artikelväg; Security granskar ägar-/hundchecklistpresentation före checkpoint; egen §14 |
| R02-4+ stödskärmar | Implementer + QA/Reviewer + Security där relevant | 3C checkpoint; separat exact planreview per slice | Egen filscope, review, §14-evidens och checkpoint för varje stödresa |

Plan- och kodgranskning är inte en release-/produktionsgrind. Ingen push, live-migration, kontomodifiering eller publicering görs i detta arbete. Push av Hem är redan separat blockerad av att den här miljön saknar GitHub-autentisering; lokalt är Hem bevarad i commit `96e6882` och bundle `/workspace/vision-rev02-96e6882.bundle`.

## Planreview och nästa steg

Architect **APPROVE** och Critic **PROCEED** för v6 finns i `docs/tasks/dev/vision-rev02-r02-3-reviews.md`. R02-3A Logg är checkpointad efter beteende-QA PASS, Reviewer PASS, Security PASS och komplett public/review-renderingsmatris; §14 avvikelse för full panellikhet är fortsatt dokumenterad som **Nej**. Architect och Critic godkände en smal v6.1-ändring som lägger till `tools/visual-check/app.tsx` i 3B enbart för sanningsenlig deterministisk ålder/progress-fixture. R02-3B Träning är implementerad och renderad i public/review med syntetiska data; handoff och egen §14-bedömning finns i `docs/design/evidence/vision-rev02/r02-3b/RENDER-REPORT.md`.

### Reviewer CHANGES för R02-3C och avgränsad replan v6.3

Reviewer PASS för R02-3B mottogs 2026-10-14 efter HOME-AGE v4.3: befintlig publicerad träningsprogress, lokala reviewmarkeringar, stegordning/reset och public/review-renderingar är godkända inom lokal scope; §14 panelavvikelsen kvarstår.

Reviewer gav CHANGES för R02-3C 2026-10-14: när `ageWeeks=null` och ingen faspreferens är sparad visar checklistöversikten ändå `Er fas`, `Efter ålder` och `Förslag utifrån hundens ålder`, trots att rekommenderad mall saknas. v6.3 begränsas till neutral, sanningsenlig copy för detta enda okända-ålder-/osparade-preferensläge och fresh rendering av checklistöversikten med saknat födelsedatum. Befintligt data-, save-, review-gating- och checklistbeteende ändras inte. UX-specen uppdateras till v1.1 och köposten för 3C håller sig blockerad tills Architect APPROVE/Critic PROCEED för exakt v6.3; ingen copy-korrigering eller render har ännu gjorts.

### Lösning av R02-3C reviewer-fyndet — 2026-10-14

Architect APPROVE och Critic PROCEED mottogs för v6.3/v1.1. Den avgränsade copy-korrigeringen och färska public/review-renderingarna är klara; reviewbilden visar `Checklistkontext` / `Ingen fas vald`, ingen rekommenderad mall och samtliga checklistor åtkomliga. Publicbilden visar fortsatt tomläge när publicerat material saknas. Oberoende Reviewer gav **PASS** efter att ha granskat koden och båda bilderna. R02-3C är checkpointad som lokal UI/source-leverans; publicerat liveinnehåll, Supabase/RLS och native-tillgänglighet är fortsatt **NOT TESTABLE**.

### Ägarbeslut om fortsatt ordning — v6.2

Erik godkände uttryckligen allt arbete till och med R02-3B i QA och bad att fortsätta med alla återstående delar. Därför får R02-3C börja efter ägarens QA-godkännande utan att vänta på R02-3B:s separata Reviewer- och Security-granskning. Detta ändrar arbetsordningen, inte granskningsresultatet: R02-3B förblir blockerad från checkpoint tills Reviewer och Security lämnar faktiska resultat. R02-3C behåller sin tidigare godkända skärm- och filscope. Dess egen QA-, Reviewer- och Security-granskning krävs före checkpoint.

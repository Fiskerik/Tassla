# IMAGE-DELIVERY-01 — mindre fotografier och gemensam bildvisning

Status done · plan v5 · risk M · bas `9a11649aee530b98ea85d0484919932ee7d0e705` · root ensam writer. Beroende PREMIUM-FEEDBACK-01 lokaltcommittad 9a11649aee530b98ea85d0484919932ee7d0e705.

Mandat: Eriks uttryckliga beställning bildkomprimering först och expo-image, SDK57. Bevara layout, fokalpunkter, ansikten, dekorativ hjälpmedelssemantik och befintliga käll-/publiceringsgrindar. Inga nya foton, extern laddning, persondata eller SDKuppgradering.

## Resultat och genomförande
Sex faktiskt använda RGBfotografier konverteras från PNG till metadatafri JPEG kvalitet86, liggande1200×800 och runda Hemporträttet512×512. Ingen beskärning/färgavsikt ändras, råa original finns i gitbasen; dokumentera originalhash, dimension och byte per fil samt total. Opak silhuett dog-placeholder, transparent maskot och appikon lämnas utanför. Uppdatera alla aktiva samt äldre/gallery-referenser och befintlig filnamnsassertion.

Installera Expo57-kompatibel expo-image~57.0.5 (faktisk patch/API granskas). En liten EditorialImage adapter ersätter RN Image i åtta befintliga fotokonsumenter; source/style/dekorativa hjälpmedelsprops behålls, resizeMode cover/contain/stretch mappas till dokumenterat contentFit. KnowledgeImages exakta frame/focus/zoomberäkning kvarstår. Lokal cachePolicy memory-disk, ingen prefetch, ingen privatbild eller nya lagringsändamål. Verifierad recyclingKey per källa tömmer föregående bild vid källbyte. Ingen initial fade/loop/överkorsning mellan olika guider: statiska bundlade foton byter omedelbart, så rörelse inte gömmer fel bild.

## Acceptans och bevis
Mät byte före/efter, verifiera JPEGdimension/proportion, alla references upplösta och inget återstående runtimePNG för de sex filerna. Öppna detailcrops och actualRNWeb375/430, helaansiktet i Knowledgefokus/smalbanner och Hemporträttet. Actual expo-imageweb används i fixture (ingen egen imageSDKmock); prova sourcebyte med fördröjd resurs och oförändrad frame. Riktade asset/APIprov, fullcheck, publiciOSexport, diff/scope/köaudit, Security SDKreview, UIcritikBRIEF/REVIEW, oberoende QA/Reviewer. Telefonens decodehastighet/nativecacheNT, inget prestationspåstående utan mätning. Boundedcleanup inom scope, ingen unrelatedrefaktor.

## Skrivvägar
- tools/visual-check/build.cjs
- tests/home-vision.test.mjs
- docs/design/evidence/knowledge-image-focus-2026-10-25/image-focus-inventory.json
- app.json
- package.json
- pnpm-lock.yaml
- src/components/ui/EditorialImage.tsx
- src/features/knowledge/KnowledgeImage.tsx
- src/features/knowledge/checklist-phase-visuals.ts
- src/features/knowledge/editorial-image-assignment.ts
- src/features/knowledge/README.md
- src/features/home/HomeScreen.tsx
- src/features/home/HomeCarousel.tsx
- src/features/home/DevelopmentScreen.tsx
- src/features/home/DailyProgressScreen.tsx
- src/features/home/README.md
- src/features/health/PlannedHealthScreen.tsx
- src/features/training/PublishedTrainingScreen.tsx
- src/components/ui/HeroCard.tsx
- src/components/ui/ComponentGalleryScreen.tsx
- tests/knowledge-search-screen.test.mjs
- tests/editorial-image-delivery.test.mjs
- assets/images/README.md
- tools/visual-check/image-delivery.tsx
- tools/visual-check/verify-image-delivery.py
- docs/design/evidence/image-delivery-01
- docs/tasks/dev/IMAGE-DELIVERY-01.md
- docs/tasks/dev/MVP-COMPLETION-261031.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md
- docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md
- assets/images/dog-welcome.png
- assets/images/dog-welcome.jpg
- assets/images/dog-resting.png
- assets/images/dog-resting.jpg
- assets/images/puppy-training.png
- assets/images/puppy-training.jpg
- assets/images/puppy-resting-carousel.png
- assets/images/puppy-resting-carousel.jpg
- assets/images/puppy-water.png
- assets/images/puppy-water.jpg
- assets/images/home-dog-portrait-placeholder.png
- assets/images/home-dog-portrait-placeholder.jpg

## Underlag och reviews
AGENTS, taskmall/workflow, designregler0–4/14–15, consumerUX/iOSskills, assetsREADME och faktisk fokus/layout/API. UIcritik rådgivande BRIEF: bevara pixelgeometri/ansikte och första frame; aldrig gammalbild under ny rubrik; mät kvalitetsdetaljer/byte. Architect/Critic planreview och Security inför SDK krävs före kod. QA/Reviewer readonly Luna medium; rootsolewriter, specialistfallback6.1sol enligt tidigare checkpoint.

Planv2: ExpoCLI installerade57.0.5 med förväntat~57.0.5 och lade automatiskt expo-image i app.json plugins. Den exakta vägen läggs till före övrig implementation och får förnyad Architect/Criticreview. Ingen extra pluginkonfiguration, permission eller bildåtkomst avses. ArchitectAPPROVE/CriticPROCEED/SecurityplanPASSv1, UIbriefPROCEED.

Planv3: faktisk fullcheck hittade två äldre PNGfilnamnkontrakt: Homevisionassertion och den aktuella fokalassetinventeringen. De uppdateras till nya filnamn/dimensioner, bevarar normaliserade observerade ansiktskoordinater och samma tester, inga gamla renderresultat skrivs om. Faktisk ExpoImage-web kräver Babels normala process.env.EXPO_OS=web i den fristående esbuildharnessen; lägg den define i build.cjs, ingen SDKmock. V2/pluginreview kvarstår. Typkontroll avslöjade ett befintligt namngivet tillgängligt tomlägesfoto; adapter bevarar uttrycklig accessible/label och använder enbart dekorativ standard när caller saknar label. Förnyad avgränsad Architect/Criticreview före dessa tre tillägg.

ArchitectAPPROVE/CriticPROCEEDv3 inklusivev2: faktiskdefaultplugin ändrar bara decoder-Podfileflagfalse, inga permissioner. Webdefine normalExpo_OS, två metadata/testpaths bevarar kontrakten.

## Checkpoint efter genomförande
Faktisk expo-image57.0.5, adapter i8konsumenter, semantik för namngivet tomläge bevarad. Ingen initialövertoning eller nytt bildinnehåll. Sex opakaJPEG13551755→812436byte (−94,0%), mått/proportion/hash/metadata verifierade. Actual Expo-web utan imagemock:375/430delayedsource tömmer gammalbild, frame oförändrad, dekorativ alt tom; alla6fasbilder och4faktiska skärmar laddar, inga page_errors. Efterbilder/qualitydetail/composites i evidence. Fullcheck889pass/1skip, publiciOSexportPASS. SecurityfinalPASS actualSDK/plugin/deps/manifest; native INTERNET/ACCESS_NETWORK_STATE/READ_EXTERNAL_STORAGE<=32 dokumenterat, ingen ny runtimeprompt eller fotoåtkomst. Nativecache/kompilering/sammanfogatprivacy och fysiskprestandaNT.

Boundedcleanup: adapter begränsad till faktisk source/style/resize/tillgänglighetsbehov, inga nya tillstånd eller nätverksfunktioner; appjsons ofrivilliga formateringsdiff återställd, endast defaultplugin kvar. Aktuellfokusinventering bara metadatauppdaterad, historiska resultatoförändrade. Diffcheck och scope58paths inom deklarationPASS. UIreview pågår med särskild kontroll av befintliga smala fasutsnitt; självständig QA/Reviewer nästa.

Planv4: efterbilderna avslöjar att befintliga first_days- och 8_12_weeks-banners klipper nedersta nos/haka vid 375/430. Eriks uttryckliga krav är hela hundansiktet. Justera endast deras vertikala fokuspunkter i redan deklarerad checklist-phase-visuals.ts, utan filbyte eller ändrat bildformat; granska omrender före acceptans. Samtliga andra fokus och publiceringsregler kvarstår. Förnyad Architect/Criticreview.

Architect/Critic read-only APPROVE/PROCEED v4: ändra enbart de två vertikala punkterna, kontrollera ansikte, öron och haka i båda bredder. Kandidater valda genom likskalad beskärningsjämförelse.

Planv5: UI-REVIEW fann även att spanielns nedre öronspetsar når nederkant i fasen över ett år. Justera den tredje vertikala fokuspunkten i redan deklarerad fil efter samma helaansiktskrav och verifiera båda bredder. Övriga värden förblir oförändrade. QA fann dessutom aktiva gamla PNGnamn i asset-README; dessa är korrigerade till faktiska appkopior med PNG-originalen angivna som gitbas. Renewed planreview begärs.

Architect/Critic APPROVE/PROCEED v5. Spanielns y justerad från .20 till .23; bekräfta öronspetsar i nya faktiska renderingar.

## V5 visuell granskning och QA
UICritic REVIEW v4 fann avklippta öronspetsar i over_1_year; y .23 korrigerar detta. Supplemental REVIEW öppnade faktiska 375×844/430×844 och bekräftar hela spanielansiktet inklusive båda öronspetsar samt oförändrade fullständiga ansikten för first_days/8_12. Kvalitetsjämförelse öppnad, ingen störande blockighet/färgförskjutning, Hemporträtt och layout bevarade. Fullpanel rev02-avvikelser i komposition/komponenter/täthet kvarstår och godkänns inte här.
Oberoende QA körde egen fullcheck och actualExpo-web utan mock vid375/430: delayedsource rensar gammalt motiv, oförändrad frame, dekorativ alt; alla6bilder laddar. Namngiven tomlägesillustration bevarad, README korrigerad efter QA-fynd. Sexbildernas byte/dimensioner och SDKAPI verifierade; nativecache/enhet NT. QA:s fullcheck föregick den sista fokalkonstanten; aktuell browserprobe och public iOS-export v5 PASS. Slutlig commit-hook kör fullcheck igen.

Supplemental QA v5 öppnade 375/430 och bekräftade spanielns hela ansikte och båda öronspetsar, diffcheck PASS. V5 public iOS-export samt browserprobe PASS. Inga nya datavägar; v5 ändrar endast redan godkänd fokuspunkt.

Frozen Reviewer PASS v5 utan fynd: samtliga paths i scope, faktiska SDKAPI/plugin, lokalkällor/metadata/tillgänglighetsnamn, delayedsource och öppnade 375/430 öron samt kvalitetsbild. Local delivery klar; ingen fysisk cache/decode-/hel-panelacceptans. Nästa durable commit, därefter startskärm/vaken träningsläsning och de fyra ursprungliga resorna.

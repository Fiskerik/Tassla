# DEVELOPMENT-CONTENT-01 — relevant publicerat fasinnehåll

Status done · plan v2 · risk M · bas `283b81dbf573c40d75a45d1f5e2f25be004ffc77` · root ensam writer. Eriks uttryckliga beställning steg1–4 och roadmap MVP-COMPLETION-261031 steg1. Föregående native slice färdig och committad.

## Resultat
Utveckling visar endast faktiskt publicerat validerat fasmaterial och rekommenderade artiklar/guider, i stället för tre tillfälliga externa hållpunkter. Åldersbågen är kronologisk och bevaras. Tre lokala tydliga val Utifrån ålder/Före hemkomst/Första dagarna är användarstyrda; under8 veckor eller okänt datum får inget automatiskt hemkomstpåstående. Visa exakt publicerade punkters titel som frivilliga förslag, inga påhittade färdigheter eller artikellänkar. Källor öppnas med befintlig kort utgivaretikett. Ingen progresskrivning eller ny persondata.

Använd befintlig fetchPublishedChecklistCatalog (full validering/public status). DevelopmentCatalogScreen monteras bara på development-route med key=currentSelectionKey, har egen AbortController/förfrågningsgeneration och tydligt loading/empty/error/retry. Hund/konto/client/vybyte eller unmount får inte visa gammalt svar; kontoaktualitet kontrolleras vid commit. Inga lokala draft-/reviewfallbacks i publicläge. Artikeldatan är oberoende så ena felet inte tar bort den andra. Rekommendation är `(article || guide) && recommended === true`; kunskapsbiblioteket i övrigt oförändrat. Befintlig version-ID-/återvändnavigation används.

De18 neutrala oförändrade fasförslagen har dokumenterad DogExpert-review/hash i roadmap. Faktisk publicering avgörs av runtimekatalogen, inte lokal JSON. Ingen ny medicinsk copy, ras-/åldersgaranti eller inventerad källa. Temporära Home-hållpunkter/module berörs separat i steg2, eftersom Home ännu använder dem.

## Acceptans
Testa fasgränser8/13/26/52, under8/okänd/explicitkontext, rekommenderade artiklar+guider och false/undefined, faktisk katalogtom/fel/retry, oberoende artikelfel, deferred sena svar efter retry/hund/konto/vylämning/unmount, käll- och internartikel/retur. Befintlig åldersbåge och tillgänglighet bevaras. UIcritic BRIEF+REVIEW med panel2,375/430/kort667/text140, syntetisk fixture klart märkt; fullcheck, relevant browserflöde, publiciOSexport, scope/diff, oberoendeQA/Reviewer. Livekatalogens faktiskapublicering/RLS/native NT. Boundedcleanup och hållbar commit innan steg2.

## Skrivvägar
- tools/visual-check/development-content-fixture.tsx
- src/features/home/DevelopmentScreen.tsx
- src/features/home/DevelopmentCatalogScreen.tsx
- src/features/home/development-content.ts
- src/features/home/ProductWorkspace.tsx
- src/features/home/README.md
- tests/development-screen-model.test.mjs
- tests/development-content.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/vision-r02-home-panels-app.tsx
- tools/visual-check/verify-vision-r02-home-panels.py
- tools/visual-check/verify-development-content.py
- docs/design/evidence/development-content-01
- docs/tasks/dev/DEVELOPMENT-CONTENT-01.md
- docs/tasks/dev/MVP-COMPLETION-261031.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md

## Underlag/granskning
AGENTS, workflow, designregler0–4/14–15, consumerUX/iOSskill, roadmap, DevelopmentScreen/ProductWorkspace/checklist-data/modell och dokumenterat DogExpert-pass. Architect föreslår scoped fetch/livstid och ageguard; Critic och UIcritic BRIEF före kod. QA/Reviewer oberoende, root ensam writer.

Architect APPROVE v1 med två villkor: read-state ska bära clientidentitet och visas endast om state.client===aktuell client; varje request fångar ownerId/accountGeneration och testar `isCurrentAccount(capturedOwnerId,capturedGeneration)` före commit samt abort/generation/unmount. Villkorlig keyad route ger hund-/kontobytes- och re-entrylivstid. Critic PROCEED: tydliga lokala kontextval, aldrig härledd hemkomst, ingen checkbox eller falsk färdighet, separata fel-/tomlägen och faktiska källnamn. Lokalt kontextval kan återställas neutralt till Utifrån ålder vid återinträde från artikel; det är inte sparad fakta.

Planv2: lägg till en separat syntetisk RNWeb-fixture som monterar verkliga DevelopmentCatalogScreen och befintlig `fetchPublishedChecklistCatalog` mot styrbara testresponsers hela publiceringskontrakt. Den testar sena svar, retry, hund/kontobyte och unmount utan produktion eller dummyfallback i app. Inga nya produktpaths. Förnyad Architect/Criticreview.

## Lokal checkpoint
Root implementerade keyad DevelopmentCatalogScreen med faktiskt `fetchPublishedChecklistCatalog`, klientidentitet och fångat owner/generation, requestgeneration/abort; exakt fasdata renderas med explicit kontext, ej åldershärledd hemkomst under8. Källor och självständiga rekommenderade article/guide med versionsretur. Tidigare Home-hållpunkter kvar till steg2. Bounded cleanup: borttagen autogenererad teaser/milestonevisning och gamla styles, befintliga käll-/fokuskomponenter återanvända. Befintlig senare stale Homephase-scriptassertion uppdaterades till aktuell mindre pill och16:9-bild; kontrollens åldersbåge, grönt streck och tryckyta bevaras.

Faktisk fullcheck897 tester/896 pass/1 skip, 9 actualcomponent/catalog-webscenario med fördröjda syntetiska svar och375/430/667/text140 PASS; page_errors tomma. Oberoende QA egen fullcheck/riktade tester och samma browserprov PASS. Arkitekt/Critic v2 APPROVE/PROCEED, UIcritic REVIEW+kompletterande REVIEW utan scoped blockerare. Öppna fullpanelavvikelser: referensens mer kompakta milstolpslista skiljer sig från de längre granskade frivilliga råden och kontextvalen; ingen full panelacceptans. Samtliga sparade bilder är syntetisk publiceringsformad fixture, inte livebevis. Livepublikation/RLS/native NT.

Public iOS-export efter produktändring pågår men paketregistrets metadata svarar503; tidigare export före sista aria-selected/lintcleanup PASS är inte slutbevis. Ett äldre, bredare visionsprov visar även väntande undersökning av Checklistans återställda scrollposition; Development-artikelretur och de separata fasproven fungerar. Resterande: export, scrollprov/rapportering, frozen Reviewer och hållbar commit.

Oberoende QA PASS: egen fullcheck/riktade tester och nio browserfall, visuellt avgränsad faslista och separata statebilder öppnade. Hela panel2 har synliga referensavvikelser och är inte godkänd. ActualJS-export retryar registry503; separat gate kvarstår. Frozen kodreview kan börja medan den fortsätter.

Bredare Checklist-scrollfynd följdes upp mot både tidigare feedback/panels-bundle och aktuella Development-vision-bundle: båda återställde59/59px efter500ms; direkt avläsning gav0 innan layoutåterställning hunnit ske. Visionsprovet väntar nu på den faktiska route-layouten innan avläsning. Det är inte produktbevis på native scrollprestanda.

Uppdaterat riktat visionssubset PASS60/60 i syntetiskt reviewläge, inklusive Development→artikel→tillbaka, åldersbåge, val och scrollåterställning efter render. Orelaterade föråldrade assertions för 16:9-bild, neutral bågfärg och den mindre Hemfas-knappens faktiska innerpill rättades utan produktändring. Fullpanel 2 fortfarande ej godkänd. Frozen Reviewer PASS kod/scope utan fynd; JS-export och commit-hook är kvar. Registryn ger verifierbart HTTP503 även vid separat curl, så de kör fortfarande återförsök; ingen kontroll har hoppats över.

## Blockerad miljöcheckpoint
Efter tre försök returnerar npm-registret och proxyn fortsatt HTTP503; pnpm kan därför inte slutföra obligatorisk supply-chain-kontroll inför publiciOSexport eller Git-hook. Fullcheck896pass/1skip och oberoendeQA samt kodreviewPASS kördes före felet; inga kontroller har hoppats över. Binär diff och samtliga nya filer sparas i `/workspace/tassla-checkpoints/development-content-01/` mot bas283b81d. Kod ligger även kvar i arbetsgrenen. Nästa när registret återkommer: återgå blocked→planned, uppdatera endast checkpoint om oförändrad scope, kör faktisk iOS-export och normal commit-hook och därefter push när alla efterföljande lokala delar är klara. Steg2–4 utreds självständigt under tiden.

## Återupptagen och klar lokal kontroll
Registryn återkom 2026-10-31; public iOS-export efter den slutliga produktkoden passerade (`/tmp/tassla-development-ios-recovered.log`). Tidigare blockerad kodcheckpoint är oförändrad, reviewerens PASS kvarstår. Det bredare riktade visionssubset passerade60/60 efter att vänta på faktisk layoutåterställning; före-/efterbaseline bekräftade båda59→59px. Fullcheck och oberoendeQA passerade före avbrottet och Git-hook kör dem igen vid commit. Livepublicering/RLS/native och fullpanel2 är fortsatt öppna. Durable commit nu; fortsätt steg2–4.

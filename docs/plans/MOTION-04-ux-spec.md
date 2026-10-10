# MOTION-04 – Valpfigur

Status: plan v1 Architect APPROVE/Critic PROCEED; implementation, lokal QA och oberoende Reviewer klara; lokal checkpoint `ac2b940` efter MOTION-03-checkpoint `117c406`
Datum: 2026-10-10
Mandat: Eriks MOTION-beslut 0004 och uttryckliga fortsättning 2026-10-10

## Användaruppgift

Ge en liten, varm visuell bekräftelse när en loggning eller ett träningssteg faktiskt har sparats. Figuren är dekorativ; den befintliga texten ska ensam bära betydelsen. Ingen hälsobedömning, tolkning av hundens känslor, lydnadsbedömning eller påstående om träningsresultat.

## Omfattning och placering

- Endast LogScreen och PublishedTrainingScreen använder figuren.
- LogScreen visar en kort engångsreaktion intill den befintliga bekräftelsen efter en ny logghändelse som har status `saved` och finns i `events`.
- PublishedTrainingScreen visar samma typ av engångsreaktion intill befintlig text “Övningen är genomförd” efter att `onCompleteStep` returnerat matchande `programId` och `stepId` från den lyckade omladdningen.
- Ingen reaktion vid pending, failed, unsure, retry, preview, redigering, radering, undo, första laddning eller endast lokal knappaktivering.
- Ingen Hem-hälsning och ingen ny statuscopy. `ProductWorkspace` förblir källa för bekräftat resultat; ändras bara om gränssnittet inte redan exponerar bekräftelsen.

## Figur, rörelse och tillgänglighet

- `DogMascot` använder en enda transparent, tydligt illustrerad, icke-rasbestämd valpbild; ingen text eller logotyp i bilden, ingen fotorealistisk stil som kan misstas för ägarens hund.
- En kort animation spelas en gång per unik bekräftad händelsenyckel. Återrendering får inte spela om den. Reducerad rörelse visar samma figur stilla.
- Använd React Native `Animated`, befintliga tokens och `useReducedMotion`; inga nya beroenden, loopar, haptik eller persisterad figurstatus.
- Figuren är dekorativ och utesluts från skärmläsarträdet. Befintlig bekräftelsetext/Toast förblir synlig och tillgänglig.
- Placeringen får inte flytta fokus, dölja kontroller eller skapa layoutskifte som tränger undan logg eller träningsinnehåll. Stor text och smala bredder ska kunna flöda vertikalt.

## Bildkälla och storleksbudget

Använd `image_gen` för en enda transparent PNG, cirka 512 px, med Tasslas varma illustrerade uttryck. Spara exakt prompt, verktyg, datum, mått, filstorlek och eventuell lokal optimering i `assets/images/README.md`. Sikta på högst 300 KB sammanlagt; om en transparent bild inte håller den gränsen, använd enkel RN-illustration som fallback utan dependency. Kontrollera transparens, anatomiska fel, text/logotyp och att figuren inte liknar ett foto av en användares hund.

## Arkitektur och nycklar

- `DogMascot` är en visuell komponent med deklarativ reaktionsnyckel; den äger bara animationens lokala engångslivstid, ingen lagring eller affärslogik.
- Loggnyckel: befintligt `kind + mutationId`, endast när `kind === 'add'`, `status === 'saved'` och händelsen med samma ID finns i `events`.
- Träningsnyckel: den bekräftade identiteten `programId + stepId` plus befintlig lokala sekvens för att kunna reagera igen efter en uttrycklig programåterställning.
- Vid LogScreen-mount initieras konsumerad nyckel från en mutation som redan är `saved`; endast en senare övergång från pending till bekräftat saved får trigga figuren. En skärm som öppnas efter en tidigare sparning spelar därför inte upp den i efterhand.
- Träningsskärmens väntande bekräftelse använder en lokal mount/active-guard; om skärmen avmonteras innan resultatet kommer får den gamla callbacken inte skapa reaktionstillstånd.
- Om en callback, animation eller skärm avmonteras får ingen senare reaktion skapas av ett gammalt resultat.

## Berörda filer

- `src/components/ui/DogMascot.tsx`
- `src/components/ui/index.ts`
- `src/components/README.md`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/training/PublishedTrainingScreen.tsx`
- `assets/images/dog-mascot.png`
- `assets/images/README.md`
- `tests/dog-mascot-policy.test.mjs`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/MOTION-04.md`
- `docs/design/evidence/motion-04/` (endast faktisk renderad evidens eller specificerad NOT TESTABLE)

## Acceptans och kontroller

1. Endast bekräftad ny loggning och bekräftat träningssteg kan utlösa reaktion; textfeedback finns redan och fortsätter fungera.
2. En unik bekräftelse kan inte spela om på grund av återrendering, initial läsning, retry eller en inaktuell callback.
3. Reducerad rörelse ger stillbild; skärmläsaren får bekräftelsetexten men inte dekorfiguren.
4. Figuren är varm, tydligt illustrerad och generisk; källa/prompt/datum/mått/storlek är dokumenterade och totalen håller budgeten eller avvikelsen motiveras.
5. Kör fokuserade figurpolicytester, `pnpm check`, `git diff --check` och `python tools/dev_flow.py validate`. Oberoende QA och Reviewer granskar kod och faktisk rendering; rörelsevideo eller tydlig NOT TESTABLE.
6. Granska liten/stor bredd, stor text, VoiceOver/TalkBack-semantik och reducerad rörelse. Enhets- och gemensam telefon-QA samlas enligt beslut 0005; inget QA-PASS påstås utan faktisk evidens.

## Beroende och checkpoint

MOTION-04 får kodstart först när MOTION-03 har fått lokal QA, oberoende Reviewer och en hållbar checkpoint. Erik har uttryckligen beställt att MOTION-04 också byggs; detta planutkast förbereds medan den föregående slicen slutförs. Det ersätter inte MOTION-03:s checkpointgrind. Därefter följer MOTION-04 sin egen planreview, implementering, QA och Reviewer före gemensam mobil-QA.

## Granskning

- Architect APPROVE av plan v1 2026-10-10 efter precisering av LogScreen-mountnyckel och träningsskärmens avmonteringsspärr; se utvecklingsrapporten.
- Critic PROCEED på exakt v1 2026-10-10; ingen planändring krävdes. Vid implementation ska befintlig tränings-resetsekvens verifieras; skapa inget nytt persistent eller affärsrelaterat tillstånd för animationen.

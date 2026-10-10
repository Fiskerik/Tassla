# Release-logg – MOTION-01

Datum: 2026-10-10
Paket-ID: MOTION-01
Status: implementation lokal; code review PASS; QA/native rendering och full check återstår
Jämförelsebas: `bec6971` (`remove-ai-slop` före MOTION-01; 11 commits efter `a44ba16`); commitintervall `bec6971..70612e9`
Leveranscommit: `70612e9` (`feat: add motion feedback and progress cues`), lokal på `remove-ai-slop`
TestFlight-version/build: okänd
GitHub Release: saknas.

Plan, UX-spec och samlad telefonchecklista: [`docs/tasks/dev/MOTION-01.md`](../tasks/dev/MOTION-01.md), [`docs/plans/MOTION-01-ux-spec.md`](../plans/MOTION-01-ux-spec.md), [`remove-ai-slop telefoncheck`](../tasks/dev/REMOVE-AI-SLOP-PHONE-CHECK.md)

## Major changes

Implementerat lokalt: tokeniserade React Native Animated-övergångar för Toast, Progress och bekräftad ChecklistItem-bock. Toast behåller innehåll genom utgång, kan avbrytas av ny feedback och tas ur skärmläsarträdet under utgång.

## Minor changes

Implementerat lokalt: delad `useReducedMotion` används i alla tre komponenter. Berörda toast-vyer har stabila ägarplatser och auto-dismiss räknas efter entrén.

## Bug-fixes

Inga produktfel har rapporterats. Komponenternas motionsbeteende är nytt i denna slice.

## Verifiering och kända begränsningar

Architect APPROVE och Critic PROCEED för plan v4. `node --experimental-strip-types --test tests/motion-policy.test.mjs` PASS (sex policykontroller i en testfil); `git diff --check` och `python tools/dev_flow.py validate` PASS. `pnpm typecheck` startade inte: pnpm försökte hämta paket och registry-anrop nekades med EPERM. Ingen full `pnpm check` PASS påstås. Oberoende code review PASS efter rättning av äldre vikt-toast callback, feltoast under loggredigering, bibehållen OS-rekommenderad timeout och stabila Toast-effect dependencies. Förnyad QA har inga statiska fynd men är BLOCK/NOT TESTABLE för native renderingskriterier.

Renderad timing, VoiceOver/TalkBack, stor text, reducerad rörelse och dold Toast utan layoutgap är NOT TESTABLE här utan native rendering. Ingen MOTION-01 skärmdump eller telefonkontroll har gjorts. Eriks tidigare DS-CODE-01/LOGGA-QUICK telefonrapport är användarrapporterad och gäller inte MOTION-01. Inget nytt beroende eller produktdata-/sparbeteende har ändrats. Leveranscommit och TestFlight-build saknas.

## Nästa sprint/paket

Vid tillgänglig native rendering verifieras skärmläsarträd, stor text, reducerad rörelse och motiontidslinje; full `pnpm check` återstår. Erik avgör separat om telefonprov behövs. Ingen MOTION-02 har startats.

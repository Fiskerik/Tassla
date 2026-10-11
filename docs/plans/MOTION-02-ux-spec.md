# MOTION-02 – Bekräftad rörelse i Logga och Träning

Datum: 2026-10-10
Status: v4 för förnyad Architect/Critic-granskning
Bas: `4267d457` (`origin/main`)
Mandat: Eriks MOTION-beslut i [`0004-motion-package.md`](../decisions/0004-motion-package.md)

## Användaruppgift

Få lugn återkoppling när en loggrad eller ett träningssteg faktiskt sparats. Rörelsen förstärker befintlig text, ikon och status; den får aldrig antyda sparning vid `pending`, `failed` eller `unsure`.

## Avgränsning

1. En ny loggrad får en enda diskret entré först efter bekräftad insert. Raden tas bort först efter bekräftad delete; vid misslyckad eller osäker radering ligger den kvar och befintlig fel-/osäkerfeedback gäller.
2. En träningsrad får en kort bockbekräftelse endast när den sparade programdatan efter lyckad write och refresh ändrar steget från ej klart till klart.
3. Reducerad rörelse gör ändringen direkt. Existerande toast, sparstatus, dubblettskydd, ordning och undo-semantik behålls.

Inga nya statusar, schemafält, nätverksanrop, analytics-händelser eller dependencies. `ProductWorkspace` får inte ny `Animated.Value` eller animationstillstånd. `TrainingScreen.tsx` lämnas orörd.

## Tillstånd och återkoppling

| Händelse | Rörelse | Vem äger bekräftelsen | Utan rörelse |
|---|---|---|---|
| Ny loggrad | En entré på exakt den sparade radens ID efter `saved`; aldrig vid preview/pending/failed/unsure/retry av redan synlig rad | Loggens bekräftade mutation från `ProductWorkspace` | Ny rad visas direkt; befintlig toast och Ångra följer endast bekräftat sparat resultat |
| Radera loggrad | När delete startar tar LogScreen en snapshot av raden som **ersätter källraden** på samma listposition medan `onDelete(id)` körs; endast en synlig rad. Snapshotten är inert men tillgänglig med pending-semantik. Vid `saved` döljs snapshotten genast ur skärmläsarträdet, blir fortsatt inert, animeras ut och tas bort först efter exit-complete. Vid `failed`/`unsure` släpps snapshotten och den återstående källraden visas med befintlig feedback. Varje försök har en token; gammal exit-callback kan inte ta bort nyare rad/snapshot | `onDelete(id)`-resultatet från `ProductWorkspace`; LogScreen äger bara visningssnapshotten och exit-livscykeln | Snapshotten döljs/accessibility-prunas och tas bort direkt efter bekräftelse |
| Träningssteg | Bocken skalar in endast för exakt `programId + stepId` som just sparades, efter lyckad refresh som innehåller steget. Ingen animation vid initial laddning, annan klar markering eller ej bekräftat resultat | `completeStep` returnerar bekräftad identitet (`programId + stepId`) endast om `reloadTraining()` lyckas och den uppdaterade datan innehåller steget; annars false | Bocken uppdateras direkt; samma synliga/skärmläsarbetydelse |

QuickLogTile ändras inte och animerar inte. Dess sparbekräftelse är den befintliga LogScreen-toastens `saved`-status; `pending`, `failed` och `unsure` använder befintlig neutral/felåterkoppling. Toasten har redan tillgänglig text och får inte annonseras en andra gång.

Animationer är avbrytbara och blockerar inte input. En animations callback får bara avsluta den mutation och rad som startade den; föråldrade callbacks får inte dölja en nyare rad eller ändra annan data. Befintligt 2-sekunders snabbtrycksskydd och 2-minuters kategoridubblett bevaras exakt.

## Tillgänglighet och visuell grund

- React Native `Animated` och befintliga `tokens.motion`; duration 120–350 ms.
- Varje komponent med animation använder `useReducedMotion`; inga dekorativa loopar eller initial-load-animationer.
- Bekräftelse bärs också av befintlig radtext, checkbox-/selected-semantik och success-toast. En klar träningsrad exponerar tillståndet som text i accessible label/state (exempelvis “Genomförd”) utan att lägga till en separat tillgänglig ikon eller dubbel annonsering. Rörelse/färg är aldrig enda informationsbärare.
- Behåll befintliga touch targets, tokenmått, ikon, copy, radordning och layout vid normal/stor text.
- Liten/stor telefon, stor text, reducerad rörelse, saved/failed/unsure och skärmläsarbetydelse granskas enligt designreglerna. Om renderingsmiljö saknas markeras just den delen NOT TESTABLE.

## Antaganden och skyddade områden

- Ny sparad loggrad använder en konsumerad mutationsnyckel så dess entré bara kan starta en gång. Om reduced motion slås på under entrén avslutas den direkt; att slå av reduced motion igen får inte spela samma mutations entré på nytt.
- Träning animeras utifrån serverförsonad `completedStepIds`, aldrig den lokala knapptryckningen. `ProductWorkspace.completeStep` måste hämta/observera resultatet av befintlig refresh och kontrollera att den uppdaterade datan innehåller exakt `programId + stepId`; den returnerar den bekräftade identiteten endast då. `PublishedTrainingScreen` äger sedan en transient one-shot target key för denna identitet och skickar opt-in till matchande `ListRow`. Ingen generell `completedStepIds`-ändring får starta animation, och ingen animationsstate placeras i `ProductWorkspace`.
- Endast `PublishedTrainingScreen` och `ListRow` för träningslistorna får animation/accessibility-justering. `ChecklistItem` tas bort ur denna slice; den används inte av publicerad träning och `TrainingScreen.tsx` är skyddad.
- `ProductWorkspace` äger sparning och refresh, inte animation. LogScreen äger en lokal, tillfällig snapshot från delete-försökets start; först efter bekräftat `saved` får snapshotten spela exit-animation.
- Ändra inte QuickLog write API, RLS, migrationsfiler, analytics, träningsordning eller tidigare dubblettfönster.
- Skyddade filer/områden: `src/features/home/ProductWorkspace.tsx` får endast fortsatt äga befintliga data-/sparresultat och får inget nytt animationsstate; `src/features/training/TrainingScreen.tsx` ändras inte.
- Eriks telefon-QA av senaste `main` och bekräftelse att Olycka nu sparas registreras som användarrapporterat resultat; build/version och skärmbilder är inte bifogade.

## Avvikelser från målbilden

Ingen avsedd layout-, copy- eller navigationsavvikelse. Motionen förstärker befintliga bekräftade tillstånd enligt beslut 0004 och designreglernas avsnitt 15.

## Verifiering före leverans

- Fokuserade motion-, logg- och UI-policytester; full `pnpm check`; `git diff --check`; kövalidering.
- Bevisa: en entré per bekräftad insert; ingen entré för ej sparat tillstånd; delete-snapshot ersätter källraden utan visuellt glapp eller dubblett under pending, saved, failed och unsure; pending-raden är inert och begriplig i skärmläsaren; efter `saved` döljs snapshotten från skärmläsaren och är fortsatt inert före exit; `failed`/`unsure` lämnar källraden och feedbacken intakt; confirmed delete tar bort exakt sin rad; gamla callbacks påverkar inte senare mutationer; 2 s/2 min skydd är oförändrat.
- Bevisa träningsbock endast efter serverförsonad datauppdatering av exakt nyligen sparat steg; initialt klara steg animeras inte och failed/unsure completion får ingen success-rörelse. Bekräfta även klart-tillstånd i skärmläsarens accessible label/state.
- QA kontrollerar reduced motion on/off, accessibility state och 360/430 px + stor text. Skärmbild/rörelseevidens eller itemiserad NOT TESTABLE.
- Oberoende QA och Reviewer enligt workflow. Efter färdig lokal build stoppas MOTION-kedjan för Eriks telefonresultat, enligt beslut 0004.

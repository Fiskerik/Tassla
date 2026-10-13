# UX-spec — rev02 R02-4D: Tassla-pass

Datum: 2026-10-13 · Version: 1 · Status: implementing · Ägardirektiv: fortsätt med återstående skärmar.

## Användaruppgift

Ägaren ska granska vilka befintliga profil-, vikt- och utförda hälsofält som ingår i Tassla-passets snapshot och själv starta lokal PDF-delning.

## Beteendegräns

Behåll exakt urval, snapshot-källor, profil-/vikt-/historik-readiness, lifetime-kontroller, retry, PDF-generering, filstädning, owner-initierad systemdelning och befintliga fel-/dialogresultat. Ingen automatisk export, molnlagring, leveransbekräftelse, planerad hälsa i PDF eller verifierad journalidentitet tillkommer.

## Visuell riktning

- Rubrik `Tassla-pass`, tydlig stäng/tillbaka till Mer och vänsterställd introduktion.
- Ljus, varm PDF-förhandsvisning med avsnitt för hundprofil, senaste vikt och utförd historik.
- Lila opt-in accent särskiljer export-/passytan; varje urval behåller synlig checkboxsemantik och faktiska datum/värden.
- Högst en primär handling `Dela som PDF`; urval och förklarande disclaimers ligger nära previewn.
- Fel med saknade data hindrar delning och anger om ägaren kan välja bort avsnittet eller försöka igen.

## Filscope och render

- `src/features/passport/PassportScreen.tsx`, `src/features/passport/README.md`, `tools/visual-check/app.tsx`
- Denna spec, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4d/`.
- Rendera public/review vid 375×844, 430×844, 375×667 och 140 % browserzoom. Granska vald/avvald sektion, saknad profil/vikt/historik, loading/error och lokal exportfeedback där harness kan uttrycka den. Ingen native PDF/share-sheet-, filsystem- eller backendverifiering påstås.

## §14

Det finns ingen passpanel i målbilden. Jämför mot närmaste varma kort-, checklist- och gruppmönster; ange Nej för exakt panelmatch och NOT TESTABLE för native export-/delningsläge.

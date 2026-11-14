# GAP-TRAINING-UNKNOWN-COPY-01

Status: checkpoint; lokal granskning klar, native och serverprov återstår. Bas `d122622645eefb3f4c44ce488afea7105624d878` med lokala GAP-checkpoints. Ägarens GAP-uppdrag efterfrågar varmare, tydligare felspråk. Mål: träningens två reservtexter vid osäkert sparresultat beskriver både osäkerhet och nästa kontroll utan att hävda misslyckad eller bekräftad sparning. Critic PROCEED. En skrivägare; oberoende QA/Reviewer/UI-critic.

Skrivvägar: `src/features/training/PublishedTrainingScreen.tsx`, `src/features/training/README.md`, `tools/visual-check/app.tsx` (enbart syntetisk styrning), relevant verifierare/test och evidens `docs/design/evidence/gap-training-unknown-copy-01/`, detta kontrakt och TestFlight-listan. Byt bara fallbacktexten i de två unknown-grenarna. Behåll programspecifika meddelanden, bekräftat-sparad readback, samma idempotenta retry, tillgänglighet och all övrig logik. Ingen ändrad data, navigation, schema eller dependency.

Acceptans: båda grenar visar «Vi kunde inte se om ändringen sparades. Kontrollera den igen.» om inget mer specifikt meddelande finns; retry och spärr är oförändrade. Pröva faktisk synthetic RN Web-fixture för översikt/övning, 320/375/430 och stor text, samt befintlig recovery och next-action. `pnpm check`, `git diff --check`, visuell jämförelse och oberoende QA/Reviewer/UI-critic. Verklig server, native VoiceOver/Dynamic Type och TestFlight hålls separata.

## Checkpoint

Båda fallbacktexterna är ändrade; programspecifika texter, bekräftad readback och samma retry-callback är oförändrade. Syntetisk fixture kan sätta unknown efter att en övningssheet öppnats utan att simulera produktdata. Oberoende QA körde RN Web-provet för båda placeringarna vid 320/375/430 och 140 % CSS-textproxy; knapparna var minst 44 pt. Reviewer fann ingen blockerare; UI-critic bedömde text och knapp läsbara i båda vyer. `verify-training-step-motion.py` passerade separat med simulerat unknown/retry samt pending/failed och oförändrad stegövergång. Detta är inte verkligt server-/nativeprov. Skärmbilder finns i `docs/design/evidence/gap-training-unknown-copy-01/`.

`pnpm check` PASS: typecheck, edge-typecheck, lint och 1008 tester (1007 PASS, 1 skipped); `git diff --check` PASS. Native VoiceOver/Dynamic Type, verklig server och TestFlight återstår.

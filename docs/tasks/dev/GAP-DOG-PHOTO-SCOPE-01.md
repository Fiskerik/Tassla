# GAP-DOG-PHOTO-SCOPE-01

Status: checkpoint; oaktiverade portar testade, native och cleanup återstår. Bas `d122622645eefb3f4c44ce488afea7105624d878` samt lokala GAP-checkpoints. Mål: ge varje experimentell staging-/bildfil både ägar- och hundscope så framtida hundradering kan skilja bilder från olika hundar även efter bildbyte. Säkerhet identifierade att föregående owner/photo-nyckel inte gav sådan koppling. En skrivägare; oberoende Security/QA/Reviewer.

Skrivvägar: `src/features/dog-photo/photo-store.ts`, `tests/dog-photo-store.test.mjs`, `src/features/dog-photo/README.md`, detta kontrakt. Ingen native-/UI-/nätintegration, ny dependency eller faktisk deletion. Portkontraktet ska ge `(ownerId,dogId,photoId)` till skapande och läsning, även vid osäker staging/reconcile. Alla tre identiteter valideras före portanrop; en sen operation får endast träffa fångat scope. Ägarens manifest fortsätter serialiseras och tidigare/stagingfiler får inte tyst raderas. Ingen pathsträng kommer från användaren.

Acceptans: syntetiska beteendetester för två hundar/samma ägare, identiska foto-ID:n med olika hundscope, två ägare, fel scope, sena ändringar och staging-reconcile; ingen läsning av annan hunds bytes. Behåll befintliga fel-/konkurrenstester. `pnpm check`, oberoende QA/reviewer/security. Fake-port bevisar inte faktisk katalogisolering, fysisk radering, native, backup eller kontolivscykel; dessa återstår före aktivering.

## Checkpoint

Kärnans `createExclusive` och `readPhoto` får nu fångat owner/dog/photo; samma foto-ID kan återfinnas separat för olika hundar/ägare. Strikt UUID- och manifestvalidering gäller fortsatt. Riktade tester 16/16 PASS, inklusive identiska foto-ID:n på två hundar/två ägare, ogiltiga ID:n utan portanrop, scopebyte och försök att reconcila en annan hunds staging. `pnpm check` PASS: typecheck, edge-typecheck, lint samt 993 tester (992 PASS, 1 skipped); `git diff --check` PASS. Oberoende reviewer fann ingen blockerare, Security APPROVE gäller endast den oaktiverade fake-kärnan; QA:s identifierade negativa testfall kompletterades.

Nästa steg: en faktisk adapter med särskilt granskad katalogreservation/CAS, därefter återupptagbar rensning samordnad med bildskrivare och hund-/kontoradering. Fake-porten bevisar inte native katalogisolering, beständighet, backup, filskydd eller faktisk deletion. Ingen hundbildsfunktion är aktiverad.

## API- och pickerbeslut 2026-11-13

Installerad `expo-file-system` 57.0.7 har `File.pickFileAsync`, men iOS-implementationen öppnar `UIDocumentPickerViewController` (Filer), inte bildbibliotekets fotoväljare. Ingen Photos-picker finns installerad. Expo SDK 57:s paketregister anger `expo-image-picker ~57.0.20`. En Filer-genväg skulle kräva att ägaren först exporterar/flyttar sitt foto och ger inte den avsedda ett-stegsbildresan; den väljs därför inte som ersättning. Nästa bildslice behöver den native Photos-pickern, samma-bytevalidering/omkodning, säker lokal lagring och synkroniserad hund-/kontoradering. AGENTS.md kräver ägarbeslut före ny dependency; ingen dependency har lagts till och ingen picker-/lagringsfunktion aktiverats.

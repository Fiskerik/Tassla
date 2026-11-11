# HOME-MEMORY-01 — bekräftade minnen och nästa övning

Status done · plan v2 · risk M · bas `85efaaa35753f44f712b4ec96c0fba403830d068` · root ensam writer. Eriks godkända steg2 i MVP-COMPLETION-261031. Föregående publicerat utvecklingsinnehåll färdigt/committat.

## Resultat
Hems historikkort prioriterar senaste faktiskt bekräftade delmål framför nyare vanligt pass/logg; annars visas relevant bekräftat pass eller senaste logg, utan att ett allmänt åldersråd utges för historik. En verifierad träningskälla är läsbar även om loggkällan laddar/felar. Vid avsaknad/unknown ges ärlig neutral text; ingen komplett historik påstås från begränsat loggfönster. Datum är faktisk confirmed_at/performed_at, endast rätt hund, giltig ej framtida tid, tillgänglig exakt programversion/steg/journey och ej pending/unknownversioner. Identiska tider ordnas deterministiskt.

Reflektionen behåller programversions-/steg-/journey-/rowidentitet och öppnar exakt samma steg i befintlig träningsvy via en konto-/hundscopead initialfokus. Om version eller steg hunnit försvinna visas ingen fabricerad historik. Loggkortet öppnar Logga och säger det uttryckligen; exakt loggradering är ett separat steg eftersom ingen befintlig loggfokus-API finns. Nästa förslag behåller faktiskt stegid och öppnar den övningen; exkludera osäkra/pausade resor, bevara legitim progress och gör inga skrivningar från navigation.

Den dagliga progresskällan och dess räknare bevaras. Ringanimation kräver uttrycklig användarinitierad confirmed-signal och får en separat liten slice; ingen allmän rörelse på hydrering införs här. Ingen ny bakgrundsläsning, RLS, dataändring, nya råd eller dependencies.

## Acceptans
Tester för äldre milestone mot nyare pass/logg, samma tid, fel hund, orphan/stale/future/pending/version, faktisk source-id, oberoende loggfel, neutral tomstatus, icke påhittat nästa steg och bevarat same-step navigation. Browserprov med syntetiska sparade data, 375/430/kort667/text140 och failure/retry; jämför Hem mot panel1. Full pnpm check, publiciOSexport, diff/scope och queueaudit, Architect/Critic, UIcritic BRIEF/REVIEW, oberoendeQA/Reviewer. Livehistory/RLS/native NT. Boundedcleanup och commit före nästa del.

## Skrivvägar
- tools/visual-check/verify-traction-home.py
- src/features/home/home-reflection.ts
- src/features/home/home-training-suggestion.ts
- src/features/home/HomeScreen.tsx
- src/features/home/ProductWorkspace.tsx
- src/features/home/README.md
- src/features/training/PublishedTrainingScreen.tsx
- src/features/training/README.md
- tests/home-reflection.test.mjs
- tests/home-training-suggestion.test.mjs
- tests/home-vision.test.mjs
- tests/training-overview.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/verify-home-memory.py
- docs/design/evidence/home-memory-01
- docs/tasks/dev/HOME-MEMORY-01.md
- docs/tasks/dev/MVP-COMPLETION-261031.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md

Underlag: AGENTS/workflow, designregler0–4/14–15, consumerUX/iOSskills, roadmap, home-reflection/HomeScreen/ProductWorkspace/PublishedTrainingScreen och befintliga tester. Architectreadonly identifierade att exact logfocus saknas och kräver separat avgränsning; dagens progresskälla ska återanvändas.

Planv2: befintligt visionsprov verify-traction-home.py hävdar uttryckligen att generellt åldersråd visas i historikkortet. Lägg till testpath för att uppdatera detta gamla kontrakt till ärligt tomläge och bevara övriga tester. Ingen ny produktpath. UIcritic brief påpekade separat att logloading-skeleton idag felaktigt döljer ett verifierat träningsminne. Förnyad Architect/Criticreview.

## Checkpoint 2026-10-31
Roten implementerade enbart skrivvägarna ovan och gjorde bounded cleanup; dokumentationen uppdaterad. Arkitekt APPROVE och Critic PROCEED v2. Oberoende QA fann inga blockerande fel: träningsminne filtrerar hund, resa, version, steg och framtida/okända data; browserfixture visar samma steg samt neutralt borttaget steg. Oberoende kodgranskare APPROVE. UIcritic såg aktuella jämförelse- och 375/430/text140-bilder: kortets ändring läsbar, bevarade panelavvikelser och visuell NT specificeras i `docs/design/evidence/home-memory-01/VERIFICATION.md`.

`pnpm check`: 899 PASS, 1 skip (900 tester). Public iOS JS-export PASS. `verify-home-memory.py` och `verify-traction-home.py`: PASS i syntetisk RN Web; scope- och whitespacekontroll körs vid commit. Livehistorik/RLS, native, VoiceOver och signerad distribution ej testade. Exakt logghändelsefokus, sammanhängande historik och confirmed-only ringrörelse kvarstår i steg2; tasken påstår inte att hela steg2 är klart.

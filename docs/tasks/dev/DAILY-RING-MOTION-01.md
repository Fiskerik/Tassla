# DAILY-RING-MOTION-01 — bekräftad rörelse i dagsringen

Status done · plan v2 · bas `04718d30d0c1b193339bb4db068f692e2c159a89` · risk M · root ensam writer. Ägarens godkända önskemål om konsekvent, sparbekräftad rörelse och roadmap steg2.

Enbart vid en av användaren begärd avbockning vars exakta hund/dag/rutinpunkt bekräftats i komplett återläst dagsdata animeras den dekorativa SVG-ringen i 220 ms. Räknare och tillgänglighetsvärde visar omedelbart bekräftade värden. Befintlig reducerad rörelse, avbrott och direktvärde bevaras. Ingen animation vid initial hämtning, avbockning tillbaka, misslyckande/unknown, scopebyte, andra förändringar, otillräckligt readback eller preferensbyte. Ingen ny dependency eller dataändring.

Arkitektens kontrakt: tillfällig intent bär exakt currentDailyLifetime och rad/punktidentitet, total och aktivitetsidentiteter före tryck. För en animation krävs identisk komplett lista, samma total och exakt +1 bekräftad punkt, state ready och inga mutation-/refreshfel eller pending. Fel/unknown, annat scope eller aktivitetsskillnad förkastar intent. Inga gissade mutation receipts: callback returnerar void. Reducerad rörelse konsumerar intent utan animation.

Skrivvägar: `src/features/home/DailyProgressScreen.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/features/home/daily-ring-motion.ts`, `src/features/home/README.md`, `tests/daily-ring-motion.test.mjs`, `tests/daily-progress-screen.test.mjs`, `tools/visual-check/app.tsx`, `tools/visual-check/verify-daily-ring-motion.py`, `docs/design/evidence/daily-ring-motion-01/`, `docs/tasks/dev/DAILY-RING-MOTION-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md`.

Acceptans: verkliga övergångssekvenser för bekräftad/hydrering/unknown/fel/undo/scope/annan aktivitet/reducerad rörelse, faktisk SVG-ändring i syntetisk browser och oförändrat semantiskt antal. Bilder och UIcritic mot panel3; oberoende QA/reviewer, `pnpm check`, public iOS JS-export och scope/whitespace. Live/RLS, native animation och VoiceOver är separata NOT TESTABLE.

Critic: armera bara när global mutation är idle och fel-/refreshfri; varje nytt tryck tömmer föregående intent, även avvisat tryck eller undo. Kräva observerad pending för samma mutationsnyckel och samma nyckel vid lyckad readback. Annan mutation eller ofullständig källa förkastar intentionen.

## Checkpoint 2026-11-04
Architect och Critic PROCEED v2; UIcritic BRIEF på öppnade referensbilder. Endast deklarerade paths. Begränsad cleanup utförd. Separat intentpolicy använder observerad matchande pending och oförändrade övriga punkter; snappar utan animation för reducerad/okänd preferens. Syntetisk browser mäter mellanvärden, korrekt slutetikett, reducerad rörelse, fel och undo; policytester täcker negativa sekvenser. Public iOS JS-export PASS. Oberoende QA/visuell review och full check pågår. Inga påståenden om live/native.

Oberoende QA fann preferensbyte under pågående intent; åtgärdat genom att varje sådan händelse kastar intent och snappar aktiv båge. QA:s nya browserprov PASS för både byte under pending och under animation. UIcritic REVIEW såg aktuell tidsserie och bilder; avgränsad ändring visuellt utan nytt layoutfel, tidigare panel3-avvikelser kvar. Reviewer APPROVE efter uttrycklig ready-guard. Slutlig `pnpm check` 907 PASS/1 skip, public iOS JS-export PASS och aktuell synthetic browser PASS efter sista guardändringen. Ingen signerad build/live/native.

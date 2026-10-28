# Verifiering — TRAINING-EXERCISE-MODAL-UX-01 v6

## Kontroller

- `node --experimental-strip-types --test tests/training-progression-ui.test.mjs tests/training-screen-policy.test.mjs` — PASS.
- `CI=1 pnpm check` — PASS; typecheck, edge typecheck, lint och 98/98 testfiler.
- `python -X utf8 tools/visual-check/verify-flow-training.py` i public och review RN Web med `TASSLA_TRAINING_TIMELINE_EVIDENCE` riktad till taskens respektive `timeline/`-mapp — PASS, 30/30 per läge, 0 fel.
- Visuellt öppnade modalbilder och panel-6-jämförelsen: hundansiktet syns; aktivt steg och bekräftad progress visas separat; Klart/Ångra är kompakta; instruktionen är vänsterställd och nåbar vid 140 % text och kort viewport.
- `python -X utf8 tools/dev_flow.py validate` och `git diff --check` — PASS vid checkpoint.

## Begränsningar och utredning

- Native iOS/Android, VoiceOver, faktisk Dynamic Type och plattformens gestkonkurrens är **NOT TESTABLE** i RN Web.
- En senare verifieraromkörning kunde inte starta Chromium i den begränsade körmiljön (`SIGTRAP` / `setsockopt: Operation not permitted`). Oberoende QA öppnade och granskade de tidigare sparade public/review-bilderna. De godkända skärmbilderna ligger kvar i taskens `public/` och `review/`-mappar.
- En tidigare tidslinjeverifiering hade skrivit över fem filer utanför taskens evidensmapp. Dessa fem filer återställdes till HEAD; den nya körningen sparade tidslinjebilderna under `training-exercise-modal-ux-01/{public,review}/timeline/`. Inga utanför-scope evidensfiler finns kvar ändrade av denna task.

## Faktisk kodscope

Kod och taskbevis ligger i de deklarerade skrivvägarna för v6. Ingen schema-, RPC-, innehålls-, navigations- eller dependency-ändring gjordes.

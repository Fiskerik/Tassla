# UIUX-2A-TEST-ALIGN-01 — uppdatera inaktuella Logg-assertioner

Datum: 2026-10-19 · Plan v1 · Status: done — separat testcommit dd9e30c.

## Bakgrund

Pågående `pnpm check` passerade `typecheck`, edge-account typecheck och lint men misslyckades i två befintliga tester: `tests/log-screen-policy.test.mjs` och `tests/toast-compact-policy.test.mjs`. Båda letar efter den äldre inline-expressionen `onUndo={mutation?.status === 'saved' && mutation.kind === 'add' ...}`. 2a-koden räknar nu först fram `undoableQuickLogId` och skickar det vidare till Toast. Den befintliga assertionsformen följer implementationens syntax i stället för det oförändrade beteendekontraktet.

## Mål och avgränsning

Uppdatera endast de två stale source-shape-assertionerna så att de verifierar den aktuella koden: bara en bekräftad `add` med `onUndo` får ett undo-ID, exakt event-ID skickas till callbacken, och toastens varaktighet följer befintlig VoiceOver-regel. Ändra inte produktkod, förväntat beteende eller andra scenarier. Ta inte bort, hoppa över eller försvaga tester; inga nya testfall eller dependencies.

## Tillåtna skrivvägar

- `tests/log-screen-policy.test.mjs`
- `tests/toast-compact-policy.test.mjs`
- `docs/tasks/dev/uiux-2a-test-assertion-alignment-2026-10-19.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md` (endast avslutande rapport)

## Acceptans och verifiering

1. De två riktade policytesterna passerar mot den aktuella `LogScreen`-koden.
2. `pnpm check` passerar typecheck, edge-account typecheck, lint och alla befintliga tester.
3. `git diff --check` och `python tools/dev_flow.py validate` passerar.
4. Oberoende Reviewer bekräftar att testernas beteendekrav inte försvagats och att inga produktfiler ändrats i den här korrigeringen.
5. Korrigeringen får en separat commit före push av färdiga 2a/2b-paket. Flikövergångens blockerade filer hålls utanför.

Riskklass: L, testassertioner endast. Security/Critic/Dog Expert behövs inte eftersom data, produktbeteende och UX-copy inte ändras. Architect granskar denna plan före teständring; Reviewer granskar efter QA.
## Architect-granskning

Verdict: **APPROVE** — `UIUX-2A-TEST-ALIGN-01`, plan v1. Granskaren godkänner den avgränsade teständringen och kräver att assertionerna uttrycker de tre beteendeinvarianterna (giltigt undo-ID, exakt ID till callback och skärmläsaranpassad timeout), inte bara det nya variabelnamnet. Inga produktfiler får ändras.


## QA-resultat

- Riktade policytester: PASS, 13/13.
- `pnpm check`: PASS; typecheck, edge-account typecheck, lint samt 492/492 tester.
- `python tools/dev_flow.py validate`: PASS.
- `git diff --check` och `git diff --cached --check`: PASS (endast Git-varning om LF→CRLF-normalisering).
- iOS Expo-export med `TASSLA_BUILD_CHANNEL=public`, review content avstängt och telemetry av: PASS, `dist/ios` exporterad.
- Ändrade produktfiler: inga. Ändrade testfiler: endast de två tillåtna.

## Oberoende Reviewer

Verdict: **PASS**. Assertionerna bevarar tidigare undo-täckning och kontrollerar beteendekontraktet: undo-ID endast vid bekräftad `add` när callback finns, exakt ID skickas till callbacken, och timeout är avstängd för undo-toast när skärmläsare är aktiv eller status är okänd. Inga testfall togs bort eller hoppades över; inga produktfiler ändrades i korrigeringen.

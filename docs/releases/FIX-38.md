# FIX-38 — Toast lintfel och Git preflight

Datum: 2026-10-10
Paket-ID: FIX-38
Status: Implementerad; QA PASS och oberoende code review PASS
Bascommit: `3585c59` på `remove-ai-slop`
Leveranscommit: ej skapad
TestFlight build/version: ej tillämpligt; ingen telefonrelease ingår
GitHub Release: skapas inte för denna rättning

## Major changes

Toast är render-pure: refs synkroniseras i effects, tidigare innehåll bevaras i villkorligt korrigerat state och utgång/callback hanteras även när reducerad rörelse ändras under utgång. CodeMagic-felets `react-hooks/refs` och `react-hooks/set-state-in-effect` är åtgärdade utan lint-undantag.

Versionshanterade pre-commit- och pre-push-hookar kör `pnpm check`; commit kontrollerar staged whitespace och push granskar varje ref som skickas. Kloon kan installera hookarna med `./tools/install-git-hooks.sh`.

## Minor changes

`AGENTS.md` anger nu uttryckligen kontrollerna före varje commit och push, hookinstallation per klon och förbud mot att hoppa över hookar/tester. Tre föråldrade statiska källkodsförväntningar i befintliga policytester uppdaterades till aktuellt verifierat Toast-/feedbackkontrakt; inga tester inaktiverades.

## Bug-fixes

- React refs används inte under Toast-rendering.
- Synchronous `setState`-anropet i effect är borttaget.
- Exit-callbacken körs en gång även när reducerad rörelse slås på medan Toast lämnar.

## Verifiering

- `pnpm check`: PASS — TypeScript och edge TypeScript passerar, ESLint 0 fel/35 befintliga varningar, testsvit 395 pass/1 skip/0 fail.
- `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`: PASS.
- Riktad ESLint för `Toast.tsx`: PASS.
- Hooktest i separat temporärt Git-repo: PASS för commit-kontrollfel, staged whitespace, ny branch, befintlig refs whitespace, raderad ref och felande push-kontroll.
- `git diff --check` och `python tools/dev_flow.py validate`: PASS.
- Renderad visuell QA, stor text och skärmläsare på fysisk enhet: NOT TESTABLE. Se [checklista](../design/FIX-38/checklist.md); tidigare screenshotförsök i UI-08 dokumenterar sandboxens localhost/Chromium-begränsning.

## Nästa steg

QA och Reviewer har bekräftat kod, hookar och dokumentation. Nästa steg: commit med aktiva hookar och push till `origin/remove-ai-slop`; leveranscommit-SHA dokumenteras efter leverans.

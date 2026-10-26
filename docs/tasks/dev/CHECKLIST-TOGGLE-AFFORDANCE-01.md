# CHECKLIST-TOGGLE-AFFORDANCE-01 — granska checklistans bockutseende

**Status:** planned · **Planversion:** v1 · **Risk:** M

## Mål

Granska det markerade och omarkerade kontrollutseendet i faschecklistan mot ägarens inringade iPhone-exempel. Justera formen, storleken eller kontrasten om UI Critic bekräftar en konkret visuell förbättring, samtidigt som varje kontroll behåller minst 44×44 pt tryckyta och tydligt hjälpmedelstillstånd.

UI Critic noterade att nuvarande Knowledge-faschecklista visar 24 pt fyrkantiga `checkbox`/`square-outline`-ikoner, medan ägarens exempel visar större cirkulära markeringar. Befintliga designregler tillåter kompakt ikon om tryckytan minst 44 pt; Home använder separat kvadratisk checkboxregel. Den senaste pop-full fascheckliste-rendern saknas, så ingen stiländring antas utan en fokuserad granskning.

## Omfattning

- Rendera en fylld faschecklista med markerade och omarkerade punkter vid 375×844, 430×844, 375×667 och 140 % textproxy.
- Låt UI Critic jämföra cirkulär och fyrkantig affordance för form, storlek och kontrast med den bifogade iPhone-bilden och Tasslas befintliga tokens.
- Välj och dokumentera ett uttryckligt utseende. Implementera endast den kritiserade kontrollen; ändra inte filterpillarnas scrollning, innehåll eller sparsemantik.
- Behåll accessibility role, checked-state, beskrivande label och minst 44×44 pt hit target.

## Skrivvägar

- `docs/tasks/dev/CHECKLIST-TOGGLE-AFFORDANCE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `src/features/knowledge/PuppyChecklistScreen.tsx`
- `tests/checklist-toggle-affordance.test.mjs`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `docs/design/evidence/checklist-toggle-affordance-2026-10-25/`

## Acceptans

| Kriterium | Kontroll |
|---|---|
| UI Critic fattar ett tydligt beslut om form, storlek och kontrast utifrån den fyllda vyn | Sparade cirkel-/kvadratjämförelser och Critic-resultat |
| Markerad/omarkerad state är visuellt särskiljbar och texten radbryts utan att flytta kontrollen oavsiktligt | Render vid 375/430 samt 375×667/140 % |
| Tryckytan är minst 44×44 pt och hjälpmedel läser roll, namn och checked-state | RN Web-mätning och riktat test; native VoiceOver markeras separat |
| Ändringen håller sig till kontrollens affordance | Diff-/scope-review |

## Verifiering

- `node --experimental-strip-types --test tests/checklist-toggle-affordance.test.mjs`
- `CI=1 pnpm check`
- `python -X utf8 tools/dev_flow.py validate`
- `git diff --check`
- UI Critic, oberoende QA och Reviewer.

Native VoiceOver, fysisk touchyta och TestFlight-inspektion är **NOT TESTABLE** utan en ny signerad iPhone-build.

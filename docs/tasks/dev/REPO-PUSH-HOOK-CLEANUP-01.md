# REPO-PUSH-HOOK-CLEANUP-01 — new branch push hook cleanup

Planversion: **v1**

## Uppgiftskontrakt

| Fält | Innehåll |
|---|---|
| ID / status | `REPO-PUSH-HOOK-CLEANUP-01` / `done` |
| Bas | `knowledge/d3-catalog-delivery@8cce04f`; `origin/main@ff3af0bcfe5c29cd1077ac45fce622e60c7bdee4` |
| Mål | Göra den auktoriserade pushen av en ny GitHub-branch möjlig genom att ta bort det enda befintliga trailing-whitespace-fyndet som fångades av `.githooks/pre-push`. |
| Orsak | Den första pushen av `knowledge/d3-catalog-delivery` körde hela `pnpm check` och fick 776 pass / 1 skip, men pre-push-hookens nya branch-tree `git diff --check` stoppades av `codemagic.yaml:23`. Hooken har `set -e`; dess diff-check omfattar hela trädet för en ny remote-ref. Ingen kod/buildkonfiguration ändras funktionellt. |
| Ingår | Ta bort endast blanksteg efter värdet på `codemagic.yaml:23`; dokumentera den minimala hook-fixen. |
| Ingår inte | Ändra YAML-värden, pipeline, dependencies eller hookar; kringgå hooken; ändra D3-innehåll eller appkod; merge/deploy/produktionsoperation. |
| Ägare / granskare | Skrivägare: Codex-koordinator. Critic läser plan v1 före ändringen; därefter oberoende QA och frozen Reviewer läser den slutliga diffen. |
| Beroenden / risk | D3-katalogen är färdiggranskad lokalt och har commit `8cce04f`; lågrisk, exakt whitespace-only ändring. |

## Läsunderlag

- `AGENTS.md`, `docs/dev/workflow.md`.
- `.githooks/pre-push` och `codemagic.yaml` rad 23.
- `docs/tasks/dev/queue.json`, D3-checkpointen `KNOWLEDGE-PHASE-CATALOG-01`.

## Planerade skrivvägar

- `codemagic.yaml`
- `docs/tasks/dev/REPO-PUSH-HOOK-CLEANUP-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`

## Acceptanskriterier och bevis

Plan review: Critic **PROCEED**; Architect **APPROVE**. Architect parsed the YAML before and after removing only the EOL spaces and confirmed the mappings and `APP_STORE_APPLE_ID` value are identical. Implementation may now begin.

| Kriterium | Bevis / kontroll | Resultat |
|---|---|---|
| Endast slutblanksteg på `codemagic.yaml:23` tas bort. | Inspektera diff och verifiera `git diff --ignore-space-at-eol` är tom för ändringen. | PASS; no non-whitespace diff in this file. |
| YAML-innehåll och Codemagic-beteende är oförändrade. | Diff visar endast whitespace-borttagning; ingen värde-/strukturändring. | Architect confirmed parsed YAML mappings and `APP_STORE_APPLE_ID` are unchanged. |
| Den lokala outgoing diffen är ren; den faktiska nya-branch push-hooken körs innan remote-branchen skapas och får inte hoppas över. | `git diff --check origin/main`; `pnpm check`; därefter auktoriserat `git push` kör `.githooks/pre-push` mot hela nya branchen. | Lokal diff och `pnpm check` (85/85) PASS. Hook-retry återstår vid push; cleanup tasken är stängd som lokal checkpoint och påstår inte att GitHub-branch redan finns. |
| Ändrade paths matchar denna taskens frysta `write_paths`; QA och frozen Reviewer PASS. | Queue JSON/dev_flow validation; ändringspaths-audit; slutgranskningar. | PASS; 5/5 changed paths match write_paths; independent QA and frozen Reviewer PASS. |

## Checkpoint

Critic PROCEED and Architect APPROVE on plan v1. Removed only the two EOL spaces after `APP_STORE_APPLE_ID`; YAML mappings/value are unchanged. `git diff --ignore-space-at-eol --exit-code -- codemagic.yaml`, `git diff --check origin/main`, `pnpm check` (85/85), queue validation and the 5/5 path audit pass. Independent QA and frozen Reviewer PASS. This task is done as a local cleanup checkpoint; the actual new-ref pre-push hook has not yet rerun. Next: commit this whitespace-only cleanup and retry the authorized push with hooks enabled.

# CHECKLIST-UI-LUNA-DETAIL — fryst checkpoint

Datum: 2026-10-13  
Basrevision: `1f2419e9d9821c6b9af1a4d6daa6cc62bc853203`  
Köstatus: `done` efter independent QA PASS och Reviewer PASS.

## Fryst diff

`CHECKPOINT-DETAIL.patch` är en binärkompatibel Git patch genererad mot basrevisionen ovan efter att QA PASS och Reviewer PASS registrerats. Den innehåller diffen för samtliga ändrade spårade filer och samtliga dåvarande ospårade filer, inklusive checklistans kod, task/UX-spec, kö/rapport och renderbilder. Patchen utesluter endast sig själv och SHA-256-sidofilen. Hashen finns i `CHECKPOINT-DETAIL.sha256`.

Denna checkpoint har inte skapats genom commit eller push. Overview-slicen ska bygga vidare från denna frysta arbetsyta och får inte skriva om detaljslicensens kontrakt eller evidens.

## Verifierat före checkpoint

- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS.
- Public- och review-build — PASS.
- Manuell browser-rendering — normal, 0/4, 4/4, loading, error, pending, saved, unknown/Kontrollera, 375×844, 430×844, 375×667 och 140 % zoom proxy.
- Public-läge: 0 checklistläsningar och 0 checklistskrivningar.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.
- Inga tester lades till eller kördes.
- Oberoende QA — PASS. Oberoende Reviewer — PASS.

## Kvarstående gränser och fynd

Native VoiceOver/Dynamic Type, verklig iOS/Android-rendering och Supabase/RLS — `NOT TESTABLE`. 140 % webbläsarzoom radbryter den globala bottennavigationens etikett ”Kunskap”; QA bedömer navigationen fortfarande användbar. Detta är ett separat skyddat-scope fynd. En framtida körning av `tools/visual-check/verify-know02.py` skriver till den äldre `docs/design/KNOW-02/evidence`-katalogen; befintliga detaljbilder finns under denna katalog.

## Exakt nästa steg

Starta `CHECKLIST-UI-LUNA-OVERVIEW` enligt `docs/tasks/dev/CHECKLIST-UI-LUNA-01.md`. `CHECKLIST-UI-LUNA-CUSTOM` förblir `planned` tills Overview har separat QA, Reviewer och checkpoint. Behåll reviewflagga/noll-I/O-gate och ändra inte schema, datamodell, storage eller global navigation i dessa slices.

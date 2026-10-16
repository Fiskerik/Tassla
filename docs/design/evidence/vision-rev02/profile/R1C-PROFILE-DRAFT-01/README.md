# R1c — utkastskydd i Hundprofil

Datum: 2026-10-16\
Task: [`UIUX-REVAMP-R1C-PROFILE-DRAFT-01.md`](../../../../../tasks/dev/UIUX-REVAMP-R1C-PROFILE-DRAFT-01.md), plan v4\
Underlag: `vision_rev02.jpg`, [stödskärmskontraktet utan egen referenspanel](../../../../vision-rev02-screen-contracts.md#stödskärmar-utan-egen-referenspanel) och [designregler §14](../../../../design-rules.md#14-obligatorisk-visuell-och-funktionell-granskning).

## Verifiering

- Fokuserade tester: `node --experimental-strip-types --test tests/profile-draft-guard.test.mjs tests/profile-edit.test.mjs tests/main-navigation.test.mjs` — **47/47 godkända**.
- `pnpm check` — TypeScript, edge typecheck, ESLint och **524 tester godkända**, 0 misslyckade.
- Public- och review-fixture: `profile-draft` **12/12 kontroller per läge**, utan browser page errors.
- `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate` och `git diff --check` — PASS.

RN Web-fixturen renderar `EditDogProfileScreen` med syntetiska attribution-svar. Skärmbilder och `browser-results.json` finns i [`public`](public/) och [`review`](review/). De innehåller unknown removal ensam och ihop med dirty profilfält, mismatch med aktuell koppling/utan koppling, navigering, busy state samt 375×844, 430×844, 375×667 och webbaserad 140 % textproxy.

## §14 — separat bedömning

| # | Status | Bedömning |
|---|---|---|
| 1 | Ja | Spara profil är tydlig primär handling; unknown-statusen har en separat återhämtningshandling. |
| 2 | Ej tillämpligt | Vyn jämför inte jämbördiga destinationskort. |
| 3 | Ej tillämpligt | Ingen radering ingår. |
| 4 | Ej tillämpligt | Ingen Hem-rad ändrades. |
| 5 | Ej testbart | RN Web-vyerna provades på tre storlekar; native safe area och tangentbord testades inte. |
| 6 | Ja | Befintliga tokens, profilkort, fält och statuskort återanvänds. |
| 7 | Ja | Ingen ikonfamilj eller symbol ändrades. |
| 8 | Ej testbart | Skärmbilder sparades; separat färgfördelnings- och kontrastmätning saknas. |
| 9 | Ja | Spara, stäng och kennelns kontroll/återhämtning beskriver sina handlingar. |
| 10 | Ja | Ingen ny normalstatusbadge eller obekräftad bock visas. |
| 11 | Ej tillämpligt | Ingen belöningscopy eller uppmuntransbanner lades till. |
| 12 | Ja | Link och removal unknown har varsin sanningsenlig copy; mismatch visar faktisk serverstatus. |
| 13 | Ej testbart | En separat hundprofil-editorcopy saknas som rev02-referens. |
| 14 | Ja | Clean, unknown link/removal, match, mismatch, pending och busy renderades. |
| 15 | Ej testbart | 140 % webtextproxy och reducerad rörelse kördes; native träffytor, VoiceOver och Dynamic Type återstår. |
| 16 | Ej testbart | `vision_rev02.jpg` visar ingen dedikerad redigeringsvy för Hundprofil; direkt kompositions-/typografi-/bildspråksmatchning kan inte bedömas. |
| 17 | Ja | Samma flik är no-op; Stay bevarar värden; discard går till första begärda destinationen. Native Alert och Android system-back testades inte. |
| 18 | Ja | Hundnamn och profilbildens befintliga roll visas. |

Detta bevisar den lokala funktionsresan och webbrenderingen, inte en komplett visuell migration. Oberoende QA PASS granskade checkresultat och representativa public/review-bilder utan kodändringar; Reviewer PASS utan fynd. Live Supabase/RLS och attribution-persistens, native Alert/system-back, iOS-backdrop, VoiceOver/Dynamic Type, fysisk tangentbord-/gestinteraktion och installerad build är **NOT TESTABLE**.

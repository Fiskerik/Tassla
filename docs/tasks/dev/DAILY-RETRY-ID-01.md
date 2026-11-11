# DAILY-RETRY-ID-01 — samma ID för återkontroll av rutin

Status planned · bas `0319a53` · risk H · root ensam writer. MVP-COMPLETION-261031 steg4. Security upptäckte att checklistans lägg till/ta bort-rutin skapar mutation-ID inne i den sparade async-closure som används vid retry. Samma operation kan därmed få ett nytt ID, till skillnad från motsvarande knappar på Hem.

Flytta ID-skapandet före vardera closure och fånga samma ID, rad, hund och dag vid explicit återkontroll. Ändra inga serveranrop, automatiska retries, datascope eller beteendet på Hem. Testa verkliga JSX-callbacks extraherade från ProductWorkspace med unknown följt av upprepad callback, och kontrollera add/remove, ID, hund, datum, tidszon samt att skilda användarhandlingar får skilda ID. Ingen live RLS eller nätverksoperation.

Skrivvägar: `src/features/home/ProductWorkspace.tsx`, `src/features/home/README.md`, `tests/daily-retry-id.test.mjs`, `docs/tasks/dev/DAILY-RETRY-ID-01.md`, `docs/tasks/dev/DAILY-CLOCK-SCOPE-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md`. Acceptans: verkliga callbacks fångar ID före retry, bevarar samma operation och producerar aldrig ett nytt ID vid explicit retry. QA, Security, Reviewer, pnpm check och public iOS JS-export; native/live separat.

Den ännu inte godkända dagsskiftesplanen sparas samtidigt som planerad separat uppgift; Critic STOP på dess v1 innebär att ingen sådan kodändring ingår här.

Critic och Security PROCEED: testet kör en enda faktisk JSX-aktivering, sparar dess closure och återkör exakt den efter unknown; ett separat användartryck ska ge nytt ID. Återläggning av tidigare skip och borttagning av återkommande rad använder RPC med förväntad revision; testa även add utan skip med identiskt rad-ID.

## Checkpoint 2026-11-05

Critic och Security PROCEED; oberoende QA PASS och Reviewer GODKÄND scoped. Verkliga JSX-callbacks exekverades med mockat dataanrop, samma fångade operation efter unknown och separat nytt användartryck. `pnpm check` 921 PASS/1 SKIP, public iOS JS-export PASS, `git diff --check` PASS. Verklig RPC, RLS och native är inte testade; återförsöket är en skrivbegäran med samma ID. Dagsskiftesplanens v1 har Critic STOP och kräver replanering för utkast/repetitionsankare och tvåstegssparning.

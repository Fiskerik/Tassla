# FLOW-HOME-CHECKLIST-UPCOMING-01 — implementation checkpoint

Datum: 2026-10-17

Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`
Plan: [taskplan v3](../../../../../../docs/tasks/dev/FLOW-HOME-CHECKLIST-UPCOMING-01.md), Architect APPROVE, Critic PROCEED, Security PASS.

## Status

Den lokala implementationen innehåller en villkorad Kommande-flik, två separata hundscopeade och avbrytbara källäsningar, recurrence-baserat nästa datum, källspecifik Retry och direktöppning av vald hälsoplan i redigeringsläge. Ingen framtida träningsuppgift, dagsrad, completion, skip eller notifiering skapas.

Automatiska tester har inte lagts till eller körts. Live Supabase/RLS, appflöde och skärmläsar-/native-beteende är därför inte verifierade. Den här checkpointen gör ingen funktionell eller visuell PASS-claim.

## Rev02 §14 — aktuell jämförelse

| Område | Status | Notering |
|---|---|---|
| Komposition | NOT TESTABLE | Ingen ny renderad appskärmbild i den här körningen. |
| Färg | NOT TESTABLE | Tematokens återanvänds; aktuell skärmbild är inte granskad. |
| Typografi | NOT TESTABLE | Datum, tider och labels finns i koden; stor text är inte provad. |
| Komponentformer | NOT TESTABLE | Tabs/ListRow/manager återanvänds; ingen bildjämförelse körd. |
| Bildspråk | NOT TESTABLE | Inga bilder eller illustrerade tillgångar har lagts till. |
| Innehållstäthet | NOT TESTABLE | Partiella, tomma och 40-raderslistor är inte renderverifierade. |

## Nästa verifiering

Efter uttrycklig begäran om verifiering: kontrollera recurrence dag/vecka/månad och datumgräns; över 40 äldre hälsoplaner före framtidsrader; source-specifik retry/loading/error/partial/empty; konto-/hund-/lokaldag-/tidszonsbyte; direktöppning av en vald plan som inte är först; retur till Kommande; manager-fokus och `Välj för idag`; 375×844, 430×844, 375×667 och 140 % text. Live RLS kräver faktisk Supabase-miljö och ägarkonton. Native VoiceOver/Dynamic Type kräver enheten.

# HOME-TIME-01 — Tid för logg och hälsa på Hem

Datum: 2026-10-10
Status: implementerat lokalt; QA-checkpoint blockerad på grund av uteblivna kontroller. Ingen commit eller push. Migrationen har inte körts. Build-id okänt.

## Implementerat

- Snabb loggning är ett tryck och använder befintligt aktuellt klockslag/sparflöde.
- Utförda vaccinationer/veterinärposter tillåter valfritt klockslag. Tomt fält sparas som `NULL`; redigering förifyller en känd tid och legacy-poster utan tid förblir tomma.
- Hälsotid valideras strikt och sparas som `occurred_time` utan tidszonskonvertering. Readback, compare-and-swap och rollback använder samma fält. Befintliga owner/dog-mutationsflöden behålls.
- Hem samlar alla laddade logg- och utförda hälsoposter för vald dag, sorterar dem på tid och visar poster utan känd legacy-tid utan falsk tidsstämpel. Hälsa har separat loading/error-tillstånd.
- Ny migration lägger till nullable `occurred_time time(0)`, shape-/range-check och endast column-level UPDATE-grant för `occurred_time`. Ändring av befintliga RLS-policyer ingår inte.
- Vikt och planerade health events är utanför scope.

## Verifiering och kvar

- Inga testfiler ändrades eller kördes och inga check-/test-/buildkommandon kördes.
- Migrationen är endast granskad mot befintliga schema- och owner-RLS-definitioner; den kördes inte mot någon databas. Runtime DB/RLS är **NOT TESTABLE**.
- Oberoende Security APPROVE v7.1. QA:s källgranskning hittade inga blockerande gap och Reviewer hittade inga blockerande kodfel.
- Renderad skärm-/enhets-QA återstår för health-formulärets tomma och ifyllda tid, Home-tidslinjen och toast success/error/undo i smal/stor layout och stor text. Appens automatiska kontroller har inte körts.
- Ingen commit, push eller deploy har gjorts. Innan paketet kan markeras klart behöver lokala kontroller tillåtas och kvarvarande QA genomföras.

Plan: [HOME-TIME-01](../plans/HOME-TIME-01-time-choice-and-home-timeline.md). Köstatus: `blocked` tills verifieringsgrindarna kan genomföras.

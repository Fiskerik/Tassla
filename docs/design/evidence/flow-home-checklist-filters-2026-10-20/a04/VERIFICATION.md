# A04 — rutinernas sparåterhämtning

Datum: 2026-10-22 · Branch: `2026-10-22-checklist-kommande-navigation` · Syntetiska React Native Web-fixtures.

## Resultat

| Bygge | Resultat | Täckt |
| --- | ---: | --- |
| Public | 9/9 PASS | Definitive failure med bevarad text/ikon och ny sparknapp vid 375/430 px; unknown med låst utkast och exakt retry vid 375 px; konflikt med read-only-utkast och uttrycklig ersättning vid 375/430 px; ny redigering sparas mot senaste revisionen. |
| Review | 9/9 PASS | Samma tillstånd och bredder, med fixturemarkering ovanför appens viewport. |

Körningen använde produktionsskärmarna `DailyChecklistScreen` och `DailyActivityManagerSheet` med syntetiska callbacks. Ingen browser error inträffade. Efter konfliktvalet kontrollerades att serverns senaste rutintext, checklistepunkt, ikon och revision ersätter det gamla utkastet först när ersättningsknappen trycks. En ny ändring sparades därefter mot den senaste revisionen. Vid unknown återspelade verifieraren samma syntetiska operation via den explicita retry-knappen.

Maskinläsbara resultat: [public JSON](public/routine-save-recovery-results.json) · [review JSON](review/routine-save-recovery-results.json).

## Skärmbilder

- Public failure: [375 px](public/routine-save-failed-375.png) · [430 px](public/routine-save-failed-430.png)
- Public unknown: [375 px](public/routine-save-unknown-375.png)
- Public conflict: [375 px](public/routine-save-conflict-375.png) · [430 px](public/routine-save-conflict-430.png) · [efter uttrycklig ersättning](public/routine-save-conflict-replaced-375.png)
- Review captures finns i motsvarande [review-katalog](review/).

## Begränsningar

Detta verifierar bara lokal UI och hanteringslogik med syntetiska svar. Det fastställer inte backendorsaken till det faktiska sparfelet eller om en tabell, RLS-policy eller migration saknas i målmiljön. Live Supabase/RLS, målmiljöns migration, äldre klienters runtime, native VoiceOver/Dynamic Type och TestFlight är NOT TESTABLE. A03:s oberoende QA/Reviewer och full panel-4 §14-granskning är separata öppna grindar. Home-reviewns 4 px syntetiska överlappning ligger utanför A04.

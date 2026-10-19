# UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS — verifiering

Datum: 2026-10-19
Plan: `docs/tasks/dev/UI-ACCESSIBILITY-PHASE-2-5.md` v4 · UX-specifikation: `docs/plans/UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS-ux-spec.md`
Kö-ID: `UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS` · Branch: `codex/tassla-ui-ux-bundle-2026-10-18`

## Implementerat

Rutinhanteringens två långa sidoåtgärder staplas vid fönsterbredd under 360 pt eller `fontScale` från 1.25. Påminnelsesidans informationsrad staplas vid samma brytpunkt. Etiketter, hjälpmedelsnamn, tokenbaserade träffytor och befintlig spara-/behörighetslogik är bevarade. Inga data-, nätverks-, navigations-, behörighets- eller beroendeförändringar ingår.

## Kontroller

| Kontroll | Resultat |
|---|---|
| `node --experimental-strip-types --test tests/notifications.test.mjs tests/home-today.test.mjs` | PASS, 47/47 |
| `pnpm check` | PASS, 549/549 tester; app-/edge-typecheck och ESLint gröna |
| `TASSLA_BUILD_CHANNEL=public`, `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false`; `pnpm bundle:ios` | PASS, 1 446 moduler |
| `git diff --check` | PASS |
| `PYTHONUTF8=1 python tools/dev_flow.py validate` | PASS |
| Säkerhetsgranskning före ändring | APPROVE; explicit tryck krävs för spara/behörighet, owner-keyed preferenser samt rutinernas draft-, hundscope- och återhämtningskontrakt bevaras |
| Oberoende QA | PASS; 47/47 fokuserade tester och syntetisk läs-/interaktionskontroll |
| Oberoende Reviewer | PASS; begränsad layoutdiff, befintliga callbacks och 44 pt-mål kontrollerade |
| Säkerhetsgranskning av fryst diff | APPROVE; inga ändrade data-/behörighets-/återhämtningskontrakt eller nya anrop |

Slutlig kodgranskning verifierade även oförändrade callbacks, utkast-/submission-ID:n, validering, dirty-cancel, busy/readback/retry och separat status för sparande respektive systembehörighet. Oberoende QA PASS, Reviewer PASS och Security APPROVE gäller denna frysta diff.

## Syntetisk visuell- och interaktionskontroll

RN Web-fixturen använde syntetiska data och viewport **375×667 pt**. Stor text simulerades med `fontScale=1.4` och 1.4× text-CSS i en tillfällig lokal renderer; detta är en webproxy, inte iOS Dynamic Type. Vid 320×667 kontrollerades också smal normal text. Ingen JS page error observerades.

- `routines-375x667-font140.png`: rutinöversikt; lång knapptext radbryts, åtgärderna går i en lodrät följd.
- `routine-edit-375x667-font140.png`: redigeringsformuläret och dess spara-/avbryt-läge förblir läsbara; formuläret kan scrollas under fast `Klar`-åtgärd.
- `routines-320x667.png`: smal vy; dagsval och radering staplas.
- `reminders-info-375x667-font140.png`: informationsraden staplas; informationsåtgärden har kvar sin etikett.
- `reminders-denied-375x667-font140.png`: syntetiskt nekad behörighet med läsbar status och separat knapp.

Interaktionskontrollen öppnade rutinhantering och redigering, avbröt och återvände, ändrade rutinens namn och sparade med fixture-readback. Den uttryckliga notisknappen anropade fixture-callbacken och visade nekad status. Träffytorna för rutinåtgärder och informationsåtgärd har minst `tokens.size.touchMin` (44 pt); de delade `Button`-kontrollerna behåller sin befintliga större höjdtoken. Ingen layout-/fokushändelse anropar sparande eller begär behörighet.

## Designregler §14 — avgränsad bedömning

| Punkt | Bedömning | Underlag / gräns |
|---:|---|---|
| 1 | Ja | Spara val är den primära påminnelsehandlingen; permission är en separat sekundär/systemåtgärd. Rutinhallens åtgärder ligger i egna rader vid stor text. |
| 2 | Ja | Jämställda rutinåtgärder har samma bredd vid stapling och delar minsta träffyta. |
| 3 | Ja | Radering har röd visuell skillnad och befintlig native-bekräftelse. |
| 4 | Ej tillämpligt | Ingen Home-rad eller repetitiv hanteringslänk ändrades. |
| 5 | Ja | Brytpunkt och spacing använder befintliga tokens; webbilderna visar fast bottenåtgärd och scrollbart sheet. |
| 6 | Ja | Befintliga komponenter och design-/träffytetokens används. |
| 7 | Ja | Befintlig Ionicons-familj används. |
| 8 | Ej tillämpligt | Ingen färgfördelning eller Home-genväg ändrades; kontrastmätning ingick inte. |
| 9 | Ja | Ikoner och knappetiketter behåller sin befintliga handling. |
| 10 | Ja | Inga nya statusbadges eller obekräftade bockar infördes. |
| 11 | Ja | Befintliga fel-/behörighetsmeddelanden och deras innebörd är oförändrade. |
| 12 | Ja | Befintlig svensk copy behålls. |
| 13 | Ej testbar | Full ton-/bildjämförelse mot rev02 ingår inte i detta delpaket. |
| 14 | Delvis | Rutinlista/redigering och nekad notisbehörighet renderades; alla loading-, save-error- och unknown-lägen renderades inte. |
| 15 | Delvis | 44 pt-tokenkrav och webproxy för 140 % kontrollerades. Native skärmläsare, största Dynamic Type, tangentbord och reducerad rörelse är NOT TESTABLE. |
| 16 | Ej testbar | Ingen jämförbar rev02-referens för påminnelsekortets detaljer; full rev02-likhet hävdas inte. |
| 17 | Delvis | Fixture täckte öppna/redigera/avbryt/spara. Native tillbakaresor och verklig navigationsstack är NOT TESTABLE. |
| 18 | Ej tillämpligt | Ändringen visar inte hundidentitet eller hundinnehåll. |

## Begränsningar

Alla skärmbilder och interaktionsresultat kommer från lokal RN Web-fixture, inte publicerad build eller live backend. iOS/Android Dynamic Type, VoiceOver/TalkBack, native tangentbord/fokus, OS-behörighetsprompt, notisleverans, Supabase/RLS och signerad build är **NOT TESTABLE** här. Bevisen stänger endast detta lokala 2b.1-checkpoint inom dess avgränsning; de godkänner inte hela Hem-, Daglig Checklista- eller Notis-panelen visuellt.

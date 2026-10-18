# UIUX-REVAMP-R4B-PERIOD-01 — redaktionell åldersperiodresolver

Plan v2 · 2026-10-17 · Status: local checkpoint closed. Architect APPROVE, Critic PROCEED, Dog Expert PASS, independent QA PASS, Reviewer PASS.
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`
Beroenden: `UIUX-REVAMP-R4A-RELEVANCE-01` och `FLOW-HOME-CHECKLIST-UPCOMING-01` (båda done).
Risk: M — ändrad domänlogik för härledd hundålder, men inga writes, persisterade fält, kontogränser eller backendkällor ändras.

## Mål

Inför en ren, deterministisk resolver för de tio kronologiska åldersperioder som användaren valt preliminärt som redaktionella intervall. R4b är en modellbyggsten för scenario C: resolverns periodresultat ändras när samma födelsedatum möter ett senare `today`. Det här paketet verifierar inte att hela användarresan byter publicerat urval eller att persistens/progress består genom en installerad app och verklig databas; scenario C förblir öppet tills en senare integration kopplar perioder till relevant urval och verifierar identitet, historik, rutiner och träningsprogression. Befintliga åldersveckor fortsätter styra nuvarande versionsurval; publicerat innehållsgränser och urval ändras inte i R4b.

## Granskade perioder och datumsemantik

Resolverns period-ID och svenska etiketter:

| ID | Etikett | Exklusiv övergång till nästa period |
| --- | --- | --- |
| `0-8-weeks` | 0–8 veckor | Åtta veckor efter födelsedatum |
| `8-12-weeks` | 8–12 veckor | Födelsedatum + 3 kalendermånader enligt `addMonthsClamped` |
| `3-6-months` | 3–6 månader | Födelsedatum + 6 kalendermånader enligt `addMonthsClamped` |
| `6-12-months` | 6–12 månader | Tolvte kalendermånadsdagen |
| `1-2-years` | 1–2 år | 24 fulla kalendermånader |
| `2-4-years` | 2–4 år | 48 fulla kalendermånader |
| `4-6-years` | 4–6 år | 72 fulla kalendermånader |
| `6-8-years` | 6–8 år | 96 fulla kalendermånader |
| `8-10-years` | 8–10 år | 120 fulla kalendermånader |
| `10-plus-years` | 10+ år | Ingen övre gräns |

Varje intervall inkluderar sin startdag och exkluderar övergången till nästa. Datumberäkningen använder befintlig datumvalidering och kalenderdagsaritmetik utan UTC-skift av date-only-värden. Vid månadsslut följer gränserna befintlig `addMonthsClamped`-semantik, dvs. födelsedatum + tre månader är den månadsklämda kalenderdagen. Exempel: födelsedatum 31 januari ger tremånadersgränsen 30 april. Enligt Dog Expert börjar den ungefärligt benämnda perioden “3–6 månader” den dagen; hunden ligger kvar i etiketten “8–12 veckor” efter sin bokstavliga 12-veckorsdag fram till tremånadersgränsen. “8–12 veckor” är därmed inte en strikt 12-veckorsgräns. Alla tio etiketter är redaktionella kronologiska grupperingar, inte veterinärklassificeringar eller bedömningar av utveckling.

Befintlig separat automatisk etikett `VALP` (<6 fulla kalendermånader), `UNGHUND` (6–<24) och `VUXEN` (24+) behåller sin nuvarande semantik. Ingen SENIOR-etikett eller automatisk individuell senior-/slutskedesstatus införs. MVP:s fem breda faser saknar namngiven mappning i aktuellt produktkontrakt; denna task hittar inte på sådana namn eller grupper. Periodhjulet/veckohjulet och navigation baserad på period är fortsatt uppskjuten beslutspunkt enligt Eriks tidigare instruktion.

## Skrivomfång

Produktionsfiler:
- `src/features/onboarding/dog.ts`
- `src/features/onboarding/README.md`

Befintliga tester:
- `tests/domain.test.mjs`
- `tests/profile-edit.test.mjs`

Checkpoint/evidens:
- `docs/tasks/dev/UIUX-REVAMP-R4B-PERIOD-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/life-periods/R4B-PERIOD-01/`

Skrivskyddat: databas/schema/RLS, profilens lagrade fält och ID, hund-/kontoägarskap, innehållspublicering/urval, träningsurval och progress, checklistor, notificationer, UI/screens, age wheel/swipe navigation och beroenden. Ingen ny UX eller synlig copy levereras i denna modelldel.

## Acceptans

1. Resolvern returnerar exakt en av de tio perioderna för varje giltigt födelsedatum högst idag, deterministiskt från `birthDate` och `today`; framtida, saknade och ogiltiga datum ger `null` utan undantag.
2. Övergångsdagar provas dagen före, på och efter varje gräns, inklusive 8 veckor, den bokstavliga 12-veckorsdagen, födelsedatum + 3/6/12 kalendermånader, månadsslut, skottår, 2/4/6/8/10 år och öppet 10+-intervall. För 12 veckor till tremånadersdagen används den uttryckligt ungefärliga “8–12 veckor”-etiketten; inga dagar saknas eller dubbelklassificeras.
3. Samma födelsedatum får olika perioder när `today` passerar gränserna; detta är endast resolver-/modellverifiering och slutför inte MVP scenario C. Resolvern har ingen ID-/persistens-/progressparameter och skriver inget. Befintliga profilredigerings- och R4a-regressioner får köras som regressionsskydd, men bevisar inte att den nya perioden driver urval eller att rutin, historik och träningsprogress överlever ett end-to-end-periodskifte. Den kopplingen kräver en separat senare checkpoint.
4. `ageInWeeks`, `formatDogAge`, `automaticDogAge.stage` och deras nuvarande konsumenter behåller befintligt beteende. `tests/domain.test.mjs` provar befintlig `VALP`/`UNGHUND`/`VUXEN`-gräns före/på/efter 6 och 24 kalendermånader. R4a:s eligibility, målgrupp, behov, surface och version-grants påverkas inte.
5. README beskriver periodresolverns startpunkt, indata/utdata, kalendersemantik, körda tester och att perioderna inte är medicinska utvecklingspåståenden.

## Verifiering

- `node --experimental-strip-types --test tests/domain.test.mjs tests/profile-edit.test.mjs`
- `pnpm check`
- `python tools/dev_flow.py validate`
- `git diff --check`

Ingen UI-visual-QA krävs eftersom inga skärmar eller synliga etiketter ändras. Fullt scenarioprov på installerad native-app och faktisk Supabase/RLS är separat och får inte rapporteras som PASS utifrån lokala tester.

## Reviews före implementation

- Architect APPROVE krävs för exakt plan v2; ändrad plan kräver ny review.
- Critic PROCEED krävs enligt produktflöde och `AGENTS.md`.
- Dog Expert boundary review: PASS med reservationen att etiketten 8–12 veckor är ungefärlig fram till tredje kalendermånadsdagen.
- Security bedöms ej nödvändig för implementationen: ingen persistens, nätverksläsning/skrivning, konto-/hundgräns eller dataändamål ändras. Om granskning hittar sådan påverkan stoppas implementationen och Security planreview begärs.

## Reviewhistorik

- Dog Expert, 2026-10-17: PASS; se `docs/tasks/dev/rapport.md` för gränsbedömning.
- Architect review av exakt v1: CHANGES; begärde regressioner vid befintliga 6/24-månadersgränser och att R4b markeras som endast modellbidrag, inte full Scenario C.
- Critic review av exakt v1: PROCEED WITH CHANGES; samma scenarioavgränsning och tydligare ordalydelse för månadsklämning/12-veckorsetikett.
- Plan v2 innehåller dessa ändringar; Architect och Critic re-review pending.
- Architect final review, exact v2: APPROVE.
- Critic final review, exact v2: PROCEED.


## Implementation checkpoint — 2026-10-17

Implementerat enligt exakt plan v2. `resolveDogAgePeriod` är en ren resolver med tio redaktionella perioder; den använder redan etablerad date-only-validering, fulla veckor och klämda kalendermånader. Befintliga åldershelpers och deras konsumenter har inte ändrats. Den befintliga profilredigeringssuiten körs som regression; inget identitetsbevarande mellan periodskiften eller någon persistens verifieras här. README beskriver anropet och den provisoriska, icke-medicinska etiketten.

Verifierat före oberoende QA: fokuserad resolver/profilsvit **36/36 PASS**; `pnpm check` (**typecheck, edge typecheck, lint och 574/574 tester PASS**). Node visar befintlig `MODULE_TYPELESS_PACKAGE_JSON`-varning i projektets TS-testkörning; inga testfel. Month-end (31 januari) och leap-day (29 februari → 28 februari) provas explicit.

Kvar före lokal closeout: QA ska kontrollera acceptanskriterierna och dokumentationen oberoende; därefter separat Reviewer. Fortsatt NOT TESTABLE: installerad native-app, live Supabase/RLS samt Scenario C:s integration mellan periodresolver, publicerat urval och kvarvarande identitet/rutiner/historik/träningsprogress. Ingen UI ändrades och ingen UI-visual-QA krävs. Ändringarna ligger lokalt i den av ägaren begärda samlade, ännu ocommittade batchen.


## Independent QA — 2026-10-17

QA v1 first reported criterion 2 incomplete because the 8-week and literal 12-week checks lacked the day-after assertion. The approved plan already required before/on/after coverage, so implementation added only day-57 and day-85 assertions (both stay in the provisional “8–12 weeks” period until the clamped three-month date). Focused tests and the full check were rerun after this test-only correction.

Independent QA recheck: **PASS**, criteria 1–5. Focused command **36/36 PASS**; `pnpm check` **574/574 PASS** (including app/edge typecheck and lint); queue validation and diff check **PASS**. README command and non-medical limitation **PASS**. Full Scenario C integration, native app and live Supabase/RLS are **NOT TESTABLE** and remain outside/open for a later integration checkpoint. No implementation code was changed after the first QA pass. Exact report: `docs/design/evidence/vision-rev02/life-periods/R4B-PERIOD-01/INDEPENDENT-QA.md`.


## Independent Reviewer and local closeout — 2026-10-17

Reviewer **PASS** on exact plan v2. A nonblocking evidence wording note was corrected: the existing profile-edit suite is regression coverage only and does not establish identity retention across period changes or persistence. The trivial fixture-copy ID assertion was removed; focused and full checks were rerun, and Reviewer rechecked the correction and returned **PASS**.

Local checkpoint closed after Architect APPROVE, Critic PROCEED, Dog Expert PASS, independent QA criteria 1–5 PASS and Reviewer PASS. No UI, content selection, persistence, schema, RLS or backend code changed. Full MVP Scenario C (period-driven selection plus identity/routine/history/training-progress retention), installed native behavior and live Supabase/RLS remain open/NOT TESTABLE. Commit and push are deferred to the user's requested combined batch after R4–R7.

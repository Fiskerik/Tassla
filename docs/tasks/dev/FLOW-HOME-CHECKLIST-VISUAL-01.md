# FLOW-HOME-CHECKLIST-VISUAL-01 — Panel 4 visuell korrigering

Datum: 2026-10-18\
Planversion: v3\
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`\
Status: Done — oberoende QA PASS och oberoende Reviewer PASS.

## Mål

Åtgärda de konkreta Panel 4-skillnader som verifierades i `FLOW-HOME-CHECKLIST-01` v7: upprepad generell rutinikon, saknad kommande-sektion när verkliga poster finns, repetitiv `Visa`-text, otydlig gruppering och klippt Idag-flik vid 140 %. Bevara funktion och datakontrakt från de fyra godkända delcheckpointsen.

## Underlag

- `docs/design/evidence/vision-rev02/checklist/PANEL4-INTEGRATION-01/v7/SECTION14.md`
- `docs/design/evidence/vision-rev02/checklist/PANEL4-INTEGRATION-01/v7/QA-REPORT.md` och `review/REVIEW-REPORT.md`
- `docs/design/vision-rev02-screen-contracts.md`, Panel 4; `docs/design-rules.md`, §14
- `docs/plans/FLOW-HOME-CHECKLIST-VISUAL-01-ux-spec.md` v3
- Barnpaket Idag, Alla, Denna vecka och Kommande är `done`.

## Exakta skrivvägar

1. `src/features/home/DailyChecklistScreen.tsx` — sektion och radlayout.
2. `src/features/home/checklist-presentation.ts` — ren hjälpare för exakt labelnormalisering/ikonalias och veckans preview-urval; ingen dataåtkomst.
3. `src/components/ui/DailyActivityItem.tsx` — Panel 4-ikon och kompakt chevron/accessible name. Hem-varianten lämnas oförändrad.
4. `src/components/ui/Tabs.tsx` — opt-in ombrytning för Panel 4, med defaultbeteende bevarat.
5. `src/features/home/README.md`.
6. `tests/checklist-presentation.test.mjs`, `tests/daily-activity-ui.test.mjs`, `tests/ui-library-policy.test.mjs`.
7. Endast syntetiska Panel 4-scenarier: `tools/visual-check/app.tsx`, `tools/visual-check/verify.py`.
8. Plan/spec, `queue.json`, `rapport.md`, `MASTER-LOG.md` och evidens under `docs/design/evidence/vision-rev02/checklist/PANEL4-VISUAL-01/`.

## Skyddade områden och icke-mål

Ingen ändring i `ProductWorkspace`, repositories, datamodell, migrations, Supabase-query/RPC/RLS, konton, hundscope, datum-/tidszonskontrakt, rutinmutationer, träningsprogress eller routes. Ändra inte Hemmets `home`-variant, huvudnavigationen, andra `Tabs`-konsumenter, de fyra färdiga barnpaketen eller `sources/`. Skapa inte uppgifter/datum för att fylla layouten. Ingen dependency och inga nya globala tokens.

## Implementation och verifierbara regler

### Veckoförhandsvisning

- Återanvänd den befintligt sorterade `upcomingRows`, de redan separata `upcomingHealthState`/`upcomingRoutineState`, nuvarande `dateKey` och sju redan beräknade `weekDateKeys`.
- Visa sektionen endast när båda källorna är `ready` och minst en post uppfyller `dateKey < row.dateKey <= weekDateKeys[6]`. (Plan invariant: inga nya datumparsers eller timezone-regler.)
- Behåll befintlig sorteringsordning; visa första tre. `Visa alla kommande` visas endast om fler än tre matchar och aktiverar befintlig Kommande-flik.
- Källornas loading/error eller båda tomma ger ingen preview. Fulla Kommande-fliken behåller respektive loading/error/retry. Kommande utanför veckan syns bara där.

### Rutinikoner och radhandling

- `checklist-presentation.ts` använder endast `trim` + Unicode NFC + svensk gemenform + kollaps av inre whitespace. Ingen diakritikborttagning eller fuzzy match.
- Exakt vitlista: `kiss`, `kissa`, `kisspaus` → `pee`; `bajs`, `bajsa` → `poop`; `mat`, `äta`, `mata`, `måltid` → `food`; `sömn`, `sova`, `vila` → `sleep`; `promenad`, `gå ut` → `walk`; `vatten`, `dricka` → `water`. `kissrunda`, `matskål`, `sov gott`, tom sträng och okänd text returnerar neutral kategori.
- Neutral kategori visas med befintlig diskret yta och checklistesymbol, inte en fotstegsikon eller annan gissad betydelse. Exakt ikon är dekorativ/dold för hjälpmedel eftersom knapp-/radtext bär betydelsen.
- `Visa` ersätts av chevron. Rutinöppningens accessibility label säger `Hantera rutin <rutinLabel>, punkt <label>`; krysskontrollens checked/status-namn och minst 44 pt mål är oförändrade.

### Gruppering och segment

- Lägg dagens rader på en sammanhängande varm kortyta med diskreta avdelare; lägg verklig veckoförhandsvisning i separat sektion. Använd befintliga `tokens.colors.home.card`, `tokens.colors.border`, `tokens.radius` och `tokens.spacing`-värden. Inga individuellt inramade upprepade rader och inga globala ändringar.
- `Tabs` får en opt-in Panel 4-prop. Enradslayouten vid normal storlek behålls. Vid behov ombryts de fyra segmenten till hela, minst 44×44 pt kontroller. Alla labels ska vara fullt synliga och touch-/keyboard-aktiverbara; `accessibilityState.selected` ska följa aktiven flik.
- Normalstorleksbilder ska visa fortsatt en rad. Befintliga andra `Tabs`-konsumenter jämförs och förblir visuellt oförändrade.

## Acceptans

1. Dagens aktivitetsmängd, progress, rutinbock, pending/failure/unknown/retry, manager och exakt publicerat träningssteg är oförändrade.
2. Pure helper tester styrker att strikta datumgränser inkluderar söndag `weekDateKeys[6]`, exkluderar idag och nästa måndagsdatum, behåller stabil sortering, begränsar till tre och flaggar länken endast när en fjärde verklig post finns.
3. Panel 4 browser-scenario visar preview bara på Idag; kontrollerar date/ordering/cap/link, saknad preview på övriga segment, två tomma källor samt varje hälso-/rutinkälla separat i loading och error. Kommande-tabben behåller korrekt fel/partial/retry.
4. Ikontest verifierar varje tillåtet alias, case/trim/NFC/whitespace-normalisering samt negativa närträffar; okänd etikett ger neutral rutinikon. Hjälpmedel får inte annonsera samma ikonbetydelse dubbelt.
5. Synlig chevron bevarar rätt handling och minst 44 pt target; rutinens text/accessible name anger vilken mall och punkt som öppnas; kryss är fortsatt separat.
6. Tabkontroller testas vid normalstorlek och 140 %: fulla labels, valt state, fokusordning, Enter/Space-aktivering och minst 44×44 pt; alla andra Tabs-konsumenter behåller nuvarande layout.
7. Dagslistan och förhandsvisning använder befintliga varma/surface-/divider-token. Public/review jämförs vid 375×844, 430×844, 375×667 och 375×844/140 %. Full tillämplig §14-checklista 1–18 motiveras; punkt 16 delar upp sex kriterier. Hem-detaljroute och fjärde segment redovisas som kvarstående avvikelse.
8. Riktade tester, `pnpm check`, visual verifier, `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate`, `git diff --check`, oberoende QA och Reviewer passerar. Live Supabase/RLS och native VoiceOver/device Dynamic Type är NOT TESTABLE.

## Implementation checkpoint

Efter v3 Architect APPROVE och Critic PROCEED uppdaterades endast den godkända policytest-assertionen. Den rena public/review-körningen hittade sedan att RN Web inte renderade `accessibilityState.selected` som `aria-selected` och att Space inte aktiverade en `tab`-roll. `Tabs` sätter nu explicit `aria-selected` och hanterar Space utan sidscroll; Enter använder Pressables befintliga aktivering. Regressionen finns i `tests/daily-activity-ui.test.mjs`. Scope och datakontrakt är oförändrade.

Fokuserad svit passerar 24/24, full `pnpm check` passerar 587/587, public och review passerar 9/9 vardera med `pageErrors=[]`; Python syntax, queue validation och diffcheck passerar. Public/review-bilder, resultat, jämförelse mot referensen och full §14-matris är sparade under `PANEL4-VISUAL-01/`. Full visuell rev02-likhet påstås inte; kvarstående skillnader finns i §14.

## Kontroller och evidens

- `node --experimental-strip-types --test tests/checklist-presentation.test.mjs tests/daily-activity-ui.test.mjs tests/ui-library-policy.test.mjs`
- `pnpm check`
- Nytt syntetiskt `TASSLA_UI_SCOPE=panel4-visual` i public/review för preview states och 375×844/430×844/375×667; komplettera `r3c-upcoming` vid 140 %.
- `python -m py_compile tools/visual-check/verify.py`
- `python tools/dev_flow.py validate`
- `git diff --check`
- Manifests, screenshots, full §14-matris och QA/Reviewer-rapporter i `docs/design/evidence/vision-rev02/checklist/PANEL4-VISUAL-01/`.

## Grindar och checkpoint

- Före implementation: Architect APPROVE + Critic PROCEED för exakt v3. Ändras scope krävs omgranskning. Ingen Security-grind så länge read-only datakällor, behörigheter och API-kontrakt inte ändras; en sådan avvikelse stoppar arbetet.
- Efter implementation: först oberoende QA, sedan oberoende Reviewer. Visuell CHANGES betyder `blocked`, även om funktions- och kodtester passerar.
- Parent `FLOW-HOME-CHECKLIST-01` förblir blocked tills visuella fynd verifierats stängda eller uttryckligen accepterats som avvikelser.

## Reviewhistorik

- v1 — Architect CHANGES: synka skrivvägar/hjälparfil, lägg till browser-scenario som täcker preview/data states, specificera ikonklassning och negativfall, SR/keyboard/touch acceptance samt full §14 1–18.
- v1 — Critic final CHANGES: samma två scope-/visualiseringsluckor; inga data-/barnpaketskonflikter. En tidigare kort preliminär PROCEED ersattes av denna finala bedömning.
- v2 — Architect APPROVE: exakta skrivvägar, preview-gränser/tillstånd, ikonalias och negativa fall, accessibility, opt-in flikradbrytning samt full §14-matris godkända.
- v2 — Critic PROCEED: task, UX-spec och kö synkade; mätbara visuella krav och avgränsning godkända.
- v3 — Architect APPROVE: den enda tillagda skrivvägen är policytestets assertion för den redan godkända accessibility-labeln.
- v3 — Critic PROCEED: plan/spec/kö är synkade; policytestet följer den avsedda tillgänglighetstexten utan produkt- eller beteendeändring.
- v3 — scopeändring under granskning: uppdatera `tests/ui-library-policy.test.mjs` så dess source-contract följer rutinradernas sanningsenliga `Hantera rutin <mall>, punkt <punkt>`-namn; produkten behåller övrig räckvidd. Ingen annan v1/v2-scopeändring.
- v3 implementation — verifieraren ledde till uttrycklig `aria-selected` på tabbraden och Space-aktivering för React Native Webs `tab`-roll; planens krav och skrivvägar var oförändrade. Fokuserad/full test och public/review-matris passerar.

- v3 independent QA — PASS (2026-10-18): §14 result and target measurement limits are accurate; public/review Panel 4 pass 9/9 each, fresh current-code R3c 140% pass 12/12 each with no page/network errors; queue validation and root diff-check pass. Independent Reviewer pending.
- v3 independent Reviewer — PASS (2026-10-18): approved scope confirmed; opt-in Tabs only, no unauthorized production/data path; §14 and visual residuals are accurately reported; public/review 9/9 and fresh R3c 140% 12/12 each, no page or blocked-network errors. See `PANEL4-VISUAL-01/REVIEW-REPORT.md`.

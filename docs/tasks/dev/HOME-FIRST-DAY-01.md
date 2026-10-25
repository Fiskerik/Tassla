# HOME-FIRST-DAY-01 — skapa och slutföra dagens första rutin

Status: `done` — v3 är lokalt verifierad, QA/Reviewer-godkänd och köstängd. Implementation `a6f352d9264889e5ad7b9c0addbc853d4d17a01b` samt dokumentations-closeout `7245fdcb8602059c5085af0a6f212e693b79b6a7` är pushade; `git ls-remote` bekräftade remote-head `7245fdc` vid push-verifieringen.

## Uppgiftskontrakt

| Fält | Värde |
|---|---|
| Bas | Branch `codex/agent-workflow-stabilization`, commit `8dded2507816af4d900346b8a7cb17c63ff6b232`; `origin/main` `0b0f99f8660a392971b5caab71c19334f771f495` är basförfader. Fortsätt på befintlig branch. |
| Mål | En användare med vald hund kan skapa en engångsrutin med två punkter från det befintliga tomdagsflödet och se den bekräftade aktiviteten direkt i Hem, Checklistor och Framsteg. |
| Mandat | `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md` §1, särskilt resan och kravet att bekräftade ändringar omedelbart syns i Hem/Checklistor/Framsteg. Bevara `docs/plans/HOME-REV02-visual-ux-spec.md` och beslutet i `docs/decisions/MASTER-LOG.md` om att Hemmets rubrik har enbart chevron till Checklistor. |
| Risk | M — ändrar ordningen på två befintliga dagslisteskrivningar och readback. Ingen ny datamodell, migration eller personuppgiftsanvändning. |
| Beroenden | `UI-COPY-CLEANUP-2026-10-24` är klar. Ingen beroendekoppling till D1/D2/D3/D5 eller `TRAINING-PROGRESSION-01`. |
| Skrivägare | Codex som ensam Implementer (standardmodell enligt `.codex/agents/implementer.toml`: gpt-6-luna, medium). QA och Reviewer är skrivskyddade. |
| Planversion | v3; v2 fick Architect APPROVE och UX Critic PROCEED. QA/Reviewer fann feedback- och testluckor. v3 delar rutin/dag-orkestreringen mellan produktionsflöde, fixture och beteendetest och utökar därför skrivvägarna med två befintliga data-/recoverymoduler. Architect APPROVE och UX Critic PROCEED för v3 är registrerade före återupptagen implementation. |

## Beslut som ska bevaras

- Använd Hemmets befintliga chevron → Checklistor → `Hantera aktiviteter` → `Skapa rutin`. Lägg inte till en knapp, introduktionskarusell eller ny navigation på Hem.
- En rutin med `repeat_unit: null` ska vara en aktivitet på skapandedagen enligt befintlig UI-hjälptext. Rutiner med upprepningsregel behåller befintlig schemaläggning via dagens beredning; ändra inte deras semantik.
- Använd befintliga `create_daily_routine_v2`, dagsradsskrivning, owner-/hund-/dagsscope och `runDailyMutation`-fel-/readback-/retryflöden. Ändra inte SQL/RLS, migrationshistorik eller annan produktfunktion.
- Hem, Checklistor och Framsteg ska fortsätta använda samma bekräftade dagsurval. Ingen optimistisk bock, poäng eller ny progressmodell.
- Ägarens Supabase-migrering är användarrapporterad. Denna uppgift skapar ingen migration; lokal syntetisk verifiering ska inte beskrivas som live Supabase/RLS-bevis.

## Ingår

- I `ProductWorkspace` låt båda befintliga rutincreate-callbacks följa två separata steg. Först bekräftas mallskapandet med `create-routine:<routineId>`. Endast efter `saved`, och endast för `repeat_unit: null`, startas dagsvalet som en separat `select-routine:<routineId>` mutation med befintlig adapter. Vänta på readback innan dagsaktiviteten visas.
- Fånga hund, dag, tidszon, dagsrad-ID och mutations-ID för dagsvalet. Ett okänt dagsval ska ha en retry-closure som bara försöker lägga till den redan skapade rutinen samma dag; den får aldrig anropa rutincreate igen. Om scope byts mellan stegen, starta inte dagsval i det nya scopet.
- Om rutinmallen sparas men dagsvalet misslyckas, ska den sparade mallen finnas kvar och dagens aktivitet inte påstås sparad. Behåll felmeddelandet för `Lägg till på Hemskärmen`; användarens befintliga manuella tillägg från rutinhallen ska fungera. Vid okänt utfall erbjuds `Kontrollera samma ändring igen` för dagsvalet utan att skapa en dublett.
- Lägg den tvåstegade orkestreringen i en delad produktionshelper i `daily-activity-data.ts`, så ProductWorkspace, RN Web-fixturen och beteendetestet kör samma sekvensering och scope-check. Särskild fel-/okändstatuscopy ska följa dagsradens befintliga retry-operation.
- Testa den befintliga UI-resan med syntetisk data: tom dag → Checklistor → hantera → skapa rutin med två punkter → bekräftad aktivitet i Hem → bocka en punkt → samma 1/2 i Checklistor och Framsteg → nästa dag visar inte engångsrutinens gamla bock som dagens.
- Spara färska relevanta renders och ifylld designregelchecklista §14 i den angivna evidenskatalogen. Jämför Home-kompositionen mot rev02; ingen layoutändring är avsedd.
- Uppdatera Hem-guiden, taskrapport och Master-logg med faktiskt beteende, testbevis och overifierade gränser.

## Ingår inte

- Ändring av Home-rubrikens chevron eller synlighets-/layoutregler, onboarding/hundval, dagsplanering för träningssteg, fler upprepningsalternativ eller andra checklistobjekt.
- Ändring i schema, migration, RPC-kontrakt, RLS/grants, service, auth, innehåll, träningsprogress, poäng, notifieringar eller beroenden.
- Verifiering med verkliga användaruppgifter, produktion, signerad/native build eller påstående om att Supabase/RLS är verifierat.
- Stängning av hela P1/panel 1 eller senare delar av användarplanen.

## Relevanta läsunderlag

- `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md` §1.
- `docs/plans/HOME-REV02-visual-ux-spec.md` §§1–2 och tomdags-/hanteringsregler.
- `docs/design-rules.md` §§0–4 och 14; `docs/design/vision-rev02-screen-contracts.md` panel 1.
- `docs/decisions/MASTER-LOG.md` beslutet om Home-chevron och Checklistor.
- `docs/dev/workflow.md`, `docs/tasks/template.md`, `src/features/home/README.md`.
- `src/features/home/ProductWorkspace.tsx`, `src/features/home/daily-activity-data.ts`, `src/features/home/DailyActivityManagerSheet.tsx`, `src/features/home/DailyChecklistScreen.tsx`.
- `src/features/home/daily-activity-recovery.ts` för owner-scopead dagsmutation och exakt okänd-statusretry.
- `tests/daily-activity-data.test.mjs`, `tests/daily-activity-ui.test.mjs`, `tools/visual-check/app.tsx`, `tools/visual-check/verify-vision-r02-home-panels.py`.

## Write paths

```text
src/features/home/ProductWorkspace.tsx
src/features/home/daily-activity-data.ts
src/features/home/daily-activity-recovery.ts
src/features/home/README.md
tests/daily-activity-data.test.mjs
tests/daily-activity-ui.test.mjs
tests/home-first-day.test.mjs
tools/visual-check/app.tsx
tools/visual-check/verify-vision-r02-home-panels.py
docs/design/evidence/home-first-day-2026-10-24/
docs/tasks/dev/HOME-FIRST-DAY-01.md
docs/tasks/dev/queue.json
docs/tasks/dev/rapport.md
docs/decisions/MASTER-LOG.md
```

## Acceptanskriterier och bevis

| Kriterium | Bevis / kontroll | Status |
|---|---|---|
| En tom dagslista nås via den befintliga Home-chevronen; användaren öppnar befintlig manager och skapar en engångsrutin med två punkter. | Riktad Playwright-resa i `verify-vision-r02-home-panels.py`; tomdagsbilder vid 375/430 px och 7/7 resultat i evidenskatalogen. | PASS lokalt med syntetisk fixture |
| Endast bekräftat skapande följt av bekräftad dagsrad ger aktiviteten på Hem; den visas en gång och utan manuell uppdatering. | Beteendetest av delad produktionshelper och Playwright-resa; Home/Checklistor/Framsteg visar samma 1/2. | PASS lokalt med syntetisk fixture |
| Om dagsvalet misslyckas efter sparad mall visas inte dagsaktiviteten som bekräftad; mallen och befintlig manuell tilläggsväg finns kvar. Okänd-status retry återanvänder exakt dagsrad och mutations-ID och försöker inte skapa rutinmallen igen. | Saved/failed/unknown, antal create-anrop, stabilt dagsrad-/mutations-ID, scopebyte och synlig manuell recovery täcks i riktade tester och render. | PASS lokalt med syntetisk fixture |
| En bock på Hem visas med samma 1/2 i Checklistor och Framsteg; efter fixture-dagbyte visas inte engångsrutinens gamla completion som dagens. | Riktad Playwright-resa, faktisk delad dagskälla och scope-/sekvenseringstest. | PASS lokalt med syntetisk fixture |
| Home-headerns utseende och navigation följer bevarat beslut; färsk Home-render är jämförd med rev02 och §14 är ifylld. | Inga Home-layoutfiler ändrades; chevron-/ruttkontroller och render vid 375×844/430×844. §14 och sida-vid-sida-jämförelse finns i `docs/design/evidence/home-first-day-2026-10-24/VERIFICATION.md`. | PASS för bevarad task-scope/navigation. §14.16 säger uttryckligen att full panelmatch mot rev02 är Nej och kvarstår utanför denna avgränsade implementation. |
| Ändringen håller sig till godkända paths och repot passerar föreskrivna lokala kontroller. | Faktiskt: `pnpm check` (81/81), `pnpm bundle:ios` (1586 moduler), första-dagsresa 7/7, legacy public Home 52/52, public Progress 2/2, review 72/74 (två gamla Home-marginalassertioner), py_compile, `git diff --check`, `python -X utf8 tools/dev_flow.py validate`. | PASS för lokal kod; live/native är separat NOT TESTABLE |

Live Supabase/RLS, native VoiceOver/Dynamic Type och signerad build redovisas separat som PASS endast med faktiskt bevis, annars `NOT TESTABLE`. De ersätts inte av syntetiska fixtures.

## Granskning och checkpoint

- Architect: APPROVE för v1 och v2. V2 bekräftar att separerat dagsval behåller samma hund, dag, tidszon, dagsrad-ID och mutation-ID; retry återspelar inte rutincreate.
- UX Critic: PROCEED WITH CHANGES för v1; v2 åtgärdar invändningen med separat status för sparad rutin och okänt/misslyckat dagsval. Ny v2-review: PROCEED.
- QA checkpoint 1: BLOCK; behavior test för scopebyte och §14-evidens saknades. V3 lade till båda och QA:s förnyade kod/evidensgranskning PASS.
- Reviewer checkpoint 1: BLOCK; dagsvalsfelet visade generisk, missvisande text och fixture testade en duplicerad implementation. Delad produktionshelper och specifik recovery-copy har därefter lagts till; förnyad frozen Reviewer återstår.
- Architect v3: APPROVE. Delad helper i `daily-activity-data.ts` och feedback i `daily-activity-recovery.ts` bevarar retry-/scopekontrakt och ligger inom taskens mandat.
- UX Critic v3: PROCEED. Delad helper synkar produktion och fixture; stage-specific copy/day-only retry stänger partial-save-förvirringen.
- Implementering v3: delad `createRoutineAndSelectForToday` körs av produktionsflöde, RN Web-fixture och beteendetest. Testerna verifierar separata saved/failed/unknown-resultat, scopebyte medan create pågår och korrekt stage-specific recovery-copy/retry-intent.
- Faktisk lokal kontroll: `pnpm check` PASS (TypeScript, edge-TypeScript, lint, 81/81 testfiler); `pnpm bundle:ios` PASS (1586 JS-moduler); första-dags RN Web 7/7; legacy public Home 52/52; Progress public 2/2; review 72/74 med de två dokumenterade äldre Home-marginalassertionerna; diffcheck, py_compile och kövalidering PASS.
- §14 och färsk jämförelse finns i evidenskatalogen. Layouten ändrades inte enligt mandatet; befintlig avvikelse för full Home-panelmatch mot rev02 markeras öppet som Nej. Live Supabase/RLS/readback, signerad build och native VoiceOver/Dynamic Type/reducerad rörelse är NOT TESTABLE.
- QA checkpoint 2: PASS för kod, beteende, tester, render/evidens, write-path-scope och dokumentation. QA bekräftade att den öppna §14.16-panelavvikelsen inte blockerar denna avgränsade, layoutbevarande task; den är inte full rev02-panelacceptans.
- Reviewer checkpoint 2: PASS på slutlig v3-diff efter QA; inga kvarvarande blockerande kod-, kontrakts-, test-, scope- eller dokumentationsfynd. Reviewern verifierade även att live Supabase/RLS/native begränsningar anges korrekt.
- Hook-verifierad implementation-checkpoint: commit `a6f352d9264889e5ad7b9c0addbc853d4d17a01b` (`fix: create routines on the current day`); pre-commit `pnpm check` PASS.
- Hook-verifierad dokumentations-closeout: commit `7245fdcb8602059c5085af0a6f212e693b79b6a7` (`docs: close out first-day task checkpoint`) pushad tillsammans med implementationen. Push-hook `pnpm check` PASS (736 tester PASS, 1 skip).
- Köövergång `review → done`: Reviewer PASS registrerad med implementation commit `a6f352d9264889e5ad7b9c0addbc853d4d17a01b` och faktiska kontroller. Tasken är stängd som lokal checkpoint.
- Nästa steg vid stängning var actionplanens paket 2-inventering. Inventeringen finns i [användarplanen](../../plans/UI-UX-ANVANDARPLAN-2026-10-24.md#2-kunskap-som-hjälper-mig-att-göra-något) och [innehållsstatusen](../../content/README.md#aktuell-täckning-för-kunskap-och-träning--2026-10-24); D3-plan v5 fick Architect APPROVE, Security PASS, docs QA PASS och Reviewer PASS. Erik godkände schema-/mappingförslaget 2026-10-24. Implementationstask v5 har Architect APPROVE, Security PASS, Critic PROCEED, oberoende QA PASS och Reviewer PASS utan fynd, och är stängd som lokal schema-only task på samma branch. Commit `240362753b4deec30766b3c3b8226a6c40975748` är pushad. Catalog-, foundation-, icon-, puppy-checklist- och training-progression-proberna passerar i disposable PostgreSQL; `pnpm check` passerar 81/81. Ingen publicering eller live migration antas.

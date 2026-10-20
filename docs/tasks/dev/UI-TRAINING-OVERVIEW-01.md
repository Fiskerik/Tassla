# UI-TRAINING-OVERVIEW-01 — träningsöversikt och programresa

Plan v3.1 — 2026-10-19. Mandat: Eriks uttryckliga begäran att implementera `C:\Users\erika\Downloads\tassla-traning-redesign.patch` på samma branch. Patchen tillämpar rent mot aktuell commit. Den ersätter rev02-panelens segmenterade Rekommenderat/Alla/Mina-komposition med en enda nästa-övning och en statusordnad programlista. Det är ett avsiktligt visuellt/IA-undantag som ägaren själv har beställt; det innebär inte att hela Träningspanelen visuellt godkänns mot rev02. Planändringen från v3 är endast tillägg av `docs/releases/HISTORY-2026.md` för obligatorisk paketlogg vid avslut; ingen kod, användarresa eller acceptans ändras.

## Mål och avgränsning

Gör nästa tillåtna övning tydlig från träningsöversikten. Ägaren ska kunna öppna ett publicerat program, förstå vilka övningar som är klara/aktuella/kommande, öppna en övning eller programmets källor och återvända till översikten. Bevara samma publicerade, versionsbundna program och befintlig bekräftad progress.

Ingen ändring av datamodell, queries, persistens, hund-/kontoscope, routes, träningsråd, content-publicering eller dependencies. Ingen ändring av lokal preview-skärmen `TrainingScreen.tsx`.

## Avvikelse från Panel 6

ID: `DEV-UI-TRAINING-OVERVIEW-01`. Panel/objekt: Träning, huvudöversiktens tabs/rekommendationskort/fortsättkort. Orsak och ägarbeslut: Erik bad uttryckligen att implementera den bifogade träningsredesignpatchen 2026-10-18. Påverkan: informationsarkitekturen och första-vy-kompositionen avviker från befintligt Panel 6-kontrakt. Beslut: den uttryckligen beställda patchriktningen används endast i denna avgränsade skärm; full panelvisuell acceptans hävdas inte. Åtgärd/ansvarig: implementer och QA dokumenterar resultatet och kvarvarande panelavvikelse här samt i evidensen.

## UX-kontrakt

- En `Nästa övning`-yta öppnar samma först ofullbordade steg som detaljflödet tillåter. Avslutsläget ”Alla övningar är genomförda” visas endast om minst ett program har steg och varje listat program har steg som alla är klara. Tomt programurval och program utan steg får egna ärliga lägen, aldrig etiketten ”Alla övningar är genomförda”.
- `Era program` listar samtliga redan inlästa publicerade program, sorterade stabilt: pågående, ej påbörjade, klara. Status och progress räknas bara från steg-ID:n i aktuell version; okända/stale ID:n ignoreras.
- Programkort öppnar en detaljvy. Där är nästa ofullbordade steg visuellt tydligt; tidigare/kommande steg förblir åtkomliga för läsning, men befintlig spärr för att slutföra steg i ordning behålls.
- Programtext, källor, AI-ursprungsetikett, pausad historik, retry/toasts, success-feedback, återställningsbekräftelse, avmarkering och review-gating/lokal review-progress bevaras.
- Vid okänd ålder visas befintlig förklaring och sparade program förblir åtkomliga. Tom programlista skiljs från alla program klara.
- Programvyns lokala öppna/stäng-state ersätter tabs; ingen progress skrivs vid navigering. Nästa, klar och kommande övning särskiljs i synlig text/tillgänglig semantik, inte bara färg.

## Berörda filer

Kod: `src/features/training/PublishedTrainingScreen.tsx`, ny `src/features/training/training-overview.ts`, uppdaterad `src/features/training/README.md`. Tester: ny `tests/training-overview.test.mjs`. Dokumentation/evidens: `docs/tasks/dev/UI-TRAINING-OVERVIEW-01.md`, `docs/plans/UI-TRAINING-OVERVIEW-01-ux-spec.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md`, `docs/releases/HISTORY-2026.md`, `docs/design/evidence/ui-training-overview-2026-10-18/VERIFICATION.md`.

Skyddat: `ProductWorkspace`, selectors/loaders, `TrainingScreen.tsx`, schema/SQL, nav, progress-RPCs, alla övriga skärmar och innehåll.

## Acceptans

1. Overview reaches the next incomplete exercise, program list and each program/source detail from the same fetched version set.
2. Empty fetched list, all programs complete, and one/more programs with zero steps are separate truthful states; zero-step programs are never described as complete. “Alla övningar är genomförda” requires at least one step-bearing program and every listed program to contain steps that are all complete. Sorting is stable within status groups. Status, count, percentage and reset-button visibility all use only IDs in the current version; stale-only IDs show 0 progress and no reset action. Empty/all-complete states and singular/plural counts follow pure helper behavior without mutating inputs.
3. The current exercise is identified as “Nästa övning” (or equivalent) in text/accessibility; completed and upcoming exercises are distinguishable without color alone.
4. Only the existing next-step action may persist completion; update/readback, retry/unknown behavior, unmark and reset confirmation remain unchanged.
5. Public and review views retain their respective data gates; review completion/reset remains local and visibly identified.
6. README documents purpose, data flow, progress semantics and how to verify.
7. Required screenshot review compares the real shared screen at 375×844, 430×844, 375×667 and 140% browser zoom against the requested direction and records design-rules §14 evidence. Full match to the superseded tab/card composition is not claimed. If render/capture/comparison is unavailable, QA stays blocked (never PASS/`done`) and no completion commit/push is made.

## Risk, roles and checks

Risk **M**: changes the user journey and progress presentation; no persistence or data semantics are intended to change. Architect reviews this exact plan before code; Critic reviews UX direction. No Security/Dog Expert/Compliance review is indicated because there is no auth/data/model/content change. After implementation, independent QA checks acceptance/error-preservation and visual evidence; independent Reviewer checks final diff and real APIs.

- `node --experimental-strip-types --test tests/training-overview.test.mjs`
- `CI=1 pnpm check`
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`
- `git diff --check`
- `PYTHONUTF8=1 python tools/dev_flow.py validate`
- Required visual command: build public and review RN Web fixtures with `TASSLA_UI_TOOLS=<installed tools path>`, `TASSLA_UI_OUTPUT=<output path>`, and `TASSLA_UI_REVIEW=false|true node tools/visual-check/build.cjs`; serve the output locally and capture the production screen with the installed Chrome/Playwright at 375×844, 430×844, 375×667 and 140% browser zoom. Save images, commands, §14 assessment and comparison notes under `docs/design/evidence/ui-training-overview-2026-10-18/`. Include overview, opened program/current exercise, unknown age, empty, all-complete, zero-step, error and review states to the extent supported by the production fixture. Visual rendering/comparison is a required M-risk gate: if the renderer/capture fails, leave the task blocked and do not mark PASS/done or commit/push it as complete.

After PASS, save review/QA evidence, run the repo commit/push hooks, commit and push this checkpoint to the current branch `codex/tassla-ui-ux-bundle-2026-10-18`.

## Planreview v3

- Architect: **APPROVE**, 2026-10-18. Granskade den exakta planen v3, befintliga versionerade loaders och delade `AppBar`/`Card`/`Progress`-API:er. Inga tekniska eller scopespärrar återstår.
- UX Critic: **PROCEED**, 2026-10-18. Bekräftade giltiga ID:n för all progress/återställning, stabil sortering, textuella tillstånd, separata tom-/nollstegs-/klara lägen och krav på renderbevis. Ägarbeställd Panel 6-avvikelse är avgränsad och full visuell acceptans hävdas inte.
- Ägarmandat: Eriks uttryckliga begäran 2026-10-18 att implementera bifogad `tassla-traning-redesign.patch` på samma branch.

## Planreview v3.1 — dokumentationsväg för paketavslut

- Arkitekt: **APPROVE**, 2026-10-19. Granskade exakt v3.1. Tillägget av `docs/releases/HISTORY-2026.md` följer obligatorisk sluthistorik och ändrar inte kodscope, UX, risk eller acceptans. Den tekniska v3-granskningen gäller fortsatt för oförändrad plan; denna review godkänner den exakta dokumentationsutökningen.
- UX Critic: **PROCEED**, 2026-10-19. Bekräftar att endast slutloggen tillkommer; UX-, scope- och acceptansgranskning v3 gäller oförändrad.

## Implementation, QA och slutkontroller

2026-10-19: implementationen använder den statusordnade programlistan, aktuell versions progress-helper och programdetaljen i samma skärm. Städgranskning tog bort oanvända imports/stilar; en språkgranskning korrigerade singularn till `1 av 1 övning klar`. Inga routes, loaders, queries, persistens, datamodell eller beroenden ändrades.

Kontroller efter sista kodändring: `node --experimental-strip-types --test tests/training-overview.test.mjs` 13/13 PASS; `CI=1 pnpm check` typecheck/lint och 542/542 PASS; `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` PASS (1446 iOS JS-moduler exporterade); `git diff --check` och kövalidering PASS. Public/review RN Web-skärmbilder och §14-bedömning finns i [VERIFICATION.md](../../design/evidence/ui-training-overview-2026-10-18/VERIFICATION.md). Första QA-passet blockerade innan evidensfil och publik programdetalj fanns; efter komplettering gav oberoende QA **PASS** för avgränsad lokal acceptans och körde om helper-testet 13/13 efter språkfixen. QA bekräftade current-version-ID:n, stabil sortering, skilda tom-/nollstegs-/all-complete-villkor, guarded completion, review-lokal progress och renderbevis.

Gränser: fixture-data är syntetisk; Supabase/RLS och verklig publicering ej verifierade. Nollstegs- och tränings-loading/pending/failure-state saknar renderfixture; nollstegsregeln täcks av riktat test. Native VoiceOver, Dynamic Type, reduced motion, safe area och telefonprov ej verifierade. Vid 140% web zoom radbryts `Kunskap` i befintlig bottenmeny utan horisontell overflow. Panel 6-avvikelsen är ägarbeställd och avgränsad; full rev02-visuell panelacceptans hävdas inte. Oberoende Reviewer gav slutlig **PASS** för den begränsade lokala omfattningen: slutdiff/status, API-/progresskontrakt och evidens är godkända. Live Supabase/RLS samt native tillgänglighet/enhetsbeteende är **NOT TESTABLE**. Full Panel 6-rev02-visuell acceptans hävdas inte; kompositionsavvikelsen var ägarbeställd. Implementationscheckpoint `b59169c` är pushad till `origin/`codex/tassla-ui-ux-bundle-2026-10-18. En separat dokumentationscommit registrerar den slutliga releasehistoriken och stängda köposten.

# FLOW-HOME-CHECKLIST-01 — Panel 4 integration closeout

Datum: 2026-10-18\
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`\
Planversion: v7\
Mandat: MVP v2 implementation ordered by Erik on 2026-10-06; UI/UX revamp continuation explicitly authorized.

## Mål

Verifiera och stäng den samlade Panel 4-resan efter de fyra redan godkända delcheckpointsen. Den här uppgiften är integration och evidenssammanställning; den ändrar inte beteende, dataåtkomst eller produktionskod. Om en kontroll visar en produktionsbrist stoppas denna plan och en separat korrigeringsplan tas fram före kodändring.

## Underlag och exakt scope

- MVP: `docs/mvp.md` Rev02-panel 4 och `docs/MVP-EXPERIENCE-CONTRACT.md`.
- Skärmkontrakt: `docs/design/vision-rev02-screen-contracts.md` Panel 4.
- UI-regler: `docs/design-rules.md`, inklusive §14 och separata visuella/tekniska evidensslag.
- Exakta implementationer som integreras: `FLOW-HOME-CHECKLIST-IDAG-01`, `FLOW-HOME-CHECKLIST-ALL-01`, `FLOW-HOME-CHECKLIST-WEEK-01` och `FLOW-HOME-CHECKLIST-UPCOMING-01`.
- Integrationskörningen beror även på `FLOW-HOME-CHECKLIST-ALL-VERIFY-01`, nu done med v2 Architect APPROVE, Critic PROCEED, oberoende QA PASS och Reviewer PASS. Efter expiry/refresh stängs managerarket, försenad radering ger noll skrivningar och en refresh, och Morgonrutin finns kvar i Alla. Inga app- eller fixturetillstånd ändrades.
- Före integrationen synkas endast föråldrade test_evidence/evidence_status/implementation_state-fälten för den redan done `FLOW-HOME-CHECKLIST-UPCOMING-01` i queue.json. Bevara tidigare v7/v10 pending-notiser som historik och lägg till den dokumenterade slutliga v10 Reviewer PASS-statusen; ändra inte taskens status eller dess produktfiler.
- Ingen ny persistens, query, RPC, RLS, dependency, datamodell, användartext eller navigationsregel ingår.

## Användarresa och acceptans

1. Hem visar en beständig ingång till dagens fullständiga checklista även vid tomt, laddande, felaktigt eller större innehåll; bekräftad total och status för okända källor är sanningsenliga.
2. Checklistan håller samma hund-, konto-, dags- och tidszonscope som Hem. Tillbaka återställer Hem; träning och rutinhantering återgår till samma checklistdatum och position.
3. Idag, Denna vecka, Alla och Kommande använder redan implementerade urval: vald dag, veckans sparade dagskopior, alla hundens sparade rutinmallar och verkliga framtida hälso-/rutinposter. Synligt datum och veckans gränser är begripliga för användaren. Ingen vy skapar historiska/framtida dagsrader eller hittar på träningsprogress.
4. Rutiner kan hanteras via befintliga mutationsvägar. Gränssnittet skiljer mellan väntande, misslyckad och obekräftad åtgärd; misslyckat och obekräftat läge har lämplig återhämtning/ny kontroll, och samma ändring kan inte skickas igen innan föregående utfall har klarlagts. Inget av lägena visas som bekräftad progress eller sparad ändring. Träningsraden öppnar endast exakt aktuell publicerad källversion och steg, annars förblir den ej handlingsbar.
5. Alla fyra delcheckpoints har status `done`, aktuellt oberoende reviewbesked och länkad public/review-evidens. Köbeviset för Upcoming synkas med final Reviewer v10 PASS utan att historik eller taskstatus ändras.
6. En ny §14-bedömning görs sida vid sida med repo-roten `vision_rev02.jpg` och nya 375×844 Panel 4 renders i public/review. Punkt 16 bedöms separat för komposition, färgfördelning, typografi, komponentformer, bildspråk och innehållstäthet. Bedöm resten av tillämpliga punkter 1–18 Ja/Nej/Ej tillämpligt med motivering. Saknas en direkt målbild för ett särskilt filterläge markeras just det delkriteriet `NOT TESTABLE`; Idag jämförs mot Panel 4-referensen. Spara checklistan och jämförelseunderlaget under `PANEL4-INTEGRATION-01/v7/`.

## Risk och granskningsroller

Riskklass M: integrationen följer befintliga dags-, konto- och hundscopes men verifierar en sammanhängande läs-/navigationsresa. Architect granskar denna exakta plan före körning; Critic granskar begriplighet och accepterade tillstånd. Ingen separat Security-granskning behövs eftersom planen uttryckligen inte ändrar kod, queries, ägarskap, persistens eller datakontrakt. Om testet visar en data-/scopeavvikelse pausas arbetet och relevant Security-review krävs för en ny plan.

## Skrivvägar

- `docs/tasks/dev/FLOW-HOME-CHECKLIST-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/checklist/PANEL4-INTEGRATION-01/`

Produktionskod, befintliga test-/visual-fixturefiler och de fyra undercheckpointsens evidensmappar är skrivskyddade i denna uppgift. Browserutdata sparas endast i den nya integrationsevidensmappen.

## Kontroller

- `node --experimental-strip-types --test tests/main-navigation.test.mjs tests/daily-activity-model.test.mjs tests/daily-activity-data.test.mjs tests/daily-activity-ui.test.mjs tests/workspace-data.test.mjs`
- `pnpm check`
- Synka Upcoming-köpostens test_evidence, evidence_status och implementation_state med dess dokumenterade final Reviewer v10 PASS. Behåll de äldre pending-punkterna uttryckligen som historik; ändra inte taskstatus eller andra done-taskars data.
- Kör befintliga syntetiska RN Web-scope `home-checklist`, `checklist-all`, `checklist-week` och `r3c-upcoming` separat för `public` och `review`, med kommandon och fixturebegränsningar enligt `tools/visual-check/README.md`. Kontrollera datum/veckogränser samt väntande/fel/obekräftat med återhämtning och dubbeltrycksspärr. Kör mot lokal loopback; spara manifests och bilder under `PANEL4-INTEGRATION-01/v7/{public,review}/`.
- Skapa ett jämförelseunderlag med Panel 4 från `vision_rev02.jpg` och nya Idag-renders i samma skala. Fyll i hela designregelverkets §14-checklista (1–18), och bedöm punkt 16 separat för komposition, färger, typografi, komponentformer, bildspråk och innehållstäthet. Endast saknade mål för specifika filter-/veckolägen får markeras `NOT TESTABLE`; notera separat native/device-begränsningar.
- `python -m py_compile tools/visual-check/verify.py`
- `python tools/dev_flow.py validate`
- `git diff --check`

## Planreview — v1

- Architect: **APPROVE**. Scope, dependencies, write paths and evidence are coherent; queue validation passed.
- Critic: **PROCEED** after requiring visible understandable date/week boundaries, distinct pending/failed/unconfirmed states, recovery and a duplicate-mutation guard. These conditions are included above and in the queue.
- Security: not required for this read-only integration plan; no production code, ownership, data access or persistence contract changes are permitted.

## Integrationsförsök v1 — blockerad

- Riktade tester: **PASS 56/56**.
- `pnpm check`: **PASS 581/581**, app/edge typecheck och lint godkända.
- Public `home-checklist`: **PASS**, fem befintliga browserassertioner.
- Public `checklist-all`: **BLOCKED** vid befintlig verifierarassertion för `Morgonrutin`: Playwright får två rubriker med samma namn, varav den avsedda finns i manager-regionen `Rutiner och aktiviteter`. Körningen avslutades före resterande public-scenarier och innan reviewmatrisen. Det är inte ett godkänt browserresultat.
- Inga produktions-, test- eller fixturefiler ändrades i försöket.

## Planändring v2 efter verifierarfynd

Panel 4-integrationen förblir read-only. Den nya blockerande beroendeposten `FLOW-HOME-CHECKLIST-ALL-VERIFY-01` ska först rätta och oberoende verifiera den manager-scopeade rubrikassertionen i en separat task. Efter dess `done` körs hela matrisen på nytt i public/review för samtliga fyra scopes och alla resultat sparas under den här integrationens evidensmapp. V1:s Architect/Critic-godkännanden gäller inte v2; ny exact review krävs före återstart.

Planreview v2: Architect och Critic inväntas. Ingen appkod, verifierarkod eller ny verifiering ändras/körs i parent-tasken före godkännande och innan verifierarkorrigeringens beroende är klar.

## Stoppregler och begränsningar

- Förändra inte produktionskod inom denna integrationsplan. Ett fynd blir en ny korrigeringsplan och ny review före implementation.
- Syntetiska fixtures är inte bevis för live RLS, verklig konto-/hundväxling, OS-tidszonsbyte, native app-resume eller TestFlight.
- `vision_rev02.jpg` saknar särskild vy för Denna vecka och Kommande; respektive direkt visuell likhet markeras `NOT TESTABLE`.
- Nästa steg efter planapproval: kontrollera att beroendena är klara, övergå till `ready` och `implementing`, kör verifieringarna, få oberoende QA och Reviewer, uppdatera MASTER-LOG och stäng endast om all lokalt verifierbar acceptans passerar.


## Planändring v3 efter stängd verifierarkorrigering

Panel 4-integrationen är fortsatt read-only. Beroendet FLOW-HOME-CHECKLIST-ALL-VERIFY-01 är nu done med plan v2, Architect APPROVE, Critic PROCEED, oberoende QA PASS och Reviewer PASS. Dess verifierare/assertion för försenad radering har ändrats från den felaktiga förväntan att managerarket hålls öppet till det faktiska, bekräftade slutläget: manager stängd efter expiry/refresh, Alla-listan och Morgonrutin synliga, en refresh och noll skrivningar.

Kör om hela matrisen i public/review för samtliga fyra scopes: home-checklist, checklist-all, checklist-week och checklist-upcoming. Spara all ny evidens under PANEL4-INTEGRATION-01/{public,review}/. Kör även fokuserade tester, pnpm check, py_compile, queue validation och diff-check enligt planen. Ingen production-, test-, fixture-, data- eller nätverksändring får göras inom denna plan. Om något påvisar produktionsfel stoppas parent-tasken och separat korrigeringsplan krävs. Inkludera en explicit designregel §14-bevisstatus; om vision_rev02.jpg inte finns i checkout rapporteras direkta visuella delkriterier som NOT TESTABLE, utan att återanvända äldre screenshots som bevis.

Planreview v3: Architect och Critic inväntas. Ingen ny integrationstestkörning före exakt v3-godkännande.


## Historik: planreview v3 — CHANGES

- Critic: CHANGES because Upcoming's queue evidence still said the final Reviewer v10 recheck was pending despite the done status and later final pass in the report/master log.
- Architect: CHANGES because vision_rev02.jpg exists at repository root; require a fresh side-by-side comparison and saved §14 checklist with point 16's six visual criteria evaluated separately.
- V3 findings are incorporated in v4. No integration rerun or metadata sync occurred after v1 before this exact plan review.

## Planändring v4 efter v3-granskningsfynd

Innan återstart synkas endast Upcoming-köpostens slutliga QA/Reviewer-bevis, med de äldre pending-notiserna kvar som historik. Den fulla public/review-matrisen körs om och den aktuella Panel 4 Idag-rendern jämförs sida vid sida med Panel 4-referensen från vision_rev02.jpg i samma skala. En ny §14-checklista bedömer alla tillämpliga punkter och skiljer sex visuella delkriterier i punkt 16. Vissa veck-/filterlägen saknar en direkt målbild; endast dessa särskilda jämförelser får status NOT TESTABLE.

Skrivvägarna omfattar fortfarande endast task-/queue-/rapport-/masterlogg- och evidensfiler. Produktionskod, test-/fixturefiler och färdigställda child-task-filer är skrivskyddade. Riskklass M och tidigare stoppregel kvarstår.

## Historik: planreview v4 — CHANGES / PROCEED

- Critic: **PROCEED** för v4.
- Architect: **CHANGES**. Queue-postens implementation_state säger fortfarande att Reviewer v10-rechecken väntar; inkludera detta fält i metadata-synken, behåll status done och markera äldre pending-notiser som historik.

## Planändring v5

Synken omfattar exakt tre metadatafält i den redan done Upcoming-posten: test_evidence, evidence_status och implementation_state. Sätt aktuell sammanfattning till final Reviewer v10 PASS; behåll äldre pending-rader i test_evidence men märk dem historiska, ändra inte status, plan eller produktfiler. Övrig v4-scope, inklusive den nya §14-sid-vid-sid-bedömningen, är oförändrad.

Planreview v5:
- Architect: **APPROVE** after exact-path recheck. The active plan and queue both target PANEL4-INTEGRATION-01/v5; all five dependencies are done; the three-field Upcoming sync preserves status and history; read-only scope and §14 boundaries are coherent.
- Critic: **PROCEED**, reconfirmed after the evidence path correction.
- Security: not applicable; no production, data, query or runtime changes are allowed.
- Exact plan v5 is approved. The previous v1 integration attempt remains historical evidence only; new v5 work starts with queue metadata synchronization and a fresh full matrix.


## Plan amendment v6 — correct stale verifier expectations

The v5 integration attempt is preserved under `PANEL4-INTEGRATION-01/v5/`. Focused tests stopped at 55/56 and `pnpm check` at 580/581: the remaining unit test searches for an older R3c label boundary. Public and review `checklist-week` each stop after the confirmed program reset because the harness seeks the hidden standard Home button instead of the rendered empty-advice Home card. This is a harness mismatch; no product defect is established.

Before resuming this integration, complete the separately reviewed test-only correction `FLOW-HOME-CHECKLIST-WEEK-VERIFY-01`. The current verifier's actual Upcoming scope is `r3c-upcoming`; there is no `checklist-upcoming` branch. V6 therefore runs the four actual scopes `home-checklist`, `checklist-all`, `checklist-week`, and `r3c-upcoming`, each in public and review. The review-mode `checklist-all` run passed before v5 stopped; all scopes will be rerun after the child correction.

All fresh matrix outputs, reference crops and the full §14 assessment go under `PANEL4-INTEGRATION-01/v6/{public,review}/` and `PANEL4-INTEGRATION-01/v6/`. The existing v5 evidence remains untouched. No product, test or fixture source is writable in the parent integration; its only source changes occur in the separately reviewed child task above.

### Exact plan review v6

- Architect: CHANGES. Active paths/scope were inconsistent with the amendment.
- Critic: CHANGES. Active evidence paths still pointed to v5.
- Security: not applicable; no runtime, data access or persistence changes.
- Implementation resumes only after the child verifier correction is done and this exact v6 plan is approved.


## Plan amendment v7 after exact review

V6 received CHANGES from both Architect and Critic because its inherited active acceptance and controls still pointed to v5 evidence and the unsupported checklist-upcoming scope. The active requirements above are now synchronized to PANEL4-INTEGRATION-01/v7/ and the verifier's actual Upcoming scope r3c-upcoming. References to v5 and v6 below describe historical attempts/reviews only. The active dependency summary includes FLOW-HOME-CHECKLIST-WEEK-VERIFY-01; it must reach done before this integration resumes.

The v5 test failure diagnosis is corrected: the R3c test reads verifier source with readFileSync and searches an LF start marker in a CRLF file. The end-label prefix is present. Child plan v2 normalizes line endings only for marker slicing, preserves both exact markers and all assertions, and corrects the stale Home-card locator. No product defect is established.

V7 preserves all v5 evidence and the partial v5 matrix. After the child correction is done and this exact plan is approved, rerun all four actual scopes (home-checklist, checklist-all, checklist-week, r3c-upcoming) in public/review and save fresh results under PANEL4-INTEGRATION-01/v7/{public,review}/. Save the new reference crop, side-by-side renders and complete §14 assessment under PANEL4-INTEGRATION-01/v7/. No product/test/fixture source edit is allowed within this integration plan.

### Exact plan review v7

- Architect: APPROVE.
- Critic: PROCEED.
- Security: not applicable; no runtime, data access or persistence change.
- Implementation resumes only after FLOW-HOME-CHECKLIST-WEEK-VERIFY-01 is done; exact v7 approval is recorded above.


## Dependency closure and v7 restart — 2026-10-18

`FLOW-HOME-CHECKLIST-WEEK-VERIFY-01` v2 is now done after independent QA PASS and Reviewer PASS. Its review report is saved at `docs/design/evidence/vision-rev02/checklist/WEEK-VERIFY-01/review/REVIEW-REPORT.md`. The parent can resume under the already approved exact v7 plan. The full v7 matrix and fresh §14 visual evidence have not yet been rerun; prior v5 artifacts remain historical only.


## V7 execution checkpoint — 2026-10-18

The exact approved integration plan was resumed after the week-verifier dependency reached done with independent QA and Reviewer PASS. Upcoming's three approved queue summary fields were synchronized; its status remains done and historical pending notes remain in `test_evidence`. Fresh public/review bundles were built and the complete matrix passed: Home 5/5, Alla 16/16, Denna vecka 7/7, Kommande (`r3c-upcoming`) 12/12 in each mode. All manifests have empty `pageErrors`; only R3c reports `blockedNetworkRequests: []`, because the other scopes do not instrument network blocking. Focused tests passed 56/56; `pnpm check` passed app/edge typecheck, lint, and 581/581 tests; py_compile, queue validation and diff-check passed.

Fresh reference crop, public/review side-by-side comparisons and the full §14 assessment are in `docs/design/evidence/vision-rev02/checklist/PANEL4-INTEGRATION-01/v7/`. The direct comparison records visible design deviations (including a large empty lower viewport, generic repeated footprint icons, different content/card composition, and the added fourth tab). These are functional-pass/visual-no statuses, not product behavior defects established by the synthetic matrix. Parent plan remains read-only, so no product change was made. Independent QA confirms the visual findings and the 140% clipping. Reviewer is the next gate; then stop the integration as blocked and create a separate reviewed correction plan rather than reporting Panel 4 as visually matched. Live backend/native checks remain NOT TESTABLE.


## Independent QA — CHANGES for visual closeout, 2026-10-18

QA independently reran the focused 56-test command, `pnpm check` (581/581 with typechecks and lint), and all eight public/review browser scopes: 5/16/7/12 assertions per mode. `py_compile`, queue validation, and diff-check passed. QA inspected all eight stored manifests, contact sheets for all 110 canonical screenshots, the reference crop/composites, §14 assessment, and fresh rerun screenshots. It confirms functional PASS but visual closeout CHANGES. In particular, the 140% Kommande screenshot clips the leftmost Idag label at its final “g”; Denna vecka remains fully visible; the active-tab bounds assertion does not check adjacent labels. QA noted that only R3c instruments blocked requests; the v7 README/queue claims were corrected to match. Full QA report and independent evidence are in `docs/design/evidence/vision-rev02/checklist/PANEL4-INTEGRATION-01/v7/QA-REPORT.md` and `v7/qa/`. No source files or queue status changed during QA.


## Oberoende Reviewer — PASS efter evidenskorrigering, 2026-10-18

Reviewern gjorde först CHANGES eftersom 140 %-klippet felaktigt attribuerades till Denna vecka. Efter granskad dokumentationsrättning gjorde Reviewern en snäv read-only omgranskning och gav PASS: §14 punkt 15/17, parentplanen och queue `next_step` säger nu enhetligt att vänsterfliken Idag klipps vid sista “g” och att Denna vecka är fullt synlig. QA-rapporten bevarar den ursprungliga felidentifieringen som audit history och har ett tydligt coordinator-addendum. Reviewer verifierade de 16 canonical/QA-manifesterna, skärmbildsinventering, referensjämförelser och 140 %-bilderna; inga tester kördes eller filer ändrades av Reviewern. Rapport: `docs/design/evidence/vision-rev02/checklist/PANEL4-INTEGRATION-01/v7/review/REVIEW-REPORT.md`.

Parentens lokala funktion och evidenskvalitet passerar. Panel 4 kan ändå inte markeras visuellt färdig: §14 har kvar konkreta nej för komposition, ikonvariation, färgfördelning, täthet och tabklippning. Den read-only integrationsplanen stängs därför som blockerad för en separat, granskad UI-korrigering. Fyra godkända delcheckpoints ändras inte.

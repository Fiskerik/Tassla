# FLOW-LOG-01 — gransknings- och checkpointjournal

Datum: 2026-10-20
Plan: docs/plans/FLOW-LOG-01-calendar-ux-plan.md v5
Plan v5 godkänd av Architect och UX Critic. Kodcheckpointens samlade UI-acceptans är blockerad på renderad evidens.

## Granskningar av plan v4 och v5

- **Architect — APPROVE.** V4:s occurred_at-only keysettraversering, eventual snapshot, lokal mutation/återöppningsinvalidering och att delresultat aldrig visas som komplett är genomförbara. Installerad Supabase/PostgREST-klient har gt-filter och kedjad order. Implementation ska använda oförändrad rå tidsstämpel som cursor; konvertering via Date kan tappa submillisekundprecision.
- **UX Critic — PROCEED.** Vatten behåller water-outline; Kiss får droppe över marklinje i IconChip.tsx. Gråskaleprov ska köras vid faktiska snabbvals-/chipstorlekar och normal/140 % text. Förväxlingsbar ikon eller avklippt etikett är FAIL. Övriga tillstånd, kontrast och åtkomlighet är godkända i plan.
- **Security — APPROVE före implementation, statisk och villkorad.** Befintlig authenticated client och event_read/private.owns_dog är rätt gräns; ingen ny lagring, datadelning eller persondataavsikt tillkommer. Queryn ska förbli timestamp-only och hundscopad. Keyset är korrekt för dagsmarkörer eftersom identiska tidsstämplar ger samma lokala dag; matcha sorteringsriktning med cursoroperator och deduplicera per lokal dag. Detta är inte live RLS- eller slutgranskning.

## Obligatoriskt efter implementation

- Syntetiskt dev/testprov med två separata ägare/hundscope: A läser A men inte B, B läser B men inte A, anon saknar läsrätt. Om testmiljö inte finns: NOT TESTABLE; ingen RLS-PASS.
- Tester för lokala månadens halvöppna gräns, rå cursorprecision, lika tidsstämplar vid sidgräns, mutation mellan sidor, re-fetch efter ändring före cursor, DST, fel/abort/stale scope.
- QA, Reviewer och Security final granskar den frysta implementationen. Native kontroller och helskärmsacceptans redovisas separat; NOT TESTABLE är inte PASS.

## Implementation v5 — 2026-10-20

- Implementerat svensk månadskalender i befintlig BottomSheet, tillgängliga datum/prickmarkörer, framåtdatumsspärr, loading/empty/error+retry samt aktiv hunds timestamp-only marker-query med lokala halvöppna gränser, stabil fallande keyset-traversal, full-completion-publicering och konto/hund/månad/tidszon-generation-scope.
- Bekräftad lokal mutation/undo öppnar ny markerläsning om kalendern är synlig; stängning och scopebyte avbryter läsning. App foreground kontrollerar tidszonsbyte.
- Logga-only Kiss amber och dropp/mark-symbol implementerad; global Home-token och blå `water-outline` lämnade intakta. QuickLogTile använder kontur i pressed-state. Den v5-godkända ListRow-timelineändringen visar selectedSurface i stället för opacity; andra rader behåller sin pressed-style.
- Fokuserad testsvit PASS 9/9. `pnpm check` PASS (typecheck, edge typecheck, ESLint och 592/592 tester). Public `pnpm bundle:ios` PASS med explicit public channel, 1 449 moduler. Riktad ESLint PASS utan varningar. `python -X utf8 tools/dev_flow.py validate` PASS, tasken kvar i implementing. `git diff --check` flaggar en trailing blankrad i den samtidiga plan v5-uppdateringen; koordinatorn tar bort den efter handoff och kör om kontrollen.
- Live RLS: **NOT TESTABLE** enligt miljöinventering från koordinatorn (ingen Supabase CLI/Docker eller testmiljövariabel; ingen `.env` lästes och ingen backend kontaktades). Inget RLS-PASS hävdas.
- Renderad 360/375/430-matris, pixelgråskala, faktisk AppScreen scrollbottenmarginal och native prov är ännu **NOT TESTABLE** i implementeringspasset. Fullskärmsrev02-jämförelse förblir separat öppen.
- Dokumentation: `src/features/puppy-log/README.md`, `docs/design/evidence/flow-log-01/VERIFICATION.md`, `docs/releases/FLOW-LOG-01.md`.

Nästa steg efter första handoff: QA identifierade 44 pt- och testluckor. Korrigering 1 är genomförd och omtestad; se QA-checkpoint nedan.

## Plan v5 amendment — 2026-10-20

- **Architect — APPROVE v5.** ListRow.tsx har redan variantisolerad pressed-style; endast log-timeline byter opacity mot selectedSurface. Standardrader behåller befintlig pressed-style.
- **UX Critic — PROCEED v5.** Ändringen adresserar uppmätt Vattenkontrast under 3:1 utan att tappa tydlig tryckfeedback. QA ska mäta Kiss/Vatten/Olycka mot faktisk selectedSurface och regressionskontrollera en vanlig ListRow utanför Logga.
- **Security:** v4 pre-implementation APPROVE täcker samma autentiserade hundscope och dataläsning. V5 tillför enbart lokal visuell pressed-feedback och ändrar inget data-/auth-/storage-beteende; ingen ny pre-implementation Security-grind utöver den befintliga granskningen. Slutlig Security-granskning av fryst diff krävs före merge.

## QA-korrigering 1 och checkpoint — 2026-10-20

- Oberoende QA första varvet: kod/test verifierades delvis; FAIL för kalenderdagens bredd och saknade regressioner för timestampprecision, sidgräns och lifecycle. Källinventeringen misstog först paddingvärdena; verifierad källa är BottomSheet tokens.lg=16 och kalenderkort tokens.sm=8.
- Korrigering inom oförändrad, godkänd plan v5: kalenderkortets horisontella padding är 8 pt och varje dagcell har minWidth/minHeight 44 pt. Källgeometri vid 360 pt: 360−2×16−2×8=312 pt; 312/7≈44,57 pt. Verklig renderad geometri är fortfarande NOT TESTABLE.
- Regressioner tillagda: lika timestamp vid sidgräns, rå mikrosekundcursor, AbortSignal efter requeststart, ändring äldre än aktiv cursor under traversal samt ny traversal efter en ändring före cursor. Policytest säkrar scope-generation/abort, stängning/unmount och refresh efter bekräftad mutation; workspace-lifecycle är källstrukturellt testad, inte komponentintegrerad.
- Omtestning: fokuserat 16/16, pnpm check 599/599, publik pnpm bundle:ios 1 449 moduler, git diff --check PASS (endast LF→CRLF-varningar) och queue validate PASS.
- QA retest: kod/test PASS. Paketets fulla acceptans är INTE PASS eftersom responsiv render, gråskala och faktisk AppScreen-bottenmarginal saknar renderingsverktyg/evidens. Designregelverk §14 tillåter inte visuellt PASS utan detta underlag.
- Security final: APPROVE för den statiskt granskade implementationen. Granskaren kunde inte läsa git diff i egen miljö, men granskade v5-källor och query-/scopefiler. Live tvåägar-RLS, anon-denial och native kontroller är separat NOT TESTABLE.
- Reviewer körs inte före QA-PASS enligt workflow. Taskstatus i kön: blocked; inget visuellt accepterande eller full panelstängning hävdas.

Nästa steg: skapa en uttrycklig branch-checkpoint efter installerade hookar och push enligt Eriks mandat; därefter fortsätt nästa oberoende godkända köpaket. Återuppta FLOW-LOG-01:s render-/§14-del när godkänd renderingsförmåga finns tillgänglig.
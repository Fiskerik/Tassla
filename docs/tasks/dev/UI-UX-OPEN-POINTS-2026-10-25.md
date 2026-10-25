# UI/UX-granskning av öppna punkter — 2026-10-25

- Status: implementering, verifiering, Critic, QA och Reviewer klara; native iPhone-efterkontroll återstår.
- Bas: `3f518446f27ab54c27d4807642614ed95d40199c` på `codex/ui-visual-review-loop`.
- Mandat: Eriks instruktioner 2026-10-25: fortsätt enligt senaste användarplanen, låt UI/UX Critic granska öppna punkter och rätta eller backlogga dem. De bifogade iPhone-skärmbilderna är direkt evidens för checklistans filter, kunskapsbilderna och profilens lämna-dialog.
- Skrivägare: huvudsessionen.
- Risk: L för presentations-/copyändringar. Ingen route, data, handler, nätverkskoppling, migration eller dependency ändras.
- Skyddat: innehållstaxonomi, rekommendationsurval och publicering kräver D3:s riktiga katalog/urvalsgrund. De uppfinns inte i denna task.
- Skrivvägar: `src/components/ui/Tabs.tsx`; `src/features/home/DailyChecklistScreen.tsx`; `src/features/home/ProductWorkspace.tsx`; `src/features/knowledge/KnowledgeScreen.tsx`; `src/features/knowledge/KnowledgeImage.tsx`; `src/features/knowledge/knowledge-image-layout.ts`; `src/features/knowledge/editorial-image-assignment.ts`; `src/features/knowledge/README.md`; `assets/images/README.md`; `tests/daily-activity-ui.test.mjs`; `tests/knowledge-image-layout.test.mjs`; `tests/knowledge-search-screen.test.mjs`; `tools/visual-check/verify-checklist-filters.py`; `tools/visual-check/verify-vision-r02-home-panels.py`; `docs/tasks/dev/UI-UX-OPEN-POINTS-2026-10-25.md`; `docs/tasks/UI-UX-REV02-ACTIONPLAN-2026-10-23.md`; `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md`; `docs/decisions/MASTER-LOG.md`; `docs/design/evidence/ui-g16-checklist-manage-icon-2026-10-25/README.md`; `docs/design/evidence/ui-ux-open-points-2026-10-25/`.

## Öppna punkter och acceptans

1. **Checklistans fyra filter:** visa Idag, Denna vecka, Alla och Kommande på en kompakt, horisontellt rullbar rad även på smala telefoner. Texten använder `smallCaption`; varje val behåller minst 44 pt tryckyta. Övriga segmenterade flikar behåller sitt nuvarande beteende.
2. **Kunskapsbilder:** varje artikelbild ska hålla hunden/sakmotivet synligt och placerat med avsikt i både listkort och läsvy. Behåll fullbleedsytor och bildförhållanden. Beskärningen ska använda fokuspunkt per lokal bildkälla och tillräcklig upplösning; byt inte alla bilder till `contain`.
3. **Profilens lämna-dialog:** behåll destinationstiteln och osparade-ändringar-skyddet, men använd naturlig svenska: knappen `Lämna utan att spara`; förklaringen säger att profiländringarna inte sparas och att redan sparade uppgifter påverkas inte.
4. **Checklistans hanteringsknapp:** visa endast kugghjulsikonen; behåll `Hantera rutiner och aktiviteter`, samma `openManager()`-handler och minst 44×44 pt mål.
5. **D3:** saknade ämnesfilter/rekommendationsrubrik blir kvar som innehållsbacklogg tills riktiga ämnestaggar och urvalsgrund finns. Inga dekorativa filter eller obestyrkta rekommendationer.

## Granskning och evidens

- UI/UX Critic BRIEF: den första syntetiska RN Web-renderingen rekommenderade ikonknapp och noterade D3-begränsningen. Dess slutsats att artikelmotiven redan var centrerade motsägs av de nyare iPhone-bilderna och ersätts. Post-render Critic kunde granska nya RN Web-renderingar och gav PASS för hundmotiv/fokalbeskärning i list och läsvy; den ursprungliga iPhone-filen var inte tillgänglig lokalt för agenten.
- Ägarens iPhone-skärmbilder visar checklistfilter i två rader, de svaga/off-center beskärningarna i artikelkorten samt dialogens `Kasta ändringar`. De räknas som rapporterad före-implementationsevidens, inte som en ny build.
- Efter implementation skapades RN Web-renderingar av Knowledge-lista/läsvy och Checklistor i evidensmappen. Kontrollerna verifierar layout, 44 pt-mål, scrollbarhet, bildrutors täckning och motivplacering i den lokala miljön, men ersätter inte native iPhone-readback. Saknad fysisk efterbild anges `NOT TESTABLE`.
- Post-render UI/UX Critic gav PASS för Knowledge-bildfokus, enradig filterrad och ikon-only-hantering. Profilcopy godkändes i källtexten; separat dialogrendering finns inte. Oberoende QA gav PASS. Reviewer gav PASS efter att en äldre plantext markerats som överspelad och verifierarens namn begränsats till vad assertionen faktiskt kontrollerar.

## Checkpoint

Implementerat lokalt: ikon-only-kugghjul, opt-in kompakt horisontell checklistrad, fokalbeskärning per bildkälla i både kort och läsvy, samt `Lämna utan att spara`-copy. Den föråldrade gear-assertionen uppdaterades till att skydda både textfri presentation och bevarat hjälpmedelsnamn/tryckyta. Checklistans RN Web-verifiering passerar 19/19 (375/430, 44 pt, en rad, scroll vid 140 % text); Knowledge-bilderna passerar 10/10 (375/430, kort/läsvy/fototäckning). `CI=1 pnpm check` passerar (745 tester, 1 skip); py_compile, riktade tester, typkontroll och `git diff --check` passerar. [Evidens och jämförelser](../../design/evidence/ui-ux-open-points-2026-10-25/).

Post-render Critic: PASS för Knowledge-kort/läsvy, kompakt scrollrad och ikon-only-kugghjul i RN Web; profilens ordval PASS i källtexten men den nya dialogen saknar separat renderbevis. Native iPhone-svep, efterbild, Dynamic Type och VoiceOver är `NOT TESTABLE`. Oberoende QA: PASS utan konkreta regressioner. Reviewer blockerade först på en föråldrad slutsats i användarplanen och en för stark verifierarbenämning; båda rättades och Reviewer gav slutlig PASS. Den fulla äldre `image-diversity`-körningen passerade Knowledge-kontrollerna men stannade senare vid en orelaterad Training-continuation-fixture; isolerad Knowledge-verifiering passerar 10/10. Panel 7:s filter och rekommendationsrubrik är D3-backlogg tills riktig taxonomi och urvalsgrund finns.

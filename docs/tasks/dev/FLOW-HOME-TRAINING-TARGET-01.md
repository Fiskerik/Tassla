# FLOW-HOME-TRAINING-TARGET-01 — plan v2

Datum: 2026-10-17 · Status: plan v2 implementation klar; QA PASS och Reviewer PASS för avgränsad funktion. Full Home-panelmatch enligt Rev02 §14 punkt 16 är fortsatt öppen.
Masterplan: UIUX-REVAMP-MASTERPLAN-2026-10-16, R3a.
Riskklass: M — ändrad Home → träning → returresa, utan ändrat data- eller behörighetskontrakt.

## Mål och användaruppgift

Från Hem ska ägaren kunna öppna exakt träningssteg som redan valts för dagens uppgifter och återvända till Hem. Den generella Träna-genvägen fortsätter att öppna den generella träningsvyn. Dagens checklista behåller sin exakta träningslänk och återgång till checklistan.

Primär handling: öppna en tillgänglig träningsrad under Hemmets Dagens att göra.
Synlig information: befintlig uppgiftstitel och bekräftad status.
Fördjupning: exakt publicerat programversions-id och steg-id från dagens val.
Retur: tillbaka till samma ingångsvy — Hem respektive Idag-checklistan.
Målbild: behåll Hemmets grupperade uppgiftsrad, befintliga färgroller och navigationshierarki enligt design-rules §2, §3, §9 och §14. Ingen ny rad, knapp eller teknisk statusetikett läggs till.

## Källor och nuläge

- HomeDailyActivity innehåller programId, stepId och den ursprungliga DailyTrainingSelection. deriveHomeDailyActivities härleder dessa från den hund- och datumscopeade dags-snapshoten.
- HomeScreen.tsx skickar i nuläget alla träningsrader till den generella Träning-sidan via onGo('training').
- DailyChecklistScreen skickar redan det exakta programVersionId/stepId-paret till ProductWorkspace.
- ProductWorkspace äger currentDailyLifetime med ägare, kontogeneration, hund, datum, tidszon och public/review-scope. Den exakta checklistlänken kontrollerar aktuell publicerad snapshot, steg och befintlig vuxenrelevansgräns innan innehåll öppnas.
- PublishedTrainingScreen visar för närvarande den fasta returtexten “Tillbaka till dagens checklista”.

## Avgränsad implementation

1. HomeScreen får en separat callback för att öppna en exakt träningskälla. Anropa den bara för en träningsrad med availability=available och både programId och stepId. ProductWorkspace kontrollerar igen vid tryck att samma currentDailyLifetime och exakt publicerad version/steg fortfarande är aktuell. Om källan blev stale, opublicerad eller fel-scopead sedan renderingen stannar ägaren på Hem och ser ett kort, vardagligt besked vid uppgiften; ingen träning öppnas. En otillgänglig, vuxenbegränsad eller ofullständig källa får inte en handlingsbar länk.
2. ProductWorkspace skapar samma exakta trainingEntry som checklistan, men anger returkontexten home. Checklistan fortsätter att ange checklist. Båda behåller currentDailyLifetime som scope och använder den befintliga publicerade-program-, steg-, konto-/hund- och vuxengrinden.
3. Träningsvyns befintliga returcallback väljer angiven returkontext. En valfri backLabel-prop gör returtexten korrekt för Hem eller checklistan och behåller checklistans etikett som standard för andra konsumenter.
4. Hemmets generella Träna-genväg, andra träningsingångar, completion-write, progresskälla och checklistans befintliga returbeteende ändras inte.
5. Lägg till riktad wiring-regression och public/review-interaktion för exakt käll-id, korrekt Hem-retur och oförändrad generell träningsingång. Lägg till ett stale-race-scenario där källan blir opublicerad eller scope ändras efter rendering men före tryck; ägaren ska stanna på Hem och få kort, sanningsenlig återkoppling. Dokumentera funktionen i befintlig Home-guide.

## Acceptanskriterier

1. Tryck på en tillgänglig träningsuppgift från Hem öppnar samma publicerade version och exakt samma steg som dagens val refererar till; inget titel- eller positionsbaserat uppslag ersätter id-paret.
2. Saknad, stale, ej publicerad, vuxenbegränsad eller fel-scopead version/steg öppnas inte. Om källan blir stale/opublicerad/fel-scopead mellan render och tryck stannar användaren på Hem och ser ett kort vardagligt felbesked vid uppgiften. Befintlig tillgänglighets-/vuxengräns används; ingen behörighet breddas.
3. Retur från träningsvyn går tillbaka till Hem och visar fortsatt samma lokala hund-/datumkontext. Retur från Idag-checklistan går fortsatt tillbaka till checklistan med dess befintliga scope.
4. Hemmets generella Träna-genväg fortsätter öppna generella Träning utan påhittat exact-entry.
5. Inga tabell-, RPC-, migrations-, query-, persistens-, RLS-, dataändamåls- eller dependencyändringar.
6. Public/review harness verifierar exakt val, rätt returtext och -destination, saknad källa som icke-handlingsbar, stale-race som stannar på Hem med återkoppling samt generell Träna-genväg. Renderingen jämförs vid 375×844, 430×844 och 375×667, inklusive 140 % textproxy; rapportera visuella avvikelser och native luckor separat.
7. Home-guiden och checkpointdokumentationen beskriver källa, returflöde, kontroller och begränsningar.

## Skrivvägar

- src/features/home/HomeScreen.tsx
- src/features/home/ProductWorkspace.tsx
- src/features/training/PublishedTrainingScreen.tsx
- tests/daily-activity-ui.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/verify.py
- tools/visual-check/README.md
- src/features/home/README.md
- docs/tasks/dev/FLOW-HOME-TRAINING-TARGET-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md
- docs/design/evidence/vision-rev02/checklist/HOME-TRAINING-01

## Verifiering

- Riktad test av Home-wiring, exact-entry och returkontext.
- Riktad ESLint på ändrade TypeScript-/test-/harnessfiler.
- Public och review build samt separat verifiering för home-training-target.
- Manuell kontroll av public/review screenshots och interaktionsresultat enligt design-rules §14.
- pnpm check.
- python tools/dev_flow.py validate.
- git diff --check.

Faktiska kommandon och antal skrivs efter körning; planen förutsäger inga PASS-resultat. Native iOS/Android-gester, VoiceOver, Dynamic Type, live Supabase/RLS och fysisk app är NOT TESTABLE i lokal RN Web.

## Beroenden och gränser

Beroenden: MVP-V2-ADOPT-01 och FLOW-HOME-CHECKLIST-IDAG-01 (båda done); inga nya beroenden eller datamodeller.
Planen får inte ändra innehållsurval, vuxenpolicy, generella Träning-ingången, Home-innehållets artikelväg, dataåtkomst eller Home/Checklistans dagsmutationer. Nytt scope kräver förnyad planreview.

## Granskningsbevis

- Architect v1: APPROVE.
- Critic v1: PROCEED WITH CHANGES; stale-source-race måste lämna användaren på Hem med begripligt besked. Infört i plan v2 och acceptans.
- Architect v2: APPROVE för exakt plan v2; press-time exact-source gate och Home-feedback är tillräckliga.
- Critic v2: PROCEED; stale-source-race lämnar ägaren på Hem med kort återkoppling.
- Security: inte separat före implementation; riskklass M utan ny data-/åtkomst-/nätverkspåverkan. Om scope ändras stoppas arbetet för Security-review.
- QA 2026-10-17: PASS för avgränsad funktion; full visuell Rev02-panelmatch fortsatt öppen. Rapport: `docs/design/evidence/vision-rev02/checklist/HOME-TRAINING-01/qa/INDEPENDENT-QA.md`.
- Reviewer 2026-10-17: PASS för plan v2 och dokumentationsrecheck; inga blockerande kodfynd. Fixture-callbacks begränsar vad browser PASS bevisar. Rapport: `docs/design/evidence/vision-rev02/checklist/HOME-TRAINING-01/review/INDEPENDENT-REVIEW.md`.


## Implementation checkpoint — 2026-10-17

Implementerat enligt plan v2: Hem öppnar sparat programversions-/steg-id med press-time scope/source-kontroll och origin-aware retur. Saknad/stale källa stannar på Hem med radfeedback. Generella Träning-fliken och checklistans retur behålls. Ingen datafråga, skrivning eller vuxenpolicy ändrades.

Riktade kontroller: `tests/daily-activity-ui.test.mjs` 7/7; `tests/home-vision.test.mjs` 5/5; riktad ESLint; `pnpm typecheck`; public/review builds; public/review `home-training-target` browserflöde 7/7 vardera utan page errors; 3 viewportar samt 140 % web textproxy. QA körde även `pnpm check` (app/edge typecheck, ESLint, 550/550 tester), `python tools/dev_flow.py validate`, `python -m py_compile tools/visual-check/verify.py` och `git diff --check`: PASS. Skärmbilder, 18-punktschecklista och resultat: `docs/design/evidence/vision-rev02/checklist/HOME-TRAINING-01/README.md`.

QA och Reviewer PASS: den avgränsade funktionen är godkänd, men full Rev02-panelmatch är fortsatt öppen. §14 punkt 16 redovisar komposition Nej (bland annat saknad åldersremsa), komponentform Nej (rund markör i stället för fyrkantig) och innehållstäthet Nej (genvägskort tätt mot bottenmenyn). Browserfixturen använder HomeScreen med fixtureägd callback; ProductWorkspace:s press-time scope/source/adult-grind är statiskt granskad och inte runtime-bevisad av fixturen. Ingen styling ändrades eftersom den ligger utanför R3a-planens scope. Live Supabase/RLS, konto-/hundbyte, iOS/Android, fysisk touch, VoiceOver/Dynamic Type, native safe area och installerad app är NOT TESTABLE i RN Web-fixturen.

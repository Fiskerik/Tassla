# HOME-FIRST-DAY-01 — verifiering

Datum: 2026-10-24. Branch `codex/agent-workflow-stabilization`. Taskbas `8dded2507816af4d900346b8a7cb17c63ff6b232`; `origin/main` (`0b0f99f8660a392971b5caab71c19334f771f495`) är basförfader. Plan v3 har Architect **APPROVE** och UX Critic **PROCEED** före implementation.

Detta är en lokal verifiering av produktionskomponenter i RN Web med syntetiska hundar, rutiner och mutationer. Den bevisar inte att något skrevs till Supabase. Den visuella fixture-resan körs i public-läge, Chromium 375×844 och 430×844. Referensen är den oförändrade [vision_rev02.jpg](../../../../vision_rev02.jpg). Jämförelsen [rev02-home-vs-empty-375.png](rev02-home-vs-empty-375.png) visar referensens första panel och den nya tomdagsrenderingen med samma visningsbredd; bilderna behåller sina ursprungliga proportioner.

## Verifierad resa och artefakter

- [RESULTS.json](RESULTS.json): första-dagsresan 7/7 PASS.
- [home-first-day-empty-375.png](home-first-day-empty-375.png) och [home-first-day-empty-430.png](home-first-day-empty-430.png): tom Hemvy och befintlig ingång.
- [home-first-day-created-375.png](home-first-day-created-375.png), [home-first-day-completed-375.png](home-first-day-completed-375.png): två punkter och bekräftad 1/2.
- [home-first-day-retry-pending-375.png](home-first-day-retry-pending-375.png), [home-first-day-retry-confirmed-375.png](home-first-day-retry-confirmed-375.png), [home-first-day-manual-recovery-375.png](home-first-day-manual-recovery-375.png): okänt utfall med samma dagsrad/mutations-ID, bekräftad retry respektive definitivt fel och manuell återhämtning.
- Bredare regressionsevidens: [legacy public Home 52/52](legacy-home-public/RESULTS.json), [Progress 2/2](progress-public/RESULTS.json), [legacy review 72/74](legacy-home-review/RESULTS.json). De två kända review-felen är de oförändrade marginalassertionerna för Home-destinationer vid 375 och 430 px: 4 pt frigång mot ett äldre krav på 16 pt. Public-fixturen passerar samma marginalkontroll. De två felen gäller inte den nya resan och orsakades inte av ändrade Home-layoutfiler.

Beteendetestet använder den delade produktionshelpern `createRoutineAndSelectForToday` för skapa → scopekontroll → dagsrad, samma kontrollerade rutin-/dags-ID, statusarna sparad/misslyckad/okänd samt scopebyte medan rutinmallen skapas. Recovery-testet verifierar stage-specific copy och oförändrad retry-intent genom upprepade okända utfall. Fixture och beteendetest använder samma sekvenseringslogik som `ProductWorkspace`.

## Designregler §14

| Nr | Bedömning | Belägg och avgränsning |
|---|---|---|
| 1 | Ja | Rutinskaparen har en tydlig huvudhandling; första dagsresan öppnar befintlig rutinhantering. Inga nya Home-knappar tillkom. |
| 2 | Ej tillämpligt | Ingen ny grupp av jämställda handlingar tillkom i denna ändring. |
| 3 | Ej tillämpligt | Ändringen lägger inte till radering. |
| 4 | Ja | Befintliga Home-rader saknar kategoriikon och repetitiva radlänkar; hantering sker i befintlig manager. Bred kontroll mäter chevronmålet till 44×44 px. |
| 5 | Delvis | Ingen Home-layout eller safe-area-regel ändrades. RN Web-vyerna har 375×844/430×844; fysisk safe area och native scroll nåbarhet är inte provade. Den gamla review-fixturens 4 pt marginalfel kvarstår separat. |
| 6 | Ja | Den nya logiken återanvänder befintliga Home-komponenter och stilar; ingen stylingtoken eller lokal layoutregel ändrades. |
| 7 | Ja, lokal kontroll | Renderade symboler och befintlig Ionicons-familj är konsekventa i syntetiska vyer. Native glyph-rendering är inte separat provad. |
| 8 | Delvis | Befintliga varma ytor, grön progress och blå/grön/lila destinationskort syns i rendern. Ingen ny färg infördes; full kontrastmätning mot rev02 utfördes inte. |
| 9 | Ja | Checklistchevron öppnar Checklistor, framstegskontrollen öppnar Framsteg och rutintillstånd speglar faktisk bekräftelse. |
| 10 | Ja | Ingen ny normalstatusbadge eller optimistisk bock infördes. En bock visas först efter bekräftat dagsurval/readback. |
| 11 | Ja | Fel- och okändstatuscopy skiljer sparad rutin från obekräftad dagsrad; den lovar inte att dagsaktiviteten redan finns. |
| 12 | Ja | Svensk copy beskriver konkret vad användaren gör vid fel eller osäker status. |
| 13 | Delvis | Tomt och skapat läge har jämförts med referensen. Det finns en märkbar befintlig skillnad i rubrik-/bildstorlek och antal synliga checklistarader; se punkt 16. Funktionen lade inte om kompositionen. |
| 14 | Ja för berörda lägen | Tomt, skapat, delvis klart, okänt, retry bekräftad och definitivt fel/manuell tilläggsväg är renderade. Allmänna laddningslägen ingår inte i denna förändring. |
| 15 | Delvis / native NOT TESTABLE | Befintlig chevron har ett 44×44 px RN Web-mål; roller/etiketter och klickresa provas i browser. 140 % proxy finns i den separata breda Home-sviten, inte i första-dags-fixturen. Native VoiceOver/TalkBack, Dynamic Type och reducerad rörelse är inte provade här. |
| 16 | **Nej för full rev02-panelmatch** | Separat bedömning nedan. Detta är ett befintligt Home-gap, inte en layoutändring i tasken. Första-dagsleveransen bevarar befintlig layout, destinationernas färgroller och hundbildens roll; full rev02-likhet hävdas inte. |
| 17 | Ja, lokal resa | Home-chevron öppnar Checklistor; testet skapar, återvänder till Home, öppnar Framsteg och avancerar till nästa dag utan gammal completion. Native swipe/retur testas inte. |
| 18 | Ja, syntetisk fixture | Hundnamn och hundbild används i befintlig profilroll; fixture-identiteten är syntetisk och säger inget om produktionsdata. |

### Punkt 16 — delbedömning sida vid sida

| Del | Bedömning | Skäl |
|---|---|---|
| Komposition | Nej för full match | Referensen visar en större, bilddominerad hälsning och tätare Just nu-/checklistsektion. Tomdagsskärmen använder befintliga kompaktare produktsektioner och har mer tom yta. |
| Färger | Delvis | Varm bas och blå/grön/lila destinationer bevaras; alla referensytors fördelning är inte återskapad. Ingen ny färg av denna slice. |
| Typografi | Delvis | Rubrik- och kortroller känns igen men storlek/hierarki matchar inte referensbilden fullt ut. |
| Komponentformer | Ja inom befintligt system | Rundade kort, checklistarader, framstegskontroll och destinationskort följer nuvarande delade UI. Full pixel-/formmatch saknas. |
| Bildspråk | Delvis | Hundporträttet fyller samma profilroll, men den mindre cirkulära beskärningen motsvarar inte referensens större integrerade foto. |
| Innehållstäthet | Nej för full match | Tomdag och två syntetiska punkter visar avsiktligt färre rader än referensens fem exempeluppgifter; även med raderna saknas övriga referensblock. |

Det här arbetet ändrar inte Home-layouten eftersom godkänd task v3 begränsar ändringen till den befintliga create-/day-select-resan och säger att kompositionen ska bevaras. Punkt 16 dokumenterar därför den befintliga panelavvikelsen, inte ett godkännande av full rev02-panel. En separat, uttryckligt avgränsad designjustering behövs om paket 1 ska stänga hela visuell matchning.

## Samlad status och begränsningar

- **Fungerande resa:** lokal syntetisk RN Web och beteendetester PASS för skapande, bekräftad dagsrad, delad 1/2, nästa dag, scopebyte och båda återhämtningsvägarna.
- **Visuell likhet:** Home-layouten har inte ändrats och det befintliga visuella gapet mot rev02 kvarstår (punkt 16 Nej för full panelmatch). Första-dagsrendern verifierar att den nya resan fungerar i den aktuella layouten, inte full rev02-leverans.
- **Produktionsdata:** NOT TESTABLE här. Ägaren uppger att senaste commiten migrerats till Supabase, men denna verifiering utförde inga live-RPC-, RLS-, readback- eller kontoisoleringstester. Ingen produktionsskrivning gjordes.
- **Native:** VoiceOver/TalkBack, Dynamic Type, reducerad rörelse, faktisk safe area och signerad build är NOT TESTABLE här.
- **Breda review-fixture-resultat:** 72/74, med endast de två separata −4 pt marginalassertionerna ovan. De lämnades oförändrade för att inte utöka denna task.

Färsk verifiering efter plan v3: `pnpm check` PASS (app TypeScript, edge TypeScript, ESLint, 81/81 testfiler); `pnpm bundle:ios` PASS (Expo public export, 1 586 moduler); första-dags RN Web 7/7; legacy Home public 52/52; Progress public 2/2; review 72/74; `python -m py_compile tools/visual-check/verify-vision-r02-home-panels.py`, `python -X utf8 tools/dev_flow.py validate` och `git diff --check` PASS. Kövalidering och diffkontroll körs på nytt efter dokumentations-closeout. Ingen signerad iOS-build eller deploy påstås.

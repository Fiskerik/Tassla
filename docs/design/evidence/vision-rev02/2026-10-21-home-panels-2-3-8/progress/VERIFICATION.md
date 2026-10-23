# Dagens framsteg, panel 3 — lokal UI-checkpoint

**Datum:** 2026-10-22
**Task:** `FLOW-PROGRESS-01`
**Referens:** panel 3 i [`vision_rev02.jpg`](../../../../../../vision_rev02.jpg) och [rev02-screenkontraktet](../../../../vision-rev02-screen-contracts.md)
**Status:** implementation och syntetisk UI-verifiering klara. Panelen förblir partiell eftersom ingen verklig veckomålskälla finns. Panel 2:s frysta Reviewer-re-review är fortfarande en separat öppen checkpoint; den här panelens formella QA/review är inte genomförd.

## Ändring

- Progressringen använder samma `selectDailyProgress`-urval som Hem för värde, etikett och hela dagslistan. En sammanhängande SVG-stroke ger en slät båge, rundad ände under 100 % och diskret grön toning; vid 100 % stängs cirkeln utan överlappande ändar. Visuellt verifierad vid 40 % och 100 %.
- Porträttet använder panelens separata `daily-progress-hero-puppy-terrier.jpg` och märks `Standardbild`. Ringen är 248 pt med 12 pt statusbana på skärmbredderna som verifierats.
- Träningsstatusen för `Miljöträning – nya ljud` använder nu en 28 pt rund statusruta med tydlig bock. Raden öppnar fortsatt träningssteget och lägger inte till en andra skrivhandling.
- Aktivitetsraderna behåller befintlig rutinmutation och öppnar exakt träningssteg. Vyn hittar inte på tider, veckomål eller beteende-/hälsopåståenden.
- En varm, faktabaserad sammanfattning visas först när alla dagens aktiviteter är markerade som klara. Tomdagen saknar 0/0-ring och har en huvudhandling som öppnar befintlig aktivitetshantering. Loading, error, unknown och partial visas separat utan en komplett ring.

## Visuella bevis

Public visar det riktiga tomläget: [progress-empty-375.png](public/progress-empty-375.png). Review använder en tydligt märkt syntetisk fixture: [progress-375.png](review/progress-375.png), [progress-complete-375.png](review/progress-complete-375.png), [progress-complete-bottom-375.png](review/progress-complete-bottom-375.png), [progress-error-375.png](review/progress-error-375.png), [progress-loading-375.png](review/progress-loading-375.png), [progress-short-375.png](review/progress-short-375.png) och [progress-text-140-bottom-375.png](review/progress-text-140-bottom-375.png). Fulla resultat: [public/RESULTS.json](public/RESULTS.json) och [review/RESULTS.json](review/RESULTS.json).

## Designregler §14

| # | Bedömning | Panel 3 — skäl/evidens |
|---|---|---|
| 1 | Ja | Ring och lista hjälper ägaren att se dagsläget och öppna en faktisk aktivitet. |
| 2 | Ja | Tydlig ordning: titel/datum, ring, dagslista och vid fullständigt klar dag en sammanfattning. |
| 3 | Ej tillämpligt | Vyn har inga destruktiva handlingar. |
| 4 | Ja | Rutinkontroll är separat från radens öppningshandling; träning öppnar exakt träningssteg utan andra checkboxar. |
| 5 | Ja, syntetisk | 375/430 pt samt kort 375×667-viewport är naturligt scrollbara; checklistahandlingen nås ovanför bottenmenyn. |
| 6 | Ja | Mått, färger, hörn och textroller använder befintliga tokens. |
| 7 | Ja | Samma befintliga Ionicons-familj används för listor och sammanfattning. |
| 8 | Ja | Varm canvas, neutral bana, grön status och gul sammanfattningsyta används för skilda roller. |
| 9 | Ja, syntetisk | Progressringen är en read-only progressbar. Rutinkryss följer befintlig mutation och status/readback. |
| 10 | Ja | Komplett count visas först för komplett dagsdata. Ingen tid eller veckosiffra konstrueras. |
| 11 | Ja | Sammanfattningen säger endast att dagens aktiviteter markerats som klara; ingen effekt på hundens beteende utlovas. |
| 12 | Ja | Korta svenska etiketter: `Dagens framsteg`, `Dagens aktiviteter` och `Dagens lista är klar`. |
| 13 | Ja | Hundbild och ring är visuellt ankare; dagslistan är den primära fortsatta handlingen. |
| 14 | Ja, syntetisk | Loading, tomt, error, unknown och partial är skilda. Ringens tomläge har inte 0/0. |
| 15 | NOT TESTABLE fullt ut | Webbläsarens 140 %-textproxy verifierades. Native VoiceOver, Dynamic Type och safe areas verifierades inte. Vid proxyn radbryts den gemensamma bottenmenyns `Kunskap`-etikett; panelens innehåll förblir nåbart. |
| 16a Komposition | Ja, partiell | Stor ring → full dagslista → sammanfattning endast när alla valda aktiviteter är klara. Veckomålsblocket är utelämnat eftersom källan saknas. |
| 16b Färger | Ja | Ringens gröna båge separeras tydligt från neutral bana; gul yta används bara för avslutad dagslista. |
| 16c Typografi | Ja | Skärmtitel, sektionsrubrik, antal och radtext har separata semantiska roller. |
| 16d Former | Ja | Cirkulär statusbana och grupperat aktivitetskort följer målbildens former. |
| 16e Bildspråk | Ja | Eget, varmt terrierporträtt för panel 3; fallback märks `Standardbild`. |
| 16f Objekt/täthet | Nej, datalucka | Den gemensamma selector-listan är komplett för dagens urval, men tidstämpel saknas för alla rutinpunkter och en verifierad veckomålsmodell saknas. Inga tider/veckomål hittas på. |
| 17 | Ja, syntetisk | Tillbaka går till Hem. Hem scrollas till start vid retur enligt routekontrakt; full route-/scopeverifiering kvarstår i den panelgemensamma granskningen. |
| 18 | Ja | Hundnamn används i ringens etikett; illustrationen märks generisk och är inte ägarens hundbild. |

## Körda kontroller

- `pnpm check` — PASS: app-/edge-TypeScript, ESLint och 665/666 tester (1 skip).
- Fokuserade progress-, daily-activity-ui-, route- och Logga-calendar-policytester — PASS.
- Public iOS content guard/export efter SVG-ändringen: PASS, 1 577 JS-moduler.
- Public React Native Web: 2/2 kontroller PASS; tomlägets huvudknapp öppnar manager-sheeten.
- Den tidigare fulla review-renderingen passerade 13/13 kontroller; efter ring-/checkboxändringen passerar den panelspecifika review-renderingen 15/15 och public-renderingen 2/2.
- `dailyProgressRingFill`-tester täcker 0 %, 1 %, 49 %, 50 %, 51 %, 99 %, 100 % och ogiltiga inputs. Review-render visar 40 % och 100 %.
- Ägarens visuella korrigering den 2026-10-22 ersatte segmentringen med en vektorbåge och förstorar Miljöträningens runda statusruta till 28 pt med en 28 pt bock. Den aktuella panelspecifika renderingen passerar public 2/2 och review 15/15; den kontrollerar statusform vid 375/430 pt, ring, kort viewport, 140 %-textproxy och loading/empty/error/unknown/partial.
- Kalenderikonen i Logga ligger minst 20,4 px från datumtexten vid 360 px; datumet ligger kvar centrerat. Public/review Logga-render passerar 13/13 vardera vid 360/375/430 px.
- Skärmbilder efter korrigeringen finns i [progress-375.png](review/progress-375.png), [progress-complete-375.png](review/progress-complete-375.png) och [Logga public/review](../../../../flow-log-01/render/).
- `git diff --check` PASS. Full panel-2/3-rendering har inte körts om tillsammans; panel 2:s sparade resultat står i dess egen verifiering.

## Öppna gränser

Panel 3 är en lokal UI-/funktionsslice, inte full panelacceptans. Ägarens visuella korrigering supersederar v8-planens tidigare no-SVG-renderingsval; detta ska hanteras i nästa panel-3-review. `react-native-svg` 15.15.4 motsvarar Expo SDK:s rekommenderade version och kräver en ny iOS-appbuild före enhetstest. Veckomål kräver en verklig population, period och datakälla eller ändrat MVP-kontrakt. Verkliga completion-tider saknas för rutinpunkter och visas därför inte. Ingen live Supabase/RLS, app-resume, account/dog-scope på fysisk enhet, native VoiceOver/Dynamic Type, signerad iOS-build eller användartest har verifierats. Oberoende QA och frozen Reviewer för panel 3 återstår.

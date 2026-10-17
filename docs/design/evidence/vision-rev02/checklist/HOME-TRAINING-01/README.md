# FLOW-HOME-TRAINING-TARGET-01 — bevis 2026-10-17

Uppgift: plan v2 i [FLOW-HOME-TRAINING-TARGET-01.md](../../../../../../tasks/dev/FLOW-HOME-TRAINING-TARGET-01.md). Branch `codex/mvp-v2-panel4-checklists-2026-10-16`; koddiffen är ännu ocommittad. Referenspanelen är [vision_rev02.jpg](../../../../../../vision_rev02.jpg). Screenshots och browserresultat finns under [public](public/) och [review](review/).

## Verifierat

- `node --experimental-strip-types --test tests/daily-activity-ui.test.mjs` — 7/7 PASS.
- Independent QA: `node --experimental-strip-types --test tests/home-vision.test.mjs` — 5/5; `pnpm check` — 550/550 tests with app/edge typecheck and ESLint; queue validation, verifier `py_compile` and diff check — PASS.
- Riktad ESLint på HomeScreen, ProductWorkspace, PublishedTrainingScreen och `daily-activity-ui.test.mjs` — PASS.
- Independent QA report: [QA](qa/INDEPENDENT-QA.md); independent Reviewer PASS plus docs recheck: [Reviewer](review/INDEPENDENT-REVIEW.md).
- `pnpm typecheck` — PASS.
- Public och review RN Web build — PASS.
- `TASSLA_UI_SCOPE=home-training-target` i public och review — 7/7 browserkontroller vardera, 0 page errors. Testar exakt vald stegtext, Hem-retur och bibehållen hundkontext vid 375×844, 430×844 och 375×667; stale-source-feedback; icke-handlingsbar saknad källa; generisk Träning-flik; 140 % web textproxy.
- Källorna och callbacks i browserfixturen är syntetiska. Den visar inte Supabase/RLS eller installerad app.

## Skärmbilder

| Lägen | Public | Review |
|---|---|---|
| Hem före öppning, 375×844 | [bild](public/home-training-target-home-375x844.png) | [bild](review/home-training-target-home-375x844.png) |
| Exakt träningssteg, 375×844 | [bild](public/home-training-target-detail-375x844.png) | [bild](review/home-training-target-detail-375x844.png) |
| Stale-källa, radfeedback | [bild](public/home-training-target-stale-feedback-375x844.png) | [bild](review/home-training-target-stale-feedback-375x844.png) |
| Saknad källa, ej handlingsbar | [bild](public/home-training-target-missing-source-375x844.png) | [bild](review/home-training-target-missing-source-375x844.png) |
| 140 % web textproxy | [bild](public/home-training-target-large-text-140-375x844.png) | [bild](review/home-training-target-large-text-140-375x844.png) |
| 430×844 / 375×667 | [resultat](public/browser-results.json) | [resultat](review/browser-results.json) |

## Design-rules §14 — checklista

Status avser denna avgränsade R3a-resa. Bildjämförelse görs mot rev02-panelen ovan; syntetiska data bevisar inte produktionsinnehåll.

| Punkt | Status | Underlag |
|---|---|---|
| 1. En primär handling och tydlig nästa handling | Ja | Hemmets valda träningsrad öppnar exakt steg; close återgår till Hem. |
| 2. Jämställda handlingars vikt och storlek | Ej tillämpligt | R3a lägger inte till jämställda handlingar. |
| 3. Radera skiljs från normal handling | Ej tillämpligt | Ingen radering i denna resa. |
| 4. Hem-rad utan kategoriikon/repetitiva länkar | Ja | [Home före öppning](public/home-training-target-home-375x844.png); befintlig rad/fördjupning behålls. |
| 5. Avstånd, sektioner, safe area och marginal | Ja i web-fixturen | Tre viewportar; horisontellt overflow saknas. Native safe area är ej testad. |
| 6. Delade tokens och komponenter | Ja | Återanvänds `DailyActivityItem` och befintliga appkomponenter; ingen lokal styling tillagd. |
| 7. Ikonfamilj och symboler | Ja | Inga ikoner tillagda; befintliga verifierade Ionicons används. |
| 8. Färgfördelning och kontrast | Ja för färgroller | Home behåller blå/grön/lila genvägar och varm accent. Numerisk kontrastmätning ingick inte i R3a. |
| 9. Symbol, etikett och handling | Ja | Knappen beskriver träningsuppgiften och öppnar sparat version/steg-id. |
| 10. Status utan onödiga badges; bekräftade bockar | Ja | Ingen badge tillagd; träningsstatus kommer från dagsfixturen. |
| 11. Banners och uppmuntran | Ja | Ingen ny banner eller uppmuntran i public-läget; review-fixturens disclaimer är separat. |
| 12. Vardaglig och korrekt copy | Ja | Stale-feltexten visas vid rätt rad och undviker interna termer. |
| 13. Copy, metadata och bildandel | Ja för R3a-flödet | Befintlig Home-copy och bildroll lämnas oförändrade; testdata är syntetisk. |
| 14. Relevanta loading/empty/error/sparlägen | Ja för berörda lägen | Stale-fel och saknad källa renderas; R3a introducerar inget sparflöde. |
| 15. 44×44, skärmläsare, större text, reducerad rörelse | Ja för web | Knappsemantik och 140 % proxy testade; fysisk VoiceOver, Dynamic Type och touch är NOT TESTABLE. Reducerad rörelse används i browserkörningen. |
| 16. Rev02-komposition, färg, typografi, former, bild och täthet | Nej; se delbedömning | Direkta public/review-bilder ovan. Full visuell rev02-leverans hävdas inte. |
| 17. Rubriker, flikar, aktiv förälder och retur | Ja | Training-detalj → Hem; Home-tab aktiv efter retur; generell Träning förblir generisk. |
| 18. Hundnamn, bildroll och relevant innehåll | Ja för fixturen | Luna och standardbild visas; ägarspecifikt produktfoto är NOT TESTABLE i syntetiska data. |

### Punkt 16 — separat delbedömning

| Del | Status | Bild / motivering |
|---|---|---|
| Komposition | Nej för full Rev02-panel | [Home 375×844](public/home-training-target-home-375x844.png); referensens åldersremsa saknas och genvägskorten ligger tätt mot bottenmenyn. R3a bevisar endast den avgränsade träningsresan. |
| Färger | Ja | Befintliga ytor och genvägsfärger bevaras i public/review. |
| Typografi | Ja för befintliga tokens | Befintlig typografi; 140 % proxy bild finns ovan. |
| Komponentformer | Nej — befintlig rund träningsmarkör skiljer sig från rev02-panelens markeringsform | [Home 375×844](public/home-training-target-home-375x844.png). R3a ändrar ingen styling; avvikelsen ska bedömas av QA innan visuell acceptans. |
| Bildspråk | Ja för standardbildsrollen; ägarfoto NOT TESTABLE | Referenspanelen och Home-fixturen visar hundfoto, men ingen ägarspecifik bilddata används. |
| Innehållstäthet | Nej mot panelreferensen | Home-fixturens genvägskort ser delvis överlappade/täta mot bottenmenyn ut. Femsyntesen visar träningsuppgiften och fyra rutinposter men visar inte att hela panelens täthet matchar. |

## Begränsningar

Oberoende QA och Reviewer godkände R3a:s avgränsade funktion; full Home-panelens visuella Rev02-match är fortsatt öppen enligt punkt 16. Browserfixturen driver HomeScreen med fixtureägd callback, inte ProductWorkspace:s produktionscallback; press-time scope/source/adult-grinden är därför statiskt granskad men inte bevisad av browserresultatet. Live Supabase/RLS, verkligt konto-/hundbyte, iOS/Android, fysisk touch, VoiceOver, Dynamic Type, native safe area och installerad app är NOT TESTABLE här. Inget verkligt användarkontoinnehåll användes i fixturen.

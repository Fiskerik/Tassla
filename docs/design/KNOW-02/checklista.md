# KNOW-02 – visuell och interaktions-QA

Datum: 2026-10-11
Spec: [KNOW-02 v2](../../plans/KNOW-02-checklists-faq-ux-spec.md)
Resultat: **PASS för lokal UI-harness**, med punkterna 6 och 18 ej testbara/tillämpliga i denna skärmuppsättning. Detta verifierar inte native- eller live-backend-beteende.
Skärmbilder och körresultat: `docs/design/KNOW-02/evidence/`.

## Körning och begränsningar

RN Web-harnessen kör aktuella Knowledge, checklist, FAQ, HomeCarousel och review-training-skärmar med syntetiska kataloger och kontrollerad syntetisk API-adapter. Renderingen provades vid 375 och 430 px; stor text simulerades med 140 % font-/radavstånd vid 375 px. Playwright provade också formulärvalidering, lyckad/nekad/okänd skrivning, retry, CAS-liknande konfliktåterläsning, route unmount/remount, scopebyte och review-träningens cloud-handler-isolering.

FAQ-fliken ligger delvis utanför tablistens första vy vid 140 %, men tablisten går att skrolla horisontellt. Efter skrollning är hela FAQ-etiketten synlig, tab-ytan är minst 44 px hög och tryck öppnar FAQ. Checklistgenvägens beskrivning radbryts inom kortet. Guidens granskningsmärkning fortsätter nedanför första viewporten; den går att läsa i sin helhet efter vanlig vertikal skrollning och texten är inte klippt inne i kortet.

Native Alert-utseende, tangentbord, VoiceOver, riktig Dynamic Type, fysisk enhet, Supabase/live-RLS, migrationens körning och tvåägarisolering är **NOT TESTABLE** i denna harness. Alert-shimmen verifierar valda callbacks, inte native presentation. Träningsutkastens callback verifierades att inte anropa cloud-progress-handlern; det bevisar inte live-tjänstens rättigheter.

## Beteende- och innehållskontroller

| Kontroll | Status | Evidens / notering |
|---|---|---|
| Fyra Kunskap-flikar: För dig / Artiklar / Checklistor / FAQ. | PASS | `knowledge-375.png`, `knowledge-430.png`; FAQ nås även efter horisontell skrollning vid 140 %. |
| Checklista är grön, FAQ lila; etikett och ikon bär också kategorin. | PASS | `knowledge-375.png`, `knowledge-large-text-375.png`. |
| Checklistekorten öppnar stabila katalog-ID:n från både Kunskap och Hem. | PASS | `browser-results.json`: Hem öppnar `review-v1:destination:checklists` och `review-v1:destination:faq`. |
| Kontextval: före hemkomst / första dagarna / efter ålder; kan ändras och bekräftat val visas. | PASS | `checklist-context-age-375.png`; syntetiskt sparat val uppdateras efter svar. |
| Ingen ankomstdag samlas; före hemkomst/första dagar väljs uttryckligen. | PASS | `checklist-context-age-375.png`; inga datumfält i den provade vyn. |
| Alla faser går att läsa; endast aktiv kontext påverkar relevant lista. | PASS | Åldersfas och fasöppning verifierades i browser-resultat. |
| Under åtta veckor visas förberedelser/generella guider enligt spec. | PASS | `checklist-under-eight-weeks-375.png`. |
| Checklistdetalj visar intro, antal/procent/progressbar och alla standardpunkter. | PASS | `checklist-detail-375.png`, `checklist-detail-430.png`. |
| Bock/procent ändras först efter bekräftad återläsning; aldrig mognad eller hälsostatus. | PASS | Bock ändrar progress; osäkert skrivläge låser upprepad handling tills exakt kontroll. Syntetisk adapter. |
| Egen punkt kan läggas till, redigeras och tas bort; gräns 160 Unicode-tecken; bekräftelse vid delete. | PASS | browser-resultat täcker trimning, 161 emoji-avslag, edit, delete-avbryt och delete-bekräfta. |
| Egna punkter skiljs visuellt från redaktionella; avbockning kan ändras igen. | PASS | `checklist-detail-375.png`, `checklist-custom-checked-375.png`. |
| Synkfel/okänd status behåller inmatning och visar rätt retry/kontrolltext utan falskt Sparat. | PASS | Retry efter oförändrad preimage behåller edittext och lyckas vid retry; unsure kräver kontroll. `checklist-uncertain-375.png`. |
| FAQ visar korta expanderbara svar per fas; inga checkboxar eller AI-/nätfrågetjänst. | PASS | `faq-expanded-375.png`; syntetiskt FAQ-innehåll. |
| Review-innehåll har dämpad märkning: Tillfälligt exempel – innehållet är inte sakgranskat. | PASS | `knowledge-375.png`, `checklist-detail-375.png`; märkning är läsbar efter skroll vid 140 %. |
| Hem-guidens ID matchar Kunskap; read-fel är separat från review-innehåll. | PASS | Hem-ID callbacks verifierade; den separata live read-felvägen är inte simulerad för innehållsservern. |
| Review-träning visar syntetisk lista, detalj och progress; markering är märkt endast för vyn. | PASS | `review-training-list-375.png`, `review-training-detail-375.png`, `review-training-progress-375.png`. |
| Review-träning anropar inte cloud progression och använder inte publicerade program-ID:n. | PASS | Komplett/framsteg-knapp provad; syntetisk cloud-handler-räknare kvar på 0. |

## Designreglernas 18 punkter

| # | Kontroll | Status | Evidens / notering |
|---|---|---|---|
| 1 | Högst en primary-knapp per vy. | PASS | Checklistdetalj har en huvudåtgärd; formuläret visar Spara som enda primary. |
| 2 | Knappar inom grupp har konsekvent höjd/stil. | PASS | Checklist- och formvyer; kontroller i samma grupp har jämn behandling. |
| 3 | Radera skiljer sig från ändra och har bekräftelse/ångra. | PASS | Editvyn separerar destructive Radera; cancel behåller raden och bekräftelse tar bort den via shim. |
| 4 | Inga stora ändra/radera-länkar på varje rad. | PASS | Rader har ingen parvis Ändra/Radera; redigering nås via egen punkt-sektionen. |
| 5 | Avstånd följer tokens; rubrikmarginaler är konsekventa. | PASS | Jämför `checklist-overview-375.png` och `checklist-detail-375.png`; inga uppenbara avståndsbrott i renderingen. |
| 6 | Inga nya hårdkodade färger/px-värden i UI-diffen. | NOT TESTABLE | Kräver kod-/tokenrevision, inte visuell rendering. `pnpm check` passerar, men lint är inte fullständig tokenrevision. |
| 7 | Ikonstil är enhetlig; inga emoji. | PASS | Checklist-, FAQ- och bottennavikoner använder samma ikonuppsättning; ingen emoji-ikon synlig. |
| 8 | Kategorifärg och ikon är konsekvent och avsedd. | PASS | Checklistor grön med checklistikon; FAQ lila med månikon. |
| 9 | Ikoner är begripliga med kompletterande text. | PASS | Båda genvägskorten har full textetikett; checklistprogress har text. |
| 10 | Normala poster saknar onödiga statusetiketter. | PASS | Normala checklistposter visar ingen extra statusbadge; Sparat/status visas endast efter relevant mutation. |
| 11 | Högst en handlingskrävande informationsruta per vy. | PASS | Fel- och osäkerhetslägen visar en relevant instruktion/åtgärd vardera. |
| 12 | Copy följer innehålls-/förbudsregler och tillfällig status är sanningsenlig. | PASS | Review-märkning visas; syntetisk sparstatus visar success först efter bekräftat svar. |
| 13 | Förklarande copy är högst två rader där två-radersregeln gäller. | PASS | Kortbeskrivningarna radbryts; guidefördjupning ligger i läsvy/vertikal skroll och klipps inte. |
| 14 | Laddar/tomt/fel/normal/pending/success/unsure är begripliga. | PASS | Loading/error/normal/failed retry/unknown/success provade; error saknar falska nollräkningar. |
| 15 | Tryckmål minst 44 pt och 140 % text flödar utan klippning/horisontell overflow. | PASS | FAQ tab efter skroll är hel och ≥44 px; checklistgenväg wrappar; routes saknar horisontell overflow. Local RN Web-mått. |
| 16 | Layout och innehåll följer målbilden eller godkända tillägg i v2. | PASS | Vyerna har varm bakgrund, lugna kort, fasval/checklistprogress och expanderbar FAQ enligt godkänd v2. |
| 17 | AppBar, flikar och bottennav är konsekventa där de ingår. | PASS | Overview har Knowledge AppBar/flikar; detalj har en egen Back AppBar utan dubblerad parent-header; bottennav kvar. |
| 18 | Hundnamn/foto visas där målbilden gör det; syntetisk grafik presenteras inte som ägarfoto. | NOT APPLICABLE | Checklist/FAQ/träningsvyerna har inget ägarfoto-/hundnamnsfält i den godkända skärmspecen. HomeCarousel-bilden är redaktionell innehållsbild, inte ägarfoto. |

## Slutresultat

Resultat: **PASS för lokal KNOW-02 UI-harness**. Inga visuella eller interaktionsblockerare återstår i de provade flödena.
Browserkontroller: 44 PASS, 0 FAIL; inga page errors.
Oberoende `pnpm check`: TypeScript och edge typecheck PASS; 37/37 testfiler PASS; lint 0 fel / 38 varningar. `git diff --check` PASS.
Begränsningar: syntetiska data/API, inte live backend; native Alert, VoiceOver och riktig Dynamic Type är **NOT TESTABLE** här.

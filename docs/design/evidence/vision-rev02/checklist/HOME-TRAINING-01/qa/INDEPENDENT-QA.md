# Oberoende QA — FLOW-HOME-TRAINING-TARGET-01 v2

Datum: 2026-10-17
Verdict: **PASS för den avgränsade R3a-funktionen.** Full visuell Rev02-match för Hem är fortsatt öppen. Den befintliga formavvikelsen blockerar inte navigeringsflödets acceptans, men panelen kan inte rapporteras som visuellt färdig.

QA använde endast syntetiska RN Web-fixtures. Inga credentials eller kontodata användes.

## Acceptanskriterier

| Kriterium | Resultat | Underlag |
|---|---|---|
| 1. Hem öppnar exakt version och steg via sparade ID:n | PASS | Home skickar version-, steg- och aktivitets-ID:n; ingen titelbaserad lookup. `src/features/home/HomeScreen.tsx:199`. |
| 2. Saknad, inaktuell, opublicerad, vuxenbegränsad eller fel-scopead källa öppnas inte | PASS | Tryckgrinden kontrollerar aktuellt scope, activity-ID:n, publicerad källa, steg och vuxenregel. Stale och saknad källa finns i browserflödet. `src/features/home/ProductWorkspace.tsx:2679`. |
| 3. Retur går till ursprungsvyn med kvarvarande lokal kontext | PASS i fixtur | Hem och checklista får varsin returkontext och etikett. Live konto-/hundbyte är ej testat. `src/features/home/ProductWorkspace.tsx:2728`. |
| 4. Generella Träna-genvägen förblir generell | PASS | Hemmets Träna-kort fortsätter till generiska destinationen; separat testassertion kontrollerar det. |
| 5. Inga ändringar i dataåtkomst eller skrivkontrakt | PASS | Diffgranskning fann inga query-, persistens-, tabell-, RLS-, dataändamåls- eller dependencyändringar. |
| 6. Public/review-flöden och viewportar verifieras | PASS, med visuell avvikelse redovisad | Båda sparade browserresultaten visar 7/7 kontroller och noll page errors, med tre viewportar, 140 %-proxy, stale-, saknad-källa- och generisk-träningsflöden. |
| 7. Guide och checkpointdokumentation | PASS | Home-guiden och checkpointen beskriver flödet, verifiering och begränsningar. |

## Design-rules §14

Jämförelse gjordes mellan panel 1 i `vision_rev02.jpg` och sparade public- och review-bilder.

| Punkt | Status | Bedömning |
|---|---|---|
| 1. En primär handling och tydlig nästa handling | Ja | R3a:s träningsrad öppnar valt steg; retur går till ingången. |
| 2. Jämställda handlingar | Ej tillämpligt | R3a lägger inte till jämställda handlingar. |
| 3. Radering skiljs från normal handling | Ej tillämpligt | Ingen radering i R3a. |
| 4. Home-rader utan kategoriikon/repetitiva länkar | Ja | Befintlig rad och fördjupningsväg behålls. |
| 5. Avstånd, sektioner, safe area och fri marginal | Ja i web-fixturen, med reservation | Viewportarna renderades. Genvägskorten ser täta ut mot bottenmenyn i skärmbilden; native safe area ej testad. |
| 6. Delade tokens och komponenter | Ja | Återanvänder befintliga komponenter; ingen lokal styling tillagd. |
| 7. Ikonfamilj och verifierade symboler | Ja | R3a lägger inte till ikoner. |
| 8. Färgfördelning och kontrast | Ja på övergripande nivå | Varm grund och blå/grön/lila genvägar syns. Ingen ny numerisk kontrastmätning ingick. |
| 9. Symbol, etikett och faktisk handling | Ja | Träningsraden öppnar sitt valda steg. |
| 10. Status och bekräftade bockar | Ja för R3a | Ingen statusbadge tillagd; ingen ändring av sparstatus. |
| 11. Banners och uppmuntran | Ja för R3a | Ingen ny banner eller uppmuntran tillagd. |
| 12. Vardaglig och korrekt copy | Ja | Stale-feedbacken är kort och radbunden. |
| 13. Copy, metadata och bildandel | Ja för denna resa | Befintlig Home-copy och bildroll är oförändrade; fixturdata är syntetisk. |
| 14. Relevanta loading/empty/error/sparlägen | Ja för berörda lägen | Stale-feedback och saknad källa renderas; R3a lägger inte till sparflöde. |
| 15. Touch, semantik, större text och reducerad rörelse | Ja i web-fixtur med begränsning | Websemantik och 140 %-proxy finns. Fysisk touch, VoiceOver, Dynamic Type och native reduced motion är NOT TESTABLE. |
| 16. Rev02-layout, färg, typografi, former, objekt, täthet och bildspråk | **Nej — se delbedömning** | Full visuell Rev02-status för Home är fortsatt öppen. |
| 17. Rubriker, flikar, aktiv förälder och retur | Ja i fixtur | Retur från träningssteget går till Hem; generiska Träning-vyn förblir separat. |
| 18. Hundnamn, bildroll och relevant innehåll | Ja för fixturen | Syntetiskt hundnamn och märkt standardbild visas; ägarspecifikt foto är NOT TESTABLE. |

### Punkt 16 — sex separata delbedömningar

| Del | Status | Bedömning |
|---|---|---|
| Komposition | **Nej** | Renderingen avviker från panelens övergripande placering; public-bilden saknar bland annat den visade åldersremsan. |
| Färger | Ja, övergripande | Varm grund och blå/grön/lila genvägar finns. Detta är ingen pixelmatchning eller kontrastmätning. |
| Typografi | Ja, övergripande | Hierarki och vikt ser förenliga ut; fysisk textskalning är ej testad. |
| Komponentformer | **Nej** | Befintlig rund träningsmarkör skiljer sig från referensens fyrkantiga markering. Genvägskorten ligger också tätt mot bottenmenyn i bilden. |
| Bildspråk | Ja för standardbildsrollen | Generisk hundbild med synlig etikett. Personligt ägarfoto ingår inte i denna fixtur. |
| Innehållstäthet | **Nej för skärmbilden** | Genvägskorten ser delvis överlappade/täta mot bottenmenyn ut. |

Den runda markören är en befintlig avvikelse som R3a inte ändrade. Planens kriterium 6 kräver att visuella avvikelser rapporteras; planen kräver inte en separat Home-ombyggnad i denna navigeringsslice. Avvikelsen blockerar därför inte funktionell R3a-acceptans, men punkt 16 och Home-panelens fullständiga visuella Rev02-status förblir öppna.

## Körda kommandon och resultat

- `node --experimental-strip-types --test tests/home-vision.test.mjs` — **5/5 PASS**.
- `pnpm check` — **PASS**, app- och edge-typecheck, ESLint samt **550/550 tester**.
- `python tools/dev_flow.py validate` — **exit 0**.
- `python -m py_compile tools/visual-check/verify.py` — **exit 0**.
- `git diff --check` — **exit 0**.
- Sparade public `browser-results.json` — **7/7**, `pageErrors: []`.
- Sparade review `browser-results.json` — **7/7**, `pageErrors: []`.

Full kontroll exponerade ett föråldrat test som krävde att träningsraden öppnade den generiska Träning-vyn. QA uppdaterade endast `tests/home-vision.test.mjs` till att kontrollera exakt callback samt att den generiska genvägen finns kvar. Inga appfiler ändrades av QA.

## NOT TESTABLE

Live Supabase/RLS, riktiga konto- och hundbyten, iOS/Android, fysisk touch, VoiceOver, Dynamic Type, native safe area och installerad app. Browserunderlaget använder syntetiska fixtures och verifierar inte produktionsdata eller native-beteende.

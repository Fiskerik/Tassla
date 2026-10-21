# FLOW-HOME-CHECKLIST-FILTERS-01 — render- och §14-bedömning

Datum: 2026-10-21

Aktuell status: v5 kod och lokal QA **PASS**; likhet med vision_rev02 panel 4 **PARTIAL**, med återstående visuella avvikelser nedan. Den tidigare v2/v4-bedömningen hade fyrasegmentslayout utan preview och är historisk; den beskriver inte v5.

## Aktuell v5-rendering

V5 återställer panelens tre Idag-segment och placerar dagens progress/rader följt av en separat **Kommande, 7 dagar**-preview i samma vy. Previewn använder den befintliga scoped Kommande-resultatläsningen, visar endast planerade rutiner/hälsa med datum och Planerad-status, och har varken checkbox eller progress. Den visuella länken **Visa alla** ligger på samma rad som previewrubriken; dess tillgängliga namn är **Visa alla kommande aktiviteter**, och den leder vidare till den fulla fyrasegmentsvyn. Vid partiellt läsfel visas en tillgänglig rad tillsammans med felmeddelande och återförsök, så hela tillståndet ryms ovanför den fasta navigationen. Verifieraren mäter rubrik, åtgärd, tillståndstext och partiell rad mot navigationens faktiska viewportkant. Fyra preview-tillstånd har egna 375×844-bilder före åtgärd och separata bilder efter övergången.

| Underlag | Public | Review |
|---|---|---|
| Branch / commit | `codex/dog-profile-search-pilot` / `a57e17388d380800c6a378b6368babe6877b4f1c` | samma |
| RN Web build | `/tmp/tassla-flow-checklist-v5/public/app.js` · SHA-256 `f699baf78f93378f1dd255d49c20c7c65bbf567a1cd44584959f12d13a0272a6` | `/tmp/tassla-flow-checklist-v5/review/app.js` · SHA-256 `89b2195315d3f8260add45764412a14133cf39df0e0292552abbaaf425432f50` |
| Verifier | `tools/visual-check/verify.py` · SHA-256 `ac692852a783a656886f2bf40b6293134fe3c6abc9ba04c9c783e8a84c23996a` | samma |
| Viewportar | 375×844, 430×844, 375×667 | samma |
| Browserutfall | 22 grupper PASS; 38 dokumenterade captures; 0 JavaScript-fel | 23 grupper PASS; 38 dokumenterade captures; 0 JavaScript-fel |

Körningen använde HEAD `a57e17388d380800c6a378b6368babe6877b4f1c` på angiven branch med lokala ändringar i arbetskopian; inget commit eller push gjordes. Verifieraren uppdaterades för att ta bort numerisk kontrastmätning som inte längre ingår i MVP-grinden; den behåller standardvyns layout, synlighet, navigation och faktiska interaktioner. De exakta bundle-SHA-256-värdena ovan identifierar de renderade utdatafilerna.

Resultatets branch, commit, byggfingeravtryck, routes och captures finns i [`public v5 browser-results`](v5/public/browser-results.json), [`public v5 flow manifest`](v5/public/flow-home-checklist-filters-results.json), [`review v5 browser-results`](v5/review/browser-results.json) och [`review v5 flow manifest`](v5/review/flow-home-checklist-filters-results.json). Hasharna ovan matchar manifesten och de byggda `app.js`-filerna.

Utvalda skärmbilder:

- [Idag med Kommande-preview, public 375×844](v5/public/checklist-filters-375x844-routine-training-separation.png)
- [Idag med Kommande-preview, review 375×844](v5/review/checklist-filters-375x844-routine-training-separation.png)
- [Preview med tomt tillstånd före CTA, public](v5/public/checklist-filters-preview-empty-state.png)
- [Preview med laddningstillstånd före CTA, public](v5/public/checklist-filters-preview-loading-state.png)
- [Preview med partial-tillstånd före CTA, public](v5/public/checklist-filters-preview-partial-state.png)
- [Preview med feltillstånd före CTA, public](v5/public/checklist-filters-preview-error-state.png)
- [Full Kommande efter preview-CTA, public](v5/public/checklist-filters-375x844-kommande-from-preview.png)
- [Fokuserad rutinredigerare med ikonrutnät, public](v5/public/checklist-filters-routine-long-press-focused-editor.png)

§14.16-bedömning för den aktuella vyn: **PARTIAL**. Komposition, vald grön segmentstil, daglig count/progress och separat Kommande-preview följer nu referensen. Kvarstående avvikelser är bottennavigationen (Hem är aktivt enligt det godkända barnrouteskontraktet, medan referensen visar Logg aktivt), kortens kant-/delarstil och QA-harnesstämpeln. Den gula syntetiska stämpeln är endast verifieringsfixture och ingår inte i produktvyn. Exempelradernas namn/status är syntetiska och kan därför inte bevisa visuell likhet med framtida publicerade exempel. Rubriken använder `Kommande, 7 dagar` i stället för `Kommande i veckan` för att säga det verkliga rullande intervallet tydligt.

| Del av §14.16 | Aktuell bedömning | Belägg |
|---|---|---|
| Komposition | Ja | Tre Idag-segment, dagsräknare/progress/rader och Kommande-preview i samma vy. |
| Färg | Ja med avvikelse | Varm canvas och aktiv grön kapsel matchar; kortens kant/ytfördelning är inte pixelidentisk. |
| Typografi | Ja | Kompakt viktad previewrubrik och CTA visas fullständigt vid 375/430 px. |
| Form | Delvis | Card och divider-system återanvänds; referensens ytor och rundning skiljer sig något. |
| Ikoner/exempel | Delvis | Varierade rutinikoner och hälsokategori visas; syntetiska exempel ersätter referensens illustrerade exempel. |
| Innehållstäthet | Ja | Fem dagens punkter och högst tre framtida rader ryms i den avsedda scanningshierarkin. |
| Navigation | Delvis | Skärmen nås som Hem-barnroute och behåller Hem aktivt enligt godkänt kontrakt; referensens Logg-markering skiljer sig. |

## Funktionell och byggverifiering v5

`pnpm check` passerar typecheck, edge typecheck, lint och 67/67 testfiler (67 pass, 0 fail, 0 skip). Public/review-renderingen provar filter, previewns populated/loading/empty/partial/error-lägen, CTA-paritet, rutin-/träningsseparation, exakt historisk träningskälla, planerad rutin-/hälso-retur, scroll, scopebyte och 375×667. Den uppdaterade verifieraren kräver dessutom att previewrubrik, inline-åtgärd, tillståndstext och partiell rad syns ovanför fast navigation. `git diff --check`, Python-kompilering av verifieraren och `python -X utf8 tools/dev_flow.py validate` passerar efter rapport-/köuppdateringen.

`pnpm bundle:ios` passerar med public-kanal och review-innehåll avstängt: 1 454 moduler, `_expo/static/js/ios/entry-773fe3e97f5adf0ec8ce207de2ff92e4.hbc`, SHA-256 `343a304a60d24d85497493ec1936050eb65c39a333a9302e0e5ffa09c9d03ccc`. Detta är en JS-export, inte en signerad eller installerad native-app. `tests/daily-activity-model.test.mjs` provar scope och Kommande-datum på var sida om Stockholm-midnatt; route-testet verifierar refresh-wiring för aktiv app/återkomst. Ingen mounted native/AppState-integration eller fysisk enhet är testad.

| Acceptansdimension | Status |
|---|---|
| Kod | PASS — v5 preview och full Kommande använder samma scoped read/cache. |
| Lokal QA | PASS — 67 tester samt public/review RN Web-flöden och renderbevis. |
| Live Supabase/RLS | NOT TESTABLE — körningen använder syntetiska fixtures; Security-granskning är statisk. |
| Native/iPhone | NOT TESTABLE — iOS JavaScript-export finns, men ingen installerad/signad native-körning. |
| Visuell panel-4-likhet | PARTIAL — huvudkompositionen matchar; kvarstående skillnader anges i §14.16. |

Lokal QA PASS efter färsk public/review-omkörning: 22/23 verifieringsgrupper, 38 captures vardera, noll JavaScript-fel; manifestens branch/commit/build/verifierhash matchar körningen. Oberoende Reviewer är uppskjuten till MVP-closeout enligt ägarbeslutet. Denna lokala checkpoint kan därför gå till `done` utan att hävda visuell panel-4-PASS, live-datakoppling eller native-/releaseverifiering.

## Historisk v2/v4-rendering (ersatt av aktuell v5-bedömning nedan)

Nedanstående v2/v4-resultat och §14-tabell är bevarade som historik. De beskriver den tidigare vyn med fyra segment och utan panel-4-preview; använd endast den aktuella v5-bedömningen ovan för nuvarande status.

## Historisk v2/v4-verifierad körning

| Underlag | Public | Review |
|---|---|---|
| Branch | `codex/dog-profile-search-pilot` | `codex/dog-profile-search-pilot` |
| Commit | `a57e17388d380800c6a378b6368babe6877b4f1c` | `a57e17388d380800c6a378b6368babe6877b4f1c` |
| RN Web bundle | `public/app.js` · SHA-256 `4a126faf809301adbdfc086b768231d2c210be7055810c4ac7755052174519c4` | `review/app.js` · SHA-256 `c50256eccb4534557814dd23834cf6caab151f1e21505fcb4ed7f199dc960719` |
| Verifier | `tools/visual-check/verify.py` · SHA-256 `bd30b8dedbd3e1cf7f6d2251daca6a660e8ce7d3d3919fb1c67a7ad69bee89fc` | samma verifierhash |
| Faktiska vyer | 375×844, 430×844, 375×667 | 375×844, 430×844, 375×667 |
| Utfall | 19 browser-assertions PASS; 24 skärmbilder; 0 JavaScript-fel | 20 browser-assertions PASS; 24 skärmbilder; 0 JavaScript-fel |

Public och review är separata syntetiska React Native Web-byggen. Båda harnesslägena visar en gul etikett för syntetisk fixture ovanför appytan; den är QA-harness, inte produkt-UI. De fullständiga resultaten, routes, scenarier, viewportar och hashvärden finns i [`public/browser-results.json`](public/browser-results.json), [`public/flow-home-checklist-filters-results.json`](public/flow-home-checklist-filters-results.json), [`review/browser-results.json`](review/browser-results.json) och [`review/flow-home-checklist-filters-results.json`](review/flow-home-checklist-filters-results.json).

iOS JavaScript-exporten lyckades med `TASSLA_BUILD_CHANNEL=public` och `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false`: `_expo/static/js/ios/entry-040d42fdb3e98918fb66b940b18ea7e9.hbc`, SHA-256 `b7dd844891160f811a4a065f90a1911f88e004c5b00985e0948b4063598890d4`, 1 453 moduler. Det är en lokal bundle-export, inte en signerad eller installerad native-app.

`pnpm check` PASS: typecheck, edge typecheck, lint och 65/65 testfiler (65 pass, 0 fail, 0 skip). Den riktade Checklist-sviten PASS för sex testfiler; `git diff --check`, Python-kompilering av verifieraren och `python -X utf8 tools/dev_flow.py validate` PASS. Live Supabase/RLS är **NOT TESTABLE**. Native/iPhone och release är **NOT TESTABLE**.

## Skärmbilder och fungerande resa

- [Idag, public 375×844](public/checklist-filters-375x844-idag.png)
- [Denna vecka, public 375×844](public/checklist-filters-375x844-denna-vecka.png)
- [Alla, public 375×844](public/checklist-filters-375x844-alla.png)
- [Kommande, public 375×844](public/checklist-filters-375x844-kommande.png)
- [Filterbyte återställer scroll till toppen](public/checklist-filters-filter-change-scroll-reset.png)
- [Historisk träning i skrivskyddat läge](public/checklist-filters-historical-training-read-only.png)
- [Planerad rutin efter redigering](public/checklist-filters-planned-routine-after-edit.png)
- [Planerad rutin efter bekräftad radering](public/checklist-filters-planned-routine-after-delete.png)
- [Planerad hälsa och retur](public/checklist-filters-planned-health-return.png)

Båda lägena verifierar fyra fungerande filter, sanningsenlig Idag-progress, inga historiska/framtida progresskontroller, laddar/tom/partial/fel, exakt historisk träningskälla i read-only, återkomst till filtret, fokuserad framtida rutinhämtning utan dagsåtgärder, uppdaterade Kommande-rader efter rutinredigering, uttrycklig bekräftelse vid radering, planerad hälsohändelse och retur till Kommande, scrollreset vid filterbyte, scrollbevarande för källretur, avslut/återöppning och hundscope-byte.

## §14 — relevanta punkter

Bedömningen jämför skärmbilderna ovan sida vid sida med [`vision_rev02.jpg`](../../../../vision_rev02.jpg), panel 4. Lokala bilder visar samma bredder och skala. Public- och review-banner är endast syntetiska QA-markeringar.

| Punkt | Resultat | Belägg |
|---|---|---|
| 1. Tydlig huvud- och nästa handling | Ja | En tillbakahandling, filterval och kontextbunden Hantera/källhandling. |
| 2. Jämställda handlingar | Ja | Segment har samma form/storlek; radhierarkin är konsekvent. |
| 3. Radering och bekräftelse | Ja | Syntetiskt Alert-prov bekräftar att avbryt bevarar och bekräftelse tar bort källraden. Native Alert är inte testad. |
| 4. Hemraders kategoriikoner och upprepade länkar | Ja | Hemmets dagliga rutin-/träningsrader behåller kompakt rad; checklistans planerade rader har semantisk källaikon. |
| 5. Avstånd, safe area och marginal | Ja | 375/430 standardbredder och 375×667; inga horisontella klipp i verifieraren. Native safe area är ej testad. |
| 6. Delade token och komponenter | Ja | `Tabs`, `DailyActivityItem`, `Card`, `AppScreen` och befintliga tokens återanvänds. |
| 7. Ikonfamilj | Ja | Befintliga Ionicons-symboler används. |
| 8. Färgfördelning | Nej | Varm canvas och grön status finns, men referensens gröna valda segment och kortytor saknas i samma fördelning. |
| 9. Symbol, etikett och handling | Ja | Framtida rutin, hälsa och read-only-historik öppnar respektive deklarerad källa/status. |
| 10. Status och bockar | Ja | Idag-räknare härleds från bekräftade aktiviteter; range har ingen progress. |
| 11. Banners och uppmuntran | Ja | Den gula syntetiska fixture-etiketten finns i båda QA-harnessen och hör inte till produktvyn. Ingen sådan banner ingår i appens checklistskärm. |
| 12. Copy | Ja | Kort svensk statuscopy; inga databas- eller driftord i gränssnittet. |
| 13. Ton, metadata och bildhierarki | Nej | Referensen har en kompakt kommande-förhandsvisning och namngivna aktivitetsexempel i samma vy; den separata Kommande-vyn har inte den hierarkin. |
| 14. Loading/empty/error/partial/sparat | Ja | Alla range-lägen och återhämtningar renderades i public och review. Träningssteg har samma fyrkantsform/storlek på statusmarkören som rutinpunkter och en liten skolikon som skiljer källtypen; träningsstatus är inte direkt bockbar. |
| 15. Tillgänglighetsmatris | Ej tillämpligt | Ägarbeslut 2026-10-21 skjuter systematisk granskning till efter godkänd MVP. |
| 16. Matchning med rev02-panel 4 | Nej | **Komposition:** referensen har tre segment, dagskort med count/progress/rader och kommande förhandsvisning; koden har fyra segment och en separat datumgrupperad vy. **Färg:** varm palette matchar delvis, ytfördelningen gör det inte. **Typografi:** rubrikhierarkin ligger nära (Ja). **Komponentform:** dividerlista och aktivt pale-grönt segment skiljer sig från referenskorten och det fyllda gröna valet (Nej). **Bildspråk:** review-datasetets repetitiva rutinpilar och frånvaro av referensens varierade exempelrader skiljer sig (Nej). **Innehållstäthet:** 7-dagarsprojektionen är längre än referensens tre kommande exempel (Nej). |
| 17. Rubrik, filter och navigation | Ja enligt skriftligt kontrakt | Hem förblir aktivt och Tillbaka går till Hem enligt screen-contractet; referensbilden visar Logg som aktiv flik. Skillnaden redovisas som avvikelse i punkt 16. |
| 18. Hund och relevant innehåll | Ja | Idag nämner aktiv hund; rader och hälsotyp kommer från aktuell hund-/datumscope. |

## Acceptansstatus

- **Kod/funktionell lokal resa:** PASS inom godkänd v2-scope.
- **Lokal QA:** PASS på verifierade React Native Web-scenarier och automatiska tester.
- **Visuell likhet mot panel 4:** NEJ enligt §14.16. Det är en konkret kompositionsskillnad, inte en saknad screenshot eller ett obelagt mått.
- **Produktionsdata/live RLS:** NOT TESTABLE; Security har bara granskat källkod och migrationspolicy.
- **Native/enhet/release:** NOT TESTABLE.

Den funktionella v2-resan får inte rapporteras som full visuell panel-4-acceptans förrän ägaren antingen godkänner den dokumenterade separata filtervyn som ett uttryckligt undantag, eller väljer en ny plan/review för att föra skärmen närmare referensen. Säkerhetsgranskningen hittade först en dygnsgräns-/återkomstbrist. Koden uppdaterar klocka och scope vid återkomst, men nuvarande route-test kontrollerar endast source wiring; det finns inget dynamiskt prov som avancerar klockan över midnatt eller simulerar AppState-resume. Beteendet är **NOT TESTED** och ska inte rapporteras som funktionellt verifierat. Ingen bred tillgänglighetsmatris kördes.

## v4 tillägg — ikon-only-väljare och uppdaterad lokal QA, 2026-10-21

Ägarens senaste justering tar bort all synlig text inne i ikonväljaren: ingen rubrik och inga namn/beskrivningar i rutorna. Alla 20 val visas som symbolgrid; varje val behåller sitt tillgängliga namn för hjälpmedel och vald ikon har en visuell markering. Varje checklistepunkt har en egen ikonknapp på samma rad som dess rubrikfält; förklaringen ligger separat under med varm bakgrund, sekundär textfärg och placeholdern “Förklaring (valfri)”, så rubrik och hjälptxt är lätta att skilja åt. Mellanrummet mellan inputfält och gridval är `spacing.md`. Skärmbilden [fokuserad rutinredigerare med ikon-only-grid](v4/review/checklist-filters-routine-long-press-focused-editor.png) visar den renderade 375×844-ytan. UI-regressionen kontrollerar att picker-markupen inte innehåller synlig text; browserverifieraren kontrollerar ikonknappens placering per fixturepunkt, förklaringsfältets placeholder och skilda bakgrundsfärg, att “Välj en ikon” inte renderas som rubrik och att val kan sparas, återöppnas och är markerat.

| Underlag | Public | Review |
|---|---|---|
| Branch / commit | `codex/dog-profile-search-pilot` / `a57e17388d380800c6a378b6368babe6877b4f1c` | samma |
| RN Web bundle SHA-256 | `d3471f61005bf432ae654ff4c37e9fd432523eb12b95aff6c5f170f8ab19401b` | `090bf6b14292508cd87dc3eae208d4ebb8373eb1787d38437430c8866332fe83` |
| Verifier SHA-256 | `51252a1ec739631953b0b6143f2e8e09f4c2726e214419c85d2850bfbbfca4d8` | samma |
| Browserutfall | samtliga flödesgrupper PASS, 33 bilder, 0 JS-fel | samtliga flödesgrupper PASS, 33 bilder, 0 JS-fel |
| Viewportar | 375×844, 430×844, 375×667 | 375×844, 430×844, 375×667 |

Fulla routes, capture-listor, exakta build paths och körningsstatus finns i [public browser-results](v4/public/browser-results.json), [review browser-results](v4/review/browser-results.json) och respektive `flow-home-checklist-filters-results.json`. `pnpm check` PASS: 66/66 testfiler, 66 PASS, 0 SKIP, 0 FAIL. Public iOS JavaScript-export PASS efter spacing/layoutändringen, 1454 moduler; `.hbc` SHA-256 `0f66ae53f1ff12459288038ac62d7c87a9456f1df45608e2b6eb2d9cc6c29105`. `git diff --check`, verifierarens Python-kompilering och kövalidering PASS.

Historisk v4-bedömning: fyra filter och separat datumgrupperad vy avvek då från referensens tre segment och inbäddade Kommande-förhandsvisning. V5-rendersammanfattningen ovan ersätter just den layoutbedömningen. Lokal QA PASS för v5; Reviewer uppskjuten till MVP-closeout. Panel-4-visuell acceptans är PARTIAL på grund av kvarstående avvikelser. Dynamisk midnatt/AppState-refetch är NOT TESTED. Live Supabase/RLS, migreringens körning mot backend, native/iPhone och release är **NOT TESTABLE**.

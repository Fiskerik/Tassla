# DEVELOPMENT-PROGRESS-AFFORDANCE-01 — granskningar

## UI Critic — BRIEF

Granskade `/tmp/tassla-preview/compare-panel2-development-progress-baseline-375.png` (798×1069) och `/tmp/tassla-preview/development-home-baseline-375.png` (375×844). Rekommenderade grön 8 pt båge till markör, kompakt knapp med `home.card`, `home.greenStrong`, 1 pt kant, 44 pt minhöjd och 8 pt padding; särskild kontroll av UNGHUND-wrap vid 375 px. Doos-resultat skulle verifieras i slutrender.

## UI Critic — REVIEW PASS

Öppnade slutbilderna:

- `public/compare-panel2-development-progress-midpoint-375.png` — 798×1069 px.
- `public/development-progress-normal-375.png` — 375×844 px.
- `public/home-development-phase-midpoint-375.png` — 375×844 px.
- `public/home-development-phase-midpoint-text-140-375.png` — 375×844 px.
- `public/development-doos-title-375.png` — 375×844 px.

Bedömning: PASS inom v3. Grön sträcka når markören och återstoden är neutral vid normal och mittpunktsålder. Fasraden har tydlig knappform och luft till porträttet vid normal och 140 % text; ingen text kapas. Rubriken är exakt `Doos utveckling`. Kalenderålderns betydelse förblir tydlig; inga färdighets- eller procentpåståenden tillkom. §14.16: komposition, färg, typografi, komponentform och innehållstäthet PASS för ändringsytorna; bildspråk oförändrat. Full panel 2-likhet, beteende, native och data är inte del av detta visuella verdict.

## Oberoende beteende- och visuell QA — PASS inom taskens ändringar

QA öppnade slutbilderna vid 375/430 och verifierade public/review `RESULTS.json` (32/32 PASS vardera). Den gröna bågen når markören, åldersprogressen växer monotont och saknas för vuxen/okänt/ogiltigt/framtida födelsedatum. Hemknappen är synlig, navigerar lokalt och klarar 44 pt; Doos-rubriken är korrekt. Sökvägsrevisionen täckte 66 ändrade/nya filer, samtliga inom planens 12 deklarerade skrivvägar.

QA fann samtidigt en kvarstående skillnad i hela panelens komposition: referensen använder ett stort hundporträtt med åldersbåge integrerad i en tätare milstolpslayout, medan den nuvarande vyn har separat bildremsa, båge och efterföljande ålders-/milstolpsblock. Detta är utanför den avgränsade affordance-ändringen. Därför är färg, komponentform och typografi **PASS för ändringen**, medan helpanelens komposition, bildspråk och innehållstäthet är **ÖPPNA** och inte får beskrivas som panelmatchade. Separat backlog `DEVELOPMENT-PANEL-COMPOSITION-01` skapad för att planera granskning/förbättring. Se `VERIFICATION.md` och `public/compare-panel2-development-progress-midpoint-375.png`.

Native iOS VoiceOver, Dynamic Type och fysisk träffyta är **NOT TESTABLE** här.

## `docs/design-rules.md` §14 — obligatorisk checklista

**Bedömningsyta:** den begärda Hem-faslänken och utvecklingsvyns progressbåge/rubrik. Visuell jämförelse: `public/compare-panel2-development-progress-midpoint-375.png` (375 pt render sida vid sida med panel 2-referensen), samt individuella 375/430 captures under `public/` och `review/`. RN Web; syntetiska profiler; detta är inte iPhone/TestFlight.

| # | Status | Motivering och bevis |
|---|---|---|
| 1 | Ja | Faslänken är en tydlig ensam handling; utvecklingsvyn pekar ut aktivt steg. Lokal navigering verifierad i public/review `RESULTS.json`. |
| 2 | Ej tillämpligt | Den ändrade faslänken har ingen jämställd syskonhandling. |
| 3 | Ej tillämpligt | Ingen radering eller destruktiv handling finns i ändringsytan. |
| 4 | Ej tillämpligt | Ändringen lägger till en destination till utvecklingsvyn, inte Hem-radshantering eller Visa/Ändra/Ta bort-länkar. |
| 5 | Ja | För ändringen: Hemknappen är minst 44 pt och texten kolliderar inte med porträttet vid 375/430 samt 140 % CSS-textproxy. Helpanelens större layoutavvikelse noteras separat i #16. |
| 6 | Ja | Befintliga Home-tokens och `react-native-svg` används; inga nya beroenden eller stylingundantag. Källa: final diff och 375/430 renders. |
| 7 | Ja | Befintlig chevron och markörinteraktion behålls; bågen är en SVG-form och ersätter inte ikonfamiljen. Källa: final renders. |
| 8 | Ja | För ändringen: passerad båge och knapp använder befintlig grön token; återstående båge är neutral. Färgprovet syns i jämförelsen; bredare Home-palett ändrades inte. |
| 9 | Ja | Fasetikett, chevron och callback leder till utvecklingsvyn; progressens label fortsätter uttryckligen avse kalenderålder, inte färdighet. |
| 10 | Ja | Ingen milstolpe markeras klar av åldersbågen; vuxen/saknad/ogiltig/framtida datum saknar progressbåge. 32/32 fixtures per public/review. |
| 11 | Ej tillämpligt | Ändringen lägger inte till banner eller uppmuntran. |
| 12 | Ja | `Doos utveckling` och `Lunas utveckling` är korrekt formatterade; rubriken finns i riktat test och render. |
| 13 | Ja | För ändringen: faslänk och aktuell ålder behåller luftig label/heading hierarchy; ändringen lägger inte till metadata. Helpanelens densitet omfattas av #16. |
| 14 | Ja | Review-fixture renderar relevanta guide loading/error-lägen; dessa kontroller passerar i 32/32. Ingen spara-/partial-state finns för ändrade kontroller. |
| 15 | NOT TESTABLE | RN Web verifierar 44 pt, accessibility label/hint, 140 % CSS-textproxy och fri yta till porträttet. Native VoiceOver, fysisk träffyta, Dynamic Type och TestFlight saknar evidens. Ingen ny rörelse infördes. |
| 16 | Nej | Se den separata delmatrisen nedan. Ändringens båge, knapp och Doos-text klarar sin avgränsade acceptans, men hela panelen matchar inte ännu. |
| 17 | Ja | Faslänken öppnar samma utvecklingsvy; aktiv fasindikator, tillbakahandling och huvudfliknavigering är oförändrade och verifierade i lokal resa. |
| 18 | Ja | För ändringen: profil-/hundnamn används utan dubbel-s; hundporträttet finns kvar och ansiktet är synligt i rendern. Full bildplacering och bildandel är öppen enligt #16. |

### §14.16 — separata dimensionsstatusar

| Dimension | Status | Bevis / kvarstående skillnad |
|---|---|---|
| Komposition | **Nej** | Jämförelsen visar separat bildremsa, båge och ålders-/milstolpsblock i appen mot referensens integrerade stora hundporträtt och tätare milstolpskomposition. |
| Färger | **Ja** | Grön passerad del, grön knappetikett och neutral återstod följer befintliga tokens; syns i paneljämförelsen och separata progressbilder. |
| Typografi | **Nej** | Doos-rubriken och faslänken är läsbara, men jämförelsen visar fortsatt avvikelse i helpanelens skala/hierarki. |
| Komponentformer | **Nej** | Knappen är tydligt formad och bågen fungerar visuellt, men referensens integrerade kurva/markörer och appens separata bågblock har olika helhetsform. |
| Objekt | **Ja** | Både referens och render visar hundporträtt, ålder och utvecklingspunkter; dessa objekt är dock placerade olika (se komposition). |
| Innehållstäthet | **Nej** | Referensens milstolpslista ligger tätare i första vyn; appens bild, båge, förklaring och milstolpsblock tar större separat vertikal yta. |
| Bildspråk | **Nej** | Hunden syns och ansiktet är inte dolt i rendern, men motiv, storlek och beskärningsroll skiljer sig från den stora, integrerade referensbilden. |

Helpanelens `Nej`-resultat är öppet och har backlog `DEVELOPMENT-PANEL-COMPOSITION-01`; denna checklistas scoped PASS får inte tolkas som helpanelens visuella godkännande.

## Frozen Reviewer

First pass: **BLOCK** — requested that the required §14 checklist be added, with Ja/Nej/Ej tillämpligt reasons and separate §14.16 dimensions. No product-code finding; reviewer confirmed the requested visuals, public/review 32/32 and separate open composition backlog. The complete checklist and scoped limitation were added above.

Second pass: **PASS** for this scoped change. Reviewer confirmed the green chronological-age arc and neutral remainder, button affordance and retained route/accessibility copy, `Doos utveckling`, public/review 32/32, exact 12-path scope, and queue/diff checks. Whole-panel composition remains explicitly open with backlog `DEVELOPMENT-PANEL-COMPOSITION-01`; native VoiceOver, Dynamic Type and physical iPhone hit targets remain NOT TESTABLE.

# UI-TRAINING-OVERVIEW-01 — verifiering

Datum: 2026-10-19. UX-spec v3 och taskplan v3.1. Branch: `codex/tassla-ui-ux-bundle-2026-10-18`. Alla skärmbilder visar syntetiska RN Web-fixtures med den riktiga `PublishedTrainingScreen`; de visar inte Supabase- eller användardata.

## Kommandon och miljö

Public och review byggdes separat med den befintliga visual-check-harnessen och installerade verktyg:

```powershell
$env:TASSLA_UI_TOOLS='C:\Users\erika\AppData\Local\Temp\tassla-ui-tools'
$env:TASSLA_UI_REVIEW='false'
$env:TASSLA_UI_OUTPUT='C:\Users\erika\AppData\Local\Temp\tassla-training-overview-public'
node tools/visual-check/build.cjs

$env:TASSLA_UI_REVIEW='true'
$env:TASSLA_UI_OUTPUT='C:\Users\erika\AppData\Local\Temp\tassla-training-overview-review'
node tools/visual-check/build.cjs
```

Utdata serverades lokalt med `python -m http.server` på `127.0.0.1:4193` (public) och `127.0.0.1:4194` (review). Skärmbilder togs med Playwright och installerad Chrome 155.0.8059.41. Översiktsrutter använde `?screen=training&trainingScenario=default`, `unknown-age`, `state=empty` och `state=error`; detaljbilden öppnades från programkortet. 140%-bilden använder `html { zoom: 1.4 }` i Chrome och är ett webblayoutprov, inte native Dynamic Type.

Verifieringskommandon:

- `node --experimental-strip-types --test tests/training-overview.test.mjs` — 13/13 passerade efter sista språkfixen.
- `CI=1 pnpm check` — passerade efter sista språkfixen, typecheck/lint och 542/542 tester.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios` — iOS JavaScript-bundle exporterad; ingen native/Xcode- eller signerad build kördes.
- `git diff --check` — passerade.
- `PYTHONUTF8=1 python tools/dev_flow.py validate` — passerade före slutlig QA-/reviewövergång.

Playwright fångade noll sidfel. Vid 140% finns ingen horisontell overflow (document width 375 px); etiketten `Kunskap` i den befintliga bottenmenyn radbryts på två rader. Övrig innehållstext och kort får naturlig radbrytning. Resultat och skärmbilder granskades 2026-10-19.

## Bildbevis

| Läge | Filer |
|---|---|
| Public översikt 375×844, 430×844, 375×667 och 140% browser-zoom | `public/overview-375x844.png`, `public/overview-430x844.png`, `public/overview-375x667.png`, `public/overview-140pct-browser-zoom.png` |
| Public unknown-age, tom lista, fel och alla klara | `public/overview-unknown-age.png`, `public/overview-empty.png`, `public/overview-error.png`, `public/overview-all-complete.png` |
| Public programdetalj, öppnad från översikten | `public/program-detail-375x844.png` |
| Review översikt, programdetalj och övningsblad | `review/overview-375x844.png`, `review/program-detail-375x844.png`, `review/exercise-sheet-375x844.png` |

All-klar-bilden skapades genom att slutföra alla fem syntetiska övningar via samma knappar/callbacks som skärmen visar, sedan gå tillbaka till översikten. Zero-step-fallet har ingen route i den befintliga visual fixture; det verifieras av riktade rena helper-tester men saknar renderbild. Samma fixture saknar separat tränings-loading- och public completion-fel/okänt scenario. De befintliga källguarden för bekräftelse, återställning och review-lokal progress granskades; de saknade fixture-lägena påstås inte vara visuellt verifierade.

## Design-rules §14 — avgränsad bedömning

| # | Svar | Bedömning |
|---|---|---|
| 1 | Ja | Översikten har en tydlig primär handling: `Öva nu` för nästa tillåtna övning. |
| 2 | Ja | Programkorten är staplade med samma form och visuell vikt. |
| 3 | Ja | `Börja om` ligger i programdetaljen och använder befintlig bekräftelse. |
| 4 | Ej tillämpligt | Reglerna gäller Hemmets dagsrader. |
| 5 | Ja / NOT TESTABLE | Webblayouter visas vid alla fyra storlekar utan horisontell overflow; 375×667 går att nå med scroll. Native safe-area verifieras inte här. |
| 6 | Ja | Skärmen återanvänder delade `AppBar`, `BottomSheet`, `Button`, `Card`, `ListRow`, `Progress` och temats tokens. |
| 7 | Ej tillämpligt | Ingen ny ikon eller ikonfamilj introduceras i den här patchen. |
| 8 | Ej tillämpligt | Hemmets destination-/tipsfärgfördelning gäller inte träningspanelen; befintliga träningstokens används. Kontrastmätning ingick inte. |
| 9 | Ja | `Nästa övning`, `Öva nu`, `Kommande` och `Klar` matchar respektive handling/tillstånd i synlig text och tillgängliga etiketter. |
| 10 | Ja | Progress/status bygger på bekräftade aktuella steg-ID:n; färg används inte ensam för stegstatus. |
| 11 | Ja | Framgångstoasten visas först efter bekräftad completion-callback. |
| 12 | Ja | Copy är vardaglig och talar om att program eller övningar saknas utan att hitta på resultat. |
| 13 | Ja | Nästa övning och programstatus har tydlig hierarki och dämpad metadata. |
| 14 | Ja / delvis NOT TESTABLE | Public/review, tom lista, fel, unknown-age, partiell progress, alla klara, detalj, aktuellt steg och övningsblad renderades. Zero-step och separata tränings-loading/pending/failure-renderingar stöds inte av harnessen; logik/guards täcks av tester eller källgranskning. |
| 15 | NOT TESTABLE | Skärmläsare, native 44×44 pt-träffytor, Dynamic Type och reducerad rörelse kan inte bekräftas med dessa webbilder. 140% är endast en layoutproxy; bottenmenyn radbryter `Kunskap`. |
| 16 | Nej — ägarundantag | Den nya enkolumns-/programlistan matchar den uttryckligen beställda patchriktningen, men avviker från rev02-panelens tabs/bildkort/fortsättkort. `DEV-UI-TRAINING-OVERVIEW-01` dokumenterar ägarens beslut; full visuell rev02-panelacceptans hävdas inte. |
| 17 | Nej — ägarundantag | Rev02-segmentflikarna har tagits bort enligt den beställda patchen. Träningsrubrik, detaljens Tillbaka och huvudfliksnavigering finns i de renderade vyerna. |
| 18 | Ej tillämpligt | Den begärda träningsredesignen visar program-/övningsinnehåll och ålderskontext, inte hundporträtt eller hundnamn. |

## Tre separata resultat

- **Fungerande lokal resa:** public översikt → program → nästa övning → bekräftad syntetisk markering → återkomst; reviewexempel och dess progress är uttryckligen märkta och lokala. Riktade logiktester täcker current-version IDs, stabil ordning och tom-/nollstegs-/all-complete-regler.
- **Visuell likhet:** patchens avsedda enkolumnsöversikt/programresa är synligt renderad vid angivna storlekar. Det är en av ägaren beställd kompositionsavvikelse från rev02, inte ett godkännande av hela Panel 6. Vid 140% radbryts en befintlig bottenmenyetikett.
- **Produktionsdata:** NOT TESTABLE. Fixtures är syntetiska; live Supabase, RLS, verkligt publicerat innehåll och progress över telefon/flik verifierades inte i denna visualisering.

Oberoende QA:s första pass blockerade på att detta underlag och public programdetalj saknades. Efter att dessa lagts till gav QA **PASS** för avgränsad lokal acceptans. En efterföljande copyfix ändrade singular progressetikett till `1 av 1 övning klar`; QA verifierade helpern och riktade testet igen (**13/13 PASS**). Oberoende Reviewer gav **PASS** för den begränsade lokala omfattningen. Slutlig diff/status och API-/progress-/evidenskontrakt granskades. Live Supabase/RLS och native tillgänglighet/enhetsbeteende är **NOT TESTABLE**; ägarbeställd Panel 6-avvikelse är inte redovisad som full rev02-visuell acceptans.

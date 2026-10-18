# FLOW-HOME-CHECKLIST-VISUAL-01 — evidens

Denna checkpoint rättar Panel 4:s visuella fynd från `PANEL4-INTEGRATION-01/v7`: specifika/neutral rutinikoner, en verklig ISO-vecko-preview, kompakt chevronöppning, grupperad dagsyta och helt synliga segment vid stor text.

## Resultat

- Public: 9/9 verifieringsscenarier passerade; `pageErrors=[]`.
- Syntetisk review: 9/9 passerade; `pageErrors=[]`.
- Viewports: 375×844, 430×844, 375×667 och 375×844 med 140 % CSS-textproxy.
- Preview: dagens datum exkluderas; tisdag, fredag och söndag visas i befintlig sortering; nästa måndag hamnar utanför veckan; en fjärde verklig post visas via `Visa alla kommande`.
- Loading/error för hälso- respektive rutinkälla utelämnar preview men behåller full Kommande, felmeddelande och Retry. Två bekräftat tomma källor visar ingen preview.
- Vald flik annonseras i `aria-selected`; Enter och Space fungerar; labels och 44×44 px-targets för flikarna kontrolleras. Dagsradens kryss-/öppningsmål är verifierade via delad källstil/token, inte uppmätta i browsern.

## Färsk R3c-kontroll vid 140 %

Efter den senaste Tabs-radbrytningen byggdes public och review om och kördes `TASSLA_UI_SCOPE=r3c-upcoming`. Båda resultaten passerar 12/12 scenarier utan `pageErrors` eller blockerade nätverksanrop. Vid 140 % ryms aktiv Kommande-flik och label i tabbradens scrollport utan dokumentoverflow. Bounds och skärmbild finns i [`r3c-upcoming-140/public`](r3c-upcoming-140/public/) och [`r3c-upcoming-140/review`](r3c-upcoming-140/review/); verifieringsresultaten är `browser-results.json` i respektive mapp.

## Filer

- [`public/browser-results.json`](public/browser-results.json), [`review/browser-results.json`](review/browser-results.json)
- Public/review-kapturer: 375×844, 430×844, 375×667 och 140 %.
- [`SECTION14.md`](SECTION14.md) — fullständig bedömning 1–18 och de sex separata kriterierna i punkt 16.
- [`panel4-visual-vs-reference.png`](panel4-visual-vs-reference.png) — aktuell public-vy sida vid sida med referensutsnittet.
- [`QA-REPORT.md`](QA-REPORT.md) — oberoende QA PASS.
- [`REVIEW-REPORT.md`](REVIEW-REPORT.md) — oberoende Reviewer PASS.

## Begränsningar

Det här är lokalt byggda React Native Web-komponenter med syntetiska uppgifter och callbacks. Det testar inte live Supabase/RLS, riktiga mutationer, native iOS/Android, VoiceOver, installerad app eller enhetens Dynamic Type. 140 % är en webbläsarproxy. Full visuell match rapporteras inte: se kvarstående avvikelser i `SECTION14.md`.

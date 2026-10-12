# DOG-RHYTHM-01 – UI-evidens och §14-checklista

Datum: 2026-10-12  
Branch: `feedback-2026-10-12`  
Status: **renderad egenkontroll PASS; Critic PROCEED; oberoende QA PASS; Reviewer PASS**.

## Renderad verifiering

Browserprovet använder produktionskomponenterna i Hem med endast syntetiska hund-/loggdata. Det provar React Native Web; native VoiceOver, fysisk Dynamic Type, Supabase/RLS och iOS-bundle ingår inte.

Körning i denna miljö:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_ENTRY=tools/visual-check/dog-rhythm-app.tsx TASSLA_UI_OUTPUT=/tmp/tassla-preview/site TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-preview/site
python tools/visual-check/verify-dog-rhythm.py
```

Resultat efter Critic-copyändring: **11 renderade tillstånd/bredder PASS**, retry-klick från fel till loading och tillbaka till färdig Estimerad vy PASS, 140 %-textprov PASS, inget horisontellt overflow och inga browserfel. Verifieraren mäter alla fyra käll-/villkorsetiketter och alla fyra förklarande guidance-brödtexter till högst två rader vid 360 px; den personliga tidsfönsterförklaringen verifieras högst två rader vid båda bredderna. Separata browserverktyg ligger endast under `/tmp`; appens `package.json` och `pnpm-lock.yaml` ändrades inte.

| Tillstånd | 360 px | 430 px |
|---|---|---|
| Laddar | [bild](evidence/loading-360.png) | [bild](evidence/loading-430.png) |
| Färre än tio loggar | [bild](evidence/insufficient-360.png) | [bild](evidence/insufficient-430.png) |
| Personlig historik | [bild](evidence/personal-360.png) | [bild](evidence/personal-430.png) |
| Fel | [bild](evidence/error-360.png) | [bild](evidence/error-430.png) |
| Retry pågår | [bild](evidence/retrying-360.png) | [bild](evidence/retrying-430.png) |
| Retry klickat från fel (loading) | [bild](evidence/retry-click-loading-360.png) | – |

Stor text: [Personlig historik, 360 px vid 140 %](evidence/personal-360-large-text.png).

## Källkodskontroller

- `node --experimental-strip-types --test tests/log-model.test.mjs tests/home-carousel.test.mjs tests/workspace-data.test.mjs` — PASS (3 filer).
- `pnpm check` — PASS: app-/edge-typecheck; lint 0 fel och 36 varningar; 38/38 testfiler PASS, utan skip.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS efter status/checkpointuppdatering.
- `TASSLA_BUILD_CHANNEL=review EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true EXPO_NO_TELEMETRY=1 pnpm bundle:ios` — PASS; review-bundle exporteras till `dist/ios`. Publicering har inte skett.
- Verklig Supabase RLS och native tillgänglighets-/enhetstest — NOT TESTABLE i denna miljö.

## Design rules §14 – preliminär granskning

| # | Kontroll | Egenkontroll |
|---:|---|---|
| 1 | Högst en primär knapp i vyn | PASS; Hemmets enda fyllda primärhandling är ”Logga nu” |
| 2 | Knappar i samma grupp har samma storlek/stil | PASS; datumvalen är likformiga och hör till samma grupp |
| 3 | Radera skiljer sig och går att ångra | Ej tillämpligt: ingen raderingshandling |
| 4 | Inga stora Ändra/Radera-länkar på listrader | Ej tillämpligt: inga redigerings-/raderingslänkar |
| 5 | Spacing följer tokens | PASS; ändrade kort-/guidance-avstånd använder befintliga tokens; QA har granskat renderat Hem |
| 6 | Inga hårdkodade färger/px i diffen | PASS i DOG-UI-diffen; befintliga design tokens används |
| 7 | En ikonuppsättning, inga emoji | PASS; kategorichips använder appens ikonkomponent |
| 8 | Kategori har avsedd färg/ikon | PASS för kiss/bajs-kategorierna |
| 9 | Ikoner begripliga utan förklaring | PASS tillsammans med synlig text ”Kiss”/”Bajs” |
| 10 | Inga normala statusetiketter | PASS; endast avvikelseläge visar laddning/fel |
| 11 | Högst en informationsruta som kräver handling | PASS; ingen informationsbanner i kortet |
| 12 | Inga förbjudna ord i UI-copy | PASS efter UX-/dog_expertgranskad copy; hänvisningar är källor |
| 13 | Förklarande text högst två rader, rätt ton | PASS i RN Web: varje generell förklarande text och personlig disclosure mäts till högst två rader vid 360 px |
| 14 | Laddar/tom/fel/normal är utformade | PASS för loading, otillräcklig historik, personaliserat och error/retry enligt renderat prov |
| 15 | Tryckytor minst 44 pt och stor text fungerar | PASS i browserprovet för summary-/retryknapp samt 140 % text utan horisontellt overflow; fysisk Dynamic Type inväntar enhetstest |
| 16 | Målbild matchar, avvikelser noterade | PASS för dagsfärsk summeringshierarki; BabyJourney-bild 1 är endast informationsinspiration och Tasslas tokens behålls |
| 17 | Appbar, flikar och bottenmeny enligt målbild | PASS i QA:s 360/430-granskning |
| 18 | Foto/hundnamn används enligt målbild | Hundnamn visas; bild är befintlig placeholder. Hundfoto ingår i PROFILE-DOG-01, inte denna slice. |

## Avgränsningar

Post-QA dog_expert-omläsning APPROVE: VCA-frekvensraden använder nu ”De flesta hundar”, källans “most dogs” (2026-10-12). Samma text finns i Home och testfixturer. Efter uppdateringen kördes `verify-dog-rhythm.py` om: 11 renderade tillstånd/bredder plus stor text, utan overflow/browserfel; riktade Home/model/workspace-tester körs på aktuell branch.

De tio loggarna i personligt scenario är syntetiska. Algoritmen beskriver rytmen i loggade händelser, inte biologiskt behov. Riktiga rekommendationsvärden/precision är inte kliniskt eller vetenskapligt validerade. Hundägaren ska använda sin egen bedömning.

Supabase RLS och native tillgänglighets-/enhetsbeteende är NOT TESTABLE. Review-iOS-bundlen samt oberoende QA och Reviewer passerar. Slice är checkpointad lokalt.

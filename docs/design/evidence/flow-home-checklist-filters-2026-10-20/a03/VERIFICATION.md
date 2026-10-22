# FLOW-HOME-CHECKLIST-FILTERS-01 — A03 lokal verifiering

Datum: 2026-10-22
Branch: `2026-10-22-checklist-kommande-navigation`
Scope: Checklistans fyra filter, Kommande, exact source routing och retur. Public/review är syntetiska React Native Web-fixtures, inte live backenddata.

## Resultat

- Review: **19/19 PASS** i `review/RESULTS.json`. Public: **10/10 PASS** i `public/RESULTS.json`.
- Båda bredderna 375 och 430 visar fyra fungerande filter med ett valt läge, minst 44×44 pt-mål, ingen horisontell overflow och responsiv 2×2-layout.
- Idag bevarar sin interaktiva dagsprogress. Denna vecka/Alla visar sparad historik utan checkbox eller dagens progress. Alla visar 30-dagarskontexten.
- Kommande ger skilda loading-, empty-, partial- och errorlägen utan progresspåstående. Syntetiska planerade rutin-/hälsorader är markerade `Planerad` och saknar checkbox/progress.
- Planerad hälsorad öppnar den valda planen ovanför vikningen i målskärmen; retur återställer Kommande och samma scrollposition. Planerad rutin öppnar fokuserad manager utan dagsvalsåtgärder.
- Historiskt träningssteg öppnas med exakt titel i skrivskyddat läge; retur återställer Alla och samma scrollposition.
- Vid 375×667 med CSS-skalad 140 %-text förblir segmenten nåbara utan horisontell overflow. Detta är endast ett webblayoutproxyprov.
- Ingen browser `pageerror` observerades vid 375 eller 430 px.

## Jämförelse mot målbild

Panel-4-rendern använder målbildens varma bakgrund, centrerade `Checklistor`-rubrik, diskreta sammanhängande ytor, grönt tydligt valt segment och läsbar grupperad aktivitetslista. De fyra filtren använder 2×2-brytning eftersom Kommande och fullständiga svenska etiketter annars inte ryms säkert vid små bredder/stor text; detta följer godkänd plan v2. Statusen är alltid text, och planerade/historiska rader saknar completion-kontroller.

Rendererna jämfördes visuellt mot `vision_rev02.jpg` panel 4 och panelkontraktet. Detta är en avgränsad A03-jämförelse, inte ifylld fullständig §14-checklista eller full panelacceptans. Skärmbilder från review med och utan syntetisk banner finns i denna mapp.

## Körningar

- `pnpm check`: PASS — app-/edge-TypeScript, ESLint; 642 passerade, 1 skip av 643 testfall.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false EXPO_OFFLINE=1 EXPO_TELEMETRY_DISABLED=1 __UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home pnpm bundle:ios`: PASS, 1 460 moduler.
- `git diff --check`: PASS.
- `python -X utf8 tools/dev_flow.py validate`: PASS.
- Eriks manuella tester 1–4 är tidigare ägarbekräftade PASS; de kördes inte om i A03.

## Öppna kontroller

- A03 saknar ännu separat oberoende QA och frozen Reviewer. A02:s sådana godkännanden gäller inte A03.
- En bred Home-review-verifiering under samma session fann en befintlig 4 pt-överlappning i review-fixturens initiala Home-vy (destinationerna slutar vid y=787 och bottenmenyn börjar vid y=783); public Home-fixturen passerar. Home ligger utanför denna panelskrivning och är fortsatt öppen för en separat riktad korrigering.
- NOT TESTABLE: live Supabase/RLS, om A02-validatormigrationen har applicerats, äldre klienters runtime, native VoiceOver/Dynamic Type/gestures och TestFlight. Ingen SQL eller databasoperation kördes.

Ägarens önskemål om att Kunskapens checklistor ska dela ikon-/radgrammatik med Hem registreras som separat uppföljning. Kunskapens publicerade fasuppgifter och Hemmets återanvändbara återfallsrutiner har olika data-/redigeringsbetydelse. Denna A03 ändrar inte Kunskap eller dess schema.

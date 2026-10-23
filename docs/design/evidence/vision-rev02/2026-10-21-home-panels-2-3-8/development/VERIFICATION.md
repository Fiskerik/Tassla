# Utveckling, panel 2 — lokal verifiering

**Datum:** 2026-10-22
**Task:** `FLOW-DEVELOPMENT-01`
**Plan:** paket v8 och route-korrigering v6
**Status:** lokal UI-/route-checkpoint; en oberoende QA PASS följdes av frozen Reviewer CHANGES på verifierarens felaktigt sänkta Home-marginalgräns. Tröskeln är återställd och renderingarna omkörda; oberoende QA-recheck PASS 2026-10-22. Frozen Reviewer re-review inväntas. Panelen är fortsatt partiell.

## Ägarens bildfeedback

Erik bad om mer avstånd mellan fasnamnen och att den gröna ålderskapseln ska gå att dölja/visa eller flyttas bort från bågen. Fasraden fick 32 pt extra bredd med befintlig avståndstoken. Renderad lucka mellan `0–6 mån` och `Unghund` är 61,7 pt vid både 375 och 430 pt. Kapseln togglas med tryck. När den är dold får den kvarvarande markören en synlig ring och en separat 44×44 pt tryckyta för att visa kapseln igen. Detta behåller åldersetiketten nära dess markör när den visas.

## Bildbevis

Målbild: [vision_rev02.jpg](../../../../../../vision_rev02.jpg), panel 2. Aktuell vy och tillstånd:

- Public, 375×844: [Development](public/development-375.png), [dold ålderskapsel](public/development-age-pill-hidden-375.png), [guidefel](public/development-guides-error-375.png), [ogiltig ålder](public/development-age-invalid-375.png).
- Review, 375×844: [Development](review/development-375.png), [guide-detalj och retur](review/development-guide-375.png), [stor text, första vy](review/development-text-140-375.png), [stor text, efter scroll](review/development-text-140-bottom-375.png).
- Fulla verifieringsresultat och övriga vyportar finns i [`public/RESULTS.json`](public/RESULTS.json) och [`review/RESULTS.json`](review/RESULTS.json).

Rendererna använder produktionskomponenterna med syntetisk fixture. Public saknar guider och visar det tomma publicerade urvalet; review-fixturen innehåller en märkt, syntetisk guide. De är inte bevis på live-innehåll.

## Designregler §14

| # | Bedömning | Panel 2 — skäl/evidens |
|---|---|---|
| 1 | Ja | Ålder/fas och tydlig fördjupning via relevanta guider; ingen konkurrerande primärknapp. |
| 2 | Ja | Guidekort har enhetlig form och vikt. Fasnamnen är informationsetiketter, inte handlingar. |
| 3 | Ej tillämpligt | Ingen raderingshandling. |
| 4 | Ej tillämpligt | Hemmets dagsrader visas inte på den här vyn. |
| 5 | Ja | Avstånd och naturlig scroll kontrollerade vid 375/430; 140 %-proxy ger nåbart innehåll ovanför bottenmenyn. Native safe-area-beteende är inte verifierat. |
| 6 | Ja | Delade typografi-, avstånds-, färg- och touch-token; ingen ny rå färg. |
| 7 | Ja | Befintlig Ionicons-familj används för glödlampa, guide och milstolpsfallback. |
| 8 | Ja | Varm canvas, neutral båge, grön status, gul fasikon och fotobild följer panelens roller. Textkontrast: `#20262D/#F5F0E8` 13,45:1, `#626871/#FFFCF7` 5,49:1 och vit text på grön kapsel 5,74:1. |
| 9 | Ja | Ålderskapseln döljer åldersetiketten; markörringen visar att samma etikett kan återställas. Guidekort öppnar valt guide-ID. |
| 10 | Ja | Ingen falsk genomförande-/statusbadge. `Standardbild` beskriver bildens faktiska roll. |
| 11 | Ja | Ingen uppmuntran som gör hälsopåståenden. Review-bannern anger tydligt syntetiskt granskningsläge. |
| 12 | Ja | Svensk vardaglig copy för ålder, fas och saknade granskade milstolpar. |
| 13 | Ja | Hundporträttet är det visuella ankaret, följt av aktuell ålder/fas och nästa innehållssektion. |
| 14 | Ja | Loading, tomt guideurval, guidefel/återförsök samt saknat, ogiltigt och framtida födelsedatum renderades. Skriv-/sparläge behövs inte på denna läsvy. |
| 15 | NOT TESTABLE fullt ut | Public/review-web verifierar 44 pt tryckytor, knappnamn och 140 %-proxy. Native VoiceOver, iOS Dynamic Type och reducerad rörelse är inte verifierade. |
| 16a Komposition | Ja | Stor hundbild → båge → aktuell fas → milstolpssektion; jämförd med panel 2 sida vid sida. |
| 16b Färger | Ja | Foto, grön båge/markör, neutral bana och gul glödlampa följer panelens färghierarki. |
| 16c Typografi | Ja | Titel, fas, metadata och förklarande text använder skärmens semantiska roller. |
| 16d Former | Ja | Rundad bildyta, kapsel, diskret faslegend och lugnt innehållskort följer gemensamma komponentregler. |
| 16e Bildspråk | Ja | Dedikerat svart-/tanvalpsfoto med synlig etikett `Standardbild`; unikt mot Hem. |
| 16f Objekt och täthet | Nej, avgränsad datalucka | Bildens publicerade milstolpsrader saknas eftersom ingen sakgranskad/publicerad källa finns. UI:t visar den godkända tydliga fallbacken och hittar inte på exempel. Full panelmatchning är därför inte godkänd. |
| 17 | Ja | Tillbaka från Utveckling går till Hem; guide öppnad härifrån visar tillgängligt namn `Tillbaka till Utveckling` och återgår direkt. Hem, Utveckling och Checklistor behåller separata scrollpositioner i granskat flöde. |
| 18 | Ja | Hundnamn visas i rubrik; bildens generiska roll står som `Standardbild`; ålder och fas räknas från profilens datum. |

## Körda kontroller

- `pnpm check` — PASS: app-/edge-typecheck, ESLint och 67/67 Node-tester.
- `TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false EXPO_HOME=/tmp/tassla-expo-home EXPO_NO_TELEMETRY=1 pnpm bundle:ios` — PASS: public content guard och iOS-export, 1 465 moduler.
- Public React Native Web: 45/45 kontroller PASS.
- Review React Native Web: 61/63 PASS. De två FAIL gäller endast Hem-genvägarnas clearance i den syntetiska reviewfixturen: −4 pt vid 375 och 430 px, mot verifierarens bibehållna 16 pt-gräns. Panel 2:s egna UI-, tillstånds- och routekontroller PASS.
- Ålderslegend: 61,7 pt fri lucka vid 375/430; ålderskapsel/markör har 44 pt höga tryckytor och går av/på.
- Review-flöde: guide-retur, Hem/Utveckling/Checklistor-scroll och scopeinvalidering PASS. 140 %-proxy nådde innehåll ovanför bottenmenyn.
- Kontrastvärden ovan beräknade från aktiva UI-token. `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS före QA-övergången.

## Oberoende QA och verifieraravvikelse

Första oberoende QA:n PASS 2026-10-22 på UI/route och då sparade renders. Frozen Reviewer fann därefter att verifieraren hade sänkt Home-granskningens 16 pt clearancegräns till −4 pt och felaktigt räknat den kända överlappningen som PASS. Tröskeln är nu återställd och renderingarna omkörda. Public är 45/45 PASS; review är 61/63 PASS, och de enda två FAIL är Home-granskningens −4 pt clearance vid 375/430 px. Panel 2:s specifika kontroller PASS. QA-recheck PASS 2026-10-22 på den uppdaterade snapshoten: verifieraren behåller 16 pt-gränsen, de två felresultaten är exakt Hem-överlappningen, panel 2-resultaten passerar och queue/rapport/journal/evidence är samstämmiga. Rechecken körde inte om tester eller renderer. Frozen Reviewer re-review inväntas.

Erik hade uttryckligen godkänt den syntetiska Home-överlappningen som separat från det här paketet. Den registreras därför öppet som en känd Home-uppföljning; varken tröskeln sänks eller Home-kod ändras inom panel 2. QA:s första körning av `pnpm check` (67 Node-tester), Development-/route-tester 2/2, `git diff --check` och queue validation passerade. QA inspekterade renderbilder/resultat men körde inte browser-renderaren eller iOS-exporten själv.

## Leveransstatus och begränsningar

- **UI/rendering:** lokalt verifierad i public/review-fixture.
- **Interaktion/rutt:** lokalt verifierad med syntetisk data; guideretur och scrollisolering fungerar.
- **Produktionsdata:** NOT TESTABLE här. Ingen verifiering av live Supabase/RLS, faktiskt publicerat guideurval eller migrationsläge.
- **Native:** NOT TESTABLE för VoiceOver, iOS Dynamic Type och enhetens safe areas.
- **Panelstatus:** partiell tills sakgranskade, publicerade milstolpar finns. Den här checkpointen stänger inte panel 2 som helhet. Frozen Reviewer re-review återstår.
- **Skills:** `tassla-consumer-ux` och `mobile-ios-design`; utseende bedömt enligt `docs/design-rules.md` och rev02-kontraktet.

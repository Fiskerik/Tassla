# Oberoende QA — R4c publicerad FAQ

**Datum:** 2026-10-18\
**Plan:** `UIUX-REVAMP-R4C-PUBLISHED-FAQ-01` v7 — Architect APPROVE och Critic PROCEED\
**Kodcheckpoint:** branch `codex/mvp-v2-panel4-checklists-2026-10-16`, bas-HEAD `codex/mvp-v2-panel4-checklists-2026-10-16` (R3c/R4a/R4b/R4c-ändringar ligger ännu ocommittade i arbetsytan).\
**QA:** Critic-agenten `/root/critic_r4b_plan`, oberoende av implementationen.\
**Omfattning:** R4c public/review FAQ-vy, godkänd v7-korrigering, lokal RN Web-fixture. Rapporten skiljer visuell likhet, fungerande resa och produktionsdata.

## Verifierade kontroller

- Riktade selector-/FAQ-/workspace-tester: **33/33 PASS** med `node --experimental-strip-types --test tests/content-delivery.test.mjs tests/knowledge-review-content.test.mjs tests/workspace-data.test.mjs`.
- Full `pnpm check`: **577/577 PASS**, samt app-/edge-typecheck och ESLint.
- Public och review `r4c-faq` visual-check: **PASS**, inga browser page errors. Manifest och bilder finns bredvid rapporten.
- Review-kontextval: alla tre wrapperbredder är **147,14 px** vid 375 px och inom 1 px från varandra även vid 140 % text. Alla etiketter ryms; verifieraren kontrollerar horisontell overflow och väljer varje kontext. Höjderna får variera när texten radbryts.
- Hemresa i båda lägena: HomeCarousel-kortet “Vanliga frågor” anropar `FAQ_DESTINATION_ID`, öppnar Knowledge med FAQ visuellt markerad och rätt innehållsgren, och bottenmenyns Hem-åtgärd återställer HomeCarousel.
- Den direkta FAQ-matrisen finns kvar: eligible, åldersfiltrerat tomt, saknad ålder, invalid/unmapped unknown, loading, error/retry, expansion, källa, tangentbord Tab/Enter och 140 %-proxy.
- `python -m py_compile tools/visual-check/verify.py`, `python tools/dev_flow.py validate` och `git diff --check`: **PASS**. Git visar endast normala LF/CRLF-varningar.

## Referens och aktuell rendering

Panel 7 i rev02 visar Kunskapens standardsida med sökfält, kategorier och en stor bildbaserad rekommendation. FAQ är en separat flik, inte en egen vy i referensarket. Därför jämförs den gemensamma Knowledge-skalens färger och komponenter visuellt, medan FAQ-specifik komposition och bildroll får NOT TESTABLE i punkt 16.

| Referens | Aktuell R4c-yta |
|---|---|
| [vision_rev02.jpg — panel 7 ingår i referensarket](../../../../../../vision_rev02.jpg) | [Public FAQ, expanderat svar med källa och åtgärd](public/public-faq-expanded-sources-375x844.png) |
| Samma rev02-referens ovan | [Review FAQ vid 140 % textproxy](review/review-faq-140-text-375x844.png) |
| Samma rev02-referens ovan | [Hem → FAQ-destination i public-läge](public/home-carousel-faq-destination-375x844.png) |
| Samma rev02-referens ovan | [Hem → FAQ-destination i review-läge](review/home-carousel-faq-destination-375x844.png) |

Aktuella skärmbilder är web-fixturer vid 375×844, 430×844, 375×667 och 375×844 med 140 % CSS-textproxy. De är inte native-/enhetsrenderingar och referensarket innehåller inte FAQ-underläget; därför påstås ingen exakt pixelmatchning.

## Designregler §14

Status gäller den här R4c-slicen. NOT TESTABLE är en evidenslucka, inte PASS.

| # | Status | Oberoende bedömning |
|---|---|---|
| 1 | Ja | FAQ-frågan är huvudhandlingen. Källåtgärden visas efter att svaret öppnats. |
| 2 | Ja, avgränsat | Review-kontextvalen har samma bredd och visuella prioritet; höjden växer efter textens radbrytning vid 140 %. Etiketterna är läsbara. |
| 3 | Ej tillämpligt | FAQ-slicen innehåller ingen raderingshandling. |
| 4 | Ej tillämpligt | Reglerna avser Hem-rader, inte FAQ-kort. |
| 5 | Ja, web | Skärmbilder och overflow-assertions visar inga FAQ-kontroller som klipps eller överlappar. Native safe area är inte provad. |
| 6 | Ja | Befintliga delade knappar, kort, rubriker, skeleton, rörelsekomponenter och designtokens används. |
| 7 | Ja | Synliga ikoner använder projektets Ionicons-familj. |
| 8 | NOT TESTABLE | Färgerna använder projektets tokens, men oberoende jämförelse av referensens färgfördelning och kontrast har inte verifierats. |
| 9 | Ja | Fråga, källa och återkoppling beskriver sina respektive handlingar korrekt. |
| 10 | Ja | Vanliga innehållskort har inga statusbadges. Review-innehåll är uttryckligen märkt som tillfälligt. |
| 11 | Ej tillämpligt | Ingen uppmuntransbanner ingår. |
| 12 | Ja | Copy är vardaglig svenska; tomt, okänt och fel är åtskilda. |
| 13 | NOT TESTABLE | Copy och visuell hierarki har inte verifierats mot en FAQ-specifik rev02-referens. |
| 14 | Ja | Public loading, error/retry, unknown, tomt och eligible är renderade; review-exempel är märkta. |
| 15 | NOT TESTABLE | Web-tangentbord och review-kontrollernas storlek är provade. Skärmläsare, native, enhetens Dynamic Type och reducerad rörelse är inte oberoende verifierade för den här ytan. |
| 16 | NOT TESTABLE | Referensarket saknar FAQ-underläget. Enskilda dimensioner redovisas nedan. |
| 17 | Ja | HomeCarousel → FAQ med rätt markerad flik/innehåll → Hem passerar i public/review. Checklistor öppnades också från FAQ och återgången till FAQ verifierades i båda lägena. |
| 18 | Ej tillämpligt | FAQ-underläget har ingen hundbild eller hundidentitetsroll. |

### Punkt 16 — sex dimensioner

| Dimension | Status | Bedömning |
|---|---|---|
| Komposition | NOT TESTABLE | Renderingar finns, men ingen FAQ-vy finns i referensarket för direkt jämförelse. |
| Färger | NOT TESTABLE | Tokenfärgerna syns; referenslikhet och oberoende kontrastmätning är inte dokumenterade. |
| Typografi | NOT TESTABLE | 140 % webbproxy finns; jämförelse mot FAQ-referens och native Dynamic Type saknas. |
| Komponentformer | NOT TESTABLE | Delade komponenter används; direkt FAQ-formjämförelse saknar referens. |
| Bildspråk | NOT TESTABLE | FAQ-svaren har inga inline-bilder; panel 7 visar bild på standardsidan, inte i FAQ-underläget. |
| Innehållstäthet | NOT TESTABLE | Fixtures visar ett åldersberättigat svar per vy; referensens FAQ-täthet saknas. |

## Resa och produktionsdata

- **Fungerande resa:** lokal HomeCarousel → FAQ → Hem verifierad i public- och review-fixture. Från FAQ öppnades även Checklistor; public-läget visade tomläget och review-läget visade checklistfasens innehåll. Båda återvände därefter till FAQ.
- **Visuell likhet:** gemensam Knowledge-skal och lokala komponenter är synliga. Exakt FAQ-matchning mot panel 7 är NOT TESTABLE eftersom den referensen saknas.
- **Produktionsdata:** NOT TESTABLE. Fixturen använder godkända lokala content-bundle-poster och syntetiska review-poster. Live publicerade rader, Supabase/RLS, extern webbnavigering och faktisk enhetsrendering verifieras inte.
- **Övrigt NOT TESTABLE:** iOS/Android, VoiceOver/TalkBack, enhetens Dynamic Type, faktisk nätverksfelhantering mot Supabase och verklig extern källöppning.

## Resterande closeout

Criticens första QA-besked var **CHANGES för dokumentation/queue-closeout**, inte för v7-beteendet; efter uppdaterad Checklistor-evidens och synkroniserade artefakter gav Critic slutligt **PASS**. Reviewer fann därefter endast stale status-/nästa-stegstext samt en felaktig skärmbildslänk. Korrigeringarna verifierades vid oberoende Reviewer-recheck, som gav slutligt **PASS**. R4c kan stängas som lokal checkpoint. Denna rapport innebär inte att NOT TESTABLE-områden är godkända.

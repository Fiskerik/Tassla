# FLOW-KNOWLEDGE-01 — verifiering av plan v3

Datum: 2026-10-22
Status: **Avgränsad lokal UI- och beteendeverifiering godkänd; panel 7 är fortsatt öppen.** Efter kompakteringen 2026-10-22 ersattes de tidigare captures med nya public- och review-renderingar av Kunskapens riktiga React Native-komponenter och syntetiska testdata. Det är inte en full panelacceptans eller verifiering av produktionsdata.

## Fixture och metod

En tillfällig React Native Web-fixture laddade `KnowledgeScreen`, `PuppyChecklistScreen` och `ChecklistItem` direkt. Den innehöll de sex godkända guideidentiteterna med planens bilder samt en extra omappad guide, som därför visas utan bild. Checklistklienten var syntetisk. Public-läget testades utan checklistereads; review-läget läste och skrev en föreslagen fas och en preset-bock mot fixtureklienten. Fixturkoden ligger i `/tmp/tassla-flow-knowledge-panel-app.tsx`; den är inte en produktionsvy eller live Supabase-data.

Build och capture kördes lokalt:

```sh
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/flow-knowledge-01/public TASSLA_UI_ENTRY=/tmp/tassla-flow-knowledge-panel-app.tsx TASSLA_UI_REVIEW=false node tools/visual-check/build.cjs
TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-preview/flow-knowledge-01/review TASSLA_UI_ENTRY=/tmp/tassla-flow-knowledge-panel-app.tsx TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs
python /tmp/tassla-flow-knowledge-verify.py
```

Chrome headless kördes med device scale factor 1. Viewporterna var 375×844, 430×844 och 375×667 CSS-pixlar. 140 %-läget är en webbläsarproxy som skalar textnoder; det är inte iOS Dynamic Type. Safe-area-shimmen gav noll insets och renderaren simulerar inte iOS-statusfält. Referensen [vision_rev02.jpg](../../../../vision_rev02.jpg) beskars till panel 7 som [reference-panel-7.png](./public/reference-panel-7.png), 302×537 px. Den har samma proportion som 375×667-capturen, men inte samma native safe area.

Färska captures finns i [public/](./public/) och [review/](./review/). Båda lägena fångar 375×844, 430×844, 375×667, 140 %-proxy, detaljvy och genvägar. Public innehåller även loading, empty, error, noll sökträffar, FAQ och spärrad checklista. Review innehåller FAQ samt checklistöversikt, checklistdetalj och sparad preset-bock.

## Kontroller och resultat

Fokuserat kommando:

```sh
node --experimental-strip-types --test --test-reporter=spec \
  tests/knowledge-search-screen.test.mjs \
  tests/checklist-ui.test.mjs \
  tests/knowledge-training-empty-feedback.test.mjs \
  tests/content-delivery.test.mjs \
  tests/checklist-data.test.mjs \
  tests/checklist-model.test.mjs
```

Resultat: **6/6 testfiler passerade, 0 fel**. De två tidigare föråldrade testerna verifierar nu aktuell tomtillstånds-/navigationshantering och aktuell `cardItems`-rendering. Checklistdata- och modelltesterna täcker bland annat preset, custom save/update/delete, fasval, misslyckad skrivning och okänt readback-resultat. Render-fixturen verifierade preset-save med syntetisk write/readback; den renderade inte varje mutationens failed/unknown-läge.

Playwright-resultat: **public 15/15, review 14/14, `pageErrors=0`**. Kontrollerna omfattade:

- ingen horisontell overflow vid 375×844, 430×844, 375×667 eller 140 %-proxy;
- sex explicita guidebilder, en omappad textbaserad guide, inget rekommendationspåstående och korrekt review-notis;
- exakt öppnad guideversion, bevarad sökfråga vid tillbaka och tömd fråga vid hundbyte;
- public loading, error, inga publicerade guider, noll sökträffar, FAQ-tomtillstånd och noll checklistläsningar;
- review-FAQ, syntetisk checklistläsning, explicita ikonrader och bekräftad preset-save.

## Designregler §14 — observationslogg

1. **Ja, för den fångade Kunskapsresan.** Ett visuellt större guidekort är nästa tydliga steg; sökning, Visa alla och de två destinationskorten är separata sekundära val.
2. **Ja.** Checklistor och Vanliga frågor har samma kortform och vikt. Se [genvägar, 375×844](./public/knowledge-shortcuts-375.png).
3. **NOT TESTABLE.** Ingen radering visas. Checklistecustom-delete och dess bekräftelseflöde har inte visuellt renderats här.
4. **Ej tillämpligt.** Ändringen lägger inte till Hemmets dagliga aktivitetsrader eller rutinåtgärder.
5. **NOT TESTABLE för native safe area.** De lokala React Native Web-skärmbilderna visar avstånd och fria marginaler, men safe-area-shimmen gav noll insets och inget iOS-statusfält simulerades.
6. **Ja, med avgränsning.** Färg, typografi, radie och avstånd använder befintliga tokens och delade komponenter där de finns. De nya kortbilderna är 136 pt/44 pt. Inga delade designtokens ändrades.
7. **Ja i fångade vyer.** Checklistans redaktionella glyphs använder en uttrycklig Ionicons-karta och neutral fallback. Ikonraderna syns i [review-detaljen](./review/checklist-review-detail-375.png); checklist-UI-testet validerar glyphnamn.
8. **NOT TESTABLE för full färg-/kontrastmatch.** Varm grund, ljusa kortytor, grön aktiv Kunskap och lila FAQ-markör syns. Ingen numerisk kontrastmätning gjordes.
9. **Ja för provade kontroller.** Guidekortens tillgängliga namn öppnar samma guide; FAQ och Checklistor öppnar sina destinationer. Sökfrågan och hundscope verifierades i browserresan.
10. **Ja för fångade tillstånd.** Inga guider märks rekommenderade. `Sparat` visas efter syntetisk preset-write/readback; osäkra eller misslyckade sparlägen renderades inte i browser-fixturen.
11. **Ja.** Public-läget saknar review-banner. Review-lägets märkning säger att innehållet inte är sakgranskat och syns i review-capture.
12. **Ja efter copyjustering.** Den aktiva hundens namn finns direkt i sökfältets tomma placeholder, tillgängliga namn och hint: `Sök bland guider för {hund}`. En separat hjälprad är borttagen.
13. **Delvis.** Guidekortens bild, rubrik, förhandsvisning och lästid har tydlig hierarki. Metadata och bildandel är inte pixelmässigt lika panelreferensen.
14. **NOT TESTABLE för samtliga planerade sparlägen.** Loading, empty, error, noll träffar, FAQ-tomtillstånd, public checklistegräns och review preset-save har renderats. Checklistans partial/failed/unknown-vyer ingår inte i capture-serien.
15. **NOT TESTABLE fullt ut.** Webbläsarroll/-namn användes i klickkontroller och 140 %-proxy scrollar utan horisontell overflow. Fysisk target-storlek, VoiceOver/TalkBack, native Dynamic Type och reducerad rörelse verifierades inte. I 140 %-bilden bryts/klipps `Kunskap` i bottenmenyn visuellt; detta är en webbläsarproxyobservation, inte en native-Dynamic-Type-bedömning. Se [public 140 %](./public/knowledge-375x844-text-140.png) och [review 140 %](./review/knowledge-375x844-text-140.png).
16. **Nej för full matchning mot panel 7.** Jämförelsen är sida vid sida mot panelutsnittet, men avvikelser kvarstår:
    - **Komposition: Nej.** Den nuvarande vyn saknar filterchips och rekommendationsrubrik enligt planens datakontrakt. I den nya 375×667-rendern är sök, huvudkort, två mindre kort och hela `Visa alla`-tryckytan synliga; uppmätt fri marginal till bottenmenyn är 21 px. FAQ/Checklistor nås genom scroll. I 375×844 syns även de två kompakta genvägarna före bottenmenyn.
    - **Färger: NOT TESTABLE för full färgrollmatch.** Varm grund och ljusa kortytor syns, men ingen kontrastmätning eller full färgrolljämförelse är gjord.
    - **Typografi: NOT TESTABLE för pixelmatch.** Befintliga texttokens används; storlek/hierarki har inte godkänts mot referensen.
    - **Komponentformer: Ja, avgränsat.** Sökfält och rundade kort följer komponentfamiljen i referensen.
    - **Bildspråk: Ja, avgränsat.** Relevanta dekorativa hundfoton används; de är inte användarens hund eller verifierade händelser.
    - **Innehållstäthet: Delvis.** Den kortare herobilden och enradiga förhandsvisningen gör guider och genvägar tidigare synliga. Filterchips/rekommendationsyta saknas fortsatt av dataskäl; FAQ/Checklistor ligger under första vyn vid 375×667.

    Därför hävdas inte full visuell likhet eller panel 7-acceptans. Chips/rekommendation är uteslutna av planens uttryckliga beslut eftersom datan saknar taxonomi/rangordning; den motiveringen gör inte skärmen visuellt lik panelen.
17. **NOT TESTABLE för alla returvägar.** Aktiv Kunskap visas i bottenmenyn; guide/back, FAQ och checklistdestination provades. Inkommande returvägar till Träning/Utveckling verifierades inte i denna fixture.
18. **Ja för fixturet.** Hundnamnet Milo finns i sök-/tomcopy. Guidefoton är uttryckligen generiska och presenteras inte som Milos personliga bild.

## Separata acceptansbedömningar

- **Visuell likhet:** **Nej för full panel 7-matchning.** Avvikelserna i §14.16 är synliga och dokumenterade.
- **Fungerande resa:** **Pass för de provade syntetiska resorna och de angivna fokuserade testerna.** Detta omfattar inte varje native-/checklist-felvy eller extern returväg.
- **Produktionsdata:** **NOT TESTABLE.** Ingen live Supabase-läsning/skrivning, RLS, publicerad guidekatalog, releasebundle eller fysisk iOS/Android-enhet användes.

Ingen fullständig panelacceptans hävdas. Evidensen avser den implementerade arbetsversionen och lokala fixturekörningar.

## Fresh UI-density pass — 2026-10-22

`KnowledgeScreen` was tightened after the initial evidence review: the current dog's name moved into the search placeholder instead of a repeated helper line; the featured guide image changed from 176 to 136 pt with a one-line excerpt; small guide images changed from 72 to 44 pt; featured/secondary metadata now uses compact read-time and truthful `Artikel`/`Guide` pills. FAQ and Checklistor are separate 44 pt-or-larger icon-and-label actions in one compact row. This preserves the approved v3 rule against fabricated topics and recommendation claims.

Fresh local checks on this snapshot: focused tests **3/3 files passed** (`knowledge-search-screen`, `checklist-ui`, `knowledge-training-empty-feedback`); full Node suite **69/69 passed**, app and edge TypeScript passed, and ESLint passed. The content release guard passed for public; direct Expo iOS export bundled **1,579 modules** to `/tmp/tassla-flow-knowledge-ios`. The `pnpm check` wrapper itself could not reach npm because the sandbox denied registry requests (EPERM); its four local scripts were run directly and passed. Fresh public render **15/15** and review render **14/14**, `pageErrors=0`. The browser interaction verifier covered 375×844, 430×844, 375×667 and 140% CSS text proxy; all checked routes had no horizontal overflow. Public FAQ empty-state and zero review checklist reads passed. Review FAQ, checklist detail/icon rows, and synthetic preset save/readback passed. Guide detail opens the exact fixture ID; search survives guide/back and clears when dog scope changes. Captures above were overwritten from the current source.

The compact layout brings the two secondary icon-and-label cards above the fixed tab bar at 375×844. At 375×667 those destinations remain below the guide list and are reached by normal vertical scroll. The 140% CSS proxy has no horizontal overflow, but text in the bottom-nav `Kunskap` label wraps; this is browser proxy evidence only, not a native Dynamic Type result.

Remaining §14 gaps remain explicit: no topic taxonomy or justified ranking exists for chips/recommendation; checklist delete and failed/partial/unknown mutation states have not been browser-captured in this visual pass; full color-contrast/pixel-match, native safe area/physical target/VoiceOver/Dynamic Type/reduced-motion, incoming external Training/Development return routes, live production content, Supabase, and RLS were not verified. The panel remains open and partial until the plan's required acceptance work is resolved; no production-data or full visual-match claim is made.

Independent QA returned PASS after checking the corrected source/evidence dimensions (136/44 pt), current focused/full test counts, report/queue consistency, saved captures, and browser results. QA could not rerun the browser verifier because Chromium launch failed under its sandbox socket restriction; the saved captures and recorded 15/15 public, 14/14 review runs were inspected instead. Frozen Reviewer returned PASS on the final snapshot after asking for QA status to agree across records and for the image-register note to distinguish captured React Native Web crops from still-unverified native/full-app behavior. No product-code blocker was found.

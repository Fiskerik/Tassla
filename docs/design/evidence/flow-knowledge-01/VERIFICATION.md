# FLOW-KNOWLEDGE-01 — verifiering av plan v3

Datum: 2026-10-22
Status: **Avgränsad lokal UI- och beteendeverifiering godkänd; panel 7 är fortsatt öppen.** Detta underlag visar färska public- och review-renderingar av Kunskapens riktiga React Native-komponenter och syntetiska testdata. Det är inte en full panelacceptans eller verifiering av produktionsdata.

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
6. **Ja, med avgränsning.** Färg, typografi, radie och avstånd använder befintliga tokens och delade komponenter där de finns. Bildytorna har lokala mått 176 pt/72 pt för kortens crop; inga delade designtokens ändrades.
7. **Ja i fångade vyer.** Checklistans redaktionella glyphs använder en uttrycklig Ionicons-karta och neutral fallback. Ikonraderna syns i [review-detaljen](./review/checklist-review-detail-375.png); checklist-UI-testet validerar glyphnamn.
8. **NOT TESTABLE för full färg-/kontrastmatch.** Varm grund, ljusa kortytor, grön aktiv Kunskap och lila FAQ-markör syns. Ingen numerisk kontrastmätning gjordes.
9. **Ja för provade kontroller.** Guidekortens tillgängliga namn öppnar samma guide; FAQ och Checklistor öppnar sina destinationer. Sökfrågan och hundscope verifierades i browserresan.
10. **Ja för fångade tillstånd.** Inga guider märks rekommenderade. `Sparat` visas efter syntetisk preset-write/readback; osäkra eller misslyckade sparlägen renderades inte i browser-fixturen.
11. **Ja.** Public-läget saknar review-banner. Review-lägets märkning säger att innehållet inte är sakgranskat och syns i review-capture.
12. **Ja efter copyjustering.** Hjälpraden säger `Sök bland guider för {hund}` och beskriver sökområdet utan cache-/laddningsterminologi.
13. **Delvis.** Guidekortens bild, rubrik, förhandsvisning och lästid har tydlig hierarki. Metadata och bildandel är inte pixelmässigt lika panelreferensen.
14. **NOT TESTABLE för samtliga planerade sparlägen.** Loading, empty, error, noll träffar, FAQ-tomtillstånd, public checklistegräns och review preset-save har renderats. Checklistans partial/failed/unknown-vyer ingår inte i capture-serien.
15. **NOT TESTABLE fullt ut.** Webbläsarroll/-namn användes i klickkontroller och 140 %-proxy scrollar utan horisontell overflow. Fysisk target-storlek, VoiceOver/TalkBack, native Dynamic Type och reducerad rörelse verifierades inte. I 140 %-bilden bryts/klipps `Kunskap` i bottenmenyn visuellt; detta är en webbläsarproxyobservation, inte en native-Dynamic-Type-bedömning. Se [public 140 %](./public/knowledge-375x844-text-140.png) och [review 140 %](./review/knowledge-375x844-text-140.png).
16. **Nej för full matchning mot panel 7.** Jämförelsen är sida vid sida mot panelutsnittet, men avvikelser kvarstår:
    - **Komposition: Nej.** Den nuvarande vyn saknar filterchips och rekommendationsrubrik enligt planens datakontrakt. På 375×667 är de mindre korten delvis under bottenmenyn; FAQ/Checklistor nås genom scroll.
    - **Färger: NOT TESTABLE för full färgrollmatch.** Varm grund och ljusa kortytor syns, men ingen kontrastmätning eller full färgrolljämförelse är gjord.
    - **Typografi: NOT TESTABLE för pixelmatch.** Befintliga texttokens används; storlek/hierarki har inte godkänts mot referensen.
    - **Komponentformer: Ja, avgränsat.** Sökfält och rundade kort följer komponentfamiljen i referensen.
    - **Bildspråk: Ja, avgränsat.** Relevanta dekorativa hundfoton används; de är inte användarens hund eller verifierade händelser.
    - **Innehållstäthet: Nej.** Den större bildytan skjuter sekundära kort och destinationslänkar nedåt jämfört med referensens 375×667-komposition.

    Därför hävdas inte full visuell likhet eller panel 7-acceptans. Chips/rekommendation är uteslutna av planens uttryckliga beslut eftersom datan saknar taxonomi/rangordning; den motiveringen gör inte skärmen visuellt lik panelen.
17. **NOT TESTABLE för alla returvägar.** Aktiv Kunskap visas i bottenmenyn; guide/back, FAQ och checklistdestination provades. Inkommande returvägar till Träning/Utveckling verifierades inte i denna fixture.
18. **Ja för fixturet.** Hundnamnet Milo finns i sök-/tomcopy. Guidefoton är uttryckligen generiska och presenteras inte som Milos personliga bild.

## Separata acceptansbedömningar

- **Visuell likhet:** **Nej för full panel 7-matchning.** Avvikelserna i §14.16 är synliga och dokumenterade.
- **Fungerande resa:** **Pass för de provade syntetiska resorna och de angivna fokuserade testerna.** Detta omfattar inte varje native-/checklist-felvy eller extern returväg.
- **Produktionsdata:** **NOT TESTABLE.** Ingen live Supabase-läsning/skrivning, RLS, publicerad guidekatalog, releasebundle eller fysisk iOS/Android-enhet användes.

Ingen fullständig panelacceptans hävdas. Evidensen avser den implementerade arbetsversionen och lokala fixturekörningar.

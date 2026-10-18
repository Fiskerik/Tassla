# Design-rules §14 — Panel 4 visuell korrigering

**Datum:** 2026-10-18\
**Branch:** `codex/mvp-v2-panel4-checklists-2026-10-16`\
**Referens:** `vision_rev02.jpg`, Panel 4, crop `PANEL4-INTEGRATION-01/v7/vision-rev02-panel4-reference-crop.png`.\
**Current captures:** public/review, 375×844, 430×844, 375×667 och 375×844 med 140 % web-textproxy. Review har 32 px syntetisk banner ovanför appens viewport; jämförelsen exkluderar den bannern. RN Web saknar enhetens statusfält/safe area.

Svar följer `docs/design-rules.md`: Ja/Nej/Ej tillämpligt; saknade bevis anges NOT TESTABLE. Jämför även [`panel4-visual-vs-reference.png`](panel4-visual-vs-reference.png), aktuell public-rendering mot Panel 4-cropen. Aktuella public/review-filer finns i respektive undermapp och resultaten i `browser-results.json`.

| # | Status | Motivering och evidens |
|---:|---|---|
| 1 | Ja | Dagschecklistan gör bockning till huvudhandling; rutinhantering ligger separat och träningsraden är informations-/fördjupningsväg. Se public/review `panel4-visual-preview-375x844.png`. |
| 2 | Ja | Samma slags segment och dagsradskontroller har konsekvent format. Fyra segment är en dokumenterad skillnad mot referensen. |
| 3 | Ja | Checkpointen ändrar inte raderingsflödet; radering är kvar i rutinhanteringen med befintlig bekräftelse/guard. |
| 4 | Ja | Endast Checklista visar kategorisymboler; Hem-varianten är oförändrad. Rutinöppning använder en chevron med namn på rutin och punkt i tillgänglighetsnamnet. |
| 5 | Ja | Dagsrader ligger grupperade på en yta och verkliga kommande aktiviteter har en separat sektion. Innehållet fortsätter i skärmens scrollområde vid kort höjd. |
| 6 | Ja | Befintliga `DailyActivityItem`, `Tabs`, Ionicons och färg-/storleks-/spacing-token används; inga nya globala token införs. |
| 7 | Ja | Verifierade etiketter använder symbol från den befintliga Ionicons-/IconChip-familjen. Okända/närliggande etiketter ger neutral checklistesymbol. |
| 8 | Nej | Symbol- och kategoriaccent skiljer sig nu åt, men den samlade färgfördelningen är ännu inte en full match med referensens gröna, blå, gula, orangea och lila objekt/ytor. Kontrastgranskning av native-enhet är NOT TESTABLE. |
| 9 | Ja | Strikt aliaslista kopplar kända aktivitetsord till rätt kategori; närträffar förblir neutrala. Radens kryss och öppningskontroll har skilda, sanningsenliga etiketter. |
| 10 | Ja | Kända completion-bockar kommer från befintlig bekräftad dagsprogress. Veckans förhandsvisning skapas av befintliga planerade hälsorader och återkommande rutiner utan framtida completionstatus. |
| 11 | Ja | Fixture-bannern ligger utanför appens viewport. Inga uppmuntrande hälsopåståenden eller extra produktbanners tillkommer. |
| 12 | Ja | Copy är kort och svensk (`Kommande i veckan`, `Visa alla kommande`); ingen intern drifttext visas i appområdet. |
| 13 | Nej | Dag/vecko-hierarkin är tydligare, men hund-/datumrad, fristående progressrad och verkliga rutin-/hälsodata skiljer sig från målbildens kompakta exempelcopy och metadata. |
| 14 | Ja | Public/review täcker redo, tomma källor, vardera källans loading och fel, retry, söndagsgräns samt överflödeslänk; nio browser assertions per läge, inga page errors. |
| 15 | Ja (RN Web, flikar); radkontroller endast källverifierade; native NOT TESTABLE | Browsern mäter 44×44 px-bounds för flikarnas träffytor. Radens kryss- och öppningskontroller verifieras mot delad komponentstil/token; deras runtime-bounds mäts inte separat. Flikarnas valda status, Enter, Space, labels vid 140 % och reduced-motion verifieras. Den färska R3c-kontrollen bekräftar också att aktiv Kommande-flik och label ryms i tabbraden vid 140 % utan dokumentoverflow; se `r3c-upcoming-140/{public,review}/browser-results.json`. 140 % är CSS-proxy; VoiceOver, native Dynamic Type, fysiska träffytor och TestFlight är NOT TESTABLE. |
| 16 | Nej — samlad match | Presentationen förbättras men är inte pixel-/innehållsmässigt lik referenspanelen. Delkriterier bedöms separat nedan; förbättrade klickresor och gröna tester används inte som visuell ersättning. |
| 17 | Nej | Fyra segment inklusive `Kommande` behålls; referensen visar tre. Checklista öppnas som Hem-detalj, så Hem är aktiv i bottenmenyn medan referensen markerar Logg. Båda avvikelserna är uttryckligen bevarade i planen. |
| 18 | Ja | Hundnamnet Luna och hennes rutiner visas; referensen kräver inget hundporträtt i denna vy. Public/review använder endast syntetiska fixturedata. |

## Punkt 16 — separat bedömning

| Delkriterium | Status | Motivering |
|---|---|---|
| Komposition | Nej | Dagsyta och Kommande-sektion är nu separata, men progress ligger fristående och aktuell yta/höjd följer inte exakt referensens kortindelning. Se jämförelsebilden. |
| Färgfördelning | Nej | Kategorierna skiljs åt, men testbildens varierade ikon-/kortaccent motsvarar inte hela referensens objekt- och ytfördelning. |
| Typografi | Nej | Rubriker och rader är läsbara, men dog/date-scope och progress har annan placering och vikt än den kompakta referenshierarkin. |
| Komponentformer | Nej | Dagsrader är grupperade och veckans lista är kortad, men rad-/statussymboler och kortytor är inte identiska med referensen. |
| Bildspråk | Nej | Kategorisymbolerna beskriver aktiviteterna bättre och tillåts falla tillbaka neutralt, men de konkreta objekten i referensbilden är inte återgivna som samma bildspråk. |
| Innehållstäthet | Nej | Preview visar tre bekräftade rader och länk enligt kontraktet, men verklig dagsmängd och scrollposition gör att inte alla objekt syns samtidigt i den givna viewporten. |

## Separata utfall

- **Funktion:** PASS i syntetisk RN Web-matris: 9/9 scenarier per public/review, `pageErrors=[]`. Efter slutlig Tabs-korrigering passerar fokuserad UI/presentation/policy-svit 24/24 och full `pnpm check` 587/587. Den färska R3c-körningen passerar 12/12 scenarier i både public och review; aktiv Kommande-flik och label ligger inom tabbraden vid 140 %, `pageErrors=[]` och `blockedNetworkRequests=[]`.
- **Visuell likhet:** Nej som full rev02-match. De ursprungliga Panel 4-fynden från v7 — generisk ikon, saknad veckoförhandsvisning, repetitiv Visa-text, platt gruppering och klippt Idag vid stor text — är åtgärdade och verifierade. De uttryckliga avvikelserna i punkt 17 samt resterande punkt-16-skillnader rapporteras ovan; de ska inte beskrivas som full visuell rev02-leverans.
- **Produktionsdata/runtime:** NOT TESTABLE för live Supabase/RLS, native iOS/Android, VoiceOver, enhetens Dynamic Type och installerad app.

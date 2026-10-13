# R02-3B Träning — implementeringsrender och §14 egenkontroll

Datum: 2026-10-13 · Branch: `design/vision-rev02` · Plan: R02-3 v6.1 §R02-3B
Status: implementerad i lokal arbetskopia; renderad egenkontroll klar. Oberoende QA, Reviewer och Security återstår. Panel 6:s fulla visuella matchning är **Nej** enligt §14 punkt 16.

## Omfattning och fixture

`PublishedTrainingScreen` renderas i två lokala React Native Web-byggen från samma produktionskomponenter. Public har två tydligt märkta syntetiska program med ett förseedat steg för att visa sann fortsättningsprogress. Review visar `review-v1:training:*`-program och den synliga granskningsmarkeringen; genomförande ändrar endast lokal komponentstate. Båda harnesstillstånden är minneslokala och använder inga nätanrop eller dataskrivningar. Produktionsprogram, åldersurval, versionsordning och skrivkontrakt är inte syntetiska i appkoden.

Public/review byggdes separat med `tools/visual-check/build.cjs` i `/tmp/tassla-preview/r02-3b/{public,review}` och serverades lokalt på 4187/4188 eftersom planportarna redan användes. Skärmbilderna togs vid 375×844, 430×844 och 375×667, samt 140 % browserzoom som grov textskalningsapproximation. Reviewens första statiska React Native Web-bild målade inte rubrik/segment trots att DOM-geometrin fanns; slutbilderna växlade därför till `Mina` och tillbaka till `Rekommenderat` före skärmdumpen för att framtvinga en ommålning. Det ändrade inte fixturdata. Native render är inte verifierad.

## Renderad evidens

Public, syntetisk visningsfixture:

- [375×844](public/training-375x844-20261013-final.png), [430×844](public/training-430x844-20261013-final.png), [375×667](public/training-375x667-20261013-final.png)
- [140 % browserzoom](public/training-zoom-140-375-20261013-final.png)
- [Alla övningar](public/training-all-exercises-20261013-final.png), [program-/stegdetalj](public/training-detail-sheet-20261013-final.png), [Mina med bekräftad fixtureprogress](public/training-mine-20261013-final.png)
- [Tomt programresultat](public/training-empty-20261013-final.png), [felindikering](public/training-error-20261013-final.png)

Review, lokalt granskningsfixture:

- [375×844](review/training-375x844-settled-20261013.png), [430×844](review/training-430x844-settled-20261013.png), [375×667](review/training-375x667-settled-20261013.png)
- [140 % browserzoom](review/training-zoom-140-375-settled-20261013.png)
- [Alla övningar](review/training-all-exercises-settled-20261013.png), [stegdetalj](review/training-detail-sheet-20261013-final.png), [Mina efter lokal markering](review/training-mine-local-only-20261013-final.png), [fortsättkort efter lokal markering](review/training-review-continue-local-20261013-final.png)
- [Tomt programresultat](review/training-empty-settled-20261013.png), [felindikering](review/training-error-settled-20261013.png)

Browsern rapporterade inga JavaScript-sidfel. `ProductWorkspace` har ett separat laddningsläge före denna skärm; det läget ändrades inte och renderades inte i denna slice. Webbläsarzoom är inte native Dynamic Type. Text i bottennavigationen radbryts i 140 %-bilden. Native VoiceOver/TalkBack, Dynamic Type, reducerad rörelse, fysisk safe area, verklig databas/RLS och publicerat träningsinnehåll är NOT TESTABLE här.

## Kontroller

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS, 0 fel och 36 varningar i andra befintliga filer.
- `git diff --check`: PASS.
- `python tools/dev_flow.py validate`: PASS efter köuppdatering.
- Public/review UI-byggen: PASS.
- Manuell RN Web-interaktion: segment, `Visa alla`, stegdetalj, public progress, review-lokal markering, tomt och fel renderades. Ingen testfil lades till eller kördes.

## Designregelverk §14 — egenkontroll, inväntar oberoende QA

1. **Ja** — programkorten är jämställda val; fortsättkortet visas endast när progress och ett nästa steg finns.
2. **Ja** — programkort i samma rad har samma bildhöjd, format och visuell vikt.
3. **Delvis / NOT TESTABLE native** — destructive återställning behåller befintlig bekräftelsekod; native-alertens faktiska presentation verifierades inte i denna render.
4. **Ej tillämpligt** — regeln gäller Hem-rader.
5. **Ja för renderad webbyta** — 375×667 visar hela fortsättkortet cirka 9 px ovanför menyn; innehåll längre ned kan scrollas. Native safe area testades inte.
6. **Ja** — nya bildkort-, tab- och färgvarianter är namngivna och opt-in; standardvarianterna lämnades kvar.
7. **Ja för renderade symboler** — befintlig Ionicons-familj används.
8. **Delvis** — gräddvit canvas, varma kort, generisk träningsbild och grön vald tab/progress följer riktningen. Panelens ytterligare blå/gröna ämnesetiketter saknar motsvarande produktfält och har inte hittats på.
9. **Ja** — program, steg, markeringar och knappar beskriver samma befintliga datahandling.
10. **Ja** — bock och progress följer `completedStepIds`; review-fixturens markering är uttryckligen lokal.
11. **Ja** — ingen genererad framgångsbedömning eller färdighetspåstående läggs till; befintlig bekräftelse visas efter markering.
12. **Ja med fixturemarkering** — produktcopy hämtas från programdata; syntetiska public/reviewtexter är tydligt märkta i harnessen.
13. **Delvis** — ålder, program, innehåll och fortsättprogress har tydlig hierarki. Samma enda godkända träningsbild återanvänds för korten och panelens tids-/ämnestaggar saknar produktdata.
14. **Delvis** — tomt, fel, stegdetalj, bekräftad progress och lokal reviewprogress renderades. Laddning visas före komponenten i oförändrad `ProductWorkspace` och renderades inte här.
15. **Delvis / NOT TESTABLE native** — tabbar, `Visa alla` och befintliga rad-/knappkontroller använder minst 44 pt i koden; 140 % browserzoom granskades. Native skärmläsare, Dynamic Type och safe area är inte verifierade.
16. **Nej för full panellikhet.**
    - **Komposition: Ja, med skillnad** — titel → kapselsegment → åldersrubrik/`Visa alla` → tvåkolumniga bildkort → villkorat fortsättkort. Befintliga övningsrader finns längre ned i den valda sektionen.
    - **Färger: Delvis** — varm neutral bas och grön progress finns; särskilda taggfärger kan inte kopplas utan motsvarande data.
    - **Typografi: Ja** — vänsterställd titel, vald sektion, programtitel och sekundär beskrivning har tydliga nivåer.
    - **Komponentformer: Ja** — kapselsegment, rundade bildkort och liggande fortsättkort följer panelens formfamilj.
    - **Objekt: Delvis** — befintliga program/steg/progress visas, men panelens tids- och ämnestaggar finns inte som produktfält.
    - **Innehållstäthet: Delvis** — kortbeskrivning kommer från befintligt programinnehåll; långa review-/produktbeskrivningar kortas i kortet och läses i detalj. Reviewläget har ett tredje fixtureprogram.
    - **Bildspråk: Nej för exakt panelmatch** — ett generiskt godkänt träningsfoto återanvänds eftersom projektet saknar separata bildassets per program.
17. **Ja** — Träning är aktiv huvudflik; segmenten byter mellan faktiskt befintlig program-/stegmängd och Mina-progress.
18. **Ej tillämpligt** — panelen visar inte en identifierad hund; träningsbilden är generisk och redaktionell.

Den här egenkontrollen är inte den separata QA-, Reviewer- eller Security-granskning som krävs för checkpoint. Nästa tillåtna steg är oberoende granskning av fryst diff och evidens; Kunskapsslicen väntar tills dess.

# R02-3A Logg — manuell renderingsgranskning

Datum: 2026-10-13 · Branch: `design/vision-rev02` · Plan: R02-3 v6
Status: checkpointad; beteende-QA PASS, slutlig markör-QA PASS, Reviewer PASS och Security PASS. Panel 5:s fulla visuella matchning är fortsatt **Nej** enligt §14 punkt 16–17.

## Körning och begränsningar

Produktens `LogScreen` renderades från public- och reviewbyggen med React Native Web. Fixturdata, mutationer och sidladdning hölls i lokal React-state. `persistLayout={false}` stängde av både SecureStore-läsning och skrivning. Public visar `Syntetisk visningsfixture · logg`; review visar `Syntetiskt granskningsläge · loggfixture`. Båda etiketterna finns bara i den lokala harnessen. Inga externa tjänsteanrop eller dataskrivningar gjordes.

Public och review byggdes med `tools/visual-check/build.cjs`; lokal Chromium-rendering gav inga browserfel. Planens portar 4173 och 4174 var redan upptagna i miljön, så tillfälliga lokala portar 4177 och 4176 användes. Ingen automatiserad testfil lades till eller kördes.

`pnpm typecheck`: PASS. `pnpm lint`: PASS, 0 fel och 36 varningar i befintliga filer utanför Loggändringarna. `git diff --check`: PASS. `python tools/dev_flow.py validate`: PASS.

Native VoiceOver, Dynamic Type, reducerad rörelse, fysisk safe area, verklig Supabase/RLS och produktionsdata är NOT TESTABLE i denna webbrendering.

## Renderade tillstånd

Public, standard och viewport:

- [375×844](public/log-375x844.png)
- [430×844](public/log-430x844.png)
- [375×667](public/log-375x667.png)
- [140 % browserzoom](public/log-zoom-140-375x844.png)
- [Tom dag](public/log-empty-375x844.png)
- [Initial läsning laddar](public/log-loading-375x844.png)
- [Vald äldre dag utan händelser](public/log-previous-day-empty.png)
- [Snabbval från äldre dag återgår till idag](public/log-quicklog-returns-today.png)

Review, markerad syntetisk fixture:

- [Läsning laddar](review/log-loading-375x844.png)
- [Samma dag fortsätter över sidgräns](review/log-split-loading-bottom-375x844.png)
- [Komplett vald dag efter fortsatt hämtning](review/log-split-complete-375x844.png)
- [Fel vid äldre sida](review/log-split-error-375x844.png)
- [Återförsök slutför den valda dagen](review/log-split-retry-complete-375x844.png)
- [Sparar](review/log-pending-375x844.png), [misslyckad sparning](review/log-failed-375x844.png) och [okänt sparresultat](review/log-unsure-375x844.png)
- Unika slutbilder för markörkontroll: [Sparar](review/log-pending-verified-20261013.png), [misslyckad sparning](review/log-failed-verified-20261013.png), [okänt sparresultat](review/log-unsure-verified-20261013.png), [sidfel](review/log-split-error-verified-20261013.png) och [förstorad markördetalj](review/log-review-marker-detail.png)
- QA öppnade de unika slutbilderna och förstorad detalj; samtliga fyra review-tillstånd visar den synliga syntetiska markören.
- [375×844](review/log-375x844.png), [430×844](review/log-430x844.png), [375×667](review/log-375x667.png)
- [Komponentgalleri: standard och Loggvarianter](review/log-component-gallery-375x844.png)
- [140 % browserzoom som grov textstorleksapproximation](review/log-zoom-140-375x844.png)

Browserzoom är inte native textskalning. I denna approximation radbryts `Kunskap` i bottenmenyn; det är en tillgänglighetsobservation, inte ett påstående om native Dynamic Type.

## Kontrast i loggvarianterna

Beräknad WCAG-kontrast mellan kategoriikonens förgrund och tonad yta: Kiss/vatten 4,97:1, Bajs 5,03:1, Mat 4,86:1, Sömn 5,19:1, Promenad 5,38:1 och Olycka 6,15:1. Texten använder gemensam mörk texttoken på ljusa ytor.

## Designregelverk §14

1. **Ja** — användaruppgiften och snabb registrering är synliga; kategorierna är jämställda val inom samma uppgift.
2. **Ja** — de fyra primära snabbvalen har samma storlek och visuell vikt.
3. **Ja** — befintlig redigering, raderingsbekräftelse och bekräftad ångra-väg är bevarade; native-dialog är inte renderad här.
4. **Ej tillämpligt** — punkten gäller Hem-rader.
5. **Ja för webbrendering** — public och review granskade vid 375×844, 430×844, 375×667 samt 140 % browserzoom; kortare vy scrollar naturligt. Native safe area är NOT TESTABLE.
6. **Ja** — gemensamma tokens och namngivna opt-in-varianter; defaultutseenden ändras inte.
7. **Ja** — befintliga Ionicons samt befintliga Poop/Pill-symboler används.
8. **Ja** — blå Kiss/vatten, brun Bajs, beige Mat och lila Sömn syns i både snabbval och tidslinje; ikonkontrastvärden står ovan.
9. **Ja** — kategoriikon, etikett och logghändelse har samma betydelse.
10. **Ja** — normala rader saknar statusbadge; endast pending/failed/unsure visar relevant status.
11. **Ej tillämpligt** — inget uppmuntrande resultatkort används i Logg.
12. **Ja** — svensk, konkret copy; båda harnessbyggena märker syntetiska data tydligt och använder olika public/review-etiketter.
13. **Ja med dokumenterad skillnad** — tid, symbol, titel och kort detalj har tydlig hierarki; Loggpanelen har ingen redaktionell bild.
14. **Ja för renderade lägen** — initial loading, äldre pagineringsloading, tom dag, sidfel/återförsök, pending, failed, unsure och bekräftad registrering visas i evidensen.
15. **Delvis / NOT TESTABLE native** — snabbval, datumknappar och rader uppfyller minst 44 pt i kod; public/review webbrenderingar granskade vid 140 % browserzoom. Native skärmläsare, Dynamic Type och reducerad rörelse är inte verifierade.
16. **Nej för full panellikhet.**
    - Komposition: **Nej** — fyra befintliga snabbval och `Fler` tar plats; `Idag/Översikt` utelämnas tills Översikt har en fungerande destination.
    - Färgfördelning: **Ja** — panelens kategorifärger är synliga och maten har varm beige/brun roll.
    - Typografi: **Ja** — tydlig svensk titel, sektionsrubriker, tid och metadata.
    - Komponentformer: **Ja** — tonade snabbval och sammanhängande tidslinje med diskreta avdelare.
    - Objekt: **Nej** — panelens generella `Lägg till händelse`-knapp har ingen befintlig separat create-editor i denna resa; paketet har därför inte hittat på en ny skrivväg.
    - Innehållstäthet: **Nej** — den bevarade snabbvalsgruppen visar färre tidslinjerader i första vyn än panelreferensen.
    - Bildspråk: **Ej tillämpligt** — panel 5 använder inga dekorativa bilder.
17. **Nej för hela panelen** — huvudfliken Logg är aktiv och datumbläddring fungerar; `Idag/Översikt` är medvetet inte en dekorativ/falsk destination.
18. **Ej tillämpligt** — Loggpanelen visar inga hundidentitetsbilder eller hundnamn.

## Kvar till full rev02-matchning

Den synliga skillnaden i punkt 16 är begränsad till befintlig produktfunktion och godkänt scope: ingen fungerande Översikt/Insikter-destination finns i denna slice, och den enda eventinmatningen i den nuvarande resan är befintlig ett-tryckskategorilogging. Skärmens färger, tidslinje, datumnavigation och kompakterade snabbval är införda. Full visuell acceptans kräver framtida separat beslut/implementation när dessa resor finns; denna rapport markerar skillnaden som **Nej**, inte som godkänd eller dold.

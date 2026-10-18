# R4a — visuell och funktionell granskning enligt §14

Datum: 2026-10-17 · branch `codex/mvp-v2-panel4-checklists-2026-10-16` · jämförd kodbas före samlad leverans: `e7b7b17` (R4a ändringar ännu ocommittade).

## Underlag

- Referens: [`vision_rev02.jpg`](../../../../../../../vision_rev02.jpg), panel 1 (Hem).
- Sparad jämförelse i samma höjd: [`rev02-home-vs-r4a-public-empty.png`](./rev02-home-vs-r4a-public-empty.png).
- Public Home 375×844: [`home-empty-375.png`](./public/home-empty-375.png); review Home med fem dagsrader 375×844 plus separat granskningsbanner: [`home-ready-375.png`](./review/home-ready-375.png).
- Kunskap/Träning, båda 375/430 och public/review: [`public-surfaces/`](./public-surfaces/), [`review-surfaces/`](./review-surfaces/).
- Checklista och otillgänglig träningskälla: [`public-checklist/`](./public-checklist/), [`review-checklist/`](./review-checklist/).
- Funktionshjälp och återgång: [`public-help/`](./public-help/), [`review-help/`](./review-help/).
- Hem/träningsmål och 375/430/667: [`public-training-target/`](./public-training-target/), [`review-training-target/`](./review-training-target/).
- Home 375/430, 667, 140 % CSS-textproxy, reducerad rörelse och navigation: [`public/browser-results.json`](./public/browser-results.json), [`review/browser-results.json`](./review/browser-results.json).

Fixture: syntetisk Golden retriever, 11 veckor. React Native Web, appviewport 375×844 och 430×844; reviewbilden har en separat 32 px fixturebanner ovanför appviewporten. Kort höjd för bekräftat tomt råd mättes till högst 112 px, texten ryms inom två rader. Screenshots inkluderar inte native safe-area- eller systemstatusfält.

## Punkterna 1–18

| # | Bedömning | Evidens och motivering |
|---|---|---|
| 1 | Ja | Tomt råd visar en tydlig handling i kortet, “Öppna dagens checklista”. Ingen duplicerad checklisteknapp visas. Home-knappens destination och återgång testades i båda fixturelägena. |
| 2 | Ja | De tre destinationskorten på Hem har samma format och visuella vikt. Reviewrenderingen visar alla kort minst 16 px ovanför bottenmenyn. |
| 3 | Ej tillämpligt | Hemkortet har ingen raderingshandling. Hanteraren skiljer borttagning av dagens val från rutinradering; inga globala data raderas i detta paket. |
| 4 | Ja | Hemmets dagsrader har ingen kategoriikon eller repetitiva ändra/radera-länkar. En tydlig fördjupning finns via rutinhanteraren och radens detaljvy. |
| 5 | Ja | 375/430-renderingarna visar innehåll ovanför den fasta bottenmenyn; kortet och dess CTA klipps inte. 375×667 och 140 % text får scrolla och verifierades separat. |
| 6 | Ja | Berörda komponenter använder projektets delade tokens och komponenter. `pnpm check` omfattar komponent- och stilregressioner. |
| 7 | Ja | Ikonerna renderas från projektets Ionicons-familj. Hemmets tre destinationer använder Paw/Training/Book-glyfer. |
| 8 | Ja | Jämförelsen visar varm neutral yta, gul tipsaccent, blå/grön/lila destinationsytor samt gröna primärmarkeringar. Porträttetikettens kontrast uppmättes till 14,91:1. |
| 9 | Ja | Kortets lampa markerar rådytan; knapptexten beskriver faktiskt mål; destinationsikon och etikett är samstämmiga. |
| 10 | Ja | Normala dagsrader har inga statusbadges. Review-fixturens bockar motsvarar bekräftade syntetiska värden. Nekad träningskälla visas som okänd och saknar klickbar markering. |
| 11 | Ja | Ingen uppmuntran eller framgångspåstående läggs till utan bekräftad händelse. Reviewbannern är tydligt avgränsad till fixtureläget. |
| 12 | Ja | Tomt/okänt innehåll skiljs från fel och förklaras med vardaglig, sanningsenlig text. |
| 13 | Ja | Copy, metadata och bilder håller kortens hierarki. Tomläge och okänt läge har separata handlingar för checklista respektive hundprofil. |
| 14 | Ja | Home loading/ready/empty/error/unknown, Knowledge tomt råd/artiklar och unknown→dagens checklista, Training rekommenderat/alla/Mina, viktguidens skydd av ändrat utkast, dagslista loading/error samt saknad/otillgänglig träningskälla renderades. |
| 15 | NOT TESTABLE för native | Webbläsarroller, 140 % CSS-textproxy och reducerad rörelse verifierades. Native 44 pt-mätning, VoiceOver, Dynamic Type och iOS/Android-systembeteende kräver enhetsprov. Inget native PASS hävdas. |
| 16 | Nej — full rev02-likhet | **Komposition: Nej.** Sektionernas ordning stämmer, men referensens porträtt/veckoremsa överlappar; aktuell veckoremsa ligger under porträttet. Den större visuella ändringen är uttryckligen uppskjuten som beslutspunkt. **Färger: Ja.** **Typografi: Ja** inom den visuella jämförelsen och tokens. **Komponentformer: Ja** för kort, dagsrader, destinationskort och bottenmeny. **Bildspråk: Nej** för exakt likhet; aktuellt cirkulärt standardporträtt är inte samma beskärning/bildyta som referensen. **Innehållstäthet: Nej** mot den innehållsfyllda målbilden eftersom publicerat Home-råd saknas och public Home visar korrekt tomläge. Review har fem dagsrader. Dessa skillnader är synliga i den sparade jämförelsen. R4a godkänner och verifierar fallbackbeteendet, men levererar inte full visuell rev02-likhet eller publicerat råd. |
| 17 | Ja | Aktiv huvudflik, checklistdestination/återgång, Home→exakt träningsmål/återgång, Loggdatum och Health-undertab vid kontextuell hjälp verifierades. Viktguiden går inte att lämna via help medan ett nytt utkast är ändrat. |
| 18 | Ja | Hem visar hundens namn, ålder/fas och märkt standardporträtt. Hjälpartiklar och råd öppnas via exakt valt innehåll; inga interna version-ID:n visas. |

## Verifieringsgräns

R4a:s funktionella fallback och selectorresor har lokal PASS-evidens. Punkt 16 är **inte** en full visuell PASS mot hela rev02-panelen; främst porträtt/veckoremsans komposition och frånvaron av publicerat råd kvarstår som synliga skillnader. Den senare är korrekt enligt R4a:s fail-closed innehållsgrind. Beslutet om livsfasbaserad remsa/veckohjul ligger kvar för senare, enligt ägarens besked. Live Supabase/RLS, publiceringssystemet, fysisk telefon, VoiceOver, native Dynamic Type och TestFlight är inte provade.

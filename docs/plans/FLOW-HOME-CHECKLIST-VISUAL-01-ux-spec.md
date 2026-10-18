# FLOW-HOME-CHECKLIST-VISUAL-01 — UX-specifikation v3

Datum: 2026-10-18\
Status: v3 godkänd — Architect APPROVE och Critic PROCEED\
Panel: 4 — daglig Checklista

## Användarmål

På Checklista ska hundägaren snabbt kunna läsa och bocka av dagens verkliga aktiviteter, förstå vad rutinpunkterna handlar om och se bekräftade kommande aktiviteter under aktuell ISO-vecka. Listan ska visuellt ha en sammanhållen hierarki och inte visa felaktiga aktivitetsikoner eller klippta flikar.

## Ingång och huvudhandling

Hem → Visa dagens checklista → Idag. Huvudhandlingen är att bocka av en rutinpunkt. Träningsraden öppnar endast sitt exakta, publicerade källsteg. Förhandsvisningen leder till den redan befintliga Kommande-fliken.

## Tillstånd och återkoppling

- **Dagslista redo:** behåll nuvarande aktivitetsmängd, ordning, progress och mutationstillstånd. Pending/fel/okänt och retry stannar synliga på rätt rad.
- **Kommande vecka:** visa sektionen bara när båda befintliga kommande källor är `ready` och minst en verklig post har datum strikt efter `dateKey` och senast `weekDateKeys[6]`. Återanvänd sorterad Kommande-mängd, visa högst tre och visa länken `Visa alla kommande` endast om fler poster finns.
- **Ingen post inom veckan:** visa ingen tom/dekorativ sektion. En post efter veckans sista dag visas endast på full Kommande-flik.
- **Laddning/fel/ofullständig källa:** förhandsvisningen utelämnas medan någon kommande källa är laddande eller felaktig; Kommande behåller befintliga ofullständighets-, fel- och retry-states. Ingen okänd eller tom källa räknas som noll.
- **Rutinikon:** exakt normalisering är `trim`, Unicode NFC, svensk gemenform och kollaps av inre whitespace; ta inte bort diakritik och använd ingen fuzzy match. Tillåtna exakta etiketter/alias: `kiss`, `kissa`, `kisspaus` → pee; `bajs`, `bajsa` → poop; `mat`, `äta`, `mata`, `måltid` → food; `sömn`, `sova`, `vila` → sleep; `promenad`, `gå ut` → walk; `vatten`, `dricka` → water. Exempel nära träff som `kissrunda`, `matskål` och `sov gott` får neutral rutinikon.
- **Radöppning:** synlig generisk `Visa` ersätts av chevron. Öppningens tillgänglighetsnamn ska sanningsenligt säga att rutinen hanteras och vilken punkt som berörs. Ikonen är dold för hjälpmedel när radtexten redan ger dess betydelse; kryss och öppning förblir två separata kontroller.
- **Visuell gruppering:** dagens rutinrader ligger på en sammanhängande varm kortyta med tunna avdelare; kommande poster ligger i en tydlig separat sektion. Återanvänd befintliga home/card/border/radius/spacing-token och kategoriytor; inga nya globala token.
- **Segment:** Idag/Denna vecka/Alla/Kommande fortsätter vara de fyra fungerande valen. Normal text behåller en rad. Vid textskala 140 % radbryts bara Panel 4-segmenten när en rad inte ryms; fullständiga namn visas.

## Tillgänglighet

Kryss- och öppningskontroll förblir separata, minst 44×44 pt, keyboard-tillgängliga och korrekt namngivna. Ikonen för rutinpunkten annonseras inte dubbelt. Alla tabbar har vald-status; aktivering med tangentbord fungerar efter ombrytning. Stor text får ge naturlig scroll, men ingen etikett eller status kapas.

## Avgränsning

Endast Panel 4-presentationen, veckoförhandsvisning från redan inlästa poster, en ren lokal presentationshjälpare för exakta ikonalias, dess tester inklusive policytestets accessibility-assertion, den opt-in segmentlayouten och visuella syntetiska scenarier/evidens. Ingen schema-/API-/query-/RLS-/persistensändring, ingen ny användardata, ingen ny huvudnavigation, inga ändringar i Hemmets `home`-variant eller i andra `Tabs`-konsumenter. De fyra färdiga Panel 4-barnpaketen förblir oförändrade.

## Visuell jämförelse

| Referenselement | Skillnad i v7 | Befintlig komponent/asset | Acceptans |
|---|---|---|---|
| Tät dagslista med ämnessymboler | En fotstegsikon används för olika rutinpunkter | `DailyActivityItem`, `IconChip`, befintliga kategorier | Exakt vitlista ger korrekt symbol; närträff/okänd text blir neutral; ikon dubbelläses inte |
| Dagslista följd av veckoposter | Stor tom nedre yta även när verkliga veckoposter finns | `upcomingRows`, befintlig ISO-vecka och `ListRow` | Bekräftade poster efter idag–söndag visas i egen sektion, max tre + korrekt länk; annars ingen sektion |
| Sammanhållen komposition | Dagsrader ser platta/upprepade ut | Befintliga home/card/divider/spacing-token | En grupperad dagsyta + separat kommande-sektion, kontrollerad i public/review-bilder och alla tillämpliga §14-punkter |
| Kompakt öppningsaffordans | Generisk `Visa`-text upprepas | `DailyActivityItem` action | Chevron behåller minst 44 pt mål och beskrivande tillgänglighetsnamn |
| Segment vid stor text | 140 % klipper sista “g” i vänsterfliken `Idag` | `Tabs` opt-in Panel 4-variant | Alla fyra etiketter hela, valda-status korrekt, keyboard/touch fungerar; andra konsumenter oförändrade |

## Granskning

Plan v3: Architect APPROVE och Critic PROCEED. Den enda utökade skrivvägen är policytestets source-assertion för rutinradernas accessibility-label; ingen produktbeteendeyta ändrades.

## Designkontroller

Jämför public och review vid 375×844, 430×844 och 375×667 samt 375×844/140 %. Gör en ny genomgång av alla tillämpliga punkter 1–18 i `docs/design-rules.md` med motivering för varje svar. Punkt 16 delar upp komposition, färgfördelning, typografi, komponentformer, bildspråk och innehållstäthet. Referensens Logg-val och tre segment är uttryckliga visuella skillnader: behåll Hem-detaljrutten och verklig Kommande-flik och rapportera dem som kvarstående skillnader.

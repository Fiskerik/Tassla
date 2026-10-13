# Oberoende QA — VISION-R02-GESTURES v5

Datum: 2026-10-13 · Omfattning: read-only statisk granskning av geständringarna.

## Resultat

**FAIL** för v5 på grund av saknad spärr i Knowledge-detaljvyer. Browser/native-interaktion är **NOT TESTABLE** i den här miljön. QA körde inga tester och byggde inte om previewn.

| Kriterium | Verifiering | Resultat |
|---|---|---|
| Åldersremsan börjar vid `max(0, aktuell vecka − 3)` och innehåller vecka 0 till aktuell vecka +12 | Statisk granskning av `HomeScreen.tsx` och `home-today.ts` | PASS |
| Fast cellgeometri ger samma extent för listposition och dimning; aktuell markör undantas | Jämförde cellbredd, separator, `getItemLayout` och fade-beräkning | PASS |
| Aktuell ålder ligger kvar i hälsningsraden när markören scrollat bort | Statisk granskning av `HomeScreen.tsx` | PASS |
| Vänstersvep går framåt och högersvep bakåt, utan rundgång | Följde responderns riktning till `nextMainTabDestination` | PASS för mappning; verkligt svep NOT TESTABLE |
| Veckoremsa och alla `Tabs`-varianter signalerar gestspärr från touch-start till end/cancel | Statisk granskning av `HorizontalGestureRegion` och användningarna | PASS statiskt; verklig konfliktlösning NOT TESTABLE |
| Loggs anteckningsfält är undantaget från sidgesten | Granskade placeringen inne i `LogEventEditor` och `BottomSheet` | PASS statiskt; fokus/tangentbord NOT TESTABLE |
| Artiklar och checklistdetaljer behåller detaljflödet | Följde route-gating i `ProductWorkspace` och lokala tillstånd i `KnowledgeScreen` | FAIL |
| Vertikal scroll, tryck, öppna sheets/dialoger | Statisk granskning av trösklar och `BottomSheet` | NOT TESTABLE |
| Public/review-layout, porträttdimning och synlig rörelse | Implementeraren rapporterade endast build/bundling | NOT TESTABLE |

## Fynd

`MainSwipeNavigation` aktiveras bara med `isMainTabDestination(page)`. Kunskapens artiklar och checklistmallar öppnas i interna tillstånd medan `page` fortsatt är `knowledge`. En horisontell sidgest kan därför lämna detaljvyn. Checklistdetaljens lokala flagga skickas inte upp till navigationsgränsen. Faktisk gest kunde inte köras här; route-gating-felet går att fastställa statiskt.

## Begränsningar

Chromium blockerades av crashpad (`setsockopt: Operation not permitted`), eskalerad `file://`-rendering stoppades av adminpolicy (`net::ERR_BLOCKED_BY_ADMINISTRATOR`) och lokal servering av previewn stoppades av `EADDRINUSE` på port 4174. Därför saknas renderade skärmbilder och manuell browser/native-interaktion.

## Nästa steg

Korrigeringsplan v6 ska låta `KnowledgeScreen` rapportera när en artikel eller checklistmall visas som detalj, och `ProductWorkspace` ska då stänga av sidgesten tills användaren går tillbaka till kunskapsöversikten. Architect och Critic granskar exakt v6 före ändring av källkod. Efter korrigeringen krävs ny oberoende QA; browser/native-beteende förblir NOT TESTABLE tills miljön tillåter det.

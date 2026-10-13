# Oberoende QA — VISION-R02-GESTURES v7

Datum: 2026-10-13 · Omfattning: read-only statisk granskning av v7.

## Resultat

**FAIL** för en Knowledge-route-state edge. Checklistans dokumenterade lämna/återvända-lifecycle är statiskt korrekt. Faktiska browser- och native-gester är **NOT TESTABLE**; QA körde ingen automation eller testsvit.

| Kriterium | Statisk verifiering | Resultat |
|---|---|---|
| Öppen artikel eller checklistmall stänger av huvudsidgesten | `KnowledgeScreen` rapporterar `detailOpen`; `ProductWorkspace` använder flaggan för att stänga av `MainSwipeNavigation`. | PASS för normal öppning |
| Tillbaka från artikel/checklistmall återgår till översikten och återaktiverar sidgest | Artikelns Tillbaka rensar artikelvalet. Checklistans Tillbaka rensar `templateId`; översikten rapporterar sedan stängt detaljtillstånd. | PASS statiskt; faktisk interaktion NOT TESTABLE |
| Checklistmall → bottenmeny Hem → bottenmeny Kunskap visar översikten med aktiv sidgest | Sidbytet ändrar `ScreenTransition`-nyckeln och avmonterar `KnowledgeScreen`; dess cleanup rensar flaggan. Återval av Kunskap nollställer fokus och detaljflaggan. | PASS statiskt |
| Översikt och FAQ:s inline-svar behåller huvudsidgesten | `detailOpen` omfattar artiklar och checklistdetaljer, inte FAQ-expansion. | PASS statiskt |
| V5:s veckoremsa och övriga gestskydd ändrades inte i korrigeringen | V7-diffen ändrar inte veckolistans implementation eller `HorizontalGestureRegion`. | PASS statiskt, enligt tidigare v5-granskning |
| Navigering skapar ingen ny innehålls- eller dataskrivning | V7:s statehantering är lokal React-navigation state; ingen skrivfunktion tillkommer. | PASS statiskt |
| Artikel-/checklistdetalj förblir gestspärrad när aktiv Knowledge-flik trycks | Bottenmenyn rensar parent-flaggan även när `page` redan är `knowledge`; då avmonteras inte `KnowledgeScreen`, vars lokala artikel-/malltillstånd finns kvar. | **FAIL** |
| Verkliga svep, visuell rendering och browser/native-prioritet | Ingen interaktion eller skärmbild kunde verifieras i denna körning. | NOT TESTABLE |

## Blockerande fynd

Om användaren står i en Knowledge-artikel eller checklistmall och trycker på den redan aktiva Knowledge-fliken, sätter `ProductWorkspace` `knowledgeDetailOpen` till `false` och rensar `knowledgeFocus`. `page` ändras inte, så detaljvyn avmonteras inte. `KnowledgeScreen` behåller sitt lokala `openedId` eller checklisttillstånd; dess effekt rapporterar inte om samma `detailOpen`-värde igen. Huvudgesten kan därför aktiveras medan detaljvyn fortfarande visas.

Samma mönster finns i visual-check-fixturens `go()`-hanterare.

## Minsta korrigering

Rensa fokus och flagga vid val av Kunskap endast när användaren kommer från en annan sida. Gör motsvarande guard i fixture-hanteraren. Det bevarar Home → Knowledge-reseten och låter en aktiv detalj behålla sin spärr. Om ett tryck på den redan aktiva fliken i stället ska stänga detaljen krävs ett uttryckligt resetflöde för `KnowledgeScreen`.

## Effektfördröjning och begränsningar

`KnowledgeScreen` rapporterar detaljtillstånd via `useEffect`, och checklistan har ytterligare en effekt som rapporterar till KnowledgeScreen. Det kan ge en kort fördröjning, men är inte statiskt belagt som blockerande och v7 kräver inte uttryckligen synkron rapportering. Verklig timing är **NOT TESTABLE** här. Koordinatorn rapporterade tidigare typecheck, lint, byggen, diffkontroll och kövalidering som godkända; dessa körningar upprepades inte av QA.

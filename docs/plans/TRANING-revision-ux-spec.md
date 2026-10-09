# TRÄNING – UX-specifikation

## Användaruppgift och entry point

Ägaren ska kunna förstå veckans träningsfokus, se progression och markera nästa steg utan att känna att en markering betyder att hunden behärskar beteendet. Träning öppnas via befintlig bottennavigation eller befintlig Hem-rad.

## Happy path

1. Appbaren visar tillbaka till Hem och rubriken Träning.
2. Tabs visar Valpprogram, Alla övningar och Mina mål; Valpprogram är aktivt när publicerade program visas.
3. HeroCard visar veckans fokus och befintlig programtext som hero/platshållare när foto saknas.
4. Progress visar genomförda steg av totalt antal.
5. Användaren öppnar övningarna och markerar nästa steg i checklistan. Den aktuella handlingen är den enda primära kontexten.

## States

- Loading: befintligt överordnat flöde visar laddningsläge innan programdata är klar.
- Normal: HeroCard, progress och checklistor för publicerade program.
- Empty: inga publicerade program, inga steg eller tabs utan befintligt innehåll visar EmptyState utan att hitta på träningscontent.
- Error/offline: befintligt ErrorState-/retryflöde visar varför programdata eller en write inte kunde bekräftas.
- Pending: endast aktuellt steg blockeras och visar “Sparar…”.
- Saved: bekräftelse visas först efter lyckad write; ingen permanent statusetikett sätts på normala steg.
- Unsure/failed: befintlig copy ber användaren läsa in igen eller försöka på nytt utan att hävda att steget sparats.

## Feedback och a11y

ChecklistItem har text, ikon, checked/disabled-state och tryckyta. Tabs exponeras som tablist/tab med vald state. Progress exponeras som progressbar. Hero och listor använder tokens och klarar större text. Ingen ny animation införs.

## Avgränsningar och avvikelser

Ingen ny träningslogik, publicerat content, schemaändring eller navigation införs. Bildfält saknas i befintligt programkontrakt; HeroCard används därför som lugn färgad hero/platshållare. “Alla övningar” och “Mina mål” får inte uppfinna innehåll när befintligt dataflöde saknar det. Visuell status: **NOT TESTABLE** tills skärmdumpar finns.

# KUNSKAP – UX-specifikation

## Användaruppgift och entry point

Ägaren ska kunna hitta en relevant publicerad guide, artikel eller checklista och snabbt förstå vad den handlar om innan texten öppnas. Kunskap öppnas via befintlig navigation eller från Hem.

## Happy path

1. Appbaren visar tillbaka till föregående vy och rubriken Kunskap.
2. Tabs filtrerar befintligt innehåll: För dig, Artiklar, Checklistor och FAQ.
3. Första innehållet visas som stort feature-kort med rubrik, kort ingress och lästid/metadata.
4. Övrigt innehåll visas i två kolumner med kort och högst två rader förklarande copy.
5. Tryck på ett kort öppnar den befintliga detaljtexten och källorna.

## States

- Loading: skeleton för feature-kort och kortgrid.
- Ready: publicerat innehåll från befintligt content-API.
- Empty: aktiv flik förklarar lugnt när inget publicerat innehåll finns.
- Error/offline: ErrorState med återförsök; inget innehåll påstås finnas när hämtningen misslyckas.
- Source feedback: befintlig feedback används endast efter att användaren försökt öppna en säker extern källa.

## A11y och ton

Tabs exponeras som tablist/tab med vald state. Kort är knappar med rubrik och innehållstyp i label. Featurebilden är dekorativ platshållare och kompletteras av text. Listcopy begränsas till två rader; detaljerad text finns först efter tryck. Inga partnerstyrda eller kliniska råd introduceras.

## Avgränsningar och avvikelser

Content-API, källvalidering, detaljparser och navigation återanvänds. Modellen saknar contentbilder och lästid, därför används befintlig Tassla-bild som platshållare och en neutral läsmetadata utan att påstå faktisk lästid. FAQ får empty-state om inga FAQ-poster finns. Inget nytt bibliotek, sökfält, partnerinnehåll eller schema läggs till. Visuell status: **NOT TESTABLE** tills skärmdumpar finns.

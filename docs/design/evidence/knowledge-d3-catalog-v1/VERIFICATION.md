# D3 faschecklistor — verifiering

Datum: 2026-10-26
Branch: `knowledge/d3-catalog-delivery`
Plan: `docs/tasks/dev/KNOWLEDGE-PHASE-CATALOG-01.md` v9

## UI och tillgänglighet

`browser-results.json` innehåller **128 PASS, 0 FAIL och 0 browser page errors** från den senaste lokala React Native Web-körningen. Den kontrollerar alla sex fasdetaljer vid 375 och 430 px: bannerhöjd och laddad bild, horisontell overflow, progressändring/återställning, endast synliga numrerade källänkar, inga synliga referensetiketter/titlar/URL:er, tillgängliga källnamn, 44×44 pt länkmål samt att sista länken kan scrollas ovanför den fasta bottenmenyn. Bottom-fångsten behåller nu den scrollposition där länkarna syns. Testflöden täcker också tom katalog, read-error med retry och att en ofullständig katalog inte faller tillbaka till lokala review-fixtures.

UI Critic gav tidigare **PASS** för samtliga sex hundansikten vid 375/430 px och v8:s 0-gap-justering. Efter ägarens senaste önskemål tog v9 bort kontrollernas extra sidpadding: märkena ligger nu kant i kant samtidigt som varje länk behåller minst 44×44 pt. Oberoende QA och frozen Reviewer gav **PASS** på v9:s 375 px-bild: numren är läsbara, länkarna ligger nära varandra och raden lämnar synligt fritt utrymme ovanför footern. UI Critic noterade i sin tidigare granskning att målytan bekräftas av verifieraren och kodinspektion, inte enbart av skärmbilden.

Sparade bilder:

- `checklist-public-375.png` — publicerat katalog-fixtureläge.
- `checklist-public-phase-bottom-8_12_weeks-375.png` — uppdaterad vy där länkarna syns efter scrollning.
- `checklist-public-detail-375.png` — tidigare 0-gap render som UI Critic granskade.
- `checklist-review-375.png` — separat uttryckligt review-fixtureläge.
- `browser-results.json` — senaste körresultat och avgränsning.
- `results.json` — föregående körresultat.

Detta är syntetisk webbevidens, inte native VoiceOver/TalkBack, Dynamic Type eller en iPhone/TestFlight-körning.

## Innehåll, adapter och SQL-underlag

- Dog Expert gav **PASS** på exakt sex introtexter, de 18 punkterna och deras källmappning. Koordinatorn öppnade de officiella sidorna; experten granskade de kontrollerade utdragen. Det är inte veterinärsignoff.
- `python -X utf8 tools/validate_knowledge_catalog.py` passerar och kontrollerar sex faser, 18 stabila punkter, sju källor, review-hash och att båda SQL-filerna exakt motsvarar de importerade fälten/URL:erna från den granskade JSON-filen. Ett test ändrar en inbäddad SQL-rad och verifierar att kontrollen avvisar den.
- Architect och Security gav fokuserad statisk **PASS** efter rättningar av publication-scriptets `DECLARE`, dubblett-/saknad-radsvakter och SQL/JSON-paritet.
- `pnpm check` **PASS**: TypeScript, edge TypeScript, ESLint och samtliga **85 testfiler**. Det omfattar adapter-, cache-, skriv- och UI-regressioner.
- Appadaptern läser endast mappade publicerade versioner och deras barnrader; tom katalog, partiell data, cacheidentitet och public/review-separation täcks av fokuserade tester.
- Review-channel `pnpm bundle:ios` **PASS**: Expo exported the iOS JavaScript bundle and assets to `dist/ios` after the content-channel guard passed. This verifies bundling only, not signing, simulator/device installation or TestFlight behavior.

Disposable PostgreSQL **16.15** kördes isolerat med `--network none`, utan host ports, med read-only repository mount och en lokal auth-stub för syntetiska ägarfixturer. Före skripten passerade `python -X utf8 tools/validate_knowledge_catalog.py`. Körningen applicerade foundation, puppy-checklist, content-origin, custom-icon och knowledge-catalog migrations; passerade foundation-, puppy-checklist-, custom-icon- och knowledge-catalog SQL-proberna; körde draft-import två gånger; bekräftade att en ändrad granskad titel avvisas; återställde innehållet; publicerade separat och passerade published-only RLS/owner-data-proben i en rollbackad transaktion. Containern togs bort efteråt. Denna körning verifierar inte live Supabase eller produktionsdata.

## Ej verifierat

Ingen migration, import, publicering, RLS-readback eller annan operation har körts mot live Supabase. Inget nytt användarinnehåll har publicerats. Fjärrstatus är okänd.

Oberoende QA och frozen Reviewer gav **PASS** på v8 och en fokuserad **PASS** på v9:s ändrade filer, länkmål och uppdaterade scrollade bild. Native iPhone/TestFlight, VoiceOver/TalkBack och Dynamic Type är inte verifierade av RN Web-evidensen.

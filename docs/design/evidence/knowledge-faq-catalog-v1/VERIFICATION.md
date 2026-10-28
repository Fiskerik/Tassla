# KNOWLEDGE-FAQ-CATALOG-01 — verifiering

Datum: 2026-10-28. Branch: `knowledge/d3-catalog-delivery`. Bas: `150d6bbbf1adf66677b343cfdd154eb568d07aeb`. Lokal verifiering, UI Critic, oberoende QA och Frozen Reviewer är klara. Reviewer gav PASS utan fynd efter rättning av fliken som tidigare klipptes.

Detta är en avgränsad leverans av fyra källspårade FAQ-svar för Kunskap. [Jämförelsen med panel 7](panel7-faq-comparison.png) visar närmaste Knowledge-referens tillsammans med FAQ-renderingen före och efter lila expanderad yta. Panel 7 innehåller inte en FAQ-detaljvy; FAQ-bedömningen använder därför även den godkända stödskärmsspecifikationen `KNOW-02-checklists-faq-ux-spec.md`. Jämförelsen godkänner inte hela panel 7.

## Resultat

- Dog Expert gav `PASS WITH CONDITIONS` för exakt payload SHA `170d70410e1a7bf121fc7ef16c338d4eb79e7f023fd3ba4c3f96cc5661cd3288`. Inga copyändringar återstår. Granskningen använde koordinatorns verifierade källsammanfattningar; experten öppnade inte URL:erna själv. Det är inte veterinärsignoff.
- `CI=1 pnpm check`: PASS på slutlig kod — TypeScript, edge TypeScript, ESLint och 100/100 testfiler.
- `python tools/validate_knowledge_faq.py`: PASS — fyra FAQ-versioner, sex källor, granskad digest och parity mellan JSON/import-/publicerings-SQL. Python-kompilering och `git diff --check`: PASS.
- [Körloggen för disposable PostgreSQL-proben](postgres-probe.log) visar PostgreSQL 16 med syntetiskt schema/roller: D3-migrationssekvens, import två gånger, payloaddrift avvisad, separat publicering två gånger och published-only/RLS/owner-data-prob med rollback: PASS. Oberoende QA granskade loggen och godkände den dokumenterade syntetiska körningen. Loggen saknar exakta shell-/psql-kommandon, metod för tampering och minorversion; körningen är därför inte helt reproducerbar från artefakten. Den provar inte trusted-role-guarden eller live Supabase/RLS.
- [Public RN Web-resultat](results.json): 152/152; [review RN Web](results.json): 62/62; noll browserfel. Täcker 375/430 px, 375×667 med 140 % CSS-textproxy, FAQ:s public/review/empty/error, källnavigation, tillbakaflöde och 44×44 px webbträffytor. Alla tre kontextflikar är hela vid 375/430 px; vid 140 % text kontrolleras horisontell scroll till sista fliken.
- UI Critic REVIEW: PASS för avgränsad FAQ-komponent och reviewer-driven flikrättning; ingen full panel-7-paritet påstås. Statisk Security-granskning: inga blockerande fynd. Före eventuell livepublicering ska målgruppens FAQ-katalog inventeras: publiceringsskriptet kontrollerar de fyra kända slugs men avvisar inte en orelaterad redan publicerad FAQ-root globalt. Oberoende QA: PASS efter flikrättningen; den bekräftar att scrollen når sista fliken vid 140 % text. Slutlig scope audit: 34 ändrade paths inom 36 deklarerade; kövalidering, Python-kompilering och git diff --check PASS. Frozen Reviewer PASS utan fynd. Granskaren öppnade jämförelsebilden och alla sex slutbilder; se nedan för status och begränsningar.

Renderbilderna är lokala RN Web-fixturer med syntetiska katalograder, inte produktionsdata. Ändringen har inte importerats eller publicerats i en live-databas. Live Supabase/RLS, faktisk publicering, native VoiceOver/TalkBack, Dynamic Type på enhet och iPhone är **NOT TESTABLE** här.

## Skärmbilder

- [FAQ vid 375 px](public-faq-375.png)
- [FAQ vid 430 px](public-faq-430.png)
- [Kort vy, 375×667 med 140 % CSS-textproxy](public-faq-short-375x667-140.png)
- [Review-fixture](review-faq-375.png)
- [Publikt tomläge](public-faq-empty-375.png)
- [Publikt felläge](public-faq-error-375.png)

## Designregler §14

| Nr | Status | Evidens och motivering |
|---|---|---|
| 1 | Ja | FAQ-frågor expanderas inline; primär läshandling är tydlig. |
| 2 | Ja | Kontextvalen är jämbördiga; numrerade källor har samma träffyta. |
| 3 | NOT TESTABLE | FAQ-vyn har ingen raderingshandling att granska. |
| 4 | NOT TESTABLE | Inga Hem-rader ingår i denna slice. |
| 5 | Ja, RN Web | 375/430 px och kort 375×667/140 % utan horisontellt overflow; native safe area är inte testad. |
| 6 | Ja | FAQ återanvänder befintliga tokens, Tabs, MotionPressable och delade knappar/kort. |
| 7 | Ja, RN Web | Fråge- och chevronikoner använder installerad Ionicons-familj; ikonernas stöd och hjälpmedelsnamn kontrolleras i rendern. |
| 8 | NOT TESTABLE | Rendern visar Kunskapens lila FAQ-yta och neutrala kort, men färgkontrast mättes inte. |
| 9 | Ja | Frågetext, expandera/dölj-status, numrerad markör och länkmål beskriver samma handling. |
| 10 | Ja | Inga obekräftade progress- eller statusbadges visas. |
| 11 | NOT TESTABLE | FAQ-vyn innehåller ingen banner/uppmuntring att bedöma. |
| 12 | Ja | Copy är kort, neutral och utan hundnamn eller könade hundpronomen. |
| 13 | Ja inom FAQ-kontraktet | Fråga, svar och kompakta källnummer har tydlig hierarki. |
| 14 | Ja | Public, review, empty, error och retry renderades. |
| 15 | NOT TESTABLE overall | RN Web verifierade roller/namn, 44×44 px källträffytor och 140 % CSS-textproxy. Native skärmläsare, fysisk Dynamic Type och native motion testades inte. |
| 16 | Ja för FAQ-komponenten; full panel 7 ej bedömd | Se uppdelningen nedan och jämförelsebilden; panel 7 saknar FAQ-detaljvy. |
| 17 | Ja, RN Web | Kontextvalen visas hela vid 375/430 px; horisontell scroll till sista kontext kontrolleras med 140 % textproxy. Expandera/dölj, returnavigering och huvudflik verifierades. |
| 18 | Ja | Redaktionellt innehåll förblir generellt; inget hundnamn, hundpronomen eller individuellt hundinnehåll infördes. |

### §14.16 — visuella dimensioner för FAQ-komponenten

| Dimension | Status | Jämförelse |
|---|---|---|
| Komposition | Ja inom stödskärmskontraktet | Frågor ligger under sammanhangsval; expanderat svar och numrerade källor följer frågan. |
| Färgfördelning | Visuell bedömning PASS; kontrast NOT TESTABLE | Kunskapens lila val-/expanderingsyta skiljer sig från grön primär- och felstatus; kontrastmätning saknas. |
| Typografi | Ja inom kontraktet | Vänsterställda fråge- och svarstexter har tydlig vikt- och storlekshierarki. |
| Komponentformer | Ja inom kontraktet | Expanderbara mjukt rundade kort och små, numrerade källlänkar följer befintligt designsystem. |
| Bildspråk | Ej tillämpligt | FAQ-svaret använder ingen artikelbild; det finns inget FAQ-bildkrav i stödskärmskontraktet. |
| Innehållstäthet | Ja inom kontraktet | Fyra avgränsade frågor; källor visas endast som kompakta nummer. Fulla titlar finns i hjälpmedelsnamn. |

Full Knowledge-panelparitet, native iOS/Android och produktionsdata är inte godkända av denna komponentgranskning.

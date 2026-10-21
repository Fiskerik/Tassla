# FLOW-KNOWLEDGE-01 — renderings- och acceptansrapport

Datum: 2026-10-21 · Gren: `codex/dog-profile-search-pilot` · HEAD: `a57e17388d380800c6a378b6368babe6877b4f1c` · Plan: v5

Detta är en lokal arbetskoppecheckpoint; ändringarna är ännu inte commit:ade. Skärmbilderna kommer från separata React Native Web-byggen med syntetiska fixturedata.

## Visuell jämförelse

Panel 7 i [vision_rev02.jpg](../../../../vision_rev02.jpg) sätter grammatiken för Kunskapens rotvy: sökning, ett framhävt innehållskort och mindre kort. Den nya vyn behåller denna kortordning och placerar sökningen direkt under rubriken. Jämför [Knowledge 375×844](public/knowledge-public-375x844.png), [430×844](public/knowledge-public-430x844.png), [375×667](public/knowledge-public-375x667.png) och [ingångarna till FAQ/Checklistor](public/knowledge-public-shortcuts-375x844.png).

En full panelmatchning är inte uppnådd. Referensen visar ämneschips; de renderas inte eftersom repot saknar beslutad runtime-taxonomi och inventariets innehållskategorier är fortfarande `proposed`. Sökfältet är den godkända produktresan, medan panelbildens exakta innehåll och bilder inte finns som publicerade assets. FAQ och Checklistor är stödyte-extrapolationer eftersom panel 7 saknar färdiga kompositioner för dem.

I FAQ-vyn har reviewexemplen fått synliga kontextkort, semantiska ämnesikoner och expanderbara frågerader. Svaret ligger i en egen yta som skiljer sig från frågan. Sidhuvudet ger den enda FAQ-rubriken, utan en upprepad sektionsrubrik. Publicläget visar ett tomläge utan kontextval. Se [FAQ-svar 375×844](review/faq-review-expanded-375x844.png), [430×844](review/faq-review-expanded-430x844.png), [375×667](review/faq-review-expanded-375x667.png) och [publikt tomläge](public/faq-public-empty-375x844.png).

Checklistöversikten skiljer sparad kontext, rekommenderad fas, övriga faser och bekräftad progress åt. Detaljen grupperar uppgifter, avgränsar rader tunt och lägger semantiska ikoner intill befintliga checkboxar; egna punkter får ingen påhittad ämnessymbol. Dessa vyer använder tokens och kortfamilj från appen och lånar den kompakta radgrammatiken från panel 4. Se [översikt 375×844](review/checklist-review-overview-375x844.png), [430×844](review/checklist-review-overview-430x844.png), [375×667](review/checklist-review-overview-375x667.png), [detalj 375×844](review/checklist-review-detail-375x844.png), [430×844](review/checklist-review-detail-430x844.png), [375×667](review/checklist-review-detail-375x667.png) och [publikt tomläge](public/checklist-public-empty-375x844.png).

De tre vybredderna är renderade och granskade. Innehåll som överstiger 375×667-vyn fortsätter genom vertikal scroll; verifieraren hittade inget horisontellt överflöde. Det är en layoutkontroll, inte en systematisk tillgänglighetsgrind.

## Designregler §14 — relevant checklista

Bedömningen gäller denna lokala kodversion och de länkar/viewportar som anges ovan. Panel 7 är den direkta jämförelsen för Kunskapens rot; FAQ och faschecklistor saknar egna målkompositioner i visionen. Panel 4 används endast som närmaste radmönster för checklistans detalj. Ingen del av denna syntetiska körning bevisar live publicerat innehåll.

| §14 | Status | Bedömning och bildbevis |
|---|---|---|
| 1. En primär handling och tydlig nästa handling | Ja | Knowledge erbjuder sök och två tydliga destinationskort; FAQ-rad öppnar/stänger svar; checklistkort öppnar fasdetalj. [Knowledge](review/knowledge-review-375x844.png), [FAQ](review/faq-review-expanded-375x844.png), [checklistdetalj](review/checklist-review-detail-375x844.png). |
| 2. Jämställda handlingars visuella vikt | Ja | Kontext- och fasval presenteras som likvärdiga kort med konsekvent format. [FAQ-kontekster](review/faq-review-375x844.png), [fasöversikt](review/checklist-review-overview-375x844.png). |
| 3. Radering skiljs från normal handling | Ej tillämpligt | FAQ har ingen radering. Anpassad checklistpunkts befintliga redigering/radering och bekräftelseflöde ändrades inte; denna UI-slice inför ingen ny raderingshandling. |
| 4. Hemrader och hanteringsväg | Ej tillämpligt | Ändringen gäller Kunskap, inte Hemmets aktivitetsrader. |
| 5. Avstånd, sektioner och fri marginal | Ja, webblayout | 375×844, 430×844 och 375×667 är renderade; vertikal scroll används och verifieraren fann inget horisontellt överflöde. Native safe-area-insets har inte verifierats. Exempel: [FAQ 375×667](review/faq-review-expanded-375x667.png), [checklista 430×844](review/checklist-review-detail-430x844.png). |
| 6. Delade tokens och komponenter | Ja | Ytor och avstånd använder befintliga tokens och `Card`, `ChecklistItem`, `Progress` samt delad lokal `KnowledgeIconBadge`; ingen ny stylingdependency infördes. |
| 7. Enhetlig ikonfamilj och verifierade symboler | Ja | Använda badges mappar uttryckligen stödda ID:n till Ionicons; egna checklistpunkter får ingen påhittad ämnessymbol. [FAQ](review/faq-review-expanded-375x844.png), [checklistrader](review/checklist-review-detail-375x844.png). |
| 8. Färgfördelning enligt referensen | Nej, delvis avvikelse | Roten har varm grund och lila/gröna accenter, men saknar panel 7:s ämneschips och deras blå/gröna/lila fördelning. Den renderade färgfördelningen är därför inte en full panelmatch. [Panel 7](../../../../vision_rev02.jpg), [Knowledge](public/knowledge-public-375x844.png). Hemmets särskilda genvägsfärger är inte tillämpliga på dessa Kunskapsskärmar. |
| 9. Symbol, etikett och handling stämmer | Ja | FAQ-kontexter, Checklistor och fas-/ämnesbadges använder explicita semantiska ID-mappningar; klickmål och text beskriver respektive val. |
| 10. Inga överflödiga statusmärken; progress är bekräftad | Ja | Checklistprogress baseras på bekräftad läsning och kontrollen visar 1 av 4 klara; publict tomläge visar inga låtsasval eller progress. [Reviewdetalj](review/checklist-review-detail-375x844.png), [publikt tomläge](public/checklist-public-empty-375x844.png). |
| 11. Banners och uppmuntran är sanningsenliga | Ja | Publicvyer visar inte reviewcopy. Reviewvyer märker exemplen uttryckligen som tillfälliga och ej sakgranskade; ingen framgång eller faktisk publicering påstås. |
| 12. Vardaglig och korrekt svensk copy | Ja | Frågor, svar och uppgiftsrubriker är svenska. Reviewexempel har en tydlig sakgranskningsetikett och inga interna driftinstruktioner. |
| 13. Copy, metadata och bildandelens hierarki | Ja inom visad fixture | FAQ-fråga och svar har separata ytor; checklistan prioriterar rekommenderad fas och bekräftad progress. Detta bedömer bara den syntetiska visningen, inte produktionsinnehållets redaktionella kvalitet. |
| 14. Relevanta loading/empty/error/partial/sparlägen renderade | Ja | Public FAQ/checklist-tomlägen samt review FAQ, loading, error, pending/unknown, progress och reconciled-state finns i browser-manifestet. [Public FAQ](public/faq-public-empty-375x844.png), [public checklista](public/checklist-public-empty-375x844.png), [reviewfel](review/checklist-error-375.png), [pending](review/checklist-uncertain-375.png), [reconciled](review/checklist-remount-reconciled-375.png). |
| 15. Systematisk tillgänglighetsmatris | Ej tillämpligt | Enligt ägarbeslutet 2026-10-21 skjuts denna grind upp till efter att första MVP-versionen har släppts och godkänts. Befintliga etiketter och semantik är bevarade; ingen 140 %- eller skärmläsarmatris ingår. |
| 16. Matchning mot rev02 | Nej som full acceptans; se separat bedömning nedan | Syntetiska public/review-renders jämfördes sida vid sida med panel 7. FAQ- och checkliststödets egna kompositioner finns inte i referensen. |
| 17. Rubriker, föräldraflik och returvägar | Ja | Browserresan verifierar Knowledge → FAQ/checklista → Knowledge och Training → Knowledge → guide → Training. FAQ visar nu endast AppBar-rubriken, utan en andra identisk innehållsrubrik. |
| 18. Hundnamn, bildroll och relevant innehåll | Ja för aktivt hundscope | Sökningen visar aktiv hunds namn och filtrerar inom dess scope; syntetiskt innehåll är markerat som reviewexempel. Bildhänvisningar: [Knowledge public](public/knowledge-public-375x844.png), [Knowledge review](review/knowledge-review-375x844.png). Live-relevans är inte verifierad. |

### §14.16 — separata rev02-dimensioner

| Dimension | Status | Jämförelse |
|---|---|---|
| Komposition | **Nej** | Panel 7 har sök, ämneschips, ett framhävt kort och mindre artikelkort. Den implementerade roten har sök, framhävt kort och mindre kort, men inga chips. FAQ/checklista saknar egna referenskompositioner. Se [panelen](../../../../vision_rev02.jpg) och [Knowledge-render](public/knowledge-public-375x844.png). |
| Färger | **Nej** | Panelens chips använder tydligt blått, grönt och lila samt varm accent; den aktuella Kunskapsroten saknar chipytorna och fördelar accenter annorlunda. Stödskärmarna har konsekventa appfärger men de är inte självständigt godkända mot en panel. |
| Typografi | **Ja för hierarki** | Rubrik, hjälplabel, korttitel och metadata använder appens typografitokens med motsvarande storleksordning och viktsteg som panel 7; FAQ-/checklisttypsnitt saknar ett direkt panelmål. Se [Knowledge 375×844](public/knowledge-public-375x844.png) och [430×844](public/knowledge-public-430x844.png). |
| Komponentformer | **Ja för återanvända former** | Avrundade redaktionella kort och separata rader följer kortgrammatiken i panel 7 och panel 4. FAQ-svar är en separat yta; checklistans dividerade rader och kontroll återanvänder befintlig `ChecklistItem`. Det innebär inte att stödsidornas hela komposition är panelgodkänd. |
| Bildspråk | **NOT TESTABLE för produktionsmatchning** | Screenshots visar lokala/syntetiska exempelbilder; de bevisar inte att rätt publicerade artiklar, urval eller beskärningar kopplas i produktion. FAQ och checklistor har inget eget referensbildspråk i visionen. |
| Innehållstäthet | **Ja för panel 7-roten** | En framhävd artikel och mindre artikelkort återger panelens antal/hierarki; vid 375×667 fortsätter övrigt innehåll med vertikal scroll. Ämneschipsens frånvaro är fortsatt en separat kompositionsavvikelse. Stödvyerna kan inte godkännas på denna paneldimension. |

Samlad visuell status är **DELVIS**, inte full rev02-acceptans. Den godkända sök-/kortresan samt återanvända former och typografihierarki finns lokalt. Panel 7:s chips/färgfördelning återstår, produktionens innehålls- och bildkoppling är ej testad, och FAQ/checklist är stödyte-extrapolationer.

## Körningsidentitet

- Public: 31/31 browserkontroller PASS, 10 skärmbilder; `browser-results.json` anger verifierad överensstämmelse mellan filen som serverades och `/tmp/tassla-knowledge/public/know02/know02-app.js`. SHA-256: `95cb34b35aee3c919daeb0ab62702f91a8a1c2e805283acfa9e1ced387947d02`.
- Review: 68/68 browserkontroller PASS, 28 skärmbilder; serverad fil och `/tmp/tassla-knowledge/review/know02/know02-app.js` matchar. SHA-256: `f7dcb6f166e6aeed95cc33311c4c9d3469dbbccc3f3fd9daa038b681b41b182d`.
- Public och review kördes separat på `127.0.0.1:4283` och `127.0.0.1:4284`. Varje bilds route/state, fixture och viewport finns i respektive manifest. `build ID: ej skapad` — detta är en webbförhandsvisning, inte en paketerad signerad app.

## Acceptansstatus

- **Kod:** PASS för den lokala FLOW-KNOWLEDGE-01-slicen.
- **Lokal QA:** PASS på korrigerad version. Oberoende QA körde riktade tester 5/5 och `pnpm check` 65/65; den inspekterade också FAQ-bilder, samtliga manifestposter och att hashes matchar buildfiler. QA-miljön blockerade egen localhost-åtkomst; koordinatorn körde public/review browserresorna på dessa exakta builds och fick 31/31 respektive 68/68, noll checklist-I/O i public och inga browserfel. QA redovisar därför sin nätverksgräns i uppgiftsrapporten.
- **Oberoende Reviewer:** PASS efter korrigering av den dubblerade FAQ-rubriken, kömetadata och saknad §14/§14.16-dokumentation. Reviewer bekräftade skärmbilden, bundle/manifests och att öppna acceptansstatusar hålls åtskilda.
- **Live innehåll, Supabase och RLS:** NOT TESTABLE här. Public- och reviewbilderna använder syntetiska fixtureposter; de bevisar inte verklig publicering eller databaspolicy.
- **Native:** NOT TESTABLE i React Native Web-förhandsvisningen.
- **Visuell acceptans:** DELVIS. FAQ och Checklistor har en tydligare och konsekvent kort-/ikonhierarki. Panel 7:s fulla rotvy-match och godkännande av de extrapolerade stödytevyerna återstår.
- **Signerad build och release:** EJ SKAPADE.

## Exakt samlad implementationcommit — 2026-10-21

Public och review verifierades på `codex/dog-profile-search-pilot`, commit `c3eedd5e4da14e36789963d3fe352a28d8dca56b`: public 31 PASS och review 90 PASS, noll browserfel. Denna körning täcker aktuella FAQ-/checklist-/guideflöden och sparar captures, resultat samt exakta bundle- och verifieraridentiteter i [public](../ui-checkpoint-c3eedd5/knowledge/public/) och [review](../ui-checkpoint-c3eedd5/knowledge/review/). Visuell status är fortsatt DELVIS; tidigare 68/68-run är historiskt testresultat, inte denna checkpoints resultat.

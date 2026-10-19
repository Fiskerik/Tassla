# FLOW-LOG-01 — verifiering av Logga-kalender

Datum: 2026-10-20
Plan: v5, godkänd av Architect och UX Critic
Status: Kod och lokala tester PASS. Paketets visuella acceptans är öppen eftersom renderad matris och §14-underlag är NOT TESTABLE i miljön. Reviewer inväntar QA-godkänd helhet; slutlig Security-granskning pågår.

## Levererat i kodcheckpointen

- Datumkontrollen öppnar befintlig BottomSheet med svensk månad, måndag först, valbar historik, dagens markering, loggprickar och spärrade framtidsdagar/månader.
- Kalenderdagar har minst 44 pt bredd och höjd. Källmått för 360 pt viewport: BottomSheet 16 pt marginal per sida, kalenderkort 8 pt per sida; grid 312 pt, alltså cirka 44,57 pt per dag. Detta är token-/källaritmetik, inte uppmätt renderad geometri.
- Markörer hämtas i cloud-läge för aktiv hund via befintlig autentiserad Supabase-klient och befintlig RLS. Queryn returnerar endast occurred_at, filtrerar LOG_EVENT_TYPES, använder lokala halvöppna månadsgränser och rå timestamp-keyset. Resultatet visas först efter full traversal.
- Separata tillstånd finns för laddning, tom månad och läsfel med återförsök. Dagval är tillgängligt även när markörläsningen misslyckas.
- Bekräftad lokal add/edit/delete/undo invaliderar och startar ny markörläsning när kalendern är öppen. Konto-/hund-/månad-/tidszonscope, requestgeneration, abort och sena svar är skyddade i workspace-koden.
- Kiss har Logga-specifik amber-token och egen dropp-/markikon. Hemmets generella Kiss-token är oförändrad, Vatten behåller blå water-outline och Olycka behåller röd kategori. Snabbknappens tryckläge använder kontur; Logga-tidslinjen använder selectedSurface utan opacity. Vanlig ListRow är oförändrad.

## Lokala kontroller

| Kontroll | Resultat |
|---|---|
| Riktade modell-, query- och policytester | PASS, 16/16 |
| Queryns hundscope, eventtyper, lokala månadsgränser och occurred_at-only URL | PASS mot installerad Supabase/PostgREST-klient med syntetisk fetch |
| Lika tidsstämplar vid sidgräns, exakt rå mikrosekundcursor, in-flight abort, mutation mellan sidor och ny traversal efter ändring före cursor | PASS i riktade tester |
| Kalenderdagarnas 44 pt-källgeometri vid 360 pt | PASS i stil-/tokenaritmetik; faktisk renderad geometri NOT TESTABLE |
| Kontrast från faktiska tokens | PASS: Kissikon 5,38:1; Vattenikon 4,97:1; Olyckaikon 6,15:1; tidslinjetext på selectedSurface 11,95:1 |
| Källstruktur för scope-skydd, stängningsabort och refresh efter bekräftad mutation | PASS som policytest/källgranskning; komponentintegrationsrace är inte renderat |
| pnpm check | PASS: typecheck, edge-typecheck, ESLint och 599/599 tester |
| Publik iOS JavaScript-bundle | PASS: public content guard, 1 449 moduler |
| git diff --check | PASS; endast LF→CRLF-varningar från Git på två befintliga filer |
| python -X utf8 tools/dev_flow.py validate | PASS |

## QA-resultat och kvarstående bevis

Oberoende QA första varvet identifierade att kalenderdagarna saknade minWidth och att viktiga cursor-/racefall saknade regressionstest. Korrigering 1 lade till 44 pt minWidth, minskade endast kalenderkortets horisontella padding inom godkänd plan v5 och lade till testerna ovan. Omtestningen bedömer kod och tester som PASS. Paketets sammanlagda acceptans är ändå inte godkänd: den uttryckliga responsiva renderingsmatrisen och designregelverkets visuella §14 saknar bildbevis. Ingen rendering eller komponentintegration har fabricerats.

Renderingsinventering: node_modules saknar react-native-web, react-dom, react-test-renderer, Playwright, Puppeteer och bildrenderare. Ingen ny dependency har lagts till. Användaren bad att inte styra datorn; därför har ingen CUA-/desktopstyrning använts.

| Visuell/QA-kontroll | Resultat |
|---|---|
| RN Web-responsiv render vid 360/375/430 px, normal och 140 % text; kalender med markörer, tom/laddning/fel, vald dag, historik, snabbval, Olycka och Vatten | NOT TESTABLE: renderer saknas |
| Gråskalejämförelse av Kiss/Vatten-symboler vid verklig komponentstorlek och 140 % text | NOT TESTABLE: bildrenderare saknas |
| AppScreen-scrollbottenmarginal mot bottenflik vid 360/375/430 px | NOT TESTABLE: kräver faktisk layout/render |
| Sida-vid-sida-jämförelse mot Logga-panelen i vision_rev02.jpg | NOT TESTABLE här; fullskärmsmatchning förblir separat öppen |
| Live RLS med två syntetiska ägare/hundscope samt anon denial | NOT TESTABLE: ingen godkänd Supabase-testmiljö; ingen backend kontaktades |
| Native Dynamic Type, fysisk 44×44 pt, VoiceOver/TalkBack, safe area, reduced motion och signerad build | NOT TESTABLE i den här miljön |

### §14 — preliminär bedömning för denna avgränsade Logga-del

| Punkt | Status | Underlag/begränsning |
|---|---|---|
| 1. Högst en primär handling och tydlig nästa handling | NOT TESTABLE | Kräver renderad helhetsbedömning; Loggas befintliga snabbval bevaras. |
| 2. Jämställda handlingars visuella vikt | NOT TESTABLE | Responsiv render saknas. |
| 3. Radera, bekräftelse och ångra | Ja, käll-/testgranskat | Befintlig delete/undo-resa lämnas orörd; helhetsrender saknas. |
| 4. Hemrader och hanteringsfördjupning | Ej tillämpligt | Denna del gäller Logga, inte Hemrader. |
| 5. Avstånd, safe area och fri bottenmarginal | NOT TESTABLE | Dagcellens tokenaritmetik klarar 44 pt; faktisk AppScreen-scrollbotten saknar render. |
| 6. Delade tokens och komponenter | Ja, källgranskat | Ändringen använder befintliga tokens, BottomSheet, IconChip och ListRow-variant. |
| 7. Ikonfamilj och symboler | NOT TESTABLE | Koden skiljer dropp/mark från water-outline; faktisk gråskaleform vid storlek saknar bildbevis. |
| 8. Färgroller och kontrast | NOT TESTABLE för visuell fördelning; kontrastberäkningar PASS | Kontrastvärden ovan är beräknade från tokenfärger; matchning av panelens färgfördelning kräver render. |
| 9. Symbol, etikett och handling | Ja, källgranskat | Kiss, Vatten och Olycka har skilda kategorier/etiketter/handlingar i kod; faktisk ikonläsbarhet är NOT TESTABLE. |
| 10. Status och bekräftad bock | Ja, käll-/testgranskat | Loggfeedback visas efter bekräftad mutation; befintliga mutationstillstånd bevaras. |
| 11. Banners och uppmuntran | Ej tillämpligt för kalenderdelen | Ingen banner eller uppmuntran ändras av detta paket. |
| 12. Svensk copy | Ja, källgranskat | Kalenderns etiketter och tillstånd är på svenska; layoutens brytningar är NOT TESTABLE. |
| 13. Ton, hierarki och bildandel | NOT TESTABLE | Kräver renderad jämförelse. |
| 14. Renderade loading/empty/error/partial/sparlägen | NOT TESTABLE | Käll- och policytester finns, men render saknas. |
| 15. Träffyta, skärmläsare, större text och reducerad rörelse | NOT TESTABLE som helhet | 44 pt-källaritmetik och semantik finns; native, 140 % render och rörelseprov saknas. |
| 16. Rev02-komposition, färg, typografi, former, objekt, täthet och bildspråk | NOT TESTABLE | Ingen jämförbar skärmbild finns; inget visuellt PASS hävdas. |
| 17. Rubriker, filter, huvudflikar och återvägar | Ja för bevarad lokal resa, annars ej bedömt | Kalendern stängs efter datumval och befintlig Logga-navigering är orörd; huvudflikarnas visuella bedömning ligger utanför denna del. |
| 18. Hundnamn, bildroll och relevant innehåll | Ej tillämpligt | Denna kalenderdel introducerar varken hundbild eller nytt hundinnehåll. |

### Säkerhets- och granskningsstatus

- Securitys v4-förhandsgranskning godkände den oförändrade autentiserade, hundscopade dataåtkomsten. Slutlig Security-granskning av frozen diff pågår.
- Live RLS är NOT TESTABLE och får inte beskrivas som verifierad.
- QA: kod/test PASS; samlad package-acceptans öppen tills renderad UI-evidens finns.
- Reviewer är ännu inte körd eftersom repo-workflow kräver QA PASS före Reviewer.
- Inget commit, push, merge, signerad build eller TestFlight-tillgänglighet hävdas i denna evidensfil.

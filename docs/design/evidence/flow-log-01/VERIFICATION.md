# FLOW-LOG-01 — verifiering av Logga-kalender

Datum: 2026-10-22
Plan: v5, godkänd av Architect och UX Critic
Status: Kalender-/snabbvals-slicen har kod-, test- och syntetisk RN Web-rendering. Panel 5 är fortfarande partiell: §14 punkt 16 visar skillnad mot full rev02-komposition och oberoende QA/Reviewer återstår. Ingen live RLS eller native acceptans hävdas.

## Levererat i kodcheckpointen

- Datumkontrollen öppnar befintlig BottomSheet med svensk månad, måndag först, valbar historik, dagens markering, loggprickar och spärrade framtidsdagar/månader.
- Kalenderdagar har minst 44 pt bredd och höjd. Renderad dagruta vid 360 px är 44,56×44 px.
- Kalenderikonen ligger fristående till höger om ett fortfarande centrerat datum. Renderat mellanrum från datumtext: 20,4 px vid 360 px, 27,9 px vid 375 px och 55,4 px vid 430 px.
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
| Kalenderdagarnas 44 pt-geometri vid 360 px | PASS i render: 44,56×44 px |
| Public/review RN Web-render med månadskalender, markörer, tomt, laddning, fel/retry och datumval | PASS, 13/13 scenarier vardera; resultat och skärmbilder i `render/public` och `render/review` |
| Renderad dagruta vid 360 px | PASS, 44,56×44 px |
| Kalenderikonens avstånd och centrerat datum vid 360/375/430 px | PASS, minst 20,4 px mellanrum |
| Bottenmarginal efter scroll med Fler öppet vid 360×844 | PASS, 32 px mellan `Lägg till händelse` och tablist |
| Normal vy 360/375/430 px; 140 %-textproxy inklusive 375×667; gråskala | PASS, ingen horisontell dokumentoverflow; screenshots i public/review |
| Kontrast från faktiska tokens | PASS: Kissikon 5,38:1; Vattenikon 4,97:1; Olyckaikon 6,15:1; tidslinjetext på selectedSurface 11,95:1 |
| Källstruktur för scope-skydd, stängningsabort och refresh efter bekräftad mutation | PASS som policytest/källgranskning; komponentintegrationsrace är inte renderat |
| pnpm check | PASS: typecheck, edge-typecheck, ESLint och 665/666 tester (1 skip) på aktuell branch |
| Publik iOS JavaScript-bundle | PASS: public content guard, 1 577 moduler på aktuell branch |
| git diff --check | PASS; endast LF→CRLF-varningar från Git på två befintliga filer |
| python -X utf8 tools/dev_flow.py validate | PASS |

## QA-resultat och kvarstående bevis

Oberoende QA första varvet identifierade att kalenderdagarna saknade minWidth och att viktiga cursor-/racefall saknade regressionstest. Korrigering 1 lade till 44 pt minWidth, minskade endast kalenderkortets horisontella padding inom godkänd plan v5 och lade till testerna ovan. Den tidigare renderingsblockeringen är hävd: projektets isolerade RN Web-harness, tillfälliga renderer under `/tmp` och Chromium är tillgängliga. Den nya kontrollen renderar produktions-`LogScreen` med syntetiska fixtures i public- och reviewläge. Den ersätter inte oberoende QA.

| Visuell/QA-kontroll | Resultat |
|---|---|
| RN Web-responsiv render vid 360/375/430 px, normal och 140 % textproxy; kalender med markörer, tom/laddning/fel, vald dag, historik, snabbval, Olycka och Vatten | PASS för syntetisk RN Web. Webbrendering är inte native Dynamic Type. |
| Gråskalejämförelse av Kiss/Vatten-symboler vid verklig komponentstorlek | PASS visuellt: Kissens droppe över marklinje skiljer sig från Vattens konturdropp; kategoriord visas intill. |
| AppScreen-scrollbottenmarginal mot bottenflik vid 360×844 | PASS, 32 px efter scrollbotten med Fler öppet. |
| Sida-vid-sida-jämförelse mot Logga-panelen i vision_rev02.jpg | NEJ för full panel: `Översikt`-segmentet saknas tills Panel 8/Insikter har en fungerande destination. Se skillnadsnotering nedan. |
| Live RLS med två syntetiska ägare/hundscope samt anon denial | NOT TESTABLE: ingen godkänd Supabase-testmiljö; ingen backend kontaktades |
| Native Dynamic Type, fysisk 44×44 pt, VoiceOver/TalkBack, safe area, reduced motion och signerad build | NOT TESTABLE i den här miljön |

### §14 — preliminär bedömning för denna avgränsade Logga-del

| Punkt | Status | Underlag/begränsning |
|---|---|---|
| 1. Högst en primär handling och tydlig nästa handling | Ja för denna slice | Gröna `Lägg till händelse` är primär; kategoriknapparna är kompakta sekundära snabbval. |
| 2. Jämställda handlingars visuella vikt | Ja | Snabbvalen har samma storlek, tvåspaltsgruppering och synlig etikett. |
| 3. Radera, bekräftelse och ångra | Ja, käll-/testgranskat | Befintlig delete/undo-resa lämnas orörd; helhetsrender saknas. |
| 4. Hemrader och hanteringsfördjupning | Ej tillämpligt | Denna del gäller Logga, inte Hemrader. |
| 5. Avstånd, safe area och fri bottenmarginal | Ja i RN Web | Kalenderikonen har minst 20,4 px till datumtexten och datumet ligger centrerat; 44,56×44 px dagmål och 32 px bottenmarginal. Native safe area är separat NOT TESTABLE. |
| 6. Delade tokens och komponenter | Ja, källgranskat | Ändringen använder befintliga tokens, BottomSheet, IconChip och ListRow-variant. |
| 7. Ikonfamilj och symboler | Ja | Renderad gråskala vid visad storlek visar Kiss droppe/mark och Vattens konturdropp som olika former. |
| 8. Färgroller och kontrast | Ja för berörda loggkategorier | Render visar amber Kiss, blå Vatten, brun Bajs, varm Mat och lila Sömn. Kontrastvärden är tokenberäknade enligt raden ovan. |
| 9. Symbol, etikett och handling | Ja, källgranskat | Kiss, Vatten och Olycka har skilda kategorier/etiketter/handlingar i kod; faktisk ikonläsbarhet är NOT TESTABLE. |
| 10. Status och bekräftad bock | Ja, käll-/testgranskat | Loggfeedback visas efter bekräftad mutation; befintliga mutationstillstånd bevaras. |
| 11. Banners och uppmuntran | Ej tillämpligt för kalenderdelen | Ingen banner eller uppmuntran ändras av detta paket. |
| 12. Svensk copy | Ja i renderad kalender | Månads-, veckodags-, status- och retrycopy är svenska och ryms i granskade layouter. |
| 13. Ton, hierarki och bildandel | Ja för denna datavy | Vänstertitel, varm neutral yta, kategorifärger och tät tidslinje följer panelens loggkaraktär; ingen hundbild ingår i målbilden för panel 5. |
| 14. Renderade loading/empty/error/partial/sparlägen | Ja för kalenderns markerläsning | Markörer, komplett tom månad, laddning och fel/retry renderades. Partial och sparmutation täcks av tidigare kod-/querytester, inte av denna matris. |
| 15. Träffyta, skärmläsare, större text och reducerad rörelse | Ja för RN Web-delen; native NOT TESTABLE | Renderade kalenderdagar klarar 44×44; svenska labels/states finns; 140 %-proxy gav ingen horisontell overflow. Native VoiceOver, Dynamic Type och reduce motion kördes inte. |
| 16. Rev02-komposition, färg, typografi, former, objekt, täthet och bildspråk | Nej för full panel | Jämförbara bilder finns. `Översikt`-segmentet saknas tills Panel 8 ger en verklig destination. Den avtalade snabba kategorigruppen är kvar före tidslinjen. |
| 17. Rubriker, filter, huvudflikar och återvägar | Nej för full panel | Datumföregångare, kalenderöppning, markerad dag och stängning efter val fungerar. `Idag/Översikt` saknas tills Insikter byggts; övrig huvudnavigation är separat. |
| 18. Hundnamn, bildroll och relevant innehåll | Ej tillämpligt | Denna kalenderdel introducerar varken hundbild eller nytt hundinnehåll. |

### Säkerhets- och granskningsstatus

- Securitys statiska granskning godkände den autentiserade, hundscopade dataåtkomsten; den gäller inte live RLS.
- Live RLS är NOT TESTABLE och får inte beskrivas som verifierad.
- Lokal coordinator-rendering: public 13/13 och review 13/13; detta är inte oberoende QA.
- Oberoende QA och Reviewer återstår enligt workflow. Full Panel 5-acceptans förblir öppen på §14 punkt 16–17.
- Live RLS, native VoiceOver/Dynamic Type/safe area/reduced motion och signerad build är NOT TESTABLE.

## Renderad jämförelse och kvarstående panelgap

De sparade skärmbilderna återger produktions-`LogScreen` via RN Web och syntetiska testdata. Review/public disclosure-bannern ligger utanför appens viewport; appinnehållet provas vid 360/375/430×844 samt 375×667. Den dokumenterade 140 %-texten är en CSS-proxy, inte iOS Dynamic Type.

Målbildens Logga-panel visar `Idag/Översikt`, datumväxlare, tid-först-lista och grön åtgärd. Den godkända screen contract tillåter befintliga snabbval före tidslinjen för att behålla entrycksloggning. `Översikt` ska öppna Insikter när Panel 8 finns; därför läggs inte en död eller låtsasflik in nu. Det är en konkret fullskärmslucka, inte en kalenderbrist. Öppna screenshots: [public](render/public/log-main-375.png), [calendar with markers](render/public/log-calendar-markers-375.png), [review](render/review/log-main-375.png).

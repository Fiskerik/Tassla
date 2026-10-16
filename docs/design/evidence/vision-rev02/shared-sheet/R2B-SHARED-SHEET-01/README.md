# R2b — delad BottomSheet med dragstängning

Datum: 2026-10-16\
Task/plan: [R2b v2](../../../../../tasks/dev/UIUX-REVAMP-R2B-SHARED-SHEET-01.md) och [UX-spec v2](../../../../../plans/UIUX-REVAMP-R2B-SHARED-SHEET-01-ux-spec.md)\
Källäge: codex/mvp-v2-panel4-checklists-2026-10-16, bascommit b9e55bb; public/review kördes från arbetsytan före checkpoint-committen.\
Målbild: [vision_rev02.jpg](../../../../../../vision_rev02.jpg), Logga-panelen och [designregelverk §14](../../../../../design-rules.md#14-obligatorisk-visuell-och-funktionell-granskning). Bilden innehåller ingen separat editorpanel; komponentens exakta visuella matchning bedöms därför separat från beteendet.

## Fixture och verifiering

Public- och review-bundlarna använder produktionens BottomSheet och LogScreen, med syntetiska data och callbackar. Inga backendwrites görs. De sparade [publicresultaten](public/browser-results.json) och [reviewresultaten](review/browser-results.json) visar QA v5/v6: 12/12 passerade kontroller per variant, noll browser page errors och focus true → true. Node Playwright användes eftersom Python Playwright-bindningen saknades. Fördröjd animation callback med uppåtvändning täcks av hjälptest och en synlig efterbild efter avslutad återstuds finns i båda varianterna.

Viewports: 375×844, 430×844 och 375×667. Editorn renderas också med 140 % CSS-textproxy. Tangentbordshöjden simuleras med en viewport på 375×430; detta är inte ett riktigt OS-tangentbord.

| Skärmbild | Vad den visar |
|---|---|
| public/log-editor-clean-375x844.png, public/log-editor-clean-430x844.png, public/log-editor-clean-375x667.png (samma filer under review/) | Ren editor vid tre viewportstorlekar |
| public/log-editor-dirty-375x844.png och public/log-editor-dirty-140-text.png (motsvarande review) | Dirty draft och större textproxy |
| public/log-editor-dirty-drag-stay-375x844.png och public/log-editor-dirty-drag-discard-375x844.png (motsvarande review) | Drag öppnar discard-prompten; Stay bevarar draften och endast det uttryckliga discard-valet stänger |
| public/log-editor-pending-drag-denied-375x844.png, public/log-editor-failed-drag-denied-375x844.png, public/log-editor-unsure-drag-denied-375x844.png (motsvarande review) | Drag nekas i pending/failed/unsure; status och draft bevaras |
| public/log-editor-keyboard-proxy-scroll-focus-cancel-375x430.png (motsvarande review) | Scroll under simulerad tangentbordshöjd och avbruten rubrikgest |
| public/sheet-short-drag-returned-375x844.png, public/sheet-reduced-motion-returned-375x844.png (motsvarande review) | Kort drag återgår; reduced-motion återställs direkt |
| public/sheet-redrag-during-return-spring-375x844.png (motsvarande review) | Aktiv återstuds avbryts och följs utan snap; mellanbilden kan vara utanför viewport under det avsiktligt hållna draget, medan browserassertionerna mäter ursprung, återstuds, position och fortsatt fingerföljning |
| public/sheet-redrag-returned-after-active-spring-375x844.png (motsvarande review) | Sheet synlig efter den andra, nekade dragningen och full återgång |
| public/log-add-event-opt-out-375x844.png (motsvarande review) | Add-event-sheeten fortsätter på opt-out-vägen |

Focus probe: efter avbruten syntetisk header-touch rapporterar RN Web before=true, after=true. Gesten blurrar fältet tillfälligt och återställer fokus efter återgången; draft, scroll och write-räknare bevaras. Detta är endast browserbevis och fastställer inte hur fysisk iOS/Android-touch, fokus eller OS-tangentbord beter sig. De delarna behöver kontrolleras i appen.

## §14 — obligatorisk visuell och funktionell granskning

| # | Status | Bedömning och bevis |
|---|---|---|
| 1 | Ja | Spara ändring är editorns primärhandling; separat Stäng hanterar utträde. Clean drag stänger via ägarens visible-state, och dirty drag ger befintliga val. Se public/review-resultat. |
| 2 | Ej tillämpligt | Inga jämställda destinationshandlingar introduceras i denna deluppgift. |
| 3 | Ej tillämpligt | Radering ändras inte och ingår inte i den nya gesten. |
| 4 | Ej tillämpligt | Ingen Hem-rad eller dess fördjupningsväg ändras. |
| 5 | NOT TESTABLE | Webbilder finns för angivna storlekar och textproxy, men exakt editorreferens, fysisk safe area och native tangentbordsavstånd har inte verifierats. |
| 6 | Ja | Den delade BottomSheet och gemensamma färg-/storleks-/rörelsetokens återanvänds. Endast opt-in-komponentstilarna för rubrikhandtag och dragytan tillkommer. |
| 7 | Ja | Befintlig Ionicons-familj används för stängknappen. Dragindikatorn är en enkel dekorativ form och introducerar ingen ikonfamilj. |
| 8 | NOT TESTABLE | Aktuella färger syns i skärmbilderna, men editorreferens och separat kontrastmätning saknas. |
| 9 | Ja | Den dekorativa dragindikatorn gör ingen handling; den tillgängliga Stäng-knappen behåller sin tydliga etikett. |
| 10 | Ja | Ingen statusbadge eller obekräftad framgångsbock tillkommer. Pending/failed/unsure-copy visas bara i respektive läge. |
| 11 | Ej tillämpligt | Ingen uppmuntrans- eller framgångsbanner tillkommer. |
| 12 | Ja | Ingen ny produktcopy tillkommer; befintliga etiketter och discard-val behålls. |
| 13 | NOT TESTABLE | Bilderna dokumenterar aktuell hierarki, men målbildston och innehållshierarki för en separat editor kan inte jämföras direkt. |
| 14 | Ja | Public/review renderar clean, dirty, pending, failed, unsure, undertröskel, reduced-motion, cancel/terminate, Stay, explicit discard och opt-out. Resultatfilerna saknar page errors. |
| 15 | NOT TESTABLE | 44 pt-minimihöjd och webbssemantik finns i implementationen, men native VoiceOver, Dynamic Type, fysisk tangentbord/fokus och systemträffytor är inte provade. Browserns avbrutna touchprobe återställer fokus (true → true); native hjälpmedel och fysisk tangentbords-/fokusrespons är inte provade. |
| 16a — Komposition | NOT TESTABLE | [Public, clean 375×844](public/log-editor-clean-375x844.png) och [review, clean 375×844](review/log-editor-clean-375x844.png) visar komponenten. [vision_rev02.jpg](../../../../../../vision_rev02.jpg) har ingen särskild editorpanel för sida-vid-sida-matchning. |
| 16b — Färger | NOT TESTABLE | [Public, clean 375×844](public/log-editor-clean-375x844.png) och [review, clean 375×844](review/log-editor-clean-375x844.png) visar renderade färger; ingen dedikerad editorreferens finns för färgfördelningen. |
| 16c — Typografi | NOT TESTABLE | [Public, 140 % textproxy](public/log-editor-dirty-140-text.png) och [review, 140 % textproxy](review/log-editor-dirty-140-text.png) visar faktisk textlayout, men saknar en motsvarande målbild av editorn. |
| 16d — Komponentformer | NOT TESTABLE | [Public, dirty drag](public/log-editor-dirty-drag-stay-375x844.png) och [review, dirty drag](review/log-editor-dirty-drag-stay-375x844.png) visar formerna och discard-läget; exakt editorform kan inte jämföras mot målbilden. |
| 16e — Bildspråk | NOT TESTABLE | [Public, clean 375×844](public/log-editor-clean-375x844.png) och [review, clean 375×844](review/log-editor-clean-375x844.png) visar editorn. Målbilden anger ingen separat bildroll för denna editor. |
| 16f — Innehållstäthet | NOT TESTABLE | [Public, liten höjd](public/log-editor-clean-375x667.png) och [review, liten höjd](review/log-editor-clean-375x667.png) visar tätheten; en jämförbar editorreferens saknas. |
| 17 | NOT TESTABLE | Loggens befintliga ägarstyrda close-regel bevaras. Native system-back-/Modal-prioritet och route-retur testas inte av RN Web-scenariot. |
| 18 | Ej tillämpligt | Denna uppgift ändrar inte hundnamn, porträtt eller innehållsurval. |

## Separata bevisstatusar

- **Lokal funktion:** focused 21/21; full `pnpm check` 549/549 inklusive app-/edge-typecheck och ESLint. Public/review 12/12 vardera, noll page errors och fokus true → true.
- **Browserinteraktion:** fingerföljning, gräns, cancel, denied close, snabb omdragning under aktiv återstuds, draft/write count, scroll och opt-out kontrollerades. Avbruten RN Web-header-touch återställer fokus (true → true); detta är browserbevis och ersätter inte fysisk kontroll.
- **Visuell likhet:** renderade bilder och §14-bedömning finns; pixel-/kompositionsmatch mot separat editormålbild är NOT TESTABLE.
- **Live data:** syntetiska callbacks, inga Supabase/RLS- eller persistensprov.
- **Native/release:** iOS/Android-touch, OS-tangentbord/fokus, VoiceOver, fysisk Dynamic Type, Android system-back/Modal-prioritet, live backend och installerad build är NOT TESTABLE.

Oberoende QA:s första recheck: **PASS** 2026-10-17 ([rapport](qa/INDEPENDENT-QA-v2-recheck.md)). Reviewer hittade senare en saknad snabb-omdragningskontroll; den åtgärdades och runtime/evidensrecheck v3 passerade ([rapport](qa/INDEPENDENT-QA-v3-rapid-redrag.md)). Lifecycle cleanup verifierades därefter med QA v4 **PASS** ([rapport](qa/INDEPENDENT-QA-v4-lifecycle.md)). Reviewer fann sedan att ett fördröjt `stopAnimation`-svar vid uppåtvändning kunde flytta sheeten ovanför gestens uppmätta startläge. Den gemensamma offset-clampen och deferred-callback-regressionen gav QA v5 **PASS**; färska browserkörningar v6 och persistens/hashrecheck passerade ([rapport](qa/INDEPENDENT-QA-v5-lifecycle-upward-reversal.md)). Slutlig Reviewer-recheck **PASS** utan kvarstående fynd ([rapport](review/INDEPENDENT-REVIEW-v5.md)). Native-beteende fastställs inte av dessa renderbevis.

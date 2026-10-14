# CHECKLIST-UI-LUNA-CUSTOM — render- och implementeringsrapport

Datum: 2026-10-14 · Slice: `CHECKLIST-UI-LUNA-CUSTOM` · Plan: `CHECKLIST-UI-LUNA-01` v4.3

## Genomfört

- Egna punkter ligger i checklistans grupperade lista. Rubriken visas bara när det finns egna punkter; varje sådan rad har en separat 44 pt redigeringsknapp med punktens namn som tillgänglig etikett. Lägg till ligger sist och öppnar formuläret i en BottomSheet.
- Grupperade checkboxar använder nu fyrkantig visuell form enligt panel 4 i rev02. Accessible role/checked/busy-state och befintlig confirmed-save-animation är oförändrade.
- Add, edit och delete använder befintlig validering, raderingsbekräftelse och befintliga skriv-/reconciliation-funktioner. Ingen datamodell, fråga, migration, offlinekö eller beständig lokal lagring har tillkommit.
- Sheetens synlighet är skild från utkast och avsikt. X, backdrop och systemback behåller formulärdata/UUID; explicit ”Avbryt” rensar utkastet. Pågående skrivning blockerar stängning. Känd write-failure behåller en retry som återanvänder samma UUID för add eller samma rad-ID för edit/delete.
- Unknown visar Kontrollera i sheetet. Om sheetet stängs ligger Kontrollera kvar på detaljvyn och utkast/avsikt finns kvar. Bekräftad reconciliation stänger sheetet och uppdaterar listan först efter readback.
- 160 Unicode-tecken godtas och 161 avvisas före skrivning. Renderingsgranskningen fann att en 160 tecken lång, oavbruten titel kunde gå bakom redigeringsknappen i webbläsaren; grupperad rad använder nu `minWidth: 0` och webblägets `overflowWrap: anywhere`. Den korrigerade bilden visar texten radbruten utan horisontell overflow.
- Publiclägets syntetiska klient visade ingen review-checklista, noll checklistläsningar och noll checklistskrivningar. Reviewläge användes för CRUD-/återhämtningsvyerna.

## Kontroller

- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS.
- Public- och review-build via `tools/visual-check/build.cjs` — PASS.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.
- Efter Reviewers cancel-fynd: `pnpm typecheck`, `pnpm lint`, public/review-build och `git diff --check` — PASS. Vid commitförberedelsen rättades två föråldrade UI-assertioner, och riktade `checklist-ui.test.mjs` passerar. Repo-hookarna kör full `pnpm check` före commit och push.
- Manuell Chromium-rendering vid 375×844, 430×844, 375×667 och 140 % browser-zoom som proxy; inga browser page errors rapporterades. Edit-sheet och delete-felbild finns i samtliga storlekar. Vid 140 % kan fel-/retryinnehållet göra sheetet högre; det vertikala sheetinnehållet scrollar, och en separat nedre bild visar återstående kontroller.
- Manuell add-kontroll: skapa, stäng/öppna med bibehållet utkast, pending med blockerad stängning, känd failure och retry med samma UUID, unknown, stängning med kvarvarande Kontrollera och bekräftad reconciliation.
- Manuell edit-kontroll: separat editknapp, formulär med befintlig titel, känd failure och retry med samma rad-ID.
- Manuell delete-kontroll: befintlig bekräftelse, känd failure/retry med samma rad-ID, unknown med stängning/Kontrollera och bekräftad reconciliation som tar bort punkten. Retry-success-bilden fångades efter att sheetet stängts och success-toast stabiliserats.
- Public-gate och gränsbilder finns i `public-custom-gate-375.png`, `review-custom-long-title-160-375.png` och `review-custom-long-title-161-error-375.png`. Övriga add/edit/delete-tillstånd listas nedan.
- Inga nya testfall lades till. `checklist-ui.test.mjs` fick två assertioner uppdaterade till aktuella UI-kontrakt efter att pre-commit identifierat föråldrade förväntningar; riktat test PASS. `verify-know02.py` kördes inte; dess befintliga output pekar på den äldre KNOW-02-evidenskatalogen.

## Renderbevis

- Bas och add: `review-custom-detail-375.png`, `review-custom-add-sheet-375.png`, `review-custom-add-sheet-430.png`, `review-custom-add-sheet-375x667.png`, `review-custom-add-sheet-140pct-proxy-375.png`.
- Utkast, pending och återhämtning: `review-custom-add-closed-draft-375.png`, `review-custom-add-reopened-draft-375.png`, `review-custom-add-pending-375.png`, `review-custom-add-pending-close-blocked-375.png`, `review-custom-add-failed-375.png`, `review-custom-add-retry-saved-375.png`, `review-custom-add-saved-375.png`, `review-custom-add-unknown-sheet-375.png`, `review-custom-add-unknown-closed-375.png`, `review-custom-add-reconciled-375.png`.
- Edit: `review-custom-edit-sheet-375.png`, `review-custom-edit-failed-375.png`, `review-custom-edit-retry-saved-375.png`.
- Edit-storlekar: `review-custom-edit-sheet-430.png`, `review-custom-edit-sheet-375x667.png`, `review-custom-edit-sheet-140pct-proxy-375.png`.
- Delete: `review-custom-delete-failed-375.png`, `review-custom-delete-retry-saved-375.png`, `review-custom-delete-unknown-sheet-375.png`, `review-custom-delete-unknown-closed-375.png`, `review-custom-delete-reconciled-375.png`.
- Delete-storlekar: `review-custom-delete-failed-430.png`, `review-custom-delete-failed-375x667.png`, `review-custom-delete-failed-140pct-proxy-375.png`, `review-custom-delete-failed-140pct-proxy-375-bottom.png`.
- Gränser och public-gate: `review-custom-long-title-160-375.png`, `review-custom-long-title-161-error-375.png`, `public-custom-gate-375.png`.

## Avgränsningar

140 % är browser-zoomproxy, inte native Dynamic Type. Den globala bottennavigationen radbryter ”Kunskap” vid den zoomen men är fortsatt användbar; den delade navigationskomponenten ligger utanför denna slice. Native VoiceOver/tangentbord/Dynamic Type, iOS/Android och verklig Supabase/RLS är `NOT TESTABLE` här. Första oberoende QA-rundan gav `CHANGES`: den ursprungliga 140 %-bilden saknade synligt sheet och grouped-checkboxen avvek från rev02; QA noterade även saknade edit/delete-bilder för 430/667/140 % och ett instabilt delete-retry-success-capture. Efter utlåtandet ersattes 140 %-bilden med ett synligt sheet, grouped-checkboxen ändrades till fyrkantig form och alla efterfrågade edit/delete-storlekar samt stabil retry-success fångades på nytt. Oberoende read-only QA gav **PASS** 2026-10-14: korrigeringarna och relevanta §14-delar godkända. Första oberoende Reviewer gav `CHANGES`: explicit Avbryt rensade utkastet och `failedFormAction` men lämnade felmeddelandet kvar, så den yttre Toast kunde visa en retry som inte längre retryade skrivningen. Avbryt rensar nu också meddelandet. Fokuserad oberoende read-only QA gav **PASS 2026-10-14**: add/edit/delete använder samma handler; close via X/backdrop/systemback bevarar utkast och giltig retry; unknown visar fortsatt Kontrollera. Ingen ny interaktiv cancel-reproduktion kördes; QA var statisk. Oberoende Reviewer omgranskade korrigeringen och gav **PASS 2026-10-14**. Ingen ny interaktiv cancel-reproduktion kördes; Reviewer och QA verifierade statiskt källan och flödeskontrakten.

## Nästa steg

Custom QA och Reviewer PASS är klara. Checkpointen fryses och hashverifieras i `CHECKPOINT-CUSTOM.patch`; extern QA gör en ny kontroll efter faktisk release enligt användarens förbehåll.

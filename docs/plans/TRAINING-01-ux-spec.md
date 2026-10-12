# TRAINING-01 – UX-specifikation

Version 1.0 · 2026-10-12 · Status: Architect APPROVE, Critic PROCEED.

## Mål

Ägaren ska lätt se vilka kort som är träningsprogram och vilka rader som är enskilda övningar, välja ett program ur en bildgrid, och ångra en sparad genomfördmarkering. Bekräftad övning får ett kort, lätt firande i stället för genomförd-toast.

## Layout och interaktion

- Fliken **Valpprogram** behåller valt programs fokus/innehåll högst upp. Alternativa program visas längre ned i en tvåkolumns grid av befintliga hund-/valpfoton. Varje kort visar foto, **Program**, titel och progress; kort får tillräcklig target/kontrast och accessibility label.
- Programval sätter vald programidentitet och dess fokus högst upp, notifierar `ProductWorkspace` och bump:ar `AppScreen.scrollKey` för att återställa scroll. Fliken **Valpprogram** förblir aktiv.
- Programmets övningar under en separat **Övningar**-rubrik visas som checkliststatusrader. En rad öppnar övningen; bottom-sheet visar instruktion och status. Genomförd övning erbjuder exakt **Markera som ej genomförd**.
- Efter bekräftad, hund-/programversion-scopad `training_progress`-insert + fresh readback startar en 180 ms partikelkonfetti enligt `tokens.motion.check`. Samma Toast-successcopy tas bort. Partiklar är dekorativa och låser inte input. Reducerad rörelse hoppar över partiklar och behåller checkmarken.
- Restore använder befintlig delete-helper med exakt dog/version/step filters och befintlig RLS. UI tar bara bort checkmark när fresh readback visar att row saknas. `failed` eller olöst `unknown` lämnar checkmark och erbjuder recovery. Förlorad delete-response vars readback bekräftar frånvaro är framgång.
- Readback kan bara bekräfta frånvaro om just programversionen finns i den färska workspace-listan; om versionen saknas hålls status osäker och handlingen får inte rapportera återställd. Övningsexempel med `review-v1:training:*` använder endast lokal, syntetisk undo och anropar aldrig progression-API.
- Asynkrona mutationer fångar owner/account-generation och aktiv hund/program/version/step scope. Sent svar efter scopeändring får inte ändra UI. Dubbletttryck blockeras under write.
- Toppnotis, tabs och huvudkort får tokeniserad luft enligt befintligt spacing-system; inga råa pixel-/hexvärden.
- Browser-QA vid 140 % text visade att Träning-labeln i delad bottenmeny bröts över två rader. Gemensamma kolumnmellanrum togs bort och etiketterna begränsas till en rad så alla fem poster fortsatt är lika stora; den ändringen ingår i den här slice eftersom den bröt tillgänglighetspunkten §14.15.

## Verifieringsfall

Modell/data: exakta delete-filter, saved response, lost-response/confirmed-absence, unresolved status; readback före UI, inget unchecked vid fel; scope-/generation race; endast aktiva hundens steg ändras. UI/browser: en och flera program, kortval fokus/scroll men kvar på Valpprogram, entydiga Program/Övningar-rubriker, completion toast saknas, confetti endast efter confirmed, avbockning bekräftas före UI, återställningscopy, disabled/double-click, reduced motion, loading/error/empty, 360/430 px och 140 % text. Mät minsta touch target enligt §14; fånga evidens för §14.

## Öppna plattformsgränser

Native reduced-motion, VoiceOver, enhetens scrollbeteende och live Supabase RLS är NOT TESTABLE i webbrenderaren. Separat review-channel iOS bundle är build evidence, inte telefonprov.

## Renderad verifiering

`tools/visual-check/verify-training.py`: PASS 15 state-/interaktions-/brytpunktfall vid 360/430 px, plus 140 % text. Skärmbilder och §14.1–18 finns i `docs/design/TRAINING-01/checklista.md`. Följande granskning skärpte också saknad programversion till olöst status och review-v1 undo till strikt lokal state. Ingen browser error eller horisontell overflow. Native VoiceOver/Dynamic Type, fysisk scroll och live Supabase RLS är ej verifierade.

## Oberoende granskning

- Critic: PROCEED efter exakta återställningscopy och kort/tillgänglig 180 ms tokenbaserad animation som följer §15.
- Architect: första version CHANGES: krävde exakta delete/readback-filtertester, scope-/generation skydd vid icke-aborterbar request samt parent scrollKey-generation vid fokusval. Alla fynd införlivades. Slutlig APPROVE: tester verifierar exakt dog/version/step, bekräftad och lost-response delete readback, unresolved result; sen mutation ignoreras efter scopebyte; selected program fångar scroll-focus utan tabbyte.
- Independent Reviewer: först BLOCK på saknad programversion som felaktigt räknades som saknat steg; rättat med krav att exakt version finns i fresh readback, re-review PASS. Independent QA fann att review-v1 undo gick via cloud delete; rättat till lokal syntetisk state-helper. QA:s slutliga status dokumenteras efter aktuell kodverifiering.

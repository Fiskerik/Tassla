# DAILY-CLOCK-SCOPE-01 — dagsgräns och säkert återbesök

Status planned · bas `0319a53` · risk H · root ensam writer. MVP-COMPLETION-261031 steg4. Inga schemaändringar eller nya persondata.

Arkitekt fann att dagklockan inte uppdateras på Framsteg eller träningsdetalj, att den inte ställs om direkt vid inträde från andra vyer och att foreground-refresh kan anropa gårdagens closure före omrendering. En användare kan annars se eller skriva på fel dag. Bevara befintlig scope-/ägarkontroll, avbryt gamla flygningar, behåll utkast/unknown och återkontrollera endast samma operation.

Uppdatera klockan direkt på relevanta vyer samt timer/foreground även progress och home-training-detail. Kontrollera faktisk lokal dag och aktuell tidszon vid dagläsning, innan ny dagsmutation och före publicering av ett läs-/skrivsvar. Vid mismatch triggas klockuppdatering, ingen ny gammal begäran påbörjas och sent svar får inte publiceras i dagens UI. Samma-ID-retry av en tidigare unknown ska fortsatt vara möjlig inom rätt konto/hund; en tidigare begäran som verkligen började före dygnsskifte får inte raderas eller automatiskt göras om. Historik-/veckointervall och tidzon/DST följer befintlig lokaldatumsfunktion.

Skrivvägar: `src/features/home/ProductWorkspace.tsx`, `src/features/home/README.md`, `tests/daily-clock-scope.test.mjs`, `docs/tasks/dev/DAILY-CLOCK-SCOPE-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md`.

Acceptans: körbar faktisk scope-/klockkod med styrd tid, foreground, inträde, timer, midnatt, tidszonsbyte, DST och sent svar; tidigare unknown samma ID; konto-/hundbyte och fel inga nya skrivningar; befintlig skapad rutin och läs-/skrivrecovery bevaras. Testa integrationsvägar utan att beskriva syntetisk fixture som verklig databas, RLS, processomstart eller native. pnpm check, public iOS JS-export, oberoende Security/QA/Reviewer. Separat bred hel vardagsresa återstår.

Critic STOP v1: utkast är dagsscopebundna och deras repetitionsankare beräknas på servern; dagbyte mellan skapad mall och dagens tillägg behöver separat tillförlitlig, ägarscopad återhämtning. Ny plan krävs innan implementation; under tiden genomförs den fristående same-ID-fixen. Security fann även nytt mutations-ID i checklistans retry-closures. Inga clockändringar genomförda.

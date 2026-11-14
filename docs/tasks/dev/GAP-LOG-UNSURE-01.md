# GAP-LOG-UNSURE-01

Status: implementation superseded by owner decision 2026-11-13 and GAP-LOG-UNKNOWN-REPLAY-01. Bas: `d122622645eefb3f4c44ce488afea7105624d878`.

Mål: en snabblogg med osäkert serversvar ska fortsätta synas på rätt dag med tydlig status så att ägaren vet vad som behöver kontrolleras.

Omfattning: `src/features/puppy-log/LogScreen.tsx`, `src/features/puppy-log/log-pending-row.ts`, `src/features/puppy-log/README.md`, `tests/log-pending-row.test.mjs`, `tests/log-screen-policy.test.mjs` samt detta kontrakt. En skrivägare. Ingen ändring av lagring, serveranrop, haptik, progress, retry, felstatus eller bekräftelsekontrakt. Återförsök använder befintlig kontroll. Risk M: presentation av potentiellt sparad data måste vara sanningsenlig.

Acceptans: endast nya händelser i pending/unsure på vald dag visas som separat rad när ingen serverrad med samma ID finns. Pending säger Sparar; unsure säger att sparstatus behöver kontrolleras. Varken failed eller saved ger sådan rad. Vanliga serverrader dubbleras inte. Beteendet testas med rena tillståndsfall; visuell och native VoiceOver-kontroll markeras separat tills bevis finns. Befintlig recovery och låsning lämnas orörd.

## Checkpoint

Kod och beteendetest implementerade. `pnpm check` kördes: typecheck och lint passerade, men ett äldre källkodstest föll på den tidigare inline-villkorsformen. Assertionen uppdaterades för den faktiska kopplingen och båda relevanta loggtestfilerna passerade (11 tester). Hela `pnpm check` behöver köras om efter teständringen. `git diff --check` passerade före sista teständringen. Visuell jämförelse, VoiceOver, native-enhet, QA och oberoende review: NOT TESTABLE/ej utfört. Nästa steg: kör om hela check, gör visuell granskning och oberoende QA/review.

## Checkpoint 2026-11-11

`pnpm check` passerade efter testuppdateringen: 932 godkända, 1 hoppat. `git diff --check` passerade. Oberoende QA och reviewer fann inget konkret kodfel, men konstaterade att testet inte verifierar faktisk rendering eller retry. Visuell jämförelse mot rev02, Dynamic Type, VoiceOver och nätverksåterhämtning på enhet är NOT TESTABLE här och uppgiften är inte visuellt godkänd. Ändrade sökvägar omfattar även `tests/log-screen-policy.test.mjs`, vars tidigare inline-assertion anpassades till den utbrutna funktionen. Nästa steg är render- och enhetsverifiering av pending → unsure → retry och bekräftad rad, följt av åtgärd av eventuella fynd.

## Render och granskning

RN Web, syntetisk fixture, publicläge: 375×844 tom dag med osäker mutation samt 375×667 och 430×844 med befintliga rader har renderats; `Försök igen` gav bekräftelsestatus och avlägsnade osäker status i fixturen. Bilder och paneljämförelse finns i `docs/design/evidence/gap-log-unsure-01/`. Detta verifierar inte faktisk server, native eller live-data. Textproxy 140 % är renderad men verifierar inte native Dynamic Type.

Oberoende ui_critic såg jämförelsen: osäker rad och återförsök är läsbara vid 375 px, utan synlig klippning. §14.16: komposition, färger, typografi, former och innehållstäthet **Nej** mot panel 5; bildspråk ej tillämpligt. Felstatus och fixture skiljer sig från referensens normalläge, och flera skillnader fanns redan; orsakerna kan inte isoleras av bilden. Full panel är inte visuellt godkänd. Native safe area, kontrast, VoiceOver och verklig nätverksåterhämtning kvarstår utan bevis. Nästa steg: verifiera på native enhet och bedöm normalvyn med jämförbart innehåll; gör inte anspråk på full panelacceptans.

## RN Web-checkpoint

`tools/visual-check/verify-log-unsure.py` kördes mot `http://127.0.0.1:4173` med syntetisk normalfixture, Chromium 375 × 844 och UTC-klocka 2026-11-11 15:00. PASS: en osäker rad på rätt dag, ingen föregående dag, en bekräftad rad och ingen osäker status efter fixturens återförsök. Skärmbilder: `/tmp/tassla-log-unsure/unsure.png` och `/tmp/tassla-log-unsure/confirmed.png` (lokala, ej versionshanterade). Provet simulerar svar i React-minne och bevisar inte backend, iOS eller VoiceOver. Skriptet `tools/visual-check/verify-log-unsure.py` ingår i uppgiftens utökade skrivvägar. Visuell jämförelse mot målbild och oberoende QA/review återstår.

## Ägarens senare ändring 2026-11-13

Den osäkra kontrollraden och den separata kontrollrutan/dialogen togs bort på ägarens uttryckliga begäran. Ursprunglig fixture- och screenshotkontroll ovan beskriver den tidigare UI-versionen och är inte längre ett aktuellt acceptanskriterium. Nytt beteende: en automatisk läsning försöker bekräfta samma insättning; saknad matchning frigör den temporära väntan och startar omläsning utan att återförsöka INSERT. Aktuell verifiering och begränsningar dokumenteras i `GAP-LOG-UNKNOWN-REPLAY-01.md`.

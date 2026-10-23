# UI-R02-02 — checklistor

Datum: 2026-10-23. Branch: `2026-10-23-ui-02-checklistor`.

## Resultat

- `knowledge/` innehåller syntetiska RN Web-bilder och `browser-results.json` för att skapa, återöppna, redigera, avbryta och radera en egen faschecklistepunkt med vald ikon.
- `routines/public/` och `routines/review/` innehåller syntetiska bilder och resultat från samma rutinflöde i public respektive granskningsläge. Efter korrigeringen ligger ikonvalen i formulärets rullflöde så att de inte täcker nästa fält eller Spara.
- Delad ikonmodell/picker används i båda ingångarna. Kunskapspunkters nya `icon`-värde finns med i formulärutkast, skrivning, readback och konfliktkontroll. Vanlig completion-uppdatering bevarar värdet.
- Formuläret använder en spara-footer, kompakt ikonhandling för status/radering och textad raderingsbekräftelse. Dirty close ber om bekräftelse.

## Lokal kontroll

- `pnpm check`: PASS, app- och edge-typecheck, lint och 75/75 testfiler.
- Riktade public/review-visuella rutinprov: 16/16 respektive 16/16; alla 20 ikonval nås via rullning och har minst 44 px målyta vid 375×667, 375×844 och 430×844.
- Riktat kunskapsprov: 7/7; 375×667, 375×844, 430×844 och 140 % textproxy utan horisontell overflow; alla ikonval når spara.
- Public iOS Expo JS-export PASS efter picker-korrigeringen: 1 585 moduler; release content guard PASS.
- Den äldre breda `verify-know02.py` är **NOT TESTABLE** mot denna fixtur: den väntar på `Checklistor`-fliken i en äldre route/render och stannar före första assertionen. Den räknas därför inte som PASS eller produktfel; det aktuella riktade provet ovan är källan för den här ändringen. Den gamla verifieraren är lämnad oförändrad.
- Källorna använder syntetiska lokala fixturedata. Bilderna bevisar inte fysisk iOS-layout eller native Dynamic Type/VoiceOver.

## Öppna grindar

- Migrationen `202610230001_checklist_custom_item_icons.sql` och SQL-proben är skrivna, men applicering och körning mot en riktig PostgreSQL/Supabase-miljö verifierades inte i denna session. Live RLS/write/readback är därför inte verifierad.
- De här avgränsade komponentrenderingarna är inte en full §14-jämförelse av panel 4/7.
- Architect APPROVE, Critic PASS, Security APPROVE och kod-Reviewer PASS gäller sina respektive statiska/UX-granskningar. Oberoende QA godkände den lokala implementation-checkpointen och körde `pnpm check` med 75/75 tester; QA klassade den äldre breda verifieraren som NOT TESTABLE enligt ovan.
- Native installation/TestFlight och fysisk tillgänglighetskontroll kördes inte i denna session.

Källor och viewportspecifika bevis ligger i undermapparna ovan; verifierarna finns i `tools/visual-check/verify-checklist-custom-icons.py` och `verify-checklist-icons.py`.

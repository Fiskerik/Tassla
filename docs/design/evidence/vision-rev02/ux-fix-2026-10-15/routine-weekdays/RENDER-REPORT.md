# Veckodagsval för rutiner — renderunderlag

Datum: 2026-10-15 · Uppgift: `HOME-ROUTINE-WEEKDAYS-01` · Gren: `codex/ux-rethink-2026-10-15` · Fixture: syntetisk reviewdata · Browser: Chromium / React Native Web

## Render och kontroller

Public- och review-fixturer byggdes på nytt med `tools/visual-check/build.cjs` — PASS. Manuell Chromium-granskning vid 375×844 visar veckosammanfattning, legacy-sammanfattning, redigeringsläge, valda dagar och minimumfel. Browsern rapporterade inga sidfel.

- [Rutinhall, vald veckodagssammanfattning](manager-selected-weekday-summary-375x844.png)
- [Äldre NULL-regel visas med ankardag](manager-legacy-anchor-summary-375x844.png)
- [Redigerare med måndag och fredag markerade](weekdays-selected-375x844.png)
- [Tomt val visar minimumhjälp och låst sparning](weekdays-minimum-error-375x844.png)

Manuell browserkontroll läste `aria-checked=true` för måndag/fredag och `false` för tisdag, onsdag, torsdag, lördag och söndag. Alla sju kontroller hade minst 44 pt höjd; uppmätta mål var 78–106×44 pt. När sista dagen avmarkerades visades `Välj minst en veckodag.` och `Spara rutin` var inaktiverad.

Datumvektorn granskades statiskt mot TypeScript- och SQL-formler: ankare onsdag 2026-10-14, intervall 2, måndag/fredag ger fredag 2026-10-16; måndag 2026-10-12 utesluts före ankaret; nästa förfallovecka börjar måndag 2026-10-26 och innehåller 26 och 30 oktober. `repeat_weekdays IS NULL` behåller legacy-regeln samma veckodag som ankaret och modulo `repeat_interval × 7`. Runtime-paritet för SQL/TypeScript är inte provad.

Statiska lokalkontroller: `pnpm typecheck` PASS; riktad ESLint på de tre ändrade TS/TSX-filerna PASS; public/review RN Web-build PASS; `git diff --check` PASS; `python3 tools/dev_flow.py validate` PASS. Architect och Security granskade migration/RPC/legacyvägar statiskt och gav PASS efter två korrigeringar: legacy create-retry bevarar lagrade veckodagar, och 30-dagars gallring kan radera förfallna dagsrader utan att skapa tombstones. Ingen testsvit eller SQL/databas kördes.

## Designregler §14 — ändringsdelta

Bedömningen gäller enbart veckodagskontrollen och dess rutinläsning. Hemkortets, hela rutinhallens och panel 4:s fulla visuella godkännande ingår inte här.

| Punkt | Bedömning | Underlag |
|---|---|---|
| 1 | Ja | En primär `Spara rutin`-handling; veckodagarna är val. |
| 2 | Ja | Samma form och dimension för de sju valen. |
| 3 | Ej tillämpligt | Ingen deletekontroll tillkom i veckodagseditorn. |
| 4 | Ej tillämpligt | Hemkortets rader ändrades inte av denna slice. |
| 5 | Ja | Kontrollerna radbryts och behåller 44 pt höjd i 375×844. Kort viewport och större text kontrolleras i följande rutinflöde. |
| 6 | Ja | Befintliga UI-komponenter och temastilar används; ingen ny stilmekanism lades till. |
| 7 | Ja | Veckodagskontrollerna använder text, inte nya symboler. |
| 8 | Ej tillämpligt | Ingen destinationsyta eller global palett ändrades. |
| 9 | Ja | Fulla svenska veckodagsnamn exponeras; synliga etiketter är entydiga förkortningar. |
| 10 | Ja | Markerat läge följer faktisk lokal draft; ingen sparad-status visas före bekräftelse. |
| 11 | Ej tillämpligt | Ingen banner eller uppmuntran tillkom. |
| 12 | Ja | Hjälp- och feltexten använder vardaglig svenska. |
| 13 | Ja | Veckosammanfattningen visar frekvens och valda dagar. |
| 14 | Ja | Valda dagar och minimumfel renderades. Övriga skrivfel/pending/unknown är befintliga tillstånd som granskas i `HOME-ROUTINE-CHECKLIST-01`. |
| 15 | Ja, webb | Fulla kontrollnamn, checkbox-roll, markerat läge och träffytor verifierades i Chromium. Native VoiceOver, Dynamic Type och reducerad rörelse är NOT TESTABLE. |
| 16 | Nej för hel rutinhall | Referensbilden för panel 4 saknas i checkouten. Den aktuella rutinhallen visar dessutom staplade separata rutinblock, vilket bryter mot den godkända kompakta panel-4-strukturen. Detta ligger i beroendeuppgiften `HOME-ROUTINE-CHECKLIST-01`; ingen full rev02-visuell leverans påstås här. |
| 17 | Ej tillämpligt | Navigering och huvudflikar ändrades inte. |
| 18 | Ej tillämpligt | Hundidentitet/presentation ändrades inte. |

## Avgränsningar

Browserbilderna visar endast syntetiska reviewdata. De bevisar inte Supabase/RLS, migrationskörning, native interaktion, skärmläsare, större OS-text, eller SQL/TypeScript runtime-paritet. Skärmbilderna visar den lokala ändringen vid 375×844, inte att hela panel 4 visuellt har godkänts. Migrationen `202610150001_routine_repeat_weekdays.sql` är framåtriktad och har inte applicerats.

## Oberoende granskningar

- **QA PASS**, 2026-10-15: bekräftade veckoberäkning, legacy NULL, validering, CAS/retry, accessible checkbox-state, träffytor och minimumfel. QA accepterade slice-avgränsningen; befintlig manager-layout väntar på HOME-rutinhallens kompakta omtag.
- **Reviewer PASS**, 2026-10-15: RPC-namn/argument matchar migrationen; readback/equality omfattar veckodagar; legacy-ankare bevaras; screenshots stödjer de manuella 375×844-påståendena. Ingen scope- eller evidensinvändning.
- **Architect PASS** och **Security PASS** för exakt aktuell migrationskälla efter korrigeringar; **Critic PROCEED**, **Compliance PASS** för oförändrad plan och ändamål.

Ingen av granskningarna körde tester, SQL eller databasåtgärder. Migration execution, live RLS, runtime-paritet, native tillgänglighet, större text och reducerad rörelse kvarstår som NOT TESTABLE.

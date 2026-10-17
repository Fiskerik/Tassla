# Oberoende QA — VISION-R02-GESTURES v9

Datum: 2026-10-17
Resultat: **PASS** för den avgränsade v9-regressionen och sparade browserbeviset.

## Kontroller

- `tests/home-today.test.mjs` importerar `homeAgeStrip` från den aktiva `src/features/home/home-today.ts`-modulen och anropar hjälparen direkt i testet “active Home age strip keeps the contracted week, month and year marker ranges”.
- Fokustestet `pnpm exec node --experimental-strip-types --test tests/home-today.test.mjs` passerade: **4/4**, 0 fel. Den nya regressionen verifierar födelsedatum `2026-06-01` och alla fyra gränsfall:
  - Dag 140 (`2026-10-19`): veckor 0–20, aktuell 20.
  - Dag 141 (`2026-10-20`): månader 0–12, aktuell 4.
  - Första födelsedagen (`2027-06-01`): månader 0–12, aktuell 12.
  - Dagen efter (`2027-06-02`): år 1–4, aktuell 1.
- För varje fall jämför testet hela markörsekvensen och kräver exakt en aktuell markör på förväntat värde.
- v9-planen och UX-specen anger samma kontrakt. Köposten pekar på v9 och återger dag 140/141-acceptansen. Beslutet att avvakta fasbaserad åldersnavigation är uttryckligen registrerat som en senare produktbeslutspunkt; exempelintervallen är inte godkända åldersråd.
- Sparad `runtime-2026-10-17/browser-results.json`: **99/99 PASS**, blandat public/review Chromium-touch, 3 mobilstorlekar och tom `page_errors`. Resultaten innehåller age-strip touch/scroll, huvudflikssvep, Knowledge-artikel-/checklistdetaljspärr och resetflöden. Tillhörande skärmbilder finns i samma runtime-mapp.

## Begränsningar

Browserkörningen är sparad evidens från 2026-10-17 och återanvänds enligt v9-planen; QA gjorde ingen ny browser-build eller gesture-körning. Fysiska iOS/Android-gester, native accessibility och native sheet/modal-prioritet är fortsatt **NOT TESTABLE** här. Detta QA-pass verifierar den avgränsade v9-assertionen och sparade browserresultatet, inte övriga R2a-källkodsbeteenden på nytt.

Ingen produktionskod eller testimplementation ändrades under QA.

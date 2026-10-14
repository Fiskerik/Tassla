# CHECKLIST-UI-LUNA-DETAIL — render- och implementeringsrapport

Datum: 2026-10-13 · Slice: `CHECKLIST-UI-LUNA-DETAIL` · Bas: uppdaterad branch `1f2419e`

## Genomfört

- Detaljens progress och standard-/egna punkter ligger nu i en sammanhållen Card med grupperade rader och avdelare. Endast detaljens AppBar använder den nya kompakta varianten.
- Progress visar ett enda antal. Checkboxen använder hela standardraden som handling; egna punkter behåller separat redigering.
- Reviewinformationen visas en gång per detaljvy; ”Läs mer” ligger utanför uppgiftskortet.
- Den pågående raden visar ”Sparar…” och exponerar `busy`, aktuell `checked`-status samt en tillgänglig etikett med sparstatus. Bock/progress uppdateras efter lyckad bekräftelse.
- Public-rendering med reviewflaggan av gav 0 checklistläsningar och 0 checklistskrivningar. Review-rendering gav en enda reviewmarkering.

## Kontroller

- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS.
- Public- och review-build via `tools/visual-check/build.cjs` — PASS.
- `git diff --check` — PASS.
- `python tools/dev_flow.py validate` — PASS.
- Manuell Chromium-rendering/interaktion — PASS för synligt pending, `aria-busy`, `aria-checked`, oförändrad progress under pending, uppdaterad progress efter save och inga browser page errors.
- Inga tester har lagts till eller körts.

## Renderbevis

- `public-detail-375.png`, `review-detail-375.png`, `review-detail-430.png`
- `review-detail-375x667.png`, `review-detail-375x667-bottom.png`
- `review-detail-pending-375.png`, `review-detail-saved-375.png`
- `review-detail-zero-375.png`, `review-detail-complete-375.png`
- `review-detail-loading-375.png`, `review-detail-error-375.png`, `review-detail-unknown-375.png`
- `review-detail-140pct-375.png`

Granskade lägen: 375×844, 430×844, 375×667, 0/4, 4/4, loading, error, pending, saved, unknown/Kontrollera och 140 % webbläsarzoom som proxy för större text. Unknown-vyn behåller 1/4 och tidigare bockläge tills Kontrollera återläser resultatet. Vid 140 % radbryter den befintliga globala bottennavigeringen etiketten ”Kunskap”. Navigationen är skyddat område och har inte ändrats i denna detaljslice; fyndet behöver bedömas separat.

## Avgränsningar

Native VoiceOver/Dynamic Type, riktiga iOS/Android-vyer och Supabase/RLS är `NOT TESTABLE` i denna webbrendering.

## Oberoende QA

Oberoende read-only QA gav **PASS** 2026-10-13 efter att 0/4, 4/4, loading, error och unknown/Kontrollera-renderingarna kompletterats. QA godkände §14 för denna detaljslice. Den globala navigationens radbrutna ”Kunskap” vid 140 % registreras separat och blockerar inte slicen. Reviewer återstår.

Oberoende read-only Reviewer gav **PASS** för exakt v4. Confirmed-save/dataflöden är oförändrade och produktkomponentvarianterna är opt-in. En framtida körning av `verify-know02.py` sparar sina bilder i den äldre KNOW-02-katalogen; de här detaljbilderna ligger kvar under den dokumenterade slice-sökvägen.

## Nästa steg

Oberoende QA och därefter separat kodgranskning av exakt denna slice. Overview och Custom förblir `planned` tills detaljslicen är godkänd och checkpointad.

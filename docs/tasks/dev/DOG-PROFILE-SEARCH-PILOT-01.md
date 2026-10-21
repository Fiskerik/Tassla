# DOG-PROFILE-SEARCH-PILOT-01 — genomförandeplan v2.2

**Status:** lokal kodcheckpoint klar; QA och oberoende Reviewer PASS, Security APPROVE. Architect APPROVE och Critic PROCEED gäller plan v2:s oförändrade beteendekontrakt. v2.1–v2.2 är endast §14-dokumentationssynk.

**Ägarmandat:** MVP rev02 bekräftad 2026-10-20; första apppilot är den gemensamma sökbara rasväljaren i första profil, lägg till hund och profilredigering (`docs/mvp.md` §4.1 och §14).

**UX-spec:** [`docs/plans/DOG-PROFILE-SEARCH-PILOT-UX-SPEC.md`](../../plans/DOG-PROFILE-SEARCH-PILOT-UX-SPEC.md) v2.2.

**Bas:** dokumentgren `codex/mvp-rev02-approved-plan`, commit `a57e17388d380800c6a378b6368babe6877b4f1c`; pilotgrenen `codex/dog-profile-search-pilot`. Dokument-PR #23 är öppen och ej mergad. Eriks senare instruktion 2026-10-21 ger nu mandat att committa och pusha den sammanhängande MVP UI-checkpointen; pushstatus redovisas först när den faktiskt är utförd.

## Deluppgifter

1. **Gemensam väljare och formulärkoppling** — ägare: Implementer. En återanvändbar lokal sökkomponent i onboardingområdet kopplas till create/add `ProfileScreen` och `EditDogProfileScreen`. Första profil/add börjar utan valt ras-ID; edit behåller sparat ID. Ändra inte befintliga data-/sparägare.
2. **Regressions- och renderbevis** — ägare: Implementer för fixture/harness/docs i app-/toolytan; QA äger ändringar av testfiler och oberoende verifiering. Täcka exakt lokal normalisering/sorteringsordning, explicit katalog-ID inklusive tidigare godkänd Okänd ras-fallback när entry finns, fritext/stängning utan val, tre callsites, tom katalog/loading/error/retry, busy/pending, modalens fokus och oförändrade create/readback/editflöden. Utöka syntetisk harness med `profile-create`, `profile-add`, `profile-edit` och interaktiv capture/verifiering.

En komplett slice stängs först efter implementering, avgränsad cleanup, lokala kontroller, oberoende QA, Security och Reviewer. Live-datakoppling/native/visuell acceptans rapporteras separat.

## Skrivvägar

Exakta skrivvägar listas i queue-posten med samma ID. Den gamla v8-planen får endast en daterad statusnotis som pekar ut att katalogimport/Mix är fortsatt blockerade medan den lokala sökpiloten är frikopplad. R02-4E-UX-specen får en daterad redaktionell korrigering så punkt 16 anger NOT TESTABLE för en profilpanel som saknas; stödyta och redan beslutade krav bedöms separat. Ingen fil utanför dessa vägar ändras utan uppdaterad plan och relevant review. Produktkrav, schema, katalogdata, Mix, Home och dependencies ändras inte.

## Risk och granskning

**Risk M:** en användarresa och befintlig profilfältinteraktion ändras, men persistens/dataåtkomst gör det inte. Architect granskar resplanen; Critic granskar UX-specen. Implementer utför endast godkända skrivvägar. QA kontrollerar lyckat och fel/tomt/osäkert läge samt regression; Security granskar tekniska profilskydd före merge/push-beslut; Reviewer granskar fryst diff. Compliance behövs inte eftersom inget ändamål, dataflöde, mottagare eller lagring ändras. Product behövs inte eftersom inget produktbeslut återstår i `docs/mvp.md`.

## Verifiering

- `pnpm check` — typkontroll, lint och Node-tester enligt repots faktiska script.
- `node --experimental-strip-types --test tests/breed-search.test.mjs tests/profile-screen-policy.test.mjs tests/profile-edit.test.mjs` — normalisering, bevarad ordning och befintliga profilregressioner.
- Interaktiv RN Web-regression för tre lägen: initial/add är spärrade före val och aktiveras efter radval; sökning/stängning anropar inte val; radval och tidigare godkänd Okänd ras-fallback använder endast verkligt katalog-ID; editens sparade eller ej matchade ID bevaras; tom katalog skiljs från ingen träff; fokus går in i/ut ur modal; system-back/Stäng; Add Avbryt når callback. Kör med `profile-create`, `profile-add` och `profile-edit` på 375×844, 430×844, 375×667; tangentbords-/native tillgänglighet redovisas separat.
- RN Web public/review capture med flera katalograder; skapa, lägg till och editera; före val, vald rad, match, tomt resultat/rensa, tom katalog, laddning, fel/retry och busy/pending; även 140 % text där tillgängligt. Spara endast syntetiska capture och jämförelse i specens evidensmapp.
- Bygg public/review var för sig enligt `tools/visual-check/README.md`; mellan build och browser-check starta den faktiska bundle-katalogen, exempelvis `python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-dog-profile-search/public`, kör verifieraren mot `http://127.0.0.1:4173/`, stoppa servern och upprepa med review-katalogen.
- `python tools/visual-check/verify-dog-profile-breed-search.py --base-url http://127.0.0.1:4173/` — interaktiv verifiering och syntetiska captures från den lokala RN Web-bundlen.
- `python tools/dev_flow.py validate`; `git diff --check`.

Kommandon körs först efter implementation; plantexten är inte QA-evidens. Ingen fullständig live-, native-, release- eller exakt profilpanelacceptans påstås.

## Ändringslogg

- **v1, 2026-10-20:** första smala pilotplanen enligt aktuellt MVP-mandat. Återanvänder befintlig katalog; skiljer bort tidigare blockerade katalogimport-/Mix-krav.
- **v2, 2026-10-20:** efter Architect CHANGES: specificerat lyckat tomt katalogsvar, ej matchat sparat edit-ID, fokus/reset/back/busy/pending, exakta beteendetester, separat add-harnessläge och synkade skrivvägar. Behållit den tidigare godkända direkta `Okänd ras`-åtgärden när den verkliga katalogposten finns. Architect APPROVE och Critic PROCEED för exakt v2; implementation får starta enligt denna plan.
- **v2.1, 2026-10-21:** redaktionell synk efter att QA-evidensen visade en äldre R02-4E-formulering som sa “Nej” för saknad profilpanel. Den äldre UX-specen lades till i skrivvägarna och punkt 16 korrigerades till NOT TESTABLE/ej tillämpligt. Ingen kod, funktion, risk, scope eller acceptanskriterium ändrades; Architect/Critic-verdicts för beteendekontraktet v2 återanvänds.
- **v2.2, 2026-10-21:** riktad diffkontroll hittade den gamla “Nej”-etiketten även i R02-4E:s kopplade renderingsrapport. Rapporten lades till i skrivvägarna och etiketten korrigerades; bilder och deldimensioner är oförändrade. Ingen kod, funktion, risk, scope eller acceptans ändrades. Reviewer följdgranskade slutlig v2.2-diff och gav PASS.

## Planreview

- **Architect, plan v2: APPROVE.** Samtliga v1-fynd stängda: create/add/edit, tom katalog, saknat sparat ID, fokus/reset/back/busy/pending, testbar sökning, add-cancel, synkade skrivvägar och korrekt §14-markering. Architect noterade att körbeviset ska ange faktiskt serverkommando mellan build och browser-verifiering; detta har lagts till ovan.
- **Critic, plan v2: PROCEED.** Inga betydande invändningar. Granskningen bekräftade scope enligt `docs/mvp.md` §4.1, verkliga katalog-ID:n, bevarande av saknat sparat ID, skillnaden mellan tom katalog och sökning utan träff samt verifiering av alla tre flöden. Kritiska kontrollfall: tom katalog, saknat edit-ID och stängning utan val.

## Implementerhandoff

- Ändrade exakt planerade app-/harnessfiler: `SearchableBreedPicker.tsx`, `breed-search.ts`, `ProfileScreen.tsx`, `EditDogProfileScreen.tsx`, onboarding-README samt lokal UI-harness, dess README och verifierarscript. Testfiler och evidenscapturer lämnades till QA.
- PASS: public och review RN Web build; browserverifierare 28/28 med `--no-capture`; `pnpm typecheck`; edge-account typecheck; ESLint (fullt och riktat); Python compile; `git diff --check`.
- Första `pnpm check` visade ett föråldrat statiskt assertion som letade efter rasradens stilklass i `ProfileScreen.tsx` efter dess godkända extraktion till den delade väljaren. QA flyttade assertionen till stylingägaren och behöll callsite-/beteendekontraktet; därefter PASS: typecheck, edge typecheck, ESLint och 64/64 testfiler.
- Browsern fångade och implementeringen rättade `findNodeHandle`-begränsningen på webben genom DOM-ref-fokus, explicit `aria-checked` för React Native Web samt Escape-stängning. Native använder installerat React Native accessibility-API. Browserresultatet är syntetiskt och verifierar inte backend, native eller verklig skärmläsare.
- Cleanup genomförd: namn/pressed-state förenklade efter typ-/lintkontroll; README beskriver entry points, dataflöde, testläge och begränsningar. Ingen dependency, datamodell, save/readback, route, kennel-, ålders- eller konto-/hundlogik ändrad.
- QA PASS: riktat Node-test (3 filer), `pnpm check` (64/64 testfiler), separata public/review-builds samt 28/28 browserkontroller per bundle. Båda evidensmapparna har 28 app-only PNG-bilder med korrekta 375×844, 430×844 och 375×667 mått; capture-manifest och 18 punkter finns i [`docs/design/evidence/vision-rev02/dog-profile-breed-search/README.md`](../../design/evidence/vision-rev02/dog-profile-breed-search/README.md). Exakt profilpanelpunkt 16 är NOT TESTABLE eftersom panel saknas i `vision_rev02.jpg`; stödskärmen bedöms separat.
- Security **APPROVE**, inga fynd. Reviewer **PASS** utan fynd för fryst kod-/docs-diff v2.2 och evidence; följdgranskningen bekräftade att R02-4E-renderingsrapportens ändring endast är redaktionell. Live/RLS, native, 140 % Dynamic Type, full onboarding→Home och release förblir separata NOT TESTABLE-statusar.

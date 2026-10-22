# Hem / panel 1 — lokal verifiering efter ägarstyrning

**Datum:** 2026-10-21
**Plan:** [`VISION-R02-HEM-2-3-8-2026-10-21-v15.md`](../../../../../../plans/VISION-R02-HEM-2-3-8-2026-10-21-v15.md) — Architect APPROVE, Critic PROCEED.
**Referens:** panel 1 i [`vision_rev02.jpg`](../../../../../../vision_rev02.jpg).
**Miljö:** React Native Web i Chromium, syntetisk data. Home appvy 375×844 och 430×844; reviewbanner ligger separat 32 pt ovanför.
**Skärmbilder:** `public/` och `review/`; huvudsekvensen finns i `home-default-375.png`, `checklist-375.png`, `checklist-routine-manager-375.png` och `checklist-routine-longpress-edit-375.png`.

## Resultat

- Public: **25/25 PASS**. Review: **35/35 PASS**. Maskinresultat finns i respektive `RESULTS.json`.
- Hemmets dagsrubrik visar räknaren och en 44×44 pt pil. Ingen `Hantera`, `Checklista` eller `Visa alla`-text visas i rubriken. Pilens tillgängliga namn är `Öppna Checklistor`; tryck öppnar hela listvyn med titeln `Checklistor`.
- Vanligt tryck på en rutindetalj öppnar managern för samma rutin utan editläge. Den tillgängliga `Redigera rutin Morgonrutin`-pennan finns kvar.
- Hållet pointer-tryck på rutindetaljen öppnar befintligt redigeringsläge. Skärmbilden visar redigeringsfältet; vanligt `onPress` faller inte igenom och checkboxens sparcallback anropas inte. Checkboxen är fortsatt en separat handling. Träningsraden saknar långtrycksredigering.
- Den synliga hjälpen och komponentens native `accessibilityHint` innehåller båda `Håll inne på rutinen för att redigera.` Test och renderkontroll verifierar text-/prop-kopplingen. RN Web exponerar inte `accessibilityHint` som DOM-attribut; detta är inte ett native VoiceOver-prov.
- Femrads-reviewns destinationskort har **16 pt** fri yta före bottenmenyn vid både 375×844 och 430×844. Alla Home-knappar klarar 44×44 pt. 140 % text ger ingen horisontell overflow. 375×667 kan scrolla till sista genvägen ovanför menyn.
- Public tomdag saknar 0/0. Loading, empty, error, unknown, partial, pending, failed och readback är fortsatt renderade. Checkboxen ändras i review-fixturen först efter syntetisk bekräftelse.
- Alla renderdata är syntetiska. Ingen live Supabase/RLS, telefon, native Dynamic Type eller VoiceOver/TalkBack testas.

## §14

| # | Resultat | Bedömning |
|---:|---|---|
| 1 | Ja | Inga konkurrerande huvudknappar i Hemmets dagsrubrik; pilen går till den fullständiga listan och de tre genvägarna har egna mål. |
| 2 | Ja | Logga, Träna och Kunskap har samma storlek, vikt och avstånd. |
| 3 | Ja visuellt | Radering finns i befintlig rutinmanager med separat bekräftelseflöde. |
| 4 | Ja | Rutincheckbox och detaljtryck är skilda; Hemraderna saknar repetitiva textknappar och kategoriikoner. |
| 5 | Ja | Home-rader och pil har minst 44 pt mål; review har 16 pt marginal före bottenmenyn i båda bredderna. |
| 6 | Ja | Befintliga `Card`, `DailyActivityItem`, `DestinationTile` och semantiska tokens återanvänds; inga nya färger eller dependencies. |
| 7 | Ja | Befintliga Ionicons används för sol, tips, chevron och navigation. |
| 8 | Ja visuellt | Varm yta, gul tipsaccent, grön progress och blå/gröna/lila genvägar syns. Ingen ny pixelprovtagning av kontrast gjordes. |
| 9 | Ja | Pilen öppnar Checklistor; träningsraden går till Träning; rutintryck och checkbox har separata resultat. |
| 10 | Ja | Räknaren speglar bekräftad dagsstatus; okänd/tom data ger ingen fabricerad 0/0. |
| 11 | Ej tillämpligt | Ingen streak, gratulation eller beteendepåstående visas. |
| 12 | Ja | Kort vardaglig copy; fel och okända resultat presenteras utan falsk framgång. |
| 13 | Ja | Hälsning, hundnamn/ålder, `Just nu`, dagskort och tre genvägar följer målbildens ordning. |
| 14 | Ja lokalt | Loading, empty, error, unknown, partial, pending, failed och readback renderas. |
| 15 | NOT TESTABLE native | RN Web visar 44 pt mål och 140 % layout; native Dynamic Type, hjälpmedel och reducerad rörelse provades inte. |
| 16 | Ja för lokal render med dokumenterad ägarreferensavvikelse | **Komposition:** hälsning/porträtt/åldersremsa → `Just nu` → dagskort → genvägar. **Färger:** varm grund, grön progress, blå/grön/lila mål. **Typografi:** befintliga tokenroller och 140 % layout. **Former:** sammanhållen kortform; manuella rutincheckboxar är fyrkantiga, medan träningsradens icke-interaktiva status är rund. **Ägarreferens:** Eriks bifogade skärmbild 2026-10-21 visar den runda träningsmarkören; den behålls för denna panel enligt den visade referensen, trots standardregeln i `docs/design-rules.md` §4 som anger fyrkantig status. **Objekt:** generiskt märkt porträtt och fem dagsrader. **Täthet:** fem rader och genvägar ryms med 16 pt reviewmarginal. |
| 17 | Ja | Checklistor är en underordnad vy och introducerar ingen ny huvudflik. Panel 2/3-ingångarna aktiveras inte i denna checkpoint. |
| 18 | Ja | Aktivt hundnamn/ålder och relevant Home-ingress visas; bilden är märkt `Standardbild`. |

## Statusgräns

Home-layouten, Checklistor-routen, tap/longpress-separationen och syntetiska tillstånd är lokalt verifierade. Native tillgänglighet, live ägardata/RLS, signerad app och release är fortsatt **NOT TESTABLE** och ingår inte i detta lokala PASS.

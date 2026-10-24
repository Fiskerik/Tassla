# UI-/UX-GAP — evidensindex 2026-10-23

Aktuell bedömning och implementationsordning: [GAP-UI-UX-rev02-2026-10-23.md](../../../GAP-UI-UX-rev02-2026-10-23.md).

## Baslinje och metod

GitHub `main` vid avstämningen: `eea0984aba44ef17707e7d583b3f9bf6b165c7ee`, tree `95931982ff0c23c33ecee3ed922500c49065434f`. En separat källkopia skapades från GitHub-trädet och befintliga lokala filer med identiska blob-hash. 680 relevanta filer verifierades; inga hashavvikelser kvarstod. Appens källkod ändrades inte för bilderna. Audit-fixturen och native API-shims är separata från produktkoden.

- [baseline.json](baseline.json): commits, ändrade branchfiler, metod och källmanifest för app/src.
- [ui-actions-main-eea0984.csv](ui-actions-main-eea0984.csv): 133 analyserade JS/TS/TSX-filer, 0 parserfel, 484 actionkodplatser. 371 appkod, 48 delade, 65 preview/galleri. Antalen är inte synliga runtimeknappar eller antal fel. Äldre heuristisk designpolicy har inte kopierats in i denna rådata.
- [capture-metrics.json](capture-metrics.json): 14 nya fångster, viewport, knappetiketter/geometri, fixtureanteckningar och JavaScript-pageerrors. Inga pageerrors registrerades. Mätningarna tas efter att modalens animation har stannat.
- [capture-ui.py](capture-ui.py): fångstskript; inga liveanrop eller backendtester.
- [prepare-fixtures.py](prepare-fixtures.py): skapar audit-fixturen i en isolerad kopia av baslinjen.

Playwright/Chromium renderade de verkliga React Native-komponenterna genom repoets befintliga RN Web-harness. Klockan sattes till 2026-10-23 18:00 UTC för att fixtureloggar från samma dag inte skulle vara framtida jämfört med granskningens klockslag. Bilderna är syntetiska, inte native iOS eller ett installerat TestFlight-bygge. Ingen Supabase/RLS/migration eller full app-testsvit kördes.

Rasväljaren har 24 syntetiska alternativ för listgeometri. Kunskapsbilderna finns i två klasser: okända fixture-ID:n ger avsiktligt textfallback; tilldelade exempel använder tre befintliga content-ID/version-nycklar med syntetisk text. Det säger inget om faktiskt publicerat urval eller katalogens kvalitet.

## Bilder

| Bild | Vad som granskas |
|---|---|
| [Profil, första vyn](synthetic-main-profile-24-breeds-375.png) | Intro-/hundvalstäthet och början av inline-raslistan. |
| [Profil, efter raslistan](synthetic-main-profile-below-breeds-375.png) | 24 alternativ skjuter ned datum, åldersval och sparning. |
| [Ny egen punkt](synthetic-main-checklist-add-375.png) | Titel utan ikonval; två fullstora handlingsrader och X. |
| [Ändra egen punkt, 375×844](synthetic-main-checklist-edit-375-844.png) | Fyra 56 pt-handlingar, 260 px inklusive mellanrum. |
| [Ändra egen punkt, 375×667](synthetic-main-checklist-edit-375-667.png) | Samma handlingsyta tar 39 % av skärmhöjden. |
| [Ändra egen punkt, 430×844](synthetic-main-checklist-edit-430.png) | Bredare vy löser inte den lodräta knappstapeln. |
| [Loggredigering](synthetic-main-log-edit-375.png) | Radera/Avbryt i innehållet, X och separat Spara-footer; fast hög sheet. |
| [Hälsohändelse, ändra](synthetic-main-health-edit-375.png) | Sheet-rubrik, informationsrad, inre kort/rubrik och scrollande sparknapp. |
| [Påminnelser](synthetic-main-reminders-375.png) | Introduktion, hjälprad och stora beskrivande valkort. |
| [Kunskap, okända fixture-ID:n](synthetic-main-knowledge-unassigned-375.png) | Avsiktlig fallback; får inte användas som bevis att riktiga guider saknar bilder. |
| [Kunskap, tilldelade bilder, 375](synthetic-main-knowledge-assigned-375.png) | Aktuell `main`-komposition med tre exempel och befintligt bildmanifest. |
| [Kunskap, tilldelade bilder, 430](synthetic-main-knowledge-assigned-430.png) | Samma komposition vid 430 px. |
| [Träning](synthetic-main-training-375.png) | Aktiva segment och bildkort; tillfällig review-text är inte publikt innehåll. |
| [Tassla-pass](synthetic-main-passport-375.png) | Exempel där en tydlig textad Dela som PDF-handling hjälper. |

Kontaktblad är endast märkta montage av originalen: [handlingsytor](contact-actions.png), [övriga skärmar](contact-screens.png). De är inte egna appviewports.

## Reproduktion

Utgå från en isolerad checkout av exakt baslinje-SHA med appens befintliga dependencies. Granskningen använde befintliga verktyg i `/tmp/tassla-ui-tools`, installerade utanför appen. Inga paket- eller lockfiler ändrades.

1. Kör `prepare-fixtures.py <sökväg-till-isolerad-checkout>`.
2. Bygg repoets `tools/visual-check/build.cjs` med `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools`, `TASSLA_UI_REVIEW=true`, `TASSLA_UI_ENTRY=tools/visual-check/gap-audit-app.tsx` och `TASSLA_UI_OUTPUT=/tmp/tassla-gap-preview/app`.
3. Bygg samma verktyg med entry `tools/visual-check/know02-app.tsx` och output `/tmp/tassla-gap-preview/knowledge`.
4. Servera `/tmp/tassla-gap-preview` på `127.0.0.1:4267` och kör `capture-ui.py`. Utdata skrivs intill skriptet. En miljö som spärrar localhost-sockets behöver tillåta den lokala audit-servern och Chromium.
5. Råinventeringen bygger på baslinjens `tools/inventory-ui-actions.cjs`; kör den i den isolerade checkouten, inte över den historiska inventeringen i en arbetsbranch. För den sparade CSV:n behölls sakfälten och den föråldrade heuristiska rekommendationskolumnen togs bort.

Detta underlag ger källkodstäckning och exempel på faktisk webbrendering. Det är inte full §14-acceptans, oberoende native QA eller ett nytt godkännande av databas-/releasefunktion.

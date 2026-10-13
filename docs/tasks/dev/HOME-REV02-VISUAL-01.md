# HOME-REV02-VISUAL-01 — Hem rev02 visuella ombyggnad

Plan v2 · 2026-10-13 · **Superseded; integrated into VISION-R02-2 v10.**

## Status

Den separata HOME-tasken startades inte. Oberoende QA underkände VISION-R02-2 v8 både för raseligibility i SQL och Hemmets §14-rendering. Eftersom dess Home-skrivfiler överlappade flyttades UI-korrigeringen till den seriella R02-2-korrigeringsplanen [`vision-rev02-r02-2-v10.md`](./vision-rev02-r02-2-v10.md). Architect och Critic lämnade CHANGES för plan v2: referensbildens hundbeskärning var för vid och kriteriet för mutationsåterkoppling motsade sig självt. V10 ersatte den separata sekvenseringen och definierade fixture-porträtt, mutationsfeedback samt samlat R02-2-scope. Koden är nu implementerad i v10-scope; se dess checkpoint. Denna plan är historisk och fortsatt superseded.

## Mandat och mål

MVP-spårning: `docs/mvp.md`, **Måste med: produkt-MVP → Skärm 1. Personligt Home/Today** (särskilt att visa relevant hjälp, koppla till konkret handling och visa ägarvalda rutiner/källhärledd progress). Erik har uttryckligen bett att Hem uppdateras efter det nya designregelverket och panel 1 i `vision_rev02.jpg`. Arbetet är en avgränsad presentationsändring av den redan implementerade R02-2-dagsmängden. Övriga skärmar omfattas nu av skärmkontrakten och byggprompten, men deras kodmigration ingår inte i den här första Hem-delen.

**Användaruppgift:** snabbt se hundens ålder och ett relevant råd, överblicka dagens val och nå Logg, Träning eller Kunskap.

**Huvudhandling:** markera en egen rutin som klar eller öppna Träning från ett valt träningssteg. Raden behåller den befintliga destinationscallbacken; ingen deep-link eller ny navigation läggs till. En gemensam fördjupning hanterar dagens urval och rutinmallar.

## Sekvensering mot R02-2

`VISION-R02-2` är i köstatus `qa`, men QA/Reviewer har ännu inte stängt checkpointen. Dess godkända v8-scope saknar de nya UI-filerna i denna plan, så den befintliga tasken lämnas fryst och oförändrad. Registrera HOME-REV02-VISUAL-01 som en separat queue-task i `planned` efter planreviews, med `depends_on: ["VISION-R02-2"]`. Starta implementation först efter att R02-2 når `done`; detta förhindrar samtidigt QA och skrivning i överlappande Home-filer. R02-3 förblir efter denna Hem-del.

## Specifikation och bevarade regler

Följ `docs/design-rules.md` §0–4 och §14 samt `docs/plans/HOME-REV02-visual-ux-spec.md`. Ändra inte R02-2:s datakällor eller skrivsemantik:

- Endast ägaren markerar en egen rutin; completion visas först efter bekräftad sparning.
- Träningscompletion kommer från sparad, versionsbunden progress för rätt lokal dag. Träningsraden öppnar Träning och har ingen egen checkbox.
- Öppnad guide, vårdplan eller olänkad logg räknas inte som dagsuppgift.
- Räknaren avser hela aktiva dagsmängden, även när Hem visar högst fem rader.
- Alla nuvarande rutin- och träningshanteringar behålls i en fungerande BottomSheet. Radera rutin skiljs från att ta bort den från dagens urval.

## Leverans i denna del

1. Lägg till namngivna Home-/destinationsfärger och en opt-in varm, konturlös kortvariant. Ändra inte andra skärmars standardutseende.
2. Uppdatera Hem till en enda rubrik “Dagens att göra”, räknare/progress och kompakta fyrkantiga rader utan kategorichip, Visa- eller Ta bort-knappar. Korta träningsrader visar stegtiteln; full programtitel ligger i fördjupning/Träning.
3. Flytta befintlig rutin- och träningshantering till `DailyActivityManagerSheet`. Rubrikchevron och “Visa alla” öppnar samma fördjupning; tomt läge har “Välj dagens aktiviteter”. Fel och retry för en mutation ligger kvar i sheeten där handlingen sker.
4. Visa tre tydligt olika blå/gröna/lila destinationskort med tass, träningshatt och bok. Just nu-kortet får en varm gul symbolaccent och chevron bara när det finns verklig destination.
5. Behåll hundmodellens saknade personliga foto tydligt: i public Home används befintlig varm `dog-mascot.png`-fallback. Review-fixturen beskär den befintliga genererade `puppy-training.png` till ett 120×120-fönster runt valpens ansikte: använd bildytan 228×152 pt, offset x=−60/y=−16 i den klippta ramen, `cover` utan färgfilter. Det väljer ungefär den centrala bildregionen x=404–1213 och y=108–916 av originalet 1536×1024; beskärningen ska synligt utesluta människans ansikte och fokusera valpens huvud. Bilden är bara ett syntetiskt exempel under review-bannern. Ingen bild påstås vara användarens hund och ingen fotouppladdning byggs.
6. På Home-rutinbocken visas pending på samma rad; completion ändras först efter bekräftad skrivning och återläsning. Fel/osäker status och befintlig retry är kopplade till samma rutinrad på Hem. Åtgärder som utförs i hanteringssheeten visar sin återkoppling och retry där. Håll tillbaka gamla completionen vid fel/osäkert svar; korrelera feedback med befintlig mutationsnyckel utan optimistic toggle.
7. Uppdatera Home- och komponentguiderna, bildmanifestet, fixture och komponentgalleriet. Samma `DailyActivityItem`, kort och destinationskomponenter renderas i både produktvy och review-fixture.

## Skrivfiler

- `src/theme/tokens.ts`
- `src/components/ui/Card.tsx`
- `src/components/ui/DailyActivityItem.tsx`
- `src/components/ui/DestinationTile.tsx`
- `src/components/ui/ComponentGalleryScreen.tsx`
- `src/components/README.md`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/DailyActivityManagerSheet.tsx` (ny, endast Home-hantering)
- `src/features/home/daily-activity-model.ts`
- `src/features/home/ProductWorkspace.tsx` (endast borttagning av Home-props som inte längre används)
- `src/features/home/README.md`
- `assets/images/README.md`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `tests/home-vision.test.mjs`
- `tests/daily-activity-ui.test.mjs`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/vision-rev02.md`
- `docs/tasks/VISION-REV02.md`
- `docs/design/evidence/vision-rev02/home-visual-01/`

Skyddat: auth, navigationens tabbordning, andra skärmars kod, backend/schema, publikt innehåll, rutin-/progresssemantik, nya personuppgifter, nya dependencies och externa distributioner.

## Acceptans

1. Hem visar i rätt ordning hälsning/veckor/porträtt, Just nu, dagskortet och de tre färgade destinationskorten; ingen separat “Idag”-rubrik eller duplicerad källa-/plan-/logglista återstår.
2. Vid 375×844 och 430×844 i standardfixturen ryms rubrik, råd, fem rader och samtliga destinationskort i första vyn med minst 16 pt till fast navigation. 375×667, långa svenska titlar och 140 % text får scrolla utan klippning, överlapp eller horisontell overflow.
3. Rutinradens checkbox är fyrkantig och separat från dess detaljchevron; träningsradens status är icke-interaktiv och hela raden öppnar den befintliga Träning-vyn. Alla handlingar har minst 44×44 pt mål och korrekta skärmläsaretiketter.
4. “Visa alla”, rubrikchevron och tomlägets val öppnar den verkliga hanteringssheeten. Alla tidigare create/update/delete/select/remove/retry-flöden är kvar; mutationens pending/failed/unsure-feedback visas i sheeten. Stängning och system-back följer BottomSheet.
5. Faktiska färger, textkontrast, ikonfamilj och radformer jämförs sida vid sida mot `vision_rev02.jpg` enligt §14. Bedöm komposition, färger, typografi, komponentformer, bildroll och densitet separat. Kod-/geometrikontroller ensamma får inte anges som visuellt PASS.
6. Public Home använder inga syntetiska uppgifter eller exempelfoton. Märkt review-fixture visar fotoexempel och använder samma komponentträd; checklistans testinnehåll förblir syntetiskt.
7. README och asset-manifest skiljer public data, illustration fallback och syntetiskt exempelfoto med fokus/beskärning. Inga completion- eller produktobjektsregler ändras.

## Verifiering och avgränsningar

- Registrera HOME-REV02-VISUAL-01 som `planned`, beroende av `VISION-R02-2`; lägg även till HOME-tasken i `VISION-R02-3.depends_on` så Logg/Träning/Kunskap inte startar före Hem-checkpointen. Ange runnable checks innan tasken går till `ready`.
- Kör relevant R02/Home UI-check och full projektkontroll enligt befintligt arbetsflöde efter sista ändring.
- Bygg public och review React Native Web och spara jämförbara 375/430 px skärmdumpar; prova 375×667, 140 % text, reducerad rörelse, tomt/fel/loading, sheet-öppning/stängning och rutin-/träningsvägar.
- Separat QA och Reviewer fyller §14. Skärmdumpar saknas tills de har skapats; full fotografisk matchning och native Dynamic Type/VoiceOver förblir ej godkända utifrån webbrender.
- React Native Web med syntetiska data bevisar inte native- eller backendbeteende. Ingen live Supabase, migration eller TestFlight.

## Granskningsgrind

Architect godkänner exakt task/plan v2, beroenden, APIs och filscope. Critic lämnar PROCEED/CHANGES/STOP för begriplighet, scope och arbetsflöde. Ingen UI-kod ändras före båda resultaten är sparade i checkpointen. Planändring efter godkännande kräver ny granskning.

# FLOW-PROGRESS-01 — R6 visuell korrigering

Plan v1.2 — 2026-10-18<br>
Status: Architect APPROVE v1.2 efter QA CHANGES och ägarens ringfeedback.<br>
> Historiknotering: v1.2 är fryst som godkänt beslut. Dess segmentbaserade ringbeskrivning och dependency-exkludering ersätts för den aktuella implementationen av det separata tillägget [v1.3](FLOW-PROGRESS-01-ring-svg-amendment-v1.3.md), vars dependency Erik godkände 2026-10-18. Övrigt data-, state- och interaktionskontrakt i v1.2 gäller fortsatt.

Bas: godkänd paketplan v7 i `DOG-PROFILE-BREED-CATALOG-01-ux-spec.md`; detta förtydligar bara R6-presentationen och ändrar inte data- eller interaktionskontraktet.

## Användaruppgift och väg

Från Hem öppnar hundägaren Dagens framsteg, ser dagens bekräftade uppgifter och deras status, kan markera en egen rutin eller öppna exakt valt träningssteg och återvänder sedan till samma Hem-position.

## UX-beteende som ska bevaras

- `dailyActivities` är enda dagsmängden. Ringens tal och listan beskriver samma underlag; logghändelser räknas inte som uppgifter.
- Loading, fel, tomt, delvis/okänt, senast bekräftat, pending, sparat, misslyckat och osäkert resultat behåller sina nuvarande sanningsenliga states och återhämtningsvägar.
- Bara träning får visa en tid när exakt `completedAtByStepId` finns. Rutiner får ingen påhittad tid. Okänt blir inte noll eller klart.
- Alla aktiviteter förblir synliga och i samma ordning. Ingen veckomålsruta läggs till utan en godkänd population och period.
- Synlig tillbakaåtgärd, Hem som vald flik, exakt träningsmål, rutinens befintliga mutation/readback och scrollåterställning bevaras.

## Referensjämförelse och accepterade korrigeringar

| Referenselement | Nuvarande avvikelse | Korrigering och acceptans |
| --- | --- | --- |
| Skarp, jämn progressring | Breda kapselsegment gav en vågig ytterkant trots tätare steglängd | Använd 360 tangentiella remsor utan rundade ändar. Varje remsa är 2,5 gånger ringens båglängd per steg, så angränsande remsor täcker varandras skarvar och bildar en jämn ytter- och innerkant. Bekräftad andel och okänd del behåller samma sanningsenliga semantik. Verifiera full, halv, partiell och okänd status visuellt vid 375/430 px. Ingen ny ritdependency. |
| Titel följd av fri progressring | Extra hund-/datumrad och separat inramat ringkort | Ta bort datumraden. Visa ringen direkt på sidans varma bakgrund, utan egen kortkant. Behåll ringstorlek inom panelkontraktets 220–248 pt och samma data/semantik. |
| Stort hundporträtt i ringen | Placeholdern tar liten del av centrumytan | Öka den befintliga, neutrala placeholderbildens synliga storlek och justera centerlayouten så räknaren ryms utan klippning vid 375/430 px och 140 % text. Ingen ny ägarbild eller ny asset. |
| “Det här har ni gjort idag” följt av aktivitetskort | Dubblerad `{klart} av {bekräftade}`-rad upprepar ringens antal | Ta bort det upprepade antalet under rubriken; behåll status i ringen och beskrivande text/tillgänglig etikett. |
| Kompakt lista med ämnessymbol, text och status | Nuvarande lista ryms inte lika väl med sex syntetiska rader | Matcha radtypografi, mellanrum och yta med befintliga tokens/komponenter. Standardreferensfixturen visar tre representativa uppgifter som i panelen; separat långlista med minst sex uppgifter verifierar att inget kapas och att scrollning fungerar. Produktionslistan kortas aldrig. |
| Varm sammanfattningsyta | Sammanfattningen renderas som neutralt vitt kort | Använd befintlig varm yttoken/komponent för sammanfattningen och behåll stjärna endast för bekräftad completion. Inga nya globala tokens. |

Hundnamn och datum behöver inte upprepas i detaljvyn: den öppnas från Hemmets valda hund och dagens scope. Det faktiska listinnehållet kan skilja sig från referensens tre exempel. Ingen falsk tid, ägarbild eller veckomålsdata införs för att efterlikna bilden.

## Tillstånd och tillgänglighet

Behåll befintliga state-kontrakt och verifiera minst: loading, error/retry, empty, full known, partial/unknown, stale/refresh error, rutinmarkering med pending och återhämtning, träning öppna/retur, långlista, 375×667, 375×844, 430×844 och 140 % textproxy. Reducerad rörelse sätts före navigering i evidensfångaren. Kontrollera touchmål minst 44×44 pt, läsbara labels, progressvärde endast för komplett bekräftat underlag och ingen horisontell overflow.

Native VoiceOver, verklig Dynamic Type, safe area och live Supabase/RLS redovisas separat som NOT TESTABLE om de inte körs på enhet/backend. Ingen ny dependency är godkänd eller behövs för denna plan.

## Skrivomfång och skyddade ytor

Den ursprungliga v7-implementationen har även skrivvägarna `src/features/home/HomeScreen.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/features/home/main-navigation.ts` och `src/features/home/daily-activity-model.ts`. De implementerade ändringarna där förblir en del av R6-baslinjen, men v1.2 fryser dem: ingen av dessa filer får ändras i den visuella korrigeringen. `tools/visual-check/app.tsx` kan ändras endast om det behövs för att fånga godkända syntetiska tillstånd.

Korrigeringens skrivvägar: `src/features/home/DailyProgressScreen.tsx`, `tests/daily-progress-ui.test.mjs`, `tools/visual-check/app.tsx` endast för syntetisk fixtur, R6:s `docs/design/evidence/vision-rev02/daily-progress/`, `docs/features/daily-progress.md`, `docs/tasks/dev/DOG-PROFILE-BREED-CATALOG-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md` och denna planfil.

Skyddat/utanför denna korrigering: `HomeScreen.tsx`, `ProductWorkspace.tsx`, `main-navigation.ts`, `daily-activity-model.ts`, Hemets datakälla/layout utöver den redan godkända länken, daglig-aktiviteters beräkning/persistens, navigation/route-semantik, tränings- och rutinmodeller, schema/RLS, global tokens, dependencies, assets och R7-filer.

## Granskningsgrind

QA:s tidigare CHANGES och den tidigare §14-skärmbilden är baslinje, inte godkännande. Architect ska godkänna denna exakta korrigeringsplan innan kod ändras. Därefter ny §14-bedömning med jämförbara bilder, riktade state-/a11y-kontroller, `pnpm check`, iOS review-bundle (`TASSLA_BUILD_CHANNEL=review`, `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true`), `python tools/dev_flow.py validate`, `git diff --check`, oberoende QA och oberoende Reviewer. Kön ska referera till denna v1.2 tillsammans med v7-baslinjen; historiska v7-skrivvägar förblir frysta enligt ovan. R7 startar först när R6 passerat dessa grindar.

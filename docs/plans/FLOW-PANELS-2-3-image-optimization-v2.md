# FLOW-PANELS-2-3 — lättare panelspecifika hundbilder

- **Datum:** 2026-10-21
- **Uppgift:** bildassetar inom `FLOW-DEVELOPMENT-01` och `FLOW-PROGRESS-01`
- **Grundplaner:** `VISION-R02-HEM-2-3-8-2026-10-21-v8.md`, checkpoint 2 och 3; `FLOW-DEVELOPMENT-01-route-correction-v5.md`
- **Version:** v2
- **Supersedes:** v1, efter Architect CHANGES och Critic CHANGES. V1 är INAKTIV och behålls enbart som granskningshistorik.
- **Status:** INAKTIV — ersatt av [v5](FLOW-PANELS-2-3-image-optimization-v5.md); bevaras som granskningshistorik.

## Syfte

Erik beställde flera nya, separata hundmotiv så samma porträtt inte återanvänds överallt. Fyra motiv finns: svart-/tanvalp i skog för Utveckling, creme-/rostfärgad terriervalp hemma för Dagens framsteg, Shiba i park reserverad för Träning och senior schnauzer hemma reserverad för Insikter. De två första används redan i sina respektive paneler men är fortfarande 2,1–2,5 MB PNG. Denna slice konverterar dessa assetar till metadatafria JPEG utan att ändra motiv, beskärning, mått, layout eller bildroll. Reservbilderna arkiveras i samma format, men deras slutliga visningsstorlek bedöms först när respektive panel har en riktig produktvy.

## Beslutade bildroller och konkreta visningsytor

| Panel | Asset och källa | Verklig användning | Format/mått |
|---|---|---|---|
| 2 Utveckling | `development-hero-puppy-black-tan-forest.png`, källa 1122×1402 | Hero använder `cover`, höjd 232 pt, full innehållsbredd vid 375 och 430 pt viewport | `development-hero-puppy-black-tan-forest.jpg`, 1122×1402, JPEG kvalitet 86 |
| 3 Dagens framsteg | `daily-progress-hero-puppy-terrier.png`, källa 1254×1254 | Samma `cover`-bild används i 104×104 pt ringporträtt, loading-yta med 143,84 pt höjd och empty-yta med 167,04 pt höjd; jämför alla tre vid 375 och 430 pt viewport | `daily-progress-hero-puppy-terrier.jpg`, 1254×1254, JPEG kvalitet 86 |
| 6 Träning, reserverad | `training-hero-shiba-park.png`, källa 1024×1536 | Ännu ingen produktreferens eller godkänd visningsyta; endast arkiverad/reserverad | `training-hero-shiba-park.jpg`, 1024×1536, JPEG kvalitet 86; ingen skärmspecifik bildacceptans före verklig panel |
| 8 Insikter, reserverad | `insights-hero-senior-schnauzer.png`, källa 1024×1536 | Ännu ingen produktreferens eller godkänd visningsyta; endast arkiverad/reserverad | `insights-hero-senior-schnauzer.jpg`, 1024×1536, JPEG kvalitet 86; ingen skärmspecifik bildacceptans före verklig panel |

Utveckling och Dagens framsteg ska ha varsin unik bild. Hem behåller sin befintliga standardbild. Reservbilderna får inte kopplas till en panel innan den panelens layout och bildroll är implementerad och granskad. Inget motiv framställs som användarens hund eller som bevis för aktivitet, hälsa eller färdighet.

## Skrivvägar

- `assets/images/development-hero-puppy-black-tan-forest.png` (ta bort från Git efter konvertering; original behålls i `/workspace/generated_images/`)
- `assets/images/development-hero-puppy-black-tan-forest.jpg`
- `assets/images/daily-progress-hero-puppy-terrier.png` (ta bort från Git efter konvertering; original behålls i `/workspace/generated_images/`)
- `assets/images/daily-progress-hero-puppy-terrier.jpg`
- `assets/images/training-hero-shiba-park.png` (ta bort från Git efter konvertering; original behålls i `/workspace/generated_images/`)
- `assets/images/training-hero-shiba-park.jpg`
- `assets/images/insights-hero-senior-schnauzer.png` (ta bort från Git efter konvertering; original behålls i `/workspace/generated_images/`)
- `assets/images/insights-hero-senior-schnauzer.jpg`
- `assets/images/README.md`
- `src/features/home/DevelopmentScreen.tsx`
- `src/features/home/DailyProgressScreen.tsx`
- `src/features/home/README.md`
- `docs/plans/FLOW-PANELS-2-3-image-optimization-v1.md` (endast markera INAKTIV och länka v2)
- `docs/plans/FLOW-PANELS-2-3-image-optimization-v2.md`
- `docs/plans/FLOW-DEVELOPMENT-01-route-correction-v6.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

Originala genereringar ligger kvar utanför Git i `/workspace/generated_images/`. Ingen token-, layout-, navigations- eller datakodändring ingår i bildoptimeringen. Public- och review-fixturer ska fortsätta använda skärmarnas riktiga komponenter och får ingen egen bildkoppling.

## Acceptans

- Panel 2 och 3 använder varsin unik JPEG och behåller befintlig crop, storlek, badge och generiska `Standardbild`-roll.
- Metadatafria JPEG-filer har samma pixelmått och motiv som respektive PNG-original. Q86-versionerna jämförs visuellt mot original efter exakt `cover`-beskärning för skärmarnas befintliga layout vid 375 och 430 pt.
- Panel 2 jämförs i 232 pt hero vid båda viewportbredder. Panel 3 jämförs separat i ringporträtt, loading-yta och empty-yta vid båda viewportbredder. Huvuddetaljen ska vara skarp vid 2× och 3× visningstäthet; kompressionsblock, bandning och oskarp päls/ögondetalj innebär underkänt.
- Om faktisk app-render/skärmbild inte kan tas ska bildkvalitetskontrollen redovisas som `NOT TESTABLE`; bildoptimeringen får inte rapporteras som visuell panelacceptans. Simulerad crop eller filjämförelse kan inte ersätta verklig komponentrendering.
- De två aktiva bilderna tillsammans väger högst 1 MB och de fyra arkiverade bilderna tillsammans högst 2,5 MB. Om Q86 inte ryms inom gränsen får upplösningen inte minskas: pausa före ytterligare kvalitetsreduktion och justera planen med ny review.
- Träning-/Insiktsbilderna har ännu ingen panelreferens. När respektive panel byggs ska en separat bildacceptans fastställas från den faktiska skärmstorleken, viewporten och `cover`-beskärningen; deras arkivformat/lösning ger inte visuell panelstatus.
- Dokumentera källa, ursprungligt pixelmått/byte-storlek, nytt mått/byte-storlek och JPEG-kvalitet i `assets/images/README.md`.
- Inga nya motiv, beroenden, bildnätverksanrop, användardataändamål, layout- eller datakontraktsändringar tillkommer.

## Skills

- `tassla-consumer-ux`: följer befintliga bildroller, ärlig `Standardbild`-märkning och tillstånds-/kompositionskontrakt.
- `mobile-ios-design`: säkerställer skärpa vid relevanta iPhone-pixeltätheter utan att införa iOS-specifik layout eller nya paket.
- `docs/design-rules.md` och §14 gäller separat för full visuell bedömning av respektive panel.

## Kontroll

Jämför original och optimerad JPEG genom respektive verkliga komponentens `cover`-yta och båda viewportbredderna, 375 och 430 pt; kontrollera bildens huvuddetalj vid 2×/3× densitet. Kör `file`, byte-storlekskontroll och kontrollera att endast panel 2/3 har produkt-referenser till de aktiva JPEG-filerna medan panel 6/8 saknar `require()`-referenser. Kör riktade tester, `pnpm check`, public/review RN Web-byggen, `git diff --check` och `python -X utf8 tools/dev_flow.py validate`. Om skärmbildsrender inte kan tas ska det vara kvarstående visuell NOT TESTABLE och separat åtgärdspost, inte ett PASS.

## Exakt planreview

- **Architect:** väntar.
- **Critic:** väntar.

## Historik

- Architect v2: **CHANGES** — lägg till befintligt render-/verifieringsskript och evidence-mappar för panel 2/3 som skrivvägar, eftersom kraven omfattar riktiga komponentrenderingar vid 375/430 pt och 2×/3×.
- Critic v2: **PROCEED** — konkreta cover-ytor och reserverade panel 6/8-assets är korrekt avgränsade; skärmbild ska vara NOT TESTABLE om verklig render saknas.

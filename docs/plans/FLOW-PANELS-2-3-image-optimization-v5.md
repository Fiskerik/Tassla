# FLOW-PANELS-2-3 — lättare panelspecifika hundbilder

- **Datum:** 2026-10-21
- **Uppgift:** bildassetar inom `FLOW-DEVELOPMENT-01` och `FLOW-PROGRESS-01`
- **Grundplaner:** `VISION-R02-HEM-2-3-8-2026-10-21-v8.md`, checkpoint 2 och 3; `FLOW-DEVELOPMENT-01-route-correction-v5.md`
- **Version:** v5
- **Supersedes:** v4 efter Critic CHANGES på öronbeskärning vid 430 pt. V1–v4 är INAKTIVA och bevaras som granskningshistorik.
- **Status:** godkänd plan; Architect APPROVE och Critic PROCEED. Kopiering, JPEG-konvertering och referensbyte är godkända inom scope.

## Syfte

Erik beställde flera nya, separata hundmotiv så samma porträtt inte återanvänds överallt. Dagens framsteg använder sin creme-/rostfärgade terriervalp hemma. Träning och Insikter har varsin reserverad Shiba respektive senior schnauzer. Den tidigare vertikala svart-/tanvalpen i skog kapades i den avsedda hero-ytan. En ny liggande generering med samma generiska panelroll, men hundens ansikte i övre halvan och fri skogsstig under för åldersbågen, ersätter den. v5 konverterar den nya Utvecklingsbilden och de tre övriga aktiva/reserverade motiven till metadatafria JPEG; inga layout- eller datakodändringar görs.

## Beslutade bildroller och konkreta visningsytor

| Panel | Asset och källa | Verklig användning | Format/mått |
|---|---|---|---|
| 2 Utveckling | Ny generering `exec-8fd4573d-0aa9-46cb-8404-3714b586bc90.png`, 1536×1024 | Hero använder `cover`, höjd 232 pt, full innehållsbredd vid 375 och 430 pt viewport. Hundens huvud och ögon ska synas ovanför åldersbågen. | `development-hero-puppy-black-tan-forest-wide.jpg`, 1536×1024, JPEG kvalitet 86 |
| 3 Dagens framsteg | `daily-progress-hero-puppy-terrier.png`, källa 1254×1254 | Samma `cover`-bild används i 104×104 pt ringporträtt, loading-yta med 143,84 pt höjd och empty-yta med 167,04 pt höjd; jämför alla tre vid 375 och 430 pt viewport | `daily-progress-hero-puppy-terrier.jpg`, 1254×1254, JPEG kvalitet 86 |
| 6 Träning, reserverad | `training-hero-shiba-park.png`, källa 1024×1536 | Ännu ingen produktreferens eller godkänd visningsyta; endast arkiverad/reserverad | `training-hero-shiba-park.jpg`, 1024×1536, JPEG kvalitet 86; ingen skärmspecifik bildacceptans före verklig panel |
| 8 Insikter, reserverad | `insights-hero-senior-schnauzer.png`, källa 1024×1536 | Ännu ingen produktreferens eller godkänd visningsyta; endast arkiverad/reserverad | `insights-hero-senior-schnauzer.jpg`, 1024×1536, JPEG kvalitet 86; ingen skärmspecifik bildacceptans före verklig panel |

Utveckling och Dagens framsteg ska ha varsin unik bild. Hem behåller sin befintliga standardbild. Reservbilderna får inte kopplas till en panel innan den panelens layout och bildroll är implementerad och granskad. Inget motiv framställs som användarens hund eller som bevis för aktivitet, hälsa eller färdighet.

## Skrivvägar

- `assets/images/development-hero-puppy-black-tan-forest.png` (ta bort från Git; äldre crop som kapar huvudet)
- `assets/images/development-hero-puppy-black-tan-forest.jpg` (ta bort från Git; konverterad äldre crop)
- `assets/images/development-hero-puppy-black-tan-forest-wide.png` (ny generering, ta bort från Git efter konvertering)
- `assets/images/development-hero-puppy-black-tan-forest-wide.jpg`
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
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/development/`
- `docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/progress/`
- `docs/plans/FLOW-PANELS-2-3-image-optimization-v1.md` (endast markera INAKTIV och länka v5)
- `docs/plans/FLOW-PANELS-2-3-image-optimization-v2.md` (endast markera INAKTIV och länka v5)
- `docs/plans/FLOW-PANELS-2-3-image-optimization-v3.md` (endast markera INAKTIV och länka v5)
- `docs/plans/FLOW-PANELS-2-3-image-optimization-v4.md` (endast markera INAKTIV och länka v5)
- `docs/plans/FLOW-DEVELOPMENT-01-route-correction-v6.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

Originala genereringar ligger kvar utanför Git i `/workspace/generated_images/`. Ingen token-, layout-, navigations- eller datakodändring ingår i bildoptimeringen. Public- och review-fixturer ska fortsätta använda skärmarnas riktiga komponenter och får ingen egen bildkoppling.

## Acceptans

- Panel 2 och 3 använder varsin unik JPEG och behåller befintlig storlek, `cover`-bildvisning, badge och generiska `Standardbild`-roll.
- Metadatafria JPEG-filer har samma pixelmått som respektive PNG-källa. Q86-versionerna jämförs visuellt mot sin PNG-källa efter exakt `cover`-beskärning för skärmarnas befintliga layout vid 375 och 430 pt.
- Utvecklingsbilden visar hela huvudet, båda örontopparna och båda ögonen i 232 pt hero efter 375/430 pt `cover`-crop; den nedre åldersbågen täcker inte hundens ansikte. Den äldre kapade genereringen får ingen produktreferens och tas bort ur Git.
- Panel 2 jämförs i 232 pt hero vid båda viewportbredder. Panel 3 jämförs separat i ringporträtt, loading-yta och empty-yta vid båda viewportbredder. Huvuddetaljen ska vara skarp vid 2× och 3× visningstäthet; kompressionsblock, bandning och oskarp päls/ögondetalj innebär underkänt.
- Om faktisk app-render/skärmbild inte kan tas ska bildkvalitetskontrollen redovisas som `NOT TESTABLE`; bildoptimeringen får inte rapporteras som visuell panelacceptans. Simulerad crop eller filjämförelse kan inte ersätta verklig komponentrendering.
- De två aktiva bilderna tillsammans väger högst 1 MB; de två reserverade bilderna tillsammans väger högst 1,5 MB; alla fyra JPEG-filer tillsammans väger högst 2,5 MB. Om Q86 inte ryms inom någon gräns får upplösningen inte minskas: pausa före ytterligare kvalitetsreduktion och justera planen med ny review.
- Träning-/Insiktsbilderna har ännu ingen panelreferens. När respektive panel byggs ska en separat bildacceptans fastställas från den faktiska skärmstorleken, viewporten och `cover`-beskärningen; deras arkivformat/lösning ger inte visuell panelstatus.
- Dokumentera källa, ursprungligt pixelmått/byte-storlek, nytt mått/byte-storlek och JPEG-kvalitet i `assets/images/README.md`.
- Endast den uttryckligen begärda nya Utvecklingsbilden tillkommer i denna plan. Inga andra nya motiv, beroenden, bildnätverksanrop, användardataändamål, layout- eller datakontraktsändringar tillkommer.

## Skills

- `tassla-consumer-ux`: följer befintliga bildroller, ärlig `Standardbild`-märkning och tillstånds-/kompositionskontrakt.
- `mobile-ios-design`: säkerställer skärpa vid relevanta iPhone-pixeltätheter utan att införa iOS-specifik layout eller nya paket.
- `docs/design-rules.md` och §14 gäller separat för full visuell bedömning av respektive panel.

## Kontroll

Jämför original och optimerad JPEG genom respektive verkliga komponentens `cover`-yta och båda viewportbredderna, 375 och 430 pt; kontrollera bildens huvuddetalj vid 2×/3× densitet. Kör `file`, byte-storlekskontroll och kontrollera att endast panel 2/3 har produkt-referenser till de aktiva JPEG-filerna medan panel 6/8 saknar `require()`-referenser. Kör riktade tester, `pnpm check`, public/review RN Web-byggen, `git diff --check` och `python -X utf8 tools/dev_flow.py validate`. Om skärmbildsrender inte kan tas ska det vara kvarstående visuell NOT TESTABLE och separat åtgärdspost, inte ett PASS.

## Exakt planreview

- **Architect:** **APPROVE** — ny 1536×1024-bild behåller öron, ögon och hela ansiktet i 375/430 pt `cover`-crop; riktig komponentrender krävs för visuellt PASS.
- **Critic:** **PROCEED** — crop och åldersbåge fungerar i båda bredder; skrivvägar och v4-historik är tydliga.

## Historik

- Architect v1: **CHANGES** — korrigera require-kontrollen och ta bort tokenfil från skrivvägar.
- Critic v1: **CHANGES** — konkretisera aktiva `cover`-visningar och skjuta upp reservbildsbedömning.
- Critic v2: **PROCEED** — konkreta cover-ytor, pixeltäthet och framtida bildgrindar godkända.
- Architect v2: **CHANGES** — skrivvägar för render-/verifieringsskript och panel 2/3-evidence saknades.
- Critic v3 first pass: **CHANGES** — tog bort dubblerad v2-skrivväg och skiljde uttryckligen aktiv, reserverad och total JPEG-storleksgräns.
- Architect v3 final: **APPROVE** — render-scope, verifierare, evidence-destinationer och explicit NOT TESTABLE-gräns godkända.
- Critic v3 final: **PROCEED** — skrivvägsdubbletten och budgettydligheten rättade; panelroller och cropkrav godkända.
- v3:s 375 pt `cover`-crop-simulering visade att den vertikala Utvecklingsbilden kapar huvudet. En ny liggande generering visar hela ansiktet vid 375/430 pt i crop-simulering. v4 byter därför endast panel 2:s bildasset och lägger till acceptanskrav för synliga huvud-/ögondrag. Exakt v4-planreview krävs före assetbyte.


## Historik v4/v5

- Architect v4: **APPROVE** — landscape replacement and active crop checks were acceptable; real component render remains required.
- Critic v4: **CHANGES** — at 430 pt the ear tips clip at the top; regenerate with more headroom.
- v5 uses `exec-8fd4573d-0aa9-46cb-8404-3714b586bc90.png`, whose crop preview keeps both ear tips above the age overlay at 375 and 430 pt. Actual app rendering is still mandatory for visual PASS.

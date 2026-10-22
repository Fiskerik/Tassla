# FLOW-PANELS-2-3 — lättare panelspecifika hundbilder

- **Datum:** 2026-10-21
- **Uppgift:** `FLOW-DEVELOPMENT-01` och `FLOW-PROGRESS-01`
- **Grundplaner:** `VISION-R02-HEM-2-3-8-2026-10-21-v8.md`, checkpoint 2 och 3; `FLOW-DEVELOPMENT-01-route-correction-v5.md`
- **Version:** v1
- **Status:** INAKTIV — ersatt av [v5](FLOW-PANELS-2-3-image-optimization-v5.md); bevaras som historik.

## Syfte

Erik beställde nya hundbilder så att samma porträtt inte återanvänds i flera paneler. Fyra separata motiv har genererats. De två bilder som nu används i panel 2 och 3 är fortfarande 2,1–2,4 MB styck som PNG. V1 konverterar endast format/upplösning för att minska mobilpaketets storlek; bildmotiv, färg, komposition, synlig `Standardbild`-roll och användningsområde behålls. Ingen ny bild skapas eller retuscheras.

## Beslutade bildroller

| Panel | Asset | Motiv/roll | Målformat |
|---|---|---|---|
| 2 Utveckling | `development-hero-puppy-black-tan-forest.jpg` | Svart-/tanvalp på skogsstig; generisk standardbild i utvecklingsheron | 900 px maxkant, JPEG kvalitet 86 |
| 3 Dagens framsteg | `daily-progress-hero-puppy-terrier.jpg` | Creme-/rostfärgad strävhårig terriervalp; generisk standardbild i progressringen | 512×512 px, JPEG kvalitet 86 |
| 6 Träning, reserverad | `training-hero-shiba-park.jpg` | Rödvit Shiba i park; fristående framtida träningsmotiv | 900 px maxkant, JPEG kvalitet 86 |
| 8 Insikter, reserverad | `insights-hero-senior-schnauzer.jpg` | Grå senior schnauzer i varm hemmiljö; fristående framtida motiv | 900 px maxkant, JPEG kvalitet 86 |

Utveckling och Dagens framsteg använder var sitt motiv. Hem behåller sin egen standardbild. Tränings- och Insiktsbilderna är bara arkiverade som framtida, oanvända assets; de öppnar ingen ny panel eller produktfunktion. Inget motiv kopplas till användarens hund, hälsa, färdighet eller utförd aktivitet.

## Skrivvägar

- `assets/images/development-hero-puppy-black-tan-forest.jpg`
- `assets/images/daily-progress-hero-puppy-terrier.jpg`
- `assets/images/training-hero-shiba-park.jpg`
- `assets/images/insights-hero-senior-schnauzer.jpg`
- `assets/images/README.md`
- `src/features/home/DevelopmentScreen.tsx`
- `src/features/home/DailyProgressScreen.tsx`
- `src/theme/tokens.ts`
- `src/features/home/README.md`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `docs/plans/FLOW-DEVELOPMENT-01-route-correction-v6.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/VISION-R02-HEM-2-3-8-2026-10-21.md`

Originala PNG-genereringar ligger kvar utanför Git i `/workspace/generated_images/`. Äldre route-planer och screenshots är granskningshistorik, inte aktiva bildpekare.

## Acceptans

- Alla fyra optimerade JPG-filer skiljer sig från varandra och ser ut som sina genererade original utan synlig blockning, bandning eller oskarp huvuddetalj i avsedd appstorlek.
- Panel 2/3 importerar varsin optimerad asset. Ingen ny motivkoppling eller duplicerad hundbild introduceras.
- Bildmetadata tas bort; källfil, originalets dimensioner, ny dimension, kvalitet och slutlig byte-storlek dokumenteras i `assets/images/README.md`.
- Fyra assets tillsammans väger under 1 MB.
- Ingen användardata, ny dependency, nätverkshämtning, schemaändring eller ändrad bilduppgift tillkommer.

## Kontroll

Jämför original och optimerad bild visuellt; kontrollera `file`, byte-storlek och alla fyra require()-referenser. Kör typecheck, lint, befintliga tester, public/review RN Web-byggen, `git diff --check` och `python -X utf8 tools/dev_flow.py validate`. UI-skärmbildsjämförelse dokumenteras separat; bildoptimering innebär inte visuell panelacceptans.

## Exakt planreview

- **Architect:** väntar.
- **Critic:** väntar.

## Historik

- Architect v1: **CHANGES** — aktiva paneler ska vara de enda JPG-referenserna; reservbildernas avsaknad av produktreferenser ska kontrolleras; ta bort den ogrundade skrivvägen till `src/theme/tokens.ts`.
- Critic v1: **CHANGES** — konkretisera faktisk visningsstorlek och cover-beskärning för Utveckling och Dagens framsteg vid 375/430 pt. Dagens framsteg använder bilden i ring, loading och empty. Bedömning av reserverade panel 6/8-bilder skjuts upp tills skärmytorna finns.

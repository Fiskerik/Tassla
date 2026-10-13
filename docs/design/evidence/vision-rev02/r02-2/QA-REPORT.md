# VISION-R02-2 v8 — oberoende QA

Datum: 2026-10-13
Verdikt: **FAIL** för funktionell acceptans och **FAIL** för §14 visuell acceptans. SQL-runtime, RLS/scheduler och native-beteende är **NOT TESTABLE** i denna miljö.

## Blockerare

1. **Träningsval med flera ras mål avvisas felaktigt.** Triggern i `supabase/migrations/202610130001_daily_activities.sql` avvisar en version om den har något mål som skiljer sig från hundens ras. Workspace-regeln i `src/data/workspace-data.ts` accepterar i stället en publicerad version om minst ett ras mål matchar, eller om versionen saknar ras mål. Databasen och appen ger alltså olika utfall för en version som riktar sig till hundens ras och minst en annan ras. Lägg till regression som provar blandade matchande/icke-matchande mål och versioner med enbart icke-matchande mål.
2. **Hem missar rev02-kompositionen.** Review-skärmbilderna visar destinationskorten utanför första vyn/navområdet. De återkommande “Ta bort”-länkarna syns på varje dagsrad. Båda avviker från Hem-kontraktet och designreglernas §14. Se `home-daily-review-375.png`, `home-daily-review-430.png`, `daily-activities-expanded-375.png`, `daily-activities-expanded-430.png`, `daily-controls-open-375.png` och `daily-controls-open-430.png` i denna mapp.

## Kontroller i implementerens handoff

Följande rapporterades passerade i implementerens handoff; denna QA-rapport likställer dem inte med en ny omkörning: fokuserad Node-körning (5 testfiler), `pnpm check` (45 test), public iOS-export, `git diff --check` och `python tools/dev_flow.py validate`. Lint hade 36 varningar i orelaterade filer.

## Ej verifierat

Supabase CLI, `psql` och tillgänglig Docker-daemon saknas. Migration, RLS, grants, purge, scheduler och tvåsessionsprovet över midnatt kan inte köras här. De befintliga React Native Web-skärmbilderna visar inte native-beteende eller en fullständig public `ProductWorkspace`-integration. Större text, reducerad rörelse, fullständiga loading/error/partial-tillstånd och native-tillgänglighet är inte godkända av den tillgängliga evidensen.

## Nästa steg

R02-2 får inte gå till `done`. Gör en exakt korrigeringsplan som rättar rasguard och §14-felen i samma serialiserade arbetsuppgift, få nya Architect/Critic-granskningar och relevant Security-bedömning, implementera och ta nya skärmbilder. Databas-runtime förblir en explicit extern verifieringslucka tills den körts i en disponibel lokal Supabase-miljö.

# Oberoende Reviewer — FLOW-HOME-TRAINING-TARGET-01 v2

Datum: 2026-10-17
Verdict: **PASS för den godkända funktionella R3a-avgränsningen.** Ingen kodblockerare hittades.

## Granskning

- `HomeScreen` skickar sparat programversions-id, steg-id och aktivitets-id endast för en tillgänglig träningsrad med båda käll-id:n.
- `ProductWorkspace` gör en ny kontroll vid tryck: dagsvyn och snapshotten måste matcha aktuell livstid/scope; aktivitets-id och version/steg-par måste fortfarande stämma; publicerat program och steg måste finnas; befintlig vuxenregel måste tillåta versionen.
- Exakt träning öppnas med samma version/steg-par och returen väljer ursprungsvyn. Hemmets generella Träning-ingång fortsätter vara generell; checklistans returkontext bevaras.
- Diffen innehåller UI, tester, fixtures och dokumentation. Ingen tabell, fråga, persistens, RLS eller dependency ändrades.

## Verifieringsunderlag

Granskade plan v2, implementationens diff, regressionstestdiffar, home-guide, verifierar och sparade public/review-resultat samt skärmbilder. Båda `browser-results.json` redovisar 7/7 kontroller och noll sidfel. QA-rapporten redovisar `pnpm check` (550/550), `python tools/dev_flow.py validate`, Python-kompilering, `git diff --check` och Home-visionstester (5/5) som godkända. Diffens filnamn visar inga package/lock-, SQL- eller Supabase/RLS-ändringar.

## Kvarstående begränsningar och avvikelser

Browserfixturen renderar `HomeScreen` med en fixture-ägd callback. Stale-scenariot specialhanterar scenariot i fixturen och duplicerar en förenklad kontroll; det anropar inte ProductWorkspace-produktionens press-time-handler. Därför bekräftar browserresultatet Home-radens återkoppling och navigeringsbeteende, men är inte runtime-bevis för produktionens scope- och vuxengräns. Dessa kontroller finns i koden och granskades statiskt.

Den fullständiga visuella Rev02-matchningen för Hem är fortsatt **Nej**. Den befintliga runda träningsmarkören avviker från panelens fyrkantiga form. QA noterar även avvikelse i komposition/täthet, bland annat saknad åldersremsa och genvägskort nära bottennavigeringen. README:s §14-delbedömning anger däremot komposition och innehållstäthet som Ja för den avgränsade resan; det skiljer sig från QA:s Nej-bedömningar mot Rev02-panelen. Håll punkt 16 som Nej och justera de motstridiga delbedömningarna vid checkpointdokumentationen.

Följande är **NOT TESTABLE** i den lokala RN Web-fixturen: live Supabase/RLS, riktiga konto-, hund- och scopebyten, iOS/Android, fysisk touch/gest, VoiceOver, Dynamic Type, native safe area och installerad app. Underlaget använder syntetiskt innehåll.

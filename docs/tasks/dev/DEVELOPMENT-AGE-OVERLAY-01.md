# DEVELOPMENT-AGE-OVERLAY-01

Status: review; lokala kontroller passerar, native och TestFlight återstår. Bas `d122622645eefb3f4c44ce488afea7105624d878` samt dokumenterade lokala GAP- och linjär-tidslinjecheckpoints. Ägaren beställde 2026-11-12 mer vertikalt mellanrum mellan Utvecklingsblock och att åldersknappen placeras över bilden med cirka 80 % opak bakgrund i stället för en separat rad.

Mål: luftigare Utveckling med läsbar åldersetikett över bilden och samma raka tidslinje. Behåll kronologisk databeräkning, vuxen/okänt, visa/dölj och 44 pt träffyta. Endast bakgrunden är transparent; texten behåller full opacitet. Placera etiketten inom bilden, nära markörens horisontella läge och bort från ansiktet där möjligt. Kontrollera minst 4,5:1 för text även mot vit bakgrund. Critic PROCEED; ui-critic BRIEF rekommenderar befintliga spacingtokens, inga fasta texthöjder och separat nativeprov.

Skrivvägar: `src/features/home/DevelopmentScreen.tsx`, `src/theme/tokens.ts`, `src/theme/README.md`, `src/features/home/README.md`, `tools/visual-check/verify-vision-r02-home-panels.py`, `docs/design/vision-rev02-screen-contracts.md`, detta kontrakt, `docs/plans/GAP-2026-11-11-testflight.md`, evidens `docs/design/evidence/development-age-overlay-01/`. En skrivägare. Inga datakällor, dependencies, andra skärmar eller fotoändringar.

Acceptans: åldersknappen syns på bild utan egen rad, bakgrund cirka 80 % opak och kontrast dokumenterad, raka tidslinjens markör/progress samt visa/dölj fungerar, block får luft och inga överlapp eller horisontell scroll vid 320/375/430 och 140 % textproxy. Kör riktade datum-/syntetiska UI-prov, `pnpm check`, granska screenshot jämte före och rev02 med ägarens uttryckliga undantag, samt oberoende QA/Reviewer/UI-critic. Native Dynamic Type/VoiceOver och TestFlight redovisas separat.

## Visuell och funktionell granskning

Efterbild `docs/design/evidence/development-age-overlay-01/after-375.png` och före/efter är granskade. UI-critic såg etiketten över bildens nederkant med fri hunds ansikte och tydligt större blockmellanrum; den separata etikettraden är borttagen. Vit text mot `#124D35CC` på helt vit underliggande yta beräknas till minst 5,61:1; faktisk pixelrendering/antialiasing är inte uppmätt. Oberoende QA körde datumtest 5/5 och 91/91 syntetiska RN Web-kontroller, inklusive 320/375/430, ändar, dold/visad etikett, vuxen/ogiltigt datum och 140 % textproxy. Reviewer fann ingen konkret blockerare. QA-resultat finns i `QA-RESULTS.json`; panel 2-jämförelse i samma katalog. Native VoiceOver-fokus, faktisk Dynamic Type och telefontryck är inte verifierade; full panelacceptans avser även äldre avvikelser och påstås inte.

Full `pnpm check` PASS: typecheck, edge-typecheck, lint och 990 tester (989 PASS, 1 skipped). `git diff --check` PASS. Den första gemensamma körningen fann en avbruten oaktiverad fotoprototyp; dess återhämtningsprov rättades, kontrollerades separat och ingår i denna godkända körning.

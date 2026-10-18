# R6 Dagens framsteg — evidens

R6 FLOW-PROGRESS-01 lägger till en detalj från Hem med samma dagsmängd och mutationsväg. Se [implementationens data- och interaktionskontrakt](../../../../features/daily-progress.md), [§14-matris och avvikelser](SECTION14.md), samt [browser-manifest](browser-results.json).

Referensbilden är `vision_rev02.jpg` i repositoryts rot; [panel 3-utdraget](reference-panel-3.png) sparas bredvid R6-bilderna för direkt jämförelse. `public/` och `review/` innehåller syntetiska React Native Web-bilder. Review-banner är fixtureläge, inte annan produktpresentation.

Fångsten reproduceras med `capture-evidence.mjs` efter att `tools/visual-check/build.cjs` producerat public/review-fixtures och de har serverats på 127.0.0.1:8785/8786. Sätt `TASSLA_UI_TOOLS` till verktygsroten med Playwright och `TASSLA_CHROME` till Chrome/Chromium-sökvägen. Scriptet ställer `prefers-reduced-motion: reduce` före navigering och stänger av CSS-animationer i skärmbilderna. Manifestet noterar körningens inställningar.

Standardbilderna använder tre representativa uppgifter för jämförelse med panelen; [sexradsbilden](review/review-daily-progress-full-known-375x844.png) kontrollerar separat den fulla listan. Ringen ritas som sammanhängande SVG-cirklar med exakta strecklängder för bekräftad, okänd och återstående status. Det undviker segmenterade ytterkanter och behåller samma tjocklek i alla progresslägen.

Automatiserade bild-/interaktionskontroller täcker 375×844, 430×844, 375×667, 140 % webtextproxy, loading/error/empty/stale/unknown samt returvägar. Den senaste matrisen har 26 viewport-/tillståndsfall och 5 interaktioner. SVG-stroken kontrolleras direkt: halv ring har exakt 180 graders grönbåge, full ring är heldragen och okänd status har en 8-graders amberbåge plus 1-graders lucka. Stale fångas i både public och review vid 375 och 430 px som neutral 12 px bana utan progressbar-semantik. Kontrollerna verifierar inte live Supabase/RLS eller native rendering. Punkt 16 i §14 är **Nej**: personligt porträtt saknas, metadata/typografi avviker och ett verkligt veckomål saknar datakontrakt och utelämnas. Den verkliga dagslistan visas alltid komplett.

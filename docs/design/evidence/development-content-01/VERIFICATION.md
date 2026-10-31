# Development — jämförelse och syntetiskt underlag

Alla aktuella renderingar i denna mapp använder en **syntetisk publiceringsformad fixture**, med granskade fastexter från lokalt underlag. De är inte bevis för att faskatalogen eller artiklar är publicerade i någon verklig Supabase-miljö. Den separata `DevelopmentCatalogScreen`-proben använder den verkliga katalogvalideraren mot kontrollerade syntetiska svar, inklusive sena svar som ignorerar abort för att prova livstidsgränser.

`before-panel2.png` och `after-panel2.png` jämför skärmens överdel med visionens panel 2. `development-375x844`, `430x844`, `375x667` och `375x667-text140` visar faskortet, inklusive exakt textlängd. `synthetic-phase-loading`, `synthetic-phase-empty`, `synthetic-phase-error`, `synthetic-reading-ready` och `synthetic-reading-error` visar de separata tillstånden. Resultat från interaktioner och livstidsprov finns i `results.json`.

Native VoiceOver, dynamisk text på enhet, faktisk RLS och publiceringsstatus är inte verifierade av detta underlag. Bilderna i fixturen är dekorativa och representerar inte användarens hund.

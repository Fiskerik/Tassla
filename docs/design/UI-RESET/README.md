# UI-RESET — verifiering 2026-10-09

Jämförelsebas: `92080bd`. Mål: övre sex skärmarna i `vision_rev01.jpg` och [Figma-biblioteket](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=64-2032). Figma design context/screenshot hämtades för `64:2032`; befintliga semantiska färger, kategorier, kontroller och navigationsdestinationer återanvänds. Foto och skärmhierarki följer målbilden. Asset-hämtning från Figma gav HTTP 403; originalfiler för bibliotekets specialikoner är inte införda. Befintlig Ionicons/custom-ikon används och är en dokumenterad avvikelse.

## Evidens

- `home`, `log`, `training`, `health`, `knowledge`, `passport` i 360, 390 och 430 px.
- `*-large-text.png`: 140 % text och reducerad rörelse i webbrenderaren.
- `*-empty/loading/error.png`: syntetiska lästillstånd för Hem, Logg, Hälsa och Kunskap.
- `log-edit-failed.png` / `log-edit-unsure.png`: återhämtning inne i sheeten.
- [browser-results.json](browser-results.json): 17 passerade grupper av layout-/interaktionstester, inga page errors.
- Reproducerbar provyta: [tools/visual-check](../../../tools/visual-check/README.md). Samma produktionskomponenter; testdata och native-adaptrar ersätts bara i provytan.

## Oberoende granskning

Granskaragent `ui_review`, medium, läste diff/målbild/bilder. Tre fynd rättades: återförsök gömt bakom modal, förfallna planer filtrerade bort, låg kontrast i ljus progress. Eftergranskningen stängde alla tre och fann inga ytterligare konkreta regressioner i avgränsad kod-/webbgranskning. Passet har en kompakt förhandsvisning; delningsval ligger i sheet. Hälsoeditorns dubbla historiklista är borttagen.

## Designchecklista

1–4: en huvudhandling i normala huvudvyer; delningsval/redigering fördjupas separat. Radering behåller bekräftelse och destruktiv variant; ingen radmeny med stora Ändra/Radera-länkar i reviderade listor.
5–6: gemensamma layout-, färg- och typografitokens; äldre sekundära formulär behåller viss befintlig styling. Nystartsmandatet omfattar inte en omskrivning av alla äldre inställningsvyer.
7–9: lokala kategoriikoner utan emoji. Figma-specialikoner är inte filverifierade (403).
10–13: inga normala SPARAD-badges; slogans/versionstext bort från huvudvyer; sparfel och nödvändig PDF-information kvar.
14: webbprov av laddar/tomt/fel/normal samt lyckad/failed/unsure-loggmutation. Träning/PDF använder syntetiska callbacks i webben.
15: 44 pt gemensam minsta tryckyta; tre bredder och 140 % text utan dokumentoverflow. Native VoiceOver/Dynamic Type är NOT TESTABLE här.
16–18: målbildens grundhierarki, appbar/flikar/fem navigationsval och personligt hundnamn. Foto på innehåll, tass när användarens foto saknas. Inga påhittade måltidsscheman, publicerade råd eller passfält. Framsteg ersätter Mina mål eftersom egna mål saknar datakontrakt; FAQ utan innehåll införs inte.

Resultat: lokalt verifierad UI-checkpoint, **inte full native- eller pixelidentisk Figma-certifiering**. Riktigt konto/RLS, native tangentbord, animationernas bildfrekvens, PDF/delning samt signerad Codemagic/TestFlight-build återstår att prova på enhet. Inga sådana resultat markeras PASS genom webbrenderingen.

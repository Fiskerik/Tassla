# UI-RESET — 2026-10-09

Mandat: Erik beställer en visuell nystart utifrån `vision_rev01.jpg` och sitt Figma-bibliotek, mjuka interaktioner och en ny commit inför Codemagic. Äldre processgrindar ersätts för detta paket av denna enkla plan. Säker sparstatus, tillgänglighet och befintliga dataflöden behålls.

1. **Grund och Hem** — huvudagent. Figma `2UI5GtK3JjZH3ncCS9M35c`, Sandbox `64:2032`, bibliotekets komponenter samt övre sex skärmarna i målbilden. Ta bort dubbla logotyper, slogans och överflödiga kort. Samma navigation och rörelse i hela appen. Berör `src/components/`, `src/theme/`, `src/features/home/`. Verifiering: rendering och befintliga kontroller.
2. **Huvudvyer** — huvudagent, efter 1. Logga: 2×2, Fler, tid-först-lista och redigering i sheet. Träning: foto, framsteg, övningar och läsdetaljer. Hälsa: översikt och fungerande filter över befintliga uppgifter. Kunskap: artikelöversikt, läsvy. Pass: hunduppgifter och PDF-val. Berör respektive feature. Kontroll: interaktioner, fel/tomt/laddning och stor text.
3. **Leverans** — huvudagent, efter 2. `pnpm check`, iOS-export, skärmbilder och oberoende avgränsad granskning. En commit; signerad Codemagic/TestFlight-build startas inte. Release-log: [UI-RESET](../releases/UI-RESET.md).

UX: en ägare ska snabbt kunna hitta dagens händelser, logga, läsa och följa upp. Tryck återkopplas direkt; lyckat sparande visas först efter bekräftat resultat. Animationer använder native-driver för opacity/transform, 120–280 ms, avbryts vid nya val och stängs av med reducerad rörelse. Fel lämnar inmatning kvar, ångra och dubblettskydd behålls. Inga nya datakällor, scheman, hälsoråd eller produktionskonton.

Avvikelser: målbildens påhittade måltidsschema ersätts av faktiska loggar/planer och tydliga genvägar. Ingen lånad hundbild utges för att vara ägarens hund. Befintliga redaktionella hundbilder återanvänds för innehåll. Figma bestämmer färger/komponenter; målbilden bestämmer skärmarnas hierarki. Dekorativa kort får mjuka ramar i stället för formulärens starka kontrollkanter. FAQ och passfält utan data skapas inte.

Status: plan sparad; genomförande pågår.

## Slutcheckpoint

1. Klar: Figma/målbild granskade; delad grund och Hem införda.
2. Klar: sex huvudvyer omarbetade. Befintliga data- och mutationskontrakt kvar. Riktad cleanup tog bort överflödiga UI-block, imports och döda stilar. Viktflödet är flyttat till `WeightScreen` och dess listor är kompaktare.
3. Klar lokalt: full check, iOS-bundle och reproducerbar webbrendering. Oberoende review-fynd rättade och stängda. [Verifiering](../design/UI-RESET/README.md). Nästa konkreta steg: push av leveranscommiten, sedan ägarens Codemagic-build och enhetsprov. Ingen native/publiceringsstatus har antagits.

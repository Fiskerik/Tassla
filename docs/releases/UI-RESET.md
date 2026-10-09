# UI-RESET

Datum: 2026-10-09. Status: implementerat och lokalt verifierat. Bas: `92080bd`. Leveranscommit: den commit som inför denna logg (`git log -1 --format=%H -- docs/releases/UI-RESET.md`). TestFlight-version/build: okänd. Ingen GitHub Release eller signerad distribution har skapats. Commit sparas lokalt på `work`; inte pushad.

## Major changes

De sex huvudvyerna har en sammanhängande grund utifrån målbild/Figma: personlig Hem-vy med datumval, 2×2 snabblogg och redigeringssheet, träning med foto/övningar/framsteg, hälsans översikt/filter, artikelöversikt/läsvy och kompakt Tassla-pass med separat val av PDF-innehåll. Befintliga data- och sparflöden används.

## Minor changes

Gemensam bottennavigation, appbar och subtil tryck-/sidanimation (120–240 ms) med reducerad rörelse. Dubbla logotyper, slogans och överflödig metadata är borttagna. Nödvändig återkoppling och källor finns kvar. Återanvända lokala bilder, inga nya appberoenden.

## Bug-fixes

Bakåtknappen öppnar inte längre en andra felmärkt notisknapp. Utvecklingsfel som upptäcktes och rättades före leverans: Animated-stilar i webbrenderaren, återförsök bakom redigeringssheet, osynliga förfallna planer och låg kontrast i träningsstapel. Dessa påstås inte vara fel i en tidigare publicerad release.

## Verifiering och kända begränsningar

- `pnpm check`: typkontroll inklusive edge-funktion, lint utan fel, 382 tester PASS och ett befintligt tidszonsberoende test SKIP i UTC. Befintliga lintvarningar finns kvar i äldre vyer.
- `pnpm bundle:ios`: PASS, Hermes iOS-bundle exporterad. Signerad Xcode/Codemagic-build ej körd här.
- 17 grupper av webbaserade UI-kontroller PASS: tre mobilbredder, större text, reducerad rörelse, datumval, logg/ångra/redigering/felåterhämtning, träning, hälsotabs, läsning och PDF-val. [Evidens och oberoende granskning](../design/UI-RESET/README.md).
- Figma läst; originalikonhämtning gav HTTP 403. Befintliga lokala ikoner används. Ingen lånad bild utges för att vara användarens hund.
- Native rörelsekvalitet, VoiceOver, tangentbord, riktig lagring/RLS och PDF-delning återstår på enhet. Den äldre flaggade DevelopmentPreviewen är inte visuell facit; aktuell provyta finns i `tools/visual-check`.

## Nästa sprint/paket

Bygg leveranscommiten med befintligt workflow `tassla-ios` i Codemagic efter push. Prova scroll/animationer, tangentbord, felåterhämtning och PDF på iPhone. Följ därefter upp Figma-originalikoner och eventuellt hundfoto via ett separat datastött flöde. Inga framtidsfunktioner från målbildens nederdel har införts.

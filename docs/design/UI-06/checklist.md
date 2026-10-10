# UI-06 – visuell QA och teknisk verifiering

Datum: 2026-10-10  
Granskad mot: [`vision_rev01.jpg`](../../../vision_rev01.jpg), övre raden “MVP – 6 skärmar”.  
Testdata: syntetisk hund Luna, logghändelser och hälsoplaner i isolerad RN Web-förhandsvisning. BabyJourney Bild 4 som Erik delade inline saknas i repot; direkt jämförelse med just den bilden är **NOT TESTABLE**. Den planerade avvikelsen och dess motivering finns i [UI-06-planen](../../tasks/dev/ui-06.md).

## Skärmbilder

- Hem med dagens loggrader: [360 px](home-360.png), [430 px](home-430.png).
- Hem utan dagens rader: [tom dag](home-empty.png); dagens planer utan loggrader: [två planer](home-today-plan.png).
- Vald framtida dag med två planer, varav den globala kommande planen ingår: [dagsrader](home-future-plan-same.png), [karusell](home-future-plan-same-carousel.png). Kontroll: varje plan förekommer en gång och Hälsa-kortet för samma plan döljs.
- Vald framtida dag med en annan plan än den globalt närmaste: [dagsrader](home-future-plan-other.png), [global plan i Hälsa-kortet](home-future-plan-other-health-carousel.png). Kontroll: valt datum visar sin plan, karusellen visar den separat närmaste planen.
- V6:s matchande globala/valda hälsoplan under laddning och fel: [laddningsläge med globalt Hälsa-kort](home-plan-matching-loading-health-card.png), [felläge med synligt fel och globalt Hälsa-kort](home-plan-matching-error-health-card.png). Accessible-label-kontroll: laddning `globalHealthCard=1`, `selectedRows=0`; fel `feedback=1`, `globalHealthCard=1`, `selectedRows=0`. Det globala vaccinationskortet använder samma beskrivning som en av dagsplanerna, så kontrollen skiljer på kortets label (`Vaccination valp 2. Kommer 11 okt.`) och dagsradens label (`Vaccination. …`).
- V6 samma scenario när planer är färdigladdade: [valda dagsrader](home-plan-matching-ready.png), [karusell](home-plan-matching-ready-carousel.png). Kontroll: båda valda raderna visas en gång (`selectedRows=[1,1]`) och dubblettkortet döljs (`duplicateCard=0`).
- Home-karusell med träningskort: [foto och `Öva inkallning`](home-carousel.png). Titeln finns även i kortets tillgänglighetsnamn (DOM-kontroll: 1 träff).
- Home laddar/fel: [laddar](home-loading.png), [fel](home-error.png).
- Hem 140 % text: [stor text](home-large-text-140.png). RN Web-textnoder skalades visuellt 1,4×; detta är en layoutapproximation, inte native Dynamic Type.
- Loggskärmbilder från v4 bevarade: [Fler](log-more.png), [layoutval](log-layout.png), [Olycka i historiken](log-history-accident.png), [12/20 px-symboljämförelse](accident-icon-sizes.png), [snabb logg-feedback](log-add-feedback.png), [redigering](log-edit.png), [normal 360 px](log-360.png), [normal 430 px](log-430.png), [laddar](log-loading.png), [tom](log-empty.png), [fel](log-error.png), [stor text 140 %](log-large-text-140.png).

## 18-punktschecklista

| # | Resultat | QA-notering |
|---|---|---|
| 1 | Ja | Hem har en primär knapp, **Logga nu**. Loggs redigeringsvy har **Spara** som enda primära knapp. |
| 2 | Ja | Snabbvalen är jämbördiga. Knappar inom respektive grupp har enhetlig storlek och stil. |
| 3 | NOT TESTABLE | **Radera** skiljer sig visuellt från **Spara/Avbryt** i [redigeringen](log-edit.png). Koden använder bekräftande `Alert.alert`, men den native dialogen visas inte i RN Web-provet. |
| 4 | Ja | Historikraden öppnar redigering; inga stora **Ändra/Radera**-länkar visas på varje rad. |
| 5 | Ja | Berörda vyer använder befintliga spacingtokens och konsekventa sektionsmarginaler. |
| 6 | Ja | Ingen ny hårdkodad hex-färg eller px-storlek i granskad UI-diff. |
| 7 | Ja | Ikoner använder Ionicons och befintliga vektorformer; inga emoji-ikoner. |
| 8 | Ja | Kategorierna behåller färg och ikon genom snabbval, layoutval och historik. |
| 9 | Ja (v4 omgranskad) | Olycka visas som vatten + bajs sida vid sida. [12 px- och 20 px-versionerna](accident-icon-sizes.png) är åtskiljbara; [Fler](log-more.png), [layoutval](log-layout.png) och [historik](log-history-accident.png) bekräftar den använda 12 px-kompositionen. Den tidigare vertikala symbolen lästes som ett utropstecken och har ersatts. |
| 10 | Ja | Normala historikrader saknar sparad-/ägarmärkning. Bekräftelse med ångra visas efter ny loggrad. |
| 11 | Ja | Inga informationsbanners i normalläge. Fel visas i berörd vy med en åtgärd. |
| 12 | Ja | Skärmbilderna innehåller inga förbjudna tekniska ord. |
| 13 | Ja | Synlig förklarande copy är kort och vardaglig. |
| 14 | Ja | Hem och Logg har renderade normal-, laddar-, tom- och fellägen i bildunderlaget. |
| 15 | **Nej** | Vid 140 % text går bottenmenyns etiketter **Hem** och **Logg** visuellt ihop i [Home](home-large-text-140.png) och [Logg](log-large-text-140.png). Den delade bottenmenyn är utanför UI-06-diffen och behöver rättas i UI-07. |
| 16 | Ja, med dokumenterad avvikelse | Hem/Logg följer tillgänglig målbild inom godkänd slice. Dagens lista innehåller loggposter/planer; redaktionella förslag ligger i karusellen. Samma valda plan visas inte dubbelt. Bild-/header-/footeravvikelser och saknad inline-referensbild är dokumenterade ovan och i planen. |
| 17 | Ja | Hem visar Tassla-appbaren; Logg visar centrerad sidtitel; båda visar femdelad bottenmeny med aktiv markering. Ingen flikrad ingår i Hem/Logg-målbilden. |
| 18 | Ja, med avvikelse | Hundens namn visas. Hem använder godkänd generisk silhuett där ägarfoto saknas. Karusellens foton är redaktionella valpbilder, inte ägarens hund eller bevis på en logghändelse. |

**Resultat: UNDERKÄND.** Hem v5 har verifierade scenarier för dagens rader, tom dag, dagens planer, valt datum med samma/annan kommande plan och flera planer. V6 täcker dessutom matchande globala/valda planer under loading/error: ingen planrad för valt datum visas, laddningsskeleton respektive felmeddelande syns, och globala Hälsa-kortet finns kvar. När data är klar visas båda valda raderna en gång och dubblettkortet döljs. Träningskortet behåller `nextStep` i synlig text och tillgänglighetsnamn. Olycka punkt 9 är godkänd efter v4. Punkt 15 blockerar visuellt PASS tills den delade bottenmenyn fungerar med stor text. Native rörelse, reducerad rörelse på fysisk enhet, tangentbord, VoiceOver och fysisk safe area är **NOT TESTABLE** med RN Web.

## Tekniska kontroller

- `pnpm check`: PASS, exit 0 med nätverk aktiverat för notification-testets Node `spawnSync`; 387 passerade, 1 hoppades över, 0 misslyckades. ESLint har varningar utanför UI-06.
- `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`: PASS, iOS-export klar.
- `git diff --check`: PASS.
- `python tools/dev_flow.py validate`: PASS; UI-06 står som QA.
- `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools node tools/visual-check/build.cjs`: standardverktyget missar RN Web-exporten `TurboModuleRegistry`; visuell yta byggdes tillfälligt med shim i `/tmp`. V5/V6-scenarier använde separat tillfällig syntetisk harness i `/tmp`; inga appkällfiler ändrades av QA.

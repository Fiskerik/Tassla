> **INAKTIV — äldre identisk kopia.** Historiskt innehåll bevaras. Använd den kanoniska identiska versionen [`VISION-REV02-GESTURES-UX-SPEC-v5-approved.md`](./VISION-REV02-GESTURES-UX-SPEC-v5-approved.md). Git visar samma tillkomstcommit för paret; äldre status följer versions-/filnamnslinjen.

# Svep för veckoremsa och huvudflikar — UX-spec v5

Datum: 2026-10-13 · Status: Product IN MVP; Architect APPROVE och Critic PROCEED för v5; implementation lokalt verifierad; QA/Reviewer och browserinteraktion återstår.

## Användaruppgift

Som valpägare vill jag kunna bläddra mellan veckorna på Hem och byta huvudflik med ett horisontellt svep, så att tidslinjen och de vanligaste områdena går snabbt att nå med en hand.

Detta är en interaktionsförbättring av befintliga MVP-vyer. Den lägger inte till innehåll, historikdata, en ny huvudflik eller ett nytt sparat val.

## Föreslaget beteende

### Veckoremsan på Hem

- Den horisontella åldersremsan blir en virtualiserad horisontell lista. Svep åt vänster visar senare åldersveckor; svep åt höger visar tidigare veckor. Fast item-geometri behåller det kända startfönstret och ger en stabil grund för porträttets dimning.
- Vecka 0 är början. Karusellen går till vecka `aktuell ålder + 12`, vilket ger senare veckor att bläddra till även när startvyn redan visar tre veckor framåt. Den är ändlig åt båda håll.
- Första vyn behåller nuvarande komposition: aktuella veckan markeras, med upp till tre veckor före och efter synliga. Om hunden är yngre än tre veckor börjar raden vid vecka 0.
- Veckan som markeras aktuell ändras aldrig när användaren bläddrar. Hundens faktiska ålder fortsätter visas i hälsningsraden.
- Svepet är endast visuell bläddring. Det ändrar inte dagens datum, dagsuppgifter, logg, planer, progress eller innehåll och antyder inte att en tidigare eller framtida aktivitet har utförts.
- Den befintliga dimningen när markörer passerar porträttet följer deras faktiska skärmposition under scrollning. Porträttet förblir ovanför remsan.

### Huvudflikarna

- I Hem, Logg, Träning, Kunskap och Mer byter ett svep åt vänster till nästa flik i ordningen Hem → Logg → Träning → Kunskap → Mer. Ett svep åt höger går till föregående flik.
- Ingen rundgång: ett svep utåt på första/sista fliken lämnar sidan oförändrad. De befintliga fem tillgängliga bottenflikarna fungerar alltid som alternativ.
- Svep gäller endast huvudflikarnas skärmar. Underordnade sidor som Hälsa, Tassla-pass, profil, inställningar och innehållsdetaljer behåller sina befintliga tillbakaflöden.
- En intern horisontell kontroll behåller sitt eget svep. Veckoremsan och Kunskapens horisontella segment äger sina gester från touch-start till touch-end/cancel. De byter inte huvudflik, inte heller vid kontrollens första eller sista objekt. Övriga sidytor behåller huvudflikssvepet. `HomeCarousel` finns i koden men används inte av någon aktiv route och ligger utanför denna uppgift.
- Vertikal scroll, tryck, formulärinmatning och öppna dialoger/sheets behåller sina befintliga handlingar. Huvudfliken byts bara av en tydlig horisontell gest på sidans övriga innehåll.
- Använd befintlig sidövergång och reducerad-rörelsehantering. Lägg inte till haptik, ljud eller ny dependency.

## Tillstånd och återkoppling

- Hundens faktiska ålder fortsätter visas i hälsningsraden även när den aktuella åldersmarkören scrollat ut ur vyn. Aktuell markör är korrekt när den syns.
- Vid karusellens gränser stannar innehållet naturligt vid vecka 0 respektive hundens aktuella vecka + 12; ingen looping eller dold handling.
- Huvudflikens synliga innehåll och valda bottenflik uppdateras tillsammans. Ingen status-, data- eller sparbekräftelse visas för en ren navigation.
- Reducerad rörelse går direkt till slutläget. Gesten blockerar inte tryck eller vertikal scroll.

## Tillgänglighet

- Bottenmenyn förblir komplett, synlig och tillgänglig med etiketter/tangentbord/skärmläsare; svep är ett komplement, aldrig enda vägen.
- Veckorna behåller tillgänglig veckonummeretikett och identifiering av hundens faktiska aktuella ålder. Scrollning ändrar inte semantic marker.
- Fokuserade textfält ska inte utlösa sidbyte. Stor text, safe area och reducerad rörelse kontrolleras i public/review-renderingar; webbsimulering ersätter inte VoiceOver/Dynamic Type.

## Antaganden att granska

1. “Byta sida åt det hållet” betyder vänstersvep = nästa huvudflik och högersvep = föregående.
2. Veckoremsan ska visa och bläddra i åldersmarkörer, men veckoval ska inte filtrera dagens innehåll eller skriva data. Om produktavsikten är att välja veckospecifikt innehåll krävs separat data-/UX-scope.
3. Framåtriktad gräns är aktuell ålder + 12. Den ger en begränsad överblick över kommande veckomarkörer utan att skapa ett obegränsat framtidsflöde; veckomarkörerna visar inte framtida uppgifter eller innehåll.

## Produktreview

Product bedömer tillägget som **IN MVP** på uttryckligt ägarmandat. Rekommenderad användarberättelse: ”Som valpägare vill jag kunna bläddra bland veckomarkörerna och svepa mellan huvudflikarna, så att jag snabbt kan orientera mig och nå rätt del av Tassla.” Product bekräftar browse-only-regeln: ingen veckoselektion, innehållsfiltrering eller dataskrivning. Aktuell ålder måste förbli begriplig även när dess markör scrollat ut ur vyn. Product noterade att v1:s gräns +3 inte gav någon framåtrörelse från den ursprungliga vyn; v2 ändrar därför gränsen till +12.

## Arkitekturföljd av Architect-review

Architect gav **CHANGES** på v2 eftersom ett horisontellt barn kan släppa sin responder vid kanten och då trigga sidbyte. Architect gav **CHANGES** på v3 på grund av överlappande A/B-skrivfiler och otillräckligt konkret fältskydd. v4 ändrade till en integrerad uppgift; Architect granskade den versionen ännu inte. v5 preciserar `HorizontalGestureRegion` som en notifiering, inte responderövertagande: den sätter en synkron ref vid touch-start, nollställer vid touch-end/cancel och städar vid avmontering; `MainSwipeNavigation` avstår från sidbyte medan refen är aktiv. Den används runt veckoremsan, `Tabs` och Loggs anteckningsfält. Den tar inte över scroll- eller tryckgesten. `HomeCarousel` finns men används inte av en aktiv route och ändras inte. Vertikal scroll fortsätter ägas av `AppScreen`.

Architect APPROVE och Critic PROCEED för exakt v5 är dokumenterade i `docs/tasks/dev/vision-rev02-gestures.md`. Critic noterade att den gemensamma `Tabs`-komponenten även används i Träning och Hälsa; gesture-skyddet ska därför fungera för alla befintliga tabs-varianter.

## Omfattning och avvikelser från visionen

Veckoremsan fortsätter använda Hem-panelens veckonummer, aktiv aktuell ålder, porträttlager och dämpning. Scrollbarhet är ett tillägg till interaktionen; den inför ingen ny panel eller veckospecifik information. Huvudflikarnas ordning och bottenmeny förblir desamma. Native gestprioritet, hjälpmedel och verklig enhetsbeteende kan inte godkännas enbart från RN Web-rendering.

## Föreslagna verifieringsbevis

- Public och review vid 375×844 och 430×844: startläge, bläddring mot tidigare och senare veckor, vecka 0 och aktuell + 12.
- Public och review: huvudflikssvep framåt och bakåt, första/sista gräns, uppdaterad aktiv bottenflik och detaljroute utan sidbyte.
- Veckocellernas fasta extent inkluderar spacing; `getItemLayout` använder samma extent som dimningsberäkningen. Listan startar med `initialScrollIndex = max(0, aktuellVecka - 3)` och verifieras mot vecka 0 och aktuell ålder +12; svep vid båda kanterna ska inte byta flik.
- `Tabs` sveps i mitten och vid båda ändarna, utan att ytterkontrollen byter flik.
- Vertikal AppScreen-scroll, Loggs fokuserade anteckningsfält/tangentbord, tryck och modal/sheet ska inte byta flik eller stjäla kontrollens gest.
- 140 % text och reducerad rörelse visas i åtminstone relevanta Hem- och navigationslägen.
- Manuell browserkontroll och eventuellt faktisk native verifiering rapporteras separat. Saknat underlag märks NOT TESTABLE.

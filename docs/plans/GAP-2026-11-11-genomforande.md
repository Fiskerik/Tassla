# Genomförandeplan för GAP-analyserna 2026-11-11

Bas: `d122622645eefb3f4c44ce488afea7105624d878`. Underlag: båda GAP-dokumenten från 2026-11-11, gällande MVP-kontrakt och beslutsregister. Planen är en arbetskö, inte ett påstående om leverans. Varje koddel behöver ett eget avgränsat uppgiftskontrakt, verifiering och checkpoint.

## Vägval

- Börja med den dagliga loopen: loggning, bekräftad progress och nästa träningssteg. Det förenar analyserna och ger värde innan funktionerna breddas.
- Välj färre, relevanta och sakkunnigt granskade texter framför att fylla 45 veckor med ogranskat material. Veckotäckning är ett långsiktigt mål, inte grund för att publicera påhittad granskning. Behåll AI-märkning tills faktisk granskning och korrekt märkning finns.
- Visa väntande loggar omedelbart och tydligt, men räkna bara serverbekräftade händelser i progress. Haptik vid tryck föreslås i sammanfattningen men strider mot registrerat beslut om haptik efter bekräftelse. Behåll det senare. Den befintliga loggskärmen visar redan en väntande rad och har idempotenta omförsök; den har inte en beständig offlinekö eller parallella skrivningar.
- Hem ska förbli lugnt och ha tydlig hierarki. Ett veckokort får inte framstå som personligt eller redaktionellt granskat utan innehåll som faktiskt stöder det.
- iOS först är redan beslutat. Android, hushållsdelning, flera hundar, widget och kommersiella funktioner är framtida produktspår, inte bevisat färdiga MVP-funktioner. Användarens nuvarande beställning tas som mandat att utreda och genomföra de begärda förslagen; respektive del behöver konkreta kontrakt, sakgranskning och teknisk verifiering där det är relevant.
- Påståendet om App Store-regel 4.8 är en risk att utreda mot aktuella officiella villkor, inte ett fastslaget krav. Ändra inte autentisering på grundval av analysens antagande.

## Ordning och status

1. **Snabblogg och daglig progress** — kartlägg skrivning, fel, återförsök, kontobyten och dubbeltryck; specificera en liten säker förbättring med beteendetester. Den uttryckligen beställda beständiga offlinekön behöver ett separat tekniskt kontrakt och säkerhets-/dataskyddsgranskning för lagring och synk; inga ogrundade sparbekräftelser. Status: GAP-LOG-READBACK-01 tillåter nästa logg efter bekräftad sparning under omläsning; GAP-LOG-UNKNOWN-REPLAY-01 gör en enda automatisk readback efter oklart svar och tar bort manuella statuskontroller efter ägarens beslut 2026-11-13. Kvar: serverkvitto, beständig offlinekö och enhetsprov. GAP-FIRST-DAY-ROUTINE-01 ger ett lokalt implementerat redigerbart rutinförslag; åldersanpassade rutiner och vissa tillståndsprov återstår.
2. **Träningsresa och sammanhängande återkoppling** — kontrollera befintligt nästa steg, progress och återhämtning på riktig enhet; åtgärda konkret observerade luckor. Status: GAP-TRAINING-PAUSED-01 visar bekräftad paus och GAP-TRAINING-NEXT-PREVIEW-01 visar nästa övning när progressionen är bekräftad; native kontroll återstår.
3. **Språk, tomma lägen och avslut** — inventera och prioritera faktiska inkonsekvenser, förbättra en resa i taget och behåll begripliga fel och återförsök. Status: kort språkguide finns i `docs/design/sprakguide.md`; osäker träningsstatus på Hem och träningens två fallbacktexter är förenklade lokalt i GAP-HOME-TRAINING-COPY-01 och GAP-TRAINING-UNKNOWN-COPY-01. GAP-HEALTH-ORIGIN-01 beskriver egna uppgifter och avgränsningen mot veterinärjournal i Hälsas huvudvy samt egna viktuppgifter i viktvyn; övrig inventering återstår.
4. **Hundens hem och minnen** — utred lokalt foto med behörighet, lagringslivscykel, radering och kontobyten samt eventuell ny dependency. Milstolpar kräver sant underlag och ska inte skapa prestationskrav. Status: oaktiverade JPEG-/lagrings-/scopeexperiment finns. Integrationsplanen `GAP-DOG-PHOTO-INTEGRATION-01` är granskad som gated förslag; ingen picker, native lagring eller produktkoppling är implementerad. Ägarbeslut om syfte/information, beta-undantag för offline-rensning, kopiebegäran och `expo-image-picker` samt Compliance-grind före kodning återstår. Personligt foto ingår därför inte i nuvarande TestFlight-prov.
5. **Innehåll och åldersrutiner** — skapa källbelagda utkast, ta in namngiven sakkunnig och publicera först efter verklig granskning. Granska svenska källor och åldersanpassning. Förifyll inte hälsoråd utan sakgranskning. Status: källbelagt AI-utkast om ID-märkning och hundregister finns i GAP-SWEDISH-ID-DRAFT-01; mänsklig granskning, import och övriga ämnen återstår.
6. **Tillgänglighet och nattbruk** — utred mörkt läge mot alla semantiska färger och skärmar, Dynamic Type, VoiceOver och faktisk nattlig användning. Status: ej implementerat i detta arbete.
7. **Inloggning och navigering** — verifiera App Store-villkor och befintliga auth-flöden; specificera eventuella ändringar separat. Dela navigation/workspace stegvis endast när det löser verifierade problem utan regression. Status: ej implementerat i detta arbete.
8. **Långsiktig riktning** — utred delning, vuxen/senior, flera hundar, export, Android, innehåll före hemkomst och neutral partneringång mot dataskydd, säkerhet och fattade beslut. Status: ej implementerat i detta arbete.
9. **Verifiering och beta** — beteendebaserade tester för kärnresor, verklig DB/RLS, signerad build och telefonprov rapporteras separat. Fem användartester kräver rekrytering och faktiskt samtycke; de kan inte simuleras som genomförda. Status: ej utfört i detta arbete.

## Första checkpoint

Granskning av analyser och befintlig snabblogg genomförd på basen ovan. Oberoende critic identifierade konflikt med haptikbeslut och begränsningar för offline, foto, delning och partnerskap. Första koddel GAP-LOG-UNSURE-01 visade ursprungligen en osäker ny loggpost utan att räkna den som bekräftad. Den presentationen ersattes på ägarens uttryckliga begäran 2026-11-13 av automatisk readback utan kontrollruta; beslut och återstående dubblettrisk finns i GAP-LOG-UNKNOWN-REPLAY-01. Syntetisk RN Web-render och beteendetest har provats; paneljämförelsen visar flera skillnader. Native tillgänglighet och verklig nätverksåterhämtning saknar bevis. Ingen signerad build eller TestFlight-distribution har gjorts.

## Ägarens tillägg 2026-11-12

Halvcirkeln i Utveckling ersätts av en rak horisontell tidslinje enligt ägarens direkta instruktion. `DEVELOPMENT-LINEAR-TIMELINE-01` är implementerad lokalt; kronologisk åldersberäkning och vuxen-/okäntlägen kvarstår. Lokal QA och RN Web är utförda; native tillgänglighet och TestFlight återstår. Denna riktning ersätter den tidigare bågformen i panel 2.

Ägarens senare justering: `DEVELOPMENT-AGE-OVERLAY-01` flyttar åldersetiketten över bilden och ökar blockmellanrum lokalt. Den raka kronologiska tidslinjen bevaras. Native och TestFlight återstår.

# 0001 – Teknikstack för Tasslas MVP

Status: accepterat av Erik 2026-10-04 i chatten: ”Jag godkänner MVP och stack (Erik)”. Kärnstack: Expo/React Native/TypeScript/Expo Router, Supabase och Codemagic. Villkorade alternativ (offline, redaktörsmiljö) och öppna drift-/notifieringsdetaljer är fortsatt särskilda beslut, inte automatiskt valda komponenter.

Scopeuppdatering 2026-10-04: Erik har angett övre delen av vision_rev01.jpg som leveransbaslinje med sex användarytor och därefter godkänt MVP och stack. docs/mvp.md omfattar nu enkel Hälsa, Kunskap och Tassla-pass/PDF. Arkitekturförslaget i docs/Architecture.md konkretiserar detta; godkänd stack innebär inte att en specifik implementationplan eller release är godkänd.
Datum: 2026-10-03

## Kontext
En ensam utvecklare bygger med AI på fritiden. God kodförståelse, tidigare Expo/Next.js/Codemagic, men ingen regelbunden programmering på 20 år. Tidigare ramverk är inte bindande. iOS och TestFlight först; Apple-konto finns. Låg budget, separat bygg-/driftsbudget okänd. Innehåll ska kunna redigeras utan kod senare. En person/en hund i piloten, framtida flera hundar/personer utan datamodellsbyte.

Utgångspunkt är godkänd docs/mvp.md: Hem, Valplogg, Träning, Hälsa, Kunskap och enkelt Tassla-pass, med profil, QR-distribution och mätning som stöd. Notifieringskanalen kvarstår som öppet beslut. Ingen tyst scopeändring görs. Appimplementation behöver avgränsat segmentmandat och granskad plan.

## Alternativ
| Alternativ | För Tassla | Nackdel för Tassla |
|---|---|---|
| Expo / React Native / TypeScript | Appens behov kräver inga unika native-funktioner i nuläget. Samlad appkod, molnbyggen och möjlighet att senare använda Android. TypeScript kan fånga en del kontraktsfel vid AI-arbete. | React Native/Expo-uppgraderingar och native-felsökning kräver fortfarande kompetens. Android blir inte gratis bara för att appkoden kan delas. |
| Swift / SwiftUI | Stark kandidat för långvarigt iOS-fokus, nära Apples UI- och plattformsverktyg. Ingen cross-platform-abstraktion att underhålla. | Normal lokal utveckling kräver Mac/Xcode. Android senare innebär en andra klient. Swift är ett nytt språk för ägaren. |
| Flutter / Dart | Gemensam klient för iOS/Android och konsekvent UI. Kan stödja samma servermodell. | Nytt språk och nytt UI-ekosystem utan ett identifierat Tassla-behov som uppväger det. Lokal iOS-utveckling kräver fortfarande Apples verktyg; moln-CI löser bygg, inte all felsökning. |

Detta är en projektspecifik bedömning, inte en universell rangordning av språk eller påståenden om AI:s relativa kodkvalitet. Next.js används inte som mobilklient och en separat webbbackend föreslås inte i första piloten.

## Accepterad stack och villkorade alternativ
- Klient: Expo + React Native + TypeScript, iOS först. Enkel navigation med Expo Router och få dependencies.
- Backend: Supabase med PostgreSQL, Auth och serverstyrda åtkomstregler (RLS). Ingen egen Python/Java-server innan ett konkret behov finns.
- Lokalt, villkorat kravförslag: SQLite för beständig loggkö och cache om ägaren väljer begränsad offlinefunktion. Alternativet är en internetberoende pilot med tydligt felmeddelande och ingen falsk sparad-status. Internet krävs för första inloggning, hämtning av nytt innehåll och serversynk. Efter första lyckade hämtningen ska vardagsloggar och redan hämtat innehåll fungera offline.
- Bygg/distribution: Codemagic till App Store Connect/TestFlight enligt ägarens preferens 2026-10-04. Expo/React Native behålls som appframework; EAS Build/Submit behövs inte i denna byggkedja. Codemagic kör macOS/Xcode, genererar iOS-projekt via Expo prebuild när native-mappar inte versionshanteras, bygger, signerar och laddar upp appen. Konfiguration och signeringsuppgifter hanteras separat; inga byggen eller publiceringar är aktiverade ännu. Molnbyggen ersätter inte alla lokala Mac/Xcode-felsökningsmöjligheter.
- Innehåll: separera versionerat redaktionellt innehåll från användardata och appkod. Sanity är en kandidat till framtida redaktörsmiljö, inte beslutad komponent; införande/tidpunkt och behörighetsplan beslutas separat. Mellanläge om icke-teknisk redigering kan vänta: Erik granskar och publicerar godkända utkast via en avgränsad importprocess; appen läser enbart publicerade poster via ett stabilt innehållskontrakt. Den processen behöver byggas och får inte förutsättas finnas. Om copywriter ska publicera redan i pilot krävs en redaktörsyta innan pilot, och CMS-valet görs då. Supabase-tabellredigering är inte en färdig redaktörsprodukt.
- Mätning: en liten separat händelsemodell för onboarding, värdehandling och återkomst; inte ett stort analyslager. Exakta mätdefinitioner, dataminimering och lagring beslutas före pilot. AI-agentteamets API-användning är en separat utvecklingskostnad; appen behöver inte en AI-chatbot.

Offline är ett separat, ännu inte accepterat kravförslag med merarbete, inte färdig automatiserad synk: klientskapade unika händelse-ID:n, återförsök utan dubbletter, synlig väntande status och uttrycklig konflikthantering för ändringar. SQLite och Supabase ger inte denna synk automatiskt. Full bakgrundssynk och fleranvändarkonflikter byggs inte nu.

## Data och distribution
Separera `dogs`, personer/konton och en koppling `dog_memberships` med roll. Händelser och progression tillhör `dog_id`; aktören kan anges separat. Endast ägarmedlemskap används i piloten. Detta möjliggör flera hundar och flera personer senare men gör inte delnings-UI eller fullständiga framtida behörigheter färdiga. RLS testas för att en användare inte kan läsa en annans hund. Administrativa hemliga nycklar får inte ligga i appen.

Kennelkod/attribution ska skiljas från medlemskap och datadelning: en QR-kod ger aldrig uppfödaren läsrätt till hundens data. En vanlig länk garanterar inte att kennelkontext följer med genom installation från App Store/TestFlight. Piloten bör ha en enkel återöppna-länk eller explicit kennelkod som reserv. Testa hela flödet på en telefon där appen inte redan är installerad.

## Innehållskvalitet
Träningsflöden och steg behöver stabila ID:n och versioner så att en innehållsändring inte tappar användarens progression. Publiceringsstatus behöver kontrolleras på serversidan; ett granskningsfält är inte ensamt ett åtkomstskydd.
AI kan skriva utkast; copywriter kan förbättra språk. Ingen av dessa ersätter sakgranskning av hundhälsa/träning. Innehåll behöver minst utkast, granskad, publicerad status; endast publicerat innehåll visas i appen. Sanitys gratisplan har begränsade användarroller; välj inte den under antagandet att separata redaktörs-/granskarbehörigheter ingår gratis.

## Kostnad och drift
Budgeten för Codex/OpenAI-krediter täcker inte databas, byggtjänster eller redaktionella tjänster. Utveckling kan börja på fria planer inom kvoter, men riktig pilot kräver beslut om säkerhetskopiering och tillgänglighet. Supabase Pro anges från 25 USD/månad, med extra användnings-/projektkostnader möjliga. Gratisprojekt kan pausas vid låg aktivitet och behöver egen backupplan. Codemagics plan och byggminutsbudget kontrolleras mot faktiskt byggbehov innan tjänsten aktiveras. Inga tjänster aktiveras i detta beslut.

## Konsekvenser och ändringskostnad
Mindre egen serverdrift och fler tydliga deluppgifter. Kräver TypeScript, SQL, migrationshantering och mobiltestning. Kostnad att byta klient senare: hög (UI/navigation). Databasflytt: medel, om schema och export hålls ordnade; auth/storage är separata flyttproblem. CMS-byte: lägre om innehållskontraktet är separerat. Android kräver egna tester och plattformsanpassning.

## Vad skulle ändra rekommendationen?
Mac finns, iOS är enda mål på lång sikt och djupa Apple-funktioner blir produktens kärna: SwiftUI blir starkare. Mycket större offline-/fleranvändarbehov: utred dedikerad synklösning. Ingen driftsbudget alls: minska pilotens serverkrav eller formulera en lokal prototyp, inte lova en gratis produktionsmiljö.

## Kvarstående beslut
1. Mac och fysisk iPhone för test, pilotdatum och bygg-/driftsbudget.
2. Pilot utan push enligt ägarens önskemål, eller notifieringskrav enligt nuvarande MVP?
3. Auth-metod är beslutad: e-post med engångskod, senare Google (0003-auth.md). Sessionslagring, leverans och tillåtna persondata måste hanteras före berört bruk; MVP/kärnstack är godkända.
4. Redaktionell arbetsyta nu eller senare, samt acceptans för offline-minimum.

## Källor, kontrollerade 2026-10-03
- [Expo: TestFlight från bland annat Windows](https://docs.expo.dev/submit/testflight/)
- [Expo SQLite: beständig lokal databas](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Codemagic: React Native och Expo](https://docs.codemagic.io/getting-started/building-a-react-native-app/)
- [Codemagic: signerat bygge och distribution](https://docs.codemagic.io/yaml-quick-start/first-signed-build/)
- [Apple: Xcode-systemkrav](https://developer.apple.com/xcode/system-requirements/)
- [Flutter: iOS-distribution](https://docs.flutter.dev/deployment/ios)
- [Supabase: priser](https://supabase.com/pricing)
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: paus av gratisprojekt](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase: backups](https://supabase.com/docs/guides/platform/backups)
- [Sanity Studio](https://www.sanity.io/docs/studio)
- [Sanity-planer](https://www.sanity.io/pricing)

Verifiering: dokument- och källgranskning, ingen prototyp, benchmark, installation eller appkod. Godkännandet är inte ett bevis på fungerande slut-till-slut-lösning.

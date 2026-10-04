# APP-01 – start och telefonprov

Första segmentet innehåller e-postinloggning med magic link, en hundprofil och Hem. Google/OTP och övriga MVP-skärmar kommer senare. Publicerat innehåll hämtas från Supabase; utan sådant innehåll visas ett tomt läge. Kör inte foundation-migrationen igen.

## Lokal start
### Tillfälligt utan appinloggning
Erik har godkänt lokal förhandsvisning för att fortsätta med gränssnittet medan inloggningen väntar. Stoppa eventuell Expo-server med Ctrl+C och kör `pnpm.cmd start:preview` i projektroten. Öppna den nya QR-koden i Expo Go. Expo Go-kontot på telefon/dator behövs fortfarande; Tasslas egen inloggning hoppas över.

Förhandsvisningen visar en tydligt märkt testhund. Namn och födelsedatum kan ändras för visuell granskning. Uppgifterna finns bara i minnet och återställs vid omstart; inget hämtas eller sparas i Supabase. Använd syntetiska uppgifter. Ingen publicerad hälso- eller träningsdatabas hämtas.

APP-02 bygger vidare på detta läge med sex MVP-områden. Hem, Logg och Träning nås direkt; Mer öppnar Hälsa, Kunskap och Tassla-pass. Vardagsloggen och Träning fylls med lokala exempel, medan övriga nya sidor är tydligt märkta som ännu inte implementerade. Träning har intern granskad demotext och stoppinformation; ingen CMS-/pilotpublicering. Loggposter och progression kvarstår när du byter sida men återställs vid omstart.

Telefonprov efter APP-02:s lokala kontroller:
- Öppna alla sex områden, även via Mer och tillbaka. Testa stor text och att navigationen är åtkomlig.
- Logga kiss, bajs, mat, sömn, vaken och promenad; se korrekt lokal tid i historiken.
- Rätta en post, prova ogiltigt/framtida datum och tid, och avbryt respektive bekräfta radering. Tomt läge ska vara begripligt.
- Öppna rättning av en post och välj sedan en annan: formuläret ska visa den nya postens uppgifter.
- Öppna ett träningsprogram, läs stopptexten, registrera nästa steg och byt till Hem och tillbaka. Progressionen ska finnas kvar under samma körning.
- Repetera redan registrerade steg utan dubblerad progression. Avbryt respektive bekräfta återställning.
- Starta om appen: syntetiska exempel återställs, inget ska visas som molnsparat.

Spara telefonutfall i docs/tasks/dev/app-02-report.md. Lokala kontroller bevisar inte fysisk navigation, tangentbord, skärmläsare eller verklig backendintegration.

`pnpm.cmd start` utan previewflagga återgår till ordinarie auth. Startskriptet sätter `EXPO_PUBLIC_DEV_PREVIEW=true` endast för Expo-processen och ändrar inte `.env`. Läget kräver dessutom utvecklingsbygge; release/TestFlight använder alltid auth. Telefonprovet av förhandsvisningen återstår tills Erik har öppnat den.

Använd Node 24 och pnpm 11.19.0. I projektroten: `pnpm install --frozen-lockfile`, `pnpm check`, sedan `pnpm start`. Om pnpm saknas kan det installeras med `npm install --global pnpm@11.19.0` i din vanliga terminal med Node installerat.

Behåll dina befintliga värden i `.env`: `EXPO_PUBLIC_SUPABASE_URL` och `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Starta om Expo efter ändringar. Ingen Google client secret, service_role eller OpenAI-nyckel hör hemma i appkonfigurationen.

Expo Go kan förhandsvisa gränssnittet om telefonens Expo Go stöder SDK 57, men verifierar inte appens eget länkschema. På fysisk iPhone kräver Expo Go att datorns Expo CLI och telefonens Expo Go är inloggade på samma kostnadsfria Expo-konto. Kör `npx.cmd expo login` på datorn och logga in med samma konto i Expo Go; starta sedan `pnpm.cmd start` och skanna QR-koden. Detta krav verifierades i [Expos aktuella dokumentation](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/) 2026-10-04.

Den riktiga Tassla-inloggningen testas i signerad app via TestFlight. Codemagic/TestFlight-byggvägen kräver inte ett Expo-konto; Expo Go-inloggningen innebär inte att vi byter till EAS Build/Submit.

### Vit sida efter mejllänk i Expo Go
Nuvarande authkod skickar tillbaka till `tassla://auth/callback`. Expo Go registrerar inte Tasslas eget schema; där används `exp://`. Därför går den befintliga magic-link-returen inte att slutföra i Expo Go, även om mejlet kommer fram. Öppnas länken på datorn kan den dessutom inte återvända till appinstallationen på iPhone som innehåller PKCE-verifieraren. En vit sida ensam visar inte vilken omdirigering som misslyckats.

För befintligt flöde: bygg och installera Tassla via Codemagic/TestFlight, kontrollera callback-tillåtelselistan, begär en ny länk från den installerade appen och öppna den på samma iPhone. Återanvänd inte länken från Expo Go-provet. Ändra inte till en bred wildcard-returadress som genväg. Underlag: [Expos scheman och Expo Go](https://docs.expo.dev/linking/into-your-app/) och [Supabase mobilcallback](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).

Välkomst-/onboardingtexterna använder nu hund i stället för valp enligt Eriks önskemål 2026-10-04. Detta lägger inte till vuxenhundsanpassade råd; Hem visar fortfarande endast faktiskt publicerat, relevant innehåll.

## Inställning i Supabase
Authentication → URL Configuration → Redirect URLs: lägg till exakt `tassla://auth/callback`. Behåll Googles separata Supabase-callback i Google Cloud; den ersätter inte appens Redirect URL.

Använd Supabases befintliga standardmall för magic link. Standardtjänsten begränsar vilka mottagare som får mejl; använd en tillåten egen projektadress för utvecklingsprovet. För fler testare behövs SMTP och dess konfiguration. PKCE-länken måste öppnas på samma appinstallation som begärde den.

## Codemagic till intern TestFlight
`codemagic.yaml` är en förberedd, ännu inte körd konfiguration. Den har inga automatiska Git-triggers. En manuellt startad körning laddar upp bygget till App Store Connect men begär varken extern betagranskning eller App Store-publicering.

1. Anslut detta GitHub-projekt i Codemagic. Konfigurationsfil och lockfile behöver finnas i den branch du väljer att bygga; Codex har inte pushat något.
2. Lägg till din App Store Connect API-integration med namnet `tassla-app-store`, eller ändra referensen till ditt befintliga namn. Lägg in distributionscertifikat och App Store-provisioningprofil för `com.erimaliab.tassla` i Codemagic.
3. Skapa variabelgruppen `tassla-mobile` med de två `EXPO_PUBLIC_SUPABASE_*`-variablerna. Lägg inte OPENAI_API_KEY eller privilegierade Supabase-nycklar i gruppen. Lokala `.env` följer inte med Git.
4. Kontrollera att apposten i App Store Connect använder samma bundle-ID. Byggets nummer måste vara högre än eventuella tidigare uppladdningar; workflow använder Codemagics `PROJECT_BUILD_NUMBER`.
5. Starta `tassla-ios` manuellt. Om genererat workspace/scheme skiljer sig från `Tassla`, justera de två namnen efter byggloggen. Native byggning/signering kan inte verifieras på denna Windows-dator.
6. Lägg den färdigbehandlade versionen till dig själv som intern TestFlight-testare och installera.

## Telefonchecklista – återstår att köra
- Begär länk från appen och öppna mejlet på samma iPhone: kall och varm appstart.
- Skapa en testhund, starta om och logga ut/in: samma hund ska hämtas.
- Dubbeltryck och avbruten anslutning får inte skapa dubbel hund eller visa falsk sparstatus.
- Logga ut: tidigare hund/innehåll ska försvinna. Utgånget/felaktigt callback ska ge begripligt fel.
- Utan publicerat innehåll visas tomt läge; publicerat innehåll anpassas efter hundens ålder/ras.
- Kontrollera stora textstorlekar, tangentbord, tillgänglighetsläsning och Minska rörelse på telefonen.

Spara utfallet med byggnummer i `docs/tasks/dev/app-01-report.md`. Lokala tester/bundling bevisar inte dessa telefon- och Supabaseintegrationer.

Underlag: [Expo Router](https://docs.expo.dev/router/installation/), [Supabase mobilcallback](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Supabase e-post](https://supabase.com/docs/guides/auth/auth-smtp), [Codemagic React Native](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/).

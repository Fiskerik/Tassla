# APP-01 – första körbara appflödet, plan v2

Status: APP-01 plan v2 och namngivna paket godkända av Erik 2026-10-04 genom ”godkänner” på föregående mandatfråga. Architect APPROVE är sparat nedan. Arbetet startar utan att aktivera utskick eller externa builds. MVP, stack, arkitektur och bundle-ID är redan beslutade.

## Leverans
En körbar Expo-app med flödet e-post → magic link → app → hundprofil → Hem. Initialt standardmejl enligt Eriks godkända tillfälliga metod, senare OTP med SMTP och Google. Google-provider är enligt Erik konfigurerad, men första segmentet bygger inte Google-inloggning. SQL-foundationtest är enligt Eriks skärmbild slutfört med rollback. Ingen ny databas eller omskrivning av initial migration.

Hem visar hundprofil och faktiskt publicerat innehåll. Finns inget publicerat innehåll visas ärligt tomt läge; inga påhittade råd eller falsk pilotleverans. Sexskärms-MVP byggs vidare i senare segment.

## Paket som mandatet behöver omfatta
- Kärna: expo, react, react-native, expo-router och typescript/@types/react.
- Routerns dokumenterade stöd: expo-linking, expo-constants, expo-status-bar, react-native-safe-area-context, react-native-screens.
- Data/auth: @supabase/supabase-js, react-native-url-polyfill, expo-secure-store för native sessionslagring.
- Kontroller: eslint och eslint-config-expo. Befintliga Node-domäntester återanvänds; inget nytt test-/UI-ramverk förutsätts.

Välj stabila paketversioner som matchar vald Expo SDK enligt aktuell officiell dokumentation; använd Expo-versionkontroll och spara lockfile. Ingen canary/beta eller automatisk uppgradering. Ytterligare paket kräver ett eget motiverat beslut. Starta inte create-expo-app över befintlig projektrot och skriv inte över .env/SDK-filer.

## Numrerade deluppgifter
| ID | Resultat och filer | Verifiering |
|---|---|---|
| APP-01A | package.json/lockfile, app-konfiguration, tsconfig/lint, minimal router och första uppstart; bundle-ID com.erimaliab.tassla | Paketkompatibilitet, typkontroll/lint och Expo-bundling |
| APP-01B | Supabase-klient, sessionslagring/livscykel, e-postskärm och strikt appcallback; account/data-moduler | Godkända/avvisade callback-URL:er, saknad konfiguration, utloggning/kontobyte; inget token-/mejlloggande |
| APP-01C | Profilformulär via verkliga create_dog-kontraktet, rasurval från databasen, Hem med verklig/tom innehållsstatus | Validering, dubbeltryck, nätfel/okänt RPC-resultat, ägarisolering och inga falska sparstatus |
| APP-01D | README/guider, check-kommandon, avgränsad städning, QA/Reviewer och relevant Security | Körda lokala kontroller + fysisk iPhone/magic-link-verifiering där miljö finns; ej körda steg redovisas |

Faktisk skrivfördelning: koordinatorn ansvarar för config/router i A och docs; implementer-körningen Luna high ansvarar för src i B/C. Ingen samtidighet på samma filer. Ordning och beroenden: A → B → C → D. Huvudsessionen sparar mandat, reviews och checkpoints. I D äger QA testfiler, implementer korrigeringar i appkod och koordinatorn docs/config utanför rollens ägarområde; inga samtidiga skrivare på samma filer. QA, Reviewer och Security granskar som separata roller och får inte själv godkänna egen implementation. Denna plan anger konfigurerade rollmandat, inte redan utförda agentkörningar.

Befintlig hund hämtas efter sessionsåterställning/ny inloggning och leder till Hem; profilformulär visas bara när ägarens databasfråga faktiskt visar att hund saknas. Vid timeout på create_dog kontrolleras om hund skapats innan nytt försök. Testa omstart, återinloggning och förlorat RPC-svar utan att fastna i en-hund-begränsningen.

### Fysisk iPhone
Expo Go kan användas för begränsad UI-förhandsvisning men verifierar inte produktappens egna URI-schema. Verifieringsvägen för riktig callback är en signerad iOS-app byggd med Codemagic och installerad via TestFlight. Codemagic-konfigurationsfil får förberedas med detta segment; inga externa byggen/uppladdningar triggas av agenten utan mandat. Erik ansvarar för signering/Apple-konfiguration och start av sådan byggkörning. Ingen expo-dev-client krävs för denna TestFlight-väg. Om separat development build väljs senare krävs separat plan för paket/signering.

Lokala kontroller kan slutföras före telefonbygget. Mobilcallback/integrationsuppgiften förblir ofärdig tills faktisk signerad app har testats; inte ett påstått PASS från bundling.

En skrivande deluppgift åt gången, högst två sammanlagt med skilda filansvar. Spara checkpoint efter varje del. Arkitektens APPROVE gäller exakt denna version; substantiell ändring kräver omgranskning.

## Auth och avgränsning
Appcallback väljs med ett uttryckligt URI-schema och tillåtelselistas i Supabase. Googles callback till Supabase är inte samma URL som returen till appen. Kontrollera faktisk Expo-version och supported mobile link flow före implementation; testa kall/varm appstart och avvisa oväntade URL:er. Privata sessionsuppgifter lagras med native säkert lager och städas vid kontoändring. E-postutskick testas av Erik med auktoriserad adress; agenterna skickar inga mejl och använder inga konton/privilegierade nycklar.

Detta segment använder ingen analytics, inga kliniska råd, ingen offlinekö, ingen Google-/Apple-/OTP-konfiguration, inget PDF-flöde och ingen automatisk Codemagic-deployment. Behörigheter från foundation återanvänds. Utveckling/test med testuppgifter; riktig pilot väntar på berörda data-/driftbeslut.

## Klart när
Appen kan bundlas och lokala check-kommandon passerar. QA och oberoende Reviewer godkänner faktiskt verifierad del; Security granskar auth/data. Verklig magic-link-/mobilintegration kräver dokumenterat telefonresultat. En lokal build eller mock är inte bevis för hela authflödet. Inga tjänster eller inloggningsutskick aktiveras automatiskt av paketinstallation.

## Återstår från Erik
APP-01 och de namngivna paketen har nu godkänts av Erik. När callback är konkret anger koordinatorn den exakta URL som Erik behöver tillåta i Supabase. Inget Expo-konto eller nya tjänstekonton behövs för den lokala starten.
Mandatet har nu inkommit. Återstående manuella steg gäller konkret callback-tillåtelselista och fysisk signerad appverifiering, inte ett nytt godkännande av samma paket/segment.

## Planreview 2026-10-04
Tech Lead: APPROVE APP-01 plan v2 som beslutsunderlag; inget implementationstillstånd utan Erik-mandat. Critic: PROCEED WITH CHANGES för v1, med två krav: återkommande ägare/okänt RPC-resultat och konsekvent dokumenterat magic-link-beslut. Båda hanterade i v2 och 0003-auth.md. Critic har inte lämnat ett nytt verdict efter ändringarna. Inga kod-/integrationstester påstås utförda för denna plan.

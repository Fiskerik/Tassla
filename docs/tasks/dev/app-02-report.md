# APP-02-LOCAL – leverans och verifiering

2026-10-04. Erik godkände sex MVP-sidor samt fungerande vardagslogg och efterföljande sida, Träning. Leveransen gäller det befintliga lokala testläget. Plan: app-02.md v1. Granskad träningstext och källor: app-02-content.md.

## Sparade delsteg
- A: Fyra huvudval (Hem, Logg, Träning, Mer), sex skärmkomponenter och bibehållen profilredigering. Fast navigation utanför scrollområdet. Implementer körde typkontroll, lint och 13 tester med godkänt resultat.
- B: Syntetiska exempel, sex snabbloggtyper, historik, rättning och bekräftad radering. Ren modell validerar datum/tid och 500 Unicode-tecken. Post- och hundidentitet behålls. Implementer körde kontrollerna med 13 godkända tester; QA tillförde sju domäntester och rapporterade godkänt resultat.
- C: Två internt granskade program med tre steg var. Progression avgränsas per hund, program, version och steg. Hem visar nästa oregistrerade steg och öppnar rätt program. Stopptext föregår instruktionerna. Avslutat läge beskriver registrering, inte hundens färdighet. QA tillförde fem träningstester; implementerns sista kontroll passerade med totalt 25 tester.

Sidbyten börjar upptill och har en kort opacityövergång som respekterar Minska rörelse. Logg och progression bor i skalets React-minne och överlever sidbyte. De återställs vid omstart. Hälsa, Kunskap och Tassla-pass har enbart tydligt beskrivna sidgrunder; ingen PDF eller medicinsk registrering ingår här.

## Granskningar och korrigeringar
Tech Lead architecture_astra (Astra): APPROVE exakt plan v1. Critic app_qa_luna (Luna high): PROCEED. Innehållsgranskningen genomfördes av architecture_astra i separat dog_expert-uppgift mot officiella källor. Den godkänner intern demotext, inte pilotpublicering eller individuell veterinärbedömning.

Implementer app_implementer_luna (Luna high) skrev appkoden. QA app_qa_luna skrev endast tester/testguide. Kodförfattaren och granskaren är olika agenter. QA:s tester granskades oberoende av architecture_astra, med PASS. Security architecture_astra: PASS för lokal överlämning; inga nya klient-, nätverks- eller lagringsanrop. Befintlig releasepolicy, providergräns och callbackskydd behålls. Animated, Alert och AccessibilityInfo verifierades mot installerade React Native-definitioner.

Under genomläsningen rättades loggredigerarens komponentnyckel, så byte mellan två poster inte behåller tidigare formulärvärden. Hemgenväg, avslutat träningsläge och stopptextens ordning kompletterades inom planen före slutkontrollen. En tidig kontroll mitt i ofärdig B gav ett tillfälligt propsfel; detta rättades genom färdigställandet och ersätts av de senare godkända kontrollerna.

QA hittade därefter fyra gamla modulguider med motstridiga uppgifter. Korrigeringsplan 1 godkändes av Tech Lead och ändrade endast README för Hem, Hälsa, Kunskap och Tassla-pass. Ingen kod eller test ändrades. QA återläste guiderna och lämnade PASS för lokal QA.

## Verifiering
Huvudsessionen körde pnpm check självständigt med TZ=Europe/Stockholm: typkontroll, lint och 25/25 tester PASS; noll överhoppade tester, inklusive sommartidsfallet. QA körde också slutkontrollen: 25/25 PASS.

iOS-export med EXPO_NO_DOTENV=1 och previewflaggan satt passerade (1180 moduler). Detta är en JavaScript/Hermes-export, inte signerad installation. Inga .env-värden lästes. git diff --check passerade för spårade ändringar; nya källfiler täcks av typkontroll/lint. Befintliga radsluts- och Node-modultypvarningar är inte testfel.

Cleanup: fokuserade skärmkomponenter och rena domänfunktioner, borttagen äldre enskärmsimplementation, konsekventa identiteter och inga nya generella lager. Modulguider beskriver aktuella ingångar, dataflöde, kontroll och begränsningar. Ingen ny dependency, migration, betald SDK-körning eller extern åtgärd.

## Kvarstående telefonprov och backend
Fysisk navigation, tangentbord, stor text, skärmläsare, dialoger, animation och omstart är NOT TESTABLE här. Node-domäntester bevisar inte React-state vid snabba tryck; UI-kopplingar är statiskt granskade. Prova enligt docs/dev/app-start.md i Expo Go med pnpm.cmd start:preview.

Befintlig Supabase-grund och authkod behålls. Riktig auth/dataintegration ligger i APP-01-PHONE och har skjutits upp av Erik. Logg/träning är ännu inte molnkopplade; ingen offline-synkpolicy beslutas här. Återstående sidfunktioner, PDF-fält, notifieringar och publicerat innehåll kräver sina kommande avgränsade planer.

SourceReviewer app_qa_luna i separat granskningssteg: PASS lokal överlämning. Ingen appkod skrevs av granskaren; QA:s tester är oberoende granskade av Astra. Inga blockerande källfel hittades. QA, Security och oberoende testreview har också passerat. APP-02-LOCAL är klar; nästa steg är Eriks telefonprov enligt guiden. Detta är inte en färdig moln-MVP eller pilotrelease.

# DEV-PREVIEW-01 – checkpoint och verifiering

Mandat: Erik skjuter upp inloggningsflödet och vill behålla backbonen. Godkänd plan: dev-preview-01.md v1 inklusive EXPO_PUBLIC_DEV_PREVIEW och portabelt startskript.

## Checkpoint 1 – plan
TechLead architecture_astra (Astra): APPROVE exakt v1. Critic app_qa_luna (Luna high): PROCEED efter flaggprecisering. Uppgiften ligger i implementing. Implementer app_implementer_luna (Luna high) äger app/src/startskript/package; koordinator äger denna rapport och startguide.

## Lokala kontroller
Implementer och oberoende QA körde pnpm check: typkontroll/lint och 13/13 tester PASS. Koordinatorn körde samma check självständigt, också PASS. QA granskade endast tester, ingen appkod skrevs av QA. Befintliga datumtester täcker ogiltiga/framtida datum; previewns namn-/knappvalidering och provider/callbackgränser är statiskt granskade, inte UI-renderade.

iOS-export med EXPO_NO_DOTENV=1 och EXPO_PUBLIC_DEV_PREVIEW=true PASS; produktionsexporten kompilerar även med satt flagga. Flaggans releasegräns verifieras av den rena policyns testmatris. Startskriptets verkliga Expo CLI kördes med --help och gav exit 0 utan att starta server eller läsa .env. Tests verifierar faktisk CLI-fil, argument och barnmiljö utan sidverkningar. git diff --check PASS för spårade ändringar; ny appkod täcks av typkontroll/lint. Node ger en känd MODULE_TYPELESS_PACKAGE_JSON-prestandavarning, inga testfel.

## Slutgranskning och cleanup
SourceReviewer app_qa_luna (Luna high, ingen författare till appkoden): PASS lokal handoff; ingen blockerande eller påhittad API hittad. Agenten hade tidigare QA/Critic-uppgifter i separata steg. Därför granskade architecture_astra QA:s previewtester oberoende: PASS efter faktisk läsning, inte egen testomkörning. Provider/callback/UI är fortfarande statiskt granskade, inte telefonverifierade. Security PASS enligt checkpoint 2.

Avgränsad cleanup genomförd: gemensam policy i stället för dubblerade villkor; auth-hooks ligger i separat produktkomponent; preview har små lokala komponenter och återanvänder datum/primitiver. Ingen generell datakälla, extra dependency eller onödig infrastruktur. Hundcopy och modulguider uppdaterade. Ingen ytterligare refaktorering behövdes efter stabil källa.

Lokal DEV-PREVIEW-01 är klar. Inga externa anrop eller betalda SDK-prov. Nästa steg: Erik stoppar gamla Expo-servern, kör pnpm.cmd start:preview och öppnar den nya QR-koden i Expo Go. Kontrollera Hem, redigering med vuxen hunds födelsedatum, ogiltiga uppgifter och återställning efter omstart. Därefter planeras nästa MVP-segment separat; auth-/backendtelefonprov kvarstår.

## Telefon och backend
Telefonpreview är inte verifierad här. Befintlig verklig auth/dataintegration ligger kvar som separat APP-01-PHONE och skjuts upp enligt Erik. SQL/RLS och Supabase-konfiguration ska inte ändras för previewn. Testprofilen är syntetisk och lagras endast i minnet.

## Checkpoint 2 – stabil källa
Luna high implementerade policy, providergräns, AppFlow/callback, syntetisk RAM-profil och startskript. Previewcopy använder hund enligt Eriks tidigare önskemål. Astra Security PASS genom statisk granskning: ingen klient-/sessionsinitiering i preview, release auth kvar, verkligt installerat Expo-bin används utan shell. QA tar endast tests; telefon fortfarande ej verifierad.

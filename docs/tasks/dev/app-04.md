# APP-04 – användbar funktion i befintliga MVP-sidor

Plan v6, 2026-10-05. Erik godkände i chatten 2026-10-05 APP-04A-UX som första segment, därefter APP-04A-PHONE, APP-04B1 vikt, APP-04B2 övrig hälsa och APP-04C profil. Mandatet omfattar lokal implementation av APP-04A-UX; ny signerad TestFlight-build och fysisk telefonverifiering kräver separat APP-04A-PHONE-mandat. Utförande ska använda GPT-5.6 Luna Medium.

## Korrigeringsplan 1 – APP-04A-UX

Plan v8, 2026-10-05. Review och Security blockerade den lokala checkpointen med två verifierbara fynd: auth-kontraktstester saknas och React-state ensam garanterar inte exakt ett utloggningsanrop vid samtidiga bekräftelser. Erik delegerade beslutet om serverfel; vald semantik är fail-safe lokal utloggning. Installerad Supabase Auth 2.117.2 kan rensa lokal session även när global sign-out returnerar serverfel, så auth-resultatet ska skilja `localSessionCleared` från `serverRevocationConfirmed`. Efter lokal utloggning visas en eventuell servervarning på signed-out-vyn; inget retry under Mer påstås finnas efter att sessionen är borta. Detta är ett lokalt säkerhets-/UX-beslut, inte ett påstående om serverns globala sessionsstatus.

- **Implementer write paths:** `src/features/home/ProductWorkspace.tsx`, `src/features/account/AuthProvider.tsx`, `src/features/account/SignInScreen.tsx`, respektive README-filer, samt ingen ny dependency.
- **QA write paths:** `tests/app-screen-ux.test.mjs`, `tests/README.md`.
- **Acceptans:** en synkron `useRef`-spärr gör att två samtidiga bekräftelser ger högst ett auth-anrop; Avbryt ger noll; auth-resultatet rapporterar separat om lokal session rensades och om serverrevokering bekräftades; vid lokal rensning går appen till signedOut-vyn och visar eventuell servervarning där; om lokal rensning misslyckas får UI inte påstå att användaren är utloggad. Tester använder uppskjutna kontrollerade promises, lokal storage och installerad Supabase-klient.
- **Gräns:** ingen ändring av Google/e-post-login, account deletion, server-side session policy eller fysisk telefonverifiering. Din befintliga build-verifiering av båda loginvägarna sparas som ägarens manuella resultat men ersätter inte dessa lokala korrigeringstester.
- **Checks:** `pnpm check`, `pnpm bundle:ios`, `git diff --check`; fysisk UX fortsatt NOT TESTABLE i APP-04A-PHONE.

## Mål och avgränsning

Målet är att ge hög vardagsnytta utan nya ramverk eller bred ombyggnad. Befintlig auth, Supabase-grund, navigation och design behålls. Inga nya dependencies, notifieringar, partnerkopplingar, kliniska råd, automatisk vårdplan, extern delning eller App Store-publicering ingår i detta utkast.

Kunskap, Vardagslogg och Träning har redan verklig lokal/molnkopplad funktion. Hälsa och Tassla-pass är tomma grunder. Utloggning finns längst ned på Hem men är svår att upptäcka. Gemensamt skärmskal har scrollning men saknar uttrycklig tangentbordsanpassning, vilket kan lägga den primära knappen bakom tangentbordet på telefon.

## Prioriterad checklista

### APP-04A – UX-bas: konto och tangentbord

- **Ägare:** Implementer äger endast angiven appkod och modulguider. QA äger `tests/app-screen-ux.test.mjs`. Därefter granskar Reviewer och Security den frysta diffen.
- **Beroenden:** APP-03-LOCAL är klar. Inget schemasteg.
- **Implementers write paths:** `src/components/AppPrimitives.tsx`, `src/components/README.md`, `src/features/home/ProductWorkspace.tsx`, `src/features/home/README.md`, `src/features/account/SignInScreen.tsx`, `src/features/account/README.md`, `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/README.md`, `src/features/puppy-log/LogScreen.tsx`, `src/features/puppy-log/README.md`.
- **QA write paths:** `tests/app-screen-ux.test.mjs`, `tests/README.md`.
- [ ] Flytta utloggning från den långa Hem-sidan till en tydlig kontoåtgärd under Mer.
- [ ] Lägg till bekräftelse före utloggning: Avbryt behåller sessionen, Bekräfta anropar utloggning högst en gång, vänteläge blockerar dubbeltryck och fel visas på Mer med möjlighet till nytt försök.
- [ ] Säkerställ separat för login, onboardingprofil och loggredigering att fokuserat fält och primär knapp kan scrollas fram och tryckas medan tangentbordet är öppet.
- [ ] Dragscroll ska kunna stänga tangentbordet och Klar ska användas där tangentbordstypen stöder det. Multiline-noteringen ska ha en tydlig tillgänglig väg att stänga tangentbordet.
- [ ] Kontrollera liten telefon, stor text, skärmläsaretiketter, tryckytor och att bottennavigationen inte täcker innehåll.
- [ ] Gör den obligatoriska avgränsade cleanup-passen, kör om relevanta kontroller och dokumentera resultatet före QA.
- [ ] Kör `pnpm check`, `pnpm bundle:ios` och `git diff --check`. Bundle bevisar inte tangentbordsbeteende.
- [ ] Dokumentera tangentbords-runtime, VoiceOver och faktisk bottennavigation som NOT TESTABLE i den lokala delen. De verifieras endast i separata APP-04A-PHONE efter uttryckligt Erik-mandat för ny build/TestFlight.
- [ ] Spara godkända kontroller och exakt nästa steg som hållbar checkpoint innan APP-04C får starta.

**Lokal acceptans:** Logga ut är kopplat under Mer och borttaget från Hem. Källan och kontrollerade kontraktstester täcker att Avbryt inte anropar utloggning, Bekräfta anropar högst en gång och vänteläge stoppar dubbeltryck. Om lokal rensning lyckas men serverrevokering är obekräftad går appen till signed-out-vyn med sanningsenlig varning och ingen retry under Mer erbjuds. Om lokal sessionsrensning misslyckas stannar användaren kvar utan att UI påstår utloggning och nytt försök är tillåtet. Login-, onboardingprofil- och loggredigeringsformulären använder installerade React Native-mekanismer för keyboard-aware layout, dragavvisning, Klar där det stöds och en tillgänglig multiline-stängning; props och callbacks är korrekt kopplade och iOS-bundlen byggs. Detta bevisar inte faktisk fysisk UX.

**Lokal verifieringsgräns:** statiska kontrakt, typkontroll, lint och iOS-bundle får verifiera implementationens koppling och byggbarhet men inte faktiskt tangentbordsbeteende. APP-04A-PHONE verifierar på liten iPhone/TestFlight varje formulär med tangentbord öppet, dragscroll/Klar/multiline-stängning, stor text, VoiceOver-fokus, bottennavigation och utloggningens Avbryt/Bekräfta/fel/dubbeltryck. Android är NOT TESTABLE tills separat Android-runtime körs.

### Grind APP-04A-PHONE – fysisk UX-verifiering

APP-04A-PHONE körs direkt efter den lokala delen och måste passera innan nästa funktion startar. Den kräver separat Erik-mandat för ny signerad build/TestFlight. Checklistan täcker de tre formulären och utloggningen enligt den lokala verifieringsgränsen ovan.

### Backlog efter godkänd APP-04A-PHONE

Critic rekommenderade Hälsa före profil eftersom Hälsa är en tom obligatorisk MVP-yta. Erik har beslutat ordningen APP-04B1 → APP-04B2 → APP-04C.

### APP-04B1 – Hälsa: första kompletta viktresa

- **Ägare:** Compliance granskar dataändamålet före kod. Implementer arbetar därefter, följd av QA, Reviewer och Security.
- **Beroenden:** APP-04A-PHONE klar och checkpointad samt Eriks uttryckliga godkännande av behandlingsändamålet.
- [ ] Visa laddar-, tom-, fel- och historikläge för ägarregistrerad vikt.
- [ ] Lägg till en vikt med datum och validering enligt befintligt databaskontrakt.
- [ ] Rätta och bekräftat radera viktposten med sanningsenlig sparstatus.
- [ ] Märk uppgiften som ägarregistrerad och inte verifierad journal eller vårdråd.

**Acceptans:** En liten men komplett viktresa fungerar över skapa, läsa, rätta och radera. Övriga hälsotyper visas inte som färdiga.

### APP-04B2 – Hälsa: vaccination och veterinärhändelse

- **Beroenden:** APP-04B1 klar och checkpointad.
- [ ] Utöka samma verifierade historik- och skrivmönster med vaccination och veterinärhändelse.
- [ ] Behåll endast datum och kort ägartext; inga kliniska råd, automatiska intervall eller vårdscheman.
- [ ] Kör negativ RLS-kontroll när utvecklingsdatabas finns; faktisk runtime får inte påstås verifierad utan körning.

**Acceptans:** Ägaren kan skapa, förstå, rätta och ta bort de tre godkända hälsotyperna. Ingen klinisk rekommendation eller automatiskt intervall visas.

**Återstående Hälsa-slice:** kommande ägarangivna händelser och påminnelseleverans planeras separat. APP-04B1/B2 får inte beskrivas som hela Hälsa-MVP:n.

### APP-04C – Hundprofil: enkel redigering

- **Ägare:** Implementer, därefter QA, Reviewer och Security.
- **Beroenden:** APP-04A-PHONE klar och checkpointad. Befintlig hundprofil och uppdateringsgrant återanvänds; inget schemasteg planeras.
- **Berörda filer:** `src/features/onboarding/`, `src/features/home/AppFlow.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/data/app-data.ts`, tester och modulguide.
- [ ] Visa rasens läsbara namn i stället för internt ID.
- [ ] Låt ägaren ändra namn, ras och födelsedatum med samma validering som onboarding.
- [ ] Uppdatera arbetsytans ägda hund-state efter bekräftad serversparning och hantera osäker sparstatus utan dubbla skrivningar.
- [ ] Återhämta korrekt ålders- och innehållsurval efter ändringen.

**Acceptans:** Ägaren kan rätta hundens grunduppgifter och ser det bekräftade resultatet överallt utan omstart.

### APP-04D – Tassla-pass: förhandsgranskning före PDF

- **Ägare:** Planeras först efter separat Erik-beslut; därefter Implementer, QA, Reviewer, Compliance och Security.
- **Beroenden:** APP-04B2 och APP-04C klara. Exakt dataurval och en smal exportnytta beslutad och användartestad av Erik.
- [ ] Visa en förhandsgranskning av endast uttryckligen godkända ägarregistrerade uppgifter.
- [ ] Visa skapandedatum och tydlig text om att detta inte är officiellt pass, intyg eller vaccinationskort.
- [ ] Besluta separat om PDF/export. Ny dependency eller delningsfunktion kräver nytt uttryckligt godkännande.

**Acceptans:** Ingen information lämnar kontot utan ägarens separata handling. En tom eller ofullständig profil ger ett begripligt läge, inte en missvisande rapport.

APP-04D är endast förhandsgranskning och uppfyller inte hela MVP-kravet på PDF/export.

## Medvetet senarelagt

- Pushnotiser och påminnelseleverans: kräver öppet produktbeslut, behörighets-UX och sannolikt dependency.
- PDF och systemdelning: kräver exakt urval, compliance/security och dependencybeslut.
- Nytt hundhälsoinnehåll eller råd: kräver Dog Expert före publicering.
- Fler kunskapsartiklar: kräver ett separat innehållsurval och faktagranskning; UI:t kan redan visa publicerat innehåll.

## Grindar och modellval

1. Erik väljer och godkänner första segmentet; rekommendationen är endast APP-04A först.
2. Tech Lead (`architect`, SOL) granskar exakt planversion. Critic (`critic`, SOL) granskar användarvärde och scope. Security granskar APP-04A före merge eftersom auth-/utloggningsytan ändras.
3. Implementer får börja först efter APPROVE och Eriks uttryckliga segmentmandat.
4. En del i taget: implementation → lokal kontroll och cleanup → QA → Reviewer → vid relevant auth/data även Security/Compliance → hållbar checkpoint.
5. Implementer, QA och Reviewer ska använda GPT-5.6 Luna Medium enligt Eriks uttryckliga modellbeslut 2026-10-05. Modellvalet ska finnas i rollfilerna och inte endast i körprompten.

## Planreview

- Tech Lead, v1: **CHANGES**. APP-04A bedömdes som rätt första del men behövde exakt kökontrakt, separerat skrivägarskap, skärpt acceptans för utloggning och varje formulär, manuell telefoncheck, cleanup/checkpoint samt löst modellgrind. Rekommenderad ordning ändrades till A → C → B → D.
- Tech Lead, v2: **CHANGES**. Huvudkraven var införda, men lokal leverans behövde skiljas från fysisk telefonverifiering och MVP-spårningen behövde peka på exakt sektion.
- Tech Lead, v3: **CHANGES**. Kökontrakten var giltiga, men lokal acceptans blandade verifierbara källkontrakt med NOT TESTABLE fysisk UX. I v4 ligger faktisk keyboard/VoiceOver/bottennavigation i telefontasken; kontrollerat utloggningsfel verifieras lokalt.
- Tech Lead, v4: **BLOCK** enbart på saknat Erik-mandat, olöst Luna-version och återstående Critic-grind; plan- och kökontrakten bedömdes tekniskt tillräckliga.
- Critic, v4: **PROCEED WITH CHANGES**. APP-04A ska följas direkt av obligatorisk telefoncheck före nästa funktion; Hälsa kontra profil behövde valideras och Tassla-pass skjutas tills exportnyttan är definierad. v5 gör telefonchecken till grind, delar Hälsa i två små resor och skjuter passet.

## Frågor till Erik före implementation

1. Erik har godkänt GPT-5.6 Luna Medium för utförandet.
2. Erik har godkänt APP-04A-UX som första segment.
3. Beslutad ordning är APP-04A-UX → APP-04A-PHONE → APP-04B1 vikt → APP-04B2 övrig hälsa → APP-04C profil.

# Leveransdatum och förberedelser — genomförandeplan v4

Datum: 2026-10-19 · Status: inväntar ny Architect-, Critic-, Security- och Compliance-granskning. Ingen kodändring före godkänd plan och checkpointade föregående UX-slices.

## Ägarönskemål
Erika vill kunna ange ett valfritt Leveransdatum, kalenderdagen då hunden kommer hem. Hem ska använda datumet för praktiska förslag före hemkomsten, till exempel sovplats/bädd, koppel och mat- och vattenskålar. Begäran godkänner produktbehovet och lokal planering; arkitektur, dataflöde och persondatainformation granskas innan implementation.

Ägarbeslut 2026-10-19: avsedd rättslig grund är samtycke. Det måste inhämtas som separat, aktivt och informerat val för detta ändamål; ett nej får inte försämra övriga appfunktioner. Samtycke ska kunna återkallas lika enkelt som det lämnas, med stoppad användning och radering av Leveransdatum. Ägaren har förtydligat att datumet ska behållas som profilhistorik även efter 30 dagar. Föreslagen retention är tills användaren rensar datumet/återkallar samtycket, hund-/kontoprofilen raderas eller Tasslas befintliga betagallring sker. Historikändamål och denna retention behöver Compliance-granskning före implementation.

## Granskningshistorik
Architect granskade v1 och begärde ändringar. v2 låser en unik create-RPC så installerade klienter kan fortsätta använda befintlig fyra-arguments-RPC, anger NULL-semantik genom hela klientens spar- och konfliktflöde, fastställer datumregeln och skärmplaceringen samt beskriver migrationsordning och vad som inte kan verifieras utan databas. v3 fångar ägarens avsedda rättsliga grund och en preliminär 30-dagarstolkning. v4 ersätter den tolkningen efter ägarens förtydligande att profilhistoriken ska fortsätta efter dag 30. Den utökade retentionen kräver ny Compliance-granskning före implementation.

## Förutsättningar och avgränsning
- Genomför först UX-BREED-PICKER och UX-TRAINING-DETAIL enligt deras egna checkpointar. Denna slice får inte ändra deras redan granskade omfattning. Tassla-pass/PDF förblir separat.
- Endast ett valfritt datumfält och ett informativt Home-kort ingår. Inga notifieringar, sparade checklistor/aktiviteter, AI-förslag, analys, annonser, sponsring, kennel- eller partnerdelning införs.
- Födelsedatum, beräknad ålder, livsfas, träningsurval, kennelflöde och befintligt onboardingkrav förblir oförändrade.

## Profilflöde
- Skapa och redigera profil visar samma frivilliga fält Leveransdatum efter Födelsedatum. Hjälptext: “Datumet hunden kommer hem. Du kan lämna fältet tomt.”
- Ett separat opt-in till detta ändamål visas före lagring; nej påverkar inte övriga appfunktioner. Tomt eller nekat samtycke sparas som NULL och visas som “Inte angivet”. Redigering kan ange, ändra eller rensa värdet.
- Efter hemkomst ska datumet fortsätta visas som profilhistorik även efter dag 30. Föreslagen gräns är samtyckets återkallelse/rensning, hund-/kontoradering eller befintlig betagallring; Compliance ska godkänna ändamål och retention.
- Inmatningen validerar ett riktigt kalenderdatum och regeln leveransdatum >= födelsedatum. Fältet ändrar inte befintlig födelsedatumsvalidering.
- Befintliga hundrader utan värde läses som NULL.

## Databas, RPC och behörigheter
- Lägg till public.dogs.home_arrival_date DATE NULL med CHECK-villkoret home_arrival_date IS NULL OR home_arrival_date >= birth_date. Befintliga hundar behåller NULL.
- Lägg till endast GRANT UPDATE (home_arrival_date) ON public.dogs TO authenticated; behåll befintlig owner-only RLS och ägarskapsregler oförändrade.
- Lägg till exakt en ny, unikt namngiven funktion med fem obligatoriska argument och utan defaultvärden eller overload:
  public.create_dog_with_home_arrival_date(dog_name text, dog_breed_id text, dog_birth_date date, kennel_code text, dog_home_arrival_date date) RETURNS uuid.
- Den nya SECURITY DEFINER-funktionen använder tom search_path, delegerar själva hundskapandet till befintliga public.create_dog(dog_name, dog_breed_id, dog_birth_date, kennel_code), uppdaterar den skapade hundens home_arrival_date och returnerar samma UUID i samma SQL-transaktion. Därmed fortsätter den befintliga funktionen att hantera auth-lås, en-hund-per-konto, kennelkod, medlemskap och attribution atomärt; ett constraintfel rullar tillbaka hela nya RPC-anropet.
- Befintliga fyra-arguments public.create_dog(text,text,date,text) och dess behörigheter förblir intakta och kan fortsatt anropas av äldre klienter. Den nya funktionen har separat argumentlista/signatur; återkalla behörighet från PUBLIC och anon och ge EXECUTE endast till authenticated.
- Migrationen är unik och framåtriktad. Den appliceras inte i detta arbete. Ingen policy-/RLS-ändring eller service-role-väg införs.

## Klientens datakontrakt och konfliktkontroll
- OwnedDog.home_arrival_date: string | null är obligatoriskt i appens modell; OwnedDogProfileChanges bär samma nullable datum.
- Ta med kolumnen i alla hundselects, create- och update-payloads, validering, readback/returvärden, matchningskontroller, pending profile intent och workspace-resultat. Create-readback måste exakt matcha önskat datum, inklusive NULL.
- Lägg till datumet i sameOwnedDogProfile, profilskärmens component key och jämförelser/retries/conflict resolution. Ett osäkert eller avbrutet sparresultat får inte återställas till falskt “sparat”.
- Update-CAS använder .is('home_arrival_date', null) när preimage är NULL och .eq('home_arrival_date', value) annars. NULL jämförs som ett faktiskt profilvärde.
- Skapa-profilen anropar den nya unikt namngivna fem-arguments-RPC:n och skickar NULL när fältet är tomt. Uppdateringsflödet inkluderar värdet i samma befintliga säkra CAS/readback-kedja.

## Kalenderdagsberäkning och Home
- Återanvänd localDate() i src/features/onboarding/dog.ts och parseCalendarDate() i src/features/onboarding/life-stages.ts (den senare kan importeras som parseDate). Behandla värdena som datumsträngar YYYY-MM-DD; konvertera inte kalenderdatum via lokal midnatt eller tidsstämplar.
- Tomt formulärvärde blir NULL. Validera parsning med datumhelpern och jämför födelse-/hemkomstdag som kalenderdagar. Beräkna hela dagar genom differensen mellan parsade kalenderdagsvärden.
- Home visar kortet “Inför hemkomsten” direkt efter hundens identitets-/åldersrad och före “Just nu”. För framtida datum visar det “Hunden kommer hem om N dagar” (korrekt singular för en dag) och för dagens datum “Hunden kommer hem i dag”, plus korta förberedelseförslag om sovplats/bädd, koppel och mat-/vattenskålar.
- Saknat eller passerat datum döljer kortet. Innehållet är statisk information och blir inte en rutin, uppgift eller sparad aktivitet.
- Bevara Home-hierarkin. Vid 375×844 och 430×844 ska de tre befintliga primära destinationskorten fortfarande synas; vid 375×667 och 140 % textproxy får innehållet scrolla utan överlappning eller klippning.

## Persondata, ändamål och livscykel
Leveransdatum är en ägarangiven uppgift kopplad till hundprofilen/kontot. Det enda nya användningsområdet är att visa förberedelseinformation före hemkomst på Home och profilhistorik efter hemkomst. Ägarens val är GDPR art. 6.1(a) samtycke, men ingen lagring eller användning får ske innan ett separat, aktivt, informerat och ändamålsspecifikt opt-in. Samtycket får inte buntas ihop med allmänna användarvillkor eller krävas för andra appfunktioner; Tassla måste kunna visa när och till vilken text samtycket lämnades. Återkallelse ska vara lika enkel som opt-in och stoppa användningen samt radera Leveransdatum. Utred om befintligt samtyckesmönster kan användas utan att återanvända den skilda analytics-grunden; annars krävs ett eget ändamålsspecifikt consent record/RPC.

Ägaren har förtydligat att Leveransdatum ska behållas som profilhistorik efter dag 30. V4:s föreslagna retention upphör när användaren rensar datumet eller återkallar samtycket, när hund-/kontoprofilen raderas eller när Tasslas befintliga betagallring raderar kontot. Ingen särskild automatisk radering vid dag 30 planeras. Profilhistorik efter hemkomst är ett utökat syfte som kräver Compliance-granskning av nödvändighet, information, consent-text och retention. Ändamål, frivillighet, åtkomst, ändring/radering, konto-/hund-/betaradering, backup/loggbegränsningar och access/kopia/portabilitet ska stå i MVP-, arkitektur-, beta-livscykel- och integritetsdokument. Ingen partnerdelning, analys, aktivitetssparning eller ytterligare användning introduceras. Security och Compliance granskar det fullständiga samtyckes- och historikflödet före implementation.

## Skrivvägar
src/data/app-data.ts, src/data/README.md; src/features/onboarding/dog.ts, ProfileScreen.tsx, EditDogProfileScreen.tsx, DogProfileScreen.tsx, README.md; src/features/home/HomeScreen.tsx, ProductWorkspace.tsx, AppFlow.tsx, PreviewHomeScreen.tsx, PreviewProfileScreen.tsx, DevelopmentPreview.tsx, README.md; supabase/migrations/202610190001_dog_home_arrival_date.sql; docs/mvp.md, docs/Architecture.md, docs/dev/beta-data-lifecycle.md, docs/privacy/beta-information.md; tools/visual-check/app.tsx; docs/design/evidence/vision-rev02/prearrival-date-2026-10-19/RENDER-REPORT.md; docs/tasks/dev/ux-prearrival-date-2026-10-19.md; docs/plans/UX-PREARRIVAL-DATE-2026-10-19-ux-spec.md; docs/tasks/dev/queue.json; docs/tasks/dev/rapport.md.

## Acceptans
1. Skapa och redigera har identiskt frivilligt Leveransdatum bakom ett separat, aktivt och återkalleligt samtycke; utan samtycke lagras inget datum. Tomt kan sparas/rensas, befintliga profiler läses som NULL och profilen visar “Inte angivet”.
2. Klient och databas upprätthåller verkligt kalenderdatum samt home_arrival_date IS NULL OR home_arrival_date >= birth_date.
3. Ny unik fem-arguments-RPC används av ny klient. Befintlig fyra-arguments-RPC, kennel-attribution, medlemskap, auth-lås och en-hundsvakt bevaras. RPC:erna blandas inte som overloads.
4. Nullable, framåtriktad migration ger bara nödvändig kolumn-updatebehörighet och ändrar inte RLS/ägarskap. Migrationen körs inte mot databas.
5. Create/update/readback/pending intent/equality/CAS/retry/conflict-flöde omfattar värdet och hanterar NULL exakt.
6. Home visar rätt text och tre förslag för i dag/framtida datum, döljer kortet för NULL/passerat datum och sparar inga aktiviteter.
7. Layouten bevarar Home-hierarkin och når viewportkraven vid 375×844, 430×844, 375×667 samt 140 % textproxy.
8. Samtyckestext och bevisbar opt-in, lika enkel återkallelse/rensning, profilhistorik efter dag 30 och slutliga retentionstriggers är implementerade och beskrivna i relevanta dokument; historikändamålet och retentionen är godkända av Compliance och Security/Compliance-fynd hanterade.
9. RN Web-evidens visar datumtillstånd och responsiv layout. SQL-runtime, dispatch/grants/RLS i verklig Supabase samt native Dynamic Type/VoiceOver markeras NOT TESTABLE om separat miljö saknas.
10. Ingen testsvit läggs till eller körs.

## Kontroller efter godkänd plan
pnpm typecheck; pnpm exec eslint på exakta ändrade TS/TSX-filer; befintlig RN Web-fixture och manuell render/interaktion utan testsvit; git diff --check endast om Git-metadata finns, annars NOT TESTABLE; python tools/dev_flow.py validate; oberoende Architect/Critic/Security/Compliance-granskning. Granska migrationen statiskt; utför ingen databasoperation.

Arbetsordning: checkpointa först rasväljare och träningsändring för att undvika delade UI-filer. Revidera v3 efter Architect/Critic/Security/Compliance-granskning; D får gå till ready först när rättslig grund och gallringsregel är slutligt dokumenterade och beroendet UX-TRAINING-DETAIL är checkpointat. Implementera denna slice ensam, spara kontroller och reviewresultat i taskrapporten. SQL-funktionen/migrationen måste vara applicerad och verifierad i utvecklingsdatabasen innan en klientversion som läser home_arrival_date distribueras. Legacy RPC-dispatch, grants, RLS och gallringsjobbet är NOT TESTABLE här och kräver separat runtime-verifiering.

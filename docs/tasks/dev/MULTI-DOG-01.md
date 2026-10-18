# MULTI-DOG-01 — Hundprofiler och hundstyrt innehåll

Planversion 5 · status: ny review krävs · 2026-10-18

## Mål och källor

Tillåt flera hundar per konto. Ägaren ska kunna byta aktiv hund via hundporträttet på Hem och via Inställningar → Hundprofil, samt lägga till hund från båda ytorna. Hem, Kunskap och hundbundna data följer alltid den aktiva hunden.

Artiklar väljs per vald hunds ålder och ras. Med en 12-årig och en 1-årig hund ska rätt hunds urval användas. Kontot är aldrig urvalskontext. Pågående och sena svar från föregående profil får inte visas eller skriva över den nya.

Källor: docs/decisions/MASTER-LOG.md; docs/MVP-EXPERIENCE-CONTRACT.md; docs/design/vision-rev02-screen-contracts.md; docs/design-rules.md §0–4, §14; $tassla-consumer-ux; docs/content/artiklar/README.md; exempelartikeln 01_Forsta_dygnet_hemma.docx.pdf.

Nuläge: src/content/select-content.ts väljer publicerat innehåll per ålder och exakt ras. ProductWorkspace får redan ett hundobjekt och härleder ålder från dess födelsedatum, och är nycklad med hund-ID. Däremot begränsar fetchOwnedDog(), dog_memberships.user_id UNIQUE och create_dog-kontrollen ägaren till en hund. EditDogProfileScreen är den faktiska Inställningar → Hundprofil-routen.

Exempel-PDF:en visar artikelmetadata (Kunskap, ålder 6–16 veckor, alla raser, ämne), underrubriker, källor och relaterade artiklar. Ålder får inte användas som signal för hemkomstdag. PDF:en och docs/content/artiklar-utkasten förblir opublicerade i detta arbete. Det tillgängliga innehållet kan sakna publicerade versioner som skiljer 12 års ålder från 1 års ålder; om så är fallet redovisas synlig artikelvariation som NOT TESTABLE, utan att uppfinna eller publicera innehåll.

## Gemensamma produkt- och databeslut

- Aktivt hund-ID ligger i den inloggade AppFlow-ägda state:n. Vid ny session väljs första hunden i stabil ordning dogs.created_at ASC, id ASC. Listning och tillägg uppdaterar samma root-lista. Validera aktivt ID mot RLS-skyddad ägarlista.
- En hund har fortsatt en ägare. Behåll dog_id som membership-primary-key, role=owner, private.owns_dog, serverstyrd medlemskapsinsättning, membership-read policy, inga klientgrants, auth.users-radlås i create_dog och befintlig kontoradering för samtliga hundar. Lägg till icke-unikt index på dog_memberships(user_id, created_at, dog_id).
- Gör hundskapandet idempotent: privat request→dog-kvitto nycklat av user_id + request_id; request_id skickas endast till Tasslas egen RPC/databas, aldrig till analytics eller annan mottagare. Ett SecureStore-lagrad request_id per konto återanvänds efter okänt resultat och överlever avbruten vy, utloggning och återinloggning för samma konto. Nyckeln är namnområdad med auth user ID och innehåller inga profilfält. En privat helper använder request receipt och auth-radlås. Ny public create_dog_idempotent kräver request_id; samma konto/request ger samma dog_id. Migrationen droppar uttryckligen befintlig fyraarguments public.create_dog(text,text,date,text) och skapar om exakt den signaturen som kompatibilitetsväg för första hunden med ett fast legacy request-id; den använder samma helper, ger samma kvitto vid retry och tillåter inte en andra hund. Ingen femte parameter med default, tvetydig overload, stale overload eller direkt helperåtkomst lämnas kvar. Vid svar läser klienten tillbaka exakt returnerat ID och jämför profilfält. Unknown behåller nyckeln. Efter bekräftat readback rensas nyckeln; om kvittot visar en annan profil visas det existerande resultatet och användaren måste uttryckligen starta en ny hundprofil innan nytt request-id kan användas. Direkt klientskrivning till membership eller request-tabell förbjuds.
- Hundväljaren visar hundens namn, beräknade ålder och aktiv markering i varje rad, även om samma generiska illustration används. Porträttet får tillgänglig knappetikett med valt hundnamn. Lägg till hund är en separat tydlig rad.
- Innehållsselectorn får endast vald hunds ageWeeks och breed_id. Behåll strikt åldersurval och befintlig exakt rasfiltrering. Hund-ID ingår i workspace-/innehållsnycklar och workspace reset; gammalt content döljs under laddning. Behåll källor, review/publiceringsspärr, checklistor och övriga hunddata per dog_id.
- Vid bekräftad kontoradering rensas request-id lokalt tillsammans med övrig ägarspecifik SecureStore-data; okänd radering lämnar det kvar. Kontoraderingens befintliga cleanup-felrapportering används om lokal rensning misslyckas.
- Ingen hemkomstdag, rasgruppsindelning, nytt persondataändamål, ny extern överföring eller rasartikel skapas.

## UX-kontrakt

| Referens | Nödvändig skillnad | Återanvändning | Acceptans |
|---|---|---|---|
| Rev02 Hem, porträtt intill hundidentiteten | Porträtt öppnar hundväljare; namn/ålder gör generiska porträtt särskiljbara | Befintligt porträtt, BottomSheet, ListRow/DogCard, tokens | Välj hund eller Lägg till hund utan extra huvudknapp |
| Rev02 Inställningar → Hundprofil | Samma ägarlista och aktiv markering; add-entry | EditDogProfileScreen, Button/ListRow | Byt hund och gå till Hem med vald hund, eller starta add-flöde utan oklart läge |
| Hem/Kunskap | Aktiv hundens ålder och ras styr publicerat urval | Befintlig HomeContent/KnowledgeScreen/selectContent | Korrekt urval per vald hund; om publicerat innehåll saknas visas befintlig tomvy |

Tillstånd: initial loading, tom lista/onboarding, en hund, flera hundar, picker öppen, form, saving, confirmed, unknown/pending, definite error, retry, och profilbyte medan data hämtas. Alla tryckytor och val har VoiceOver/TalkBack-labels. Samma illustration benämns inte användarens foto.

## Sekventiella vertikala slices

### Slice A — MULTI-DOG-HOME-01 (först)

Mål: användbar full resa från Hemmets porträtt: lista ägda hundar → byt hund → se rätt hundarbetsyta/innehåll, eller lägg till hund säkert.

Filer:
- supabase/migrations/202610180001_multi_dog_profiles.sql
- src/data/app-data.ts
- src/features/onboarding/dog-creation-storage.ts (ny)
- src/features/onboarding/ProfileScreen.tsx
- src/features/account/account-delete.ts
- src/features/home/AppFlow.tsx
- src/features/home/HomeScreen.tsx
- src/features/home/ProductWorkspace.tsx
- src/features/home/DogProfileSwitcherSheet.tsx (ny)
- src/data/README.md
- src/features/onboarding/README.md
- src/features/home/README.md
- docs/design/evidence/multi-dog-2026-10-18/
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md

Acceptans:
1. Ett konto kan äga 0..N hundar; fetchOwnedDogs returnerar endast RLS-skyddade profiler i stabil ordning.
2. Migrationen behåller ett owner per dog, grants/RLS, auth-radlås och account deletion; nytt icke-unikt index och request-kvitto; ingen direkt klientmutation.
3. Hemmets porträtt öppnar en tillgänglig picker med namn, ålder, aktiv markering och Lägg till hund.
4. Byte skickar bekräftat hundobjekt till AppFlow och monterar en ny hundnycklad workspace. Gamla hunddata visas inte under ny laddning och gamla svar ignoreras.
5. Add dog använder idempotent request-id från SecureStore, återläser exakt returnerat hund-ID, uppdaterar AppFlow-ägarlistan och aktiverar hunden först efter matchande bekräftelse. Unknown retry återanvänder samma idempotency key.
6. Bara aktiva hundens ålder/ras används för Home/Knowledge/Training. 12- och 1-årsprofiler får olika resultat när publicerade åldersintervall skiljer; annars korrekt tom/relevant vy och synlig skillnad NOT TESTABLE.
7. Fel-, unknown-, loading- och empty-state är ärliga och återhämtbara. Ingen blind ny operation på unknown.
8. Länkar, källor och status på publicerat/review-innehåll ändras inte.
9. Avbryt från Hemmets add-form återgår till Hem med hundväljaren öppen och tidigare aktiv hund vald.

Icke-testkontroller: typecheck, lint, git diff --check och kövalidering. Review av SQL/RLS är statisk; riktig databas-RLS och screenshot/native är separat evidens.

### Slice B — MULTI-DOG-PROFILE-01 (efter Slice A checkpoint)

Mål: samma hundbyte och säkra tillägg ska gå att göra via Inställningar → Hundprofil.

Beroende: MULTI-DOG-HOME-01 klar och checkpointad; återanvänd samma AppFlow state och idempotent add-flow.

Filer:
- src/features/home/ProductWorkspace.tsx
- src/features/onboarding/EditDogProfileScreen.tsx
- src/features/more/MoreScreen.tsx
- src/features/onboarding/README.md
- src/features/home/README.md
- docs/design/evidence/multi-dog-2026-10-18/
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md

Acceptans:
1. Hundprofil visar samtliga hundar, namn, beräknad ålder och aktiv markering.
2. Välj annan hund byter rootens aktiva ID och öppnar Hem med den hunden aktiv; det är den synliga konsekvensen av profilbytet.
3. Lägg till hund återanvänder samma säkerhet, idempotency key och bekräftade readback som Hemmets flöde; ny profil uppdaterar root-listan.
4. Unknown state kan återupptas utan dubbelcreate; användaren ser nästa tydliga handling.
5. Tillgänglighetsnamn, touchytor, loading/fel och visuell komposition följer design-reglernas §14.
6. Avbryt från add-formen återgår till Hundprofil-listan med tidigare aktiv hund markerad.

Icke-testkontroller: typecheck, lint, git diff --check och kövalidering. Screenshot/native/RLS-bevis rapporteras skilt och NOT TESTABLE om saknas.

## Risk och bevis

Riskklass H: membership-schema, auth-scope, RPC, SecureStore och barnprofiler. Security granskar implementation efter statiska kontroller. Independent QA/Reviewer krävs efter varje slice. Jag kör inga testsviter i denna uppgift; högre prioriterade instruktioner förbjuder att lägga till eller köra tester om användaren inte bett om test/verifiering. Därför markeras faktisk funktionell testning, publicerad innehållsskillnad utan kvalificerade artiklar, Supabase-runtime/RLS och native/screenshot NOT TESTABLE tills separat bevis finns.

Data inventory: återanvänder samma hundnamn, ras, födelsedatum och kontoägare som befintlig profilfunktion. Tillkommer endast operationellt request_id för säker retry och relation till dog_id; request_id skickas till Tasslas egen RPC och sparas lokalt i SecureStore under en auth-user-namnområdad nyckel samt privat i databasen. Ingen profilinformation ligger i SecureStore-nyckeln och request_id skickas inte till analytics eller externa mottagare. FK-kaskad raderar databasraderna; efter bekräftad kontoradering försöker befintlig lokal cleanup också radera den ägarspecifika SecureStore-nyckeln. Vid unknown behålls nyckeln för säker återhämtning. Ingen ny ägarinformation samlas in eller delas.

Visuell evidens enligt design-rules §14 krävs innan respektive UI-slice kan markeras done: public/review-state, 375×844, 430×844, 375×667 och 140 % text. Spara skärmbilder och kort rapport under `docs/design/evidence/multi-dog-2026-10-18/`. Om native-/skärmbildsunderlag inte går att få i denna miljö rapporteras det som NOT TESTABLE och slice lämnas i review i väntan på separat evidens.

Ändrade väsentliga beslut kräver ny planreview. Dokumentera faktiskt resultat i docs/tasks/dev/rapport.md och lägg till MASTER-LOG först efter respektive slice review.

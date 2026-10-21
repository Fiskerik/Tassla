# VISION-REV02-DOG-PROFILE — implementationsplan v8

> **Ägarbeslut 2026-10-21 gäller alla MVP-checkpoints:** kvarvarande ras-/profilverifiering gäller funktion och relevanta standardvyer. 140 %/stor text, Dynamic Type, VoiceOver/TalkBack och generell mål-/kontrastaudit görs efter att MVP:n är släppt och godkänd; tidigare kriterier i denna plan är inte MVP-grindar. Behåll befintliga labels/semantik. Se [AGENTS.md](../../../AGENTS.md) och [arbetsflödet](../../dev/workflow.md).

Datum: 2026-10-13 · Status: plan v8 godkänd av Architect (APPROVE) och Critic (PROCEED); Slice A har QA-PASS, Reviewer PASS och Security APPROVE för statisk/local handoff, men är blockerad för verklig Supabase/RLS och native-flöden som är NOT TESTABLE. Slice B inväntar verifierad Wikidata-export efter HTTP 403 från WDQS · Segmentmandat: Erik har uttryckligen beställt hela profilarbetet i chatten.

## Scope och beslut

Erik beställer en komplett sökbar raskatalog, Mix-val med två kända delraser, Hem-identitet `Namn | Ras` med vald ålder på raden under, och profilinställning för åldersvisning i veckor/månader/år. Den äldre Architecture-formuleringen om en liten raslista och ingen komplett rasprodukt är ersatt av detta uttryckliga beslut.

**Källvalet är klart.** Erik valde Wikidatas strukturerade data under CC0 den 2026-10-13. Urvalet är poster som är instanser av `dog breed (Q39367)` eller dess underklasser och har en svensk eller engelsk etikett. QID är stabilt ID; svensk etikett används när den finns, annars engelsk. Urval och licenskälla samt den exakta SPARQL-frågan finns i `docs/plans/VISION-REV02-DOG-PROFILE-UX-SPEC-v2.md` v8. Detta beskriver Wikidatas täckning och garanterar inte att varje ras globalt finns där.

Exakt snapshot, antal och etiketter är ännu inte tillgängliga. Efter källvalet testades den exakta frågan mot WDQS igen med direkt GET och POST via nätverksåtkomst; båda anropen gav HTTP 403. Webbläsarverktyget nekar också API-endpoints. En första POST-begäran med kontaktuppgift i User-Agent avvisades av automatisk granskning; samma försök utan kontaktuppgift gav fortfarande 403. Ingen raslista eller katalogkod har skrivits. WDQS-åtkomst blockerar bara Slice B. Ett faktiskt daterat snapshot med QID:n, etiketter, antal, licensmetadata och verifierad kompatibilitet med `breeds.name` 1–100 tecken krävs innan Slice B startar.

Se `docs/plans/VISION-REV02-DOG-PROFILE-UX-SPEC-v2.md` för UI/data/age-format.

## Data- och skrivkontrakt

`OwnedDog` och profiländringar utökas med `mix_breed_one_id`, `mix_breed_two_id` och `age_display_unit`. Befintliga `mixed`/`unknown`-ID:n behålls; mixed label blir `Mix` först i UI. Katalognamn och antal följer vald källa, verifierat snapshot och dokumenterad reuse-license. Sökning accepterar endast poster från databasen.

### Breed/Mix-migration

- Fil: `supabase/migrations/202610130003_dog_breed_mix_profile.sql`; det unika versionsprefixet följer `202610130001_daily_activities.sql`.
- Lägg två nullable `text`-fält till `dogs`, FK mot `breeds(id)` med delete-restrict. CHECK: båda fälten null eller båda satta; endast `breed_id='mixed'` får ha delraser; komponenter måste vara olika och får varken vara `mixed` eller `unknown`.
- Uppdatera befintligt `mixed`-visningsnamn till `Mix`, men radera/ändra inte stabila ras-ID:n. Nya katalogposter har stabila ID:n. Inga fri-textposter eller katalognamn i hundtabellen.
- Behåll ägar-RLS. Lägg bara till nödvändiga kolumnbegränsade `UPDATE`-rättigheter för två Mix-kolumner. Ändra inte befintlig `create_dog(text,text,date,text)` signatur, default, grant eller beteende.
- Skapa separat, icke överlagrad `create_mixed_dog(dog_name text, dog_breed_id text, dog_birth_date date, mix_breed_one_id text, mix_breed_two_id text, kennel_code text default null) returns uuid`. Den kräver `dog_breed_id='mixed'`, härleder konto enbart från `auth.uid()`, låser auth-raden, bevarar en-hund-per-konto- och aktiv kennelvalidering, skapar hund/medlemskap/attribution atomärt och omfattas av samma CHECK/FK. `SECURITY DEFINER SET search_path=''`; återkalla EXECUTE från `PUBLIC, anon`, ge endast till `authenticated`. Ingen användar-ID-parameter.
- Onboarding använder legacy-RPC för vanliga raser och nya RPC för Mix. Efter RPC ska den RLS-skyddade profilen och eventuell kennel-attribution läsas tillbaka och jämföras med alla begärda fält innan framgång visas.
- Profilredigering måste inkludera nullable delraser i uppdatering, villkorad preimage, readback och conflict/retry intent. Null kontrolleras null-säkert (`IS NULL`/PostgREST `.is`, inte `.eq(null)`). Fallback-readback matchar hela hundprofilen.
- Katalogens snapshot/import kräver verifierad vald källa. Inlagda rader och källhänvisning, snapshotdatum/count och licens sparas i migrationens metadata. Om källan kräver en separat datafil ska den läggas till i queue/write_paths och planen granskas igen innan kod.

### Age-migration

- Fil: `supabase/migrations/202610130002_dog_age_display_unit.sql`.
- `dogs.age_display_unit text NOT NULL DEFAULT 'weeks' CHECK (age_display_unit IN ('weeks','months','years'))`.
- Behåll ägar-RLS; bevilja `authenticated` uppdatering enbart av den nya kolumnen utöver befintliga profilfält.
- Formatteraren använder ISO-datum/tz-fria kalenderdatum och `localDate()` som `today`. Månadens anniversaries beräknas direkt från födelsedatumet genom att klämma dagen till månadsslut, aldrig iterativt. År använder klämd årsdag. Veckor = fulla sjudagarsperioder; månader = fulla kalender-månader + hela veckor sedan senaste månadsdag; år = fulla år + återstående fulla månader. Nollkomponenter utelämnas; 0 veckor visas som `0 veckor`.
- Ändrad formatteringsenhet används på Hem, profil och Tassla-pass och ändrar aldrig `ageInWeeks`/innehållsurval.

## Slice A — DOG-PROFILE-AGE-DISPLAY

**Mål:** beständig per-hund visningsenhet och konsekvent svensk ålder på aktiva ytor.

**Skrivfiler:**

- `supabase/migrations/202610130002_dog_age_display_unit.sql`
- `src/data/app-data.ts`, `src/features/onboarding/dog.ts`
- `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/onboarding/DogProfileScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/PreviewHomeScreen.tsx`, `src/features/home/PreviewProfileScreen.tsx`
- `src/features/home/HomeCarousel.tsx`
- `src/features/passport/PassportScreen.tsx`, `src/features/passport/passport-model.ts`, `tools/visual-check/app.tsx`
- `src/features/onboarding/README.md`, `src/features/home/README.md`, `src/features/passport/README.md`
- `docs/mvp.md`, `docs/design/vision-rev02-objects.md`, `docs/dev/beta-data-lifecycle.md`, `docs/privacy/beta-information.md`
- denna plan/spec, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`
- `docs/design/evidence/vision-rev02/dog-profile/`

**Acceptans:**

1. Preference sparas `weeks/months/years`, default weeks, redigeras i hundprofil, och condition/readback omfattar alla befintliga profilfält och `age_display_unit`; Slice B lägger till Mix-ID:n i samma fullständiga preimage/readback.
2. Kalenderexempel, klämning, singular/plural och bortfall av nollkomponenter följer UX-specen.
3. Home visar `Namn | Ras` från hundprofilens befintliga ras-ID och katalognamn, med åldern under; Home, profile, Tassla-pass preview och exporterad PDF använder samma formatterare och sparade preferens. Den immutabla `PassportSnapshot.dog.ageLabel` beräknas en gång från hundens sparade `age_display_unit`, `birth_date` och snapshotens `createdOn`; preview och HTML/PDF återanvänder exakt detta värde. Om profilavsnittet är av valt finns inget `dog`-objekt eller åldersfält i snapshoten. En lång rasetikett radbryts vid naturliga ordgränser och kapas inte.
4. `ageInWeeks` och innehållsurval är oförändrade. Åldersvalet läggs till i ägarinventeringen och följer befintlig radering.

## Slice B — DOG-PROFILE-BREED-MIX

> **Aktuell statusnotis, 2026-10-20:** Denna v8-slice är historisk och slog tidigare ihop sökbar väljare, katalogimport, Mix och Home-identitet. Godkänd MVP rev02 skiljer nu ut den gemensamma sökningen mot redan befintlig katalog i [DOG-PROFILE-SEARCH-PILOT-01](DOG-PROFILE-SEARCH-PILOT-01.md) och dess UX-spec. Pilotens sökning får starta utan Wikidata-snapshot. Blockeringen nedan gäller fortsatt full katalogimport, Mix-delraser/schema och de tillhörande Home-/profiländringarna; den ska inte användas för att stoppa pilotens sökbara väljare. V8-historiken och dess tidigare reviewverdicts skrivs inte om.

**Mål:** godkänd licensierad katalog, återanvändbar sökbar picker, robust Mix-profil och Home-identitet med ras.

**Skrivfiler:**

- `supabase/migrations/202610130003_dog_breed_mix_profile.sql`
- `src/data/app-data.ts`
- `src/features/onboarding/SearchableBreedPicker.tsx` (ny)
- `src/features/onboarding/ProfileScreen.tsx`
- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/onboarding/DogProfileScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/HomeScreen.tsx`
- `tools/visual-check/app.tsx`
- `src/features/onboarding/README.md`, `src/features/home/README.md`, `src/data/README.md`
- `docs/Architecture.md`, `docs/mvp.md`, `docs/design/vision-rev02-objects.md`
- `docs/dev/beta-data-lifecycle.md`, `docs/privacy/beta-information.md`
- denna plan/spec, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`
- `docs/design/evidence/vision-rev02/dog-profile/`

**Acceptans:**

1. Katalogkälla har dokumenterad återanvändningsrätt, exakt snapshot, stabila ID:n och verifierat antal. `Mix` visas först; alla övriga raser, inklusive `Okänd ras`, sorteras alfabetiskt med svensk lokalisering. Inga användarinmatade rasnamn sparas.
2. Samma tillgängliga sökbara `Modal + FlatList` används i onboarding/profile edit; ingen virtualiserad lista är nästlad i `BottomSheet`-ScrollView. Loading/error/empty/retry och två olika Mix-val stöds. Tom sökning i huvudväljaren ger direktvalet `Okänd ras`; alternativet erbjuds inte i Mix-delrasväljare.
3. Mix sparas utan delraser eller med två olika kända raser. När checkboxen är markerad krävs två delraser; varje väljare visar sin saknade status och Spara är inaktiverad tills två olika tillåtna raser valts. Constraints/RPC/grants/RLS skyddar. Legacy `create_dog`-signatur för vanliga raser är oförändrad.
4. Profile write/readback/preimage/unknown retry omfattar id, namn, breed, birth date, age display unit och båda nullable Mix IDs. Home visar `Hund | Ras`, med `Mix` som primärlabel; den fullständiga identitetsraden radbryts och kapas inte; delraser syns i profilen och påverkar inte content targeting.
5. Privacy-/data inventory beskriver katalogen som gemensam referensdata och delras-ID:n som hundprofiluppgifter som följer befintlig radering; beta-informationens opublicerade draft är uppdaterat.

## Granskning och kontroller

Plan v2 granskades efter visuella matrisändringar: Architect APPROVE, Critic PROCEED och Security plan-only APPROVE. För plan v3 gav Architect villkorligt APPROVE och Critic PROCEED WITH CHANGES. Plan v4 hanterade samtliga tre Critic-fynd: åldersdelen är frikopplad från snapshoten, lång rasetikett radbryts på Hem utan kapning och huvudväljaren erbjuder `Okänd ras` direkt i tomläget. Architect **APPROVE** och Critic **PROCEED** för exakt v4. Plan v5 lade till `passport-model.ts`; Architect gav **APPROVE**, Critic **PROCEED WITH CHANGES** och krävde ett fryst `ageLabel` i snapshoten, samma captured date som `createdOn`, användning av samma värde i preview/HTML-PDF och en kontroll för alla tre enheter. Plan v6 preciserade snapshotkontraktet; Architect gav **APPROVE**, Critic **PROCEED WITH CHANGES** eftersom den manuella kontrollen av `createPassportSnapshot` och `renderPassportHtml` för alla enheter saknades i QA-checklistan. Plan v7 lade uttryckligen till kontrollen; Critic gav **PROCEED WITH CHANGES** och Architect **CHANGES** eftersom tre gate-/spec-referenser fortfarande pekade på v6. Plan v8 rättar länken och gate-referenserna; Architect gav **APPROVE** och Critic **PROCEED** för exakt v8. Samtliga Slice A-sökvägar är nu godkända för implementation. Slice B BREED-MIX kräver daterad snapshot, exakt antal, unika QID:n, svensk/engelsk etikettmappning och kontroll mot befintlig `breeds.name`-gräns 1–100 tecken. Plan approval är inte snapshot-, SQL/RPC- eller runtime-godkännande. Efter respektive slice krävs oberoende QA, Reviewer och Security för databas-/profilskrivningar. Ingen feature levereras som SQL/RLS runtime-verifierad utan riktig devdatabas; avsaknad anges NOT TESTABLE. Inga testsviter eller tester läggs till/körs utan särskild begäran. Statisk kodkontroll och manuell render/§14 kan redovisas separat från integrationstest.

Kontroller efter kodändring, utan testsvit:

- `pnpm typecheck`
- `pnpm typecheck:edge-account`
- `pnpm exec eslint src/data/app-data.ts src/features/onboarding/SearchableBreedPicker.tsx src/features/onboarding/ProfileScreen.tsx src/features/onboarding/EditDogProfileScreen.tsx src/features/onboarding/DogProfileScreen.tsx src/features/home/ProductWorkspace.tsx src/features/home/HomeScreen.tsx src/features/home/PreviewHomeScreen.tsx src/features/home/PreviewProfileScreen.tsx src/features/passport/PassportScreen.tsx src/features/passport/passport-model.ts tools/visual-check/app.tsx`
- `git diff --check`
- `python tools/dev_flow.py validate`

Manuell render utan Playwright-testsvit:

```sh
TASSLA_UI_REVIEW=false TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-dog-profile/public node tools/visual-check/build.cjs
TASSLA_UI_REVIEW=true TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_OUTPUT=/tmp/tassla-dog-profile/review node tools/visual-check/build.cjs
python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-dog-profile/public
python -m http.server 4174 --bind 127.0.0.1 --directory /tmp/tassla-dog-profile/review
```

Slice A (AGE-DISPLAY) routes on both public/review ports: `/?screen=profile-edit&profileScenario=ready`, `/?screen=profile&ageUnit=weeks|months|years`, `/?screen=home&ageUnit=weeks|months|years`, and `/?screen=passport&ageUnit=weeks|months|years`. Verify one persisted preference across profile, Home, and Passport, plus Home's full `Namn | Ras` identity with an unusually long breed label wrapped rather than clipped. Manually inspect `createPassportSnapshot` and `renderPassportHtml` for weeks, months, and years: each `PassportSnapshot.dog.ageLabel` must equal the rendered HTML age and derive from that snapshot’s `createdOn`; with profile sharing off, both dog and age are omitted. This is a manual non-test-suite check; native PDF rendering remains NOT TESTABLE. Capture profile/Home/Passport routes at 375×844, 430×844, and 375×667.

Slice B (BREED-MIX) routes: `/?screen=profile-create&profileScenario=ready`, `/?screen=profile-edit&profileScenario=ready|loading|error`, `/?screen=profile-edit&state=conflict`, `/?screen=profile-create&profileScenario=breed-loading|breed-error`, `/?screen=profile-edit&profileScenario=breed-loading|breed-error`, and `/?screen=home&homeScenario=ready`. Here `profileScenario=loading|error` is dog-profile load/save status; `profileScenario=breed-loading|breed-error` is the separate breed-catalog request status. On create/edit, capture normal and long breed labels, matching and no-match search, direct `Okänd ras` selection from the main-picker empty state, Mix checkbox off, checkbox on with zero components, with only the first component, and with two different breeds. Verify each missing selector is identified, Save stays disabled until two distinct breeds are selected, the second picker excludes the first selection, and `Okänd ras` cannot be used as a Mix component. Review Home with a long breed label and the final single-breed/Mix identity. Capture representative states at 375×844, 430×844, and 375×667.

For both slices, capture relevant functional states at standard viewports and preserve public/review fixture labeling. Record route/state, viewport, and fixture mode in the evidence README; both modes are synthetic, including public mode. Complete the relevant visual parts of design-rules §14 for layout, color distribution, typography, component shape, imagery and density. 140% text, native Dynamic Type and VoiceOver are deferred until after MVP release and approval and are not MVP gates. SQL/RLS runtime remains NOT TESTABLE without a development database.

## Ordning

1. `DOG-PROFILE-AGE-DISPLAY` (Slice A); första Reviewer-granskningen hittade två fel i statusjämförelsen och skottårsberäkningen. Båda är rättade; färsk statisk QA är PASS, Reviewer gav PASS och Security gav APPROVE. Åtkomst-/kopieinventeringen inkluderar nu uttryckligen `dogs.age_display_unit`. Queue är blockerad för verklig migration/RLS, sparad preferens och native PDF/tillgänglighet som är NOT TESTABLE; ändring av `passport-model.ts` genomfördes efter v8 Architect/Critic-godkännande.
2. `DOG-PROFILE-BREED-MIX` (återstående Slice B: verifierad katalogimport och Mix); katalog-/Mix-implementation kräver fortsatt Slice A:s checkpoint och ett daterat verifierat Wikidata-snapshot. Den gemensamma sökningen mot nuvarande katalog följer separat `DOG-PROFILE-SEARCH-PILOT-01` och väntar inte på snapshotet.

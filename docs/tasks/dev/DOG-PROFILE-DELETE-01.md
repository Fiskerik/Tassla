# DOG-PROFILE-DELETE-01 — ta bort en hund men behåll kontot

**Status:** done · **Planversion:** v5 · **Risk:** H
**Bas:** `6e6901f` (`feat: improve article reading experience`) på `codex/ui-visual-review-loop`
**Skrivägare:** huvudsessionen

## Mål och mandat

Lägg till ägarverifierad radering av en enskild hundprofil från Hundprofil. Hundens profil och hundkopplade uppgifter raderas; Tassla-kontot, användarsessionen, övriga hundar och kontonivåns uppgifter finns kvar. Ska fungera även när den borttagna hunden är kontots sista.

Mandatet är Eriks uttryckliga önskemål 2026-10-25: ”Det ska vara möjligt att ta bort HUND från en profil utan att behöva ta bort profilen isig.” Erik förtydligade att detta stöd saknas i nuläget: endast kontoradering finns och den visar ett fel. Ingen faktisk hund- eller kontoradering får utföras i denna uppgift.

Read-only inventering: `EditDogProfileScreen` har inte en hundraderingsåtgärd; `src/data/app-data.ts` saknar en hundprofils-delete-operation. `dogs` har select/update-policy, och migrationen ger inte `authenticated` direkt DELETE på profilen. Architect inventerade direkta kaskader på memberships, attribution, `dog_events`, reminders, training progress, health plans, checklist progress/custom/preferences, daily routines/days/training selections samt training journeys/sessions/milestones/operation receipts; `dog_daily_routine_day_skips` faller bort via rutinens composite FK. `private.dog_creation_requests` måste i stället bli tombstone. `product_events` och beta consent är kontonivå och ska bestå. `AppFlow` visar redan första-profilens `ProfileScreen` när ett inloggat konto har noll hundar.

`MULTI-DOG-PROFILE-01` förblir separat blocked endast för native/device, runtime och §14-evidens. Dess profilväljare, AppFlow, ProductWorkspace och Hundprofil-route finns redan i current source baseline och kan användas för den här lokala uppgiften. Individuell hundradering kräver inte att den separata evidensuppgiften stängs; inga native/live PASS påstås.

## Avgränsning

**Ingår:** tydlig destruktiv åtgärd i Hundprofil; bekräftelse som namnger hunden och konsekvenserna; atomisk serverradering av exakt en hund som verifieras via `auth.uid()` och befintlig medlemskapsägare; bekräftad lokal root-listuppdatering; fungerande fortsatt session med andra hundar eller utan hund; status-/återhämtningsväg vid okänt svar; integritetsinformation och syntetiska kontroller.

**Ingår inte:** kontoradering, kontoraderings-Edge-Function-deploy, ändring av auth-/RLS-livscykel, flytt/export av hunddata, annan profilredigering, ny datainsamling, ändring av hundinnehåll/rekommendationer, live Supabase/TestFlight, eller radering av någon verklig användares data.

Radering av exakt samma hund-ID kan vara idempotent bara om RPC:n först verifierar den aktuella ägarens medlemskap och en upprepning inte kan påverka en annan profil. Vid tvetydigt nätverksresultat gör klienten ingen automatisk andra delete-begäran. Den ska läsa tillbaka den ägarfiltrerade hundlistan och rapportera enbart serverbekräftelse eller verifierad frånvaro. Om hunden fortfarande syns stannar användaren på samma profil med tydlig status och en uttrycklig säker kontroll-/försökväg. Architect och Security ska godkänna denna semantik före implementation.

## Skapabegärandens tombstone

Arkitektgranskningen fann att `private.dog_creation_requests.dog_id` har `ON DELETE CASCADE`. Om kvittot tas bort med hunden kan en gammal, fördröjd `create_dog_with_homecoming`-begäran återanvända samma request-ID och skapa den borttagna hunden igen. Migrationen ska därför ändra denna FK till `ON DELETE SET NULL` och tillåta `dog_id = NULL`. En sådan befintlig receipt med NULL `dog_id` är en tombstone: `private.create_dog_with_request` måste särskilja den från ett nytt request-ID och avvisa den med ett permanent konfliktresultat; den får aldrig returnera NULL eller skapa en hund.

Tombstonen behåller endast befintliga `user_id`, `request_id` och receipt-datum; hund-ID, namn, ras, födelsedatum och övriga profiluppgifter följer med hundraderingen. `user_id` ligger kvar som `ON DELETE CASCADE`, så full kontoradering tar även bort dessa receipts. Ny profil efter hundradering använder appens befintliga färska UUID. Den äldre `public.create_dog`-vägen har ett fast request-ID och ska fail-closed efter att det request-kvittot tombstonats; dokumentera och testa den kompatibilitetsgränsen, tillåt aldrig resurrection för att stödja en stale klient.

En tombstone kan också upptäckas av en profilskapare som återupptar ett gammalt SecureStore-request-ID efter att hunden raderats på en annan enhet. `createDog` ska exponera serverns specifika retired-request-resultat som en typad utgång, inte som generiskt nätverksfel. `ProfileScreen` ska då förklara att den gamla begäran tillhör en borttagen hund och erbjuda en uttrycklig återhämtning som rensar exakt det bekräftade owner/request-ID:t med `clearDogCreationRequest(ownerId, expectedRequestId)`. Bevara formulärutkastet; nästa separata tryck på Skapa får använda ett nytt UUID. Rensa aldrig automatiskt, rotera inte request-ID vid ett tvetydigt svar och erbjud inte denna åtgärd för vanliga timeout-/nätverksfel.

Delete RPC:n tar först `auth.users FOR NO KEY UPDATE`; därefter verifierar den medlemskap, låser exakt hundrad, återkontrollerar medlemskapet efter eventuell väntan och raderar i samma transaktion. Det är kompatibelt med de `KEY SHARE`-lås som främmande nycklar i hundskrivningar behöver, så en hundskrivning som redan håller hundraden inte hamnar i deadlock mot delete. Läget konfliktar samtidigt med hundskapandets befintliga `auth.users FOR UPDATE` och serialiserar därmed gammal create-retry mot delete. En FK-writer som håller hundraden kan slutföra sin `KEY SHARE`, lämna hundlåset, och därefter fortsätter delete atomiskt.

## Arkitekturskydd

- Ta aldrig emot `owner_id` eller kontoväljare från klienten; härled användaren endast från `auth.uid()`.
- Använd ett owner-scopat, atomiskt RPC med smal `EXECUTE`-grant till `authenticated`, `SECURITY DEFINER`, tom `search_path`, fullkvalificerade objektnamn och explicit revoke från `public`/`anon`.
- Verifiera ägarmedlemskap server-side innan radering. Svara likadant för okänd och annan ägares hund så ID-innehav inte läcker.
- Följ låsordning som serialiserar med befintligt `create_dog` men tillåter barnskrivningars FK `KEY SHARE`: `auth.users FOR NO KEY UPDATE` → medlemskapskontroll → exakt `dogs FOR UPDATE` → medlemskapskontroll igen → delete. `create_dog` behåller `auth.users FOR UPDATE`, som konfliktar med NO KEY UPDATE. Gissa inte att befintliga FK-kaskader räcker utan full migrationinventering och SQL-probe.
- Bevara request-kvittot som tombstone: `dog_id` blir NULL med `ON DELETE SET NULL`; uppdatera befintlig interna create-helper i den nya migrationen så gamla tombstonade request-ID:n aldrig skapar hund på nytt. Ingen hundprofilkolumn stannar i tombstonen.
- Ingen direkt tabell-DELETE-grant, client-side child-delete-sekvens eller auth-admin-delete.
- Hundradering tar bort hundkopplad profil, loggar, health plans, rutiner, checklistor, attribution, training progress/journeys/sessions/milestones/operation receipts endast enligt inventerade cascades. `dog_daily_routine_day_skips` följer sin rutin-FK. `private.dog_creation_requests` bevarar endast NULL-dog-id tombstone; den innehåller inget hund-ID eller profilfält. Bevara `auth.users`, övriga hundar, beta-consent och kontoskopade `product_events`.
- Delete RPC-låsning är: konto-rad med `FOR NO KEY UPDATE`, ägarmedlemskap, exakt hundrad, medlemskapskontroll igen och delete — allt i en transaktion. Hundskapandet låser samma kontorad `FOR UPDATE`; FK `KEY SHARE` från hundbarn får samexistera med delete-låset. Direct `authenticated` DELETE-grants för hundar/medlemskap förblir avstängda.
- Klienten tar inte bort hunden ur sin lista förrän RPC ger bekräftat resultat eller en efterföljande ägarscopad läsning verifierar att den inte längre finns. Konto/session-generation spärrar svar från en annan ägare; däremot får en bekräftad delete/readback överleva att den hundnycklade `ProductWorkspace` avmonteras vid hundbyte. Svaret bär med sig fångad hundvalsgeneration till AppFlow: om valet hunnit ändras läser rooten om den aktuella ägarens hundlista och behåller nu aktiv hund om den fortfarande finns. Annars väljs en kvarvarande hund eller `null`. Dubbeltryck spärras i arbetsytan; lokala skärmtillstånd fortsätter använda komponentens hundlivstid.
- Bekräftelsen säger uttryckligen att hundens sparade uppgifter tas bort, att det inte går att ångra, att Tassla-kontot är kvar och att andra hundar inte påverkas. Visa åtgärden endast när relevanta profil-/attributionsskrivningar inte väntar på statuskontroll.
- När sista hunden försvinner förblir auth-sessionen aktiv och `AppFlow` öppnar första-profilens skapaflöde. Lägg till hund ska fortsatt gå via befintligt idempotent create/readback.

## Exakta skrivvägar

- `docs/tasks/dev/DOG-PROFILE-DELETE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/privacy/beta-information.md`
- `supabase/migrations/202610250002_dog_profile_deletion.sql`
- `supabase/tests/dog-profile-deletion.sql`
- `src/data/app-data.ts`
- `src/features/onboarding/ProfileScreen.tsx`
- `src/features/onboarding/dog-creation-storage.ts`
- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/AppFlow.tsx`
- `src/features/onboarding/README.md`
- `src/features/home/README.md`
- `tests/app-data.test.mjs`
- `tests/profile-screen-policy.test.mjs`
- `tests/dog-profile-delete.test.mjs`
- `tests/README.md`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`

Ändra inte konto-raderingskällor, befintliga migrationer, create-dog-kontrakt eller bild-/artikelregler. Ny SQL-probe använder endast syntetiska tvåägar-/flerhundsfixturer och rollback.

## Acceptanskriterier

| Kriterium | Kontroll | Status |
|---|---|---|
| En tydlig hundradering finns separat från kontoradering; bekräftelsen anger rätt hund och följder | UI Critic PASS; syntetisk RN Web 9/9 vid 375/430, 375×667 och 140 % CSS-textproxy | PASS |
| RPC kan endast radera den inloggades exakta ägda hund; unknown/foreign, direct DELETE, ownership selector, role grants | Security statisk review PASS; rollback-probe asserts auth/anon/service_role ACL och indistinguishable results | PASS statiskt; SQL runtime NOT TESTABLE |
| Hundkopplade poster tas bort; andra hundar, konto och kontosamtycke/analytics lämnas kvar | Security cascade inventory PASS; tvåägar-probe med barnfixturer finns | PASS statiskt; SQL runtime NOT TESTABLE |
| Create replay kan inte återskapa hund; fresh request fungerar; legacy fixed-ID fail-closed; kontoradering tar bort tombstone | Migration, Node recovery tests och probe täcker kontraktet | PASS statiskt/klient; SQL runtime NOT TESTABLE |
| Delete-lås tillåter FK `KEY SHARE` men serialiseras mot create `FOR UPDATE` | Security statisk lock-order PASS; tvåsessionsprov saknas | Lockkontrakt PASS; concurrency runtime NOT TESTABLE |
| Bekräftad tombstone kan rensas exakt, draft bevaras, nästa separata submit får nytt UUID; unknown behåller befintligt ID | `app-data.test.mjs`, `profile-screen-policy.test.mjs`, `dog-profile-delete.test.mjs` | PASS |
| Minimal tombstone innehåller inte hundfält och tas bort vid kontoradering | Beta-information, SQL-migration och Security source-review; probe asserts owner cascade | PASS statiskt; SQL runtime NOT TESTABLE |
| Artikelcopy är generisk utan hundnamn/könade pronomen; urval styr bara rekommendationer | Korrigerad beta-information; article tests från föregående checkpoint | PASS |
| Sista hunden lämnar konto/session kvar och öppnar första-profilflödet | Körda AppFlow-callbacktestet bekräftar tom hundlista, null aktiv hund och initial `ProfileScreen` route; syntetisk 375×667-dialog verifierar copy | PASS lokalt; backend/session runtime NOT TESTABLE |
| Inget optimistiskt lyckande, automatisk retry eller sent svar för fel hund; unknown kan kontrolleras | Data-, scope-, UI-state- och AppFlow-tester samt 375×844/140 % render | PASS lokalt |
| Lokal lista ändras först efter RPC-bekräftelse eller ägarscopad bekräftad frånvaro | `app-data.test.mjs`; ProductWorkspace/AppFlow guards | PASS |
| Kod hålls inom godkända paths och checks passerar | `CI=1 pnpm check` 84/84, render 9/9, queue validation, SQL probe-source tests, py_compile, diff-check; independent QA and frozen Reviewer PASS | PASS |
| Ingen live-operation/deploy/native-/SQL-runtime-verifiering påstås | Lokal synthetic-only implementation; SQL/two-session not run | NOT TESTABLE här |

## Granskning före kod

Risk H eftersom en policy-/kaskad-/livstidsbugg kan radera fel hunddata eller kontonivåns uppgifter. Plan v1 stoppades före kod efter att Architect upptäckte create-replay-risk. V2 fick en ytterligare Architect-anmärkning: en återupptagen skapaskärm kunde bli fast på den tombstonade request-nyckeln. V3 lade därför till typad serverstatus, synlig uttrycklig exact-key recovery och policytest. Architect bekräftade även att Slice B:s blockerande native/device-evidens inte är ett kodberoende för denna uppgift, eftersom profilroute och hundväljare redan finns i källan. V4 tog bort endast den blockerade Slice B-kön som dependency och behöll färdiga foundations `MULTI-DOG-HOME-01` och `ARTICLE-READING-EXPERIENCE-01`. Security hittade i v4 en deadlockrisk: `FOR UPDATE` på auth-user kunde blockera FK `KEY SHARE` medan en writer höll hundraden. V5 använder därför `FOR NO KEY UPDATE` för delete, vilket tillåter FK-låset men fortfarande konfliktar med create-pathens `FOR UPDATE`; den statiska lockkontraktskontrollen hålls skild från tvåsessionsruntime. Inga produktkällor ändras före färska v5-godkännanden från Architect, Security och produkt/UI Critic. Architect ska fastställa lockmatrix, idempotent resultat, tombstone, stale-request recovery och last-dog-route. Security ska fastställa privilege boundary, fullständiga kaskader, indistinguishability, retention och bevarade account-level data; endast tvåsessionsprov kan styrka concurrency runtime. Critic ska granska bekräftelsecopy, last-dog recovery, endast-tombstone-reset och tillgänglighets-/återhämtningsväg.

## Checkpoint

Architect APPROVE, Security PASS och Product/UI Critic PROCEED för v5 är registrerade i köhistoriken; implementationen är klar inom de 21 godkända skrivvägarna. Post-implementation UI Critic PASS på bekräftelse, sista hund, unknown/readback och 140 % text. Frozen-diff Security static PASS, inklusive false-RPC-resultat endast reconciled efter lyckad same-scope owner-lista som saknar målhunden. `CI=1 pnpm check` 84/84; syntetisk verifierare 9/9; queue validation, py_compile och diff-check PASS. Independent QA PASS efter att en switch-during-delete-race fixats: samma konto kan nu lämna bekräftelsen vidare till AppFlow efter dog-keyed workspace unmount, rooten läser då om hundlistan och nyvald hund behålls. Regressionstester täcker delete/status efter avmontering, selection-/account-generation och sista hund → initial profile route. Frozen Reviewer PASS på implementation, dokumentstatus och NOT TESTABLE-gränser; den lokala källkodsk checkpointen är stängd. V1/v2 stale create-replay/recovery-fynd och v4 deadlockrisk är lösta med tombstone/exact-key recovery samt `FOR NO KEY UPDATE` mot create `FOR UPDATE`. Rollback SQL-probe är skrivet men inte kört; tvåsessions concurrency runtime är **NOT TESTABLE** eftersom PostgreSQL/Supabase CLI saknas och Docker-daemonen nekar socketåtkomst. Native VoiceOver/TalkBack, live RLS, migration/deploy och verkliga raderingar verifierades inte. `MULTI-DOG-PROFILE-01` förblir separat blocked för device/runtime/§14. Kontoraderingsfelet förblir separat blocked/unknown; ingen retry, deployment eller kontoradering gjordes.

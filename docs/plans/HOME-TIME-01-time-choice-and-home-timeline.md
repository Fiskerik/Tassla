# HOME-TIME-01 — Välj tid och visa händelser på Hem

> **Ägarbeslut 2026-10-21 gäller alla MVP-checkpoints:** kvarvarande QA fokuserar funktion och relevant standardvy. Stor-text/Dynamic Type, VoiceOver/TalkBack, reducerad-rörelse-, kontrast- och träffyteaudit görs efter att MVP:n är släppt och godkänd. Behåll befintliga labels/semantik och verifiera funktionellt tangentbordsbeteende där det påverkar formulärresan. Se [AGENTS.md](../../AGENTS.md) och [arbetsflödet](../dev/workflow.md).

Status: v7.1 godkänd; lokal implementation finns, QA kvarstår
Datum: 2026-10-10
Mandat: Erik bad om valbar tid när händelser/hälsoposter läggs till och att tiden ska visas på Hem; han bekräftade destinationen som Hemmavyn och omfattningen som tid för händelser och hälsa.

## Användaruppgift

Ägaren ska kunna ange när en loggad händelse eller utförd vaccination/veterinärhändelse inträffade och senare läsa den tiden i Hemmavyn för samma dag.

## Produktregel — v7 efter Eriks korrigering

- Snabb loggning förblir ett tryck: ingen tidsruta eller extra sparsteg. Den får fortsätta spara händelsens aktuella tid via befintligt flöde och undo.
- Utförd vaccination/veterinärhistorik får ett tydligt valfritt tidsfält, märkt exempelvis ”Tid (valfri)”. Tomt fält sparas som NULL och stoppar inte sparning. En redan känd tid visas förifylld vid redigering och bevaras om ägaren lämnar den oförändrad.
- Hem visar logghändelser och utförda vaccinationer/veterinärbesök för vald dag i en gemensam tidsordning. Kända tider visas; äldre hälsoposter utan tid behåller datumet och får ingen påhittad tid.
- Planerade hälsopåminnelser och viktposter ändras inte i denna slice.

Erik förtydligade 2026-10-10 att snabb loggning inte ska kräva tid och att tid är frivillig för vaccination/veterinärhistorik. Detta ersätter den tidigare v6-regeln om obligatorisk tid på logg och hälsa. Viktposter ingår inte.

## Omfattning och datakontrakt

- Vanliga LogScreen-händelser fortsätter använda `occurred_at timestamptz` och befintlig snabbsparning med aktuell tid; ingen tidsruta läggs till i snabbflödet.
- `dog_events` får ett nullable `occurred_time time(0) without time zone`-fält för `vaccination`/`vet_visit`, utan default eller backfill. `occurred_on date` förblir datumkälla. Befintliga datum-only-rader lämnas null; ingen backfill hittar på tid.
- Migrationen lägger till en explicit DB check: `occurred_time` får endast förekomma för vaccination/vet_visit, måste vara före `24:00`, och tidsvärdet har sekundprecision noll. Alla andra eventtyper inklusive weight/logg måste ha NULL. Befintlig shape-check bevaras/ersätts uttryckligen så att health date-fälten fortsatt är korrekta.
- Ny health-history-post börjar utan tid och kan sparas med NULL. Vid ändring av en äldre `occurred_time IS NULL`-post visas inget förvalt klockslag; NULL bevaras tills ägaren frivilligt väljer en tid.
- Health history läser/skriver `occurred_time` i samma owner-/dog-guardade flöde som idag. Ändring/radering och konflikt-/readback-semantik ska omfatta tiden.
- Om ägaren anger en hälsotid valideras den som canonical `HH:mm`; tomt värde är giltigt och serialiseras som NULL. DB-wirevärde normaliseras endast efter strict matchning av `HH:mm` eller `HH:mm:00`; andra sekunder/format avvisas. Intern health serialisering och validering använder `HH:mm`/null utan JS `Date` eller timezone-konvertering. Health time läggs till i normaliserade operationer, readback-jämförelser och optimistic rollback snapshots.
- Health history edit/delete compare-and-swap predicates inkluderar föregående `occurred_time` och hanterar tidigare NULL med IS NULL-semantik, utöver nuvarande id/dog/type/date/description. Existerande actor/dog-scope och mutationstombstones lämnas kvar.
- `ProductWorkspace` skickar explicit health-history records och load-state till `HomeScreen`. Ready visar poster; loading visar befintligt laddningstillstånd; error visar en separat hälsolänk/återställningsväg utan att dölja tillgängliga logghändelser eller påstå att hälsan är tom.
- Hem visar alla logg- och utförda hälsoposter för vald dag i den befintliga scrollvyn; ingen trepostgräns får dölja en tidsstämplad post. Logg och hälsa visar tid från samma lagrade värde som används för sortering. Health `time` är lokal väggklockstid utan tidszon; loggens `timestamptz` använder appens befintliga lokala parser/formatter. Okänd äldre health-tid ligger efter poster med känd tid och visas utan tidsstämpel.
- Migrationen lägger till health-tidsfältet och enbart minsta nödvändiga column update grant för `occurred_time`; RLS-policy behålls med `private.owns_dog(dog_id)` i USING och WITH CHECK samt `actor_id = auth.uid()`. Ingen grant till `dog_id` eller `actor_id`. Ingen migration körs mot en riktig databas som del av detta mandat.

## Acceptanskriterier

1. Snabb loggning sparas i befintligt ett-trycksflöde utan tidsfråga och behåller aktuell loggtid. Hälsans formulär märker tydligt tiden som valfri. Utförd vaccination/veterinärpost kan sparas både med tomt tidsfält och med valt klockslag; båda flöden visas och sparas korrekt. Befintlig känd hälsotid bevaras vid redigering; legacy NULL förblir tom.
2. Användaren kan redigera och ta bort hälsopost enligt befintligt flöde; tidsändring får inte kringgå owner/dog-kontroller, compare-and-swap av tidigare tid (inklusive NULL), optimistic rollback, konfliktläsning eller sparstatus.
3. Hem visar utförda vaccinationer/veterinärbesök bland alla loggrader för vald dag med tid när den är känd. Blandade poster sorteras deterministiskt på lokal tid; äldre poster utan tid visas utan falsk tid. Hälsans loading/error visas separat och får inte se ut som tom historik.
4. Vanliga logghändelsers befintliga ett-trycksflöde, sparstatus, dubblettskydd, retry, undo, dolda snabbval och automatiska loggtid bevaras.
5. DevelopmentPreview använder samma befintliga snabbloggsflöde; inget extra tidsteg tillkommer.
6. Inga ändringar görs i planerade health, reminders, viktposter, export/PDF, delning, retention eller datasyfte. Ingen ny dependency.
7. Migration shape/range constraint, grants och RLS-policy testas statiskt; relevanta tester täcker strict `HH:mm` serialisering/avvisning, lokal datumgräns, sorting, null legacy, add/edit/delete/readback, stale concurrent time edit och owner-scoped queries. Verklig DB/RLS körs endast i den godkända syntetiska utvecklingsmiljön om den finns; annars redovisas NOT TESTABLE.
8. UI verifieras renderat vid relevanta smala/standardbredder i standardskala, valfritt health-tidsfält både tomt/sparat och ifyllt/sparat, Home blandad tidslinje samt relevanta spar-/fel/undo-tillstånd; avsnitt 14 i designreglerna dokumenteras. Nativ/telefon kontroll kan läggas i Eriks samlade mobil-QA utan att hävda PASS här.

## Implementationsfiler och testmål

- `src/features/puppy-log/LogScreen.tsx`
- `src/features/puppy-log/README.md`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/home-timeline.ts`
- `src/features/home/README.md`
- `src/features/health/HealthHistoryScreen.tsx`
- `src/features/health/HealthScreen.tsx`
- `src/features/health/README.md`
- `src/data/workspace-data.ts`
- `supabase/migrations/202610100001_health_history_time.sql`
- `docs/plans/HOME-TIME-01-time-choice-and-home-timeline.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HOME-TIME-01.md`
- `docs/design/evidence/home-time-01`

Planerade testmål: `tests/log-screen-policy.test.mjs`, `tests/health-history.test.mjs`, `tests/workspace-data.test.mjs` och `tests/home-timeline-policy.test.mjs`. Koordinatorn instruerade att testfiler lämnas oförändrade och att inga check-/testkommandon körs i denna checkpoint.

## Granskningar och verifiering före implementation

- Architect: granska data-/tidsmodell, migration/column grant, Home timeline, legacy null och exact scope.
- Critic: granska begriplighet, extra steg i snabb loggning, datum-only äldre poster och att Hem visar rätt utfall.
- Security: granska ny health-tidslagring, column grants, RLS-kontext, ägarisolering och muterings/readback-flöde.
- Efter implementation: separat implementerplan, QA och Reviewer. Säkerhetsgranskning igen av fryst diff. Inga migrationer körs mot produktionsmiljö och inga riktiga användardata används.

## Avgränsningar och öppna frågor

- Kända vaccinationstyper/medicinska råd ändras inte. Uppgifterna är fortsatt ägarregistrerad historik, inte verifierad journal.
- Planerade appointments/reminder-tider, tidszoner för resa/sommartidshistorik och historisk datamigrering ligger utanför scope.
- Erik har uttryckligen avgränsat tidsscope till logg samt utförd vaccination/veterinärhistorik; viktposter och planerade health events är utanför.

## Planreview

- Architect: APPROVE v1 (tidigare v3); CHANGES v1 införda i v3; Erikbesked införda i v4. APPROVE v4 och implementation approach godkändes före preview-upptäckt. CHANGES v5: preview ska skicka vald `occurredAt` orörd till raden; kriteriet lades i v6 och task queue. APPROVE v6.
- Critic: PROCEED v4. Explicita tider och vikt exkluderad följer Eriks beslut. CHANGES v5: stale vikttext rättad i v6. PROCEED v6 efter preview-kriteriet och avgränsningen.
- Security: APPROVE v4. Health-only shape/range guard, NULL-aware prior-time CAS/readback/optimistic snapshot, strict UI/wire `HH:mm` och endast occurred_time-grant med owner RLS är godkända. Runtime DB/RLS är statisk/NOT TESTABLE; ingen migration kördes.
- Product: APPROVE v7 scope correction. Snabb loggning ska vara ett tryck; frivillig tid för utförd vaccination/veterinärhistorik passar godkänd hälso-MVP. Home visar tiden när den finns.
- Critic: CHANGES v7; införda i v7.1 genom tydlig valfri etikett och renderad kontroll av både tom och vald tid.
- Architect: APPROVE v7.1 efter att etiketten och renderingskriterierna för tomt/ifyllt formulär lagts till.
- Critic: PROCEED v7.1; ett-trycksloggning, valfri hälsotid och båda sparlägena finns uttryckligen i kontraktet.
- Security: APPROVE implementationens v7.1-diff; ägar-/hundscope, begränsad grant, health-only constraint, NULL-aware CAS/readback och strikt tidsnormalisering är bevarade.
- QA:s källgranskning v7.1: inga blockerande källkodsluckor; tom/vald skrivning, runtime RLS/migration och renderat/enhetsflöde är inte verifierade.
- Reviewer v7.1: inga blockerande kodfel; målbildsjämförelse, designchecklista och telefon/native-underlag återstår.
- Eriks korrigering ändrade beteendet och ersatte Architect/Critic-godkännandet av v6. V7.1 har förnyade planreviews och en fryst diff-review.

## Implementationscheckpoint — 2026-10-10

HOME-TIME-01 v7.1 är implementerad lokalt i appen, datalagret och en ny migration. Snabb loggning är återställd till ett-trycksflödet med befintligt aktuellt klockslag. Utförd health history accepterar valfri tid; tomt skickas som NULL och känd tid förifylls vid redigering. Hem behåller den gemensamma tidslinjen och visar bara hälsotid när den finns. DevelopmentPreview är oförändrad.

Migrationen har endast granskats statiskt mot befintlig shape-check, kolumn-grant och owner-RLS-definition. Den har inte körts. Enligt koordinatorns instruktion ändrades inga testfiler och inga check-/test-/buildkommandon kördes. Renderad skärm- och telefon-QA är inte gjord. Ingen commit, push eller deploy.

Kvar före `done`: lokala automatiska kontroller, renderad skärmmatris och designchecklista. Källgranskningar från QA/Reviewer och Security är klara; verklig DB/RLS och native/telefonflöde är inte körda. Se [HOME-TIME-01 checkpoint](../releases/HOME-TIME-01.md).

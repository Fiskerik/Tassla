# APP-05 – Hälsa B1: viktresa

Planutkast v3, 2026-10-06. Erik har bett om mer funktionalitet med GPT-6 Luna Medium för implementation. Detta är nästa kodslice efter den separata fysiska APP-04A-PHONE-grinden. Ingen implementation är godkänd eller påbörjad.

## Scope

Bygg endast en komplett ägarregistrerad viktresa: visa historik, lägg till, rätta och radera viktposter. Återanvänd befintligt `dog_events`-schema (`event_type = weight`, `occurred_on`, `weight_kg`) och befintliga skriv-/reconciliationmönster. Ingen ny migration, dependency, notifiering, klinisk tolkning, viktkurva, målvikt eller foderrekommendation ingår.

**Datasyfte:** låta den inloggade hundägaren registrera, visa, rätta och radera hundens vikt för sin egen historiska översikt. Ingen analys, profilering, AI, partner-, kennel- eller veterinärdelning. Minimalt fälturval: `dog_id`, `actor_id`, datum, kg och nödvändiga tekniska ID/tidsstämplar; ingen anteckning, plats, foto, symptom eller produktdata.

**Separat datakontrakt:** inför `HealthWeightRecord`, `HealthWeightOperation` och `HealthWeightChanges` samt vikt-specifika `fetchHealthWeights`, `insertHealthWeight`, `updateHealthWeight` och `deleteHealthWeight`. De använder `occurred_on` + `weight_kg`, stabil sekundärsortering på `id` och får inte återanvända vardagsloggens `LogEventType`, `occurred_at` eller `DogEventOperation`.

**Compliance-grind:** Compliance bedömer plan v2 som CHANGES. Intern implementation med syntetiska data kan planeras, men verklig konto-/hunddata kräver Eriks beslut om personuppgiftsansvarig, preliminär rättslig grund, information vid första registrering, gallring för inaktiva konton/backuper samt Supabase DPA/region/underbiträden. Extern pilot/release är inte godkänd av denna task.

## Ägarskap och write paths

- **Implementer:** `src/features/health/HealthScreen.tsx`, `src/features/health/README.md`, `src/features/home/ProductWorkspace.tsx`, `src/data/workspace-data.ts`, samt berörda befintliga guider.
- **QA:** `tests/health-weight.test.mjs`, `tests/README.md`.
- **Koordinator:** `docs/tasks/dev/app-05.md`, `docs/tasks/dev/rapport.md`, `docs/tasks/dev/queue.json`.

## Acceptance

- Hälsan visar laddar-, tomt-, fel- och historikläge.
- Ägaren kan lägga till vikt i kg med datum; datum får inte ligga i framtiden och vikt följer befintligt databaskontrakt (över 0 och högst 200 kg).
- Ägaren kan rätta och bekräftat radera en egen viktpost.
- Viktmodellen använder ett separat health-event-kontrakt med `occurred_on`/`weight_kg`; den får inte tvingas in i vardagsloggens `LogEventType`/`occurred_at`-modell.
- Vardagsloggen förblir oförändrad och filtrerar fortsatt bort `weight` från sina sex snabbval.
- Historiken stöder flera poster, sorterade på datum fallande och stabilt `id`.
- Datum valideras som verkligt `ÅÅÅÅ-MM-DD` som inte ligger i framtiden; kg valideras till ett positivt tal med högst tre decimaler och högst 200 kg, före SDK-anrop.
- Insert/update/delete har dubbeltrycksspärr, återläsning/reconciliation och separata saved/failed/unknown-lägen; inget offlinekö-system byggs.
- Sparstatus skiljer bekräftad, misslyckad och okänd skrivning; dubbeltryck skapar inte dubbla poster.
- Varje post märks som ägarregistrerad. UI ger inga kliniska råd, mål, trender eller vårdscheman.
- All data är kopplad till aktuell hund och befintlig ägarisolering återanvänds.
- Telefon-/Supabase-runtime och RLS markeras NOT TESTABLE om de inte faktiskt körs; lokala kontraktstester får inte presenteras som verklig databasverifiering.

## Checks och grindar

- Före implementation: APP-04A-PHONE måste ha verkligt resultat och Erik måste godkänna ändamålet samt preliminär rättslig grund för intern syntetisk-/utvecklingsanvändning. Compliance-grindar för verklig data och release kvarstår.
- Architect godkänner exakt plan. Critic granskar användarvärde/scope. Security granskar data-/skrivytan före merge.
- Implementering körs med GPT-6 Luna Medium. QA och Reviewer använder samma modellnivå för detta segment.
- Kör `pnpm check`, `pnpm bundle:ios`, `git diff --check`; SQL/RLS-runtime är separat och NOT TESTABLE utan utvecklingsdatabas.
- Efter implementation: bounded cleanup → QA → Reviewer/Security → checkpoint. Nästa APP-04B2 får inte starta före PASS.

## Preview och fysisk uppföljning

`DevelopmentPreview.tsx` fortsätter visa den ärliga tomma Hälsa-grunden utan props, lagring eller Supabase-anrop. B1 ändrar därför inte `DevelopmentPreview.tsx`; cloud-workspace kopplar explicit HealthScreen till viktkontrakten. En separat `APP-05-PHONE-DB`-task ska senare verifiera viktformens keyboard/decimal/raderingsdialog på telefon samt faktisk Supabase/RLS med två syntetiska konton. Varken fysisk UX eller RLS får räknas som PASS i B1.

## Öppna men avgränsade frågor

- Enheten är kg i denna slice; ingen lokaliserad enhetsväxling byggs.
- Värdena är ägarregistrerade och inte verifierad journal. Ändrad datalagring eller delning kräver ny compliance-/securitygrind.
- Förhandsvisningen fortsätter visa ett ärligt tomt Hälsa-läge utan Supabase-anrop; B1 ändrar endast det inloggade workspace-flödet och `DevelopmentPreview.tsx` behöver inte ändras.

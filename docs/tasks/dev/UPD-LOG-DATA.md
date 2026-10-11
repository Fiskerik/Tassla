# UPD-LOG-DATA – valfria fält i ägarloggen

Datum: 2026-10-11
Planversion: v4 – Product PROCEED; Critic PROCEED; Architect APPROVE
Status: done

## Mandat och mål

UPD-LOG-DATA är paket 2 i Eriks godkända segment UPD-1011 och får starta efter UPD-SCOPE. Det lägger till valfria, ägarregistrerade uppgifter på befintliga `public.dog_events`: olyckstyp, mängd/enhet för mat eller vatten samt fodertyp. Det inför inte hälsotolkning, rekommendationer, nya datadelningar eller ändrad RLS.

Snabbregistreringen och gränssnittet ändras inte i detta paket; valfri efterregistrering och redigering hör till UPD-LOG-UI. När appversionen med nya fält används måste motsvarande migration vara tillämpad. Om ingen utvecklingsdatabas finns markeras SQL-runtime/RLS-test som NOT TESTABLE.

## Ändringsyta

- `supabase/migrations/202610110003_dog_event_details.sql` – näst lediga migration efter `202610110002_puppy_checklists.sql`.
- `supabase/README.md` – migrationens ordning och testinstruktion.
- `supabase/tests/log-event-details.sql` – syntetiska positiva/negativa constraint- och ägarisoleringstest med rollback.
- `src/data/contracts.ts` – valfria fält i `TimedDogEventInput`.
- `src/data/workspace-data.ts` – wire-typer, validering, kolumnurval och readbackjämförelse.
- `src/features/puppy-log/log-model.ts` – fält i loggmodellen, create/change-validering och säkra typbyten.
- `src/features/puppy-log/README.md` – dokumentera datafält och att UI kommer i nästa paket.
- `tests/log-model.test.mjs` och `tests/workspace-data.test.mjs` – syntetiska modell-/API-kontrakt.
- `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md` och denna plan.

`src/features/home/ProductWorkspace.tsx` ingår inte i detta databas-/modellpaket. Innan UPD-LOG-UI startar ska dess kökontrakt uttryckligen omfatta filen och godkänna read/write-handoff för de nya fälten: `toLogEvent()` läser dem och uppdateringsvägen bevarar skillnaden mellan utelämnat och explicit `null`, inklusive typbyte. UI-paketet får inte starta utan den handoffen i sin godkända plan.

## Föreslaget datakontrakt för granskning

- `accident_kind`: nullable text; `pee`, `poop` eller `both` (den ägarloggade olyckan omfattade både kiss och bajs); icke-null bara på `event_type='accident'`. Null på äldre olyckor betyder ospecificerat.
- `amount`: nullable `numeric`; när den finns är den positiv och paras alltid med `amount_unit`.
- `amount_unit`: nullable `g`, `ml` eller `dl`; mängd/enhet får bara finnas på `food` eller `water`.
- `food_type`: nullable text, endast `food`; trimma exakt ASCII blanksteg, tab, CR och LF i båda ändar i TypeScript och SQL. Tomt efter trimning blir `null`. Längden är 1–60 Unicode-kodpunkter (`Array.from`/PostgreSQL `char_length`).
- Enhetskoppling enligt UI-mandatet: `food` använder `g` med tekniskt tak `≤ 2 000`; `water` använder `ml` (`≤ 10 000`) eller `dl` (`≤ 100`). Övriga event-/enhetskombinationer avvisas. Gränserna är endast tekniska valideringsgränser. De säger inget om säkra, normala, rekommenderade eller lämpliga mängder för någon hund.
- Befintliga rader förblir giltiga med `NULL`; migrationen backfillar inte värden och ändrar inga RLS-policyer. Lägg constraints separat i stället för att skriva om `dog_events_check`, så befintliga datum-, vikt-, duration- och `occurred_time`-regler bevaras. Lägg bara till kolumnbaserad `UPDATE`-rättighet för de fyra nya fälten.
- Persisted/read record har samtliga fyra fält med explicita värden eller `null`; insert-operationen får utelämna dem för fortsatt snabbregistrering. Update är en patch: utelämnat fält bevaras och explicit `null` rensar det. Vid ändrat `event_type` rensas först gamla typbundna detaljer; endast giltiga nya värden som uttryckligen finns i samma patch sätts tillbaka. Vid `food`↔`water` bärs mängd/enhet aldrig över eller konverteras. Ogiltiga kombinationer avvisas.
- SQL `CHECK` för mängd/enhet ska använda två uttryckliga alternativ: båda `NULL`, eller båda `NOT NULL` och därefter giltig typ/enhet/positivitet/tak. Det gör att inget halvt `NULL`-par kan passera via `CHECK`-värdet `UNKNOWN`.

## Acceptans

1. Ny numrerad migration lägger till de fyra nullable-kolumnerna och validerar tillåtna värden, typkoppling, båda riktningarna av halvt `NULL` mängd/enhet-par, positivitet, tekniska övre gränser och mattypslängd.
2. Alla gamla rader fortsätter giltiga med `NULL`; befintliga `dog_events_check`, `occurred_time`-regler och RLS-policyer lämnas oförändrade. Enda rättighetsändringen är kolumnbaserad `UPDATE` på de nya kolumnerna för `authenticated`; ingen tabellomfattande `UPDATE` eller ändring av `dog_id`/`actor_id`-rättigheter.
3. `contracts.ts`, `workspace-data.ts` och `log-model.ts` skiljer persisted null-värden från patch-semantik: utelämnat update bevarar befintliga fält, explicit null rensar och typbyte rensar gammal typdata före uttryckligt giltiga nya fält. Snabbregistreringen förblir oförändrad.
4. Tester med syntetiska data täcker tillåtna fältkombinationer, båda halva `NULL`-paren, avvisade enhetskopplingar/mängder, samma whitespace-trim/60-kodpunktsgräns i SQL/TypeScript, tom text→null, legacy-null, patch-bevarande/explicit rensning/typbyte och serialisering/readback. SQL-test verifierar kolumnrättigheterna samt att en annan ägare varken läser eller ändrar posten.
5. README-filerna beskriver migrationsordning och att detta paket inte ändrar Logga-gränssnittet.
6. `pnpm check`, fokuserade modell-/workspace-tester och `git diff --check` passerar. SQL-runtime/RLS resultat rapporteras endast om testet faktiskt körs mot lokal eller avsedd utvecklingsdatabas; annars NOT TESTABLE.

## Kontroller och granskningar

- Product → Critic → Architect: PROCEED/PROCEED/APPROVE på denna exakta plan före implementation.
- Dog Expert granskar datagränserna och att mängdfälten inte framställs som bedömning eller råd.
- Security granskar exakt migration, kolumnrättigheter och oförändrade RLS-policyer före QA.
- QA verifierar acceptanskriterier med körda tester och redovisar separat eventuell NOT TESTABLE SQL-runtime.
- Oberoende Reviewer granskar den frysta diffen efter QA PASS.
- Ingen UI-/skärmbildsgranskning ingår i data-paketet; UPD-LOG-UI äger synliga formulär och rendering.

## Beroenden och avgränsningar

- Beroende: UPD-SCOPE klart; köstatus står `done`.
- Nästa paket UPD-LOG-UI får börja först när detta paket är QA-/Reviewer-godkänt, committat lokalt och checkpointat.
- Inga nya dependencies, ingen ändring av LogScreen/ProductWorkspace UI, ingen ändring av RLS, inga partner-/analysändamål och ingen push/distribution.

## Granskningslogg

Product, v1, 2026-10-11: **CHANGES**. Accepterade föreslagna tak endast som tekniska inmatningsgränser; begärde uttrycklig enhetskoppling (`food` g; `water` ml/dl), uttömmande typbytesbeteende och tom `food_type`→`null`. Infört i v2.

Dog Expert, v1, 2026-10-11: **CHANGES; no blocker**. Bekräftade att olyckstyp och tekniska gränser är neutrala om de enbart beskriver ägarens logg, men bad planen säga att gränserna inte är säkra/normal/rekommenderade/lämpliga mängder för någon hund. Infört i v2; bekräftelse på revideringen inväntas.

Security, v1, 2026-10-11: **No blocking plan issue; implementation review still required**. Begärde att SQL-testet kontrollerar att endast nya kolumner är uppdateringsbara, `dog_id`/`actor_id` inte får update-privilegier, tabellomfattande `UPDATE` inte ges och en annan ägare inte kan läsa/ändra posten. Infört i v2. Detta granskar planen och befintligt schema, inte en ännu oskriven migration.

Product, v2, 2026-10-11: **PROCEED**. Bekräftade att enhetskopplingarna följer UI-mandatet, taken tydligt är tekniska, typbyten rensar tidigare uppgifter och tom fodertyp blir `null`; inga ytterligare ändringar.

Dog Expert, v2, 2026-10-11: **PASS**. Bekräftade att tekniska gränser inte framställs som säkra/normal/rekommenderade mängder och att `both` bara beskriver ägarens loggade olyckstyp.

Security, v2 plan review, 2026-10-11: **PASS for plan; exact migration review pending**. Bekräftade att rättighets- och ägarisoleringstesterna är specificerade. Exakt SQL/RLS-granskning krävs efter implementation och före QA.

Plan v3 tar in Critic v2:s krav på identiska SQL/TypeScript-normaliseringsregler, explicit hantering av PostgreSQL `CHECK`/`NULL` och tydlig record-vs-patch-semantik. Product/Critic v3 PROCEED; Security bekräftade att tilläggen täcker planpunkterna.

Product, v3, 2026-10-11: **PROCEED**. Bekräftade att trim/längd matchar SQL/TypeScript, mängd/enhet är båda satt eller båda `null`, record/patch skiljer mellan utelämnat och explicit rensning, samt typbyten rensar utan konvertering.

Critic, v3, 2026-10-11: **PROCEED**. Bekräftade att båda halva `NULL`-paren täcks, sparade poster och patchar har tydliga skilda semantiker, typbyten rensar utan att bära över mängd, och legacy-rader förblir `NULL` utan backfill.

Security, v3 plan review, 2026-10-11: **PASS for plan; exact migration review pending**. Bekräftade att tidigare planfynd om `NULL`, trim/längd och patchsemantik är lösta. Exakt migration, faktiska grants och RLS återstår efter implementation.

Security, implementation review, 2026-10-11: **PASS, statisk granskning** av migration och SQL-test. Bekräftade separat nullable-constraints, båda halva `NULL`-fallen, ASCII-trim/`char_length`, begränsade kolumnrättigheter och oförändrade shape-/tidsregler och RLS. Ett negativtest för ogiltig `accident_kind` lades till efter granskningen och bekräftades korrekt. Ingen databas finns här; SQL-runtime är NOT TESTABLE.

Architect, v3, 2026-10-11: **CHANGES**. `ProductWorkspace.tsx` saknades från både UPD-LOG-DATA och UPD-LOG-UI:s kökontrakt trots att `toLogEvent()` och `updateEvent()` för närvarande tappar detaljfälten. V4 behåller filen utanför datamodellspaketet men lägger uttryckligt fil-/roundtrip-krav i UPD-LOG-UI:s kökontrakt före paketstart. Product/Critic ska granska den reviderade gränsen.

V4 behåller UPD-LOG-DATA:s avgränsning till schema, datakontrakt, modell och tester. Handoffen till den befintliga workspace-adaptern täcks i det godkända UI-paketet.

Product, v4, 2026-10-11: **PROCEED**. Bekräftade att `ProductWorkspace.tsx` hålls utanför datapaketet men ingår i UPD-LOG-UI:s konkreta write paths och read/write-acceptans, och att UI-paketet inte kan starta innan handoffen ingår i dess godkända plan.

Critic, v4, 2026-10-11: **PROCEED**. Bekräftade att UI-kökontraktet täcker avläsning av fälten och patchens skillnad mellan utelämnat och `null`, även vid typbyte. Inga blockerare.

Architect, v4, 2026-10-11: **APPROVE**. Bekräftade att DATA/UI-gränsen är tydlig, kökontraktet äger ProductWorkspace-handoffen, och beroenden/skrivvägar stämmer. Planen får implementeras.

QA, implementation, 2026-10-11: **PASS**. Oberoende granskning bekräftade modellvalidering, nullable readback, insert-serialisering, patchjämförelse och typbytesrensning mot plan v4. `node --experimental-strip-types --test tests/log-model.test.mjs tests/workspace-data.test.mjs` PASS 2/2; `pnpm check` PASS (typecheck, edge typecheck, lint 0 fel/38 varningar, testsvit 37/37); `python tools/dev_flow.py validate` PASS; `git diff --check` PASS. SQL-runtime NOT TESTABLE utan `psql`/Supabase CLI.

Reviewer, implementation, 2026-10-11: **PASS — UPD-LOG-DATA v4**. Oberoende granskning bekräftade additiv migration, oförändrade befintliga shape-/tidsregler och RLS, kolumnbaserade rättigheter, modell-/readback-/patchsemantik och tester. Queue validation och diff-check passerade. SQL-runtime kvarstår NOT TESTABLE.

## Checkpoint

UPD-LOG-DATA v4 är implementerat, QA-/Reviewer-godkänt, committat lokalt och köstatus `done`. Product/Critic PROCEED, Architect APPROVE, Dog Expert PASS och Security statiskt PASS. `pnpm check` och fokuserade tester passerade. SQL-runtime är NOT TESTABLE utan psql/Supabase CLI; migrationen har inte körts mot någon databas. Paketcommit `cb30f50325a72207fc5bf9d9bae2ba3ae51de16d` (`feat: add optional puppy log details`) på `codex/repo-grounding`; uppföljande docs-commit registrerar SHA i historiken. Nästa paket: UPD-LOG-UI, där ProductWorkspace read/write-handoff är en uttrycklig grind.

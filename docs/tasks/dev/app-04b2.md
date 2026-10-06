# APP-04B2 — vaccinations- och veterinärhistorik

Plan v1, 2026-10-06. Status: förberedd, inte implementerad eller implementationsgodkänd. Erik har begärt förberedelse och release-log per paket. Detta är mandat för dokumentation. Exakt plan granskas av Architect/Critic före implementation, med Compliance/Security för berörd dataåtkomst. Ingen tidigare review återanvänds som godkännande av denna plan.

## Mål och scope
Ägaren kan registrera, läsa, rätta och bekräftat radera genomförda vaccinationer och veterinärhändelser för aktuell hund. Befintligt dog_events-schema stöder vaccination/vet_visit, occurred_on och description. Återanvänd B1:s principer för stabila ID:n, synkron dubbeltrycksspärr och saved/failed/unknown. Separata typade hälsokontrakt; ingen ihopblandning med vardagsloggen.
Föreslaget formulär: typ, verkligt kalenderdatum som inte ligger i framtiden och frivillig kort ägartext (trimmas, högst 500 tecken, fastställs i planreview). Typ låses för befintlig post; ändring av datum/text stöds. Inga kliniska råd, automatiska intervall, dokument/foton, nya dependencies eller migrationer. Kommande händelser och påminnelser är senare paket. Informera att uppgifterna är ägarregistrerade och be användaren undvika personuppgifter i fritext.

## Beroenden
APP-05 B1 är kodlevererat i e5327d1 och checkpointat med lokala granskningsresultat. APP-05-PHONE-DB återstår; rekommenderad ordning är att verifiera B1 på telefon/databas före B2-implementation. Avvikelse måste dokumenteras i exakt planreview. Betaaktivering och verkliga konton har kvarstående databeslut enligt app-05.md; lokal utveckling använder syntetiska data. Ingen betastart beslutas här.

## Deluppgifter och ansvar
| ID | Ägare | Leverans/filer | Beroende | Acceptans och verifiering |
|---|---|---|---|---|
| B2-01 | Koordinator, Architect/Critic, Compliance/Security | Denna plan; release-log | B1-checkpoint och underlag för PHONE-DB | Granska kontrakt, fritext, datum, åtkomst och beroenden; spara faktiska utlåtanden före ready |
| B2-02 | Implementer | src/data/workspace-data.ts; src/features/health/HealthScreen.tsx; src/features/home/ProductWorkspace.tsx; src/features/health/README.md | B2-01 och segmentmandat | Komplett CRUD för båda typerna; rätt hund/typ/id-filter, återläsning, sanningsenliga statuslägen och historik; ingen ändring av vikt/loggens beteende |
| B2-03 | QA, sedan Reviewer/Security; koordinator | tests/health-history.test.mjs; tests/README.md; denna plan; docs/releases/APP-04B2.md; docs/tasks/dev/rapport.md | B2-02 | Fokuserade beteendetester, pnpm check, pnpm bundle:ios, git diff --check; oberoende review och hållbar checkpoint |
| B2-PHONE-DB | Erik/QA | Dokumenterad build och utvecklingsdatabasresultat | Verifierad B2-kod och tillgänglig signerad build | Fysisk formulär-UX, återstart/nätfel samt tvåkontoprov som nekar läsning/ändring/radering för annan ägare |

## Acceptanschecklista
- [ ] Laddar-, tom-, fel- och historiklägen; datum fallande och stabil sekundärsortering.
- [ ] Skapa båda händelsetyperna; datum/text valideras före SDK-anrop.
- [ ] Rätta datum/text; radera med Avbryt/Bekräfta.
- [ ] Dubbeltryck ger högst en skrivning; okänt resultat kontrolleras mot samma ID/fält innan återförsök.
- [ ] Retry av ändring/radering skriver inte över en senare ändring; sessions-/hundbyte avskärmar tidigare resultat.
- [ ] Ingen annan hunds data visas eller ändras; verklig RLS verifieras separat med två syntetiska konton.
- [ ] Tangentbord, stor text, skärmläsaretiketter och bekräftelseknapp fungerar på telefon.
- [ ] Vikthistorik och vardagslogg fungerar fortfarande; begränsad cleanup och aktuell README.
- [ ] Lokala tester skiljs från fysisk UX/RLS; overifierat markeras NOT TESTABLE.
- [ ] Release-log uppdaterad med faktiskt levererat, verifiering och nästa paket.

## Checkpoint
Förberedelse klar. Implementation ej startad; ingen APPROVE/PASS påstås. Nästa steg: dokumentera APP-05-PHONE-DB och granska exakt B2-plan. Köstatus ändras först med workflowets faktiska reviewunderlag.
Release-log: ../../releases/APP-04B2.md. Nästa funktionspaket: APP-04C profilredigering (namn, ras, födelsedatum; uppdaterad ålder/innehåll efter bekräftad sparning).

## Uppdaterat beroende 2026-10-06
Eriks nya TestFlight-policy ersätter ovanstående rekommendation att vänta på APP-05-PHONE-DB före B2. Vikt/tangentbord är användarrapporterat PASS, build okänd. B2-planreview och lokal implementation kan fortsätta utan ny telefonkontroll. Se mvp-beta-delivery.md för samlad plan.

## Plan v2 — exact implementation contract, 2026-10-06
Mandate: Erik explicitly ordered entire MVP implementation top to bottom with Luna medium. B2 mandate is included. Earlier PHONE prerequisite is superseded by Erik's policy. Implementer/QA/Reviewer use gpt-6-luna medium. No future events, migration, dependencies, clinical advice or publication in B2.

1. DATA: workspace-data.ts gains HealthHistoryType vaccination|vet_visit, HealthHistoryRecord/Operation/Changes, fetch/lookup/insert/update/delete helpers. Columns id,dog_id,actor_id,event_type,occurred_on,description; actor comes from DB auth default, never UI. Real YYYY-MM-DD <= local today; optional description trimmed, null when empty, <=500 characters (match DB Unicode character semantics). Exact type immutable during edit. Validate returned record and expected dog/type/id. Every mutation and lookup filters dog_id + exact event_type + id; fetch filters dog + allowed types. Sort date DESC/id DESC. Existing schema supports these types. Installed SDK APIs and request deadlines reused; disclose row-cap limitation.
2. WORKSPACE: independent history records/loading/status/pending/inflight state in ProductWorkspace.tsx; keep weight/log unchanged. Stable ExpoCrypto UUID on insert retained across retry; synchronous guard. Unknown write blocks another mutation. Reconcile same dog/type/id: insert desired match = saved, absent = same-ID replay; update desired match = saved, captured preimage match = safe replay; delete absent = saved, preimage match = safe replay. Mismatch = conflict/uncertain; never overwrite. Filter conditional writes against captured preimage (date/description with correct null matching) to prevent concurrent update race. Check returned postimage/absence. Ignore late results on unmount/dog/session change using existing keyed workspace and abort conventions.
3. UI: add HealthHistoryScreen.tsx and compose below existing weight section in HealthScreen.tsx, retaining honest preview without callbacks/data. Swedish type/date/optional note, type locked when editing; loading/empty/error/retry and status states; cancel/confirm delete, accessible labels, keyboard dismiss and readable layout. Owner-recorded label; avoid personal data in notes; no notes in logs. Separate history states so weight and history don't block each other except their own pending writes.
4. CLEANUP/QA: implementer owns src/data/workspace-data.ts, src/features/home/ProductWorkspace.tsx, src/features/health/HealthScreen.tsx, src/features/health/HealthHistoryScreen.tsx and health README. QA exclusively owns tests/health-history.test.mjs and tests/README.md. Coordinator owns plan/queue/report/release-log. Internal checkpoint DATA -> WORKSPACE -> UI -> CLEANUP; partial package not reported done.
5. VERIFICATION: QA tests date/leap/future, trim/null/500/501 incl Unicode, real SDK fetch requests and allowed payload/filter contracts, response parsing/sort, saved/failed/unknown, stable retry ID, preimage conflict and atomic guards, stale/session suppression and weight/log regression. pnpm check, pnpm bundle:ios, git diff --check; actual Reviewer/Security after stable diff. Real RLS/native UX separately NOT TESTABLE unless run, no TestFlight gate.
6. CHECKPOINT: release-log distinguishes implemented/local verified/push/build; next P02 APP-04C only after QA/review/checkpoint. No next package writes before that. Planreview pending for exact v2; no approval fabricated.

## Faktisk planreview v2
Architect APPROVE och Critic PROCEED från b2_reviewplan. Compliance/Security APPROVE lokal syntetisk implementation från b2_data_review. Kontroller: atomic preimage på alla update/delete med null via is, oförändrad preimage under retry, codepoint-längd, kontroll av livstid efter varje await före replay, synlig radgräns och explicit statuskontroll. Ingen beta/backend/native PASS påstås. Baslinje pnpm check 64/64 PASS.

## Bilder och ikoner — Eriks genomförandekrav 2026-10-06
Varje paket har en UI-designcheckpunkt: använd passande bilder/illustrationer och ikoner där de hjälper förståelse och gör upplevelsen trevlig. Återanvänd Tasslas befintliga dog-welcome/dog-resting och Ionicons samt theme tokens där de passar; nya bilder ska vara lämpliga och ha spårbar källa/generation. Lugn hierarki, tydliga kort/status, textetiketter till handlingar, skärmläsarfallback, stor text, reducerad rörelse och laddningsprestanda. Undvik att dekor döljer formulär eller sparstatus. Kontroller får inte bara kommunicera med ikon/färg. Ingår i cleanup/QA/review, inte ett separat kosmetiskt slutprojekt.

## Implementationcheckpoint före QA
Luna medium b2_contract: DATA/WORKSPACE/UI/README stabila. Typkontroll och lint PASS, scoped diffcheck PASS. Delete-ID-fel rättat; edit-reset täcker direkt radering, accepterad konflikt och förändrad historiksnapshot genom remount. QA och final Reviewer/Security pågår, inga app-PASS eller done ännu.

QA-plan clarification: tests/app-screen-ux.test.mjs tillåts hos QA endast för föråldrad statisk useAuth-destructuringassertion; signOut kommer fortsatt från useAuth, session används för B2 lifetime. Runtime auth-kontrakt oförändrat. Behåll kontraktet men tillåt extra destructured fields. Detta är en testkompatibilitetsjustering, ingen scope-/appändring.

## Slutcheckpoint — APP-04B2 lokalt klart
Luna medium implementation. Independent QA profile_contract: health-history 38/38; pnpm check 102/102 inkl tsc/lint; pnpm bundle:ios PASS via godkänd filskrivningseskalering efter sandbox EPERM; git diff --check PASS. Reviewer b2_reviewplan PASS stable source; Security PASS lokal syntetisk utveckling, inga kvarstående fynd. Befintlig statisk authassertion justerad för sessionfält, runtime authtester fortsatt verifierade.
Rättade utvecklingsfel: radering måste matcha requested ID eller kontrollera target separat; formulär återställs efter direkt/reconciled radering och accepterad konflikt. Detta är inte fel i tidigare release. Native/RLS ej körda här och inte påstådda PASS. Inga dependencies/migration eller betaaktivering i B2. Nästa paket APP-04C kan starta direkt enligt Eriks telefonpolicy.

# FLOW-HOME-CHECKLIST-WEEK-01 — plan v3

Datum: 2026-10-17 · Status: plan v3 godkänd av Architect, Critic och Security; R3b lokalt implementerad och godkänd av QA, Security och Reviewer.
Masterplan: UIUX-REVAMP-MASTERPLAN-2026-10-16, R3b; MVP v2 § Panel 4.
Riskklass: H — ny hundscopead läsning över sju kalenderdagar och förändrad checklistresa. Ingen ny lagring eller ändrat dataändamål föreslås.

## Mål och användaruppgift

Ägaren öppnar Denna vecka, väljer en dag i den aktuella kalenderveckan och ser de faktiska sparade rutin-/träningsvalen och deras bekräftade status. Idag och Alla behåller befintlig funktion och innebörd. Vecka visar inte Kommande och skapar inte historiska eller framtida dagsrader.

Primär handling: välja en av veckans sju dagar.
Synlig hierarki: aktuell veckas datumintervall → dagval med datum → sparade dagsrader och bekräftad status → separata okänt/tomt/saknat/läsfel-tillstånd.
Retur: Idag/Alla-tabval och Hem-retur fungerar som i befintlig checklistresa. Endast aktuell dags exakta träningsrad öppnar publicerad version/steg och återgår till samma veckodag med bekräftad uppdaterad progress. Första öppning och hund/vecka/tidszonsbyte väljer aktuell lokal dag; uttryckligt val bevaras bara inom samma scope.
Målbild: Panel 4 visar Idag/Denna vecka/Alla och en sammanhållen lista. Återanvänd befintliga Tabs, typografi, tokens, dividers, pressed states och scrollmönster; lägg inte till dekorativa eller icke-handlingsbara segment. Följ design-rules §2, §3, §9 och §14.

## Granskat dataunderlag och källkontrakt

Befintliga källor:

| Källa | Data som får visas |
|---|---|
| dog_daily_routine_days | Hundens redan sparade dagskopia: date_key, time_zone, fryst rutinrubrik/checklista och completed_item_ids. Dagskopian går före nuvarande rutinmall. |
| dog_daily_routine_day_skips | Ägarens sparade överhoppning för den dagen; visas som överhoppad, inte som utförd rutin. |
| dog_daily_training_selections | Explicit valt program_version_id, step_id, date_key och time_zone. |
| training_progress via befintlig fetchTrainingWorkspace | Befintliga completion-tidsstämplar för aktuell hund; mappas till dagsvalets sparade tidszon och datum genom befintlig modellfunktion. |

Supabase migrations 202610130001_daily_activities.sql och 202610140002_routine_checklists.sql beviljar authenticated SELECT på dessa dagskällor och använder private.owns_dog(dog_id) RLS. Implementationen ska behålla dog_id-filter i klientqueryn och serverns RLS. Inga andra hundar kan förekomma i sammanställningen.

Nya week-readern är strikt läsande. Den får aldrig anropa ensure_due_daily_routine_days för historiska/framtida datum, skapa saknade dagsrader, ändra rutinmallar, skriva completion eller ändra selection. Den redan laddade dailySnapshot för aktuell dag är den enda auktoritativa källan för idag; råa weekly SELECT-rader med dagens date_key ignoreras alltid. dailySnapshot måste vara lyckad och matcha aktuell ägare/session, kontogeneration, hund, dagens date_key, tidszon och public/review-scope. Om den saknas, laddas, har fel scope eller misslyckas visas loading/error/retry; dagen visas inte som tom och rå weekly data används inte. Övriga sex datum hämtas endast som sparade rader. Weekly reader väljer bara nödvändiga display-/scop fält: routine day id,dog_id,routine_id,date_key,time_zone,routine_label_snapshot,checklist_snapshot,completed_item_ids,completed_at,is_recurring_occurrence; skip day_id,dog_id,routine_id,date_key,time_zone,routine_label_snapshot,checklist_snapshot,completed_item_ids,completed_at,is_recurring_occurrence; training selection id,dog_id,program_version_id,step_id,date_key,time_zone; training progress dog_id,program_version_id,step_id,completed_at. Små projektionvaliderare kontrollerar dessa fält; mutation-ID:n och revisioner väljs inte. Alla källor måste lyckas; fel på någon ger separat läsfel.

## Tids-, vecka- och statuskontrakt

1. Veckan är ISO-måndag till söndag, bestämd från dagens date_key i appens aktuella giltiga IANA-tidszon. Veckan är en kalendervecka, inte sju rullande dygn.
2. Date-key-validering och veckodags-/veckoaritmetik görs med kalenderdatum och UTC-baserad civil datumaritmetik. IANA-zonen används för att fastställa dagens date_key och jämföra sparad time_zone; DST får inte hoppa över eller dubblera en dag.
3. Endast sparade poster vars date_key tillhör intervallet visas på den dagen. Sparad time_zone skiljer sig från aktuell veckozon: radens snapshot får visas med ursprunglig rubrik, men status märks “Tidszon skiljer sig — status kan inte bekräftas” och räknas inte som bekräftad progress. Inga tidsstämplar antas för date_key.
4. En historisk/framtida dag utan sparad dagsrad eller träningsval betyder “Ingen sparad dagslista” / saknad historik, inte en bekräftat tom eller kommande dag. En lyckad current-day snapshot utan valda aktiviteter kan visas som bekräftat tom. Fel i läsning är ett eget fel. Saknad, tom, unavailable och error blandas aldrig ihop.
5. Training selection är klar endast när exakt version/steg finns i aktuell hundscopead publicerad snapshot och befintlig completiontimestamp i selectionens time_zone bekräftar samma date_key. Saknad/tillbakadragen källa, saknad progress-read eller tidszonsmismatch visas som okänd/otillgänglig, aldrig som “inte genomförd”. Befintlig vuxenrelevansgräns gäller utan utökning.
6. Week-totalen summerar bara bekräftade poster. Okända/tidszonsmismatch, saknade dagar och tomma dagar redovisas separat; ingen tillgänglig aktivitet förvandlas till ett ofärdigt item. Veckoselektorn visar fortfarande alla sju datum även när en dag saknar data.
7. Veckovyn är read-only för historiska och framtida dagskopior, rutiner och träning. Historiska/framtida träningsrader saknar knapp-/länksemantik, chevron och öppningsaffordance; de har begriplig read-only/statuscopy och kan inte nå completion, unmark eller reset. Träningsdetalj får endast öppnas för aktuell lokal date_key via exakt befintlig källa och relevansgrind. Efter träning returnerar appen till samma veckodag och gör scope-guarded progress-readback; endast bekräftat resultat uppdaterar dags-/veckosumma. Failed/unknown behåller senaste bekräftade status och visar retry/unknown, aldrig antagen bock. Rutincheckboxar i historiska dagar erbjuds inte. Inga nya handlingar, “Kommande”-poster eller planerade aktiviteter.

## Avgränsad implementation

1. Lägg till typad weekly snapshot/datafunktion i daily-activity-data.ts som läser endast explicita display-/scopekolumner för aktuell hund och date_key-intervall från befintliga källor, med smala projektionvaliderare; inga mutation/revisionsfält, writes eller nya RPC:er.
2. Lägg till ren modellfunktion för week start/dagnycklar och projektion per dag med sparade snapshots, exact source/progress, vuxenpolicy, tydliga missing/empty/unknown/error states och bekräftad summering. Återanvänd/testa befintliga hjälpare där kontraktet matchar.
3. Lägg till Denna vecka-tab i DailyChecklistScreen med sju datumknappar, vald dags detaljer och read-only historiska/framtida rutiner och träningsrader. Första öppning och fullständigt scopebyte väljer dagens lokala date_key; valt datum bevaras bara så länge hund, ISO weekStart och tidszon är oförändrade. Endast en träningsrad för aktuell lokal date_key öppnas via exakt version/steg med returnPage=week och valt date_key. Historiska/framtida rader saknar knapp-/länksemantik, chevron och öppningsaffordance; de visar begriplig read-only/statuscopy. Idag/Alla behåller befintliga filter, mutationer, loading/error och scrollretur.
4. ProductWorkspace laddar veckosnapshot för nuvarande scope och uppdaterar vid konto/session, accountGeneration, hund, aktuell local date_key, ISO weekStart, tidszon, public/review-scopebyte, dailySnapshotUpdatedAt, app resume och lokal midnatt. Varje veckefetch använder abort-/generationsnyckel med owner/session, accountGeneration, dog_id, current local date_key, ISO weekStart, aktuell IANA-tidszon, dailySnapshotUpdatedAt och public/review. Förändring av date_key eller dagsnapshotversion invaliderar pågående svar; bara fullt matchad nyckel får publiceras. Dagens vy projiceras alltid reaktivt från senaste scope-matchade dailySnapshot, aldrig den råa week-raden. Efter retur från aktuell dags träning hämtas completion/progress scope-guarded på nytt; endast bekräftad readback uppdaterar vald dagsstatus och veckosumma. Failed/unknown behåller senaste bekräftade värde och visar retry/unknown. Ingen veckefetch skriver eller skapar historiska dagar.
5. Uppdatera Home-guiden, harness, verifieringsskript, riktade testfiler och checkpointdokumentation. Testa current-day dailySnapshot-auktoritet, ignorerad rå veckorad för idag, saknad/felaktig snapshot, svarsrace över lokal midnatt samt dailySnapshotUpdatedAt-race. Verifiera confirmed readback och dags-/veckosumma efter completion/unmark/reset; failed/unknown ger ingen bock. Verifiera att äldre/framtida rader saknar knappsemantik/chevron och inte öppnar actions med klick och accessibility tree, samt initialval av dagens datum och bevarande inom scope.
6. Ingen schema-, RPC-, grant-, policy-, migration-, RLS-, data-purpose-, dependency-, notifierings- eller kalenderintegration. Om implementationen visar att befintliga SELECT-/RLS-/datakällor inte räcker, STOPPA och begär separat arkitekturbeslut före sådana ändringar.

## Acceptanskriterier

1. Aktuell kalendervecka har sju korrekta datum från måndag till söndag enligt aktuell lokal date_key/tidszon; DST-kant, årsskifte, månadsskifte och söndag/måndagsgräns har riktade tester.
2. Sparade rutinraders snapshottext/checkboxstatus är den källa som visas; malländring efter dagen får inte skriva om historik. Sparade skips visas endast som överhoppade. Aktuella/kommande rutinmallar räknas aldrig som veckans val.
3. Träning binds till exakt sparat program_version_id + step_id och existerande training_progress timestamp mappas i sparad tidszon. Adult/stale/missing source blir ej öppningsbar/unknown enligt befintlig policy; inget osant “ogjort”.
4. Veckoselektor visar varje dag med datum. Vald dag visar bekräftade aktiviteter eller korrekt separat tomt/saknat/unknown/error-läge. Veckosumma, vald-dagssumma och unknown-count är matematiskt separata och testade.
5. Ägar-/hund-/public-review-/tidszonsscope isoleras. Varje query filtrerar aktuell dog_id och RLS är dokumenterad. Samma date_key i annan sparad tidszon räknas inte som bekräftad progress.
6. Veckovyns dagsläsning är read-only för historiska/framtida rader: inga routine/training writes, due-day RPC, knappsemantik, chevron eller falsk affordance. Endast aktuell dags träning kan använda befintliga completion/unmark/reset-mutationer; retur gör scope-guarded readback. Endast bekräftad läsning uppdaterar status och summor; failed/unknown behåller senast bekräftat värde och visar retry/unknown. Retur återställer samma valda veckodag.
7. Läsfel skiljer sig från genuint tom current day, saknad historisk/future snapshot, unknown item och timezone mismatch. Om auktoritativ dailySnapshot för idag saknas, laddas, har scopefel eller misslyckas visas loading/error/retry; rå veckodata för idag används inte och dagen kallas inte tom. Ingen framtida dag kallas planerad/kommande.
8. Idag och Alla behåller befintliga semantiker, dagliga writes, retry/recovery, samlad confirmed progress och return behavior.
9. Public/review harness verifierar initial dagens val, valbevarande/scopebyte, readback efter completion/unmark/reset, snapshots, date/timezone/DST-gränser, missing/empty/unknown/error, dog isolation, stale response över midnatt och dailySnapshot refresh-race, samt read-only-affordance genom klick och accessibility tree. Skärmbevis 375×844, 430×844, 375×667 och 140% textproxy jämförs med Panel 4/§14. Native/live-status rapporteras separat.
10. Home-guiden och taskrapporten anger befintliga datakällor, RLS, tidszon/vecko-/empty-regel, dagens snapshot-prioritet, scope fence, träningsraders read-only-regel, verifierade resultat och NOT TESTABLE-begränsningar.

## Skrivvägar

- src/features/home/daily-activity-data.ts
- src/features/home/daily-activity-model.ts
- src/features/home/DailyChecklistScreen.tsx
- src/features/home/ProductWorkspace.tsx
- src/features/training/PublishedTrainingScreen.tsx
- src/features/home/README.md
- tests/daily-activity-data.test.mjs
- tests/daily-activity-model.test.mjs
- tests/daily-activity-ui.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/verify.py
- tools/visual-check/README.md
- docs/tasks/dev/FLOW-HOME-CHECKLIST-WEEK-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md
- docs/design/evidence/vision-rev02/checklist/WEEK-01

## Verifiering

- Fokuserade data-/modell-/UI-wiring tester för datumaritmetik, ISO-veckogräns, DST-/år-/månadsskifte, timezone mismatch, snapshotparitet, age/scope, empty/missing/error och read-only writes.
- Riktad ESLint på ändrade filer.
- Public/review build och verifierare för week view; UTF-8 JSON-resultat och noll page errors.
- Manuell granskning av screenshots och §14-checklista.
- pnpm check.
- Python syntax för verifierare, python tools/dev_flow.py validate, git diff --check.
- Statisk policygranskning mot migrationerna ovan. Live Supabase/RLS och app på fysiska iOS/Android kan inte markeras PASS om de inte faktiskt körs med godkända syntetiska testkonton.

## Implementation checkpoint — 2026-10-17

R3a (`FLOW-HOME-TRAINING-TARGET-01`) är checkpointad som `done`. R3b är implementerad lokalt enligt exakt plan v3: veckoläsaren använder tre dog-/datumfiltrerade GET-projektioner med smala fält och utan RPC/write; modellen projicerar aktuell dag endast från scope-matchad dagsnapshot och ger historiska träningsrader inget öppningsmål; UI visar sju datum, separata statusar och enbart aktuell exakta träningsväg; ProductWorkspace använder abort/generations- och scope-fence, refresh vid appåterkomst/dagsnyckel och snapshotversion, och återställer veckodag/tab efter träningsretur. Träningsrader visar både programtitel och bekräftad/okänd status.

Datumväljaren använder två punkters mellanrum via befintlig spacing-token för att varje träffyta ska vara minst 44 pt vid 375 px bredd. Testfixturen har synthetic timestamps för completion, unmark och reset readback. Inga schema-/RPC-/grant-/policy-/migration-/dependencyändringar har införts. Oberoende QA, Security och Reviewer är PASS. Efter scope-fixen passerade fokustester 31/31, ESLint, `pnpm check` 557/557, public/review browser 7/7 vardera utan sidfel, Python syntax, queue validation och `git diff --check`. Resultat: [QA](../../design/evidence/vision-rev02/checklist/WEEK-01/qa/QA-REPORT.md), [Security](../../design/evidence/vision-rev02/checklist/WEEK-01/security/SECURITY-REVIEW.md), [Reviewer](../../design/evidence/vision-rev02/checklist/WEEK-01/review/REVIEW-REPORT.md). Live Supabase/RLS, riktiga konto-/hundbyten, app-resume/midnatt på enhet, native iOS/Android, VoiceOver/Dynamic Type och full match mot veckoreferens är NOT TESTABLE. R3b stängs som lokal funktionell checkpoint; Panel 4 är inte därmed färdig. R3b ingår med R2a och R3a i ägarens samlade leverans på samma branch.

## Beroenden och stoppgrind

Beroenden: FLOW-HOME-CHECKLIST-ALL-01 och FLOW-HOME-TRAINING-TARGET-01 (R3a). R3a stängs/checkpointas före denna implementation eftersom båda använder ProductWorkspace/PublishedTrainingScreen. Ingen arbete på R3c/Upcoming i denna task.

Eriks mandat täcker MVP v2 Panel 4 och Home-checkpointen. Denna data-/timezoneplan måste få Architect APPROVE, Critic PROCEED och Security PASS för exakt v3 före kod. Ändring av timezone semantics, SELECT grants/RLS, schema, RPC, data-purpose eller dependency kräver ny planreview och tillämpligt ägarbeslut.

## Granskningsbevis

- Architect v1: CHANGES; v2 godkänd efter fyra ändringar. Architect v2: APPROVE för exakt v2.
- Critic v2: PROCEED WITH CHANGES; confirmed readback efter mutation, dagens initialval och ärlig read-only-affordance för historiska/framtida rader är införda i v3.
- Security v2: BLOCK på current local date_key/dailySnapshotUpdatedAt i svarsfence och explicit minimerade SELECT-kolumner; båda införda i v3. Ny review av exakt v3 krävs.
- Architect v3: APPROVE för exakt plan v3. Bounded seven-day reads and checklist route fit the existing architecture; preserve SELECT-only behavior, current-day dailySnapshot authority, full response scope fence, narrow projection validators, exact training source gates, read-only historical/future rows, and selected-day return.
- Critic v3: PROCEED för exakt plan v3. Confirmed readback, today's initial selection, and truthful non-actionable historical/future rows are aligned across goal, acceptance, verification, and queue.
- Security v3: PASS för exakt plan v3 efter statisk granskning. No new collection, storage, sharing, schema, RPC, grant, RLS, retention, dependency, or purpose. Existing authenticated SELECT/RLS supports dog-scoped weekly reads; live deployed-policy and runtime-race checks remain NOT TESTABLE until integration.
- Implementation QA: PASS för den lokala R3b-slicen; rapport i checklist/WEEK-01/qa/QA-REPORT.md.
- Security implementation: PASS; rapport i checklist/WEEK-01/security/SECURITY-REVIEW.md.
- Reviewer implementation: PASS utan fynd; rapport i checklist/WEEK-01/review/REVIEW-REPORT.md.

# FLOW-HOME-CHECKLIST-FILTERS-01 — status och granskningsunderlag

Datum: 2026-10-20
Status: plan v2 godkänd; ägaren bad stoppa den fortsatta implementationen. Endast data-/modellskivan checkpointas; UI-resan är inte färdig.

## Omfattning

Planen täcker Checklistans Idag, Denna vecka, Alla och Kommande; sparad dagsaktivitet inklusive uttryckligen överhoppade rutiner; read-only projektion av kommande återkommande rutiner och planerad hälsa; exakta historiska träningskällor; källnavigation och retur; samt fullständiga laddnings-, tom-, partial- och fellägen. Den bindande UX-/dataplanen är [plan v2](../../plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md).

## Källfynd och reviewutfall

- Befintlig dagsladdare förbereder aktuell dag via `ensure_due_daily_routine_days`; den ska inte användas för historiska eller framtida datum. Historiska dagar får endast komma från sparade dagsrader eller sparade skip-snapshots. Befintlig FK-cascade raderar dessa när rutinmallen tas bort, så historiken lovar inte arkiv för borttagna rutiner.
- `dog_daily_routine_day_skips` är en separat ägarvald status som dagens källa redan läser. V2 tar med den i avgränsade historikläsningar som en statisk **Överhoppad** rutinrad, utanför completion-progress.
- Rutinregler projiceras med befintlig `isRoutineDueOnDate`; framtida förekomster är presentationer och märks Planerad.
- `fetchTrainingWorkspace` väljer åldersrelevanta/resumable versioner och räcker inte för alla sparade historiska urval. V2 kräver exakt publicerad `program_version_id`/`step_id`-resolver och hundscope:ad progressläsning; olöst källa eller ofullständig progress blir Delvis hämtad.
- Befintlig `fetchPlannedHealth` väljer fler fält än listan behöver och är en begränsad sida. V2 kräver en ny minimal hund-/datumavgränsad, paginerad read-only-läsare.
- Product-beslut i v2: visa ägarregistrerade hälsoplaner i Kommande eftersom detta är den godkända panel-4-resan och befintlig data; ingen ny användning eller write tillkommer. Security behöver bekräfta v2:s exakta query/RLS-implementation före kod.
- Filtret ägs av `ProductWorkspace` för retur från källa; v2 definierar abort/generation, keyset-paginering, known-mutation-invalidation och 2×2-segmentacceptans vid 375×667/140 %.

Första Architect/Critic/Security-review gav CHANGES/CHANGES/APPROVE WITH CONDITIONS och ledde till v2. Slutlig v2-review: Product APPROVE för hälsoplaner read-only inom panel 4; Architect APPROVE; Critic PROCEED; Security APPROVE. Live Supabase RLS är inte verifierad i denna statiska review. `git diff --check` och `python -X utf8 tools/dev_flow.py validate` passerar; inga appfiler har ändrats.

## Slutlig review v2

- Product — APPROVE: planerade, ägarregistrerade hälsoplaner visas read-only inom den tidigare godkända MVP-panel 4; ingen ny datanvändning.
- Architect — APPROVE: befintlig SDK/SQL/RLS-/recurrence-/route-gräns håller; exact published training source, paginering och livstidskydd ryms i listade paths.
- Critic — PROCEED: filterbegränsning/copy, skip/Planerad-status, segmentstorlek, destinations- och tillståndsresor är tillräckligt specificerade.
- Security — APPROVE för planens statiska kontrakt; befintlig dog-membership RLS används och inga nya writes/RPC/migrationer planeras. Live Supabase/deployerad RLS är fortsatt NOT TESTABLE.

## Implementation checkpoint 1 — data och datummodell, 2026-10-20

Implementerat lokalt inom godkända paths:

- `checklistFilterRange` räknar ISO-måndag–söndag, exakt rullande 30 kalenderdatum och Kommande från imorgon till och med sju dagar framåt, med UTC-kalenderaritmetik över datumnycklar för att undvika lokal DST-förskjutning.
- `projectUpcomingRoutineDates` använder den befintliga `isRoutineDueOnDate` för uttryckliga återfallsregler och returnerar endast presentationsdatum; ingen förekomstrad eller RPC skapas.
- `fetchDailyActivityRangeSnapshot` är en separat read-only-läsare för sparade rutin-dagar, skip-snapshots, träningsurval och (endast när anropare ber om det) aktuella rutinmallar. Varje hämtad källa pagineras med keyset, hundfilter, datumgränser för historikrader och validering. Föräldraabort avbryter läsningen; andra källfel rapporteras per källa så att en anropare kan visa partial i stället för komplett/tomt. Källor som inte efterfrågats räknas inte som lästa.
- `deriveSavedRangeActivities` härleder enbart frysta dags-/skip-snapshots och exakt matchade urval; den gör ingen historisk backfill. Exakt träningskälla krävs för en träningsrad; olösta urval utelämnas från aktivitetsmodellen och rapporteras separat av källslaget. Skip-rader är statiskt märkta som skip i modellen och completion blir inte sant.
- `fetchPlannedHealthChecklistRange` läser endast `id,dog_id,event_type,due_on` inom hundens exakta datumintervall och keyset-paginerar med abortskydd.
- `fetchExactHistoricalTrainingSources` slår upp endast sparat versions-/stegpar, endast publicerad version, och exakt hund/version/steg-progress. Listfrågan hämtar bara publicerings-/titelmetadata och stegtitel, inte body/instruktion; detaljtext ska hämtas först när detaljvyn öppnas. Olösta/avpublicerade källor returneras uttryckligen som olösta; transport- och progressfel kastas så anroparen kan visa partial/error.

Riktade tester: `tests/daily-activity-range.test.mjs` provar sidbyte och cursor för sparade rutindagar, hund-/datumparametrar, frånvaro av RPC, partiellt källfel, pre-abort, exakt publicerad träning + hundprogress och minimal paginerad health range. `tests/daily-activity-model.test.mjs` provar ISO-/nyårsgräns, 30-dagarsgräns, sju framtida dagar, skottår, återfallsankare, varannan-vecka/veckodagar, månadsslut och exakt historikmodell. Fokuserad körning efter korrigering: 13/13 PASS. `pnpm check` (typecheck, edge typecheck, lint och full testsvit), `git diff --check` och `python -X utf8 tools/dev_flow.py validate` PASS. Live Supabase/RLS är NOT TESTABLE.

Detta stänger endast läs-/modellskivan, inte tasken. Ingen UI eller route har kopplats in; inga appskärmar ändras av checkpointen. Exakt kvar: filtret måste ägas av `ProductWorkspace`; filterbyte/route/account/dog/timezone/day invalidation och generationskontroller måste abortera stale reads; checklistan behöver fungerande responsiva 2×2 filter, loading/empty/partial/error/retry och datumgrupper; health/routine/exact-training destinationer måste öppnas och återställa filter/grupp/scroll; rutinhändelser i Kommande måste dölja dagsåtgärder; historisk träning ska vara skrivskyddad och hämta detaljtext först när den öppnas; queue-integrerad visuell evidens och §14 samt UI-/lifecycle-/navigationstester saknas. Native VoiceOver/Dynamic Type, live RLS, TestFlight och renderad 375/430/375×667/140 %-evidens är NOT TESTABLE i denna skiva.

Ägaren bad uttryckligen stoppa den fortsatta implementationen eftersom riktningen inte kändes rätt. Denna checkpoint sparar endast den avgränsade data-/modellskivan; ingen UI-respons eller fullgod användarresa hävdas. Tasken är ofärdig och ska inte markeras `done`. Om arbetet återupptas är nästa steg att först bekräfta riktningen med ägaren, därefter koppla läsarna till `ProductWorkspace` och bygga/testa UI-/källreturresan.

Git-checkpoint: `41adec0` (`wip: checkpoint checklist filter data model`) på `codex/tassla-mvp-remainder-2026-10-20`; remote push verifieras efter rapportuppdateringen.

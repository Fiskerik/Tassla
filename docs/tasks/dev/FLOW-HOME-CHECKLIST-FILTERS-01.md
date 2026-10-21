# FLOW-HOME-CHECKLIST-FILTERS-01 — status och granskningsunderlag

Datum: 2026-10-21
Status: v2–v5-plan godkänd; v5-implementation, rättad previewåtgärd och uppdaterad public/review-render är gjorda. Lokal QA PASS och köstatus `done` för denna avgränsade checkpoint; oberoende Reviewer uppskjuten till MVP-closeout. Panel-4-visuell acceptans är PARTIAL, inte PASS. Live Supabase/RLS, native/iPhone och release är fortsatt NOT TESTABLE.

## Omfattning

Planen täcker Checklistans Idag, Denna vecka, Alla och Kommande; sparad dagsaktivitet inklusive uttryckligen överhoppade rutiner; read-only projektion av kommande återkommande rutiner och planerad hälsa; exakta historiska träningskällor; källnavigation och retur; samt fullständiga laddnings-, tom-, partial- och fellägen. Den bindande UX-/dataplanen är [plan v2](../../plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md).

## Källfynd och reviewutfall

- Befintlig dagsladdare förbereder aktuell dag via `ensure_due_daily_routine_days`; den ska inte användas för historiska eller framtida datum. Historiska dagar får endast komma från sparade dagsrader eller sparade skip-snapshots. Befintlig FK-cascade raderar dessa när rutinmallen tas bort, så historiken lovar inte arkiv för borttagna rutiner.
- `dog_daily_routine_day_skips` är en separat ägarvald status som dagens källa redan läser. V2 tar med den i avgränsade historikläsningar som en statisk **Överhoppad** rutinrad, utanför completion-progress.
- Rutinregler projiceras med befintlig `isRoutineDueOnDate`; framtida förekomster är presentationer och märks Planerad.
- `fetchTrainingWorkspace` väljer åldersrelevanta/resumable versioner och räcker inte för alla sparade historiska urval. V2 kräver exakt publicerad `program_version_id`/`step_id`-resolver och hundscope:ad progressläsning; olöst källa eller ofullständig progress blir Delvis hämtad.
- Befintlig `fetchPlannedHealth` väljer fler fält än listan behöver och är en begränsad sida. V2 kräver en ny minimal hund-/datumavgränsad, paginerad read-only-läsare.
- Product-beslut i v2: visa ägarregistrerade hälsoplaner i Kommande eftersom detta är den godkända panel-4-resan och befintlig data; ingen ny användning eller write tillkommer. Security behöver bekräfta v2:s exakta query/RLS-implementation före kod.
- Filtret ägs av `ProductWorkspace` för retur från källa; v2 definierar abort/generation, keyset-paginering och known-mutation-invalidation. V2:s äldre 140 %-acceptans är ersatt av ägarbeslutet 2026-10-21; v5 verifierar relevanta standardviewportar och den korta vyn utan bred tillgänglighetsmatris.

Första Architect/Critic/Security-review gav CHANGES/CHANGES/APPROVE WITH CONDITIONS och ledde till v2. Slutlig v2-review: Product APPROVE för hälsoplaner read-only inom panel 4; Architect APPROVE; Critic PROCEED; Security APPROVE. Live Supabase RLS är inte verifierad i denna statiska review. `git diff --check` och `python -X utf8 tools/dev_flow.py validate` passerar; inga appfiler har ändrats.

## Slutlig review v2

- Product — APPROVE: planerade, ägarregistrerade hälsoplaner visas read-only inom den tidigare godkända MVP-panel 4; ingen ny datanvändning.
- Architect — APPROVE: befintlig SDK/SQL/RLS-/recurrence-/route-gräns håller; exact published training source, paginering och livstidskydd ryms i listade paths.
- Critic — PROCEED: filterbegränsning/copy, skip/Planerad-status, segmentstorlek, destinations- och tillståndsresor är tillräckligt specificerade.
- Security — APPROVE för planens statiska kontrakt; befintlig dog-membership RLS används och inga nya writes/RPC/migrationer planeras. Live Supabase/deployerad RLS är fortsatt NOT TESTABLE.

## UI-hierarki amendment v3 — 2026-10-21

- Product — godkänd av ägarens direkta begäran och referensbild: visa dagens rutin-checklista och sparade träningssteg i tydligt separata sektioner.
- Critic — PROCEED; checklistans progress ska sitta visuellt i rutinsektionen och inte presenteras som total dagsprogress.
- Architect — APPROVE efter att skärmkontakt, queue write path och acceptanskrav synkades. Räknare/progress testas rutin-only, blandat och training-only; ingen `0 av 0`; träningsstatus och exakt källnavigation bevaras.
- Security — ingen ny granskning krävs enligt planen eftersom dataanvändning, query scope och writes är oförändrade. Föregående live RLS-status är fortsatt NOT TESTABLE.

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

## Implementation checkpoint 2 — panel-4-filter och Kommande, 2026-10-21

Historisk checkpointstatus före v5; dess fyra-segmentslayout och §14-bedömning nedan har ersatts av v5.

Erik återupptog exakt plan v2 efter det tidigare stoppet. Det tidigare stoppbeskedet och checkpoint 1 ovan är historik, inte aktuell taskstatus. Planens produkt- och datakontrakt är oförändrade. Ägarbeslutet om tillgänglighetsmatrisen gäller även denna checkpoint.

Implementationen kopplar fyra fungerande filter till separat read-only range-läsning, ISO-vecka och 30-dagarsgräns, sju-dagars Kommande, sparade skip-snapshots och exakt publicerad historisk träning i read-only detalj. `ProductWorkspace` äger filterstate och abort-/generationsscopet; källreturer bevarar filter och scroll, filterbyte återställer offset, och bekräftad rutinändring laddar om aktiv range-projektion. Planerade rutinrader öppnar fokuserad mallhantering utan dagsåtgärder; planerad hälsa öppnar befintlig destination.

Källskydd som bekräftats av Security: dagsrange avvisar över 30 datum; framtida health range avvisar över sju; historiska träningsuppslag begränsar samtidighet till tre; paginerade läsare avvisar fel hund/datum och upprepad/icke-framåtriktad cursor. Read paths använder befintlig hund-RLS enligt migrationskällor och gör inga nya writes/RPC:er. Live Supabase/RLS och native är **NOT TESTABLE** i denna miljö.

Slutlig lokal verifiering och renderbevis finns i [RENDER-REPORT.md](../../design/evidence/flow-home-checklist-filters-2026-10-20/RENDER-REPORT.md). `pnpm check` passerar med 65/65 testfiler, 0 fel och 0 skip; riktad Checklist-svit med sex filer, typecheck, iOS JavaScript-export, public/review browser-rendering, `git diff --check`, Python-kompilering och kövalidering passerar. Renderingen använder branch `codex/dog-profile-search-pilot`, commit `a57e17388d380800c6a378b6368babe6877b4f1c` och exakta 375×844, 430×844 samt 375×667-vyer. Public: 19 browser assertions/24 bilder/0 JS-fel; review: 20/24/0. Exakta bundle-/verifierarhashar och skärmbevis finns i rapporten.

Den separata §14-bedömningen fann **Nej** för visuell likhet med panel 4: referensen visar tre segment, ett dagligt kort med räknare/progress/rader och en kommande-förhandsvisning på samma skärm; implementationen har fyra segment och en separat datumgrupperad filtervy. Färgfördelning, kortform, innehållstäthet och exempelrader skiljer sig också. Detta är en verifierad avvikelse, inte en saknad QA-körning. Den funktionella lokala resan är verifierad men får inte beskrivas som full visuell acceptans. Live Supabase/RLS och native/iPhone/release är NOT TESTABLE. Securitys statiska review hittade en dygnsgräns-/återkomstbrist; koden har klock-/scope-invalidering, men nuvarande test gör endast source-level-kontroll. Dynamisk midnatt-/AppState-refetch har inte testats och ska inte rapporteras som täckt. Oberoende QA/Reviewer granskar aktuell kod/evidens. Därefter återstår ägarens val mellan uttryckligt visuellt undantag eller reviderad visuell plan.

## Ikon/detail amendment v4 — planreview, 2026-10-21

Eriks godkända riktning: Hem behåller kompakta dagsrader; sidan Checklista visar varierad rutinpunktsikon och valfri kort beskrivning. Long-press på dagens rutinrad öppnar befintlig rutinmallredigering med rätt punkt fokuserad; normaltryck och checkbox behåller separata handlingar. Malländring gäller framtida dagskopior; sparade dags-/skip-snapshots förblir frysta.

Critic lämnade **PROCEED** efter att acceptance skyddade mot dubbeltryck och uteslöt checkbox, historik/skip, träning och hälsa från long-press-redigering. Security lämnade **APPROVE på plan-/datakontraktsnivå**: fyra exakta JSON-former, identisk 20-ikonlista i TS/SQL, beskrivning 1–160 trimmade tecken och samma owner-scoped create/replace RPC/CAS/revision. Instruktionsbody hämtas inte för checklistans listvy. Arkitekten lämnade först **CHANGES** för synkning av kövägar, panel 1/4-kontrakt och metadata-only-test; efter synk lämnade **APPROVE för v4**. Live Supabase/RLS är fortsatt **NOT TESTABLE** och kräver senare runtime-verifiering.

## Implementation checkpoint 3 — v4 och ikonrutnät, 2026-10-21

Historisk v4-checkpointstatus; v5 och aktuell QA-status finns i checkpoint 4.

Implementerat inom de godkända write paths: Hem visar fortsatt kompakt rutinöverblick; Checklistan visar varierade rutinikoner och endast ifyllda kortbeskrivningar. Long-press på dagens rutinrad öppnar befintlig editor med rätt punkt fokuserad; vanlig öppning, checkbox och frysta dagskopior behåller separata beteenden. Ikonknappen ligger intill varje punkts eget rubrikfält; förklaringsfältet ligger under med varmare bakgrund, sekundär textfärg och placeholdern “Förklaring (valfri)”. Ikonväljaren visar alla 20 tillåtna Ionicons i en grid utan synliga namn, beskrivningar eller rubriktext. Ikonerna behåller tillgängliga namn för hjälpmedel, och valet markeras visuellt. Spacing mellan inmatningsrader och gridval är ökat.

Verifiering: `pnpm check` PASS (66/66 testfiler, 66 pass, 0 skip, 0 fail); public/review browserflöden PASS med 33 skärmbilder vardera och 0 JS-fel vid 375×844, 430×844 och 375×667; public iOS JavaScript-export PASS (1454 moduler); `git diff --check`, verifierarens Python-kompilering och `python -X utf8 tools/dev_flow.py validate` PASS. Exakta branch-, commit-, bundle- och verifierarhashar samt ikon-gridbilden finns i [RENDER-REPORT.md](../../design/evidence/flow-home-checklist-filters-2026-10-20/RENDER-REPORT.md) och v4-evidensmappen.

Lokal funktionell QA är PASS; oberoende Reviewer är ännu inte registrerad. Koden hanterar datum-/appåterkomst, men nuvarande route-test kontrollerar bara source wiring; dynamisk midnatt-/AppState-refetch är **NOT TESTED**. Panel-4-kompositionens §14.16-avvikelse kvarstår, så detta stänger inte hela filtertasken. Live Supabase/RLS, native/iPhone och release är fortsatt **NOT TESTABLE**.

## Panel-4-komposition amendment v5 — planreview, 2026-10-21

Ägaren bad fortsätta med återstående checklistarbete. Den öppna §14.16-avvikelsen konkretiserades mot `vision_rev02.jpg`: Idag visar tre segment (`Idag`, `Denna vecka`, `Alla`) och en separat `Kommande, 7 dagar`-förhandsvisning; fulla rangevyer behåller fyra direkt nåbara segment. Förhandsvisningen ska använda samma Kommande-range-läsare och endast visa upp till tre framtida rutin-/hälsoplaner med datum och `Planerad`, utan checkbox/progress. `Visa alla kommande` öppnar alltid fullvyn, även vid tomt/laddning/partial/fel, och ska dela cache eller pågående läsning när möjligt. Preview-state scoped på samma konto/hund/datum/tidszon och har egna laddar/tomt/partial/fel/retry-tillstånd. Inga nya källor, writes, RPC:er, schema eller säkerhetsändamål föreslås.

Critic lämnade **CHANGES** med begäran att tydliggöra rullande sjudagarsintervall, CTA `Visa alla kommande` även när tomt, synlig Planerad-status och frånvaro av check/progress/dubbelkontroll. Architect lämnade **CHANGES** för scoped preview-state, delad request/cache, synlig valt segment och synkning av paths/kontrakt; efter synk i v5-planen, `docs/design/vision-rev02-screen-contracts.md`, `docs/MVP-EXPERIENCE-CONTRACT.md` och `queue.json` gav Architect **APPROVE** 2026-10-21. Samma befintliga Kommande-läsare återanvänds under account/dog/date/time-zone/review-scope; ingen query eller säkerhetsgräns utökas. V5 implementerades därefter enligt denna plan; aktuell QA- och visuella status följer i checkpoint 4.

## Implementation checkpoint 4 — v5 panel-4-komposition och preview, 2026-10-21

`Idag` visar nu tre starkt segmenterade val och ett kompakt Kommande-kort direkt efter dagslistan. Förhandsvisningen använder samma Kommande-range request/cache som fullvyn, visar högst tre framtida rutin-/hälsoplaner med datum och Planerad-status, och saknar checkbox, progress och dagsåtgärder. I public/review ligger den visuella länken `Visa alla` på samma rad som `Kommande, 7 dagar`; dess tillgängliga namn behåller `Visa alla kommande aktiviteter` och öppnar fulla fyrasegmentsvyn också vid laddning, tomt, partial och fel. Partial visar högst en tillgänglig rad så meddelande och återförsök ryms över fast navigation. Den separata träningssektionen och dess källresor ligger kvar.

Verifiering: riktade route/model/UI-tester omfattar Stockholm-midnattens datum-/rangeberäkning, resume-refresh-wiring, scopeinvalidering, delad Kommande request/cache, preview-paritet och källretur. Public/review-verifieraren kör alla tre vyportar, kontrollerar rubrik/CTA/tillstånd/partial-rad ovanför fast navigation och sparar varje preview-state samt destinationen efter CTA. Färska exakta bygg-, test- och screenshotresultat finns i aktuell [RENDER-REPORT.md](../../design/evidence/flow-home-checklist-filters-2026-10-20/RENDER-REPORT.md). Den browserbaserade fixture verifierar RN Web, inte native eller live RLS.

§14.16 jämförs på nytt i v5 mot panel 4: dagskortets tre segment, progress och checklistpunkter samt den tre-raders kommande-förhandsvisningen ligger nu i samma vy. Resterande observerade visuella avvikelser dokumenteras som partials, däribland fixture-bannern och Hem som aktiv bottenflik enligt routekontraktet. Korrigerad checkpointstatus 2026-10-21: lokal QA PASS; Reviewer uppskjuten till MVP-closeout. Queue `done` gäller endast denna tekniska checkpoint och innebär inte visuell panelacceptans. Live Supabase/RLS och native/iPhone/release är fortsatt NOT TESTABLE.

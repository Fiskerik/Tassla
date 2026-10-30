# ACTIVITY-MANAGER-FLOW-01 — planera rutiner och träning utan onödig hantering

Status done · plan v2 · risk H (befintligt träningsdagsvals inträdeskontroll) · bas da4ac54 · branch fix/routines-training-flow · root ensam skrivägare.

Mandat: Eriks uttryckliga omdesign 2026-10-30. Rutin-sparfelet är separat färdigt i da4ac54; användarens nya stödmodal ska vara enkel, lika stor på båda flikarna och erbjuda aktuellt steg från pågående träning eller verkligt nästa behöriga förslag. Inga worktrees. Ingen ny dependency, persondata, råd, datakolumn, notifiering, live-migration/deploy eller automatisk progression.

## Före och avsedd användarresa

UI Critic BRIEF öppnade375bilder och panel4-stödjämförelse: modalens höjdhopp cirka738/522pt, utfälld rutin cirka311pt, konkurrerande skapa/info/redigera/minus/radera/Klar och klippta formulärrader. Sju korrigeringar: stabil ram, kompakta rader med detalj, tydlig skapaåtgärd, sanningsenligt träningsval, vänsterikon+flexfält+diskret borttagning, lika stora kapselsegment och fast sparafooter. Befintlig varm yta/grön accent/44pt och osparat-/fel-/unknown-/konfliktguards bevaras. Inte helpanel4-acceptans.

Öppna hantering från Checklistor/Hem → fast centrerad90%-ram med huvud/segment/footer och scrollande innehåll. Rutiner visar ikon, namn, antal punkter och upprepning; rad öppnar en rutin i detalj, där redigera/dagsval/radera finns. En Skapa rutin-CTA, inga destruktiva knappar i översikten. Ny/redigerad rutin har enkla rader med ikon till vänster, textfält och neutral ta bort-punkt. Upprepning behåller alla befintliga val; etiketter Utan upprepning, Dagligen, Eget intervall förtydligar innebörden. Spara rutin är ensam primär handling i fast footer; tillbaka/stäng följer befintlig dirty-bekräftelse. Misslyckat sparande behåller utkast och visar nåbar fel-/retry-/konfliktåterkoppling.

Träning använder samma ram och visar valda steg kompakt, sedan faktiska pågående träningsresors aktiva steg, därefter behöriga nästa förslag utan resa. Liten befintlig dekorativ träningsbild/ikon, steg/program och kort Välj idag-handling. Ett dagsval betyder vald, inte utförd eller färdig. Okänd progression visar hämtningsfel och inga gissade förslag. Pausad resa, fel hund/version eller saknat aktivt steg blir inget förslag. Välj idag ändrar endast befintlig dagsselektion, aldrig träningsresan eller delmålen. Tillbaka till träningsfliken finns kvar som fördjupning.

## Datakoppling och minsta serverändring

fetchTrainingWorkspace returnerar redan progression/progressionState i samma hund-/versionsscope som dagslistan. Ny ren daily-training-options-väljare tar denna faktiska snapshot och dagens selectionnycklar. Pågående active/maintenance väljer exakt active_step_id från samma hund/version och sorteras först efter senaste uppdatering; pausade resor utesluts. För publicerade tillgängliga program utan resa används befintliga nextSelectableTrainingStep. Dubblett/vald/okänd/review-fixture utesluts; ingen ny läsning eller ny datalagring.

Befintlig SQL-trigger private.guard_daily_training_selection tillåter bara första äldre aktivitetsomarkerade steg, vilket kan skilja sig från faktisk pågående resa. Ny migration ersätter samma guard med en smal gren efter gemensam hundägare/lås, version-/steghörighet, tidszon/idempotens, dagens datum och publiceringskontroll: finns resa för hund+version krävs active/maintenance och exakt dess nuvarande active_step_id, annars avslag. Den sparade versionsbundna resan följer därmed samma publicerad/ägarstyrda fortsättningskontrakt som apply_training_operation; övrig legacy-/ålders-/rasurvalslogik för program utan resa är oförändrad. Hundradslåset som båda skrivvägarna redan tar serialiserar kontrollen. Ingen direktjourneyskrivning, nya grants eller RLSändring.

## Acceptans och bevis

1. Stabil modalram/segment vid375/430 och kort667/stor140%-text; overview kompakt, detaljer och redigering nåbara, input/ikoner/44pt utan horisontell klippning. Sparafooter och tangentbordssäker scroll.
2. Skapa/redigera och tydliga dagsval med bevarade dirty/unknown/conflict/återhämtning, inga dubbla submits eller falsk sparbekräftelse.
3. Ren modelltest: faktiskt aktivt steg före nästa förslag, version/hund/pausad/vald/okänd progression/legacygränser.
4. Verklig lokal PostgreSQL med faktiska migreringar och authenticated INSERT: aktuellt steg2 tillåts trots legacyförsta1, legacyfärdig aktiv övning kan väljas som resa, framtida/stale/pausad/annan ägare/version/withdrawn/annat datum nekas; ingen sessions-/milestones-/journeyändring. Legacyurval utan resa behåller gränser.
5. Riktad RNWeb-resa, faktiska SQL-probe, modelltester, full check/iOSexport/diff/path-/köaudit och Architect/Security/UICriticREVIEW/oberoende QA/Reviewer. Native tangentbord/VoiceOver/DynamicType och live Supabase är NOT TESTABLE här; två nya migreringar behöver appliceras i avsedd miljö.

## Läsunderlag / roller

AGENTS/workflow/designregler, consumerUX/iOSskills, panel4/stödskärmskontrakt och Hem-specens hanteringskontrakt, nuvarande manager/recovery, verkliga training-progression/data/SQLguard och UI Critic BRIEF. Root skriver ensam. Konfigurerade architect/security gpt-5.6-sol saknas; 6.1-sol medium används. UI Critic6.1-sol high, QA/Reviewer Luna medium. Inga råd ändras och inga nya persondataändamål införs; teknisk Security granskar behörigheter.

## Skrivvägar
- `src/components/ui/BottomSheet.tsx`
- `src/components/ui/README.md`
- `src/features/home/DailyActivityManagerSheet.tsx`
- `src/features/home/daily-training-options.ts`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/DailyChecklistScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/README.md`
- `src/theme/tokens.ts`
- `supabase/migrations/202610300002_daily_active_training_selection.sql`
- `supabase/tests/daily-active-training-selection.sql`
- `tools/verify-daily-training-selection-sql.mjs`
- `tests/daily-training-options.test.mjs`
- `tests/daily-activity-ui.test.mjs`
- `tests/daily-routine-checklist-icons.test.mjs`
- `tests/daily-checklist-screen.test.mjs`
- `tests/home-first-day.test.mjs`
- `tests/home-today.test.mjs`
- `tests/ui-modal-centering.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-activity-manager-flow.py`
- `docs/design/evidence/activity-manager-flow-01`
- `docs/design-rules.md`
- `docs/tasks/dev/ACTIVITY-MANAGER-FLOW-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`
- `docs/decisions/MASTER-LOG.md`

Nästa: Architect/Security-planreview, därefter implementation inom denna enda användarresa. Träningsmodal och kontoupplåsning får separata checkpoints.

Planreview: Architect APPROVE v1, Security plan PASS och UI Critic PROCEED. Förtydligat att negativa nya urval skiljs från befintlig identisk replay; sparad publicerad resa får fortsätta utanför ursprunglig ålders-/rasmatchning enligt befintligt träningskontrakt. Pausad/trasig resa får ingen legacyfallback. Fallbackförslag visas först när inget aktuellt resealternativ finns, och Utan upprepning beskriver återanvändbar rutin utan automatisk repetition. Pågående/okänd progression utesluter gissade dagsförslag.

Plan v2: full check efter cleanup hittade två statiska testkrav på oanvända gamla styles. daily-activity-ui ligger redan inom scope; home-today.test.mjs läggs till enbart för att testa den faktiskt återanvända IconOnlyButton/Button-ytan i stället för borttagna oanvända stilnamn. Ingen utvidgning av produktkod/risk/acceptans. Tidigare102/102 gällde före cleanup; aktuella två fel måste rättas och ny full check krävs före acceptans.

Architect APPROVE v2: testa faktisk IconOnlyButton-delegering och delade Button-ytans44pt/destruktiva stil i stället för döda lokala styles; inga produkt-/riskändringar. Teknisk Security final PASS på faktisk SQL/model/workspace-diff, med uttrycklig notering att full check efter cleanup ännu inte var grön. Den grinden inväntas korrekt.

## Slutlig implementeringscheckpoint 2026-10-30
Verklig PostgreSQL17.5/PGlite integration PASS (`node tools/verify-daily-training-selection-sql.mjs`, /tmp/tassla-manager-sql.log); basfelet reproducerat och migrationen applicerad två gånger. Nio RNWebflöden PASS inklusive375/430/kort667/CSS140%, skapande, dagsval och fel/unknown/konflikt; inga pageerrors (`after/results.json`). Public iOS JSexport PASS (/tmp/tassla-manager-ios.log). Senaste full check efter cleanup och båda visuella rättningar:102/102, typkontroller och lint PASS (/tmp/tassla-manager-check.log). Bounded cleanup tog bort endast verifierat oanvända styles/hjälpare; två tidigare dödstilsassertioner testar nu verklig delad Button.

UI Critic REVIEW såg sju huvudavvikelser rättade men hittade namnfältets bredd vid140% och Aldrig i översikten. Båda rättade inom scope, samtliga efterbilder och browserflöden omkörda. Ingen produktions-/nativeacceptans hävdas.

§14, enbart stödmodal:1 Ja ensam skapa/spara;2 Ja lika segment;3 Ja separat detalj och befintlig raderabekräftelse;4 Ja hantering i fördjupning;5 Ja frame/safeareaproxy375/430/667;6 Ja delade tokens/Button/BottomSheet;7 Ja befintliga tvåtonsikoner;8 Ja varm/grön/lila yta, befintliga kontrasttoken (native ej provat);9 Ja Vald är dagsval;10 Ja ingen falsk färdigbock;11 Ja enbart bekräftat sparande;12 Ja Utan upprepning;13 Ja kompakt hierarki;14 Ja empty/ready/failed/unknown/conflict renderade;15 Ja DOM44pt/semantik/CSS140/reducedmotionkontrakt, native tangentbord/VoiceOver/DynamicType NOT TESTABLE;16 komposition Ja, färger Ja, typografi Ja, komponentformer Ja efter minWidth0-rättning, bildspråk NOT TESTABLE som direkt supportreferens (befintlig träningsminiatyr), täthet Ja — komposit after/panel4-manager-after.png och respektive detaljbild;17 Ja lika flikar och dirtyback;18 Ja neutral rutin/träningscopy och faktisk programkoppling. Fullpanel4 eller live Supabase är inte godkänt genom denna del. Oberoende QA/Reviewer inväntas.

Slutlig UI Critic REVIEW: öppnade om140%-fält/skapad rutin, bådaFIXED, komponentformerJa; ingen kvarstående modalavvikelse. Oberoende QA PASS: egna102/102, faktiskPG17.5probe, nioRNWebflöden (evidens /tmp/tassla-manager-qa), scope52/52 ochdiffcheck. Restriktiv browserstart gav först crashpadSIGTRAP, explicitnetworkretryPASS. Native/liveNT kvarstår. FrozenReviewer inväntas.

Frozen Reviewer PASS, inga fynd. Faktiskt ändrade52 paths enligt köv2; inga utanför scope. Slutcheckpoint: lokalt verifierad användarresa; nästa separata del är fast träningshuvud och bekräftelse efter sparat pass.

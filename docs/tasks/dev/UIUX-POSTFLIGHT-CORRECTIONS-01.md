# UIUX-POSTFLIGHT-CORRECTIONS-01 — plan v4

Datum: 2026-10-17 · Status: implementing under Architect-approved plan v4.
Branch: `codex/mvp-v2-panel4-checklists-2026-10-16`.
Riskklass: M — flera befintliga formulär och huvudnavigation berörs; ingen ny data, skrivväg eller behörighet införs.

## Mål

Rätta sex konkret rapporterade TestFlight-problem utan att ändra befintliga logg-/checklistdata eller utöka produktens scope:

1. Byt loggredigerarens stora typgrid mot en kompakt ikonväljare. Den valda händelsetypen ska visas i en rund ikonknapp med nedåtpil. Öppnad lista visar varje typ med ikon och namn. Redigering börjar med händelsens sparade typ. Olyckans befintliga Kiss/Bajs-undertyper, validering och datakontrakt bevaras.
2. Rätta den vertikalt radbrutna `Redigera`-åtgärden i rutinhanteringen och den hopträngda åtgärdsraden på vikträttning. Handlingarna ska ha fungerande, begripliga och tillgängliga tryckytor vid smal telefonbredd utan att ändra spara/avbryt/radera-flödet.
3. Visa upprepningens sju veckodagar på en rad med etiketterna `Må`, `Ti`, `On`, `To`, `Fr`, `Lö`, `Sö`. Behåll fullständiga tillgänglighetsnamn och minst 44 pt tryckyta per dag.
4. Förhindra att `Öppna träning` från rutin-/aktivitetsbladet lämnar en blockerande sheet/modal eller ett låst workspace. Navigeringen ska öppna den generella träningsvyn även när inget exakt steg är valt och återvända till checklistan.
5. Ersätt synliga `Kalender`-/`Välj tid`-knappar i alla delade datum-/tidsfält med kalender-/klockikoner. Detta omfattar Logg, Vikt (ny och rättning), Hälsologg, Planerad hälsa, hundprofil och notisinställningar där respektive fält används. Behåll fältens synliga sammanhangsetiketter och tillgängliga namn. Ikonerna ska minska trängsel utan att datumvärde eller kontroll klipps vid telefonbredd eller stor text.
6. Återställ huvudflikssvep: vänster går till nästa huvudflik och höger till föregående. Vertikal scroll, inbäddade horisontella gester, dirty-draft-skydd och första/sista flikens gräns ska fungera.

Det tidigare förslaget om fasbaserad åldersnavigation förblir en senare beslutspunkt och ingår inte här.

## Källor och avgränsning

- Skärmbilder i den aktuella användarvändan dokumenterar TestFlight-resultaten. Bildtext är referensmaterial, inte separat scope.
- Kanoniska regler: `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md`, `docs/dev/workflow.md`, `.agents/skills/tassla-consumer-ux/SKILL.md`.
- Bevara `LOG_ENTRY_TYPES`, loggmodellens sparade typ och `accidentKinds`; byt bara typväljarnas presentation och tillgänglig interaktion.
- Bevara datumformatet `ÅÅÅÅ-MM-DD`, lokal tidssemantik och delade DatePickerField-/TimePickerField-kontrakt.
- Bevara rutinernas repeat_weekdays, anchorDate och spar-/dirty-state; ändra endast kontrollernas responsiva presentation.
- Bevara befintliga `navigateMainTab`-guards och träningskällornas scope-/publiceringsgrindar. Ingen navigation får kringgå formulärens dirty guard.
- Inga schema-/RPC-/migrations-/RLS-/datapurpose-/dependency-/notifieringsändringar.

## Avsedd implementation

1. Läs befintliga ikonmappningar och komponent-/designkontrakt. Skapa en återanvändbar loggtyp-dropdown i `LogEventEditor` med ikon, namn, vald markering, öppna/stänga, touch och skärmläsarsemantik. Den sparade typen är initialt vald; befintlig accident-undersektion visas oförändrad när typen kräver den.
2. Ändra de delade datum-/tidsfälten i `AppPrimitives` så varje konsument får kalender-/klockikon. Konsumentinventering: `WeightScreen` (skapa/rätta vikt), `HealthHistoryScreen`, `PlannedHealthScreen` (datum, tid och påminnelsetid), `LogScreen`, `EditDogProfileScreen` (datum) och `NotificationSettingsScreen` (tid). Behåll `accessibilityLabel`, formuläretiketter, datum-/tidsvärden och 44 pt mål. Säkerställ att varje berörd vy får användbart utrymme och ingen overflow vid 375/430 pt eller stor text.
3. Anpassa `DailyActivityManagerSheet` så Redigera-knappen inte krymper sin text vertikalt; välj responsiv radbrytning eller ikonknapp med full accessible label enligt befintligt komponentmönster. Sätt veckodagskontrollerna i en jämnbred rad med korta synliga etiketter och långa accessible labels.
4. Anpassa `WeightScreen`-rättningsåtgärdernas spacing och smalbreddslayout. Behåll separata spara, avbryt och radera-handlingar, samma radering/sparning och befintliga bekräftelser. Kontrollera att knappar inte överlappar eller klipps.
5. Spåra `onGoTraining` från managerbladet genom `DailyChecklistScreen`, `HomeScreen` och `ProductWorkspace`. Lägg till en valfri `onDismiss`-callback på delade `BottomSheet` och invänta att managerbladets modal stängs innan navigering till Träning. Behåll samma sheet-instans monterad när `visible` går från sant till falskt i båda manageranvändningarna. Callback och fallback ska använda en gemensam one-shot ref, avbryta fallback när dismissal bekräftas och ignorera upprepade tryck. Starta fallbacken först efter att `visible=false` har renderats; på plattformar utan dismiss-callback ska den vänta 450 ms, längre än den befintliga slideövergången. Fallbacken används bara för den väntande träningsövergången. Övriga sheet-konsumenters beteende ska förbli oförändrat.
6. Diagnostisera huvudgestens responder-ägarskap i `MainSwipeNavigation` tillsammans med `AppScreen`/innehållets scroll. Justera endast riktningsvillkorad responderförhandling så horisontella svep når navigationen utan att vertikal scroll eller inbäddade horisontella kontroller stjäls. Ingen ny gestdependency.
7. Uppdatera endast befintliga guider och checkpointdokument för de ändrade kontrollerna och rapportera native/live begränsningar separat.

## Acceptanskriterier

1. Loggredigering visar aktuell sparad typ som rund ikon + nedåtpil. Öppnad väljare visar alla befintliga typer med ikon och namn; ett val uppdaterar formulärets typ. Olycksundertyper och deras validering består. Skärmläsaren får typnamn och öppet/stängt/valt läge.
2. Alla konsumenter av delade datum-/tidsfält (Logg, Vikt skapa/rätta, Hälsologg, Planerad hälsa, hundprofil och notisinställningar) visar kalender-/klockikon i stället för knapptexten `Kalender`/`Välj tid`; synliga etiketter och skärmläsarnamn finns kvar. Ingen rad eller text klipps vid 375/430 pt och stor text.
3. Rutinens `Redigera` syns horisontellt och kan aktiveras vid 375/430 pt. Vikträttningens spara-/avbryt-/radera-knappar har synlig mellanrymd och fungerar vid smal bredd. Sju veckodagar ligger på en rad med angivna kortnamn, ≥44 pt mål, fullständigt skärmläsarnamn och oförändrad val-/sparlogik.
4. Tryck på `Öppna träning` från Hem eller checklistans rutinhantering stänger managerbladets native-modal innan vybyte och ger en responsiv träningsvy utan kvarvarande modal som blockerar skärmen. Både callback och fallback kan navigera högst en gång; managerbladet förblir monterat tills övergången är klar. Saknat exakt steg öppnar generella träningen utan ändrad status. Retur går till ursprungssidan (Hem respektive checklista). Fel-/laddningsresultat visar fortsatt tydliga kontroller. Övriga BottomSheet-användare påverkas inte.
5. Svep vänster/höger mellan Hem, Logg, Träning, Kunskap och Mer byter högst en flik per gest; kanterna är no-op. Vertikal scroll, underordnade horisontella gester och huvudflikens befintliga dirty-draft-confirmation fungerar.
6. Ingen ändring i datakälla, sparsemantik, hund-/kontoscope, publicerings-/vuxenpolicy eller fasbaserad åldersnavigation.
7. Visuell evidens och rapport bedömer separat layout, ikoner, touchmål, stor text samt kvarvarande native-/TestFlight-verifiering enligt design-rules §14.

## Skrivvägar

- `src/components/AppPrimitives.tsx`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/health/WeightScreen.tsx`
- `src/components/ui/BottomSheet.tsx`
- `src/features/home/DailyActivityManagerSheet.tsx`
- `src/features/home/DailyChecklistScreen.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/components/ui/MainSwipeNavigation.tsx`
- `src/features/home/README.md`
- `src/features/puppy-log/README.md`
- `docs/plans/UIUX-POSTFLIGHT-CORRECTIONS-01-ux-spec.md`
- `src/features/health/README.md`
- `docs/tasks/dev/UIUX-POSTFLIGHT-CORRECTIONS-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/postflight-fixes/`

## Verifiering

- Denna ändringsrunda får inte lägga till eller köra tester. Befintliga automatiska regressioner för logg, hälsa, checklistor och navigation lämnas orörda; körning kräver separat uttrycklig verifieringsbegäran.
- Kör endast `python tools/dev_flow.py validate` och `git diff --check` för uppgiftsmetadata och whitespace.
- Efter implementation ska manuella TestFlight-kontrollerna täcka datum-/tidsikoner i samtliga listade konsumenter, vikträttningens knappar, loggtyp-dropdown, rutinrader/veckodagar, träningens retur och vänster/höger huvudflikssvep. Fysisk iOS/Android, VoiceOver och systemtext är inte verifierade lokalt.
- Live Supabase/RLS ingår inte och får inte rapporteras som verifierat av lokala fixturer.

Planen påstår inga PASS-resultat i förväg. Inget commit/push ingår i denna taskplan.

## Arkitektgranskning

- Architect v1: CHANGES — saknades vikträttningens åtgärdsrad och fullständig konsumentinventering för delade datum-/tidsfält; inga kodändringar tillåtna.
- Architect v2: APPROVE — täcker alla sex rapporterade problem samt vikträttningens åtgärdsrad och samtliga delade datum-/tidsfält. Ingen schema-, data- eller behörighetsändring; native/TestFlight-kontroller återstår. Inget separat Security-godkännande krävs inom denna avgränsning.
- Architect v3: CHANGES — modal-dismiss-återkopplingen behöver bevara managerinstansen i både Hem och Checklista, specificera exactly-once-handoff samt avbryta och tidsätta plattformsfallbacken.
- Architect v4: APPROVE — båda manageranvändningarna behåller sheet-instansen, dismiss/fallback delar exactly-once-guard, fallback startar efter `visible=false` och gäller bara träningshandoff. 450 ms är en plattformsfallback; iOS/Android måste kontrolleras i TestFlight.

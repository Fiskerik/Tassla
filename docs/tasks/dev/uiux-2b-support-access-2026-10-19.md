# UIUX-2B-SUPPORT-ACCESS-01 — tillgänglighet i stödvyer

Datum: 2026-10-19 · Version 1.6 · Status: lokal 2b-checkpoint klar efter QA PASS och Reviewer PASS. Typecheck/lint/diff/queue och public/review RN Web-verifiering PASS; native iPhone-kontroller återstår manuellt.

## Mandat och mål

Del av Eriks uttryckliga beställning av paketen 2a, 2b, 3, 4 och 5. Paket 2a är lokal kodcheckpoint klar efter oberoende QA och Reviewer PASS. 2b omfattar stödvyerna Rutiner, Notiser, Hälsa/Vikt, Profil och Tassla-pass. Målet är att viktiga kontroller och formulär fortsatt fungerar vid stor text, smal skärm och tangentbordsinmatning utan ändrad persistens, validering eller produktbetydelse. Gör en systematisk inventering av synliga knapptexter, med särskilt fokus på 140 %-läget: korta redundanta etiketter eller ersätt dem med tydliga ikoner när text annars tar oproportionerligt mycket skärmyta. Behåll textskalan, begripligheten och fullständiga tillgängliga namn.

Den här granskningen använder syntetiska RN Web-fixtures. Den gula bannern ”Syntetiskt granskningsläge” är en harness-markering och får inte hamna i produkt-UI. FontScale 1.4 är en layoutproxy, inte iOS Dynamic Type-certifiering.

## Inventering och avgränsade fynd

- 375 px/140 %-renderingen visar att delade datum-/tidsfält klipper kalender-/tidsknappar horisontellt. Fälten används bland annat i Vikt, planerad hälsa, Notiser och Logg. Eriks tidigare instruktion kräver kalender- respektive klockikon i stället för synlig text på dessa delade knappar överallt. Behåll full skärmläsartext och minst 44×44 pt tryckyta. Stor text/smal vy får använda mer vertikal plats om layouten annars klipper värde eller ikon.
- Den nya 375 px/140 %-renderingen av Loggs redigeringsark visar att datumvärdet klipps när Datum och Tid ligger sida vid sida. Introducera stapling när fontScale > 1.2; standardskalan (1.0) behåller raden och 1.4 staplar de två fältgrupperna. Behåll samma fältvärden och delade picker-knappar.
- Hälsans utförda-händelseform och Hemmets rutinhanterare öppnar formulär i `BottomSheet`, men sätter inte `keyboardAware`. Komponentens stöd finns redan. Aktivera det för dessa två formulärflöden och låt formulärinnehållet scrolla så tangentbordet inte täcker fält eller primärknapp.
- Hemmets rutintextfält har `returnKeyType="done"` men saknar explicit tangentbordshantering. `Done` ska stänga tangentbordet; sparning, validering och utkastflöde förblir oförändrade.
- I rutinkortets kompakta rad bryts texten ”Ta bort rutin” över flera rader. Visa endast soptunneikonen; behåll minst 44×44 pt tryckyta, tydligt destruktivt utseende, och tillgängligt namn som anger att den namngivna rutinen tas bort. Befintlig bekräftelse och raderingslogik ändras inte.
- Vikthistorikens spara-/avbrytåtgärder ligger alltid i en horisontell rad. Stora texter och smal vy kräver staplade åtgärder; standardskalan behåller nuvarande layout.
- Knapparnas synliga etiketter inventeras systematiskt i alla fem stödresorna vid standard och 140 %. Vid 140 % ska varje knapp granskas för onödig kontext, upprepning av närliggande rubrik/innehåll och etiketter som radbryts eller tar oproportionerligt med skärmyta. Korta till en tydlig handling eller använd en välkänd ikon när sammanhanget gör den omedelbart begriplig. Dokumentera per skärm ursprunglig etikett, vald kort etikett/ikon eller beslut att behålla, motiv och fullständigt tillgängligt namn i render-rapporten. Behåll läsbar fontstorlek; trunkera aldrig och korta inte så att innebörden blir oklar. Om fontskalestyrd variation inte stöds tillförlitligt av befintliga komponenter, använd en tydlig kompakt etikett i alla skalor i stället för att lägga till en skör specialdetektion.
- Den delade datum-/tidsändringen påverkar flera stödvyer. NotificationSettings, PlannedHealth, EditDogProfile och Passport ska ingå i knappinventering och regressionsrendering; varje ändring där måste följa samma begränsade kontrakt.

## Användarresa och synligt resultat

Ägaren öppnar en av stödvyerna, läser dess formulär/val och kan använda alla handlingar. I stort textläge tar korta, tydliga knappetiketter och ikoner mindre plats så att innehåll och formulär inte trängs undan; layouten får växa eller stapla relaterade knappar. Fokus/inmatning leder inte till ett dolt Spara/Klar, fel eller osäkert sparresultat ligger kvar enligt befintligt kontrakt, och data sparas endast via befintliga callbacks.

## QA-korrigering 2 — plan delta v1.6

Reviewer fann att sparade review-renderingar av Passport-valsheetet (375×844 och 430×844) och rutinhateraren (375×844 standard/140 %) bara visar en tunn kant av den primära `Klar`-knappen; 375×667 kan visa den. v1.5:s render-rapport påstod felaktigt att footern var synlig. Inga nya data-/skrivflödesfel hittades.

Plan delta: ge `BottomSheet` en uttrycklig `pinPrimaryAction`-variant för de två berörda flödena Passport-avsnittsval och Hemmets rutinhanterare. Den varianten begränsar arket till viewporthöjd och låter innehållsdelen scrolla separat så `Klar` alltid ligger helt inom skärmen. `keyboardAware` fortsätter styra tangentbordets beteende separat. Ingen global ändring av andra sheets, ingen ändring av callbacks, sparning, dismissal, data eller rutinsemantik. Architect och Critic ska godkänna denna delplan före kod.

Nya acceptanskriterier: vid 375×667, 375×844 och 430×844, standard och 140 %-CSS-proxy, ska `Klar` vara helt synlig och tryckbar i både Passport och rutinhanteraren; lista/formulärinnehåll får scrolla oberoende. Spara nya public- och review-bilder och ersätt felaktiga observationer. Bevara manual NOT TESTABLE-gränser för native Dynamic Type/tangentbord.

### Reviewstatus

- Architect: APPROVE v1.5 breakpoint; APPROVE v1.6 bounded footer delta 2026-10-19.
- Critic: PROCEED v1.5; PROCEED v1.6 footer delta 2026-10-19.
- Oberoende QA v1.5: PASS på etiketter/tillgänglighet/kod; footerbevis senare blockerade av Reviewer och körs om efter korrigering.
- Reviewer v1.5: BLOCK på Passport-/rutinsheetens klippta `Klar`-footer; fynd dokumenterat nedan.
- Oberoende QA v1.6: PASS — samtliga 24 public/review captures visar `Klar` helt inom viewporten; rutinens scroll och redigerarens nåbara `Spara` verifierades. Static checks PASS; native tester förblir NOT TESTABLE.

### Reviewer blocker 2026-10-19

Reviewer BLOCK: Passport 375×844/430×844 och rutinhanterarens 375×844-renderingar visar bara en smal grön kant av den fasta `Klar`-knappen; befintlig RENDER-REPORT hävdade motsatsen. v1.5 är inte stängd. Övriga kod-/tillgänglighetsgranskningar är godkända.

### v1.6 implementation och återverifiering

Den blockerade opt-in-layouten är implementerad i `BottomSheet` med `pinPrimaryAction`, aktiverad enbart för Passport-avsnittsval och Hemmets rutinhanterare. `keyboardAware` är oförändrat. Nya public/review captures vid 375×667, 375×844 och 430×844, standard/140 %-proxy, visar hela `Klar`-knappen. Review-rutinlistan rullades till botten vid alla storlekar; `Klar` låg kvar i viewporten. Redigerarens `Spara` nåddes i 375×667 standard/140 %-proxy. Typecheck, riktad ESLint inklusive `BottomSheet.tsx`, diff-check och UTF-8 queue validation PASS. Oberoende QA v1.6 PASS; Reviewer v1.6 PASS — den opt-in footerfixen, captures, scroll, editoråtgärder och bevarade callbacks/datagränser godkända. Lokal checkpoint klar; ingen commit/push.

## Tillåtna skrivvägar

- `src/components/ui/BottomSheet.tsx` (endast opt-in bounded/pinned-primary-action layout)
- `src/components/AppPrimitives.tsx`
- `src/components/README.md`
- `src/features/home/DailyActivityManagerSheet.tsx`
- `src/features/home/README.md`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/health/HealthScreen.tsx`
- `src/features/health/HealthHistoryScreen.tsx`
- `src/features/health/PlannedHealthScreen.tsx`
- `src/features/health/WeightScreen.tsx`
- `src/features/health/README.md`
- `src/features/notifications/NotificationSettingsScreen.tsx`
- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/passport/PassportScreen.tsx`
- `docs/tasks/dev/uiux-2a-to-5-2026-10-19.md`
- `docs/tasks/dev/uiux-2b-support-access-2026-10-19.md`
- `docs/plans/UIUX-2B-SUPPORT-ACCESS-2026-10-19-ux-spec.md`
- `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/uiux-2b-support-access-2026-10-19/public/`, `review/` och `RENDER-REPORT.md`

Alla fem stödresor får renderas och ändras inom den här avgränsade tillgänglighets-/knapptextplanen. Ändra endast konkreta layout- eller labelproblem som visas av renderingen. En kodändring som påverkar produktbetydelse, datakontrakt eller annan skärmfamilj kräver ny planreview.

## Skyddat

Supabase/RPC/schema/RLS, datum-/tidsformat och validering, hälsodata och medicinska texter, notifieringsbehörighet/schemaläggning, profilens hund-/kontoägarskap, Tassla-passets innehåll/export, navigering, callbackordning och spar-/retry-/delete-semantik. Ändra inte global textskala, global Button-komponent eller produktcopy utanför knappetiketter. Inga dependencies eller testsviter tillkommer.

## Acceptans och avgränsad verifiering

1. `DatePickerField` visar kalenderikon och `TimePickerField` klockikon i stället för de synliga orden Kalender/Välj tid på alla skärmar som använder de delade komponenterna. Skärmläsarnamn behåller full handling och tryckytan är minst 44×44 pt.
2. Vid standardskala behåller datum-/tidsfält sin befintliga kompakta struktur och funktion.
3. Vid 375/430 px och 140 %-proxy syns datum-/tidsvärde och hela kalender-/klockikonen; ingen horisontell overflow eller touchmål utanför viewport. Både `DatePickerField` och `TimePickerField` provas i relevanta stödvyer och Logg. I Loggs redigeringsark staplas Datum och Tid när `fontScale > 1.2` så hela `ÅÅÅÅ-MM-DD` ryms; verifiera att standard 1.0 behåller en rad och 1.4 staplar fälten.
4. Viktredigering vid 375 px/140 % visar nåbara Spara, Avbryt och Radera; Spara/Avbryt staplas där det behövs. Standardskalan behåller befintligt arrangemang.
5. Rutinkortet visar soptunneikon utan synlig ”Ta bort rutin”-text, med tryckyta minst 44×44 pt och skärmläsarnamn som innehåller den specifika rutinens namn. Bekräftelse och radering har identiskt beteende som före ändringen.
6. Systematisk knappinventering täcker alla fem stödresor vid standard och 140 % och redovisas per skärm i render-rapporten. Vid 140 % identifieras etiketter som tar oproportionerligt med skärmyta; redundans kortas eller ersätts med tydlig ikon där sammanhanget räcker. Ingen text krymps eller trunkeras. Ikon-only-knappar har minst 44×44 pt tryckyta och fullständiga skärmläsarnamn. Inga etiketter kortas om handlingen blir tvetydig. Standardskalan behåller nuvarande etiketter om inventeringen inte visar ett lika tydligt förbättringsskäl.
7. Rutinens create/edit sheet och hälsohistorikens formulär renderas vid 375×667/140 %. Forminnehåll kan scrollas, fokus/knappar nås och webbsimulering visar att inget fel-state eller draft försvinner. Tangentbordets faktiska iOS-beteende redovisas separat som NOT TESTABLE här.
8. Public/review-rendering av Notiser, planerad Hälsa, Profil och Tassla-pass bekräftar stor-textlayout och knappinventering; ändra bara verifierade problem enligt kontraktet.
9. Public/review-fixtures skiljs tydligt från varandra; granskningsbannern presenteras bara av harnessen.
10. `pnpm typecheck`, riktad ESLint för tillåtna kodfiler inklusive BottomSheet och LogScreen, `git diff --check`, `python tools/dev_flow.py validate` och befintliga RN Web-renderflöden passerar. Inga testsviter körs.
11. QA och oberoende Reviewer godkänner begränsad diff och evidens. Kort iPhone-checklista täcker faktisk Dynamic Type och att iOS-tangentbordet lämnar primärknappen nåbar.
12. Passport- och rutinsheetens opt-in `pinPrimaryAction` håller primärknappen helt synlig vid 375×667, 375×844 och 430×844 standard/140%-proxy medan sheet-innehåll scrollar separat; övriga sheets påverkas inte.

## Risk och öppna gränser

Risk M: befintliga formulär blir mer tillgängliga men ska behålla sina användarresor och skrivkontrakt. Ingen Security-review krävs eftersom ingen dataåtkomst, persistens eller behörighet ändras. Webbrender kan inte bevisa faktisk iOS Dynamic Type, VoiceOver eller tangentbordsgeometri.

## Gate

Ingen Logg-kod för datum/tidsraden före Architect APPROVE och Critic PROCEED för delta version 1.5; ingen BottomSheet-kod för footerproblemet före separat Architect APPROVE och Critic PROCEED för v1.6. v1.5 specificerar brytpunkten `fontScale > 1.2`, med standard 1.0 på en rad och 1.4 staplad. Övriga godkända 2b-delar från v1.4 fortsätter inom oförändrad scope. Efter godkännande: queue `planned → ready → implementing → qa → review → done`. Vid QA PASS krävs separat Reviewer PASS och dokumenterad lokal checkpoint. Ingen commit/push i denna checkpoint eftersom arbetsbranchen innehåller separata aktiva paket.

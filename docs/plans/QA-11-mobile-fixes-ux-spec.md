# QA-11 – Mobilkorrigeringar

Datum: 2026-10-11. Plan v3.2. Mandat: Eriks fem mobilbilder och uttryckliga korrigeringsbeställning i chatten.

Användaruppgift: se vald tid för planerade och genomförda vaccinationer/veterinärbesök på Hem och Hälsa; välja tid med tydlig bekräftelse; hitta samma bakåtpil på undersidor; få luftig sparåterkoppling. Hundfiguren tas bort enligt ägarbeslut.

## Kontrakt och omfattning

1. Planerad händelsetid får separat nullable `due_time` (HH:mm), eftersom befintlig `reminder_minutes` är en påminnelsetid. Fältet Tid (valfri) visas även när notiser är av. Hem/Hälsa visar due_time som tid; legacy reminder_minutes visas endast med explicit etikett Påminnelse HH:mm, aldrig som vårdtid. Genomförd tid är befintlig occurred_time. Inga befintliga påminnelsetider konverteras till händelsetider. Ny migration, samma RLS/granter/CAS som övriga planfält; import av gammal null-tid säkert. Befintlig påminnelsetid och notifieringsfunktion kvarstår oberoende.
2. Tidsväljaren får tillfälligt val och en tydlig Bekräfta tid-knapp. Stäng/X avbryter tillfälliga ändringar; bekräftelse för över tiden till formuläret. Formulärets Spara sparar händelsen. Manuell textinmatning finns kvar.
3. Textbaserade navigationsknappar ersätts av delad AppBar Back/chevron, med befintlig tillbakahandling och skärmläsarlabel. Inga dubbla tillbakaknappar.
4. Alla Toast-platser får gemensamt tokenstyrt vertikalt avstånd utan tomma mellanrum när feedbacken är dold. Bekräftelse-/fel-/ångrasemantik bevaras.
5. DogMascot tas bort från Logg och Träning; komponent/asset kan behållas oanvända tills senare beslut. Testkontrakt uppdateras till ägarbeslutet.
6. Undersök hälsoläsningen. Om endast tidskolumnen saknas kan äldre historik läsas utan den och anges med null-tid; inga andra läsfel maskeras. Skrivning av vald tid kräver migrationen och får aldrig ge falskt Sparat. Hem visar kort förståelig återförsöksfeedback, skild från vanliga händelser.

Filer: `src/components/AppPrimitives.tsx`, `src/components/ui/Toast.tsx`, `src/features/home/HomeScreen.tsx`, `HomeCarousel.tsx`, `ProductWorkspace.tsx`, `src/features/health/HealthScreen.tsx`, `PlannedHealthScreen.tsx`, `src/data/workspace-data.ts`, navigationsrader i onboarding/notifications/account/knowledge, `LogScreen.tsx`, `PublishedTrainingScreen.tsx`, berörda README och meningsfulla befintliga tester.

Skyddat: snabb loggningens ett-tryck-kontrakt, RLS, CAS, konto-/hundidentitet, innehållspublicering, dependencies och kliniska rekommendationer. Ingen migration körs eller faktisk data delas.

## Kontroller och checkpoint

Typkontroll/lint/fokuserade regressioner och `pnpm check`; avgränsad cleanup; separat QA/Reviewer samt säkerhetsgranskning av läsfallback. Visuell granskning liten/stor bredd och stor text, alla feedbacklägen. Saknad native-rendering anges NOT TESTABLE. Dokumenterad checkpoint före nästa checklisteslice. Ingen push beställd i detta meddelande.

Granskningar 2026-10-11: Architect APPROVE v3.1 (qa11_architect), Critic PROCEED v2 (qa11_critic; v3.1 scopepreciseringar utan beteendeändring). Implementation startad; ingen visuell/native eller live SQL-verifiering påstås.

## Exakta tillstånd v2

- Hem healthHistory error: kompakt text Tidigare hälsohändelser kunde inte visas med Försök igen, separat från händelser, ingen auto-dismiss. Befintliga loggar/planer visas. Retry skickar befintlig history retry-handler.
- Toast: tokenstyrd marginVertical spacing.md i monterad synlig/utgående yta; dold komponent lämnar ingen yta. Befintliga success-texter/2,5 s, error/unsure persistent med Retry och undo-kontrakt bevaras.
- Tidsmodal: öppna kopierar formulärvärde till draft; val i listan ändrar bara draft. Bekräfta tid är disabled om annat än HH:mm 00:00–23:59; tomt är giltigt endast som rensa valfri tid. Label Välj en tid eller skriv HH:mm syns. Bekräftelse stänger tangentbord/modal och återger värdet i formuläret. X/system-back avbryter draft. Knappen markerar valet, inte sparning av händelsen; ingen Sparat-toast ges. Disabled fält får inte öppna modal. Bekräfta tid har tydlig skärmläsarlabel, selected-läge på tider, scroll och fast knapp utanför listan.
- Ytterligare filer: planned-health datakontrakt/CAS, migration `supabase/migrations/202610110001_planned_health_event_time.sql`, befintliga planhälsotester och SQL-probe. Inga migrationskörningar.
- Critic v1 PROCEED WITH CHANGES: påminnelse får inte presenteras som bokad tid; v2 skiljer fälten och preciserar återkoppling/modal.

## Precisering v3

due_time är time(0) without time zone NULL. Ingår i record/operation/changes, SELECT, insert/update, normalisering, readback, konfliktsnapshot och update/delete CAS; null via IS NULL, vald tid HH:mm:00. Endast nya insert(due_time)/update(due_time) grants, RLS oförändrad. Notifieringsurval/sortering fortsätter med reminder_minutes. Alla gamla testfixtures får korrekt null.

Fallback gäller endast vanlig fetchHealthHistory och endast kod 42703/PGRST204 med fältspecifikt occurred_time-fel. Andra SELECT utesluter kolumnen, kompletterar null före samma validering. Lookup/mutation använder fortsatt full schema. Andra fel får ingen fallback.

Home dagsplan får time due_time; legacy påminnelse får explicit etikett. Health Översikt/Kommande/Datum har passerat och PlannedHealth sparade planer visar tid. HomeCarousel visar också Tid HH:mm för aktuell plan. Home history error är separat text + direkt onRetryHealthHistory handler från ProductWorkspace, inte ListRow.

Back ändras i PlannedHealth (Planerade händelser), EditDogProfile (Hundprofil), NotificationSettings (Påminnelser), AccountSettings (Konto), BetaInfo (Information), DraftContentPreview (Innehållsutkast), DogProfilePage i ProductWorkspace (Hundprofil) och Knowledge detail (befintlig Läsning AppBar; redundant bottom-back tas bort). Befintliga PageHeading ersätts av korta beskrivningar, inte dubbla huvudrubriker. AppBar får disabled + accessibilityState och actionLabel för exakt Tillbaka till X-label.

Modal backdrop gör inget; X/system-back avbryter. Reducerad rörelse väljer none istället för slide. Tom draft får Bekräfta tid och rensar valfri tid; andra ogiltiga värden disabled. Alla konsumenter validerar sitt formulär före slutligt Spara.

Checkpoint-bas HOME-TIME-01/UI-09 är faktiskt commit/push 617fb67, automatiska kontroller PASS (412 pass, 1 skip i pre-push; 35 lintvarningar). Visuell acceptans kvarstår, men deras gamla skrivägarskap är frigjort för uttryckliga QA-11-korrigeringar. Release- och könotering uppdateras.

Tre sekventiella delsteg med dokumenterad checkpoint i rapport: A data/due_time/läsfallback/API tester; B TimePicker/Toast/AppBar och navigation; C Home/Health/maskotborttagning och regressioner. QA på komplett diff efter delstegen. Tester: planned-health.test.mjs, planned-health-time.test.mjs, planned-health-feedback.test.mjs, health-history.test.mjs, dog-mascot-policy.test.mjs, toast-compact-policy.test.mjs, app-screen-ux.test.mjs samt ny home-timeline regression vid behov. README: data, components, home, health, puppy-log, training. Mobilbilder är chattbilagor 2026-10-11: 1 planad vaccinationstid, 2 textback, 3 ihoptryckt vikttoast, 4 maskot, 5 history-error. Ingen separat bildfil tillgänglig lokalt; reviewer ska inte hävda visuell jämförelse utan bildåtkomst. Huvudhandling formulär=Spara, tidsmodal=Bekräfta tid, Hem=Logga nu, översikter=Lägg till händelse; primärt synlig info är post, datum/tid och valfri notering.

V3.1 scopeprecisering: PreviewProfileScreen ingår också: dess Tillbaka hem ersätts med AppBar Back (Hundprofil). SQL-probe supabase/tests/planned-health.sql ingår med owner due_time write/read, annan ägare och anonym nekad åtkomst. Koordinator äger docs/plans/QA-11-mobile-fixes-ux-spec.md, docs/tasks/dev/queue.json, docs/tasks/dev/rapport.md, docs/releases/HOME-TIME-01.md, docs/releases/UI-09.md, docs/releases/HISTORY-2026.md och docs/design/QA-11 (evidens/checklista). Dessa paths är separat koordinatorcheckpoint, inte implementer write paths. Detta är planförtydliganden efter Architect v3, ingen ändring av godkänt beteende.


## V3.2 – korrigeringsplan för renderad QA

Reviewer BLOCK på aktuell diff, inte överprövat. Korrigering inom PlannedHealthScreen scope: hero copy Planera vaccinationer och veterinärbesök. Sparade kort ersätter två stora Ändra/Ta bort-knappar med en liten ellipsknapp (44pt) och tillgänglig etikett Åtgärder för [typ datum]. Menyn använder befintlig RN Alert med Ändra / Ta bort / Avbryt; Ta bort öppnar befintlig uttrycklig raderingsbekräftelse och disabled gäller under blocked. Delete ligger därmed bakom menyn. Ingen ny komponent/dependency. Påminnelse av utan vald påminnelsetid visas inte på vanliga rader; kvarvarande gammal påminnelsetid får tydlig Påminnelse HH:mm och av-indikator när relevant. Händelsetid förblir separat. Visual QA körs om inklusive meny/edit/delete/cancel och 375/430/stor text. Ny Architect/Critic och slutligt QA/Reviewer beslut krävs. Första korrigeringsförsök för dessa renderade fynd.

V3.2 slutbeslut: ArchitectAPPROVE, CriticPROCEED, oberoende QA lokal GODKÄND och ReviewerPASS på rättad diff. SecurityPASSA. Ködone och hållbar workingtreecheckpoint 2026-10-11; native/liveSQL inte godkända genom detta.

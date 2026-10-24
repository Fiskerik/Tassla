# UI-R02-04 — UX-specifikation för panelhelhet

**Version:** 7 · **Datum:** 2026-10-23 · **Status:** v7 implementerad och lokalt QA/Reviewer/Security-godkänd; UI03-checkpoint 13f48bf uppfylld
**Mandat:** actionplan 2026-10-23 §6; GAP-rev02 G03/G04/G06/G07/G11/G12/G13/G15/G16/G17/G18 och konsumentgranskning för G03/G04/G06/G07.
**Aktuell referens:** `vision_rev02.jpg`, `docs/design-rules.md` och `docs/design/vision-rev02-screen-contracts.md`.

## Användarmål

Hundägaren ska känna igen samma typ av val, detaljhuvud och kontextuella åtgärd mellan stödvyer. Vanliga vyval ska vara snabba och kompakta; destruktiv återställning ska fortfarande vara tydlig och kräva uttrycklig bekräftelse. En informationsikon ska öppna samma befintliga förklaring. Publicerat innehåll och notisbehörighet får inte antas utifrån hur UI:t ser ut.

## Jämförelse och avsedd korrigering

| Referenselement / GAP | Nuvarande konkret skillnad | Komponent / korrigering | Acceptans |
|---|---|---|---|
| Rev02:s små tydliga segmentval, G11 | `PublishedTrainingScreen`, `FAQScreen` och `InsightsScreen` bygger var sin kontroll med olika semantik/täthet | Delade `Tabs`, befintliga `rev02-segmented`-token; frivilligt namn för tablist | Samma val och stabila valda-/screen-reader-statusar, utan textklippning |
| Panel 7: separata FAQ- och Checklistor-vägar, G15 | Kunskap använder `training` för Checklistor och `sleep`-måne för FAQ | Ionicons `checklist`-/`help-circle`-symboler på befintlig lila Kunskapsyta | Symbolen uttrycker destinationen; kortets synliga titel och route kvarstår |
| Kunskapsdetalj och underflik, G12 | Standard-AppBar lägger en extra Tassla-rad före innehållet | `AppBar variant="compact"`, befintliga korrekt namngivna returhandlingar | Samma navigering med en kompakt titelrad |
| Panel 6 reset/info | Fullbreddsinfo-knapp och fullbredds destructive reset-knapp ligger efter programstegen; reset använder plattforms-`Alert` | En kompakt infohandling och en 44×44 Ionicons-resetknapp; delad namngiven `Dialog` | Resetikon öppnar dialog med exakt programnamn/konsekvens; cancel gör inget; confirm anropar samma handler |
| G13 påminnelser | Intro + separat informationsrubrik + textknapp; två stora inramade valkort | Ett ikonmål med befintlig information; grupperade semantiska checkboxrader med diskreta avdelare | Mindre yta, fullständiga valnamn/konsekvenser och samma app-/OS-separation |
| Panel 8 | Periodväljaren har egen segmentimplementation, medan Insikter-rutt och SQL är separat levererade | Återanvänd `Tabs`; granska existerande periodväg och källkod utan ny datalogik | Väljer rätt befintlig period och status; läs migrationen `202610220002_dog_event_insights_read.sql`; kör `supabase/tests/dog-event-insights-read.sql` endast i lämplig syntetisk dev-miljö; ingen sovtid eller live RLS påstås utan faktisk prob |
| Kunskaps bildkort | Nya branchens 200/132 pt-bildlayout är redan implementerad men behöver aktuell rev02-jämförelse | Behåll ID-/versionstabilt bildmanifest och bildkomponenter | Samma guider och bilder öppnas som före; §14 dokumenterar faktiska avvikelser |
| G17 public FAQ/checklistor | Publikt innehåll saknas och review-exempel är gated | Ingen UI-förbikoppling; behåll sant public tomläge och synlig reviewmarkering | Ingen osakgranskad text blir publik; public content guard passerar |
| Ägarens visuella granskning av Träning, Kunskap och Påminnelser | Träningskort hade ojämn höjd; guidekort bar upprepade sammanfattningar; förklarande notiscopy tog plats | Ge rekommendationskorten samma höjd även när rubriker radbryts, låt huvudrubriken väga tyngre än programetiketten, behåll bildkort utan teasertext och lägg förklaringen bakom en kompakt informationsikon | Full rubriktext förblir synlig; lika kort- och bildmått verifieras i kort och lång rubrik; förklaringen öppnas på begäran |
| Fyllnadstext i render-fixtures | Skärmbilder visade test-/layoutfraser som inte liknar färdig produktcopy | Ersätt sådan synlig fixturetext med kort, naturlig granskningscopy och håll granskningsstatusen kompakt | Ingen fillerfras visas på någon sparad UI04-/Träningsbild; reviewgrinden och nödvändiga fältledtrådar finns kvar |
| Previewcopy på fler sidor | Home/Logg/profil och vissa rev02-harnessar visar långa testetiketter, ”Exempelhund”, ”Syntetisk ras 01” eller fixturekällor som fyller skärmen | Rensa synlig utfyllnad i aktiva preview-/granskningsvyer och alla åtta panels nuvarande RN Web-fixture. Fyllda syntetiska person-/hunduppgifter märks en gång per vy som `Granskningsdata` eller `Förhandsvisning · exempeldata`; ta bort fejkade källor i stället för att hitta på nya | Alla inkluderade public-/reviewbilder saknar placeholderfraser och fejk-källor. Riktiga tom-/fel-/behörighetstillstånd och content-/bildstatusar bevaras |

## Resor och tillstånd

### Träning — återställ program

- **Ingång:** öppna ett program med minst en bekräftad markering.
- **Idle:** kort infohandling och ikonknapp syns i programmets sammanfattade åtgärdsrad; reset finns endast när progress finns.
- **Bekräftelse:** dialog namnger programmet och säger att dess markeringar tas bort. Inget ändras när dialogen öppnas.
- **Avbryt/stäng:** dialogen stängs; urval, progress och programversion är oförändrade.
- **Bekräfta:** samma befintliga `onResetProgram(program)` exakt en gång för publicerat innehåll, samma lokala `resetReviewTrainingProgram` bara för review-exempel. Ingen annan progress ändras.
- **Stale/busy:** reset-dialogen är bunden till program-ID och försvinner om programmets objekt/vy inte längre finns. Single-flight ref låses synkront före callback, dialogen stängs först; knappen är avstängd när befintlig `busyStepKey` finns. Ingen ny reset/delete/reload-handler eller atomisk resetförväntan.
- **Tillgänglighet:** resetknapp minst 44×44 pt, namn `Börja om med {program}`, hint om bekräftelsen. Dialogens knappar har fulla synliga namn.

### Val och information

- FAQ/Träning/Insikter: vald flik markeras både visuellt och med React Native selected state; urvalet styr befintlig vy/period. Hela svenska namn ligger kvar, vid behov horisontell scroll.
- Påminnelser: checkbox är en knapp med `checked` och `disabled`; korta rubriker kompletteras av befintlig förklarande text. `Spara` ger inte lyckat tillstånd förrän befintlig callback bekräftar det. Fel bevarar val och tid.
- Påminnelser: checkboxtryck ändrar endast lokalt edit-draft. `Spara` anropar bara `onSave`; OS-knappen anropar bara `onRequestPermission`. Inget appval öppnar systemdialog; denied/unknown-status ändrar inte sparade val. Val av träningspåminnelse bevarar nuvarande beteende att även aktivera huvudvalet vid behov.
- OS-behörighet: separat avsnitt och separat knapp; appval får inte utlösa iOS/Android systemdialog automatiskt. Permissionbesked är oförändrat.
- Information: ikon har tillgängligt namn, öppnar befintlig `InfoModal`, stängning ändrar inget sparat val.
- FAQ: public state förblir tom tills publicerade data finns. Review-data visas endast med reviewflagga och den korta etiketten `Granskningsinnehåll`.

## Scope och skydd

Produktfiler för den utökade copy-rundan är `HomeScreen.tsx`, Home-previewfilerna, `TrainingScreen.tsx` (endast befintlig testbanner), `LogScreen.tsx` (efter UI-R02-03 QA/Reviewer, endast Exempel/Testpost-etiketter), `KnowledgeScreen.tsx`, `FAQScreen.tsx`, `PublishedTrainingScreen.tsx`, `NotificationSettingsScreen.tsx`, `InsightsScreen.tsx`, `AuthCallbackView.tsx` och `ComponentGalleryScreen.tsx`. `ProductWorkspace.tsx` är uttryckligen utanför scope, utan copyändringar. `LogScreen.tsx` och `tools/visual-check/app.tsx` är skrivskyddade tills UI-R02-03 har QA/Reviewer-checkpoint; efteråt får de endast copy-fixtureuppdateringar och UI-R02-04:s slutliga QA/Reviewer granskar integrerad Panel 5-copy.

Aktuella fixture-/renderfiler är `tools/visual-check/vision-r02-home-panels-app.tsx` och `ui-r02-04-app.tsx` samt efter UI-R02-03-checkpoint `tools/visual-check/app.tsx`, med berörda verifierare. I Kunskapens innehållsfiler får endast synlig fixtureutfyllnad tas bort och befintliga ID-/versionskopplade foton behållas; checklistan får en semantisk ikon. Inga nya råd, källor, faktafält, datakällor, dataändamål, RLS-regler, behörigheter eller dependencies införs. `Standardbild`, `AI-genererat innehåll`, sanna fel/tomlägen och användbara inmatningsledtrådar bevaras. Övrig data-/routekod granskas men ändras inte. V6 lägger endast till ikonpresentation i konto/kennelkod och samma kontextuella ikonfamilj i nedan namngivna callers; deras handlers och säkerhetskontrakt är frysta.

Valda repo-skills: `tassla-consumer-ux` och `mobile-ios-design`. Aktuell branchens andra komponenter provas som konsumenter; äldre planer före 16 oktober är endast historik och får inte ersätta rev02-kontrakt. `TrainingScreen`- och fixturecopy får inte lägga till hundtränings-/hälsoråd; befintlig reviewtext förblir review-gated.

Fältledtrådar som ”Till exempel 4,25” och format som `ÅÅÅÅ-MM-DD` finns endast i tomma inmatningar för att hjälpa användaren fylla rätt värde; de räknas inte som visnings-/kortutfyllnad och tas inte bort. Exempeldata får inte presenteras som publicerade källor. Gransknings- och previewmarkeringar hålls korta men sanningsenliga. Copyändringarna skapar inga nya fakta om hundträning eller hälsa.

## Visuell/funktionell acceptans

- Faktiska produktkomponenter i public- och reviewkonfiguration, 375×844, 430×844, 375×667 och 140 % CSS-textproxy.
- Jämför bredvid respektive rev02-panel/stödskärmskontrakt och dokumentera §14 Ja/Nej/Ej tillämpligt/NOT TESTABLE, särskilt 1, 3, 5, 6, 7, 9, 12–18.
- Kontrollera tabval, FAQ-context, programinfo/reset (cancel/confirm), notisval + save/failure/permission, route-returer där den befintliga harnessen kan följa dem, och bildtilldelning utan att fixture blir produktionsbevis.
- Rendera inkluderade sidfamiljer och skanna synlig copy efter placeholderfraser: ingen ”Detta är ett exempel”, ”Exempelhund”, ”Syntetisk ras …”, ”layoutgranskning” eller lång teknisk fixture-banner. Förifylld syntetisk fixturedata ska ha en enda tydlig `Granskningsdata`/`Förhandsvisning · exempeldata`-status; status för review-content och genererade bilder bevaras. Funktionella, korta inmatningsledtrådar i tomma fält är undantagna.
- Lokal automatiserad check och Expo iOS JS-export är separata från native iOS, live Supabase/RLS och signerad Codemagic-build.
- Slutavstämningen omfattar evidens för panel 1–8: A03/panel 4 behandlas enligt ägarens verifiering och befintliga kvarvarande begränsningar; UI-R02-03/panel 5 har lokal QA/Reviewer-checkpoint i `13f48bf`; full panelacceptans förblir separat. Ingen tidigare accepterad implementation återöppnas utan konkret regression.
- Publicerade FAQ/checklistor, sömnintervall och RPC-åtkomst rapporteras endast från faktiskt tillgänglig miljö. Ingen ny innehålls- eller dataacceptans antas.

## Granskningsutfall och risk

Plan v1 fick Architect CHANGES (risk ska vara H och RPC-proben explicit) samt UX Critic PROCEED WITH CHANGES (slutmatrisen ska nämna panel 4 och 5). V2 fick Architect APPROVE och UX Critic PROCEED. Security pre-review v2 gav APPROVE WITH CONDITIONS: exakt befintlig reset-handler/programscope, lokal reset endast i reviewläge, dialogens stale/single-flight-skydd, separata save-/OS-callbacks samt frozen SQL och säker syntetisk rollback-prob. Dessa krav skrevs in i v3. Plan v5 första reviewvarv gav Architect CHANGES och UX Critic PROCEED WITH CHANGES. Efter de scope-/fixtureändringarna gav Architect **APPROVE** och UX Critic **PROCEED** för reviderad plan v5. UI-R02-04 står blockerad i kön tills UI-R02-03:s QA/Reviewer-checkpoint är klar. Ingen kod utanför de godkända skrivvägarna får ingå.


## Ägartillägg v6 — enhetliga ikonhandlingar och huvudmeny

Ägaren avvisar radbruten Kunskap samt skilda delete/edit/undo-uttryck. Menyn visar alla fem hela namn på en rad vid 320/375/430 pt, normal och 140 % text. Flexvikter vid alla skalor: Hem 0,8333; Logg 0,8333; Träning 1,2; Kunskap 1,3; Mer 0,8333. Minst 44×44 pt, fulla accessibility-namn/selected-state och samma routes. Ingen meny-scroll eller förkortning.

Nav-etiketterna får numberOfLines=1 och maxFontSizeMultiplier=1.4. Detta är ett uttryckligt rationellt implementationsbeslut inom ägarens tidigare mandat att fatta beslut självständigt: alla fem fasta huvudflikar måste rymmas med läsbara hela namn. Huvudinnehåll fortsätter skala normalt. Vid större native Dynamic Type stannar just menyetiketter på högst 140 %, medan VoiceOver behåller fulla namn, roller och vald status. Nytt fysiskt iOS-prov över 140 % redovisas i telefonlistan som NOT TESTABLE här; ingen ny automatisk telefon-grind införs.

Raderingens ingång är alltid röd trash-outline; redigering använder create-outline (ruta med penna); Ångra använder arrow-undo-outline (svängpil). Den gemensamma Button-familjen ger soptunnan röd symbol/ram och samma 44 pt-yta. Befintliga icon-callers återanvänds; kvarvarande textbaserade kontextuella delete/edit-entrypoints migreras. Bekräftelsedialogerna behåller tydlig konsekvens och textad Radera/Avbryt. Endast presentation ändras: konto behåller sin bekräftelse före callback, ProfileScreen rensar lokal osparad kennelkod och befintlig lokal pending referral i SecureStore utan att ta bort en serverkoppling och EditDogProfileScreen använder sin befintliga saveAttribution-väg för kennelkoppling. Varje befintlig callback, validering, busy/disabled och säkerhetsflöde bevaras. Att ta bort en rutin från dagens lista behåller minus eftersom rutinen finns kvar; full radering använder soptunnan. Programreset är en separat refresh-handling, inte Ångra.

Tillkommande skrivytor: src/components/ui/{BottomNav,Button,Toast,ActionMenu,DailyActivityItem}.tsx, src/features/home/DailyActivityManagerSheet.tsx, src/features/health/PlannedHealthScreen.tsx (endast edit-ikon efter UI03-checkpoint), src/features/onboarding/{ProfileScreen,EditDogProfileScreen}.tsx (endast kennelkodens/kennelkopplingens raderingsikon), src/features/account/AccountSettingsScreen.tsx (endast delete-entry-presentation), samt befintliga riktade tester/verifierare. Alla mutations-, konto-, auth-, route-, data- och bekräftelsekontrakt bevaras. UI03-grinden för Logg/delad harness består.

Browserkontroll mäter full textbredd och enradshöjd, minst 44 pt-ytor och samma tabval vid normal/140 %, samt röd trash, rätt edit/undo-symbol och oförändrade bekräftelse-/callback-resor. Security granskar konto-/raderingsdiffen. Övrig v5-plan är oförändrad.

V6-triggeracceptans: varje ikonbaserad delete/edit/undo har kontextuellt fullständigt tillgänglighetsnamn (handling + objekt där relevant), korrekt roll och minst 44×44 pt. Busy/disabled bevaras. Konto bekräftar före samma callback; kennelkodens lokala rensning och kennelkopplingens befintliga saveAttribution använder samma tidigare callbacks/busy utan ny dataoperation. Toast undo använder samma callback en gång. Fokuserade tester i ui-r02-04-panelhelhet, ui-actions-rows, account-delete, profile-screen-policy och planned-health-feedback samt visuella trigger-/toast-/konto-/kennelkontroller krävs.

V6 preciserad kodinventering: även EditDogProfileScreen har en synlig Ta bort kennelkoppling-label när befintlig kod töms; endast den befintliga knappens variant/ikon/kontextnamn ändras, samma saveAttribution, busy/disabled och validering. ProfileScreen Ta bort kennelkälla rensar lokal formulärkod och befintlig lokal pending referral i SecureStore, inte en serverkoppling; dess befintliga direkta callback ändras inte. Endast AccountSettings har den befintliga kontoraderingsbekräftelsen. src/components/README.md uppdateras för den gemensamma ikon-/navpolicyn.

Aktuell beroendestatus: UI-R02-03 QA/Reviewer/Security PASS och durable commit 13f48bf. Den tidigare grinden för LogScreen/delad harness är uppfylld; historiska v5-väntestatusar återges endast som historik.

V6 slutplan: Architect APPROVE; Critic PROCEED WITH CHANGES i dokumentstatusar som nu är korrigerade. Inga materiella UX-invändningar återstår.


## V7 — konkreta regressionsfynd i GAP-slutrundan, 2026-10-24

Detta är en begränsad korrigering inom G04/G06 och Tränings återställningskontrakt; inga nya produktfunktioner tillkommer.

1. **Loggens ägda bekräftelser:** `LogScreen` monterar delete- och discard-dialoger villkorligt inuti redigerarens befintliga `BottomSheet`, så att de presenteras ovanpå sin ägande modal på web/iOS. Redigeraren behåller samma instans/draft och alla befintliga ask/confirm/cancel/discard-handlers. Avbryt ska gå att trycka utan force och återge exakt osparad text. Radering går fortsatt bara via samma confirmDelete. Ingen adapter/write, recovery- eller datumlogik ändras.
2. **Ogiltig träningsbekräftelse avslutas:** när valt program/vy/fingerprint försvinner, eller en fokuserad stegvy tar över, rensas `resetTarget`. Samma program som återkommer får inte återöppna den gamla dialogen. Befintlig fingerprintvalidering och synkront single-flight-skydd kvarstår. Riktad browserkontroll tar bort och återför samma program, samt ändrar och återställer dess version/progress; gammal dialog förblir stängd med noll callbacks.

Skrivytor utöver v6:s presentation: endast `LogScreen.tsx` modalplacering och `PublishedTrainingScreen.tsx` lokala bekräftelsestate; befintliga UI04 tester/harness/verifierare, `tests/log-screen-policy.test.mjs`, `tools/visual-check/verify-logga-flow.py` (vid relevant verifieraranpassning), modul-README och denna evidens. Inga ändringar av `ProductWorkspace`, data/schema/RPC/RLS/auth/notislogik.

Acceptans: faktisk klickbar Avbryt/Radera i loggedit efter animationssettling på 375×667/844; Avbryt behåller draft, bekräfta raderar bara vald syntetisk post. Dirty-close-dialog går samma väg och behåller/kastar enligt befintligt beslut. Reset remove→restore samt change→restore återöppnar inte dialog eller anropar callback. `pnpm check`, public iOS-export, content guard och färsk browsermatris upprepas. Arkitekt/Critic granskar denna avgränsning före edit; QA/Reviewer/Security granskar fryst korrigering. Tidigare v6-testresultat behålls som historik tills omprov är klart.

V7 slutverifiering 2026-10-24: Architect APPROVE, Critic PROCEED, QA PASS, Reviewer PASS, Security APPROVE. Ny granskning av fryst kod och faktisk klick-/stale-återkomst täcks av UI04:s VERIFICATION.md.

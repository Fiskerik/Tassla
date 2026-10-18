# UIUX-REVAMP-R4A-RELEVANCE-01 — Gemensam relevansgrind

Plan v16 · 2026-10-17 · UX v13 · Status: `done` (implementation klar; oberoende QA v3, delta-QA och Reviewer recheck PASS).

## Mandat och risk

Erik har uttryckligen godkänt nuvarande R3c-läge för fortsatt arbete och beställt R4a–R4c samt R5–R7 i samma leverans. R3c står nu `blocked` medan funktionell och visuell QA pausas tills R4a stabiliserat de överlappande filerna; inga R3c-funktionella, native-, live-RLS- eller visuella QA-resultat påstås. Denna checkpoint omsätter V2-01 i en fail-closed runtimegrind före bredare innehållsresor. Den lägger inte till vuxenråd eller nya innehållsytor. Eriks önskemål är en samlad slutlig commit och push efter R7; varje delpaket får ändå full lokal QA, oberoende review och dokumenterad checkpoint före nästa del.

Riskklass **M**: val av innehållsyta, navigering och träningshandlingars behörighet ändras. Ingen auth, konto-/hundscope, beständig datamodell, skrivväg, klinisk vägledning eller vuxengrant ändras. Befintliga ägar-/hundscopeade läsningar och träningsprogress ska bevaras. Architect- och Critic-planreview krävs; Product och Dog Expert har lämnat underlag. Security är inte separat grind för denna avgränsade plan eftersom auth, scope och skrivkontrakt inte ändras.

**Beroendehantering:** `FLOW-HOME-CHECKLIST-UPCOMING-01` flyttades från QA till `blocked` för att pausa verifieringen medan R4a arbetar i överlappande workspace-/checklistfiler. R3c:s funktionella och visuella QA är fortfarande öppen och ingen PASS hävdas. R4a granskar och testar den kombinerade koden mot R3c:s acceptance där delade filer ändras; R3c återupptas efter R4a-checkpointen.

## Granskningsbeslut

- Product: CHANGES för positiva ytmappningar; godkänner fail-closed grund, tomma automatiska rekommendationer och endast tre kontextuella funktionshjälpsytor.
- Dog Expert: versioner och åldersfönster stämmer med V2-01. Ålder är eligibility, inte relevans; ett hundråd/program kräver dessutom valt behov eller sammanhang. Öppen maxålder ger inte vuxengodkännande. Okänd ålder är varken valp, unghund eller vuxen.
- Architect: APPROVE för exakt plan/UX/queue v11 efter verifierad korrigering av UX-v11-referensen i köacceptansen.
- Critic: PROCEED för exakt plan/UX/queue v11; inga kvarvarande produktinvändningar.
- Ny granskning krävs för plan/queue v12 eftersom den lägger till modul-README och de två data-/workspace-regressionstesterna i det konkreta skrivomfånget. UX v11 och produktbeteendet ändras inte.
- Plan/queue v12 fick Critic PROCEED. Architect begärde att kön registrerar den redan påbörjade v11-implementationen som `implementing` i stället för `ready`. Full `pnpm check` visade dessutom tre utdaterade testharnessar mot nya R4a-/R3c-kontrakt; v13 lägger till deras testfiler som explicita skrivvägar. UX v11 och runtimekontraktet ändras inte. Färsk Architect/Critic-review av exakt v13 krävs innan dessa testfiler ändras.
- Full `pnpm check` redovisar 5 misslyckade testfall, men de motsvarar 4 unika assertioner i 3 filer: två i `profile-edit.test.mjs`, en i `training-activity-date.test.mjs`, och en health-tap-undercheck i `notifications.test.mjs` plus dess aggregerande föräldratest. Inget femte produktfel finns i testresultatet.
- Plan/queue v13 fick Critic PROCEED. Architect fann två synkfel: aktuell R3c-status och spegling av testfixture-begränsningen i queue acceptance. Plan/queue v14 rättar dessa status-/acceptansreferenser; färsk Architect/Critic-review krävs före teständring.
- R4a oberoende QA v1: riktade tester och `pnpm check` PASS (563/563; tre lintvarningar). Visuell review QA BLOCK: 375 px-fixturen döljer genvägarna; UX v11 lovar FAQ/hälsokarusell som inte finns på aktiv Home; §14-checklistan saknas. Plan/UX/queue v15/v12 rättar därför Home-kontraktet: endast Home-grantat innehåll fyller rådskortet, separat tränings-`nextStep` blir inte reservråd, tomläget undviker dubblerad checklistehandling och standard-fixturens tre genvägar ska rymmas. `HomeCarousel.tsx` tas bort från R4a-scope eftersom den är dormant. Ny Architect/Critic-review krävs före kod- och harnessändringar.
- Architect plan v16 / UX v13: APPROVE. Critic plan v16 / UX v13: PROCEED. Both reviewed the exact synchronized plan/UX/queue revision. R4a implementation may proceed within the approved write paths; no runtime code was changed by the reviewers.
- Architect v15/UX v12: CHANGES. Canonical Home age must remain in both identity and active Just nu card; specify the empty-card geometry within the 112 pt budget; suppress the daily checklist link only when confirmed empty and the replacement card action is rendered/enabled; include cleanup-only scope for the existing `HomeCarousel.tsx` diff; synchronize queue refs; add release-guard/Knowledge review checks; and verify both Home and Training empty-state CTAs at runtime. Critic v15/UX v12: CHANGES for the stale queue acceptance reference and cleanup scope mismatch. Plan/UX/queue v16/v13 records each correction. Fresh exact Architect/Critic review is required before these implementation/harness changes.


## Versions- och ytkontrakt

Selector måste använda publicerad status, exakt aktuell publicerad version, ålder, ras, målgrupp, behov/sammanhang och visningsyta. Ett yttre grant gäller endast exakt `content_version.id`; slug, tidigare version, innehållstyp eller databasordning ger inget implicit grant. En äldre tillåten version får inte visas om en nyare publicerad version för samma innehåll saknar grant. Okända framtida versioner nekas.

| Innehåll / version | Tillåten yta i R4a | Grind och uttryckligt nekande |
|---|---|---|
| `before-homecoming` v1 `62000000-0000-4000-8000-000000000001` | Ingen | Draft/onboarding-only; nekas vanlig feed och alla normala ytor. |
| `first-week` v1 `...0002` | Ingen i nuläget | 8–12 veckor räcker inte; nylig hemkomst saknar runtime-signal. Även senare användning behöver separat godkänd yta/prioritet. |
| `daily-log-routines` v1 `...0003` | Endast Logg/rutiner: funktionshjälp | Neutral apphjälp, inte hundråd; döljs från Hem, För dig, Artiklar och rekommendationer. |
| `handling-guide` v1 `...0004` | Ingen | 13–16 veckor är oförändrat eligibility-fönster men ger inte ett skärmgrant. |
| `environment-checklist` v1 `...0005` | Ingen | 17–26 veckor; detta är inte checklistkällan i befintliga `PuppyChecklistScreen`. |
| `being-alone-guide` v1 `...0006` | Ingen | 27–52 veckor; yta/kontext saknar uttryckligt grant. |
| `weight-history-guide` v1 `...0007` | Endast Hälsa > Vikt: funktionshjälp | Appinstruktion; ingen lämplig-vikt- eller hälsobedömning. |
| `health-records-guide` v1 `...0008` | Endast Hälsa > Genomfört/lägg till: funktionshjälp | Appinstruktion för registrering; inget schema- eller kliniskt påstående. |
| `handling-program` v1 `...0009` | Ingen | Valt behov/kontext saknas; `Alla övningar` är inte i sig ett valt behov. Ingen Home-rekommendation. |
| `environment-program` v1 `...0010` | Ingen | Samma behovs-/ytgrind; ingen Home-rekommendation. |
| `being-alone-program` v1 `...0011` | Ingen | Samma grind; vuxentillämpning kräver dessutom exakt versionsgranskning av målgrupp, progression, begränsningar och hänvisning. |

För versionerna `...0004`–`...0006` och `...0009`–`...0011` gäller dessutom: ingen vuxenanvändning utan versionsspecifikt Dog Expert-godkännande. R4a skapar inte en behovsväljare och ger inte nya ytmappningar. De tre funktionshjälpsversionerna `...0003`, `...0007`, `...0008` är åldersoberoende apphjälp och får visas även när hundens ålder är okänd; detta betyder aldrig att hunden är valp eller vuxen.

## Runtimekontrakt för urval och tillstånd

Implementera följande stängda typer (ingen schemaändring):

```ts
type ContentSurface = 'home_advice' | 'knowledge_for_you' | 'knowledge_articles' | 'training_recommended' | 'training_all' | 'log_help' | 'weight_help' | 'health_help';
type ContentContext = 'dog_advice' | 'training_recommendation' | 'log_routines' | 'weight_recording' | 'health_recording';
type ContentAudience = 'dog_owner' | 'puppy_owner' | 'adult_dog_owner';
type ContentNeed = 'handling' | 'environment' | 'being_alone' | null;
type ContentGrant = { surface: ContentSurface; context: ContentContext; audience: ContentAudience; need: ContentNeed; priority: number; ageAgnostic: boolean };
type ContentPolicy = { contentVersionId: string; grants: readonly ContentGrant[] }; // keyed by content_versions.id
type ContentRequest = { surface: ContentSurface; context: ContentContext; audience: ContentAudience; dogId: string; breedId: string; ageWeeks: number | null; need: ContentNeed };
type ContentSelection<T> = { status: 'eligible'; items: readonly T[] } | { status: 'empty'; items: readonly [] } | { status: 'unknown'; reason: 'missing_age' | 'invalid_request' | 'unmapped_version'; items: readonly [] };
type ContentRead<T> = { status: 'loading' } | { status: 'error'; retryable: true } | ContentSelection<T>;
```

`ContentPolicy[]` är en liten in-code policytabell nycklad på exakt `contentVersionId` (`content_versions.id`), inte slug, content ID, ordning eller content type. Den känner igen v1: `62000000-0000-4000-8000-000000000001` till och med `62000000-0000-4000-8000-000000000011`. Alla kända v1 utom `62000000-0000-4000-8000-000000000003`, `62000000-0000-4000-8000-000000000007`, `62000000-0000-4000-8000-000000000008` har `grants: []`. De tre positiva exakta grantarna är: `62000000-0000-4000-8000-000000000003` → (`log_help`, `log_routines`, `dog_owner`, need null, priority 1, ageAgnostic true); `62000000-0000-4000-8000-000000000007` → (`weight_help`, `weight_recording`, `dog_owner`, need null, priority 1, ageAgnostic true); `62000000-0000-4000-8000-000000000008` → (`health_help`, `health_recording`, `dog_owner`, need null, priority 1, ageAgnostic true). Inga hundråds-, knowledge-feed- eller träningsgrants finns. Okänt framtida version-ID saknar policy och ger `unknown/unmapped_version`; känt versions-ID utan grant för request ger `empty`.

Den enda selector-signaturen är `selectContentForSurface<T extends PublishedContent>(versions, request: ContentRequest): ContentSelection<T>`. Den verifierar alla requestfält; saknad/ogiltig surface, context, audience, dogId, breedId eller need ger `unknown/invalid_request`. Saknad ålder ger `unknown/missing_age` när requesten avser hundråd/träning; för de tre explicit åldersoberoende funktionshjälpsgrantarna kan `ageWeeks: null` godkännas. Först identifieras senaste publicerade version per `content_id`, därefter kontrolleras exakt version-ID-policy och matchande surface/context/audience och exakt `need`; sedan sorteras alla tillåtna kandidater med lägst numerisk `priority` först och lexikografiskt `contentVersionId` som stabil tie-breaker. Priority är rangordning, inte ett requestfält. Ålders-/raseligibility kontrolleras enligt versionskontraktet. En äldre grant kan aldrig falla tillbaka efter en nyare publicerad version. Resultaten per Home, Knowledge och Training surface beräknas separat; konsumenter får inte återtolka en gemensam åldersfiltrerad lista.

`ContentRead` separerar loader från selector: före läsning `loading`; lyckad källa med kandidater `eligible`; lyckad källa utan tillåtna kandidater `empty`; ofullständig/okänd request eller okänt version-ID `unknown` med exakt reason; fetch-, timeout- eller schemafel `error` med retry. Fel eller stale cache får aldrig presenteras som bekräftat `empty`. UI-copy för `missing_age`: “Lägg till födelsedatum för åldersbaserade råd.” med handling “Redigera hundprofil”. Copy för `invalid_request`/`unmapped_version`: “Vi kan inte välja innehåll för den här vyn just nu.” med handling “Öppna dagens checklista”. Bara `error` visar retry. Unknown-details och interna ID:n exponeras inte för användaren.

Träningsurvalet skiljer aktuellt grantade program från endast historisk progress. Nekad/äldre progress får bära internt endast exakt `versionId` och verifierat `completedCount`; ägarvyn allowlistar endast neutral copy “Tidigare program · X steg finns sparade”, aldrig rå UUID. Historikprojection saknar titel, body, källor, steg-ID:n, stegtexter och mutationcallbacks. Äldre progress återaktiverar inte innehåll när nyare publicerad version saknar grant.

## Beteende och acceptans

1. **Hem:** den aktiva Home följer `HOME-REV02-visual-ux-specen`: identitet/ålder, ett `Just nu`-rådkort, dagslista och tre genvägar. Bara `homeAdvice`-selector kan fylla rådskortet; ett separat tränings-`nextStep` får aldrig vara reservråd när Home-grant saknas (nuvarande träningsurval har inga grants). Hemidentiteten och aktiva `Just nu`-kortet visar samma hela automatiska ålder när den finns. Bekräftat tomläge visar rådtexten “Det finns inget publicerat råd för den här vyn just nu.” och den tydligt betonade handlingen “Öppna dagens checklista” i en enda sammanhängande korttryckyta med minst 44 pt träffyta och utan nästlad knapp. Rubrik, åldersrad och råd/handling ryms inom kortets 112 pt-budget vid 375×844 och 430×844, med 12 pt kortpaddingar och utan klippt text; kombinerad råd-/handlingstext får högst två rader i standardfixturen. Budgeten är 22 pt rubrik + 18 pt ålder + 40 pt två brödtextrader + högst 6 pt mellanrum + 24 pt vertikal padding + 2 pt kontur = 112 pt. Accessibilitetslabel anger kortets ämne, ålder när tillgänglig och checklistehandling. Dagslistans “Visa dagens checklista” döljs endast när Home-urvalet är bekräftat `empty` och ersättningskortets aktiverade checklistahandling faktiskt renderas; loading/error/unknown/eligible och saknad handling döljer den inte. `Hantera`, alla dagsrader, progress och `Visa alla` vid fler än fem rader bevaras. Home-CTA går till dagens checklista och dess befintliga tillbakahandling återgår till Hem. FAQ och planerad hälsa förblir på sina separata befintliga destinationer; inget Home-carousel-beteende påstås. Med review-standard-fixturens fem dagsrader ska samtliga tre genvägskort vara fullt synliga minst 16 pt ovanför bottenmenyn vid 375×844 och 430×844.
2. **Kunskap:** `För dig` och `Artiklar` får var sitt selector-resultat. Med nuvarande grants visas ett sant tomläge: “Det finns inga publicerade råd för den här vyn just nu.” / “Det finns inga publicerade artiklar i den här vyn just nu.” Nästa handling från båda är “Öppna checklistor” till den befintliga Checklistor-fliken. Ingen retry visas för ett bekräftat tomt urval; retry visas bara för `error`. Checklistor och FAQ förblir separata och oförändrade.
3. **Funktionshjälp:** Logg/rutiner, Hälsa > Vikt och Hälsa > Genomfört/lägg till visar endast respektive exakt grantad version. Kontrollerna ligger utanför formulär/sheets. Tillbaka bevarar valt datum respektive undertab och utkast.
4. **Träning:** `Rekommenderat` och `Alla övningar` använder varsitt explicit selector-resultat. Eftersom inga programgrants finns, visas “Det finns inga publicerade träningsprogram att visa här just nu.” samt “Öppna dagens checklista”. Fel visar retry; okänt urval visar inte ett tomt-program-besked. Inget nytt program eller påhittad rekommendation tillkommer.
5. **Progress:** grantad progress ligger kvar på exakt hund/version/steg. När programmet saknar aktuellt grant är intern historik bär endast exakt versionId och verifierat antal; ägarcopy visar “Tidigare program · X steg finns sparade”, aldrig rå UUID eller program-/stegtext eller öppna/fortsätt/markera/avmarkera/reset. En äldre progresspost kan inte trumfa senaste publicerade versionens grant. Markering betyder inte hundens färdighet.
6. **Spärrat dagligt val:** Hem och Checklista visar valet som otillgängligt/okänt, aldrig klart eller tomt. Ägaren kan öppna “Hantera rutiner” och välja “Ta bort idag” för att ta bort endast `dog_daily_training_selections`-raden. Befintlig readback/pending/failed/unknown-feedback återanvänds. `training_progress` lämnas orörd. När borttagningen är bekräftad uppdateras Hem och Checklista tillsammans; vid unknown visas senaste bekräftade status och retry.
7. **Version/fel:** äldre grant kan inte kringgå nyare publicerad versions nekade grant. Källa som inte kan läsas är `error`, inte `empty`. Saknad/okänd ålder nekar hundråd/träningsprogram men inte de tre åldersoberoende funktionshjälpsgrantsen. Okänt surface/context ger `unknown`.
8. Ingen migration, RLS/RPC/grant, dependency, datainsamling, innehållspublicering, phase/calendar wheel UI, FAQ-ändring, sökning/filter, bildmetadata, behovsväljare eller vuxenrekommendation ingår. Tomlägen uppfyller inte MVP-acceptans för valp-/vuxenråd.
9. Berörda befintliga testharnessar följer de implementerade gränssnitten: profilens derived-content-effect använder `fetchContentSurfaceCatalog`; träningsdatumtestet skiljer helperns datumprojektion från R4a:s nekade opublicerade/grantlösa program; R3c:s notification-testfixture levererar dess redan införda valda-plan-state/callbacks. Inget av dessa teständringar vidgar runtimebeteendet. Review-fixturen har ingen separat Home-träningsfallback; testerna bekräftar både Home- och Training-empty-CTA genom deras riktiga callbacks, destinationen dagens checklista och den befintliga återgången till Hem. `tests/knowledge-review-content.test.mjs` och `tests/content-release-guard.test.mjs` ingår i riktad verifiering.
10. R3c (`FLOW-HOME-CHECKLIST-UPCOMING-01`) är `blocked` med funktionell/visuell QA pausad tills R4a checkpoint; denna R4a-checkpoint markerar inte R3c PASS.


## Exakt skrivomfång

- `docs/tasks/dev/UIUX-REVAMP-R4A-RELEVANCE-01.md`
- `docs/plans/UIUX-REVAMP-R4A-RELEVANCE-01-ux-spec.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `src/content/select-content.ts`
- `src/content/README.md`
- `src/data/workspace-data.ts`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/HomeCarousel.tsx` (endast återställning av den redan befintliga enradiga diffen; ingen ny Home-beteendefunktion, och acceptans är att filen inte längre har diff)
- `src/features/home/daily-activity-model.ts`
- `src/features/home/DailyChecklistScreen.tsx`
- `src/features/home/DailyActivityManagerSheet.tsx`
- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/health/HealthScreen.tsx`
- `src/features/health/WeightScreen.tsx`
- `src/features/home/README.md`
- `src/features/knowledge/README.md`
- `src/features/training/README.md`
- `src/features/puppy-log/README.md`
- `src/features/health/README.md`
- `docs/design/evidence/vision-rev02/content/relevance/R4A-RELEVANCE-01/`
- `tests/content-delivery.test.mjs`
- `tests/content-release-guard.test.mjs`
- `tests/daily-activity-ui.test.mjs`
- `tests/daily-activity-data.test.mjs`
- `tests/workspace-data.test.mjs`
- `tests/profile-edit.test.mjs`
- `tests/training-activity-date.test.mjs`
- `tests/notifications.test.mjs` (endast integrationstestets fixture för R3c:s redan implementerade planöppning)
- `tests/knowledge-review-content.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `docs/decisions/MASTER-LOG.md` (endast verifierad closeout)

Utanför scope: allt annat, särskilt `HealthHistoryScreen.tsx`, server/database-migrations, andra dagliga källor, feature-schema och releasefiler. Hjälpknappar placeras utanför editorn; ingen editorstate behöver flyttas eller återskapas.


## Kontroller och öppna bevis

Efter implementation: riktad selector-/daily-choice-regression (inklusive `tests/workspace-data.test.mjs`, `tests/daily-activity-data.test.mjs`, `tests/profile-edit.test.mjs`, `tests/training-activity-date.test.mjs`, `tests/content-release-guard.test.mjs`, `tests/knowledge-review-content.test.mjs` och det begränsade R3c-fixturet i `tests/notifications.test.mjs`), `pnpm check`, `python tools/dev_flow.py validate`, `git diff --check`, statisk granskning av varje konsument mot grantregistret och dokumentationsgranskning av `src/content/README.md`. QA verifierar loading/ready/empty/error/unknown, latest-version-deny, spärrad progress och borttagning av dagsval utan progressförlust. Spara separata public/review-renderbevis för Home tområd och full standard-fixtur med fem dagsrader, Knowledge För dig/Artiklar, Training rekommenderat/alla/Min historik, de tre funktionshjälpsingångarna och återgång samt denied-daily-choice recovery. Verifiera att Home- och Training-empty-CTA faktiskt öppnar dagens checklista och att befintlig återgång går till Hem. Verifiera fullständigt synliga Home-genvägar med minst 16 pt marginal vid 375/430×844; 667 px höjd och 140 % text får scrolla och dokumenteras separat. §14 granskas mot faktisk render, inte kod; punkterna 1–18 får Ja/Nej/Ej tillämpligt och punkt 16 sex delbedömningar med bildhänvisningar. Native och live Supabase/RLS hålls separat och markeras NOT TESTABLE utan verkligt prov.

## Verifiering och nästa steg

- Oberoende QA v3: PASS för R4a efter Reviewer v2:s fynd. En kompletterande delta-QA PASS bekräftade även att selector avvisar ogiltigt UUID, punkterade/blankstegsfyllda rasnycklar och feltypade fält utan undantag. Riktad selector-/workspace-svit PASS 25/25; slutlig selectoromkörning PASS 16/16. `pnpm check` PASS: 563/563 tester, båda typechecks och lint utan fel.
- Reviewer v2 fann fyra kod-/harnessfynd och en checkpointdokumentationslucka. Koden och renderbevisen passerade QA; dokumentationen synkroniserades och kön flyttades `qa → review`. Oberoende Reviewer recheck: PASS utan kvarstående fynd; R4a stängs som lokal checkpoint.
- `r4a-surfaces` public/review: bekräftat tom Knowledge öppnar fortsatt Checklistor; okänt läge öppnar dagens checklista och återgår till Hem; träningens empty-state CTA fungerar. `r4a-help` public/review vid 375/430: vikt-help döljs medan add-utkastet är ändrat och källfliken återställs när hjälp kan öppnas säkert. Browserresultaten har inga sidfel.
- Den äldre breda standard-smoken för `tools/visual-check/verify.py` faller på det borttagna Home-veckodagsfliktestet (`get_by_role('tab', name='lördag')`). Den är föråldrad och utanför R4a v16: aktiv Home har ingen sådan dagflik sedan den tidigare beslutspunkten om livsfasbaserad åldernavigering. Den rapporteras inte som PASS eller som ett R4a-regressionsfel.
- Full visuell likhet med `vision_rev02.jpg` är inte godkänd: porträtt/veckoremsa, exakt bildbeskärning och publicerat Home-råd avviker. Tområdet är korrekt enligt relevansgrinden. Native, live Supabase/RLS och TestFlight är inte provade.
- Nästa steg: återuppta och verifiera R3c:s funktionella/visuella QA. Därefter planeras R4b som en separat checkpoint.

Ingen delcommit; den begärda samlade commit/push väntar tills R3–R7-checkpointar är klara.

# KNOW-02 – Faschecklistor, FAQ och innehåll för layoutgranskning

Datum: 2026-10-11. Plan v2. Mandat: Erik beställde checklistor med progress/egna punkter och kategorifärger, valde konto-/hundsynk och preciserade Checklistor och FAQ, inga podcasts. Erik tillåter syntetiskt granskningsinnehåll i utvecklingsappen före release. QA-11 checkpoint föregår implementation.

## Användaruppgift och beteende

Kunskap visar kategoriidentifierade kort: Checklistor grön (befintlig food/training token), Vanliga frågor lila (befintlig purple token). Textetikett och ikon kompletterar färgen. Samma kategorifärg på Hem och Kunskap. Inga nya rosa/podcastkort.

Checklistöversikt visar relevanta faslistor och antal klara. Tryck öppnar detaljer: kort introduktion, procent/antal/progressbar, förvalda bockbara punkter och Lägg till egen punkt. Egna punkter kan ändras/raderas med bekräftelse, skiljs från redaktionella. Progress är klara punkter/alla aktuella standard- och egna punkter, aldrig hundens mognad eller hälsostatus. Avbockning kan ångras genom nytt tryck. Max en primär åtgärd i vy, alla rader minst 44 pt, stor text flödar, checkbox-semantik och explicit label.

Faser: före hemkomst, första dagarna, 8–12 veckor, 3–6 månader, 6–12 månader, fortsättning runt/över ett år. Ålder väljer standardfas; före hemkomst/första dagar väljs uttryckligen av ägaren eftersom födelsedatum inte bevisar hemkomst. Alla faser går att läsa. Ingen exakt ankomstdag/personuppgift behövs. Valet före hemkomst/första dagar/efter ålder sparas per hund. Faserna är redaktionella urval, inte utvecklingskrav. Under åtta veckor visas bara förberedelser och generella appguider.

FAQ har korta expanderbara frågor/svar inom respektive fas, lila tonad yta, ingen generell AI-frågetjänst. Svar är innehåll, inga nätanrop till SDK/AI från appen.

## Tillfälligt granskningsinnehåll

Separat modul med syntetiska svenska checklistor/FAQ och tre träningsprogram, inspirerade av Dog Expert-underlaget. Nya texter är layoututkast och ersätter inte befintlig godkänd bundle. Kort indikator Tillfälligt exempel – innehållet är inte sakgranskat visas i berörda vyer. Aktiveras av explicit `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true`, oberoende av __DEV__ så signerad TestFlight kan granskas. Codemagic befintliga TestFlight-workflow sätter flaggan true. App Store/public release måste kräva flaggan false; dokumenterad releasekontroll/script blockerar release när flaggan är true. Releaseförberedelser ska ta bort/revidera utkasten och ersätta dem med granskat innehåll.

Vid tomt publicerat urval visas syntetiskt innehåll i granskningsläget. Vid verkligt läsfel bevaras begripligt retry-läge och granskningsinnehållet står separat; inga fel maskeras. Träningsutkast använder endast minnesprogression med text Markeringar i dessa övningsutkast sparas under den här visningen; inga påhittade publicerade program-id:n skrivs till training_progress. Verkliga program fortsätter använda befintlig cloud progression. Home får åldersrelevant granskningskort och navigerar till samma content-ID som Kunskap.

## Cloud-checklistkontrakt

Stabila template-id/item-key i separat checklistekatalog och en SQL-import/migration för katalognycklar; inget påstående om publicerat expertgranskat innehåll. Tabeller: checklist_template_items (nycklar, ingen användardata), dog_checklist_progress (dog_id, template_id, item_key; bara checkade standardpunkter), dog_checklist_custom_items (UUID, dog_id, template_id, title max160 Unicode-tecken, completed), dog_checklist_preferences (dog_id, context before_homecoming/first_days/by_age). FK-katalog och dog on delete cascade, RLS via private.owns_dog för alla läs/skriv, begränsade grants, inga partners/analytics. Inga historiktidsstämplar. Katalog får bara admin skriva. Förluster i nätet reconcileras med exakt återläsning; serialiserad mutation hindrar dubletter. Inga falska Sparat, formulär behålls vid fel/okänt resultat; statuskontroll före replay. Session/hundbyte avbryter läsning och stale resultat kan inte uppdatera UI. Serverdata visas först efter validering av dog/template/item och title-gränser. Manuell migration till Supabase är separat och inte körd här.

Checklistprogression/custom rows hålls per hund även för layoututkasten så ägarens synkbeslut uppfylls; förvald katalog kan senare ersättas av granskad text med versionssatta keys endast när uppgiften är semantiskt oförändrad. Saknad migration ger innehållet synligt men sparåtgärder av och tydlig Försök igen; inget lokalt tillstånd presenteras som konto-sparat. Isolerad lokal UI-harness kan testa med syntetiskt API.

## Deluppgifter, ägarskap och verifiering

1. Koordinator: spara Dog Expert och Compliance underlag, godkännande och scope i denna plan; skill/designregler/referenser lästa. Nya råd förblir utkast tills human/vet review.
2. Implementer: en komplett checklist-/FAQ-slice med data API, SQL/RLS, översikt/detalj, egna punkter och ProductWorkspace-integration. Filer `src/features/knowledge/` (nya checklist-content, checklist-model, checklist-data, PuppyChecklistScreen, FAQScreen/review-content), KnowledgeScreen och README; ProductWorkspace/HomeCarousel/HomeScreen; tokens och delad ContentCategoryCard; `supabase/migrations/202610110002_puppy_checklists.sql`, syntetisk SQL-probe; berörda tester; codemagic.yaml, release guard och env guide. Befintligt inloggning/logg/hälsoskrivning skyddas. Inga dependencies.
3. QA/Reviewer/Security: meningsfulla tester av fas/procent/rättighetskontrakt/API-reconciliation och UI-kontroller. `pnpm check`, diffcheck och kövalidering. Rendering via tools/visual-check liten/stor bredd + 140% text, checklistor tom/partial/klart/error/pending/egen punkt och FAQ expand; träning sample list/detalj/progress. SQL-runtime och native beteende anges NOT TESTABLE utan exekvering.
4. Cleanup, hållbar checkpoint och samlad historik. Ingen push beställd i denna tur.

Compliance-underlag: lokal implementation/syntetiska tester tillåtna, konto-/hundkopplade bockar och fri text är personuppgifter. Ändamål är privat checklistprogression; max160 text, ingen annonsering/delning, cascade-radering. Innan live-beta: integritetsinformation, vald rättslig grund, processor-/överföringsavtal, faktisk tvåägar-RLS/radering/export och beslutade beta-retentionkontroller. Export för rättighetsförfrågan ska omfatta checklistor; inte automatiskt i Tassla-pass PDF.

Dog Expert-underlag: fem rekommenderade faser, belöningsbaserad och gradvis träning, trygg vuxenövervakad barnkontakt, smittskydd/kurskrav enligt lokal arrangör/veterinär. Valpkurs/barnkontakt bör inte automatiskt börja vid ett år; innehåll följer individ och kontext. Referenser Dogs Trust puppy checklist/new home/children, SKK hundens åldrar/kurser, AVSAB socialization, Jordbruksverket skaffa hund/vaccination. Dessa nya referenser är inte oberoende verifierade här; mänsklig/veterinär granskning krävs inför publicering.

Granskningar 2026-10-11: Architect APPROVE v2 (know02_architect), Critic PROCEED v2 (know02_critic). Dog Expert och Compliance underlag sparade ovan. Security granskar faktisk kod efter implementation.


## V2 – låsta kontrakt efter Architect/Critic

Denna precisering ersätter motstridiga v1-detaljer ovan. Granskare: know02_architect CHANGES och know02_critic PROCEED WITH CHANGES v1. V2 är godkänd av Architect och Critic enligt granskningarna ovan.

### Navigation, fasval och målbild

Kunskap behåller fyra flikar För dig / Artiklar / Checklistor / FAQ. Gröna/lila genvägskort finns endast i För dig, stabila destinationer är respektive flik. Hem öppnar samma katalog-ID. Checklistdetalj använder AppBar Back, intro, tunn befintlig Progress, ChecklistItem-rader och en huvudhandling Lägg till egen punkt. FAQ använder expanderbara kort, inga checkboxar. De nya korten följer Tasslas kort/tokens snarare än kopierar BabyJourneys typografi; detaljprogress och egna punkter är uttryckligt beställda tillägg där målbilden är tyst. Hem-kategori och FAQ-flik följer målbildens struktur. Tillfällig märkning är dämpad metadata intill exempelrubrik, även Hem, inte en teknisk banner/statusbadge. Copy: Tillfälligt exempel – innehållet är inte sakgranskat. Läs mer förklarar att exempel tas bort/revideras inför release. Ingen sponsor, köpknapp eller podcast.

Överst på Checklistor visas Var är ni just nu? med Före hemkomst / Första dagarna hemma / Efter ålder. Valet visas och kan ändras via Ändra; valet sparas per hund. Ägarens explicita kontext vinner över åldern. Efter ålder har under åtta veckor förberedelser, 8–12 veckor, 3–6 månader, 6–12 månader, över ett år. Att läsa annan fas ändrar aldrig aktiv kontext. Första dagarna övergår inte automatiskt: ägaren väljer Efter ålder när det passar. Inget ankomstdatum samlas.

### Skriv- och synkbeteende

UI är inte optimistiskt: checkbox/procent ändras först efter exakt validerad återläsning. En aktiv mutation per detaljvy; andra skrivkontroller disabled, läsning/navigation tillåten. Pending visar Sparar…, success kompakt Sparat-toast. Failed visar Kunde inte spara – försök igen med input kvar. Unsure visar Det gick inte att kontrollera om ändringen sparades och Kontrollera; ingen success. Unknown resultat kontrolleras på exakt dog/template/item eller custom UUID innan samma operation replayas; retries behåller original-ID och önskat värde. Dubbeltryck ignoreras medan pending/unsure. Hund-/sessionsbyte avbryter generationen; sena resultat kan inte ändra ny vy.

Standardbockar: upsert/check till unik dog/template/item, uncheck delete samma tuple, idempotent önskat värde. Egna punkter får Expo Crypto UUID (redan installerat) vid första tillägg; insert retries använder samma UUID och exakt readback. Edit/delete använder jämförelse mot tidigare title/completed (CAS), aldrig återinsätter en raderad punkt vid edit. Konflikt visar Punkten har ändrats. Läs in igen; reload före nytt val. Checkboxar och kontext mellan enheter använder sist bekräftad skrivning, ingen sammanslagning av samma checkbox; oberoende punkter skrivs var för sig och går inte förlorade. Fokus/öppning/explicit retry läser konto igen; inget löfte om realtidsuppdatering.

Katalogversion review-v1 ingår i template-id och punktnycklar. Inga automatiska progressöverföringar till publicerad ny version: endast semantiskt oförändrade punkter kan senare migreras genom granskad explicit mappning; andra bockar återställs med information. Egna punkter separata och bevaras, ingen sådan framtida migration implementeras nu. Review-checklistor har konto-sparad progress enligt Eriks beställning; träningsutkast märker tydligt att deras markeringar endast sparas under visningen.

Laddar: neutral LoadingState; tom egen lista: Lägg till egen punkt; normal: bockar och antal; schema saknas/fel: innehåll läsbart och ändringar av, Försök igen. Kontext skrivning samma mutationstatus. Egen punkt form huvudhandling Spara, Avbryt sekundär, delete separat destructive confirmation. Max160 Unicode-tecken, trim/ej tom. FAQ statisk lista har normal/inga frågor text; nätfel från publicerat innehåll hålls separat och maskeras inte.

### Fyra sekventiella fungerande slices

Alla kräver QA-11 hållbar verifierad checkpoint och släppt skrivägarskap; KNOW-02 formellt depends_on QA-11. Varje slice avslutas med relevant check/cleanup och sparad rapport innan nästa.

A. Schema och API: src/features/knowledge/checklist-model.ts, checklist-data.ts, checklist-content.ts, migration 202610110002_puppy_checklists.sql, supabase/tests/puppy-checklists.sql, tests/checklist-data.test.mjs och checklist-model.test.mjs, data/knowledge README. Acceptans: validerade data, idempotens/readback/CAS, tvåägarkontrakt och cascade, versionerad katalog. Ingen ny UI krävs; pnpm check och SQL statiska kontrakt, live SQL NOT TESTABLE tills körd.
B. Komplett checklistflöde: PuppyChecklistScreen.tsx, KnowledgeScreen.tsx, ProductWorkspace.tsx, delade ContentCategoryCard/tokens vid behov, tests/checklist-ui.test.mjs. Acceptans: preset/procent/egen add-edit-delete samt kontosparande, fasval och alla states enligt ovan. Render 375/430/stor text och interaktion; pnpm check.
C. FAQ och Hem: FAQScreen.tsx, review-content.ts, KnowledgeScreen.tsx, HomeCarousel.tsx, HomeScreen.tsx, ProductWorkspace.tsx, tests/knowledge-review-content.test.mjs och README. Acceptans: fyra flikar, lila FAQ expand, gröna checklistor, samma ID från Hem, sann märkning; render och pnpm check.
D. Övrigt granskningsinnehåll och buildpolicy: review-content.ts, PublishedTrainingScreen.tsx, ProductWorkspace.tsx, src/features/training/README.md, tests/review-training.test.mjs, codemagic.yaml, tools/check-content-release.cjs, tests/content-release-guard.test.mjs, .env.example, docs/dev/review-content-builds.md. ProductWorkspace väljer syntetiska program endast med reviewflagga; PublishedTrainingScreen får explicit reviewMode och lokal kontroll istället för molnhandler. Utkast använder separata review-ID, inga cloud inserts; befintliga riktiga program använder originalhandlers. Tre program och motsvarande guideinnehåll synligt i tomma listor, verkliga fel med retry. Verifiera att mock cloud-handler aldrig kallas av reviewprogram. pnpm check + buildguard-test + render list/detalj/progress.

Koordinator äger docs/plans/KNOW-02-checklists-faq-ux-spec.md, docs/tasks/dev/queue.json, rapport.md, HISTORY-2026.md och docs/design/KNOW-02; implementer äger endast ovan nämnda kod/test/README/byggguidefiler.

### Releasekontroll och artefakter

Befintlig tassla-ios förblir manuell TestFlight review-build med EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true, TASSLA_BUILD_CHANNEL=review, submit_to_app_store=false. Obligatoriskt guard-script körs före prebuild och bundle; skriver granskningsmetadata till artefakt. Separat tassla-ios-public workflow använder false och public; samma guard avvisar true/okänd flagga i public. Ingen automatisk App Store-publicering tillkommer. Testade guardkommandon: review+true tillåts, public+false tillåts, public+true/utebliven flagga nekas. Releaseguide kräver nytt public buildnummer och val av endast metadata-verifierad public artefakt efter mänsklig innehållsgranskning; review-build får inte promoveras. Detta är processgrind för manuell App Store Connect-konsol, inget falskt löfte om teknisk kontroll av Apples konsol. Checklistkatalog/texter för review dold vid false; inga otestade utkast som fallback i public.


## Genomförande och lokal verifiering — 2026-10-11

A–D implementerat enligt v2. Slutliga riktade QA-rättningar följer befintligt kontrakt: ett sidhuvud per checklistvy, korrekt failed/conflict vid update-readback och radbrytning/stor text. QA44PASS, ReviewerPASS och SecurityPASS; pnpm check37testfilerPASS och båda iOS-exporternaPASS. Ingen migration, commit, push eller TestFlight-distribution utförd. Se samlad historik och rapport för exakta begränsningar; liveSQL och native är inte verifierade.

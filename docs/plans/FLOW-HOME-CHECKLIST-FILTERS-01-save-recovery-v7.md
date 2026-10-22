# FLOW-HOME-CHECKLIST-FILTERS-01 — återhämta sparning av dagliga rutiner

Datum: 2026-10-22 · Plan v7 · Amendement A04 efter fryst A03-checkpoint.

## Uppgift och avgränsning

Ägaren rapporterar att ändring av rutintext/checklista och byte av punktikon inte går att spara. Skärmbilden visar ett felmeddelande och en låst redigerare. `ProductWorkspace.runDailyMutation` sparar i dag både ett definitivt `failed` och ett osäkert `unknown` som samma väntande retry. `DailyActivityManagerSheet` behandlar därmed båda som olösta skrivningar och låser utkastet. Appen visar inte någon backendkod som bekräftar att en tabell saknas. Live Supabase, RLS och applicerad migration kan inte verifieras här.

A04 ändrar endast återhämtning i den befintliga dagliga skrivresan. A03:s verifierade diff fryses vid commit `25bde34`; A04 börjar efter den checkpointen. A03:s fristående QA/Reviewer och fullständiga panel-4-granskning förblir separata öppna grindar.

## Beteendekontrakt

- **`saved`:** behåll befintlig readback, uppdatera dagsdata och stäng rutinutkast först efter bekräftat resultat.
- **Definitivt `failed`:** rensa pending-retry och lämna redigeraren upplåst. Behåll namn, rutinpunkter och ikonval i formuläret. Visa neutral gemensam text: `Ändringen sparades inte. Försök igen.` Texten lovar inte att nästa försök lyckas och skyller inte utan belägg på nätet. Användaren skickar endast en ny, uttrycklig mutation.
- **CAS-/revisionskonflikt vid rutinersättning:** skilj den från vanligt avslag och okänt utfall. Returnera aktuell rutin först efter readback som uttryckligen validerar svarsraden mot begärt hund-id och rutin-id. Behåll utkastets fält synliga men skrivskyddade; blockera ny sparning med den inaktuella revisionen. Visa inline: `Rutinen har ändrats sedan du öppnade den. Ladda den senaste versionen för att fortsätta. Dina osparade ändringar ersätts.` Åtgärdens synliga och tillgängliga namn ska vara `Ersätt utkastet med senaste versionen`. Ersätt inte utkastet förrän ägaren trycker. Ingen tyst överskrivning eller automatisk sammanslagning.
- **`unknown`:** behåll exakt operation, formulärdata och skrivlås. Åtgärden återspelar samma oförändrade operation med befintligt idempotens-/CAS-skydd och gör därefter readback; den är inte en separat skrivfri statusendpoint. Nya värden och andra mutationer väntar tills utfallet är säkert.
- Bevara varje aktiv/okänd skrivning i en owner-scoped process-store som överlever att hundnycklade `ProductWorkspace` monteras av. Hund-, dag-, tidszons-, route- eller skärmbyte får inte tappa originaloperationen eller öppna kontoraderingsgrinden för samma ägare. Andra ägare får varken se eller återspela den. Retry-entryn är en discriminated union: bara `in-flight` och `unknown` innehåller den exakta körfunktionen.
- Bevara rutinens serialiserbara formulärsnapshot separat, avgränsad till owner + dog + exakt dag-/livstidsscope: mode, submission-id, rutin-id, basrevision, sourceRoutine, ursprungs- och ändrade fält, punktordning/ikoner/upprepning samt eventuell konflikt med senaste readback. Efter hund A → B → A återställs snapshoten och konfliktläget endast när exakt samma scope återkommer. Spara/avbryt/radera konto rensar rätt entry. En sign-out eller kontoradering höjer en lokal ägargeneration så att en sen callback inte återlägger gammal data efter rensning.
- Vid ett hundbyte medan operationen fortfarande körs visas en status utan retry-knapp. Efter ett bekräftat `unknown` visas en tillgänglig, skärmövergripande åtgärd `Kontrollera samma ändring igen`. Retry återanvänder samma funktion, idempotensnyckel och ursprungliga scope; ingen parallell skrivning startas medan den första ännu kör.
- Status för en tidigare vy nämner ursprunglig hund och handling. När operationen blir definitivt `saved`, `failed` eller readback-bekräftad `conflict`, rensas spärren och ett avvisningsbart statusmeddelande visas även efter hundbyte/remount. Den lösta posten innehåller endast minimal status/copy och får inte behålla körfunktionen eller fångade rutinuppgifter. En löst status blockerar inte kontoradering och tas bort när ägaren stänger den.
- Kontraktet gäller alla befintliga anropare av `runDailyMutation`: rutin skapa/ändra/radera, dagens rutinval och avmarkering, slutförd rutinpunkt samt träningsval och avmarkering. Särskilt verifieras att failed icke-formuläråtgärd inte lämnar appen globalt låst.

## Ändringsgränser

- Behåll rutinmodell, checklistikonlista, hund-/konto/livstidsscope, RPC-signaturer, request-ID:n, befintliga CAS-kontroller och readback.
- Mutationer och utkast ligger endast i processminne; processavslut/omstart tappar okänd retry och osparat utkast. Ingen disk-/databasbeständighet, tabell, migration, RPC, grant, RLS-policy eller live-databasåtgärd tillkommer.
- Ingen ändring av A03-filter, källnavigation, panel-4-layout eller A03-verifieringsanspråk.
- Ändra felåterhämtning och den minsta konfliktåterhämtningen i befintlig rutinredigerare. En liten ren transitionmodul får bära de dagliga mutations- och rutinutkastbesluten så testerna kör samma funktioner som appen; ingen generell mutation-ram.

## Exakta skrivvägar

- App: `src/features/home/ProductWorkspace.tsx`, `src/features/home/DailyActivityManagerSheet.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/DailyChecklistScreen.tsx`, `src/features/home/daily-activity-data.ts`.
- Testbar tillståndslogik/store: `src/features/home/daily-activity-recovery.ts`; `routineDraftStore` konsumeras endast från dessa skärmar och rensas vid sign-out/kontoradering.
- Regressioner: `tests/daily-activity-ui.test.mjs`, `tests/daily-activity-data.test.mjs`, `tests/main-refresh.test.mjs`.
- Syntetisk renderkontroll: `tools/visual-check/app.tsx`, `tools/visual-check/verify-routine-save-recovery.py`, `tools/visual-check/README.md`.
- Dokumentation/checkpoint: denna plan, `src/features/home/README.md`, `docs/tasks/dev/FLOW-HOME-CHECKLIST-FILTERS-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/design/evidence/flow-home-checklist-filters-2026-10-20/a04/`.
- Koordinatorn skriver de gemensamma kö-/rapportfilerna sekventiellt; ingen parallell agent äger dem.

## Acceptans och verifiering

1. Definitivt avslag i rutinredigering behåller exakt inmatad text, punktordning och ikoner; inputs blir redigerbara och nästa sparning sker först vid nytt knapptryck.
2. Definitivt avslag från minst en icke-formulärmutation lämnar inget pending-lås och visar neutral återkoppling; övriga mutationer kan fortsätta.
3. `unknown` behåller exakt operation och låser andra skrivningar tills samma operation återspelats och readback säkert avgjort resultatet.
4. Revisionskonflikt returnerar endast en rad vars hund-id och rutin-id matchar den begärda scopet, gör inte en andra stale write, behåller read-only draft tills ägaren uttryckligen trycker `Ersätt utkastet med senaste versionen`, och därefter används nya revisionen. Test ska bekräfta att inget utkast byts före trycket.
5. Bekräftad `saved` städar pending efter operationens exakta befintliga readback och uppdaterar dagslistan när vyn fortfarande är aktuell; ett stale utfall får ingen data att skrivas in i en annan hund/dag-vy.
6. Riktade beteendetest kör produktionsfunktionerna från transitionmodulen och verifierar: failed behåller namn, punktordning och ikoner samtidigt som retry och lås rensas; unknown behåller samma utkast och exakt samma operation tills samma operation återspelas; conflict håller gammalt utkast oförändrat och osparbart tills ett uttryckligt tryck ersätter det med senaste rutin/revision/sourceRoutine. Konflikttexten och ersättningsåtgärden måste vara synliga från lokal draft-konflikt även efter att omladdningen rensat delad mutation-feedback. Hund A → hund B → hund A måste återställa label, submission-id, basrevision, punktordning, ikoner och konfliktpayload endast för exakt owner/dog/lifetime. Testa uttrycklig konflikt-ersättning efter remount, och att hund B inte kan starta/skriva över en in-flight/unknown mutation för hund A. Samma ägare förblir spärrad från kontoradering, annan ägare filtreras bort, retry syns endast när fasen är unknown och har en körfunktion; resolved innehåller ingen retry-funktion/personlig payload, kan inte återspelas och kan avfärdas. Testa att sign-out/kontoradering rensar snapshots och att sen callback från föregående ägargeneration inte återlägger dem. Processomstartens minnesförlust dokumenteras som begränsning. Non-form failed lämnar inget lås. UI-kontraktstest verifierar att sheet/workspace använder transitionerna för formulärlås, återförsök och ersättningsknapp. Datatest för SQLSTATE 08006 med HTTP 5xx och oförändrad readback måste ge unknown. Kör därefter `pnpm check`, `pnpm bundle:ios`, `git diff --check`, `python -X utf8 tools/dev_flow.py validate`.
7. Account deletion förblir blockerad under in-flight och unknown, och återöppnas först efter definitiv failed eller avstämd conflict; testa transitionfunktionen som används av kontoraderingsgrinden.
8. Granska renderade failed-, unknown- och conflictlägen mot befintlig rutinredigerare vid 375/430 bredder i public och syntetiskt review-läge. React Native Web provar produktionens skärm och komponenter med lokala callbacks; native-prov förblir NOT TESTABLE.

Riskklass: H — befintlig ägar-/hundscope:ad skrivkontroll, CAS-konflikthantering och felsituation berör personliga rutindata. Security-review före implementation och slutlig review ska granska failed/unknown, exact replay/readback, svarsrads hund-/rutin-id, dog/account/lifetime-scope, CAS och kontoradering. Live Supabase/RLS och applicerad migration rapporteras separat NOT TESTABLE. Compliance är inte tillämplig eftersom ändamål, mottagare, lagring och datafält inte ändras.

Product-scope är redan godkänt av Erik i hela MVP-mandatet 2026-10-06 och användarens aktuella felrapport. Plan v7 kompletterar v6 efter att två granskare identifierade att lokalt utkast/konflikt inte överlevde samma hundnycklade remount och att resolved-post behöll en körfunktion. Ändringen begränsas till processminnesstore för retry + serialiserbart utkast, hund/handling-märkt status, generationsskyddad rensning och beteendetester. Processomstart tappar osparade data; ändamål, datafält och backend write contract ändras inte. Architect, Critic och Security ska granska exakt v7 och den stabila implementationen.

Planreview: v6 fick Architect **CHANGES** och Critic **PROCEED WITH CHANGES** med krav på draft/conflict-remount, ursprunglig hund/handling i besked, blockering av hund B när hund A har unresolved write och dokumenterad processrestartbegränsning. v7 tillför också Architectens krav att resolved inte behåller retry-closure. Dessa verdicts gäller inte v7.

Skills: `tassla-consumer-ux`, `mobile-ios-design`; `docs/design-rules.md` §§0–4 och 14.

## Implementation and local verification — 2026-10-22

A04 now separates definitive `failed`, uncertain `unknown` and verified CAS conflict. A failed write retains the exact draft and unlocks the form; an unknown write keeps its exact retry closure and locks other writes; a validated conflict stores the latest routine before its background refresh and asks before replacing the stale draft. Owner-generation checks prevent late callbacks from restoring cleared state, and a late editor callback cannot overwrite a newer remounted draft. The retry and draft stores exist only for the process lifetime.

Architect approved plan v7, Critic returned PROCEED, and Security returned PASS for the scoped implementation. Independent A04 QA returned PASS after reviewing conflict persistence before refresh, dog/lifetime remount, and the unmount callback guard. These reviews do not close A03's separate QA/Reviewer and full panel-4 §14 gates.

The dedicated public and review React Native Web verifier passed 9/9 checks each. It rendered definitive failure at 375/430 px, unknown retry at 375 px, and conflict/read-only/replacement at 375/430 px; after replacement, a new edit saved against the latest synthetic revision. Captures and machine-readable results are under `docs/design/evidence/flow-home-checklist-filters-2026-10-20/a04/{public,review}/`. Full `pnpm check` passed with all 65 test files; `pnpm bundle:ios` passed the public content guard and exported 1,465 modules; `git diff --check` and `python -X utf8 tools/dev_flow.py validate` passed.

Live Supabase/RLS, whether the migration is applied in the target environment, native VoiceOver/Dynamic Type and the separate Home synthetic 4 px overlap remain NOT TESTABLE or out of this A04 scope. The visual results use synthetic callbacks and are not database evidence.

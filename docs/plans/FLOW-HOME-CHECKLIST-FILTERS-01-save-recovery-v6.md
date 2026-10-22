> **SUPERSEDED 2026-10-22** — se [A04 save recovery v7](FLOW-HOME-CHECKLIST-FILTERS-01-save-recovery-v7.md).

Denna version är kvar som historik för v6-granskningen. Använd v7 som aktivt implementationskontrakt.

# FLOW-HOME-CHECKLIST-FILTERS-01 — återhämta sparning av dagliga rutiner

Datum: 2026-10-22 · Plan v6 · Amendement A04 efter fryst A03-checkpoint.

## Uppgift och avgränsning

Ägaren rapporterar att ändring av rutintext/checklista och byte av punktikon inte går att spara. Skärmbilden visar ett felmeddelande och en låst redigerare. `ProductWorkspace.runDailyMutation` sparar i dag både ett definitivt `failed` och ett osäkert `unknown` som samma väntande retry. `DailyActivityManagerSheet` behandlar därmed båda som olösta skrivningar och låser utkastet. Appen visar inte någon backendkod som bekräftar att en tabell saknas. Live Supabase, RLS och applicerad migration kan inte verifieras här.

A04 ändrar endast återhämtning i den befintliga dagliga skrivresan. A03:s verifierade diff fryses vid commit `25bde34`; A04 börjar efter den checkpointen. A03:s fristående QA/Reviewer och fullständiga panel-4-granskning förblir separata öppna grindar.

## Beteendekontrakt

- **`saved`:** behåll befintlig readback, uppdatera dagsdata och stäng rutinutkast först efter bekräftat resultat.
- **Definitivt `failed`:** rensa pending-retry och lämna redigeraren upplåst. Behåll namn, rutinpunkter och ikonval i formuläret. Visa neutral gemensam text: `Ändringen sparades inte. Försök igen.` Texten lovar inte att nästa försök lyckas och skyller inte utan belägg på nätet. Användaren skickar endast en ny, uttrycklig mutation.
- **CAS-/revisionskonflikt vid rutinersättning:** skilj den från vanligt avslag och okänt utfall. Returnera aktuell rutin först efter readback som uttryckligen validerar svarsraden mot begärt hund-id och rutin-id. Behåll utkastets fält synliga men skrivskyddade; blockera ny sparning med den inaktuella revisionen. Visa inline: `Rutinen har ändrats sedan du öppnade den. Ladda den senaste versionen för att fortsätta. Dina osparade ändringar ersätts.` Åtgärdens synliga och tillgängliga namn ska vara `Ersätt utkastet med senaste versionen`. Ersätt inte utkastet förrän ägaren trycker. Ingen tyst överskrivning eller automatisk sammanslagning.
- **`unknown`:** behåll exakt operation, formulärdata och skrivlås. Åtgärden återspelar samma oförändrade operation med befintligt idempotens-/CAS-skydd och gör därefter readback; den är inte en separat skrivfri statusendpoint. Nya värden och andra mutationer väntar tills utfallet är säkert.
- Bevara varje aktiv/okänd skrivning i en owner-scoped process-store som överlever att hundnycklade `ProductWorkspace` monteras av. Hund-, dag-, tidszons-, route- eller skärmbyte får inte tappa originaloperationen eller öppna kontoraderingsgrinden för samma ägare. Andra ägare får varken se eller återspela den.
- Vid ett hundbyte medan operationen fortfarande körs visas en status utan retry-knapp. Efter ett bekräftat `unknown` visas en tillgänglig, skärmövergripande åtgärd `Kontrollera samma ändring igen`. Retry återanvänder samma funktion, idempotensnyckel och ursprungliga scope; ingen parallell skrivning startas medan den första ännu kör.
- När en operation från en tidigare vy blir definitivt `saved`, `failed` eller readback-bekräftad `conflict`, rensas spärren och ett avvisningsbart statusmeddelande visas även efter hundbyte/remount. En löst status blockerar inte kontoradering.
- Kontraktet gäller alla befintliga anropare av `runDailyMutation`: rutin skapa/ändra/radera, dagens rutinval och avmarkering, slutförd rutinpunkt samt träningsval och avmarkering. Särskilt verifieras att failed icke-formuläråtgärd inte lämnar appen globalt låst.

## Ändringsgränser

- Behåll rutinmodell, checklistikonlista, hund-/konto/livstidsscope, RPC-signaturer, request-ID:n, befintliga CAS-kontroller och readback.
- Store är endast processminne; ingen disk-/databasbeständighet, tabell, migration, RPC, grant, RLS-policy eller live-databasåtgärd tillkommer.
- Ingen ändring av A03-filter, källnavigation, panel-4-layout eller A03-verifieringsanspråk.
- Ändra felåterhämtning och den minsta konfliktåterhämtningen i befintlig rutinredigerare. En liten ren transitionmodul får bära de dagliga mutations- och rutinutkastbesluten så testerna kör samma funktioner som appen; ingen generell mutation-ram.

## Exakta skrivvägar

- App: `src/features/home/ProductWorkspace.tsx`, `src/features/home/DailyActivityManagerSheet.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/DailyChecklistScreen.tsx`, `src/features/home/daily-activity-data.ts`.
- Testbar tillståndslogik/store: `src/features/home/daily-activity-recovery.ts`.
- Regressioner: `tests/daily-activity-ui.test.mjs`, `tests/daily-activity-data.test.mjs`, `tests/main-refresh.test.mjs`.
- Dokumentation/checkpoint: denna plan, `docs/tasks/dev/FLOW-HOME-CHECKLIST-FILTERS-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`.
- Koordinatorn skriver de gemensamma kö-/rapportfilerna sekventiellt; ingen parallell agent äger dem.

## Acceptans och verifiering

1. Definitivt avslag i rutinredigering behåller exakt inmatad text, punktordning och ikoner; inputs blir redigerbara och nästa sparning sker först vid nytt knapptryck.
2. Definitivt avslag från minst en icke-formulärmutation lämnar inget pending-lås och visar neutral återkoppling; övriga mutationer kan fortsätta.
3. `unknown` behåller exakt operation och låser andra skrivningar tills samma operation återspelats och readback säkert avgjort resultatet.
4. Revisionskonflikt returnerar endast en rad vars hund-id och rutin-id matchar den begärda scopet, gör inte en andra stale write, behåller read-only draft tills ägaren uttryckligen trycker `Ersätt utkastet med senaste versionen`, och därefter används nya revisionen. Test ska bekräfta att inget utkast byts före trycket.
5. Bekräftad `saved` städar pending efter operationens exakta befintliga readback och uppdaterar dagslistan när vyn fortfarande är aktuell; ett stale utfall får ingen data att skrivas in i en annan hund/dag-vy.
6. Riktade beteendetest kör produktionsfunktionerna från transitionmodulen och verifierar: failed behåller namn, punktordning och ikoner samtidigt som retry och lås rensas; unknown behåller samma utkast och exakt samma operation tills samma operation återspelas; conflict håller gammalt utkast oförändrat och osparbart tills ett uttryckligt tryck ersätter det med senaste rutin/revision/sourceRoutine. Konflikttexten och ersättningsåtgärden måste vara synliga från lokal draft-konflikt även efter att omladdningen rensat delad mutation-feedback. Hund A → hund B → hund A måste hämta samma in-flight/unknown operation ur den processglobala owner-store:n; samma ägare förblir spärrad från kontoradering, annan ägare filtreras bort, retry syns först när fasen är unknown, och löst konflikt öppnar spärren. Non-form failed lämnar inget lås. UI-kontraktstest verifierar att sheet/workspace använder transitionerna för formulärlås, återförsök och ersättningsknapp. Datatest för SQLSTATE 08006 med HTTP 5xx och oförändrad readback måste ge unknown. Kör därefter `pnpm check`, `pnpm bundle:ios`, `git diff --check`, `python -X utf8 tools/dev_flow.py validate`.
7. Account deletion förblir blockerad under in-flight och unknown, och återöppnas först efter definitiv failed eller avstämd conflict; testa transitionfunktionen som används av kontoraderingsgrinden.
8. Granska renderade failed-, unknown- och conflictlägen mot befintlig rutinredigerare vid tillgängliga 375/430 bredder. Saknad renderer/native-prov är NOT TESTABLE.

Riskklass: H — befintlig ägar-/hundscope:ad skrivkontroll, CAS-konflikthantering och felsituation berör personliga rutindata. Security-review före implementation och slutlig review ska granska failed/unknown, exact replay/readback, svarsrads hund-/rutin-id, dog/account/lifetime-scope, CAS och kontoradering. Live Supabase/RLS och applicerad migration rapporteras separat NOT TESTABLE. Compliance är inte tillämplig eftersom ändamål, mottagare, lagring och datafält inte ändras.

Product-scope är redan godkänt av Erik i hela MVP-mandatet 2026-10-06 och användarens aktuella felrapport. Plan v6 rättar v5:s antagande att en lokal React-komponent äger ett unresolved write: hundbyte byter nyckel och monterar om hela `ProductWorkspace`. V6 begränsar ändringen till en processminnesstore, owner-scope:ad banner/retry och regressioner för remount/radering; ändamål, datafält och backend write contract ändras inte. Arkitekt-, Critic- och Security-review gäller exakt v6.

Skills: `tassla-consumer-ux`, `mobile-ios-design`; `docs/design-rules.md` §§0–4 och 14.

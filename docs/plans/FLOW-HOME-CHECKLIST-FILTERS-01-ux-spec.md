# FLOW-HOME-CHECKLIST-FILTERS-01 — filter- och Kommande-resan

Datum: 2026-10-20
Version: v2 — reviderad efter första Architect/Critic/Security review; skickas åter för Product, Architect, Critic och Security review
Status: v2 godkänd för implementation; ingen implementation påbörjad
MVP: `docs/MVP-EXPERIENCE-CONTRACT.md` panel 4; `docs/design/vision-rev02-screen-contracts.md` panel 4

## Mål och avgränsning

Efter Idag-slicen ska hundägaren kunna byta mellan **Idag**, **Denna vecka**, **Alla** och **Kommande**, förstå om en rad är utförd eller bara planerad, och nå den befintliga källan utan att uppgifter försvinner, skapas eller räknas två gånger. Samma inloggade konto och aktiva hund gäller hela resan. Filterknappar visas bara tillsammans med fungerande urval och fullständiga tillstånd; inga dekorativa/inaktiva segment.

Detta är klassat H i kön: läsningen ändras för ägarens hundägda aktivitets- och hälsoplanrader och måste granskas av Security. Inget nytt dataändamål, delning, migration, RLS-policy, schema, dependency, persistens, notifiering eller analytik ingår. Läsningen är hundägarens befintliga dagsaktivitet och ägarregistrerade hälsoplaner inom samma konto/hund. Befintliga dagsmutationer och ägarens hälsoplaner ändras inte av filtrering.

## Föreslagen databetydelse

Alla datum är giltiga `YYYY-MM-DD`-nycklar och beräknas som kalenderdatum utan UTC-/DST-förskjutning. Den fångade laddningsnyckeln innehåller konto-/hundlivstid, hund-ID, tidszon, filter och datumgränser. Varje svar kontrolleras efter `await`; byte av hund, konto, tidszon, filter eller vy får inte publicera gamla rader. Sparade rader behåller sin `date_key` och sin sparade `time_zone`; historiska tider flyttas inte om därför att enheten bytt tidszon.

| Filter | Datakälla och gräns | Visning/status |
|---|---|---|
| **Idag** | Oförändrad befintlig dagsladdare och bekräftade dagsaktiviteter. | Oförändrad checkbox-/träningskälla och dagens progress. |
| **Denna vecka** | Aktiv ISO-vecka, måndag–söndag, räknad från dagens lokala datum. Endast redan sparade `dog_daily_routine_days`, `dog_daily_routine_day_skips` och `dog_daily_training_selections` inom veckans datumnycklar. Läs alla sidor; kör inte occurrence-creation-RPC:n och härled aldrig missade historiska dagar från dagens rutinmall. | Rutindagar visas med frysta snapshot-namn/checklistor och sparad status. Ett uttryckligt skip visas som en rutinrad med status **Överhoppad**, utan checkbox och utanför all completion-progress. Träning löses mot exakt publicerad version/steg och hundens progress; completion jämförs med urvalets sparade `date_key` och `time_zone`. Olöst källa eller ofullständig progressläsning ger Delvis hämtad, aldrig en fabricerad/okryssad komplett rad. |
| **Alla** | Rullande 30 lokala kalenderdatum inklusive idag: `today - 29` till och med `today`. Samma sparade dagsrader, skip-snapshots och träningsurval som ovan; ingen mall, återfallsbakåträkning eller obegränsad historik. Den lokala gränsen gäller även om serverns retention-jobb inte körts. | Visa synligt kontexten **Senaste 30 dagarna** när filtret är valt och inkludera samma statusregler som Denna vecka. Ingen sammanlagd progressindikator för historik. Gränsen gäller urvalet och påstår inte att äldre serverdata har raderats. |
| **Kommande** | De sju framtida lokala kalenderdatumen från imorgon till och med `today + 7`. (1) Aktuella ägarvalda återkommande `dog_daily_routines`, projicerade enbart för reglernas giltiga datum med befintlig `isRoutineDueOnDate`-semantik; ej engångsmallar. (2) Ägarregistrerade `dog_health_plans` där `due_on` ligger i samma inklusiva datumintervall; läs endast `id,dog_id,event_type,due_on`. Product-beslut i denna plan: inkludera dessa redan ägarägda planer i Checklistans Kommande eftersom de är en del av den godkända panel-4-resan; frågan väljer bara nödvändiga listfält och skapar inget nytt dataändamål. Future training visas inte: urvalskällan/SQL-guard skapar inte framtida val. | Varje rad är **Planerad**, har ingen checkbox och ingår aldrig i progress. Vyn visar den korta hjälpen **Planerat, inte utfört** och ingen completion-räknare. Rutinrad öppnar fokuserad hantering av den aktuella återfallsregeln utan dagsvalshandlingar; hälsoplan öppnar befintlig Planerade hälsohändelser med tillgängligt bakåtnamn och retur till samma filter. En inaktuell borttagen plan/rutin öppnar aldrig fel källa; invalidera och ladda om listan så att den raderade posten försvinner. |

Denna vecka och Alla backfillar aldrig förekomster genom att köra `ensure_due_daily_routine_days`: dess serverkontrakt accepterar endast aktuell lokal dag och skulle annars både skriva data och riskera att skapa missade dagar. Kommande rutinposter är en beräknad presentation av en uttrycklig, aktuell ägarstyrd återfallsregel, inte sparade occurrence-rader; därför märks de alltid Planerad. Rutinregelns ankare, intervall, ISO-veckodagar och månadsslut måste matcha den befintliga modellen och SQL-kontraktet. Sparade skip-snapshots är en ägarvald händelse: visa en statisk rutinrad med status **Överhoppad**, men räkna den aldrig som utförd eller i en progressnämnare. En raderad rutinmall kaskadraderar redan sparade dags-/skiprader enligt befintlig FK-policy. Historik visar bara rader som fortfarande finns kvar; den lovar inget arkiv efter borttagning och ändrar inte befintligt raderingsbeteende.

Historiska träningsurval löses mot exakt valda `program_version_id` + `step_id` under publicerat-innehållspolicyn, aldrig mot endast ålder-, rekommendations- eller resumable-programurval. Källuppslag begränsas till valda version/steg; lista endast titel/identitetsfält och läs instruktion/detail först när ägaren öppnar det exakta steget. Läs hundens progress för de exakta valda versionerna/stegen och paginera den läsningen. Beräkna dagens completion mot urvalets sparade datum och tidszon enligt den befintliga modellen. En lyckad komplett progressläsning utan matchande completion ger **Inte markerat**; misslyckad/partiell progressläsning eller en avpublicerad/saknad version/steg ger **Källa inte tillgänglig** och Delvis hämtad, aldrig en fabricerad titel eller en säkert okryssad rad. En löst historisk träningsrad öppnar exakt steg i skrivskyddat läge och går tillbaka till samma filter, datumgrupp och scrollposition. Historiska rutin- och skiprader är statiska utan tryckaffordans.

Alla läsare har samma aktiva `dog_id`, exakt datumintervall och deterministisk sortering. Paginerade källor använder keyset över unik stabil ordning: dagsrader `(date_key,id)`, skips `(date_key,day_id)`, träningsurval `(date_key,id)`, hälsoplaner `(due_on,id)`, publicerade versioner `id`, steg `(program_version_id,id)` och progress `(program_version_id,step_id)`. Validera hund/datum/identitet; upprepad nyckel, fel eller icke-framåtriktad cursor blir Delvis hämtad, aldrig komplett. Scope-driven abort eller gammal generation ignoreras tyst; timeout/transportfel medan scope fortfarande är aktuell ger retrybart partial/error. En saknad fortsättningstoken eller kort sida avslutar traversal endast enligt källans dokumenterade pagineringskontrakt. Databasen ger ingen gemensam transaktionell snapshot över källor: resultat betyder att alla sidor i den fångade läsningen har klarats, inte att externa samtidiga ändringar är atomiska. Varje känd mutation, återkomst från källvy eller återöppning invaliderar och laddar om berörda källor innan vyn åter blir komplett. Range-läsningar är read-only: filterval och källöppning gör inga writes/RPC-anrop; en uttrycklig ändring i befintlig rutinredigerare använder endast dess redan godkända skrivflöde. Published-content läses enligt dess publicerade policy; hundägda aktivitets-, progress- och hälsorader behåller aktivt `dog_id`-filter och befintlig `private.owns_dog`-RLS.

Request-scope innehåller konto-/sessionlivstid, aktiv hundlivstid och ID, lokal datum/tidszon, valt filter/intervall och request-generation. `ProductWorkspace` äger filtret så att det överlever underordnade skärmars unmount när källvyn öppnas. Varje range-/versions-/progressläsning delar en abortsignal; abort vid filterbyte, route-exit eller konto-/hund-/tidszons-/dygnsbyte, inklusive konto-raderingsinvalidation. Kontrollera generation och scope efter varje `await` och före publicering eller cleanup; gamla svar får aldrig ersätta nya. Vid källretur återställs valt filter, datumgrupp och scrollposition och range-källorna refresha. Vid verkligt avslut till Hem eller scopeinvalidation börjar nästa checklistbesök på Idag.

Public/review-fixtures använder endast godkända publicerade steg; synthetic review-innehåll får aldrig se ut som verklig ägaraktivitet.

## Användarflöde och UI-tillstånd

1. Öppna befintlig underordnad Hem-route **Checklista**. Idag är initialt valt.
2. Tryck ett av de fyra fungerande segmenten. `ProductWorkspace` äger valt filter så att det överlever en källvy. Vid 375 pt och förstoring ska kontrollen kunna bryta till två kolumner med fullständiga etiketter, tydligt valt läge, minst 44×44 pt per segment och ingen horisontell overflow; välj denna 2×2-layout om befintlig enradig variant inte klarar kriterierna. För Alla visas den synliga korta kontexten “Senaste 30 dagarna”. Segmentskifte avbryter föregående läsning och återställer till datumgruppens topp; Idag återanvänder befintlig dagskälla.
3. Visa grupperade rader i datumordning och stabil källordning. Icke-Idag-filter har ingen completion-räknare/progressindikator. Historiska rutin-/skiprader är statiska snapshots; skip är Överhoppad. En löst historisk träningsrad kan öppna exakt publicerat steg i skrivskyddat läge; om version/steg saknas visas ingen länk och vyn markeras Delvis hämtad. Kommande saknar checkbox/progress och visar “Planerat, inte utfört”.
4. Tryck på en planerad rutin för att öppna befintlig rutinhantering med rätt rutin i fokus och endast dess mall/återfallsredigering. Dölj “Lägg till/Ta bort från Hemskärmen” i den här kontexten eftersom det avser idag; ändra inte dagsval genom att öppna en framtida rad. Ta inte bort rutinens befintliga uttryckliga destruktiva bekräftelse.
5. Tryck på en planerad hälsohändelse för att öppna den befintliga planvyn. Tillbaka går till samma Kommande-filter, datumgrupp och scrollposition i Checklistan. Om posten hunnit raderas ska källvyn visa sitt uppdaterade/tomma tillstånd och aldrig bekräfta en utförd händelse.

Tydliga tillstånd för varje serverhämtat filter:

- **Laddar:** listan ersätts med befintlig tokeniserad skeleton; inga gamla hund-/filterrader visas.
- **Komplett/tom:** säkert tomläge för det aktuella filtret; ingen falsk 0-av-0-progress.
- **Komplett/data:** alla required sources är fullständigt paginerade/validerade; datumgrupper och totaler beskriver exakt listan.
- **Delvis hämtad:** minst en källa/sida misslyckades eller en saved training selection inte kan resolve:as. Visa en synlig kort förklaring och endast rader från lyckade kompletta källor; visa ingen total/progress som antyder komplett lista; erbjud Försök igen.
- **Fel:** inga källor kunde läsas; inga rader eller tomläge; retry i samma hund/filter/datumscope.
- **Föråldrad scope/avbruten request:** ignorera utan fel-/tomfeedback i den nya vyn.

## Visuellt/interactionellt kontrakt

- Följ `docs/design-rules.md` §0–4 och §14 samt Panel 4. Återanvänd befintliga token och `Tabs`-segment; lägg inte till färger, kortstaplar eller dekorativa kontroller.
- Högst en primär handling per synligt sammanhang. Filter är val, inte fyra primära CTA:er. Segmenten visar fulla svenska etiketter och valt tillstånd; alla fyra klarar minst 44×44 pt vid 375×667/140 % utan klippning/horisontell overflow. Planerade rader får konsekvent “Planerad” + källaikon/namn; färg är aldrig ensam statusbärare. “Alla” kompletteras synligt med “Senaste 30 dagarna” och accessibility-labeln “Alla, senaste 30 dagarna”; Kommande får den korta förklaringen “Planerat, inte utfört”.
- Håll datumgrupper, texter och felhjälp korta. Behåll tillräcklig vertikal separation via spacing tokens; föredra en sammanhållen lista med diskreta avdelare före box-i-box-kort. Ingen ny skugga eller accentlinje om den inte redan krävs av designkontraktet.
- Inga nya animationer eller dependencies. Återanvänd befintlig segment-/skärmrörelse bara om den inte döljer laddning eller byter kontext; reducerad rörelse fortsätter fungera. Historiska read-only-rader har ingen chevron, hover-, tryck- eller knappsemantik; bara fungerande källnavigation har knappsemantik.
- Touch-/screen-reader-namn beskriver filter, datum, källa och Planerad-status. Färg kompletterar men ersätter inte label/state. Minst 44×44 pt för tryckbara segment/åtgärder; lång svenska och 140 % text får växa och scrolla.

## Filer och skyddade ytor

Exakta avsedda skrivvägar, inga ändringar utanför listan utan ny planversion/review:

- `src/features/home/DailyChecklistScreen.tsx`
- `src/features/home/DailyActivityManagerSheet.tsx` — valfri rutin-only-kontekst från Kommande; befintligt defaultflöde lämnas oförändrat
- `src/features/home/ProductWorkspace.tsx` — filterstate, scope-generation, källa/back och historisk source focus
- `src/features/training/PublishedTrainingScreen.tsx` — exakta historiska steg i skrivskyddat läge
- `src/features/home/daily-activity-data.ts`
- `src/features/home/daily-activity-model.ts`
- `src/features/home/README.md`
- `src/data/workspace-data.ts` — fullständigt hundscope:ad datumintervalläsare för planerad hälsa
- `src/features/health/PlannedHealthScreen.tsx` — tillgängligt bakåtnamn/returtext via opt-in prop; Hälsa-default oförändrad
- `tests/daily-activity-range.test.mjs`
- `tests/daily-checklist-filters.test.mjs`
- `tests/daily-activity-model.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `tools/visual-check/README.md`
- `docs/design/evidence/flow-home-checklist-filters-2026-10-20/`
- `docs/tasks/dev/FLOW-HOME-CHECKLIST-FILTERS-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/plans/FLOW-HOME-CHECKLIST-FILTERS-01-ux-spec.md`
- Vid avslut/checkpoint: `docs/releases/HISTORY-2026.md` och `docs/decisions/MASTER-LOG.md`

Skyddat: migrations-/RLS-filer, tabell-/RPC-/grant-kontrakt, `dog_events`, loggflöde, kunskaps-/åldersurval, träningsprogressmutationer, account/dog-selection architecture, dependencies, auth och andra paneler. Inga historiska uppgifter skrivs om eller återskapas.

## Acceptance och verifiering

1. Fyra filter är klickbara/namngivna och kopplade till respektive verkliga scope. Idag är oförändrad och saknar dubblerade återkommande fetch/write.
2. ISO-vecka testar måndag, söndag, nyår och lokal/DST-gräns. Endast sparade dagsrader visas; ett historiskt datum utan materialiserad row förblir tomt även om dagens mall skulle ha förfallit då.
3. Alla använder exakt 30 datum från idag−29 till idag; inga mallar eller framtida projektioner. RLS dog-scope och query-date range valideras i dataläsaren.
4. Kommande inkluderar imorgon och `today + 7`, exkluderar idag och `today + 8`; daglig/veckovis/varannan-vecka/månadsregel, veckodagsurval, intervall över flera veckor, ankare före/efter range och ankardagar 29–31 med månadsslut testas över DST-säkra datum. Ingen `ensure_due_daily_routine_days`-RPC. Framtida health är hundscope:ad, minimifält, paginerad och read-only. Inga fabricerade framtida training-val.
5. Paginering provar 0, exakt full sida, flera keyset-sidor, samtidiga kända mutationer, duplicate/non-progressing cursor, malformerad/cross-dog response och andra sidans fel för varje källa inklusive routine skips, exact training source/progress och minimal health. Inga halvfärdiga page-resultat blir komplett/empty. Scope-abort efter requeststart lämnar nya vyer utan stale-resultat och utan feltoast; timeout/transportfel med aktuell scope ger retrybart partial/error. Ingen tvärkälla-transaktionssnapshot utlovas; kända mutationer/retur invaliderar och laddar om.
6. Planerad rutin-/healthplan-destination, stale/deleted source, historiskt sparad rutin/skip-rad samt SQL-cascade vid borttagen rutin och exakt publicerad träningsversion/steg testas. Raderad rutinöppning ska inte rikta till fel källa; listan refresha och raderade poster försvinner. Historisk träning öppnas skrivskyddat och återgår till samma filter/datumgrupp/scroll; olöst källa ger partial utan vilseledande länk. Inga framtida checkboxar/progress. Filter-, route-, dygns-, tidszons-, hund-, konto- och account-deletion-invalidering aborterar och ignorerar stale svar; retry efter partial/error och Idag-regression testas.
7. Riktad testkörning: `node --experimental-strip-types --test tests/daily-activity-range.test.mjs tests/daily-checklist-filters.test.mjs tests/daily-activity-model.test.mjs`; därefter `pnpm check`, `pnpm bundle:ios`, `git diff --check` och `python -X utf8 tools/dev_flow.py validate`.
8. Rendera public/review med fullständig syntetisk fixture för Idag/Denna vecka/Alla/Kommande: empty/loading/partial/error/populated, repetition, sparad dag/skip-historik, framtida rutin + planerad hälsa, exact historical training route/read-only/return. Viewports 375×844, 430×844, 375×667 och 140 % text; mät samtliga segmentmål 44×44 pt, ingen klippning/horizontal overflow, valt filter synligt. Arkivera bilder/browser-resultat/§14 punkterna 1–18 med build/viewport/scenario/commit. Sätt endast verkliga pass.
9. Live Supabase/RLS och native VoiceOver, Dynamic Type, fysiska gester/TestFlight redovisas var för sig. Inte verifierade miljöer är NOT TESTABLE och får inte ges PASS; tillämpa Eriks policy att native-test inte stoppar lokalt checkpoint-arbete. Om query kräver en migration/policyändring ska implementeringen stanna och planen granskas om.

## Rollgranskning och status

- Product: bekräfta att ägarregistrerade hälsoplaner visas read-only i Checklistans Kommande (befintlig panel-4-nytta, ingen ny dataanvändning); granska datumdefinitioner, skip-status, destinationsval, “Alla—Senaste 30 dagarna” och korta Planerad-labels.
- Architect: verifiera exakta version-/step-/progresskällor, SDK-/query-/SQL-/RLS-kontrakt, keyset-paginering/samtidighet, abort/lifetime/account deletion, recurrence parity, route/back/read-only mode och skrivvägar. Ingen implementation före APPROVE.
- Critic: pröva filteretiketter/30-dagarsbegränsning och segmentlayout, skip-/Planerad-status, partial UI samt destination/back i kritiska empty/error/smala/stor-text-resor.
- Security: verifiera syfte/minimering (inklusive Product-beslut om befintliga ägarplaner), samma konto/hund och hund-ID på varje query, minimal projection, befintlig dog-membership RLS, exact published-only training reads, pagination, abort/stale-scope och inga nya writes/RPC-anrop.

Valda skills: `.agents/skills/tassla-consumer-ux/SKILL.md`, `.agents/skills/mobile-ios-design/SKILL.md`, `docs/design-rules.md`; använd de relevanta repo-/session-skillsen för data/security när deras instruktioner träffar implementationen. Artikeln Refactoring UI används endast som Tassla-anpassade finishprinciper i `tassla-consumer-ux`, under token-, kontrast- och planreglerna.

Granskningsbeslut v2, 2026-10-20: **Product APPROVE** för read-only ägarregistrerade hälsoplaner inom befintlig panel-4-nytta; **Architect APPROVE** (exakta publicerade källor, RLS, recurrence, keyset och routekontrakt); **Critic PROCEED**; **Security APPROVE** för statisk plan/kodscope. Security har inte verifierat live Supabase RLS/deployerad policy. Ingen implementation eller appkod ingår i denna plancheckpoint. Alla läsare och skrivvägar är avgränsade; ny produktbetydelse eller write path kräver ny planversion och review.

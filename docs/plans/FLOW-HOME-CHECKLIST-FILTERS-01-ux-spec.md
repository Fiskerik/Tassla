# FLOW-HOME-CHECKLIST-FILTERS-01 — filter- och Kommande-resan

Datum: 2026-10-20
Version: v2 — reviderad efter första Architect/Critic/Security review; skickas åter för Product, Architect, Critic och Security review
Status: v2/A01 och A02 v5-planen godkända. Merge-återställning och A02:s lokala ikon-/handlingsslice finns på `2026-10-22-checklist-kommande-navigation`; A02 v5 har public/review-render, oberoende QA och frozen Reviewer **PASS**. A03:s Kommande/källflöde passerar riktad lokal public/review-kontroll. Oberoende A03-review och full panel-4-acceptans återstår. Ikonmigration/runtime är inte körd och produktionsskrivning är spärrad tills äldre klienter inte kan läsa ikondata.
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
- `src/components/ui/Tabs.tsx` — endast opt-in-tonen för Checklistans rev02-segment; befintliga Tabs-varianter utan opt-in lämnas oförändrade
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

## Implementation addendum A01 — rev02-segmentets bredd, färg och valt tillstånd (2026-10-21)

Ägaren har åter betonat att implementationen ska likna `vision_rev02.jpg`, panel 4. En headless 375×844-rendering visade att befintliga `rev02-segmented`-segment tog ungefär två tredjedelar av innehållsbredden, hade en blek aktiv yta och saknade `aria-selected` i web-DOM. Referensen visar tre jämnbreda segment över innehållsytan med ett tydligt grönt aktivt segment.

Architect granskade den föreslagna smala korrigeringen och gav **APPROVE WITH CONDITIONS**: lägg till den exakta skrivvägen, bevara befintliga Tabs-konsumenters utseende genom en opt-in-ton för Checklistan och behåll callback-, label-, touchmåls- och rörelselogik. Tillägget uppfyller dessa villkor:

- En valfri home-ton används endast av `DailyChecklistScreen`. Den gör segmentraden lika bred som Checklistans innehåll och fördelar tillgänglig bredd jämnt, med minst 44 pt segmenthöjd. Befintlig `underline` och `rev02-segmented` utan opt-in behåller nuvarande utseende och beteende för Hälsa, Kunskap och komponentgalleriet.
- Aktivt segment använder befintliga `tokens.colors.home.greenStrong` och `tokens.colors.onPrimary`; övriga segment behåller befintlig yta/typografi. Behåll `accessibilityState.selected` och exponera explicit `aria-selected` true/false i webben.
- Tillägget ändrar inte filterurval, dataläsning, navigation, callback, labels eller rörelse och tillför inga dependencies eller datafält.
- Acceptans: jämför Checklistan med panel 4 vid 375×844 och 430×844; verifiera tre lika breda segment, grön aktiv pill med vit text, `aria-selected=true` endast på valt segment och minst 44×44 pt tryckytor. Bekräfta att standard-/underline-konsumenterna förblir oförändrade. När Kommande läggs till gäller fortsatt v2:s 140 %-text- och fyrsegmentskriterier.

Architect-beslutet avser endast A01:s implementationstillägg; Product-, Security- och övriga v2-beslut är oförändrade eftersom data- och navigationsscope inte ändras.

## Implementation addendum A02 — valbara ikoner för rutinpunkter (2026-10-22)

Erik bad att återinföra ikonvalet som saknas efter merge. Den tidigare branchen `origin/codex/dog-profile-search-pilot` innehöll en separat, redan granskad ikon/detail-amendment, men den branchen är inte implementationens källa. Återställningen ska följa aktuell rev02-kontrakts- och kodbas. Manuella tester 1–4 i senaste bygget är godkända av Erik och återöppnas inte av detta tillägg.

Ägarens produktbeslut som gäller här: Hem behåller kompakta dagsrader utan en extra ikon per punkt. På Checklista visas en relevant, varierad ikon per rutinpunkt. Ägaren väljer ikonen i rutinens befintliga skapa-/redigeraflöde; ikonen hör till punkten och följer dess sparade dagskopia. Long-press på en rutinpunkt i dagens Checklista öppnar samma rutinredigerare fokuserad på just den punkten och dess ikonväljare. Checkbox, vanligt radtryck, historikrader, överhoppade rader, träningsrader och hälsorader behåller sina egna handlingar.

### Ikonväljare och visning

- Varje rutinpunktens rubrikrad i skapa-/redigeraläget får en minst 44×44 pt ikonknapp. Den visar vald/förvald glyph och öppnar en tät grid med 20 giltiga Ionicons. Gridens synliga innehåll är endast symboler; varje alternativ har ett svenskt hjälpmedelsnamn, radiostate och tydlig vald markering. Selection stänger grid och ändrar bara den punkten i utkastet.
- Ikonknappens hjälpmedelsnamn anger `Välj ikon för {punkt}`. Varje ikonval använder tillgänglighetsroll `radio`, svenskt namn och selected/disabled state. Ingen färg ensam anger valet. Interaktiva rutor har minst 44×44 pt.
- Dagens och sparade Checklist-rader visar punktens uttryckligen sparade ikon. För legacy-punkter används följande deterministiska textmatchning efter trimning och svensk gemenform: `vatten|dricka` → `water-outline`, `promenad|runda|rast|koppel` → `walk-outline`, `vila|sova|sömn` → `bed-outline`, `mat|måltid|foder|äta` → `restaurant-outline`, `tass|tassar` → `paw`, `borsta|kamma|pälsvård` → `brush-outline`, `medicin|veterinär|vaccin` → `medkit-outline`, `lek|leka|boll` → `football-outline`, `träning|träna|övning|miljöträning` → `fitness-outline`, `hemma|hem` → `home-outline`. Matchningen tokeniserar svensk text; om inga eller flera olika kategorier matchar används neutrala `list-outline`. En uttryckligen sparad ikon har alltid företräde. Fallback är deterministisk, läsvisad och skrivs aldrig tillbaka. Hemmets separata dagskort får inte börja visa ikonen.
- Vanligt tryck öppnar dagens rutinhantering utan att starta ikonredigering. Checkboxtryck ändrar endast completion. Long-press på dagens rutintext öppnar edit-läget med rätt rutin/punkt fokuserad och ikonväljaren öppen. Inga long-press-redigeringsgenvägar läggs på historiska/skip-/tränings-/hälsorader.
- Malländringar gäller framtida dagskopior. Befintliga dag- och skip-snapshots, completion och historikrader ändras inte när rutinens ikon ändras.

### Persistens och serverkontrakt

- Checklistans enda nya lagrade metadata är valfri `icon` i JSON-objektet: endast exakt `{id,label}` och `{id,label,icon}` accepteras. Icon-namn måste finnas i den gemensamma 20-värdesallowlisten och får inte vara null, tomt, okänt eller åtföljas av extra nycklar. SQL och TypeScript använder samma lista.
- Samma befintliga owner/dog-scopade create/replace RPC, revision/CAS, idempotent retry/readback och snapshotkedja sparar ikonen. `sameChecklist`, dirty-state och validering jämför ikonen. Ingen tabell, RPC-signatur, grant, RLS-policy, datakälla, dataändamål eller dependency ändras.
- A02:s enda migration exception är `supabase/migrations/202610220001_daily_routine_checklist_icons.sql`: den utökar endast `private.valid_daily_routine_checklist` för `icon`, behåller legacy `{id,label}`, omsluter function replacement + revoke i en transaktion och ändrar inte RPC/RLS/grants. Alla andra migrationer/RLS-ändringar är förbjudna i A02. Migrationen är källkod för lokal granskning och får inte köras mot någon databas inom detta arbete.
- Source-only A02 är inte rollout-redo: ett backend med gamla validatorn avvisar en malländring som skickar `icon`. Innan ikoner kan testas mot en verklig build måste migrationen granskas/applikeras i ett separat godkänt disposable development project och `HOME-ROUTINE-CHECKLIST-RUNTIME-VERIFY-01` verifiera create/replace/readback, äldre payload och RLS. Äldre appbyggen före A02 avvisar icon-formen vid läsning och kan även skriva över metadata vid rutinredigering. Därför får inga icon-bärande checklistor skrivas i production förrän gamla klienter inte längre kan läsa de berörda uppgifterna. En policy om att gamla klienter inte är samtidiga redigerare räcker inte. Om uppgraderingen inte kan garanteras krävs en separat granskad och verifierad versionsgrind eller kompatibel klient/serverprotokolländring före produktionsskrivningar. Production/real-user rollout och live Supabase/RLS är inte del av denna uppgift och redovisas NOT TESTABLE.

### Skrivvägar och skyddat område

Skrivvägar för A02: `src/features/home/DailyActivityManagerSheet.tsx`, `src/features/home/DailyChecklistScreen.tsx`, `src/components/ui/DailyActivityItem.tsx`, `src/components/ui/ThemedIcon.tsx`, `src/components/README.md`, `src/features/home/daily-activity-data.ts`, `src/features/home/daily-activity-model.ts`, `src/features/home/daily-routine-checklist-icons.ts`, `supabase/migrations/202610220001_daily_routine_checklist_icons.sql`, `src/features/home/README.md`, `tests/daily-routine-checklist-icons.test.mjs`, `tests/daily-activity-data.test.mjs`, `tests/daily-activity-model.test.mjs`, `tests/daily-activity-ui.test.mjs`, `tests/daily-checklist-screen.test.mjs`, relevant `tools/visual-check/` fixture/verifier files, `docs/design/evidence/flow-home-checklist-filters-2026-10-20/`, this plan, `docs/tasks/dev/FLOW-HOME-CHECKLIST-FILTERS-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md` and `docs/decisions/MASTER-LOG.md`.

Skyddat: migrations som redan finns, historiska rutiner/dagskopior, Home-kortets kompakta utformning, andra checklistflöden inklusive Kunskap, filters-/query-/RLS-/RPC-kontrakt, övriga paneler, dependencies, live database och användardata utanför syntetisk lokal testfixture.

### A02 v5 amendment — ämnesfärg på rutinikoner (2026-10-22)

Frozen Reviewer blockerade v4:s visuella acceptance eftersom Checklista visade alla valda och fallback-ikoner i samma gröna glyph och mintcirkel, trots panel-4-kontraktets varierade diskreta ämnesytor. Den befintliga A02-symbolen och persistensmodellen behålls; färg härleds deterministiskt från ikonen och skrivs inte till checklistdata.

- `daily-routine-checklist-icons.ts` definierar en enda tone-map över befintliga `tokens.colors.category`-roller. Endast tydliga symbol-/ämnesmatchningar färgsätts: `water-outline` → `water`; `walk-outline` → `walk`; `bed-outline/moon-outline` → `sleep`; `restaurant-outline` → `food`; `bandage-outline` → `vaccination`; `medkit-outline` → `veterinary`; `fitness-outline/school-outline` → `training`. Alla övriga valbara symboler inklusive generiska `paw`, `leaf`, `sunny`, `heart`, `flower`, `brush`, `football`, `sparkles`, `home`, `rose` och `star`, samt `list-outline`, använder neutral glyphfärg utan kategoribakning. Ingen svag eller gissad färgkategori får ersätta uniform grön.
- Samma mapping används i ikonväljaren, dagens Checklista-rad och rutinhanteringens sparade mallrad. Matchade ikoner får kategori-tokenens glyphfärg; endast deras visningsytor för dagens Checklista- och mallrader får motsvarande diskreta tokenbakning. Gridknappar behåller gemensam neutral yta. Neutral/generisk ikon får ingen kategoribakning. Radiogridens gröna valda ram och bock markerar selection state oberoende av ikonfärg; ikonfärg är inte en statuskod. Hemkortet förblir utan per-punkt-ikoner.
- Rendering återkörs för public/review vid 375×844, 430×844 och 375×667. A02-evidensmappen innehåller endast ikon-/rutinåtgärdsbilder och respektive resultat-JSON; orelaterade panelrenderingar har tagits bort.
- Inga lagrade fält, mutationer, fallbackregler, accessibility names, färdighetstillstånd, migrationer eller beroenden ändras. V5 lägger till en delad UI-presentation för checklistikoner; data-/säkerhetsgränserna ändras inte.

Architect och Critic granskade första utkastet till A02 v5 den 2026-10-22 och gav **CHANGES**: bara tydliga ikon/ämne-matcher får kategorifärg; övriga symboler ska vara neutrala. Surface-regeln, tone-map-test, kontrast och fristående selected state måste vara exakta och renderbara. Efter korrigering gav Architect **APPROVE** och Critic **PROCEED** för A02 v5 (2026-10-22). Planen ovan är den godkända skrivgränsen för färgkorrigeringen.

### A02 acceptance och verifiering

1. Rutinens skapa-/redigeraflöde visar ett ikonval per punkt, visar alla 20 verifierade glyphs utan textetiketter, sparar vald ikon i samma atomiska rutinmutation och återläser exakt samma val. Ikonändring gör utkastet dirty; Avbryt återställer det och retry återanvänder befintliga revisions-/mutationsegenskaper.
2. Idag-Checklistan visar varje sparad ikon med en deterministisk, befintlig tokenbaserad ämnesfärg; neutral legacy-ikon saknar ämnesfärgad bakning. För legacy-poster visas en semantiskt tydlig textmatch eller neutral listikon; samma item-ID ger samma ikon/färg utan att skriva metadata. Dagens completion och sparade historikrader fungerar som före ändringen. Hemkortet är fortsatt kompakt och visar inga nya rutinikoner.
3. Long-press på rutintext öppnar rätt rutin och punkt med ikonväljaren öppen; checkboxen bockar endast punkten; vanligt tryck öppnar hantering utan att börja editera. Historik, skip, träning och hälsa får inte öppna rutinredigering.
4. Icon-only visuellt grid, vald/disabled/radio state, skärmläsarnamn, kontrast, fokus, 44×44 pt mål och smala viewportar bedöms med färska public/review-renders mot aktuell panel 1/4-kontrakt och §14. Endast verkligt renderade och verifierade lägen markeras PASS.
5. Riktade tester täcker exakt SQL-/TS-allowlist och glyph-existens i installerad Ionicons-version, parser/validator, persistence/readback/retry, icon-only dirty update, stabil default för legacy, exakt icon-to-tone allowlist, neutral generisk symbol utan tint, öppna-/long-press-/checkbox-separation och avsaknad av ikon i Hemkortet. Renderkontrollen jämför kategorirollerna mot installerade tokenpar och verifierar att selected state har egen ram/bock. Kör därefter `pnpm check`, `pnpm bundle:ios`, `git diff --check` och `python -X utf8 tools/dev_flow.py validate`. Ingen SQL eller live databasoperation körs.
6. Oberoende UI QA, Architect och Critic granskar ändrat beteende/render; static Security granskar exakt ny migrationsdiff och befintlig owner-scoped RPC-kontext. Missad live migration/RLS/native verifiering hålls uttryckligen NOT TESTABLE.

Planstatus: A02 v4 fick Architect **APPROVE**, Critic **PROCEED** och Security **CLEAR med utrullningsvillkor** (2026-10-22). Frozen Reviewer blockerade den första v4-renderingen på grund av identisk grön/mint-presentation. Architect/Critic gav **CHANGES** på första v5-utkastet och därefter **APPROVE/PROCEED** på den reviderade tokenplanen. Efter implementation verifierade oberoende QA och frozen Reviewer den korrigerade v5-renderingen med **PASS**. Migrationen/runtime är fortsatt inte verifierade mot databas.

### A02 implementation checkpoint — 2026-10-22

- Återinfört val per rutinpunkt med 20 allowlistade Ionicons, svenska tillgänglighetsnamn och tydlig valdmarkering. Långtryck i dagens Checklista öppnar rätt rutin och punkt med väljaren öppen. Hemmets dagskort förblir kompakt.
- Legacyetiketter får endast entydiga, deterministiska ämnesikoner; annars används neutral `list-outline`. Sparad ikon har företräde, fallback skrivs inte tillbaka och dagens frysta dagsrad/completion ändras inte när rutinmallen sparas.
- Båda rutinåtgärderna är ikon-only och visar separata bekräftelsetexter; avbryt gör ingen ändring och bekräfta utför handlingen.
- Public och review-render PASS vid 375×844, 430×844 och 375×667. Browserflödet täcker ikonval/readback, minsta 44×44-mål, checkboxens frysta status och båda bekräftelserna. Bilder/resultat finns i `docs/design/evidence/flow-home-checklist-filters-2026-10-20/a02/{public,review}/`; sammanställning finns i `VERIFICATION.md`.
- `pnpm check` PASS (65/65 tester); public `pnpm bundle:ios` PASS (1 460 moduler); `git diff --check`, `python -X utf8 tools/dev_flow.py validate` och installerade Ionicons-glyph/SQL-allowlistkontroller PASS. UX Critic implementation review **PROCEED**, oberoende QA **PASS** och frozen Reviewer **PASS** på v5:s tokenmappning/render. Lägsta uppmätta ikonkontrast är 4,97:1.
- Live Supabase/RLS, migrationsapply, äldre klienter, native VoiceOver/Dynamic Type/long-press och fysisk iPhone-build är NOT TESTABLE här. Migrationen är endast källkod. De manuella testerna 1–4 som Erik godkänt hålls stängda.

Den historiska v4-renderingen ersattes av v5:s godkända tokenpresentation. Detta stänger den lokala A02-ikonslicen, inte hela panel-4-resan. `Kommande`, källnavigation/retur och full panel-4-§14-acceptans är fortsatt öppna. Native Alert/VoiceOver/Dynamic Type, live Supabase/RLS, migrationsapply och äldre klienters runtime är inte verifierade. Inga produktionsskrivningar med ikonmetadata får göras innan säkerhetsgrinden ovan är uppfylld.

Architect review A02 v1, 2026-10-22: **CHANGES** — make the named migration the sole exception to the protected-migrations rule; wrap validator replacement/revoke in a transaction; state the separate migration/runtime gate and that a backend with the old validator rejects icon writes. Architect also identified three implementation gaps to close: varied stable fallback for legacy items, long-press item focus/open-picker, and removal of visible title from the symbol-only picker. All requested plan corrections are recorded in A02 v2 below.

Architect review A02 v2, 2026-10-22: **APPROVE** — the migration is the sole named exception, replaces/revokes transactionally, preserves legacy payloads and existing RPC/RLS contracts, and rollout is gated by the separate runtime task. No database operation was performed.

Critic review A02 v2, 2026-10-22: **PROCEED WITH CHANGES** — keep ordinary management/edit available alongside long-press; avoid subject-mismatched random fallback icons. A02 v3 specifies clear text-to-icon matches only, otherwise a neutral icon, without writing fallback metadata.

Security review A02 v2, 2026-10-22: **CLEAR for static migration review** — exact legacy/icon payload validation, allowlist, transaction, privilege invariance and snapshot compatibility pass. Compatibility caveat: an older client rejects icon-bearing read payloads and may erase icon fields when replacing a checklist. Until a new contract/version gate is separately reviewed, rollout must ensure older clients are not concurrent editors. No database/runtime verification performed.

Architect review A02 v3, 2026-10-22: **CHANGES** — the optional-icon persistence and named migration remain acceptable. Define the legacy fallback mapping explicitly and synchronize task/queue from v2 to v3. The runtime verification task stays the migration rollout gate.

Critic review A02 v3, 2026-10-22: **PROCEED** — clear Swedish text matches map to relevant icons; unmatched or ambiguous labels use deterministic neutral `list-outline`, without persistence. Ordinary management, focused long-press edit, and checkbox completion remain separate; Home stays compact; manual tests 1–4 remain closed.

Security review A02 v3, 2026-10-22: **CLEAR with rollout condition** — no old client may read or edit icon-bearing checklist data; migration application and runtime behavior remain untested. The source migration is unchanged from the reviewed version.

Architect review A02 v4, 2026-10-22: **APPROVE** — explicit Swedish token mapping is deterministic; no match or conflicting categories use `list-outline`; a saved icon takes precedence. Queue and task journal are synchronized. Production icon writes remain blocked while pre-A02 clients can read the affected data; any version gate/compatible protocol requires separate review and verification.

Critic review A02 v4, 2026-10-22: **PROCEED** — the deterministic normalized-token map and neutral fallback avoid misleading subject icons. Saved icons take precedence and the fallback stays read-only. Manual tests 1–4 remain closed.

Security review A02 v4, 2026-10-22: **CLEAR** — the plan blocks production icon writes until old clients cannot access icon-bearing checklist data or a separately reviewed compatibility solution is verified. Migration source is unchanged. Database application, grants/RLS and runtime remain untested.

## A03 implementation checkpoint — Kommande och källretur (2026-10-22)

A03 implementerar redan godkända v2-resor utan att ändra dataändamål, schema, RLS, mutationer eller migrationer: alla fyra filter använder den avgränsade workspace-state; Kommande visar read-only planerade återfallsrutiner och befintliga hälsoplaner; planerade rader räknas aldrig som utförda; historisk träning öppnas på exakt publicerat steg i read-only-läge; källretur bevarar filter och scroll. Fokuserad verifiering använder produktionsskärmarna via `tools/visual-check/vision-r02-home-panels-app.tsx` och `tools/visual-check/verify-checklist-filters.py`. De tillhörande skrivvägarna omfattar även `tests/daily-checklist-route.test.mjs`, `tests/daily-checklist-screen.test.mjs`, `tests/planned-health.test.mjs` och A03-evidensmappen.

Den dedikerade verifieraren ger 19/19 syntetiska review-kontroller och 10/10 public-kontroller. Detta är en lokal kontroll av panel-4-filter/källresor, inte full §14-acceptans eller oberoende A03 QA/Reviewer. En separat bred Home-review-kontroll hittar en 4 pt-överlappning i review-fixturens initiala Home-layout; den ligger utanför panel-4-skrivvägarna och flyttas till en separat Home-korrigering. Live Supabase/RLS, A02-migration/runtime och native accessibility är fortsatt NOT TESTABLE.

Eriks önskemål om att checklistor i Kunskap ska kännas mer som Hemmets checklistor registreras som en separat UX-uppföljning. Den publicerade faschecklistan och ägarens återanvändbara/återkommande Hemrutiner har olika innebörd och persistence; den här planen ändrar inte Kunskap. Ikonval på Kunskapens egna punkter kräver ett separat granskat persistenskontrakt om valet ska sparas. Någon tabell saknas inte utifrån nuvarande fynd; A02:s migration utökar en JSON-validator i befintlig rutinväg och har inte applicerats.

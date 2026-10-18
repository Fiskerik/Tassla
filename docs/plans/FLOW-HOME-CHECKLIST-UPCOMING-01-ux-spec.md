# FLOW-HOME-CHECKLIST-UPCOMING-01 — UX-spec v10

Status 2026-10-17: V10 preserves the v9 retry ownership and monotonic A→B→A fence while moving the render-captured generation to React state to satisfy `react-hooks/refs`. Exact v10 plan review: Architect APPROVE, Critic APPROVE, Security PASS; independent QA v10 PASS (569 full tests, focused 31/31, public/review 12/12 each). Security implementation review v10 PASS; independent Reviewer evidence recheck PASS. Visual §14.16 comparison is NOT TESTABLE because vision_rev02 has no dedicated Kommande reference. See `docs/design/evidence/vision-rev02/checklist/UPCOMING-01/README.md`.

## Användarmål och ingång

I Checklista öppnar användaren Kommande för att se verkliga framtidsplaner för vald hund. Fliken är en skrivskyddad översikt med tydliga vägar till befintlig hantering.

## Källa och interaktion

- Planerade vaccinationer/veterinärbesök: läs dog_health_plans för aktuell hund med due_on > dailyDateKey före sidgränsen, sortera datum/id och visa upp till 40 närmaste poster. Tryck hämtar vald full post med befintlig dog-scopead fetchPlannedHealthById, öppnar dess id direkt i redigeringsläge och återgår till Kommande.
- Checklista-entry sätter visible back text och accessibilityLabel till “Checklista” och returnerar till samma Kommande-tab. Hälsa-entry behåller “Hälsa” och sin nuvarande destination.
- Upprepande rutin: läs sparad rutinmall för aktuell hund utan dagsmaterialisering; beräkna en nästa förekomst efter idag med befintlig recurrence-regel. Visa högst en förekomst per mall.
- Rutiner utan repeatregel och framtida träningspass saknar konkret framtidsplan och visas inte.
- Rutinhändelsens Hantera öppnar just mallen. Ändring av repeatregel flyttar bara beräknat datum. Dagsspecifika val som Välj för idag gäller idag och skapar ingen framtida status.
- Ingen handling skapar, väljer, slutför eller hoppar över en framtida dagsrad.

## Hierarki och återkoppling

Återanvänd Checklistas segmentflik och listrader. Varje rad visar namn, datum och eventuell sparad tid. Framtida rutin saknar checkbox/completion-status.

- Ready med rader: datumstigande lista.
- Ready utan rader på redan öppen flik: Inga kommande aktiviteter. Vid ny inresa saknas fliken när båda källor är klara och tomma.
- Loading eller fel: fliken är åtkomlig med källspecifik laddning eller Retry.
- En källa ready och den andra loading/error: visa bekräftade rader med tydlig varning att listan är ofullständig.
- Retry läser endast den felande källan. Kommande källstatus är separat från sammansatt dag-/träningsläsning.
- Owner/account-generation, hund-, lokal dag- eller tidszonbyte döljer gamla resultat direkt; svar från äldre scope ignoreras.

## Datum, tid och tillgänglighet

Datum-only värden behåller kalenderdatum och konverteras inte via UTC. Dagens gräns använder Checklistas validerade IANA dailyTimeZone och dailyDateKey. Due_time visas som sparad lokal tid. Datum, åtgärd och tillbaka-knapp har åtkomliga etiketter; stor text får radbryta och sidan kan scrolla.

## Referensjämförelse

| Rev02-referens | Nuvarande skillnad | Återbruk | Acceptans |
|---|---|---|---|
| Panel 4 har kompakt segmentflik över en sammanhängande lista; innehåll är inte datakälla | Kommande saknas eftersom den saknar verifierat urval | Tabs, ListRow och befintliga tokens | Kommande syns under laddning/fel och vid verkliga framtidsplaner; ingen referenscopy eller rekommendation blir data |
| Rutiner har dagsstatus i befintliga vyer | En framtida förekomst är en härledd tidpunkt | Befintlig rutinmanager med fokuserad mall | Ingen completionindikator eller framtida mutation; åtgärder gäller mallen eller uttryckligen idag |
| Hälsosida har tillbaka till Hälsa | En plan kan öppnas från Kommande | Befintlig planned-health screen med entry-id | Rätt plan öppnas i redigering; tillbaka-label och destination följer startskärmen |

## Skyddat

Ingen ny backendfunktion, RPC, notifiering, kalenderkoppling, schema, dependency eller data-purpose. R3c läser befintliga ägarplaner och rutinmallar med befintliga dog-scope/RLS-gränser. Idag/Denna vecka/Alla och tidigare planerade hälsoresor behåller beteende.

## QA delta v4

V4 ändrar inte produktens UX- eller datakontrakt. Den tillåter syntetiska fixtures i redan använda test- och visual-check-filer för att verifiera de tillstånd och resor som v3 kräver: två oberoende framtidskällor, sortering och datumprecision, retry/partial/empty, vald hälsoevents direkta redigering och rätt återgång, samt rutinhantering utan framtida completion. Public/review browserkontroller använder samma `DailyChecklistScreen` och `PlannedHealthScreen` som appen. Bilder och JSON sparas i den befintliga R3c evidence-mappen; native och live RLS är separata och inte godkända av dessa fixtures.

## QA delta v5

V5 bevarar det syntetiska, lokala och QA-only kontraktet från v4. Den testar uttryckligen tidigare review-fynd: uppdaterad prognos efter lyckad rutinmallmutation, invalidation av en sen plan-readback efter tab/sid/scopebyte, samt dirty planned-health edit med tydliga stanna kvar/lämna utan att spara-val. Statiska testassertioner granskar ProductWorkspace-wiring för vald plan, edit-id, entry-origin/back-route och fokuserad rutinmanager. Browserfixture kör komponenternas presentation och sina uttryckligen syntetiska callbacks; det är inte runtimebevis för ProductWorkspace eller databas.

Spara jämförbara public/review-bilder och resultat i befintlig evidence-mapp. Bedöm §14.16 separat för komposition, färg, typografi, komponentformer, bildspråk och innehållstäthet. Ingen direkt rev02-referens för Kommande-panelen är identifierad; saknade panelbevis markeras NOT TESTABLE och får inte rapporteras som visuell PASS. En funktionell/förväntad regressionsassertion som visar produktionsbrist stoppar QA-deltat; korrigering i produktionskod kräver en separat granskad plan.

## QA delta v6 — nätverksisolering

V6 behåller alla syntetiska regressioner från v5. `r3c-upcoming`-verifieraren måste avsluta före browser launch om `TASSLA_UI_BASE_URL` inte är en giltig explicit HTTP-loopback-URL utan credentials/query/fragment. Playwright route guard tillåter endast exakt validerad origin; alla andra requests avbryts, sparas som fel i resultatfilen och får körningen att fallera. Public och review körs mot separata, explicit startade lokala fixture-origins.

Datatest använder enbart den syntetiska Supabase-klienten på `.invalid` med avstängd autorefresh/sessionpersistens och injicerad fetch. Alla testhandlers är fail-closed: oväntad metod, path, RPC eller auth endpoint kastar fel; tester bekräftar inga extra requests och ingen live fallback. V6 får inte använda konton eller live endpoints.

## Korrigerings- och QA-delta v7

Endast en bekräftat `saved` create/update/delete av en rutinmall invaliderar Kommandes rutinsnapshot och startar om just den hund-/konto-/lokaldag-/tidszonsscopeade rutinläsningen. ProductWorkspace fångar den fullständiga upcomingScopeKey före routine-template-writen. Efter den awaited dagens reload får refresh bara ske om komponenten fortfarande är mountad, daily lifetime inte har ändrats och current scope-ref fortfarande exakt matchar den fångade owner/accountGeneration/dog/dailyDateKey/dailyTimeZone-nyckeln. Därmed kan ett konto-/hund-/datum-/tidszonsbyte medan dagens reload väntar inte invalidera eller läsa om den nya scopen. Om dagens reload misslyckas men routine-template-save bekräftats och scopen är densamma ska Kommande ändå laddas om; dagens och framtidens felstatus redovisas var för sig.

Under Kommande-omläsningen används befintliga loading/error/partial/Retry-tillstånd; en läsförlust lämnas synlig som fel med endast rutin-Retry. Den nya refreshen startar ingen ytterligare dags- eller träningsläsning och lämnar hälso- och träningskällorna orörda; den befintliga väntade dagsomläsningen efter sparning fortsätter som tidigare och behåller sina nuvarande tillstånd. Dagsspecifik select/remove/complete/skip och training-writes refresha inte rutinprognosen. `failed` och `unknown` routine-template writes varken triggar denna extra refresh eller presenteras som sparade; befintlig osäker/misslyckad skrivåterkoppling gäller. QA lägger till en ProductWorkspace wiringregression och kör sedan hela tidigare godkända v6:s data-/recurrence-/synthetic public/review-visualkontroller. Ingen live RLS/native PASS hävdas.


## Korrigerings- och QA-delta v8 (ersatt)

Hem-managern och Checklistans Alla-manager har varsin befintlig mutation route. Efter bekräftad sparning refresha Hem via ProductWorkspace; Alla refresha via Checklistas befintliga saved-wrapper. Bara en av dessa owners agerar per route. Checklistans callback fångar hela account/dog/date/timezone-scope och ignorerar sen callback efter scopebyte. Misslyckade eller osäkra skrivningar ändrar inte prognosen.

Vid 140 % textproxy ska QA rulla själva horisontella Avsnitt-tabbraden tills aktiva Kommande är helt synlig och kontrollera att tab och text ligger inom scrollporten. Alla tabbar måste inte synas samtidigt. Om labeln fortfarande klipps efter scrollning krävs en separat produktionsplan; den här kontrollen ändrar inte gemensamma Tabs.


## Korrigerings- och QA-delta v9

Scope-fence använder både full serialiserad key och monoton generation som ökas vid varje committed scope-övergång. Båda måste matcha efter await och vid sen callback; A→B→A avvisas även om key åter blir samma.

Refresh-owner täcker även retry: Home sparad write eller saved retry uppdateras av ProductWorkspace. Checklistans initiala `origin: 'all'` saved write uppdateras av befintlig saved-wrapper, medan parent refresha endast om en senare `origin: 'all'` retry själv återkommer `saved`. Därmed refresha varje bekräftad malländring exakt en gång. Failed/unknown och dagsspecifika eller träningswrites gör ingen refresh.

140 %-textkontrollen rullar Avsnitt-tabbraden till aktiva Kommande, verifierar label- och tabbounds inom scrollporten och sparar bilden efter scroll. Inga ändringar görs i gemensamma Tabs.

## Korrigerande UX-/QA-delta v10

Ingen produktupplevelse eller dataregel ändras. Den monotona scopegenerationen förblir del av den interna stale-response-fence som skyddar Kommande vid A→B→A. React-state bär generationen som handlers fångar under render; refen uppdateras endast i scope-`useLayoutEffect` och jämförs endast från effekter och handlers. En oförändrad scope ökar inte generationen; två bekräftade scope-övergångar ökar den två gånger. R3c:s single-owner refresh, saved retry, fel/unknown-beteende, tabbar och källspecifika återkoppling består.
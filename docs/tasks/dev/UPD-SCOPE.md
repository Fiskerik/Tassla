# UPD-SCOPE – Dokumentera segmentet UPD-1011

Datum: 2026-10-11
Planversion: v8 – Product PROCEED, Critic PROCEED, Architect APPROVE; dog_expert PASS
Status: implementing

## Mandat och mål

Eriks beslut 2026-10-11 godkänner segmentet UPD-1011 som ett avgränsat tillägg till MVP:n. Detta paket dokumenterar beslutet och registrerar efterföljande paket som planerade. Det gör ingen appfunktion tillgänglig.

## Ändringsyta

- `docs/mvp.md` – nytt avsnitt ”Eriks tillägg 2026-10-11” med paket 2–9 och gränser mot befintliga undantag.
- `docs/decisions/0007-upd-1011.md` – beslutspost enligt mallen.
- `src/features/puppy-log/log-model.ts` – en kort kommentar vid `summarizePottyPatterns` som beskriver ägarloggar, retrospektiv uppskattning och att resultatet aldrig är en uppmaning.
- `docs/tasks/dev/queue.json` – registrera UPD-1011 med nio paket i angiven ordning och tydliga skrivvägar; UPD-SCOPE är `implementing` och de åtta efterföljande paketen är `planned`.

Eriks ”endast docs”-beskrivning omfattar här endast den särskilt begärda enradiga kodkommentaren i `log-model.ts`; ingen körbar kod eller något beteende ändras. Endast Eriks uttryckligen godkända loggfält läggs till i befintligt ägarloggflöde. Inga ytterligare ändamål eller delningar tillkommer. Inga nya beroenden eller appbeteenden införs i detta dokumentationspaket.

## Acceptans

1. MVP:n anger att olyckstyp, matmängd och fodertyp samt vattenmängd är ägarregistrerade uppgifter; de beskriver endast vad ägaren loggat.
2. Loggarna bedömer inte hälsa eller måltidsbehov och avgör inte om en mängd eller ett intervall är lämpligt. Undvik formuleringen ”sjukdomsläge”.
3. Beräkningar i Home får uppskatta tid från retrospektiva intervall mellan samma hunds tidigare ägarloggar, märkta ”Uppskattning från era loggar”. ”Dags att gå ut om …” och ”ska äta om …” är informativa estimat utan CTA, uppmaning, påminnelse eller rekommendation. De bedömer inte om mängder eller intervall är lämpliga och föreslår inte handling. Saknade loggar betyder inte att en händelse uteblivit. Visa ingen siffra vid otillräckligt underlag. Olycksloggar antyder inte träningsframsteg eller behov.
4. Tillägget skiljer sig uttryckligen från ”Utanför MVP”: ingen symptomhantering, diagnos, avancerad mönsterigenkänning/AI eller foderrekommendationer.
5. De fem UPD-ARTICLES-texterna är endast utkast: ingen av dem publiceras i UPD-1011 eller visas för appägare. All framtida publicering ligger utanför segmentet och kräver nytt uttryckligt mandat. Checklistor följer Eriks separata UI-beslut: befintliga exempel får visas som tillfälliga exempel med etiketten ”Tillfälligt exempel – inte sakgranskat”, visad en gång ovanför faslistan och inte per punkt eller fas. De får inte beskrivas som sakgranskade. Etiketten publicerar inte artikelutkasten.
6. Träningsprogress räknar bekräftat genomförda steg, inte öppnade eller lästa steg.
7. Kön har registrerat samtliga nio UPD-paket i ordning med fullständiga uppgiftsfält; UPD-SCOPE är `implementing` och övriga åtta är `planned`. `python tools/dev_flow.py validate` passerar.
8. Loggmodellens kommentar stämmer med det godkända undantaget och skapar inget nytt beteende.
9. Home-sammanfattningen visar `due_time` för kommande veterinärbesök och vaccinationer när tid finns. `reminder_minutes` visas aldrig där.

## Kontroller

- `python tools/dev_flow.py validate`
- `python tools/dev_flow.py status`
- `git diff --check`
- Manuell kontroll av beslutsnummer, hänvisningar, kö-ID:n, beroenden och att inga orelaterade filer ändrats.

## Beroenden och granskningsgrindar

- Segmentmandat: uttryckligen godkänt av Erik i uppgiften ”Tassla-uppdatering 2026-10-11”.
- Product 2026-10-11: PROCEED; kräv positiv etikett, neutral formulering, lokal hundhistorik och bekräftad träningsprogress.
- Critic 2026-10-11: PROCEED WITH CHANGES; gränserna i acceptans 1–5 och utkastspärren ska hållas.
- Dog_expert har granskat scopeformuleringen före införande i `docs/mvp.md`; inga artikeltexter sakgranskades.
- Architect ska APPROVE denna exakta plan innan ändringar genomförs.
- Efter att paketet är klart krävs QA och oberoende Reviewer enligt `docs/dev/workflow.md`; köstatus och checkpoint uppdateras med verkliga resultat.

## Paketordning, beroenden och queue-kontrakt

Paketen genomförs i den ordning Erik listade dem: UPD-SCOPE → UPD-LOG-DATA → UPD-LOG-UI → UPD-HEALTH-TIME → UPD-HOME → UPD-TRAIN → UPD-ONB-PICKUP → UPD-CHECKLIST-UI → UPD-ARTICLES. Paket 4 är tekniskt oberoende av paket 3, men körs efter det för att följa mandatet om ett paket i taget och ordningen i uppgiften.

`tools/dev_flow.py` saknar CLI-kommando för att skapa köposter; det har `status`, `validate` och `transition`. De nio UPD-posterna läggs därför in via `tools.dev_flow.save()` med verktygets schema-/kövalidering. UPD-SCOPE sätts till `implementing` när genomförandet startar; de åtta efterföljande paketen är `planned`. Därefter körs CLI-kommandona `python tools/dev_flow.py validate` och `python tools/dev_flow.py status`. Varje post innehåller id, title, mvp_requirement, plan, write_paths, acceptance, checks, depends_on, status, history och next_step. Den fullständiga versionssatta paketplanen skapas och granskas innan respektive paket startar.

| Paket | Syfte | Paketunika skrivvägar (utöver plan, kö, rapport och historik) | Beroende |
|---|---|---|---|
| UPD-SCOPE | Scopebeslut och paketkö | `docs/mvp.md`, `docs/decisions/0007-upd-1011.md`, `src/features/puppy-log/log-model.ts` | – |
| UPD-LOG-DATA | Valfria olycks-, mat- och vattenfält | `supabase/migrations/`, `supabase/README.md`, `src/data/contracts.ts`, `src/data/workspace-data.ts`, `src/features/puppy-log/log-model.ts`, `src/features/puppy-log/README.md`, `tests/` | UPD-SCOPE |
| UPD-LOG-UI | Valfri inmatning och redigering av loggdetaljer | `src/features/puppy-log/LogScreen.tsx`, `src/features/puppy-log/log-model.ts`, `src/features/puppy-log/README.md`, `tests/` | UPD-LOG-DATA |
| UPD-HEALTH-TIME | Visa besökstid, inte påminnelsetid | `src/features/health/PlannedHealthScreen.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/HomeCarousel.tsx`, `tests/planned-health-time.test.mjs` | UPD-LOG-UI (ordningsgrind; tekniskt oberoende) |
| UPD-HOME | Sammanfattning och loggbaserade estimat; kommande veterinärbesök/vaccinationer visar `due_time`, aldrig `reminder_minutes` | `src/features/home/home-summary.ts`, `src/features/home/HomeScreen.tsx`, `src/features/home/HomeCarousel.tsx`, `src/features/home/README.md`, `tests/` | UPD-HEALTH-TIME |
| UPD-TRAIN | Programkort och genomförandeprogress | `src/features/training/TrainingScreen.tsx`, `src/features/training/README.md`, `tests/` | UPD-HOME (ordningsgrind) |
| UPD-ONB-PICKUP | Hämtningsdatum och fasförslag | `supabase/migrations/`, `supabase/README.md`, `src/data/contracts.ts`, `src/data/workspace-data.ts`, `src/features/onboarding/ProfileScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/knowledge/checklist-model.ts`, `src/content/select-content.ts`, `tests/` | UPD-TRAIN |
| UPD-CHECKLIST-UI | Checklistor som faslinje | `src/features/knowledge/PuppyChecklistScreen.tsx`, `src/features/knowledge/README.md`, `tests/checklist-ui.test.mjs` | UPD-ONB-PICKUP |
| UPD-ARTICLES | Källbelagda granskningsutkast | `src/features/knowledge/review-content.ts`, `src/features/knowledge/source-links.ts`, `supabase/content/`, `tests/` | UPD-CHECKLIST-UI |

Varje köpost innehåller workflow-kontraktets fält: id, title, mvp_requirement, plan, konkreta write_paths, acceptance, checks, depends_on, status, history och next_step. Samtliga äger också sin `docs/tasks/dev/UPD-<ID>.md`-plan samt koordinationsfilerna `queue.json`, `rapport.md` och `HISTORY-2026.md`; dessa skrivvägar finns uttryckligen i köposterna. Paketplanen preciseras före respektive start.

Paket genomförs ett i taget. En beroendefri uppgift får inte starta före sitt eget plan- och granskningsflöde. Paketplanerna får precisera beroenden efter Architect-granskning utan att utöka Eriks mandat.

## Öppna kontrollpunkter inför senare paket

- Föreslagen miniminivå och tidsfönster för logg-estimat ska märkas ”föreslagna, ej validerade”.
- Hämtningsdatumets övre gräns och ”första dagarna”-period ska föreslås och märkas ej validerade.
- Verifiera befintlig tydlig träningsmarkering innan progress räknas.
- Verifiera att granskningsutkast inte kan läcka till publicerat innehåll innan artiklar skrivs in.
- Live-databas/RLS och renderad UI-evidens rapporteras NOT TESTABLE om miljö/evidens saknas.

## Granskning

Product, v1, 2026-10-11: **PROCEED**. Föreslog att hålla uppskattningar bakåtblickande och tydligt märkta; begränsa foderförslag till den aktiva hundens egna värden; räkna bara bekräftat genomförda träningssteg; hålla innehåll i utkast tills separat publiceringsbeslut.

Critic, v1, 2026-10-11: **PROCEED WITH CHANGES**. Förtydliga att foder- och vattenfält bara registrerar ägarens uppgifter, att estimat inte ger symptomtolkning eller uppmaningar, att förslag är lokala för samma hund och att utkast aldrig syns för användare före granskning och separat beslut. Dessa gränser ingår i planen.

Dog_expert, 2026-10-11: **PASS**. Rekommenderade att beskriva olyckstyp, matmängd/fodertyp och vattenmängd som ägarens angivna uppgifter (inte ”sjukdomsläge”), använda samma hunds tidigare ägarloggar, inte tolka frånvaro av logg som frånvaro av händelse, hålla uppskattningen fri från hälsobedömning/uppmaning och inte dra träningsslutsatser från olyckor. Inget artikelinnehåll sakgranskades.

Product, v3, 2026-10-11: **PROCEED**. Bekräftade att v3 korrekt anger godkända fält, estimat från samma hunds historik utan hälsobedömningar eller uppmaningar och har rättad hundexpertformulering.

Critic, v3: PROCEED WITH CHANGES. Före godkännande begärde kritikern att skilja granskningsutkast från checklistornas uttryckligen begärda tillfälliga exempel, uppdatera köplaner och svensk acceptans, ange `due_time` i Home-sammanfattningen samt uttryckligen avgränsa kommentarändringen. Dessa ändringar ingår i v4.

Product, v4, 2026-10-11: **CHANGES**. Begärde att precisera att checklistetiketten visas en gång ovanför faslistan (inte per punkt/fas), samt att Home uttryckligen visar `due_time` för planerade veterinärbesök/vaccinationer och aldrig `reminder_minutes`. Dessa punkter ingår i v5.

Product, v5, 2026-10-11: **PROCEED**. Bekräftade checklistetikettens placering, separation från artikelutkast, kommentarsundantagets omfattning och Home-sammanfattningens användning av `due_time` utan `reminder_minutes`.

Product, v6, 2026-10-11: **PROCEED**. Bekräftade att inga artiklar publiceras i UPD-1011, att framtida publicering kräver nytt mandat och att checklistetiketten visas en gång ovanför faslistan.

Critic, v5: **CHANGES**. Bekräftade att tidigare fynd är lösta och begärde att uttryckligen säga att ingen artikel publiceras inom UPD-1011; framtida publicering ska kräva nytt mandat utanför segmentet. Detta är infört i v6.

Critic, v6, 2026-10-11: **PROCEED**. Bekräftade att artikelpublicering, checklistetikettens placering, köreferenser, svenska acceptanskriterier, Home-tid och kommentarundantag är tydliga.

Architect, 2026-10-11: **CHANGES v1**. Begärde att registrera hundexpertgränserna, rätta Critic-verdict, förtydliga köregistrering och fullständiga task-kontrakt samt fastställa körordning. Dessa ändringar finns i v2; ny Architect-granskning krävs.

Architect, v2, 2026-10-11: **CHANGES**. Planen behövde förnyad Product/Critic-granskning efter ändringarna samt en korrigering av hundexpertstatus, köreferens och tabellhuvud. Dessa punkter hanteras i v3.

Architect, v6, 2026-10-11: **APPROVE**. Godkände exakt plan v6; noterade att framtida paket behöver egna granskade planer och relevanta Security-granskningar.

Architect, v7, 2026-10-11: **APPROVE**. Godkände korrigeringen av acceptanspunkt 7 mot faktisk köstatus.

Reviewer, v6, 2026-10-11: **BLOCK**. Hittade att acceptanspunkt 7 felaktigt kallade samtliga paket `planned`, trots att UPD-SCOPE är `implementing`. Övrig diff bedömdes ligga inom scope. Korrigerat i v7; förnyade planreviews och Reviewer-omprov krävs.

Product/Critic/Architect, v7: PROCEED/PROCEED/APPROVE. Planändringen rättar endast den faktiska köstatusen; scope och implementation är oförändrade.

Product, v7, 2026-10-11: **PROCEED**. Bekräftade att acceptanspunkt 7 överensstämmer med köstatus; inga produktändringar begärdes.

Critic, v7, 2026-10-11: **PROCEED**. Bekräftade att acceptanspunkt 7 nu matchar köstatus; inga scopeändringar i korrigeringen.

Product, v8, 2026-10-11: **PROCEED**. Bekräftade att planens köbeskrivning, acceptanspunkt 7 och aktuella `next_step` motsvarar verklig status; inga scope- eller copyändringar begärdes.

Critic, v8, 2026-10-11: **PROCEED**. Bekräftade att statusmetadata och `next_step` är konsekventa; inga scopeändringar begärdes.

Architect, v8, 2026-10-11: **APPROVE**. Godkände att planen och kön anger UPD-SCOPE som `implementing` och de övriga åtta paketen som `planned`; Product/Critic-granskning och kövalidering är registrerade.

QA, v8, 2026-10-11: **PASS**. Kontrollerade att planversion, accepterad statusfördelning, paketordning och aktuellt nästa steg stämmer med kön; beslut, MVP-text och artikelutkastens avgränsning matchar mandatet. `python tools/dev_flow.py validate` och `git diff --check` passerade (exit 0). `pnpm check` kördes av koordinatorn och passerade med 37/37 testfiler, 0 fel och 38 lintvarningar; QA körde inte om det.

Reviewer, v8, 2026-10-11: **PASS**. Oberoende granskning fann att diffen följer godkänt scope: dokumentation, köregistrering och uttryckligen begärd kommentar utan körbar beteendeförändring. Beslut/MVP bevarar gränserna; alla nio paket står i rätt ordning med rätt statusfördelning. Reviewer körde `python tools/dev_flow.py validate` och `git diff --check`; båda passerade.

## Checkpoint

Alla nio paket är registrerade i `docs/tasks/dev/queue.json`; UPD-SCOPE är klar för lokal commit och övriga åtta är `planned`. MVP-avsnittet, beslut 0007 och den begärda kodkommentaren är uppdaterade. Efter QA:s v7-omprov rättade v8 köpostens aktuella `next_step` och planens beskrivning av köstatus utan scope- eller kodändring. Product/Critic PROCEED, Architect APPROVE, QA PASS och Reviewer PASS är registrerade. `pnpm check`, kövalidering och `git diff --check` passerade. Nästa steg: lokal commit med normala hooks, därefter spara commit-ID i historik och rapport.

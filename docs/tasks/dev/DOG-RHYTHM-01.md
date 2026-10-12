# DOG-RHYTHM-01 – kiss-/bajsmönster i Hem-summeringen

Status: **DONE**. v2.9 slutcopy implementerad; Critic PROCEED; oberoende QA och Reviewer PASS; full lokal verifiering PASS. Live Supabase RLS och native-enhetstest är NOT TESTABLE och följs separat. Branch: `feedback-2026-10-12`.

## Mandat

Erik beställde en loggbaserad uppskattning och dagsfärsk summering på Hem. Han har preciserat presentationen: före tio loggningar ska den kallas **Estimerad** och bygga på generell information; från tio loggningar per kategori får mönstret anpassas till hunden och kallas **Rekommenderad**. Gränsen gäller separat för kiss och bajs. Det är en uppskattning av loggmönster, inte ett mått på hundens faktiska behov.

## Beräknings- och visningskontrakt för granskning

- Indata: `dogId`, kompletta kiss-/bajshändelser för rullande fönster, separat explicit hämtningsstatus för denna historik, `now` och appens lokala datum. Den befintliga Hem-loggpropens första 40 rader får inte räknas som fullständiga 30-dagars- eller dagsdata. Endast `pee`/`poop`, samma `dogId`, sparade ägarhändelser (`origin: 'local-test'`), giltiga och inte framtida ISO-tider. Ignorera exempeldata, andra hundar, dubbletter och okända typer.
- Kiss och bajs beräknas oberoende. Använd högst de tio senaste unika händelserna per typ från ett rullande fönster på 30 × 24 timmar före `now`. Om flera loggar har samma tidsstämpel räknas de som en händelse; behåll den med lexikografiskt lägsta `id`. Minst tio händelser per kategori krävs och de ska täcka minst två lokala kalenderdatum och 24 timmar. Tio händelser totalt räcker inte.
- Personlig beräkning: sortera händelser stigande; beräkna de nio positiva tidsavstånden i minuter. Om ett avstånd överstiger 12 timmar för kiss eller 36 timmar för bajs ska just det avståndet uteslutas eftersom det kan innehålla missade loggar. Krävs minst åtta kvarvarande intervall; annars fall tillbaka till Estimerad. Medianen av kvarvarande intervall är det historiska typiska intervallet mellan registrerade händelser. Beräkna MAD från kvarvarande intervall. Om MAD överstiger 60 minuter ska inget tidsfönster projiceras; visa endast den deskriptiva medianen och förklara att tiderna varierar. Annars centreras tidsfönstret på senaste händelse + median, med halva bredden lika med max(30 minuter, MAD). Runda utåt till närmaste 15-minutersgräns. MAD kapas aldrig. Om fönstrets slut har passerat visas inget framtida fönster, bara historiken.
- Före personlig tröskel: visa generell, källbelagd rutinvägledning under etiketten **Estimerad**, inte ett klockslag. Visa villkorade, separata allmänna källrader i Estimerad-läget; härled inte livsfas från ålder. **Nyligen hemkommen valp / första veckorna:** som startregel ta ut valpen efter sömn, mat och lek samt varannan timme när valpen är vaken; anpassa efter individen när valpen klarar längre intervall. En valp kan ofta behöva bajsa cirka 10–20 minuter efter en måltid. **Frisk vuxen hund som inte är aktiv:** kan ofta hålla sig cirka 3–4 timmar; aktiva hundar kan behöva rastas oftare. De flesta hundar bajsar 1–3 gånger per dag, ofta efter måltid. Visa varje rad med sin villkorade livsfasrubrik och källa. Visa senaste loggarnas datum/tid och dagsantal som historik.
- Personligt läge: behåll ägarens valda etikett **Rekommenderad** och placera intill varje tidsfönster, i samma visuella grupp och skärmläsarordning, den godkända copy:n **Ungefärligt tidsfönster utifrån dina loggar.** Visa medianens historiska loggintervall och avrundat lokalt tidsfönster. Detta är ägarbestämd produktcopy och en heuristisk deskriptiv extrapolering, inte validerad prognos eller deadline. Om gruppen inte kan hålla den korta förklaringen intill tidsfönstret, dölj fönstret. Visa inte tidsfönster om datat är laddande/fel, aktuell hund saknas, dagsfärskhet är osäker, eller fönstret passerat.
- Dagsantal räknas för aktiv hund och enhetens lokala kalenderdag. `pottyHistoryState` är enda färskhetsgrind för Hemkortets antal och uppskattningar. `logState` avser endast LogScreens separata 40-radersfeed och får aldrig göra Hemkortet ready. Om hund saknas, den kompletta historiken laddar/är felaktig eller färskhet inte kan styrkas: suppressa både antal och uppskattningar. Summeringskortets dagsdatum är oberoende av datumväljaren under kortet.
- Hämta en separat komplett kiss-/bajshistorik för aktiv hund inom ett rullande 30 × 24-timmarsfönster. Fånga `now` en gång per querygeneration och använd samma gränser på alla sidor: `occurred_at >= now - 30*24h` och `occurred_at <= now`, serverfilter på aktiv `dogId` och endast `pee`/`poop`, deterministisk ordning `occurred_at DESC, id DESC`. Paginerar med stabil keyset-cursor på senaste `(occurred_at,id)` tills en sida är kortare än `PAGE_SIZE`. Publicera resultat först efter sista sidan; fel eller abort på någon sida innebär inga partiella rader.
- Propagera `pottyEvents` och `pottyHistoryState: loading|ready|error` separat till Hem. En separat, tillgänglig **Försök igen**-åtgärd startar om hela historikqueryn. Att öppna Logg är inte retry. Vid konto-/hundbyte: rensa tidigare scope-data, avbryt/invalidera gammal query och ignorera dess sena svar. En nyare generation vinner alltid. Kör ny fullständig query vid foreground, lokal midnatt och efter bekräftad, osäker eller omläst loggändring. LogScreen behåller sin befintliga feed och paginering.
- Hemfelet visar den korta vardagliga texten **”Vi kunde inte visa översikten just nu.”** tillsammans med **Försök igen**. Tryck startar en fullständig historikquery utan navigation. Under retry visas loadingfeedback och action är avstängd så dubbeltryck inte startar överlappande retries.
- Tom/otillräcklig data: dagsantal om det finns; per kategori visas generell Estimerad vägledning. Loading/error suppressar alla antal och uppskattningar; error visar inte gammal cache som dagsfärsk.
- Korttryck fortsätter till Logg. Ingen skrivning, notis, nytt datalager, dependency, schemaändring eller medicinskt råd.

### Källgrund

Källor ger rutinråd, inte en universell biologisk eller beräknad nästa-tid. Generell valpvägledning som godkänts för plantexten: Agria, [Träna valpen att bli rumsren](https://www.agria.se/fakta-och-rad/hund/valpskola/rumsrenhet/) (ungefär varannan timme när valpen är vaken som startregel de första veckorna; efter sömn, lek och mat; intervallen kan anpassas när valpen klarar det); VCA, [Housetraining for Puppies and Dogs](https://vcahospitals.com/macarthur/know-your-pet/house-training-your-puppy) (valp var 1–2 timme när vaken; efter måltid/stor dryck och direkt efter uppvaknande; var 30:e minut under mycket aktiv lek); AniCura, [Så får du din valp rumsren](https://www.anicura.se/for-djuragare/hund/fakta-och-rad/fa-valpen-rumsren/) (efter mat/lek/sömn; bajsning ofta 10–20 minuter efter måltid); VCA, [House Soiling](https://vcahospitals.com/animal-medical-center-ne-al/know-your-pet/dog-behavior-problems-house-soiling) (friska vuxna hundar kan vanligtvis hålla urinen ungefär 3–4 timmar när de inte är aktiva; många bajsar 1–3 gånger/dag, ofta efter måltid). Hundexperten bedömer att dessa källor inte validerar personlig prognos från tio loggar. Den personliga raden är därför endast ett avrundat statistiskt mönster från ägarens egna observationer. Källorna och modellens begränsning ska bekräftas i v2.5-review. Tio loggar, gapgränser och MAD-gräns är valda heuristiker och inte validerade som prognos.

## Ansvar, scope och acceptans

1. v2.5 fick Architect APPROVE, Critic PROCEED och dog_expert APPROVE för källcopy/inramning, med uttrycklig reservation om otestad prognosprecision. Architect APPROVE och Critic PROCEED gäller denna exakta v2.8-korrigering enligt Planreview v2.8. v2.9 Architect APPROVE; Critic PROCEED för slutcopy: ”Efter sömn, mat, lek – varannan timme när valpen är vaken”, ”hålla sig” och ”Ungefärligt tidsfönster utifrån dina loggar”. Senare specialistförtydligande ersätter ”Många hundar” med källans exakta frekvens ”De flesta hundar”.
1. Dog_expert re-review efter ordkorrigeringen APPROVE: VCA kallar intervallet ”most dogs”, och ”De flesta hundar” är trognare källan. Agria-, VCA- och AniCura-villkor är kvar; inga modelltrösklar ändrades.
2. v2.5 implementerade endast ursprungsscope. Den riktade v2.8-korrigeringen utökar kodscope till `src/features/home/ProductWorkspace.tsx`, `src/data/workspace-data.ts`, befintlig `tests/workspace-data.test.mjs` och Home-tester. Läs endast aktiv hunds pee/poop-events inom komplett rullande 30×24h i en separat keyset-paginerad query. `HomeScreen` får separat `pottyEvents` + `pottyHistoryState`; använd inte LogScreen-feed som om den vore fullständig och behåll dess befintliga 40-raders pagination. Count och estimator visas endast efter samtliga 30-dagars sidor är hämtade. Retry, loggändring, foreground, midnatt och scopebyte hanteras uttryckligen; avbruten gammal scope kan inte publicera resultat. Datumväljaren påverkar inte kortet.
3. Modelltester täcker hund-/originfilter, exakt 9/10 logggräns per kategori, senaste 30 dagar, sortering, framtid/ogiltiga/dubbletter, långa gap, median/MAD/fönsteravrundning, särskilt MAD >60 minuter (median kvarstår, tidsfönster döljs och copy säger att tiderna varierar), passerat fönster, tidszon/lokaldag och DST.
4. UI-tester täcker fullständighetsstatus (partiella sidor ger ingen count/estimat), dagens kategoriantal, generell Estimerad med separat, villkorad valp-/vuxentext utan apphärledd ålder, personlig Rekommenderad per kategori, fallback efter gapfilter/minsta tidsperiod, loading/error utan gammal uppskattning, lokalt datum efter midnatt/foreground samt korttryck till Logg. Hemmets **Försök igen** testar att full query startar om utan navigation till Logg, dubbeltryck inte skapar samtidiga queries, retry visar loading och count/estimat förblir dolda tills sista sidan lyckas. Varje personlig tid visar intilliggande copy: ”Ungefärligt tidsfönster utifrån dina loggar.” Testa MAD >60: median kvarstår men inget fönster visas och tiderna beskrivs som varierande.
5. Oberoende QA och Reviewer kontrollerar sanningsenlighet, källcopy och ingen falsk precision. Renderad QA: 360/430 px, 140 % text, loading/otillräckligt/personligt/fel samt full designchecklista §14. Saknad körmiljö dokumenteras NOT TESTABLE; kodkontroll ensam är inte visuellt PASS.

## Skrivscope

`src/features/puppy-log/log-model.ts`, `src/features/home/HomeCarousel.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/home/ProductWorkspace.tsx`, `src/data/workspace-data.ts`, `tests/log-model.test.mjs`, `tests/home-carousel.test.mjs`, `tests/workspace-data.test.mjs`, `src/features/puppy-log/README.md`, `src/features/home/README.md`, `docs/mvp.md`, `docs/tasks/dev/DOG-RHYTHM-01.md`, `docs/plans/DOG-RHYTHM-01-ux-spec.md`, `docs/tasks/dev/feedback-2026-10-12.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/design/DOG-RHYTHM-01/`, `docs/releases/HISTORY-2026.md`.

Ingen schema-/migration-, notis-, dependency-, flerhunds-, hälso-, tränings-, profil- eller globalnavigationsändring.

## Verifiering

- `node --experimental-strip-types --test tests/log-model.test.mjs tests/home-carousel.test.mjs tests/workspace-data.test.mjs`
- `pnpm check`
- `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`
- `git diff --check`
- `python tools/dev_flow.py validate`
- Oberoende renderad UI-QA och 18-punktschecklista enligt `docs/design-rules.md` §14.

## Review v1 – 2026-10-12

- Architect: CHANGES; krävde exakt observationsperiod, gap-/outlierregler, omvandling till fönster, aktiv hund/origin, lokal dag/färskhet, fullständiga paths och tester.
- Critic: PROCEED WITH CHANGES; krävde tydlig fönstersemantik, glesa/missade loggar, separation per kategori och lokaldag.
- dog_expert: generella källor stöder rutinvägledning men inte universell nästa-tid; tio händelser ger nio historiska intervall men validerar inte medicinskt eller beteendemässigt behov.

## Planreview v2.5 – 2026-10-12

- **Architect: APPROVE.** Sample/horizon, datakvalitet, lokaldag/färskhet, presentation, paths och kontroller bedömdes kompletta och synkade.
- **Critic: PROCEED.** Källrader är villkorade; etikett och positiv förklaring ligger tillsammans; MAD >60 suppressar fönstret.
- **dog_expert: APPROVE källcopy och begränsad produktinramning.** Källfakta verifierades mot Agria, AniCura och VCA. Detta godkänner inte prognosprecision: median/MAD beskriver registrerade intervall, inte fysiologiskt behov; 10 loggar och gränser är otestade heuristiker.

## QA-resultat för första implementationen – 2026-10-12

Oberoende QA: **FAIL**. `ProductWorkspace` laddar 40 senaste events till Hem och markerar `logState=ready`; äldre sidor laddas först i Logg. Eftersom 30-dagarsmodellen och dagens antal fick den ofullständiga listan kunde Hem underräkna och missa tröskeln. Riktad korrigering krävs före godkänd checkpoint. Testerna, whitespace- och queue-kontrollerna passerade; typecheck/iOS/visuell rendering är NOT TESTABLE. Ingen nästa slice startad.

## Riktad plan v2.8 – granskas före korrigeringskod

Hämta separat alla `pee`/`poop`-rader för aktiv `dogId` med ett enda fångat `now`, inklusive `occurred_at >= now - 30*24h` och `occurred_at <= now`. Serverfiltrera på hund och typ; sortera deterministiskt `occurred_at DESC, id DESC` och använd keyset-cursor på senaste `(occurred_at,id)`, inte offset-pagination. Hämta tills sista sidan (`length < PAGE_SIZE`) och återanvänd exakt samma filtergränser på varje sida. Vid fel eller abort i någon sida publiceras inga partiella rows.

Propagera separat `pottyEvents` och `pottyHistoryState: loading|ready|error` till Home; count och uppskattning kräver `pottyHistoryState === ready`. `logState` förblir endast status på LogScreens befintliga 40-radersfeed. Error-kortet visar **”Vi kunde inte visa översikten just nu.”** och tillgänglig knapp **Försök igen** som kör hela separata queryn igen utan navigation. Under retry visas loadingfeedback och knappen är avstängd för att förebygga överlappande retry. Öppna Logg innebär inte retry. Vid hund-/kontobyte rensas tidigare scope-data och gammal query avbryts/invalideras. Query-generation skyddar mot sent gammalt svar efter en nyare refresh. Starta färsk komplett query vid foreground, Hem-midnatt och efter bekräftad, osäker eller omläst loggmutation. Ingen partiell eller stale historik visas under loading/error.

Testa query-filter och pagination via befintliga Workspace-testfixturer: exakt filter/bounds med ett fångat `now`, deterministisk keyset-page cursor och tie order, stopp vid kort sista sida, flersidesresultat, fel/abort utan partiella rows, retry, generation/race, foreground/midnatt samt synk efter bekräftad/osäker mutation.

Ny scope: lägg till `src/features/home/ProductWorkspace.tsx`, `src/data/workspace-data.ts`, befintliga `tests/workspace-data.test.mjs` och Home-tester. Lägg till data-helperprov för exakt filter/bounds, deterministisk keyset-cursor/tie order, stopp vid sista sida, flersidesresultat, fel/abort utan partiell data, retry, refresh-generation/race, foreground/midnatt och synk efter bekräftad/osäker mutation. UI-tester verifierar Home retry utan navigation, loadingfeedback/dubbeltrycksskydd och att partiella sidor förblir dolda fram till slutförd query. Ingen schemaändring, dependency eller annan funktion. Architect APPROVE och Critic PROCEED gäller exakt v2.8 enligt reviewavsnittet ovan. Implementer rör endast denna korrigering; därefter upprepad QA och fulla lokala kontroller där miljön tillåter.

## Review v2.6 – 2026-10-12

- Architect: CHANGES – krävde fast querygräns/filter, säker paginering, lifecycle-invalidering, retry, fel/abort utan partiellt resultat samt att inkludera workspace-data-testet.
- Critic: CHANGES – krävde `pottyHistoryState` som enda Hem-färskhetsgrind, separat retry och foreground-refresh; `logState` får endast styra LogScreen.
- Dessa fynd är införda i v2.7 och kräver ny review av exakt version före kod.

## Planreview v2.7 – 2026-10-12

- **Architect: APPROVE.** Fast serverfilter/bounds, keyset-pagination, all-or-nothing-resultat, separat `pottyHistoryState`, retry, scope-/generationsskydd, mutation/foreground/midnatt-refresh och testpaths är tillräckligt specificerade och synkade.
- Critic granskade samma version och bad om två förtydliganden; dessa ingår nu i v2.8.

## Planreview v2.8 – 2026-10-12

- **Architect: APPROVE.** Versionerna är synkade. Feltext, retry utan navigation, loadingfeedback, dubbeltrycksskydd och UI-tester för hidden partial results är konkreta och överensstämmer i taskplan, UX-spec och kö.
- **Critic: PROCEED.** Hemmets historikstatus är auktoritativ; error/retry är tillgängligt och stannar på Hem; partiell/stale data hålls dold och testerna täcker retry, pagination, abort och race.

## Review v2.7 – komplettering till v2.8

- Critic: CHANGES – bad om exakt kort svensk feltext samt UI-tester för retry utan navigation, loadingfeedback, skydd mot dubbeltryck och att partiell data hålls dold tills full query är klar.
- Detta infördes som v2.8 och ersätts av godkännandena i föregående avsnitt.

## Implementeringscheckpoint – 2026-10-12

v2.5 implementerade rytmmodellen, Home-karusellskort och lokal midnatts-/foreground-uppdatering. Dåvarande modell- och Home-tester passerade; den efterföljande oberoende QA:n fann att 40-radersfeed inte var en komplett historikkälla, se QA-resultatet ovan. `git diff --check` och `python tools/dev_flow.py validate` passerade vid v2.5-överlämningen. `pnpm check` stoppades då miljön saknar `node_modules` och nätverk mot npm-registret nekas; typkontroll/lint är inte verifierade. Visuell harness och `react-native-web` saknas, därför är renderad 360/430/140 %-QA **NOT TESTABLE** i denna miljö.

`pnpm check` försökte lösa 752 paket men registry.npmjs.org returnerade EPERM; det stoppades utan installation. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` är **NOT TESTABLE** eftersom repo-dependencies (`node_modules`, Expo CLI) saknas. Webbläsaren och Python Playwright finns, men `/tmp/tassla-ui-tools/node_modules/react-native-web` saknas, så produkt-rendering/skärmbilder kan inte köras. 360/430 px, loading/otillräckligt/personligt/fel och 140 % text är dokumenterade som NOT TESTABLE i `docs/design/DOG-RHYTHM-01/checklista.md`. Efter korrigering av kontoraderings-racen är v2.8 överlämnad till `qa`; en annan feedback-slice påbörjas inte.

## Korrigeringscheckpoint v2.8 – 2026-10-12

Den separata `fetchPottyEvents`-läsningen använder en gång fångade 30×24h-gränser, serverfilter för aktiv hund och pee/poop, `(occurred_at DESC, id DESC)`-keyset-cursor, samma filter varje sida och atomär returnering efter kort sista sida. Fel/abort och oordnade/duplicerade svar returnerar inga rader. Hem får separat `pottyEvents`/`pottyHistoryState`; full historik uppdateras initialt, vid foreground/lokal midnatt och efter bekräftad, osäker eller omläst loggändring. Scope, generation, abort och bekräftad kontoradering spärrar sena svar; bekräftad kontoradering invaliderar och avbryter även aktuell query. Hemmets retry använder exakt ”Vi kunde inte visa översikten just nu.”, stannar på Hem, visar loading och skyddar dubbeltryck; Loggflödets 40-radersfeed är fortsatt separat.

Slutlig riktad verifiering efter kontoraderings-rättningen: `node --experimental-strip-types --test tests/home-carousel.test.mjs tests/log-model.test.mjs` PASS (2 filer, inklusive regression för deletion-invalidated result); `node --check tests/log-model.test.mjs` och `node --check tests/home-carousel.test.mjs` PASS; `git diff --check` och `python tools/dev_flow.py validate` PASS. `tests/workspace-data.test.mjs` är **NOT TESTABLE**: Node avslutar före testlastning med `ERR_MODULE_NOT_FOUND` för `@supabase/supabase-js` eftersom lokala dependencies saknas; ingen dependency-installation gjordes. Fokuserad Workspace-suite, typecheck, lint och bundle inväntar redan installerade repo-dependencies; visual QA 360/430/140 % är fortsatt **NOT TESTABLE** eftersom React Native Web saknas. Efter QA/Reviewer står kön som `blocked`; ingen commit, push eller nästa slice hävdas.

## QA och säkerhetsgranskning v2.8 – 2026-10-12

- Independent QA: **FAIL / saknar sign-off**. Kodgranskningen fann inte kvarvarande implementationdefekt och bekräftar komplett paginering, separat Hem-historik, freshness/lifecycle och retry. Workspace-querytesten kunde inte laddas eftersom `@supabase/supabase-js` saknas; typecheck/build, integration samt renderad 360/430/140 % och a11y är **NOT TESTABLE**. Hem-testerna är källkodsmönstertester, inte renderade interaktionsprov. QA fann en inaktuell statusrad i checklistan, nu rättad.
- Security: **PASS efter riktad rättning**. Den första read-only-granskningen identifierade att bekräftad kontoradering inte ogiltigförklarade en aktiv potty-query. Slutlig kod avbryter/invaliderar querygeneration vid radering och publiceringspredikatet nekar raderingsinvaliderade resultat; regressionsassertion tillagd. Live Supabase RLS är **NOT TESTABLE**.
- Reviewer: **BLOCK final acceptance** utan ny implementationdefekt. Den fokuserade Workspace-querysviten kunde inte laddas, typecheck/build är ej körda och renderad 360/430/140 % samt a11y saknas. Köstatus är `blocked`; detta ska inte märkas som färdigt. Återuppta i miljö där repots dependencies och renderare redan finns, kör querysvit/`pnpm check`/iOS-build och fyll i skärmdump/checklista före `done` eller nästa feedback-slice.

## Verifieringsuppdatering efter query-rättning — 2026-10-12

Efter att låsta dependencies blivit tillgängliga kördes query-sviten: `node --experimental-strip-types --test tests/workspace-data.test.mjs` PASS. Första körningen fångade två testdetaljer som rättades: Supabase kunde returnera abort som `{ error }`, så helpern kontrollerar nu `signal.aborted` före generiskt fel; HTTP 503 triggar SDK-retry, därför använder atomaritetsprovet HTTP 400. `pnpm check` PASS: app- och edge-typecheck, lint 0 fel/40 varningar, 38/38 testfiler PASS utan skip. De tidigare blockerarna för Workspace-test och `pnpm check` är därmed lösta. iOS-bundle och renderad 360/430/140 %-/a11y-QA kördes inte här; renderare saknas och ingen bundle-PASS hävdas. Kön förblir `blocked` i väntan på återstående QA/Reviewer-grindar.

## Korrigeringsplan 2 – v2.9-copy och retrybrowserprov

**QA-grund:** Den oberoende §14-granskningen fann att v2.8-disclosure och valpens generella kissråd översteg två rader på 360 px; retry hade bara preset-stateprov. Den kodmässiga duplicate-import-varningen upptäcktes i samma granskning.

**Avgränsat scope:** Endast copy/markup för de fyra generella kiss-/bajs-guidance-raderna och deras villkor/källor samt den personliga tidsfönsterförklaringen i `src/features/home/HomeCarousel.tsx`; retryprovet i `tools/visual-check/dog-rhythm-app.tsx` och `tools/visual-check/verify-dog-rhythm.py`; screen-evidens i `docs/design/DOG-RHYTHM-01/evidence/` och checklistan i `docs/design/DOG-RHYTHM-01/checklista.md`; dokumentation i `docs/plans/DOG-RHYTHM-01-ux-spec.md`, `docs/tasks/dev/DOG-RHYTHM-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `src/features/home/README.md` och `tools/visual-check/README.md`; samt hopslagning av de två `Motion.tsx`-importerna i `src/components/ui/ChecklistItem.tsx`. Ingen data-, modell-, navigations- eller backendändring.

**Vägledningscopy, efter hundexpertens verifiering:**

- Kiss, valp: villkor/källa `Ny valp · första veckorna · Källa: Agria`; text `Efter sömn, mat, lek – varannan timme när valpen är vaken.`
- Kiss, vuxen: villkor/källa `Frisk, inaktiv vuxen · Källa: VCA`; text `Kan ofta hålla sig 3–4 tim; aktiva hundar kan behöva rastas oftare.` Detta gäller förmåga att hålla sig, inte ett rekommenderat kissintervall.
- Bajs, valp: villkor/källa `Valp efter måltid · Källa: AniCura`; text `Kan ofta behöva bajsa cirka 10–20 min efter mat.`
- Bajs, hundar: villkor/källa `De flesta hundar · Källa: VCA`; text `Bajsar 1–3 gånger om dagen, ofta efter mat.`

### v3.0 källtroget frekvensord

Den användarsynliga VCA-rubriken för avföringsfrekvens ändrades från ”Många hundar” till ”De flesta hundar” efter specialistens kontroll mot källans “most dogs”. Kod, Home-test, browsertext-fixture och UX-/uppgiftsdokumentation är synkroniserade. Personlig loggmodell och rekommendationströsklar är oförändrade. Kräver riktad Home-källa/browserkontroll och fulla projektgrindar innan slutlig checkpoint.

**Personlig copy:** Behåll etiketten **Rekommenderad** och intilliggande förklaring `Ungefärligt tidsfönster utifrån dina loggar.` Den ska beskriva ett avrundat statistiskt mönster, inte biologiskt behov.

**Acceptans och verifiering:** Vid 360 px visas varje separata förklarande guidance- eller disclosure-*brödtext* på högst två rader; villkor/källor är fortsatt läsbara. 140 %-texten flödar utan horisontellt overflow. Källans villkor sitter direkt i samma guidance-grupp. Browserverifieraren klickar retry från fel, bekräftar loading/disabled-feedback, att vyn stannar på Hem, att exakt feltext försvinner och att färdig Estimerad vy visas. Kör `TASSLA_UI_TOOLS=/tmp/tassla-ui-tools TASSLA_UI_ENTRY=tools/visual-check/dog-rhythm-app.tsx TASSLA_UI_OUTPUT=/tmp/tassla-preview/site TASSLA_UI_REVIEW=true node tools/visual-check/build.cjs`, `python tools/visual-check/verify-dog-rhythm.py`, `node --experimental-strip-types --test tests/log-model.test.mjs tests/home-carousel.test.mjs tests/workspace-data.test.mjs`, `pnpm check`, `git diff --check` och `python tools/dev_flow.py validate`. Duplicate-import-varningen tas bort.

### Planreview v2.9 – 2026-10-12

- **Architect: APPROVE.** Godkänner exakt korrigeringsplan 2: specificerad källcopy och två-raders-gräns, browserprov för retry samt hopslagning av dubblettimporten. Ingen data-, modell-, navigations- eller backendändring.

### v2.9 implementerings- och verifieringscheckpoint – 2026-10-12

`ChecklistItem.tsx` använder nu en samlad Motion-import. HomeCarousel-copy och verifierare granskades mot godkänd v2.9 och matchar exakta villkor, källor, text och personlig disclosure. Home-källtester uppdaterades från gamla v2.5/2.8-copyassertioner till de godkända v2.9-strängarna.

Verifiering: visual build PASS; `python tools/visual-check/verify-dog-rhythm.py` PASS med 10/10 state/bredd-kombinationer samt retry-övergång, 44×44+-tryckytor, 140 %-smoke, ingen horisontell overflow eller browserfel. Verifieraren mäter de fyra condition/source-raderna och fyra vägledningstexterna till högst två rader vid 360 px samt personlig förklaring till högst två rader vid 360/430 px. `node --experimental-strip-types --test tests/log-model.test.mjs tests/home-carousel.test.mjs tests/workspace-data.test.mjs` PASS (3 filer). `pnpm check` PASS: app-/edge-typecheck, 38/38 testfiler utan skip, lint 0 fel/36 varningar. `TASSLA_BUILD_CHANNEL=review EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS, exporterad till lokal `dist/ios` utan publicering. `git diff --check` och `python tools/dev_flow.py validate` PASS. Independent QA PASS; kö väntar oberoende Reviewer. Ingen commit/push eller senare slice.

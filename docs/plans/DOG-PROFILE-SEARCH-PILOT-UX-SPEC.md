# DOG-PROFILE-SEARCH-PILOT-01 — UX-spec v2.3

**Status:** Beteendekontrakt v2 och §14-korrigeringarna kvarstår. Ägarbeslutet 2026-10-21 gäller alla MVP-checkpoints: systematisk tillgänglighetsgranskning och oberoende slutreview görs efter att hela MVP:n är nära klar; standardvyernas funktionella regressioner och säkerhetskrav gäller fortsatt.

## Beslut och avgränsning

`docs/mvp.md` §4.1 beslutar att första profil, lägg till hund och profilredigering använder en gemensam sökbar rasväljare. En ny profil kräver ett aktivt val ur katalogen, redigering börjar med sparat ras-ID och sökfritext får aldrig sparas som ras. Den godkända första pilotresan använder redan inlästa katalogposter. Den väntande Wikidata-importen och Mix-delraser ligger kvar i den separata blockerade uppgiften `DOG-PROFILE-BREED-MIX`.

Målet är att göra rasvalet konsekvent och sökbart i dessa tre användningsställen utan att ändra profilens data- eller sparkontrakt. `vision_rev02.jpg` saknar en profilpanel. Profilen är en stödskärm; följ därför den varma, grupperade profilriktningen i `docs/plans/VISION-REV02-R02-4E-PROFILE-UX-SPEC.md` och redovisa visuell avvikelse mot närmast relevanta stödskärmskontrakt i stället för att hävda en exakt panelmatchning.

## Beteende

- En gemensam `SearchableBreedPicker` visar endast poster som `fetchBreeds` redan har hämtat. Sökningen är lokal, begränsad till namn och bevarar katalogens ordning. Normalisera Unicode och skiftläge innan jämförelse. Ingen nätverksfråga görs vid tangenttryckning.
- Väljaren öppnas från en tydligt etiketterad rasrad. Den öppna vyn har ett sökfält, en fristående `FlatList`, katalograder med minst 44 pt träffyta, markerad vald rad, stängningsåtgärd samt tydligt tomt sökresultat och möjlighet att rensa sökningen. Tillgänglighetslabel och vald/ej vald-status exponeras för skärmläsare. Sökfältet kan användas med tangentbord utan att dölja resultat eller stängningsåtgärd.
- Sökningen töms när väljaren stängs, oavsett om stängning skedde med val, Stäng eller systemets back/Escape. Öppning fokuserar sökfältet; efter stängning återförs tillgänglighetsfokus till rasraden. Stäng/back utan val bevarar tidigare ras-ID. Spara, väljare och Avbryt spärras medan create är busy; väljaren spärras i edit när `busy` eller `pending` är satt.
- Bara ett uttryckligt tryck på en verklig katalogpost anropar `onSelect` med just postens ID. Om sökningen saknar träff och den redan hämtade katalogen innehåller `Okänd ras`, behåll den tidigare godkända direkta åtgärden **Välj Okänd ras** och använd den postens ID. Den skapar ingen ny/syntetisk post och väljs aldrig automatiskt. Stängning eller fritext lämnar valt ID orört. `Okänd ras` är inte en Mix-delras, och denna pilot lägger inte till Mix-komponentval.
- För första profil och lägg till hund börjar `breedId` tomt. Ingen första katalogpost väljs automatiskt. Befintlig validering håller huvudåtgärden inaktiverad tills ett ID från katalogen valts.
- Redigering börjar med `dog.breed_id` markerat och behåller befintlig hantering om ID:t saknas i den hämtade katalogen. Väljaren får inte byta ras enbart för att listan laddas eller sökningen ändras.
- Laddning, katalogfel, retry, formulärvalidering, kennelkälla, konto-/hundscope, create request ID, readback, konflikter, sparstatus, navigation och avbrytning förblir i sina befintliga ägare och sökvägar.
- En lyckad hämtning med noll katalogposter är ett separat **tom katalog**-läge, inte sökresultatet **Ingen ras hittades**. Visa att raslistan saknar val, blockera rasraden och create/save, och återanvänd befintlig retry-åtgärd. En tom sökning efter en lyckad kataloghämtning visar i stället Ingen ras hittades och Rensa sökning.
- Om editens sparade ras-ID saknas bland katalogposterna bevaras ID:t oförändrat och den befintliga varningen (`Nuvarande ras (…) finns inte i listan`) och spara-valideringen kvarstår. Visa det som ett ej matchat befintligt värde; ersätt det aldrig automatiskt. En ändring kräver ett uttryckligt val av en katalograd.

## Jämförelse mot rev02 och verifiering

| Mål | Utgångsläge | Ändring | Visuell/funktionell kontroll |
|---|---|---|---|
| Enhetligt profilkontrollmönster | Skapa och redigera visar var sin komplett inline-lista | Samma väljarkomponent och etiketterad stängd rad i båda formulären | Rendera skapa, lägg till och redigera; kontrollera former, ytor, typografi och träffytor mot stödskärmskontraktet |
| En ny profil har ett medvetet katalogval | Första hämtade ras väljs automatiskt | Tomt startvärde tills ägaren väljer en katalograd | Spara är inaktiverat före val; val aktiverar befintlig validering |
| Sökning kan inte ändra datamodellen | Ingen sökning; alla raser visas | Lokal filtrering i modal/lista, fritext sparas aldrig | Match, ingen träff, rensa, Stäng/back utan val, explicit katalogval och befintligt Okänd ras-fallbackval; verifiera endast katalog-ID skickas till befintlig callback |
| Redigering bevarar befintlig profil | Sparat ID är initialvärde; en saknad katalogmatchning varnas | Delar samma komponent utan att byta initialt ID | Sparad ras syns vald; saknat ID och varning bevaras tills uttryckligt byte; befintlig edit/readback-regression |
| Katalogtillstånd förblir begripliga | Laddning och fel har egna tillstånd; tom katalog kan komma som lyckat svar | Skilj lyckat nollresultat från sökning utan träff | Visa retry/blockering för tom katalog och separat Ingen ras hittades för tom sökning |

Skärmbilderna är syntetiska; jämför stödyta med `vision_rev02.jpg` endast genom närmast relevanta gemensamma språk. I `docs/design-rules.md` §14 ska exakt profilpanelmatchning uttryckligen vara **NOT TESTABLE/ej tillämplig** eftersom motsvarande panel saknas, med motivering; stödskärmens layout, färgfördelning, typografi, komponentform, bildspråk och innehållstäthet bedöms var för sig. Dokumentera live Supabase/RLS och native som **NOT TESTABLE** när de inte körts. Visuell kontroll gäller standardvyerna 375×844, 430×844 och 375×667. 140 %/stor text, skärmläsare, reducerad rörelse och generell träffyteaudit är inte MVP-grindar enligt ägarbeslutet.

Bygg public och review som separata RN Web-bundles. Mellan build och browser-check startas den faktiska bundle-katalogen, exempelvis `python -m http.server 4173 --bind 127.0.0.1 --directory /tmp/tassla-dog-profile-search/public`; kör verifieraren mot `http://127.0.0.1:4173/`, stoppa servern och upprepa mot review-bundlen. Spara buildläge, route, serveradress, viewport, textskala och bundle-commit med captures.

## Scope och skrivfiler

Köns `write_paths` för uppgiften är den normativa fullständiga skrivytan. Listan nedan anger app-, test-, harness- och evidensfiler och är synkad med taskplanen.

Tillåten implementationsyta:

- `src/features/onboarding/SearchableBreedPicker.tsx`
- `src/features/onboarding/breed-search.ts`
- `src/features/onboarding/ProfileScreen.tsx`
- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/onboarding/README.md`
- `tests/breed-search.test.mjs`
- `tests/profile-screen-policy.test.mjs`
- `tests/profile-edit.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/README.md`
- `tools/visual-check/verify-dog-profile-breed-search.py`
- `docs/design/evidence/vision-rev02/dog-profile-breed-search/`
- `docs/design/evidence/vision-rev02/r02-4e/RENDER-REPORT.md` — endast redaktionell §14-etikettkorrigering; skärmbilder och dimensionsbedömningar oförändrade.
- `docs/plans/VISION-REV02-DOG-PROFILE-UX-SPEC-v2.md`
- `docs/plans/VISION-REV02-R02-4E-PROFILE-UX-SPEC.md` — endast redaktionell §14-synk; ingen beteendeändring.
- `docs/tasks/dev/vision-rev02-dog-profile-v2.md`
- `docs/plans/DOG-PROFILE-SEARCH-PILOT-UX-SPEC.md`
- `docs/tasks/dev/DOG-PROFILE-SEARCH-PILOT-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/releases/HISTORY-2026.md`

Uttryckligen utanför scope: `app-data.ts`, Supabase/schema/RPC/RLS, katalogimport eller licensarbete, Mix, Home, nya dependencies, ny datainsamling, andra profilfält, generella komponentrefaktorer och nativt distribuerad build. Ingen dependency läggs till.

## Ändringslogg

- **v2, 2026-10-20:** Architect APPROVE och Critic PROCEED för beteendekontraktet och pilotens verifiering.
- **v2.1, 2026-10-21:** redaktionell synk av §14-språk: exakt panelmatchning mot en panel som saknas anges som NOT TESTABLE/ej tillämpligt; stödskärmen bedöms separat. Beteende, risk, scope och acceptanskriterier är oförändrade; v2-verdicts återanvänds endast för det oförändrade kontraktet.
- **v2.2, 2026-10-21:** samma redaktionella korrigering förs in i R02-4E:s renderingsrapport, som pilotens länkade stödskärmsunderlag. Skärmbilder och deldimensionernas resultat ändras inte; beteende, risk, scope och acceptans är oförändrade.
- **v2.3, 2026-10-21:** ägarens GO uppdaterar checkpointens DoD: ingen 140 %/stor-text-audit och ingen fristående Reviewer före samlad MVP-closeout. Standardvy, funktion, verkliga catalog-ID:n, live/native-status och riskbaserad säkerhet redovisas separat. Ingen produktfunktion eller profilens data-/sparkontrakt ändras.

## Acceptans

1. Initial onboarding och lägg till hund visar samma sökbara komponent, börjar utan ras-ID och kan inte skapa hund före explicit katalogval.
2. Profilredigering visar samma komponent med befintligt ras-ID valt; om det saknas bevaras det och befintlig varning/validering syns tills ett uttryckligt katalogval ersätter det.
3. Sökning filtrerar endast hämtade raser; normalisering och katalogordning testas. Match/ingen träff/rensa/Stäng/system-back/välj verifieras. Sökning och stängning anropar inte `onSelect`; explicit katalograd eller befintlig `Okänd ras`-fallback skickar endast den verkliga katalogpostens ID. Fritext skapar aldrig ett ID eller påverkar valt ID.
4. Laddning, fetch-fel, lyckad tom katalog och sökning utan träff är skilda och testade; väljare/primär handling låses i busy/pending och fokus flyttas enligt kontrakt.
5. Befintlig fetch/retry, create/readback/idempotens, editvillkor/readback, fel/osäkert läge, kennelkoppling, ålder, konto-/hundscope, rutt och avbrytning förblir oförändrade och regressionsverifieras.
6. Visuell harness har egna `profile-create`, `profile-add` och `profile-edit` scenarier och interaktivt verifierar inget förhandsval, aktivering efter val, vald editras, add-avbrytning, tom katalog samt match/ingen träff/stängning. Evidens anger fixtures, viewport, textskala, branch/commit och avvikelser.
7. `pnpm check`, riktade profiltester, UI-render/harnesskontroll, kövalidering och `git diff --check` passerar. QA verifierar faktisk implementation. Security-granskning följer risk och alla säkerhetskrav kvarstår; oberoende slutreview av hela MVP:n görs nära MVP-closeout enligt ägarens GO.

## Separata acceptansstatusar

- **Kod/lokal QA:** kan godkännas efter tester och harnesskörning.
- **Live-data/RLS:** ej godkänd av syntetiska fixturer; befintlig Supabase-väg ändras inte och runtime behöver separat prov.
- **Native:** tangentbord, Dynamic Type och VoiceOver på fysisk iOS är separat och ej godkänd här utan sådan körning.
- **Visuell:** godkänns endast den renderade profilstödkontrollen mot dokumenterat stödkontrakt; exakt jämförelse mot en profilpanel i `vision_rev02.jpg` är inte tillgänglig.
- **Resa/release:** denna pilot ersätter inte acceptans av hela onboarding→Hem-resan, release eller build.

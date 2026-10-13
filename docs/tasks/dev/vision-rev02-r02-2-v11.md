# VISION-R02-2 — Home-porträtt och veckoremsa, plan v11

Datum: 2026-10-13 · Status: **implementerad; oberoende QA PASS och Reviewer PASS** för Home och lokal React Native Web-evidens. Architect APPROVE och Critic PROCEED gäller exakt v11. Supabase-/native-runtime är fortsatt NOT TESTABLE.

## Mål och avgränsning

R02-2 v10 har implementerats lokalt och väntar på oberoende QA/Reviewer. Erik har nu preciserat panel 1: använd ett runt, fotoestetiskt hundporträtt i stället för Tassla-illustrationen och låt veckoremsan synas ovanpå porträttet, med avtagande visuell styrka när markörer går in i porträttzonen.

Den befintliga asseten är AI-genererad fotorealistisk bildkonst, inte en kameraexponering av en verklig hund och inte ägarens hund. Den här planen använder den som **generisk dekorativ standardplatshållare i både public och review Home**. Den kopplas inte till hundens namn/ras i copy, data, accessibility eller produktanspråk. Om en faktisk fotograferad hund krävs, uppfyller denna asset inte det bildkravet; en licensierad/fotoverifierad asset behövs. Ingen personlig fotofunktion, uppladdning, lagring, databas eller ny dependency ingår.

## Exakt ändring

1. Byt namn på den lokala, ännu otracked `assets/images/review-puppy-portrait.png` till `assets/images/home-dog-portrait-placeholder.png`; bevara originalet i generated_images och dokumentera proveniens/licens/roll i manifestet.
2. Public och review `HomeScreen` visar samma dekorativa AI-genererade asset runt och `cover`, med en liten synlig `Standardbild`-etikett direkt på porträttet i båda lägena. Etiketten har solid varm bakning och mörk text med kontrast ≥4,5:1, verifierad vid standardskrift och 140 % text; den skalar utan klippning. Skärmläsare ignorerar själva bilden men kan annonsera den synliga etiketten. Copy och etiketter får inte kalla bilden hundens personliga foto eller binda den till hundens namn/ras.
3. Veckoremsan får högre z-index och korsar porträttets nedre del. Låt `L`/`R` vara porträttcirkelns vänster-/högerkant och `x` markörens centrum. Överlappszonen är exakt `L−16 pt ≤ x ≤ R`; `z=(x−(L−16))/(R−(L−16))`.
4. Endast icke-aktuella markörers dekorativa punkt/bakgrundstvätt tonas i zonen: opacity 0,78 för `0≤z<1/3`, 0,56 för `1/3≤z<2/3`, 0,38 för `2/3≤z≤1`. Markörer utanför zonen är oförändrade. Veckosiffror får aldrig sänkt opacity; siffror över bild har solid varm kontrastbakning. Bakgrundstvätten tonar bildbidraget mot Home-canvas bakom siffrorna. Aktuell vecka förblir fullstyrka och starkast.
5. Reviewramens fasta etikett utanför appviewporten visar `AI-GENERERAD STANDARDBILD`; dess tillgängliga namn anger `Syntetiskt granskningsläge. AI-genererad standardbild.` Public-vyn får ingen teknisk banner utöver den korta synliga etiketten `Standardbild`.

## Exakta skrivfiler

- `docs/design-rules.md`
- `docs/plans/HOME-REV02-visual-ux-spec.md`
- `docs/prompts/build-home-rev02.md`
- `assets/images/README.md`
- `assets/images/review-puppy-portrait.png` (ta bort/ersätt med nedanstående fil)
- `assets/images/home-dog-portrait-placeholder.png`
- `src/features/home/README.md` (uppdatera kontraktet om public/review-portrait och dekorativ identitet)
- `src/features/home/HomeScreen.tsx`
- `tests/home-vision.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/README.md`
- `tools/visual-check/verify.py`
- `docs/design/evidence/vision-rev02/r02-2/correction-v11/`
- `docs/tasks/dev/vision-rev02-r02-2-v10.md` (historisk plan: lägg till tydlig hänvisning att portrait-bestämmelsen superseds av v11)
- `docs/tasks/dev/vision-rev02-r02-2-v10-reviews.md` (bevara v10-resultaten; lägg till separat v11-reviewreferens)
- `docs/tasks/dev/vision-rev02-r02-2-v11.md`
- `docs/tasks/dev/vision-rev02-r02-2-v11-reviews.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/tasks/dev/vision-rev02.md`
- `docs/tasks/VISION-REV02.md`

Ingen annan skärm eller komponent ändras. v10:s rutin-/progresssemantik, SQL, mutationsflöden, nav och opt-in komponentvarianter är skyddade. Ingen R02-3-kod ingår.

## Acceptans

1. Public och review Home använder samma runda generiska asset och synlig `Standardbild`-etikett med solid varm bakning och mörk text. Etikettkontrasten är ≥4,5:1 vid standardskrift och 140 % text; etiketten får inte klippas. Public-data och hundidentitet ändras inte; ingen copy/accessibility label binder bilden till hundens namn eller ras. Reviewexporten visar `AI-GENERERAD STANDARDBILD` tydligt utanför appviewporten och dess tillgängliga namn anger att detta är syntetiskt granskningsläge.
2. Veckoremsan syns visuellt ovanpå porträttets nederdel vid 375 och 430 px. Lagertest och skärmbild visar porträtt under, veckoremsa över.
3. Icke-aktuell punkt/bakning tonas endast för `L−16≤x≤R`, med de exakta tre `z`-banden och nivåerna ovan. Aktuell vecka och alla sifferglypher har full opacity; aktiv markör är starkast. Sifferkontrast mäts ≥4,5:1 över den faktiska sammansatta bakgrunden vid 375/430, standardskrift och 140 % text. Bildtoningen sker bakom textlagret mot `home.canvas`.
4. Befintliga R02-2-layout-, navigation-, data-, retry- och public/reviewgränser klarar sina nuvarande riktade tester. Samma Home-presentation används fortsatt i app och review.
5. Spara jämförbara public/review renders och panelfoton under `correction-v11/`; QA fyller §14 och bedömer form, bildroll, färg, typografi, komposition och läsbarhet. v10-evidens bevaras oförändrad.
6. Rapportera uttryckligen att asseten är AI-genererad bildkonst; den är inte en faktisk hundfotografering eller personlig profilbild.

## Verifiering

- `node --experimental-strip-types --test tests/home-vision.test.mjs`
- `pnpm check`
- `git diff --check`
- `python tools/dev_flow.py validate`
- `__UNSAFE_EXPO_HOME_DIRECTORY=/tmp/tassla-expo-home-r02-2-v11 TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios`
- Bygg public och review RN Web vid 375/430 med output `/tmp/tassla-preview/r02-2-v11/{public,review}`; verifiera reviewbanner utanför viewport.
- Spara standardskärm, textskala 140 %, 375×667 och relevant portrait-/fontloading states i `correction-v11/{public,review}`.
- Oberoende QA/Reviewer gör faktisk sida-vid-sida-bedömning mot panel 1 samt mätning av sifferkontrast. Native-/Supabase-runtime som inte körts är NOT TESTABLE.

## Granskningssekvens

1. Architect/ Critic CHANGES 2026-10-13 kräver synlig public cue `Standardbild`, exakt gemensam fadegeometri/bandgränser, korrekt generisk AI-roll, ingen identitetskoppling, kontrastbevarande veckofade, uppdaterade Home README/manifest/tests/evidence/queue och senare R02-3-plan. Kraven är införda i den här uppdaterade v11-revisionen och designkontraktet.
2. Architect APPROVE och Critic PROCEED är sparade i `vision-rev02-r02-2-v11-reviews.md`; v11 implementerades endast inom dess filscope.
3. Färsk browser-evidens, `pnpm check`, public iOS-export, `git diff --check` och kövalidering passerade. Oberoende QA PASS och Reviewer PASS är sparade i `docs/design/evidence/vision-rev02/r02-2/correction-v11/`.
4. R02-2 Home-checkpointen är stabil för lokal implementation. Verklig Supabase/RLS, purge/scheduler, lock-wait över midnatt och native accessibility är separata NOT TESTABLE-kontroller.
5. Nästa steg är en separat, exakt Architect/Critic-granskad plan för de övriga befintliga MVP-skärmarna. Eriks mandat omfattar Logg, Träning, Kunskap samt inventering av Hälsa, Mer och övriga panel-/stödskärmar. Behåll varje panels färghierarki; applicera inte Hemmets destinationsfärger globalt.

## Implementering och checkpoint — 2026-10-13

v11 är implementerad. Public/review-byggen, `pnpm check`, public iOS-export, `git diff --check` och dev-flow-validering passerade. Färska public/review browser-körningar passerade vid 375/430, 375×667, 140 % text och reducerad rörelse. QA PASS och Reviewer PASS; sparade rapporter finns i `docs/design/evidence/vision-rev02/r02-2/correction-v11/`.

Reviewens tidigare SQL-invändning om åldersfixture drogs tillbaka efter kontroll av de aktuella värdena: hund B är cirka 11 veckor och version 5 tillåter 0–20 veckor. Själva Supabase SQL/RLS-runtime, servicejobbet, midnatts-låsväntan och native Dynamic Type/VoiceOver har inte körts och är NOT TESTABLE. Bildasseten är AI-genererad bildkonst, inte verklig hundfotografering.

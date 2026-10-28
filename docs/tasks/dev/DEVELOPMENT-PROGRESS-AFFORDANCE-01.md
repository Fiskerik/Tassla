# DEVELOPMENT-PROGRESS-AFFORDANCE-01 — gör åldersprogress och faslänken tydliga

**Status:** done · **Planversion:** v3 · **Risk:** L
**Bas:** `dd38a3d` (`knowledge/d3-catalog-delivery`)

## Mål och mandat

Visa den redan beräknade åldersresan som en grön progressbåge, gör Hemmets `Ungefärlig fas` synligt tryckbar och rätta rubrikformen för hundnamn som slutar på s. Mandatet är Eriks uttryckliga UX-besked 2026-10-28 och befintligt panel 2-kontrakt i `docs/design/vision-rev02-screen-contracts.md`.

Bevara beräkningen från födelsedatum till 24 kalendermånader, befintlig ålder/fas/copy, markörens visa/dölj-funktion, navigationen från Hem och neutrala tillstånd för vuxen, saknat, ogiltigt eller framtida födelsedatum. Den gröna delen betyder kronologisk ålder inom den ungefärliga perioden, inte träningsfärdighet eller uppnådda milstolpar. Ändra inte träningsmodalen här; dess tidigare återkoppling får en separat liten checkpoint.

## Omfattning

- Rita en grön SVG-linje längs halvcirkelns befintliga förlopp från start till aktuell åldersmarkör; återstående båge förblir neutral. Håll befintlig 8 pt-bredd, mjuka ändar och diameter. Fyllnaden förblir synlig när åldersetiketten döljs. Åldersmarkören och dess interaktion behålls.
- Behandla Hemmets fasrad som en kompakt outlineknapp: `home.card`, 1 pt kant i `home.greenStrong`, `radius.md`, minst 44 pt hög, 8 pt horisontell padding. Text och chevron använder `home.greenStrong`, label-vikt 700; pressed-state behåller `selectedSurface`. Texten får radbrytas/krympa utan att gå in under porträttet. Ta bort negativa marginaler.
- Skapa en liten formatterare som ger `Doos utveckling` för namn som slutar på s och `Lunas utveckling` för övriga namn.
- Lägg till tidig ålder, mittpunkt, normal valp, vuxen och invalid/missing/future fixtures; verifiera att progresslängden växer monotont och att vuxen/okända datum inte visar en båge. Spara RN Web-bilder för 375 och 430 pt och jämför relevanta vyer mot panel 2 enligt designregelverk §14. Använd befintliga tokens och `react-native-svg`; ingen dependency, datamodell, navigation eller state-ändring.

## Skrivvägar

- `src/features/home/DevelopmentScreen.tsx`
- `src/features/home/HomeScreen.tsx`
- `src/features/home/development-title.ts`
- `tests/development-screen-model.test.mjs`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `src/features/home/README.md`
- `docs/tasks/dev/DEVELOPMENT-PROGRESS-AFFORDANCE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/development-progress-affordance-01/`

## Acceptans och bevis

| Kriterium | Kontroll | Resultat |
|---|---|---|
| Den passerade bågdelen är grön från start till markör och återstoden är neutral | Public/review RN Web och öppnad panel 2-jämförelse; Critic final review | PASS |
| Bågen växer monotont med kronologisk ålder mot 24 månader och visas inte för vuxen hund | Early/normal/midpoint/adult/missing/invalid/future fixtures; progresslängd och synligt tillstånd | PASS |
| Fasraden ser tryckbar ut, behåller minst 44×44 pt, accessibility label/hint och öppnar samma utvecklingsvy | RN Web bbox/style/interaktion 375/430; midpoint/UNGHUND + 140 % text fri från porträttet; source diff bevarar label/hint/callback | PASS lokalt; native NOT TESTABLE |
| Rubriker visar `Doos utveckling` och `Lunas utveckling` | Riktat Node-test och två RN Web-renderassertioner | PASS |
| Inga ändringar utanför deklarerade sökvägar; ingen beteende-/datamigrering | Ändringsvägsrevision, `git diff --check`, kövalidering | PASS; 66 ändrade/nya filer inom planens 12 deklarerade skrivvägar |
| Ändringen klarar projektets relevanta regressionskontroller | `CI=1 pnpm check` | PASS: 829 test, 1 skip |

## Verifiering och visuell granskning

- `node --experimental-strip-types --test tests/development-screen-model.test.mjs`
- `TASSLA_UI_ENTRY=tools/visual-check/vision-r02-home-panels-app.tsx ... node tools/visual-check/build.cjs` och `TASSLA_UI_PANEL=development python tools/visual-check/verify-vision-r02-home-panels.py` för public/review vid 375/430, kort viewport samt early/normal/midpoint/adult/unknown dates.
- `python tools/visual-check/compare_panel.py --panel 2 --render <render>`; öppna resultatet och granska själv. Sparade bilder/results skrivs under `docs/design/evidence/development-progress-affordance-01/`.
- UI Critic BRIEF före implementation och REVIEW på slutrender; separat beteende- och visuell QA samt Frozen Reviewer på slutdiffen.
- `CI=1 pnpm check`, `python -X utf8 tools/dev_flow.py validate`, `git diff --check` och godkänd-sökvägsgranskning.

RN Web-bilder och DOM-egenskaper verifierar inte native iOS VoiceOver, Dynamic Type eller fysisk träffyta; dessa är **NOT TESTABLE** här och får inte beskrivas som verifierade. TestFlight/native-kontroll är inte en del av den här checkpointen.

## Beslut som bevaras / undantag

Panel 2 visar åldersbågen som kalenderålder, inte färdighetsprogress. Grön fyllnad implementerar ägarens uttryckliga visuella riktning och ändrar inte betydelsen. Panel 2:s rubrikexempel skrivs grammatiskt utan dubbel-s när namnet slutar på s. Skärmdumpar och syntetiska fixtures är inte produktionsdata.

Utanför scope: träningsmodalens copy/knapplayout, hundens utvecklings-/milstolpslogik eller källa, nytt innehåll, artikelbilder, backend/RLS, onboarding, appnavigation, tokens utanför befintliga Home-färger och appens release.

## Granskningar

| Roll | Bedömning | Evidens |
|---|---|---|
| Architect | APPROVE | v3 efter UI Critic BRIEF; 375 pt UNGHUND-wrap/no-overlap kontrolleras. |
| UI Critic | PASS | BRIEF + slutgranskning av fem slutbilder; se `docs/design/evidence/development-progress-affordance-01/REVIEWS.md`. |
| Beteende/visuell QA | PASS inom taskens ändringar | Public/review 32/32; grön båge, klickbar fasrad och Doos-form verifierade. Helpanelens komposition/bildspråk/täthet är ÖPPNA: jämförelsen visar separat bildremsa/båge/block jämfört med referensens integrerade porträtt och tätare layout. Se `REVIEWS.md`. |
| Frozen Reviewer | PASS | Slutdiff, full §14-checklista och §14.16-matris; helpanelens gap hålls öppet och separat backloglagt. |

## Checkpoint

- Ändrade filer: 66 ändrade/nya filer, alla inom v3:s 12 deklarerade skrivvägar; evidence-katalogen innehåller bild- och verifieringsfiler.
- Verifiering: Architect APPROVE v3; UI Critic REVIEW PASS; oberoende beteende/visuell QA PASS för ändringen; public 32/32 och review 32/32; `CI=1 pnpm check` PASS (829 test, 1 skip); riktat test, py_compile, `git diff --check` och kövalidering PASS.
- Öppet separat: helpanelens kompositionslikhet med panel 2 är inte klar. QA såg kvarstående skillnad mellan referensens integrerade stora hundporträtt/åldersbåge och den nuvarande separata bildremsan/bågen/milstolpsblocken; följ upp i backlog `DEVELOPMENT-PANEL-COMPOSITION-01`.
- Öppna luckor: native iOS-interaktion och Dynamic Type kan inte verifieras i denna miljö.
- Nästa steg: commit/push på befintlig branch. Helpanelens kompositionsavvikelse följs upp separat i `DEVELOPMENT-PANEL-COMPOSITION-01`.

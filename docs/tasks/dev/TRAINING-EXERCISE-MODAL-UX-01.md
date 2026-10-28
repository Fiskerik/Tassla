# TRAINING-EXERCISE-MODAL-UX-01 — omforma övningsmodalen

**Status:** done · **Planversion:** v6 · **Risk:** M
**Bas:** `6222307bd68647c75c4fbe95fadf7e7da654feca` (`knowledge/d3-catalog-delivery`)

## Mål och mandat

Ägarens återkoppling 2026-10-28 gäller hela övningsmodalen efter bekräftat delmål: den har för mycket löptext, långa knapptexter och en stor ruta för ångerhandlingen. Modalens information ska gå snabbt att skanna, och ägaren ska känna igen aktivt steg, progression och nästa handling.

Vyn är redan en centrerad native `Modal` via den delade `BottomSheet`-komponenten. Behåll den modaliska stängnings-/bakgrundssemantiken och centreringen, men utforma träningsinnehållet som en kompakt modal med tydlig bild, progression och få, korta handlingar. Detta ersätter inte en ny route.

Mandatet omfattar träningsdetaljens modal, särskilt aktivt/bekräftat delmål. Återanvänd befintlig dekorativ bild och träningsdata. Bevara full övningsinstruktion, tillstånd, `confirm_step`/`undo_step`/`next`/`back` payloads, confirmed_at, retry/unknown-skydd och slutstegslogik. Ingen schema-, RPC-, datamodell-, träningsinnehålls-, package-dependency- eller navigationsändring.

## Uppgiftskontrakt

- **Skrivägare:** koordinatorn ensam ändrar exakt deklarerade `write_paths`, på befintlig branch `knowledge/d3-catalog-delivery`; ingen ny branch/worktree.
- **Granskare:** UI Critic BRIEF före fortsatt implementation och REVIEW efter render; Architect godkänner v6; oberoende QA och Frozen Reviewer granskar färdigt resultat.
- **Modell:** roller använder sessionens konfigurerade standardmodeller; inga modell- eller resonemangsöverskrivningar.
- **Beroenden:** `TRAINING-LOGGING-UX-01`, `TRAINING-TIMELINE-01`, `UI-MODAL-CENTER-01` — samtliga `done`.
- **Läsunderlag:** `AGENTS.md`, `.agents/skills/tassla-consumer-ux/SKILL.md`, `docs/design-rules.md` §0–4/8–10/14–17, panel 6 i `docs/design/vision-rev02-screen-contracts.md`, befintlig `PublishedTrainingScreen`, BottomSheet/Button/Progress, timeline/progression-modeller, befintliga tester och visual-check-fixture, samt AI-ursprungsregeln i `CONTENT-PUBLISH-LABEL-01`.

## Designbrief

- Behåll den befintliga generiska, dekorativa träningsbilden som kort, låg bildremsa högst upp i innehållskortet. `PublishedTrainingProgram` saknar programspecifik bild; välj mellan samma två befintliga dekorativa banners som översikten gör. Visa hundens ansikte i 375/430-bilder och vid 140 % text. Ingen ny bildkälla eller ändrad träningsdata.
- Visa aktiv position som kort `Steg 2/3`. Separat tunn grön progresslinje visar endast bekräftade delmål (`1 av 3 klara`), inte aktiv position; sista aktiva steget får därför inte se ut som ett helt slutfört program. Skärmläsaren får båda fullständiga värdena.
- Behåll en kompakt, tydlig provenance-bricka `AI-genererat innehåll` med liten gnista när programmet/steget är AI-genererat; etiketten krävs av `CONTENT-PUBLISH-LABEL-01`. Ta bort endast den generiska raden `Anpassa efter din hund och pausa när det behövs.`; publicerad instruktion och konkreta pausråd förblir oförändrade.
- Bekräftat delmål visas som en liten grön statusbricka med bock och det korta ordet `Klart`. Ångerhandlingen är en kompakt ikonknapp direkt intill statusen, med pil-återställning, alltid synlig etikett `Ångra`, minst 44×44 pt träffyta och full tillgänglig etikett `Ångra färdigmarkering`.
- Primär navigering använder synliga korta etiketter `Nästa` och `Föregående` med riktningsikoner. Knappmål är minst 44 pt. Visa inte Nästa på sista steget. Behåll ånger som sekundär handling och låt dess befintliga bekräftelse/felhantering vara sanningsenlig.
- Visa endast en framgångsstatus efter sparad bekräftelse. Fel/okänt utfall behåller retry-/kontrollbudskap och får inte likna sparad framgång.
- Behåll hela den vänsterställda instruktionen och dess befintliga rubrik-/listformat. Modalens innehåll scrollar vid kort skärm/stor text; krymp eller klipp aldrig instruktion eller träffytor.

## Jämförelsematris

| Uppgift | Nuläge | Mål och acceptans |
|---|---|---|
| Hitta aktiv position och verklig completion | Ingen kompakt progress inne i modalens övningsvy | Synlig `Steg 2/3` skiljer sig från grön progresslinje över bekräftade delmål. Linjen når inte 100 % enbart för att sista steget öppnas. |
| Förstå övningen | Stor titel, flera fristående textstycken och generisk pausrad | Kort foto, titel, hela instruktionen och kompakt obligatorisk AI-ursprungsbricka när `is_ai_generated` är true; den generiska pausraden tas bort. |
| Bekräftad status | Stor tonad ruta, lång status och helknapp `Ångra färdigmarkering` | Liten `Klart`-bricka och kompakt ikonånger med full skärmläsaretikett. |
| Gå mellan steg | Långa knapptexter och stor vertikal upptagen yta | Korta ikonmärkta `Föregående` / `Nästa`, minst 44 pt, tydlig primär hierarki och inga falska steg. |
| Smal vy och textförstoring | Scrollning behövs men lång layout tar stort utrymme | 375/430 × 844, 375 × 667 och 140 % text är läsbara; foto/ansikte, fel, knappar och close nås utan sidscroll. |

Referens: ägarens senaste iPhone-skärmbild i tråden. Tidigare baseline och panel-6-sammansättning finns i `docs/design/evidence/training-exercise-modal-ux-01/public/`. Panel 6 är stilreferens för träningsresans huvudvy, inte facit för modalens exakta komposition. Slutbilder ska visa den nya modaldesignen ensam samt bredvid panel 6 för token-/hierarkijämförelse.

## Skrivvägar

- `src/features/training/PublishedTrainingScreen.tsx`
- `src/features/training/README.md`
- `tests/training-progression-ui.test.mjs`
- `tests/training-screen-policy.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-flow-training.py`
- `docs/tasks/dev/TRAINING-EXERCISE-MODAL-UX-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/training-exercise-modal-ux-01`

## Acceptans och verifiering

| Kriterium | Kontroll |
|---|---|
| Modalens progress visar korrekt aktivt index och omfattning | Fixture för första, mitten och sista steget; kontrollera synlig etikett samt progressbarens accessibility-värde. |
| Hunden syns i den låga bildremsan och hundansiktet är inte klippt | Öppnade public/review-bilder 375/430, kort höjd och 140 % text; kontrollera bildfokus visuellt. |
| Bekräftat delmål får kompakt status och tydlig ångerikon; knapparna har kort copy och fullständiga accessibility-namn | UI-policyassertion, RN Web-confirmed render och minst 44 pt mätning för varje synlig interaktiv träffyta; `Ångra` syns alltid. |
| `confirm_step` ger en enda bekräftelse efter `saved`; failed/unknown behåller verifiering/retry; undo är aldrig felaktigt rapporterad som sparad | Befintliga progression-operationstester plus confirm/failed/unknown/undo-fixtures; payload/id/datum oförändrade. |
| Nästa/föregående fortsätter att navigera samma steg; sista steget saknar Next | Public/review timeline-fixture, back/next state-assertion och explicit last-step test. |
| Instruktionen är fullständig, vänsterställd och nåbar utan överflödig helper-copy | Visuell jämförelse och DOM-textassertion vid 375/430, 375×667 och 140 % proxy. |
| Endast godkända paths ändras; panel 6-paritet överdrivs inte | Path audit, §14 dimensioner/checklista och begränsningsnotering. Native VoiceOver/Dynamic Type/hit targets är NOT TESTABLE. |

Kör fokuserade progression-/policytester, `CI=1 pnpm check`, public/review visual-check vid 375/430, kort viewport och 140 % proxy, `python -X utf8 tools/dev_flow.py validate` samt `git diff --check`. Spara `RESULTS.json`, bilder och granskningsbesked i evidence-katalogen.

## Granskning

| Roll | Status |
|---|---|
| UI Critic BRIEF v4 | CHANGES: synlig `Steg 2/3`, skilj position från bekräftelseprogress, alltid synlig `Ångra`, säkra modalhierarkin. Infört i v5. |
| UI Critic BRIEF v5 | PROCEED; granskade plan och kö. Bekräftelseprogress och aktiv plats är separata; verifiera båda. |
| Architect v5 | CHANGES: behåll AI-ursprungsbricka enligt `CONTENT-PUBLISH-LABEL-01`, precisera att bannerbilden är generisk, justera dependency-raden och dokumentera modellstandarder. Infört i v6. |
| Architect v6 | **APPROVE**; exact 11 plan/queue paths, base SHA, model defaults, required AI-origin disclosure and generic decorative banner are explicit. UI Critic BRIEF PROCEED v5 remains valid for the unchanged visual direction. |
| UI Critic REVIEW | **PASS**; öppnade public/review-bilderna i modalens 375/430, korta viewport och 140 %-läge. Hundansiktet syns, position och bekräftelseprogress skiljs åt, Klart/Ångra är kompakta och texten går att scrolla. Inga designändringar begärdes. RN Web, inte native. |
| Beteende-/visuell QA | **PASS**; oberoende QA körde riktade progression-/skärmpolicytester och `CI=1 pnpm check`, öppnade public/review-evidensen (30/30 per läge) och verifierade fel-/okänt-flöden. Native är NOT TESTABLE. Se evidence/REVIEWS.md. |
| Frozen Reviewer | **PASS**; verifierade planens paths, båda sparade public/review-resultaten 30/30, kö, validering och återställd tidslinjeevidens. Se evidence/REVIEWS.md. |

## Öppna gränser

Ingen omdesign av träningsöversikten/tidslinjen, checklistor, Knowledge, loggikoner eller mönsterkort. De två Loggförbättringarna planeras separat. Delad modal-svepning och huvudflikens animation behandlas i `UI-GESTURE-MOTION-01`; denna task ändrar inte den delade `BottomSheet`-gesten.

## Checkpoint

Plan v6 behåller v5:s godkända UX, lägger tillbaka den kompakta obligatoriska AI-ursprungsbrickan och förtydligar den generiska dekorativa bilden, dependencies och modellstandard. Architect APPROVE v6 och UI Critic BRIEF PROCEED v5 är registrerade. Implementation och oberoende QA är klara inom planens skrivvägar; public/review verifiering rapporterar 30/30 i vardera läget. UI Critic REVIEW, beteende-/visuell QA och Frozen Reviewer har PASS. Tasken är lokalt klar på den befintliga branchen; ingen commit eller push ingår i denna checkpoint. Native/iOS/Android och live backend-verifiering är inte påstådda.

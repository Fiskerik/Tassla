# DEVELOPMENT-PANEL-COMPOSITION-01 — stäm av helvyn mot panel 2

**Status:** done · **Planversion:** v3 · **Risk:** L
**Bas:** `ce610cb80467a1020ed3d1bf874dc6fb0a3a4293` (`knowledge/d3-catalog-delivery`)

## Mål och mandat

Gör utvecklingsvyn lättare att förstå och mer lik panel 2 genom att låta hundporträtt, åldersbåge och milstolpar bilda en sammanhängande hierarki. Mandat: ägarens löpande UX-beställning att följa Tasslas upplevelseplan, minska onödig text och lägga till relevanta visuella element; `docs/design-rules.md` §§0–4, 14; `docs/design/vision-rev02-screen-contracts.md` Panel 2; separat backlog `DEVELOPMENT-PANEL-COMPOSITION-01` i kön.

Bevara ägarens redan godkända färdighetsfria, kronologiska åldersprogress; neutral status för vuxen/saknad/ogiltig/framtida ålder; markerarens visa/dölj-interaktion; fasnavigationen från Hem; utvecklingstitelns grammatik; nuvarande generiska hundbild, källor och innehållsbegränsning. Lägg inte till nya hälsopåståenden, milestones, data, destinationsbeteenden, dependencies, schema eller modaler.

## Visuell jämförelsematris

Jämförelseunderlag: `docs/design/evidence/development-progress-affordance-01/public/compare-panel2-development-progress-midpoint-375.png` (vänster: referens panel 2; höger: aktuell RN Web-render, Luna 12 månader). Referensbildens ålder och innehåll skiljer sig; bedöm proportioner, hierarki och täthet, inte exakt text eller pixlar.

| Referenselement | Nuläge | Ändring inom denna plan | Visuell acceptans |
|---|---|---|---|
| Stort mjukt rundat hundporträtt; åldersbåge och markör över bildens nederkant. | Bild och arc-bakgrund delar hero-ytan i en kort synlig bildremsa och en stor ljus panel. Halvcirkeln är djupare än referensens låga båge. | Behåll den generiska asseten men visa den i en responsiv porträttruta på cirka 60–70 % av bredden i höjd. Lägg en 64–80 pt hög grund elliptisk halvcirkel, ålderskapsel och fasändpunkter över bildens nedre del. Åldersspannet är födelsedatum (0 månader) till födelsedatum + 24 kalendermånader; markör och grön bågsegment använder samma kurvparameter så segmentet slutar exakt vid markören. Använd en diskret transparent bottenyta endast där etiketter behöver kontrast. | Vid 375/430 är ansiktet helt synligt, bilden dominerar och bågen följer bildens nederkant. Bågen är grön fram till markören och neutral efter den. Ingen ikon/text skymmer ansiktet. |
| Skärmtitel 24/30, vikt 700 och 12–16 pt till bild. | AppBar-titeln är för liten; AppBar-margin och sidans gap ger onödigt vertikalt avstånd. | Lägg till en opt-in titelvariant till AppBar och skärmtiteltoken 24/30, vikt 700; använd endast i Utveckling. Gruppera appbar och hero så avståndet blir ett sammanhängande 12 pt. Låt standardutseendet för övriga vyer vara oförändrat. | Titeln är tydlig vid 375/430, hundnamn kapas inte, tillbaka har minst 44×44 pt och porträttet börjar 12–16 pt efter rubrikraden. |
| `Du är här`-fasikon och kort förklaring. | Ikon, eyebrow, åldersrubrik och tvåmeningsförklaring bildar ett separat högt textblock. | Behåll gul glödlampa och aktuell ålder/fas; korta texten till en mening som tydligt säger att detta gäller ungefärlig kalenderålder, inte färdighet. | Innebörden finns kvar men blocket går snabbt att skanna och överlappar inte porträtt eller båge. |
| En `Nästa milstolpar`-yta med grupperade, ämnesfärgade rader. | Rubrik, försiktighetstext och varje milestone är separata; alla ikoner är identiska gröna glittror och `Läs källan` repeteras. Endast början av första raden syns i jämförelsen. | Samla rubrik, en kort reservation och upp till tre separerade rader i en gemensam kortyta. Ge nya intryck, tandömsning och unghundstid varsin relevant Ionicon och befintligt blått, bärnstensgult respektive grönt tonpar. Visa kompakta klickbara `1)`, `2)`, `3)`-markörer; ta bort upprepade källknappar och långa länketiketter. Hela raden behåller den befintliga käll-länken. | På 375×844 syns hero, aktiv fas och milstolpslistans visuella struktur före navigationen; naturlig scroll behålls. Ikon och etikett förmedlar samma betydelse utan att förlita sig på färg. Varje källa öppnas fortfarande från sin rad och har tillgänglig etikett. |

## Exakta skrivvägar

- `src/features/home/DevelopmentScreen.tsx`
- `src/features/home/development-milestones.ts`
- `src/components/ui/AppBar.tsx`
- `src/theme/tokens.ts`
- `src/components/README.md`
- `src/theme/README.md`
- `src/features/home/README.md`
- `tests/development-milestones.test.mjs`
- `tests/development-screen-model.test.mjs`
- `tests/ui-library-policy.test.mjs`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `docs/tasks/dev/DEVELOPMENT-PANEL-COMPOSITION-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/releases/HISTORY-2026.md`
- `docs/design/evidence/development-panel-composition-01`

Ingen ändring av `HomeScreen`, router, milstolpskällor/texter, hundprofilens data, releaseflöde, byggdistribution eller befintliga modaler. Den obligatoriska historikposten för lokal closeout ingår i `HISTORY-2026.md`. Delad AppBar får endast en opt-in titelstil; befintliga vyers standardbeteende och utseende lämnas orört.

## Acceptans och verifiering

| Kriterium | Bevis / kontroll | Status |
|---|---|---|
| Hundbild och ansikte syns helt; arc ligger över nedre bilddel och dess gröna progress/neutral återstod behåller samma betydelse. | Public/review RN Web vid 375×844 och 430×844; DOM-geometri och öppnad panel 2-jämförelse. | PASS — Critic + QA |
| Titel matchar kontraktets 24/30, 700; opt-in AppBar ändrar inte andra konsumenter. | Renderad beräkning/stil vid 375/430, back target ≥44×44; riktade AppBar-/developmenttester. | PASS — Critic + QA |
| Kort fasförklaring förblir sanningsenlig och synlig för vuxen, okänt, ogiltigt och framtida datum. | Befintliga fixture-scenarier plus 140 % CSS-textproxy; blickruta och assertioner. | PASS — Critic + QA |
| Milstolparna är grupperade, har semantiskt skilda polykroma ikoner och kompakta numrerade länkar som öppnar rätt källa. | Riktade data-/UI-tester; verifierad ordning, länk-URL, tillgänglig etikett och screenshots. | PASS — Critic + QA; extern källtillgänglighet ej kontrollerad |
| Relevant innehåll blir tätare utan klippning, överlapp eller att den fasta navigeringen döljer mål. | Public/review 375×844, 430×844, 375×667 och 140 % textproxy; scroll och nedersta mål. | PASS — Critic + QA |
| Endast deklarerade sökvägar ändras och regressionskontroller passerar. | `CI=1 pnpm check`, Python `py_compile`, `python -X utf8 tools/dev_flow.py validate`, `git diff --check`, exakt path audit. | PASS — 81 ändrade/nya paths inom 17 deklarerade; supplemental QA bekräftad |

Milestone-/ålderskopior och data är syntetiska/generella; inget nytt sakgranskningspåstående görs. RN Web/CSS-textproxy ersätter inte native Dynamic Type, VoiceOver, fysisk tryckyta eller TestFlight; dessa redovisas NOT TESTABLE om de inte körs. Ingen modal ändras i denna task; centrerad modalpolicy hanteras separat.

Den tillfälliga milestone-datan/källorna saknar fortfarande dokumenterad extern sakgranskning. Denna layoutuppgift verifierar endast korrekt ordning och att befintliga URL:er går att öppna; den godkänner eller publicerar inte påståenden. Panel 2 förblir partiell på kravet om publicerade, versionsbundna och sakgranskade milstolpekällor tills den redaktionella granskningen utförts separat.

## Granskning

- UI Critic BRIEF (läst och öppnad jämförelse): fyra rankade avvikelser — (1) gör porträttet dominant och lägg bågen över dess nederkant; (2) förena rubrik/reservation/milstolpar i en gruppering och minska föregående höjd; (3) använd skärmtitelrollen 24/30, vikt 700; (4) minska titel–porträtt-gapet till 12–16 pt. Critic noterade att referensens Milo 12 veckor och nulägets Luna 12 månader inte medger jämförelse av copy/milstolpsinnehåll, och att bara en nuvarande milstolperad syns. Ingen kod ändras före Architect APPROVE.
- Architect review v1: **CHANGES**. Planen ska ange spannet födelsedatum → +24 kalendermånader, 64–80 pt elliptisk båge där markör/segment slutar på samma progressposition, samt tydligt skilja layoutacceptans från sakgranskning av tillfälliga källor. AppBar-varianten måste vara opt-in; varje milestone-rad och dess numrerade källmarkör är en enda länk. Inarbetat i v2.
- Architect APPROVE v2 finns loggat i kön. Plan v3 utökar endast exakta dokumentationsvägar med `docs/releases/HISTORY-2026.md` för den obligatoriska leveranshistoriken; ingen produktkod eller acceptans ändras.
- Architect APPROVE v3: historikfilen är enda nya skrivvägen. Förtydligat att ingen releasekod eller distribution ändras.
- Slutlig UI Critic REVIEW: **PASS**. Critic bekräftar hundansiktet, bågens slut vid markören, tre urskiljbara rader och 140 % scroll/åtkomlighet i public/reviewbilder.
- Oberoende QA första kontroll: **PASS** på implementationen och de 78 dåvarande paths. Supplemental QA efter closeoutdokumenten: **PASS**, 81 nuvarande paths och alla inom samma 17 deklarerade; queue, bevis och loggar synkade.
- Frozen Reviewer första kontroll: **BLOCK**, endast stale antal/saknade slutposter efter att nya dokument lagts till efter QA; inga produkt- eller bildfynd. Dokumentationen synkades och kompletterande QA verifierade 81 paths.
- Frozen Reviewer slutlig re-review: **APPROVE/PASS**, inga kvarstående fynd. Commit `1aa0768` är pushad till `origin/knowledge/d3-catalog-delivery`; push-hookens `pnpm check` passerade (842 PASS, 1 skip). Redaktionell källgranskning och native-verifiering är avgränsade, fortsatt öppna punkter.

## Checkpoint

Tasken är **done** för den avgränsade lokala UI-/renderleveransen. UI Critic, supplemental QA och slutlig Frozen Reviewer PASS; `CI=1 pnpm check` passerade 99/99 testfiler, public/review verifiering 52/52 och 60/60, fokustester 3/3 och 81 ändrade/nya paths inom 17 deklarerade. Commit `1aa0768` är pushad till `origin/knowledge/d3-catalog-delivery`; push-hookens `pnpm check` passerade (842 PASS, 1 skip). Redaktionell granskning av milstolpskällorna samt native tillgänglighet förblir separata och öppna.

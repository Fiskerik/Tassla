# FLOW-KNOWLEDGE-CHECKLIST-UI-02 — kompakt och bildledd fasöversikt

Version 1 · 2026-10-21 · inom godkänd MVP rev02 och ägarens uttryckliga UI-besked

## Mål och nuläge

Gör den visade Kunskap → Checklista-översikten snabb att skanna och visuellt närmare `vision_rev02.jpg`. Ägaren pekar särskilt ut att två stora kort och upprepade texter fyller vyn, och ber om kortare copy samt mer liv genom exempelbild/ikoner.

Den befintliga översikten visar ett inramat kontextkort med tre textrader, en separat ”Läs mer”-handling, två sektionsrubriker och stora separata fas-kort med intro och progress. Panel 7 använder i stället ett framhävt redaktionellt bildkort och mindre, tätare innehållskort. Skärmbilden i `docs/design/evidence/flow-knowledge-01/review/checklist-review-overview-375x844.png` är konkret före-underlag.

## Beslutad ändring

- Ersätt högt kontextkortet med en kompakt, tydligt fungerande kontextrad: ikon, valt kortnamn och ”Ändra”. Behåll samma BottomSheet-val, sparning och fel-/osäker-status.
- Behåll den sanningsenliga märkningen av syntetiska gransknings-exempel men gör den kort och lågmäld: ”Exempel · ej sakgranskat”. Ta bort upprepad översiktstext som inte hjälper valet; den längre förklaringen kan fortfarande öppnas i fördjupningen.
- Visa rekommenderad fas först som ett bildlett kort enligt panel 7:s bild-över-text-familj. Behåll fasnamn, bekräftad `gjorda/total`-progress och öppningshandling; ta bort fasintro från översikten eftersom den finns i detaljen.
- Visa övriga faser i en gemensam kompakt listyta med fasikon, namn, bekräftad progress och chevron. Undvik ett fristående fullt kort per fas och undvik upprepad introtext.
- Återanvänd endast befintliga lokala dekorativa bildassets och Ionicons. Bilden är redaktionell, inte den aktiva hundens foto eller ett påstående om personlig hundidentitet. Använd `puppy-resting-carousel.png` för `first_days` och `8_12_weeks`, `puppy-training.png` för `3_6_months` och `6_12_months`, och `dog-welcome.png` för `over_1_year`. `before_homecoming` förblir ikonledd eftersom fasen sker innan hunden kommit hem. Om en passande bild saknas används befintlig fasikon.

## Jämförelse och acceptans

| Referenselement | Nuvarande skillnad | Avsedd korrigering | Verifiering |
|---|---|---|---|
| Panel 7: stort varmt redaktionellt bildkort | Rekommenderad fas är ett helt textbaserat kort | Befintlig redaktionell bild med fasnamn, liten ikon och bekräftad progress | Public/review-bild sida vid sida; fotot får inte se ut som aktiv hunds profilbild |
| Panel 7: mindre innehållskort | Varje övrig fas får stort separat kort med intro | En gemensam dividerad lista med fasikon, namn och count | Alla faser nåbara och öppnar samma rätta detalj |
| En enkel, sekundär kontext | Tre textrader i ett separat inramat kort | Kompakt kontextrad med samma ändringshandling | Befintligt kontextval/sparning/fel/unsure och cache regressionstestas |
| Kort, tydlig granskningsetikett | Banner plus ”Läs mer” i översikten | Kort ”Exempel · ej sakgranskat”; förklaring finns vid behov i detalj | Syntetiskt innehåll kan inte misstas för sakgranskat eller publicerat |

Ändringen ska visa fasnamn och progress utan att dölja bekräftad status. Öppning, fasval, hundscope, public-empty, review-gating och samtliga checklistläs-/skrivregler behålls. Vyn är en stödskärm utan egen panelkomposition; panel 7 är närmaste visuella mål. Ingen ny produktfunktion, metadata, rådtext, taxonomi, datakälla, query, dependency eller profilbildfunktion tillkommer.

## Skrivvägar och avgränsningar

Ändra endast:

- `src/features/knowledge/PuppyChecklistScreen.tsx`
- den delade granskningsmarkören i `src/features/knowledge/KnowledgeScreen.tsx`, kortad till ”Exempel · ej sakgranskat” för rot/Checklistor; FAQ-layout och dess egen markering är oförändrade
- befintliga `tests/checklist-ui.test.mjs` och KNOW-02-renderaren/verifieraren för nödvändiga assertions och skärmbilder
- `src/features/knowledge/README.md`
- `docs/design/evidence/flow-knowledge-checklist-ui-02/`
- denna plan, `docs/tasks/dev/FLOW-KNOWLEDGE-CHECKLIST-UI-02.md`, `docs/tasks/dev/queue.json` och arbetsrapportens checkpoint

Skyddat: FAQ, kunskapsrot, panel 4/daglig Checklista, navigation, checklistdata, RLS, cache, innehållstaxonomi, publicering och samtliga befintliga write-flöden. 140 %/stor text och systematisk tillgänglighetsmatris ligger efter MVP-release enligt ägarbeslut.

## Verifiering och roller

- Före implementation: Architect granskar att förslaget håller sig till redan godkänd checklistresa och inga data-/navigationsegenskaper förändras; Critic granskar textmängd, skannbarhet och bildroll.
- Riktade checklisttester, `pnpm check`, iOS JS-bundle, `git diff --check` och queue-validering.
- Rendera public/review vid 375×844 och 430×844 samt 375×667. Verifiera kompakt översikt, alla övriga faser, valt sammanhang, laddning/fel, public-empty och fasdetalj. Spara buildhash, route, fixture och viewport i manifest.
- QA och Reviewer granskar den frysta ändringen. Bedöm §14 visuellt för standardskala; §14.15 markeras Ej tillämpligt enligt beslut 2026-10-21. Live Supabase/RLS, native och signerad release är separata och påstås inte av RN Web.

**Risk: L.** UI-presentation ändras; data, navigation, sparning, kontrollstatus och persondataflöde ska vara oförändrade. Om någon sådan funktion behöver ändras avbryts detta scope och uppdaterad plan granskas först.

**Nästa resa efter detta:** den separat godkända panel 4-vyn för daglig Checklista; panel 4:s filterpaket förblir stoppat och ingår inte.

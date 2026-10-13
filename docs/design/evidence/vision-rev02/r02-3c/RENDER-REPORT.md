# R02-3C Kunskap — renderingsrapport och §14-egenkontroll

Datum: 2026-10-13 · Branch: `design/vision-rev02` · Plan: R02-3 v6.2 §R02-3C<br>
Status: Implementerad och renderad. Erik har uttryckligen godkänt QA-arbetet hittills. Oberoende Reviewer och Security återstår. Full visuell match med panel 7 är **Nej**.

## Omfattning och render

Ändringen omfattar Kunskap, artikel, FAQ och faschecklistor. Befintliga rutter, publicerat innehåll, källor, checklistprogress, synkstatus och review-gate har behållits. Sökning/filter har inte införts eftersom appen saknar ett befintligt sök-/taxonomikontrakt. Redaktionella hundbilder är befintliga generiska assets; de presenteras inte som användarens hund.

Public- och reviewbyggen använder produktionskomponenterna. Reviewmaterial är märkt med `Tillfälligt exempel – innehållet är inte sakgranskat.` Public visar ett ärligt tomläge när publicerat innehåll saknas; syntetiska kort exponeras inte i public.

## Evidens

- Public Knowledge: [375×844](public/knowledge-375x844.png), [430×844](public/knowledge-430x844.png), [375×667](public/knowledge-375x667.png), [140 % browserzoom](public/knowledge-zoom-140-375.png), [loading](public/knowledge-loading-375.png), [error](public/knowledge-error-375.png).
- Review Knowledge: [375×844](review/knowledge-375x844.png), [430×844](review/knowledge-430x844.png), [375×667](review/knowledge-375x667.png), [140 % browserzoom](review/knowledge-zoom-140-375.png).
- Review-resor: [artikel](review/article-detail-375.png), [FAQ-svar](review/faq-expanded-375.png), [checklistöversikt](review/checklist-overview-375.png), [checklistdetalj](review/checklist-detail-375.png).
- Webbläsaren rapporterade inga JavaScript-fel. Native rendering, VoiceOver/TalkBack, Dynamic Type, RLS, verkligt publicerat innehåll och kontosynk är **NOT TESTABLE** i denna körning.

## Kontroller

- `pnpm typecheck`: PASS.
- ESLint på de fyra ändrade TSX-filerna: PASS.
- `git diff --check`: PASS.
- `python3 tools/dev_flow.py validate`: PASS.
- Separata public- och reviewbyggen via `tools/visual-check/build.cjs`: PASS.
- Ingen testfil lades till eller kördes.

## Designregelverk §14

1. **Ja** — vald sektion och primärt innehåll har tydlig hierarki.
2. **Ja** — likvärdiga artikelkort har samma form och vikt.
3. **Ej tillämpligt** — inget raderingsflöde finns i denna vy.
4. **Ej tillämpligt** — inte Hem.
5. **Ja för renderad webbyta** — korten scrollar; native safe area ej verifierad.
6. **Ja** — återanvänder namngiven, opt-in segmentvariant; globala standarder ändrades inte.
7. **Ja för renderade symboler** — befintlig Ionicons-familj används.
8. **Delvis** — varm canvas, grönt valt segment och lila kunskapsaccent syns. Panelens sökfält/chips saknas avsiktligt enligt avgränsningen.
9. **Ja** — etiketter och handlingar leder till befintliga sektioner och objekt.
10. **Ja** — ingen completion-badge läggs till; checklistbockar kommer från befintlig progress.
11. **Ja** — reviewbanner är saklig och tydligt märkt.
12. **Ja** — copy beskriver befintligt innehåll och redaktionella bilder utan personliga anspråk.
13. **Delvis** — stor bild över text och mindre tvåkolumnskort följer hierarkin; antal synliga kort varierar med verkligt innehåll.
14. **Delvis** — public empty/loading/error samt review artikel, FAQ och checklistdetalj renderades. Alla synk-/konfliktvarianter renderades inte separat.
15. **Delvis / NOT TESTABLE native** — webbrendering vid 140 % granskad. Native skärmläsare, Dynamic Type och reducerad rörelse är inte verifierade.
16. **Nej för full panellikhet.**
    - **Komposition: Delvis** — titel, kapselsegment, heroartikel och mindre kort finns; panelens sökfält och ämneschips finns inte.
    - **Färger: Delvis** — varm canvas och grönt/lila accentstöd finns; innehålls-/ämnesfärgerna är inte härledda från public data.
    - **Typografi: Ja** — vänsterställd titel, artikelrubrik, brödtext och metadata har separata nivåer.
    - **Komponentformer: Delvis** — rundade redaktionella kort och segment finns; panelens sök-/chipkomponenter saknas.
    - **Objekt: Delvis** — befintliga artiklar, FAQ och checklistor visas; taxonomi/sökfält saknas i produktkontraktet.
    - **Innehållstäthet: Delvis** — review visar tre redaktionella kort och vidare ingångar; public kan sakna publicerat material och visar då ärligt tomläge.
    - **Bildspråk: Delvis** — generiska godkända hundbilder används; panelens exakta bilder finns inte som särskilda assets.
17. **Ja** — fyra befintliga sektioner och detaljernas tillbakaresor fungerar i renderad harness.
18. **Ej tillämpligt** — panel 7 visar generiskt innehåll, inte en identifierad hund.

Ägarens QA-godkännande registreras separat i kön. Det är inte en oberoende Reviewer/Security-granskning och upphäver inte §14 punkt 16:s dokumenterade skillnader. Checkpointen är därför fortfarande blockerad tills de oberoende granskningarna finns.

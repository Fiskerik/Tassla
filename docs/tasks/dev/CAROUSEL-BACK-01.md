# CAROUSEL-BACK-01 – direkt tillbaka från Hem-karusellen

Status: DONE på `feedback-2026-10-12`; Architect APPROVE, Critic PROCEED, QA PASS och Reviewer PASS v1.1. Delcheckpointen omfattar endast CAROUSEL-BACK-01; övergripande MVP är inte godkänd.

## Mandat

Ägarfeedback 2026-10-12 punkt 3. Om en läsning öppnas direkt från Hem-karusellen ska läsningens tillbakahandling ta användaren till Hem i ett steg. Om en läsning öppnas från Kunskaps listvy ska tillbakahandlingen i läsningen fortsätta visa kunskapslistan. Det externa “bakåt”/AppBar-flödet från Kunskap ska fortsätta till den avsändande huvudvyn.

## Nuläge

`ProductWorkspace` sparar aktuell `knowledgeFocus` och rätt `returnPage` (`home` eller `more`), och öppnar ett karusellobjekt som fokuserat innehåll i `KnowledgeScreen`. `KnowledgeScreen` visar dock alltid artikelns interna AppBar-handling **Tillbaka till guider** och rensar då bara artikelvalet. Det skapar extra steget Hem → Kunskap → Läsning → Kunskap → Hem.

## Beteendekontrakt

1. Fokusinnehåll öppnat från Hem-karusell får ett explicit ursprung `home-carousel` i den befintliga, konto-/hundscopade `knowledgeFocus`-intentet.
2. Läsningens interna AppBar-handling för `home-carousel` är **Tillbaka** och anropar kunskapsskärmens `onBack`, vilket tar den tillbaka till Hem. Ingen mellanliggande Kunskapslista visas.
3. Läsning öppnad från Kunskapslistan använder fortsatt **Tillbaka till guider** och återställer kunskapslistan i samma vy.
4. Kunskapsskärmens externa backhandling stänger fortfarande Kunskap mot dess bevarade avsändarsida (`home`/`more`). Direktartikelns interna handling får inte radera eller skriva om detta sidursprung.
5. Att välja ett annat innehåll från Kunskapslistan övergår till listursprung. Stale origin från tidigare hund-/konto-/selection-key får inte påverka backbeteendet.
6. `KnowledgeScreen` får en explicit intent-scope key kopplad till `currentSelectionKey`. När den ändras ska dess lokala `openedId`/origin synkas till den nya fokusintenten, även om skärmen förblir monterad. Gamla artiklar ska inte ligga kvar när parentens `focusedContentId` blir null.
7. Inga routes, deep links, persistence, schema, permissions eller content keys ändras. Ingen dependency läggs till.

## Avgränsade paths

Förväntade paths: `src/features/home/ProductWorkspace.tsx`, `src/features/knowledge/KnowledgeScreen.tsx`, `tests/knowledge-review-content.test.mjs`, `tests/content-delivery.test.mjs`, `tools/visual-check/know02-app.tsx`, `tools/visual-check/verify-know02.py`, `src/features/knowledge/README.md`, task/spec/checklista, kö och utvecklingsrapport.

## Verifiering

- Testa två kontrasterande backsteg: Home-carousel → artikel → Tillbaka landar direkt på Hem; Kunskapslista → artikel → Tillbaka till guider landar på listan.
- Testa att vanlig Kunskaps back går till `returnPage`, även när en karusellartikel varit fokuserad. Byt konto-/hund/selection-scope medan `KnowledgeScreen` är monterad; gammal artikel och origin ska rensas/ignoreras utan route remount.
- Renderad browserverifiering vid 360/430 px utan overflow eller browserfel; syntetisk harness räknar navigationssteg och tar skärmbilder av båda backvägarna.
- Kör relevanta Node-tester, `pnpm check`, review iOS-export, `git diff --check` och queue validation. QA och Reviewer ska ge separata closeouts innan checkpoint och nästa slice.
- MVP:n förblir ej godkänd.

Closeout: riktade Node-tester 3/3 PASS; `pnpm check` 39/39 PASS; 55 rendered browser cases PASS; review iOS-export, diff-check och queue validation PASS. Architect APPROVE/Critic PROCEED; independent QA PASS; Reviewer PASS. Harnessens lokala Home callback är stub; ProductWorkspace `returnPage` integration är källgranskad. Native gesture/accessibility/live-RLS är NOT TESTABLE.

## Gränser

Detta ändrar bara ursprungssemantik för innehåll som öppnas från karusellen och intern back i läsvyn, samt nollställer lokalt fokus vid ändrad explicit urvalsscope. Det gör ingen generell React Navigation/back-stack-ombyggnad.

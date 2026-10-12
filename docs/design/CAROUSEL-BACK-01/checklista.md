# CAROUSEL-BACK-01 – backnavigation och visuell evidens

Syntetisk browser-QA via KNOW-02 React Native Web-harness. Screenshots visar bara navigation och vägledningslayout, inte publicerat innehåll eller verkliga hunddata.

## Bevis

- [Karusellartikel tillbaka till Hem · 360 px](../KNOW-02/evidence/carousel-article-back-home-360.png)
- [Karusellartikel tillbaka till Hem · 430 px](../KNOW-02/evidence/carousel-article-back-home-430.png)
- [Kunskapsartikel tillbaka till listan · 360 px](../KNOW-02/evidence/knowledge-article-back-list-360.png)
- [Kunskapsartikel tillbaka till listan · 430 px](../KNOW-02/evidence/knowledge-article-back-list-430.png)
- [Scope byte stänger gammal artikel · 360 px](../KNOW-02/evidence/knowledge-scope-clears-article-360.png)
- [Scope byte stänger gammal artikel · 430 px](../KNOW-02/evidence/knowledge-scope-clears-article-430.png)

`python tools/visual-check/verify-know02.py` verifierar karusell → läsning → Hem, Kunskapslista → läsning → lista, samt konto/hund-scopebyte medan KnowledgeScreen förblir monterad. Körningen PASS: 55 fall, 0 fel och 0 browserfel, inklusive de sex nya 360/430-flowfallen. Strukturerade resultat finns i `../KNOW-02/evidence/browser-results.json`.

Oberoende QA **PASS** och Reviewer **PASS**. Coverage note från QA: Home-flödets lokala browserfixture provar KnowledgeScreens `onBack` genom en harness-callback; ProductWorkspace `returnPage`/selectionKey-integrationen har dessutom källgranskats och riktade tester täcker dess intentform. Native gesture-back, VoiceOver, fysisk Dynamic Type/scroll och live RLS är NOT TESTABLE.

## Designgranskning §14

| # | Kontroll | Resultat |
|---:|---|---|
| 1 | Högst en primär knapp per vy | PASS; detta är befintliga AppBar-navigationer. |
| 2 | Likformiga grupper | PASS; ingen ny kontrollgrupp. |
| 3 | Radering/undo | Ej tillämpligt; ingen dataoperation. |
| 4 | Inga ändra/radera-länkar | PASS; inga tillagda länkar. |
| 5 | Spacing via tokens | PASS; layoutrymden är oförändrade. |
| 6 | Inga hårdkodade färger/mått | PASS; inget nytt visuellt mått. |
| 7 | En ikonuppsättning/inga emoji | PASS; återanvänder AppBar. |
| 8 | Kategorifärg och ikon | Ej tillämpligt för navigation. |
| 9 | Ikoner begripliga | PASS; tillgängligt knappnamn anger backdestinationens kontext. |
| 10 | Inga normalstatusetiketter | PASS; inga statusetiketter tillagda. |
| 11 | Högst en handlingskrävande ruta | PASS; ingen ny informationsruta. |
| 12 | Förbjudna ord | PASS; inga nya råd eller statusord. |
| 13 | Förklarande text max två rader | PASS; ingen ny brödtext. |
| 14 | Laddar/tom/fel/normal | PASS i befintlig KNOW-02-matris; backflödet provas i normal state. |
| 15 | Tryckytor/stor text | PASS i befintliga AppBar-kontrakt; 140 %-matris från KNOW-02 körs om. |
| 16 | Layout mot målbild | PASS; bara intern backdestination ändras. |
| 17 | AppBar/flikar/bottenmeny | PASS; tillbaka går direkt till önskad vy. |
| 18 | Foto/hundnamn | PASS; ingen hundidentitet eller fotoändring. |

Native iOS gesture-back, VoiceOver, fysisk Dynamic Type/scroll och live Supabase/RLS är NOT TESTABLE i denna browserkontroll. Denna slice godkänner inte MVP:t.

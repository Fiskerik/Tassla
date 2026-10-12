# UPD-LOG-UI — visuell QA

Status: oberoende QA av v7 slutförd 2026-10-12 — PASS. Detta godkänner inte native-, tangentbords-, skärmläsar- eller backend/RLS-beteende.

Jämför med [målbilden](../../../vision_rev01.jpg) och granskningsreglerna i `docs/design-rules.md`. Skärmbilderna i `evidence/` kommer från produktionskomponenter i React Native Web med syntetisk data. Harnessen provade 375 och 430 px, 140 % text, reducerad rörelse och relevanta spar-/felstatusar. Det verifierar inte native rendering, tangentbord, skärmläsare eller backend/RLS.

Viktiga bilder: `log-375.png`, `log-430.png`, `log-accident-sheet-375.png`, `log-food-sheet-375.png`, `log-water-sheet-375.png`, `log-water-sheet-actions-375.png`, `log-detail-pending-375.png`, `log-detail-failed-375.png`, `log-detail-unsure-375.png`, `log-edit-food-375.png`, `log-edit-unsure-375.png`, `log-patterns-collapsed-375.png`, `log-patterns-expanded-375.png`, `log-patterns-expanded-content-375.png` och `log-patterns-expanded-content-large-text-375.png`. Fullt harnesresultat finns i `evidence/browser-results.json`.

| # | Kontroll | Oberoende QA | Kommentar |
|---:|---|---|---|
| 1 | Högst en `primary`-knapp per vy | Ja | Detaljarket visar en primär `Spara`/`Försök igen`; redigeraren har en primär `Spara`. Åtgärdspar har sekundär stil. |
| 2 | Knappar i samma grupp har samma höjd och stil | Ja | `Spara`/`Hoppa över` och `Försök igen`/`Hoppa över` har samma fullbreddshöjd och konsekvent primär/sekundär stil. |
| 3 | Radera skiljer sig från Ändra och kräver bekräftelse/fungerande ångra | Ja | Radering är destruktiv i redigeraren och öppnar bekräftelse; bekräftad snabb add visar `Ångra` i arket. |
| 4 | Inga stora Ändra/Radera-länkar på varje rad | Ja | Raderna har kompakt innehåll och chevron; redigera/radera ligger i redigeringsarket. |
| 5 | Avstånd följer spacingtokens och sektionsrubriker har jämn marginal | Ja | Granskad skärmdiff använder befintliga spacingtokens; synliga marginaler mellan snabbval, sektioner och rader är jämna. |
| 6 | Inga hårdkodade färger eller px-värden i diffen | Ja | Ingen ny hårdkodad färg eller px-baserad UI-styling hittades i diffen. Rendererens viewportmått är QA-konfiguration, inte appstil. |
| 7 | En ikonuppsättning används och inga emojis förekommer | Ja | Loggikonerna och stäng-/statusikonerna använder Ionicons; inga emojis synliga eller tillagda i UI-copy. |
| 8 | Kategorier använder konsekvent avsedd färg och ikon | Ja | Kiss, bajs, mat, sömn och promenad har samma ikonchips/färg i snabbval och loggrader. |
| 9 | Ikoner är begripliga utan förklaring | Ja | Droppen, matsymbolen, månen, tassavtrycken och olyckssymbolen är igenkännbara i observerade vyer. |
| 10 | Normala poster saknar statusetiketter | Ja | Normala rader visar typ, tid och eventuell detalj; status återkopplas separat i arket/toast. |
| 11 | Högst en informationsruta visas och den kräver handling | Ja | Senaste-mönster-sammanfattningen är dold från början och öppnas/stängs med `Visa dina senaste mönster`/`Dölj dina senaste mönster`; ingen knapp syns utan sammanfattningsdata. Skärmbilderna visar stängt och öppet läge vid 375/430 px samt hela texten vid 140 %. |
| 12 | UI-copy saknar förbjudna tekniska ord | Ja | Granskad svensk UI-copy använder vardagliga spar-/felmeddelanden; inga förbjudna driftord hittades. |
| 13 | Förklarande copy är högst två rader och följer målbildens ton | Ja | Observerad hjälp-/felcopy är kort och lugn; stortextbildens loggdetalj får plats på två rader. |
| 14 | Laddar, tomt, fel och normalt läge finns | Ja | Evidence innehåller `log-loading.png`, `log-empty.png`, `log-error.png` samt normala logg- och arkbilder. |
| 15 | Tryckytor är minst 44×44 pt och layouten fungerar med stor text | Ja | Nya kontroller använder `tokens.size.touchMin`; visual harness verifierar 44 pt på checkboxar. 140 %-bilder vid 375/430 px visar matark och redigerare, inklusive efter-scroll-bilder där Radera/Avbryt/Spara går att nå inom viewporten. RN Web-preview verifierar inte native tangentbord eller skärmläsare. |
| 16 | Layout, komponenter och innehåll följer målbilden; avvikelser motiveras | Ja | 2×2 snabbval, kompakt dagslogg och befintlig navigation följer målbildens struktur. Detaljarket efter bekräftad add är en uttryckligen beställd och dokumenterad avvikelse. |
| 17 | Appbar, flikar och bottenmeny följer målbilden | Ja | Loggvyn har centrerad `Logga`-titel och femposter-bottenmeny. Målbilden kräver inga flikar på Logga. |
| 18 | Foto och hundens namn används där målbilden kräver det | Ja | Ej tillämpligt på målbildens Logga-skärm; den visar varken hundfoto eller hundnamn. |

Oberoende QA-omdöme av v7: **PASS**. Kontrollpunkterna 1–10 och 12–17 är `Ja`; 11 är `Ja`; 18 är ej tillämplig. QA körde 45 browserkontroller utan sidfel och granskade de nya skärmbilderna vid 375/430 px och 140 % text. Fokuserade tester och `git diff --check` passerade. Senaste-mönster-sammanfattningens befintliga tröskel, innehåll och beräkning är oförändrade.

Begränsningar: underlaget är React Native Web med syntetiska data. Native rendering/tangentbord, skärmläsare och backend/RLS verifierades inte. Vid 140 % text radbryts den befintliga delade bottenmenyns etikett `Träning` i två rader; QA såg ingen overflow eller förlorad kontroll. Detta ligger utanför paketets skrivvägar.

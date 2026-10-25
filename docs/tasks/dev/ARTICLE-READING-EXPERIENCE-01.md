# ARTICLE-READING-EXPERIENCE-01 — artikelns läslayout och hundrelevant karusell

**Status:** done · **Planversion:** v3 · **Risk:** M
**Bas:** `a9fda05` (`Restore generic original article copy`) på `codex/ui-visual-review-loop`
**Skrivägare:** huvudsessionen

## Mål och mandat

Gör den befintliga artikel-/guideläsaren bred och lätt att skanna, med bild först, fet ingress, gröna vänsterställda rubriker och relaterade artiklar för den aktiva hunden efter fulltexten.

Mandatkälla är Eriks uttryckliga önskemål i konversationen 2026-10-25: återställd originaltext utan hundnamn eller könade personliga pronomen; läsning utan yttre box; BabyJourney-exemplen som stilinspiration med Tasslas rubrikfärger och återhållsam färg; en avslutande karusell med andra relevanta artiklar för den aktiva hunden. Panel 7 i `vision_rev02.jpg` är närmaste Tassla-referens men visar biblioteket, inte artikelns detaljvy.

Bevara publiceringsgrindar, hela bibliotekets läsbarhet/sökbarhet, text och källor oförändrade, befintliga bild-/fokusmappningar om de klarar granskning, samt befintliga ålder-/ras-/händelseregler som enda rekommendationskälla. Personalisering får inte återinföras. Ingen schema-/API-/behörighetsändring, ny rekommendationslogik, ny dependency eller live-åtgärd ingår. Hundborttagning och kontoradering är separata uppgifter.

## UI Critic BRIEF — 2026-10-25

Underlag: `article-Nala-375.png` och `article-end-Nala-375.png`, båda 375×844, plus aktuell `KnowledgeScreen.tsx`. Panel 7 visar Kunskapsbiblioteket; BabyJourney-exemplen är ägarens inspiration, inte pixelreferens för Tassla.

| # | Element | Nuläge → ändring | Acceptans | Vikt |
|---|---|---|---|---|
| 1 | Bild och läsyta | Bilden ligger i ett inramat kort med 24 px sidmarginal → bild först, tillgänglig fullbredd, utan yttre kortform; bakåtväg bevaras | Ingen yttre ram/radie; foto först | H |
| 2 | Ingress | Normalvikt i lila ruta → fet, neutral yta med normal läsmarginal | Tydlig vikt utan färgad ruta | H |
| 3 | Bredd/rytm | Kortets padding smalnar av texten → nyttja artikelns textkolumn med jämn stycke-/rubrikrytm | Ingen extra inre kortkolumn; all text vänsterställd | M |
| 4 | Underrubriker | Huvudrubriker gröna men undernivå neutral → Tasslas gröna rubrikfärg konsekvent | Rubriker/underrubriker är tydliga och vänsterställda | M |
| 5 | Artikelns slut | Fulltexten slutar vid artikelkortets kant → horisontell karusell med andra hundrelevanta artiklar | Efter hela texten/källorna; exkluderar öppnad artikel | M |

Behåll synlig bakåtväg, centrerad hundbild, mörk neutral brödtext, vänsterjustering och gröna huvudunderrubriker. Exakt artikelmallmatch mot Tassla-panel 7 är **NOT TESTABLE** eftersom sådan referens saknas.

## Omfattning och skrivvägar

Förväntade exakta `write_paths`:

- `docs/tasks/dev/ARTICLE-READING-EXPERIENCE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design-rules.md`
- `docs/content/artiklar/README.md`
- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/main-navigation.ts`
- `src/features/knowledge/editorial-image-assignment.ts`
- `src/features/knowledge/README.md`
- `tools/visual-check/vision-r02-home-panels-app.tsx`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `tests/content-delivery.test.mjs`
- `tests/knowledge-search-screen.test.mjs`
- `tests/home-panel-routes.test.mjs`

`editorial-image-assignment.ts` ändras bara om aktuell render visar fel motivbeskärning/fokus för en mappad artikel; ändra inte bildmaterial eller artikeltext i denna uppgift.

## Beteendekontrakt

- Läsaren visar samma titel/brödtext/källor oavsett hundprofil.
- Karusellen väljer endast `contentType === 'article'`, `recommended === true` och ID skilt från öppnad version. Okänd/false rekommendation inkluderas aldrig; inga egna fallbackregler.
- Ingen matchande annan artikel: dölj karusellen utan att blockera läsaren.
- Val av karusellkort öppnar motsvarande redan laddade artikelversion med befintlig `openArticle`/`onSelectContent`-väg.
- Öppning från artikelkort eller relaterad karusell börjar vid artikelns bild/titel, även om listan tidigare skrollats ned; återgång återställer bibliotekets tidigare scrollposition och sökning.
- Detailns route-scrollnyckel innehåller valt innehålls-ID så även byte mellan karusellartiklar går till toppen. Biblioteksingång bevarar `knowledge`; ingång från Utveckling fortsätter bevara `home-development-flow`.
- Alla artiklar fortsätter gå att söka upp och öppna även om de inte rekommenderas för hunden.
- Skärmläsarlabel anger artikelns titel; karusellen kan svepas horisontellt utan att störa vertikal scrollning.

## Acceptanskriterier och kontroller

| Kriterium | Bevis/kontroll | Status |
|---|---|---|
| Permanent regel för artiklar, guider och träningstexter: bild först, vänsterjusterad långtext, fet ingress, fet Tassla-grön underrubrik, neutral body, ingen yttre artikelbox, F-mönstret stöds genom skanningshierarki; inga hundnamn/könade personliga pronomen | `docs/design-rules.md` §9; artikelguide länkad till regeln | PASS |
| Läsvy följer briefen; bildmotiv och fokus fungerar för alla befintliga mappade artiklar | UI Critic REVIEW på aktuell 375×844-render: 5/5 punkter PASS och header-till-bildglapp löst; Knowledge bildfokusverifiering 10/10 vid 375/430; separat Tassla-facit för detaljvy saknas | PASS; exakt detaljmatch NOT TESTABLE |
| Långformsläsaren hanterar minst 140 % större text utan horisontell sidoverflow och behåller nåbar rubrik och relaterad karusell | Syntetisk 375×667 RN Web textproxy, skärmbild `article-reader-text-140-375x667.png` | PASS som webbproxy; native Dynamic Type NOT TESTABLE |
| Karusell innehåller endast hundrelevanta andra artiklar och öppnar rätt version; exkluderar aktuell, false/okänd rekommendation och icke-artiklar; tomt urval gömmer karusell | Senaste syntetiska article-reader-verifiering: 12/12 vid 375/430, inklusive tomt urval, exkluderingar och horisontell scroll | PASS |
| Text, publiceringsgrindar, källor, bibliotekets sökning, checklistor/FAQ, tillbakaresan och befintlig bildmappning fungerar | `CI=1 pnpm check` (83/83); riktade sök-/route-tester 2/2; befintlig bildmappningskontroll 10/10 | PASS |
| Öppning från nedre bibliotekskort och karusellkort rullar den nya artikelversionen till toppen; återgång återställer bibliotekets scrollposition och sökning | Senaste syntetiska article-reader-verifiering vid 375/430; scroll/top/sökstatus bevaras | PASS |
| Inga överflödiga ändringar efter avgränsad läsbarhetskontroll; samtliga ändrade paths inom write paths | `git diff --check`; scope-check: alla ändrade filer ingår i frysta skrivvägar | PASS |
| Full lokal kvalitet | `CI=1 pnpm check`; `python -X utf8 tools/dev_flow.py validate`; Python-kompilering; riktad RN Web-render/verifiering | PASS |
| Inhemsk/native och backendgräns tydlig | Native iOS VoiceOver/Dynamic Type, TestFlight och live Supabase är NOT TESTABLE lokalt; inga live-operationer utfördes | NOT TESTABLE |

Plan v1 fick Architect APPROVE och produkt-Critic PROCEED. Plan v2 lades fram för att öppna artikeln överst, men Critic gav CHANGES eftersom återgången inte får kasta bort bibliotekets plats. Plan v3 återställer artikeln överst och bevarar bibliotekets scrollposition/sökning; Architect APPROVE och produkt-Critic PROCEED gäller v3. UI Critic BRIEF ovan kompletterades med slutlig REVIEW efter korrigering av header-till-bild-avståndet. Oberoende QA och fryst Reviewer återstår.

UI Critic REVIEW öppnade även 140 %-proxyn efter Reviewerns fynd: ingress/karusellrubrik/korttitel/metadata är läsbara, ingen textkollision mot bottenmenyn, delvis synligt nästa kort är avsiktlig horisontell karusell. Detta är en webbproxy, inte native Dynamic Type.

Oberoende QA gav **PASS** 2026-10-25. QA verifierade alla ändrade paths mot plan v3, screenshot-/JSON-evidensen, befintliga rekommendationsflaggor, profiloberoende innehåll, article-top-/Back-scrollbeteende och statusrapportering. QA körde riktade route-/söktester 2/2 filer, content-delivery 1/1, queue validation och `git diff --check`; QA körde inte om hela `pnpm check` eller native/live-kontroller. Fryst Reviewer begärde därefter att den permanenta §9-regeln om minst 140 % text ska visas för även artikelvyn. Den nya proxyn passerar 13/13 och oberoende QA gjorde en fokuserad PASS-recheck av verifierare, skärmbild, skrivväg och rapportering. Native Dynamic Type är fortsatt NOT TESTABLE.

## Checkpoint

Architect APPROVE och produkt-Critic PROCEED gavs på exakt plan v3 den 2026-10-25. Implementationen följer godkända skrivvägar. Senaste standardrender visar helbreddsbild direkt under kompakt Kunskap-header, bred vänsterställd artikeltext, fet neutral ingress, Tassla-gröna rubriker och hundrelevant karusell efter hela artikeln. UI Critic REVIEW gav PASS på alla fem briefpunkter och bedömde att tidigare glapp är löst; exakt separat Tassla-målbild för detaljvy saknas. Fryst Reviewer noterade att §9 även kräver minst 140 % text. Den riktade 375×667-webbproxyn är tillagd inom fryst verifierarsökväg; article-reader-verifiering passerar nu 13/13, inklusive ingen sidoverflow och åtkomlig karusell. UI Critic bedömde skärmbilden läsbar; oberoende QA gjorde en fokuserad PASS-recheck av den nya verifieringen, skärmbilden, skrivvägen och statusrapporteringen. Knowledge image focus 10/10, riktade Node-tester 2/2, `CI=1 pnpm check` PASS (83/83), Python-kompilering, queue validation och `git diff --check` PASS. QA PASS; fryst Reviewer bekräftade den korrigerade evidensen och gav PASS. Den lokala UI-checkpointen är stängd. Native iOS, Dynamic Type, TestFlight och live Supabase förblir NOT TESTABLE.

# KNOWLEDGE-PANEL7-VISUAL-01 — Kunskapsöversikt mot vision panel 7

Status: `done` · Plan v4 · Bas: `ba8dfaefc7f1a601014adeef467381759f21cd3f` på `knowledge/panel7-visual-alignment`.

## Mål och mandat

Gör Kunskapens guideöversikt tydligare och mer lik panel 7 genom att lyfta fram en rekommenderad guide med bild, lägga tillbaka en tydlig rubrik och visa två kompakta bildkort under den.

Mandat: ägarens uttryckliga beställning 2026-10-28 och panel 7 i `docs/design/vision-rev02-screen-contracts.md`; utseende följer `docs/design-rules.md`. Bevara katalogens public/review-gräns, guideöppning, sökning, FAQ/checklistdestinationer och artikelcopy. Hundnamn får förekomma i personligt UI, men inte i redaktionellt innehåll eller kortutdrag. FAQ-detaljen är en separat stödvy och ska inte få guideöversiktens innehåll inlagt i sig.

Den bifogade jämförelsen visar panel 7 bredvid FAQ-detaljen, inte två motsvarande skärmar. Den aktuella guideöversikten renderades separat i `docs/design/evidence/knowledge-panel7-visual-01/baseline/` för jämförelse mot panel 7.

## Omfattning

- Ersätt den tvetydiga enknapps-växlingen med befintlig segmentkomponent och två verkliga lägen: `För dig` och `Alla artiklar`.
- Visa `Rekommenderat för er just nu` endast för innehåll som befintlig rekommendationsflagga faktiskt inkluderar. Behåll ett ärligt tomläge och vägen till alla publicerade artiklar.
- Dölj rekommendationsrubriken när en sökning visar hela det laddade biblioteket; sökträffar kan sakna rekommendationsflagga.
- Lägg till korta neutrala ingressutdrag under rubrikerna med den befintliga `getGuidePreviewText`; använd redan publicerad brödtext utan att ändra eller personanpassa den.
- Gör de två mindre bildkorten mer kompakta enligt målbildens breda bildformat. Behåll ID-bunden fokusbeskärning så hundens ansikte syns.
- Behåll länk till Checklistor och Vanliga frågor under artikelkorten. Behåll separat FAQ-skärm.

## Jämförelsematris

| Panel 7-element | Nuläge | Ändring | Acceptans |
|---|---|---|---|
| Sökfält | Finns och fungerar | Behåll | Sök träffar och tomläge fungerar |
| Filterrad | En ensam växlande knapp | Två valda/ovalda segment för befintliga vyer | `För dig` och `Alla artiklar` är begripliga, nåbara och byter mängd |
| Rekommendationsrubrik | Saknas | Lägg till ovanför det utvalda bildkortet | Syns bara när rekommendationsläget är aktivt och ingen sökning pågår |
| Stort bildkort | Bild, titel och metadata; saknar ingress | Lägg till kort neutralt utdrag | Bild över text, fokus och öppning av samma artikel bevaras |
| Två mindre bildkort | Högre 4:3-bild, titel och metadata | Bredare 16:9-bild samt två-raders utdrag | Ansikten synliga och korten ryms utan horisontellt overflow |
| Checklistor/FAQ | Finns längre ned | Behåll som tydliga destinationskort | Båda går fortsatt att öppna |
| Kategorichips ur panelen | Saknar verklig taxonomy utöver befintliga vyfilter | Inga dekorativa/falska kategorier införs | Innehåll filtreras inte efter påhittad kategori |

## Risk och gränser

Risk: **M**, eftersom `För dig` måste fortsätta följa den redan beräknade rekommendationsflaggan. Ingen datamodell, ny taxonomi, serverläsning, navigationsmodell eller skrivning ändras. Live Supabase och native/iPhone-verifiering ingår inte.

Skyddade områden: FAQ-katalog, checklistdata/progress, publiceringsstatus, källor, artikeltext, navigationssemantik och övriga huvudflikar.

## Skrivvägar

- `src/features/knowledge/KnowledgeScreen.tsx`
- `src/features/knowledge/README.md`
- `tests/content-delivery.test.mjs`
- `tests/knowledge-search-screen.test.mjs` (amendment v4: replaces assertions for the previous card layout and verifies supported recommendation/library/search states)
- `tests/ui-r02-04-panelhelhet.test.mjs`
- `tools/visual-check/verify-vision-r02-home-panels.py`
- `tools/visual-check/vision-r02-home-panels-app.tsx` (endast om fixture behöver ange rekommenderat innehåll)
- `docs/design/evidence/knowledge-panel7-visual-01/`
- `docs/tasks/dev/KNOWLEDGE-PANEL7-VISUAL-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`

## Granskning och acceptans

1. UI Critic BRIEF på den aktuella paneljämförelsen innan kod; matris/verdict sparas här.
2. RN Web public/review-guideöversikt vid 375×844 och 430×844, plus 375×667 och 140 % text. Kontrollera val av vy, sökning inklusive en träff med `recommended=false` utan rekommendationsrubrik, artikelöppning/retur, tomt rekommendationsläge och att FAQ/checklistdestinationerna kvarstår.
3. Jämför slutrender mot panel 7: blockordning, färg, typografisk hierarki, kortform, bildfokus och innehållstäthet. QA och Reviewer bedömer beteende respektive diff oberoende.
4. Kör `CI=1 pnpm check`, riktad verifierare och `git diff --check` efter implementation.

| Kontroll | Resultat | Evidens |
|---|---|---|
| UI Critic BRIEF | PASS as advisory brief | [panel7-before.png](../../design/evidence/knowledge-panel7-visual-01/baseline/panel7-before.png), 798×952; public/review fixture metadata is in `RESULTS.json` |
| UI Critic REVIEW | Final advisory PASS: all six visual dimensions pass; P2 spacing correction confirmed | [panel7-after.png](../../design/evidence/knowledge-panel7-visual-01/final/panel7-after.png) |
| Review RN Web-render | PASS 23/23 | [RESULTS.json](../../design/evidence/knowledge-panel7-visual-01/final/RESULTS.json) och renderbilder i `final/` |
| Public RN Web-render | PASS 4/4 | [RESULTS.json](../../design/evidence/knowledge-panel7-visual-01/public/RESULTS.json) och renderbilder i `public/` |
| Riktade tester | PASS 29/29 | `knowledge-search-screen`, `content-delivery`, `ui-r02-04-panelhelhet` |
| CI och diffkontroll | PASS — TypeScript, edge TypeScript, ESLint, 100/100 testfiler; `git diff --check`, Python syntax och dev-flow validerade | Slutlig task-checkpoint |
| Scope re-review v4 | Critic PROCEED; Architect APPROVE | This plan and `queue.json` |
| QA / Reviewer | Independent QA PASS and Frozen Reviewer PASS for v4 scope | Slutlig task-checkpoint |
| GitHub | Commit `2486b0b8a8322526c8d075b0a15f10df8fc2e0dd` pushad till `origin/knowledge/panel7-visual-alignment`; ej mergad, TestFlight-build ej verifierad | Push 2026-10-29 |

## Checkpoint

- Implementerat: delad tvålägesväxel `För dig` / `Alla artiklar`, rekommendationsrubrik som döljs under fullbibliotekssökning, korta utdrag ur publicerad copy, 16:9-bildkort och kompakt tvåspaltslayout i helbibliotek/sökning. FAQ och Checklistor fortsätter som separata destinationer.
- Skrivvägarna omfattar `KnowledgeScreen`, knowledge README, fyra testfiler, visuell fixture/verifierare, evidens, task och queue.
- Gransknings-fixturen har tre rekommenderade och en ej rekommenderad post. Den verifierar att `Alla artiklar` och fulltextsökning når ej rekommenderat innehåll utan att kalla det rekommenderat.
- Review-RN-Web: 375/430 px, artikelöppning, bildramar, sök/filter-semantiс och 375×667 med 140 %-textproxy passerar 19/19. Checklistor och FAQ kontrolleras nåbara ovanför bottenmenyn i kort/stor text.
- Public RN-Web: ärligt separat tomläge för hundrekommendationer och hela biblioteket vid 375/430 px, 4/4.
- Första UI Critic REVIEW fann inget P0/P1 men noterade P2-onödig luft före rekommendationsrubriken och mellan rubrik/bild. Gap minskades lokalt till cirka 24 pt respektive 12 pt utan att ändra gemensam `SectionHeader` eller kortcopy. Critic bekräftade korrigeringen och gav PASS på komposition, färg, typografi, komponentform, innehållstäthet och bildspråk.
- Oberoende QA PASS på v4 scope. `CI=1 pnpm check` passerar typecheck, edge typecheck, ESLint och 100/100 testfiler; RN Web review 23/23 och public 4/4; riktade tester 29/29; `git diff --check`, Python syntax och dev-flow validerar.
- QA och Frozen Reviewer PASS. Commit `2486b0b8a8322526c8d075b0a15f10df8fc2e0dd` är pushad till `origin/knowledge/panel7-visual-alignment`; arbetskortet är stängt.
- Ej verifierat: native Dynamic Type/VoiceOver, fysisk iPhone och live data. De ändras inte av denna lokala presentationsslice.

## UI Critic BRIEF — 2026-10-28

Kritikern öppnade jämförelsen och bedömde den aktuella guideöversikten, inte FAQ-vyn. Baseline-fixturen är RN Web review med syntetiska guider, 375×844.

| # | Referenselement | Nuläge | Ändring | Synlig acceptans | Typ / vikt |
|---|---|---|---|---|---|
| 1 | Valrad under sök | Ensam centrerad ”Alla artiklar” | Visa befintliga `För dig` / `Alla artiklar` som valrad med aktiv form/färg | Båda syns, aktivt val tydligt, minst 44 pt mål | design / H |
| 2 | Rekommendationsrubrik och ingress | Bild följer direkt efter urval; huvudkort saknar ingress | Lägg `Rekommenderat för er just nu` ovanför huvudkortet och använd neutralt publicerat utdrag | Rubrik → bild → titel → max två ingressrader → metadata | design / H |
| 3 | Två mindre bildkort | Små bilder är ungefär 115 pt höga, huvudbilden 184 pt | Ändra småbildsformat till cirka 16:9 och behåll fokusbeskärning | Huvudkortet dominerar, småkort ryms och ansikten syns | design / M |
| 4 | Titel/ingress/metadata | Titel väger tungt; ingress saknas | Minska huvudkortets typografiska vikt med befintliga semantiska tokens; håll metadata dämpad | Tydlig titel > ingress > metadata-hierarki | design / M |
| 5 | Checklistor/FAQ | Länkarna ligger efter kortlistan och syns först efter scroll | Behåll två tydliga destinationskort där de redan ligger | Båda är nåbara med minst 44 pt träffyta | design / M |

Kontraktsfråga: referensens Just nu/Valp/Träning/Beteende kräver verklig taxonomy. Inga dekorativa filter föreslås; använd `För dig` / `Alla artiklar` som stödda vyfilter. Critic bedömde befintliga varma bilder och ansikten som fungerande men krävde ny kontroll efter beskärningsändringen. Kritiken är underlag för implementation, inte visuellt godkännande.


## Critic-planreview — 2026-10-28

Plan v2 fick **PROCEED WITH CHANGES**: sökning visar alla laddade guider även när `För dig` är aktivt, så en sökträff utan rekommendationsflagga får inte ligga under rubriken ”Rekommenderat för er just nu”. Plan v3 döljer rubriken under aktiv sökning och lägger till en explicit verifiering av en sökträff med `recommended=false`; det bevarar befintlig söksemantik. Critic re-review av v3 bekräftade att ändringen löser invändningen; inga nya blockerare. Architect APPROVE bekräftade att alla använda kontrakt redan finns och att datamodell/API inte ändras.

## Plan v4 — scope audit efter QA

QA upptäckte att `tests/knowledge-search-screen.test.mjs` behövde uppdateras för nya rubriken, 16:9-småkort och relevanta vysemantiker men inte stod bland v3:s `write_paths`. Testfilen har nu deklarerats i tasken och queue; befintliga funktionella kontrakt är desamma. En onödig ändring av `vision-rev02-screen-contracts.md` har återställts och ingår inte. Detta är en smal test-/skrivvägsjustering; UI, dataurval, API och godkända acceptanskriterier förändras inte. Critic och Architect re-reviewed the v4 amendment before QA closure.

V4 scope re-review **Critic PROCEED; Architect APPROVE**. Critic confirmed that the existing test assertions for this screen are appropriately part of the same slice and that the earlier UI review remains applicable. Architect confirmed the path is in both task and queue, the screen-contract file is clean, and no architecture/design-contract change is needed. QA is checking the final declared scope before the Reviewer gate.

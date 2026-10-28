# CHECKLIST-POLYCHROME-ICONS-01 — polykroma ikoner i checklistor

**Status:** done · **Planversion:** v2 · **Risk:** L
**Bas:** `6222307bd68647c75c4fbe95fadf7e7da654feca` (`knowledge/d3-catalog-delivery`)

## Mål och mandat

Ägarens önskemål 2026-10-28: använd en trevligare, polykrom ikonstil i linje med Logga-panel 5 och visa samma ikonstil när en ikon väljs i exempelvis Checklistor.

Loggas befintliga kategoripiktogram och tonade rundlar är den visuella förebilden. Checklistornas val, öppnade ikonknapp och sparade ikon ska använda samma tvåtonsutförande: semantiskt färgad symbol på en mjuk, rundad kategoriyta. Piktogrammet ska vara 20 pt på en 32 pt rundel; radios och triggers behåller minst 44 pt tryckyta. En ikon ska ha samma symbol och färgton före valet, efter valet och i checklistans punkt. Neutral fallback får en diskret varmgrön rundel med mörk symbol.

Bevara samtliga 20 tillåtna Ionicons-namn, svensk tillgänglig etikett, 44 pt tryckyta, radiogruppens val/markering, dataformat och befintlig icon-aware save/readback. Ändra inte Loggas färger eller utseende, innehåll, sortering, lagring, schema eller andra valda användaråtgärder. Ingen dependency.

## Uppgiftskontrakt

- **Skrivägare:** koordinator ensam, samma befintliga branch; ingen ny branch/worktree.
- **Modeller:** rollernas konfigurerade standardmodeller; inga avsteg.
- **Granskning:** UI Critic BRIEF och Architect APPROVE på denna plan före kod; slutlig UI Critic REVIEW, oberoende QA och Frozen Reviewer efter render.
- **Läsunderlag:** `docs/design-rules.md` §§2, 3, 7, 10, 14; `.agents/skills/tassla-consumer-ux/SKILL.md`; `docs/design/evidence/log-potty-icon-pattern-01/public/log-main-375.png`; nuvarande picker-/checklist-render i `docs/design/evidence/ui-modal-center-01/checklist-icons/`; `src/components/ui/IconChip.tsx`, `ThemedIcon.tsx`, `ChecklistItem.tsx`.
- **Beroenden:** panel 5 Loggikonernas godkända lokala stil finns; checklistans ikonval och sparade iconfält finns. Ingen dependency-blockerare.
- **Sekvensering:** `TRAINING-EXERCISE-MODAL-UX-01` är nu `done`; dess Frozen Reviewer PASS och överlappande checkpointfiler är stängda. Ikonimplementation fanns redan i det lokala arbetsutkastet när ägaren bad om den här uppgiften. Formell acceptans hölls tills Träning stängts och v2 fått Architect APPROVE; tasken går nu genom sin QA-/reviewgrind utan parallella aktiva skrivtasks.

## Visuell jämförelsematris

| Referens | Nuläge | Planerad ändring | Acceptans |
|---|---|---|---|
| Panel 5 visar separata, tydliga symboler på ljusa kategorifärgade rundlar. | Checklistans väljare visar 20 små fristående Ionicons; valda checklistikoner kan också sakna rundel. Neutrala val ser huvudsakligen grå ut. | Använd samma ThemedIcon-renderare, storlek och yta i Hemmets rutinrad, Knowledge-väljarens trigger/val och sparad checklistpunkt. Återanvänd befintliga kategoriers fg/bg-par; reservera neutral för `list-outline` och ge den en diskret rundel. | Samma 20 pt glyph på 32 pt rundel före och efter val; radio-markering och fokus är fortsatt tydliga. Loggpanelen förblir oförändrad. |
| Checklistans val ska vara lätta att se och träffa. | 20 radioalternativ har 44 pt mål men liten symbol med svag färgseparation. | Behåll 44 pt radioalternativ och vald kant/checkmark; centrera ikonchippen utan att minska target. | Alla 20 val är synliga/läsbara, minst 44×44 pt, inga överlappningar eller overflow vid 375/430 px. |

### Fast semantisk ikonmappning

Toner styr bara utseendet; de ändrar inte vad checklistpunkten betyder eller vad som sparas.

| Ton | Ikonnycklar |
|---|---|
| `water` | `water-outline` |
| `walk` | `walk-outline`, `sunny-outline`, `football-outline`, `star-outline` |
| `sleep` | `bed-outline`, `moon-outline`, `flower-outline`, `rose-outline` |
| `training` | `paw`, `leaf-outline`, `fitness-outline`, `home-outline`, `school-outline` |
| `food` | `restaurant-outline` |
| `vaccination` | `heart-outline`, `bandage-outline` |
| `veterinary` | `medkit-outline`, `brush-outline`, `sparkles-outline` |
| `neutral` | `list-outline` (endast ej lagrad fallback; diskret varmgrön rundel med mörk symbol) |

## Skrivvägar

- `src/components/ui/ThemedIcon.tsx`
- `src/components/ui/ChecklistItem.tsx`
- `src/components/ui/DailyActivityItem.tsx`
- `src/features/home/DailyChecklistScreen.tsx`
- `src/features/checklists/ChecklistIconPicker.tsx`
- `src/features/checklists/checklist-icons.ts`
- `src/components/README.md`
- `src/features/checklists/README.md`
- `tests/daily-activity-ui.test.mjs`
- `tests/checklist-ui.test.mjs`
- `tests/daily-routine-checklist-icons.test.mjs`
- `tests/ui-library-policy.test.mjs`
- `tools/visual-check/verify-checklist-icons.py`
- `tools/visual-check/verify-checklist-custom-icons.py`
- `docs/tasks/dev/CHECKLIST-POLYCHROME-ICONS-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/checklist-polychrome-icons-01`

## Acceptans och kontroller

| Kriterium | Kontroll |
|---|---|
| Logg-panelens polykroma kategoriutseende återanvänds i checklistval och checklistpunkt. | UI Critic jämför panel 5 med picker och vald punkt; public/review-renderbilder visar samma glyph och fg/bg-par för trigger, radioalternativ och sparad rad. |
| Alla 20 ikonval har tydlig, meningsfull färg utan att färg ensamt signalerar val. | Testa fullständig ikon→semantisk ton-tabell; räkna kontrast för symbol/rundel (≥3:1) och normal text (≥4.5:1); skärmbildskontroll av alla val; vald radio har fortsatt synlig kant/checkmark/fokus och aria checked. |
| Val och sparande fungerar som före ändringen i båda checklistflödena. | Hemmets rutinverifierare och Knowledge-verifieraren öppnar väljaren, sparar val, visar trigger/punkt, återöppnar och bekräftar valt värde; icon allowlist samt migrationens värden är oförändrade. |
| Layout, mål och text fungerar på telefonbredder. | Public/review vid 375×844, 430×844 och 375×667 med 140 % CSS-textproxy: alla val synliga, Save nåbar, ingen overflow; fånga både Hemmets rutinväljare och Knowledge-väljaren/sparad punkt. |
| Endast deklarerade sökvägar ändras; inga native-/backendpåståenden. | `CI=1 pnpm check`, riktade checklisttester, `verify-checklist-icons.py` och `verify-checklist-custom-icons.py`, kövalidering, `git diff --check`, exakt path audit. Native Dynamic Type/VoiceOver markeras NOT TESTABLE utan enhet. |

## Granskning och checkpoint

- UI Critic BRIEF v1: **CHANGES**; exact color mapping for all 20 choices, 32 pt roundel/20 pt glyph, neutral fallback, ≥3:1 symbol contrast, visible selection/focus, and visual coverage for both Home routine and Knowledge checklist flows. Incorporated in v2.
- Architect review v1: **CHANGES**; the two-tone surfaces must be explicit, neutral needs an fg/bg pair, both consumers need coverage, and task execution must wait until the overlapping ready Training task closes. Incorporated in v2.
- UI Critic BRIEF v2: **PROCEED**; confirmed the complete semantic map, 32 pt/20 pt icon sizing, contrast and selection/focus requirements, and both Home routine and Knowledge checklist flows. Final render is still required; native Dynamic Type/VoiceOver are NOT TESTABLE here.
- Architect review v2: **APPROVE** efter att träningscheckpointen stängts och neutral fallback separerats från Logg-kategorin Mat. Arkitekten bekräftade att `tokens.ts`-ändringen tillhör Logg-/rörelsetaskarna, inte den här tasken.
- UI Critic REVIEW: **PASS** på uppdaterade public/review-bilder; samma tvåtonsbehandling finns i 20 val, vald trigger, sparad Hem-rutin och Kunskapspunkt. Neutral `list-outline` har mörkgrön symbol på mjuk grön yta; vald markering syns oberoende av färg.
- Oberoende QA: **PASS**; fyra fokustester, två Python-verifierare, alla public/review-resultat, bildgranskning, path-scope, kö och `git diff --check` passerade. Native/live RLS är NOT TESTABLE.
- Frozen Reviewer: **PASS** efter synkning av planstatus, köcheckpoint, nästa steg och testbevis. Bekräftade scope utan odeklarerade filer, separata public/review-resultat, korrekt attribution av `tokens.ts` samt kvarstående native/RLS-begränsningar.
- **Känd processnotering:** ägarens direkta ikonbegäran kom medan Träning-tasken fortfarande var aktiv, och ikonutkastet fanns lokalt före den formella Architect-loggen. Ingen separat acceptans eller push gjordes då. Träning är nu stängd, v2 är godkänd och denna task verifieras i rätt sekvens på samma branch.

## Checkpoint

Plan v2 är formellt godkänd efter att `TRAINING-EXERCISE-MODAL-UX-01` stängdes. Ägarens uttryckliga ikonbegäran kom dessförinnan; ett lokalt implementationutkast fanns därför före Architect-loggen, men ingen taskacceptans eller push registrerades då. Neutral reservikon använder generiska `textPrimary`/`selectedSurface`-tokens. UI Critic REVIEW, oberoende QA och Frozen Reviewer har PASS. Public/review-verifierare rapporterar 37 ikonval och 7 Kunskapflöden vardera utan browserfel; `CI=1 pnpm check` passerade 98/98 testfiler. Frozen Reviewers första closeout blockerades enbart på grund av gamla checkpointfält; de korrigerades och omgranskningen passerade. Tasken är lokalt klar på befintlig branch. Native accessibility och live Supabase/RLS är NOT TESTABLE; commit/push behandlas som en gemensam checkpoint för de nu granskade branchändringarna.

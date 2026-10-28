# CHECKLIST-TOGGLE-AFFORDANCE-01 — faschecklistans bockutseende

**Status:** done · **Planversion:** v3 · **Risk:** M

## Mål och användarresa

I Kunskap öppnar användaren en åldersfas, markerar en föreslagen punkt och får bekräftad progress. Markeringen ska vara lätt att känna igen utan att konkurrera med punktens kategoriikon eller text. Hemmets dagliga rutinlista har ett separat kontrakt och behåller kvadratiska bockar.

Ägarens inringade iPhone-exempel och den nuvarande 8–12-veckorslistan renderades sida vid sida vid 375×844, 430×844 och 375×667. UI Critic rekommenderade en tydlig cirkelmarkering i Kunskap: 28 pt fylld grön cirkel med vit bock för klar, 28 pt öppen cirkel i sekundär textfärg för öppen. Den första `text140`-bilden var oskalad och räknas inte som text-/layoutproxy; den äldre post-rendergranskningen ersätts av en ny bedömning efter verifierad CSS-zoom. Källresultat och giltiga före-/kandidatbilder finns i `docs/design/evidence/checklist-toggle-affordance-2026-10-25/`. Kandidatbilden är en lokal DOM-overlay, inte produktkod. Arkitekt godkände ursprungligen v2 och v3 klargör endast verifieringsmetoden; implementationen följer nedanstående skrivvägar.

| Referenselement | Nuvarande skillnad | Korrigering | Visuell acceptans |
|---|---|---|---|
| Faschecklistans bock | Fyrkantig 24 pt symbol i en i övrigt lugn grupperad rad | Namngiven cirkelvariant endast för Knowledge; 28 pt delad token | 375/430 och kort viewport med markerad och öppen punkt |
| Status och kontrast | Färg följer checked-state men fyrkantens mindre form väger lätt | Fylld success-cirkel med vit bock; öppen cirkel i sekundär textfärg | Båda tillstånden kan särskiljas med form och symbol, inte enbart färg |
| Handling och hjälpmedel | Befintlig radkontroll, label, checked-state och pending bekräftelse | Behåll samma radmål och semantik; ändra bara symbolens form/storlek | RN Web-radmål minst 44×44 CSS px; fysisk native 44×44 pt är NOT TESTABLE. Inga ändrade spar-/progressutfall |

## Omfattning

- Lägg till en opt-in `completionShape`-variant på `ChecklistItem`. Standardvärdet bevarar befintliga former: grupperad rad fyrkantig och fristående rad rund.
- Aktivera rund markering endast för förvalda och egna punkter i `PuppyChecklistScreen`.
- Lägg till delad storlekstoken `iconLg: 28`; använd den bara för den rundade faschecklistmarkeringen i denna task.
- Bevara Home-rutiner, data, sparning, progress, innehåll, filter, ledande kategorifärger, radtext och navigation.
- Uppdatera komponent-/kunskapsdokumentation samt fokuserade tester och verifierare.

## Skrivvägar

- `docs/tasks/dev/CHECKLIST-TOGGLE-AFFORDANCE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `src/components/ui/ChecklistItem.tsx`
- `src/features/knowledge/PuppyChecklistScreen.tsx`
- `src/features/knowledge/README.md`
- `src/theme/tokens.ts`
- `src/theme/README.md`
- `tests/checklist-toggle-affordance.test.mjs`
- `tests/checklist-ui.test.mjs`
- `tools/visual-check/know02-app.tsx`
- `tools/visual-check/verify-know02.py`
- `tools/visual-check/verify-checklist-toggle-affordance.py`
- `docs/design/evidence/checklist-toggle-affordance-2026-10-25/`

## Acceptans

| Kriterium | Kontroll |
|---|---|
| Endast faschecklistans completion-markör blir rund och 28 pt; Home behåller kvadratisk form | Fokuserat test av variantens standardvärde och Knowledge-caller; renderad före/efter |
| Markerad och omarkerad status är tydlig utan att förlita sig bara på färg | Kritiserad render vid 375×844, 430×844, 375×667 och 375×667 med RN Web CSS-zoom/text-layoutproxy 1.4 |
| Punkttext bryts utan horisontell overflow eller överlapp | RN Web-rendering vid 375/430 px, 375×667 och 375×667 med verifierad CSS-zoomproxy 1.4; separat kontroll av scrollbarhet vid kort viewport |
| Tillgänglighet och sparflöde bevaras | Checkbox-roll, label och checked/busy-state bevaras; RN Web-träffytan mäts till minst 44×44 CSS px; befintligt progress-/readback-test passerar. Native fysisk träffyta är NOT TESTABLE här. |
| Scope och dokumentation är korrekta | Oberoende QA och Reviewer granskar fryst diff mot write_paths; `dev_flow.py validate` och `git diff --check` passerar |

## Verifiering

- `node --experimental-strip-types --test tests/checklist-toggle-affordance.test.mjs tests/checklist-ui.test.mjs`
- `TASSLA_UI_ENTRY=tools/visual-check/know02-app.tsx ... node tools/visual-check/build.cjs`
- `python -X utf8 tools/visual-check/verify-checklist-toggle-affordance.py`
- `CI=1 pnpm check`
- `python -X utf8 tools/dev_flow.py validate`
- `git diff --check`
- UI Critic post-render, oberoende QA och Reviewer.

## Planversion 3 — evidenskorrigering

Frozen Reviewer blockerade closeout eftersom den korta 375×667-renderingen märktes `text140` utan att skala layouten. V3 ändrar inte produktomfattning eller checklistbeteende. Verifieraren ska sätta `document.documentElement.style.zoom = '1.4'` för det markerade fallet, kontrollera att computed zoom faktiskt är 1.4 och spara en ny slutbild. Resultatet beskriver detta uttryckligen som en RN Web CSS-zoomproxy för text/layout, inte native Dynamic Type. Kör om fokuserad verifiering och lämna uppdaterad evidens för QA/Reviewer.

UI Critic begärde också att proxytermerna ska synas direkt i acceptanskriterierna: 140 % avser RN Web CSS-zoom/text-layoutproxy och 44×44 mäts i CSS-pixlar. Native Dynamic Type och fysisk iPhone-träffyta förblir NOT TESTABLE.

Native VoiceOver, fysisk iPhone-träffyta, Dynamic Type och TestFlight är **NOT TESTABLE** i lokal RN Web-miljö.

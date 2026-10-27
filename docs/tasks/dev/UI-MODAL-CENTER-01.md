# UI-MODAL-CENTER-01 — centrera modaler och popupytor

Status: `done`, approved plan v1.

## Uppgiftskontrakt

| Fält | Värde |
|---|---|
| Bas | `knowledge/d3-catalog-delivery@0723cd3` |
| Mål | Centrera appens modal- och popupytor i den synliga skärmytan i stället för att fästa dem vid nederkant eller skärmhörn. |
| Mandat | Eriks uttryckliga UI-instruktion 2026-10-26: alla modaler/popuper ska hamna i mitten av skärmen. Behåll befintliga handlingar, guards, innehåll och återhämtningsflöden. |
| Planversion | v1; kräver UX Critic PROCEED och UI Critic BRIEF före implementation. |
| Skrivägare | Codex-koordinatorn ensam. QA och Reviewer är skrivskyddade. |
| Risk | M — delade ytor används i logg, hälsa, onboarding/profil, kunskap, Hem, pass och träning. Ingen data/persistens ändras. |
| Beroenden | Endast befintliga RN Modal-komponenter och renderharnessen. Träningsresans datum-/tidslinjeändring väntar på denna uppgift. |

## Inventering och beslut

`src/components/ui/BottomSheet.tsx`, `TimePickerField` i `src/components/AppPrimitives.tsx` och `src/components/ui/ActionMenu.tsx` är skärmfästa i dag. De centreras med full rundning, säkra marginaler och begränsad maxbredd/-höjd. Kunskapens ikonväljare är en liten ankarbunden popover; gör den i stället till en expanderad del av formulärflödet så att inget popupkort ligger vid skärmkanten eller skymmer fält. `Dialog`, `InfoModal` och datumväljaren är redan centrerade; deras semantik och placering bevaras.

BottomSheet används av träningsdetaljer, loggkalender/redigering, hälsoredigering, rasväljaren, hundväxlaren, rutinhantering, kunskapschecklistor, passalternativ och komponentgalleriet. Därför krävs verkliga regressioner för representativa flöden och granskning av varje anropstyp. Ingen enskild feature får kringgå sina `onRequestClose`-guards.

## Beteendekontrakt

- Ytor centreras både lodrätt och vågrätt i tillgänglig skärmyta. De blir flytande, fullt rundade kort med säkra sidmarginaler, inte kant-till-kant-paneler. På brett fönster har korten maxbredd; på smal skärm behålls säkra sidmarginaler. Högt innehåll scrollas inom kortet och fast footer förblir nåbar.
- Keyboard-aware yta behåller befintlig `KeyboardAvoidingView` och kort viewport/scroll/footer provas i RN Web. Denna proxy simulerar inte ett faktiskt tangentbord eller native safe-area-insets; dessa runtime-mått är inte godkända här.
- Bottenriktad slide ersätts av en diskret centrerad fade både för BottomSheet och TimePicker. Den lilla dragindikatorn för BottomSheet betyder fortsatt att rubrikhandtaget kan svepas ned; befintlig gest, reducerad rörelse och samma guarded `onRequestClose`-väg bevaras.
- ActionMenu visas centrerad som en kompakt meny. Roll, etiketter, bakgrundsstängning, val av redigera/radera och 44 pt mål bevaras.
- Kunskapens ikonval expanderas i formulärets dokumentflöde i stället för som absolut popover. Radiogrupp, valda tillstånd, 44 pt mål och automatiskt kollaps efter val bevaras.
- Redan centrerade `Dialog`, `InfoModal` och datumväljaren får ingen layout-/semantikändring. Deras läge ingår i kontrollen för att motverka regression.
- X, backdrop, Android-back, dirty-draft/unknown-skrivskydd och fokusordning lämnar samma befintliga guards och handlers. Inga nya modala flöden, dataändringar eller dependencies.

## Ingår och skrivvägar

- `src/components/ui/BottomSheet.tsx`
- `src/components/ui/ActionMenu.tsx`
- `src/components/AppPrimitives.tsx`
- `src/components/README.md`
- `src/features/training/README.md`
- `src/features/puppy-log/README.md`
- `src/features/checklists/ChecklistIconPicker.tsx`
- `src/features/checklists/README.md`
- `src/features/knowledge/PuppyChecklistScreen.tsx`
- `tests/sheet-dismiss.test.mjs`
- `tests/checklist-ui.test.mjs`
- `tests/daily-activity-ui.test.mjs`
- `tests/ui-modal-centering.test.mjs` (ny)
- `tests/planned-health-time.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-flow-modals.py` (ny)
- `tools/visual-check/verify.py`
- `tools/visual-check/README.md`
- `docs/tasks/dev/UI-MODAL-CENTER-01.md`
- `docs/tasks/dev/TRAINING-TIMELINE-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/design/evidence/ui-modal-center-01`

Utanför scope: skärminnehåll och feature-callbacks, data/persistens, ändring av titel/copy, toast och `ActionFeedbackModal` (statusfeedback, inte modal/popover), native iOS-implementation och publicering.

## Acceptans och bevis

| Kriterium | Bevis / kontroll | Status |
|---|---|---|
| BottomSheet, TimePicker och ActionMenu är centrerade och responsiva vid 320/375/430/768 pt och kort viewport; maxbredd hålls på bred skärm. 140 %-textproxy provas för planerad-hälsa-sheeten och checklistans egna sheet, inte varje modalkomponent. | RN Web-mätning av kortets kanter vid alla fyra bredder; 320×570 och 375×667; 768 px kontrollerar maxbredd. Separata 140 %-textproxyer kontrollerar planerad hälsas fasta footer och checklistans flödesexpansion. | PASS — verifierat 2026-10-26; evidens i taskmappen. |
| Befintliga dialoger och datum/info-modaler förblir centrerade. | Samma verifierare kontrollerar Dialog, InfoModal och datumväljaren vid 320/375/430/768 px. | PASS — RN Web. |
| Scroll, footer, keyboard-aware wiring, swipe-handle, reducerad rörelse, backdrop, X, Android-back och caller guards bevaras. | Riktade UI-policytester; RN Web verifierar Logg/Lägg till händelse, planerad hälsa med nästlad påminnelsetid, datum/info, hälsohistorik, påminnelser, kort viewport-proxy, fast footer, backdrop-stängning och återkomst till föräldraform. Källan behåller KeyboardAvoidingView och safe-area-insets. | PASS — RN Web/policytester för renderat beteende. Verkligt tangentbord, native safe-area-mått och Android-back är NOT TESTABLE. |
| ActionMenu är centrerad och dess tangentbords-/fokusordning, stängning och handlingar är tydliga. | RN Web: Tab går igenom Ändra → Radera → backdrop/stängning; två actions är minst 44 pt. Dev-fixture klickar backdrop, Ändra och Radera separat, kontrollerar att rätt callback körs exakt en gång och att backdrop inte stänger vid ett menyval. | PASS — RN Web och policytest. |
| Kunskapens ikonval är inte längre en off-center overlay-popover. | Egen-checklistform verifierar in-flow expansion, 20 radioikoner, val/readback/stängning, 44 pt mål och kort vy/140 % text. | PASS — separat befintlig verifierare, taskmappens `checklist-icons/`. |
| Representativa BottomSheet-anrop för logg, hälsa, profil/ras, Hem/checklista, Kunskap, pass och träning fungerar efter delad ändring. | Riktad modalverifierare täcker Logg, Hälsa, planerad Hälsa, tidsväljare och pass-sheet; checklistans egna verifierare täcker Kunskap. Befintliga flödesverifierare och sista diffgranskning kompletterar. | PASS för renderade testflöden; resterande caller-ytor kräver delad kodgranskning. |
| Endast skrivvägarna är ändrade; datakontrakt och fulltext är orörda. | `pnpm check` (typecheck, edge typecheck, lint, 86/86 testfiler), `python -X utf8 tools/dev_flow.py validate`, `git diff --check` och path audit. | PASS lokalt; independent QA PASS; Frozen Reviewer återstår. |

Native iOS-/Android-overlay, VoiceOver/TalkBack, Dynamic Type, verkligt software keyboard, icke-noll native safe-area-mått och TestFlight är `NOT TESTABLE` om de inte faktiskt körs. Webbharnessens korta viewport och 140 %-text är endast responsivitetsproxyer.

## Checkpoint

- Implementerade godkända ytor: centered `BottomSheet`, `TimePickerField`, `ActionMenu` och Knowledge-icon-väljare i flödet. Dialog/Info/Date behöll befintlig centrering.
- Renderkontrollen hittade att fullskärmsramen kunde fånga backdroptryck; `pointerEvents="box-none"` återställde utanförstängning för BottomSheet och ActionMenu. Playwright trycker nu utanför kortet och kontrollerar stängning.
- RN Web-verifiering: 14 flödesgrupper PASS, 320/375/430/768 px; 375×667 och 140 %-textproxy; 0 sidfel. En dedikerad dev-fixture bekräftar att backdrop, Ändra och Radera var för sig kör rätt ActionMenu-callback exakt en gång. Checklistans befintliga custom-icon verifierare: 7 kontroller PASS. Skärmbilder och `browser-results.json` ligger i `docs/design/evidence/ui-modal-center-01/`.
- UX Critic 2026-10-26: **PROCEED** för plan v1. UI Critic BRIEF: centrerade fullt rundade kort med säkra marginaler, separata 44 pt menyval, kort vy/tangentbord och ikonval i flödet. Architect **APPROVE** efter interaktionsmatrisen.
- Verifiering: `pnpm check` PASS (86/86 testfiler); modalverifierare 14/14; checklistikonverifierare 7/7; queue-validate, py_compile, approved-path audit och `git diff --check` PASS.
- UI Critic gav slutligt **PASS** efter att dev-fixturen testade separata Ändra/Radera-callbacks och backdropstängning.
- Oberoende QA gav **PASS** efter synkning av status, acceptance och native/140 %-begränsningar.
- Frozen Reviewer gav **PASS** utan kvarvarande fynd; status är `done`, samma som queue.
- Nästa steg: re-review av `TRAINING-TIMELINE-01` v2:s plan och scope. Implementationen startar först när arkitektgrinden är klar.

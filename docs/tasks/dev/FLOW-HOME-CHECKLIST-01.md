# FLOW-HOME-CHECKLIST-01 — granskningsjournal

Datum: 2026-10-20
Plan: docs/plans/FLOW-HOME-CHECKLIST-01-ux-spec.md v9
Status: plan v9 godkänd; public/review QA PASS; fryst-diff UX Reviewer PASS; commit och push återstår

## Avgränsning

Detta paket levererar endast Idag-resan Hem → full Checklista → rutin eller exakt träningssteg → tillbaka. Den permanenta Checklista-länken ersätter villkorade “Visa alla”; Hantera är en separat funktion. Tom lista saknar 0/0 och progressindikator. Retur från träningssteg bevarar scrollposition och visar den uppdaterade raden/counten. Denna vecka, Alla och Kommande ligger kvar i FLOW-HOME-CHECKLIST-FILTERS-01; full panel 4 är inte stängd här.

## Granskningar av plan v6

- **Architect — APPROVE.** Kö och plan har samma scope, write paths och fokuserade testkommando. Checklista-ingång, ärligt tomläge och 7-raders returprov är explicita och testbara. Ingen ny data/security-yta tillkommer.
- **UX Critic — PROCEED.** En länk ersätter Visa alla utan duplicering av Hantera; loading/error och 0/1/5/7 täcks. Tomläget saknar falsk progress. Den nedre träningsradens återkomst bevarar scrollposition och visar aktuell count.
- **Security — PROCEED, statisk förhandsgranskning av plan v5.** `accountDeletionInvalidated.current` ska kontrolleras före träningsskrivning och efter awaits; callback efter bekräftad kontoradering får inte starta write. Mutation-lock och busy/error cleanup ägs av mutationens lifetime. Testa gammal olöst mutation mot ny scope och dess aktiva lock. UX-only ändringarna i v6 ändrar inte dessa säkerhetskrav. Live Supabase/RLS är inte verifierat.

## Obligatoriskt i implementation och QA

- Kontrollera lock/cleanup adversarialt: håll en gammal scopes completion olöst, byt scope, starta ny mutation, lös den gamla och bevisa att dess finally varken rensar eller blockerar nya scopes lock/status.
- Testa callback efter bekräftad kontoradering, hund-/kontobyte, dags-/tidszonsskifte, pending/failed/unknown samt confirmed readback.
- Prova 7 rader, öppna en nedre träningsrad och verifiera att close och bekräftad completion/undo återför till samma synliga rad med bevarad scrollposition och uppdaterad count.
- Rendera public/review states enligt planens §14-matris. Markera native, live RLS och fysiska enhetsprov NOT TESTABLE om de inte körs; syntetisk rendering är inte native-verifiering.
- Oberoende QA PASS och fryst-diff Reviewer PASS återstår innan commit/push. Full panel 4 återstår tills filterpaketet är godkänt och verifierat.

## Plan v7 amendment — 2026-10-20

Plan v7 lägger till `tests/daily-activity-ui.test.mjs` och `tests/home-vision.test.mjs` i exakta write_paths och det fokuserade testkommandot. De befintliga sviterna innehåller assertioner för den villkorade “Visa alla”-knappen och generella träningsdestinationen som ändras av den godkända upplevelsen. Ingen produktbeteende- eller datagräns ändrades.

- **Architect — APPROVE v7.** Exakta testpaths/command matchar planen och kön.
- **UX Critic v6 — PROCEED.** Inga beteendeförändringar gjordes efter Critic-godkännandet; v7 är enbart testscope.
- **Security v5 — PROCEED.** Guardrails kvarstår oförändrade i v7.

## Plan v8 and implementation review — 2026-10-20

- **UX Critic / acceptance review — FAIL (frozen evidence review).** The focused training detail inherited the checklist's current scroll offset, leaving its AppBar/back action off-screen when opened from a lower row. On account/dog/day/timezone change, `visiblePage` displayed Home while the underlying route still held `checklist`/`home-training-detail`, so refresh and main-tab swipe stayed disabled. Both findings are in v8 acceptance.
- **Architect — APPROVE v8.** Added `src/components/AppPrimitives.tsx` for opt-in checklist-only scroll save/restore; all other AppScreen users keep reset-to-top. Requires visible detail AppBar/back action at the top, restoration to the same lower checklist row, and a real Home route reset on scope change. Exact path and acceptance are synchronized in queue.
- **Security — PASS (static).** Captured callback scope is compared before lease acquisition; deletion invalidation and in-flight lease block acquisition; completion/unmark/reset fence each await; old finally cannot release a newer lease; selection and daily lifetime changes clear focus/child route. Live Supabase/RLS remains NOT TESTABLE.
- **Correction in progress.** ProductWorkspace now sets the actual page to Home when selection or daily lifetime changes. AppScreen receives distinct checklist/detail scroll keys and an opt-in `preserveScrollKey`; visual QA now asserts a visible `Tillbaka till Checklistan` action near the top before completion and preserved checklist row position after return. Full QA and final Reviewer are pending.


## Plan v9 — 2026-10-20

- **UX Critic — FAIL (frozen evidence review).** Checklistans offset låg kvar efter att flödet lämnats och kunde återkomma vid nästa öppning.
- **Architect — APPROVE v9.** Nollställ offset när `preserveScrollKey` blir `undefined`; behåll offset i Checklistan → träningsdetalj → Checklistan. Samma godkända filyta. Kräv browserbevis för lämna/öppna och scopebyte/öppna, båda vid toppen.
- **Mobile iOS Design skill från origin/main `00de202` tillämpad.** React Native/Expo och Tasslas tokens, safe area, touchmål, stor text och reducerad rörelse behålls; SwiftUI-exempel eller nya beroenden används inte.
- **Korrigering.** `AppScreen` tömmer cachad offset vid flow-exit och ignorerar sena scrollhändelser efter exit. Browser-fixture provar vanlig återöppning och hundscopebyte följt av ny öppning; befintligt 7-radsprov fortsätter att kräva bevarad källposition vid retur från träningsdetaljen.

## Slutlig QA före fryst-diff-review — 2026-10-20

- Fokuserad scroll-/route-/scope-/mutation-svit: 14/14 PASS.
- `pnpm check`: TypeScript, edge-TypeScript, ESLint och 611/611 tester PASS.
- Public `pnpm bundle:ios`: 1 450 moduler PASS.
- Public/review RN Web: 12/13 browser assertions, 0 page errors; leave/reopen och hundscope/reopen börjar på toppen; retur från träningsdetalj bevarar den nedre raden.
- `git diff --check` och `python -X utf8 tools/dev_flow.py validate`: PASS.
- Senaste `origin/main` hämtad och inmergad: skill commit `00de202` (`mobile-ios-design`) och två föregående main-commits.
- Slutlig UX/acceptance Reviewer: PASS. Inga blockerande UX-, tillgänglighets- eller acceptansfynd kvar i den lokala Idag-slicen. Full panel 4 och native/live-backendkontroller är fortsatt avgränsade. Commit/push återstår.

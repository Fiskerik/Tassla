# UI-GESTURE-MOTION-01 — svepstängning av modaler och tydligare sidövergång

**Status:** done · **Planversion:** v4 · **Risk:** M
**Bas:** `6222307bd68647c75c4fbe95fadf7e7da654feca` (`knowledge/d3-catalog-delivery`)

## Mål och mandat

Ägaren bekräftade 2026-10-28 att vänster-/högersvep mellan huvudflikar fungerar men att sidbytet blixtrar till. Ägaren bad också att appens modaler ska kunna stängas med horisontellt svep. Gör huvudflikens riktningsanimering tydligare och lägg till en konsekvent, guarded dismiss-gest på appens befintliga modaler.

Ändra inte flikordning, gränsbeteende, route-state, sheetens nuvarande nedåtsvep, formulärsparning, osparade-utkast-villkor eller modalens ägande state. Ingen ny navigationsstack, dependency, schema eller backendändring. Huvudfliksgesten är redan implementerad; detta är animations- och modal-dismiss-förbättring.

## Uppgiftskontrakt

- **Skrivägare:** koordinator ensam, samma branch och utan worktree.
- **Modell:** roller använder sessionens konfigurerade standardmodeller; inga modell- eller resonemangsöverskrivningar.
- **Granskning:** UI Critic BRIEF och Architect APPROVE före kod; UI Critic REVIEW, QA och Frozen Reviewer efteråt.
- **Läsunderlag:** `.agents/skills/tassla-consumer-ux/SKILL.md`, `docs/design-rules.md` §14–17, `docs/tasks/dev/UI-MODAL-CENTER-01.md`, `docs/tasks/dev/UI-MAIN-SWIPE-01.md` v5, `src/components/ui/MainSwipeNavigation.tsx`, `Motion.tsx`, gemensamma modalprimitiver och caller guards.
- **Beroenden:** `UI-MODAL-CENTER-01` och `UI-MAIN-SWIPE-01` — `done`. `VISION-R02-GESTURES` är relaterad, icke-blockerande kontext; dess native-runtime-kontroll är fortsatt separat och NOT TESTABLE utan enhet.

## Beteende- och rörelsebrief

1. Vänstersvep mellan huvudflikar fortsätter att gå framåt och högersvep bakåt utan wrap. Endast main-tab transitions får en särskild 280–320 ms duration och 40–48 pt slide med lätt kvarvarande opacitet; stöd-/nested routes behåller befintlig duration/distance. Lägg till `mainTabEnter` token och explicit transition-prop/caller i `ProductWorkspace`; undvik blank frame/full transparent flash. Reducerad rörelse stänger av förflyttningen och respekterar systeminställningen.
2. Appens ägda modaler stängs med tydligt horisontellt svep på en säker modalgestyta. Denna ska vara konsekvent på BottomSheet, Dialog, InfoModal, tids-/datumväljare och ActionMenu. Svepet anropar samma befintliga `onRequestClose`/caller guard som X, backdrop eller Avbryt; det får inte kringgå dirty-draft, busy, pending eller destructive-confirmation-regler.
3. Gesten får inte stjäla vertikal scroll, textinmatning, datum-/tidsval eller modalens befintliga nedåtdrag. Definiera en horisontell dominanströskel, commit-distance och snabbfling; använd samma enheter som RN PanResponder och testa gränserna.
4. Om ett modalflöde saknar stängningsfunktion på den befintliga `onRequestClose`-vägen eller har en caller guard, lämna det öppet och gör ingen ny implicit dataåtgärd.
5. `ActionFeedbackModal` är inline statusfeedback, inte en modal, och ingår inte. OS-inbyggda picker-/keyboardpaneler ligger utanför appkontroll.

Sidledssvepet startar endast från modalens separata handtagsremsa högst upp, aldrig från X-knapp, formulär, text, listor eller picker-innehåll. Varje modaltyp utan befintlig handtagsyta får en motsvarande centrerad, minst 44 pt hög svepremsa ovanför rubrik/åtgärder; visuell instruktionstext läggs inte till. `ActionMenu` får samma toppremsa över ikonåtgärderna. Backdrop/X/Avbryt finns kvar som tydliga alternativ. Rörelsen efter start är följsam nog att avsiktlig gest förstås; close går bara via befintlig caller guard.

## Jämförelsematris

| State | Nuvarande | Mål |
|---|---|---|
| Svep mellan flikar | Flik byts men ägaren ser en blixt; befintlig 28 pt/240 ms animation är knappt synlig | Riktningsmedveten slide med lätt fade; innehållet förblir synligt genom hela rörelsen utan blank frame. Normal motion synas i inspelning/tidsatta frames; reducerad rörelse byter direkt. |
| Modal stängning | X/backdrop/back eller BottomSheet-drag ned; inget gemensamt sidledssvep | Samma horisontella dismiss från säkra topphandtaget på alla appägda modaltyper, via befintlig guarded close. |
| Formulär/scroll | Innehåll och ibland osparade utkast | Sidledssvep stänger endast när intent är tydlig; vertikal scroll och guards förblir oförändrade. |

## Skrivvägar

- `src/components/ui/modal-swipe-dismiss.ts`
- `src/components/ui/BottomSheet.tsx`
- `src/components/ui/Dialog.tsx`
- `src/components/ui/ActionMenu.tsx`
- `src/components/AppPrimitives.tsx`
- `src/components/ui/Motion.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/theme/tokens.ts`
- `src/components/README.md`
- `tests/modal-swipe-dismiss.test.mjs`
- `tests/sheet-dismiss.test.mjs`
- `tests/ui-modal-centering.test.mjs`
- `tests/planned-health-time.test.mjs`
- `tests/main-swipe-navigation-policy.test.mjs`
- `tests/motion-policy.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify-flow-modals.py`
- `docs/tasks/dev/UI-GESTURE-MOTION-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/ui-gesture-motion-01`

## Acceptans och verifiering

| Kriterium | Kontroll |
|---|---|
| Main-tab swipe behåller riktning, gränser och no-wrap men övergången känns tydlig och inte som blixt | `mainTabEnter` och tab-specifik fade/slide verifieras i callsite; stöd/nested routes behåller 240ms/8pt. Mät public/review frames i början/mitt/slut vid 375/430; kontrollera normal och reducerad motion separat. |
| Alla appägda Modal-primitiver har samma horisontella dismiss med mätbara threshold/velocity | Modalpolicy verifierar BottomSheet, Dialog, ActionMenu, InfoModal, DatePicker och TimePicker. Node gesture-test täcker båda riktningar, diagonal/vertikal rörelse, short tap, slow drag, fast flick, enabled/disabled; RN Web sveper varje wrapper från dess dedikerade handtag. |
| Modal-dismissers bevarar exakt befintlig stängningsguard | Caller-flow verifierar dismiss på ren modal och att dirty form, busy save, confirmation dialog eller locked state använder samma befintliga close-resultat. Inga mutationer skapas av gesten. |
| Gesten stör inte vertikal scroll, tangentbord eller formulär | RN Web-kontroller scrollar modalinnehåll och skriver i fält; UI Critic kontrollerar touchytans upptäckbarhet. Native touch competition/keyboard på iOS/Android markeras NOT TESTABLE om riktig enhet saknas. |
| Red motionsinställning respekteras och X/backdrop/Android-back fungerar fortsatt | Policytest, public/review render och befintliga caller-guard regressioner. |
| Endast skrivvägarna ändras | Queue/plan path audit, `python -X utf8 tools/dev_flow.py validate`, `git diff --check`. |

Kör fokuserade gesture/modal/motion-tester, `CI=1 pnpm check`, `python -X utf8 tools/visual-check/verify-flow-modals.py`, public/review bundles och bevarade screenshots. Native iOS/Android gesture-arbitration, VoiceOver och fysiska träffytor är NOT TESTABLE utan enhet.

## Granskning

- UI Critic BRIEF v1: CHANGES — lås gesten till separat topphandtag, ge modaltyper utan handtag en motsvarande touchyta och exkludera X/innehåll. Inarbetat i v2.
- UI Critic BRIEF v2: PROCEED; befintliga guards och reducerad rörelse bevaras, native gesture-arbitration lämnas NOT TESTABLE utan enhet.
- Architect v2: CHANGES: full base SHA/model standards; make gesture-runtime reference nonblocking; scope longer duration to main-tab caller only. Added `ProductWorkspace` path and main-tab-specific token/props in v3.
- Architect v3: APPROVE; all 21 plan/queue write paths match, existing close guards and downward sheet drag are preserved, and longer motion is isolated to main tabs. Native gesture arbitration remains NOT TESTABLE without a device.
- v4 lägger till `tests/planned-health-time.test.mjs` eftersom dess kalenderstrukturassertion behövde följa den animerade, svepbara DatePicker-kortytan. Totalt 22 skrivvägar; färsk Architect review krävs för denna utökning.
- Architect v4: APPROVE; all 22 plan/queue paths match, the DatePicker regression path is correctly scoped, and the task remains implementing under the approved v3 behavior contract.
- UI Critic REVIEW v4: first asked for 430 pt transition evidence; public/review captures and measurements at 375/430 were added, including reverse-middle frames; final UI Critic **PASS** v4.
- Independent QA **PASS** v4: 22-path parity, gesture guards/thresholds, vertical scroll, modal close routing and transition behavior reviewed. Final evidence recheck confirms public/review 27/27, zero page errors and matching 375/430 transition captures.
- Frozen Reviewer v4: **PASS**. Confirmed all 22 paths, 98/98 CI test files, both 27/27 public/review runs, reduced motion, full §14/§14.16 notes, and no changes outside the three declared task scopes/evidence directories.

## Checkpoint

Ägarens korrigering gäller: main-tab-swipe fungerar; förbättra dess animation i stället för att skriva om navigationen. UI Critic PROCEED och Architect APPROVE v3/v4; UI Critic REVIEW, oberoende QA och Frozen Reviewer PASS v4. Public/review har 27/27 kontroller vardera med 375/430 transitionbevis. Plan/queue har 22 matchande skrivvägar. Native gesture arbitration är separat NOT TESTABLE utan enhet. Tasken är lokalt verifierad; push sammanfattas efter att övriga aktiva ändringar på samma branch har gått igenom sina egna grindar.

# MOTION-01 – Rörelsegrund och bekräftelse

Datum: 2026-10-10
Planversion: v4 – Architect APPROVE, Critic PROCEED
Status: implementation lokal; code review PASS; QA blockerad av ej tillgänglig native rendering och full check
UX-spec: [MOTION-01 UX-spec](../../plans/MOTION-01-ux-spec.md)
Scopebeslut: [beslut 0004](../../decisions/0004-motion-package.md)

## Användaruppgift och MVP-spår

Ge lugn, begriplig återkoppling när sparad feedback, framsteg eller ett avklarat checklistesteg ändras. Eriks uttryckliga MOTION-mandat 2026-10-10 är källan för scope utanför den ursprungliga MVP:n. Rörelse bär aldrig ensam betydelsen och positiv rörelse börjar bara vid bekräftat sparat tillstånd.

## Ägarens telefonrapport om tidigare taskar

Erik rapporterar 2026-10-10 att DS-CODE-01 och LOGGA-QUICK redan har verifierats på telefon och fungerar bra. Registrerat som **användarrapporterat**; build/version och skärmdumpar har inte bifogats. Tidigare tasks behåller sina befintliga statusar tills deras krav på renderad evidens och oberoende QA/review är hanterade. Erik har valt alternativ A och bett arbetet fortsätta utifrån telefonrapporten.

## Ändringsyta

- `src/theme/tokens.ts`
- `src/theme/README.md`
- `src/components/README.md`
- `src/components/ui/Toast.tsx`
- `src/components/ui/Progress.tsx`
- `src/components/ui/ChecklistItem.tsx`
- `src/components/ui/Motion.tsx` endast om den delade hooken behöver en minimal kontraktsjustering
- Berörda toast-platser där utgång annars skulle klippas: `src/features/puppy-log/LogScreen.tsx`, `src/features/training/PublishedTrainingScreen.tsx`, `src/features/health/HealthHistoryScreen.tsx`, `src/features/health/PlannedHealthScreen.tsx`, `src/features/health/WeightScreen.tsx`, `src/features/notifications/NotificationSettingsScreen.tsx`, `src/features/onboarding/EditDogProfileScreen.tsx`, `src/features/passport/PassportScreen.tsx`
- `tests/motion-policy.test.mjs`
- `docs/design-rules.md`, `docs/dev/ui-and-code-standards.md`
- `docs/plans/MOTION-01-ux-spec.md`, `docs/tasks/dev/MOTION-01.md`, `docs/tasks/dev/queue.json`, `docs/releases/MOTION-01.md`, `docs/tasks/dev/rapport.md`
- QA-evidens under `docs/design/evidence/motion-01/`

Ingen ny animationstillstånd eller `Animated.Value` läggs till i `ProductWorkspace`. `TrainingScreen.tsx` lämnas orörd. Ändra inte sparstatus, dubblettfönster, analytics eller datalager.

## Acceptans

1. Toast-platsen är dold och stabilt monterad före feedback. `visible false → true` efter mount ger entré; `true → false` ger utgång. Identiteten är stabil per plats; nyare feedback avbryter en gammal exit och en inaktuell callback får inte rensa den. Ägaren behåller text och komponent tills `onExitComplete`; auto-dismiss-tiden startar efter entrén, begär utgång och får inte avmontera toasten innan dess. Initialt synlig toast visas direkt utan animation. Dold/utgående Toast är utesluten ur skärmläsarträdet; vid visning finns bara en alert-/live-region-mekanism.
2. Progress animerar bredd endast vid värdeändring efter mount. Initialt värde visas direkt. Clamp, label och accessibility value behålls.
3. ChecklistItem skalar in bocken endast vid bekräftad `false → true` efter mount. Ett nytt `confirmed`-prop måste vara sant efter lyckad skrivning; oavmarkerad lokal förhandsvisning och uncheck uppdateras direkt. `TrainingScreen.tsx` förblir orörd.
4. Rörelserna använder endast React Native `Animated`, avbryts vid ny ändring, blockerar inte input och respekterar `useReducedMotion`.
5. Alla durations är centraliserade i `tokens.motion`, 120–350 ms. Transform/opacity använder native driver; endast den 4 px progressbredden använder JS-driver.
6. Nya och ändrade tillstånd har text/ikon/skärmläsarbetydelse utan animation. Ingen ny dependency, analytics-händelse, idle-loop eller hårdkodad skärmstil.
7. `TrainingScreen.tsx` är oförändrad; inga animationstillstånd hamnar i `ProductWorkspace`.
8. UX-spec, README och designregler beskriver implementationen. QA skiljer kodresultat från telefonrapport och rörelseevidens.

## Kontroller

- `node --experimental-strip-types --test tests/motion-policy.test.mjs` och berörda befintliga tester
- `pnpm check`
- `git diff --check`
- Verifiera Toast hidden mount → show → hide → exit-complete/unmount; bevisa att ägarens auto-dismiss inte klipper exit, initialt synlig toast är direkt, nyare feedback avbryter exit och gammal callback inte kan rensa den. Kontrollera VoiceOver/TalkBack-träd i hidden, visible och exiting samt en enda annonsering.
- Verifiera checklistans obekräftade lokala ändring ger ingen framgångsrörelse och bekräftat `false → true` efter lyckad skrivning gör det; reducerad rörelse on/off samt saved/failed/unsure.
- Kort skärminspelning för tidsförlopp om tillgänglig; annars NOT TESTABLE. Visuell layout granskas på liten/stor bredd och stor text med renderad evidens.
- Hidden Toast tar ingen layoutplats när den inte visas; verifiera att stabil mount inte lämnar ett tomt mellanrum.
- Oberoende QA och Reviewer enligt workflow.

## Beroenden och grindar

Inga nya dependencies. MOTION-01 kan börja efter Architect APPROVE och Critic-granskning av denna exakta plan. Erik har rapporterat telefonprov för tidigare delade UI-uppgifter; rapporten är inte oberoende PASS. Ingen ny skrivande uppgift får dela de angivna filerna samtidigt.

## Granskning och beslut

- Architect, 2026-10-10: **APPROVE v3** och länkad UX-spec. Krävde hidden/exiting Toast utanför tillgänglighetsträdet och en enda alert-mekanism; kraven finns i v3. Noterade QA-kontroll att dold Toast inte lämnar layoutgap.
- Critic, 2026-10-10: **PROCEED v3**; inga kvarvarande invändningar. De tidigare kraven på Toast-livscykel och bekräftad ChecklistItem-rörelse finns i v3.
- v4 lägger layoutgap-kontrollen i verifieringslistan. Architect, 2026-10-10: **APPROVE v4** och länkad UX-spec; inga aktiva skrivägare kolliderar, men överlappande kötaskar ska hållas inaktiva. Critic, 2026-10-10: **PROCEED v4**, inga kvarvarande invändningar.

## Nästa steg

Implementationen följer endast MOTION-01. DS-CODE-01, LOGGA-QUICK och LOGGA-EDIT hölls inaktiva under kodändringen. Eriks tidigare telefonrapport för DS-CODE-01 och LOGGA-QUICK förblir användarrapporterad, utan ändring av deras öppna screenshot-/QA-status.

### Implementationscheckpoint — 2026-10-10

Ändrade komponenter: `src/components/ui/Toast.tsx`, `Progress.tsx`, `ChecklistItem.tsx`; motionvärden i `src/theme/tokens.ts`. Toast-ägarplatser uppdaterades i Logga, publicerad träning, hälsohistorik, planerad hälsa, vikt, notisinställningar, hundprofil och Tassla-pass. Ingen ny animationstillstånd lades i `TrainingScreen.tsx` eller `ProductWorkspace.tsx`.

Verifierat efter rättningar: policytest `node --experimental-strip-types --test tests/motion-policy.test.mjs` PASS (sex policykontroller i en testfil); `git diff --check` PASS; `python tools/dev_flow.py validate` PASS. `pnpm typecheck` kunde inte starta då pnpm försökte hämta paket och registry nekade anrop med EPERM; full `pnpm check` är därför inte PASS. Städning: tog bort tidigare timeoutlogik för toastar och träningsbekräftelser där den ersatts av enter → auto-dismiss-begäran → exit; tog bort oanvända imports/feedbackstate. Ingen ny dependency.

### Oberoende QA och kodreview — 2026-10-10

QA blockerade först på två regressioner. Båda rättades inom MOTION-01: misslyckad loggredigering har nu en stabil fel-/osäker-toastplats i BottomSheet, och planerad hälsa använder åter `AccessibilityInfo.getRecommendedTimeoutMillis` med `feedbackTimeoutMillis` fallback innan toasten visas. Vikt-toasternas exit callbacks skyddas mot att en äldre post rensar nyare feedback. Toast-effektens callback/phase-läsning stabiliserades via refs och `useCallback`.

Förnyad oberoende QA: statiska acceptanskriterier utan nya fynd; policytest, `git diff --check` och kövalidering PASS. QA totalt är **BLOCK/NOT TESTABLE** eftersom native rendering saknas för timing, layoutgap, VoiceOver/TalkBack, stor text och reducerad rörelse. Full `pnpm check` är inte verifierad efter EPERM.

Förnyad oberoende Reviewer: **Code review PASS**, inga kvarvarande kodfynd. Native/visuell QA bedöms separat som **NOT TESTABLE**. Eriks telefonrapport gäller DS-CODE-01 och LOGGA-QUICK, inte MOTION-01.

Implementationen är inte visuellt godkänd och paketet är inte DONE. Nästa steg: native/telefonverifiering av MOTION-01 och körbar full `pnpm check`; därefter återuppta QA. MOTION-02 är inte startat. Se [release-loggen](../../releases/MOTION-01.md).

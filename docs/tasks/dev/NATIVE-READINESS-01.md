# NATIVE-READINESS-01 — varm start och vaken träningsläsning

Status done · plan v1 · risk M · bas `8227cc748e583359cbb8af44ea091438fae7f9cb` · root ensam writer. Beroende IMAGE-DELIVERY-01 färdig/committad. Erik har uttryckligen beställt Expo57 splash-screen och keep-awake, utan SDKuppgradering eller nytt persondataändamål.

## Resultat
- Konfigurera expo-splash-screen~57.0.9 med #F7F1E7 och befintlig Tasslamarkör. Kalla preventAutoHideAsync på modulnivå. Första root-layouten döljer en gång, watchdog efter högst2s från JS-modulstart ger felsäker utgång; synkront/asynkront SDKfel fångas. Ingen auth-/nätverksväntan, ingen obligatorisk animation. En watchdog kan inte styra tiden innan JS körs eller när JS-tråden är blockerad. Behåll navigationens befintliga reduced-motionbeteende.
- expo-keep-awake~57.0.2 håller endast skärmen vaken när faktisk träningsinstruktion visas och AppState är active. Normal modal kräver selectedProgram+selectedStep och ej väntande readback; fokuserad vanlig detalj kräver befintliga program+steg; historisk read-only kräver ready/detail. Programöversikt, fel/laddning, stängd vy, bakgrund/inactive ska inte hålla lås. Varje effektlivstid får unikt tag, avaktiverar vid cleanup och igen när sen aktivering blir klar efter cleanup; äldre livstid får ej släcka ny. SDK-fel ignoreras säkert, ingen ny persistence, nätverk eller permissiondialog.

## Verifiering
Verifiera faktiskt installerade SDK-APIer/manifest/plugin och effektiv Expo config. Meningsfulla controller-/livstidsprov: snabb layout, missad layout/watchdog, dubbelsignal, synk/async fel, vy öppen/stängd, background/foreground, delayedactivation efter unmount, snabb reopen, tillgänglig vs saknad historisk instruktion och refresh-placeholder. Bevara auth/referral/spar-/gesturekontrakt. `pnpm check`, public iOS JS-export, scope/diff/köaudit, Architect/Critic/Security, UI Critic bedömer native config/static färg som NOT TESTABLE på enhet samt oberoende QA/Reviewer. Native splash och faktisk skärmsläckning behöver ny binary/fysisk enhet och rapporteras NT. Ingen signerad distribution.

## Skrivvägar
- package.json
- pnpm-lock.yaml
- app.json
- app/_layout.tsx
- src/startup/startup-splash.ts
- src/startup/README.md
- src/features/training/PublishedTrainingScreen.tsx
- src/features/training/exercise-keep-awake.ts
- src/features/training/README.md
- tests/native-readiness.test.mjs
- docs/tasks/dev/NATIVE-READINESS-01.md
- docs/tasks/dev/MVP-COMPLETION-261031.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md
- docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md

Läst AGENTS/workflow/design§0–4/14–15, consumerUX/iOSskill, faktisk RootLayout/AppFlow/PublishedTrainingScreen och Expo57 bundledranges. Architect rekommenderar en samlad liten native slice: unika tags och cleanup efter sen aktivering; inget beroende av livebackend. Säkerhet granskar faktiska plugins/native manifest före slut. Root writer, QA/Reviewer oberoende.

## Implementation och kända verifieringsgränser
Installerade faktiska versioner expo-splash-screen57.0.10 (~57.0.10, inom Expo57:s ~57.0.9 range) och expo-keep-awake57.0.2. ArchitectAPPROVE, CriticPROCEED, Security initialPASS; UIbrief visar befintlig ikon1024 opak #F7F3EA mot önskad #F7F1E7 och eventuell subtil kant på enhet. Ingen ny bild tillförd. Faktiska installerade typer stöder anropen. Splashmodule på rootmodulnivå, rootlayout/watchdog, sen preventcompletion döljer igen; vakenhetens faktiska visningspredikat och AppState-villkor med unika taggar och dubbelcleanup vid sent svar. Tester omfattar tidig/dubbel/sen/fel/watchdog samt steg/historik/väntan och activation-close-reopen. Testutfall, säkerhet slutreview, QA och Reviewer återstår.

Security finalPASS: faktiska SDKer/nativekällor/plugins, tomma Androidmanifest, inga nya permissions, nätverks-/persondata-/lagringsflöden. Expo splash Android har egen standardfade400ms, så modulstart ställer setOptions duration0/fadefalse för att undvika påtvingad rörelse även innan tillgänglighetspreferensen är känd. iOS fadefalse. Native faktiskt resultat NT. UIcritic static REVIEW: korrekt varm färg/contain200, subtil ikonbakgrundskant kan förekomma, enhetsutseende NT. Första fullcheck fann lintregel mot synkron setState i effect; AppState använder nu useSyncExternalStore och prenumeration med aktuell snapshot. Riktade och fulla kontroller körs om.

## Checkpoint före slutreview
`pnpm check` PASS (895 tester,894 pass,1 skip; typer/lint), riktat native-readiness PASS, public iOS JS-export final2 PASS. Actual RNWeb tränings-/haptikregression 24 scenarier PASS, web håller inte skärmen vaken; fysisk start/skärmsläckning kan inte verifieras med web/export. Effektiv Expo-config visar färg, PNG, contain och200. Scope13paths, diffcheck PASS. Security PASS utan nya permissions; UIcritic static REVIEW ingen ny avvikelse, möjlig subtil ikonsöm och nativeutseende NT. Bounded cleanup: en liten testbar splashcontroller och en liten traininglivstid; useSyncExternalStore undviker race i AppState-prenumeration och lintfynd, inga extra globala inställningar eller ändrade sparflöden. Oberoende QA pågår, därefter frozen Reviewer/commit.

Oberoende QA Luna medium PASS: egen fullcheck895tester/894pass/1skip och riktad test, installerade API/native/config, faktiska instruktionsgrenar, AppState och taglifetime samt alla paths granskade. Fysisk splash/vakenhet och eventuell svag ikonbakgrundskant NT. Root slutlig iOS-export och webregression24 PASS. Frozen Reviewer nästa.

Frozen Reviewer PASS utan fynd: alla13paths i scope, faktiskaSDK/config, splashrelease, instruktionspredikat/AppState, unika taggar och sen cleanup. Nativebild/vakenhet/ikonkant fortsatt NT. Durable commit nu, därefter Developmentinnehåll och återstående ursprungliga steg.

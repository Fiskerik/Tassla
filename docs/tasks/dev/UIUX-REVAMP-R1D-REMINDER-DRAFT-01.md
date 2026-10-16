# UIUX-REVAMP-R1D-REMINDER-DRAFT-01 — skydda Påminnelsernas utkast

Version: 3\
Status: klar lokal checkpoint; ocommittad enligt samlad batchbegäran\
Risk: H — notifieringsflöde enligt `docs/dev/workflow.md`; Security-granskning krävs även när implementationen enbart skyddar befintliga preferensval och inte ändrar permission, lagring eller schemaläggning.

## Mandat och underlag

Nästa F02-checkpoint efter R1c i [UI/UX-masterplanen](../../plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md). MVP v2, `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md` och `.agents/skills/tassla-consumer-ux/SKILL.md` gäller. Underlaget för lokal notifieringsfunktion är befintliga `MVP-P07/local-reminders`-kontrakt och `src/notifications/notification-service.ts`. Ingen ny permission, notifieringstyp, lagring, RPC, dependency, dataändamål eller push-token ingår.

## Ägaruppgift

Ändra lokala påminnelseval utan att ett oavsiktligt back-/flikbyte tappar osparade val eller en misslyckad sparning får dem att försvinna.

## Plan v3

1. Lägg till en liten ren helper för dirty-state över `enabled`, `trainingEnabled` och HH:mm-fältet jämfört med sparad `NotificationPreferences`. Jämför tid mot befintlig kanonisk `formatTime`; ogiltig men ändrad tid är dirty, och återställning till sparat HH:mm gör formuläret clean. Enhetstillstånd/permission och parent-ägda saved/error/busy är inte lokala fält.
2. Låt `NotificationSettingsScreen` registrera en stabil owner-token-guard via befintliga `registerEditorLeaveGuard`-mönstret. Headerns **Tillbaka till Mer** och ägarens val av annan huvudflik använder samma guard. Påminnelser är en stödsida utan giltig huvudfliksdestination för swipe; bevara befintligt `MainSwipeNavigation`-villkor. Clean lämnar direkt; dirty visar **Osparade ändringar** / **Vill du lämna utan att spara?** med **Stanna kvar** och **Lämna utan att spara**. Stay har inga sidoeffekter; endast första route-callbacken får commit medan dialogen är öppen. Same-tab är no-op.
3. Lägg till lokal Android `BackHandler` i den här skärmen och rensa den vid unmount. När ingen underordnad native modal är öppen använder system-back samma leave-guard för återresa till Mer. När InfoModal eller `TimePickerField`-modal är öppen ska dess befintliga `onRequestClose` hantera Android-back först och sidans discard-dialog får inte öppnas. Ändra ingen workspace-global system-back-semantik; native ordningen redovisas NOT TESTABLE i RN Web.
4. Skilj formulärets befintliga `busy`-prop (som även omfattar `!notificationPreferencesReady` och UI-laddning) från en faktisk preference-write. `busy` får fortsätta styra loading/disabled-formfält och Save-knapp men får inte i sig blockera leave-guard. Sätt ett lokalt synkront save-flight-lås före första `await`; detta hindrar dubbel-submit och gör alla exitförsök till no-op tills det faktiska `onSave`-löftet har avgjorts. Initial preference-readiness och separat permission request sätter inte låset och låser inte navigation. Vid misslyckad write släpps låset, draft-värden och befintligt felmeddelande behålls; retry kräver uttryckligt **Spara val**, och lämning kräver uttryckligt discard. Bekräftad save fortsätter använda befintlig parent-update/key-remount och toast.
5. Key:a editorinstansen på owner id, `accountGeneration`, dog id och kanonisk sparad snapshot. När parentens befintliga scope eller snapshot faktiskt ändras, ska den nya nyckeln skapa en ren lokal draft-instans och den gamla dirty-draften får inte överleva. Detta läser inte om SecureStore, uppdaterar inte parentens sparade snapshot eller readiness och ändrar inte `notificationPreferencesReady`/service-generation eller annan account lifecycle; ingen ny persistens tillförs.
6. Behåll träningsvalets nuvarande regel att ett uttryckligt påslag även aktiverar huvudvalet, valfri HH:mm-funktion, device-permission-knapp och `TimePickerField`-modal. Permission-check/request är separat från preference-draft och introducerar ingen save. Ändra inte notification service/storage, callback/payload, cleanup, schedule, permission, settings-copy utanför guardcopy eller dataflöde.
7. Lägg till fokuserade pure-helper-/skärmtester och en public/review RN Web-fixture för clean/dirty/revert, header/back/tab/first destination, readiness-vs-save-flight, synkront dubbelspar-/save→back- och save→tab-lås, failed save/draft-retention, saved remount, time/checkbox och scope-reset. Verifiera att en öppen underordnad Modal har sin befintliga close-callback före sidans leave-guard; native BackHandler/Modal-ordning markeras separat NOT TESTABLE. Spara bilder, browser JSON och §14-bedömning.

## Godkända skrivvägar

- `src/features/notifications/NotificationSettingsScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/notifications/reminder-preferences-draft.ts` (ny pure helper)
- `tests/reminder-preferences-draft.test.mjs` (nya helper-/guardtester)
- `tests/notification-settings-screen.test.mjs` (fokuserad skärm-/wiringregression)
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `tools/visual-check/README.md`
- `docs/tasks/dev/UIUX-REVAMP-R1D-REMINDER-DRAFT-01.md`
- `docs/plans/UIUX-REVAMP-R1D-REMINDER-DRAFT-01-ux-spec.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/reminders/R1D-REMINDER-DRAFT-01/`

Rör inte `src/notifications/notification-service.ts`, `src/notifications/notification-storage.ts`, schema/migration/policy, expo config, notification payloads, permissions eller planreminder-data. Om befintliga callbacks inte kan bevaras behöver planen omgranskas före kod.

## Acceptans

- Dirty helper täcker varje saved preference och ogiltig tid; återställning till saved snapshot blir clean.
- Header-back, ägarens val av annan huvudflik och Android system-back skyddar dirty draft. Swipe saknar destination på stödsidan och lämnas oförändrad. Stay har noll route/save side-effects; explicit leave commit:ar exakt första callbacken. Same More är no-op.
- Formens `busy`/readiness-state får inte blockera navigation i sig. Endast en faktisk preference-write blockerar exit; ett synkront flight-lås sätts före första `await`, förhindrar dubbla write-callbacks och blockerar save→omedelbar back/tab till dess write Promise avgjorts. Initial readiness och separat permission request skapar inget save-flight-lås.
- Misslyckad storage write släpper flight-låset, behåller lokala värden och visar befintligt fel; explicit retry och confirmed save bevarar nuvarande parent/service-kontrakt.
- Android back när InfoModal eller TimePickerField-modal är öppen anropar först modalens befintliga close-väg; sidans leave-guard gäller bara när underordnad modal inte är öppen. Detta native-ordningsbevis är NOT TESTABLE i RN Web.
- När befintlig scope-/snapshot-key ändras överlever lokal dirty state inte till ny editorinstans. Ingen parent snapshot reload/readiness-effekt påstås eller ändras. Guardcleanup får bara rensa sin egen owner-token.
- Permission state och meddelanden förblir separata; existerande träningsval, lokal tid, secured preference storage och reminder scheduling är oförändrade.
- Public/review verifierar riktiga komponenten på 375×844, 430×844, 375×667 och 140 % webtextproxy, reduced motion, copy och route. §14 skiljer visuell likhet från funktionsresa. Direkt editorreferens eller native/live bevis påstås inte.

## Kontroller

- `node --experimental-strip-types --test tests/reminder-preferences-draft.test.mjs tests/notification-settings-screen.test.mjs tests/main-navigation.test.mjs tests/local-notification-config.test.mjs`
- Public/review build och fokuserad `notification-draft` verify
- `pnpm check`
- `python -m py_compile tools/visual-check/verify.py`
- `python tools/dev_flow.py validate`
- `git diff --check`
- Architect APPROVE v3, Critic PROCEED v3, Security PASS v3, oberoende QA och Reviewer före `done`.

## Bevisgräns

RN Web-fixture använder syntetiska callbacks och verifierar inte SecureStore, faktisk notistillåtelse, Expo-notifieringsschema, native Alert/system-back, VoiceOver/Dynamic Type, keyboard/safe area på fysisk enhet eller installerad app. QA ska hålla dessa NOT TESTABLE tills riktig integration/enhet har provats.

## Granskningsprotokoll

- Architect APPROVE v3, Critic PROCEED v3 och Security PASS v3. Implementera synkront save-flight-lås först efter lokal formulärvalidering och före `onSave`; släpp det vid resolve/reject. Headerns disabled-villkor följer save-flight, inte sammanslagen readiness-busy. Logga inte editor-key eller draftvärden. Native callbackordning är fortsatt NOT TESTABLE.
- Implementering: `NotificationSettingsScreen` skyddar lokalt dirty state, Android system-back och synkront save-flight; workspace key omfattar befintlig owner/account/dog/saved snapshot. Checkboxen exponerar också explicit `aria-checked` för sin synliga valda status.
- Implementer-verifiering: fokuserade tester 18/18, `pnpm typecheck` PASS, public/review `notification-draft` 10/10 vardera, verifierarens Python-syntax och `git diff --check` PASS. Evidens och §14 finns i `docs/design/evidence/vision-rev02/reminders/R1D-REMINDER-DRAFT-01/`. Köstatus är `qa`; oberoende QA och Reviewer återstår. Native/live-gränser redovisas som NOT TESTABLE.
- Oberoende QA PASS utan kodändringar: fokuserade tester 18/18, `pnpm check` (app/edge typecheck, ESLint, 531/531 tester), Python-syntax, kövalidering och diffkontroll PASS; inga konkreta beteendefel. QA granskade sparad public/review-evidens men kunde inte själv starta browser harness i sin isolerade miljö. Implementerns färska public/review-körningar är 10/10 vardera utan browserfel.
- Oberoende Reviewer PASS utan konkreta fynd efter granskning av root-verifierad working-tree-snapshot, implementation, helper, tester och evidens. Reviewerns runner saknade `.git` och kunde inte själv verifiera Git metadata; snapshotten användes för kodgranskningen. Native/live-gränser är NOT TESTABLE. Köpost stängd; ingen commit eller push ännu.

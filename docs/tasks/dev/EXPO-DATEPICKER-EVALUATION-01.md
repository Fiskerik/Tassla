# EXPO-DATEPICKER-EVALUATION-01 — teknisk utvärdering

Bas `8b017fa` · planned · låg risk · root ensam writer. Ägarens Expo-tillägg beställde att utvärdera, inte blind ersättning. Läs faktisk SDK57-installation `@expo/ui` 57.0.21, community date-time-wrapperns iOS/Android/webbkod, lokal `AppPrimitives.tsx` och Expo57 `bundledNativeModules.json`. Architect har gjort oberoende källgenomgång; Critic granskar slutsatsen.

Dokumentera uppmätta API-/beteendeskillnader, bevarade kontrakt, rekommendation och testkrav; inga ändringar i kod, paket eller godkända beslut. Skrivvägar: `docs/tasks/dev/EXPO-DATEPICKER-EVALUATION-01.md`, `docs/decisions/MASTER-LOG.md`, `docs/plans/UI-UX-NEXT-PACKAGES-2026-10-18.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md`. Acceptans: ingen påstådd native-verifikation, transparens om transitive kontra direkt dependency, webb och tidszon; slutlig reviewer och full check före commit.

## Källgenomgång 2026-11-05

Installerad Expo 57.0.26 anger `@expo/ui ~57.0.21` i `bundledNativeModules.json`; 57.0.21 finns som transitiv dependency i lockfilen men är inte en direkt appdependency. `community/datetime-picker/DateTimePicker.web.tsx` returnerar `null`. iOS-källan använder inline SwiftUI och skickar `onDateChange` direkt; Android-källan använder som standard dialog och `value.toISOString()`, med olika confirm/dismiss-hantering. Det är alltså inte en bevisad drop-in för Tasslas `YYYY-MM-DD`/`HH:mm`-fält.

Tasslas nuvarande fält stöder manuell inmatning. Datumfältet och manuell tid i fältet uppdaterar värdet direkt. Tiden kan vara tom; tidsmodalen har redigeringsutkast med uttrycklig bekräfta/avbryt. Appens modaler har svep och reducerad rörelse. Innan ett byte behöver en separat wrapper testas för lokal kalenderdag och klockslag över UTC-positiva/negativa zoner och DST, tom tid, min/max, manuell inmatning, bekräfta/avbryt, centrerad modal/svep, 24-timmarsformat, tangentbord samt VoiceOver/Dynamic Type och Android/TalkBack. Webben behöver egen fungerande fallback. iOS-community-wrapperns etikettsemantik är inte verifierad.

Rekommendation: behåll befintliga väljare tills en separat native-testbar vertikal integration med dessa kontrakt finns; lägg inte till beroendet bara för denna utvärdering. Detta är en teknisk rekommendation inom tidigare beslut, inte ett nytt ägarbeslut eller påstående om hur native beter sig. Inga enhetsprov är utförda här.

Architect och Critic PROCEED: risker avser källgranskning och testbehov, inte ett uppmätt native-fel.

QA och Reviewer PASS scoped för källgenomgång; full `pnpm check` 921 PASS/1 SKIP. Inga native-, VoiceOver- eller tidzonsprov har körts.

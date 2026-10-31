# PREMIUM-FEEDBACK-01 — haptik och samma tryckrespons

Status done · plan v5 · risk M (godkänt native-Expo-paket, lokal UI-feedback) · bas `f0065da20451d9ef88e4fd46f5c75b8b47d6b046` · root ensam writer.

Mandat: Eriks uttryckliga instruktion 2026-10-31 godkänner `expo-haptics` och relevanta premiumförbättringar utan nya rörelsebibliotek. Bevara spar-/auth-/datum-/gestkontrakt. Ingen ny insamling, lagring, nätverkstjänst, generell haptik på alla tryck eller ny appinställning. Övergripande fyra resor i MVP-COMPLETION-261031 kvarstår.

## Avgränsad första leverans

- Installera exakt Expo57-kompatibel `expo-haptics` via befintlig Expo CLI, dokumentera faktisk version/SDK-API och plattformsbegränsningar. Nativeeffekten best effort, web gör inget och ett fel blockerar aldrig sparande. Inga nya permissionsdialoger.
- En liten gemensam adapter och användarintent-policy ger en enda lätt selection tick när en användarinitierad false→true-bock blivit bekräftad. Ingen haptik vid initial laddning/hydrering, failed/unknown/pending, avbockning, dubbel-submit eller efter unmount. Reducerad rörelse stänger även denna frivilliga återkoppling. Integrera befintlig ChecklistItem och daglig rutinrad; återförsök får ge tick först när den väntade bocken faktiskt bekräftas. Ingen optimistic status införs.
- Vanliga användarkontroller i LogScreen, LogDateCalendar, MoreScreen och PublishedTrainingScreen använder befintlig MotionPressable med samma props, etiketter, disabled/longpress och befintliga färgstates. Lämna scrims/dragytor oförändrade. Byt LogScreens lokala reduce-motion-prenumeration till befintlig useReducedMotion, utan ny global preferensarkitektur.
- Håll intensiteten i befintliga tokens; starkare småikonsskala skjuts till faktisk telefonbedömning. Ingen ändring av stilkomposition eller automatiskt skutt vid initial rendering. Progressring, glidande flikindikator, dragspel och träningssteg planeras som nästa små rörelsedelar ihop med resorna.

## Acceptans

Faktiska Expo57-installation/API och public iOS-export passerar. Riktade tester provar intent/hydrering/pending/failed/retry/dubbel/unmount/web/reduced/SDK-fel. RNWeb provar samma handlingar/disabled/fokus på375/430/kort667 och reducerad rörelse med snapshots av normal/tryckt/laddande. Ingen layoutregression eller scrimändring. `pnpm check`, diff/scope/köaudit, Security för nytt SDK, UI Critic BRIEF/REVIEW, oberoende QA/Reviewer. Fysisk haptisk känsla/native VoiceOver och Android/iOS leverans NT, inte blockerande telefon-grind.

## Skrivvägar
- package.json
- pnpm-lock.yaml
- src/feedback/confirmation-haptics.ts
- src/feedback/confirmation-intent.ts
- src/feedback/use-confirmed-check-feedback.ts
- src/feedback/README.md
- src/components/ui/ChecklistItem.tsx
- src/components/ui/DailyActivityItem.tsx
- src/features/puppy-log/LogScreen.tsx
- src/features/puppy-log/LogDateCalendar.tsx
- src/features/more/MoreScreen.tsx
- src/features/training/PublishedTrainingScreen.tsx
- src/features/home/HomeScreen.tsx
- src/features/home/DailyChecklistScreen.tsx
- src/features/home/DailyProgressScreen.tsx
- src/features/knowledge/PuppyChecklistScreen.tsx
- tests/confirmation-feedback.test.mjs
- tests/motion-policy.test.mjs
- tests/training-overview.test.mjs
- tools/visual-check/app.tsx
- tools/visual-check/build.cjs
- tools/visual-check/native.jsx
- tools/visual-check/verify-premium-feedback.py
- docs/design/evidence/premium-feedback-01
- docs/tasks/dev/PREMIUM-FEEDBACK-01.md
- docs/tasks/dev/MVP-COMPLETION-261031.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/releases/HISTORY-2026.md
- docs/decisions/MASTER-LOG.md

Läst: AGENTS, workflow/taskmall, designregler§0–4/14–15, consumerUX/iOSskills och ui-and-code-standards, faktiska Motion/ChecklistItem/DailyActivityItem och berörda kontroller. Architect/critic och Security granskar plan; UI Critic brief på befintliga bilder. Root writer. Konfigurerade specialist5.6sol saknas,6.1-sol medium används; UIcritic6.1-sol high, QA/ReviewerLuna medium. Inga djurråd ändras, DogExpert behövs inte i denna del.

## Plan v2 — bekräftelse och livstid före implementation
Architect v1 REVISE hittade att inga callers sätter ChecklistItem.confirmed och att dagraden saknar sådan signal. V2 lägger till de fyra produktcallers ovan. Faschecklistans checked/progress ändras först efter befintlig saved/readback och får confirmed endast när state ready och varken busy eller uncertain. Dagliga rutiners completed läses från bekräftade DailyRoutineDay.completed_item_ids i snapshot, aldrig optimistic; explicit confirmed kräver ready och ingen busy/error/unknown-feedback. Den historiska lokala review-dagslistan får ingen ny bekräftelsesignal och ingen haptik.
Feedbackintent nycklas på cacheScope+dog+template/version+item för faslista, respektive dog+date+routineDay.id+item för dagrad. AppFlow remountar på ägare/kontogeneration; dogworkspace remountar på aktiv hund. Hook/policy återställer intent på ny nyckel och cleanup/unmount. Endast onPress armerar den avsedda false→true-ändringen; hydrering/externa uppdateringar är tysta. Failed/unknown/pending förbrukar inte en bekräftelse; samma avsedda bock får tick högst en gång när faktisk readback senare är bekräftad. Avbockning rensar intent. Reducerad rörelse förbrukar bekräftat intent tyst, så det aldrig spelas senare; aktuell preferens och scope kontrolleras igen precis före SDK-anrop. Både synkront SDK-kast och rejected Promise fångas. MotionPressable-byten kontrolleras för befintliga transform-styles; sådana bevaras eller undantas.
Critic v1 PROCEED och Security v1 planPASS (explicit dependency godkänd). Förnyad Architect/criticreview krävs för dessa preciseringar och nya callerpaths. Expo57.0.26 bundledNativeModules anger expo-haptics~57.0.3; faktiskt installerad patch/version och nativefiler verifieras efter installation.

Plan v3: lägg till befintliga tools/visual-check/app.tsx för en isolerad faktisk DailyActivityItem/ChecklistItem-probe med explicit pending/failed/unknown/retry/scope/initial-state. Det ger verifierbara hook-/komponentlivstider utöver rena policytester. Ingen ny produktfunktion eller annan write-path ändras. Expo CLI installerade57.0.3 med exakt förväntad~57.0.3-range, lockdiff12rader; första körningens telemetriförsök till otillgänglighomedir rättades med EXPO_NO_TELEMETRY/EXPO_OFFLINE, utan att ändra HOME. UI Critic BRIEF PROCEED; befintlig helvys segmentfärg/täthet är inte godkänd genom denna avgränsade del.

Plan v4: första fullcheck fann en statisk training-overview-assertion som kräver just taggen Pressable. Lägg till tests/training-overview.test.mjs för att behålla dess krav på samma raderings-/bekräftelseväg men verifiera den faktiska MotionPressable. Endast testpath utökas; inga produkt-/riskändringar. Två hookcleanup-lintvarningar förenklas med lokala refreferenser. Riktade adapter/intent/installeratAPI-tester PASS, fullcheck är ännu inte accepterad.

## Plan v5 — konkret upptäckt Next-glapp
Det nya browserprovet passerade haptik/livstid/tryck, men Next-flödet avslöjade ett befintligt race: om nya progressionprops redan committats när saved-promise återvänder sätts ingen awaitingProgressionRefresh, så selection stannar på gamla nu historiska steget. V5 rättar båda saved/retryhandlers genom att alltid armera samma befintliga fingerprintväntan för start/next/back efter saved. Befintlig effect öppnar rätt active_step_id först när fingerprint är nytt; snabb readback kan då konsumeras direkt, fördröjd readback väntar ärligt. Inga extra operationer, nya datum/versioner eller steg hoppas över. Failed/unknown ändrar inte selection. Browserprovet utökas med snabb/fördröjd Next+Back, failed och samma-operation-unknown-retry. Alla paths är redan deklarerade; produktavgränsningen får förnyad Architect/criticbedömning före korrigeringen. Ingen ny steg-animation införs i denna rättning.

V5-provet visade även att failed Next/Back på ett redan bekräftat steg inte hade synlig feltext inne i modalen. Befintligt progressionMessage visas nu gemensamt vid icke-feedback-handlingar, med oförändrad unknown/retrygren och utan dubblering i målprompten. Detta uppfyller v5:s redan granskade failed-acceptans. Fixtureprovet korrigerades till den faktiska granskade tredje övningstiteln Låt hunden välja om ni fortsätter; inga råd ändrades.

## Checkpoint före oberoende QA

Installerat expo-haptics57.0.3, explicit bekräftelsesignal från verkliga saved/readback-callers, engångsintent med identitets-/unmount-/reducedskydd och gemensam tryckrespons i deklarerade kontroller. Fast/fördröjd Next/Back och synligt failed-meddelande rättade enligt v5. Bounded cleanup: liten policy/adapter/hook, befintliga tokens, inga transformkollisioner eller scrimändringar.

Faktisk pnpm check PASS (888 test,887 pass,1 skip; typer/lint PASS), riktat confirmation-feedback PASS, final public iOS JavaScript-export PASS. Browserprovet verify-premium-feedback.py PASS med 25 resultat, inga page_errors; after/results.json. Faktiska Expo native/deklarationsfiler verifierade. Plattform/haptikanrop byts endast i diagnostisk RNWebfixture; fysisk haptik/VoiceOver/nativeleverans NT.

Architect APPROVE v5, Critic PROCEED v5, Security finalPASS v4 (v5 endast befintlig savednavigation/felvisning), UI Critic REVIEW och supplemental top-review inga nya blockerare inom feedbackdelen. Top-composites visar bevarad komposition. Fullpanelens tidigare ljusa aktiva segment och täthet är öppna, inte godkända.

§14 avgränsat: huvudhandling/etiketter/navigation/geometri/44pt/disabled/confirmedfel/reducerad rörelse genom källa+RNWeb PASS; färg/form/typografi oförändrade inom slice. Stor native text/hjälpmedel/telefon NT. Ingen ny text-/bildkomposition, reklam, partner eller persondata. §14.16 helpanel: komposition Nej (godkänd snabbvalsavvikelse), färg Nej (befintliga segment), typografi Ja, former Ja, täthet Nej, bildspråk Ja. Oberoende QA och Reviewer återstår före commit.

## Oberoende QA
Luna medium, readonly: egen pnpm check PASS (887pass/1skip), egen browser24/24 utan page_errors på separat5432server/samma bundle, faktisk SDK/nativekod kontrollerad, diffcheckPASS. Öppnat båda top-composites798×952, small/reduced375 och pending/confirmed375×844. Avgränsat beteende och visuell regression PASS; gamla helpanelavvikelser står öppna som FAIL. Inga konkreta blockerare i denna slice. Native haptisk känsla/hjälpmedel/leverans NT. Utdata /tmp/tassla-premium-qa/results.json; repoets motsvarande koordinatorbevis är beständigt. Fryst för Reviewer; inga produktändringar planeras.

Frozen Reviewer Luna medium: PASS utan fynd, alla ändrade/spårade nya paths inom v5, faktisk SDK/livstid/callers/Nextretry och öppnade efterbilder verifierade. Inga nya produktändringar efter fryst review. Avgränsad slice lokalt klar; hållbar commit nu. Nästa: sex fotografiers bytebudget, därefter godkända start-/bild-/träningspaket och fyra ursprungliga huvudresor.

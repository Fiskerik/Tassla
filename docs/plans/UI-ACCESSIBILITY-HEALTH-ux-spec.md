# 2b.2 UX-specifikation — Hälsa och vikt

Datum: 2026-10-19 · Beteenderam: `docs/tasks/dev/UI-ACCESSIBILITY-PHASE-2-5.md` v4 · Kö-ID: `UI-ACCESSIBILITY-HEALTH`

## Användaruppgift och resa

Ägaren öppnar `Mer → Hälsa`, bläddrar mellan Översikt/Vaccinationer/Veterinär/Vikt, lägger till eller rättar en vikt/händelse, kan avbryta eller radera via befintlig bekräftelse och ser därefter samma historik med bekräftat eller tydligt osäkert sparstatus. Planerade händelser öppnas via befintlig väg och förblir skilda från genomförd historik. Kontrollera vid 375×667 och 140% webtext samt smal 320pt-vy.

## Referens → nuvarande tryckpunkt → ändring → acceptans

| Referens/område | Nuvarande tryckpunkt | Avgränsad ändring | Acceptans |
|---|---|---|---|
| rev02 panel 4: Hälsa som egen stödskärm med vikt, planerat och genomfört innehåll | Viktredigering har `Spara rättning` och `Avbryt` i en oflexibel horisontell rad. | I `WeightScreen` läggs befintlig flexrad om till vertikal stapling vid bredd `<360` eller `fontScale >=1.25`; i övrigt kan den brytas utan att krympa målytor. | Knapptexter går att läsa och trycka på vid 375×667/140% och 320pt. Radera vikt ligger fortsatt separat och destructive. |
| Genomförd historik i Hälsa | Informationsrubrik och `Läs information` saknar responsiv radbrytning vid stor text. Formuläret visas i en BottomSheet som inte begär Androids befintliga keyboard-aware-läge. | `HealthHistoryScreen` staplar informationsraden vid samma brytpunkt. `HealthScreen` använder befintligt `BottomSheet keyboardAware`-läge för formulärsheeten, så innehållet kan scrollas när tangentbordet tar plats. | Infohandlingens fullständiga a11y-namn kvarstår. Fokusfält och spara/avbryt kan nås genom scroll/keyboard avoidance. Close guard, form state och callbacks är oförändrade. |
| Planerad hälsohistorik | Informationsrad och typval har redan `flexWrap`; spara och avbryt visas var för sig. | Ingen semantik- eller dataändring. Rendera skapa/redigera, konflikt/fel och stor text; gör enbart lokal layoutjustering om accepterade viewportbevis visar faktisk klippning och den ligger i köad write-scope. | Datum, tid, påminnelseval och anteckning fortsätter följa nuvarande fält, ordning och hundscope. Vid avvikelse som kräver ny interaktionsmodell stoppas och planreview uppdateras. |
| Delat datumfält i Hälsa/Vikt | En syntetisk capture vid 320×667/140%-proxy visade att kalenderknappens 44pt-yta sköt utanför fältkanten när TextInput behöll sin min-content-bredd. | Architect och Security godkände 2026-10-19 `minWidth: 0` enbart på datumfältets flexande TextInput i `AppPrimitives.tsx`. Knapp, synligt värde, tryckflöde och TimePickerField är oförändrade. | RN Web bounding boxes vid 320×667 och 375×667/140%-proxy visar kalenderknappens 44×52pt-yta helt inom datumraden, utan överlapp eller datumklippning. |

## Tillstånd och hjälpmedel

- Vikt: initial tom lista, add, validation, save pending, confirmed save, definite error, pending/unknown retry, edit, cancel, delete confirmation, load/error/retry.
- Genomförd händelse: typval, datum/tid/anteckning, add/edit/cancel/delete, confirmed save/error/unknown retry/conflict, load/error/retry.
- Planerad händelse: add/edit/cancel/delete, reminder/date/time inputs, conflict, pending/unknown, load/error and retry; retain the explicit distinction `planerad ≠ genomförd`.
- Alla ikoner kompletterar den befintliga synliga texten. Behåll nuvarande `accessibilityLabel`, role, state, disabled/busy, 44pt targets, validering och bekräftelse. Layout, fokus och keyboard opening får aldrig spara, radera eller byta scope.

## Skyddat scope

Architect review av UX-specen: **APPROVE** efter att `docs/decisions/MASTER-LOG.md` lades till i `write_paths`. Fasplan v4 har UX Critic-godkännande. Security pre-implementation review: **APPROVE** för ursprungligt scope. När 320×667-renderingen visade kalenderknappens utskjutande yta godkände både Architect och Security den avgränsade datumfält-amendmenten före kodändring. Security final review av den frysta ändringsdiffen: **APPROVE**. Oberoende QA och Reviewer: **PASS** för avgränsad lokal/static omfattning. Övriga ursprungliga säkerhetsgränser kvarstår: ingen ändring av data, migration, RPC, query, hund-/kontoscope, medicinskt råd, samtycke, notifieringsbeteende, dependency eller persistent state. Shared `BottomSheet`-implementation, sheet state/key, close guard, child form state och save/delete callbacks förblir orörda.

## Verifieringsbevis

Riktade tester: `node --experimental-strip-types --test tests/health-weight.test.mjs tests/health-history.test.mjs tests/planned-health.test.mjs tests/planned-health-feedback.test.mjs`. Kör dessutom `pnpm check`, offentlig `pnpm bundle:ios`, `git diff --check` och `PYTHONUTF8=1 python tools/dev_flow.py validate`. Spara bilder från syntetisk RN Web-fixture med viewport, textskala, fixture/tillstånd och branch/commit. För den godkända date-field-amendmenten mäts kalenderknappens bounding box inom fältet vid 320×667 och 375×667/140%-proxy. Syntetiskt keyboardbeteende ersätter inte native iOS/Android. VoiceOver/TalkBack, största Dynamic Type, verklig OS-keyboard, Supabase/RLS och signerad build markeras NOT TESTABLE utan faktisk verifiering. §14 punkt 16 bedöms separat och full rev02-panelmatchning påstås inte enbart från fungerande klickflöde.


## Utfall för implementation och lokal verifiering — 2026-10-19

WeightScreen staplar spara/avbryt vid bredd <360 eller fontScale >=1.25; viktens radera-åtgärd ligger fortsatt separat. HealthHistoryScreen staplar informationsraden vid samma brytpunkt. Den befintliga historik-sheeten använder keyboardAware. Datumfältets TextInput kan nu krympa så kalenderknappen stannar inom ramen; tidsfältet har inte ändrats.

Fokuserad svit: 117/117 PASS. CI=1 pnpm check: 552/552 PASS, inklusive app-/edge-typecheck och lint. TASSLA_BUILD_CHANNEL=public EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=false pnpm bundle:ios: PASS, 1 446 iOS-JS-moduler. RN Web-fixtur vid 375×667 och 320×667 med syntetisk 1,4 fontScale-proxy: kalenderknappen ryms inom datumraden (44×52 pt) i båda vyerna; spara/avbryt är separerade med 56 pt höjd; historikens informationsknapp hamnar under rubriken. Inga browser page errors.

Skärmbilder och §14-bedömning: `docs/design/evidence/ui-accessibility-health-2026-10-19/VERIFICATION.md`. Proxyvärdet är inte iOS Dynamic Type/Android font scaling. Safe Area är nollad i fixture och tangentbord, VoiceOver/TalkBack, live Supabase/RLS och signerad/native build är NOT TESTABLE. Ingen full rev02-panelvisuell acceptans hävdas. Slutlig Security-review **APPROVE**, oberoende QA **PASS** och Reviewer **PASS**. Native/enhets- och backendbegränsningar kvarstår enligt evidensrapporten.

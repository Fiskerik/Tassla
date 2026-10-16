# R1d Påminnelseutkast — UX-spec v3

**Task:** `UIUX-REVAMP-R1D-REMINDER-DRAFT-01`\
**Status:** implemented; independent QA and Reviewer PASS.\
**Mål:** ägaren kan ändra lokala påminnelseval utan att ett oavsiktligt sidbyte tappar osparade val eller att en oklar busy-status låser navigation.

## Resa

1. Ägaren öppnar **Mer → Påminnelser**. Sparade val visas; permission för enheten visas som separat status.
2. Ägaren ändrar huvudval, träningsval eller tid. **Spara val** är den enda skrivhandlingen. Att återställa alla fält till sparad snapshot gör vyn clean.
3. Dirty header-back eller ägarens val av annan huvudflik visar **Osparade ändringar** / **Vill du lämna utan att spara?**. **Stanna kvar** behåller valen; **Lämna utan att spara** går till första begärda route. Samma aktiva Mer-flik är no-op. Swipe saknar destination från stödsidan och förblir oförändrat.
4. Android system-back använder sidans leave-guard när ingen underordnad native modal är öppen. En öppen InfoModal eller TimePickerField-modal stängs via sin befintliga `onRequestClose` före sidans discard-prompt. Native ordning är NOT TESTABLE i RN Web.
5. `busy` kan betyda att sparade preferenser fortfarande laddas; det tillståndet får inte hindra vanlig navigation. Ett synkront save-flight-lås sätts före första `await`, förhindrar dubbla write-försök och blockerar back/tab medan den faktiska preference-writen pågår. Vid fel släpps låset, fälten behålls och befintligt fel visas. Bekräftad sparning uppdaterar parentens befintliga snapshot och befintliga bekräftelsecopy.
6. Permission-knappen är separat från preference-save. Permission request sätter inte save-flight-lås; befintlig owner-context-kontroll gäller när resultatet återkommer.

## Tillstånd

| Tillstånd | Navigering | Fält och återkoppling |
|---|---|---|
| Clean | Tillåten utan dialog. | Sparad snapshot; permission separat. |
| Dirty | Back eller explicit annan huvudflik visar guard. | Sparaknappen erbjuder den enda write-handlingen; ingen autosave. |
| Preferences loading | Leave-guard blockeras inte av loading i `busy`. | Befintliga loading-/disabled-kontroller visas. |
| Save flight | Alla sidans utträden är no-op tills `onSave`-Promise avgjorts; dubbel submit no-op. | Synkront lås sätts innan första await; valen ligger kvar. |
| Failed save | Guard tillåter discard-prompt igen. | Lokala värden och befintligt fel behålls; retry kräver uttryckligt nytt Spara val. |
| Confirmed save | Befintlig parent-update och snapshot-key remount sker. | Befintlig toast; ny lokal editor är clean. |
| Permission busy/result | Inte en save flight; ingen extra navigationsspärr. | Befintlig permission-knapp/copy och context fence består. |
| Child modal open | Android back stänger child-modal enligt befintlig modal callback först. | TimePicker-modalens eget obekräftade tidsval är inte ett formulärvärde förrän Bekräfta tid. |

## Beteendekontrakt

Dirty jämför `enabled`, `trainingEnabled` och HH:mm-värdet mot exakt sparad snapshot. Felaktig HH:mm är dirty; revert till sparat HH:mm blir clean. Enhetens tillstånd är inte fältutkast. Owner-token guard skyddar cleanup; stale cleanup får inte avregistrera nästa editor. Scope-/snapshotnyckeln använder owner, account generation, dog och sparad preference snapshot. När denna befintliga nyckel ändras överlever inte lokal dirty state; det läser inte om parentens snapshot eller readiness.

Leave-guard läser inte sammanslagen `busy`-prop som save-sanning. Endast den lokala synkrona write-flight-ref blockerar exit. Den låses före await och släpps vid både success och failure. In-flight navigation begäran kör ingen route callback. Om native child Modal är öppen hanteras Android back av modalens befintliga `onRequestClose`, inte av sidan.

Inga ändringar görs i notification-service/storage, schema, permission, plan, schedule, cleanup, payload eller push. `TimePickerField` behåller sin inre avbryt/bekräfta-semantik.

## Visuell bedömning

Återanvänd befintlig reminders-accent, SupportScreenHeader, choice-kort, TimePickerField, MessageCard och Toast. Enda nya copy är guardprompten som redan används i R1b/R1c. Kontrollera komponentlayout och formulär-/felstatusar i public/review-fixture; direkt jämförelse markeras NOT TESTABLE om ingen motsvarande redigeringsvy finns i rev02.

## §14-evidens

Spara public/reviewbilder av clean, dirty, revert, Stay, discard, preferences loading, save flight, failed-retained draft och permission busy vid 375×844, 430×844 och 375×667 samt 140 % webtextproxy/reduced motion. Verifiera att stay ger noll writes, dubbel-submit ger högst en callback, save→back/tab ger noll route-callbacks under Promise-flight och loading/permission busy inte sätter write-lock. SecureStore, native BackHandler/Modal-ordning, permission prompt, system keyboard, VoiceOver/Dynamic Type och faktisk notisleverans hålls separat NOT TESTABLE tills de körs på avsedd nivå.

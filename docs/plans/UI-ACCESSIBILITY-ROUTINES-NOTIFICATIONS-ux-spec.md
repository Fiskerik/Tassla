# 2b.1 UX-specifikation — rutiner och notiser

Datum: 2026-10-19 · Godkänd beteenderam: `docs/tasks/dev/UI-ACCESSIBILITY-PHASE-2-5.md` v4 · Kö-ID: `UI-ACCESSIBILITY-ROUTINES-NOTIFICATIONS`

## Mål och resa

Göra rutinhanteringen på Hem och inställningarna för lokala notiser läsbara och nåbara på 375×667 samt vid 140 % text. Rutinhallens väg är `Hantera dagens aktiviteter → rutin → Redigera/Skapa → Spara eller Avbryt → rutinhall`. Notisvägen är `Mer → Påminnelser → ändra val → Spara val`, eller separat `Tillåt påminnelser på telefonen`, därefter tillbaka till Mer.

## Referens → nuvarande skillnad → komponent/token → acceptans

| Referenselement | Nuvarande skillnad | Komponent/token | Acceptans |
|---|---|---|---|
| Hemmets sammanhållna rutinlista och rutinhantering i `docs/plans/HOME-REV02-visual-ux-spec.md` | Rutinsammanfattning och val-/raderingsåtgärder delar en oflexibel horisontell rad; långa texter kan pressas ihop. | Befintlig `DailyActivityManagerSheet`/`ActionButton`; `tokens.size.touchMin` (44 pt), spacing- och typografitokens. | Långa sidoåtgärder bryts eller staplas vid smalt utrymme/större text; text förblir läsbar och träffytan minst 44 pt. Rutinens pennknapp behåller namn för hjälpmedel. |
| Stödvyn `Påminnelser` under Mer; ingen separat rev02-skärmdump specificerar dess kortdetaljer | Informationsraden placerar hjälptext och informationsåtgärd sida vid sida utan en uttrycklig responsiv brytpunkt. Kortets övriga huvudåtgärder ligger redan vertikalt. | Befintliga `Button`, `InfoModal`, `MessageCard`, `TimePickerField`; `tokens.size.touchMin` och typografitokens. | Informationsrad får radbrytas/staplas; spara och systembehörighetsåtgärd får egen tydlig fullbredd/44 pt-yta. Inga behörighets- eller sparanrop från layout/fokus. |

## Tillstånd och återkoppling

- Rutiner: läslista; skapa/redigera med validering; ren/smutsig draft; uttrycklig bekräftelse när en smutsig draft avbryts; pending; bekräftat sparad efter befintlig readback; failed/unknown med befintlig retry/readback och bevarat utkast; delete-bekräftelse; val att lägga till/ta bort från dagens lista.
- Notiser: lagringsval laddas/okänt/fel; sparar; bekräftad lokal sparning; sparfel/okänt utan falsk framgång; behörighet unknown/granted/denied samt pending/error; informationsmodal; tillbaka. Systemprompten kan bara öppnas genom användarens uttryckliga knapptryck.
- Tillgänglighet: behåll synliga ord för behörighetens konsekvens, sparande och radering; hjälpmedelsroller/namn/status och disabled-state består. Kontrollera 375×667 och 140 % webtext. Native keyboard, VoiceOver och största Dynamic Type markeras separat NOT TESTABLE om en fysisk enhet inte körs.

## Skyddade beteenden och scope

Oberoende Security pre-review **APPROVE** före implementation och slutlig Security re-review **APPROVE** av fryst diff. Granskaren kräver uttryckliga knapptryck för permission/save, owner-keyed SecureStore-preferenser, samma rutinens draft/submission-ID och callbackpayloads, befintlig dirty-cancel/validation/busy/readback/retry samt oförändrad hund-/kontoscope. Ingen ny permission call, skrivning, query, RPC, storage, fält, datamodell, dependency eller navigation. Oberoende QA **PASS** och Reviewer **PASS** på slutlig layoutdiff; syntetiska flöden/bilder och gränser redovisas i `docs/design/evidence/ui-accessibility-routines-notifications-2026-10-19/VERIFICATION.md`.

Ändringsytor är bara de två skärmarna, deras feature-README:n, fokuserade befintliga tester, denna specifikation, evidens, kö och befintliga rapport-/releaseposter. `ProductWorkspace`, notification service/storage, rutinens data-/RPC-lager, schemas/RLS och andra skärmar är skyddade. Förhandsgranskning och QA använder syntetiska data.

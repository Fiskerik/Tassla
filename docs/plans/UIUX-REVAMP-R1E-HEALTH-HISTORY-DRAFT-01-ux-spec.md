# R1e Hälsans historik — UX-spec v4

**Task:** `UIUX-REVAMP-R1E-HEALTH-HISTORY-DRAFT-01`\
**Status:** v4 implementation klar; oberoende QA och Reviewer PASS; lokal checkpoint klar.\
**Mål:** skydda osparade formulärvärden och den öppnade postens version, återhämta även senare bekräftade writes och visa korrekt feedback efter sheet-unmount.

## Resa

1. Från Hälsa öppnar ägaren en genomförd rad eller **Lägg till händelse** → **Något som har hänt**.
2. Ägaren ändrar typ/datum/tid/anteckning och väljer spara eller radera. Rättnings-save/delete använder sparad opening-baseline; om posten har ändrats under redigering blockeras overwrite och nuvarande version visas för explicit återhämtning.
3. Dirty close, backdrop, modal-back, **Avbryt rättning** eller annan huvudflik frågar **Osparade ändringar** / **Vill du lämna utan att spara?**. Stay bevarar allt; discard kastar bara efter uttryckligt val, till första destinationen. Aktiv huvudflik är no-op. Dirty delete-confirmation säger att den sparade händelsen tas bort och den osparade rättningen försvinner; Cancel behåller fälten.
4. Synkront save/delete-flight blockerar dubletter och utträden. Misslyckat/reject behåller formulärvärden. Unknown/pending behåller befintlig recovery; success väntar tills exakt match bekräftas direkt eller genom readback. Stale scope eller guard owner kan inte skriva, toast:a, stänga eller navigera.
5. Confirmed create/update/delete ger ett enda scope-bundet confirmation-event. Hälsa-sheeten stängs och kvarvarande vy visar korrekt toast och lokala historiken. Om omläsning misslyckas står befintlig varning kvar; toasten säger endast att mutationen bekräftats.

## Dirty, baseline och scope

Dirty jämför alla fyra lokala fält med editorns startvärden. Nya formulär använder aktuell typ/dag och tom tid/anteckning. Felaktigt ändrad input är dirty; revert är clean. Rättnings- och deleteförsök bär med sig den valda postens opening-baseline till befintlig CAS, inte senaste refreshade värde. Nyare vald post ger conflict, medan orelaterad list-refresh bevarar utkastet. Owner-/accountGeneration-/dog-scope ändrar parent HealthScreen key och tar bort sheet/id/toast/guard. Inga ids eller formulärvärden loggas.

**Avbryt rättning** går via samma close-guard: clean stänger, dirty kräver uttrycklig discard och efter discard återgår ägaren till Hälsa med oförändrad sparad post. Dirty delete använder tydlig bekräftelse; avbryt lämnar formuläret exakt orört.

## Tillstånd

| Tillstånd | Navigation/sheet | Feedback |
|---|---|---|
| Clean | Stäng direkt. | Ingen discard dialog. |
| Dirty | Stay eller explicit discard; första destination gäller. | Draft står kvar tills beslut. |
| Save/delete-flight | Exit och dubletter ignoreras synkront. | Befintlig busy-status. Reject släpper låset utan att tömma fält. |
| Failed | Ingen automatisk stängning. | Fel och draft kvar; retry kräver uttrycklig handling. |
| Unknown/pending | Ingen success; recovery kvarstår. | Endast senare exact readback-bekräftelse stänger/toastar en gång. |
| Changed vald post | CAS mot öppningsversionen avvisar overwrite. | Konflikt visar aktuell historik; **Använd aktuell historik och börja om** avslutar explicit utkastet. |
| Confirmed + reload error | Sheeten stängs när mutation är bekräftad. | Toast bekräftar endast mutation; läsvarning ligger kvar i Hälsa. |

## Visuell och teknisk bevisgräns

Återanvänd befintlig BottomSheet, Toast, tokens, knappar och fält. Testa public/review faktiska komponenter vid tre viewportar, 140 % webtextproxy och reduced motion. Rev02 saknar separat historik-editor: direkt pixelmatchning är NOT TESTABLE. Public/review callback-fixture bevisar inte live RLS/Supabase eller native Alert/back/Modal, keyboard/safe area, VoiceOver/Dynamic Type eller installerad app.



## V3-amendment efter QA/Reviewer

Öppnad rad identifieras vid readback med hund + id även om en annan tillåten klient ändrar dess historiktyp under redigering. Typen från öppningstillfället och den lokala draften ligger kvar. En ny aktuell version med vaccination/veterinärbesök visas som konflikt efter statuskontroll; ägaren måste uttryckligen välja **Använd aktuell historik och börja om**. Om id:t finns med en icke-stödd typ får resultatet inte tolkas som att händelsen har raderats.

RN Web public/review ska även visa write-flight, fel/retry, unknown före bekräftelse, engångsfeedback efter readback, reload-varning och 140 % webtextproxy. Det ersätter inte native- eller live backendprov. Architect APPROVE, Critic PROCEED och Security PASS för v3 är dokumenterade i taskens granskningsprotokoll.

## V4 visuell korrigering under granskning

Vid 140 % webtextproxy klipps kalender- och tidsknapparna inne i sina rader trots att sidans `scrollWidth` ryms. Avgränsad korrigering är `minWidth: 0` på den delade `datePickerInput`-stilen i `src/components/AppPrimitives.tsx`; den ändrar inte API, validering eller formulärvärden och gäller både datum- och tidsfält. RN Web kontrollerar varje knapp mot sin rad och avvisar intern overflow i public/review. Architect **APPROVE** och Critic **PROCEED** för exakt v4 är dokumenterade i taskens granskningsprotokoll. Native Dynamic Type och fysisk enhet ligger fortsatt utanför RN Web-påståendet.

V4 public/review-fixtures passerar 11/11 scenarier vardera utan browser page errors. Visuella screenshots och `browser-results.json` finns under taskens evidence-katalog. Fokuserade health-history/navigation-tester passerar 67/67 (59/59 för de tre history-specifika testfilerna) och `pnpm check` passerar 545/545 tillsammans med app-/edge-typecheck och ESLint. Oberoende QA och Reviewer återstår. Live backend/RLS och native/device-funktioner ovan är fortsatt NOT TESTABLE.

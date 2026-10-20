# UI-ACTIONS-COMMON — ikoner i gemensamma kontroller

Plan v2 — 2026-10-18. Godkänt överordnat mandat i UI-SHEET-ACTIONS-01 och ägarens ”implementera enligt planen”. Denna slice tar nästa markerade paket 1a.

## Mål och beteende
I bekräftad lyckad logg-toast ersätts synlig ”Ångra”-text med `return-up-back-outline`; toastens meddelandetext annonseras som alert på ett message-only Text-element, syskon till separat fokuserbar ikonknapp som har namn ”Ångra: {meddelande}”. Endast befintlig bekräftad add-undo visas; retry, unknown, Avbryt och destruktiva beslut behåller synlig text och exakt callback/state.
I DatePickerField ersätts ”Kalender” med `calendar-outline`. I TimePickerField ersätts ”Välj tid” med `time-outline`. Fältetiketter/värden ligger kvar och öppningsknapparna får svenska, fältbundna accessibilityLabel och 44 pt-träffyta. Kalenderdagarnas träffytor höjs till minst 44 pt och dialogens tillgängliga bredd verifieras vid 375 pt. Kalenderradens månad syns fortsatt; förra/nästa är ikonknappar med tillgängliga månadsnamn och samma månadsbyten. Manuellt datum/tid, valbara rader, bekräftelse/avbryt, validering och draft-state bevaras.

## Berörda filer
Kod: `src/components/ui/Toast.tsx`, `src/components/AppPrimitives.tsx`, ren datumhjälpare `src/components/calendar-month.ts`. Tester: `tests/toast-compact-policy.test.mjs`, `tests/planned-health-time.test.mjs`, `tests/calendar-month.test.mjs`. Inventeringsgeneratorns uppdaterade utdata ingår också: `docs/design/UI-ACTION-INVENTORY-2026-10-18.md` och `.csv`. Ingen Button API ändring krävs: installerad delad `Button` har redan icon-variant, `iconName`, disabled-state och 44×44 touchMin. Resterande kö-/spec-/evidensfiler anges i köposten. Skyddat: all annan appkod, BottomSheet-package, event-/health-data, persistence, copy i fel/okänt, navigation och den tidigare CONTENT-PUBLISH-LABEL-01-arbetsdiffen.

## UX-/tillståndsmatris
| Referens / kontroll | Nuläge | Ändring | Acceptans |
|---|---|---|---|
| Bekräftad Logga-toast | Meddelande + textknapp Ångra | Vänd bakåtpil i befintlig 44pt icon Button | Bara persisted success/add med onUndo; toastmeddelande syns, undo callback exakt en gång, a11y nämner objekt, knapp disabled när toasten inte är exponerad |
| Datumfält | Värde + ordknapp Kalender | Ikon på samma knappbredd/minst 44pt; etikett/värde kvar | Tillgängligt namn säger välj datum/etikett; disabled fungerar; kalender öppnar i vald månads värde; triggern är minst 44 pt bred och 52 pt hög |
| Datumväljare | Textknappar Föregående/Nästa kring synlig månad | Chevronback/forward icon-only Button | A11y-namn säger månad + riktning; ändrar exakt en månad inklusive årsskifte via testad ren hjälpare; vid 375 pt ger dialogen minst 308 pt kalendergrid för dagrutor om minst 44×44 pt |
| Tidsfält | Värde + Välj tid | time-outline i samma hit area | Label och accessibilityLabel identifierar fältet; öppna, välj/skriv, bekräfta och Avbryt oförändrat |

Ingen ikon är ensam för kritisk handling utan full skärmläsaretikett. Varje träffyta är minst 44 pt; ingen synlig label ersätts på Spara, retry, conflict, destructive, consent, account, tabs eller navigation. Reducerad rörelse påverkas inte.

## Verifiering och begränsningar
Planreview v1 CHANGES/PROCEED WITH CHANGES åtgärdades i v2: deklarerade inventoryutdata, körbart årsskiftestest, message-only alert med separat undo-knapp och kalendergrid på minst 308 pt. Architect APPROVE och Critic PROCEED för exakt plan v2 finns nedan. Genomförda kontroller: riktade tester 12/12, `CI=1 pnpm check` 521/521, public `pnpm bundle:ios`, inventory-generator, `git diff --check` och `PYTHONUTF8=1 python tools/dev_flow.py validate`. Oberoende QA PASS och Reviewer PASS. UI-renderer/enhet saknas; native layout, visuellt jämförbar rendering, större Dynamic Type och VoiceOver är NOT TESTABLE. UI-fixture/render vid 375×844/430×844/375×667/140% om installerad runtime stödjer detta; native layout, större Dynamic Type och VoiceOver NOT TESTABLE utan enhet. Detta är en lokal kodcheckpoint; ingen commit/push/deploy i detta delbesked.


## Planreview

- Architect — **APPROVE v2**: inventoryutdata är deklarerad, årsskifteslogik har körbart helper-test, alertmeddelandet har separat knappfokus, kalendern specificerar 44×44 pt och tillräcklig bredd.
- UX Critic — **PROCEED v2** efter krav på message-only alert och 343 pt calendar grid vid 375 pt; båda införda i spec/acceptans.
- Föregående v1-reviewfynd och deras lösning dokumenteras i agentresultaten i task-tråden; denna v2 är exakt godkänd plan.

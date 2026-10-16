# UIUX-REVAMP-R1B-LOG-DRAFT-01 — skydda Loggeditorns utkast

Version: 5\
Status: done; Architect APPROVE v5; Critic PROCEED v5; independent QA PASS; independent Reviewer PASS\
Risk: M — ändrad redigerings- och navigationsresa; data- och mutationskontrakt lämnas oförändrade.

## Mandat och underlag

Detta är första avgränsade checkpointen för F02 i `docs/plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md`. Eriks MVP v2-mandat 2026-10-06/16 gäller. UX-beteende följer `.agents/skills/tassla-consumer-ux/SKILL.md`; visuellt mål och §14-granskning följer `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md` och `vision_rev02.jpg`. `FLOW-LOG-01` fortsätter vara den större Logg-resan och får inte markeras klar av denna del.

## Användaruppgift

Ändra en befintlig logghändelse utan att en oavsiktlig stängning eller växling av huvudflik tyst kastar bort ändringen. En ägare som uttryckligen väljer Avbryt får lämna editorn. Sparningens tre utfall måste hållas åtskilda: pending väntar, failed är bekräftat misslyckande och unsure är okänt utfall.

## Implementer-plan v2 (planeringsuppgift, ingen kod)

`LogScreen` registrerar en editor-guard i `ProductWorkspace` med stabilt owner-token och owner-matchad cleanup. Båda huvudfliksingångarna skickas genom `requestMainTabNavigation` i `main-navigation.ts`. Om destinationen redan är aktiv är begäran en no-op före guard och alla kontext-/sidändringar. Vid annan destination anropas guard innan commit; knowledge/training-context och `setPage` körs först efter godkänd lämning. Med en dirty Alert öppen ignoreras alla senare navbegäranden tills ägaren väljer; första begärda destinationen är enda som kan committas. Stay och locked gör noll parent-side-effects.

Samma `requestEditorClose` skyddar BottomSheet `onRequestClose` (stängknapp, backdrop och Modal/system-back) och parentens nav. `Avbryt ändring` är explicit kassering, disabled när mutation inte är löst. Pending/saving visar en enda statusyta: **Ändringen sparas. Vänta tills resultatet har bekräftats innan du lämnar.** Failed visar en enda fel-Toast med **Ändringen sparades inte. Försök igen eller fortsätt redigera.**, Retry och den tydligt märkta knappen **Fortsätt redigera**. Den handlingen rensar endast bekräftat failed mutation intent och behåller editor, alla fält och dirty-status; en senare route lämning går genom vanlig discard-bekräftelse. Unsure visar en enda uncertainty-Toast med **Vi kunde inte kontrollera om ändringen sparades. Kontrollera status innan du lämnar.** och Retry/readback; ingen cancel/discard visas medan resultatet är okänt. Toasts behåller sin enda status-/handlingsyta; ingen samtidig extra MessageCard visas för failed/unsure. Den delade Toast-komponenten får ett opt-in `cancelLabel`-prop; standardvärdet förblir `Avbryt` för alla befintliga konsumenter, och bara failed Loggeditorn skickar `Fortsätt redigera`. Den valda etiketten gäller även Toastens retained/exiting-innehåll.

Dirty jämför kanoniska formulärvärden mot källhändelsen: typ; lokalt datum och minut från `localDateTimeParts(occurredAt)`; anteckning där `null` och tom sträng är samma visade värde; samt olyckstyper i kanonisk ordning. Olyckstyper normaliseras till `null` för andra eventtyper. För ursprunglig äldre olycka med `accidentKinds: null` räknas samma tomma urval som clean, så återställning av fälten blir clean. Giltighet avgör inte dirty; faktisk fältavvikelse gör det även när Spara är disabled.

Behavior tests: pure dirty-resolver täcker normaliserat datum/minut, note null/empty, type, canonical accidentKinds, legacy null och revert; nav-helper testas med ordnad eventlogg för same-tab no-op, Stay/locked = noll effekter, första destination vid dubbelbegäran, och Leave-commit efter bekräftelse. Production `LogScreen` public/review RN Web-fixture provar BottomNav, swipe, stängning, formvärden och named Alert actions; pending/failed/unsure visar varsin enda statusyta, failed cancel behåller editor och unsure saknar cancel. Alert-shimmen ritar inte native Alert; native utseende och Android system-back är NOT TESTABLE i webbharnessen.

## Exakt beteende

1. Ren editor stängs direkt vid sheet-/navigation-request. Dirty utkast frågar **Osparade ändringar** / **Vill du lämna utan att spara?** med **Stanna kvar** och destruktivt **Lämna utan att spara**.
2. Same-tab tryck gör ingenting: ingen prompt, guard eller context reset. När discard-Alert är öppen ignoreras nya route-request; första destinationen behålls. Stay lämnar vyn/context oförändrade; explicit leave stänger och utför endast bekräftad destination.
3. Pending/saving hindrar close/nav och visar ovanstående statuscopy. Failed hindrar close/nav tills retry eller **Fortsätt redigera**; valet rensar endast failed intent och behåller draft/editor, varefter navigation fortfarande går via discard-bekräftelsen. Unsure hindrar close/nav och erbjuder endast befintlig kontroll/retry/readback.
4. Explicit **Avbryt ändring** kastar draft direkt efter att ev failed save intent avbrutits; den är disabled medan mutation saknar bekräftat utfall.
5. `requestMainTabNavigation` är ett litet testbart nav-gate; befintlig commit-ordning för knowledge/training context bevaras men körs först efter guard.
6. Ingen dataform, RPC, policy, schema, auth, ägarskap, analytics, navigation stack, gestthreshold eller generell formram ändras.

## Skrivvägar

- `src/features/puppy-log/LogScreen.tsx`
- `src/features/puppy-log/log-model.ts`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/home/main-navigation.ts`
- `src/components/ui/Toast.tsx`
- `tests/log-screen-policy.test.mjs`
- `tests/toast-compact-policy.test.mjs`
- `tests/log-event-draft.test.mjs`
- `tests/main-navigation.test.mjs`
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `tools/visual-check/README.md`
- `docs/plans/UIUX-REVAMP-R1B-LOG-DRAFT-01-ux-spec.md`
- `docs/tasks/dev/UIUX-REVAMP-R1B-LOG-DRAFT-01.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/log/R1B-LOG-DRAFT-01/` (renders, testresultat och §14-bedömning)

Ändra inte andra filer eller beteenden inom denna uppgift. Om implementationen behöver annan produktfil, uppdateras planen och den granskas igen före sådan ändring.

## Acceptans

- Dirty speglar kanoniska innehållsskillnader oberoende av validity; återställning av fält till ursprungsvärden ger clean.
- Ren stängning sker direkt. Dirty stängning via sheet close/backdrop/system-back eller flikknapp/svep frågar. Stay bevarar allt; explicit discard bara efter tydligt val; bekräftad destination är exakt den användaren valde först.
- Same-tab är no-op; upprepade requests under Alert orsakar inte dubbel prompt och byter aldrig till senare, obekräftad destination.
- Pending, failed och unsure har olika statuscopy och actionset. Failed-Toastens åtgärd heter **Fortsätt redigera**, rensar endast failed intent och behåller editor/alla fält; unsure har ingen cancel. En statusyta per tillstånd. Toastens valfria `cancelLabel` ändrar etiketten endast när den skickas; annars visas `Avbryt`, även i retained/exiting state.
- Stay och locked lämnar destination, knowledge focus/detail och training entry oförändrade. Pending/failed/unsure blockerar avmontering; befintlig retry/readback äger fortsatt resultatet.
- Confirmed save stänger editorn som förut. Snabbregistrering, dublett, datumurval, radering och undo regresserar inte.
- Beteendetester täcker dirty helper, nav callbackordning/no-op/dubbelbegäran, och riktig LogScreen-fixture för clean/dirty/stay/discard/locked/fail-cancel/unknown.
- Public/review editor och pending locked status renderas vid 375×844, 430×844, 375×667 samt 140% textproxy; §14-bedömningen redovisar relevant typografi, kontrast, täthet och touchmål. Native Alert/system-back är NOT TESTABLE.

## Kontroller

- `node --experimental-strip-types --test tests/log-event-draft.test.mjs tests/main-navigation.test.mjs tests/log-screen-policy.test.mjs tests/toast-compact-policy.test.mjs`
- Public/review `tools/visual-check` build/verify och captures för clean/dirty/locked
- `pnpm check`
- `git diff --check`
- `python tools/dev_flow.py validate`
- Oberoende QA och Reviewer. Ingen Security-review behövs om scope hålls till local UI/navigation och befintliga mutations-API:er.

## Bevisgräns

RN Web med syntetiska poster verifierar callbackkedja och UI-tillstånd, inte native Alert, Android Modal/system-back, iOS-backdrop, VoiceOver/Dynamic Type, fysisk gest/scroll eller en app byggd från aktuell commit. Dessa är NOT TESTABLE tills telefonprov. Live Supabase/RLS berörs inte.

## Implementation checkpoint — 2026-10-16

Dirty-state jämför kanoniska redigeringsvärden. En owner-registrerad guard skyddar editor och huvudfliksnavigering; samma flik gör ingen sidoeffekt och en öppen discard-Alert behåller första destinationen. Pending låser stängning och visar status. Failed erbjuder Retry eller **Fortsätt redigera** med bevarat utkast; unsure visar bara befintlig Retry/readback. Toasts valfria `cancelLabel` lämnar standarden `Avbryt` orörd för övriga konsumenter. Ingen datamodell, mutation eller schema ändrades.

Kontroller: fokuserad R1b-svit — 27/27; `pnpm check` — 512/512 tester; public och review `log-draft` — 9/9 vardera, inga browser page errors; `python -m py_compile tools/visual-check/verify.py`; `python tools/dev_flow.py validate`; `git diff --check` — samtliga godkända. Oberoende QA PASS bekräftade helper-test, full kontroll, renderresultat, screenshots, ren stängning och lyckad redigering. Den separata breda Home-verifieringen har en äldre titelassertion och är dokumenterad i evidens-README. Slutlig Reviewer återstår.

## Granskningsprotokoll

- Implementer-plan v1: owner-token guard, shared request/commit och beteendefixture; ingen kod.
- Architect v1: CHANGES; samtliga punkter införda i v2.
- Architect v2: APPROVE.
- Critic v2: PROCEED WITH CHANGES; skilj failed/unsure, gör failed cancel tydlig utan att tappa utkast, definiera same-tab och dubbelbegäran.
- Implementer-plan v2: statusseparerad feedback, abort-failed-intent med bevarat formulär, no-op/destination-lock och utökade tester; ingen kod.
- Architect v3: NEEDS CHANGES — definiera Toasts opt-in cancel-label/default och lägg befintligt Toast-policytest i skrivvägar/fokuserade kontroller.
- Plan v4: valfri `cancelLabel`, standard `Avbryt` bevaras för övriga konsumenter, custom-label endast i failed Loggeditorn och bevarad i retained/exiting state; Toast-policytest täcker båda etikettfallen.
- Architect v4: APPROVE.
- Critic v4: PROCEED WITH CHANGES — byt `Avbryt sparförsöket` till `Fortsätt redigera` eftersom mutation redan är failed och bevarat utkast ska fortsätta redigeras.
- Plan v5: felcopy/knapp uppdaterad; intent rensas utan att kassera utkast.
- Architect v5: APPROVE.
- Critic v5: PROCEED.
- Oberoende QA: PASS 2026-10-16; fokuserad R1b 27/27, full kontroll 512/512, public/review 9/9 vardera; ren stängning och lyckad redigering verifierades separat.
- Oberoende Reviewer: PASS 2026-10-16; verifierade fokuserad/full testsvit, queue validation, diff check, public/review-renderingar, screenshots, godkända skrivvägar samt oförändrade mutations-/data-/schema-/RLS-kontrakt. Native/live begränsningar kvarstår NOT TESTABLE.

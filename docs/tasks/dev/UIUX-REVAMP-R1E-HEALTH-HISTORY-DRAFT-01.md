# UIUX-REVAMP-R1E-HEALTH-HISTORY-DRAFT-01 — skydda hälsans historikredigering

Version: 4\
Status: v4 implementation klar; oberoende QA och Reviewer PASS; lokal checkpoint klar\
Risk: H — ägarregistrerad hälsodata, mutation och radering. Security-granskning krävs före implementation.

## Mandat och underlag

Nästa F02/F11-checkpoint enligt [UI/UX-masterplanen](../../plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md), efter R1d och `APP-04B2-HISTORY`. MVP v2, `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md` och `.agents/skills/tassla-consumer-ux/SKILL.md` gäller. Behåll befintlig `dog_events`-mutation, owner/dog/RLS och readback. Ingen ny datamodell, lagring, åtkomst, migration eller dataavsikt ingår.

## Ägaruppgift

Lägga till eller rätta en genomförd vaccination eller ett veterinärbesök utan att oavsiktlig sheet-/flikstängning tappar lokala formulärvärden eller skriver över en nyare sparad post. Efter bekräftad mutation ska kvarvarande Hälsa-vy visa bekräftad feedback och aktuell lokalt bekräftad historik.

## Plan v2 (godkänd före första implementationen)

1. Ren helper jämför `type`, `date`, `time` och `note` mot formulärets startvärde. Nya poster använder befintliga standardvärden; rättning behåller en separat opening-baseline av den valda sparade posten. Ogiltig men ändrad input är dirty; revert blir clean. Befintlig validering/normalisering/persistens stannar på nuvarande ställen.
2. Rättnings-save och delete får använda **opening-baseline**, aldrig den senast refreshade raden som tyst ny preimage. Skicka baseline till den befintliga owner/dog-scopade `updateHealthHistory`/`deleteHealthHistory`-kedjan och låt befintlig compare-and-set/readback avgöra. Om den valda posten ändras efter öppning missar CAS; utfall går till befintlig unknown/readback/conflict-väg och skriver inte över den nya versionen. Visa nuvarande konflikt enligt befintlig UI; **Använd aktuell historik och börja om** tar explicit bort försöket och visar färsk post. Orelaterade radrefreshar får inte nollställa formuläret.
3. Separera historikens operation-lifetime från andra health/profile lifetimes. Den nya historiklifetime:n och varje history read/mutation/retry/callback/event scope:ar `{ ownerId, accountGeneration, dogId }`. Kontrollera scope före varje state write, confirmed-event, cleanup och innan operation returnerar confirmed `true`. Äldre konto-generationens save/delete/readback kan inte uppdatera ny scope även för samma owner och dog. Ändra inte viktens, planerad hälsas eller profilens lifetime-kontrakt.
4. HealthScreen får React-key på `{ ownerId, accountGeneration, dogId }`, så byte återställer sheet, editingId och feedback. Inre editor-key är exakt `[ownerId, accountGeneration, dogId, editingId ?? 'new', initialType]`; inga historikraders snapshot fält ingår. Därmed behåller orelaterad och vald-post-refresh draften, medan save/delete mot vald-postens gamla baseline skyddas av CAS. Inga ids, keys eller draftvärden loggas.
5. `HealthHistoryScreen` äger dirty, synkron write-flight och en stabil leave-guard. Samma aktuella owner-token registreras (a) lokalt i `HealthScreen` för sheet-close och (b) via befintliga `ProductWorkspace.registerEditorLeaveGuard` för main-tab. Cleanup och stale Alert destructive callbacks får verka endast när just den editorägaren och scope fortfarande är aktiva. Gammal completion/Alert får inte stänga eller navigera en senare editor.
6. BottomSheet-headerns **Stäng**, backdrop, befintlig plattforms-close och huvudfliksväg går genom samma guard. Clean stänger direkt. Dirty visar **Osparade ändringar** / **Vill du lämna utan att spara?** med **Stanna kvar** och **Lämna utan att spara**. Stay är no-op; öppen dialog behåller första destinationen. Aktiv huvudflik är no-op. **Avbryt rättning** stänger via samma leave-guard; dirty ändringar kräver alltså samma uttryckliga discard. Det byter inte formuläret tyst till en ny tom post. Vid dirty formulär gör befintlig delete-confirmation copy uttryckligt att sparad händelse raderas och osparad rättning kastas; Avbryt bevarar alla fält.
7. Save/delete-flight sätts synkront efter lokal validering och före callback/await, blockerar dubletter och alla utträden. `finally` släpper flight även på reject; avmonterad/annat-scope editor gör inga state writes. Catch håller Promise reject borta från `void save()`/deletehandler och behåller formulärvärden. Parent `busy/pending` fortsätter spärra write-flight respektive unknown/recovery; initial history loading är inte en faktisk mutation. Failed/unknown/conflict utlöser ingen success.
8. Låt samma workspace-lifetime-bundna confirmation-event rapporteras från gemensamma `markHealthHistorySaved`, både vid direkt bekräftelse och senare readback av en initially unknown create/update/delete. Event bär scope, ökande sequence och mutation kind/target; nyaste event konsumeras en gång. Endast current scope får stänga aktuell sheet och visa korrekt create/update/delete toast. Direkt callback och readback ger inte dubbla toasts. Konflikt/fortsatt unknown lämnar formuläret, status och recovery synliga. Parentens bekräftade snapshot uppdateras före event. Om omläsning misslyckas visas befintliga `Ändringen är sparad, men historiken kunde inte uppdateras.`-varningen i kvarvarande Hälsa; success toast säger bara att händelsen lades till/uppdaterades/raderades och påstår aldrig lyckad omläsning. Anteckningstext visas inte.
9. Ta bort Toast från det avmonterade formuläret; `HealthScreen` äger Toast och reload-varning utanför BottomSheet. Visa endast för current confirmation-event. Ny/rättad lokal post syns, raderad post döljs. R1e omfattar endast Genomfört-historikens sheet; vikt och `PlannedHealthScreen` förblir separata checkpoints.
10. Pure helper-/skärmwiringtester plus public/review RN Web-fixture med riktiga HealthScreen/HealthHistoryScreen täcker dirty/revert, alla close-vägar, stay/discard/first destination/same-tab, dialog och gammal guard efter scopebyte, loading kontra flight, dubbel save/delete, throw/failure/unknown→readback confirm (create/update/delete), reload-feltext, selected-row update/delete conflict, orelaterad refresh, scope-byte under flight/Alert, success efter unmount och uppdaterad/raderad rad. Rendera 375×844, 430×844, 375×667 och 140 % webtextproxy/reduced motion där harness stöder. Native/live luckor rapporteras separat.

## Plan v3-amendment (korrigering efter QA/Reviewer; ingen källkod före förnyad review)

Plan v2:s Architect APPROVE, Critic PROCEED och Security PASS täckte den första implementeringen men godkänner inte korrigeringen nedan.

1. Ändra den interna `fetchHealthHistoryById`-läsningen så att identitet söks på `{ dog_id, id }`, utan `event_type`-filter. Validera fortfarande hund, id och stödd historiktyp. Matchning av exakt postbild fortsätter kräva typ och samtliga relevanta fält. En rad med annat, icke-stött event type får aldrig behandlas som frånvarande: läsningen ska förbli unknown/fail closed.
2. Behåll redigeringssessionens `initialType` från den valda post när editorn öppnas. Föräldern håller en explicit `editingType` parallellt med `editingId`; refreshad radtyp får inte ändra editorkey eller ersätta opening-baseline. En stödd ändring vaccination ↔ veterinärbesök blir en synlig konflikt efter statuskontroll och stänger inte en dirty editor. Endast befintlig uttrycklig konfliktåterhämtning får avsluta utkastet.
3. Testa direkt och senare readback för update/delete när samma id har bytt mellan de två stödda historiktyperna. CAS mot ursprunglig typ ska inte skriva över posten; statuskontroll ska hitta aktuell rad, lämna mutation unknown/pending tills jämförelse och exponera aktuell typ som konflikt. Ingen delete-success confirmation event eller success-feedback får utfärdas medan raden finns kvar; den vanliga bekräftelsedialogen före radering kvarstår. Unsupported event type eller mismatch i hund/id ger fail-closed unknown, aldrig delete-success.
4. Utöka RN Web-fixturen så public/review provar: behållen dirty draft och opening-type efter typbyte/refresh samt konfliktens explicita återhämtning; synkront write-flight med spärrad close/dubbeltryck och kvarvarande fält efter avslag/retry; unknown utan success före confirmation och en toast efter readback-event; reload-varning efter bekräftad mutation; update/delete-feedback efter editorstängning; och 140 % webtextproxy i minst 375 px. Befintliga tre viewportar och reduced motion bevaras.
5. Håll bevislager separata. Data-/workspace-tester täcker CAS/readback och scope. RN Web-fixturen täcker presenterad interaktion, toast/varning och layout. Live Supabase/RLS, native Alert/Modal/back, VoiceOver/Dynamic Type, fysisk keyboard/safe area och appbuild markeras fortsatt separat NOT TESTABLE.

Ingen schema-, RLS-, RPC-, dataändamåls-, lagrings-, auth- eller dependency-ändring. Befintlig dog-scopad tabell och mutationsväg behålls.

## Tillståndskontrakt

| Tillstånd | Sheet/route | Formulär och feedback |
|---|---|---|
| Clean | Stäng/lämna direkt. | Startbild eller ny blankett. |
| Dirty | Close/backdrop/header/Avbryt rättning eller annan huvudflik frågar först. Stay är no-op; discard använder första destinationen. | Alla fält kvar tills beslut. |
| Loading | Inte write-flight. | Befintlig loading/retry-copy; dirty draft skyddas. |
| Write-flight | Utträden och dubletter ignoreras synkront. | Fälten kvar; reject fångas och släpper lås. |
| Failed/rejected | Lämna kan frågas på nytt efter flight. | Draft och befintlig felstatus behålls. |
| Unknown/pending | Ingen success/exit; befintlig readback körs. | Endast aktuell confirmed-event efter exakt match stänger och toastar. |
| Conflict (selected preimage changed) | Ingen write mot nyare preimage; förblir i recovery. | Visa aktuell version; explicit börja om innan ny rättning. |
| Confirmed | Aktuell sheet stängs en gång. | Scope-matchad toast och confirmed local snapshot; reload warning kvarstår vid läsfel. |
| Scope change | Hela HealthScreen remountas; stale Alert/completion är no-op. | Ny scope saknar gamla draft/id/toast/guard. |

## Skrivvägar

- `src/features/health/HealthScreen.tsx`
- `src/features/health/HealthHistoryScreen.tsx`
- `src/components/AppPrimitives.tsx` (endast `datePickerInput.minWidth: 0` så kalender-/tidsknappen ryms vid förstorat textproxy; ingen ändring av API eller värdehantering)
- `src/features/home/ProductWorkspace.tsx` (separat generation/lifetime/event och befintlig mutationstråd; ingen ändring av övriga lifetime-kontrakt)
- `src/data/workspace-data.ts` (intern id-baserad historik-readback; inga schema/RLS-migrationsändringar)
- `src/features/health/health-history-draft.ts`
- `tests/health-history-draft.test.mjs`, `tests/health-history-screen.test.mjs`, `tests/health-history.test.mjs`
- `tools/visual-check/app.tsx`, `tools/visual-check/verify.py`, `tools/visual-check/README.md`
- `src/features/health/README.md`
- denna task, UX-spec, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md` endast efter godkänd checkpoint
- `docs/design/evidence/vision-rev02/health/history/R1E-HEALTH-HISTORY-DRAFT-01/`

Ändra inte `sources/`, `src/data/workspace-data.ts`, databas/schema/RLS/migration/RPC, auth, vikt-/planelifetime, service, hälso-dataändamål, notiser eller medicinsk copy. Befintlig CAS-signatur används; opening-baseline skickas genom den befintliga UI-/workspace-mutationskedjan. Ingen ny persistens. Vid otillräcklig CAS/readback eller osäker confirmed-event-scope: stoppa och återgranska före kod.

## Kontroller och bevisgräns

- `node --experimental-strip-types --test tests/health-history-draft.test.mjs tests/health-history-screen.test.mjs tests/health-history.test.mjs tests/main-navigation.test.mjs`
- Public/review `tools/visual-check` build och `health-history-draft` verify
- 140 % proxy mäter dessutom kalender- och tidsknapparnas faktiska bounds mot respektive rad och avvisar intern horisontell overflow
- `pnpm check`; `python -m py_compile tools/visual-check/verify.py`; `python tools/dev_flow.py validate`; `git diff --check`
- Architect APPROVE v3, Critic PROCEED v3 och Security PASS v3 före korrigerande implementation; därefter oberoende QA och Reviewer.

Syntetisk RN Web verifierar inte Supabase/RLS, native Alert-dismissal, Android/iOS Modal/backordning, VoiceOver/Dynamic Type, systemkeyboard/safe area eller installerad app. Rev02 saknar separat historik-editor; direkt pixelmatchning är NOT TESTABLE.

## Granskningsprotokoll

- Plan v1: Architect CHANGES, Critic PROCEED WITH CHANGES och Security CHANGES REQUIRED. Införda krav i v2: confirmation-event även när senare readback bekräftar unknown; current scope/lifetime inkluderar `accountGeneration`; opening-baseline skyddar selected-row compare-and-set för update/delete; owner-token-freshness efter Alert/remount; HealthScreen scope-remount; explicita Avbryt/raderingssemantiker; reload-fel ligger kvar synligt; reject/finally-låsning.


- Plan v2 reviews: Architect APPROVE, Critic PROCEED, Security PASS. Architect requires the sequenced scope-bound confirmation event to be the sole sheet-close/toast trigger and consumed once so remount cannot replay; Security requires immutable opening baseline for both update and delete and scope+sequence event consumption.
- R1e independent QA 2026-10-16: BLOCK; §10 visual coverage and workflow metadata incomplete.
- R1e independent Reviewer 2026-10-16: BLOCK; typed readback can falsely confirm delete after a concurrent type change, and deriving the edit key type from refreshed rows can unmount a dirty draft.
- Plan v3 reviews (2026-10-16): Architect **APPROVE**, Critic **PROCEED**, Security **PASS**. Architect confirms dog+id lookup and type-sensitive exact matching; Critic requires explicit wording that only confirmed-delete success waits for absence; Security confirms unchanged owner/RLS access boundary and fail-closed unsupported types. The clarified §3 language above is part of the exact reviewed plan.

- Visual v3 verification found calendar/time control clipping at the 140 % text proxy even though document-level overflow stayed zero. A non-persistent browser experiment confirmed `minWidth: 0` on the shared `datePickerInput` lets both field buttons fit. The narrow `AppPrimitives.tsx` style-path extension and field-bound assertion are version 4. Architect **APPROVE** and Critic **PROCEED** for this exact addition: sole shared style path, no API/value/behavior changes; both date/time buttons and row overflow must be checked in public/review. Native Dynamic Type remains outside RN Web claims.

- R1e v4 implementation: id-only history readback plus type-sensitive image matching, stable opening type/draft through supported type swaps, explicit conflict recovery, and the reviewed `datePickerInput.minWidth: 0` fix. Public and review RN Web each pass 11/11 scenarios with no page errors; screenshots and result JSON are saved in the evidence directory. The 140 % case measures date/time button bounds against each row and verifies no row overflow.
- Focused history/navigation command listed above: 67/67 (59/59 across the three health-history test files). Full `pnpm check`: 545/545 plus app/edge typecheck and ESLint. Python verifier syntax, queue validation and `git diff --check` pass. Read-only independent QA and Reviewer are the remaining gates before this task can be marked done.
- Live Supabase/RLS, native Alert/Modal/back, real device gestures, VoiceOver/Dynamic Type, physical keyboard/safe area and installed-app behavior remain **NOT TESTABLE** in this environment.
- Independent QA v4 first pass: **BLOCK** solely because the evidence README lacked the required 18-item design-rules §14 checklist. QA independently passed all focused/full/browser checks and inspected the 140 % field bounds. The checklist is now saved in the evidence README; independent QA recheck is pending. See `docs/design/evidence/vision-rev02/health/history/R1E-HEALTH-HISTORY-DRAFT-01/qa/INDEPENDENT-QA-v4.md`.
- QA checklist recheck confirmed that §14 item 16 requires six separate statuses and image references (composition, colors, typography, component shapes, imagery and density). The evidence README now has six linked subrows, each marked NOT TESTABLE because no matching history-editor reference panel exists. Independent recheck is pending; no app source or plan scope changed.
- Independent QA v4 follow-up: **PASS**, no remaining findings. QA verified all local links, all six point-16 subrows, the relevant screenshots/results, queue validation and `git diff --check`. Independent Reviewer is now the remaining gate.
- Independent Reviewer v4 first pass: **BLOCK — documentation status only**. No code/API/test finding. The evidence README's final sentence said QA recheck was pending despite the recorded QA PASS. The stale sentence is corrected; a short Reviewer recheck is pending. See `docs/design/evidence/vision-rev02/health/history/R1E-HEALTH-HISTORY-DRAFT-01/review/INDEPENDENT-REVIEW-v4.md`.
- QA rechecked the corrected status sentence: **PASS**. README now says QA v4 passed and only Reviewer recheck remains. Queue validation and `git diff --check` pass; application source did not change.
- Independent Reviewer documentation recheck: **PASS**. It confirmed the corrected status; no code changes or new findings. Queue validation and diff check pass.

# UI-R02-03 — Logg och Hälsa: kompakta och tydliga formulär

Datum: 2026-10-23. Plan v3. Branch: `2026-10-23-ui-03-logg-halsa` (plan checkpoint ska pushas här före kod). Mandat: Eriks uttryckliga beställning att fortsätta actionplanen i ordningen 02 → 03 → 04. UI-R02-02 (`3973ffe`, följd av dokumentcheckpoint `4f91364`) är pushat på `2026-10-23-ui-02-checklistor`. Aktuell referens är `vision_rev02.jpg`, panel 5 Logga och den aktuella stödresan Hälsa. Äldre UI/kod från före 16 oktober används inte.

UX-spec: [UI-R02-03-logg-halsa-ux-spec.md](../../plans/UI-R02-03-logg-halsa-ux-spec.md). Actionplan §5; GAP G04/G06/G09/G10/G11/G13/G16/G19.

## Mål och risk

Rätta en logg- eller hälsopost utan en vägg av knappar, nå Spara med tangentbordet öppet och förstå vad en borttagning gör. Öppna exakt vald hälsoplan och återvänd till samma flik och scrollposition. Behåll skilda betydelser och befintliga skriv-/återställningskontrakt. Risk **H** på grund av hälsodata, scope, radering och route-state. Planen ändrar inte datamodell, ändamål, RLS, RPC, fält eller skrivkontrakt.

## Resor och konkret UI-kontrakt

1. **Logg — ändra/radera.** Tidslinjeraden öppnar befintligt `BottomSheet` med en rubrik och fast Spara-footer. Ta bort fullstora formulärknapparna Avbryt/Radera. X/backdrop/swipe/Android-back går genom en gemensam close-handler: clean stänger, dirty frågar om utkastet ska kastas. Soptunnan öppnar objektnamngiven bekräftelse; mutationen sker först efter bekräftat Radera och använder exakt befintlig event-ID, hund/type-scope och snapshot/undo. Snabbval, Fler, kalender, lokal tid/dag, dublettskydd och undo förblir oförändrade.
2. **Hälsa — utförd händelse.** Behåll befintligt sheet; ta bort inre formulärkort/dubbla rubriker och fullstora Avbryt/Radera-knappar. Samma fältfamilj och en fast Spara-footer. Historikradering startar först från objektspecifik dialog och använder befintlig villkorad mutation/preimage.
3. **Hälsa — vikt.** Add/edit öppnas i samma befintliga `BottomSheet`-editor ovanpå viktsidan; endast formuläret flyttas till sheet, medan lista, status, återhämtning och sidans Back stannar på sidan. Ingen konkurrerande inline-editor. En fast Spara-footer; radering via ikon plus bekräftelse och befintlig exakt `dog_id + event_type + id`-gräns/återkontroll.
4. **Hälsa — plan.** Add/edit öppnas i `BottomSheet` ovanpå plansidan; lista, tom-/fel-/statusvy stannar kvar på sidan. Fokuserad befintlig plan nämns i första meningsfulla viewporten med typ/namn, datum, status och tydlig Ändra-handling. Ingen tom create-form visas automatiskt när en befintlig plan är fokuserad. Create öppnas endast från **Planera en händelse/Ny plan**, med tomt formulär. Planradering använder dialogens exakt bekräftade plan-ID och befintlig preimage/CAS-mutation.
5. **Dirty/återhämtning.** Varje editor rapporterar mot sina faktiska startvärden (inte `canSave`) om fälten ändrats och sin mutationstatus till ägarens sheet-close-handler. Samma handler gäller X, backdrop, swipe och Android modal-back. Clean stänger direkt; dirty öppnar discard-dialog. Ett aktivt skrivsteg (`busy`) får tillfälligt hindra stängning medan befintlig mutation körs. När utfallet är `pending/unknown` eller konflikt ska användaren kunna **minimera** sheetet till ägarsidan utan att avbryta, rensa eller duplicera mutation/intention. Ägarsidan visar då en återhämtningsrad med Kontrollera status/Granska och Öppna; den öppnar exakt samma editor med råa fältvärden, intent och tillhörande recovery-context kvar. Utkast ägs i en smal in-memory state i `ProductWorkspace` ovanför villkorligt monterade routes/editors; ingen generell draft manager, persistent UI-draft eller note-text i route state. Återhämtningssnapshot nycklas på `{owner/accountGeneration, selectionKey, dogId, relevant lifetime, editor kind, object ID}`. Den ska överleva navigering bort/tillbaka inom samma aktiva scope och vara single-flight. Konto-/hund-/scopebyte invalidierar dess presentation och får aldrig föra utkast/fokus till ny scope; befintlig pending intent förblir scopebunden enligt dess befintliga recovery-kontrakt och återanvänds inte. Late response, retry, mark-saved och cleanup måste kontrollera samma scope/lifetime innan de uppdaterar editor eller recovery row. Failed behåller formulärvärden och befintlig retry-väg. Close/minimize får aldrig skapa en andra mutation eller påstå lyckat resultat. Konfliktens befintliga resolve/retry väg finns kvar.
6. **Radering.** Soptunnan öppnar endast dialog. Dialogen namnger posttyp och datum där det finns; Cancel ändrar inget och lämnar editorn/fokus kvar. Endast bekräftad knapp kör befintlig mutation med exakt objekt-ID och dess befintliga villkor: preimage/CAS där kontraktet har det, annars befintlig exakt scope/readback. Ingen optimistisk lokal listborttagning eller direkt ikonmutation. Vikt behåller `dog_id + event_type='weight' + id` samt readback; workspace-data/adapter ändras inte.
7. **Keyboard.** Decimal-pad-vikt ska kunna avslutas och sparas utan att Spara täcks. Return i multiline-anteckning skapar ny rad och sparar/stänger inte. X och Spara ska nås vid 375×667 och 140 % textproxy. Verkligt native-resultat redovisas separat eller `NOT TESTABLE`.

## Route- och datagräns: Hälsa → namngiven plan → Hälsa

- Exportera en smal `HealthTab` för `Översikt | Vaccinationer | Veterinär | Vikt`. `ProductWorkspace` äger vald flik och skickar den till `HealthScreen`, eftersom sidan avmonteras när plansidan öppnas. Vikt-returens befintliga mål är Översikt; namngivna planer kan öppnas från Översikt/Vaccinationer/Veterinär.
- Dela callbacks: `onOpenPlannedHealth(planId, returnTab)` för en namngiven rad och `onCreatePlannedHealth(returnTab)` för create. Create sätter explicit `planId: null` och rensar gammalt planfokus före navigation.
- Checklistans `plannedHealthChecklistFocus` och dess fetch/retur lämnas orörda. Hälsa får separat in-memory focus-state med minst `{ selectionKey, plannedHealthLifetime, planId: string | null, returnTab, returnScrollKey }`; den innehåller aldrig note/text eller ett långlivat, oscopeat record-kopia. Scrollflödet: Hälsa `{scrollKey: 'health-flow', preserveScrollKey: 'health-flow'}`; Hälsa→plan `{scrollKey: 'planned-health-health-source', preserveScrollKey: 'health-flow'}`. Checklist-origin behåller nuvarande `planned-health-checklist-source` → `home-checklist-flow`.
- Namngivet ID visas ur en aktuell `plannedHealthRows`-snapshot med matchande selection/lifetime; ingen ny fetch/datamodell krävs Hälsa-ingången för befintliga aktuella listposter. Checklist-origin behåller befintlig hundscopad `fetchPlannedHealthById(client, dog.id, planId)`.
- Om Hälsa-post saknas efter reload visas missing/error för exakt ID eller återgång till Hälsa med begriplig status; aldrig första/närmaste plan som fallback. Konto/hundbyte, account invalidation, `plannedHealthLifetime`-byte och escape till huvudtab invaliderar fokus och avbryter olämplig läsning. Route-ID är aldrig auktorisering; alla data/mutationer förblir aktiva hundscopade.
- Exakt plan A/B (även visuellt lika poster) öppnar rätt post och Ändra går till dess editor utan tyst create/prefill. Retur återställer ursprunglig flik och verklig icke-noll scroll. En sparad/raderad plan blir inte utförd historik: navigation/fokus anropar inte `saveHealthHistory`, skapar inte `dog_events` och markerar aldrig plan som genomförd.

## Interna checkpoints

1. Logg editor och radering; kör snabbval/kalender/undo-regression.
2. Utförd hälsa och vikt editors, inklusive keyboard och recovery.
3. Plan create/edit/focus/retur och exakt scoping; bekräfta A03 Checklistor→Kommande→exakt plan→Checklistor är byte-for-behavior unchanged.
4. Public/review render och paketets slut-QA/Reviewer/Security på fryst diff.

## Acceptans och kontroller

- Alla fyra editorn (Logg, utförd händelse, vikt, plan) har konsekvent kompakt rubrik/fält/footer/action-familj; vikten och planen använder `BottomSheet`, utan att lägga formulär i BottomNav-footer eller införa global draft manager.
- Clean/dirty X, backdrop, swipe, Android-back; save/delete confirm/cancel; failed/pending/unknown/conflict; minimera och öppna samma draft igen efter unknown/conflict; create efter tidigare planfokus; saknad plan; scope/lifetime-byte; sen async response; exakt plan A/B; ingen plan→history mutation. Täckt av riktade tester/verifierare.
- Public/review RN Web-render vid 375×667, 375×844, 430×844 och 140 % textproxy. Full Panel 5 §14-acceptans redovisas separat; komponentrender är inte panelgodkännande.
- Kör riktade tests, `pnpm check`, iOS JS export/content guard, visual verifiers, `git diff --check` och queue validation enligt köpost. Ingen live-/native-/TestFlight-pass hävdas utan faktisk körning.
- Ägarens tidigare generella besked om Supabase/RLS och native VoiceOver/Dynamic Type är ägarrapporter, inte ny verifiering av dessa specifika resor. Om verklig native-körning saknas anges `NOT TESTABLE`.

## Skyddat scope

Ingen schema-/adapter-/RLS-/RPC-/eventmodell-/notifierings-/datainsamlingsändring, ingen ny hälsotext/rådgivning och inga dependencies. Bevara datumregler (utfört/vikt ej framtida; plan tillåter framtid), immutable historiktyp där befintligt kontrakt kräver det, befintligt CAS/readback/request-ID/confirmed-vs-unknown, separata planerade/utförda tabeller samt A03, 01B och Panel 8-beteende. `FLOW-LOG-01` och `FLOW-INSIGHTS-01` är parkerade; den här tasken återupptar inte deras bredare scope.

Tillåtna skrivytor är de i queue `UI-R02-03`: de fyra skärmarna Logg/Hälsa, `ProductWorkspace.tsx`, `main-navigation.ts`, fem listade tester, befintlig visual-check harness plus den planerade hälsaverifieraren/evidensmappen, modulguider samt task/UX/actionplan/queue/rapport/master-log/release history. Ingen annan kod/data-surface utan ny review.

## Planreview (plan v1 → v3)

- **Architect v1:** CHANGES. Krävde faktiska BottomSheet editors, dirty-state bridge, separata callbacks, flikstate i workspace, separat scoped health focus, explicita scrollnycklar, exakt missing/focus/create-beteende och en oförändrad checklistretur.
- **UX Critic v1:** PROCEED WITH CHANGES. Krävde en entydig editor, synlig fokuserad plan med namn/datum/status/Ändra i första vyn samt konkret keyboard acceptance.
- **Security v1:** CHANGES. Krävde scope/lifetime invalidation, create `planId: null`, missing/error utan fallback, bekräftelse bundet till exakt ID/preimage, pending/unknown exit-regler och tester som bevisar att plan aldrig blir utförd historik.
- **Architect v2:** APPROVE; angav att viktens radering använder exakt scope + readback, inte preimage/CAS. Tasken är korrigerad till befintligt kontrakt och `workspace-data.ts` är uttryckligen utanför scope.
- **Security v2:** APPROVE.
- **UX Critic v2:** PROCEED WITH CHANGES; identifierade risk att unknown/conflict låser användaren i sheetet. Plan v3 låter användaren minimera när mutationen inte längre aktivt kör, behåller draft/intent i in-memory ägarstate och visar en återhämtningsrad som öppnar samma editor.
- **Architect v3:** APPROVE; befintliga modal-/route-unmounts kräver recovery state ovanför skärmarna. Specifika krav är råa fältvärden, owner/accountGeneration/dog/lifetime/editor/ID scope key, weight late-response/lifetime fencing och switch-away/back inom samma scope. Viktadapter/datafil hålls oförändrade.
- **UX Critic v3:** PASS.
- **Security v3:** APPROVE; slutdiffen ska verifiera scope key, scopebyte, minimera/återöppna, sen async, upprepade actions och cleanup.
- Inga reviewblockerare återstår. Queue kan gå vidare till `ready` och därefter `implementing`; plan v3 är fryst.

Efter v3-review: Architect `APPROVE`, Critic `PASS`, Security `APPROVE` och queue-övergång `planned → ready → implementing` är uppfyllda. Alla implementationer måste följa ovanstående scope/draft ownership; en ny ändring av godkänt scope kräver förnyad review.

## Skills och beslut

Följda: `tassla-consumer-ux`, `mobile-ios-design`, `docs/design-rules.md`, `docs/dev/ui-and-code-standards.md`. Inom befintligt mandat väljs en BottomSheet per editor, ett bekräftat soptunneflöde och in-memory route-state. Nya ändamål, fält, retention, analytics, notifiering eller medicinska påståenden ingår inte.

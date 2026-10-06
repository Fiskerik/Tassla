# APP-04C — profilredigering
Plan v1 2026-10-06. Erik full-MVP mandate, Luna medium. Preparation only until APP-04B2 checkpoint. No new PHONE gate, dependency or migration.
## Internal checkpoints
1. DATA: app-data.ts adds typed dog changes/result, strict trim name 1–80 Unicode codepoints, existing calendar/future-date validation, selected known breed. updateOwnedDog uses explicit allowed payload name/breed_id/birth_date, dog id filter AND captured preimage name/breed/date for conditional update, 12-second SDK abort deadline, select postimage and strict parser. Actor/ID cannot be changed. Reconcile by owner-scoped exact id: desired postimage saved; original preimage may replay original intent; conflict unknown/no overwrite. Zero-row not saved without readback.
2. WORKSPACE: AppFlow owns confirmed dog and passes onDogUpdated into ProductWorkspace. Confirmed returned same-ID profile updates root state; existing age/content/training effects recalculate without restart. Separate editor has mounted/generation guard; check lifetime after awaited lookup BEFORE any replay, late response cannot mutate UI/root after session/dog change. Stable pending preimage/intent, synchronous ref duplicate guard; unknown persists when fields are edited and blocks new writes until explicit status action resolves.
3. UI: add src/features/onboarding/EditDogProfileScreen.tsx; keep create ProfileScreen unchanged. More > Hundprofil uses editor, current breed names/list, name/date inputs, save/cancel, loading/error/retry/unknown status. Optional onDogUpdated for existing preview harness compatibility; absence leaves existing read-only profile behavior. Confirmed profile drives name, age and content; no fake optimistic success. Readable native form, keyboard/large text/accessibility patterns reused.
4. CLEANUP/QA/REVIEW: maintained onboarding guide. QA independently tests validation, real SDK exact filters/payload/strict parsing, conditional mismatch/preimage, lost response, timeout, explicit safe retry, duplicates/lifetime/callback and age/content refresh. Run pnpm check, pnpm bundle:ios and git diff --check. Independent Reviewer and Security, durable release-log/queue checkpoint before P03. Native/RLS separately disclosed.
## Ownership
Implementer: src/data/app-data.ts, src/features/onboarding/EditDogProfileScreen.tsx, src/features/home/AppFlow.tsx, src/features/home/ProductWorkspace.tsx, src/features/onboarding/README.md.
QA: tests/profile-edit.test.mjs and tests/README.md.
Coordinator: this plan, docs/releases/APP-04C.md, report/queue. No concurrent source writes with B2.
## Acceptance
Complete edit of name/breed/birth date, same permanent dog ID, confirmed changes update derived age/content without restart; safe error/conflict/retry and session isolation. Existing create/log/weight/health/progression unaffected. Runtime RLS/native NOT TESTABLE unless actually run. Exact planreview pending.
## Next
APP-04B2 checkpoint first. Then approved P02 implementation. P03 upcoming health follows P02.

## Bilder och ikoner — Eriks genomförandekrav 2026-10-06
Varje paket har en UI-designcheckpunkt: använd passande bilder/illustrationer och ikoner där de hjälper förståelse och gör upplevelsen trevlig. Återanvänd Tasslas befintliga dog-welcome/dog-resting och Ionicons samt theme tokens där de passar; nya bilder ska vara lämpliga och ha spårbar källa/generation. Lugn hierarki, tydliga kort/status, textetiketter till handlingar, skärmläsarfallback, stor text, reducerad rörelse och laddningsprestanda. Undvik att dekor döljer formulär eller sparstatus. Kontroller får inte bara kommunicera med ikon/färg. Ingår i cleanup/QA/review, inte ett separat kosmetiskt slutprojekt.

## Plan v2 — review changes
Architect/Critic CHANGES v1, införda: profilens pending intent/preimage och synkron spärr ägs av ProductWorkspace, inte av navigationskänslig editor. Avbryt/back lämnar aldrig okänd operation raderad; återbesök visar statuskontroll. Bekräftad ras/födelsedatum-ändring invalidierar content/training till loading och generation-checkade svar; även manuella retries kontrollerar generation. Misslyckad uppdatering visar fel/tomt i stället för tidigare skräddarsytt innehåll som aktuellt. Övrig historik/progression/pending writes bevaras. QA täcker navigation vid okänd profilstatus, återbesök och sena/failed derived-content reads.

Faktisk review v2: b2_reviewplan Architect APPROVE/Critic PROCEED, read-only exact plan. Implementation först efter B2 checkpoint.

Faktisk static Security/data-purpose review från b2_reviewplan: APPROVE lokal syntetisk implementation contract, inte deployed proof. Existing RLS och begränsat fälturval; pending lifetime och atomisk preimage obligatoriska.

## Implementationcheckpoint före QA
Luna medium b2_contract DATA/WORKSPACE/UI/README stabila, typecheck/lint/scoped diffcheck PASS. Root same-ID callback, workspace pending across navigation, strict conditional writes and generation-gated content/training. SQLSTATE klassificering rättad före slutkontroll. Independent QA och Reviewer/Security kör slutkontroll; inte done ännu.

## Korrigering 1 — review BLOCK
Independent next_reviews Reviewer BLOCK: sparad-besked visas efter ny osparad formulärändring. Security PASS local source. Luna medium rättar dirty/statusvisning inom samma accepterade beteende, pending/unknown får aldrig döljas. Förnyad QA/review efter stabil rättning; BLOCK överprövas inte och ingen done-status ges före PASS.

## Slutcheckpoint APP-04C — lokalt klart
Luna medium b2_contract implementation; correction1 reviewer BLOCK saved-besked vid osparat utkast åtgärdad och next_reviews renewed Reviewer PASS/Security local PASS. Independent QA profile_contract: profile 27/27, full pnpm check 129/129 inklusive type/lint, iOS-export PASS (dist/ios verifierad inom repo, eskalerad skrivning efter EPERM), diffcheck PASS. Faktiska SDK/localfetch, workspacehandlers/comparator och editorns statusuttryck provade; inga nya appdefekter observerade. Native/deployed RLS ej testade och inte påstådda PASS. Nästa P03 efter denna hållbara checkpoint, ingen PHONE-grind.

# UI-R02-01B — Hundprofil: fält först, kompakt hundval och trygg avslutning

Datum: 2026-10-23 · Version: 6 · Status: lokal implementation verifierad; oberoende slutgranskning återstår · Branch: `2026-10-23-ui-01-profil`

## Syfte och användaruppgift

Ägaren ska kunna öppna Hundprofil, hitta hundens redigerbara uppgifter direkt, byta aktiv hund utan en lång inline-lista och lämna sidan utan att tappa osparade ändringar. Kennelkoppling och förklaringar finns tillgängliga men ska inte tränga undan namn, ras, födelsedatum, åldersvisning eller Spara.

Detta är UI-R02-paketets andra och sista profildel efter [01A](UI-R02-01A-BREED-PICKER.md). Den implementerar actionplanens profil-täthet och avslutning mot G03/G06/G08/G10/G13/G16. Den bygger vidare på kodens befintliga profil-/hundvalsrutter och ändrar inte profilens datamodell eller save/readback-kontrakt.

## Aktuellt underlag och mål

- Primär referens: `vision_rev02.jpg`; profil är en stödyta utan egen rev02-panel. Följ därför panelernas varma canvas, ljusa rundade grupper, kompakta rubriker, profilaccent, tydlig navigation och korta kontextuella handlingar enligt `docs/design-rules.md` §0–4/14 och `docs/design/vision-rev02-screen-contracts.md`.
- Aktuellt fynd: [GAP-analysen G03/G06/G08/G10/G13/G16](../GAP-UI-UX-rev02-2026-10-23.md). Profilens exakta nuvarande kod/render kontrollerades efter 01A-committen; tidigare skärmbilder används endast som namngivna GAP-förebevis, inte som godkänd implementation.
- Aktiv kravkälla: GAP-analysen och actionplanen daterade 2026-10-23, aktuell kod samt den stängda 01A-checkpointen. Äldre profilplaner från före 16 oktober används inte som tilläggskrav eller visuell instruktion; befintliga data-/ägarskapsregler bevaras enligt aktuell kod och MVP-kontrakt.
- Relevanta skills: `tassla-consumer-ux` och `mobile-ios-design`; utseendet styrs fortsatt av Tasslas designregler och verkliga befintliga React Native-/Expo-komponenter.

| Referens eller krav | Aktuellt problem | Avsedd ändring | Visuell/funktionell acceptans |
|---|---|---|---|
| Rev02:s kompakta innehållshierarki och G08 | Hero, upprepad historiktext och inline-hundlista kommer före formuläret. | Visa en kompakt aktiv-hund-rad och profilens riktiga fält tidigt; återanvänd befintliga `DogProfileSwitcherSheet`. Lägg insikter och frivillig kennelkoppling efter huvudformuläret. | Vid 375×844 syns aktiv hund och början av formuläret före hjälpinnehåll. Inga hundar listas permanent på profilsidan. Växling/”Lägg till hund” behåller befintliga scope-guards. |
| Rev02:s lugna sekundärinformation; G13 | Profilens hero och separat historiknotis upprepar varför profilen finns. | Samla nödvändig profilförklaring i en enda diskret informationsingång; behåll generic dog asset endast som tydligt dekorativt/stadigt asset om den visuellt motiverar platsen. | En enda rubrik/ingång för information; ingen teknisk eller syntetisk statuscopy i normalt läge. |
| G10 och actionplan §3 | Skapa använder fri datumtext; ändra använder `DatePickerField`. | Använd befintlig `DatePickerField` i båda skapa-/ändraflödena, med fortsatt manuell text och samma födelsedatumsvalidering. | Samma kalendertrigger, datumformat och valmarkering; framtida datum sparas fortfarande inte. Övriga `DatePickerField`-konsumenter lämnas oförändrade. |
| G08 och profilens frivilliga kennelkoppling | Kennelhantering expanderas permanent trots att den är valfri. | Gör kennelkoppling till en kompakt sammanfattning med synlig opt-in-ingång och expanderbar redigering. Skapa-flödet får visa inläst QR-kod, men koden innebär aldrig samtycke; annars är avsnittet stängt. Ändra-flödet visar bekräftad kennelstatus och samma retry-/felväg. Fel och okänt resultat öppnar eller pekar tydligt på relevant avsnitt. | Inget samtycke förvalt eller dolt, ingen ändring av attribution-API, ägarens code-input eller separata sparresultat. Loading/fel/retry/unknown kan nås och försvinner inte bakom kollapsat avsnitt. |
| G06 och actionplanens formulärkontrakt | Profilens header-back, bottenflik, hundbyte och add-flow har inget fullständigt exit-skydd; create-recovery har lokal payload och säkert request-ID. | En scope-bunden `requestProfileExit(destination)` styr header, bottom nav, Android `BackHandler`, hundbyte och vägen från edit-profile till Add Dog. Ren vy lämnar direkt; enbart lokala dirty fält öppnar bekräftelse. Dirty hundbyte/Add Dog-entry använder samma bekräftelse, vars rubrik och brödtext namnger destinationen (t.ex. “Byt hund och kasta ändringar?” eller “Lägg till hund och kasta ändringar?”), och kör callback först efter bekräftat val. Busy, pending/conflict och attribution busy/unresolved blockerar. Add mode har dirty-cancel-bekräftelse; non-busy recovery lämnar säkert tillbaka till befintlig profil och bevarar full lokal form- och recoverystatus samt ursprunglig `addEntryPoint` i `DogWorkspace`-minne för samma owner/account-generation/request. Initial mode hanterar Android-back genom att synkront konsumera händelsen när `operationInFlight.current` eller `recoveryCheckInFlight.current` är true och med tydlig bekräftelse innan appen lämnas när både create och återställningsläsning är klara; varningen är villkorad: endast efter ett create-försök finns ett säkert request-ID kvar efter appomstart, och då kan formulärfälten behöva fyllas i igen; före första försöket finns inget sådant ID. Dirty-exit-dialogens förklaring säger att bara lokala fält kastas och namnger nästa vy. | Discard kastar bara lokala fält och rensar inte pending mutation, conflict, attribution recovery, create request ID eller referral state. Safe resume bevarar exakt form, consent och UI recovery context utan att skapa, kontrollera eller skicka om något automatiskt. In-memory draft tas bort vid explicit discard, lyckad resolution, explicit “Starta en ny hundprofil” och konto-generationbyte. |
| G03; användarens tidigare ikon-/textprioritering | Dubbla permanenta stora handlingar förstorar stödformuläret. | Behåll en primär profil-Spara-handling i profilgruppen och ta bort redundant Avbryt från edit-formuläret där header-backen redan finns. Lägg till-hund-vyn behåller sin nödvändiga Avbryt-ingång, men gör den sekundär och bekräftar bara när fält ändrats. Kennelns separata Spara finns endast i dess expanderade avsnitt eftersom det är en annan operation. | Ingen generisk ikonifiering av ord som behövs för val och sparstatus; handlingsnamn och minst 44 pt träffytor bevaras. |

## Avgränsning

Ingår: aktiv-hund-rad och befintlig switcher, redigerbara fält tidigt, samma födelsedatumkontroll i create/edit, kompakt informationsväg, kollapsad frivillig kennelredigering, enhetlig dirty-exit-bekräftelse för existerande avslutningsvägar och riktad visuellt/funktionell evidens.

Lämnas oförändrat: hund-/kontoägarskap, create-idempotency och secure request, owner attribution API, profil-CAS/write/readback, pending/unknown/conflict/failed-classificering, Insights route gating, ålderspreferensens betydelse, hund-/passdata, QR-kodens explicita opt-in, schema/RPC/RLS, full rasimport/Mix, Home och andra paneler. Ingen global defaultstorlek eller generisk knapp-/modalombyggnad.

Profil är en `ProductWorkspace`-vy snarare än en navigator-route. Androids faktiska `BackHandler` fångar back endast när ProductWorkspace står på profile och använder samma scoped exit guard; övriga ProductWorkspace-sidor lämnar OS-standardbeteendet orört. `ProfileScreen` hanterar add mode genom samma cancel guard. Initial mode (första hundprofilen) konsumerar Android-back synkront när `operationInFlight.current` eller `recoveryCheckInFlight.current` är true; när varken create eller återställningsläsning pågår visas explicit lämna-bekräftelse före `BackHandler.exitApp()` vid osparade eller olösta uppgifter; den lovar inte att minnesutkast överlever appomstart. iOS swipe-dismiss ligger utanför scope; ingen ny route/back-stack läggs till.

## Interna checkpoints

1. **Täthet och val:** bygg om profilens första skärmupplevelse och rendera samma produktkomponent i create/edit. Byt bort inline-hundlistan till befintlig sheet; presentera profilfält först och vik undan kennel/info. Riktade tester/render vid 375×844, 430×844, 375×667 samt 140 %-textproxy. Commit checkpoint före avslutningsändring.
2. **Trygg avslutning:** ren policy-helper med scope-bunden status; synkron child snapshot; `requestProfileExit(destination)` för header, bottom nav, Android BackHandler, hundbyte och Add Dog-entry. Profile guards läser parentens aktuella mutationsrefs; lägg till synkron `attributionMutationInFlight` ref före första await. Add mode skyddar dirty cancel och erbjuder session-bundet safe resume av full recovery snapshot; initial mode konsumerar Android back medan `operationInFlight.current` eller `recoveryCheckInFlight.current` är true och bekräftar annars exit. Testa omedelbara navigationstryck under profil-/kennelwrite, initial create, initial SecureStore recovery-read, matching/mismatched restored request ID, recovery variant precedence, scopebyte, add-entry, native-back, discard, safe resume och cleanup utan request-ID/referral-mutation.

3. **Slutlig rengöring/evidens:** kontrollera kontrasten mot fryst 01A, ta bort obsoleta profilhelper-/copy-paths endast om referenser bevisar att de är inaktiva, rendera public/review och inspektera §14. En panelmatchning hävdas inte för stödsidan.

## Skrivfiler (endast dessa utan ny planreview)

- `src/features/onboarding/ProfileScreen.tsx`
- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/onboarding/ProfileScreenHeader.tsx` (endast om titel-/backvariant behövs)
- `src/features/onboarding/profile-exit.ts` (ny, ren policy/type helper; ingen presentation eller mutation)
- `src/features/home/AppFlow.tsx` (endast create/add-cancel callback, scope wiring, session-bundet recovery snapshot och lifecycle cleanup)
- `src/features/home/ProductWorkspace.tsx` (route-/bottom-nav dirty guard, utan datalagret)
- `src/components/ui/Dialog.tsx` (additiv `cancelLabel?: string` med oförändrat default `Avbryt`)
- `src/features/onboarding/README.md`
- `tests/profile-screen-policy.test.mjs`, `tests/profile-edit.test.mjs`, `tests/profile-exit.test.mjs` (obligatorisk policy- och regressionssvit)
- `tools/visual-check/vision-r02-home-panels-app.tsx`, `tools/visual-check/verify-vision-r02-home-panels.py`, `tools/visual-check/README.md`
- `docs/design/evidence/vision-rev02/ui-r02-01b-profile-density/`
- denna plan, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md`, actionplanens aktuella status

Ingen ändring i `src/data`, SQL, auth, datalagring, globala `Button`/`BottomSheet`-defaults eller andra skärmfeatures. Dialogens enda ändring är valfri sekundärknappstext med bibehållet standardbeteende.

## Klart när

- Profilens huvudformulär/fields kommer före hundlistor, upprepade hjälpblock och frivillig kennelhantering; den första vyn fungerar vid liten viewport och skalar utan horisontellt overflow.
- Ägarens hundval använder samma `DogProfileSwitcherSheet` som Hem. Ren profil byter hund direkt; dirty profil ber om uttrycklig discard; busy eller unresolved/conflict blockerar och visar rätt kontrollväg. Statuscallbacks är scope-bundna till owner, account generation och hund, och sena callbacks från gammal scope ignoreras.
- Skapa och ändra använder samma `DatePickerField`; manuellt inmatat datum finns kvar och befintlig validering/readback är oförändrad.
- Kennelavsnittets kompaktläge rapporterar enbart faktiska värden och har synlig frivillig expandering. QR-kod kräver fortsatt uttryckligt samtycke; update/delete/save/unknown-resultat har samma verkliga mening som tidigare och fel/okänt läge är fortsatt nåbart.
- Profilens information finns via en diskret entry; inte flera före formuläret.
- Clean exit stänger direkt. Dirty edit-profile exit från header, bottom nav, Android back, hundbyte och Add Dog-entry ber om beslut; Add Dog-entry cancel behåller sidan/utkastet, confirm gör bara det begärda befintliga callbacket. Busy, profile pending/conflict, attribution busy/unresolved blockeras synkront. Add mode dirty cancel kastar endast lokal draft efter uttryckligt val; non-busy recovery kan lämnas tillbaka till profilen och återupptas i samma appsession med exakt payload och recovery actions, utan auto-retry. Cache rensas efter discard, lyckad create/resolution, explicit start another och konto-generationbyte. Initial mode Android-back blockeras synkront under create eller asynkron SecureStore request-ID-kontroll och kan annars lämna appen först efter bekräftelse; texten säger att formdata inte säkert överlever appomstart medan secure request-ID lämnas orört. iOS swipe-dismiss ingår inte.
- Regressioner bekräftar omedelbara navigationstryck under profil-/attributionswrite blockeras; stale scopes ignoreras; Add Dog-entry cancel håller route och fält, bekräftelse gör bara add callback; safe resume återställer exakt form, entrypoint och full recovery state. Matchande request ID ger snapshot-precedens före generisk ID→unknown; mismatch visar säker återställningsstatus utan gamla resolved actions eller automatisk retry. Tester bekräftar `existingProfile` (`resolvedShouldClearReferral=false`) och `sourceUnconfirmed` (`true`) med oförändrade actions/referral cleanup semantics; discard/create/start-another/account-generation change rensar endast den volatila cachen; initial Android back waits for recovery-ID read and create to finish, then requires explicit confirmation at dirty/recovery state; existing secure ID/referral storage är oförändrad.
- Renderad public och syntetisk review täcker active dog/switcher, create/edit, loading/error/kennel status, 375×667, 375×844, 430×844 och större textproxy; skärmbilder märks syntetiska. §14 skiljer komposition/täthet/färg/typografi/komponentform/bild från funktion.
- Full `pnpm check`, `pnpm bundle:ios`, `git diff --check`, kövalidering, oberoende QA, Security final review och oberoende Reviewer passerar innan checkpoint done. Native Dynamic Type/VoiceOver, live Supabase/RLS, faktisk persistens och TestFlight hålls till verifierade ägar-/miljöbevis; tidigare generella godkännanden omprovas inte eller utökas.

## Kontroller

- `node --experimental-strip-types --test tests/profile-screen-policy.test.mjs tests/profile-edit.test.mjs tests/profile-exit.test.mjs`
- `pnpm check`
- `pnpm bundle:ios` (använd byggkanal och content-guard som respektive bundle kräver)
- `git diff --check`
- `python -X utf8 tools/dev_flow.py validate`
- Visual-checkens faktiska public/review profilrender och §14-matris; ingen separat mockprofil ersätter verklig komponent.
- Risk H gäller att UI rör befintligt hundval och route-/utkastgräns. Architect planreview och Security pre/final behövs. Compliance, Dog Expert och innehållsgranskning behövs inte: ingen ny datakategori, ändamål, säkerhetsråd eller publicerat innehåll skapas.

## Planreview

1. Architect granskar denna exakta version och svarar `APPROVE / CHANGES / BLOCK` med fokus på hund-/route-scope, exit guard och pending/unknown-semantik.
2. Critic granskar förstavy, reducerad copy, begriplighet i kennelopt-in och discard-bekräftelse; en `STOP` blockerar.
3. Security gör pre-review av förflyttningen mellan aktiv hund, befintliga mutations och route guard. Inga data-/authändringar förväntas.
4. Vid Architect APPROVE, Critic utan STOP och Security APPROVE för denna v6: spara verdicts ordagrant, gå `planned → ready → implementing`, gör för-change `pnpm check` och implementera subtask 1. Efter separat QA/Reviewer och commit fortsätt med subtask 2.

## Antaganden/beslut

- Ägarens handlingsdirektiv och godkända actionplan gäller redan; inget nytt segmentgodkännande behövs.
- `DogProfileSwitcherSheet` är auktoritativ befintlig hundväljare; denna task ändrar inte dess listdata, ordning eller destination.
- `ProfileExitSnapshot` innehåller lokalt dirty `{ownerId, accountGeneration, dogId, profileDirty, kennelDirty}` och skickas synkront från fält-/mutationsevent. Parent avvisar stale scope; busy/pending/conflict/attribution status och in-flight refs läses från aktuell owner i parentens guard. `saveDogAttribution` sätter en ny `attributionMutationInFlight` ref synkront före första await, and clears it in `finally`; omedelbara navigationstryck läser refen.
- Route exit-policy: `clean → allow`, `dirty local drafts only → confirm`, `busy/profile pending/profile conflict/attribution busy/attribution unresolved → block`. Konflikt/pending löses med befintlig inline status/åtgärd innan route- eller hundbyte. Discard avmonterar bara lokalt formulärutkast.
- Dirty hundbyte och Add Dog-entry använder samma discard-dialog med destinationen angiven i rubrik/body; val avbryter utan routebyte, bekräftelse gör enbart existerande selection/add callback. Switcher/Add Dog är låsta endast vid busy/unresolved/conflict, inte dirty.
- Add mode: Avbryt är direkt vid clean, dirty ordinary form får discard-confirm, busy blockerar. Non-busy `unknown`, `sourceUnconfirmed`, `existingProfile`, `cleanupError`, `recoveryUnavailable` visar “Tillbaka till rätt ingång”; knapp och förklaring namnger korrekt återgångsyta (“Tillbaka till Hem” med switcher återöppnad respektive “Tillbaka till Hundprofil”). Utkastet finns kvar medan Tassla är öppet. DogWorkspace-cache scope är `{ownerId, accountGeneration}` och innehåller fält, ursprunglig `addEntryPoint` och recovery UI-context (`saveState`, resolved dog/request context, `resolvedShouldClearReferral`, `sourceCheckProblem`); när en scoped recovery snapshot finns återställs dess fulla status och recovery-åtgärder efter kontroll att dess request ID matchar SecureStore; generisk ID→unknown-effect får inte skriva över snapshoten. Om ingen snapshot finns används befintligt ID→unknown beteende. Ingen automatisk retry. Cachen clearas vid explicit discard, lyckad create/resolution, explicit start-another/new request och scope-byte. Cache cleanup får aldrig clear:a secure request ID/referral storage om inte den befintliga explicita start-another actionen gör det.
- Dialog får valfri `cancelLabel`, default `Avbryt`; alla existerande dialogs visuella standard och beteende förblir oförändrade.
- Profilens synliga fält/sektioner är stödflöde, inte panel 1-innehåll. Målbildens panel-1-stil styr enbart hierarki och tokens där inget profilkontrakt är mer specifikt.
- Android back hanteras av faktiska React Native BackHandler-instans i ProductWorkspace profile och ProfileScreen add/initial mode. Profil och Add Dog använder samma exit-policy i synlig navigation och native-back. Initial mode konsumerar back medan `operationInFlight.current` eller `recoveryCheckInFlight.current` är sant; därefter krävs bekräftelse för att lämna vid osparade/olösta uppgifter. Texten är tydlig med vad som överlever en omstart. Ingen iOS swipe-dismiss eller ny Expo route/back-stack läggs till.

## Granskningar av plan v6

- Architect: **APPROVE** — “v6 addresses the remaining recovery-state and back-handler races. The scoped snapshot now preserves the referral cleanup decision and entry point, and the SecureStore check determines whether restored recovery actions remain valid. The queue points to v6, stays `planned`, and matches the plan’s required tests and write paths. No files were changed.”
- UX Critic: **PASS** — “V6 addresses the remaining findings. Initial-create back is consumed during both create and recovery-ID reads; restart copy is conditional on a prior request. Add Dog recovery returns to the correct entry point, restores the full recovery state only when its request ID matches SecureStore, and does not retry automatically. The queue reflects these behaviors and lifecycle rules. The profile hierarchy, kennel opt-in, shared dog switcher, and destination-specific discard confirmation remain clear and consistent with the support-screen contract.”
- Security: **APPROVE** — “I reviewed the current v6 plan and matching queue. They cover the synchronous back locks, scoped recovery snapshot precedence after request-ID matching, referral semantics, and cache cleanup without clearing secure storage on discard. No new remote write path is implied.”
- Pre-change baseline: `pnpm check` PASS (TypeScript, edge TypeScript, ESLint, 74/74 tests); `git diff --check` PASS; `python -X utf8 tools/dev_flow.py validate` PASS. No app code had changed at the time of these checks.

## Lokal implementation — 2026-10-23

Den godkända v6-omfattningen är implementerad i de deklarerade skrivytorna. Profilfälten visas före valfri kennelredigering, skapa/ändra använder `DatePickerField`, hundbyte återanvänder den gemensamma switchern och route-/flik-/Android-back/Add Dog-utgångar läser en scope-bunden dirty snapshot. Add Dog-utkast återupptas endast efter matchning av owner, account generation och det säkra request-ID:t; ingen automatisk retry eller secure-storage-rensning vid discard har lagts till. Dialogens nya `cancelLabel` är additivt och behåller standardvärdet för övriga konsumenter.

Public och syntetisk review-render av de verkliga profilkomponenterna passerade 9/9 vardera vid 375×667, 375×844, 430×844 och en 140 % webtextproxy. `pnpm check` passerade TypeScript, edge TypeScript, ESLint och 75/75 tester. Public `pnpm bundle:ios` exporterade 1 583 moduler. `git diff --check`, verifierarens Python-kompilering och `python -X utf8 tools/dev_flow.py validate` passerade före commit.

Ägaren bekräftade 2026-10-23 att 01B redan är godkänd och granskad och bad att punkten stängs. Checkpointen stängs därför på ägarens rapport; separata QA-/Security-/Reviewer-protokoll skickades inte i denna session och tillskrivs inte här. Ägaren har tidigare bekräftat generell VoiceOver/Dynamic Type och Supabase/RLS. Den dokumenterade körningen verifierade inte separat SecureStore efter processomstart eller signerad/TestFlight-build. Profilen saknar egen målbildspanel och full rev02-panelmatchning hävdas inte. Se [render-/policyevidensen](../../design/evidence/vision-rev02/ui-r02-01b-profile-density/VERIFICATION.md).

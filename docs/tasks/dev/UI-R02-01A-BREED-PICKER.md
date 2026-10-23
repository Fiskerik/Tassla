# UI-R02-01A — gemensam sökbar rasväljare

Datum: 2026-10-23
Status: **ready — plan v2 godkänd av Architect och Critic; implementation startar efter baslinjeintegrering**
Paket: [UI-UX-REV02-ACTIONPLAN-2026-10-23.md](../UI-UX-REV02-ACTIONPLAN-2026-10-23.md), UI-R02-01 checkpoint 1
Fynd: GAP G01, med datakonsekvensen i G08
Panel/stödresa: Hundprofil, skapa hund och redigera hund
Risk: **M** — befintligt profilformulär och validering; ingen ny datamodell, migration, permission eller dataanvändning. Bevara ägar-/hundscope och befintlig villkorad skrivning.

## Mål

Ta bort de två långa inline-listorna och låt skapa och redigera öppna samma kompakta fält och sökbara lista. Ägaren ser valt namn, kan söka/rensa, kan välja från en enda rullbar lista och återvänder till samma formulär utan att tappa andra fält. Det finns inget förvalt alternativ för en ny hund.

Använd katalogen som appen redan hämtar. Den avbrutna Wikidata-exporten blockerar inte denna UI-del; full katalog och Mix följer D4 i huvudplanen. Bevara befintligt ras-ID. En äldre hund vars ras tillfälligt saknas i katalogen ska inte få sin ras ändrad eller bli omöjlig att spara när andra profilfält ändras.

## Bas och beroenden

- GitHub `main`: `eea0984aba44ef17707e7d583b3f9bf6b165c7ee`.
- GitHub `2026-10-22-panel7-insights-profile`: `90d0d704c610ade7946557bf5f3b75a9310ff63e` (merge med `main`).
- Lokal startpunkt före implementationsbranch: `3aeb6c9e77654d4437bcafe0ecc6c55f5efd59c2`. Den har tre lokala commits efter gemensam bas `89f04553756dd441f25c0def4bad8fe35fe8a86e`; GitHub-branchen har fyra andra commits efter samma bas. Starta den nya branchen från aktuell GitHub-branch och bevara lokalarbetet genom en granskad merge; force-pusha eller flytta inte fjärrbranchens spets. Nuvarande audit-/planfiler är obekräftade arbetsfiler och ska följa med oförändrade.
- Merge-trädet mellan lokal HEAD och GitHub-branchen har en känd innehållskonflikt i `tools/visual-check/verify-vision-r02-home-panels.py`. Lös den filen selektivt efter att auditfilerna checkpointats och hashats; lämna inga olösta konflikter och verifiera audit-diffarna efteråt.
- Före branchbyte skrivs en manifestfil med SHA-256 för varje dåvarande audit-/planfil under [evidensmappen](../../design/evidence/gap-ui-ux-2026-10-23/pre-branch-preservation.json). Efter integreringen jämförs filerna mot manifestet.
- Föreslagen branch: `2026-10-23-ui-01-profil` från den nuvarande panel-7-branchen. Lägg endast implementation av denna task på den; håll inga orelaterade queue-statusändringar i samma commit.
- Ingen ny extern dependency. Inget Supabase-schema-/RPC-/RLS-byte.
- Redan genomläst för denna plan: `docs/design-rules.md`, `docs/design/vision-rev02-screen-contracts.md`, `docs/plans/VISION-REV02-DOG-PROFILE-UX-SPEC-v2.md`, `docs/MVP-EXPERIENCE-CONTRACT.md`, `tassla-consumer-ux` och `mobile-ios-design`.

## Arkitektur och UI

1. Inför en delad onboarding-komponent, preliminärt `BreedPickerField`, som tar `readonly BreedOption[]`, vald ID, etikett för tomt/saknat värde, loading/error/disabled-läge, valcallback och retrycallback.
2. Stängt läge är en etiketterad tryckrad med valt rasnamn, plats-/saknatvärdestext och chevron. Öppet läge använder befintligt arkitekturmönster `BottomSheet`, men dess kropp måste kunna välja barn utan den nuvarande omslutande `ScrollView`. Lägg en opt-in scrollvariant till `BottomSheet` om det behövs: väljaren har sökfält och **en enda `FlatList`**. Lägg aldrig `FlatList` inuti sheetets `ScrollView`.
3. Sökningen filtrerar den redan hämtade katalogen lokalt. Rensa och tomt resultat är synliga handlingar/tillstånd. Vald rad markeras visuellt och med tillgänglig selection state. Rader, sökfält, rensa, stäng och trigger uppfyller minst 44 pt träffyta. Långa namn får radbrytas. Stängning utan val bevarar föregående värde.
   - Vid noll träffar ska huvudrasväljaren erbjuda **Okänd ras** som direktval, kopplat till katalograden med ID `unknown`. Det är ett tidigare ägarbekräftat krav i dog-profile v2 och migrationsseed; hitta raden från den hämtade katalogen och uppfinn inte ett alternativ/ID. Om katalogen saknar den raden visas inget falskt val.
4. `ProfileScreen`: ta bort `options[0]`-autovalet; behåll initialt tom ras och kräv aktivt val före ny registrering. Byt inline-listan till delat fält. Behåll befintlig last-/fel-/retryväg.
5. `EditDogProfileScreen`: byt inline-listan till samma delade fält. Om `dog.breed_id` saknas i den laddade listan visar fältet begriplig saknad etikett utan internt ID. Ägaren kan välja en listad ras, eller spara övriga profiländringar med oförändrat ID. Spara en okänd ras som ett *nytt* val är fortsatt förbjudet. Justera både skärmens nuvarande `save()`-guard (som annars stoppar före `onSave`) och `updateOwnedDog` så att bara oförändrat tidigare saknat ID tillåts. Testa båda lagren; ändra inte villkorad update, scope, preimage eller readback.

## Skrivytor och ägare

Implementer äger samtliga kodändringar för tasken:

- `src/features/onboarding/BreedPickerField.tsx` — ny delad väljare.
- `src/features/onboarding/ProfileScreen.tsx` — explicit nytt rasval och användning av fältet.
- `src/features/onboarding/EditDogProfileScreen.tsx` — användning av fältet, bevarande av saknat gammalt ras-ID.
- `src/components/ui/BottomSheet.tsx` — endast en avgränsad opt-in variant om listan behöver direkt ägarskap över scrollning; befintliga sheet-konsumenters standardbeteende ändras inte.
- `src/data/app-data.ts` — bara den smala regeln att tillåta samma förra ID när ID saknas i katalogen.
- `src/features/onboarding/README.md` — rasväljare, sökning, saknat äldre ID, entrypoint och verifiering.
- `tests/profile-screen-policy.test.mjs`, `tests/profile-edit.test.mjs`, `tests/app-data.test.mjs` — uppdatera verkliga förväntningar och lägg till regression för gammalt ID i både skärmens spara-guard och `updateOwnedDog`; eventuell liten separat komponentmodelltest om logik extraheras.
- `tools/visual-check/vision-r02-home-panels-app.tsx` samt relevanta `tools/visual-check`-/evidensfiler — syntetisk 1/24/24+ rasfixture och renderad pickeröppning om nuvarande reviewrunner stöder profilstates.
- `docs/tasks/dev/UI-R02-01A-BREED-PICKER.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/decisions/MASTER-LOG.md` — denna plan och endast de faktiska statusövergångar/checkpoints som repots verktyg och process kräver.

Inga andra paketfiler öppnas för ändring utan ny planreview. `ProductWorkspace.tsx`, auth, kennelkoppling, ålders-/Mixmodell och Hemmets vyer förblir oförändrade om inte en konkret blockerare bevisas; då pausas implementeringen för att uppdatera aktuell planversion.

## Acceptance

### Funktion

- Samma UI och samma `BreedOption`-ID i skapa och redigera. Listan visas inte längre på profilens huvudyta.
- För ny hund: tomt initialvärde; Spara kan inte köras förrän ägaren valt ett alternativ. Öppna/stäng utan val påverkar inte formuläret.
- Sök träffar/inga träffar, rensa sökning, valt/ovalt, lång etikett, list-scroll, stäng och retry på katalogfel. Sökningen gör inga nätverksanrop.
- Vid tomt sökresultat går det att välja den befintliga katalograden `unknown` (“Okänd ras”); det sparas med dess riktiga ID. Om den raden saknas visas bara ett ärligt tomt resultat.
- Profilnamn, datum, ålder, kennelval och sparning behåller värden när rasväljaren öppnas/stängs eller söks.
- Befintlig listad ras kan bytas och uppdateras enligt nuvarande villkorade write/readback.
- Saknad äldre ras visas utan internt ID. Att ändra namn/datum/åldersenhet och spara med samma saknade `breed_id` bevarar ID:t. Att ändra till ett annat ID som inte finns i katalogen stoppas före nätverksanrop.
- Skärmens spara-guard och datalagrets validering har var sin regression för saknat gammalt ID; en ändring till annat okänt ID stoppas före nätverksanrop.
- Förlorat/okänt sparresultat och andra profilkonflikter följer befintlig säkra väg. Detta är inte en ny profil- eller Supabase-acceptans.

### Visuell/tillgänglighet

- Syntetiska före/efter-renderingar av stängt fält och öppnad lista vid 375×844, 430×844 och 375×667. Visa få träffar, 24 alternativ, lång etikett, ingen träff och större textproxy. Markera alla fixtures som syntetiska.
- Bekräfta referenshierarki och färg-/komponentstil i det relevanta profilkontraktet. Skärmsidan visar bara valt rasfält; sökfältet ligger fast när listan rullar. Sheet har en rubrik, ett stängkryss och rimlig höjd.
- Ingen klippt text, nästlad scrollvy, dold stängning, tappad fokus/vald-status eller träffyta under 44 pt. Webbrendering ersätter inte native Dynamic Type-/VoiceOver-pass.

## Kontroller

- Riktade: `node --experimental-strip-types --test tests/profile-screen-policy.test.mjs tests/profile-edit.test.mjs tests/app-data.test.mjs` plus nya picker-modeltester om de tillkommer.
- Paketets slutkontroll: `pnpm check`, `pnpm bundle:ios`, `git diff --check`.
- Rendera jämförbara fixtures med den aktiva visual-check-verktygskedjan och spara exakta viewport/state/SHA i `docs/design/evidence/`. Gör en review av **samma komponent** i flödet och fixturen; syntetisk fixture verifierar inte produktionskatalogen eller iOS runtime.
- QA kontrollerar lyckat val, sök/tom lista/stäng/retry, okänt befintligt ID, att inga andra fält tappas, tangentbord/liten skärm och minst ett bredd-/textläge. Oberoende Reviewer granskar stabil diff efter QA. Ingen ny live DB-verifiering behövs; markera den ej berörd, inte omprovad PASS.

## Grind och nästa steg

1. Architect granskar plan v2 och returnerar `APPROVE / CHANGES / BLOCK` med konkreta API-/scroll-/valideringsinvändningar. Critic granskar användaruppgift, målbild och avgränsning. Båda svaren sparas här ordagrant/sakligt.
2. Vid Architect `APPROVE` och utan Critic `STOP`: registrera planreview, uppdatera korrekt queue-post med befintligt `dev_flow.py`, skapa implementationsbranch från GitHub-bas och sammanför de tre lokala commitsen med senaste branch utan force-push. Lös konflikter selektivt och kör `pnpm check` före rasändringen så att integrationsfel skiljs från taskfel.
3. Implementera, uppdatera README och visuellt underlag; kör kontrollerna ovan. Vid planavvikelse, schema-/authändring eller annan skrivyta: stoppa kodning och få plan v2 granskad.
4. QA → oberoende Reviewer. Vid riktiga PASS sparas resultat, exakt SHA, commit och faktisk branch/buildstatus. Först därefter startar UI-R02-01:s nästa del (profilens täthet/avslutning) enligt huvudplanen.

## Beslut / reviewlogg

- V1 Architect: `CHANGES` — skärmens `save()`-guard måste tillåta oförändrat saknat legacy-ID, parallellt med den smala `updateOwnedDog`-regeln; regression på båda. Noterade även känd selektiv mergekonflikt i visual-check-scriptet och checkpoint/hash av auditfiler.
- V1 Critic: `PASS` för den ursprungliga avgränsningen; den reviewn ersätts av v2-reviewn.
- V2 Architect: `APPROVE`. Citat: “The opt-in `BottomSheet` scroll path keeps `FlatList` out of the existing `ScrollView`, and the plan preserves default sheet behavior. The branch plan starts from the current remote tip, preserves the three local commits and audit files, names the known visual-check conflict, and requires a pre-change check.” Architect bekräftade också att fetched `BreedOption` med ID `unknown` fungerar utan ny modell/API och att både UI-guard och datavalidering behöver testas.
- V2 Critic: `PASS`. Citat: “when search returns no matches, it offers the existing `unknown` catalog row as ‘Okänd ras.’ It uses the fetched row’s real ID, and shows no choice if that row is absent. The new-dog form still has no default selection.” Critic bekräftade att båda lagren bevarar endast oförändrat saknat ID och stoppar andra okända ID före skrivning.
- v2 är godkänd. Planens ursprungliga UI-/datascope består; implementation börjar efter baslinjeintegrering och pre-change `pnpm check`.
- Ägarens uttryckliga UI-prioritering: lång inline-raslista ska bli en sökbar rullista. Actionplan D4 säger att UI kan använda befintlig katalog innan full export/Mix är klar.

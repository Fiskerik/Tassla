# UIUX-REVAMP-R1C-PROFILE-DRAFT-01 — skydda Hundprofilens utkast

Version: 4\
Status: done; Architect, Critic, Security, QA and Reviewer PASS\
Risk: H — unknown kennel-write får parent-ägt in-memory intent med befintlig owner-scoped readback; ingen ny lagring, RPC, profilkolumn eller dataavsikt.

## Mandat och underlag

Detta är nästa avgränsade F02-checkpoint i `docs/plans/UIUX-REVAMP-MASTERPLAN-2026-10-16.md`, efter R1b och befintliga `APP-04C-PROFILE`-kontraktet. MVP v2 gäller. Utseende följer `docs/design-rules.md` och stödskärmsreglerna i `docs/design/vision-rev02-screen-contracts.md`; interaktion följer `.agents/skills/tassla-consumer-ux/SKILL.md`. Ingen ny funktion, dependency, profilkolumn, RPC, ändamål eller behörighet ingår.

## Ägaruppgift

Ändra hundprofilens namn, ras, födelsedatum, åldersvisning och eventuella kennelkoppling utan att en oavsiktlig tillbaka-/flikresa kastar bort den lokala inmatningen. Ägaren kan uttryckligen välja **Avbryt ändringar** för att lämna och kasta de lokala fältändringarna.

## Plan v4 (ingen kod före planreview)

1. Lägg till små rena jämförelsefunktioner för profilfält och separat redigerbar kennelcode. Namn normaliseras med befintlig profilnormalisering; datum och kennelcode jämförs efter befintlig trim/versalisering; ras-id och åldersenhet jämförs exakt. Ogiltig men faktiskt ändrad lokal inmatning är fortfarande dirty. Återställning till sparat värde blir clean. Parent-ägt profile-pending och kennel-unknown intent är återhämtningstillstånd, inte lokala utkast.
2. `EditDogProfileScreen` registrerar en stabil owner-token-guard med `ProductWorkspace.registerEditorLeaveGuard`. Cleanup får bara avregistrera den egna ägaren. Guardens ref används i eventhandlers, så rerender skapar inte stale draft-/routevärden.
3. Headerns tillbakaåtgärd, huvudfliksval och svep frågar **Osparade ändringar** / **Vill du lämna utan att spara?** med **Stanna kvar** och destruktiva **Lämna utan att spara**. Stay har noll rout-/form-/attributionssidoeffekter. Med en öppen dialog låses första destinations-callbacken och senare begäranden ignoreras. Bekräftelse går bara till den första begärda destinationen. Samma aktiva flik ska vara no-op genom befintligt main-navigation-kontrakt.
4. Androids system-back från den monterade `EditDogProfileScreen` använder samma guarded väg tillbaka till Mer. Registrera `BackHandler` där och rensa listenern vid unmount; ingen ProductWorkspace-global listener och inga andra sidor får ny system-backsemantik. Native knapp/Alert beteende redovisas som NOT TESTABLE i webbharnessen.
5. Den direkta discard-knappen heter **Avbryt ändringar** när det finns ett lokalt utkast att kasta och **Stäng** annars. Ett låst parent-ägt unknown-intent räknas inte som lokalt dirty: unknown-intent ensamt visar **Stäng**; tillsammans med separata dirty profilfält visas **Avbryt ändringar**, som bara kastar profilfälten. Motsvarande gäller dirty kennelinput bredvid profil-unknown. Knappen får aldrig radera parent-ägt kennel- eller profil-intent och kör aldrig save. Alla utträden blockeras medan en profil- eller attributionswrite pågår. Parent-ägda statusar/intent nollställs inte vid cleanup.
6. Följande tillståndssemantik gäller:

| Tillstånd | Navigering | Status och återhämtning |
| --- | --- | --- |
| Profile- eller attribution-write `busy` | Blockeras tills nätverksanropet avslutas. Även **Avbryt ändringar** är disabled. | Formvärden ligger kvar i editorn. |
| Profil `unknown/pending` | Låsta profilfält för försöket räknas inte som lokalt dirty. Separat smutsig kennelinput skyddas fortsatt av guarden. | `ProductWorkspace` behåller befintligt preimage/intent; återbesök kan kontrollera status eller lösa konflikt enligt APP-04C. Inga osparade kenneländringar ingår i profilintentionen. |
| Profil `failed` | Dirty profilutkast skyddas av dialogen. | Befintligt fel och inmatning ligger kvar för ägarens retry eller discard. |
| Kennel `unknown` | Parent-intent och låst attempted code/borttagningsförsök räknas inte som lokalt dirty; separat smutsig profilinput skyddas fortsatt av guarden. | Länkning visar **Vi kunde inte kontrollera om kennelkopplingen sparades.** Borttagning visar **Vi kunde inte kontrollera om kennelkopplingen togs bort.** Återbesökt formulär låser fältet och erbjuder **Kontrollera kennelkopplingen** via befintlig owner-scoped fetch före ny write. |
| Kennel readback matchar attempted code | Tillåts. | Operation bekräftas, attempted intent rensas och aktuell koppling visas som sparad. |
| Kennel readback skiljer sig från attempted code | Tillåts utan automatisk write. | Intent och attempted code bevaras. Visa serverns aktuella status som **Kopplad till {namn}** eller **Ingen kennelkoppling**, med **Kontrollera igen** och **Använd aktuell koppling**. Först efter explicit val rensas intent. Ny write kräver ny explicit Spara-handling. |
| Kennel `failed` | Dirty kod skyddas av dialogen. | Koden och felmeddelandet ligger kvar; ny write sker endast efter ägarens uttryckliga Save. |

7. Kennelns attempted intent är ett taggat objekt i `ProductWorkspace`: `{ ownerId, accountGeneration, dogId, attemptedCode, operationId }`. `attemptedCode` är `string | null`; frånvaro av intent representeras endast genom att intent-objekt saknas. `operationId` identifierar det enskilda försöket så sent svar bara kan påverka sin egen intent. Intenten finns endast i minnet.
8. Bekräftad kennelkoppling/lässtatus och aktiv write är också scope-taggade med `{ ownerId, accountGeneration, dogId }`; write har dessutom operation token. Härled alla attribution-props till `EditDogProfileScreen` från en scoped vy: om state-scope inte exakt matchar aktuellt scope visas loading/null/not-busy utan att föregående kod, ready/error-state, meddelande eller busy-indikator renderas ens en gång. Scope innehåller autentiserad owner id, `accountGeneration` och dog id; befintlig `currentProfileLifetime` får inte återanvändas eftersom den saknar account generation.
9. Varje attribution-write och readback fångar hela scopet före await. Resultat, error/message, busy-clear och intent-clear tillämpas endast om scope och operation token fortfarande matchar; stale completion kan aldrig ändra eller rensa nyare state. Scopebyte filtrerar gammalt state omedelbart före rendering och rensar det efteråt. Readback fångar även det intent `operationId` som den kontrollerar, så en senare intent i samma scope inte kan rensas av ett äldre svar.
10. Kennelns statuskontroll använder enbart befintlig owner-scoped `fetchOwnedDogAttribution`. Matchning jämför code exakt efter normalisering, inklusive `null === null` för bekräftad borttagning; mismatch bevarar intent tills ny kontroll eller explicit **Använd aktuell koppling**. Statuskontrollen anropar aldrig `updateOwnedDogAttribution` eller skriv-RPC. Ingen lokal eller persistent storage används.
11. Ingen profil-, content-, auth-, RLS-, samtyckes-, attribution- eller persistenspolicy ändras. Befintlig `set_owned_dog_attribution`-mutation och `fetchOwnedDogAttribution`-read används oförändrade. Ingen profiländring, kennelkoppling eller event samlas in automatiskt.

## Skrivvägar

- `src/features/onboarding/EditDogProfileScreen.tsx`
- `src/features/home/ProductWorkspace.tsx`
- `src/features/onboarding/profile-draft.ts` (ny liten pure helper-modul)
- `tests/profile-draft-guard.test.mjs` (nya rena jämförelse-/guardtester)
- `tests/profile-edit.test.mjs` (befintliga profil-/återhämtningsregressioner vid behov)
- `tools/visual-check/app.tsx`
- `tools/visual-check/verify.py`
- `tools/visual-check/README.md`
- `docs/tasks/dev/UIUX-REVAMP-R1C-PROFILE-DRAFT-01.md`
- `docs/plans/UIUX-REVAMP-R1C-PROFILE-DRAFT-01-ux-spec.md`
- `docs/tasks/dev/queue.json`
- `docs/tasks/dev/rapport.md`
- `docs/decisions/MASTER-LOG.md`
- `docs/design/evidence/vision-rev02/profile/R1C-PROFILE-DRAFT-01/`

Ändra inte `src/data/app-data.ts`, schemas, RPC, migrations, policies, onboardingens profilskapande eller andra stödformulär i denna checkpoint. Om befintlig återhämtning kräver en utökning måste planen omgranskas före kod.

## Acceptans

- Dirty är kanoniskt för samtliga lokala hundprofilfält samt kennelcode; invaliditet påverkar inte jämförelsen och revert ger clean.
- Header-back, aktiv flikbyte, svep och Android system-back skyddar dirty input. Stay är utan sidoeffekter; bekräftad lämning går till exakt första valda destination; upprepade routes medan dialogen visas kan inte byta destination.
- Samma aktiva flik ändrar inte route eller formulär. Den direkta knappen heter **Avbryt ändringar** bara när separat lokal input är dirty, annars **Stäng**; parent-ägt unknown-intent räknas inte som lokalt dirty. Knappen är disabled under båda writes och sparar aldrig.
- Guarden registreras/avregistreras säkert med owner-token och läcker inte in i övriga profil-/Mer-vyer.
- Busy profile/attribution write blockerar alla utträden. Profil-unknown behåller befintligt parent-intent/preimage och statuskontroll efter navigering.
- Kennel-unknown bevarar en taggad intent `{ ownerId, accountGeneration, dogId, attemptedCode: string | null, operationId }` i workspace-minne; saknad intent är skild från unknown-borttagning. Även confirmed read-state och aktiv write är scope-taggade; samtliga attribution props filtreras före render, och gammal completion får endast ändra sin scope/token. **Kontrollera kennelkopplingen** gör endast readback: code-match eller exakt null-match bekräftar; mismatch visar aktuell koppling/ingen koppling med **Kontrollera igen** och **Använd aktuell koppling**, och bevarar intent tills recheck eller explicit val. Link/removal använder varsin specificerad statuscopy. Ingen blind/dubbel write sker.
- Kennelkoppling sparas endast efter separat knapptryck. Tester täcker unknown-link och unknown-removal med readback-match, mismatch, aktuell serverstatus, stale konto-/generation-/hundscope, synkron renderfiltrering, write/read operation tokens och att statuskontroll aldrig startar en write. Actual-component-provet täcker unknown removal ensamt (**Stäng**) och ihop med dirty profilfält (**Avbryt ändringar**; intent bevaras). Profilutkastskydd får inte godkänna, spara, återkalla eller ändra samtycke.
- Public/review-fixturn renderar den riktiga `EditDogProfileScreen` med rena/dirty/revert/stay/discard/fel/pending-states och verifierar route callback; viewport 375×844, 430×844, 375×667 samt 140 % textproxy där stödd. §14 skiljer funktionell PASS från visuell NOT TESTABLE där editorreferens saknas.
- Profilens befintliga validering, save/readback/conflict, derived-content refresh och kennel-RPC-kontrakt försämras inte. Tester verifierar kennel write-unknown→readback-match, mismatch, sent svar/lifetime, explicit use-current samt att statuskontroll inte startar en ny write.

## Kontroller

- `node --experimental-strip-types --test tests/profile-draft-guard.test.mjs tests/profile-edit.test.mjs tests/main-navigation.test.mjs`
- Public/review `tools/visual-check` build och fokuserad profil-draft verify
- `pnpm check`
- `python -m py_compile tools/visual-check/verify.py`
- `python tools/dev_flow.py validate`
- `git diff --check`
- Security review av owner-scoped readback-state slutfördes före implementation med PASS v4. Oberoende QA och Reviewer krävs före done.

## Bevisgräns

Syntetiska RN Web-fixtures verifierar callbackkedjan och komponentrenderingen, inte native Alert, Android BackHandler på en telefon, VoiceOver/Dynamic Type, tangentbord, live Supabase/RLS eller installerad build. Dedikerad editorpanel saknas i rev02-bilden; §14 punkt 16 ska redovisa korrekt referensgräns i stället för att hävda direkt pixelmatchning.

## Granskningsprotokoll

- Implementer-plan v1: Architect APPROVE med konkretiseringar om guardägarskap/busy-state; Critic PROCEED WITH CHANGES och upptäckt av saknad parent-intent/kontroll vid kennel write-unknown.
- Plan v2 Security-granskning: CHANGES REQUIRED. Krävdes full scope med `ownerId`, `accountGeneration` och `dogId` inklusive renderfilter och write-resultatets scopefence; unknown-borttagning måste representeras som taggad intent med `attemptedCode: null`, skild från frånvarande intent.
- Plan v3 review: Security PASS, Architect CHANGES och Critic PROCEED WITH CHANGES. Arkitekt fann att confirmed attribution/read/busy state ännu inte var scoped; Critic bad om att unknown-intent inte räknas som local dirty och om exakt länk-/borttagningscopy samt synlig serverstatus vid mismatch.
- Plan v4: scope-tagger för confirmed/read/busy state och operation tokens, synkron renderfilter, separat lokalt dirty state, exakt unknown copy/mismatchstatus och actual-component-tester. Architect APPROVE v4, Critic PROCEED v4 och Security PASS v4.
- Implementation och oberoende QA verifierade: fokuserad svit 47/47; `pnpm check` 524/524; public/review profile-draft 12/12 vardera; verifierarens Python-syntax, kövalidering och diffkontroll godkända. QA rapporterar PASS utan kodändringar. Oberoende Reviewer PASS utan fynd. Public/review-bilder och §14-bedömning sparas i evidence-mappen. Native Alert/system-back, live Supabase/RLS och direkt editorjämförelse mot rev02 är NOT TESTABLE.

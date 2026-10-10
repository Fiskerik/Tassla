# FIX-38 — Toast lintfel och obligatorisk Git preflight

Datum: 2026-10-10. Status: FIX-38A–C implementerade och verifierade; FIX-38D inväntar leveranscommit och push. Bas: `3585c59` (`origin/remove-ai-slop`). Underlag: bifogad `Tassla_38_artifacts.zip`, endast CodeMagic-logg; den innehåller ingen projektinstruktion. Loggen visar 33 ESLint-fel i `Toast.tsx`, huvudsakligen `react-hooks/refs` (ref-läsning/skrivning under render) och ett `react-hooks/set-state-in-effect` vid synkront `setPhase('visible')` i effect.

## Mål och avgränsning

Åtgärda `pnpm check`-felet utan lint-undantag eller avstängda tester, och få kvalitetsgrinden att köras före varje commit och push i den här klonen och i kloner där hookinstallationen körts. Gör den nya `AGENTS.md`-texten konkret och handlingsbar. Inga nya beroenden och inga orelaterade UI-/produktändringar.

Toast är återkoppling efter en användarhandling: synligt bekräftar den resultat och kan visa Ångra/Försök igen/Avbryt; vid utgång försvinner den och anropar ägarens callback. Ändringen ska behålla befintligt utseende, copy, tillgänglighet, reducerad-rörelse-beteende och timer-/callbackkontrakt. Läs `docs/design-rules.md` och `.agents/skills/tassla-consumer-ux/SKILL.md` för beteende, tillstånd och återkoppling. UX-specifikationen finns i `docs/plans/FIX-38-ux-spec.md`. Ingen avvikelse från befintligt visuellt mål avses. Visuell QA ska dokumentera renderad jämförelse enligt designpolicyn; saknas lokal rendering eller relevant målbild ska den markeras NOT TESTABLE, aldrig PASS.

## Deluppgifter

### 1. FIX-38A — Render-pure Toast och CodeMagic-felet

- **Ägare:** Implementer. **Beroenden:** plan v3 Architect APPROVE och Critic PROCEED.
- **Berörda filer:** `src/components/ui/Toast.tsx`, relevanta befintliga tester vid behov, `docs/plans/FIX-38-ux-spec.md`, denna plan och `docs/releases/FIX-38.md`.
- **Acceptans:** ta bort render-tidsref-läsning/skrivning och synkron state-uppdatering i effect utan att ändra synlig eller utgående Toast-semantik. Inga lint-suppressioner och inga tester inaktiveras.
- **Verifiering:** `pnpm check`; uppdatera endast verifierat föråldrade källkodsmönster i policytest (aldrig inaktivera test); riktade tester om ändrat; `git diff --check`; separat QA/Reviewer kontrollerar tillstånd, callbacks, timer och reducerad rörelse. Produktuppgift/copy/visuellt mål förblir oförändrade. Separat QA kontrollerar relevanta toasttillstånd vid liten/stor mobilbredd och stor text, skärmläsaretiketter, dynamisk text och reducerad rörelse. Fyll i tillämpliga punkter i design-reglernas checklista. Spara skärmbilder och checklista i `docs/design/FIX-38/`; markera varje saknad rendering, baslinje, tillstånd eller tillgänglighetsmiljö NOT TESTABLE med orsak.

### 2. FIX-38B — Obligatorisk Git-hook och policy

- **Ägare:** Implementer. **Beroenden:** FIX-38A passerar `pnpm check`; före första commit i detta arbete installeras hookarna först efter att den korrigerade arbetskopian passerat grinden.
- **Berörda filer:** `.githooks/pre-commit`, `.githooks/pre-push`, idempotent installationsskript eller dokumenterat npm-/pnpm-kommando, `AGENTS.md`, `docs/tasks/dev/queue.json`, denna plan och `docs/releases/FIX-38.md`.
- **Acceptans:** pre-commit kör `pnpm check` och `git diff --cached --check` och stoppar commit vid fel. Pre-push kör `pnpm check` och `git diff --check <old> <new>` för varje ref som pushas; för en ny remote-branch med nollad gammal remote-SHA jämförs tomt Git-träd mot ny lokal SHA; för borttagen lokal ref med nollad ny local-SHA hoppas endast den ref-diffen över, medan `pnpm check` fortfarande körs. Hookarna är versionshanterade och körbara; installationen sätter `core.hooksPath=.githooks`. `AGENTS.md` kräver kontroller före varje commit och push, dokumenterar aktivering per klon och förbjuder att hookar eller tester hoppas över. Hookarna körs vid vanliga Git-operationer i kloner där de installerats; `--no-verify` kan kringgå Git-hookar men får inte användas.
- **Verifiering:** installera hookarna efter att FIX-38A:s `pnpm check` passerat och kontrollera `git config --get core.hooksPath`. Testa installationen i ett separat tomt lokalt testrepo; testa också att ett felande kontrollkommando stoppar både commit och push med ofarliga testkommandon. Verifiera whitespace-kontrollen för ny och befintlig ref samt borttagen lokal ref. Kör `git diff --check` och `python tools/dev_flow.py validate`.

### 3. FIX-38C — Oberoende QA och review

- **Ägare:** QA, därefter Reviewer. **Beroenden:** FIX-38A och FIX-38B färdiga; hooks installerade och aktiva.
- **Berörda filer:** hela FIX-38-diffen, taskplan, köpost och release-logg.
- **Acceptans:** oberoende beteende-, policy- och hookgranskning PASS; visuellt resultat dokumenterat PASS eller NOT TESTABLE enligt designpolicyn; release-loggens checkpoints, ändringslistor, verifiering och nästa steg hålls uppdaterade.
- **Verifiering:** kör `pnpm check`, `pnpm bundle:ios`, `git diff --check`, `python tools/dev_flow.py validate` samt negativa hooktester. Markera faktisk miljöbegränsning NOT TESTABLE i stället för att påstå PASS.

### 4. FIX-38D — Leverans till GitHub

- **Ägare:** Koordinator. **Beroenden:** FIX-38C QA och Reviewer PASS; release-logg och köpost uppdaterade; lokala hookar aktiva.
- **Berörda filer:** leveranscommit på `remove-ai-slop`; `docs/tasks/dev/FIX-38.md`, `docs/tasks/dev/queue.json`, `docs/releases/FIX-38.md` uppdaterade med commitresultatet.
- **Acceptans:** skapa commit med normala hookar aktiva och pusha den till `origin/remove-ai-slop`. Bekräfta pushad commit och att branchen är uppdaterad. GitHub Release skapas inte för den här rättningen.
- **Verifiering:** hookarna kör sina kontroller under commit/push; därefter jämför lokal och remote branch-head och rapportera commit SHA.

## Review

Plan v1 fick Architect CHANGES och Critic CHANGES. Plan v2 fick Architect CHANGES och Critic CHANGES. Plan v3 har Architect APPROVE och Critic PROCEED för exakt v3 (bekräftat av koordinatorn).

### Checkpoint FIX-38A — 2026-10-10

Den första FIX-38A-kontrollen blockerades eftersom workspace saknade länkade dependencies och pnpm fick nätverksåtkomstfel (`EPERM`) vid hämtning av package registry-metadata. Detta var ett tillfälligt läge, inte slutresultatet. Efter att dependencies installerats med fryst lockfil kördes kontrollerna framgångsrikt; se senare FIX-38A–C-checkpoint nedan. Under arbetet uppdaterades tre föråldrade statiska källkodsförväntningar i befintliga policytester efter att deras antaganden verifierats mot aktuell implementation. Inga tester inaktiverades, inga lint-undantag eller nya dependencies tillkom. Visuell QA utfördes senare av separat QA och är markerad NOT TESTABLE där miljö/rendering saknades.

## Release-logg

`docs/releases/FIX-38.md` skapades före implementation. Uppdatera den vid varje checkpoint med datum, paket-ID/status, bas- och leveranscommit, Major changes, Minor changes, Bug-fixes, verifiering, nästa steg, TestFlight build/version (eller Not applicable) och GitHub Release-status. Ange uttryckligen när leveranscommit/build ännu är okänd; GitHub Release skapas inte.

## Checkpoint 2026-10-10 — FIX-38A och FIX-38B

- FIX-38A genomförd: render-tidsref-åtkomst ersatt med effects och villkorlig state-justering; exakt en exit-callback skyddas av `exitPending`/`exitNotified`, inklusive reducerad-rörelse-växling medan dold. Tre föråldrade statiska källkodsförväntningar uppdaterade till aktuellt kontrakt; inga tester avstängda.
- FIX-38B genomförd: versionshanterade pre-commit/pre-push-hookar, idempotent `tools/install-git-hooks.sh`, `AGENTS.md`-policy och aktiv lokal config `core.hooksPath=.githooks`.
- Verifiering: `pnpm check` PASS (395 pass, 1 skip, 0 fail; ESLint 0 errors/35 warnings); `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS; `git diff --check`; `python tools/dev_flow.py validate`; hooktester i separata tomma Git-repon för installation, fail-closed, staged whitespace, ny/existerande ref och borttagen ref PASS.
- Oberoende QA PASS. Visuell rendering, VoiceOver/TalkBack, stor text och fysisk enhet är NOT TESTABLE; dokumenterat i `docs/design/FIX-38/checklist.md`.
- Nästa steg: Reviewer gör oberoende granskning; därefter commit med aktiv hook och push till `origin/remove-ai-slop`.

### Checkpoint FIX-38D — 2026-10-10

- Oberoende Reviewer PASS; dokumentationens tidigare motsägelse korrigerad före commit.
- Commit `2198e55ed20a1a60aaafca0c9364c6dc3a523bae` skapad med aktiva pre-commit-hookar: `pnpm check` och staged whitespace-kontroll passerade.
- Push till `origin/remove-ai-slop` passerade aktiva pre-push-hookar: `pnpm check` och whitespacekontroll för refen passerade. Efter fetch bekräftades att lokal `HEAD` och `origin/remove-ai-slop` båda pekar på leveranscommitten.
- FIX-38 flyttad från review till done med Reviewer-roll och verifieringsunderlag i köhistoriken. Visuell/device QA kvarstår NOT TESTABLE; ingen TestFlight-build eller GitHub Release skapades.

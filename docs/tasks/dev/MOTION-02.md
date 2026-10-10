# MOTION-02 – Bekräftad rörelse i Logga och Träning

Datum: 2026-10-10
Planversion: v4 – Architect APPROVE, Critic PROCEED; correction contract APPROVE/PROCEED
Bascommit: `4267d457` (`origin/main`)
UX-spec: [MOTION-02](../../plans/MOTION-02-ux-spec.md)
Beslut: [0004 – MOTION-paketet](../../decisions/0004-motion-package.md)

## Mål

Lägg till återhållsam rörelse i Logga och publicerad Träning endast när datan bekräftar en sparad ändring. Behåll felhantering, dubbeltrycksskydd, dubblettfråga, undo och sparkontrakt.

## Beroenden och mandat

- Erik har uttryckligen beställt MOTION-slicarna och bett att arbetet fortsätter; beslut 0004 säger att arbetet ska stanna efter varje slice för telefonprov.
- Erik rapporterar att senaste `main`-push/merge är telefon-QA:ad och att tidigare Olycka-sparfelet nu fungerar. Resultatet är användarrapporterat; build/version och skärmbilder är inte bifogade.
- Erik rapporterar att LOGGA-EDIT och senaste `main` är telefon-QA:ade och att Olycka nu sparar. Detta registreras som ägarrapporterat resultat; build/version och skärmbilder saknas. Tidigare QA-/evidensstatusar skrivs inte om till oberoende PASS.
- Föregångarnas kod-/QA-status och användarrapport dokumenteras i kön före `planned → ready`. Implementationen startar först när MOTION-01 och LOGGA-EDIT har avslutats enligt arbetsflödets grind; användarrapporten ändrar inte själv oberoende QA/reviewer-status.
- Ingen annan aktiv writer får dela de listade filerna.

## MOTION-02B – Implementeringscheckpoint

- Reviewer blockerade första granskningen på att entréanimationen kunde spelas igen efter reduced-motion-toggle. Korrigeringen konsumerar mutationsnyckeln vid start och avslutar aktiv rörelse direkt när reduced motion slås på; off-toggle spelar inte om samma mutation. Namngiven policy-regression finns i `tests/motion-policy.test.mjs`.
- Architect APPROVE och Critic PROCEED för korrigeringskontraktet. Båda README-filerna i write paths: delad `ListRow`-API i component guide och loggens one-shot/reduced-motion i puppy-log guide. Ingen ändring av UX-kontraktet eller animationstillstånd i ProductWorkspace.
- Loggens add-animation startar en gång när sparad mutation och rad-ID finns tillsammans; ett redan sparat mutationstillstånd vid första renderingen animeras inte.
- Raderingssnapshotten ersätter källraden i datumgruppen, är inaktiv med `busy`/`disabled` skärmläsartillstånd medan försöket pågår och döljs från skärmläsaren under exit. Endast `true` från `onDelete` startar exit. Callback och snapshot-token måste matcha; reducerad rörelse tar bort snapshotten direkt.
- Träningsbekräftelsen returnerar bara exakt identitet efter lyckad befintlig omläsning där steget inte redan var klart och nu finns i det publicerade programmets framsteg. `PublishedTrainingScreen` opt-in-animerar endast den matchande `ListRow`; klart-status hörs som “Genomförd”. Ingen animationstate lades till i `ProductWorkspace`.
- Städpass: animerad bock isolerades i `CompletionMark` så vanliga listor inte får onödiga rörelseprenumerationer; importer och testassertioner är uppdaterade. Ingen ny dependency eller ändring av QuickLogTile/dubblettfönster.
- Färsk lokal kontroll efter korrigeringen: `TZ=Europe/Stockholm pnpm check` PASS, 399/399 test, 0 skip, lint 0 errors/35 warnings; `EXPO_NO_TELEMETRY=1 pnpm bundle:ios` PASS; riktade 4 policyfiler PASS; `git diff --check` och queue validation PASS.
- Förnyad oberoende **Code QA PASS** på korrigerad fryst diff. QA körde fyra riktade policyfiler och `git diff --check` själv; bekräftade key consumption och no-replay, saved-only gating, delete-snapshot outcome/accessibility, exact training read-back/identity och oförändrade dubblettfönster. Full check/iOS export kördes separat av koordinatorn.
- Oberoende **Reviewer PASS** på korrigerad diff; inga kodfynd. Granskningen bekräftar att den tidigare reduced-motion-replay-buggen är stängd och verifierar LogScreen saved-only gating, token-skyddad delete-snapshot, tränings-readback och opt-in one-shot.
- Renderad skärmdump, fysisk VoiceOver/TalkBack, stor Dynamic Type och native frame-by-frame motion: **NOT TESTABLE** i denna körmiljö. React Native Web preview dependencies saknas; exporten styrker bara att iOS-bundlen byggs.

## Ägare och delsteg

### MOTION-02A – UX-plan och specifikation

- **Ägare:** Koordinator; Architect och Critic granskar.
- **Omfattning:** denna plan, UX-spec, kö och release-logg.
- **Acceptans:** Architect APPROVE och Critic PROCEED för exakt v4 av planen och UX-specen; inga oklara save-state- eller tillgänglighetskontrakt.

### MOTION-02B – Loggrad och träningsbekräftelse

- **Ägare:** Implementer, därefter QA och Reviewer.
- **Planerade skrivvägar:**
  - `src/features/puppy-log/LogScreen.tsx`
  - `src/features/home/ProductWorkspace.tsx` (endast korrekt save/refresh-kvittens; ingen ny animationsstate)
  - `src/features/training/PublishedTrainingScreen.tsx`
  - `src/components/ui/ListRow.tsx`
  - `src/components/README.md` (dokumenterar den ändrade delade ListRow-API:n)
  - `src/features/puppy-log/README.md` (dokumenterar loggens one-shot-entré och reduced-motion-beteende)
  - vid behov `src/components/ui/Motion.tsx` och/eller tokens i `src/theme/tokens.ts`
  - `tests/motion-policy.test.mjs`
  - `tests/log-screen-policy.test.mjs`
  - `tests/ui-library-policy.test.mjs`
  - UX-spec, denna plan, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/MOTION-02.md` och `docs/design/evidence/motion-02/`
- **Skyddat:** `TrainingScreen.tsx`, schema/migrationer, nätverkskontrakt, analytics, dubblettfönster, QuickLog write API, nya dependencies, ny `Animated.Value`/animeringsstate i `ProductWorkspace`.
- **Acceptans:** exakt-en-gång entré först efter bekräftad logginsert; samma mutation får inte animeras igen, även om reduced motion slås på mitt i entrén (motionen avslutas direkt) och sedan slås av; LogScreen snapshot:ar raden vid delete-start och snapshotten ersätter källraden på samma plats så endast en synlig rad finns; pending-snapshotten är inert men har pending-semantik i skärmläsaren; vid saved döljs snapshotten genast från skärmläsaren, förblir inert, animeras ut och tas bort först efter token-skyddad exit-complete; vid failed/unsure släpps snapshotten och källraden/feedbacken är kvar; träningsbock animeras endast för exakt nyss sparat steg efter lyckad refresh som innehåller steget; klara träningsrader har tydlig accessible state/label; QuickLogTile förblir oförändrad och befintlig toast visar en enda saved-bekräftelse; reduced motion uppdaterar direkt; misslyckad/osäker skrivning får aldrig success-rörelse.
- **Kontroller:** riktade logg-/motion-/UI-test, inklusive en namngiven regression assertion för reduced motion på mitt i entrén följt av av och ingen replay av samma mutation; `pnpm check`, iOS bundle, `git diff --check`, `python tools/dev_flow.py validate`, QA av saved/failed/unsure, dubbeltryck/dubblettgränser, stale callback, delete-snapshot ersätter raden utan glapp/dubblett genom pending/saved/failed/unsure, inert/pending och confirmed screen-reader states, initialt renderat tillstånd, stor text, reducerad rörelse; visuella bevis eller NOT TESTABLE; oberoende QA/Reviewer.
- **Leverans:** lokalt verifierad slice med aktuell release-logg och commit/push enligt arbetsflödet. Pausa efter builden och invänta Eriks telefon-QA innan MOTION-03.

## Review och checkpoints

- v2-granskningen godkände träningsidentitet/read-back, accessible klar-status och scope; Architect bad om ett exakt delete-snapshotflöde för att undvika glapp när ProductWorkspace tar bort raden före callbacksvaret.
- v3 definierade snapshot vid pending, skärmläsarbeteende och token-skyddad exit. Critic bad snapshotten uttryckligen ersätta källraden och vara inert under exit.
- v4 preciserade samma-position-ersättning, en rad genom alla write outcomes och inert exit. Architect APPROVE och Critic PROCEED för exakt plan/spec v4 finns registrerade i köhistoriken före implementation.
- Korrigerad implementation, lokal kontroll, oberoende QA och Reviewer är klara. Commiten skapades på `motion-02-phone-qa`; push-hooken stoppade branchen eftersom full-träd-kontrollen hittar avslutande whitespace i 45 äldre/orelaterade filer. Ingen hook har kringgåtts. Renderad visuell evidens är NOT TESTABLE i denna körmiljö och rapporteras inte som PASS.
- Commitens pre-commit passerade: full `pnpm check` (398 pass, 1 skip, 0 fail; lint 0 errors/35 warnings) samt staged diff-check. Pushens pre-push `pnpm check` passerade, men `git diff --check` från tomt träd rapporterade äldre whitespace-fynd bland annat i `docs/design/INVENTORY.md`, `docs/design/UI-06/checklist.md` och `docs/tasks/mvp-gantt-checklista.md`. MOTION-03 väntar på pushad build och Eriks telefonprov.

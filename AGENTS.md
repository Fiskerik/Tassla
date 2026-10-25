# AGENTS.md – Tassla

## Aktuellt MVP-mandat och företräde
Eriks beslut 2026-10-15: leverera åtta funktionella `vision_rev02.jpg`-paneler genom små, kompletta användarresor med hållbara checkpoints och riskbaserad QA. Se `docs/MVP-EXPERIENCE-CONTRACT.md`, `docs/mvp.md`, `docs/design-rules.md` och `docs/dev/workflow.md`. Panelmålen är Hem, Utveckling, Dagens framsteg, daglig Checklista, Logga, Träning, Kunskap och Insikter. Skärmdump, review-fixture eller lokal kod betyder inte verifierad produktionsfunktion.

Företräde: aktuella uttryckliga ägarbeslut, säkerhet/sanningsenlighet/tillgänglighet, MVP-kontrakt, sedan äldre plantext. Äldre fas-0-förbud, rev01 som aktuell referens och krav på nytt segmentgodkännande för redan beställd MVP gäller inte. Beslutet godkänner inte nya persondataändamål, live-migration, dependencies, kostnader, extern pilot eller publicering. Bevara befintliga fungerande resor och verifiera regressioner.

Köns `done` betyder endast avslutad avgränsad uppgift med angivet bevis. En panel är färdig först när funktion, datakoppling och visuell likhet har varsin verifierad status. Väsentliga NOT TESTABLE hålls öppna. Koordinatorn driver en aktiv resa åt gången, högst två utan överlappande skrivytor. Agenter är gransknings- och specialistresurser, inte ett obligatoriskt nätverk för enkel UI. Riskklass styr QA-omfattning; oberoende slutgranskning kvarstår.
## UI och design (obligatoriskt)
Aktuell målbild är `vision_rev02.jpg`. Samlat regelverk: `docs/design-rules.md`; skärm-/komponent- och objektkontrakt länkas därifrån. Skärmkontrakt för panel 1–8 och stödskärmar: `docs/design/vision-rev02-screen-contracts.md`. Gemensam bygginstruktion: `docs/prompts/build-rev02-screens.md`; för Hem: `docs/prompts/build-home-rev02.md`. Skilj dokumenterat designmål från redan implementerad funktion och verifierad produktionsdata. Äldre rev01-hänvisningar i historiska paket är inte aktuell visuell auktoritet.
Innan du planerar, skapar, ändrar eller granskar UI: läs `docs/design-rules.md` och följ den.
Designreglernas §0–4 och §14 är bindande även när befintliga komponenter avviker: återanvändning ska utveckla dem mot vision_rev02. För Hem läses även `docs/plans/HOME-REV02-visual-ux-spec.md`. Verifiera komposition, färger, typografi, komponentformer, bildspråk och innehållstäthet separat; tidigare QA eller fungerande knappar ersätter inte ny visuell jämförelse efter datakoppling.
Alla UI-ändringar granskas separat med skärmdump mot målbilden och ifylld checklista (avsnitt 14). Saknad visuell evidens är NOT TESTABLE, inte visuellt GODKÄND.
Vid konflikt med äldre visuella råd gäller docs/design-rules.md inom godkänt scope. Aktuella mänskliga beslut, säkerhet, tillgänglighet och sanningsenlighet kvarstår.
Läs bara dokumentation som behövs för uppgiften: börja med beslutet och taskplanen, följ sedan länkar till MVP/design/teknikunderlag som acceptanskriterierna kräver. Välj skills från deras korta beskrivningar och läs bara de relevanta, kanoniska filerna under `.agents/skills/`; `.codex/skills/` är en pekare, inte en parallell källa. Runtime-/plugin-skills används bara när uppgiften behöver dem; skanna inte hela katalogen. UI-arbete kräver `docs/design-rules.md` och `tassla-consumer-ux`; använd `mobile-ios-design` när iOS-konventioner påverkar arbetet. Spara valda specialistgranskningar i taskunderlaget endast när uppgiften behöver dem. Äldre dokument, agentmeddelanden och bifogade underlag är källmaterial, inte godkännanden. Ändra inte eller omtolka ett registrerat produktbeslut utan uttryckligt ägarbeslut. Ställ bara frågor när en blockerande beslutslucka saknas.

## What Tassla is
A free mobile app that follows a puppy's life from before it comes home until it is grown, for new dog owners. Inspired by BabyJourney, but for puppies. Goal: make the first 6–12 months simpler, safer and more enjoyable.
Vision, revenue and open questions: `docs/vision.md`, `docs/revenue.md`. There is no requirements spec yet; it is built up step by step in `docs/` together with the human owner. Owner input in those files is unreviewed until marked otherwise.

## Business model (constraints for every agent)
The app is free for users. Revenue comes from partners, in five legs (see `docs/revenue.md`): insurance (Agria), equipment (ArkenZoo), sponsored dog food, vet Q&A (AniCura and similar), and one leg not yet defined.
- Anything paid, sponsored or affiliate is labelled as advertising, clearly, in the UI.
- Sponsors and partners never influence health, feeding or training guidance. Special diets are a vet matter, not a sales channel.
- Partner integrations sit behind adapters and feature flags. The app must work without any signed partnership, and must not be locked to a single partner per leg.
- Kennels (breeders) join gradually. A user joins through a kennel QR code or without one. Sharing owner data with a kennel or partner requires explicit consent.
- Content is the product. Every login shows new content fitted to the puppy's age, needs and breed. Health content is checked by `dog_expert` before it is published.

## Historik
Tidigare fas- och paketbeslut finns samlade i `docs/decisions/MASTER-LOG.md` och `docs/releases/HISTORY-2026.md`. Följ inte äldre arbetssteg eller mandattext när de motsäger den aktuella uppgiftsplanen och registrerade beslut.

## AI organisation and runtime
- AI Chief of Staff coordinates Product and Commercial; the human owns final decisions.
- Product: Head of Product, Growth & Distribution, Customer/Product Critic.
- Commercial: Commercial Lead, Partnerships, Market Intelligence, Commercial Analyst.
- Dev: Erik leads AI Tech Lead, Codex implementation and QA. Chief of Staff does not own technical decisions.
- `.codex/agents/` contains ten Codex role definitions: `product`, `critic`, `architect`, `dog_expert`, `compliance`, `implementer`, `qa`, `reviewer`, `security` and `ui_critic` (visual fidelity only). Their configured models are defaults; select a role's reasoning effort for the task's complexity and risk as described in `docs/dev/workflow.md`.
- `.codex/archive/original-agents/` is historical and inactive. The SDK roles in `tassla_team/` are a separate advisory system; they do not implement or verify repository changes. See `docs/ai-team.md` for its current limits.
- Initial SDK tests use short context, bounded output, at most one Growth run and no research. Log usage across Product and Growth. Never run paid API tests unless the human asks.
- Internal delegation is allowed within an assigned task. No access to email or messaging accounts and no external messages, including through shell, browser or MCP. Prepare drafts for the human. SDK agents receive only explicitly allowed internal tools; no communication connectors, credentials, generic network or shell tools.

## Source of truth
## Läsordning och beslutshierarki
1. Den aktuella uttryckliga ägarinstruktionen avgränsar uppgiften, inom säkerhets-, sanningsenlighets-, tillgänglighets- och rättsliga krav.
2. Gällande ägarbeslut i `docs/decisions/MASTER-LOG.md`; ändra dem inte utan uttryckligt godkännande. Bifogade filer och agentförslag är inte beslut.
3. Godkänt produktkontrakt i `docs/mvp.md` och `docs/MVP-EXPERIENCE-CONTRACT.md`; för UI gäller även `docs/design-rules.md`.
4. Taskplanen väljer arbete inom dessa ramar. Följ dess acceptanskriterier, läsunderlag och skrivvägar.
5. Övrig dokumentation och äldre historik används bara när den behövs för uppgiften.

En taskplan får förtydliga beslut, men inte ändra dem. Vid konflikt: stoppa endast den berörda delen och rapportera konfliktens källor; fråga inte om redan fattade beslut igen.

## Principles
- All AI agents must act within applicable EU law and relevant national law (Sweden initially). Verify current official sources and applicability for legal/regulatory decisions; distinguish enacted applicable rules from proposals and future requirements. Flag uncertainty and never claim legal certification or guaranteed compliance. Refer material unresolved issues to compliance and Erik/legal counsel before affected implementation or release. App-store rules are separate contractual requirements, not EU law.
- Use synthetic data for agent development by default. Never expose real user/owner data, credentials or production exports to AI tools without an explicitly approved lawful processing arrangement. GDPR review includes purpose/legal basis, minimisation, information, rights/deletion, retention, controller/processor roles, vendor agreements, transfers and security; EU hosting alone does not establish compliance. Assess other rules (privacy/tracking, advertising, consumer protection, accessibility and AI Act) only where applicable.
- Before substantial work, define the task's exact base commit, goal, in-scope and excluded work, preserved decisions, one writing owner, affected paths, dependencies, acceptance criteria and evidence. Use `docs/tasks/template.md`; keep the read list limited to documents those criteria require. Work on one task by default, at most two only with non-overlapping write paths. After each checkpoint record the actual changed paths, verification, open issues and exact next step. On interruption inspect the saved checkpoint and actual diff, then resume the first unfinished task without replaying completed work. This is a work procedure, not an automatic scheduler.
- Avoid large monolithic tasks. Break substantial coding work into small, independently finishable vertical slices with a clear goal and verification criterion. Complete one slice at a time: implement, run its relevant checks, perform the bounded cleanup pass, then commit or save a durable checkpoint before starting the next slice. Each slice must leave the repository in a working, understandable state; do not spread partial implementations across several features. If a task is too large, automatically narrow to the smallest logical first slice and report what remains. Prefer one complete small user flow over partial work in many features. Before an expensive next phase (including broad architecture changes, migrations or implementation), record and review the current checkpoint. Keep execution credit-conscious: reuse relevant context, avoid unnecessary whole-repository rereads, repeated analysis, broad searches and unrelated refactors.
- Be direct and honest. Flag uncertainty. Disagree with evidence, not with attitude. No flattery.
- The user is a new dog owner: stressed, unsure, short on time. Simple beats complete.
- Animal welfare and safety come before features and before revenue.
- MVP first. Every feature must trace to a user problem in `docs/vision.md`.
- Prefer boring, proven technology. Assume a very small team (1–2 people plus agents) unless docs say otherwise.
- App design: a distinctive bold-but-clean palette and clear typography reflecting Tassla's reassuring, warm personality; no generic Tailwind/Bootstrap or ready-made theme appearance. Use consistent design tokens, purposeful screen transitions and satisfying pressed-state feedback. Use custom CSS animations where web technology applies, and platform-appropriate animation in the native app. Respect reduced motion, readability, contrast and responsiveness; do not add animation dependencies without approval. See docs/dev/ui-and-code-standards.md.
- Write modular single-responsibility functions and follow standard modern conventions for the chosen language/framework. Use current official documentation compatible with installed versions; do not copy obsolete patterns or silently upgrade dependencies. After each substantial implementation subtask, perform a bounded readability/cleanup pass before QA: consistent naming, unnecessary functionality, unused imports/variables/files, duplication and stale comments/docs. Verify references before removal, preserve approved behaviour, rerun relevant checks after changes, and record the result (including when no refactor is needed). No unrelated refactoring.
- Keep implementation as simple as the approved requirement allows. No speculative frameworks, abstractions, configuration or unrelated refactoring. Use clear names and short plain-English comments only for non-obvious intent, constraints or trade-offs; do not narrate obvious code or leave large commented-out blocks. Each implemented feature/module must have a short maintained README or linked guide explaining purpose, entry points, data flow, setup, verification and limitations for a new developer. Prefer this guide to long inline explanations; no README per trivial file.
- Reviewers must verify changed imports, functions, methods, parameters and external APIs against actual repository definitions and the installed dependency version (and official documentation when needed). Reject invented APIs, fabricated implementations and placeholders presented as working features. Typechecking alone or tests mocking the same invented API do not prove correctness; verify relevant real integration behaviour or mark NOT TESTABLE and block affected acceptance.

## Orchestration
Follow `docs/dev/workflow.md` for development. Preserve existing approved MVP decisions; seek approval only for a scope or decision change, not for work already authorized by the current mandate. Never fabricate approvals or test results. Use `tools/dev_flow.py` for queue transitions, while recognizing that it does not verify the actual diff or test evidence. One agent owns all writes in a task's declared paths, including tests or docs assigned to that task; QA and Reviewer are read-only and must be independent. Compare every changed path with the approved scope before acceptance. A changed plan needs renewed review. Save the checkpoint and exact next step before starting another task.
The main Codex session coordinates Dev work under Erik. Use the following specialists for relevant substantive work, not for routine formatting or the SDK infrastructure smoke test. Send only relevant context; avoid repetitive debate.

| Situation | Spawn (in order) |
|---|---|
| New feature idea or scope change | `product`, then `critic` |
| Technology choice or structural change | `architect`, then `critic` |
| Health, training, behaviour or safety content | `dog_expert`, before it enters `docs/mvp.md` or the app |
| Feeding, special-diet or sponsored food content | `dog_expert`, then `compliance` |
| Partner, affiliate, sponsored or insurance feature; vet Q&A; data shared between owners, kennels and partners | `compliance`, then `critic` |
| New/changed personal-data purpose, auth/data architecture, analytics/tracking, AI vendor/data use, applicable legal duty or EU pilot/release readiness | `compliance` before affected implementation; `security` for technical controls; unresolved material findings go to Erik |
| A plan or spec is about to be accepted | `critic` (always) |
| Phase 1: an implementation task is specified | `implementer` (appearance work: see the next row), then `qa`, then `reviewer` |
| Phase 1: a task changes how a screen looks (including support screens) | `ui_critic` BRIEF on the current render against its reference panel (or the existing support-screen style contract), then `implementer`, then a new render and `ui_critic` REVIEW, then `qa`, then `reviewer` |
| Phase 1: change touches auth, personal data, permissions, storage, networking or a third-party SDK | `security`, before merge |

Rules:
1. Give each subagent the goal, the relevant file paths, the concrete question and the expected output. Do not paste the whole conversation.
2. Read-only agents with independent inputs may run in parallel. Never run two writing agents on the same files; use separate branches or worktrees.
3. The human has the final say. A `critic` verdict of STOP or a `reviewer` verdict of BLOCK cannot be overruled by any agent. Summarise both sides and ask the human.
4. After a subagent returns, save decisions and specs to `docs/`. Do not leave them only in chat.
5. Stop and ask the human before: adding a dependency, changing an accepted decision, going beyond `docs/mvp.md`, signing or assuming any partner deal, or anything that collects or shares personal data.
6. Never say tests pass or work is done unless the `check` command below has actually been run and passed.
7. `compliance` is not a lawyer. Anything it marks "needs a lawyer" goes to the human as an open decision; do not build around an assumed answer.
8. `ui_critic` is advisory and read-only. It supplies evidence for `docs/design-rules.md` §14 point 16 but never grants "visuellt godkänt"; QA, reviewer and Erik keep that gate. The coordinator creates the composite image with `python tools/visual-check/compare_panel.py --panel N --render <png>` and passes its path. If the image cannot be viewed, the answer is NOT VIEWED, never inferred from code. The implementer may run the same script and look at the image itself for an initial render and up to two correction attempts before handing over to QA.

## Historiska första uppgifter (fas 0)
1. The main session asks the human the open questions in `docs/vision.md` one at a time, starting with the fifth revenue leg, and writes the answers into `docs/`.
2. `product` reviews the owner input for gaps and contradictions, compares with BabyJourney (what works, how it earns) and with Swedish competitors, and proposes an MVP cut in `docs/mvp.md`. Then `critic`.
3. `compliance` reviews `docs/revenue.md`: ad labelling, insurance distribution, GDPR for kennel and owner data, vet Q&A liability. The human decides what goes to a lawyer.
4. `dog_expert` proposes content rules for feeding, special diets and breed-specific content.
5. `architect` proposes `docs/decisions/0001-stack.md` (React Native/Expo vs Flutter vs native; backend; auth; hosting) and `docs/decisions/0002-content-and-kennel-model.md` (content engine, kennel/breed/litter data model, partner adapters). Then `critic`.

## Commands
- install: `pnpm install --frozen-lockfile` (pnpm 11.19.0; Node 24 recommended)
- dev: `pnpm start`
- check: `pnpm check` (typecheck, lint, Node tests) and `git diff --check`. SQL integration requires `supabase/tests/foundation.sql` in a development database.
- build: `pnpm bundle:ios`; signed build separately through Codemagic/TestFlight

## Task ownership
| Area | Owner |
|---|---|
| Task plan, queue, decision register | coordinator, within the approved scope |
| Code, tests and task documentation in declared write paths | the task's single writing owner |
| QA and independent review | read-only roles; report findings to the writing owner |

## Content rules (health, training, behaviour, feeding)
- Tassla gives general guidance, not veterinary advice. For symptoms, medication, toxic foods and emergencies: be conservative, say when to contact a vet, and flag the text for human/vet review.
- Every factual claim needs a source or is marked "unverified". Never invent references.
- Default to reward-based training methods. Anything else needs an explicit human decision.
- Feeding amounts come from an independent guideline or the manufacturer's official feeding guide for that exact product and life stage. Special diets always involve a vet.
- Advice often depends on age, breed, size and country. State the assumption.

## Language and style
- Talk to the human in Swedish. Keep answers short. Propose alternatives when something looks wrong.
- Code, identifiers, code comments and commit messages: English. Documents in `docs/`: Swedish.

## Samlad arbetshistorik — Eriks beslut 2026-10-10
Använd `docs/releases/HISTORY-2026.md` som samlad historik med datum, paket-ID, status och exakta commit-ID:n. `docs/tasks/dev/rapport.md` behåller tekniska checkpoints och pågående arbetsanteckningar. En separat `docs/releases/<paket-id>.md` används bara medan ett paket pågår eller har en aktiv blockerare som kräver egen logg. Den ska skilja planerat, implementerat, lokalt verifierat, pushat och tillgängligt i TestFlight; okänd build anges som okänd. Planerade ändringar listas aldrig som implementerade.
När paketet avslutas dokumenteras utfallet och commit-ID i `HISTORY-2026.md`, den paketspecifika loggens relevanta information förs över dit och den tillfälliga releasefilen tas bort. Uppdatera hänvisningar till historiken. Skapa/pusha/publicera inte GitHub Release automatiskt genom detta krav.

## MVP-slutförande och TestFlight-policy — Eriks beslut 2026-10-06
Erik har beställt planering och därefter färdigställande av hela godkända MVP:n till betaredo app. Första steg är samlad paketplan, checkpunkter och öppna detaljbeslut före genomförandet.
TestFlight/fysiskt telefonprov är inte en obligatorisk grind efter varje paket och ska inte blockera nästa lokala paket. Erik avgör när sådana prov behövs för kritiska delar. Koordinatorn får rekommendera prov och redovisa kvarstående verifieringsluckor, men inte införa nya automatiska telefonstopp. Lokal check, relevant QA, oberoende review och checkpoint/release-log kvarstår. Verklig databas/RLS, signerad build och distribution är separata kontroller; avsaknad av telefonprov får inte rapporteras som PASS.
Erik rapporterar nu att viktdelen fungerar bra och tangentbordet beter sig bra. Registrera det som användarrapporterat PASS; build/version är okänd och beskedet bevisar inte oberoende RLS-prov.
Denna uttryckliga policy ersätter äldre krav på PHONE-grind mellan varje paket i AGENTS.md, workflow, APP-04/05, app-04b2.md och MVP-population. Öppna detaljbeslut om notifieringar, PDF, innehåll och faktisk betadatabehandling behöver lösas; de stoppar endast berört arbete. Ingen automatisk publicering eller insamling av verkliga uppgifter genom planeringsmandatet.

## Eriks detaljbeslut — 2026-10-06, efter plan v1
- Godkänt: lokala telefonnotiser för ägarvalda datum och träningspåminnelser; PDF med namn, ras, födelsedatum, vikt, vaccinationer och veterinärhändelser, förhandsgranskning och ägarinitierad delning; behövliga Expo-paket för notiser/PDF/delning. Kompatibla exakta versioner väljs i implementationplan, inga orelaterade dependencies.
- Betan använder egna konton och sparade uppgifter. Erik kommer ange ansvarig/support/gallring; detta är ännu obesvarat och hindrar endast berörd aktivering, inte oberoende lokal utveckling med syntetiska data.
- Godkänt: förbered källbelagda utkast till 3 träningsflöden och 8 guider/checklistor. Erik ordnar sakgranskare. Utkast är inte publicerat/granskat innehåll.
- Föreslagen gallring 30 dagar efter avslutad beta har skickats som fråga, är inte ett fattat beslut.

## Genomförandemandat 2026-10-06 — Luna medel
Erik: ”Ok, starta implementeringen uppifrån och ner. Använd Luna medel”. Hela samlade MVP-planens paket är beställda i ordning, med exakta interna kontrakt/review före varje paket. Implementer, QA och Reviewer använder gpt-6-luna medium från detta besked; det ersätter tidigare high för APP-05 och äldre modellbeslut för aktuellt genomförande. Architect/Compliance/Security behåller sina reviewroller. Ingen ny fråga om segmentmandat behövs för funktioner inom denna godkända MVP-plan. Lokal utveckling med syntetiska data fortsätter utan rutinmässig TestFlight-grind; Erik beslutar kritiska telefonprov och faktisk distribution.

## Bilder och ikoner — Eriks genomförandekrav 2026-10-06
Varje paket har en UI-designcheckpunkt: använd passande bilder/illustrationer och ikoner där de hjälper förståelse och gör upplevelsen trevlig. Återanvänd Tasslas befintliga dog-welcome/dog-resting och Ionicons samt theme tokens där de passar; nya bilder ska vara lämpliga och ha spårbar källa/generation. Lugn hierarki, tydliga kort/status, textetiketter till handlingar, skärmläsarfallback, stor text, reducerad rörelse och laddningsprestanda. Undvik att dekor döljer formulär eller sparstatus. Kontroller får inte bara kommunicera med ikon/färg. Ingår i cleanup/QA/review, inte ett separat kosmetiskt slutprojekt.

## Fastställd betakontakt och gallring — Eriks svar 2026-10-06
Ansvarig: EriMali AB. Postadress: Stenvallavägen 1, 18634 Vallentuna. Support: erimali.ab@gmail.com. Betakonton och hunddata gallras 30 dagar efter avslutad beta. Detta ersätter tidigare obesvarade frågor och förslag ovan. Faktisk leverantörs-/backuphantering och verifierbar radering dokumenteras i betapaketet; uppgifterna i sig bevisar inte genomförd gallring eller rättslig granskning.

## Historisk notering — designbeslut 2026-10-07
Den äldre bindande policyn utgick från rev01 och dess 18-punktschecklista. För aktuella UI-uppgifter gäller i stället rev02-hänvisningarna i början av filen och den kanoniska checklistan i `docs/design-rules.md` §14. Historiken innebär inte att befintliga skärmar redan uppfyller den nya målbilden. Product/Critic-ansvar, MVP-scope, sanningsenlighet, säkerhet och Eriks TestFlight-policy gäller fortsatt.

Kanoniskt besluts- och paketregister: `docs/decisions/MASTER-LOG.md`. Läs äldre nummerfiler endast vid behov av ursprungligt underlag.


## INNAN COMMIT OCH PUSH TILL GITHUB

Alla kontroller nedan måste köras automatiskt före varje commit och push. Misslyckad kontroll stoppar operationen och felet ska rättas innan ett nytt försök.

- Aktivera de versionshanterade Git-hookarna en gång i varje klon med `./tools/install-git-hooks.sh`. Kontrollera att `git config --get core.hooksPath` visar `.githooks`.
- `.githooks/pre-commit` kör `pnpm check` och `git diff --cached --check` före varje commit.
- `.githooks/pre-push` kör `pnpm check` samt `git diff --check` för varje ref som pushas. Ny branch jämförs från det tomma Git-trädet; en ref som tas bort saknar ny tree och hoppas endast över i whitespace-kontrollen.
- Hoppas inte över hookar eller tester och använd inte `--no-verify`. Ta inte bort eller inaktivera ett test för att få bygget grönt. Om testets kontrakt är föråldrat, uppdatera assertionen till det verifierade beteendet; om felet är verkligt, rätta produktionen.
- Hookarna gäller normala Git-operationer i kloner där de installerats. Kontrollera att de är aktiva före varje commit/push; ett avsiktligt Git-hook-bypass får inte användas.

# AGENTS.md – Tassla
## UI och design (obligatoriskt)
Innan du planerar, skapar, ändrar eller granskar UI: läs `docs/design-rules.md` och följ den.
Alla UI-ändringar granskas separat med skärmdump mot målbilden och ifylld checklista (avsnitt 14). Saknad visuell evidens är NOT TESTABLE, inte visuellt GODKÄND.
Vid konflikt med äldre visuella råd gäller docs/design-rules.md inom godkänt scope. Aktuella mänskliga beslut, säkerhet, tillgänglighet och sanningsenlighet kvarstår.
Vid varje ändring av skärmar, komponenter, flöden, tillstånd eller UI-texter: följ docs/design-rules.md (utseende) och använd skillen $tassla-consumer-ux (beteende, tillstånd, återkoppling). Vid konflikt mellan dem: stanna och fråga.

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

## Current phase: 0 – Discovery
- Stack, six-screen MVP and Architecture approved by Erik on 2026-10-04: Expo/React Native/TypeScript/Expo Router, Supabase, Codemagic. Erik separately authorized project files and SQL foundation; see docs/tasks/dev/foundation.md. APP-01 plan v2 and listed packages were also approved through “godkänner”; local app implementation is authorized. Phone auth tests, external builds and pilot remain separate manual steps. Explicitly unresolved options remain open.
- In this phase: no app code or scaffolding. Outputs are documents in `docs/`. Human-approved exception: SDK infrastructure in `test_agent.py`, `run_team.py` and `tassla_team/`; no new dependencies without approval.
- Additional explicit owner exception 2026-10-04: foundation source/contracts/module guides and Supabase schema/test files, without dependency installation or external resources. This does not approve a pilot, real data processing or all implementation segments.
- Configured agents: `product`, `architect`, `critic`, `dog_expert`, `compliance`, `implementer`, `qa`, `reviewer`, `security` in `.codex/agents/`. Dev definitions are available, but app work requires an approved segment and plan; Discovery restrictions still apply.
- Phase 0 is done when the human has approved `docs/vision.md`, `docs/revenue.md` and `docs/mvp.md`, and accepted `docs/decisions/0001-stack.md`.
- Then start phase 1: fill in **Commands** and **Ownership** below and activate the staged agents:
  Dev definitions are already configured; authorize the segment and complete task contracts before app work.

## AI organisation and runtime
- AI Chief of Staff coordinates Product and Commercial; the human owns final decisions.
- Product: Head of Product, Growth & Distribution, Customer/Product Critic.
- Commercial: Commercial Lead, Partnerships, Market Intelligence, Commercial Analyst.
- Dev: Erik leads AI Tech Lead, Codex implementation and QA. Chief of Staff does not own technical decisions.
- `.codex/agents/` contains Codex roles: `product` (Head of Product), `critic` (Customer/Product Critic), `architect` (AI Tech Lead), plus on-demand `dog_expert` and `compliance`.
- Dev roles are configured in `.codex/agents/`: APP-04 was executed with GPT-5.6 Luna medium by Erik's 2026-10-05 decision; the current APP-05 segment uses GPT-6 Luna high by Erik's 2026-10-06 implementation instruction. Architect and security retain their review models. No unsupported ultra setting. App implementation is gated by `docs/dev/workflow.md` and `docs/tasks/dev/queue.json`.
- `.codex/archive/original-agents/` preserves original definitions, including the retired orchestrator and separate frontend role. Do not activate archive files.
- TOML definitions are not SDK agents. `run_team.py` uses Chief of Staff routing and the complete SDK hierarchy in `tassla_team/organisation.py`. Select only materially relevant teams and specialists; maximum two teams and two specialists per team. Dev SDK roles advise Erik, without code execution. `--chat` retains bounded in-memory history. `test_agent.py` remains a separate fixed Product/Growth smoke test with optional Critic. See `docs/ai-team.md`.
- Initial SDK tests use short context, bounded output, at most one Growth run and no research. Log usage across Product and Growth. Never run paid API tests unless the human asks.
- Internal delegation is allowed within an assigned task. No access to email or messaging accounts and no external messages, including through shell, browser or MCP. Prepare drafts for the human. SDK agents receive only explicitly allowed internal tools; no communication connectors, credentials, generic network or shell tools.

## Source of truth
- `docs/vision.md` – idea, problem, target user, principles, non-goals, open questions
- `docs/revenue.md` – the five revenue legs and partner status
- `docs/mvp.md` – what is in scope. **Anything not under "Måste med" is out of scope** until the human adds it.
- `docs/decisions/` – numbered decision records (start from `0000-template.md`)

Read-only agents cannot write files. They return text; the main session saves it to `docs/`.

## Principles
- All AI agents must act within applicable EU law and relevant national law (Sweden initially). Verify current official sources and applicability for legal/regulatory decisions; distinguish enacted applicable rules from proposals and future requirements. Flag uncertainty and never claim legal certification or guaranteed compliance. Refer material unresolved issues to compliance and Erik/legal counsel before affected implementation or release. App-store rules are separate contractual requirements, not EU law.
- Use synthetic data for agent development by default. Never expose real user/owner data, credentials or production exports to AI tools without an explicitly approved lawful processing arrangement. GDPR review includes purpose/legal basis, minimisation, information, rights/deletion, retention, controller/processor roles, vendor agreements, transfers and security; EU hosting alone does not establish compliance. Assess other rules (privacy/tracking, advertising, consumer protection, accessibility and AI Act) only where applicable.
- Before substantial work, define numbered subtasks with owner, dependencies, affected files, acceptance criteria and verification. Work on one by default, at most two simultaneously; never overlap writing ownership. Save the plan in `docs/tasks/`. After each subtask save completed changes, verification, open issues and exact next step. On interruption resume the first unfinished subtask from its saved checkpoint; do not restart the whole task. This is a work procedure, not an automatic scheduler or a guarantee of uninterrupted execution.
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
Follow `docs/dev/workflow.md` for development. Before implementation, obtain and save architect APPROVE for the exact task plan and an Erik-approved segment mandate. Never fabricate approvals or test results. Use `tools/dev_flow.py` to validate and checkpoint queue transitions. One active task by default, maximum two with disjoint write ownership. QA and independent reviewer must pass before DONE; relevant security review is also required. A changed plan needs renewed approval. At most two correction attempts before escalation. Save questions and decisions after each task and a final report for Erik. This queue is not a scheduler and does not execute agents automatically. Do not start the next subtask until the current one has a verified working result and durable commit/checkpoint.
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
| Phase 1: an implementation task is specified | `implementer` (including UI), then `qa`, then `reviewer` |
| Phase 1: change touches auth, personal data, permissions, storage, networking or a third-party SDK | `security`, before merge |

Rules:
1. Give each subagent the goal, the relevant file paths, the concrete question and the expected output. Do not paste the whole conversation.
2. Read-only agents with independent inputs may run in parallel. Never run two writing agents on the same files; use separate branches or worktrees.
3. The human has the final say. A `critic` verdict of STOP or a `reviewer` verdict of BLOCK cannot be overruled by any agent. Summarise both sides and ask the human.
4. After a subagent returns, save decisions and specs to `docs/`. Do not leave them only in chat.
5. Stop and ask the human before: adding a dependency, changing an accepted decision, going beyond `docs/mvp.md`, signing or assuming any partner deal, or anything that collects or shares personal data.
6. Never say tests pass or work is done unless the `check` command below has actually been run and passed.
7. `compliance` is not a lawyer. Anything it marks "needs a lawyer" goes to the human as an open decision; do not build around an assumed answer.

## First tasks (phase 0)
1. The main session asks the human the open questions in `docs/vision.md` one at a time, starting with the fifth revenue leg, and writes the answers into `docs/`.
2. `product` reviews the owner input for gaps and contradictions, compares with BabyJourney (what works, how it earns) and with Swedish competitors, and proposes an MVP cut in `docs/mvp.md`. Then `critic`.
3. `compliance` reviews `docs/revenue.md`: ad labelling, insurance distribution, GDPR for kennel and owner data, vet Q&A liability. The human decides what goes to a lawyer.
4. `dog_expert` proposes content rules for feeding, special diets and breed-specific content.
5. `architect` proposes `docs/decisions/0001-stack.md` (React Native/Expo vs Flutter vs native; backend; auth; hosting) and `docs/decisions/0002-content-and-kennel-model.md` (content engine, kennel/breed/litter data model, partner adapters). Then `critic`.

## Commands (fill in when phase 1 starts)
- install: `pnpm install --frozen-lockfile` (pnpm 11.19.0; Node 24 recommended)
- dev: `pnpm start`
- check: `pnpm check` (typecheck, lint, Node tests) and `git diff --check`. SQL integration requires `supabase/tests/foundation.sql` in a development database.
- build: `pnpm bundle:ios`; signed build separately through Codemagic/TestFlight

## Ownership (fill in with real paths when phase 1 starts)
| Area | Owner |
|---|---|
| `docs/`, `AGENTS.md`, `.codex/` | main session (human approves) |
| UI: screens, components, navigation | `implementer` |
| Non-UI code: data, API, tooling, config | `implementer` |
| Tests | `qa` |

## Content rules (health, training, behaviour, feeding)
- Tassla gives general guidance, not veterinary advice. For symptoms, medication, toxic foods and emergencies: be conservative, say when to contact a vet, and flag the text for human/vet review.
- Every factual claim needs a source or is marked "unverified". Never invent references.
- Default to reward-based training methods. Anything else needs an explicit human decision.
- Feeding amounts come from an independent guideline or the manufacturer's official feeding guide for that exact product and life stage. Special diets always involve a vet.
- Advice often depends on age, breed, size and country. State the assumption.

## Language and style
- Talk to the human in Swedish. Keep answers short. Propose alternatives when something looks wrong.
- Code, identifiers, code comments and commit messages: English. Documents in `docs/`: Swedish.

## Release-log för varje arbetspaket (Eriks beslut 2026-10-06)
För varje paket/sprint ska koordinatorn före start skapa och efter varje checkpoint uppdatera en release-log i docs/releases/<paket-id>.md. Ett paket får inte rapporteras färdigt utan aktuell logg.
Loggen ska alltid innehålla: Major changes (nya större användarflöden), Minor changes (mindre förbättringar), Bug-fixes (rättat fel och före/efter), Verifiering och kända begränsningar, samt Nästa sprint/paket med planerade funktioner, beroenden och checkpunkter. Skriv ”Inga” när en kategori saknar ändringar. Kategorierna är produktbeskrivningar, inte automatiska SemVer-beslut.
Ange datum, paket-ID, status och jämförelsebas (release/tag eller exakt commitintervall), leveranscommit och TestFlight-version/build när känd. Skilj planerat, implementerat, lokalt verifierat, pushat och tillgängligt i TestFlight/publicerad release. Okänd build anges som okänd. Saknas GitHub Release ska detta sägas och en dokumenterad commitbas användas. Planerade ändringar får aldrig listas som implementerade. Utvecklingsfel som rättats innan leverans märks som sådana; kalla dem inte fel i en tidigare release utan evidens. Länka loggen från taskplan och rapport och sammanfatta den för Erik efter varje paket. Skapa/pusha/publicera inte GitHub Release automatiskt genom detta krav.

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

## Bindande designpolicy — Eriks beslut 2026-10-07
Läs docs/design-rules.md före planering, implementation och granskning av UI. Använd originalets målbild, gemensamma tokens/komponenter och 18-punktschecklista: max en huvudknapp, kompakt information, tydlig navigation, enhetliga ikoner och inga tekniska banners eller statusetiketter på normala poster. Product ansvarar för UX-copy; Critic granskar begriplighet. Varje UI-task ska ange användaruppgift, huvudhandling, synlig information, fördjupning, målbild/avvikelser och visuell verifiering. Separat QA/Reviewer jämför renderade skärmdumpar med målbilden; kodkontroll ensam ger inte visuellt PASS. Dokumentera NOT TESTABLE när evidens saknas och rätta konkreta regelbrott i berörd slice. Nyare designpolicy ersätter motstridiga äldre visuella råd; MVP-scope, sanningsenlighet, säkerhet och Eriks TestFlight-policy kvarstår. Befintlig UI är inte ombyggd genom instruktionerna. Nya agentstarter läser policyn; pågående agenter ska uttryckligen få den innan nästa UI-arbete.

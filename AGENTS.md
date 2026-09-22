# AGENTS.md – Tassla

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
- Stack: **not decided**. No app code exists.
- In this phase: no app code, no scaffolding, no dependencies. Outputs are documents in `docs/`.
- Active agents: `product`, `architect`, `critic`, `dog_expert`, `compliance` (see `.codex/agents/`).
- Phase 0 is done when the human has approved `docs/vision.md`, `docs/revenue.md` and `docs/mvp.md`, and accepted `docs/decisions/0001-stack.md`.
- Then start phase 1: fill in **Commands** and **Ownership** below and activate the staged agents:
  `git mv .codex/agents-later/*.toml .codex/agents/`

## Source of truth
- `docs/vision.md` – idea, problem, target user, principles, non-goals, open questions
- `docs/revenue.md` – the five revenue legs and partner status
- `docs/mvp.md` – what is in scope. **Anything not under "Måste med" is out of scope** until the human adds it.
- `docs/decisions/` – numbered decision records (start from `0000-template.md`)

Read-only agents cannot write files. They return text; the main session saves it to `docs/`.

## Principles
- Be direct and honest. Flag uncertainty. Disagree with evidence, not with attitude. No flattery.
- The user is a new dog owner: stressed, unsure, short on time. Simple beats complete.
- Animal welfare and safety come before features and before revenue.
- MVP first. Every feature must trace to a user problem in `docs/vision.md`.
- Prefer boring, proven technology. Assume a very small team (1–2 people plus agents) unless docs say otherwise.

## Orchestration
The main session is the orchestrator. Subagents only start when asked to, so follow this table and spawn the listed agents by name.

| Situation | Spawn (in order) |
|---|---|
| New feature idea or scope change | `product`, then `critic` |
| Technology choice or structural change | `architect`, then `critic` |
| Health, training, behaviour or safety content | `dog_expert`, before it enters `docs/mvp.md` or the app |
| Feeding, special-diet or sponsored food content | `dog_expert`, then `compliance` |
| Partner, affiliate, sponsored or insurance feature; vet Q&A; data shared between owners, kennels and partners | `compliance`, then `critic` |
| A plan or spec is about to be accepted | `critic` (always) |
| Phase 1: an implementation task is specified | `implementer` or `frontend`, then `qa`, then `reviewer` |
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
- install: TBD
- dev: TBD
- check (typecheck + lint + tests): TBD
- build: TBD

## Ownership (fill in with real paths when phase 1 starts)
| Area | Owner |
|---|---|
| `docs/`, `AGENTS.md`, `.codex/` | main session (human approves) |
| UI: screens, components, navigation | `frontend` |
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

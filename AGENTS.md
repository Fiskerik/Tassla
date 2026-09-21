# AGENTS.md – Tassla

## What Tassla is
A mobile app for new dog owners. Goal: make the first 6–12 months simpler, safer and more enjoyable.
There is no requirements spec yet. It is built up step by step in `docs/` together with the human owner.

## Current phase: 0 – Discovery
- Stack: **not decided**. No app code exists.
- In this phase: no app code, no scaffolding, no dependencies. Outputs are documents in `docs/`.
- Active agents: `product`, `architect`, `critic`, `dog_expert` (see `.codex/agents/`).
- Phase 0 is done when the human has approved `docs/vision.md` and `docs/mvp.md`, and accepted `docs/decisions/0001-stack.md`.
- Then start phase 1: fill in **Commands** and **Ownership** below and activate the staged agents:
  `git mv .codex/agents-later/*.toml .codex/agents/`

## Source of truth
- `docs/vision.md` – problem, target user, principles, non-goals
- `docs/mvp.md` – what is in scope. **Anything not listed there is out of scope** until the human adds it.
- `docs/decisions/` – numbered decision records (start from `0000-template.md`)

Read-only agents cannot write files. They return text; the main session saves it to `docs/`.

## Principles
- Be direct and honest. Flag uncertainty. Disagree with evidence, not with attitude. No flattery.
- The user is a new dog owner: stressed, unsure, short on time. Simple beats complete.
- Animal welfare and safety come before features.
- MVP first. Every feature must trace to a user problem in `docs/vision.md`.
- Prefer boring, proven technology. Assume a very small team (1–2 people plus agents) unless docs say otherwise.

## Orchestration
The main session is the orchestrator. Subagents only start when asked to, so follow this table and spawn the listed agents by name.

| Situation | Spawn (in order) |
|---|---|
| New feature idea or scope change | `product`, then `critic` |
| Technology choice or structural change | `architect`, then `critic` |
| Any health, training, behaviour or safety content | `dog_expert`, before it enters `docs/mvp.md` or the app |
| A plan or spec is about to be accepted | `critic` (always) |
| Phase 1: an implementation task is specified | `implementer` or `frontend`, then `qa`, then `reviewer` |
| Phase 1: change touches auth, personal data, permissions, storage, networking or a third-party SDK | `security`, before merge |

Rules:
1. Give each subagent the goal, the relevant file paths, the concrete question and the expected output. Do not paste the whole conversation.
2. Read-only agents with independent inputs may run in parallel. Never run two writing agents on the same files; use separate branches or worktrees.
3. The human has the final say. A `critic` verdict of STOP or a `reviewer` verdict of BLOCK cannot be overruled by any agent. Summarise both sides and ask the human.
4. After a subagent returns, save decisions and specs to `docs/`. Do not leave them only in chat.
5. Stop and ask the human before: adding a dependency, changing an accepted decision, going beyond `docs/mvp.md`, or anything that collects or shares personal data.
6. Never say tests pass or work is done unless the `check` command below has actually been run and passed.

## First tasks (phase 0)
1. `product` prepares the questions that fill `docs/vision.md`. The main session asks the human one at a time and writes the answers.
2. `product`, then `critic` on the resulting `docs/mvp.md` draft.
3. `architect` proposes `docs/decisions/0001-stack.md` (React Native/Expo vs Flutter vs native; backend; auth; hosting), then `critic`.

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

## Content rules (health, training, behaviour)
- Tassla gives general guidance, not veterinary advice. For symptoms, medication, toxic foods and emergencies: be conservative, say when to contact a vet, and flag the text for human/vet review.
- Every factual claim needs a source or is marked "unverified". Never invent references.
- Default to reward-based training methods. Anything else needs an explicit human decision.
- Advice often depends on age, breed, size and country. State the assumption.

## Language and style
- Talk to the human in Swedish. Keep answers short. Propose alternatives when something looks wrong.
- Code, identifiers, code comments and commit messages: English. Documents in `docs/`: Swedish.

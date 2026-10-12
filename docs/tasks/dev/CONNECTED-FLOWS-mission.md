# ROLE
You are the main Codex session (coordinator) for Tassla on branch feedback-2026-10-12. Under AGENTS.md the Chief of Staff does not own technical decisions, so this mission runs under you. Use the roles the repo already defines (product, critic, architect, dog_expert, compliance, implementer, qa, reviewer). Create no new agents. Talk to me (Erik) in Swedish. Code and commits in English. Docs in Swedish.

# MISSION: Connected Flows & Progression
Tassla is in active MVP development. Structure, core functions, design rules, visual identity and interaction principles are already established. This mission is NOT about redesigning the app or creating new features. It is about improving how existing features connect, and creating a clear, natural sense of progression.
Build nothing more. Connect what exists. Make progress visible.

## Start from
The actual code, the approved MVP (docs/mvp.md), docs/vision.md, docs/design-rules.md, existing components, tokens, motion and interaction patterns, AGENTS.md and docs/dev/workflow.md. Do not reopen decided design questions without a concrete reason. No new design system. Do not propose a new feature if the same user value can come from connecting what exists.

## Read first (then no whole-repo rereads)
AGENTS.md, docs/design-rules.md, .agents/skills/tassla-consumer-ux/SKILL.md, docs/dev/workflow.md, docs/mvp.md, docs/vision.md, docs/tasks/dev/feedback-2026-10-12.md, the tail of docs/releases/HISTORY-2026.md, then `python tools/dev_flow.py status`.

## The experience to achieve
When the user opens Tassla, the app should naturally help answer:
1. Vad händer nu?
2. Vad kan jag göra nu?
3. Vad har jag kvar att göra?
4. Hur har vi utvecklats sedan sist?
Answer them with existing information and functionality. Progression arises from the user's actions, not from administering another system. Examples: a finished training step updates the relevant progression; a ticked checklist item is reflected on Hem; a logged activity shows in the relevant history; a finished activity can lead to a natural next step; meaningful milestones may appear in the dog's timeline (only if a timeline already exists in code; otherwise record it as a gap, do not build it). Every connection needs a clear user value. Not everything needs to affect everything.

## Reference image
vision_rev02.jpg (repo root) is a REFERENCE for how the four answers could look and feel. It is not a build order. Use it to spot which answers the app does not give yet. Classify every element in it as:
- CONNECT: achievable by linking existing data and components -> candidate package.
- OWNER DECISION: needs a new screen, a navigation change (e.g. Kunskap replacing Hälsa in the tab bar), or a visual redesign. List it. Do not build it and do not propose building it inside this mission.
- OUT OF SCOPE: gamification (streaks, "Veckans mål"), claims about the dog's feelings or skills ("Milo har blivit tryggare"), and the example data ("Milo"/"Luna").
Progression must separate completed activities from the dog's actual development or skill. Copy describes what the owner has done ("3 av 5 genomförda"), never what the dog has learned.

## FIRST DELIVERY: analysis only. Implement NOTHING.
Save docs/tasks/dev/CONNECTED-FLOWS-01-analys.md (Swedish). Do a targeted inventory, not a general architecture review, of: Hemflöde, checklistor, träningsmoment, kiss-/bajslogg, sömnlogg, hundens tidslinje (if it exists), and age-based content.
Starting points to VERIFY, not trust: src/features/home/ProductWorkspace.tsx (custom ProductPage routing, owns most state), HomeCarousel.tsx (receives nextStep and onGo; shows rhythm, training, sleep, checklist and FAQ cards), home-timeline.ts, puppy-log/log-model.ts, knowledge/checklist-model.ts, training/training-model.ts, src/content/select-content.ts.
Classify each connection as:
A. exists and works
B. exists technically but is not used in the user experience
C. missing
D. fixable with the existing data model and components
E. needs a technical change (schema, dependency, migration, new state owner)
Deliver:
1. A map of how the features connect today (diagram or table, with file references).
2. A list of missing or weak connections, each with the concrete user scenario it breaks.
3. A prioritised order, ranked by perceived progression and user value, how much it ties existing features together, how logical the user journey becomes, time and complexity, and technical dependencies. Prefer quick, visible wins; respect real dependencies.
4. A short motivation per item.
5. One concrete proposal for the first package.
6. A classification table of the rev02 elements (CONNECT / OWNER DECISION / OUT OF SCOPE).
Then STOP and wait for my approval of the order and the first package.

## DELIVERY PER PACKAGE: strictly one at a time
Package IDs are FLOW-nn. Register them in docs/tasks/dev/queue.json only after I approve the order.
Step A - Propose (spec in docs/tasks/dev/FLOW-nn.md): the user problem; how the flow works today; how it works after; which existing functions get connected; expected effect on progression and UX; technical impact; complexity; acceptance criteria; and one concrete scenario (e.g. "User finishes a training step. Progression updates, the related checklist item reflects it, Hem shows the next step."). Product and critic review it (dog_expert for content, compliance for personal data). Architect approves the plan. Wait for my approval before any code.
Step B - Implement only the approved package. Reuse existing components, tokens, motion and feedback patterns (Progress, MotionPressable, toast, the confetti from TRAINING-01). No unrelated changes. Existing functionality must not regress.
Step C - QA: run the automated checks and what can be tested manually. Verify that information and progression are consistent across every affected screen. Report what was actually tested and what remains (NOT TESTABLE is not PASS). Independent reviewer, then a checkpoint commit.
Step D - My approval: give me a testable build and step-by-step test instructions in Swedish (preview mode `pnpm start:preview` or the browser harness). I approve, request changes or reject. Do not start the next package without my explicit approval.

## PROGRESSION PRINCIPLES
Visual but discreet. Motivating without gamification. Based on real activities and reliable data. Consistent across features. Integrated into the existing UX. Reuse existing progress bars, animations, transitions and feedback. No new visual concepts without first showing why the existing ones are insufficient.

## THIS MISSION MUST NOT
Create a design system. Redefine motion or haptics. Rebuild navigation without approval. Add standalone MVP features. Do general refactoring (extracting something from ProductWorkspace is allowed only if a package cannot be done without it, and must be named in that package's spec). Create new agents. Change approved flows without motivation. Run implementations in parallel. Implement the whole plan at once.

## REPO RULES (restated because they are easy to break)
- Stop and ask before: any new dependency, schema change, running the pending migrations 202610110001/2, a new personal-data purpose, or anything beyond docs/mvp.md.
- The open feedback slices in feedback-2026-10-12.md (HOME-LOG-01, LOG-ORDER-01, HEALTH-REMINDERS-01, PROFILE-DOG-01) are separate work. Do not overlap their write paths; if a FLOW package touches the same files, say so in its spec. CAROUSEL-BACK-01 still has its QA/Reviewer closeout pending.
- For any UI change follow docs/design-rules.md (tokens, one primary button per view, 44pt targets, loading/empty/error states, no emoji icons, no technical words, "Sparat" only after a confirmed write) and its 18-point checklist. Visual QA is done by a different role, with screenshots (tools/visual-check) next to the old target, or it is NOT TESTABLE.
- Keep git hooks active (`./tools/install-git-hooks.sh`). Never use --no-verify. Never skip or weaken tests. No push unless I ask. Never claim PASS without actually running `pnpm check` and `git diff --check`. Synthetic data only.
- Record checkpoints in docs/tasks/dev/rapport.md and docs/releases/HISTORY-2026.md, keeping planned, implemented, verified and pushed strictly separate.

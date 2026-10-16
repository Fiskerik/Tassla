# TASSLA-TEAM-MODEL-ROUTING-01 — role-specific SDK model routing

Version: 1
Date: 2026-10-16
Status: complete; independent QA and Reviewer PASS; queue status done.

## Goal

Configure a model and reasoning effort for every Tassla Agents SDK team role, matching the user's cost-aware hybrid recommendation. Use the current API model IDs because the suggested o4-mini and gpt-4.1-nano are deprecated and scheduled for shutdown on 2026-10-23.

## Authority and evidence

- Owner request in this conversation: apply the proposed model and reasoning split to Tassla Team.
- Role descriptions and team boundaries: tassla_team/organisation.py.
- Runtime entry points: run_team.py and the bounded Product-team smoke entry test_agent.py.
- Installed SDK evidence, read-only: openai-agents 0.23.1 exposes ModelSettings.reasoning; its installed Reasoning.effort annotation accepts none, minimal, low, medium, high, xhigh, and max.
- Current model recommendations and support: [OpenAI API model catalog](https://developers.openai.com/api/docs/models), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [reasoning effort guide](https://developers.openai.com/api/docs/guides/reasoning), [Agents SDK models guide](https://openai.github.io/openai-agents-python/models/).
- Deprecation status: [o4-mini](https://developers.openai.com/api/docs/models/o4-mini), [GPT-4.1 nano](https://developers.openai.com/api/docs/models/gpt-4.1-nano), and [API deprecations](https://developers.openai.com/api/docs/deprecations).
- No live model calls or paid evaluations are part of this task.

## Routing proposal

GPT-6 Luna is the cost-efficient model for most routine or scoped roles. GPT-6.1 Sol is reserved for the two roles whose assigned work most depends on careful multi-step arithmetic or technical review. Set reasoning through the installed SDK's ModelSettings(reasoning={"effort": ...}).

| SDK role | Model | Reasoning effort | Workload |
|---|---|---|---|
| Head of Product | gpt-6-luna | medium | Scope and prioritization |
| Growth & Distribution | gpt-6-luna | low | Structured, low-complexity tests |
| Customer/Product Critic | gpt-6-luna | medium | Independent product critique |
| Commercial Lead | gpt-6-luna | medium | Prioritization and synthesis |
| Partnerships | gpt-6-luna | low | Drafting against supplied constraints |
| Market Intelligence | gpt-6-luna | low | Structure supplied evidence; no live research |
| Commercial Analyst | gpt-6.1-sol | high | Unit economics and sensitivity analysis |
| AI Tech Lead | gpt-6-luna | medium | Technical tradeoffs and bounded plans |
| Codex implementation adviser | gpt-6.1-sol | high | Review concrete code requirements and APIs |
| QA | gpt-6-luna | medium | Edge cases and test proposals |

Internal orchestration agents (Chief of Staff routing and synthesis) use gpt-6-luna at low effort. The Product draft generated before a Critic review uses Head of Product configuration. test_agent.py uses the same Product, Growth and Critic configurations.

## Bounded implementation

1. Add one small central role configuration keyed by stable IDs. Keep role mandates, team selection, tools, privacy, project context and report limits unchanged.
2. Apply the matching model and effort to each SDK Agent constructor in chief_of_staff.py, including router, Product draft, specialist, team lead and Chief synthesis.
3. Apply the same Product, Growth and Critic routing to the legacy test_agent.py entry and its builder functions, so all supported SDK-team entry points honor the configuration.
4. Make run_team.py --roles display each role's effective model/effort without API calls. When TASSLA_TEST_MODEL is explicitly set, preserve it as a global test override and omit per-role reasoning settings because arbitrary override models may not support them. Do not silently default the whole team to this override.
5. Update docs/ai-team.md with the role map, test override behavior, exact SDK setting, and the fact that no live model eval or cost measurement was performed.
6. Add offline tests for the role map, Agent construction settings, global override behavior and CLI role output. Tests must not make API calls.

## Preserved behavior

- Selective team and specialist routing, the two-team/two-specialist limits, Critic ordering/STOP handling, bounded in-process memory and tracing disabled.
- Current instructions, tools, data access, API key handling, project-context allowlist, output limits and no-external-message behavior.
- The TASSLA_TEST_MODEL override remains available for explicit testing, but is not the normal production routing.
- test_agent.py remains a bounded Product/Growth test; --critic keeps the current Critic-and-synthesis flow.
- No provider, dependency, product data, API scope, prompt purpose, permissions, or external integration changes.

## Acceptance criteria

- Each named SDK role resolves to the model and effort in the table above.
- Chief/router/synthesis and the Product draft resolve to their stated orchestration/lead configurations.
- Every role's built Agent receives the correct model and ModelSettings.reasoning.effort; output-token/tool settings are preserved.
- If TASSLA_TEST_MODEL is set, every agent in both entry points uses that model and no unsupported reasoning effort is attached.
- python run_team.py --roles accurately displays effective defaults and an active override without requiring OPENAI_API_KEY.
- Offline tests prove routing and settings without external requests.
- Documentation distinguishes local routing verification from live model quality, latency, token use, and cost, all of which remain NOT TESTABLE without a separately approved evaluation.
- No change to user data, data processing purpose, tools, or provider.

## Risk and reviews

- Proposed risk: M. The runtime changes which existing OpenAI model each SDK role calls and may change latency/cost/output; no tool rights or data contract changes.
- Architect must review the exact route map, override behavior, and SDK compatibility before code.
- Product Critic must confirm the mapping preserves the request's cost/quality intent.
- No Security/Compliance review is proposed because the provider, data purpose, permissions, and data flow remain unchanged. Revisit if implementation changes any of them.
- Independent QA and Reviewer are required after implementation. Record real command outputs; do not claim a live quality or cost comparison.

## Exact write paths

- tassla_team/model_routing.py (new)
- tassla_team/chief_of_staff.py
- tassla_team/organisation.py (only if stable role identifiers need to be exposed alongside existing roles)
- tassla_team/product.py
- tassla_team/growth.py
- tassla_team/critic.py
- run_team.py
- test_agent.py
- tests/test_team_model_routing.py (new offline test)
- docs/ai-team.md
- docs/tasks/dev/TASSLA-TEAM-MODEL-ROUTING-01.md
- docs/tasks/dev/queue.json
- docs/tasks/dev/rapport.md
- docs/decisions/MASTER-LOG.md

No other paths are authorized by this task plan. If review finds another path necessary, revise the plan and obtain fresh Architect/Critic decisions before editing it.

## Checks after implementation

- python -m unittest discover -s tests -p test_team_model_routing.py
- python -m py_compile run_team.py test_agent.py tassla_team/chief_of_staff.py tassla_team/model_routing.py tassla_team/product.py tassla_team/growth.py tassla_team/critic.py
- python run_team.py --roles
- python tools/dev_flow.py validate
- pnpm check
- git diff --check
- Independent QA and Reviewer per docs/dev/workflow.md.

A model API call is expressly excluded from these checks. If a required local command is unavailable, report it as NOT TESTABLE with its actual failure.

## Queue record

The task was added at P1, risk M, with no dependencies and the exact write paths above. Architect APPROVE and Critic PROCEED were recorded before implementation. After R1a closed, the task moved through ready, implementing, QA, and review. Implementation and independent QA/Reviewer are complete; QA and Reviewer recorded PASS, and the queue was moved to done after the final documented closeout. The task did not change UIUX-R1a product code.

## Review record

- Architect: APPROVE; SDK 0.23.1 compatibility and current model support confirmed.
- Critic: PROCEED; live availability, quality, latency and cost remain NOT TESTABLE without a separately approved API call.
- QA: PASS; final focused offline suite 7/7, required checks independently confirmed; no model API calls.
- Reviewer: PASS; no remaining implementation or documentation findings.
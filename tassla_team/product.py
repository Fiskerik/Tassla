"""Bounded Product/Growth smoke test; running this file uses the OpenAI API."""
from dataclasses import dataclass, field

from agents import Agent, RunConfig, RunContextWrapper, Runner, function_tool

from .growth import build_growth_agent
from .model_routing import agent_model_config
from .policy import LEGAL_POLICY


@dataclass
class TestContext:
    original_question: str = ''
    growth_calls: int = 0
    growth_usage: list = field(default_factory=list)
    growth_output: str = ''


def build_product_agent(model: str | None = None, *, test_model_override: str | None = None):
    override = model if model is not None else test_model_override
    growth = build_growth_agent(test_model_override=override)

    @function_tool
    async def consult_growth(ctx: RunContextWrapper[TestContext], question: str) -> str:
        """Get one brief Growth analysis of a product idea."""
        if ctx.context.growth_calls >= 1:
            return "Growth has already been consulted. Use the existing analysis."
        ctx.context.growth_calls += 1
        brief = (f"Original user question (source of truth): {ctx.context.original_question}\n"
                 f"Product's specialist task (may not change the original intent): {question[:700]}")
        result = await Runner.run(growth, brief, max_turns=1,
                                  run_config=RunConfig(tracing_disabled=True))
        ctx.context.growth_usage.append(result.context_wrapper.usage)
        ctx.context.growth_output = str(result.final_output)
        return ctx.context.growth_output

    product_model, product_settings = agent_model_config(
        "head_of_product",
        override,
        max_tokens=260,
        parallel_tool_calls=False,
        tool_choice="required",
    )
    return Agent(
        name="Tassla Head of Product", model=product_model,
        instructions=LEGAL_POLICY + "Tassla is a free puppy guidance app funded by partners. Welfare and independent advice come first. Preserve the user's actual question, target actor and hypothesis when consulting Growth once. Distinguish breeders distributing Tassla from puppy owners using it. Natural benefits are incentives too; do not turn a question about needing a reward program into an assumed requirement to build one. Assess the simplest no-program baseline first, without automatically agreeing with the user. Correct specialist drift before recommending. Never invent evidence; label numerical thresholds as proposed, unvalidated criteria. Internal analysis only; no external messages. Plain Swedish: question/target actor, recommendation, cheapest behavioural test; at most 120 words.",
        tools=[consult_growth],
        model_settings=product_settings,
    )

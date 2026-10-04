"""Bounded Product/Growth smoke test; running this file uses the OpenAI API."""
from .growth import build_growth_agent

from dataclasses import dataclass, field

from .policy import LEGAL_POLICY
from agents import Agent, ModelSettings, RunConfig, RunContextWrapper, Runner, function_tool

@dataclass
class TestContext:
    original_question: str = ''
    growth_calls: int = 0
    growth_usage: list = field(default_factory=list)
    growth_output: str = ''

def build_product_agent(model: str):
    growth = build_growth_agent(model)

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

    return Agent(
        name="Tassla Head of Product", model=model,
        instructions=LEGAL_POLICY + "Tassla is a free puppy guidance app funded by partners. Welfare and independent advice come first. Preserve the user's actual question, target actor and hypothesis when consulting Growth once. Distinguish breeders distributing Tassla from puppy owners using it. Natural benefits are incentives too; do not turn a question about needing a reward program into an assumed requirement to build one. Assess the simplest no-program baseline first, without automatically agreeing with the user. Correct specialist drift before recommending. Never invent evidence; label numerical thresholds as proposed, unvalidated criteria. Internal analysis only; no external messages. Plain Swedish: question/target actor, recommendation, cheapest behavioural test; at most 120 words.",
        tools=[consult_growth],
        model_settings=ModelSettings(max_tokens=260, parallel_tool_calls=False, tool_choice="required"),
    )

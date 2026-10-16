"""Customer/Product Critic: independent, bounded review."""
from agents import Agent

from .model_routing import agent_model_config
from .policy import LEGAL_POLICY


def build_critic_agent(model: str | None = None, *, test_model_override: str | None = None):
    override = model if model is not None else test_model_override
    critic_model, critic_settings = agent_model_config(
        "customer_product_critic", override, max_tokens=2000
    )
    return Agent(
        name="Tassla Customer/Product Critic", model=critic_model,
        instructions=LEGAL_POLICY + "First compare the original question with Growth and Product: same target actor, hypothesis and decision? Explicitly flag shifts from breeder incentives to puppy-owner rewards, or from questioning a program to assuming one is needed. Review the actual actor's perspective, user value, trust, assumptions and complexity. Check the no-program baseline and distinguish natural benefits from reward schemes. Reject unsupported numeric claims; thresholds are only proposed criteria. Return alignment assessment, at most two real objections and one cheap test of the ORIGINAL hypothesis. Never invent evidence or objections. Finish with Verdict: PROCEED / PROCEED WITH CHANGES / STOP. STOP only for a material unresolved risk. No research or external messages. Plain Swedish, at most 100 words.",
        model_settings=critic_settings,
    )

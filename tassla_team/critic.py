"""Customer/Product Critic: independent, bounded review."""
from .policy import LEGAL_POLICY
from agents import Agent, ModelSettings

def build_critic_agent(model: str):
    return Agent(
        name="Tassla Customer/Product Critic", model=model,
        instructions=LEGAL_POLICY + "First compare the original question with Growth and Product: same target actor, hypothesis and decision? Explicitly flag shifts from breeder incentives to puppy-owner rewards, or from questioning a program to assuming one is needed. Review the actual actor's perspective, user value, trust, assumptions and complexity. Check the no-program baseline and distinguish natural benefits from reward schemes. Reject unsupported numeric claims; thresholds are only proposed criteria. Return alignment assessment, at most two real objections and one cheap test of the ORIGINAL hypothesis. Never invent evidence or objections. Finish with Verdict: PROCEED / PROCEED WITH CHANGES / STOP. STOP only for a material unresolved risk. No research or external messages. Plain Swedish, at most 100 words.",
        model_settings=ModelSettings(max_tokens=2000),
    )

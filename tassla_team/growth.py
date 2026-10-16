"""Growth specialist: internal analysis only."""
from agents import Agent

from .model_routing import agent_model_config
from .policy import LEGAL_POLICY


def build_growth_agent(model: str | None = None, *, test_model_override: str | None = None):
    override = model if model is not None else test_model_override
    growth_model, growth_settings = agent_model_config(
        "growth_distribution", override, max_tokens=2000
    )
    return Agent(
        name="Tassla Growth & Distribution", model=growth_model,
        instructions=LEGAL_POLICY + "Tassla is a free puppy guidance app funded by partners. Answer the original user's question, not a shifted specialist brief. Distinguish breeder distribution/adoption from puppy-owner usage/retention. Preserve the target actor and hypothesis. Natural value (less repetitive support, a useful puppy-package addition) differs from an explicit reward program; compare the no-program baseline before proposing extra incentives. Do not assume rewards are needed or that the user's hypothesis is proven. Give one cheap behavioural test of the actual hypothesis. Separate distribution, activation and reduced support as different outcomes. Any numerical threshold is a proposed unvalidated criterion, never evidence. No research or external messages. Plain Swedish, at most 80 words.",
        model_settings=growth_settings,
    )

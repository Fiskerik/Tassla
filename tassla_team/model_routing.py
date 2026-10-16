"""Role-specific OpenAI Agents SDK model and reasoning settings."""
from dataclasses import dataclass

from agents import ModelSettings


@dataclass(frozen=True)
class ModelRoute:
    model: str
    reasoning_effort: str | None


ROLE_ROUTES = {
    "head_of_product": ModelRoute("gpt-6-luna", "medium"),
    "growth_distribution": ModelRoute("gpt-6-luna", "low"),
    "customer_product_critic": ModelRoute("gpt-6-luna", "medium"),
    "commercial_lead": ModelRoute("gpt-6-luna", "medium"),
    "partnerships": ModelRoute("gpt-6-luna", "low"),
    "market_intelligence": ModelRoute("gpt-6-luna", "low"),
    "commercial_analyst": ModelRoute("gpt-6.1-sol", "high"),
    "ai_tech_lead": ModelRoute("gpt-6-luna", "medium"),
    "codex_implementation_adviser": ModelRoute("gpt-6.1-sol", "high"),
    "qa": ModelRoute("gpt-6-luna", "medium"),
    "chief_router": ModelRoute("gpt-6-luna", "low"),
    "chief_synthesis": ModelRoute("gpt-6-luna", "low"),
}

ROLE_DISPLAY_NAMES = {
    "chief_router": "Chief of Staff: routing",
    "head_of_product": "Head of Product",
    "growth_distribution": "Growth & Distribution",
    "customer_product_critic": "Customer/Product Critic",
    "commercial_lead": "Commercial Lead",
    "partnerships": "Partnerships",
    "market_intelligence": "Market Intelligence",
    "commercial_analyst": "Commercial Analyst",
    "ai_tech_lead": "AI Tech Lead",
    "codex_implementation_adviser": "Codex implementation adviser",
    "qa": "QA",
    "chief_synthesis": "Chief of Staff: synthesis",
}

TEAM_LEAD_ROLES = {
    "product": "head_of_product",
    "commercial": "commercial_lead",
    "dev": "ai_tech_lead",
}

SPECIALIST_ROLES = {
    "growth": "growth_distribution",
    "critic": "customer_product_critic",
    "partnerships": "partnerships",
    "market_intelligence": "market_intelligence",
    "commercial_analyst": "commercial_analyst",
    "codex": "codex_implementation_adviser",
    "qa": "qa",
}


def resolve_route(role_id: str, test_model_override: str | None = None) -> ModelRoute:
    """Return one role route, or the explicit global test model without reasoning."""
    if role_id not in ROLE_ROUTES:
        raise KeyError(f"Unknown Tassla SDK role: {role_id}")
    if test_model_override:
        return ModelRoute(test_model_override, None)
    return ROLE_ROUTES[role_id]


def agent_model_config(
    role_id: str,
    test_model_override: str | None = None,
    **settings,
) -> tuple[str, ModelSettings]:
    """Build SDK settings while retaining per-agent token/tool limits."""
    route = resolve_route(role_id, test_model_override)
    kwargs = dict(settings)
    if route.reasoning_effort:
        kwargs["reasoning"] = {"effort": route.reasoning_effort}
    return route.model, ModelSettings(**kwargs)

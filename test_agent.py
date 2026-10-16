"""Run a small Product team test; --critic adds independent review and synthesis."""
import argparse
import os
from dotenv import load_dotenv
from agents import Agent, RunConfig, Runner

from tassla_team.critic import build_critic_agent
from tassla_team.model_routing import agent_model_config, resolve_route
from tassla_team.policy import LEGAL_POLICY
from tassla_team.product import TestContext, build_product_agent


def build_head_of_product_synthesis(test_model_override: str | None = None):
    model, settings = agent_model_config(
        "head_of_product", test_model_override, max_tokens=260
    )
    return Agent(name="Tassla Head of Product", model=model,
        instructions=LEGAL_POLICY + "Answer the ORIGINAL question with its target actor and hypothesis intact. Correct drift in Growth/Product rather than repeating it; explicitly address Critic objections. Distinguish breeder distribution from owner retention, and natural value from reward programs. Assess the no-program baseline without automatically agreeing with the user. Separate assumptions from evidence and label numeric criteria as proposed/unvalidated. Recommend a concrete behavioural test of the original hypothesis; the human decides. No tools or external messages. Plain Swedish, at most 120 words.",
        model_settings=settings)


def main():
    parser = argparse.ArgumentParser(description="Tassla Product-teamtest (använder API-tokens)")
    parser.add_argument("question", nargs="?", default="Bör Tassla ha en marknadsplats för hundpassning i MVP?")
    parser.add_argument("--critic", action="store_true", help="Lägg till Critic och Products slutliga sammanvägning")
    args = parser.parse_args()
    if len(args.question) > 1500:
        parser.error("Använd högst 1500 tecken under testfasen.")
    load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY saknas i miljön eller .env.")
    test_model_override = os.getenv("TASSLA_TEST_MODEL") or None
    config = RunConfig(tracing_disabled=True)
    context = TestContext(original_question=args.question)
    product = Runner.run_sync(
        build_product_agent(test_model_override=test_model_override),
        args.question,
        context=context,
        max_turns=2,
        run_config=config,
    )
    usages = [("Product + verktygsanrop", product.context_wrapper.usage)]
    usages.extend(("Growth", usage) for usage in context.growth_usage)
    print("\n--- Growth ---\n" + (context.growth_output or "Inget Growth-underlag mottaget."))
    print("\n--- Product: förslag ---\n" + str(product.final_output))
    if args.critic:
        critic = Runner.run_sync(
            build_critic_agent(test_model_override=test_model_override),
            f"Fråga: {args.question}\nGrowth: {context.growth_output}\nProduct: {product.final_output}",
            max_turns=1,
            run_config=config,
        )
        usages.append(("Critic", critic.context_wrapper.usage))
        print("\n--- Customer/Product Critic ---\n" + str(critic.final_output))
        if "STOP" in str(critic.final_output).upper():
            print("\nSTOP: kräver ditt beslut. Ingen automatisk sammanvägning görs.")
        else:
            synthesis = build_head_of_product_synthesis(test_model_override)
            final = Runner.run_sync(synthesis,
                f"Fråga: {args.question}\nGrowth: {context.growth_output}\nProduct: {product.final_output}\nCritic: {critic.final_output}",
                max_turns=1, run_config=config)
            usages.append(("Product: slutsats", final.context_wrapper.usage))
            print("\n--- Product: slutsats ---\n" + str(final.final_output))
    if test_model_override:
        print(f"\nModel override: {test_model_override}; Growth calls: {context.growth_calls}")
    else:
        print(
            f"\nProduct model: {resolve_route('head_of_product').model}; "
            f"Growth model: {resolve_route('growth_distribution').model}; "
            f"Growth calls: {context.growth_calls}"
        )
    for role, usage in usages:
        print(f"{role}: requests={usage.requests}, input={usage.input_tokens}, output={usage.output_tokens}")
    print("Requests:", sum(u.requests for _, u in usages))
    print("Input tokens:", sum(u.input_tokens for _, u in usages))
    print("Output tokens:", sum(u.output_tokens for _, u in usages))


if __name__ == "__main__":
    main()

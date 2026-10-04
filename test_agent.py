"""Run a small Product team test; --critic adds independent review and synthesis."""
import argparse
import os
from dotenv import load_dotenv
from agents import Agent, ModelSettings, RunConfig, Runner
from tassla_team.product import TestContext, build_product_agent
from tassla_team.critic import build_critic_agent
from tassla_team.policy import LEGAL_POLICY

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
    model = os.getenv("TASSLA_TEST_MODEL", "gpt-4.1-nano")
    config = RunConfig(tracing_disabled=True)
    context = TestContext(original_question=args.question)
    product = Runner.run_sync(build_product_agent(model), args.question, context=context,
                              max_turns=2, run_config=config)
    usages = [("Product + verktygsanrop", product.context_wrapper.usage)]
    usages.extend(("Growth", usage) for usage in context.growth_usage)
    print("\n--- Growth ---\n" + (context.growth_output or "Inget Growth-underlag mottaget."))
    print("\n--- Product: förslag ---\n" + str(product.final_output))
    if args.critic:
        critic = Runner.run_sync(build_critic_agent(model),
            f"Fråga: {args.question}\nGrowth: {context.growth_output}\nProduct: {product.final_output}",
            max_turns=1, run_config=config)
        usages.append(("Critic", critic.context_wrapper.usage))
        print("\n--- Customer/Product Critic ---\n" + str(critic.final_output))
        # A STOP is escalated to the human; Product cannot overrule it.
        if "STOP" in str(critic.final_output).upper():
            print("\nSTOP: kräver ditt beslut. Ingen automatisk sammanvägning görs.")
        else:
            synthesis = Agent(name="Tassla Head of Product", model=model,
                instructions=LEGAL_POLICY + "Answer the ORIGINAL question with its target actor and hypothesis intact. Correct drift in Growth/Product rather than repeating it; explicitly address Critic objections. Distinguish breeder distribution from owner retention, and natural value from reward programs. Assess the no-program baseline without automatically agreeing with the user. Separate assumptions from evidence and label numeric criteria as proposed/unvalidated. Recommend a concrete behavioural test of the original hypothesis; the human decides. No tools or external messages. Plain Swedish, at most 120 words.",
                model_settings=ModelSettings(max_tokens=260))
            final = Runner.run_sync(synthesis,
                f"Fråga: {args.question}\nGrowth: {context.growth_output}\nProduct: {product.final_output}\nCritic: {critic.final_output}",
                max_turns=1, run_config=config)
            usages.append(("Product: slutsats", final.context_wrapper.usage))
            print("\n--- Product: slutsats ---\n" + str(final.final_output))
    print(f"\nModel: {model}; Growth calls: {context.growth_calls}")
    for role, usage in usages:
        print(f"{role}: requests={usage.requests}, input={usage.input_tokens}, output={usage.output_tokens}")
    print("Requests:", sum(u.requests for _, u in usages))
    print("Input tokens:", sum(u.input_tokens for _, u in usages))
    print("Output tokens:", sum(u.output_tokens for _, u in usages))

if __name__ == "__main__":
    main()

"""Selective team routing; --chat retains bounded history in memory only."""
import argparse
import os
from dotenv import load_dotenv

def show(result):
    if result.plan:
        for request in result.plan.requests:
            print(f"\nTeam: {request.team}; roller: {', '.join(request.roles) or 'enbart teamledaren'}")
            print("Skäl:", request.reason)
    for name, text, usage in result.steps:
        if name != "AI Chief of Staff: routing":
            print(f"\n--- {name} ---\n{text}")
        print(f"[{name}: input={usage.input_tokens}, output={usage.output_tokens}]")
    if not result.steps or result.steps[-1][0] != "AI Chief of Staff":
        print("\nSvar:\n" + result.answer)
    print("Requests:", sum(u.requests for _, _, u in result.steps))
    print("Input tokens:", sum(u.input_tokens for _, _, u in result.steps))
    print("Output tokens:", sum(u.output_tokens for _, _, u in result.steps))

def main():
    parser = argparse.ArgumentParser(description="Tassla AI-team: endast relevanta roller, API-kostnad per fråga")
    parser.add_argument("question", nargs="?")
    parser.add_argument("--chat", action="store_true", help="Följdfrågor med kort minne under samma session")
    parser.add_argument("--roles", action="store_true", help="Visa roller, modell och reasoning utan API-anrop")
    parser.add_argument("--project-context", action="store_true", help="Skicka begränsade utdrag ur vision, MVP och revenue till API:t")
    args = parser.parse_args()
    load_dotenv()
    model = os.getenv("TASSLA_TEST_MODEL", "gpt-4.1-nano")
    if args.roles:
        from tassla_team.organisation import TEAMS
        print(f"SDK | Chief of Staff | model={model} | reasoning: inte explicit inställt (nano har inget reasoning-level)")
        for team in TEAMS.values():
            for name in [team['lead'], *[role[0] for role in team['roles'].values()]]:
                print(f"SDK | {name} | model={model} | reasoning: inte explicit inställt")
        from pathlib import Path
        import tomllib
        root = Path(__file__).resolve().parent
        for folder, state in [('agents', 'aktiv'), ('agents-later', 'vilande')]:
            for path in sorted((root / '.codex' / folder).glob('*.toml')):
                data = tomllib.loads(path.read_text(encoding='utf-8-sig'))
                print(f"Codex ({state}) | {data['name']} | model={data.get('model', 'ärvd')} | reasoning={data.get('model_reasoning_effort', 'ärvt')}")
        return
    if not args.chat and not args.question:
        parser.error("Ange en fråga eller --chat.")
    from tassla_team.chief_of_staff import run_question
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY saknas.")
    project_context = ''
    if args.project_context:
        from tassla_team.project_context import load_project_context
        project_context = load_project_context()
        print("Projektutdrag aktiverade: vision, MVP och revenue. Högst 6000 innehållstecken.")
    print("Modell:", model)
    history = []
    question = args.question
    while True:
        if question is None:
            try:
                question = input("\nDu (/quit avslutar, /reset tömmer minnet): ").strip()
            except (EOFError, KeyboardInterrupt):
                break
        if question == "/quit":
            break
        if question == "/reset":
            history.clear()
            question = None
            continue
        if not question or len(question) > 1500:
            print("Ange 1–1500 tecken.")
            if not args.chat:
                break
            question = None
            continue
        result = run_question(question, model, "\n".join(history)[-2400:], project_context=project_context)
        show(result)
        history.append(f"User: {question}\nAssistant: {result.answer}")
        history = history[-2:]
        if not args.chat:
            break
        question = None

if __name__ == "__main__":
    main()

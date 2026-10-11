"""Selective team routing; --chat retains bounded history in memory only."""
import argparse
import os
from dotenv import load_dotenv
from tassla_team.display import show, working

def main():
    parser = argparse.ArgumentParser(description="Tassla AI-team: endast relevanta roller, API-kostnad per fråga")
    parser.add_argument("question", nargs="?")
    parser.add_argument("--chat", action="store_true", help="Följdfrågor med kort minne under samma session")
    parser.add_argument("--roles", action="store_true", help="Visa roller, modell och reasoning utan API-anrop")
    parser.add_argument("--project-context", action="store_true", help="Föråldrad: repo-underlag är nu alltid på")
    parser.add_argument("--no-repo", action="store_true", help="Stäng av repo-underlag (sparar tokens, ger generella svar)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Visa routing, alla roller och alla källor")
    parser.add_argument("--plain", action="store_true", help="Ingen färg eller ramtecken (för loggar och enkla terminaler)")
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
        print("Obs: --project-context behövs inte längre; repo-underlag är alltid på (stäng av med --no-repo).")
    print("Modell:", model)
    if args.chat:
        print("/quit avslutar · /reset tömmer minnet" if not args.plain else "/quit avslutar, /reset tömmer minnet")
    history = []
    question = args.question
    while True:
        if question is None:
            try:
                question = input("\nDu > ").strip()
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
        with working(plain=args.plain):
            result = run_question(question, model, "\n".join(history)[-2400:], project_context=project_context,
                                  use_repo=not args.no_repo)
        show(result, verbose=args.verbose, plain=args.plain)
        history.append(f"User: {question}\nAssistant: {result.answer}")
        history = history[-2:]
        if not args.chat:
            break
        question = None

if __name__ == "__main__":
    main()

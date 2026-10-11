"""Offline checks for the terminal renderer. No API, no network."""
import io
import os
import re
import sys
from pathlib import Path
from types import SimpleNamespace as NS

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tassla_team.display import show  # noqa: E402

ANSI = re.compile(r"\x1b\[")
usage = lambda i, o: NS(requests=1, input_tokens=i, output_tokens=o)  # noqa: E731
_saved_force_color = os.environ.pop("FORCE_COLOR", None)
_saved_no_color = os.environ.pop("NO_COLOR", None)


class _Pipe(io.StringIO):
    encoding = "utf-8"

    def isatty(self):
        return False


def render(answer="Svar med **" + "fet text " * 30 + "slut** och mer.",
           sources=("docs/mvp.md (scope)", "git: senaste commits"), verbose=False, plain=False, steps=None, plan=None):
    steps = steps if steps is not None else [("AI Chief of Staff: routing", "p", usage(10, 1)), ("AI Chief of Staff", "x", usage(5, 2))]
    plan = plan or NS(requests=[NS(team="product", roles=["growth"], reason="skäl")])
    result = NS(answer=answer, steps=steps, plan=plan, sources=list(sources))
    out = _Pipe()
    sys.stdout, real = out, sys.stdout
    try:
        show(result, verbose=verbose, plain=plain, stream=out)
    finally:
        sys.stdout = real
    return out.getvalue()


os.environ.pop("FORCE_COLOR", None)
plain = render()
assert not ANSI.search(plain), "pipes must never get colour codes"
assert "**" not in plain, "markdown bold must not leak into plain output"
assert "Källor" in plain and "Team" in plain and "Åtgång" in plain and "-v visar" in plain
assert "Roller" not in plain, "standard view must stay compact"

os.environ["FORCE_COLOR"] = "1"
colour = render()
assert ANSI.search(colour) and "**" not in colour, "colour on, bold converted, no stray asterisks"
assert colour.count("\x1b[1m") >= 2, "a bold span that wraps must be re-opened on the next line"
os.environ.pop("FORCE_COLOR")
os.environ["NO_COLOR"] = "1"
assert not ANSI.search(render()), "NO_COLOR must be respected"
os.environ.pop("NO_COLOR")

assert not ANSI.search(render(plain=True))
assert "STOP – ditt beslut behövs" in render(answer="Critic begär STOP. Ditt beslut behövs.")
assert "Varning" in render(sources=("docs/tasks/dev/queue.json: KUNDE INTE LÄSAS",)), "grounding failure must be visible"

steps = [("AI Chief of Staff: routing", "p", usage(10, 1)), ("Growth & Distribution", "growth-text", usage(5, 2)),
         ("AI Chief of Staff", "chief-text", usage(5, 2))]
verbose = render(verbose=True, steps=steps)
assert "growth-text" in verbose and "Alla källor" in verbose
assert "chief-text" not in verbose, "final Chief step duplicates the answer and must be omitted"
assert "inget team behövdes" in render(plan=NS(requests=[]))
if _saved_force_color is not None:
    os.environ["FORCE_COLOR"] = _saved_force_color
if _saved_no_color is not None:
    os.environ["NO_COLOR"] = _saved_no_color
print("Display checks passed: compact default, -v details, plain/NO_COLOR, bold across wraps, STOP, visible grounding failure.")

"""Terminal output for run_team.py: the answer first, details only on request (-v). Stdlib only.

Colour is used for hierarchy (headings, roles, warnings), not decoration. It switches itself off for
pipes, NO_COLOR and --plain, and falls back to ASCII if the console cannot print the box characters.
"""
from __future__ import annotations

import contextlib
import os
import re
import shutil
import sys
import textwrap

_BULLET = re.compile(r"^(\s*)([-*•]|\d+[.)])\s+(.*)$")
ROUTING = "AI Chief of Staff: routing"
CHIEF = "AI Chief of Staff"


def _enable_ansi() -> bool:
    """Windows consoles need virtual-terminal processing switched on for the process."""
    if os.name != "nt":
        return True
    try:
        import ctypes

        kernel = ctypes.windll.kernel32
        handle = kernel.GetStdHandle(-11)
        mode = ctypes.c_uint()
        if not kernel.GetConsoleMode(handle, ctypes.byref(mode)):
            return False
        return bool(kernel.SetConsoleMode(handle, mode.value | 0x0004))
    except Exception:  # noqa: BLE001 - any failure just means "no colour"
        return False


class Theme:
    def __init__(self, plain: bool = False, stream=None):
        stream = stream or sys.stdout
        forced = bool(os.getenv("FORCE_COLOR"))
        self.color = not plain and not os.getenv("NO_COLOR") and (
            forced or (hasattr(stream, "isatty") and stream.isatty() and _enable_ansi()))
        try:
            "─·▸›→".encode(getattr(stream, "encoding", None) or "ascii")
            self.fancy = not plain
        except (UnicodeEncodeError, LookupError):
            self.fancy = False
        columns = shutil.get_terminal_size((100, 20)).columns
        self.width = max(60, min(columns - 2, 96))
        self.rule_char, self.dot, self.arrow, self.tick = ("─", "·", "→", "▸") if self.fancy else ("-", "-", "->", ">")

    def paint(self, text: str, *codes: str) -> str:
        return f"\033[{';'.join(codes)}m{text}\033[0m" if self.color and text else text

    def heading(self, text: str, warn: bool = False) -> str:
        return "  " + self.paint(text, "1", "93" if warn else "96")

    def dim(self, text: str) -> str:
        return self.paint(text, "2")

    def rule(self) -> str:
        return "  " + self.dim(self.rule_char * (self.width - 2))

    def block(self, text: str, indent: int = 2, dim: bool = False) -> str:
        """Wrap prose to the terminal, keep bullets hanging, turn **bold** into real bold."""
        out, bold = [], False
        for raw in text.strip().splitlines():
            if not raw.strip():
                out.append("")
                continue
            match = _BULLET.match(raw)
            if match:
                lead, bullet, rest = match.groups()
                first = " " * indent + lead + bullet + " "
                later = " " * len(first)
            else:
                rest, first, later = raw.strip(), " " * indent, " " * indent
            for line in textwrap.wrap(rest, width=self.width, initial_indent=first, subsequent_indent=later,
                                      break_long_words=False, break_on_hyphens=False) or [first]:
                pieces, rendered = line.split("**"), ""
                for index, piece in enumerate(pieces):
                    if index:
                        bold = not bold
                    code = ("1" if bold else "") if not dim else "2"
                    rendered += self.paint(piece, code) if code else piece
                out.append(rendered)
        return "\n".join(out)


def _short(label: str) -> str:
    if label.startswith("git:"):
        return "git"
    if label.startswith("queue:"):
        return label
    return os.path.basename(label.split(" ")[0])


def _compact_sources(sources: list[str], dot: str = "·", limit: int = 4) -> str:
    names = list(dict.fromkeys(_short(s) for s in sources if "KUNDE INTE LÄSAS" not in s))
    extra = f" +{len(names) - limit} till" if len(names) > limit else ""
    return f" {dot} ".join(names[:limit]) + extra if names else "inga"


def _n(value: int) -> str:
    return f"{value:,}".replace(",", " ")


def _team_line(plan) -> str:
    if not plan or not plan.requests:
        return "inget team behövdes (direkt svar)"
    return " + ".join(f"{r.team} ({', '.join(r.roles) or 'enbart teamledaren'})" for r in plan.requests)


def show(result, verbose: bool = False, plain: bool = False, stream=None) -> None:
    t = Theme(plain, stream)
    stop = result.answer.startswith("Critic begär STOP")
    usages = [u for _, _, u in result.steps]
    failed = [s for s in result.sources if "KUNDE INTE LÄSAS" in s]

    print()
    print(t.heading("STOP – ditt beslut behövs" if stop else "Svar", warn=stop))
    print(t.rule())
    print(t.block(result.answer))
    print()

    def row(label: str, value: str) -> None:
        print("  " + t.dim(f"{label:<8}") + value)

    if failed:
        print("  " + t.paint("Varning  underlaget kunde inte läsas helt: " + "; ".join(failed), "1", "93"))
    row("Källor", _compact_sources(result.sources, t.dot))
    row("Team", _team_line(result.plan))
    row("Åtgång", f"{sum(u.requests for u in usages)} anrop {t.dot} "
                  f"{_n(sum(u.input_tokens for u in usages))} in / {_n(sum(u.output_tokens for u in usages))} ut tokens")
    if not verbose:
        print("  " + t.dim("-v visar roller, skäl och alla källor"))
        return

    print("\n" + t.heading("Routing"))
    print(t.rule())
    for request in (result.plan.requests if result.plan else []):
        roles = ", ".join(request.roles) or "enbart teamledaren"
        print("  " + t.paint(request.team, "1") + f" {t.arrow} {roles}")
        print(t.block("Skäl: " + request.reason, indent=4, dim=True))

    steps = [s for s in result.steps if s[0] != ROUTING]
    if steps and steps[-1][0] == CHIEF:
        steps = steps[:-1]  # identical to the answer above
    if steps:
        print("\n" + t.heading("Roller"))
        print(t.rule())
    for name, text, usage in steps:
        print("  " + t.paint(f"{t.tick} {name}", "1", "95") + t.dim(f"   in {_n(usage.input_tokens)} {t.dot} ut {_n(usage.output_tokens)}"))
        print(t.block(text, indent=4))
        print()

    print(t.heading("Alla källor"))
    print(t.rule())
    for source in result.sources:
        print("  " + (t.paint(f"{t.dot} {source}", "93") if "KUNDE INTE LÄSAS" in source else t.dim(f"{t.dot} ") + source))


@contextlib.contextmanager
def working(label: str = "Arbetar…", plain: bool = False, stream=None):
    """Shows a dim status line while the models run, then erases it. Silent when not a colour terminal."""
    stream = stream or sys.stdout
    t = Theme(plain, stream)
    if not t.color:
        yield
        return
    stream.write("\n  " + t.dim(label))
    stream.flush()
    try:
        yield
    finally:
        stream.write("\r\033[K")
        stream.flush()

"""Always-on, read-only repo grounding for the SDK team (stdlib only, no new dependency).

The agents get no file tools. Instead this module reads an allowlist of repo docs and builds a
labelled REPO-UNDERLAG block that is put into every brief:

  1. STATUS   digest of docs/tasks/dev/queue.json: what is done / blocked / planned
  2. SCOPE    docs/mvp.md outline plus the 'Utanför MVP' section
  3. TASKS    full record for any task id named in the question (e.g. LOGGA-EDIT)
  4. SECTIONS top-ranked doc sections for THIS question (keyword ranking, max 2 per file)
  5. RECENT   latest commits, uncommitted changes and newest files, read with fixed read-only git
              commands by this program (agents never get a shell)

Every block carries its source label so agents can cite it. E-mail addresses and phone numbers
are redacted before anything leaves the machine. Read failures are reported inside the block
instead of silently dropping the grounding.
"""
from __future__ import annotations

import json
import math
import re
import subprocess
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE = "docs/tasks/dev/queue.json"
MVP = "docs/mvp.md"

# Explicit allowlist; extend deliberately. Nothing outside docs/ is ever read.
ALLOW = ("docs/*.md", "docs/decisions/*.md", "docs/plans/*.md", "docs/releases/*.md",
         "docs/tasks/*.md", "docs/tasks/dev/*.md")
DENY = ("docs/privacy/", "docs/tasks/breeder-interviews-pilot.md", "docs/tasks/dev/beta-account.md")
SOURCE_OF_TRUTH = {"docs/vision.md", "docs/mvp.md", "docs/revenue.md", "docs/design-rules.md"}

MAX_CHUNK = 1400       # chars shown per retrieved section
MAX_PER_FILE = 2       # keeps one big document from crowding out the rest
TOP_K = 5
MAX_TOTAL = 12000      # hard cap for the whole REPO-UNDERLAG block (chars, ~3k tokens); sections get what is left
MIN_RELATIVE = 0.4    # weakest accepted score relative to the best section

_STOP = set("""och att det som för med den har inte jag vi är ska kan på av en ett om till vad hur vilka vilken
bör när så men eller också från finns något detta denna ska skulle man vara blir bli the and for with what how
are this that you your""".split())
_WORD = re.compile(r"[a-zåäöé0-9][a-zåäöé0-9_-]{2,}")
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE = re.compile(r"(?<![\d-])(?:\+46|0)[\s-]?\d(?:[\s-]?\d){7,9}(?!\d)")


@dataclass
class RepoContext:
    text: str = ""
    sources: list[str] = field(default_factory=list)


def redact(text: str) -> str:
    return _PHONE.sub("[telefon]", _EMAIL.sub("[e-post]", text))


_SUFFIXES = ("ningarna", "ningar", "ningen", "arnas", "ernas", "ornas", "arna", "erna", "orna", "ning",
             "ande", "aren", "are", "ens", "ar", "er", "or", "en", "et", "na", "a")


def _stem(word: str) -> str:
    # Light Swedish stemmer: strip one common suffix, then cap length so compounds still overlap.
    # valparna -> valp, uppfödare/uppfödning -> uppföd, hundpassning != hundprofil.
    for suffix in _SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 4:
            word = word[: -len(suffix)]
            break
    return word[:7]


def _stems(text: str) -> list[str]:
    return [_stem(w) for w in _WORD.findall(text.lower()) if w not in _STOP]


def _read(relative: str) -> str:
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError("Repo context must stay inside the repository")
    return path.read_text(encoding="utf-8-sig", errors="replace")


# --------------------------------------------------------------------------- STATUS / TASKS

def _load_queue() -> dict:
    return json.loads(_read(QUEUE))


def status_digest(queue: dict, limit: int = 3400) -> str:
    tasks = queue.get("tasks", [])
    by_status: dict[str, list] = {}
    for task in tasks:
        by_status.setdefault(task.get("status", "?"), []).append(task)
    segment = str(queue.get("segment", "?"))[:160]
    lines = [f"[STATUS ur {QUEUE}; {len(tasks)} uppgifter; segment: {segment}]"]
    order = ["blocked", "implementing", "qa", "review", "ready", "planned", "done"]
    order += [s for s in by_status if s not in order]
    for status in order:
        items = by_status.get(status)
        if not items:
            continue
        if status == "done":
            body = "; ".join(f"{t['id']} ({str(t.get('title', ''))[:48]})" for t in items)
            lines.append(f"Klart ({len(items)}): {body}")
        else:
            lines.append(f"{status.capitalize()} ({len(items)}):")
            for t in items:
                lines.append(f"- {t['id']}: {str(t.get('title', ''))[:70]} -> nästa: {str(t.get('next_step', ''))[:150]}")
    text = "\n".join(lines)
    return text if len(text) <= limit else text[:limit] + " …[avkortat]"


def task_details(queue: dict, question: str) -> tuple[str, list[str]]:
    q = question.lower()
    blocks, labels = [], []
    for t in queue.get("tasks", []):
        if t["id"].lower() not in q:
            continue
        history = t.get("history", [])[-2:]
        evidence = " | ".join(f"{h.get('from')}->{h.get('to')} ({h.get('actor')}): {str(h.get('evidence', ''))[:200]}"
                              for h in history)
        acceptance = "; ".join(str(a)[:120] for a in t.get("acceptance", [])[:4])
        blocks.append(
            f"[queue:{t['id']}] {t.get('title', '')} | status={t.get('status')} | beror på={t.get('depends_on', [])}\n"
            f"MVP-krav: {t.get('mvp_requirement', '?')} | plan: {t.get('plan', '?')}\n"
            f"Acceptans: {acceptance}\nSenaste historik: {evidence}\nNästa steg: {str(t.get('next_step', ''))[:300]}")
        labels.append(f"queue:{t['id']}")
    return "\n\n".join(blocks), labels


# --------------------------------------------------------------------------- SCOPE

def scope_block(limit: int = 2400) -> str:
    text = _read(MVP)
    headings = [line.strip() for line in text.splitlines() if line.startswith(("## ", "### "))]
    out = [f"[SCOPE {MVP}; rubriker]", " | ".join(h.lstrip("# ") for h in headings)]
    match = re.search(r"^## Utanför MVP\s*$(.*?)(?=^## |\Z)", text, re.S | re.M)
    if match:
        out += [f"[{MVP} §Utanför MVP]", match.group(1).strip()[:1500]]
    block = "\n".join(out)
    return block if len(block) <= limit else block[:limit] + " …[avkortat]"


# --------------------------------------------------------------------------- SECTIONS

@dataclass
class _Chunk:
    path: str
    heading: str
    text: str
    tf: Counter
    head_tf: Counter
    size: int


def _split(path: str, text: str) -> list[_Chunk]:
    chunks, heading, buf, in_fence = [], "(inledning)", [], False

    def flush():
        body = "\n".join(buf).strip()
        if len(body) >= 80:
            chunks.append(_Chunk(path, heading, body, Counter(_stems(body)), Counter(_stems(heading)), len(body)))

    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
        if line.startswith("#") and not in_fence:
            flush()
            heading, buf = line.lstrip("#").strip(), []
        else:
            buf.append(line)
    flush()
    return chunks


def _allowed_files() -> list[str]:
    seen = set()
    for pattern in ALLOW:
        for path in sorted(ROOT.glob(pattern)):
            relative = path.relative_to(ROOT).as_posix()
            if any(relative.startswith(d) or relative == d for d in DENY):
                continue
            seen.add(relative)
    return sorted(seen)


def retrieve(query: str, top_k: int = TOP_K, char_budget: int = 6000) -> tuple[str, list[str]]:
    q_stems = set(_stems(query))
    if not q_stems:
        return "", []
    chunks: list[_Chunk] = []
    for relative in _allowed_files():
        try:
            chunks += _split(relative, _read(relative))
        except OSError:
            continue
    if not chunks:
        return "", []
    df = Counter()
    for c in chunks:
        df.update(c.tf.keys())
    n = len(chunks)

    def score(c: _Chunk) -> float:
        total = 0.0
        for s in q_stems:
            if s in c.tf or s in c.head_tf:
                idf = math.log(1 + n / (1 + df[s]))
                total += idf * (1 + math.log(1 + c.tf[s])) * (1 + 1.5 * min(c.head_tf[s], 1))
        boost = 1.4 if c.path in SOURCE_OF_TRUTH else 1.0
        return total * boost / (c.size ** 0.15)

    scores = {id(c): score(c) for c in chunks}
    ranked = sorted(chunks, key=lambda c: scores[id(c)], reverse=True)
    best = scores[id(ranked[0])]
    picked, per_file, used, labels = [], Counter(), 0, []
    for c in ranked:
        # Drop weak matches: below 40% of the best hit is usually noise that costs tokens.
        if len(picked) >= top_k or scores[id(c)] <= 0 or scores[id(c)] < MIN_RELATIVE * best:
            break
        if per_file[c.path] >= MAX_PER_FILE:
            continue
        piece = f"[{c.path} §{c.heading}]\n{c.text[:MAX_CHUNK]}"
        if used + len(piece) > char_budget and picked:
            continue
        picked.append(piece)
        labels.append(f"{c.path} §{c.heading}")
        per_file[c.path] += 1
        used += len(piece)
    return "\n\n".join(picked), labels


# --------------------------------------------------------------------------- RECENT

_CODE_SUFFIXES = {".md", ".ts", ".tsx", ".js", ".mjs", ".py", ".json", ".sql", ".toml", ".yaml", ".yml"}


def _git(*args: str) -> str:
    # Fixed argv, no shell, no user input. Raises OSError/ValueError on any failure.
    done = subprocess.run(["git", "-c", "core.quotepath=false", "-C", str(ROOT), *args], capture_output=True,
                          text=True, encoding="utf-8", errors="replace", timeout=8)
    if done.returncode != 0:
        raise ValueError(done.stderr.strip()[:120] or f"git exit {done.returncode}")
    return done.stdout


def recent_changes(commits: int = 6, dirty: int = 10, newest: int = 6) -> str:
    """What changed lately: the live record of work that queue.json may not list yet."""
    from datetime import datetime

    out = ["[SENASTE COMMITS ur git log]"]
    out += [line[:130] for line in _git("log", f"-n{commits}", "--date=short", "--pretty=format:%h %ad %s").splitlines()]
    changed = [line[:110] for line in _git("status", "--porcelain").splitlines() if line.strip()]
    out.append(f"[OCOMMITTADE ÄNDRINGAR ur git status: {len(changed)} st]")
    out += changed[:dirty] or ["(inga)"]
    files = []
    for name in _git("ls-files", "-z").split("\0"):
        path = ROOT / name
        if name and path.suffix in _CODE_SUFFIXES and not name.endswith("pnpm-lock.yaml") and path.is_file():
            files.append((path.stat().st_mtime, name))
    out.append("[SENAST ÄNDRADE FILER enligt filsystemet (spårade filer)]")
    out += [f"{datetime.fromtimestamp(m):%Y-%m-%d %H:%M} {n}" for m, n in sorted(files, reverse=True)[:newest]]
    return "\n".join(out)


# --------------------------------------------------------------------------- public API

def _last_user_line(history: str) -> str:
    lines = [line[6:] for line in history.splitlines() if line.startswith("User: ")]
    return lines[-1][:400] if lines else ""


def build_repo_context(question: str, history: str = "") -> RepoContext:
    """Build the REPO-UNDERLAG block for one question. Never raises on missing optional files."""
    parts, sources = [], []

    queue = None
    try:
        queue = _load_queue()
        parts.append(status_digest(queue))
        sources.append(f"{QUEUE} (status)")
    except (OSError, ValueError) as error:
        parts.append(f"[STATUS kunde inte läsas: {type(error).__name__}. Säg att statusunderlag saknas.]")
        sources.append(f"{QUEUE}: KUNDE INTE LÄSAS")

    try:
        parts.append(scope_block())
        sources.append(f"{MVP} (scope)")
    except (OSError, ValueError) as error:
        parts.append(f"[SCOPE kunde inte läsas: {type(error).__name__}. Säg att scopeunderlag saknas.]")
        sources.append(f"{MVP}: KUNDE INTE LÄSAS")

    if queue is not None:
        details, labels = task_details(queue, question)
        if details:
            parts.append(details)
            sources += labels

    try:
        recent = recent_changes()
        sources_recent = "git: senaste commits, ocommittade ändringar, nyast ändrade filer"
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        recent = (f"[RECENT kunde inte läsas ({type(error).__name__}: git saknas eller avvisade). "
                  "Säg att information om senaste ändringar saknas.]")
        sources_recent = "git: KUNDE INTE LÄSAS"

    # Budget: sections only get what the fixed blocks leave over (1000 chars reserved for the header).
    left = MAX_TOTAL - 1000 - sum(len(part) for part in parts) - len(recent)
    # Follow-ups ("och hur gör vi det för hälsa?") borrow the previous user line for ranking only.
    sections, labels = retrieve(f"{question} {_last_user_line(history)}".strip(), char_budget=max(left, 1500))
    if sections:
        parts.append(sections)
        sources += labels
    parts.append(recent)
    sources.append(sources_recent)

    # The agents must be able to answer "what can you see?" truthfully, so the list goes in the block.
    header = "[VAD DU KAN SE: endast detta underlag. Källor: " + "; ".join(sources) + "]"
    return RepoContext(text=redact(header + "\n\n" + "\n\n".join(parts)), sources=sources)

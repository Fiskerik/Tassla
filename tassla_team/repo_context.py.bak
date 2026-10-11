"""Always-on, read-only repo grounding for the SDK team (stdlib only, no new dependency).

The agents get no file tools. Instead this module reads a narrow allowlist of repo docs and builds a
labelled REPO-UNDERLAG block that is put into every brief:

  1. STATUS   digest of docs/tasks/dev/queue.json: what is done / blocked / planned
  2. SCOPE    bounded 'Måste med' and 'Utanför MVP' sections from docs/mvp.md
  3. TASKS    bounded records for task ids named in this or the previous question
  4. SECTIONS top-ranked doc sections for THIS question (keyword ranking, max 2 per file)

Every block carries its source label so agents can cite it. E-mail addresses, phone numbers and
Swedish postal addresses are redacted before anything leaves the machine. Read failures are
reported inside the block instead of silently dropping the grounding.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE = "docs/tasks/dev/queue.json"
MVP = "docs/mvp.md"

# Explicit allowlist; extend deliberately. Nothing outside docs/ is ever read.
ALLOW = ("docs/*.md", "docs/decisions/*.md", "docs/plans/*.md", "docs/releases/*.md",
         "docs/tasks/*.md", "docs/tasks/dev/*.md")
DENY = (
    "docs/privacy/",
    "docs/tasks/breeder-interviews-pilot.md",
    "docs/tasks/dev/beta-account.md",
    "docs/tasks/dev/owner-feedback-2026-10-07.md",
    "docs/tasks/dev/rapport.md",
    "docs/tasks/dev/mvp-beta-delivery.md",
    "docs/releases/MVP-BETA.md",
)
SOURCE_OF_TRUTH = {"docs/vision.md", "docs/mvp.md", "docs/revenue.md", "docs/design-rules.md"}

MAX_CHUNK = 1400       # chars shown per retrieved section
MAX_PER_FILE = 2       # keeps one big document from crowding out the rest
TOP_K = 5
MIN_RELATIVE = 0.4    # weakest accepted score relative to the best section
MAX_CONTEXT_CHARS = 14000
MAX_TASK_MATCHES = 2
MAX_TASK_CHARS = 1800

_STOP = set("""och att det som för med den har inte jag vi är ska kan på av en ett om till vad hur vilka vilken
bör när så men eller också från finns något detta denna ska skulle man vara blir bli the and for with what how
are this that you your""".split())
_WORD = re.compile(r"[a-zåäöé0-9][a-zåäöé0-9_-]{2,}")
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE = re.compile(r"(?<![\d-])(?:\+46|0)[\s-]?\d(?:[\s-]?\d){7,9}(?!\d)")
_POSTAL_ADDRESS = re.compile(
    r"(?:[\wÅÄÖåäö.-]+\s+\d+[A-Za-z]?(?:,\s*)?)?\b\d{3}\s?\d{2}\s+"
    r"[A-ZÅÄÖ][\wÅÄÖåäö-]*(?:\s+[A-ZÅÄÖ][\wÅÄÖåäö-]*)?",
    re.IGNORECASE,
)


@dataclass
class RepoContext:
    text: str = ""
    sources: list[str] = field(default_factory=list)


def truncate_text(text: str, limit: int, marker: str) -> str:
    if len(text) <= limit:
        return text
    if limit <= len(marker):
        return marker[:limit]
    return text[:max(0, limit - len(marker))] + marker


def redact(text: str) -> str:
    text = _EMAIL.sub("[e-post]", text)
    text = _PHONE.sub("[telefon]", text)
    return _POSTAL_ADDRESS.sub("[postadress]", text)


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


def status_digest(queue: dict, limit: int = 2600) -> str:
    tasks = queue.get("tasks", [])
    by_status: dict[str, list] = {}
    for task in tasks:
        by_status.setdefault(task.get("status", "?"), []).append(task)
    segment = str(queue.get("segment", "?"))[:160]
    lines = [f"[STATUS ur {QUEUE}; {len(tasks)} uppgifter; segment: {segment}]"]
    order = ["blocked", "implementing", "qa", "review", "ready", "planned", "done"]
    order += [s for s in by_status if s not in order]
    counts = ", ".join(f"{status}={len(by_status[status])}" for status in order if by_status.get(status))
    if counts:
        lines.append(f"Statusantal: {counts}")
    for status in order:
        items = by_status.get(status)
        if not items:
            continue
        if status == "done":
            lines.append("Klart: " + ", ".join(str(t.get("id", "?"))[:48] for t in items))
        else:
            lines.append(f"{status.capitalize()}:")
            for t in items:
                lines.append(f"- {str(t.get('id', '?'))[:48]}: {str(t.get('title', ''))[:60]} -> nästa: {str(t.get('next_step', ''))[:90]}")
    text = "\n".join(lines)
    return truncate_text(text, limit, " …[status avkortad]")


def task_details(queue: dict, question: str, history_text: str = "") -> tuple[str, list[str]]:
    q = f"{question} {_last_user_line(history_text)}".lower()
    blocks, labels = [], []
    for t in queue.get("tasks", []):
        if len(blocks) >= MAX_TASK_MATCHES:
            break
        if str(t.get("id", "")).lower() not in q:
            continue
        task_history = t.get("history", [])[-2:]
        evidence = " | ".join(f"{h.get('from')}->{h.get('to')}: {str(h.get('evidence', ''))[:120]}"
                              for h in task_history)
        acceptance = "; ".join(str(a)[:120] for a in t.get("acceptance", [])[:4])
        block = (
            f"[queue:{t['id']}] {t.get('title', '')} | status={t.get('status')} | beror på={t.get('depends_on', [])}\n"
            f"MVP-krav: {t.get('mvp_requirement', '?')} | plan: {t.get('plan', '?')}\n"
            f"Acceptans: {acceptance}\nSenaste historik: {evidence}\nNästa steg: {str(t.get('next_step', ''))[:300]}")
        remaining = MAX_TASK_CHARS - sum(len(part) for part in blocks) - max(0, len(blocks) * 2)
        if remaining <= 0:
            break
        block = truncate_text(block, remaining, " …[task avkortad]")
        blocks.append(block)
        labels.append(f"queue:{t['id']}")
    return "\n\n".join(blocks), labels


# --------------------------------------------------------------------------- SCOPE

def _sections(text: str, heading_prefix: str) -> list[tuple[str, str]]:
    lines = text.splitlines()
    sections, current_heading, body = [], None, []
    for line in lines:
        if line.startswith("## "):
            if current_heading is not None and current_heading.startswith(heading_prefix):
                sections.append((current_heading, "\n".join(body).strip()))
            current_heading = line[3:].strip()
            body = []
        elif current_heading is not None:
            body.append(line)
    if current_heading is not None and current_heading.startswith(heading_prefix):
        sections.append((current_heading, "\n".join(body).strip()))
    return sections


def scope_block(limit: int = 4700) -> str:
    text = _read(MVP)
    headings = [line.strip() for line in text.splitlines() if line.startswith(("## ", "### "))]
    out = [f"[SCOPE {MVP}; rubriker]", " | ".join(h.lstrip("# ") for h in headings)]
    must_sections = _sections(text, "Måste med")
    must_budget = 2300
    if must_sections:
        out.append(f"[{MVP} §Måste med; utdrag, kan vara avkortat]")
        per_section = max(1, must_budget // len(must_sections))
        for heading, body in must_sections:
            if must_budget <= 0:
                out.append("…[Måste med avkortad]")
                break
            part = f"{heading}\n{body}"
            excerpt = part[:min(per_section, must_budget)]
            out.append(excerpt)
            must_budget -= len(excerpt)
    outside_sections = _sections(text, "Utanför MVP")
    if outside_sections:
        out.append(f"[{MVP} §Utanför MVP]")
        out.append(outside_sections[0][1][:1200])
    block = "\n".join(out)
    return truncate_text(block, limit, " …[scope avkortad]")


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
            if any(relative.startswith(d) if d.endswith("/") else relative == d for d in DENY):
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

    # Follow-ups borrow the previous user line for both task lookup and section ranking.
    if queue is not None:
        details, labels = task_details(queue, question, history)
        if details:
            parts.append(details)
            sources += labels

    sections, labels = retrieve(f"{question} {_last_user_line(history)}".strip(), char_budget=4200)
    if sections:
        parts.append(sections)
        sources += labels

    text = "\n\n".join(parts)
    text = truncate_text(text, MAX_CONTEXT_CHARS, " …[underlag avkortat]")
    return RepoContext(text=redact(text), sources=list(dict.fromkeys(sources)))

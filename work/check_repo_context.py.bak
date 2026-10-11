"""Offline checks for repo grounding. No API key, no network, no tokens.

Run from the repo root:  python work/check_repo_context.py
"""
import json
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# ---- 1. Pure grounding logic (against the real repo) -------------------------------------------
from tassla_team import repo_context as rc

queue = json.loads((ROOT / rc.QUEUE).read_text(encoding="utf-8-sig"))
digest = rc.status_digest(queue)
for status in ("done", "planned", "blocked"):
    expected = sum(1 for t in queue["tasks"] if t["status"] == status)
    if expected:
        assert f"{status}={expected}" in digest, f"digest missing count for {status}"

ctx = rc.build_repo_context("Vad återstår för LOGGA-EDIT?")
assert "queue:LOGGA-EDIT" in ctx.sources, ctx.sources
assert "[STATUS ur" in ctx.text and "[SCOPE" in ctx.text
assert len(ctx.text) <= rc.MAX_CONTEXT_CHARS, f"context too large: {len(ctx.text)}"

ctx = rc.build_repo_context("Hur når vi uppfödare för distribution?")
assert any(s.startswith(("docs/vision.md", "docs/mvp.md")) for s in ctx.sources), ctx.sources

# Privacy: denylisted files never used; e-mail and phone numbers are redacted.
assert not any(s.startswith(("docs/privacy", "docs/tasks/dev/beta-account", "docs/tasks/dev/owner-feedback",
                             "docs/tasks/dev/rapport", "docs/tasks/dev/mvp-beta-delivery", "docs/releases/MVP-BETA"))
               for s in ctx.sources)
assert "@" not in rc.build_repo_context("beta konto test e-post").text
assert rc.redact("mejla a.b@example.com eller ring 070-123 45 67") == "mejla [e-post] eller ring [telefon]"
assert rc.redact("post: Stenvallavägen 1, 18634 Vallentuna") == "post: [postadress]"
assert rc.redact("2026-10-06 och commit 94686aa") == "2026-10-06 och commit 94686aa"

# Stemming: inflections overlap, different compounds do not.
assert rc._stem("uppfödare") == rc._stem("uppfödarna") == rc._stem("uppfödning")
assert rc._stem("hundpassning") != rc._stem("hundprofil")
oversized = rc.truncate_text("x" * (rc.MAX_CONTEXT_CHARS + 100), rc.MAX_CONTEXT_CHARS, " …[underlag avkortat]")
assert len(oversized) == rc.MAX_CONTEXT_CHARS and oversized.endswith(" …[underlag avkortat]")

# Failure must be visible, never silent.
original = rc.QUEUE
rc.QUEUE = "docs/tasks/dev/does-not-exist.json"
broken = rc.build_repo_context("vad är klart?")
rc.QUEUE = original
assert "kunde inte läsas" in broken.text and any("KUNDE INTE LÄSAS" in s for s in broken.sources)

# ---- 2. Wiring: the underlag really reaches every agent ----------------------------------------
fake = ModuleType("agents")


class Agent:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


seen = []


class Runner:
    @staticmethod
    def run_sync(agent, brief, **kwargs):
        seen.append((agent.name, agent.instructions, brief))
        if "routing" in agent.name:
            output = RoutingPlan(requests=[TeamRequest(team="product", reason="test", roles=[])], direct_answer="")
        else:
            output = "svar"
        usage = SimpleNamespace(requests=1, input_tokens=1, output_tokens=1)
        return SimpleNamespace(final_output=output, context_wrapper=SimpleNamespace(usage=usage))


fake.Agent, fake.Runner = Agent, Runner
fake.ModelSettings = fake.RunConfig = lambda **kwargs: kwargs
sys.modules["agents"] = fake
from tassla_team.chief_of_staff import RoutingPlan, TeamRequest, run_question  # noqa: E402

result = run_question("Vad återstår för LOGGA-EDIT?", "fake")
assert seen, "no agents ran"
for name, instructions, brief in seen:
    assert "REPO-UNDERLAG" in brief and "queue:LOGGA-EDIT" in brief, f"{name} got no repo underlag"
    assert "REPO GROUNDING" in instructions, f"{name} lacks grounding rules"
assert result.sources and "queue:LOGGA-EDIT" in result.sources

seen.clear()
run_question("Vad återstår för LOGGA-EDIT?", "fake", use_repo=False)
assert all("[STATUS ur" not in brief for _, _, brief in seen), "use_repo=False must disable grounding"

print("Repo grounding checks passed: status digest, task lookup, retrieval, redaction, "
      "visible failure, and underlag reaching every agent.")

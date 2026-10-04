"""Optional read-only, allowlisted project context; no generic file tool."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWLIST = ("docs/vision.md", "docs/mvp.md", "docs/revenue.md")

def load_project_context(limit=6000):
    sections = []
    per_file = limit // len(ALLOWLIST)
    for relative in ALLOWLIST:
        path = ROOT / relative
        if not path.is_file():
            continue
        resolved = path.resolve()
        if not resolved.is_relative_to(ROOT):
            raise ValueError("Project context must stay inside the repository")
        content = resolved.read_text(encoding="utf-8-sig")
        sections.append(f"[{relative}; excerpt, not whole document; approval not assumed]\n"
                        + content[:per_file])
    return "\n\n".join(sections)

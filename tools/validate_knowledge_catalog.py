#!/usr/bin/env python3
"""Validate the reviewed, source-mapped Knowledge phase checklist bundle."""

import argparse
import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "docs/content/knowledge-phase-checklists-v1.json"
CHECKLIST_SOURCE = ROOT / "src/features/knowledge/checklist-content.ts"
D3_MAPPING = ROOT / "supabase/migrations/202610240002_knowledge_catalog.sql"
BASE_CHECKLIST_MIGRATION = ROOT / "supabase/migrations/202610110002_puppy_checklists.sql"
IMPORT_SQL = ROOT / "supabase/content/knowledge-phase-checklists-v1.sql"
PUBLISH_SQL = ROOT / "supabase/content/publish-knowledge-phase-checklists-v1.sql"
ROOT_FIELDS = {"schema_version", "bundle_id", "status", "sources", "review", "templates"}
SOURCE_FIELDS = {"id", "url", "title", "accessed_on", "scope"}
REVIEW_FIELDS = {"dog_expert_status", "review_reference", "reviewed_on"}
TEMPLATE_FIELDS = {
    "template_id", "slug", "context", "version_id", "version", "title", "body",
    "min_age_weeks", "max_age_weeks", "status", "is_ai_generated", "sources", "items",
}
ITEM_FIELDS = {"key", "position", "title", "source_refs"}
EXPECTED = {
    "review-v1:before-homecoming": {
        "slug": "phase-before-homecoming", "context": "before_homecoming", "min": 0, "max": 7,
        "version_id": "64000000-0000-4000-8000-000000000001", "keys": ["safe-space", "supplies", "vet-contact"],
    },
    "review-v1:first-days": {
        "slug": "phase-first-days", "context": "first_days", "min": 0, "max": None,
        "version_id": "64000000-0000-4000-8000-000000000002", "keys": ["quiet-start", "routine", "rest"],
    },
    "review-v1:8-12-weeks": {
        "slug": "phase-8-12-weeks", "context": "by_age", "min": 8, "max": 12,
        "version_id": "64000000-0000-4000-8000-000000000003", "keys": ["name", "handling", "alone"],
    },
    "review-v1:3-6-months": {
        "slug": "phase-3-6-months", "context": "by_age", "min": 13, "max": 25,
        "version_id": "64000000-0000-4000-8000-000000000004", "keys": ["recall", "settle", "walks"],
    },
    "review-v1:6-12-months": {
        "slug": "phase-6-12-months", "context": "by_age", "min": 26, "max": 51,
        "version_id": "64000000-0000-4000-8000-000000000005", "keys": ["review", "focus", "breaks"],
    },
    "review-v1:over-1-year": {
        "slug": "phase-over-1-year", "context": "by_age", "min": 52, "max": None,
        "version_id": "64000000-0000-4000-8000-000000000006", "keys": ["enjoy", "adapt", "play"],
    },
}
EXPECTED_SOURCE_IDS = {
    "rspca-puppy-care", "rspca-environment", "rspca-left-alone", "rspca-come-when-called",
    "dogstrust-routine", "avsab-humane-2021", "avsab-socialization",
}
DOG_PRONOUN = re.compile(r"\b(?:den|dess|han|hon|hans|hennes|hen|honom|henne)\b", re.IGNORECASE)
SAMPLE_DOG_NAME = re.compile(r"\b(?:Luna|Nemo|Fisken)\b", re.IGNORECASE)


def fail(message: str) -> None:
    raise ValueError(message)


def object_with_fields(value: Any, fields: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{label} must be an object")
    if set(value) != fields:
        fail(f"{label} fields must be exactly {sorted(fields)}")
    return value


def text(value: Any, label: str, maximum: int | None = None) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{label} must be a non-empty string")
    if maximum is not None and len(value) > maximum:
        fail(f"{label} must be at most {maximum} characters")
    return value


def iso_date(value: Any, label: str) -> str:
    if not isinstance(value, str):
        fail(f"{label} must be YYYY-MM-DD")
    try:
        date.fromisoformat(value)
    except ValueError:
        fail(f"{label} must be YYYY-MM-DD")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        fail(f"{label} must be YYYY-MM-DD")
    return value


def safe_repo_path(value: Any, label: str) -> Path:
    raw = text(value, label)
    path = PurePosixPath(raw.replace("\\", "/"))
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        fail(f"{label} must be a safe repository-relative path")
    resolved = (ROOT / Path(*path.parts)).resolve()
    try:
        resolved.relative_to(ROOT.resolve())
    except ValueError:
        fail(f"{label} escapes the repository")
    if not resolved.is_file():
        fail(f"{label} does not exist: {raw}")
    return resolved


def reviewed_payload_hash(bundle: dict[str, Any]) -> str:
    payload = json.dumps(
        {"sources": bundle["sources"], "templates": bundle["templates"]},
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def validate_sql_payload(bundle: dict[str, Any], source_by_id: dict[str, dict[str, Any]], expected_hash: str, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    label = str(path)
    payload_match = re.search(r"jsonb_to_recordset\(\$phase_catalog\$(.*?)\$phase_catalog\$::jsonb\)", sql, re.DOTALL)
    if not payload_match:
        fail(f"{label} must contain the generated phase catalog payload")
    try:
        embedded = json.loads(payload_match.group(1))
    except json.JSONDecodeError as error:
        fail(f"{label} has invalid embedded JSON: {error}")

    expected_rows = []
    for template in bundle["templates"]:
        expected_rows.append({
            "template_id": template["template_id"],
            "slug": template["slug"],
            "context": template["context"],
            "version_id": template["version_id"],
            "version": template["version"],
            "title": template["title"],
            "body": template["body"],
            "min_age_weeks": template["min_age_weeks"],
            "max_age_weeks": template["max_age_weeks"],
            "sources": [source_by_id[source_id]["url"] for source_id in template["sources"]],
            "items": [
                {"key": item["key"], "position": item["position"], "title": item["title"]}
                for item in template["items"]
            ],
        })
    if embedded != expected_rows:
        fail(f"{label} embedded SQL rows differ from the reviewed JSON payload")

    digest_markers = re.findall(r"^-- reviewed payload SHA-256: ([0-9a-f]{64})$", sql, re.MULTILINE)
    if digest_markers != [expected_hash]:
        fail(f"{label} reviewed payload digest does not match the reviewed JSON")
    references = re.findall(r"review_reference\s*=\s*'[^']*#payload-sha256=([0-9a-f]{64})'", sql)
    if not references or set(references) != {expected_hash}:
        fail(f"{label} review references do not match the reviewed JSON digest")
    required_guards = ("count(distinct template_id)", "count(distinct version_id)", "count(distinct (b.template_id, item.key))")
    if any(guard not in sql for guard in required_guards):
        fail(f"{label} must reject duplicate phase, version, and child identities")


def check_copy(text_value: str, label: str, maximum: int | None = None) -> None:
    text(text_value, label, maximum)
    if DOG_PRONOUN.search(text_value):
        fail(f"{label} refers to an individual dog with a pronoun")
    if SAMPLE_DOG_NAME.search(text_value):
        fail(f"{label} contains an example dog's name")


def validate_bundle(bundle: Any, import_sql_path: Path = IMPORT_SQL, publish_sql_path: Path = PUBLISH_SQL) -> dict[str, int]:
    root = object_with_fields(bundle, ROOT_FIELDS, "root")
    if type(root["schema_version"]) is not int or root["schema_version"] != 1:
        fail("schema_version must be integer 1")
    if root["bundle_id"] != "knowledge-phase-checklists-v1":
        fail('bundle_id must be "knowledge-phase-checklists-v1"')
    if root["status"] != "reviewed":
        fail('bundle status must be "reviewed" before draft import')

    review = object_with_fields(root["review"], REVIEW_FIELDS, "review")
    if review["dog_expert_status"] != "passed":
        fail("dog expert review must pass before draft import")
    reviewed_on = iso_date(review["reviewed_on"], "review.reviewed_on")
    review_path = safe_repo_path(review["review_reference"], "review.review_reference")
    review_text = review_path.read_text(encoding="utf-8")
    expected_hash = reviewed_payload_hash(root)
    match = re.search(r"Reviewed payload SHA-256: `([0-9a-f]{64})`", review_text)
    if not match or match.group(1) != expected_hash:
        fail("review record SHA-256 does not match source and template payload")

    sources = root["sources"]
    if not isinstance(sources, list):
        fail("sources must be an array")
    source_by_id: dict[str, dict[str, Any]] = {}
    for index, raw in enumerate(sources):
        label = f"sources[{index}]"
        source = object_with_fields(raw, SOURCE_FIELDS, label)
        source_id = text(source["id"], f"{label}.id")
        if source_id in source_by_id:
            fail(f"duplicate source id: {source_id}")
        url = text(source["url"], f"{label}.url")
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            fail(f"{label}.url must be HTTPS without credentials")
        text(source["title"], f"{label}.title")
        iso_date(source["accessed_on"], f"{label}.accessed_on")
        text(source["scope"], f"{label}.scope")
        source_by_id[source_id] = source
    if set(source_by_id) != EXPECTED_SOURCE_IDS:
        fail("source register must contain exactly the seven reviewed source IDs")

    templates = root["templates"]
    if not isinstance(templates, list) or len(templates) != len(EXPECTED):
        fail("templates must contain exactly six phases")
    template_by_id: dict[str, dict[str, Any]] = {}
    version_ids: set[str] = set()
    slug_values: set[str] = set()
    item_count = 0
    for index, raw in enumerate(templates):
        label = f"templates[{index}]"
        template = object_with_fields(raw, TEMPLATE_FIELDS, label)
        template_id = text(template["template_id"], f"{label}.template_id")
        expected = EXPECTED.get(template_id)
        if expected is None or template_id in template_by_id:
            fail(f"unexpected or duplicate template id: {template_id}")
        template_by_id[template_id] = template
        if template["slug"] != expected["slug"] or template["context"] != expected["context"]:
            fail(f"{label} does not match the approved D3 slug/context mapping")
        if template["version_id"] != expected["version_id"] or template["version_id"] in version_ids:
            fail(f"{label}.version_id is not the stable expected UUID")
        version_ids.add(template["version_id"])
        if type(template["version"]) is not int or template["version"] != 1:
            fail(f"{label}.version must be integer 1")
        if type(template["min_age_weeks"]) is not int or template["min_age_weeks"] != expected["min"]:
            fail(f"{label}.min_age_weeks differs from the approved selection window")
        maximum = template["max_age_weeks"]
        if maximum is not None and type(maximum) is not int:
            fail(f"{label}.max_age_weeks must be an integer or null")
        if maximum != expected["max"]:
            fail(f"{label}.max_age_weeks differs from the approved selection window")
        if template["status"] != "draft" or template["is_ai_generated"] is not True:
            fail(f"{label} must remain AI-marked draft content")
        title = text(template["title"], f"{label}.title", 160)
        body = text(template["body"], f"{label}.body")
        check_copy(title, f"{label}.title", 160)
        check_copy(body, f"{label}.body")
        if expected["context"] == "by_age" and "förslag, inte mål" not in body.lower():
            fail(f"{label}.body must say age selects suggestions, not milestones")
        if "hundens" not in body.lower() and expected["context"] == "by_age":
            fail(f"{label}.body must describe age selection using generic dog wording")

        template_sources = template["sources"]
        if not isinstance(template_sources, list) or not template_sources:
            fail(f"{label}.sources must be a non-empty array")
        if any(not isinstance(source_id, str) or source_id not in source_by_id for source_id in template_sources):
            fail(f"{label}.sources contains an unknown source id")
        if len(template_sources) != len(set(template_sources)):
            fail(f"{label}.sources contains duplicates")

        items = template["items"]
        expected_keys = expected["keys"]
        if not isinstance(items, list) or len(items) != len(expected_keys):
            fail(f"{label}.items must contain exactly three stable keys")
        item_refs: set[str] = set()
        for item_index, item_raw in enumerate(items):
            item_label = f"{label}.items[{item_index}]"
            item = object_with_fields(item_raw, ITEM_FIELDS, item_label)
            if item["key"] != expected_keys[item_index]:
                fail(f"{item_label}.key/order differs from the existing stable template registry")
            if type(item["position"]) is not int or item["position"] != item_index + 1:
                fail(f"{item_label}.position must match its ordered slot")
            check_copy(item["title"], f"{item_label}.title", 160)
            refs = item["source_refs"]
            if not isinstance(refs, list) or not refs:
                fail(f"{item_label}.source_refs must be a non-empty array")
            if any(not isinstance(source_id, str) or source_id not in source_by_id for source_id in refs):
                fail(f"{item_label}.source_refs contains an unknown source id")
            if len(refs) != len(set(refs)):
                fail(f"{item_label}.source_refs contains duplicates")
            item_refs.update(refs)
            item_count += 1
        if set(template_sources) != item_refs:
            fail(f"{label}.sources must exactly match the union of item source_refs")
        slug_values.add(template["slug"])

    if set(template_by_id) != set(EXPECTED):
        fail("template set differs from the approved six phase IDs")

    for sql_path in (import_sql_path, publish_sql_path):
        validate_sql_payload(root, source_by_id, expected_hash, sql_path)

    # Keep the bundle synchronized with both the existing local review registry and D3 root mapping.
    registry = CHECKLIST_SOURCE.read_text(encoding="utf-8")
    registry_keys = set(re.findall(r"row\('([^']+)'", registry))
    bundle_keys = {item["key"] for template in templates for item in template["items"]}
    expected_keys = {key for entry in EXPECTED.values() for key in entry["keys"]}
    if registry_keys != expected_keys or bundle_keys != registry_keys:
        fail("bundle item keys differ from the existing checklist source registry")

    migration = D3_MAPPING.read_text(encoding="utf-8")
    d3_rows = set(re.findall(r"\('(review-v1:[^']+)', '(before_homecoming|first_days|by_age)', '(phase-[^']+)'\)", migration))
    expected_rows = {(template_id, data["context"], data["slug"]) for template_id, data in EXPECTED.items()}
    if d3_rows != expected_rows:
        fail("bundle IDs/context/slugs differ from the approved D3 mapping migration")

    base_schema = BASE_CHECKLIST_MIGRATION.read_text(encoding="utf-8")
    item_seed = re.search(r"insert into public\.checklist_template_items[\s\S]*?values\s*([\s\S]*?);", base_schema)
    if not item_seed:
        fail("existing database checklist key seed was not found")
    base_key_pairs = set(re.findall(r"\('review-v1:([^']+)'\s*,\s*'([^']+)'", item_seed.group(1)))
    expected_key_pairs = {(template_id.removeprefix("review-v1:"), key) for template_id, data in EXPECTED.items() for key in data["keys"]}
    if base_key_pairs != expected_key_pairs or {key for _, key in base_key_pairs} != expected_keys:
        fail("bundle item keys differ from the existing database checklist registry")

    return {"phases": len(templates), "items": item_count, "sources": len(source_by_id), "reviewed_on": reviewed_on}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_BUNDLE, help="bundle JSON path")
    parser.add_argument("--import-sql", type=Path, default=IMPORT_SQL, help="draft-import SQL payload to compare")
    parser.add_argument("--publish-sql", type=Path, default=PUBLISH_SQL, help="publication SQL payload to compare")
    args = parser.parse_args()
    try:
        with args.path.open(encoding="utf-8") as bundle_file:
            bundle = json.load(bundle_file)
        summary = validate_bundle(bundle, args.import_sql, args.publish_sql)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Invalid Knowledge checklist catalog: {error}", file=sys.stderr)
        return 1
    print(f"reviewed bundle validated: {summary['phases']} phases, {summary['items']} items, {summary['sources']} sources (reviewed {summary['reviewed_on']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

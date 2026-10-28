#!/usr/bin/env python3
"""Validate the reviewed FAQ payload and both unpublished/publish SQL payloads."""

import argparse
import hashlib
import json
import re
from datetime import date
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "docs/content/knowledge-faq-v1.json"
IMPORT_SQL = ROOT / "supabase/content/knowledge-faq-v1.sql"
PUBLISH_SQL = ROOT / "supabase/content/publish-knowledge-faq-v1.sql"
ROOT_FIELDS = {"schema_version", "bundle_id", "status", "sources", "review", "faqs"}
SOURCE_FIELDS = {"id", "url", "title", "accessed_on", "scope"}
REVIEW_FIELDS = {"dog_expert_status", "review_reference", "reviewed_on"}
FAQ_FIELDS = {"fixture_id", "id", "slug", "content_type", "versions"}
VERSION_FIELDS = {
    "id", "version", "context", "title", "body", "min_age_weeks", "max_age_weeks",
    "status", "is_ai_generated", "sources", "claim_trace",
}
CLAIM_FIELDS = {"claim_id", "text", "source_refs"}
EXPECTED = {
    "faq-first-night": {"context": "first_days", "content_id": "66000000-0000-4000-8000-000000000001", "version_id": "67000000-0000-4000-8000-000000000001"},
    "faq-alone-time": {"context": "first_days", "content_id": "66000000-0000-4000-8000-000000000002", "version_id": "67000000-0000-4000-8000-000000000002"},
    "faq-child-contact": {"context": "before_homecoming", "content_id": "66000000-0000-4000-8000-000000000003", "version_id": "67000000-0000-4000-8000-000000000003"},
    "faq-puppy-course": {"context": "by_age", "content_id": "66000000-0000-4000-8000-000000000004", "version_id": "67000000-0000-4000-8000-000000000004"},
}
EXPECTED_SOURCE_IDS = {
    "rspca-puppy-care", "rspca-environment", "rspca-left-alone", "dogstrust-children",
    "avsab-humane-2021", "avsab-socialization",
}
DOG_PRONOUN = re.compile(r"\b(?:den|dess|han|hon|hans|hennes|hen|honom|henne)\b", re.IGNORECASE)
SAMPLE_DOG_NAME = re.compile(r"\b(?:Luna|Nemo|Fisken)\b", re.IGNORECASE)


def fail(message: str) -> None:
    raise ValueError(message)


def exact_object(value: Any, fields: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != fields:
        fail(f"{label} fields must be exactly {sorted(fields)}")
    return value


def text(value: Any, label: str, maximum: int | None = None) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{label} must be non-empty text")
    if maximum is not None and len(value) > maximum:
        fail(f"{label} must be at most {maximum} characters")
    return value


def iso_date(value: Any, label: str) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        fail(f"{label} must use YYYY-MM-DD")
    try:
        date.fromisoformat(value)
    except ValueError:
        fail(f"{label} must be a valid calendar date")
    return value


def payload_hash(bundle: dict[str, Any]) -> str:
    payload = json.dumps(
        {"sources": bundle["sources"], "faqs": bundle["faqs"]},
        sort_keys=True, ensure_ascii=False, separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def safe_review_reference(value: Any) -> tuple[Path, str]:
    raw = text(value, "review.review_reference")
    path_part, marker, fragment = raw.partition("#payload-sha256=")
    if not marker or not re.fullmatch(r"[0-9a-f]{64}", fragment):
        fail("review reference must end with #payload-sha256=<digest>")
    path = PurePosixPath(path_part.replace("\\", "/"))
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        fail("review reference must be repository-relative")
    resolved = (ROOT / Path(*path.parts)).resolve()
    try:
        resolved.relative_to(ROOT.resolve())
    except ValueError:
        fail("review reference escapes the repository")
    if not resolved.is_file():
        fail("review reference does not exist")
    return resolved, fragment


def sql_rows(bundle: dict[str, Any], source_by_id: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for faq in bundle["faqs"]:
        version = faq["versions"][0]
        rows.append({
            "content_id": faq["id"], "slug": faq["slug"], "context": version["context"],
            "version_id": version["id"], "version": version["version"],
            "title": version["title"], "body": version["body"],
            "min_age_weeks": version["min_age_weeks"], "max_age_weeks": version["max_age_weeks"],
            "sources": version["sources"],
        })
    return rows


def validate_sql(path: Path, rows: list[dict[str, Any]], digest: str, publish: bool) -> None:
    if not path.is_file():
        fail(f"SQL file missing: {path.relative_to(ROOT)}")
    sql = path.read_text(encoding="utf-8")
    match = re.search(r"jsonb_to_recordset\(\$faq_catalog\$(.*?)\$faq_catalog\$::jsonb\)", sql, re.DOTALL)
    if not match:
        fail(f"{path.name} must include its static FAQ catalog payload")
    try:
        embedded = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        fail(f"{path.name} contains invalid payload JSON: {error}")
    if embedded != rows:
        fail(f"{path.name} payload differs from reviewed JSON")
    markers = re.findall(r"^-- reviewed payload SHA-256: ([0-9a-f]{64})$", sql, re.MULTILINE)
    if markers != [digest]:
        fail(f"{path.name} payload digest differs from reviewed JSON")
    refs = re.findall(r"review_reference\s*=\s*'[^']*#payload-sha256=([0-9a-f]{64})'", sql)
    if not refs or set(refs) != {digest}:
        fail(f"{path.name} review reference differs from reviewed JSON")
    for required in ("current_user not in ('postgres', 'supabase_admin')", "request.jwt.claim.role", "published_at"):
        if required not in sql:
            fail(f"{path.name} missing required import/publication guard: {required}")
    if publish:
        if not re.search(r"status\s*=\s*'published'", sql) or not re.search(r"status\s*=\s*'reviewed'", sql):
            fail("publish SQL must require reviewed rows and verify published status")
    elif not re.search(r"status\s*=\s*'reviewed'", sql) or not re.search(r"published_at\s+is\s+null", sql):
        fail("import SQL must create reviewed, unpublished rows")
    if re.search(r"\b(?:grant|revoke|create\s+policy|alter\s+policy)\b", sql, re.IGNORECASE):
        fail(f"{path.name} must not change privileges or RLS")


def validate_bundle(bundle: Any, import_path: Path = IMPORT_SQL, publish_path: Path = PUBLISH_SQL) -> dict[str, int]:
    root = exact_object(bundle, ROOT_FIELDS, "root")
    if type(root["schema_version"]) is not int or root["schema_version"] != 1:
        fail("schema_version must be integer 1")
    if root["bundle_id"] != "knowledge-faq-v1":
        fail('bundle_id must be "knowledge-faq-v1"')
    if root["status"] != "reviewed":
        fail("bundle status must be reviewed before the import can be used")

    review = exact_object(root["review"], REVIEW_FIELDS, "review")
    if review["dog_expert_status"] != "passed_with_conditions":
        fail("review status must preserve the Dog Expert PASS WITH CONDITIONS outcome")
    reviewed_on = iso_date(review["reviewed_on"], "review.reviewed_on")
    review_path, reference_hash = safe_review_reference(review["review_reference"])
    digest = payload_hash(root)
    if reference_hash != digest:
        fail("review reference digest does not match sources and FAQ payload")
    review_text = review_path.read_text(encoding="utf-8")
    if digest not in review_text or "PASS WITH CONDITIONS" not in review_text:
        fail("review record must document the exact digest and conditional verdict")
    if not re.search(r"öppnade inte själv URL", review_text, re.IGNORECASE):
        fail("review record must preserve the no-independent-URL-fetch limitation")
    if "inte veterinärsignoff" not in review_text.lower():
        fail("review record must state that it is not veterinary signoff")

    sources = root["sources"]
    if not isinstance(sources, list):
        fail("sources must be an array")
    source_by_id: dict[str, dict[str, Any]] = {}
    for index, raw in enumerate(sources):
        label = f"sources[{index}]"
        source = exact_object(raw, SOURCE_FIELDS, label)
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
        fail("source registry must contain exactly the six reviewed source IDs")

    faqs = root["faqs"]
    if not isinstance(faqs, list) or len(faqs) != len(EXPECTED):
        fail("faqs must contain exactly four reviewed FAQ entries")
    seen_slugs: set[str] = set()
    version_ids: set[str] = set()
    for index, raw in enumerate(faqs):
        label = f"faqs[{index}]"
        faq = exact_object(raw, FAQ_FIELDS, label)
        slug = text(faq["slug"], f"{label}.slug")
        expected = EXPECTED.get(slug)
        if expected is None or slug in seen_slugs:
            fail(f"unexpected or duplicate FAQ slug: {slug}")
        seen_slugs.add(slug)
        if faq["content_type"] != "faq" or faq["id"] != expected["content_id"]:
            fail(f"{label} must preserve its stable FAQ content identity")
        text(faq["fixture_id"], f"{label}.fixture_id")
        versions = faq["versions"]
        if not isinstance(versions, list) or len(versions) != 1:
            fail(f"{label} must contain exactly one reviewed version")
        version = exact_object(versions[0], VERSION_FIELDS, f"{label}.versions[0]")
        if version["id"] != expected["version_id"] or version["id"] in version_ids:
            fail(f"{label} does not use its stable version identity")
        version_ids.add(version["id"])
        if type(version["version"]) is not int or version["version"] != 1:
            fail(f"{label} version must be integer 1")
        if version["context"] != expected["context"]:
            fail(f"{label} context differs from the approved FAQ mapping")
        if type(version["min_age_weeks"]) is not int or version["min_age_weeks"] != 0 or version["max_age_weeks"] is not None:
            fail(f"{label} must not use a fabricated age targeting window")
        if version["status"] != "draft" or version["is_ai_generated"] is not True:
            fail(f"{label} must remain draft in the bundle and preserve AI-origin metadata")
        title = text(version["title"], f"{label}.title", 120)
        body = text(version["body"], f"{label}.body", 1200)
        if DOG_PRONOUN.search(title + " " + body):
            fail(f"{label} editorial copy must not use dog pronouns")
        if SAMPLE_DOG_NAME.search(title + " " + body):
            fail(f"{label} editorial copy must not use sample dog names")
        used_sources = version["sources"]
        if not isinstance(used_sources, list) or not used_sources or len(set(used_sources)) != len(used_sources):
            fail(f"{label}.sources must contain unique source URLs")
        known_urls = {source["url"] for source in source_by_id.values()}
        if any(url not in known_urls for url in used_sources):
            fail(f"{label} uses an unregistered source URL")
        claim_trace = version["claim_trace"]
        if not isinstance(claim_trace, list) or not claim_trace:
            fail(f"{label} must include a claim-to-source trace")
        claim_ids: set[str] = set()
        used_refs: set[str] = set()
        for claim_index, claim_raw in enumerate(claim_trace):
            claim_label = f"{label}.claim_trace[{claim_index}]"
            claim = exact_object(claim_raw, CLAIM_FIELDS, claim_label)
            claim_id = text(claim["claim_id"], f"{claim_label}.claim_id")
            if claim_id in claim_ids:
                fail(f"{claim_label} repeats a claim id")
            claim_ids.add(claim_id)
            claim_text = text(claim["text"], f"{claim_label}.text")
            if claim_text not in body:
                fail(f"{claim_label} text must be present in the answer")
            refs = claim["source_refs"]
            if not isinstance(refs, list) or not refs or any(ref not in source_by_id for ref in refs):
                fail(f"{claim_label} must reference known sources")
            used_refs.update(refs)
        traced_urls = {source_by_id[ref]["url"] for ref in used_refs}
        if traced_urls != set(used_sources):
            fail(f"{label} source URLs must exactly match its claim trace")

    if seen_slugs != set(EXPECTED):
        fail("the exact four approved FAQ slugs must be present")
    validate_sql(import_path, sql_rows(root, source_by_id), digest, publish=False)
    validate_sql(publish_path, sql_rows(root, source_by_id), digest, publish=True)
    return {"faqs": len(faqs), "sources": len(sources), "versions": len(version_ids), "digest": digest, "reviewed_on": reviewed_on}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    parser.add_argument("--import-sql", type=Path, default=IMPORT_SQL)
    parser.add_argument("--publish-sql", type=Path, default=PUBLISH_SQL)
    args = parser.parse_args()
    try:
        bundle = json.loads(args.bundle.read_text(encoding="utf-8"))
        result = validate_bundle(bundle, args.import_sql, args.publish_sql)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Validate the closed draft-content bundle and its review evidence fields."""

import argparse
import json
import re
import sys
import uuid
from datetime import date
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "docs/content/mvp-content-bundle-v1.json"
ROOT_FIELDS = {"schema_version", "bundle_id", "status", "sources", "items"}
SOURCE_FIELDS = {"id", "url", "title", "accessed_on", "scope"}
ITEM_FIELDS = {"id", "slug", "content_type", "versions"}
VERSION_FIELDS = {
    "id", "version", "title", "body", "min_age_weeks", "max_age_weeks",
    "status", "breed_targets", "claim_trace", "review", "training_steps",
}
CLAIM_SOURCE_FIELDS = {"claim_id", "text", "source_refs"}
CLAIM_UNVERIFIED_FIELDS = {"claim_id", "text", "unverified"}
UNVERIFIED_FIELDS = {"reason", "evidence_refs"}
REVIEW_FIELDS = {"dog_expert", "human_reviewer"}
GATE_FIELDS = {"status", "evidence"}
EVIDENCE_FIELDS = {"reference", "reviewed_on"}
STEP_FIELDS = {"id", "step_key", "position", "title", "instruction", "claim_refs"}
CONTENT_TYPES = {"article", "checklist", "training_program"}
ADVICE_SLUGS = {
    "before-homecoming", "first-week", "handling-guide", "environment-checklist",
    "being-alone-guide", "handling-program", "environment-program", "being-alone-program",
}
APP_GUIDE_SLUGS = {"daily-log-routines", "weight-history-guide", "health-records-guide"}
IDENTITIES = {
    "before-homecoming": ("61000000-0000-4000-8000-000000000001", "checklist", "onboarding-only"),
    "first-week": ("61000000-0000-4000-8000-000000000002", "article", None),
    "daily-log-routines": ("61000000-0000-4000-8000-000000000003", "article", None),
    "handling-guide": ("61000000-0000-4000-8000-000000000004", "article", None),
    "environment-checklist": ("61000000-0000-4000-8000-000000000005", "checklist", None),
    "being-alone-guide": ("61000000-0000-4000-8000-000000000006", "article", None),
    "weight-history-guide": ("61000000-0000-4000-8000-000000000007", "article", None),
    "health-records-guide": ("61000000-0000-4000-8000-000000000008", "article", None),
    "handling-program": ("61000000-0000-4000-8000-000000000009", "training_program", None),
    "environment-program": ("61000000-0000-4000-8000-000000000010", "training_program", None),
    "being-alone-program": ("61000000-0000-4000-8000-000000000011", "training_program", None),
}
VERSION_ONE_IDS = {
    slug: f"62000000-0000-4000-8000-{index:012d}"
    for index, slug in enumerate(IDENTITIES, start=1)
}
UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def fail(message: str) -> None:
    raise ValueError(message)


def require_object(value: Any, fields: set[str], label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        fail(f"{label} must be an object")
    if set(value) != fields:
        fail(f"{label} fields must be exactly {sorted(fields)}")
    return value


def require_text(value: Any, label: str, maximum: int | None = None) -> str:
    if not isinstance(value, str) or not value.strip():
        fail(f"{label} must be a non-empty string")
    if maximum is not None and len(value) > maximum:
        fail(f"{label} must be at most {maximum} characters")
    return value


def require_uuid(value: Any, label: str, seen: set[str]) -> str:
    if not isinstance(value, str) or not UUID_PATTERN.fullmatch(value):
        fail(f"{label} must be a canonical lowercase UUID")
    if str(uuid.UUID(value)) != value:
        fail(f"{label} must be a canonical lowercase UUID")
    if value in seen:
        fail(f"duplicate UUID: {value}")
    seen.add(value)
    return value


def require_date(value: Any, label: str) -> str:
    if not isinstance(value, str) or not DATE_PATTERN.fullmatch(value):
        fail(f"{label} must be YYYY-MM-DD")
    try:
        date.fromisoformat(value)
    except ValueError:
        fail(f"{label} must be a real calendar date")
    return value


def validate_repo_reference(value: Any, label: str, must_exist: bool = True) -> Path:
    reference = require_text(value, label)
    normalized = reference.replace("\\", "/")
    path = PurePosixPath(normalized)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        fail(f"{label} must be a safe repository-relative path")
    resolved = (ROOT / Path(*path.parts)).resolve()
    try:
        resolved.relative_to(ROOT.resolve())
    except ValueError:
        fail(f"{label} escapes the repository")
    if must_exist and not resolved.is_file():
        fail(f"{label} does not exist: {reference}")
    return resolved


def validate_source(source: Any, index: int, source_ids: set[str]) -> dict[str, Any]:
    label = f"sources[{index}]"
    item = require_object(source, SOURCE_FIELDS, label)
    source_id = require_text(item["id"], f"{label}.id")
    if source_id in source_ids:
        fail(f"duplicate source id: {source_id}")
    source_ids.add(source_id)
    url = require_text(item["url"], f"{label}.url")
    if url.startswith("repo://"):
        validate_repo_reference(url.removeprefix("repo://"), f"{label}.url repository path")
    else:
        parsed = urlsplit(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            fail(f"{label}.url must be HTTPS or repo://")
    require_text(item["title"], f"{label}.title")
    require_date(item["accessed_on"], f"{label}.accessed_on")
    require_text(item["scope"], f"{label}.scope")
    return item


def validate_gate(gate: Any, label: str, required: bool, publication_check: bool) -> None:
    item = require_object(gate, GATE_FIELDS, label)
    status = item["status"]
    allowed = {"pending", "approved"} if required else {"not_required"}
    if not isinstance(status, str) or status not in allowed:
        fail(f"{label}.status must be one of {sorted(allowed)}")
    evidence = item["evidence"]
    if not isinstance(evidence, list):
        fail(f"{label}.evidence must be an array")
    if status in {"pending", "not_required"} and evidence:
        fail(f"{label}.evidence must be empty unless the gate is approved")
    if status == "approved":
        if not evidence:
            fail(f"{label} marked approved without evidence")
        for index, raw in enumerate(evidence):
            entry = require_object(raw, EVIDENCE_FIELDS, f"{label}.evidence[{index}]")
            validate_repo_reference(entry["reference"], f"{label}.evidence[{index}].reference")
            require_date(entry["reviewed_on"], f"{label}.evidence[{index}].reviewed_on")
    if publication_check and required and status != "approved":
        fail(f"{label} is not approved with evidence")


def validate_claim(claim: Any, label: str, source_ids: set[str], publication_check: bool) -> str:
    if not isinstance(claim, dict):
        fail(f"{label} must be an object")
    if set(claim) == CLAIM_SOURCE_FIELDS:
        claim_id = require_text(claim["claim_id"], f"{label}.claim_id")
        require_text(claim["text"], f"{label}.text")
        refs = claim["source_refs"]
        if not isinstance(refs, list) or not refs:
            fail(f"{label}.source_refs must be a non-empty array")
        if any(not isinstance(ref, str) or ref not in source_ids for ref in refs):
            fail(f"{label}.source_refs must contain unique source ids from the register")
        if len(set(refs)) != len(refs):
            fail(f"{label}.source_refs must not contain duplicates")
        return claim_id
    if set(claim) == CLAIM_UNVERIFIED_FIELDS:
        claim_id = require_text(claim["claim_id"], f"{label}.claim_id")
        require_text(claim["text"], f"{label}.text")
        state = require_object(claim["unverified"], UNVERIFIED_FIELDS, f"{label}.unverified")
        if not isinstance(state["reason"], str) or state["reason"] not in {"needs_source", "app_behavior"}:
            fail(f"{label}.unverified.reason is unsupported")
        references = state["evidence_refs"]
        if not isinstance(references, list) or any(not isinstance(ref, str) for ref in references):
            fail(f"{label}.unverified.evidence_refs must be an array of repo paths")
        for index, reference in enumerate(references):
            validate_repo_reference(reference, f"{label}.unverified.evidence_refs[{index}]")
        if state["reason"] == "app_behavior" and not references:
            fail(f"{label} app_behavior needs repository evidence references")
        if publication_check:
            fail(f"{label} contains an unverified claim")
        return claim_id
    fail(f"{label} must match the sourced-claim or unverified-claim shape")


def validate_bundle(bundle: Any, publication_check: bool = False) -> dict[str, int]:
    root = require_object(bundle, ROOT_FIELDS, "root")
    if type(root["schema_version"]) is not int or root["schema_version"] != 1:
        fail("schema_version must be integer 1")
    if root["bundle_id"] != "mvp-content-bundle-v1":
        fail('bundle_id must be "mvp-content-bundle-v1"')
    if root["status"] != "draft":
        fail('bundle status must remain "draft"; publication is a separate human process')

    raw_sources = root["sources"]
    if not isinstance(raw_sources, list):
        fail("sources must be an array")
    source_ids: set[str] = set()
    for index, source in enumerate(raw_sources):
        validate_source(source, index, source_ids)

    raw_items = root["items"]
    if not isinstance(raw_items, list) or len(raw_items) != len(IDENTITIES):
        fail(f"items must contain exactly {len(IDENTITIES)} entries")
    seen_slugs: set[str] = set()
    seen_ids: set[str] = set()
    version_total = 0
    step_total = 0
    seen_all_uuids: set[str] = set()
    for index, raw_item in enumerate(raw_items):
        label = f"items[{index}]"
        if not isinstance(raw_item, dict):
            fail(f"{label} must be an object")
        slug = raw_item.get("slug")
        fields = ITEM_FIELDS | ({"context"} if slug == "before-homecoming" else set())
        item = require_object(raw_item, fields, label)
        if not isinstance(slug, str) or slug not in IDENTITIES:
            fail(f"{label}.slug is not in the approved 11-item set")
        if slug in seen_slugs:
            fail(f"duplicate slug: {slug}")
        seen_slugs.add(slug)
        expected_id, expected_type, expected_context = IDENTITIES[slug]
        content_id = require_uuid(item["id"], f"{label}.id", seen_all_uuids)
        seen_ids.add(content_id)
        if content_id != expected_id:
            fail(f"{label}.id does not match the reserved id for {slug}")
        if item["content_type"] != expected_type or expected_type not in CONTENT_TYPES:
            fail(f"{label}.content_type does not match the approved type for {slug}")
        if expected_context is None:
            if "context" in item:
                fail(f"{label}.context is only allowed for before-homecoming")
        elif item.get("context") != expected_context:
            fail(f"{label}.context must be {expected_context!r}")
        versions = item["versions"]
        if not isinstance(versions, list) or not versions:
            fail(f"{label}.versions must be a non-empty array")
        seen_numbers: set[int] = set()
        for version_index, raw_version in enumerate(versions):
            version_label = f"{label}.versions[{version_index}]"
            version = require_object(raw_version, VERSION_FIELDS, version_label)
            version_id = require_uuid(version["id"], f"{version_label}.id", seen_all_uuids)
            number = version["version"]
            if type(number) is not int or number <= 0 or number in seen_numbers:
                fail(f"{version_label}.version must be a unique positive integer per slug")
            seen_numbers.add(number)
            if number == 1 and version_id != VERSION_ONE_IDS[slug]:
                fail(f"{version_label}.id does not match the reserved version-1 id for {slug}")
            if version["status"] != "draft":
                fail(f"{version_label}.status must remain draft")
            require_text(version["title"], f"{version_label}.title", 160)
            require_text(version["body"], f"{version_label}.body")
            minimum, maximum = version["min_age_weeks"], version["max_age_weeks"]
            if type(minimum) is not int or minimum < 0:
                fail(f"{version_label}.min_age_weeks must be a non-negative integer")
            if maximum is not None and (type(maximum) is not int or maximum < minimum):
                fail(f"{version_label}.max_age_weeks must be null or an integer >= min_age_weeks")
            targets = version["breed_targets"]
            if not isinstance(targets, list) or any(not isinstance(target, str) or not target.strip() for target in targets):
                fail(f"{version_label}.breed_targets must be an array of non-empty breed ids")
            if len(set(targets)) != len(targets):
                fail(f"{version_label}.breed_targets must not contain duplicates")

            claims = version["claim_trace"]
            if not isinstance(claims, list) or not claims:
                fail(f"{version_label}.claim_trace must contain at least one claim or app-behavior trace")
            claim_ids: set[str] = set()
            for claim_index, claim in enumerate(claims):
                claim_id = validate_claim(claim, f"{version_label}.claim_trace[{claim_index}]", source_ids, publication_check)
                if claim_id in claim_ids:
                    fail(f"duplicate claim_id in {version_label}: {claim_id}")
                claim_ids.add(claim_id)

            review = require_object(version["review"], REVIEW_FIELDS, f"{version_label}.review")
            expert_required = slug in ADVICE_SLUGS
            if slug not in ADVICE_SLUGS | APP_GUIDE_SLUGS:
                fail(f"{slug} is missing a review-gate classification")
            validate_gate(review["dog_expert"], f"{version_label}.review.dog_expert", expert_required, publication_check)
            validate_gate(review["human_reviewer"], f"{version_label}.review.human_reviewer", True, publication_check)

            raw_steps = version["training_steps"]
            if not isinstance(raw_steps, list):
                fail(f"{version_label}.training_steps must be an array")
            if expected_type == "training_program" and not raw_steps:
                fail(f"{version_label} training_program must contain steps")
            if expected_type != "training_program" and raw_steps:
                fail(f"{version_label} non-program content must have no training_steps")
            step_keys: set[str] = set()
            positions: set[int] = set()
            for step_index, raw_step in enumerate(raw_steps):
                step_label = f"{version_label}.training_steps[{step_index}]"
                step = require_object(raw_step, STEP_FIELDS, step_label)
                step_id = require_uuid(step["id"], f"{step_label}.id", seen_all_uuids)
                step_key = require_text(step["step_key"], f"{step_label}.step_key")
                position = step["position"]
                if type(position) is not int or position <= 0 or position in positions:
                    fail(f"{step_label}.position must be a unique positive integer per version")
                positions.add(position)
                if step_key in step_keys:
                    fail(f"duplicate step_key in {version_label}: {step_key}")
                step_keys.add(step_key)
                require_text(step["title"], f"{step_label}.title", 160)
                require_text(step["instruction"], f"{step_label}.instruction")
                refs = step["claim_refs"]
                if not isinstance(refs, list) or any(not isinstance(ref, str) or ref not in claim_ids for ref in refs):
                    fail(f"{step_label}.claim_refs must reference claim_trace ids")
                if len(set(refs)) != len(refs):
                    fail(f"{step_label}.claim_refs must not contain duplicates")
                step_total += 1
            version_total += 1

    if seen_slugs != set(IDENTITIES):
        fail("items must contain exactly the 11 approved slugs")
    return {"items": len(seen_ids), "versions": version_total, "steps": step_total, "sources": len(source_ids)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_BUNDLE, help="versioned draft bundle JSON")
    parser.add_argument("--publication-check", action="store_true", help="require all review gates/evidence and no unverified claims")
    args = parser.parse_args()
    try:
        with args.path.open(encoding="utf-8") as bundle_file:
            bundle = json.load(bundle_file)
        counts = validate_bundle(bundle, publication_check=args.publication_check)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Invalid content bundle: {error}", file=sys.stderr)
        return 1
    print(
        f"Validated draft bundle: {counts['items']} content items, {counts['versions']} versions, "
        f"{counts['steps']} training steps, {counts['sources']} sources."
    )
    if args.publication_check:
        print("Evidence fields and repository references pass structural checks only; review authenticity is manual. No content was published or imported.")
    else:
        print("Draft validation does not verify source support, expert approval, or human review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

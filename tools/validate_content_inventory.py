#!/usr/bin/env python3
"""Validate the closed metadata contract for the editorial MVP inventory."""

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT_FIELDS = {"inventory_version", "scope", "items"}
ITEM_FIELDS = {
    "id",
    "title",
    "topic",
    "content_type",
    "age_window_weeks",
    "status",
    "sources",
    "review_evidence",
    "review_required",
    "blocked_by",
}
CONTENT_TYPES = {"article", "guide", "checklist", "training_program"}
TOPICS = {
    "pre_home",
    "first_week_home",
    "daily_log_routines",
    "handling",
    "environment_safety",
    "being_alone",
    "weight_history",
    "health_events",
}
EXPERT_TOPICS = {"handling", "environment_safety", "being_alone", "weight_history", "health_events"}
DEFAULT_INVENTORY = Path(__file__).resolve().parents[1] / "docs/content/mvp-content-inventory.json"


def validate_inventory(inventory: Any) -> None:
    """Raise ValueError unless inventory obeys the exact metadata-only contract."""
    if not isinstance(inventory, dict):
        raise ValueError("root must be an object")
    if set(inventory) != ROOT_FIELDS:
        raise ValueError(f"root fields must be exactly {sorted(ROOT_FIELDS)}")
    if type(inventory["inventory_version"]) is not int or inventory["inventory_version"] != 1:
        raise ValueError("inventory_version must be integer 1")
    if inventory["scope"] != "editorial_metadata_only":
        raise ValueError('scope must be "editorial_metadata_only"')

    items = inventory["items"]
    if not isinstance(items, list) or len(items) != 8:
        raise ValueError("items must contain exactly eight entries")

    seen_ids: set[str] = set()
    seen_topics: set[str] = set()
    for index, item in enumerate(items):
        label = f"items[{index}]"
        if not isinstance(item, dict):
            raise ValueError(f"{label} must be an object")
        if set(item) != ITEM_FIELDS:
            raise ValueError(f"{label} fields must be exactly {sorted(ITEM_FIELDS)}")

        item_id = item["id"]
        if not isinstance(item_id, str) or not item_id.strip():
            raise ValueError(f"{label}.id must be a non-empty string")
        if item_id in seen_ids:
            raise ValueError(f"duplicate id: {item_id}")
        seen_ids.add(item_id)

        for field in ("title", "topic"):
            value = item[field]
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{label}.{field} must be a non-empty string")
        if not isinstance(item["content_type"], str) or item["content_type"] not in CONTENT_TYPES:
            raise ValueError(f"{label}.content_type is unsupported")
        if item["status"] != "proposed":
            raise ValueError(f"{label}.status must be exactly proposed")

        window = item["age_window_weeks"]
        if not isinstance(window, dict) or set(window) != {"min", "max"}:
            raise ValueError(f"{label}.age_window_weeks must contain exactly min and max")
        minimum, maximum = window["min"], window["max"]
        if type(minimum) is not int or type(maximum) is not int:
            raise ValueError(f"{label}.age_window_weeks values must be integers")
        if minimum < 0 or maximum < minimum:
            raise ValueError(f"{label}.age_window_weeks must satisfy 0 <= min <= max")

        for field in ("sources", "review_evidence"):
            if item[field] != []:
                raise ValueError(f"{label}.{field} must be an empty list")

        topic = item["topic"]
        if topic not in TOPICS:
            raise ValueError(f"{label}.topic is unsupported")
        seen_topics.add(topic)
        expert_required = topic in EXPERT_TOPICS
        expected_reviews = ["dog_expert"] if expert_required else []
        expected_blockers = ["source_selection", "pilot_selection"]
        if expert_required:
            expected_blockers.append("expert_review")
        if item["review_required"] != expected_reviews:
            raise ValueError(f"{label}.review_required does not match the topic review gate")
        if item["blocked_by"] != expected_blockers:
            raise ValueError(f"{label}.blocked_by does not match the topic publication gates")

    if seen_topics != TOPICS:
        raise ValueError("items must cover each of the eight approved topics exactly once")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_INVENTORY, help="inventory JSON path")
    args = parser.parse_args()
    try:
        with args.path.open(encoding="utf-8") as inventory_file:
            inventory = json.load(inventory_file)
        validate_inventory(inventory)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Invalid content inventory: {error}", file=sys.stderr)
        return 1
    print(f"Validated 8 proposed metadata items: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

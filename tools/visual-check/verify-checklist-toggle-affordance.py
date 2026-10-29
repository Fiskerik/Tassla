import json
import os
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(os.environ.get("TASSLA_UI_EVIDENCE", ROOT / "docs/design/evidence/checklist-toggle-affordance-2026-10-25"))
BASE = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4173/")
GLYPHS = json.loads((ROOT / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json").read_text())
OUT.mkdir(parents=True, exist_ok=True)
PASSES = []
FAILURES = []
PAGE_ERRORS = []


def check(condition, label, details=None):
    result = {"check": label, "details": details}
    if condition:
        PASSES.append(result)
        print("PASS", label)
        return
    FAILURES.append(result)
    print("FAIL", label, details or "")
    raise AssertionError(label)


def open_phase(page):
    page.goto(f"{BASE}?screen=checklist-overview")
    page.get_by_text("0 av 3 genomförda").first.wait_for(timeout=5000)
    page.get_by_role("button", name=re.compile(r"^Öppna 8–12 veckor(?:, föreslagen fas)?$")).click()
    page.get_by_role("progressbar").wait_for(timeout=5000)


def marker_state(row):
    glyph = row.locator(":scope > div").first.locator('[dir="auto"]')
    return {
        "codepoint": glyph.evaluate("el => el.textContent.codePointAt(0)"),
        "fontSize": glyph.evaluate("el => getComputedStyle(el).fontSize"),
        "color": glyph.evaluate("el => getComputedStyle(el).color"),
    }


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ.get("TASSLA_UI_CHROMIUM", "/usr/bin/chromium"), headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    for width, height, suffix, large_text in [
        (375, 844, "375x844", False),
        (430, 844, "430x844", False),
        (375, 667, "375x667", False),
        (375, 667, "375x667-css-zoom140", True),
    ]:
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        page.set_default_timeout(7000)
        page.on("pageerror", lambda error: PAGE_ERRORS.append(str(error)))
        open_phase(page)
        rows = page.get_by_role("checkbox")
        check(rows.count() == 3, f"Three phase items render at {suffix}")
        first = rows.nth(0)
        second = rows.nth(1)
        target = first.bounding_box()
        check(target is not None and target["width"] >= 44 and target["height"] >= 44, f"Checkbox row remains a >=44x44 CSS-px RN Web target at {suffix}", target)
        if large_text:
            page.evaluate("document.documentElement.style.zoom = '1.4'")
            zoom = page.evaluate("getComputedStyle(document.documentElement).zoom")
            check(zoom == "1.4", f"RN Web CSS zoom/text-layout proxy is 1.4 at {suffix}", {"computedZoom": zoom})
        check(first.get_attribute("aria-checked") == "false", f"Initial first item is unchecked at {suffix}")
        check(first.get_attribute("aria-label") == "Om ni vill öva på namnet: belöna när hunden söker kontakt.", f"First item retains its accessible label at {suffix}")
        unchecked = marker_state(first)
        check(unchecked["codepoint"] == GLYPHS["ellipse-outline"], f"Unchecked marker is Ionicons ellipse-outline at {suffix}", unchecked)
        check(unchecked["fontSize"] == "28px", f"Unchecked Knowledge marker is 28 pt at {suffix}", unchecked)

        first.click()
        page.get_by_text("1 av 3 genomförda").wait_for(timeout=4000)
        check(first.get_attribute("aria-checked") == "true", f"Checked state reaches the checkbox accessibility property at {suffix}")
        checked = marker_state(first)
        check(checked["codepoint"] == GLYPHS["checkmark-circle"], f"Checked marker is Ionicons checkmark-circle at {suffix}", checked)
        check(checked["fontSize"] == "28px", f"Checked Knowledge marker is 28 pt at {suffix}", checked)
        check(checked["color"] != unchecked["color"], f"Checked and unchecked markers have distinct semantic colors at {suffix}", {"checked": checked["color"], "unchecked": unchecked["color"]})

        first.scroll_into_view_if_needed()
        label_box = first.locator(":scope > div").nth(2).bounding_box()
        category_box = second.locator('[data-testid^="checklist-item-icon-"]').bounding_box()
        check(label_box is not None and category_box is not None and label_box["x"] >= category_box["x"] + category_box["width"], f"Label and category icon stay separated at {suffix}", {"label": label_box, "categoryIcon": category_box})
        check(page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"No horizontal overflow at {suffix}")
        page.screenshot(path=str(OUT / f"final-{suffix}.png"))

        first.click()
        page.get_by_text("0 av 3 genomförda").wait_for(timeout=4000)
        check(first.get_attribute("aria-checked") == "false", f"Uncheck restores the original confirmed progress at {suffix}")
        page.close()
    browser.close()

report = {
    "mode": "public synthetic published phase catalog; RN Web CSS zoom 1.4 layout/text proxy in marked case",
    "passes": PASSES,
    "failures": FAILURES,
    "pageErrors": PAGE_ERRORS,
    "scope": "Local React Native Web rendering. The 375x667-css-zoom140 case asserts computed documentElement zoom=1.4 and captures the scaled layout. The >=44x44 target is measured before zoom in CSS px. This is not native Dynamic Type, VoiceOver, live Supabase/RLS, or physical touch behavior.",
}
(OUT / "toggle-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
check(not PAGE_ERRORS, "No browser page errors")
sys.exit(1 if FAILURES else 0)

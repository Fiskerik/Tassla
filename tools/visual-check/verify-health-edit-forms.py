from datetime import datetime, timezone
from pathlib import Path
import json
import os
import re

from playwright.sync_api import expect, sync_playwright


output = Path(os.environ.get("TASSLA_UI_EVIDENCE", "docs/design/evidence/vision-rev02/ui-r02-03-logg-halsa/health"))
output.mkdir(parents=True, exist_ok=True)
base_url = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4173/")
review = os.environ.get("TASSLA_UI_REVIEW") == "true"
results = []
errors = []


def passed(label):
    results.append(label)
    print("PASS", label)


def open_screen(page, screen, width, height, extra=""):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"{base_url}?screen={screen}&today=2026-10-11{extra}")
    page.wait_for_timeout(300)
    banner = page.get_by_test_id("health-fixture-banner").bounding_box()
    if banner:
        page.set_viewport_size({"width": width, "height": height + round(banner["height"])})
        page.wait_for_timeout(80)


def save_button_visible(page, name):
    button = page.get_by_role("button", name=name, exact=True)
    expect(button).to_be_visible()
    box = button.bounding_box()
    assert box is not None
    assert box["y"] >= 0 and box["y"] + box["height"] <= page.evaluate("innerHeight") + 1, f"{name} is outside the viewport: {box}"
    return box


def magnify_text(page):
    page.evaluate("""() => {
      document.querySelectorAll('*').forEach((node) => {
        if (node.children.length) return;
        const style = getComputedStyle(node);
        const size = parseFloat(style.fontSize);
        const line = parseFloat(style.lineHeight);
        if (Number.isFinite(size)) node.style.fontSize = `${size * 1.4}px`;
        if (Number.isFinite(line)) node.style.lineHeight = `${line * 1.4}px`;
      });
    }""")


with sync_playwright() as p:
    browser_options = {"headless": True, "args": ["--no-sandbox", "--disable-crash-reporter", "--disable-breakpad"]}
    if os.environ.get("TASSLA_UI_CHROMIUM"):
        browser_options["executable_path"] = os.environ["TASSLA_UI_CHROMIUM"]
    else:
        browser_options["executable_path"] = "/usr/bin/chromium"
    browser = p.chromium.launch(**browser_options)
    page = browser.new_page(viewport={"width": 375, "height": 844}, device_scale_factor=1)
    page.clock.install(time=datetime(2026, 10, 11, 15, 0, tzinfo=timezone.utc))
    page.on("pageerror", lambda error: errors.append(str(error)))

    # Performed history: one compact edit sheet, exact discard path and reachable fixed footer.
    open_screen(page, "health", 375, 844)
    expect(page.get_by_role("heading", name="Hälsa", exact=True)).to_be_visible()
    page.get_by_role("button", name=re.compile("Vaccination valp 1")).click()
    expect(page.get_by_role("heading", name="Ändra hälsohändelse", exact=True)).to_be_visible()
    page.wait_for_timeout(400)
    save_button_visible(page, "Spara hälsohändelse")
    expect(page.get_by_role("textbox", name="Kort anteckning, högst 500 tecken")).to_be_visible()
    page.screenshot(path=str(output / "performed-history-editor-375x844.png"))
    passed("Performed health edit uses one sheet and keeps its named save action visible at 375×844")

    open_screen(page, "health", 375, 667)
    page.get_by_role("button", name=re.compile("Vaccination valp 1")).click()
    note = page.get_by_role("textbox", name="Kort anteckning, högst 500 tecken")
    note.fill("Justering av anteckningen")
    note.press("End")
    note.press("Enter")
    expect(page.get_by_role("heading", name="Ändra hälsohändelse", exact=True)).to_be_visible()
    page.wait_for_timeout(400)
    save_button_visible(page, "Spara hälsohändelse")
    page.screenshot(path=str(output / "performed-history-editor-375x667.png"))
    page.get_by_role("button", name="Stäng", exact=True).last.click()
    expect(page.get_by_role("heading", name="Kasta ändringen?", exact=True)).to_be_visible()
    page.screenshot(path=str(output / "performed-history-discard-375x667.png"))
    page.get_by_role("button", name="Avbryt", exact=True).click()
    expect(page.get_by_role("heading", name="Ändra hälsohändelse", exact=True)).to_be_visible()
    passed("Performed history retains its draft after multiline Return and protects dirty close at 375×667")

    # Weight: add/edit share the same sheet and the decimal field does not push Save off-screen.
    open_screen(page, "health", 375, 667)
    page.get_by_role("tab", name="Vikt", exact=True).click()
    page.get_by_role("button", name=re.compile("Ändra vikt 5,2 kg")).click()
    expect(page.get_by_role("heading", name="Ändra vikt", exact=True)).to_be_visible()
    page.wait_for_timeout(400)
    weight = page.get_by_role("textbox", name="Vikt i kilogram")
    expect(weight).to_be_visible()
    weight.fill("5,35")
    save_box = save_button_visible(page, "Spara vikt")
    page.screenshot(path=str(output / "weight-editor-375x667.png"))
    magnify_text(page)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "140% text proxy causes horizontal overflow in weight editor"
    large_save_box = save_button_visible(page, "Spara vikt")
    page.screenshot(path=str(output / "weight-editor-140pct-375x667.png"))
    passed(f"Weight decimal editor keeps Save reachable at 375×667 and 140% text ({save_box['height']:.1f}px / {large_save_box['height']:.1f}px)")

    for width, height in ((375, 844), (430, 844)):
        open_screen(page, "health", width, height)
        page.get_by_role("tab", name="Vikt", exact=True).click()
        page.get_by_role("button", name=re.compile("Ändra vikt 5,2 kg")).click()
        expect(page.get_by_role("heading", name="Ändra vikt", exact=True)).to_be_visible()
        page.wait_for_timeout(400)
        save_button_visible(page, "Spara vikt")
        page.screenshot(path=str(output / f"weight-editor-{width}x{height}.png"))
    passed("Weight editor renders at 375×844 and 430×844")

    # Planned health: create and edit are sheets above the persistent list; delete is explicitly confirmed.
    open_screen(page, "planned", 375, 667)
    page.get_by_role("button", name="Planera en hälsohändelse", exact=True).click()
    expect(page.get_by_role("heading", name="Planera en hälsohändelse", exact=True)).to_be_visible()
    page.wait_for_timeout(400)
    plan_save = save_button_visible(page, "Spara plan")
    expect(page.get_by_role("textbox", name="Kort anteckning, högst 500 tecken")).to_be_visible()
    page.screenshot(path=str(output / "planned-health-create-375x667.png"))
    assert plan_save["height"] >= 44
    page.get_by_role("button", name="Stäng", exact=True).last.click()
    expect(page.get_by_role("heading", name="Planerade hälsohändelser", exact=True)).to_be_visible()
    page.get_by_role("button", name=re.compile("^Ändra Planerat veterinärbesök")).click()
    expect(page.get_by_role("heading", name="Ändra plan", exact=True)).to_be_visible()
    page.wait_for_timeout(400)
    save_button_visible(page, "Spara plan")
    page.get_by_role("button", name=re.compile("^Radera planerat veterinärbesök")).last.click()
    expect(page.get_by_role("heading", name="Ta bort plan?", exact=True)).to_be_visible()
    page.screenshot(path=str(output / "planned-health-delete-confirm-375x667.png"))
    page.get_by_role("button", name="Avbryt", exact=True).click()
    expect(page.get_by_role("heading", name="Ändra plan", exact=True)).to_be_visible()
    page.screenshot(path=str(output / "planned-health-editor-375x667.png"))
    passed("Planned health uses a fixed save footer and keeps the exact edit sheet open when deletion is cancelled")

    for width, height in ((375, 844), (430, 844)):
        open_screen(page, "planned", width, height)
        page.get_by_role("button", name="Planera en hälsohändelse", exact=True).click()
        expect(page.get_by_role("heading", name="Planera en hälsohändelse", exact=True)).to_be_visible()
        page.wait_for_timeout(400)
        save_button_visible(page, "Spara plan")
        page.screenshot(path=str(output / f"planned-health-create-{width}x{height}.png"))
    passed("Planned health form renders at 375×844 and 430×844")

    assert not errors, f"Browser errors: {errors}"
    result = {
        "environment": "synthetic React Native Web",
        "mode": "review" if review else "public",
        "viewportCases": ["375x667", "375x844", "430x844", "140% text proxy"],
        "results": results,
        "limitations": ["Does not verify native iOS keyboard/VoiceOver/Dynamic Type", "Does not verify live Supabase/RLS or migration runtime"],
    }
    (output / "browser-results.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    browser.close()

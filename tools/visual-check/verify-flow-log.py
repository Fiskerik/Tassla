from datetime import datetime, timezone
from pathlib import Path
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

output = Path(os.environ.get("TASSLA_UI_EVIDENCE", "docs/design/evidence/flow-log-01/render"))
output.mkdir(parents=True, exist_ok=True)
base_url = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4173/")
review = os.environ.get("TASSLA_UI_REVIEW") == "true"
results = []
errors = []


def passed(label):
    results.append(label)
    print("PASS", label)


def open_log(page, width, height=844, scenario="markers"):
    page.set_viewport_size({"width": width, "height": height})
    empty_state = "&state=empty" if scenario == "empty" else ""
    page.goto(f"{base_url}?screen=log&today=2026-10-11&calendarScenario={scenario}&logScenario=palette{empty_state}")
    page.wait_for_timeout(450)
    banner = page.get_by_test_id("review-log-banner").bounding_box()
    if banner:
        page.set_viewport_size({"width": width, "height": height + round(banner["height"])})
        page.wait_for_timeout(80)


def scroll_to_bottom(page):
    page.evaluate("""() => {
      const candidates = [...document.querySelectorAll('*')].filter((node) => {
        const style = getComputedStyle(node);
        return ['auto', 'scroll'].includes(style.overflowY) && node.scrollHeight > node.clientHeight + 2;
      });
      const target = candidates.sort((a, b) => b.clientHeight - a.clientHeight)[0];
      if (target) target.scrollTop = target.scrollHeight;
    }""")
    page.wait_for_timeout(120)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get("TASSLA_UI_CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox", "--disable-crash-reporter", "--disable-breakpad"],
    )
    page = browser.new_page(viewport={"width": 375, "height": 844}, device_scale_factor=1)
    page.clock.install(time=datetime(2026, 10, 11, 15, 0, tzinfo=timezone.utc))
    page.on("pageerror", lambda error: errors.append(str(error)))

    for width in (360, 375, 430):
        open_log(page, width)
        expect(page.get_by_text("Snabb logg", exact=True)).to_be_visible()
        expect(page.get_by_text("Dagens logg", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="Logga kiss", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="Logga vatten", exact=True)).to_have_count(0)
        expect(page.get_by_role("button", name=re.compile(r"^Vatten 13:00"))).to_be_visible()
        expect(page.get_by_role("button", name=re.compile(r"^Olycka 14:00"))).to_be_visible()
        date_button = page.get_by_role("button", name=re.compile(r"^Valt datum .*Öppna kalender$"))
        box = date_button.bounding_box()
        assert box and box["width"] >= 44 and box["height"] >= 44, f"Date button below 44 pt at {width}: {box}"
        date_text = page.get_by_test_id("log-selected-date").bounding_box()
        calendar_icon = page.get_by_test_id("log-calendar-date-glyph").bounding_box()
        assert date_text and calendar_icon
        gap = calendar_icon["x"] - (date_text["x"] + date_text["width"])
        text_center = date_text["x"] + date_text["width"] / 2
        control_center = box["x"] + box["width"] / 2
        assert gap >= 16 and abs(text_center - control_center) <= 2, f"Calendar icon is crowded or date is off-center at {width}px: gap={gap:.2f}, text={date_text}, icon={calendar_icon}, control={box}"
        page.screenshot(path=str(output / f"log-main-{width}.png"))
        page.get_by_role("button", name="Visa fler loggtyper", exact=True).click()
        expect(page.get_by_role("button", name="Logga promenad", exact=True)).to_be_visible()
        page.screenshot(path=str(output / f"log-more-{width}.png"))
        passed(f"Logga quick actions and Fler at {width}px; calendar gap {gap:.1f}px and centered date")

    # Check actual scroll-bottom clearance with the final action and expanded quick actions.
    open_log(page, 360)
    page.get_by_role("button", name="Visa fler loggtyper", exact=True).click()
    scroll_to_bottom(page)
    footer = page.get_by_role("tablist", name="Huvudmeny").bounding_box()
    action = page.get_by_role("button", name="Lägg till händelse", exact=True).bounding_box()
    assert footer and action
    clearance = footer["y"] - (action["y"] + action["height"])
    assert clearance >= 8, f"Logga primary action clearance is {clearance:.2f}px at 360x844 with Fler open"
    page.screenshot(path=str(output / "log-bottom-gap-360-more-open.png"))
    passed(f"AppScreen scroll-bottom clearance with Fler open: {clearance:.2f}px")

    # Normal and large text stress at the planned widths, preserving the full app viewport.
    for width, height in ((360, 844), (375, 844), (430, 844), (375, 667)):
        open_log(page, width, height)
        page.get_by_role("button", name="Visa fler loggtyper", exact=True).click()
        page.evaluate("""() => document.querySelectorAll('[dir="auto"]').forEach((node) => {
          if (node.closest('[role="tablist"], [data-testid="review-log-banner"]')) return;
          const style = getComputedStyle(node);
          node.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
          node.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
        })""")
        scroll_to_bottom(page)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow at {width}x{height}, 140% text"
        page.screenshot(path=str(output / f"log-large-text-{width}x{height}.png"))
        page.add_style_tag(content="html { filter: grayscale(1); }")
        page.screenshot(path=str(output / f"log-gray-{width}x{height}.png"))
        passed(f"140% text, grayscale and no horizontal overflow at {width}x{height}")

    # The date picker includes an asynchronous marker read, empty month, and a retryable error.
    for scenario, expected in (("markers", "Prick visar dagar med loggar"), ("empty", "Inga loggar den här månaden"), ("loading", "Hämtar loggdagar…"), ("error", "Loggdagar kunde inte hämtas.")):
        open_log(page, 375, scenario=scenario)
        page.get_by_role("button", name=re.compile(r"^Valt datum .*Öppna kalender$")).click()
        page.wait_for_timeout(350)
        expect(page.get_by_text("oktober 2026", exact=False)).to_be_visible()
        expect(page.get_by_text(expected, exact=True)).to_be_visible()
        if scenario == "empty":
            expect(page.get_by_text("Inga händelser den här dagen", exact=True)).to_be_visible()
        page.screenshot(path=str(output / f"log-calendar-{scenario}-375.png"))
        if scenario == "error":
            expect(page.get_by_role("button", name="Försök hämta loggdagar igen", exact=True)).to_be_visible()
        if scenario == "markers":
            marker_day = page.get_by_role("button", name="lördag, 10 oktober 2026, har loggar", exact=True)
            marker_box = marker_day.bounding_box()
            assert marker_box and marker_box["width"] >= 44 and marker_box["height"] >= 44, f"Marked date target too small: {marker_box}"
            future_day = page.get_by_role("button", name="måndag, 12 oktober 2026, avstängd", exact=True)
            assert future_day.is_disabled(), "Future calendar date must be disabled"
            page.get_by_role("button", name="Visa nästa månad", exact=True).wait_for(state="visible")
            assert page.get_by_role("button", name="Visa nästa månad", exact=True).is_disabled()
            page.get_by_role("button", name="Visa föregående månad", exact=True).click()
            expect(page.get_by_text("september 2026", exact=False)).to_be_visible()
            page.screenshot(path=str(output / "log-calendar-previous-month-375.png"))
            page.get_by_role("button", name="Visa nästa månad", exact=True).click()
            page.get_by_role("button", name="lördag, 10 oktober 2026, har loggar", exact=True).click()
            expect(page.get_by_text("Händelser", exact=True)).to_be_visible()
            expect(page.get_by_role("button", name="Valt datum Igår · 10 oktober. Öppna kalender", exact=True)).to_be_visible()
            expect(page.get_by_role("button", name=re.compile(r"^Vaken 07:30"))).to_be_visible()
            expect(page.get_by_role("heading", name="Välj datum", exact=True)).to_have_count(0)
            page.screenshot(path=str(output / "log-calendar-selected-date-375.png"))
        passed(f"Calendar {scenario} state at 375px")

    open_log(page, 360, scenario="markers")
    page.get_by_role("button", name=re.compile(r"^Valt datum .*Öppna kalender$")).click()
    page.wait_for_timeout(350)
    narrow_target = page.get_by_role("button", name="lördag, 10 oktober 2026, har loggar", exact=True).bounding_box()
    assert narrow_target and narrow_target["width"] >= 44 and narrow_target["height"] >= 44, f"Calendar target below 44 pt at 360px: {narrow_target}"
    page.screenshot(path=str(output / "log-calendar-markers-360.png"))
    passed(f"Rendered calendar day target at 360px: {narrow_target['width']:.2f}×{narrow_target['height']:.2f}px")

    assert not errors, errors
    browser.close()

(output / "browser-results.json").write_text(
    json.dumps({"passes": results, "pageErrors": errors, "reviewFixture": review, "scope": "Production LogScreen in RN Web with synthetic data; not native, backend or RLS certification"}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

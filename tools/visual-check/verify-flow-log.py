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
    banner = page.get_by_test_id("review-log-banner").bounding_box() if page.get_by_test_id("review-log-banner").count() else None
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

    # The retrospective pattern card handles both categories at supported widths and sparse data.
    for width, height in ((375, 844), (430, 844), (375, 667)):
        page.set_viewport_size({"width": width, "height": height})
        page.goto(f"{base_url}?screen=log&today=2026-10-11&calendarScenario=markers&logScenario=potty-patterns-both")
        page.wait_for_timeout(350)
        scroll_to_bottom(page)
        card = page.get_by_role("region", name=re.compile("Dina senaste mönster:"))
        expect(card).to_be_visible()
        for label in ("Kiss", "Bajs"):
            expect(card.get_by_text(label, exact=True)).to_be_visible()
        expect(card.get_by_text(re.compile(r"\d+ gånger")).first).to_be_visible()
        expect(card.get_by_text(re.compile(r"Ungefär var")).first).to_be_visible()
        page.screenshot(path=str(output / f"log-patterns-both-{width}x{height}.png"))
        passed(f"Pattern summary renders both categories at {width}x{height}")

    # Stress the same summary at 140% text and confirm that it wraps without page overflow.
    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(f"{base_url}?screen=log&today=2026-10-11&calendarScenario=markers&logScenario=potty-patterns-both")
    page.wait_for_timeout(350)
    page.evaluate("""() => document.querySelectorAll('[dir="auto"]').forEach((node) => {
      if (node.closest('[role="tablist"], [data-testid="review-log-banner"]')) return;
      const style = getComputedStyle(node);
      node.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
      node.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
    })""")
    scroll_to_bottom(page)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Pattern summary overflows at 140% text"
    expect(page.get_by_role("region", name=re.compile("Dina senaste mönster:"))).to_be_visible()
    page.screenshot(path=str(output / "log-patterns-both-140pct-375x667.png"))
    passed("Pattern summary wraps at 140% text without horizontal overflow")

    # Each sparse fixture retains only the category with sufficient history; below-threshold data hides the card.
    for scenario, labels in (("potty-patterns-pee", ("Kiss",)), ("potty-patterns-poop", ("Bajs",))):
        page.set_viewport_size({"width": 375, "height": 844})
        page.goto(f"{base_url}?screen=log&today=2026-10-11&calendarScenario=markers&logScenario={scenario}")
        page.wait_for_timeout(350)
        scroll_to_bottom(page)
        card = page.get_by_role("region", name=re.compile("Dina senaste mönster:"))
        expect(card).to_be_visible()
        for label in labels:
            expect(card.get_by_text(label, exact=True)).to_be_visible()
        expect(card.get_by_text(re.compile(r"\d+ gånger")).first).to_be_visible()
        expect(card.get_by_text(re.compile(r"Ungefär var")).first).to_be_visible()
        page.screenshot(path=str(output / f"log-patterns-{scenario}-375.png"))
        passed(f"Pattern summary renders {scenario} at 375px")

    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(f"{base_url}?screen=log&today=2026-10-11&calendarScenario=markers&logScenario=potty-patterns-sparse")
    page.wait_for_timeout(350)
    scroll_to_bottom(page)
    expect(page.get_by_role("heading", name="Dina senaste mönster", exact=True)).to_have_count(0)
    page.screenshot(path=str(output / "log-patterns-sparse-375x667.png"))
    passed("Sparse pattern data keeps the full section hidden")

    # Long-press layout editing uses the same category-colored icon variant as the quick tile.
    page.set_viewport_size({"width": 375, "height": 844})
    page.goto(f"{base_url}?screen=log&today=2026-10-11&calendarScenario=markers&logScenario=potty-patterns-both")
    page.wait_for_timeout(350)
    quick_kiss = page.get_by_role("button", name="Logga kiss", exact=True)
    history_kiss = page.get_by_role("button", name=re.compile(r"^Kiss 07:30"))
    expect(quick_kiss.get_by_role("img", name="Kiss-ikon")).to_have_count(0)
    expect(history_kiss.get_by_role("img", name="Kiss-ikon")).to_have_count(0)

    def assert_pee_glyph(container, location):
        icon = container.evaluate("""element => {
          const nodes = [element, ...element.querySelectorAll('*')];
          const backgrounds = nodes.map(node => getComputedStyle(node).backgroundColor);
          const paths = [...element.querySelectorAll('svg path')];
          const drops = paths.map(path => {
            const bounds = path.getBBox();
            return {fill: getComputedStyle(path).fill, d: path.getAttribute('d'), width: bounds.width, height: bounds.height};
          });
          return {backgrounds, drops};
        }""")
        assert len(icon["drops"]) == 3, f"Kiss needs exactly three filled drop paths in {location}: {icon}"
        assert all(" C" in drop["d"] and " A" in drop["d"] and drop["height"] > drop["width"] for drop in icon["drops"]), f"Kiss paths must read as upright teardrops in {location}: {icon}"
        return icon

    def assert_pee_icon(container, location):
        icon = assert_pee_glyph(container, location)
        assert 'rgb(245, 231, 191)' in icon["backgrounds"], f"Kiss amber surface missing in {location}: {icon}"
        assert all(drop["fill"] == 'rgb(120, 87, 22)' for drop in icon["drops"]), f"Kiss amber drop fill missing in {location}: {icon}"

    def assert_food_green(container, location):
        result = container.evaluate("""element => {
          const nodes = [element, ...element.querySelectorAll('*')];
          return {
            backgrounds: nodes.map(node => getComputedStyle(node).backgroundColor),
            colors: nodes.map(node => getComputedStyle(node).color),
          };
        }""")
        assert 'rgb(232, 239, 232)' in result["backgrounds"], f"Mat green surface missing in {location}: {result}"
        assert 'rgb(24, 106, 77)' in result["colors"], f"Mat green icon missing in {location}: {result}"

    assert_pee_icon(quick_kiss, "quick tile")
    assert_pee_icon(history_kiss, "history")
    quick_mat = page.get_by_role("button", name="Logga mat", exact=True)
    history_mat = page.get_by_role("button", name=re.compile(r"^Mat 12:05"))
    assert_food_green(quick_mat, "quick tile")
    assert_food_green(history_mat, "history")
    water_row = page.get_by_role("button", name=re.compile(r"^Vatten 13:00"))
    expect(water_row.get_by_role("img", name="Vatten-ikon")).to_be_visible()
    assert 'rgb(228, 238, 244)' in water_row.evaluate("element => [element, ...element.querySelectorAll('*')].map(node => getComputedStyle(node).backgroundColor)"), "Water must keep its blue surface"
    quick_bounds = quick_kiss.bounding_box()
    assert quick_bounds is not None
    page.mouse.move(quick_bounds["x"] + quick_bounds["width"] / 2, quick_bounds["y"] + quick_bounds["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(700)
    page.mouse.up()
    expect(page.get_by_role("heading", name="Ändra snabbval", exact=True)).to_be_visible()
    layout_kiss = page.get_by_role("button", name="Kiss, Flytta till Mer", exact=True)
    layout_mat = page.get_by_role("button", name="Mat, Flytta till Mer", exact=True)
    expect(layout_kiss).to_be_visible()
    expect(layout_mat).to_be_visible()
    expect(layout_kiss.get_by_role("img", name="Kiss-ikon")).to_have_count(0)
    assert_pee_icon(layout_kiss, "long-press layout editor")
    assert_food_green(layout_mat, "long-press layout editor")
    accident_with_pee = page.get_by_role("button", name=re.compile(r"^Olycka 11:00"))
    expect(accident_with_pee).to_be_visible()
    assert_pee_glyph(accident_with_pee, "small Kiss mark inside Olycka")
    page.screenshot(path=str(output / "log-layout-editor-kiss-375.png"))
    passed("Kiss uses the same amber surface in quick tile, history, and long-press layout editor")

    # The event-type picker inside the edit sheet must use that same category icon too.
    page.get_by_role("button", name="Klar med snabbval", exact=True).click()
    history_kiss.click()
    page.wait_for_timeout(350)
    expect(page.get_by_role("heading", name="Ändra händelse", exact=True)).to_be_visible()
    type_trigger = page.get_by_role("button", name="Händelsetyp: Kiss", exact=True)
    assert_pee_icon(type_trigger, "event type trigger")
    type_trigger.click()
    page.wait_for_timeout(120)
    kiss_option = page.get_by_role("radio", name="Kiss", exact=True)
    expect(kiss_option).to_be_visible()
    expect(kiss_option.get_by_role("img", name="Kiss-ikon")).to_have_count(0)
    assert_pee_icon(kiss_option, "event type selector")
    food_option = page.get_by_role("radio", name="Mat", exact=True)
    assert_food_green(food_option, "event type selector")
    page.screenshot(path=str(output / "log-event-type-selector-kiss-375.png"))
    passed("Kiss keeps the same amber three-drop icon in the event type trigger and selector")

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

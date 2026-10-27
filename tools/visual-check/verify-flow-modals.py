import json
import os
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


base_url = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4382/")
output = Path(os.environ.get("TASSLA_UI_EVIDENCE", "docs/design/evidence/ui-modal-center-01"))
output.mkdir(parents=True, exist_ok=True)
passes = []
errors = []


def passed(message):
    passes.append(message)
    print(f"PASS {message}")


def centered(page, locator, name, tolerance=2, max_width=False):
    expect(locator).to_be_visible()
    page.wait_for_timeout(350)
    box = locator.bounding_box()
    viewport = page.viewport_size
    assert box and viewport, f"{name}: missing geometry"
    dx = abs((box["x"] + box["width"] / 2) - viewport["width"] / 2)
    dy = abs((box["y"] + box["height"] / 2) - viewport["height"] / 2)
    assert dx <= tolerance and dy <= tolerance, f"{name} is off center by ({dx:.1f}, {dy:.1f}) at {viewport}: {box}"
    assert box["x"] >= 0 and box["y"] >= 0 and box["x"] + box["width"] <= viewport["width"] + 1 and box["y"] + box["height"] <= viewport["height"] + 1, f"{name} exceeds viewport {viewport}: {box}"
    if max_width and viewport["width"] >= 700:
        assert box["width"] <= 562, f"{name} exceeded the 560pt max width at {viewport}: {box}"
    return box


def gallery(page, width, height):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(f"{base_url}?screen=components")
    page.wait_for_timeout(120)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get("TASSLA_UI_CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox", "--disable-crash-reporter", "--disable-breakpad"],
    )
    page = browser.new_page(viewport={"width": 375, "height": 844}, device_scale_factor=1)
    page.set_default_timeout(7000)
    page.on("pageerror", lambda error: errors.append(str(error)))

    # The component gallery is a development-only harness, used only to open isolated shared primitives.
    for width, height in ((320, 570), (375, 844), (430, 844), (768, 844)):
        gallery(page, width, height)
        page.get_by_role("button", name="Fler val", exact=True).last.click()
        menu = page.get_by_test_id("center-modal-action-menu")
        menu_box = centered(page, menu, f"ActionMenu {width}x{height}", max_width=True)
        actions = menu.get_by_role("menuitem")
        assert actions.count() == 2
        for index in range(2):
            action_box = actions.nth(index).bounding_box()
            assert action_box and action_box["width"] >= 44 and action_box["height"] >= 44, f"ActionMenu target below 44pt: {action_box}"
        for expected in ("Ändra posten", "Radera posten", "Stäng meny"):
            page.keyboard.press("Tab")
            active_label = page.evaluate("document.activeElement.getAttribute('aria-label')")
            assert active_label == expected, f"ActionMenu keyboard order expected {expected}, received {active_label}"
        if width == 375:
            page.screenshot(path=str(output / "development-gallery-action-menu-375.png"))
        page.get_by_role("button", name="Stäng meny", exact=True).click(position={"x": 12, "y": 12})
        expect(menu).to_be_hidden()
        page.wait_for_timeout(350)

        page.get_by_role("button", name="Visa dialog", exact=True).click()
        dialog = page.get_by_role("alert", name="Radera händelsen?")
        centered(page, dialog, f"Dialog {width}x{height}")
        if width == 375:
            page.screenshot(path=str(output / "development-gallery-dialog-375.png"))
        page.get_by_role("button", name="Avbryt", exact=True).click()
        page.wait_for_timeout(350)

        page.get_by_role("button", name="Visa panel", exact=True).click()
        sheet = page.get_by_test_id("center-modal-bottom-sheet")
        sheet_box = centered(page, sheet, f"BottomSheet {width}x{height}", max_width=True)
        assert sheet_box["width"] <= min(width - 24, 562), f"BottomSheet missed safe horizontal margins: {sheet_box}"
        expect(sheet.get_by_text("En kort överblick för veterinärbesöket. Dela som PDF.", exact=True)).to_be_visible()
        if width == 375:
            page.screenshot(path=str(output / "development-gallery-bottom-sheet-375.png"))
        page.mouse.click(12, 12)
        expect(sheet).to_be_hidden()
        page.wait_for_timeout(350)
        passed(f"Development component gallery: ActionMenu, Dialog, BottomSheet at {width}x{height}; 44pt actions and bounded card")

    # The dedicated development fixture counts each ActionMenu callback so button and backdrop events cannot mask each other.
    page.set_viewport_size({"width": 375, "height": 844})
    page.goto(f"{base_url}?screen=action-menu-contract")
    page.get_by_role("button", name="Testa åtgärdsmenyn", exact=True).click()
    contract_menu = page.get_by_test_id("center-modal-action-menu")
    centered(page, contract_menu, "ActionMenu callback contract")
    page.mouse.click(12, 12)
    expect(contract_menu).to_be_hidden()
    assert page.evaluate("window.__tasslaActionMenuCalls") == {"close": 1, "edit": 0, "delete": 0}, "Backdrop should only close the menu"

    page.get_by_role("button", name="Testa åtgärdsmenyn", exact=True).click()
    page.get_by_role("menuitem", name="Ändra testpost", exact=True).click()
    expect(contract_menu).to_be_hidden()
    assert page.evaluate("window.__tasslaActionMenuCalls") == {"close": 2, "edit": 1, "delete": 0}, "Edit should close once and invoke only the edit callback once"

    page.get_by_role("button", name="Testa åtgärdsmenyn", exact=True).click()
    page.get_by_role("menuitem", name="Radera testpost", exact=True).click()
    expect(contract_menu).to_be_hidden()
    assert page.evaluate("window.__tasslaActionMenuCalls") == {"close": 3, "edit": 1, "delete": 1}, "Delete should close once and invoke only the delete callback once"
    page.screenshot(path=str(output / "action-menu-callback-fixture-375.png"))
    passed("ActionMenu backdrop, Edit and Delete each invoke only their own one-shot callback and close once")

    # Production Planned Health: centered info/date sheets and a nested reminder time picker.
    for width, height in ((320, 570), (375, 844), (430, 844), (768, 844)):
        page.set_viewport_size({"width": width, "height": height})
        page.goto(f"{base_url}?screen=planned&state=ready&plannedScenario=ready")
        page.wait_for_timeout(120)
        page.get_by_role("button", name="Visa information om planerade hälsohändelser", exact=True).click()
        centered(page, page.get_by_test_id("center-modal-info"), f"Planned Health info {width}x{height}")
        if width == 375:
            page.screenshot(path=str(output / "planned-health-info-375.png"))
        page.get_by_role("button", name="Stäng information", exact=True).click()
        page.wait_for_timeout(350)

        page.get_by_role("button", name="Planera en hälsohändelse", exact=True).click()
        parent = page.get_by_test_id("center-modal-bottom-sheet")
        centered(page, parent, f"Planned Health form {width}x{height}")
        expect(parent.get_by_role("button", name="Spara plan", exact=True)).to_be_visible()
        page.get_by_role("button", name="Öppna kalender för Planerat datum", exact=True).click()
        centered(page, page.get_by_test_id("center-modal-date-picker"), f"DatePicker {width}x{height}")
        if width == 375:
            page.screenshot(path=str(output / "planned-health-date-picker-375.png"))
        page.get_by_role("button", name="Stäng kalender", exact=True).click()
        page.wait_for_timeout(350)
        expect(parent).to_be_visible()

        page.get_by_role("checkbox", name="Påminn mig lokalt").click()
        page.get_by_role("button", name="Öppna tidsväljare för Påminnelsetid, lokal tid", exact=True).click()
        time_picker = page.get_by_test_id("center-modal-time-picker")
        centered(page, time_picker, f"Nested TimePicker {width}x{height}", max_width=True)
        expect(time_picker.get_by_role("button", name="Bekräfta tid", exact=True)).to_be_visible()
        if width == 375:
            page.screenshot(path=str(output / "planned-health-nested-time-picker-375.png"))
        page.get_by_role("button", name="Avbryt tid", exact=True).click()
        page.wait_for_timeout(350)
        expect(parent).to_be_visible()
        if width == 375:
            page.screenshot(path=str(output / "planned-health-form-375.png"))
        passed(f"Production Planned Health: info, date picker, nested reminder TimePicker and parent recovery at {width}x{height}")

    # Production routes that exercise the shared sheet/time-picker from log, history and notifications.
    page.set_viewport_size({"width": 375, "height": 844})
    page.goto(f"{base_url}?screen=log&state=ready&logScenario=ready")
    page.get_by_role("button", name="Lägg till händelse", exact=True).click()
    centered(page, page.get_by_test_id("center-modal-bottom-sheet"), "Log Add Event sheet")
    expect(page.get_by_text("Logga", exact=True).first).to_be_visible()
    page.screenshot(path=str(output / "log-add-event-375.png"))
    page.get_by_test_id("center-modal-bottom-sheet").get_by_role("button", name="Stäng", exact=True).click()
    page.wait_for_timeout(350)
    passed("Production Log Add Event sheet is centered and its existing actions remain available")

    page.goto(f"{base_url}?screen=health&state=ready")
    page.get_by_role("button", name="Lägg till hälsohändelse", exact=True).click()
    centered(page, page.get_by_test_id("center-modal-bottom-sheet"), "Health history choice sheet")
    page.get_by_role("button", name=re.compile(r"^Registrera utförd händelse")).click()
    centered(page, page.get_by_test_id("center-modal-bottom-sheet").last, "Health history editor sheet")
    expect(page.get_by_role("button", name="Spara hälsohändelse", exact=True)).to_be_visible()
    page.screenshot(path=str(output / "health-history-editor-375.png"))
    page.get_by_test_id("center-modal-bottom-sheet").last.get_by_role("button", name="Stäng", exact=True).click()
    page.wait_for_timeout(350)
    passed("Production Health history choice and editor sheets are centered with save action reachable")

    page.goto(f"{base_url}?screen=reminders&state=training")
    page.get_by_role("button", name="Öppna tidsväljare för Träningspåminnelse, lokal tid", exact=True).click()
    centered(page, page.get_by_test_id("center-modal-time-picker"), "Notification Settings TimePicker", max_width=True)
    page.screenshot(path=str(output / "notification-time-picker-375.png"))
    page.get_by_role("button", name="Avbryt tid", exact=True).click()
    page.wait_for_timeout(350)
    passed("Production Notification Settings TimePicker is centered and cancellable")

    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(f"{base_url}?screen=reminders&state=training")
    page.get_by_role("button", name="Öppna tidsväljare för Träningspåminnelse, lokal tid", exact=True).click()
    centered(page, page.get_by_test_id("center-modal-time-picker"), "Short viewport TimePicker", max_width=True)
    time_card = page.get_by_test_id("center-modal-time-picker").bounding_box()
    assert time_card and page.get_by_role("button", name="Bekräfta tid", exact=True).is_visible()
    page.screenshot(path=str(output / "notification-time-picker-short-375x667.png"))
    page.get_by_role("button", name="Avbryt tid", exact=True).click()
    page.wait_for_timeout(350)
    passed("Notification TimePicker stays centered at 375x667 with its confirm action reachable")

    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(f"{base_url}?screen=planned&state=ready&plannedScenario=ready")
    page.get_by_role("button", name="Planera en hälsohändelse", exact=True).click()
    compact_form = page.get_by_test_id("center-modal-bottom-sheet")
    compact_form.evaluate("""root => root.querySelectorAll('[dir="auto"]').forEach(node => {
      const style = getComputedStyle(node);
      node.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
      node.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
    })""")
    compact_box = centered(page, compact_form, "140% text proxy planned-health form")
    expect(compact_form.get_by_role("button", name="Spara plan", exact=True)).to_be_visible()
    has_scroll_area = compact_form.evaluate("""root => [...root.querySelectorAll('*')].some(node => {
      const style = getComputedStyle(node);
      return ['auto', 'scroll'].includes(style.overflowY) && node.scrollHeight > node.clientHeight + 2;
    })""")
    assert has_scroll_area, f"The 140% text proxy should keep long form content scrollable: {compact_box}"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "140% text proxy caused horizontal page overflow"
    page.screenshot(path=str(output / "planned-health-form-140-375x667.png"))
    passed("Planned Health form remains centered, scrollable and keeps its fixed save action at 140% text/375x667 proxy")

    assert not errors, errors
    browser.close()

(output / "browser-results.json").write_text(json.dumps({
    "passes": passes,
    "pageErrors": errors,
    "scope": "React Native Web rendering of production screens and shared primitives; component gallery is development-only and is not product UI; native keyboard, system overlays and device accessibility are NOT TESTABLE",
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

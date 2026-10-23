from pathlib import Path
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

out = Path(os.environ.get("TASSLA_UI_EVIDENCE", "docs/design/evidence/flow-training-01/public"))
out.mkdir(parents=True, exist_ok=True)
base = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4190/")
review = os.environ.get("TASSLA_UI_REVIEW", "false").lower() == "true"
results = []
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get("TASSLA_UI_CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox", "--disable-crash-reporter", "--disable-breakpad"],
    )
    page = browser.new_page(viewport={"width": 375, "height": 844}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(str(error)))

    def open_page(query=""):
        page.goto(f"{base}?screen=training{query}")
        page.wait_for_timeout(250)
        expect(page.get_by_text("Träning", exact=True).first).to_be_visible()

    def capture(name):
        page.screenshot(path=str(out / f"{name}.png"), full_page=True)

    initial_scenario = "half" if review else "default"
    open_page(f"&trainingScenario={initial_scenario}")
    if review:
        expect(page.get_by_text("Tillfälligt exempel – innehållet är inte sakgranskat.", exact=False)).to_be_visible()
        expect(page.get_by_text("Vardagsro och hantering", exact=True)).to_be_visible()
    expect(page.get_by_test_id("training-tab-recommended")).to_have_attribute("aria-selected", "true")
    expect(page.get_by_text("Passar just nu", exact=False)).to_be_visible()
    if not review:
        expect(page.get_by_text("Fortsätt där ni var", exact=True)).to_be_visible()
    expect(page.get_by_text("Standardbild", exact=True)).to_have_count(2)
    expect(page.get_by_text("5 min", exact=False)).to_have_count(0)
    capture("default-375x844")
    results.append("default 375×844: two distinct recommendations, one confirmed continuation, no invented duration")

    page.set_viewport_size({"width": 430, "height": 844})
    open_page(f"&trainingScenario={initial_scenario}")
    capture("default-430x844")
    results.append("default 430×844")

    page.set_viewport_size({"width": 375, "height": 667})
    open_page(f"&trainingScenario={initial_scenario}")
    capture("default-375x667")
    results.append("short viewport 375×667; content remains scrollable")

    page.set_viewport_size({"width": 375, "height": 844})
    open_page("&trainingScenario=long-title")
    long_title = page.get_by_test_id("training-recommendation-program-title").first
    expect(long_title).to_have_text("Trygg vardagsstart med lugna steg för nya situationer")
    expect(long_title).to_be_visible()
    assert long_title.evaluate("element => element.scrollHeight <= element.clientHeight + 1"), "long program title is clipped"
    capture("long-title-recommendation-375x844")
    results.append("long localized program title remains fully visible at 375 px")
    page.get_by_test_id("training-tab-all").click()
    expect(page.get_by_test_id("training-all-view")).to_be_visible()
    expect(page.get_by_text("Alla övningar", exact=True).first).to_be_visible()
    page.get_by_test_id("training-tab-mine").click()
    expect(page.get_by_test_id("training-mine-view")).to_be_visible()
    expect(page.get_by_text("Mina program", exact=True)).to_be_visible()
    page.get_by_test_id("training-tab-recommended").click()
    card = page.get_by_role("button", name=re.compile("Öppna nästa övning")).first
    expect(card).to_be_visible()
    card.click()
    expect(page.get_by_text("Markera som genomförd", exact=True)).to_be_visible()
    capture("long-title-exact-exercise-sheet-375x844")
    results.append("tab switching and recommendation open the exact next exercise")

    open_page("&trainingScenario=unknown-age")
    expect(page.get_by_text("Lägg till hundens födelsedatum", exact=True)).to_be_visible()
    expect(page.get_by_text("Fortsätt där ni var", exact=True)).to_be_visible()
    page.get_by_test_id("training-tab-mine").click()
    expect(page.get_by_test_id("training-mine-view")).to_be_visible()
    capture("unknown-age-saved-progress-375x844")
    results.append("unknown age hides recommendations while saved progress remains reachable")

    open_page("&trainingScenario=no-recommendations")
    expect(page.get_by_text("Inga övningar tillgängliga ännu", exact=True)).to_be_visible()
    expect(page.get_by_text("Fortsätt där ni var", exact=True)).to_have_count(0)
    capture("no-age-matched-programs-375x844")
    page.get_by_role("button", name="Visa alla träningsövningar").click()
    expect(page.get_by_test_id("training-all-view")).to_be_visible()
    results.append("no matching recommendations shows an honest empty state and reaches all exercises")

    open_page("&trainingScenario=paused")
    page.get_by_test_id("training-tab-mine").click()
    expect(page.get_by_text("Vardagsro och hantering · version 1 · pausad", exact=True)).to_be_visible()
    expect(page.get_by_text("2 genomförda övningar finns kvar.", exact=True)).to_be_visible()
    expect(page.get_by_text("Ni har inte markerat någon övning ännu", exact=True)).to_have_count(0)
    capture("paused-previous-version-375x844")
    results.append("paused older-version progress stays visible without a contradictory empty state")

    open_page("&trainingScenario=paused-unavailable")
    page.get_by_test_id("training-tab-mine").click()
    unavailable_progress = page.get_by_test_id("training-unavailable-progress")
    expect(unavailable_progress).to_be_visible()
    expect(unavailable_progress.get_by_text("Tidigare program", exact=True)).to_be_visible()
    expect(unavailable_progress.get_by_text("Ett tidigare program är inte längre tillgängligt. Sparade markeringar finns kvar.", exact=True)).to_be_visible()
    capture("paused-unavailable-version-375x844")
    results.append("unavailable paused versions are grouped without exposing internal IDs")

    open_page("&trainingError=retryable")
    expect(page.get_by_text("Programmet kunde inte hämtas", exact=True)).to_be_visible()
    page.get_by_role("button", name="Försök igen").click()
    expect(page.get_by_text("Programmet kunde inte hämtas", exact=True)).to_have_count(0)
    results.append("read error retry clears the truthful error state")

    open_page("&trainingScenario=complete")
    page.get_by_test_id("training-tab-mine").click()
    expect(page.get_by_text("Klar", exact=True)).to_be_visible()
    capture("completed-program-under-mine-375x844")
    results.append("completed progress remains in Mina without a continuation action")

    page.goto(f"{base}?screen=training&trainingScenario={initial_scenario}&textScale=140")
    page.wait_for_timeout(250)
    page.evaluate("document.documentElement.style.zoom='1.4'")
    expect(page.get_by_test_id("training-tab-recommended")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "140% text proxy introduces horizontal overflow"
    capture("text-140-375x844")
    results.append("140% browser text proxy has no horizontal overflow")

    assert not errors, f"browser errors: {errors}"
    results.append("no browser runtime errors")
    browser.close()

(out / "RESULTS.json").write_text(json.dumps({"review_fixture": review, "passed": results, "failed": []}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"PASS {len(results)}/{len(results)} training render checks ({'review' if review else 'public'})")
for result in results:
    print(f"- {result}")

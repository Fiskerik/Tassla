from pathlib import Path
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

out = Path(os.environ.get("TASSLA_UI_EVIDENCE", "docs/design/evidence/flow-training-01/public"))
out.mkdir(parents=True, exist_ok=True)
base = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4190/")
review = os.environ.get("TASSLA_UI_REVIEW", "false").lower() == "true"
second_journey_step = "Vila nära" if review else "En lugn paus"
home_journey_program = "Trygg start hemma" if review else "Trygg vardagsstart"
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
        page.wait_for_timeout(400)
        visible_copy = page.locator("body").inner_text()
        assert not re.search(r"detta är ett exempel|tillfälligt exempel|syntetisk(?:t|a)?\s+(?:text|övning|innehåll|visningsfixture)|layoutgranskning|testinstruktion", visible_copy, re.IGNORECASE), f"placeholder copy is visible in {name}"
        page.screenshot(path=str(out / f"{name}.png"), full_page=True)

    def visible_primary_button_count():
        return page.get_by_role("button").evaluate_all("nodes => nodes.filter(node => { const box = node.getBoundingClientRect(); return box.width > 0 && getComputedStyle(node).backgroundColor === 'rgb(24, 106, 77)'; }).length")

    initial_scenario = "half" if review else "default"
    open_page(f"&trainingScenario={initial_scenario}")
    if review:
        expect(page.get_by_text("Granskningsdata", exact=False)).to_have_count(0)
        expect(page.get_by_text("Vardagsro och hantering", exact=True)).to_be_visible()
    expect(page.get_by_role("tab", name="Rekommenderat")).to_have_attribute("aria-selected", "true")
    expect(page.get_by_text("Passar just nu", exact=False)).to_be_visible()
    if not review:
        expect(page.get_by_text("Fortsätt där ni var", exact=True)).to_be_visible()
    expect(page.get_by_text("Standardbild", exact=True)).to_have_count(0)
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
    recommendation_cards = page.get_by_role("button", name=re.compile("Öppna nästa övning"))
    card_sizes = recommendation_cards.evaluate_all("nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return {width: box.width, height: box.height}; })")
    assert len(card_sizes) == 2 and abs(card_sizes[0]["width"] - card_sizes[1]["width"]) <= 1 and abs(card_sizes[0]["height"] - card_sizes[1]["height"]) <= 1, "long recommendation content must not make sibling cards diverge in size"
    capture("long-title-recommendation-375x844")
    results.append("long localized program title remains visible and recommendation cards stay equal at 375 px")
    page.get_by_role("tab", name="Alla övningar").click()
    expect(page.get_by_test_id("training-all-view")).to_be_visible()
    expect(page.get_by_text("Alla övningar", exact=True).first).to_be_visible()
    page.get_by_role("tab", name="Mina").click()
    expect(page.get_by_test_id("training-mine-view")).to_be_visible()
    expect(page.get_by_text("Mina program", exact=True)).to_be_visible()
    page.get_by_role("tab", name="Rekommenderat").click()
    card = page.get_by_role("button", name=re.compile("Öppna nästa övning")).first
    expect(card).to_be_visible()
    card.click()
    expect(page.get_by_text("Logga utförd aktivitet", exact=True)).to_have_count(0)
    page.get_by_role("button", name="Aktivitetsmarkeringar i programmet").click()
    expect(page.get_by_text("Logga utförd aktivitet", exact=True)).to_be_visible()
    capture("long-title-exact-exercise-sheet-375x844")
    results.append("tab switching and recommendation open the exact next exercise")

    open_page("&trainingScenario=unknown-age")
    expect(page.get_by_text("Lägg till hundens födelsedatum", exact=True)).to_be_visible()
    expect(page.get_by_text("Fortsätt där ni var", exact=True)).to_be_visible()
    page.get_by_role("tab", name="Mina").click()
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
    page.get_by_role("tab", name="Mina").click()
    expect(page.get_by_text("Vardagsro och hantering · version 1 · pausad", exact=True)).to_be_visible()
    expect(page.get_by_text("2 genomförda övningar finns kvar.", exact=True)).to_be_visible()
    expect(page.get_by_text("Ni har inte markerat någon övning ännu", exact=True)).to_have_count(0)
    capture("paused-previous-version-375x844")
    results.append("paused older-version progress stays visible without a contradictory empty state")

    open_page("&trainingScenario=paused-unavailable")
    page.get_by_role("tab", name="Mina").click()
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
    page.get_by_role("tab", name="Mina").click()
    expect(page.get_by_text("Klar", exact=True)).to_be_visible()
    capture("completed-program-under-mine-375x844")
    completed_title = "Kontakt och namn" if review else "Kontakt i vardagen"
    page.get_by_role("button", name=re.compile(completed_title)).click()
    reset_action = page.get_by_role("button", name=f"Börja om med {completed_title}")
    expect(reset_action).to_be_visible()
    reset_action.click()
    expect(page.get_by_role("alert")).to_be_visible()
    expect(page.get_by_text("Markeringarna i det här programmet tas bort.", exact=False)).to_be_visible()
    capture("reset-confirmation-375x844")
    page.get_by_role("button", name="Avbryt").click()
    expect(page.get_by_role("alert")).to_have_count(0)
    expect(reset_action).to_be_visible()
    results.append("reset icon opens named confirmation; cancel leaves progress and action unchanged")
    reset_action.click()
    page.get_by_role("button", name="Börja om", exact=True).click()
    expect(page.get_by_role("progressbar", name="Aktivitetsmarkeringar: 0 av 2")).to_be_visible()
    expect(page.get_by_role("button", name=f"Börja om med {completed_title}")).to_have_count(0)
    capture("reset-confirmed-375x844")
    results.append("confirm resets only the selected fixture program and removes its reset action")

    open_page("&trainingScenario=unstarted&progression=empty")
    recommendation = page.get_by_role("button", name=re.compile("Öppna nästa övning")).first
    recommendation.click()
    start_from_recommendation = page.get_by_role("button", name=re.compile("Starta träningsresa för"))
    expect(start_from_recommendation).to_have_count(1)
    start_from_recommendation.click()
    expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last).to_be_visible()
    expect(page.get_by_text(re.compile("0 loggade pass · 0 delmål")).first).to_be_visible()
    capture("recommendation-start-opens-saved-active-step-375x844")
    results.append("recommendation opens its exact exercise, starts one journey, and waits for the confirmed active step")

    open_page("&trainingScenario=unstarted&progression=empty")
    page.get_by_role("tab", name="Alla övningar").click()
    first_program = page.get_by_test_id("training-all-view").get_by_role("button").first
    first_program.click()
    expect(page.get_by_text("Träningsresa", exact=True)).to_be_visible()
    assert visible_primary_button_count() <= 1, "program overview must keep at most one primary action"
    page.get_by_role("button", name=re.compile("Starta träningsresa för")).click()
    expect(page.get_by_role("button", name=re.compile("Starta träningsresa för"))).to_have_count(0)
    expect(page.get_by_text("Aktivt steg i träningsresan", exact=True).first).to_be_visible()
    expect(page.get_by_test_id("training-active-journey-step")).to_have_count(1)
    capture("journey-started-375x844")
    results.append("start creates one saved journey and preserves its exact active step")

    page.get_by_role("button", name=re.compile("Nästa övning: Utforska i egen takt")).click()
    expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last).to_be_visible()
    page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
    page.get_by_role("button", name="Vi fortsätter öva.").click()
    page.get_by_role("button", name="Spara återkopplingen för träningspasset").click()
    expect(page.get_by_text(re.compile("1 loggade pass")).first).to_be_visible()
    expect(page.get_by_role("button", name="Bekräfta delmålet för Utforska i egen takt")).to_be_visible()
    expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
    assert visible_primary_button_count() <= 1, "saved-session state must keep at most one primary action"
    capture("session-saved-no-automatic-milestone-375x844")
    page.get_by_role("button", name="Bekräfta delmålet för Utforska i egen takt").click()
    expect(page.get_by_text("Delmålet är bekräftat av dig.", exact=True).first).to_be_visible()
    expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_be_visible()
    page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    expect(page.get_by_text("Aktivt steg i träningsresan", exact=True).first).to_be_visible()
    expect(page.get_by_test_id("training-active-journey-step")).to_have_count(1)
    expect(page.get_by_text(second_journey_step, exact=True).first).to_be_visible()
    capture("explicit-next-saved-step-375x844")
    results.append("a saved session is separate from owner confirmation and explicit next step")

    page.get_by_role("button", name=re.compile(f"Nästa övning: {second_journey_step}")).click()
    page.get_by_role("button", name="Backa till föregående träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    expect(page.get_by_text("Utforska i egen takt", exact=True).first).to_be_visible()
    expect(page.get_by_test_id("training-active-journey-step")).to_have_count(1)
    results.append("back returns to the previous saved step without deleting its milestone")

    page.get_by_role("button", name=re.compile("Nästa övning: Utforska i egen takt")).click()
    page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    page.get_by_role("button", name=re.compile(f"Nästa övning: {second_journey_step}")).click()
    page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
    page.get_by_role("button", name="Vi kom dit vi tänkt oss.").click()
    page.get_by_role("button", name="Spara återkopplingen för träningspasset").click()
    page.get_by_role("button", name=f"Bekräfta delmålet för {second_journey_step}").click()
    page.set_viewport_size({"width": 375, "height": 667})
    if review:
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        capture("review-final-step-short-viewport-375x667")
        page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
        page.get_by_role("button", name="Vi tog en paus.").click()
        page.get_by_role("button", name="Spara återkopplingen för träningspasset").click()
        expect(page.get_by_text(re.compile("3 loggade pass")).first).to_be_visible()
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        capture("review-final-step-still-practicable-375x667")
        results.append("the review fixture final step remains available for practice without an invented next step")
    else:
        page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
        expect(page.get_by_text("Vila nära", exact=True).first).to_be_visible()
        capture("final-step-short-viewport-375x667")
        page.get_by_role("button", name="Stäng").last.click()
        page.get_by_role("button", name=re.compile("Nästa övning: Vila nära")).click()
        expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last).to_be_visible()
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
        page.get_by_role("button", name="Vi tog en paus.").click()
        page.get_by_role("button", name="Spara återkopplingen för träningspasset").click()
        expect(page.get_by_text(re.compile("3 loggade pass")).first).to_be_visible()
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        capture("final-step-still-practicable-375x667")
        results.append("the final step remains available for practice and has no invented next step")

    page.get_by_role("button", name="Stäng").last.click()
    page.get_by_role("button", name="Pausa träningsresan").click()
    expect(page.get_by_role("button", name=re.compile("Återuppta träningsresan för"))).to_be_visible()
    capture("journey-paused-375x667")
    page.get_by_role("button", name=re.compile("Återuppta träningsresan för")).click()
    page.get_by_role("button", name="Sätt träningsresan i underhåll").click()
    expect(page.get_by_text(re.compile("Underhåll")).first).to_be_visible()
    page.set_viewport_size({"width": 430, "height": 844})
    capture("journey-maintenance-430x844")
    results.append("pause, resume and maintenance are explicit saved journey states")

    open_page("&trainingScenario=unstarted&progression=empty&progressionWrite=unknown-once")
    page.get_by_role("tab", name="Alla övningar").click()
    page.get_by_test_id("training-all-view").get_by_role("button").first.click()
    page.get_by_role("button", name=re.compile("Starta träningsresa för")).click()
    expect(page.get_by_role("button", name="Kontrollera samma träningsändring igen")).to_be_visible()
    capture("journey-unknown-awaiting-same-operation-retry-375x844")
    page.get_by_role("button", name="Kontrollera samma träningsändring igen").click()
    expect(page.get_by_text("Aktivt steg i träningsresan", exact=True).first).to_be_visible()
    operations = page.evaluate("window.__tasslaTrainingProgressionOperations")
    assert len(operations) == 2 and operations[0]["operationId"] == operations[1]["operationId"], "unknown retry must reuse the same operation ID"
    assert operations[0]["action"] == operations[1]["action"], "unknown retry must preserve the exact action payload"
    results.append("unknown start is retried with the same operation ID and exact action")

    page.goto(f"{base}?screen=home&progression=confirmed")
    expect(page.get_by_text("1 loggade pass", exact=True)).to_be_visible()
    expect(page.get_by_text("1 delmål bekräftade av dig", exact=True)).to_be_visible()
    page.get_by_role("button", name=re.compile(f"Fortsätt träningsresan: {home_journey_program}")).click()
    expect(page.get_by_role("heading", name=home_journey_program)).to_be_visible()
    expect(page.get_by_text("Aktivt steg i träningsresan", exact=True).first).to_be_visible()
    capture("home-opens-exact-version-430x844")
    results.append("Home shows separate confirmed totals and opens the same saved program version")

    page.goto(f"{base}?screen=home&progression=unavailable")
    expect(page.get_by_text("1 loggade pass", exact=True)).to_be_visible()
    expect(page.get_by_text("Det sparade programmet eller steget är inte tillgängligt. Instruktioner visas inte.", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Fortsätt träningsresan")).to_have_count(0)
    expect(page.get_by_text("withdrawn-fixture-step", exact=True)).to_have_count(0)
    capture("home-unavailable-source-no-instructions-430x844")
    results.append("missing source retains confirmed counts but does not expose unavailable step text")

    page.goto(f"{base}?screen=home&progression=confirmed&progressionRead=error")
    expect(page.get_by_text("Träningsresan kunde inte hämtas. Inga framsteg visas som sparade.", exact=True)).to_be_visible()
    expect(page.get_by_text("1 loggade pass", exact=True)).to_have_count(0)
    page.get_by_role("button", name="Kontrollera träningsresan igen").click()
    expect(page.get_by_text("1 loggade pass", exact=True)).to_be_visible()
    results.append("Home read failure does not display cached journey numbers as confirmed")

    page.goto(f"{base}?screen=training&trainingScenario={initial_scenario}&textScale=140")
    page.wait_for_timeout(250)
    page.evaluate("document.documentElement.style.zoom='1.4'")
    expect(page.get_by_role("tab", name="Rekommenderat")).to_be_visible()
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

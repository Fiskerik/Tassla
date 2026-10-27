from pathlib import Path
import json
import os
import re
from datetime import datetime, timezone

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

    def open_session_feedback(write_mode):
        open_page(f"&trainingScenario=unstarted&progression=empty&progressionWrite={write_mode}")
        page.get_by_role("tab", name="Alla övningar").click()
        page.get_by_test_id("training-all-view").get_by_role("button").first.click()
        page.get_by_role("button", name=re.compile("Starta träningsresa för")).click()
        expect(page.get_by_text(re.compile("^Aktivt steg ·"))).to_have_count(1)
        page.get_by_role("button", name=re.compile("Öppna aktivt steg:")).click()
        page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
        expect(page.get_by_test_id("training-session-feedback")).to_be_visible()

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
    expect(page.get_by_role("button", name=f"Starta träningsresa för {completed_title}")).to_be_visible()
    expect(page.get_by_test_id("training-journey-timeline")).to_be_visible()
    expect(page.get_by_text(re.compile("Nästa övning · 1/2"))).to_be_visible()
    expect(page.get_by_role("button", name=f"Börja om med {completed_title}")).to_have_count(0)
    capture("reset-confirmed-375x844")
    results.append("confirm resets only the selected fixture program and returns it to an unstarted state")

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
    expect(page.get_by_test_id("training-journey-timeline")).to_be_visible()
    expect(page.get_by_text("Börja med en övning i taget", exact=True)).to_be_visible()
    assert visible_primary_button_count() <= 1, "program overview must keep at most one primary action"
    page.get_by_role("button", name=re.compile("Starta träningsresa för")).click()
    expect(page.get_by_role("button", name=re.compile("Starta träningsresa för"))).to_have_count(0)
    expect(page.get_by_text(re.compile("^Aktivt steg ·"))).to_have_count(1)
    capture("journey-started-375x844")
    results.append("start creates one saved journey and preserves its exact active step")

    page.get_by_role("button", name=re.compile("Öppna aktivt steg: Utforska i egen takt")).click()
    expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last).to_be_visible()
    page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
    expect(page.get_by_test_id("training-session-feedback")).to_be_visible()
    expect(page.get_by_role("radio", name="Gick som planerat")).to_be_visible()
    expect(page.get_by_text("Träningsresan är startad.", exact=True)).to_have_count(0)
    expect(page.get_by_text("Aktivitetsmarkeringar i programmet", exact=True)).to_have_count(0)
    capture("training-session-feedback-375x844")
    page.get_by_role("radio", name="Vi fortsätter öva").click()
    page.get_by_role("button", name="Spara träningspass").click()
    expect(page.get_by_text(re.compile("1 pass · 0 delmål")).first).to_be_visible()
    expect(page.get_by_test_id("training-milestone-ready")).to_have_count(0)
    expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
    page.get_by_role("button", name="Logga ett träningspass för Utforska i egen takt").click()
    page.get_by_role("radio", name="Gick som planerat").click()
    page.get_by_role("button", name="Spara träningspass").click()
    expect(page.get_by_test_id("training-milestone-ready")).to_be_visible()
    expect(page.get_by_role("button", name="Bekräfta delmålet för Utforska i egen takt")).to_be_visible()
    expect(page.get_by_text("Aktivitetsmarkeringar i programmet", exact=True)).to_have_count(0)
    assert visible_primary_button_count() <= 1, "saved-session state must keep at most one primary action"
    capture("positive-session-offers-explicit-milestone-375x844")
    page.get_by_role("button", name="Bekräfta delmålet för Utforska i egen takt").click()
    expect(page.get_by_text("Delmålet är bekräftat av dig.", exact=True).first).to_be_visible()
    expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_be_visible()
    page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    expect(page.get_by_text(re.compile("^Aktivt steg ·"))).to_have_count(1)
    expect(page.get_by_text(second_journey_step, exact=True).first).to_be_visible()
    capture("explicit-next-saved-step-375x844")
    results.append("a saved session is separate from owner confirmation and explicit next step")

    open_session_feedback("failed-session")
    page.get_by_role("radio", name="Gick som planerat").click()
    page.get_by_role("button", name="Spara träningspass").click()
    expect(page.get_by_test_id("training-session-feedback").get_by_text("Ändringen kunde inte sparas. Försök igen.", exact=True)).to_be_visible()
    expect(page.get_by_text(re.compile("0 pass · 0 delmål")).first).to_be_visible()
    expect(page.get_by_test_id("training-milestone-ready")).to_have_count(0)
    expect(page.get_by_role("button", name="Spara träningspass")).to_be_visible()
    capture("failed-session-stays-unconfirmed-375x844")
    results.append("failed pass write keeps the selected feedback retryable and confirms neither session nor milestone")

    open_session_feedback("unknown-session-once")
    page.get_by_role("radio", name="Gick som planerat").click()
    page.get_by_role("button", name="Spara träningspass").click()
    expect(page.get_by_test_id("center-modal-bottom-sheet").get_by_text("Vi kunde inte bekräfta om ändringen sparades. Kontrollera samma ändring igen.", exact=True)).to_be_visible()
    expect(page.get_by_test_id("center-modal-bottom-sheet").get_by_role("button", name="Kontrollera samma träningsändring igen")).to_be_visible()
    expect(page.get_by_test_id("training-milestone-ready")).to_have_count(0)
    uncertain_operations = page.evaluate("window.__tasslaTrainingProgressionOperations")
    assert len(uncertain_operations) == 2 and uncertain_operations[-1]["action"]["kind"] == "record_session", "unknown pass should have one pending operation"
    uncertain_operation_id = uncertain_operations[-1]["operationId"]
    capture("unknown-session-awaits-same-operation-375x844")
    page.get_by_test_id("center-modal-bottom-sheet").get_by_role("button", name="Kontrollera samma träningsändring igen").click()
    expect(page.get_by_text("Träningspasset är loggat.", exact=True)).to_be_visible()
    expect(page.get_by_text(re.compile("1 pass · 0 delmål")).first).to_be_visible()
    expect(page.get_by_test_id("training-milestone-ready")).to_be_visible()
    expect(page.get_by_text("Aktivitetsmarkeringar i programmet", exact=True)).to_have_count(0)
    resolved_operations = page.evaluate("window.__tasslaTrainingProgressionOperations")
    assert len(resolved_operations) == 3 and resolved_operations[-1]["operationId"] == uncertain_operation_id, "unknown pass retry must reuse its operation ID"
    capture("unknown-session-resolved-with-explicit-milestone-375x844")
    results.append("unknown pass write retries the same operation, records one session, and leaves milestone confirmation explicit")

    open_page("&trainingScenario=unstarted&progression=confirmed")
    page.get_by_role("tab", name="Alla övningar").click()
    page.get_by_test_id("training-all-view").get_by_role("button").first.click()
    page.get_by_role("button", name=re.compile("Öppna aktivt steg: Utforska i egen takt")).click()
    page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    expect(page.get_by_text(second_journey_step, exact=True).first).to_be_visible()

    page.get_by_role("button", name=re.compile(f"Öppna aktivt steg: {second_journey_step}")).click()
    page.get_by_role("button", name="Backa till föregående träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    expect(page.get_by_text("Utforska i egen takt", exact=True).first).to_be_visible()
    expect(page.get_by_text(re.compile("^Aktivt steg ·"))).to_have_count(1)
    expect(page.get_by_text(re.compile("^Delmål bekräftat ·"))).to_be_visible()
    capture("journey-back-to-confirmed-step-375x844")
    results.append("back returns to the previous saved step without deleting its milestone")

    page.get_by_role("button", name=re.compile("Öppna aktivt steg: Utforska i egen takt")).click()
    page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
    page.get_by_role("button", name="Stäng").last.click()
    page.get_by_role("button", name=re.compile(f"Öppna aktivt steg: {second_journey_step}")).click()
    page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
    page.get_by_role("radio", name="Gick som planerat").click()
    page.get_by_role("button", name="Spara träningspass").click()
    page.get_by_role("button", name=f"Bekräfta delmålet för {second_journey_step}").click()
    page.set_viewport_size({"width": 375, "height": 667})
    if review:
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        capture("review-final-step-short-viewport-375x667")
        page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
        page.get_by_role("radio", name="Vi avslutade tidigare").click()
        page.get_by_role("button", name="Spara träningspass").click()
        expect(page.get_by_text(re.compile("4 pass ·")).first).to_be_visible()
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        capture("review-final-step-still-practicable-375x667")
        results.append("the review fixture final step remains available for practice without an invented next step")
    else:
        page.get_by_role("button", name="Fortsätt till nästa träningssteg").click()
        expect(page.get_by_text("Vila nära", exact=True).first).to_be_visible()
        capture("final-step-short-viewport-375x667")
        page.get_by_role("button", name="Stäng").last.click()
        page.get_by_role("button", name=re.compile("Öppna aktivt steg: Vila nära")).click()
        expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last).to_be_visible()
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last.click()
        page.get_by_role("radio", name="Vi avslutade tidigare").click()
        page.get_by_role("button", name="Spara träningspass").click()
        expect(page.get_by_text(re.compile("3 pass ·")).first).to_be_visible()
        expect(page.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
        capture("final-step-still-practicable-375x667")
        results.append("the final step remains available for practice and has no invented next step")

    open_page("&trainingScenario=confirmed&progression=confirmed")
    page.get_by_role("tab", name="Alla övningar").click()
    progress_card = page.get_by_test_id("training-all-view").get_by_role("button").first
    expect(progress_card.get_by_role("progressbar", name="1 av 3 delmål bekräftade")).to_be_visible()
    expect(progress_card.get_by_text("1 pass loggat", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Pausa träningsresan")).to_have_count(0)
    expect(page.get_by_role("button", name="Sätt träningsresan i underhåll")).to_have_count(0)
    capture("program-card-confirmed-progress-1-of-3-375x844")
    results.append("program card shows 1/3 owner-confirmed milestones separately from one logged session")

    open_page("&progression=paused")
    page.get_by_role("tab", name="Alla övningar").click()
    page.get_by_test_id("training-all-view").get_by_role("button").first.click()
    expect(page.get_by_role("button", name="Fortsätt med nästa övning")).to_be_visible()
    expect(page.get_by_text("Återupptas vid: Utforska i egen takt.", exact=True).last).to_be_visible()
    expect(page.get_by_role("button", name=re.compile("Öppna pausad steg:")).first).to_have_text("Visa övning")
    expect(page.get_by_role("button", name="Pausa träningsresan")).to_have_count(0)
    expect(page.get_by_role("button", name="Sätt träningsresan i underhåll")).to_have_count(0)
    capture("paused-journey-only-offers-resume-375x667")
    page.get_by_role("button", name=re.compile("Öppna pausad steg:")).first.click()
    expect(page.get_by_text(re.compile("Pausad · 0 pass · 0 delmål"), exact=False).last).to_be_visible()
    expect(page.get_by_role("button", name=re.compile("Fortsätt med nästa övning")).last).to_be_visible()
    expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för")).last).to_have_count(0)
    page.get_by_role("button", name=re.compile("Fortsätt med nästa övning")).last.click()
    expect(page.get_by_text(re.compile("^Pågående · 0 pass · 0 delmål"), exact=False).last).to_be_visible()
    expect(page.get_by_text("Utforska i egen takt", exact=True).last).to_be_visible()
    expect(page.get_by_role("button", name=re.compile("Logga ett träningspass för Utforska i egen takt")).last).to_be_visible()
    results.append("active journeys have no pause or maintenance actions; a paused journey clearly resumes on the same exercise")

    open_page("&trainingScenario=unstarted&progression=empty&progressionWrite=unknown-once")
    page.get_by_role("tab", name="Alla övningar").click()
    page.get_by_test_id("training-all-view").get_by_role("button").first.click()
    page.get_by_role("button", name=re.compile("Starta träningsresa för")).click()
    expect(page.get_by_role("button", name="Kontrollera samma träningsändring igen")).to_be_visible()
    capture("journey-unknown-awaiting-same-operation-retry-375x844")
    page.get_by_role("button", name="Kontrollera samma träningsändring igen").click()
    expect(page.get_by_text(re.compile("^Aktivt steg ·"))).to_have_count(1)
    operations = page.evaluate("window.__tasslaTrainingProgressionOperations")
    assert len(operations) == 2 and operations[0]["operationId"] == operations[1]["operationId"], "unknown retry must reuse the same operation ID"
    assert operations[0]["action"] == operations[1]["action"], "unknown retry must preserve the exact action payload"
    results.append("unknown start is retried with the same operation ID and exact action")

    open_page("&trainingScenario=unstarted&progression=confirmed&progressionWrite=unknown-once")
    page.get_by_role("tab", name="Alla övningar").click()
    page.get_by_test_id("training-all-view").get_by_role("button").first.click()
    page.get_by_role("button", name="Öppna aktivt steg: Utforska i egen takt").click()
    page.get_by_role("button", name="Ångra bekräftelsen för Utforska i egen takt").click()
    undo_modal = page.get_by_test_id("center-modal-bottom-sheet")
    expect(undo_modal.get_by_role("button", name="Kontrollera samma träningsändring igen")).to_be_visible()
    expect(undo_modal.get_by_role("button", name="Fortsätt till nästa träningssteg")).to_have_count(0)
    undo_modal.get_by_role("button", name="Kontrollera samma träningsändring igen").click()
    expect(undo_modal.get_by_role("button", name="Bekräfta delmålet för Utforska i egen takt")).to_be_visible()
    operations = page.evaluate("window.__tasslaTrainingProgressionOperations")
    assert len(operations) == 2 and operations[0]["operationId"] == operations[1]["operationId"]
    assert operations[0]["action"] == operations[1]["action"] and operations[0]["action"]["kind"] == "undo_step"
    results.append("unknown undo retries the exact confirmation and operation without advancing")

    page.goto(f"{base}?screen=home&progression=confirmed")
    expect(page.get_by_text("1 loggat pass", exact=True)).to_be_visible()
    expect(page.get_by_text("1 delmål bekräftat av dig", exact=True)).to_be_visible()
    page.get_by_role("button", name=re.compile(f"Fortsätt träningsresan: {home_journey_program}")).click()
    expect(page.get_by_role("heading", name=home_journey_program)).to_be_visible()
    expect(page.get_by_text(re.compile("^Aktivt steg ·")).first).to_be_visible()
    capture("home-opens-exact-version-430x844")
    results.append("Home shows separate confirmed totals and opens the same saved program version")

    page.goto(f"{base}?screen=home&progression=unavailable")
    expect(page.get_by_text("1 loggat pass", exact=True)).to_be_visible()
    expect(page.get_by_text("Det sparade programmet eller steget är inte tillgängligt. Instruktioner visas inte.", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Fortsätt träningsresan")).to_have_count(0)
    expect(page.get_by_text("withdrawn-fixture-step", exact=True)).to_have_count(0)
    capture("home-unavailable-source-no-instructions-430x844")
    results.append("missing source retains confirmed counts but does not expose unavailable step text")

    page.goto(f"{base}?screen=home&progression=confirmed&progressionRead=error")
    expect(page.get_by_text("Träningsresan kunde inte hämtas. Inga framsteg visas som sparade.", exact=True)).to_be_visible()
    expect(page.get_by_text("1 loggat pass", exact=True)).to_have_count(0)
    page.get_by_role("button", name="Kontrollera träningsresan igen").click()
    expect(page.get_by_text("1 loggat pass", exact=True)).to_be_visible()
    results.append("Home read failure does not display cached journey numbers as confirmed")

    page.goto(f"{base}?screen=training&trainingScenario={initial_scenario}&textScale=140")
    page.wait_for_timeout(250)
    page.evaluate("document.documentElement.style.zoom='1.4'")
    expect(page.get_by_role("tab", name="Rekommenderat")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "140% text proxy introduces horizontal overflow"
    capture("text-140-375x844")
    results.append("140% browser text proxy has no horizontal overflow")

    # Timeline-specific checks extend the established progression suite so its
    # existing recommendation, persistence, retry and home regression coverage stays intact.
    timeline_out = Path("docs/design/evidence/training-timeline-01")
    timeline_out.mkdir(parents=True, exist_ok=True)
    page.clock.install(time=datetime(2026, 10, 26, 12, 0, tzinfo=timezone.utc))

    def open_timeline(width, height, large_text=False):
        page.set_viewport_size({"width": width, "height": height})
        page.goto(f"{base}?screen=training&trainingScenario=timeline&progression=timeline")
        page.wait_for_timeout(150)
        page.get_by_role("tab", name="Alla övningar").click()
        page.get_by_role("button", name="Trygg vardagsstart", exact=False).click()
        page.get_by_test_id("training-journey-timeline").wait_for()
        if large_text:
            page.evaluate("""() => {
              for (const node of document.querySelectorAll('*')) {
                if (![...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) continue;
                const style = getComputedStyle(node);
                const size = parseFloat(style.fontSize);
                const line = parseFloat(style.lineHeight);
                if (Number.isFinite(size)) node.style.fontSize = `${size * 1.4}px`;
                if (Number.isFinite(line)) node.style.lineHeight = `${line * 1.4}px`;
              }
            }""")
            page.wait_for_timeout(120)

    timeline_passes = []
    for width, height, large_text in [(375, 844, False), (430, 844, False), (375, 667, True)]:
        open_timeline(width, height, large_text)
        expect(page.get_by_test_id("training-journey-banner")).to_be_visible()
        expect(page.get_by_text("Delmål bekräftat · 15 augusti", exact=False)).to_be_visible()
        expect(page.get_by_text("Kommande · 3/3", exact=False)).to_be_visible()
        expect(page.get_by_text("Aktivitet markerad · 1 oktober", exact=False)).to_be_visible()
        expect(page.get_by_text("En lugn paus", exact=True)).to_have_count(1)
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1"), f"timeline overflow at {width}x{height}"
        for step_id in ["trygg-1", "trygg-2", "trygg-3"]:
            box = page.get_by_test_id(f"training-timeline-step-{step_id}").bounding_box()
            assert box and box["height"] >= 44, f"timeline hit target smaller than 44pt: {width}x{height}: {step_id}: {box}"
        suffix = "-large-text" if large_text else ""
        page.screenshot(path=str(timeline_out / f"timeline-overview-{width}x{height}{suffix}.png"))
        message = f"timeline statuses, one active title, date sources, dog banner, and 44pt hit targets at {width}x{height}{suffix}"
        timeline_passes.append(message)
        print(f"PASS {message}")
        if large_text:
            page.get_by_test_id("training-timeline-step-trygg-2").scroll_into_view_if_needed()
            action_box = page.get_by_test_id("training-timeline-step-trygg-2").bounding_box()
            nav_box = page.get_by_role("tablist", name="Huvudmeny").bounding_box()
            assert action_box and nav_box and action_box["y"] + action_box["height"] <= nav_box["y"] + 1, f"active step remains covered by bottom navigation: {action_box}, {nav_box}"
            page.screenshot(path=str(timeline_out / "timeline-overview-375x667-large-text-scrolled.png"))
            timeline_passes.append("active step remains reachable above bottom navigation after vertical scroll at 140% text")
            print("PASS active step remains reachable above bottom navigation after vertical scroll at 140% text")

        if width == 375 and height == 844:
            before = page.evaluate("(window.__tasslaTrainingProgressionOperations ?? []).length")
            page.get_by_test_id("training-timeline-step-trygg-3").click()
            expect(page.get_by_test_id("training-step-read-only")).to_be_visible()
            expect(page.get_by_text("Kommande steg · endast förhandsvisning", exact=True)).to_be_visible()
            page.wait_for_timeout(350)
            for label in ["Logga ett träningspass", "Bekräfta delmålet", "Logga utförd aktivitet", "Fortsätt till nästa", "Starta träningsresa"]:
                expect(page.get_by_role("button", name=re.compile(label))).to_have_count(0)
            after = page.evaluate("(window.__tasslaTrainingProgressionOperations ?? []).length")
            assert after == before, f"future preview invoked progression action: {before} -> {after}"
            page.screenshot(path=str(timeline_out / "timeline-future-read-only-375x844.png"))
            timeline_passes.append("future preview is read-only and produces zero progression operations")
            print("PASS future preview is read-only and produces zero progression operations")
            page.get_by_test_id("center-modal-bottom-sheet").get_by_role("button", name="Stäng", exact=True).click()

            page.get_by_role("button", name=re.compile("Öppna aktivt steg: En lugn paus")).click()
            expect(page.get_by_role("button", name="Logga ett träningspass till för det här steget")).to_be_visible()
            expect(page.get_by_role("button", name="Bekräfta delmålet för En lugn paus", exact=True)).to_be_visible()
            timeline_passes.append("active step alone exposes practice and milestone controls")
            print("PASS active step alone exposes practice and milestone controls")
            page.get_by_test_id("center-modal-bottom-sheet").get_by_role("button", name="Stäng", exact=True).click()

            page.get_by_test_id("training-timeline-step-trygg-1").click()
            expect(page.get_by_test_id("training-step-read-only")).to_be_visible()
            expect(page.get_by_text("Tidigare steg · endast läsning", exact=True)).to_be_visible()
            expect(page.get_by_role("button", name="Avmarkera", exact=True)).to_have_count(0)
            timeline_passes.append("confirmed historic step opens as read-only detail")
            print("PASS confirmed historic step opens as read-only detail")

    (timeline_out / "browser-results.json").write_text(json.dumps({
        "passes": timeline_passes,
        "scope": "Synthetic React Native Web review fixture. Native accessibility, native iOS/Android, live Supabase/RLS and TestFlight are not verified.",
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    assert not errors, f"browser errors: {errors}"
    results.append("no browser runtime errors")
    browser.close()

(out / "RESULTS.json").write_text(json.dumps({"review_fixture": review, "passed": results, "failed": []}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"PASS {len(results)}/{len(results)} training render checks ({'review' if review else 'public'})")
for result in results:
    print(f"- {result}")

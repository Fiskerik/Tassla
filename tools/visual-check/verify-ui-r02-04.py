from pathlib import Path
import json
import os
import re

from playwright.sync_api import expect, sync_playwright

review = os.environ.get("TASSLA_UI_REVIEW", "false").lower() == "true"
mode = "review" if review else "public"
out = Path(os.environ.get("TASSLA_UI_EVIDENCE", f"docs/design/evidence/vision-rev02/ui-r02-04-panelhelhet/{mode}"))
out.mkdir(parents=True, exist_ok=True)
base = os.environ.get("TASSLA_UI_BASE_URL", "http://127.0.0.1:4190/")
errors = []
passed = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get("TASSLA_UI_CHROMIUM", "/usr/bin/chromium"),
        args=["--no-sandbox", "--disable-crash-reporter", "--disable-breakpad"],
    )
    page = browser.new_page(viewport={"width": 375, "height": 844}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(str(error)))

    def open_screen(screen, width=375, height=844, scale=False):
        page.set_viewport_size({"width": width, "height": height})
        page.goto(f"{base}?screen={screen}")
        page.wait_for_timeout(250)
        if scale:
            page.evaluate("document.documentElement.style.zoom='1.4'")
        return page

    def capture(name):
        page.wait_for_timeout(400)
        visible_copy = page.locator("body").inner_text()
        assert not re.search(r"detta är ett exempel|tillfälligt exempel|syntetisk(?:t|a)?\s+(?:text|övning|innehåll|visningsfixture)|layoutgranskning|testinstruktion", visible_copy, re.IGNORECASE), f"placeholder copy is visible in {name}"
        page.screenshot(path=str(out / f"{name}.png"), full_page=True)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"horizontal overflow in {name}"

    for screen in ["knowledge", "training", "reminders", "insights"]:
        for width, height, suffix in [(375, 844, "375x844"), (430, 844, "430x844"), (375, 667, "375x667")]:
            open_screen(screen, width, height)
            capture(f"{screen}-{suffix}")
        open_screen(screen, 375, 844, scale=True)
        capture(f"{screen}-text-140")
        passed.append(f"{screen}: 375×844, 430×844, 375×667 and 140% CSS text proxy; no horizontal overflow")

    # Magnify leaf text directly: CSS zoom alone also enlarges the tab width.
    for width in [320, 375, 430]:
        for magnified in [False, True]:
            open_screen("knowledge", width)
            if magnified:
                page.evaluate("""() => document.querySelectorAll('[data-testid^=main-nav-label-]').forEach(el => {
                    const style = getComputedStyle(el);
                    el.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
                    el.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
                })""")
            for key, label in [('home', 'Hem'), ('log', 'Logg'), ('training', 'Träning'), ('knowledge', 'Kunskap'), ('more', 'Mer')]:
                tab = page.get_by_role('tab', name=label, exact=True)
                box = tab.bounding_box()
                assert box['width'] >= 44 and box['height'] >= 44, f'{label} touch target too small'
                metrics = page.get_by_test_id(f'main-nav-label-{key}').evaluate("""el => {
                    const style = getComputedStyle(el); const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d'); context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
                    return { needed: context.measureText(el.textContent).width, available: el.clientWidth,
                        height: el.getBoundingClientRect().height, line: parseFloat(style.lineHeight) };
                }""")
                assert metrics['needed'] <= metrics['available'] + 1, f'{label} would truncate at {width}/{magnified}: {metrics}'
                assert metrics['height'] <= metrics['line'] + 1, f'{label} wraps'
            expect(page.get_by_role('tab', name='Kunskap', exact=True)).to_have_attribute('aria-selected', 'true')
            capture(f'navigation-{width}-' + ('text-140' if magnified else 'normal'))
    passed.append('all five navigation names fit one line without truncation at 320/375/430 and direct 140% text; every target >=44')

    for long_titles in [False, True]:
        for magnified in [False, True]:
            open_screen('training' + ('&trainingTitles=long' if long_titles else ''))
            if magnified:
                page.evaluate("""() => document.querySelectorAll('[data-testid^=training-recommendation-]').forEach(el => {
                    const style = getComputedStyle(el);
                    el.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
                    el.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
                })""")
            page.wait_for_timeout(500)
            cards = page.get_by_role('button', name=re.compile('Öppna nästa övning'))
            boxes = cards.evaluate_all('nodes => nodes.map(el => ({width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height}))')
            assert len(boxes) == 2 and abs(boxes[0]['height'] - boxes[1]['height']) <= 1 and abs(boxes[0]['width'] - boxes[1]['width']) <= 1, f'unequal training cards: {boxes}'
            program = page.get_by_test_id('training-recommendation-program-title').first
            step = page.get_by_test_id('training-recommendation-step-title').first
            typography = lambda el: el.evaluate('el => ({size: parseFloat(getComputedStyle(el).fontSize), weight: parseFloat(getComputedStyle(el).fontWeight), height: el.clientHeight, scroll: el.scrollHeight})')
            p, t = typography(program), typography(step)
            assert p['size'] < t['size'] and p['weight'] < t['weight'], 'program label must be smaller and lighter than exercise title'
            assert p['scroll'] <= p['height'] + 1 and t['scroll'] <= t['height'] + 1, 'title clipping'
            capture('training-cards-' + ('long' if long_titles else 'short') + ('-text-140' if magnified else '-normal'))
    passed.append('short and long training titles retain equal card dimensions, full text and smaller/lighter program labels at normal/direct140% text')

    if review:
        open_screen("knowledge")
        image_sources = []
        for title in ["Trygg start hemma", "Kontakt och namn", "Vardagsro och hantering"]:
            card = page.get_by_role("button", name=f"Läs {title}")
            expect(card).to_be_visible()
            image_sources.append(card.locator("img").first.get_attribute("src"))
        assert all(image_sources) and len(set(image_sources)) == 3, "review guides must retain their three assigned images"
        passed.append("review guide cards retain three stable, distinct editorial images")

    open_screen("knowledge")
    page.get_by_role("button", name="Öppna Vanliga frågor").click()
    faq_tabs = page.get_by_role("tablist", name="Sammanhang för vanliga frågor")
    expect(faq_tabs).to_be_visible()
    expect(page.get_by_role("tab", name="Efter ålder")).to_have_attribute("aria-selected", "true")
    if review:
        expect(page.get_by_text("När passar en valpkurs?", exact=True)).to_be_visible()
        expect(page.get_by_text("Granskningsdata", exact=False)).to_have_count(0)
        page.get_by_role("tab", name="Första dagarna hemma").click()
        expect(page.get_by_text("Hur kan första natten bli lugnare?", exact=True)).to_be_visible()
    else:
        expect(page.get_by_text("Inga frågor publicerade ännu.", exact=True)).to_be_visible()
        page.get_by_role("tab", name="Första dagarna hemma").click()
        expect(page.get_by_text("Inga frågor publicerade ännu.", exact=True)).to_be_visible()
    expect(page.get_by_text("Tassla", exact=True)).to_have_count(0)
    expect(page.get_by_text(re.compile("Tillfälligt exempel|Syntetisk text för layoutgranskning"), exact=False)).to_have_count(0)
    capture("faq-contexts")
    page.get_by_role("button", name="Tillbaka till guider").click()
    expect(page.get_by_role("button", name="Öppna Vanliga frågor")).to_be_visible()
    expect(page.get_by_role("button", name="Öppna Checklistor")).to_be_visible()
    passed.append("FAQ shared context tabs retain public empty/review-gated content boundary and compact header")

    page.get_by_role("button", name="Öppna Checklistor").click()
    if review:
        expect(page.get_by_text("För er just nu", exact=True)).to_be_visible()
    else:
        expect(page.get_by_text("Inga checklistor publicerade ännu.", exact=True)).to_be_visible()
    page.get_by_role("button", name="Tillbaka till guider").click()
    expect(page.get_by_role("button", name="Öppna Checklistor")).to_be_visible()
    passed.append("Checklistor returns to the guide destination through its compact back action")

    open_screen("knowledge")
    guide_title = "Trygg start hemma" if review else "En lugn start tillsammans"
    page.get_by_role("button", name=f"Läs {guide_title}").click()
    expect(page.get_by_text(guide_title, exact=True)).to_be_visible()
    expect(page.get_by_text("Tassla", exact=True)).to_have_count(0)
    expect(page.get_by_text(re.compile("Tillfälligt exempel|Syntetisk text för layoutgranskning"), exact=False)).to_have_count(0)
    capture("guide-detail")
    page.get_by_role("button", name="Tillbaka till guider").click()
    expect(page.get_by_role("button", name="Öppna Vanliga frågor")).to_be_visible()
    passed.append("guide detail keeps its source content and compact back bar")

    open_screen("training")
    training_tabs = page.get_by_role("tablist", name="Träningsvyer")
    expect(training_tabs).to_be_visible()
    expect(page.get_by_role("tab", name="Rekommenderat")).to_have_attribute("aria-selected", "true")
    recommendation_cards = page.get_by_role("button", name=re.compile("Öppna nästa övning"))
    expect(recommendation_cards).to_have_count(2)
    card_sizes = recommendation_cards.evaluate_all("nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return {width: box.width, height: box.height}; })")
    assert abs(card_sizes[0]["width"] - card_sizes[1]["width"]) <= 1 and abs(card_sizes[0]["height"] - card_sizes[1]["height"]) <= 1, "recommendation cards must share dimensions"
    image_sizes = recommendation_cards.locator("img").evaluate_all("nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return {width: box.width, height: box.height}; })")
    assert len(image_sizes) == 2 and abs(image_sizes[0]["width"] - image_sizes[1]["width"]) <= 1 and abs(image_sizes[0]["height"] - image_sizes[1]["height"]) <= 1, "recommendation images must share dimensions"
    expect(page.get_by_text(re.compile("Syntetisk övning|layoutgranskning"), exact=False)).to_have_count(0)
    if review:
        expect(page.get_by_text("Granskningsdata", exact=False)).to_have_count(0)
    page.get_by_role("tab", name="Mina").click()
    program_name = "Kontakt och namn" if review else "Kontakt i vardagen"
    page.get_by_role("button", name=re.compile(program_name)).click()
    reset_action = page.get_by_role("button", name=re.compile("Börja om med"))
    expect(reset_action).to_be_visible()
    expect(reset_action).to_have_attribute("aria-label", f"Börja om med {program_name}")
    reset_action.click()
    expect(page.get_by_role("alert")).to_be_visible()
    expect(page.get_by_text("Markeringarna i det här programmet tas bort.", exact=False)).to_be_visible()
    capture("training-reset-confirmation")
    page.get_by_role("button", name="Avbryt").click()
    expect(page.get_by_role("alert")).to_have_count(0)
    expect(reset_action).to_be_visible()
    passed.append("reset cancel closes dialog without changing selected program progress")
    reset_action.click()
    page.get_by_role("button", name="Börja om", exact=True).click()
    expect(page.get_by_role("progressbar", name="0 av 2 övningar klara")).to_be_visible()
    expect(page.get_by_role("button", name=re.compile("Börja om med"))).to_have_count(0)
    capture("training-reset-confirmed")
    passed.append("reset confirmation applies to one selected public/review program")

    open_screen("training")
    page.get_by_role("tab", name="Mina").click()
    page.get_by_role("button", name=re.compile(program_name)).click()
    page.get_by_role("button", name=re.compile("Börja om med")).click()
    page.evaluate("id => window.__ui04RemoveTrainingProgram(id)", "review-v1:training:kontakt" if review else "fixture:contact")
    expect(page.get_by_role("alert")).to_have_count(0)
    assert page.evaluate("window.__ui04ResetCalls") == 0, "a stale reset target must not call the reset handler"
    capture("training-reset-stale")
    passed.append("program removal hides its stale confirmation without invoking reset")

    program_id = 'review-v1:training:kontakt' if review else 'fixture:contact'
    page.evaluate('id => window.__ui04RestoreTrainingProgram(id)', program_id)
    expect(page.get_by_role('alert')).to_have_count(0)
    assert page.evaluate('window.__ui04ResetCalls') == 0
    passed.append('restoring the identical removed program never revives its old reset confirmation')

    for invalidation in ['version', 'focus']:
        open_screen('training')
        page.get_by_role('tab', name='Mina').click()
        page.get_by_role('button', name=re.compile(program_name)).click()
        page.get_by_role('button', name=re.compile('Börja om med')).click()
        expect(page.get_by_role('alert')).to_be_visible()
        if invalidation == 'version':
            page.evaluate('id => window.__ui04ChangeTrainingProgram(id)', program_id)
        else:
            page.evaluate('window.__ui04FocusTrainingStep(true)')
        expect(page.get_by_role('alert')).to_have_count(0)
        if invalidation == 'version':
            page.evaluate('id => window.__ui04RestoreTrainingProgram(id)', program_id)
        else:
            page.evaluate('window.__ui04FocusTrainingStep(false)')
        expect(page.get_by_role('alert')).to_have_count(0)
        assert page.evaluate('window.__ui04ResetCalls') == 0
        capture('training-reset-invalidated-' + invalidation)
    passed.append('version change/restore and focused-step return both permanently close stale reset without callbacks')

    open_screen("reminders")
    master = page.get_by_role("checkbox", name="Tillåt Tasslas påminnelser på den här enheten")
    training = page.get_by_role("checkbox", name="Lägg till en frivillig träningspåminnelse")
    master_unchecked_color = master.evaluate("element => getComputedStyle(element.querySelector('div')).backgroundColor")
    master.click()
    master_checked_color = master.evaluate("element => getComputedStyle(element.querySelector('div')).backgroundColor")
    assert master_checked_color != master_unchecked_color, "checkbox visual state did not change"
    expect(page.get_by_role("button", name="Visa information om lokala påminnelser")).to_be_visible()
    expect(page.get_by_text(re.compile("Telefonens tillåtelse"), exact=False)).to_have_count(0)
    assert page.evaluate("window.__ui04Counts") == {"saves": 0, "permissions": 0}, "toggle must not save or request OS permission"
    page.get_by_role("button", name="Visa information om lokala påminnelser").click()
    expect(page.get_by_text("Om lokala påminnelser", exact=True)).to_be_visible()
    expect(page.get_by_text("Telefonens tillåtelse styr separat", exact=False)).to_be_visible()
    capture("reminders-information")
    page.get_by_role("button", name="Stäng information").click()
    page.get_by_role("button", name="Tillåt påminnelser på telefonen").click()
    expect(page.get_by_text("Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras.", exact=True)).to_be_visible()
    assert page.evaluate("window.__ui04Counts") == {"saves": 0, "permissions": 1}, "OS action must not save app choices"
    assert master.evaluate("element => getComputedStyle(element.querySelector('div')).backgroundColor") == master_checked_color
    page.get_by_role("button", name="Spara val", exact=True).click()
    expect(page.get_by_text("Valen är sparade för ditt konto på den här enheten.", exact=True)).to_be_visible()
    assert page.evaluate("window.__ui04Counts") == {"saves": 1, "permissions": 1}, "save action must not request OS permission"
    capture("reminders-saved")
    passed.append("reminder draft, app save and OS permission callbacks remain separate; information appears once")

    page.goto(f"{base}?screen=reminders&save=failed")
    page.wait_for_timeout(250)
    failed_training = page.get_by_role("checkbox", name="Lägg till en frivillig träningspåminnelse")
    failed_master = page.get_by_role("checkbox", name="Tillåt Tasslas påminnelser på den här enheten")
    failed_initial_color = failed_master.evaluate("element => getComputedStyle(element.querySelector('div')).backgroundColor")
    failed_training.click()
    failed_selected_color = failed_master.evaluate("element => getComputedStyle(element.querySelector('div')).backgroundColor")
    assert failed_selected_color != failed_initial_color, "training choice should enable the master draft locally"
    page.get_by_role("button", name="Spara val", exact=True).click()
    expect(page.get_by_text("Valen kunde inte sparas.", exact=True)).to_be_visible()
    assert failed_master.evaluate("element => getComputedStyle(element.querySelector('div')).backgroundColor") == failed_selected_color
    assert page.evaluate("window.__ui04Counts") == {"saves": 1, "permissions": 0}, "failed save must retain draft without requesting permission"
    capture("reminders-save-failed")
    passed.append("failed reminder save retains the current draft and does not invoke OS permission")

    open_screen("insights")
    period_tabs = page.get_by_role("tablist", name="Period för insikter")
    expect(period_tabs).to_be_visible()
    for label in ["Månad", "Sedan första loggen", "Vecka"]:
        page.get_by_role("tab", name=label).click()
        expect(page.get_by_role("tab", name=label)).to_have_attribute("aria-selected", "true")
    capture("insights-periods")
    passed.append("Insights shared period tabs expose selected state and preserve existing period choices")

    assert not errors, f"browser errors: {errors}"
    passed.append("no browser runtime errors")
    browser.close()

(out / "RESULTS.json").write_text(json.dumps({"review_fixture": review, "passed": passed, "failed": []}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"PASS {len(passed)}/{len(passed)} UI-R02-04 rendered and interaction checks ({mode})")
for result in passed:
    print(f"- {result}")

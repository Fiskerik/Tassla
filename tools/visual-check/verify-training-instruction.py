from pathlib import Path
import os

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4386/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/traction-training-reading-01'))
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
                                         args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'])
    for width, height in ((375, 844), (430, 844), (375, 667)):
        page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}?screen=training&trainingScenario=structured&progression=empty')
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_role('button', name='Trygg vardagsstart', exact=False).click()
        expect(page.get_by_text('Öva lugnt och belöna frivillig kontakt.', exact=True)).to_be_visible()
        page.get_by_role('button', name='Öppna nästa steg: Utforska i egen takt').click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        expect(modal).to_be_visible()
        expect(modal.get_by_role('heading', name='Du behöver', exact=True)).to_be_visible()
        expect(modal.get_by_role('heading', name='Så gör ni', exact=True)).to_be_visible()
        expect(modal.get_by_text('1. Välj en lugn plats.', exact=True)).to_be_visible()
        expect(modal.get_by_text('2. Belöna när hunden kommer.', exact=True)).to_be_visible()
        expect(modal.get_by_text('## Så gör ni', exact=True)).to_have_count(0)
        page.wait_for_timeout(350)
        box = modal.bounding_box()
        assert box and abs((box['x'] + box['width'] / 2) - width / 2) <= 1
        assert abs((box['y'] + box['height'] / 2) - height / 2) <= 1
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.screenshot(path=str(out / f'structured-training-{width}x{height}.png'))
        if height == 667:
            action = modal.get_by_role('button', name='Starta träningsresa för Trygg vardagsstart')
            action.scroll_into_view_if_needed()
            action_box = action.bounding_box()
            modal_box = modal.bounding_box()
            assert action_box and modal_box and action_box['y'] >= modal_box['y'] and action_box['y'] + action_box['height'] <= modal_box['y'] + modal_box['height'] + 1
            page.screenshot(path=str(out / 'structured-training-375x667-scrolled.png'))
        page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(f'{base}?screen=training&trainingScenario=timeline&progression=timeline')
    page.get_by_role('tab', name='Alla övningar').click()
    page.get_by_role('button', name='Trygg vardagsstart', exact=False).click()
    page.get_by_role('button', name='Öppna aktivt steg: En lugn paus').click()
    expect(page.get_by_test_id('center-modal-bottom-sheet').get_by_text('Erbjud en kort paus och belöna lugn kontakt. Avsluta medan det fortfarande känns tryggt.', exact=True)).to_be_visible()
    page.wait_for_timeout(350)
    page.screenshot(path=str(out / 'plain-training-375x844.png'))
    page.close()
    browser.close()

assert not errors, errors
print('PASS: plain and structured instructions, numbered steps, centered detail, 375/430/short viewport, scrollable action, no overflow or page errors')

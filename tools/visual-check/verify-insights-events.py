from pathlib import Path
import os
import re
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4391/')
out = Path('docs/design/evidence/traction-insights-events-01')
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, height, large_text in ((375, 844, False), (430, 844, False), (375, 667, True)):
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}?screen=log&logScenario=insights')
        expect(page.get_by_role('heading', name='Händelser i perioden')).to_be_visible()
        expect(page.get_by_text('Visar 1 av 1 hämtade händelser.')).to_be_visible()
        today = page.get_by_role('tablist', name='Period för insikter').get_by_role('tab', name='Idag', exact=True)
        today.click()
        expect(today).to_have_attribute('aria-selected', 'true')
        expect(page.get_by_text('dagen pågår', exact=False)).to_be_visible()
        if large_text:
            page.evaluate("""() => {document.querySelectorAll('*').forEach(el => {if (el.children.length) return; const s=getComputedStyle(el); const f=parseFloat(s.fontSize); const l=parseFloat(s.lineHeight); if(Number.isFinite(f)) el.style.fontSize=(f*1.4)+'px'; if(Number.isFinite(l)) el.style.lineHeight=(l*1.4)+'px';});}""")
        today.scroll_into_view_if_needed()
        page.screenshot(path=str(out / f'insights-periods-{width}x{height}.png'))
        history = page.get_by_role('tablist', name='Period för insikter').get_by_role('tab', name='Sedan första loggen')
        history.click()
        expect(history).to_have_attribute('aria-selected', 'true')
        today.click()
        expect(today).to_have_attribute('aria-selected', 'true')
        event = page.get_by_role('button', name=re.compile('Öppna Kiss,'))
        expect(event).to_have_count(1)
        event.scroll_into_view_if_needed()
        page.screenshot(path=str(out / f'insights-events-{width}x{height}.png'))
        event.click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        expect(modal).to_be_visible()
        expect(modal.get_by_text('Ändra händelse', exact=True)).to_be_visible()
        box = modal.bounding_box()
        assert box and abs(box['x'] + box['width'] / 2 - width / 2) <= 1
        assert abs(box['y'] + box['height'] / 2 - height / 2) <= 1
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.close()
    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.goto(f'{base}?screen=log&logScenario=insights&state=empty')
    expect(page.get_by_text('Inga hämtade händelser i perioden.')).to_be_visible()
    page.get_by_role('button', name='Öppna Logga').click()
    expect(page.get_by_role('heading', name='Händelser i perioden')).to_have_count(0)
    page.goto(f'{base}?screen=log&logScenario=insights-local-older')
    expect(page.get_by_text('Fler händelser kan finnas i perioden.')).to_be_visible()
    expect(page.get_by_role('button', name='Hämta fler händelser')).to_be_visible()
    page.goto(f'{base}?screen=log&logScenario=insights-many')
    for _ in range(5):
        page.get_by_role('button', name='Visa fler händelser').click()
    older = page.get_by_role('button', name=re.compile('Öppna Kiss,')).last
    older.click()
    expect(page.get_by_test_id('center-modal-bottom-sheet').get_by_text('Ändra händelse', exact=True)).to_be_visible()
    assert page.evaluate('window.__tasslaLogViewOptions.preserveEventId') == 'fixture-many-0'
    page.goto(f'{base}?screen=log&logScenario=insights-paged')
    expect(page.get_by_text('Fler händelser kan finnas i perioden.')).to_be_visible()
    expect(page.get_by_role('button', name='Visa fler händelser')).to_be_visible()
    page.get_by_role('button', name='Visa fler händelser').click()
    page.get_by_role('button', name='Hämta fler händelser').click()
    expect(page.get_by_text('Fler händelser kunde inte hämtas. Försök igen.')).to_be_visible()
    page.get_by_role('button', name='Försök hämta händelser igen').click()
    expect(page.get_by_text('Visar 11 av 11 hämtade händelser.')).to_be_visible()
    expect(page.get_by_role('button', name=re.compile('Öppna Mat,'))).to_be_visible()
    page.get_by_role('heading', name='Händelser i perioden').scroll_into_view_if_needed()
    page.screenshot(path=str(out / 'insights-pagination-375.png'))
    page.goto(f'{base}?screen=log&logScenario=insights&state=loading')
    expect(page.get_by_text('Händelserna visas när loggen är tillgänglig igen.')).to_be_visible()
    expect(page.get_by_role('button', name=re.compile('Öppna Kiss,'))).to_have_count(0)
    page.close()
    browser.close()
assert not errors, errors
print('PASS: loaded-period event opens its own centered editor at 375/430 px and short viewport with 140% text; synthetic data')

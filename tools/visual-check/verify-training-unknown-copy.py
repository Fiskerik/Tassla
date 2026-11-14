"""Synthetic RN Web check for the two unknown-status fallbacks."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4192').rstrip('/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/gap-training-unknown-copy-01'))
out.mkdir(parents=True, exist_ok=True)
message = 'Vi kunde inte se om ändringen sparades. Kontrollera den igen.'
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width, height, large in [(320, 667, False), (375, 844, False), (430, 844, False), (375, 667, True)]:
        for location in ('overview', 'exercise'):
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
            page.on('pageerror', lambda error: errors.append(str(error)))
            query = 'trainingScenario=preview-valid&progression=confirmed'
            page.goto(f'{base}/?screen=training&{query}&unknownCopyFixture=true')
            page.get_by_role('tab', name='Alla övningar').click()
            page.get_by_test_id('training-all-view').get_by_role('button').first.click()
            if location == 'exercise':
                page.get_by_role('button', name='Öppna aktivt steg: Utforska i egen takt').click()
                target = page.get_by_test_id('center-modal-bottom-sheet')
            else:
                target = page.get_by_test_id('training-journey-fixture-training:trygg-start')
            page.evaluate('window.__tasslaShowUnknownCopy()')
            if large:
                page.evaluate("""() => document.querySelectorAll('[dir=auto]').forEach(e => {const s=getComputedStyle(e);e.style.fontSize=parseFloat(s.fontSize)*1.4+'px';if(s.lineHeight!=='normal')e.style.lineHeight=parseFloat(s.lineHeight)*1.4+'px'})""")
            expect(target.get_by_text(message, exact=True)).to_be_visible()
            button = target.get_by_role('button', name='Kontrollera samma träningsändring igen')
            expect(button).to_be_visible()
            button.scroll_into_view_if_needed()
            box = button.bounding_box()
            assert box and box['width'] >= 44 and box['height'] >= 44
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.wait_for_timeout(500)
            page.screenshot(path=str(out / f'{location}-{width}x{height}{"-text140" if large else ""}.png'))
            page.close()
    browser.close()
assert not errors, errors
print('PASS: overview and exercise unknown fallback, retry, sizing and large-text proxy; synthetic RN Web')

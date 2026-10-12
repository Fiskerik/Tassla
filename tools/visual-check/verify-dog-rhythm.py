from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/design/DOG-RHYTHM-01/evidence'
BASE_URL = 'http://127.0.0.1:4173'
EVIDENCE.mkdir(parents=True, exist_ok=True)
page_errors = []
results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 360, 'height': 900}, device_scale_factor=1)
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    for state in ['loading', 'insufficient', 'personal', 'error', 'retrying']:
        for width in [360, 430]:
            page.set_viewport_size({'width': width, 'height': 900})
            page.goto(f'{BASE_URL}/?state={state}')
            page.wait_for_timeout(500)
            body = page.locator('body').inner_text()
            assert 'Dagens kiss och bajs' in body, (state, body[:500])
            if state == 'loading':
                card_button = page.get_by_role('button', name='Dagens kiss och bajs för Luna', exact=False)
                assert card_button.count() == 1
                bounds = card_button.bounding_box()
                assert bounds and bounds['width'] >= 44 and bounds['height'] >= 44, f'Potty summary target too small: {bounds}'
            if state == 'insufficient':
                assert 'Estimerad' in body and 'Rekommenderad' not in body, body
            if state == 'personal':
                assert 'Rekommenderad' in body, body
                disclosure = page.get_by_text('Ungefärligt tidsfönster utifrån dina loggar.', exact=True).first
                disclosure_lines = disclosure.evaluate("element => element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)")
                assert disclosure_lines <= 2.1, f'Personal disclosure wraps to {disclosure_lines:.1f} lines'
            if state == 'insufficient' and width == 360:
                for label in [
                    'Ny valp · första veckorna · Källa: Agria',
                    'Frisk, inaktiv vuxen · Källa: VCA',
                    'Valp efter måltid · Källa: AniCura',
                    'De flesta hundar · Källa: VCA',
                ]:
                    text = page.get_by_text(label, exact=True).first
                    lines = text.evaluate("element => element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)")
                    assert lines <= 2.1, f'Condition/source label wraps to {lines:.1f} lines: {label}'
                for copy in [
                    'Efter sömn, mat, lek – varannan timme när valpen är vaken.',
                    'Kan ofta hålla sig 3–4 tim; aktiva hundar kan behöva rastas oftare.',
                    'Kan ofta behöva bajsa cirka 10–20 min efter mat.',
                    'Bajsar 1–3 gånger om dagen, ofta efter mat.',
                ]:
                    text = page.get_by_text(copy, exact=True).first
                    lines = text.evaluate("element => element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)")
                    assert lines <= 2.1, f'Guidance wraps to {lines:.1f} lines: {copy}'
            if state == 'error':
                assert 'Vi kunde inte visa översikten just nu.' in body and 'Försök igen' in body, body
                retry_button = page.get_by_role('button', name='Försök igen', exact=True)
                bounds = retry_button.bounding_box()
                assert bounds and bounds['width'] >= 44 and bounds['height'] >= 44, f'Retry target too small: {bounds}'
            if state == 'retrying':
                assert 'Laddar översikten' in body and page.locator('button[disabled]').count() > 0, body
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (state, width)
            page.screenshot(path=str(EVIDENCE / f'{state}-{width}.png'), full_page=True)
            if state == 'error' and width == 360:
                page.get_by_role('button', name='Försök igen', exact=True).click()
                page.wait_for_timeout(100)
                retry_body = page.locator('body').inner_text()
                assert 'Dagens kiss och bajs' in retry_body and 'Laddar översikten' in retry_body
                assert page.locator('button[disabled]').count() > 0
                assert page.url.endswith('?state=error')
                page.screenshot(path=str(EVIDENCE / 'retry-click-loading-360.png'), full_page=True)
                results.append('Retry click stays on Home, disables overlapping retry and shows loading')
                page.wait_for_timeout(500)
                ready_body = page.locator('body').inner_text()
                assert 'Estimerad' in ready_body and 'Vi kunde inte visa översikten just nu.' not in ready_body, ready_body
            results.append(f'{state} at {width}px')

    page.set_viewport_size({'width': 360, 'height': 900})
    page.goto(f'{BASE_URL}/?state=personal')
    page.wait_for_timeout(300)
    page.evaluate("""() => [...document.querySelectorAll('*')].filter(el => [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())).forEach(el => { const style=getComputedStyle(el);el.style.fontSize=(parseFloat(style.fontSize)*1.4)+'px';el.style.lineHeight=(parseFloat(style.lineHeight)*1.4)+'px'; })""")
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path=str(EVIDENCE / 'personal-360-large-text.png'), full_page=True)
    assert not page_errors, page_errors
    browser.close()

print(f'PASS: {len(results)} rendered state/width cases and 140% text smoke; no horizontal overflow or browser errors')

"""Actual Expo Image web rendering; no image SDK substitution."""
import json
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:5433').rstrip('/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/image-delivery-01'))
out.mkdir(parents=True, exist_ok=True)
errors, results = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in [375, 430]:
        page = browser.new_page(viewport={'width': width, 'height': 844})
        page.on('pageerror', lambda error: errors.append(str(error)))
        pending = []
        page.route('**/delayed.jpg', lambda route: pending.append(route))
        page.goto(base + '/probe/')
        page.wait_for_function('Array.from(document.images).length >= 8 && Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)')
        page.screenshot(path=str(out / f'phases-{width}.png'), full_page=True)
        frame = page.get_by_test_id('source-switch')
        old_source = frame.locator('img').evaluate('(image)=>image.src')
        before = frame.bounding_box()
        page.get_by_role('button', name='Byt bild', exact=True).click()
        expect(page.get_by_text('Nästa motiv', exact=True)).to_be_visible()
        page.wait_for_timeout(150)
        assert pending, 'Delayed source requested through actual Expo Image'
        assert old_source not in frame.locator('img').evaluate_all('(images)=>images.map(i=>i.src)'), 'Old image must be removed while the new source waits'
        after = frame.bounding_box()
        assert before == after, (before, after)
        page.screenshot(path=str(out / f'source-wait-{width}.png'))
        pending.pop().fulfill(path='assets/images/puppy-training.jpg', content_type='image/jpeg')
        page.wait_for_function('document.querySelector("[data-testid=source-switch] img")?.naturalWidth>0')
        assert frame.locator('img').get_attribute('alt') == ''
        page.screenshot(path=str(out / f'source-ready-{width}.png'))
        for phase in ['first_days', '8_12_weeks', 'over_1_year']:
            page.get_by_test_id(f'phase-{phase}').scroll_into_view_if_needed()
            page.screenshot(path=str(out / f'phase-{phase}-{width}.png'))
        results.append(f'{width}: all phase images loaded; delayed source clears old image, frame unchanged, decorative alt empty')
        page.close()
    for screen in ['home', 'knowledge', 'training', 'development']:
        page = browser.new_page(viewport={'width': 375, 'height': 844})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/app/?screen=' + screen)
        page.wait_for_timeout(650)
        page.screenshot(path=str(out / f'{screen}-375.png'))
        results.append(screen + ': actual existing screen rendered with Expo Image')
        page.close()
    browser.close()
assert not errors, errors
(out / 'results.json').write_text(json.dumps({'results': results, 'page_errors': errors, 'limits': 'Actual Expo Image web, synthetic app data. Native cache and device performance not verified.'}, ensure_ascii=False, indent=2) + '\n')
print('\n'.join(results))

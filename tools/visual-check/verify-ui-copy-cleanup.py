"""User requested clean presentation; synthetic provenance is recorded here, not in UI."""
import json
import os
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

base = os.environ['TASSLA_UI_BASE_URL']
out = Path(os.environ['TASSLA_UI_EVIDENCE'])
out.mkdir(parents=True, exist_ok=True)
review = os.environ.get('TASSLA_UI_REVIEW') == 'true'
kind = os.environ.get('TASSLA_UI_HARNESS', 'main')
screens = {
    'main': ['home', 'checklist', 'log', 'training', 'knowledge', 'health', 'planned', 'passport',
             'profile-edit', 'reminders', 'account', 'sign-in', 'profile-create', 'auth-callback'],
    'panels': ['home', 'development', 'progress', 'profile', 'insights'],
    'ui04': ['knowledge', 'training', 'reminders', 'insights'],
}[kind]
markers = re.compile(r'Granskningsdata|Granskningsinnehåll|Standardbild|testläg|förhandsvisning|syntetisk|Visuell grund', re.I)
passed, errors = [], []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'])
    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.on('pageerror', lambda error: errors.append(str(error)))

    def capture(name):
        page.wait_for_timeout(250)
        text = page.locator('body').inner_text()
        assert not markers.search(text), f'temporary marker in {name}: {text}'
        expect(page.get_by_role('button', name='Visa information om checklistorna')).to_have_count(0)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), name
        assert page.locator('body').inner_text().strip(), f'empty screen: {name}'
        page.screenshot(path=str(out / f'{name}.png'), full_page=True)

    for screen in screens:
        for width, height in [(375, 844), (430, 844), (375, 667)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.goto(f'{base}?screen={screen}')
            page.wait_for_timeout(300)
            capture(f'{screen}-{width}x{height}')
        page.evaluate("""() => document.querySelectorAll('[dir="auto"]').forEach(el => {
            const s = getComputedStyle(el); if (s.fontFamily.includes('Ionicons')) return;
            el.style.fontSize = `${parseFloat(s.fontSize) * 1.4}px`;
            el.style.lineHeight = `${parseFloat(s.lineHeight) * 1.4}px`;
        })""")
        capture(f'{screen}-375x667-text140')
        passed.append(f'{screen}: no temporary labels or page overflow at375/430, short667 and direct140% text')

    if kind == 'ui04':
        page.set_viewport_size({'width': 375, 'height': 667})
        page.goto(f'{base}?screen=knowledge')
        page.get_by_role('button', name='Öppna Vanliga frågor').click()
        if review:
            question = page.get_by_role('button', name='När passar en valpkurs?, visa svar', exact=True)
            expect(question).to_be_visible()
            question.click()
            expect(page.get_by_role('button', name='När passar en valpkurs?, fäll ihop', exact=True)).to_be_visible()
        else:
            expect(page.get_by_text('Inga frågor publicerade ännu.', exact=True)).to_be_visible()
        capture('faq-content-retained')
        page.get_by_role('button', name='Tillbaka till guider').click()
        page.get_by_role('button', name='Öppna Checklistor').click()
        if review:
            page.get_by_role('button', name=re.compile('8–12 veckor')).click()
            expect(page.get_by_text('Att göra', exact=True)).to_be_visible()
            expect(page.get_by_role('button', name=re.compile('Lägg till egen punkt'))).to_be_visible()
        else:
            expect(page.get_by_text('Inga checklistor publicerade ännu.', exact=True)).to_be_visible()
        capture('checklist-content-without-review-card')
        passed.append('FAQ answers and checklist content remain; public empty/review content boundary unchanged')

    assert not errors, errors
    browser.close()

(out / 'RESULTS.json').write_text(json.dumps({
    'environment': 'synthetic RN Web fixture; no live/native certification',
    'review_fixture': review, 'harness': kind, 'passed': passed, 'failed': [], 'page_errors': errors,
    'generic_images': 'Existing decorative generated dog assets; not owner dog photos',
}, ensure_ascii=False, indent=2) + '\n')
print(f'PASS {len(passed)}/{len(passed)} clean presentation checks ({kind}, review={review})')

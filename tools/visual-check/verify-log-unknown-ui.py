"""Verify that the removed manual uncertain-insert controls are absent in RN Web."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4179').rstrip('/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/gap-log-unknown-replay-01'))
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 375, 'height': 844}, timezone_id='UTC')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.clock.install(time='2026-11-11T15:00:00Z')
    page.goto(f'{base}/?screen=log&mutation=unsure')
    expect(page.get_by_role('heading', name='Logga')).to_be_visible()
    for label in ['Kontrollera status', 'Kontrollera logghändelsens status', 'Avsluta kontroll', 'Avsluta kontrollen?']:
        expect(page.get_by_text(label, exact=True)).to_have_count(0)
    expect(page.get_by_text('Vi kunde inte se om händelsen sparades. Kontrollera status eller avsluta kontrollen.', exact=True)).to_have_count(0)
    expect(page.get_by_text('Sparstatus behöver kontrolleras', exact=True)).to_have_count(0)
    page.screenshot(path=str(out / 'automatic-readback.png'))
    page.wait_for_timeout(550)
    quick_log = page.get_by_role('button', name='Logga mat', exact=True)
    expect(quick_log).to_be_enabled()
    page.screenshot(path=str(out / 'log-available.png'))
    quick_log.click()
    expect(page.get_by_text('Mat loggat', exact=True)).to_be_visible()
    assert page.evaluate('window.__tasslaLogWrites ?? 0') == 1
    expect(page.get_by_text('Kontrollera status', exact=True)).to_have_count(0)
    browser.close()

assert not errors, errors
print('PASS: uncertain insert has no user-facing status controls; regular logging remains available')

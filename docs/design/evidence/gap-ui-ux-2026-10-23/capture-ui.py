"""Capture synthetic UI evidence for the rev02 audit; does not test a live backend."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

OUTPUT = Path(__file__).parent
BASE = 'http://127.0.0.1:4267'
records = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 375, 'height': 844}, device_scale_factor=1)
    page.set_default_timeout(5000)
    page.clock.set_fixed_time(datetime(2026, 10, 23, 18, tzinfo=timezone.utc))
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))

    def visit(path, height=844, width=375):
        page.set_viewport_size({'width': width, 'height': height})
        page.goto(BASE + path)
        page.wait_for_timeout(450)

    def capture(name, note=''):
        page.wait_for_timeout(500)
        page.screenshot(path=str(OUTPUT / (name + '.png')))
        buttons = page.get_by_role('button').evaluate_all('''(elements) => elements.map(element => {
            const r = element.getBoundingClientRect();
            return {label: element.getAttribute('aria-label'), text: element.innerText,
                x: r.x, y: r.y, width: r.width, height: r.height,
                inViewport: r.bottom > 0 && r.top < innerHeight};
        })''')
        records.append({'image': name + '.png', 'url': page.url, 'viewport': page.viewport_size,
            'note': note, 'buttons': buttons, 'pageErrors': list(errors)})

    visit('/app/?screen=profile-edit')
    capture('synthetic-main-profile-24-breeds-375', '24 synthetic options demonstrate the inline-list geometry; this is not the live breed catalogue.')
    page.get_by_role('textbox').nth(1).scroll_into_view_if_needed()
    capture('synthetic-main-profile-below-breeds-375')

    def open_checklist(height=844):
        visit('/knowledge/?state=ready', height)
        page.get_by_role('button', name='Öppna Checklistor', exact=True).click()
        page.get_by_role('button', name='Öppna Första dagarna hemma, föreslagen fas', exact=True).click()
        page.wait_for_timeout(250)

    open_checklist()
    page.get_by_role('button', name='Lägg till egen punkt', exact=True).click()
    capture('synthetic-main-checklist-add-375')
    for height in [844, 667]:
        open_checklist(height)
        page.get_by_role('button', name='Ändra Boka valpkurs', exact=True).click()
        capture('synthetic-main-checklist-edit-375-' + str(height))

    open_checklist()
    page.set_viewport_size({'width': 430, 'height': 844})
    page.get_by_role('button', name='Ändra Boka valpkurs', exact=True).click()
    capture('synthetic-main-checklist-edit-430')

    visit('/app/?screen=log')
    log_row = page.get_by_role('button').filter(has_text='Mat').last
    log_row.click()
    page.wait_for_timeout(200)
    capture('synthetic-main-log-edit-375')

    visit('/app/?screen=health')
    page.get_by_role('button').filter(has_text='Vaccination valp 1').click()
    page.wait_for_timeout(200)
    capture('synthetic-main-health-edit-375')

    visit('/app/?screen=reminders&state=training')
    capture('synthetic-main-reminders-375')
    visit('/app/?screen=knowledge')
    capture('synthetic-main-knowledge-unassigned-375', 'Legacy synthetic IDs intentionally exercise the text-only image fallback. This image does not prove that published guides lack photos.')
    visit('/app/?screen=knowledge&knowledgeImages=assigned')
    capture('synthetic-main-knowledge-assigned-375', 'Three synthetic guides use existing content-ID/version photo assignments; this is a composition example, not a published-content read.')
    visit('/app/?screen=knowledge&knowledgeImages=assigned', width=430)
    capture('synthetic-main-knowledge-assigned-430')
    visit('/app/?screen=training')
    capture('synthetic-main-training-375')
    visit('/app/?screen=passport')
    capture('synthetic-main-passport-375')
    browser.close()

report = {'baseline': 'eea0984aba44ef17707e7d583b3f9bf6b165c7ee',
    'method': 'React Native Web using the real screen components, synthetic fixtures and native API shims. No live Supabase, RLS or native iOS verification.',
    'captures': records}
(OUTPUT / 'capture-metrics.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({'captures': len(records), 'pageErrors': errors}, ensure_ascii=False))

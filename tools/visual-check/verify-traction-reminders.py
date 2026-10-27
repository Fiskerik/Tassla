from pathlib import Path
import os
from playwright.sync_api import expect, sync_playwright

base = os.getenv('TASSLA_UI_BASE_URL', 'http://127.0.0.1:49152/')
out = Path('docs/design/evidence/traction-reminders-01')
out.mkdir(parents=True, exist_ok=True)
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, height, large in [(320, 667, True), (375, 844, False), (430, 844, False)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '?screen=reminders')
        if large:
            page.evaluate("""() => {document.querySelectorAll('*').forEach(el => {if (el.children.length) return; const s=getComputedStyle(el); const f=parseFloat(s.fontSize); const l=parseFloat(s.lineHeight); if(Number.isFinite(f)) el.style.fontSize=(f*1.4)+'px'; if(Number.isFinite(l)) el.style.lineHeight=(l*1.4)+'px';});}""")
        routine = page.get_by_role('checkbox', name='Påminn om checklistan')
        phase = page.get_by_role('checkbox', name='Påminn vid ny åldersfas')
        training = page.get_by_role('checkbox', name='Påminn om träning')
        expect(routine).not_to_be_checked()
        expect(phase).not_to_be_checked()
        routine.click()
        phase.click()
        training.click()
        expect(routine).to_be_checked()
        expect(phase).to_be_checked()
        expect(page.get_by_text('Rutinpåminnelse, lokal tid')).to_be_visible()
        for label in ('Träningspåminnelse, lokal tid', 'Rutinpåminnelse, lokal tid'):
            picker = page.get_by_role('button', name=f'Öppna tidsväljare för {label}')
            picker.scroll_into_view_if_needed()
            box = picker.bounding_box()
            assert box and box['x'] >= 0 and box['x'] + box['width'] <= width, (width, label, box)
            row = picker.locator('..').bounding_box()
            assert row and box['x'] + box['width'] <= row['x'] + row['width'] + 1, (label, box, row)
            picker.click()
            modal = page.get_by_test_id('center-modal-time-picker').filter(has=page.get_by_role('heading', name=label))
            expect(modal).to_be_visible()
            modal.get_by_role('button', name='Avbryt tid').click()
            expect(modal).to_have_count(0)
            page.wait_for_timeout(400)
        save = page.get_by_role('button', name='Spara val')
        save.scroll_into_view_if_needed()
        page.screenshot(path=str(out / f'reminders-selected-{width}.png'))
        save.click()
        value = page.evaluate('window.__tasslaReminderSavedPreferences')
        assert value['enabled'] and value['routineEnabled'] and value['phaseEnabled']
        assert value['routineMinutes'] == 540 and value['trainingEnabled']
        field = page.get_by_label('Rutinpåminnelse, lokal tid, timmar och minuter')
        field.fill('99:99')
        routine.click()
        save.click()
        value = page.evaluate('window.__tasslaReminderSavedPreferences')
        assert not value['routineEnabled'] and value['routineMinutes'] == 540
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.close()
    browser.close()
assert not errors, errors
print('PASS: opt-in reminders and saved settings at 320/375/430, including 140% text proxy; synthetic RN Web')

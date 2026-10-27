from datetime import datetime, timezone
from pathlib import Path
import json
import os
import re
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(os.environ.get('TASSLA_UI_EVIDENCE', str(ROOT / 'docs/design/evidence/vision-rev02/ui-r02-02-checklists/knowledge')))
BASE = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4173/know02/')
CHROMIUM = os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium')
OUT.mkdir(parents=True, exist_ok=True)
RESULTS = []


def passed(label):
    RESULTS.append(label)
    print('PASS', label)


def no_horizontal_overflow(page):
    return page.evaluate("""() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('*')].every(el => {
      const style = getComputedStyle(el);
      return style.display === 'none' || el.scrollWidth <= el.clientWidth + 1 || ['auto', 'scroll'].includes(style.overflowX);
    })""")


def open_detail(page):
    page.goto(f'{BASE}?screen=checklist-overview')
    expect(page.get_by_text(re.compile(r'\d+ av \d+ genomförda')).first).to_be_visible(timeout=5000)
    page.get_by_role('button', name='Öppna Första dagarna hemma, föreslagen fas').click()
    expect(page.get_by_role('button', name='Lägg till egen punkt', exact=True)).to_be_visible(timeout=5000)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=CHROMIUM, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width, height in [(375, 844), (430, 844), (375, 667)]:
        page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
        page.clock.install(time=datetime(2026, 10, 11, 15, 0, tzinfo=timezone.utc))
        page.on('pageerror', lambda error: RESULTS.append(f'PAGE ERROR {error}'))
        open_detail(page)
        expect(page.get_by_role('checkbox', name='Boka valpkurs')).to_be_visible()
        page.get_by_role('button', name='Lägg till egen punkt', exact=True).scroll_into_view_if_needed()
        page.get_by_role('button', name='Lägg till egen punkt', exact=True).click()
        title = page.get_by_role('textbox', name='Punkt', exact=True)
        title.fill('Första veterinärbesöket')
        trigger = page.get_by_role('button', name='Välj ikon för Första veterinärbesöket. Aktuell ikon: Allmän lista', exact=True)
        trigger.click()
        choices = page.get_by_role('radiogroup', name='Välj ikon för Första veterinärbesöket', exact=True)
        expect(choices.get_by_role('radio')).to_have_count(20)
        if width == 375 and height == 667:
            page.evaluate("""() => {
              for (const node of document.querySelectorAll('*')) {
                if (![...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) continue;
                const style = getComputedStyle(node); const size = parseFloat(style.fontSize); const line = parseFloat(style.lineHeight);
                if (Number.isFinite(size)) node.style.fontSize = `${size * 1.4}px`;
                if (Number.isFinite(line)) node.style.lineHeight = `${line * 1.4}px`;
              }
            }""")
        for index in range(20):
            bounds = choices.get_by_role('radio').nth(index).bounding_box()
            assert bounds and round(bounds['width']) >= 44 and round(bounds['height']) >= 44, f'icon target smaller than 44pt at {width}x{height}: {bounds}'
        assert no_horizontal_overflow(page), f'icon choices overflow at {width}x{height}'
        save = page.get_by_role('button', name='Spara egen punkt', exact=True)
        save_bounds = save.bounding_box()
        assert save_bounds and save_bounds['y'] + save_bounds['height'] <= height + 1, f'Save footer is not reachable at {width}x{height}: {save_bounds}'
        evidence_name = 'custom-icon-picker-375x667-large-text.png' if width == 375 and height == 667 else f'custom-icon-picker-{width}x{height}.png'
        page.screenshot(path=str(OUT / evidence_name))
        text_note = ' with 140% text' if width == 375 and height == 667 else ''
        passed(f'Knowledge icon picker has 20 named 44pt choices, no horizontal overflow, and reachable Save at {width}x{height}{text_note}')

        if width == 375 and height == 844:
            choices.get_by_role('radio', name='Vatten', exact=True).click()
            save.click()
            row = page.get_by_role('checkbox', name='Första veterinärbesöket', exact=True)
            expect(row).to_be_visible(timeout=3000)
            write = page.evaluate("(window.__know02Mutations ?? []).filter(m => m.table === 'dog_checklist_custom_items' && m.mode === 'insert').at(-1)")
            assert write and write['payload'].get('icon') == 'water-outline', f'insert did not save the chosen icon: {write}'
            passed('Chosen icon is written with the new custom point')

            page.get_by_role('button', name='Ändra Första veterinärbesöket', exact=True).click()
            saved_trigger = page.get_by_role('button', name='Välj ikon för Första veterinärbesöket. Aktuell ikon: Vatten', exact=True)
            expect(saved_trigger).to_be_visible()
            saved_trigger.click()
            selected = page.get_by_role('radiogroup', name='Välj ikon för Första veterinärbesöket').get_by_role('radio', name='Vatten', exact=True)
            expect(selected).to_have_attribute('aria-checked', 'true')
            selected.click()
            passed('Chosen icon survives exact readback and editor reopen')

            title = page.get_by_role('textbox', name='Punkt', exact=True)
            title.fill('Osparad ändring')
            page.get_by_role('button', name='Stäng', exact=True).last.click()
            discard = page.get_by_role('alert', name='Lämna utan att spara?', exact=True)
            expect(discard).to_be_visible()
            expect(discard.get_by_text('Dina ändringar på ”Osparad ändring” sparas inte.')).to_be_visible()
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / 'custom-dirty-confirm-375x844.png'))
            page.get_by_role('button', name='Fortsätt redigera', exact=True).click()
            expect(page.get_by_role('textbox', name='Punkt')).to_have_value('Osparad ändring')
            page.get_by_role('button', name='Stäng', exact=True).last.click()
            page.get_by_role('button', name='Lämna utan att spara', exact=True).click()
            expect(page.get_by_role('checkbox', name='Första veterinärbesöket')).to_be_visible()
            passed('Dirty close confirms discard and retains the form when the owner continues editing')

            page.get_by_role('button', name='Ändra Första veterinärbesöket', exact=True).click()
            page.get_by_role('button', name='Radera Första veterinärbesöket', exact=True).click()
            delete_dialog = page.get_by_role('alert', name='Radera punkten?', exact=True)
            expect(delete_dialog).to_be_visible()
            expect(delete_dialog.get_by_text('”Första veterinärbesöket” tas bort från checklistan.')).to_be_visible()
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / 'custom-delete-confirm-375x844.png'))
            page.get_by_role('button', name='Avbryt', exact=True).click()
            expect(page.get_by_role('checkbox', name='Första veterinärbesöket')).to_be_visible()
            page.get_by_role('button', name='Radera Första veterinärbesöket', exact=True).click()
            page.get_by_role('button', name='Radera', exact=True).click()
            expect(page.get_by_role('checkbox', name='Första veterinärbesöket', exact=True)).to_have_count(0)
            passed('Delete confirmation names the point, Cancel preserves it, Confirm removes it')
        page.close()
    browser.close()

if any(item.startswith('PAGE ERROR') for item in RESULTS):
    raise AssertionError('; '.join(item for item in RESULTS if item.startswith('PAGE ERROR')))
(OUT / 'browser-results.json').write_text(json.dumps({
    'passes': RESULTS,
    'scope': 'Synthetic React Native Web review fixture. Does not verify native VoiceOver/Dynamic Type, live Supabase/RLS, migration application, or TestFlight.',
}, ensure_ascii=False, indent=2) + '\n')

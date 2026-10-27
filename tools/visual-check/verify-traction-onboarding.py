from pathlib import Path
import os
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4391/')
out = Path('docs/design/evidence/traction-onboarding-01')
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    for width, height in ((375, 844), (430, 844), (375, 667)):
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}?screen=profile-create')
        optional = page.get_by_role('button', name='Fler uppgifter, valfritt')
        expect(optional).to_have_attribute('aria-expanded', 'false')
        expect(page.get_by_role('button', name='Spara och gå till Hem')).to_be_disabled()
        page.screenshot(path=str(out / f'profile-{width}x{height}.png'))
        page.get_by_role('textbox', name='Hundens namn').fill('Nala')
        page.get_by_role('button', name='Ras: Välj ras').click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        expect(modal).to_be_visible()
        box = modal.bounding_box()
        assert box and abs(box['x'] + box['width'] / 2 - width / 2) <= 1
        assert abs(box['y'] + box['height'] / 2 - height / 2) <= 1
        page.get_by_role('radio', name='Golden retriever').click()
        page.get_by_label('Födelsedatum, år-månad-dag').fill('2026-01-01')
        expect(page.get_by_role('button', name='Spara och gå till Hem')).to_be_enabled()
        optional.click()
        date = page.get_by_label('Förväntad hemkomst (valfritt), år-månad-dag')
        date.fill('2026-12-15')
        page.get_by_role('radio', name='Tik', exact=True).click()
        optional.click()
        expect(optional).to_have_attribute('aria-expanded', 'false')
        optional.click()
        expect(date).to_have_value('2026-12-15')
        expect(page.get_by_role('radio', name='Tik', exact=True)).to_have_attribute('aria-checked', 'true')
        expect(page.get_by_text('Används för han eller hon i artiklar.', exact=False)).to_have_count(0)
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.goto(f'{base}?screen=profile-create&profileMode=add')
    page.get_by_role('textbox', name='Hundens namn').fill('Nala')
    page.get_by_role('button', name='Avbryt och gå tillbaka').click()
    dialog = page.get_by_role('alert', name='Lämna utan att spara?')
    expect(dialog).to_be_visible()
    dialog.get_by_role('button', name='Fortsätt redigera').click()
    expect(page.get_by_role('textbox', name='Hundens namn')).to_have_value('Nala')
    page.get_by_role('button', name='Avbryt och gå tillbaka').click()
    dialog.get_by_role('button', name='Lämna utan att spara').click()
    expect(page.get_by_role('heading', name='Lägg till hund')).to_have_count(0)
    page.close()
    browser.close()
assert not errors, errors
print('PASS: onboarding fields, optional values, centered breed picker and guarded exit at 375/430/short viewport')

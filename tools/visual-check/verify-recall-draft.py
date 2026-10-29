from pathlib import Path
import json
import os

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4386/')
out = Path('docs/design/evidence/traction-recall-draft-01')
out.mkdir(parents=True, exist_ok=True)
draft = json.loads(Path('docs/content/recall-program-v1.json').read_text(encoding='utf-8'))
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
                                         args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'])
    for width, height in ((375, 844), (430, 844)):
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}?screen=training&trainingScenario=recall-draft&progression=empty')
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_role('button', name=draft['title'], exact=False).click()
        page.get_by_role('button', name=f"Starta träningsresa för {draft['title']}").click()
        page.get_by_role('button', name=f"Läs om {draft['title']} och dess källor").click()
        info = page.get_by_test_id('center-modal-bottom-sheet')
        expect(info.get_by_role('link')).to_have_count(len(draft['sources']))
        expect(info.get_by_text('1)', exact=True)).to_be_visible()
        info.screenshot(path=str(out / f'recall-references-{width}.png'))
        info.get_by_role('button', name='Stäng', exact=True).click()
        for index, step in enumerate(draft['steps']):
            page.get_by_role('button', name=f"Öppna aktivt steg: {step['title']}").click()
            modal = page.get_by_test_id('center-modal-bottom-sheet')
            expect(modal).to_be_visible()
            page.wait_for_timeout(350)  # Allow the native-style fade to settle before capturing evidence.
            for heading in ('Du behöver', 'Så gör ni', 'Gör det lättare', 'Gör det svårare', 'Trygg träning'):
                expect(modal.get_by_role('heading', name=heading, exact=True)).to_have_count(1)
            safety = modal.get_by_text('Vid oro: pausa och ge hunden utrymme.', exact=False)
            safety.scroll_into_view_if_needed()
            expect(safety).to_be_visible()
            if index >= 3:
                expect(modal.get_by_text('Håll långlinan under uppsikt och dra inte i den.', exact=False)).to_be_visible()
            if index in (0, 3):
                page.screenshot(path=str(out / f'recall-step-{index + 1}-safety-{width}.png'))
            modal.get_by_role('button', name=f"Logga ett träningspass för {step['title']}").click()
            modal.get_by_role('button', name='Delvis – vi fortsätter öva').click()
            modal.get_by_role('button', name='Spara återkopplingen för träningspasset').click()
            expect(modal.get_by_role('button', name='Fortsätt till nästa träningssteg')).to_have_count(0)
            modal.get_by_role('button', name=f"Bekräfta delmålet för {step['title']}").click()
            if index == 0:
                undo = modal.get_by_role('button', name=f"Ångra bekräftelsen för {step['title']}")
                undo.scroll_into_view_if_needed()
                page.wait_for_timeout(2800)  # Capture after transient confirmation toast has disappeared.
                page.screenshot(path=str(out / f'recall-confirmed-undo-{width}.png'))
                undo.click()
                expect(modal.get_by_role('button', name='Fortsätt till nästa träningssteg')).to_have_count(0)
                expect(modal.get_by_role('button', name=f"Bekräfta delmålet för {step['title']}")).to_be_visible()
                page.screenshot(path=str(out / f'recall-after-undo-{width}.png'))
                modal.get_by_role('button', name=f"Bekräfta delmålet för {step['title']}").click()
            if index < len(draft['steps']) - 1:
                modal.get_by_role('button', name='Fortsätt till nästa träningssteg').click()
            else:
                expect(modal.get_by_role('button', name='Fortsätt till nästa träningssteg')).to_have_count(0)
            modal.get_by_role('button', name='Stäng').click()
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.close()
    browser.close()

assert not errors, errors
print('PASS: six draft steps, per-step safety, explicit confirmation and progression at 375/430 px; synthetic data only')

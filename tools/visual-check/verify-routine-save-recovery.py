from __future__ import annotations

import json
import os
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[2]
REVIEW = os.environ.get('TASSLA_UI_REVIEW') == 'true'
BASE = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4173')
OUT = Path(os.environ.get(
    'TASSLA_UI_EVIDENCE',
    str(ROOT / 'docs/design/evidence/flow-home-checklist-filters-2026-10-20/a04' / ('review' if REVIEW else 'public')),
))
OUT.mkdir(parents=True, exist_ok=True)
RESULTS: list[dict[str, object]] = []


def record(name: str, **details: object) -> None:
    RESULTS.append({'check': name, 'result': 'PASS', **details})
    print(f'PASS {name}')


def open_editor(page, width: int, mode: str) -> None:
    page.set_viewport_size({'width': width, 'height': 876 if REVIEW else 844})
    page.goto(f'{BASE}/?screen=checklist&checklistCount=7&routineMutation={mode}')
    expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
    if REVIEW:
        expect(page.get_by_test_id('checklist-fixture-banner')).to_contain_text('Syntetiskt granskningsläge')
    row = page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True)
    row.scroll_into_view_if_needed()
    bounds = row.bounding_box()
    assert bounds is not None
    page.mouse.move(bounds['x'] + bounds['width'] / 2, bounds['y'] + bounds['height'] / 2)
    page.mouse.down()
    page.wait_for_timeout(700)
    page.mouse.up()
    expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_be_visible()


def edit_text_and_icon(page) -> None:
    name = page.get_by_role('textbox', name='Namn på rutin Morgonrutin')
    name.fill('Morgonrutin uppdaterad')
    item = page.get_by_role('textbox', name='Checklistepunkt 1')
    item.fill('Kissa uppdaterad')
    picker = page.get_by_role('button', name=re.compile(r'^Välj ikon för Kissa uppdaterad\. Aktuell ikon:'))
    if picker.get_attribute('aria-expanded') != 'true':
        picker.click()
    expect(page.get_by_role('radiogroup', name='Välj ikon för Kissa uppdaterad', exact=True)).to_be_visible()
    page.get_by_role('radio', name='Hjärta', exact=True).click()
    expect(page.get_by_role('button', name='Välj ikon för Kissa uppdaterad. Aktuell ikon: Hjärta', exact=True)).to_be_visible()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
        args=['--no-sandbox'],
    )
    page = browser.new_page(viewport={'width': 375, 'height': 876 if REVIEW else 844})
    page.set_default_timeout(8000)
    page.on('pageerror', lambda error: RESULTS.append({'check': 'browser error', 'result': 'FAIL', 'error': str(error)}))

    for width in (375, 430):
        open_editor(page, width, 'failed')
        edit_text_and_icon(page)
        save = page.get_by_role('button', name='Spara rutin Morgonrutin', exact=True)
        expect(save).to_be_enabled()
        save.click()
        expect(page.get_by_text('Ändringen sparades inte. Försök igen.', exact=True).first).to_be_visible()
        expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_have_value('Morgonrutin uppdaterad')
        expect(page.get_by_role('textbox', name='Checklistepunkt 1')).to_have_value('Kissa uppdaterad')
        expect(page.get_by_role('button', name='Välj ikon för Kissa uppdaterad. Aktuell ikon: Hjärta', exact=True)).to_be_enabled()
        expect(save).to_be_enabled()
        page.screenshot(path=str(OUT / f'routine-save-failed-{width}.png'), full_page=True)
        record('definitive failure keeps the edited checklist and icon while leaving the explicit save enabled', width=width)

    open_editor(page, 375, 'unknown')
    edit_text_and_icon(page)
    page.get_by_role('button', name='Spara rutin Morgonrutin', exact=True).click()
    expect(page.get_by_text('Vi kunde inte bekräfta om ändringen sparades.', exact=False).first).to_be_visible()
    expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_have_value('Morgonrutin uppdaterad')
    expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_have_attribute('readonly', '')
    expect(page.get_by_role('textbox', name='Checklistepunkt 1')).to_have_attribute('readonly', '')
    expect(page.get_by_role('button', name='Kontrollera samma ändring igen', exact=True)).to_be_enabled()
    page.screenshot(path=str(OUT / 'routine-save-unknown-375.png'), full_page=True)
    record('unknown result preserves a locked draft and exposes only the exact retry action')
    page.get_by_role('button', name='Kontrollera samma ändring igen', exact=True).click()
    expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin')).to_have_count(0)
    record('exact retry resolves the synthetic unknown routine write and closes the read-back-confirmed editor')

    for width in (375, 430):
        open_editor(page, width, 'conflict')
        edit_text_and_icon(page)
        page.get_by_role('button', name='Spara rutin Morgonrutin', exact=True).click()
        expect(page.get_by_text('Rutinen har ändrats sedan du öppnade den.', exact=False)).to_be_visible()
        stale_name = page.get_by_role('textbox', name=re.compile(r'^Namn på rutin Morgonrutin'))
        expect(stale_name).to_have_value('Morgonrutin uppdaterad')
        expect(stale_name).to_have_attribute('readonly', '')
        expect(page.get_by_role('button', name='Ersätt utkastet med senaste versionen', exact=True)).to_be_enabled()
        page.screenshot(path=str(OUT / f'routine-save-conflict-{width}.png'), full_page=True)
        record('conflict retains the stale draft read-only and asks before replacing it with the latest routine', width=width)
        page.get_by_role('button', name='Ersätt utkastet med senaste versionen', exact=True).click()
        expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin · senaste')).to_have_value('Morgonrutin · senaste')
        expect(page.get_by_role('textbox', name='Checklistepunkt 1')).to_have_value('Kissa · senaste')
        expect(page.get_by_role('button', name='Välj ikon för Kissa · senaste. Aktuell ikon: Tass', exact=True)).to_be_visible()
        record('explicit replacement uses the latest server text, checklist, icon and revision source')
        if width == 375:
            page.screenshot(path=str(OUT / 'routine-save-conflict-replaced-375.png'), full_page=True)
            page.get_by_role('textbox', name='Namn på rutin Morgonrutin · senaste').fill('Morgonrutin · senaste justerad')
            expect(page.get_by_role('button', name='Spara rutin Morgonrutin · senaste', exact=True)).to_be_enabled()
            page.get_by_role('button', name='Spara rutin Morgonrutin · senaste', exact=True).click()
            expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin · senaste')).to_have_count(0)
            record('a new edit after explicit replacement saves against the latest synthetic revision')

    errors = [item for item in RESULTS if item.get('result') == 'FAIL']
    (OUT / 'routine-save-recovery-results.json').write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2) + '\n')
    browser.close()
    assert not errors, errors

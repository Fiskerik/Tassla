"""Rendered shared actions using real screens and synthetic callbacks; no live deletion."""
import json
import os
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4190/')
out = Path(os.environ['TASSLA_UI_EVIDENCE'])
out.mkdir(parents=True, exist_ok=True)
glyphs = json.loads(Path('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json').read_text())
passed, errors = [], []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'])
    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.on('pageerror', lambda error: errors.append(str(error)))

    def open_screen(screen, extra=''):
        date = '' if screen == 'log' else '&today=2026-10-11'
        page.goto(f'{base}?screen={screen}{date}{extra}')
        page.wait_for_timeout(350)

    def icon_action(name, glyph, red=False):
        action = page.get_by_role('button', name=name, exact=True)
        expect(action).to_be_visible()
        action.scroll_into_view_if_needed()
        box = action.bounding_box()
        assert box['width'] >= 44 and box['height'] >= 44, f'{name}: target below44'
        icon = action.get_by_text(chr(glyphs[glyph]), exact=True)
        expect(icon).to_have_count(1)
        if red:
            assert icon.evaluate('el => getComputedStyle(el).color') == 'rgb(163, 41, 41)', f'{name}: trash not red'
        return action

    open_screen('account')
    delete = icon_action('Radera konto', 'trash-outline', red=True)
    expect(delete).to_be_enabled()
    page.evaluate("window.__tasslaAlertActions=['Avbryt']")
    delete.click()
    assert page.evaluate('window.__tasslaAccountDeleteCalls') == 0
    assert page.evaluate('window.__tasslaLastAlert.title') == 'Radera konto?'
    page.evaluate("window.__tasslaAlertActions=['Fortsätt','Avbryt']")
    delete.click()
    assert page.evaluate('window.__tasslaAccountDeleteCalls') == 0
    assert page.evaluate('window.__tasslaLastAlert.title') == 'Bekräfta radering'
    page.screenshot(path=str(out / 'account-red-trash.png'), full_page=True)
    page.evaluate("window.__tasslaAlertActions=['Fortsätt','Radera konto']")
    delete.click()
    assert page.evaluate('window.__tasslaAccountDeleteCalls') == 1
    passed.append('account red trash retains two confirmations; either cancel=0, final confirm=1 synthetic callback')
    for state in ['saving', 'confirmed', 'unknown', 'unavailable']:
        open_screen('account', f'&state={state}')
        expect(page.get_by_role('button', name='Raderar konto…' if state == 'saving' else 'Radera konto', exact=True)).to_be_disabled()
    passed.append('account busy/terminal/unavailable states still disable the same entry')

    open_screen('profile-create')
    page.get_by_role('button', name=re.compile('Kennelkod')).click()
    code = page.get_by_role('textbox', name='Kennelkod', exact=True)
    code.fill('ABC123')
    icon_action('Ta bort kennelkod', 'trash-outline', red=True).click()
    expect(code).to_have_value('')
    expect(page.get_by_role('button', name='Ta bort kennelkod', exact=True)).to_have_count(0)
    passed.append('create-profile trash clears only the existing local kennel code form; no live server used')

    open_screen('profile-edit')
    page.get_by_role('button', name=re.compile('Kennelkoppling')).click()
    code = page.get_by_role('textbox', name='Kennelkod, valfri', exact=True)
    code.fill('')
    icon_action('Ta bort kennelkoppling till Solgläntans kennel', 'trash-outline', red=True)
    page.screenshot(path=str(out / 'kennel-red-trash.png'), full_page=True)
    passed.append('existing kennel unlink action presents as a44pt contextual red trash icon')

    for height in [844, 667]:
        page.set_viewport_size({'width': 375, 'height': height})
        open_screen('log')
        page.get_by_role('button', name='Visa fler loggtyper', exact=True).click()
        page.get_by_role('button', name='Logga promenad', exact=True).click()
        expect(page.get_by_text('Promenad loggat', exact=True)).to_be_visible()
        undo = page.get_by_role('button', name=re.compile('Ångra: Promenad loggat'))
        icon_action(undo.get_attribute('aria-label'), 'arrow-undo-outline')
        page.screenshot(path=str(out / f'log-undo-turn-arrow-{height}.png'), full_page=True)
        undo.click()
        expect(page.get_by_text('Promenad loggat', exact=True)).to_have_count(0)
        row = page.get_by_role('button', name=re.compile('Mat 12:05'))
        row.click()
        note = page.get_by_role('textbox', name='Anteckning, högst 500 tecken', exact=True)
        raw_draft = '  Min osparade anteckning\nmed ny rad  '
        note.fill(raw_draft)
        icon_action('Radera mat från loggen', 'trash-outline', red=True).click()
        expect(page.get_by_role('alert')).to_be_visible()
        page.wait_for_timeout(500)
        page.screenshot(path=str(out / f'log-delete-confirmation-{height}.png'), full_page=True)
        page.get_by_role('button', name='Avbryt', exact=True).click()
        expect(page.get_by_role('alert')).to_have_count(0)
        passed.append('Logg undo uses the turn arrow and original callback; editor trash is red and cancel preserves its confirmation flow')
        expect(note).to_have_value(raw_draft)
        page.get_by_role('button', name='Stäng', exact=True).last.click()
        expect(page.get_by_role('alert', name='Kasta ändringen?')).to_be_visible()
        page.get_by_role('button', name='Avbryt', exact=True).click()
        expect(note).to_have_value(raw_draft)
        page.get_by_role('button', name='Stäng', exact=True).last.click()
        page.get_by_role('button', name='Kasta ändring', exact=True).click()
        expect(note).to_have_count(0)
        row.click()
        expect(page.get_by_role('textbox', name='Anteckning, högst 500 tecken', exact=True)).to_have_value('Åt allt')
        icon_action('Radera mat från loggen', 'trash-outline', red=True).click()
        page.get_by_role('button', name='Radera', exact=True).click()
        expect(row).to_have_count(0)
        expect(page.get_by_role('button', name=re.compile('Kiss 10:30'))).to_be_visible()
        page.screenshot(path=str(out / f'log-delete-confirmed-{height}.png'), full_page=True)
        passed.append('Logg delete/discard confirmations accept real clicks above editor; cancel preserves raw draft, discard restores saved note, delete removes only chosen post')


    page.set_viewport_size({'width': 375, 'height': 844})

    open_screen('planned', '&state=ready')
    # Use the exact existing record labels, independent of the health type text.
    edits = page.get_by_role('button', name=re.compile('^Ändra .+ 2026-'))
    expect(edits.first).to_be_visible()
    name = edits.first.get_attribute('aria-label')
    icon_action(name, 'create-outline')
    trash = page.get_by_role('button', name=re.compile('^Radera .+ 2026-')).first
    icon_action(trash.get_attribute('aria-label'), 'trash-outline', red=True)
    page.screenshot(path=str(out / 'health-consistent-actions.png'), full_page=True)
    edits.first.click()
    expect(page.get_by_role('button', name='Spara plan', exact=True)).to_be_visible()
    passed.append('planned health rows use the same edit and red trash family and open the existing exact editor')
    assert not errors, errors
    browser.close()

(out / 'RESULTS.json').write_text(json.dumps({'passed': passed, 'failed': [], 'scope': 'RN Web, synthetic screen callbacks; no account or kennel server deletion'}, ensure_ascii=False, indent=2) + '\n')
print(f'PASS {len(passed)}/{len(passed)} shared icon/action rendered checks')

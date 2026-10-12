from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'docs/design/TRAINING-01/evidence'
BASE_URL = 'http://127.0.0.1:4173'
EVIDENCE.mkdir(parents=True, exist_ok=True)
errors = []
cases = []

def assert_active_tab(page):
    weight = page.locator('[role="tab"][aria-label="Valpprogram"] > div').nth(0).evaluate(
        'element => getComputedStyle(element).fontWeight'
    )
    assert int(weight) >= 600, f'Valpprogram is not visually active: font weight {weight}'

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 360, 'height': 900}, device_scale_factor=1)
    page.on('pageerror', lambda error: errors.append(str(error)))

    for state in ['loading', 'empty', 'error', 'failure', 'loaded']:
        for width in [360, 430]:
            page.set_viewport_size({'width': width, 'height': 900})
            page.goto(f'{BASE_URL}/?state={state}')
            page.wait_for_timeout(180)
            body = page.locator('body').inner_text()
            assert 'Träning' in body, (state, width, body[:500])
            if state == 'loading':
                assert 'Laddar träningsprogram' in body
            elif state == 'empty':
                assert 'Fler program kommer' in body
            else:
                assert 'Övningar' in body
                assert 'Program' in body
                assert_active_tab(page)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (state, width)
            page.screenshot(path=str(EVIDENCE / f'{state}-{width}.png'), full_page=True)
            cases.append(f'{state}@{width}')

    page.set_viewport_size({'width': 360, 'height': 900})
    page.goto(f'{BASE_URL}/?state=loaded')
    page.wait_for_timeout(180)
    card = page.get_by_role('button', name='Program Kontakt och namn, 1 av 2 övningar genomförda')
    card_box = card.bounding_box()
    assert card_box and card_box['width'] >= 120 and card_box['height'] >= 44, card_box
    page.screenshot(path=str(EVIDENCE / 'loaded-360.png'), full_page=True)

    card.click()
    page.wait_for_timeout(60)
    assert page.get_by_text('Kontakt och namn', exact=True).count() >= 1
    assert_active_tab(page)
    scroll_values = page.locator('body').evaluate("""body => [...body.querySelectorAll('*')]
      .filter(el => el.scrollHeight > el.clientHeight + 4)
      .map(el => el.scrollTop).filter(value => value > 0)""")
    assert not scroll_values, f'Program focus did not return to top: {scroll_values}'
    page.screenshot(path=str(EVIDENCE / 'program-focus-360.png'), full_page=True)
    cases.append('program selection focuses at top and stays on Valpprogram')

    page.get_by_text('Säg namnet en gång', exact=True).click()
    undo = page.get_by_role('button', name='Markera som ej genomförd', exact=True)
    assert undo.count() == 1
    undo_box = undo.bounding_box()
    assert undo_box and undo_box['width'] >= 44 and undo_box['height'] >= 44, undo_box
    undo.click()
    page.wait_for_timeout(260)
    assert 'Markera som ej genomförd' not in page.locator('body').inner_text()
    assert page.get_by_role('button', name='Säg namnet en gång, Genomförd', exact=True).count() == 0
    page.wait_for_function("""() => !document.querySelector('[aria-label="Övning"], [aria-label="Om programmet"]')""", timeout=2000)
    page.screenshot(path=str(EVIDENCE / 'undo-after-action-360.png'), full_page=True)
    cases.append('confirmed undo closes detail and updates checklist')

    page.goto(f'{BASE_URL}/?state=loaded')
    page.wait_for_timeout(180)
    page.get_by_text('Utforska i egen takt', exact=True).click()
    page.get_by_role('button', name='Markera övningen som genomförd', exact=True).click()
    assert page.get_by_role('button', name='Markera övningen som genomförd', exact=True).is_disabled()
    page.wait_for_function("""() => [...document.querySelectorAll('*')]
      .some(el => el.tagName !== 'BUTTON' && getComputedStyle(el).pointerEvents === 'none')""", timeout=2000)
    page.wait_for_timeout(220)
    assert 'Övningen är genomförd' not in page.locator('body').inner_text()
    assert page.get_by_role('button', name='Utforska i egen takt, Genomförd', exact=True).count() == 1
    page.screenshot(path=str(EVIDENCE / 'completion-after-action-360.png'), full_page=True)
    cases.append('confirmed completion uses decorative celebration without success toast')

    failed = browser.new_page(viewport={'width': 360, 'height': 900})
    failed.goto(f'{BASE_URL}/?state=failure')
    failed.wait_for_timeout(220)
    failed.get_by_text('Utforska i egen takt', exact=True).click()
    failed.get_by_role('button', name='Markera övningen som genomförd', exact=True).click()
    failed.wait_for_timeout(240)
    assert 'Övningen kunde inte sparas. Försök igen.' in failed.locator('body').inner_text()
    assert failed.get_by_role('button', name='Utforska i egen takt, Genomförd', exact=True).count() == 0
    assert failed.get_by_role('button', name='Markera övningen som genomförd', exact=True).count() == 1
    assert failed.locator('body').evaluate("""body => [...body.querySelectorAll('*')]
      .filter(el => el.tagName !== 'BUTTON' && getComputedStyle(el).pointerEvents === 'none').length""") == 0
    failed.screenshot(path=str(EVIDENCE / 'failure-after-action-360.png'), full_page=True)
    failed.close()
    cases.append('failed completion stays unchecked and exposes retryable error')

    reduced = browser.new_page(viewport={'width': 360, 'height': 900}, reduced_motion='reduce')
    reduced.goto(f'{BASE_URL}/?state=loaded')
    reduced.wait_for_timeout(120)
    reduced.get_by_text('Utforska i egen takt', exact=True).click()
    reduced.get_by_role('button', name='Markera övningen som genomförd', exact=True).click()
    reduced.wait_for_timeout(240)
    assert 'Övningen är genomförd' not in reduced.locator('body').inner_text()
    assert reduced.get_by_role('button', name='Utforska i egen takt, Genomförd', exact=True).count() == 1
    nonblocking_layers = reduced.locator('body').evaluate("""body => [...body.querySelectorAll('*')]
      .filter(el => el.tagName !== 'BUTTON' && getComputedStyle(el).pointerEvents === 'none').length""")
    assert nonblocking_layers == 0, f'Reduced motion rendered a confetti layer: {nonblocking_layers}'
    reduced.screenshot(path=str(EVIDENCE / 'completion-reduced-motion-360.png'), full_page=True)
    reduced.close()
    cases.append('reduced motion has no confetti')

    page.set_viewport_size({'width': 360, 'height': 900})
    page.goto(f'{BASE_URL}/?state=loaded')
    page.wait_for_timeout(180)
    page.evaluate("""() => [...document.querySelectorAll('*')]
      .filter(el => [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
      .forEach(el => { const style=getComputedStyle(el); el.style.fontSize=(parseFloat(style.fontSize)*1.4)+'px'; el.style.lineHeight=(parseFloat(style.lineHeight)*1.4)+'px'; })""")
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.get_by_role('tab', name='Framsteg').click()
    assert int(page.locator('[role="tab"][aria-label="Framsteg"] > div').nth(0).evaluate(
        'element => getComputedStyle(element).fontWeight'
    )) >= 600, 'Framsteg must remain reachable from the horizontally scrollable tab rail at large text'
    assert 'Trygg start hemma' in page.locator('body').inner_text()
    page.screenshot(path=str(EVIDENCE / 'loaded-360-large-text.png'), full_page=True)
    assert not errors, errors
    browser.close()

print(f'PASS: {len(cases)} training visual cases; 360/430 widths, reduced motion, large text, no overflow or browser errors')

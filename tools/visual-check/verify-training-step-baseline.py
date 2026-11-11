"""Compare keyboard and nested-modal behavior with the committed baseline."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
from playwright.sync_api import expect, sync_playwright

output = Path('docs/design/evidence/training-step-motion-01')
output.mkdir(parents=True, exist_ok=True)
servers = []
for directory in (os.environ['TASSLA_BASELINE_DIR'], os.environ['TASSLA_CANDIDATE_DIR']):
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=directory))
    Thread(target=server.serve_forever, daemon=True).start()
    servers.append(server)

def snapshot(page):
    return page.evaluate('''() => ({tag:document.activeElement?.tagName, label:document.activeElement?.getAttribute('aria-label'),
      text:document.activeElement?.textContent?.slice(0,80), dialogs:[...document.querySelectorAll('[role="dialog"]')].map(d=>d.textContent.slice(0,40))})''')

def run(browser, server, scenario):
    page = browser.new_page(viewport={'width':375, 'height':667})
    delayed = scenario != 'immediate'
    page.goto(f'http://127.0.0.1:{server.server_port}/?screen=training&trainingScenario=motion-long&progression=confirmed' + ('&progressionRefresh=delayed' if delayed else ''))
    page.get_by_role('tab', name='Alla övningar').click()
    page.get_by_test_id('training-all-view').get_by_role('button').first.click()
    page.get_by_role('button', name='Öppna aktivt steg: Utforska i egen takt').click()
    modal = page.get_by_test_id('center-modal-bottom-sheet')
    page.wait_for_timeout(400)
    action = modal.get_by_role('button', name='Fortsätt till nästa träningssteg')
    action.scroll_into_view_if_needed()
    action.focus()
    page.keyboard.press('Enter')
    if scenario == 'overlay':
        page.evaluate('window.__tasslaMotionOverlay(true)')
        button = page.get_by_role('button', name='Stäng testdialog')
        expect(button).to_be_visible()
        button.focus()
    expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 2/3')
    immediate = snapshot(page)
    page.keyboard.press('Shift+Tab')
    after_shift = snapshot(page)
    page.close()
    return {'after_step':immediate, 'after_shift_tab':after_shift}

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
        results = {scenario:{'baseline':run(browser, servers[0], scenario), 'candidate':run(browser, servers[1], scenario)} for scenario in ('immediate','delayed','overlay')}
        browser.close()
    (output/'baseline-parity.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
    for scenario, pair in results.items():
        assert pair['baseline'] == pair['candidate'], (scenario,pair)
    print('Keyboard focus and overlay order match baseline in immediate, delayed and nested-modal scenarios.')
finally:
    for server in servers: server.shutdown()

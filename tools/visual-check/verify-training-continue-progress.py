"""Synthetic browser checks for the training continuation card."""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ['TASSLA_UI_BASE_URL'].rstrip('/')
out = Path('docs/design/evidence/training-continue-progress-01')
out.mkdir(parents=True, exist_ok=True)
results, errors = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    cases = [
        ('active', '0 av 3 delmål bekräftade', '0 pass loggade'),
        ('confirmed', '1 av 3 delmål bekräftade', '1 pass loggat'),
        ('complete', '3 av 3 delmål bekräftade', '0 pass loggade'),
        ('paused', '0 av 3 delmål bekräftade', '0 pass loggade'),
    ]
    for scenario, progress, sessions in cases:
        page = browser.new_page(viewport={'width':375, 'height':844})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + f'/?screen=training&trainingScenario=unstarted&progression={scenario}')
        card = page.get_by_role('button', name=re.compile('^(Fortsätt|Öppna) träningsresan Trygg vardagsstart'))
        expect(card).to_have_count(1)
        expect(card).to_have_attribute('aria-label', re.compile(re.escape(progress) + '.*' + re.escape(sessions)))
        bar = card.locator('[role="progressbar"]')
        expect(bar).to_be_attached()
        assert bar.evaluate("e => Boolean(e.closest('[aria-hidden=\"true\"]'))")
        expect(card.get_by_role('progressbar')).to_have_count(0)
        expected_value = {'active':0, 'confirmed':100/3, 'complete':100, 'paused':0}[scenario]
        aria_value = bar.get_attribute('aria-valuenow')
        if aria_value is not None:
            assert abs(float(aria_value)-expected_value) < 0.01
        ratio = bar.evaluate('''e => {const track=e.firstElementChild, fill=track.firstElementChild;
          return fill.getBoundingClientRect().width / track.getBoundingClientRect().width}''')
        assert abs(ratio-expected_value/100) < 0.02, (scenario, ratio)
        if scenario == 'paused': expect(card).to_have_attribute('aria-label', re.compile('^Öppna'))
        card.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        page.screenshot(path=str(out/f'{scenario}-375.png'))
        if scenario == 'paused':
            card.click()
            expect(page.get_by_test_id('center-modal-bottom-sheet')).to_have_count(0)
            expect(page.get_by_role('button',name='Fortsätt med nästa övning i Trygg vardagsstart')).to_be_visible()
        results.append(f'{scenario}: confirmed milestones and sessions shown separately')
        page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=training&trainingScenario=unstarted&progression=complete')
    expect(page.locator('[role="progressbar"][aria-label="3 av 3 delmål bekräftade"]')).to_be_attached()
    page.evaluate('window.__tasslaSwitchContinuation(1)')
    new_card=page.get_by_role('button',name=re.compile('^Fortsätt träningsresan Kontakt i vardagen'))
    bar=new_card.locator('[role="progressbar"][aria-label="0 av 2 delmål bekräftade"]')
    expect(bar).to_be_attached()
    aria_value = bar.get_attribute('aria-valuenow')
    if aria_value is not None: assert float(aria_value) == 0
    ratio=bar.evaluate('e => e.firstElementChild.firstElementChild.getBoundingClientRect().width / e.firstElementChild.getBoundingClientRect().width')
    assert ratio == 0, f'New journey inherited old progress: {ratio}'
    results.append('journey switch: new bar begins at its own verified value')
    page.close()
    for pending, expected in [('pending','Sparar ändringen'),('unknown','Ändringen behöver kontrolleras')]:
        page=browser.new_page(viewport={'width':375,'height':844})
        page.goto(base+f'/?screen=training&trainingScenario=unstarted&progression=confirmed&completionPending={pending}')
        card=page.get_by_role('button',name=re.compile('^Öppna träningsresan Trygg vardagsstart'))
        expect(card).to_contain_text(expected)
        expect(card.get_by_role('progressbar')).to_have_count(0)
        card.scroll_into_view_if_needed()
        page.screenshot(path=str(out/f'{pending}-375.png'))
        results.append(f'{pending}: no stale progress')
        page.close()
    for query in ('trainingScenario=duplicate-steps&progression=confirmed', 'trainingScenario=unstarted&progression=confirmed&duplicateJourney=true'):
        page=browser.new_page(viewport={'width':375,'height':844})
        page.goto(base+'/?screen=training&'+query)
        card=page.get_by_role('button',name=re.compile('^Öppna träningsresan Trygg vardagsstart'))
        expect(card).to_contain_text('Framstegen kunde inte visas.')
        expect(card.get_by_role('progressbar')).to_have_count(0)
        results.append('invalid identity: no misleading progress')
        page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=training&trainingScenario=unstarted&progression=complete&progressionRead=error')
    expect(page.get_by_text('Fortsätt där ni var',exact=True)).to_have_count(0)
    results.append('read error: no continuation progress')
    page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=training&trainingScenario=half')
    card=page.get_by_role('button',name=re.compile('^Fortsätt .*Aktivitetsmarkeringar:'))
    expect(card.get_by_text(re.compile('Aktivitetsmarkeringar:'))).to_be_visible()
    expect(card).not_to_contain_text('delmål')
    results.append('legacy: activity markings remain distinct')
    page.close()
    for width,height,enlarged in [(320,667,False),(375,667,True),(430,844,False)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.goto(base+'/?screen=training&trainingScenario=unstarted&progression=confirmed')
        if enlarged:
            page.evaluate("""() => document.querySelectorAll('[dir=auto]').forEach(e => {const s=getComputedStyle(e);e.style.fontSize=parseFloat(s.fontSize)*1.4+'px';if(s.lineHeight!=='normal')e.style.lineHeight=parseFloat(s.lineHeight)*1.4+'px'})""")
        card=page.get_by_role('button',name=re.compile('^Fortsätt träningsresan Trygg vardagsstart'))
        card.scroll_into_view_if_needed()
        box=card.bounding_box()
        assert box and box['width']>=44 and box['height']>=44 and box['x']>=0 and box['x']+box['width']<=width,box
        page.screenshot(path=str(out/(f'layout-{width}x{height}'+('-text140' if enlarged else '')+'.png')))
        results.append(f'{width}x{height}'+(' text140' if enlarged else '')+': card fits and remains tappable')
        page.close()
    browser.close()

assert not errors, errors
(out/'results.json').write_text(json.dumps({'results':results,'errors':errors,'limits':'Synthetic RN Web does not map the native accessibilityValue object to aria-valuenow; labels and visual fill are checked. CSS text scaling is not native Dynamic Type; live data not tested.'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

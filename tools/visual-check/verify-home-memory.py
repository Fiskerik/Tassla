"""Home memory and exact training focus using synthetic saved snapshots."""
import json, os, re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:5436/').rstrip('/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/home-memory-01'))
out.mkdir(parents=True, exist_ok=True)
errors, results = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width, height, state, large in [(375,844,'ready',False),(430,844,'ready',False),(375,667,'ready',True),(375,844,'loading',False),(375,844,'error',False)]:
        page = browser.new_page(viewport={'width':width,'height':height})
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.goto(base + f'/?screen=home&homeScenario=reflection-training&trainingScenario=unstarted&progression=empty&state={state}')
        if large:
            page.evaluate("""() => document.querySelectorAll('[dir=auto]').forEach(el => {
              const s = getComputedStyle(el), f = parseFloat(s.fontSize), l = parseFloat(s.lineHeight);
              if (Number.isFinite(f)) el.style.fontSize = `${f*1.4}px`;
              if (Number.isFinite(l)) el.style.lineHeight = `${l*1.4}px`;
            })""")
        card = page.get_by_test_id('home-reflection')
        expect(card.get_by_text('Bekräftat delmål: Utforska i egen takt · 26 oktober', exact=True)).to_be_visible()
        expect(card.get_by_role('progressbar')).to_have_count(0)
        card.scroll_into_view_if_needed()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(out / (f'synthetic-milestone-{state}-{width}x{height}' + ('-text140' if large else '') + '.png')))
        if large:
            shortcuts = page.get_by_text('Kunskap', exact=True).first
            shortcuts.scroll_into_view_if_needed()
            expect(shortcuts).to_be_visible()
            page.screenshot(path=str(out / 'synthetic-milestone-text140-bottom.png'))
        if state == 'ready' and width == 375:
            page.get_by_role('button',name=re.compile('Titta vad ni redan har gjort.*Öppna träningssteget')).click()
            modal = page.get_by_test_id('center-modal-bottom-sheet')
            expect(modal.get_by_role('heading',name='Utforska i egen takt',exact=True)).to_be_visible()
        results.append(f'{width}x{height} {state}: verified milestone visible; source opens exact exercise where exercised')
        page.close()
    page = browser.new_page(viewport={'width':375,'height':844})
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.goto(base+'/?screen=home&homeScenario=reflection-missing&trainingScenario=unstarted&progression=empty')
    page.get_by_role('button',name=re.compile('Titta vad ni redan har gjort.*Öppna träningssteget')).click()
    expect(page.get_by_text('Övningen är inte längre tillgänglig.',exact=True)).to_be_visible()
    expect(page.get_by_test_id('center-modal-bottom-sheet')).to_have_count(0)
    results.append('Missing source step gives explicit unavailable state, not a different exercise')
    page.goto(base+'/?screen=home&homeScenario=reflection-fallback&state=empty&ageExample=week20')
    empty=page.get_by_test_id('home-reflection')
    expect(empty.get_by_text('Inget bekräftat att visa här just nu. Öppna Logga.',exact=True)).to_be_visible()
    empty.scroll_into_view_if_needed();page.screenshot(path=str(out/'synthetic-empty-375.png'))
    results.append('Empty history is neutral and opens Logga')
    page.close();browser.close()
assert not errors, errors
(out/'results.json').write_text(json.dumps({'results':results,'page_errors':errors,
 'limits':'Synthetic saved data and RNWeb; live/RLS/native not verified.'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

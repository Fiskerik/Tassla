"""Synthetic RNWeb motion samples; native and live data remain unverified."""
import json, os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base=os.environ['TASSLA_UI_BASE_URL'].rstrip('/')
out=Path(os.environ.get('TASSLA_UI_EVIDENCE','docs/design/evidence/daily-ring-motion-01'))
out.mkdir(parents=True,exist_ok=True)
errors=[]

def sample(page):
    page.evaluate('''() => {window.__ringSamples=[];const start=performance.now();function frame(t){const el=document.querySelector('[data-testid="daily-progress-ring-progress"]');const holder=el?.closest('svg')?.parentElement;window.__ringSamples.push({ms:Math.round(t-start),offset:Number(el?.getAttribute('stroke-dashoffset')),label:holder?.getAttribute('aria-label')});if(t-start<1100)requestAnimationFrame(frame)}requestAnimationFrame(frame)}''')

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    results={}
    for scenario, preference in [('success','no-preference'),('success','reduce'),('failed','no-preference')]:
        page=browser.new_page(viewport={'width':375,'height':844},reduced_motion=preference)
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+f'/?screen=progress&ringMotion={scenario}')
        expect(page.get_by_role('progressbar',name='3 av 6 dagsuppgifter klara')).to_be_visible()
        page.wait_for_timeout(800)
        if scenario=='success' and preference=='no-preference':page.screenshot(path=str(out/'before-375.png'))
        sample(page)
        page.get_by_role('checkbox',name='Rutin Morgonrutin, punkt Kissa, inte klar').click()
        if scenario=='success':
            if preference=='no-preference':
                page.wait_for_function('''() => {let x=Number(document.querySelector('[data-testid="daily-progress-ring-progress"]')?.getAttribute('stroke-dashoffset'));return x < 365 && x > 252}''', timeout=5000)
                page.screenshot(path=str(out/'during-375.png'))
            expect(page.get_by_role('progressbar',name='4 av 6 dagsuppgifter klara')).to_be_visible()
            expect(page.get_by_text('4 av 6',exact=True)).to_be_visible()
        page.wait_for_timeout(1200)
        frames=page.evaluate('window.__ringSamples')
        values=sorted(set(round(f['offset'],2) for f in frames))
        if scenario=='failed':
            assert len(values)==1,values
            expect(page.get_by_role('progressbar',name='3 av 6 dagsuppgifter klara')).to_be_visible()
        elif preference=='reduce':
            assert len(values)<=2,values
        else:
            assert len(values)>3,values
            mid=[f for f in frames if 252 < f['offset'] < 365]
            assert mid and all(f['label']=='4 av 6 dagsuppgifter klara' for f in mid),mid
            page.screenshot(path=str(out/'after-375.png'))
            sample(page)
            page.get_by_role('checkbox',name='Rutin Morgonrutin, punkt Kissa, klar').click()
            page.wait_for_timeout(1200)
            undo=page.evaluate('window.__ringSamples')
            assert len(set(round(f['offset'],2) for f in undo))<=2
            results['undo']={'frames':undo}
        results[f'{scenario}-{preference}']={'distinct_offsets':values,'frames':frames}
        page.close()
    page=browser.new_page(viewport={'width':375,'height':844},reduced_motion='no-preference')
    page.goto(base+'/?screen=progress&ringMotion=success');page.wait_for_timeout(800)
    sample(page)
    page.get_by_role('checkbox',name='Rutin Morgonrutin, punkt Kissa, inte klar').click()
    page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(40)
    page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(1200)
    toggled=page.evaluate('window.__ringSamples')
    assert len(set(round(f['offset'],2) for f in toggled))<=2
    expect(page.get_by_role('progressbar',name='4 av 6 dagsuppgifter klara')).to_be_visible()
    results['preference-toggle-while-pending']={'frames':toggled}
    page.close()
    page=browser.new_page(viewport={'width':375,'height':844},reduced_motion='no-preference')
    page.goto(base+'/?screen=progress&ringMotion=success');page.wait_for_timeout(800)
    page.get_by_role('checkbox',name='Rutin Morgonrutin, punkt Kissa, inte klar').click()
    page.wait_for_function('''() => {let x=Number(document.querySelector('[data-testid="daily-progress-ring-progress"]')?.getAttribute('stroke-dashoffset'));return x < 365 && x > 255}''')
    page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100)
    sample(page);page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(1200)
    interrupted=page.evaluate('window.__ringSamples')
    assert all(abs(f['offset'] - 247.138622)<0.1 for f in interrupted),interrupted
    results['preference-toggle-during-motion']={'frames':interrupted}
    page.close()
    for width,height in [(430,844),(375,667)]:
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
        page.goto(base+'/?screen=progress&ringMotion=success')
        expect(page.get_by_role('progressbar',name='3 av 6 dagsuppgifter klara')).to_be_visible()
        if height==667:
            page.evaluate('''() => document.querySelectorAll('[dir=auto]').forEach(el=>{let s=getComputedStyle(el),f=parseFloat(s.fontSize),l=parseFloat(s.lineHeight);if(Number.isFinite(f))el.style.fontSize=`${f*1.4}px`;if(Number.isFinite(l))el.style.lineHeight=`${l*1.4}px`})''')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(out/f'initial-{width}x{height}.png'));page.close()
    browser.close()
assert not errors,errors
(out/'results.json').write_text(json.dumps({'results':results,'page_errors':errors,'limits':'Synthetic RNWeb; not native or live/RLS.'},ensure_ascii=False,indent=2)+'\n')
print('PASS: actual SVG frames, immediate confirmed label, reduced motion, failed write and undo; synthetic RNWeb')

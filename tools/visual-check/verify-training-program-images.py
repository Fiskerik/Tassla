"""Compare stable program pictures on actual synthetic RNWeb training views."""
import json, os, re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base=os.environ['TASSLA_UI_BASE_URL'].rstrip('/')
out=Path('docs/design/evidence/training-program-images-01');out.mkdir(parents=True,exist_ok=True)
programs=[
    ('Trygg hantering i små steg','Låt hunden välja kontakt','puppy-training'),
    ('Utforska miljön med trygghet','Börja med att titta','training-hero-shiba-park'),
    ('Öva på att vara själv i hundens takt','Gör viloplatsen trygg när du är hemma','dog-resting'),
    ('Inkallning i små steg','Kom nära inomhus','training-recommendation-puppy-black-tan-park'),
]
errors=[];results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (375,430):
        for index,(title,step,asset) in enumerate(programs):
            page=browser.new_page(viewport={'width':width,'height':844})
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(base+'/?screen=training&trainingScenario=images'+('&imageOrder=tail' if index>=2 else ''))
            card=page.get_by_role('button',name=re.compile('^Öppna nästa övning .* i '+re.escape(title)+'$'))
            expect(card.locator('img')).to_have_attribute('src',re.compile(asset))
            page.screenshot(path=str(out/f'recommendations-{index}-{width}.png'))
            page.get_by_role('tab',name='Alla övningar').click()
            page.get_by_role('button',name=re.compile('^'+re.escape(title)+',')).click()
            banner=page.get_by_test_id('training-journey-banner')
            expect(banner.locator('img')).to_have_attribute('src',re.compile(asset))
            page.screenshot(path=str(out/f'program-{index}-{width}.png'))
            page.get_by_role('button',name=re.compile('^Öppna nästa steg:')).click()
            modal=page.get_by_test_id('center-modal-bottom-sheet')
            expect(modal).to_be_visible()
            expect(modal.get_by_test_id('training-journey-banner')).to_have_count(0)
            page.wait_for_timeout(400)
            expect(modal.get_by_test_id('training-exercise-banner').locator('img')).to_have_attribute('src',re.compile(asset))
            expect(modal.get_by_role('heading',name=step,exact=True)).to_be_visible()
            page.screenshot(path=str(out/f'exercise-{index}-{width}.png'))
            results.append(f'{title} {width}: same image in program and exercise'+' and recommendation')
            page.close()
    page=browser.new_page(viewport={'width':375,'height':667})
    page.goto(base+'/?screen=training&trainingScenario=unstarted')
    fallback=page.get_by_role('button',name=re.compile('^Öppna nästa övning .* i Trygg vardagsstart$'))
    expect(fallback.locator('img')).to_have_attribute('src',re.compile('training-recommendation-puppy-black-tan-park'))
    page.screenshot(path=str(out/'fallback-recommendation-375.png'))
    page.get_by_role('tab',name='Alla övningar').click()
    page.get_by_role('button',name=re.compile('^Trygg vardagsstart,')).click()
    expect(page.get_by_test_id('training-journey-banner').locator('img')).to_have_attribute('src',re.compile('training-recommendation-puppy-black-tan-park'))
    page.screenshot(path=str(out/'fallback-program-375.png'))
    page.get_by_role('button',name=re.compile('^Öppna nästa steg:')).click()
    modal=page.get_by_test_id('center-modal-bottom-sheet');expect(modal).to_be_visible();page.wait_for_timeout(400)
    expect(modal.get_by_test_id('training-exercise-banner').locator('img')).to_have_attribute('src',re.compile('training-recommendation-puppy-black-tan-park'))
    page.evaluate('''() => document.querySelectorAll('[dir=auto]').forEach(e=>{let s=getComputedStyle(e);e.style.fontSize=parseFloat(s.fontSize)*1.4+'px';if(s.lineHeight!=='normal')e.style.lineHeight=parseFloat(s.lineHeight)*1.4+'px'})''')
    page.screenshot(path=str(out/'fallback-exercise-375-text140.png'))
    results.append('unknown program/version: generic fallback in program and exercise, short screen and CSS 140%')
    page.close()
    browser.close()
assert not errors,errors
(out/'results.json').write_text(json.dumps({'results':results,'page_errors':errors,'limitations':'Synthetic RNWeb and draft fixture; not native, live content or publication evidence.'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

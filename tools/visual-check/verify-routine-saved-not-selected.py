"""Render the shared notice on synthetic RNWeb Home; live data is not exercised."""
import json,os
from pathlib import Path
from playwright.sync_api import expect,sync_playwright

base=os.environ['TASSLA_UI_BASE_URL'].rstrip('/')
out=Path('docs/design/evidence/routine-saved-not-selected-01');out.mkdir(parents=True,exist_ok=True)
errors=[];results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height,large in [(375,844,False),(430,844,False),(375,667,True)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/?screen=home&routineNotice=1')
        notice=page.get_by_test_id('routine-not-selected-notice')
        expect(notice).to_contain_text('Morgonrutin')
        expect(notice).to_contain_text('Doos')
        expect(notice).to_contain_text('5 november 2026')
        expect(notice).to_contain_text('välj Doos')
        expect(notice).to_contain_text('Vi lade inte till')
        if large:
            page.evaluate('''() => document.querySelectorAll('[dir=auto]').forEach(e=>{let s=getComputedStyle(e);e.style.fontSize=parseFloat(s.fontSize)*1.4+'px';if(s.lineHeight!=='normal')e.style.lineHeight=parseFloat(s.lineHeight)*1.4+'px'})''')
        page.screenshot(path=str(out/(f'notice-{width}x{height}'+('-text140' if large else '')+'.png')))
        action=notice.get_by_role('button',name='Stäng rutinmeddelande')
        action.scroll_into_view_if_needed();expect(action).to_be_visible();action.click()
        expect(notice).to_have_count(0)
        results.append(f'{width}x{height}: source dog/date, explicit not-added text and dismiss')
        page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=home&routineNotice=1&noticeDog=current')
    notice=page.get_by_test_id('routine-not-selected-notice')
    expect(notice).to_contain_text('lägga till den idag')
    page.screenshot(path=str(out/'notice-current-dog-375.png'))
    notice.get_by_role('button',name='Öppna rutiner för den valda hunden').click()
    expect(page.get_by_test_id('center-modal-bottom-sheet')).to_be_visible()
    expect(notice).to_be_visible()
    page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'/?screen=home&routineNotice=1&noticeDog=missing')
    notice=page.get_by_test_id('routine-not-selected-notice')
    expect(notice).to_contain_text('Hundprofilen är inte tillgänglig')
    expect(notice.get_by_role('button',name='Öppna rutiner för den valda hunden')).to_have_count(0)
    page.screenshot(path=str(out/'notice-missing-dog-375.png'));page.close()
    browser.close()
assert not errors,errors
(out/'results.json').write_text(json.dumps({'results':results,'errors':errors,'limits':'Synthetic RNWeb; CSS 140% not native Dynamic Type; no real data.'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

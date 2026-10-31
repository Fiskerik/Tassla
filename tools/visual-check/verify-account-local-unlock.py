"""Actual account screen; synthetic marker/callbacks. Online SDK and root handlers have separate tests."""
import json
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
base=os.environ.get('TASSLA_UI_BASE_URL','http://127.0.0.1:5430/app/').rstrip('/')
out=Path(os.environ.get('TASSLA_UI_EVIDENCE','docs/design/evidence/account-local-unlock-01/after'))
out.mkdir(parents=True,exist_ok=True)
results,errors=[],[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    def open_account(query='',width=375,height=844):
        page=browser.new_page(viewport={'width':width,'height':height})
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(f'{base}/?screen=account{query}')
        return page
    def enlarge(page):
        page.evaluate("""()=>{for(const e of document.querySelectorAll('div,span,button'))if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const s=getComputedStyle(e);e.dataset.baseFont ||= parseFloat(s.fontSize);e.dataset.baseLine ||= s.lineHeight==='normal'?'normal':parseFloat(s.lineHeight);e.style.fontSize=Number(e.dataset.baseFont)*1.4+'px';if(e.dataset.baseLine!=='normal')e.style.lineHeight=Number(e.dataset.baseLine)*1.4+'px';}}""")
    def shot(page,name):
        if 'text140' in name:enlarge(page)
        if '-scrolled' not in name: page.get_by_role('heading',name='Kontoradering',exact=True).scroll_into_view_if_needed()
        page.wait_for_timeout(350)
        assert page.evaluate("document.getElementById('root').scrollWidth<=innerWidth+1")
        page.screenshot(path=str(out/f'{name}.png'))
    unlock_name='Kontrollera kontot och lås upp ett nytt raderingsförsök'
    for width,height,large in [(375,844,False),(430,844,False),(375,667,False),(375,844,True)]:
        page=open_account('&accountMarker=pending',width,height)
        unlock=page.get_by_role('button',name=unlock_name,exact=True)
        expect(unlock).to_be_enabled()
        trash=page.get_by_role('button',name='Radera konto',exact=True)
        expect(trash).to_be_disabled()
        suffix=f'{width}x{height}'+('-text140' if large else '')
        shot(page,f'locked-{suffix}')
        if height==667:
            unlock.scroll_into_view_if_needed();shot(page,f'locked-scrolled-{suffix}')
        title=page.get_by_role('heading',name='Kontoradering',exact=True).bounding_box();box=trash.bounding_box()
        assert box['x']>title['x'] and max(title['y'],box['y'])<min(title['y']+title['height'],box['y']+box['height'])
        unlock.click()
        expect(page.get_by_text('Klart för ett nytt försök.',exact=True)).to_be_visible()
        expect(trash).to_be_enabled();expect(unlock).to_have_count(0)
        assert page.evaluate('window.__tasslaAccountUnlockCalls')==1
        assert page.evaluate('window.__tasslaAccountDeleteCalls')==0
        shot(page,f'unlocked-{suffix}')
        trash.click();assert page.evaluate('window.__tasslaLastAlert.title')=='Radera konto?'
        assert page.evaluate('window.__tasslaAccountDeleteCalls')==0
        page.evaluate("window.__tasslaAlertActions=['Fortsätt','Avbryt']");trash.click()
        assert page.evaluate('window.__tasslaLastAlert.title')=='Bekräfta radering'
        assert page.evaluate('window.__tasslaAccountDeleteCalls')==0
        results.append(suffix+': persisted marker read locks trash; manual unlock enables normal separate confirmation; no delete')
        page.close()
    page=open_account('&state=unknown');page.get_by_role('button',name=unlock_name).click()
    expect(page.get_by_text('Klart för ett nytt försök.',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Radera konto',exact=True)).to_be_enabled()
    assert page.evaluate('window.__tasslaAccountDeleteCalls')==0
    results.append('Unknown root status and screen marker both return to ready after success');page.close()
    page=open_account('&state=unknown&accountDeleteAfterUnlock=unknown');page.get_by_role('button',name=unlock_name).click()
    expect(page.get_by_text('Klart för ett nytt försök.',exact=True)).to_be_visible()
    page.evaluate("window.__tasslaAlertActions=['Fortsätt','Radera konto']");page.get_by_role('button',name='Radera konto',exact=True).click()
    expect(page.get_by_text('Klart för ett nytt försök.',exact=True)).to_have_count(0);expect(page.get_by_role('button',name=unlock_name)).to_be_enabled();expect(page.get_by_role('button',name='Radera konto',exact=True)).to_be_disabled()
    assert page.evaluate('window.__tasslaAccountDeleteCalls')==1
    results.append('A later synthetic unknown deletion hides the old ready message and locks again');page.close()
    page=open_account('&accountMarker=pending&accountReset=failed');page.get_by_role('button',name=unlock_name).click()
    expect(page.get_by_text('Kunde inte låsa upp. Försök igen.',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Radera konto',exact=True)).to_be_disabled();expect(page.get_by_role('button',name=unlock_name)).to_be_enabled()
    shot(page,'verification-failed-375x844');page.get_by_text('Kunde inte låsa upp. Försök igen.',exact=True).scroll_into_view_if_needed();shot(page,'verification-failed-scrolled-375x844');results.append('Failed check retains lock and offers another manual check');page.close()
    page=open_account('&accountMarker=pending&accountReset=pending');unlock=page.get_by_role('button',name=unlock_name);unlock.click()
    expect(unlock).to_be_disabled();expect(page.get_by_role('button',name='Radera konto',exact=True)).to_be_disabled()
    page.screenshot(path=str(out/'checking-375x844.png'))
    expect(page.get_by_text('Klart för ett nytt försök.',exact=True)).to_be_visible()
    assert page.evaluate('window.__tasslaAccountUnlockCalls')==1
    results.append('Pending verification keeps both actions disabled and completes once');page.close()
    page=open_account('&state=confirmed&accountMarker=pending')
    expect(page.get_by_role('button',name=unlock_name)).to_have_count(0)
    expect(page.get_by_role('button',name='Radera konto',exact=True)).to_be_disabled()
    shot(page,'confirmed-no-unlock-375x844');results.append('Confirmed deletion cannot be unlocked');page.close()
    page=open_account();expect(page.get_by_role('button',name=unlock_name)).to_have_count(0);expect(page.get_by_role('button',name='Radera konto',exact=True)).to_be_enabled();page.close()
    results.append('Default fixture remains clear; scenarios isolated per page')
    browser.close()
assert not errors,errors
(out/'results.json').write_text(json.dumps({'results':results,'page_errors':errors,'limits':'Synthetic RNWeb marker and callback; actualSDK/root tests separate, no live account deletion or device SecureStore'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

"""Synthetic UI journey using actual PublishedTrainingScreen and existing operation fixture."""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:5430/app/').rstrip('/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/training-pinned-session-01/after'))
out.mkdir(parents=True, exist_ok=True)
errors, results = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    def open_step(query='', width=375, height=844):
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'{base}/?screen=training&trainingScenario=feedback&progression=timeline{query}')
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_role('button', name='Trygg hantering i små steg', exact=False).first.click()
        page.get_by_role('button', name='Öppna aktivt steg: Prova en kort beröring', exact=True).click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        expect(modal).to_be_visible()
        page.wait_for_timeout(400)
        return page, modal
    def enlarge(page):
        page.evaluate("""() => {for(const e of document.querySelectorAll('div,span,input,button'))if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const s=getComputedStyle(e);e.dataset.baseFont ||= parseFloat(s.fontSize);e.dataset.baseLine ||= s.lineHeight==='normal'?'normal':parseFloat(s.lineHeight);e.style.fontSize=Number(e.dataset.baseFont)*1.4+'px';if(e.dataset.baseLine!=='normal')e.style.lineHeight=Number(e.dataset.baseLine)*1.4+'px';}}""")
    def shot(page, name):
        if 'text140' in name: enlarge(page)
        page.wait_for_timeout(350)
        page.screenshot(path=str(out / f'{name}.png'))
    def ops(page):
        return page.evaluate('window.__tasslaTrainingProgressionOperations ?? []')
    def fill_pass(modal, choice='Gick som planerat'):
        modal.get_by_role('button', name=re.compile('^Logga ett träningspass (för|till)')).click()
        modal.get_by_role('radio', name=choice, exact=True).click()
    for width, height, large in [(375,844,False),(430,844,False),(375,667,False),(375,844,True)]:
        page, modal = open_step(width=width,height=height)
        if large: enlarge(page)
        label=f'{width}x{height}'+('-text140' if large else '')
        image=modal.get_by_test_id('training-exercise-banner')
        title=modal.get_by_role('heading',name='Prova en kort beröring',exact=True)
        before=[image.bounding_box(),title.bounding_box()]
        shot(page,f'fixed-before-{label}')
        modal.get_by_role('button',name=re.compile('^Logga ett träningspass (för|till)')).scroll_into_view_if_needed()
        after=[image.bounding_box(),title.bounding_box()]
        for a,b in zip(before,after):
            assert abs(a['y']-b['y'])<1 and abs(a['height']-b['height'])<1,(a,b)
        shot(page,f'fixed-scrolled-{label}')
        fill_pass(modal)
        modal.get_by_role('button',name='Spara träningspass',exact=True).click()
        expect(modal).to_have_count(0)
        card=page.get_by_test_id('training-saved-session')
        expect(card.get_by_text('Passet sparat',exact=True)).to_be_visible()
        expect(card.get_by_text('Prova en kort beröring',exact=True)).to_be_visible()
        expect(card.get_by_role('button',name='Bekräfta delmålet för Prova en kort beröring')).to_be_visible()
        assert [x['action']['kind'] for x in ops(page)]==['record_session']
        shot(page,f'pass-saved-{label}')
        card.get_by_role('button',name='Bekräfta delmålet för Prova en kort beröring').click()
        expect(card).to_have_count(0)
        assert [x['action']['kind'] for x in ops(page)]==['record_session','confirm_step']
        results.append(f'{label}: fixed photo/title under scroll, saved-only close/card, explicit separate milestone')
        page.close()
    for choice in ['Vi fortsätter öva','Vi avslutade tidigare']:
        page,modal=open_step();fill_pass(modal,choice);modal.get_by_role('button',name='Spara träningspass',exact=True).click()
        expect(modal).to_have_count(0)
        card=page.get_by_test_id('training-saved-session');expect(card.get_by_role('button',name='Bekräfta delmålet för Prova en kort beröring')).to_have_count(0)
        assert [x['action']['kind'] for x in ops(page)]==['record_session']
        card.get_by_role('button',name='Stäng passbekräftelsen').click();expect(card).to_have_count(0)
        results.append(choice+': save closes, no milestone offer, dismiss works');page.close()
    page,modal=open_step('&progressionWrite=pending');fill_pass(modal);modal.get_by_role('button',name='Spara träningspass',exact=True).click();expect(modal).to_be_visible();expect(page.get_by_test_id('training-saved-session')).to_have_count(0);expect(modal).to_have_count(0);results.append('Pending retains modal until saved receipt');page.close()
    page,modal=open_step('&progressionWrite=failed-session');fill_pass(modal);modal.get_by_role('button',name='Spara träningspass',exact=True).click()
    expect(modal.get_by_text('Ändringen kunde inte sparas. Försök igen.',exact=True)).to_be_visible()
    expect(modal.get_by_role('button',name='Spara träningspass',exact=True)).to_be_enabled()
    expect(page.get_by_test_id('training-saved-session')).to_have_count(0);shot(page,'failed-session');results.append('Failed: modal and feedback retained, no success');page.close()
    page,modal=open_step('&progressionWrite=unknown-session-once');fill_pass(modal);modal.get_by_role('button',name='Spara träningspass',exact=True).click()
    expect(page.get_by_test_id('training-saved-session')).to_have_count(0)
    modal.get_by_role('button',name='Kontrollera samma träningsändring igen').click()
    expect(modal).to_have_count(0);expect(page.get_by_test_id('training-saved-session')).to_be_visible()
    operations=ops(page);assert len(operations)==2 and operations[0]['operationId']==operations[1]['operationId']
    shot(page,'same-operation-retry-saved');results.append('Unknown keeps modal; same-operation retry saved closes and shows exact step card');page.close()
    browser.close()
assert not errors,errors
(out/'results.json').write_text(json.dumps({'results':results,'page_errors':errors,'limits':'Synthetic RNWeb; CSS140 not native DynamicType; no live database'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

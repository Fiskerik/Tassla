"""Exercise real feedback hooks and presses with a synthetic native SDK boundary."""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
base=os.environ.get('TASSLA_UI_BASE_URL','http://127.0.0.1:5431/app/').rstrip('/')
out=Path(os.environ.get('TASSLA_UI_EVIDENCE','docs/design/evidence/premium-feedback-01/after'))
out.mkdir(parents=True,exist_ok=True)
results,errors=[],[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    def open_page(query,width=375,height=844,reduced=False):
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference')
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/?'+query);page.wait_for_timeout(450)
        return page
    def count(page):return page.evaluate('window.__tasslaHapticCalls??0')
    def confirm(page):page.get_by_role('button',name='Bekräfta sparande',exact=True).click();page.wait_for_timeout(100)
    for kind in ['daily','phase']:
        page=open_page('feedbackProbe=true&feedbackPlatform=ios')
        checkbox=page.get_by_role('checkbox').nth(0 if kind=='daily' else 1)
        checkbox.click();expect(checkbox).to_be_disabled();assert count(page)==0
        page.screenshot(path=str(out/f'{kind}-pending-375.png'))
        page.get_by_role('button',name='Okänt sparande',exact=True).click();assert count(page)==0
        confirm(page);expect(checkbox).to_have_attribute('aria-checked','true');assert count(page)==1
        confirm(page);assert count(page)==1
        page.screenshot(path=str(out/f'{kind}-confirmed-375.png'))
        checkbox.click();confirm(page);assert count(page)==1
        results.append(kind+': pending/unknown silent; same check confirms once; duplicate confirmation/uncheck silent');page.close()
    for scenario in ['initial','hydrate','scope','unmount','web','reduced','reject']:
        query='feedbackProbe=true'+('' if scenario=='web' else '&feedbackPlatform=ios')+('&initialChecked=true' if scenario=='initial' else '')+('&hapticsReject=true' if scenario=='reject' else '')
        page=open_page(query,reduced=scenario=='reduced')
        if scenario=='initial':assert count(page)==0
        elif scenario=='hydrate':page.get_by_role('button',name='Hydrera sparad punkt').click();page.wait_for_timeout(120);assert count(page)==0
        else:
            page.get_by_role('checkbox').first.click()
            if scenario=='scope':page.get_by_role('button',name='Byt objekt').click()
            if scenario=='unmount':page.get_by_role('button',name='Stäng probraden').click()
            confirm(page)
            assert count(page)==(1 if scenario=='reject' else 0),(scenario,count(page))
            if scenario=='reduced':page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(160);assert count(page)==0
            if scenario=='reject':expect(page.get_by_role('checkbox').first).to_have_attribute('aria-checked','true')
        results.append(scenario+': real component lifetime/native-boundary policy PASS');page.close()
    page=open_page('feedbackProbe=true&feedbackPlatform=ios')
    detail=page.get_by_role('button',name='Öppna Rutin Provrutin, punkt Provpunkt',exact=True)
    detail.hover();page.mouse.down();page.wait_for_timeout(650);page.mouse.up()
    assert page.evaluate('window.__feedbackLongPress??0')==1 and count(page)==0
    results.append('Long press preserved without completion feedback');page.close()
    for width,height,reduced in [(375,844,False),(430,844,False),(375,667,False),(375,844,True)]:
        suffix=f'{width}x{height}'+('-reduced' if reduced else '')
        for screen,label in [('log','Lägg till händelse'),('more','Hälsa. Vikt, hälsohistorik och planer')]:
            page=open_page('screen='+screen,width,height,reduced)
            target=page.get_by_role('button',name=label,exact=True);target.scroll_into_view_if_needed();page.wait_for_timeout(100)
            before=target.bounding_box();page.screenshot(path=str(out/f'{screen}-normal-{suffix}.png'))
            target.hover();page.mouse.down();page.wait_for_timeout(160)
            pressed=target.bounding_box();ratio=pressed['width']/before['width']
            assert abs(ratio-1)<.003 if reduced else .975<ratio<.995,(screen,suffix,ratio)
            page.screenshot(path=str(out/f'{screen}-pressed-{suffix}.png'))
            page.mouse.move(1,1);page.mouse.up();page.wait_for_timeout(220)
            after=target.bounding_box();assert abs(after['width']-before['width'])<1
            results.append(screen+' '+suffix+': press/release scale and cancellation preserved')
            page.close()
    page=open_page('screen=log')
    page.get_by_role('button',name=re.compile('Öppna kalender$')).click()
    previous=page.get_by_role('button',name='Visa föregående månad');previous.click()
    expect(page.get_by_role('button',name='Visa nästa månad')).to_be_enabled()
    page.screenshot(path=str(out/'calendar-375.png'));results.append('Calendar month actions remain usable');page.close()
    for refresh in ['fast','delayed']:
        page=open_page('screen=training&trainingScenario=feedback&progression=confirmed-current&progressionRefresh='+refresh)
        page.get_by_role('tab',name='Alla övningar').click();page.get_by_role('button',name='Trygg hantering i små steg',exact=False).first.click()
        page.get_by_role('button',name='Öppna aktivt steg: Prova en kort beröring',exact=True).click()
        modal=page.get_by_test_id('center-modal-bottom-sheet');modal.get_by_role('button',name='Fortsätt till nästa träningssteg').click()
        expect(modal.get_by_role('heading',name='Låt hunden välja om ni fortsätter',exact=True)).to_be_visible()
        page.screenshot(path=str(out/'training-next-375.png'))
        modal.get_by_role('button',name='Backa till föregående träningssteg').click()
        expect(modal.get_by_role('heading',name='Prova en kort beröring',exact=True)).to_be_visible()
        operations=page.evaluate('window.__tasslaTrainingProgressionOperations')
        assert [row['action']['kind'] for row in operations]==['next','back']
        results.append(refresh+': Next/Back open actual active step after confirmed readback');page.close()
    for write in ['failed','unknown-once']:
        page=open_page('screen=training&trainingScenario=feedback&progression=confirmed-current&progressionWrite='+write)
        page.get_by_role('tab',name='Alla övningar').click();page.get_by_role('button',name='Trygg hantering i små steg',exact=False).first.click()
        page.get_by_role('button',name='Öppna aktivt steg: Prova en kort beröring',exact=True).click()
        modal=page.get_by_test_id('center-modal-bottom-sheet');modal.get_by_role('button',name='Fortsätt till nästa träningssteg').click()
        expect(modal.get_by_role('heading',name='Prova en kort beröring',exact=True)).to_be_visible()
        if write=='unknown-once':
            modal.get_by_role('button',name='Kontrollera samma träningsändring igen').click()
            expect(modal.get_by_role('heading',name='Låt hunden välja om ni fortsätter',exact=True)).to_be_visible()
            ops=page.evaluate('window.__tasslaTrainingProgressionOperations');assert ops[0]['operationId']==ops[1]['operationId']
        else:
            message=modal.get_by_text('Ändringen kunde inte sparas. Försök igen.',exact=True);message.scroll_into_view_if_needed();expect(message).to_be_visible()
        results.append(write+': no false advance; exact-operation retry verified');page.close()
    for progression in ['empty','paused']:
        page=open_page('screen=training&trainingScenario=feedback&progression='+progression+'&progressionRefresh=delayed')
        page.get_by_role('tab',name='Alla övningar').click();page.get_by_role('button',name='Trygg hantering i små steg',exact=False).first.click()
        label='Starta träningsresa för Trygg hantering i små steg' if progression=='empty' else 'Fortsätt med nästa övning i Trygg hantering i små steg'
        page.get_by_role('button',name=label,exact=True).click()
        expect(page.get_by_test_id('center-modal-bottom-sheet').get_by_role('heading',name='Låt hunden välja kontakt',exact=True)).to_be_visible()
        results.append(progression+': delayed start/resume selects saved first active step');page.close()
    browser.close()
assert not errors,errors
(out/'results.json').write_text(json.dumps({'results':results,'page_errors':errors,'limits':'Synthetic RNWeb with OS/SDK boundary substitution. Physical haptics/native accessibility not verified.'},ensure_ascii=False,indent=2)+'\n')
print('\n'.join(results))

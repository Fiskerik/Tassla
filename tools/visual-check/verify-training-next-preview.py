"""Synthetic RN Web checks for the next-exercise preview and existing action."""
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base=os.environ.get('TASSLA_UI_BASE_URL','http://127.0.0.1:4183').rstrip('/')
out=Path(os.environ.get('TASSLA_UI_EVIDENCE','docs/design/evidence/gap-training-next-preview-01'))
out.mkdir(parents=True,exist_ok=True)
errors=[]
with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    def open_program(query, width=375, height=844):
        page=browser.new_page(viewport={'width':width,'height':height})
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(f'{base}/?screen=training&{query}')
        page.get_by_role('tab',name='Alla övningar').click()
        page.get_by_test_id('training-all-view').get_by_role('button').first.click()
        return page
    for width,height,large in [(320,667,False),(375,844,False),(430,844,False),(375,667,True)]:
        scenario='preview-long' if large else 'preview-valid'
        page=open_program(f'trainingScenario={scenario}&progression=confirmed',width,height)
        page.get_by_role('button',name='Öppna aktivt steg: Utforska i egen takt').click()
        modal=page.get_by_test_id('center-modal-bottom-sheet')
        if large:
            page.evaluate("""() => document.querySelectorAll('[dir=auto]').forEach(e => {const s=getComputedStyle(e);e.style.fontSize=parseFloat(s.fontSize)*1.4+'px';if(s.lineHeight!=='normal')e.style.lineHeight=parseFloat(s.lineHeight)*1.4+'px'})""")
        preview=modal.get_by_test_id('training-next-preview')
        expected='En syntetisk lång övningsrubrik' if large else 'En lugn paus'
        expect(preview).to_contain_text(expected)
        expect(preview).to_have_count(1)
        action=modal.get_by_role('button',name='Fortsätt till nästa träningssteg')
        action.scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        box=preview.bounding_box(); button=action.bounding_box(); assert box and button and box['x']>=0 and box['x']+box['width']<=width and button['height']>=44
        page.screenshot(path=str(out/(f'after-{width}x{height}'+('-text140' if large else '')+'.png')))
        action.click()
        expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 2/3')
        operations=page.evaluate('window.__tasslaTrainingProgressionOperations')
        assert operations[-1]['action']=={'kind':'next','programVersionId':'fixture-training:trygg-start','stepId':'trygg-1'},operations
        page.close()
    for mode in ('pending','unknown'):
        page=open_program(f'trainingScenario=preview-valid&progression=confirmed&completionPending={mode}')
        expect(page.get_by_test_id('training-next-preview')).to_have_count(0)
        page.close()
    page=open_program('trainingScenario=preview-valid&progression=paused')
    expect(page.get_by_test_id('training-next-preview')).to_have_count(0)
    page.close()
    page=open_program('trainingScenario=preview-valid&progression=complete')
    page.get_by_role('button',name='Öppna aktivt steg: Vila nära').click()
    expect(page.get_by_test_id('training-next-preview')).to_have_count(0)
    page.close()
    page=open_program('trainingScenario=preview-invalid&progression=confirmed')
    page.get_by_role('button',name='Öppna aktivt steg: Utforska i egen takt').click()
    expect(page.get_by_test_id('training-next-preview')).to_have_count(0)
    page.close()
    page=open_program('trainingScenario=preview-valid&progression=confirmed&progressionWrite=pending')
    page.get_by_role('button',name='Öppna aktivt steg: Utforska i egen takt').click()
    page.get_by_role('button',name='Fortsätt till nästa träningssteg').click()
    expect(page.get_by_test_id('training-next-preview')).to_have_count(0)
    page.close()
    page=open_program('trainingScenario=preview-valid&progression=confirmed&progressionWrite=unknown-once')
    page.get_by_role('button',name='Öppna aktivt steg: Utforska i egen takt').click()
    page.get_by_role('button',name='Fortsätt till nästa träningssteg').click()
    expect(page.get_by_test_id('center-modal-bottom-sheet').get_by_role('button',name='Kontrollera samma träningsändring igen')).to_be_visible()
    expect(page.get_by_test_id('training-next-preview')).to_have_count(0)
    page.close()
    browser.close()
assert not errors,errors
print('PASS: preview, wrapping, existing action payload, paused/pending/unknown/invalid/final states')

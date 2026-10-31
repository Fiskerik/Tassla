"""Exercise the real manager UI with synthetic callbacks; database checks are separate."""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:5430/app/').rstrip('/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/activity-manager-flow-01/after'))
out.mkdir(parents=True, exist_ok=True)
results, errors = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])

    def open_manager(query='', width=375, height=844):
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}/?screen=checklist&activityManager=true&trainingScenario=feedback&progression=timeline{query}')
        gear = page.get_by_role('button', name='Hantera rutiner och aktiviteter', exact=True)
        (gear if gear.count() else page.get_by_role('button', name='Hantera dagens aktiviteter', exact=True)).click()
        page.wait_for_timeout(500)
        return page, page.get_by_test_id('center-modal-bottom-sheet')

    def capture(page, name, large=False):
        if large:
            page.evaluate("""() => {for(const e of document.querySelectorAll('div,span,input,button')) {
              if(e.tagName==='INPUT'||[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) {
                const s=getComputedStyle(e); e.dataset.originalFont ||= parseFloat(s.fontSize);
                e.dataset.originalLine ||= s.lineHeight==='normal'?'normal':parseFloat(s.lineHeight);
                e.style.fontSize=Number(e.dataset.originalFont)*1.4+'px';
                if(e.dataset.originalLine!=='normal')e.style.lineHeight=Number(e.dataset.originalLine)*1.4+'px';
              }
            }}""")
        page.wait_for_timeout(500)
        assert page.evaluate("document.getElementById('root').scrollWidth <= innerWidth + 1"), name
        page.screenshot(path=str(out / f'{name}.png'))

    def same_frame(first, second):
        assert all(abs(first[key] - second[key]) < 1.1 for key in ['x', 'y', 'width', 'height']), (first, second)

    for width, height, large in [(375, 844, False), (430, 844, False), (375, 667, False), (375, 844, True)]:
        suffix = f'{width}x{height}' + ('-text140' if large else '')
        page, modal = open_manager(width=width, height=height)
        first = modal.bounding_box()
        expect(modal.get_by_role('button', name='Öppna rutin Morgonrutin', exact=True)).to_be_visible()
        expect(modal.get_by_role('button', name=re.compile('^Ta bort rutin '))).to_have_count(0)
        capture(page, f'routines-{suffix}', large)
        modal.get_by_role('tab', name='Träning', exact=True).click()
        expect(modal.get_by_text('Prova en kort beröring', exact=True)).to_be_visible()
        expect(modal.get_by_text('Steg 2 av 3', exact=True)).to_be_visible()
        same_frame(first, modal.bounding_box())
        capture(page, f'training-{suffix}', large)
        modal.get_by_role('button', name='Lägg till Prova en kort beröring för idag', exact=True).click()
        expect(modal.get_by_role('button', name='Ta bort Prova en kort beröring från idag', exact=True)).to_be_visible()
        assert page.evaluate('window.__activityChoiceIds.length') == 1
        assert page.evaluate('(window.__tasslaTrainingProgressionOperations??[]).length') == 0
        capture(page, f'selected-training-{suffix}', large)
        modal.get_by_role('button', name='Ta bort Prova en kort beröring från idag', exact=True).click()
        assert page.evaluate('window.__activityChoiceIds.length') == 0
        modal.get_by_role('tab', name='Rutiner', exact=True).click()
        modal.get_by_role('button', name='Öppna rutin Morgonrutin', exact=True).click()
        modal.get_by_role('button', name='Redigera rutin Morgonrutin', exact=True).click()
        expect(modal.get_by_role('textbox', name='Namn på rutin Morgonrutin', exact=True)).to_be_editable()
        capture(page, f'edit-routine-{suffix}', large)
        action = modal.get_by_role('button', name='Spara rutin Morgonrutin', exact=True)
        action.scroll_into_view_if_needed()
        frame, box = modal.bounding_box(), action.bounding_box()
        assert box['y'] >= frame['y'] and box['y'] + box['height'] <= frame['y'] + frame['height'] + 1
        results.append(f'{suffix}: stable tabs/frame, compact overview/detail/edit, actual step2 select/remove, no progression write, reachable footer')
        page.close()

    page, modal = open_manager('&firstDay=true&state=empty')
    modal.get_by_role('button', name='Skapa en ny rutin', exact=True).click()
    modal.get_by_role('textbox', name='Namn på rutin', exact=True).fill('Morgon')
    modal.get_by_role('textbox', name='Checklistepunkt 1', exact=True).fill('Mat')
    modal.get_by_role('button', name=re.compile('^Välj ikon för Mat\\.')).click()
    modal.get_by_test_id('routine-icon-choice-icon-restaurant-outline').click()
    modal.get_by_role('button', name='Lägg till checklistepunkt sist', exact=True).click()
    modal.get_by_role('textbox', name='Checklistepunkt 2', exact=True).fill('Vatten')
    capture(page, 'create-routine-375x844')
    modal.get_by_role('button', name='Spara rutin', exact=True).click()
    expect(modal.get_by_role('button', name='Öppna rutin Morgon', exact=True)).to_be_visible()
    capture(page, 'created-routine-375x844')
    modal.get_by_role('button', name='Klar', exact=True).click()
    expect(page.get_by_role('button', name='Öppna Rutin Morgon, punkt Mat', exact=True)).to_be_visible()
    results.append('Create own two-item routine with icon, confirmed save and daily-list readback')
    page.close()

    for scenario in ['failed', 'unknown', 'conflict']:
        page, modal = open_manager(f'&routineMutation={scenario}')
        modal.get_by_role('button', name='Öppna rutin Morgonrutin', exact=True).click()
        modal.get_by_role('button', name='Redigera rutin Morgonrutin', exact=True).click()
        field = modal.get_by_role('textbox', name='Namn på rutin Morgonrutin', exact=True)
        field.fill('Min morgon')
        modal.get_by_role('button', name='Spara rutin Morgonrutin', exact=True).click()
        expect(field).to_have_value('Min morgon')
        if scenario == 'failed':
            expect(field).to_be_editable()
            expect(modal.get_by_role('alert')).to_be_visible()
            modal.get_by_role('button', name='Stäng', exact=True).click()
            expect(page.get_by_text('Lämna utan att spara?', exact=True)).to_be_visible()
            page.get_by_role('button', name='Fortsätt redigera', exact=True).click()
            expect(field).to_have_value('Min morgon')
        elif scenario == 'unknown':
            expect(field).not_to_be_editable()
            modal.get_by_role('button', name='Kontrollera samma ändring igen', exact=True).click()
            expect(modal.get_by_text('Min morgon', exact=True)).to_be_visible()
        else:
            expect(field).not_to_be_editable()
            modal.get_by_role('button', name='Ersätt utkastet med senaste versionen', exact=True).click()
            expect(modal.get_by_role('textbox').first).to_be_editable()
        capture(page, f'edit-{scenario}-375x844')
        results.append(f'{scenario}: draft preserved, existing retry/conflict/dirty guards retained')
        page.close()

    page, modal = open_manager('&progressionRead=error')
    modal.get_by_role('tab', name='Träning', exact=True).click()
    expect(modal.get_by_text('Träningen behöver kontrolleras. Öppna Träning och försök igen.', exact=True)).to_be_visible()
    expect(modal.get_by_role('button', name=re.compile('^Lägg till .+ för idag$'))).to_have_count(0)
    capture(page, 'training-unknown-375x844')
    results.append('Unknown progression gives no guessed training choice')
    page.close()
    browser.close()

assert not errors, errors
(out / 'results.json').write_text(json.dumps({'results': results, 'page_errors': errors, 'limits': 'Synthetic RN Web; CSS140 is not native Dynamic Type; SQL tested separately'}, ensure_ascii=False, indent=2) + '\n')
print('\n'.join(results))

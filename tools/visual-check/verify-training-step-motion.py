"""Exercise actual training navigation in the synthetic RN Web fixture."""
import json
import os
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base = os.environ['TASSLA_UI_BASE_URL'].rstrip('/')
out = Path('docs/design/evidence/training-step-motion-01')
out.mkdir(parents=True, exist_ok=True)
results = []
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    for reduced in (False, True):
        page = browser.new_page(viewport={'width': 375, 'height': 844}, reduced_motion='reduce' if reduced else 'no-preference')
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/?screen=training&trainingScenario=unstarted&progression=confirmed')
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_test_id('training-all-view').get_by_role('button').first.click()
        page.get_by_role('button', name='Öppna aktivt steg: Utforska i egen takt').click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        expect(modal).to_be_visible()
        page.wait_for_timeout(400)
        page.screenshot(path=str(out / ('before-reduced.png' if reduced else 'before.png')))
        page.evaluate('''() => { window.__motionSamples = []; const started = performance.now();
          function sample() { const modal = document.querySelector('[data-testid="center-modal-bottom-sheet"]');
            const node = modal?.querySelector('[data-testid="training-step-transition"]');
            const step = modal?.querySelector('[data-testid="training-exercise-step-position"]');
            if (node) window.__motionSamples.push({time: performance.now()-started, step: step?.textContent,
              transform: getComputedStyle(node).transform, opacity: getComputedStyle(node).opacity});
            if (performance.now()-started < 900) requestAnimationFrame(sample);
          } requestAnimationFrame(sample); }''')
        modal.get_by_role('button', name='Fortsätt till nästa träningssteg').click()
        expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 2/3')
        expect(modal.get_by_role('heading', name='En lugn paus', exact=True)).to_be_visible()
        page.screenshot(path=str(out / ('next-reduced.png' if reduced else 'next.png')))
        page.wait_for_timeout(500)
        samples = [sample for sample in page.evaluate('window.__motionSamples') if sample['step'] == 'Steg 2/3']
        assert samples, 'No samples of the new step'
        faded = [sample for sample in samples if float(sample['opacity']) < 0.999]
        assert bool(faded) != reduced, (reduced, samples)
        assert all(sample['transform'] in ('none', 'matrix(1, 0, 0, 1, 0, 0)') for sample in samples), samples
        (out / ('samples-reduced.json' if reduced else 'samples.json')).write_text(json.dumps(samples, indent=2) + '\n')
        page.evaluate('''() => { window.__backSamples = []; const started=performance.now(); function sample() {
          const m=document.querySelector('[data-testid="center-modal-bottom-sheet"]');
          const n=m?.querySelector('[data-testid="training-step-transition"]');
          const s=m?.querySelector('[data-testid="training-exercise-step-position"]');
          if(n) window.__backSamples.push({step:s?.textContent, opacity:getComputedStyle(n).opacity, transform:getComputedStyle(n).transform});
          if(performance.now()-started<900) requestAnimationFrame(sample);
        } requestAnimationFrame(sample); }''')
        modal.get_by_role('button', name='Backa till föregående träningssteg').click()
        expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 1/3')
        expect(modal.get_by_role('heading', name='Utforska i egen takt', exact=True)).to_be_visible()
        page.screenshot(path=str(out / ('back-reduced.png' if reduced else 'back.png')))
        page.wait_for_timeout(500)
        back_samples = [sample for sample in page.evaluate('window.__backSamples') if sample['step'] == 'Steg 1/3']
        assert back_samples and bool([s for s in back_samples if float(s['opacity']) < 0.999]) != reduced, back_samples
        assert all(s['transform'] in ('none', 'matrix(1, 0, 0, 1, 0, 0)') for s in back_samples)
        (out / ('back-samples-reduced.json' if reduced else 'back-samples.json')).write_text(json.dumps(back_samples, indent=2) + '\n')
        modal.get_by_role('button', name='Stäng', exact=True).click()
        expect(modal).to_have_count(0)
        page.get_by_role('button', name='Öppna aktivt steg: Utforska i egen takt').click()
        expect(page.get_by_test_id('center-modal-bottom-sheet')).to_be_visible()
        assert page.get_by_test_id('training-step-transition').evaluate('(n) => getComputedStyle(n).opacity') == '1'
        results.append(f"{'reduced' if reduced else 'standard'}: confirmed next and back")
        page.close()
    for mode in ('failed', 'unknown-once', 'delayed'):
        page = browser.new_page(viewport={'width': 375, 'height': 667})
        page.on('pageerror', lambda error: errors.append(str(error)))
        query = '&progressionRefresh=delayed' if mode == 'delayed' else '&progressionWrite=' + mode
        page.goto(base + '/?screen=training&trainingScenario=unstarted&progression=confirmed' + query)
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_test_id('training-all-view').get_by_role('button').first.click()
        page.get_by_role('button', name='Öppna aktivt steg: Utforska i egen takt').click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        page.wait_for_timeout(400)
        modal.get_by_role('button', name='Fortsätt till nästa träningssteg').click()
        if mode == 'failed':
            expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 1/3')
            expect(modal.get_by_text('Ändringen kunde inte sparas. Försök igen.', exact=True)).to_be_visible()
            assert modal.get_by_test_id('training-step-transition').evaluate('(n) => getComputedStyle(n).opacity') == '1'
        elif mode == 'unknown-once':
            expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 1/3')
            assert modal.get_by_test_id('training-step-transition').evaluate('(n) => getComputedStyle(n).opacity') == '1'
            modal.get_by_role('button', name='Kontrollera samma träningsändring igen').click()
            expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 2/3')
        else:
            close = modal.get_by_role('button', name='Stäng', exact=True)
            close.focus()
            expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 2/3')
            assert close.evaluate('(n) => document.activeElement === n'), 'Late readback stole deliberate focus'
        page.screenshot(path=str(out / f'{mode}-375x667.png'))
        results.append(f'{mode}: only verified readback changes step')
        page.close()
    for enlarged in (False, True):
        page = browser.new_page(viewport={'width': 375, 'height': 667})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/?screen=training&trainingScenario=motion-long&progression=confirmed')
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_test_id('training-all-view').get_by_role('button').first.click()
        page.get_by_role('button', name='Öppna aktivt steg: Utforska i egen takt').click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        page.wait_for_timeout(400)
        if enlarged:
            page.evaluate("""() => document.querySelectorAll('[dir=auto]').forEach(e => {const s=getComputedStyle(e);e.style.fontSize=parseFloat(s.fontSize)*1.4+'px';if(s.lineHeight!=='normal')e.style.lineHeight=parseFloat(s.lineHeight)*1.4+'px'})""")
        def scroll_top():
            return modal.evaluate("""m => {const n=[...m.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 1 && ['auto','scroll'].includes(getComputedStyle(e).overflowY)); return n ? n.scrollTop : -1;}""")
        action = modal.get_by_role('button', name='Fortsätt till nästa träningssteg')
        action.scroll_into_view_if_needed()
        assert scroll_top() > 0, f'Long first instruction was not scrolled: {scroll_top()}'
        action.focus()
        assert action.evaluate('(n) => document.activeElement === n')
        page.keyboard.press('Enter')
        expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 2/3')
        assert scroll_top() == 0, f'New instruction should begin at top: {scroll_top()}'
        expect(modal.get_by_text('Syntetiskt läsprov för steg 2.', exact=True)).to_be_in_viewport()
        back = modal.get_by_role('button', name='Backa till föregående träningssteg')
        back.scroll_into_view_if_needed()
        assert scroll_top() > 0
        back.click()
        expect(modal.get_by_test_id('training-exercise-step-position')).to_have_text('Steg 1/3')
        assert scroll_top() == 0
        expect(modal.get_by_text('Syntetiskt läsprov för steg 1.', exact=True)).to_be_in_viewport()
        page.screenshot(path=str(out / ('long-text140.png' if enlarged else 'long-back.png')))
        results.append(f"{'140% text' if enlarged else 'standard text'}: long instructions return to top in both directions")
        page.close()
    browser.close()

assert not errors, errors
(out / 'results.json').write_text(json.dumps({'results': results, 'errors': errors,
    'limits': 'Synthetic RN Web; native VoiceOver, Dynamic Type and live backend untested.'}, ensure_ascii=False, indent=2) + '\n')
print('\n'.join(results))

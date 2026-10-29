"""Synthetic RN Web checks; no backend calls or native-device claims."""
import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:5429').rstrip('/')
out = Path('docs/design/evidence/ui-mvp-build-feedback-01/final')
out.mkdir(parents=True, exist_ok=True)
results, errors = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])

    def open_page(route, width=375, height=844, large=False):
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(f'{base}/{route}')
        page.wait_for_timeout(350)
        return page

    def capture(page, name):
        page.wait_for_timeout(500)
        if name.endswith('text140'):
            page.evaluate("""() => {for(const e of document.querySelectorAll('div,span,input,button')) {
              if([...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) {
                const s=getComputedStyle(e);
                e.dataset.feedbackFont ||= parseFloat(s.fontSize);
                e.dataset.feedbackLine ||= s.lineHeight==='normal'?'normal':parseFloat(s.lineHeight);
                e.style.fontSize=Number(e.dataset.feedbackFont)*1.4+'px';
                if(e.dataset.feedbackLine!=='normal')e.style.lineHeight=Number(e.dataset.feedbackLine)*1.4+'px';
              }
            }}""")
        assert page.evaluate("document.getElementById('root').scrollWidth <= innerWidth + 1"), name
        page.screenshot(path=str(out / f'{name}.png'))

    for width, height, large in [(375, 844, False), (430, 844, False), (375, 667, False), (375, 844, True)]:
        suffix = f'{width}x{height}' + ('-text140' if large else '')
        page = open_page('app/?screen=training&trainingScenario=feedback&progression=active', width, height)
        page.get_by_role('tab', name='Alla övningar').click()
        page.get_by_role('button', name='Trygg hantering i små steg', exact=False).click()
        page.get_by_role('button', name='Öppna aktivt steg:', exact=False).click()
        modal = page.get_by_test_id('center-modal-bottom-sheet')
        expect(modal.get_by_test_id('training-exercise-goal')).to_be_visible()
        expect(modal.get_by_text('Steg för steg', exact=True)).to_be_visible()
        expect(modal.get_by_text('Försök inte locka den närmare om den väljer att gå undan.', exact=True)).to_be_visible()
        capture(page, f'training-{suffix}')
        action = modal.get_by_role('button', name='Logga ett träningspass för', exact=False)
        action.scroll_into_view_if_needed()
        action.click()
        modal.get_by_role('radio', name='Gick som planerat', exact=True).click()
        modal.get_by_role('button', name='Spara träningspass', exact=True).click()
        confirm = modal.get_by_role('button', name='Bekräfta delmålet för', exact=False)
        expect(confirm).to_be_visible()
        confirm.click()
        expect(modal.get_by_text('Klart', exact=True)).to_be_visible()
        expect(modal.get_by_role('button', name='Ångra', exact=False)).to_be_visible()
        modal.get_by_role('button', name='Fortsätt till nästa träningssteg', exact=True).click()
        modal.get_by_role('button', name='Stäng', exact=True).click()
        page.get_by_role('button', name='Öppna aktivt steg: Prova en kort beröring', exact=True).click()
        expect(modal.get_by_text('Prova en kort beröring', exact=True)).to_be_visible()
        clarification = modal.get_by_text('Med steg 1 avses övningen Låt hunden välja kontakt.', exact=True)
        clarification.scroll_into_view_if_needed()
        expect(clarification).to_be_visible()
        capture(page, f'training-scrolled-{suffix}')
        results.append(f'{suffix}: goal/numbered original instructions, save, explicit milestone, next, clarification reachable')
        page.close()

        page = open_page('panels/?screen=development', width, height, large)
        photo = page.get_by_test_id('development-hero').bounding_box()
        arc = page.get_by_test_id('development-age-journey').bounding_box()
        assert arc['y'] >= photo['y'] + photo['height']
        expect(page.get_by_test_id('development-age-progress')).to_be_visible()
        capture(page, f'development-{suffix}')
        page.close()

        page = open_page('panels/?screen=home', width, height, large)
        phase = page.get_by_test_id('home-development-phase')
        expect(phase.get_by_text('valp', exact=True)).to_be_visible()
        box = phase.bounding_box()
        assert box['height'] >= 44 and box['width'] >= 44
        capture(page, f'home-{suffix}')
        page.close()

        page = open_page('app/?screen=account', width, height, large)
        title = page.get_by_role('heading', name='Kontoradering', exact=True)
        trash = page.get_by_role('button', name='Radera konto', exact=True)
        a, b = title.bounding_box(), trash.bounding_box()
        assert b['x'] > a['x'] + a['width'] - 1 and abs(a['y'] + a['height']/2 - b['y'] - b['height']/2) < 2
        assert b['width'] >= 44 and b['height'] >= 44
        capture(page, f'account-{suffix}')
        if large or height == 667:
            trash.scroll_into_view_if_needed()
            capture(page, f'account-scrolled-{suffix}')
        assert page.evaluate('window.__tasslaAccountDeleteCalls') == 0
        page.close()

    page = open_page('app/?screen=account&state=unknown')
    expect(page.get_by_role('button', name='Radera konto', exact=True)).to_be_disabled()
    capture(page, 'account-unknown-375x844')
    assert page.evaluate('window.__tasslaAccountDeleteCalls') == 0
    page.close()
    results.append('Account unknown state stays disabled; no deletion request made')

    page = open_page('app/?screen=knowledge&sourceFixture=true')
    page.get_by_role('button', name='Läs Första veckan hemma', exact=True).first.click()
    sources = page.get_by_test_id('article-references')
    sources.scroll_into_view_if_needed()
    link = sources.get_by_role('link').first
    assert len(link.inner_text()) > 8 and link.bounding_box()['height'] >= 44
    page.evaluate('window.__sourceUrls=[];window.open=(url)=>{if(url)window.__sourceUrls.push(url);return null;}')
    link.click()
    expect(page.get_by_text('Källan öppnades.', exact=True)).to_have_count(0)
    page.wait_for_function('window.__sourceUrls.length === 1')
    capture(page, 'sources-375x844')
    page.evaluate('window.open=(url)=>{if(url)throw new Error("synthetic link error");return null;}')
    link.click()
    expect(page.get_by_text('Källan kunde inte öppnas just nu. Du kan försöka igen.', exact=True)).to_be_visible()
    page.evaluate('window.open=()=>null')
    link.click()
    expect(page.get_by_text('Källan kunde inte öppnas just nu. Du kan försöka igen.', exact=True)).to_have_count(0)
    unknown = sources.get_by_role('link', name='Öppna källa: example.org', exact=True)
    unknown.scroll_into_view_if_needed()
    expect(unknown).to_be_visible()
    expect(sources.get_by_text('docs/source.md', exact=True)).to_have_count(1)
    expect(sources.get_by_role('link', name='docs/source.md', exact=False)).to_have_count(0)
    expect(page.get_by_role('tab', name='Kunskap', exact=True)).to_have_attribute('aria-selected', 'true')
    page.close()
    results.append('Titled source links open exact URL; no success noise; failure visible and cleared after success')
    browser.close()

assert not errors, errors
(out / 'results.json').write_text(json.dumps({'results': results, 'page_errors': errors, 'limits': 'Synthetic RN Web, not native or live backend'}, ensure_ascii=False, indent=2) + '\n')
print('\n'.join(results))

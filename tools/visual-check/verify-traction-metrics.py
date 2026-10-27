from pathlib import Path
from playwright.sync_api import expect, sync_playwright

base='http://127.0.0.1:49152/'
out=Path('docs/design/evidence/traction-metrics-01'); out.mkdir(parents=True,exist_ok=True)
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height in [(320,667),(375,844),(430,844)]:
        page=browser.new_page(viewport={'width':width,'height':height}); page.on('pageerror',lambda err:errors.append(str(err)))
        page.goto(base+'?screen=profile-create')
        if width==320:
            page.evaluate("""() => {document.querySelectorAll('*').forEach(el => {if(el.children.length)return;const s=getComputedStyle(el);const f=parseFloat(s.fontSize);const l=parseFloat(s.lineHeight);if(Number.isFinite(f))el.style.fontSize=(f*1.4)+'px';if(Number.isFinite(l))el.style.lineHeight=(l*1.4)+'px';});}""")
        toggle=page.get_by_role('switch',name='Tillåt frivillig användningsmätning')
        expect(toggle).to_be_enabled(); expect(toggle).not_to_be_checked()
        assert page.evaluate('window.__tasslaMetricsFixture.events')==[]
        toggle.scroll_into_view_if_needed();page.screenshot(path=str(out/f'onboarding-metrics-{width}.png'))
        toggle.click();expect(toggle).to_be_checked()
        page.wait_for_function("window.__tasslaMetricsFixture.events.includes('onboarding_opened')")
        assert 'referral_opened' not in page.evaluate('window.__tasslaMetricsFixture.events')
        toggle.click();expect(toggle).not_to_be_checked()
        assert page.evaluate('window.__tasslaMetricsFixture.events')==[]
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.close()
    page=browser.new_page(viewport={'width':375,'height':844})
    page.goto(base+'?screen=metrics-fixture')
    toggle=page.get_by_role('switch',name='Tillåt frivillig användningsmätning');expect(toggle).to_be_enabled()
    assert page.evaluate('window.__tasslaMetricsFixture.events')==[]
    toggle.click();page.wait_for_function("window.__tasslaMetricsFixture.events.includes('referral_opened')")
    assert set(page.evaluate('window.__tasslaMetricsFixture.events'))=={'referral_opened','onboarding_opened'}
    page.goto(base+'?screen=profile-create&metricsScenario=error')
    expect(page.get_by_text('Vi kunde inte kontrollera valet. Du kan fortsätta skapa profilen.')).to_be_visible()
    expect(page.get_by_role('switch',name='Tillåt frivillig användningsmätning')).to_be_disabled()
    assert page.evaluate('window.__tasslaMetricsFixture.events')==[]
    page.goto(base+'?screen=profile-create&metricsScenario=slow-retry')
    retry=page.get_by_role('button',name='Försök kontrollera mätning igen')
    expect(retry).to_be_enabled();retry.click();expect(retry).to_be_disabled()
    toggle=page.get_by_role('switch',name='Tillåt frivillig användningsmätning')
    expect(toggle).to_be_disabled();expect(toggle).to_be_enabled()
    toggle.click();expect(toggle).to_be_checked()
    page.wait_for_function("window.__tasslaMetricsFixture.events.includes('onboarding_opened')")
    assert page.evaluate("window.__tasslaMetricsFixture.calls.filter(call => call === 'get_beta_metrics_consent').length") == 2
    page.close();browser.close()
assert not errors, errors
print('PASS: onboarding consent, referral event, withdrawal and error state at 320/375/430; synthetic data')

"""Render the actual article reader/profile components with canonical article fixtures."""
from pathlib import Path
import json
import os
import re
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4281/')
OUT = Path(os.environ.get('TASSLA_VISUAL_OUT', 'docs/design/evidence/drive-articles-2026-10-24'))
OUT.mkdir(parents=True, exist_ok=True)
results, errors, image_ratios = [], [], []
os.environ.setdefault('XDG_CONFIG_HOME', '/tmp/tassla-chrome-config')


def visible_image_frame(image):
    """Measure the clipped card frame, not the zoomed source image inside it."""
    return image.locator('xpath=../../..')


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                               args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'])
    page = browser.new_page(viewport={'width': 375, 'height': 844}, device_scale_factor=1)
    page.on('pageerror', lambda e: errors.append(str(e)))
    for width in [375, 430]:
        page.set_viewport_size({'width': width, 'height': 844})
        for name, sex in [('Nemo', 'male'), ('Nala', 'female'), ('Max', '')]:
            page.goto(f'{BASE}?screen=knowledge&articleFixture=true&dogName={name}&sex={sex}')
            expect(page.get_by_role('button', name='Alla artiklar', exact=True)).to_be_visible()
            page.get_by_role('button', name='Alla artiklar', exact=True).click()
            expect(page.get_by_role('button', name='Läs Första dygnet hemma', exact=True)).to_be_visible()
            guide_cards = page.get_by_role('button', name=re.compile(r'^Läs '))
            assert guide_cards.count() == 3, f'expected three article cards, got {guide_cards.count()}'
            featured_box = visible_image_frame(guide_cards.nth(0).locator('img')).bounding_box()
            assert featured_box and featured_box['width'] > 0
            featured_ratio = featured_box['height'] / featured_box['width']
            assert 0.54 <= featured_ratio <= 0.58
            secondary_ratios = []
            for index in (1, 2):
                image_box = visible_image_frame(guide_cards.nth(index).locator('img')).bounding_box()
                assert image_box and image_box['width'] > 0
                ratio = image_box['height'] / image_box['width']
                assert 0.70 <= ratio <= 0.80, f'secondary article image is too tall: {ratio:.2f}'
                secondary_ratios.append(round(ratio, 3))
            page.screenshot(path=str(OUT / f'library-{name}-{width}.png'), full_page=True)
            page.get_by_role('button', name='Läs Första dygnet hemma', exact=True).click()
            expect(page.get_by_text('Den har lämnat sin mamma, sina syskon', exact=False)).to_be_visible()
            hero_box = visible_image_frame(page.locator('img').first).bounding_box()
            assert hero_box and hero_box['width'] > 0
            hero_ratio = hero_box['height'] / hero_box['width']
            assert 0.54 <= hero_ratio <= 0.58
            image_ratios.append({'viewport': width, 'featured': round(featured_ratio, 3), 'secondary': secondary_ratios, 'article': round(hero_ratio, 3)})
            assert '{{dog.' not in page.locator('body').inner_text()
            page_text = page.locator('body').inner_text()
            assert name not in page_text, f'profile name {name} leaked into article copy'
            assert not re.search(r'\b(han|hon|honom|henne)\b', page_text, re.IGNORECASE)
            assert 'KLASSIFICERING' not in page.locator('body').inner_text()
            assert '09_valpsakra' not in page.locator('body').inner_text()
            page.screenshot(path=str(OUT / f'article-{name}-{width}.png'), full_page=True)
            page.get_by_text('Följ valpens rytm', exact=True).scroll_into_view_if_needed()
            expect(page.get_by_text('Erbjud rastning efter sömn, mat och lek.', exact=False)).to_be_visible()
            page.screenshot(path=str(OUT / f'article-end-{name}-{width}.png'))
            results.append(f'{name}/{sex or "unset"}: library + generic full article at {width}')
        page.goto(f'{BASE}?screen=profile-create&articleFixture=true')
        expect(page.get_by_label('Förväntad hemkomst (valfritt), år-månad-dag')).to_be_visible()
        field = page.get_by_label('Förväntad hemkomst (valfritt), år-månad-dag')
        assert field.input_value() == ''
        field.fill('2026-12-15')
        page.get_by_role('button', name='Ta bort förväntat hemkomstdatum', exact=True).click()
        assert field.input_value() == ''
        page.get_by_role('radio', name='Tik', exact=True).click()
        expect(page.get_by_role('radio', name='Tik', exact=True)).to_have_attribute('aria-checked', 'true')
        page.get_by_role('radio', name='Inte angivet', exact=True).click()
        page.screenshot(path=str(OUT / f'registration-{width}.png'), full_page=True)
        page.goto(f'{BASE}?screen=profile-edit&articleFixture=true&dogName=Nala&sex=female')
        expect(page.get_by_label('Förväntad hemkomst (valfritt), år-månad-dag')).to_have_value('2026-12-15')
        expect(page.get_by_role('radio', name='Tik', exact=True)).to_have_attribute('aria-checked', 'true')
        page.screenshot(path=str(OUT / f'profile-{width}.png'), full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        results.append(f'optional date/sex and clearing at {width}; profile readback fixture')
    page.goto(f'{BASE}?screen=knowledge&articleFixture=true&dogName=Nala&sex=female')
    page.get_by_role('button', name='Alla artiklar', exact=True).click()
    page.get_by_role('button', name='Läs Första dygnet hemma', exact=True).click()
    page.evaluate("""() => {
      const text = [...document.querySelectorAll('div,span,input')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
      const sizes = text.map(e => parseFloat(getComputedStyle(e).fontSize));
      text.forEach((e,i) => e.style.setProperty('font-size', (sizes[i] * 1.4) + 'px', 'important'));
    }""")
    page.screenshot(path=str(OUT / 'article-large-text-430.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    page.goto(f'{BASE}?screen=knowledge&articleFixture=true&unassignedArticle=true')
    page.get_by_role('button', name='Alla artiklar', exact=True).click()
    generic = page.get_by_role('button', name='Läs Syntetisk guide', exact=True)
    generic.scroll_into_view_if_needed()
    assert generic.locator('img').count() > 0
    page.screenshot(path=str(OUT / 'library-generic-guide-430.png'))
    generic.click()
    expect(page.get_by_text('Syntetisk guide', exact=True)).to_be_visible()
    page.screenshot(path=str(OUT / 'article-generic-guide-430.png'))
    results.append('unassigned guide uses editorial images and shared reader style')
    for state in ['loading', 'error', 'empty']:
        page.goto(f'{BASE}?screen=knowledge&articleFixture=true&state={state}')
        if state == 'error':
            expect(page.get_by_role('button', name='Försök igen', exact=True)).to_be_visible()
        if state == 'empty':
            page.get_by_role('button', name='Alla artiklar', exact=True).click()
            expect(page.get_by_text('Inga artiklar är publicerade ännu.', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / f'library-{state}-430.png'))
        results.append('library state ' + state)
    assert not errors, errors
    browser.close()
(OUT / 'results.json').write_text(json.dumps({'results': results, 'errors': errors, 'image_ratios_height_over_width': image_ratios, 'limits': 'synthetic React Native Web; no live Supabase, signed build or native accessibility proof'}, ensure_ascii=False, indent=2)+'\n')
print('PASS', len(results), 'article/profile render scenarios')

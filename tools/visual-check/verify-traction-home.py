from datetime import datetime, timezone
from pathlib import Path
import os

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4386/')
out = Path(os.environ.get('TASSLA_UI_EVIDENCE', 'docs/design/evidence/traction-home-next-step-01'))
out.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
                                         args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'])
    for width in (375, 430):
        page = browser.new_page(viewport={'width': width, 'height': 844}, device_scale_factor=1)
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.clock.install(time=datetime(2026, 10, 26, 18, 0, tzinfo=timezone.utc))
        page.goto(f'{base}?screen=home&homeScenario=next-step&trainingScenario=unstarted&progression=empty&today=2026-10-25')
        suggestion = page.get_by_role('button', name='Visa träningen Trygg vardagsstart, Utforska i egen takt')
        expect(suggestion).to_be_visible()
        expect(page.get_by_text('Förslag på nästa steg', exact=True)).to_be_visible()
        expect(page.get_by_test_id('home-reflection').get_by_text('Senast loggat: Mat · 25 oktober')).to_be_visible()
        box = suggestion.bounding_box()
        assert box and box['height'] >= 44 and box['width'] >= 44
        assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
        page.screenshot(path=str(out / f'next-step-{width}.png'))
        suggestion.click()
        expect(page.get_by_role('heading', name='Trygg vardagsstart')).to_be_visible()
        expect(page.get_by_role('button', name='Starta träningsresa för Trygg vardagsstart')).to_be_visible()
        page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 844})
    for query in ('progressionRead=error', 'suggestionPending=unknown', 'progression=confirmed'):
        page.goto(f'{base}?screen=home&homeScenario=next-step&{query}')
        expect(page.get_by_role('button', name='Visa träningen Trygg vardagsstart, Utforska i egen takt')).to_have_count(0)
    expect(page.get_by_role('button', name='Fortsätt träningsresan: Trygg vardagsstart, Utforska i egen takt. 1 loggat pass, 1 delmål bekräftat av dig.')).to_be_visible()
    page.goto(f'{base}?screen=home&state=empty')
    expect(page.get_by_test_id('home-reflection').get_by_text('När ni loggar en händelse syns den här.')).to_be_visible()
    page.goto(f'{base}?screen=home&state=error')
    expect(page.get_by_test_id('home-reflection').get_by_text('Historiken kunde inte hämtas just nu.')).to_be_visible()
    page.goto(f'{base}?screen=home&reflectionPending=unknown')
    expect(page.get_by_test_id('home-reflection').get_by_text('En ändring i loggen behöver kontrolleras.')).to_be_visible()
    expect(page.get_by_test_id('home-reflection').get_by_text('Senast loggat:', exact=False)).to_have_count(0)
    page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 667})
    page.goto(f'{base}?screen=home&homeScenario=next-step&trainingScenario=unstarted&progression=empty')
    page.evaluate('''() => {
      const rows = [...document.querySelectorAll('*')]
        .filter(n => [...n.childNodes].some(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim()))
        .map(n => { const s = getComputedStyle(n); return [n, parseFloat(s.fontSize), parseFloat(s.lineHeight)]; });
      for (const [node, size, line] of rows) {
        if (Number.isFinite(size)) node.style.fontSize = `${size * 1.4}px`;
        if (Number.isFinite(line)) node.style.lineHeight = `${line * 1.4}px`;
      }
    }''')
    suggestion = page.get_by_role('button', name='Visa träningen Trygg vardagsstart, Utforska i egen takt')
    suggestion.scroll_into_view_if_needed()
    box = suggestion.bounding_box()
    navigation = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    assert box and navigation and box['y'] + box['height'] <= navigation['y'] + 1
    assert page.evaluate("document.getElementById('root').scrollWidth <= document.getElementById('root').clientWidth + 1")
    page.screenshot(path=str(out / 'next-step-375x667-large-text.png'))
    page.close()

    review_base = os.environ.get('TASSLA_UI_REVIEW_BASE_URL')
    if review_base:
        for width in (375, 430):
            page = browser.new_page(viewport={'width': width, 'height': 844})
            page.goto(f'{review_base}?screen=home&homeScenario=product-daily&progression=confirmed')
            expect(page.get_by_text('3/7 · Framsteg', exact=True)).to_be_visible()
            for label in ('Kissa', 'Fyll på vatten', 'Ta på sele'):
                expect(page.get_by_text(label, exact=True)).to_be_visible()
            expect(page.get_by_text('Gå en kort runda', exact=True)).to_have_count(0)
            nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
            for label in ('Öppna Logga', 'Öppna Träna', 'Öppna Kunskap'):
                box = page.get_by_role('button', name=label, exact=True).bounding_box()
                assert nav and box and box['y'] + box['height'] <= nav['y'] + 1, f'{label} is covered by navigation: {box}, {nav}'
            page.screenshot(path=str(out / f'full-day-journey-{width}-compact.png'))
            page.get_by_role('button', name='Öppna Checklistor', exact=True).click()
            expect(page.get_by_text('Gå en kort runda', exact=True)).to_be_visible()
            expect(page.get_by_text('Torka tassar', exact=True)).to_be_visible()
            expect(page.get_by_text('Utforska i egen takt', exact=True)).to_be_visible()
            page.close()
    browser.close()

assert not errors, errors
print('PASS: age-matched suggestion and saved-event reflection, 375/430 px and 375x667 at 140% text, correct route, error/unknown/existing journey and empty states, 44 pt target, no horizontal overflow or page errors')

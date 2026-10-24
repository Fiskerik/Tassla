from datetime import datetime, timezone
from pathlib import Path
import json
import re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/design/KNOW-02/evidence'
BASE = 'http://127.0.0.1:4173/know02/'
OUT.mkdir(parents=True, exist_ok=True)
PASSES = []
FAILURES = []
PAGE_ERRORS = []


def check(condition, name):
    if not condition:
        FAILURES.append(name)
        raise AssertionError(name)
    PASSES.append(name)


def wait_ready(page):
    page.get_by_text(re.compile(r'\d+ av \d+ genomförda')).first.wait_for(timeout=5000)


def open_template(page, label='Första dagarna hemma'):
    name = f'Öppna {label}, föreslagen fas' if label == 'Första dagarna hemma' else f'Öppna {label}'
    target = page.get_by_role('button', name=name)
    target.wait_for(timeout=5000)
    target.click(position={'x': 10, 'y': 10})
    page.get_by_role('progressbar').wait_for(timeout=5000)


def scroll_top(page):
    page.evaluate("() => [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 20).forEach(el => { el.scrollTop = 0; })")


def no_horizontal_overflow(page):
    return page.evaluate("""() => {
      if (document.documentElement.scrollWidth > innerWidth) return false;
      return [...document.querySelectorAll('*')].every(el => {
        const style = getComputedStyle(el);
        return style.display === 'none' || el.scrollWidth <= el.clientWidth + 1 || style.overflowX === 'auto' || style.overflowX === 'scroll';
      });
    }""")


def screenshot(page, name):
    scroll_top(page)
    page.screenshot(path=str(OUT / name))


def checkbox_mark(page, label):
    return page.get_by_role('checkbox', name=label).locator('[dir="auto"]').first.inner_text()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    for width in (375, 430):
        page = browser.new_page(viewport={'width': width, 'height': 844}, device_scale_factor=1)
        page.clock.install(time=datetime(2026, 10, 11, 15, 0, tzinfo=timezone.utc))
        page.on('pageerror', lambda error: PAGE_ERRORS.append(str(error)))
        page.goto(f'{BASE}?screen=knowledge')
        page.get_by_role('tab', name='Checklistor').wait_for(timeout=5000)
        check(no_horizontal_overflow(page), f'Knowledge tab overview has no horizontal overflow at {width}px')
        screenshot(page, f'knowledge-{width}.png')

        page.goto(f'{BASE}?screen=checklist-overview')
        wait_ready(page)
        check('Valt: Första dagarna hemma' in page.locator('body').inner_text(), f'Preference is shown at {width}px')
        check('1 av 4 genomförda' in page.locator('body').inner_text(), f'Overview count includes saved preset and custom row at {width}px')
        check(no_horizontal_overflow(page), f'Checklist overview has no horizontal overflow at {width}px')
        screenshot(page, f'checklist-overview-{width}.png')

        open_template(page)
        check('1 av 4 genomförda' in page.locator('body').inner_text(), f'Detail progress count at {width}px')
        check(no_horizontal_overflow(page), f'Checklist detail has no horizontal overflow at {width}px')
        screenshot(page, f'checklist-detail-{width}.png')

        if width == 375:
            before_mark = checkbox_mark(page, 'Boka valpkurs')
            page.get_by_role('checkbox', name='Boka valpkurs').click()
            page.get_by_text('2 av 4 genomförda').wait_for(timeout=3000)
            check(checkbox_mark(page, 'Boka valpkurs') != before_mark, 'Own checklist item toggles directly and updates progress')
            screenshot(page, 'checklist-custom-checked-375.png')

    # Context preference, explicit age recommendation, and pre-homecoming under eight weeks.
    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.goto(f'{BASE}?screen=checklist-overview')
    wait_ready(page)
    page.get_by_role('button', name='Välj Före hemkomst').click()
    page.get_by_text('Valt: Före hemkomst').wait_for(timeout=3000)
    check('Passar ert val' in page.locator('body').inner_text(), 'Choosing a context updates the recommended phase only after save')
    page.get_by_role('button', name='Välj Efter ålder').click()
    page.get_by_text('Valt: Efter ålder').wait_for(timeout=3000)
    check(page.get_by_role('button', name='Öppna 8–12 veckor, föreslagen fas').count() == 1, 'Age-based phase is recommended for ten weeks')
    screenshot(page, 'checklist-context-age-375.png')
    page.goto(f'{BASE}?screen=checklist-overview&state=empty&ageWeeks=4')
    wait_ready(page)
    page.get_by_role('button', name='Välj Efter ålder').click()
    page.get_by_text('Valt: Efter ålder').wait_for(timeout=3000)
    check('Passar ert val' in page.locator('body').inner_text() and 'Inför hemkomsten' in page.locator('body').inner_text(), 'Under eight weeks recommends preparation without an arrival date')
    screenshot(page, 'checklist-under-eight-weeks-375.png')

    # FAQ phase filtering and expansion.
    page.goto(f'{BASE}?screen=faq')
    page.get_by_role('button', name='När passar en valpkurs?, visa svar').wait_for(timeout=5000)
    page.get_by_role('button', name='Frågor: Första dagarna hemma').click()
    question = page.get_by_role('button', name='Hur kan första natten bli lugnare?, visa svar')
    question.wait_for(timeout=3000)
    question.click(position={'x': 40, 'y': 25})
    page.get_by_text(re.compile('Ordna en trygg sovplats')).wait_for(timeout=3000)
    check('Ordna en trygg sovplats nära familjen' in page.locator('body').inner_text(), 'FAQ expands an answer for the selected phase')
    screenshot(page, 'faq-expanded-375.png')

    # Home cards open stable destinations through the same ID contract.
    page.goto(f'{BASE}?screen=home-carousel')
    checklist_home = page.get_by_role('button', name=re.compile('Checklistor för valptiden'))
    checklist_home.wait_for(timeout=5000)
    checklist_home.click(position={'x': 20, 'y': 25})
    check(page.evaluate('window.__know02OpenedContent') == 'review-v1:destination:checklists', 'Home checklist card uses the stable checklist destination ID')
    page.goto(f'{BASE}?screen=home-carousel')
    faq_home = page.get_by_role('button', name=re.compile('Vanliga frågor'))
    faq_home.wait_for(timeout=5000)
    faq_home.click(position={'x': 20, 'y': 25})
    check(page.evaluate('window.__know02OpenedContent') == 'review-v1:destination:faq', 'Home FAQ card uses the stable FAQ destination ID')

    # Review training is session-local and does not call the cloud progression handler.
    page.goto(f'{BASE}?screen=review-training-list')
    page.get_by_role('button', name='Utforska i egen takt').wait_for(timeout=5000)
    screenshot(page, 'review-training-list-375.png')
    page.get_by_role('button', name='Utforska i egen takt').click()
    page.get_by_role('button', name='Markera övningen som genomförd').wait_for(timeout=3000)
    screenshot(page, 'review-training-detail-375.png')
    page.get_by_role('button', name='Markera övningen som genomförd').click()
    page.get_by_text('1 av 2 genomförda').wait_for(timeout=3000)
    check(page.evaluate('window.__know02CloudWrites ?? 0') == 0, 'Review training completion does not call cloud progression')
    page.get_by_role('tab', name='Framsteg').click()
    page.get_by_text('1 av 2 genomförda').wait_for(timeout=3000)
    screenshot(page, 'review-training-progress-375.png')

    # Loading/error are distinct; error never implies a saved zero count.
    page = browser.new_page(viewport={'width': 375, 'height': 844})
    page.goto(f'{BASE}?screen=checklist-overview&state=loading')
    page.get_by_text('Läser in framsteg…').first.wait_for(timeout=3000)
    check('0 av 3 genomförda' not in page.locator('body').inner_text(), 'Loading overview does not claim zero saved progress')
    screenshot(page, 'checklist-loading-375.png')
    page.goto(f'{BASE}?screen=checklist-overview&state=error')
    page.get_by_text('Framsteg kunde inte hämtas').first.wait_for(timeout=5000)
    body = page.locator('body').inner_text()
    check('0 av 3 genomförda' not in body and '1 av 4 genomförda' not in body, 'Read error overview does not imply saved zero progress')
    check(page.get_by_role('button', name='Försök igen').count() == 1, 'Read error has one retry action')
    screenshot(page, 'checklist-error-375.png')

    # Input validation, failed and uncertain writes, exact reconciliation.
    page.goto(f'{BASE}?screen=checklist-overview')
    wait_ready(page)
    open_template(page)
    page.get_by_role('button', name='Lägg till egen punkt').click()
    page.get_by_role('textbox', name='Punkt').fill('😀' * 161)
    page.get_by_role('button', name='Spara egen punkt').click()
    page.get_by_text('Skriv en punkt på mellan 1 och 160 tecken.').wait_for(timeout=3000)
    check(not page.get_by_role('checkbox', name=re.compile('😀')).count(), 'Custom item rejects more than 160 Unicode code points')
    page.get_by_role('textbox', name='Punkt').fill('  Ring kursledare  ')
    page.get_by_role('button', name='Spara egen punkt').click()
    page.get_by_role('checkbox', name='Ring kursledare').wait_for(timeout=3000)
    check('20 % · 1 av 5 genomförda' in page.locator('body').inner_text(), 'Custom item title is trimmed on save and count reconciles')

    page.get_by_role('button', name='Ändra Ring kursledare').click()
    page.get_by_role('textbox', name='Punkt').fill('Ring instruktör')
    page.evaluate("window.__know02MutationFault='failed'")
    page.get_by_role('button', name='Spara egen punkt').click()
    page.get_by_text('Kunde inte spara. Försök igen.').wait_for(timeout=3000)
    check(page.get_by_role('textbox', name='Punkt').input_value() == 'Ring instruktör' and page.get_by_text('Punkten har ändrats. Läs in listan igen.').count() == 0, 'Failed custom update retains edit input and shows retry rather than conflict')
    page.get_by_role('button', name='Spara egen punkt').click()
    page.get_by_role('checkbox', name='Ring instruktör').wait_for(timeout=3000)
    check('Sparat' in page.locator('body').inner_text(), 'Retry after failed custom update can save the same edit')

    before_mark = checkbox_mark(page, 'Ring instruktör')
    page.evaluate("window.__know02MutationFault='unknown'")
    page.get_by_role('checkbox', name='Ring instruktör').click()
    page.get_by_text('Det gick inte att kontrollera om ändringen sparades.').wait_for(timeout=3000)
    check(page.get_by_role('button', name='Kontrollera om ändringen sparades').count() == 1, 'Uncertain write exposes one exact reconciliation action')
    check(page.get_by_role('checkbox', name='Ring instruktör').evaluate('(el) => getComputedStyle(el).opacity') == '0.55', 'Uncertain write visibly disables the duplicate checkbox action')
    screenshot(page, 'checklist-uncertain-375.png')
    page.get_by_role('button', name='Kontrollera om ändringen sparades').click()
    page.get_by_role('checkbox', name='Ring instruktör').wait_for(timeout=3000)
    check(checkbox_mark(page, 'Ring instruktör') != before_mark, 'Exact retry readback adopts committed custom checkbox state')

    # Edit/delete semantics and Alert action shim. Native Alert appearance remains outside this test.
    page.get_by_role('button', name='Ändra Ring instruktör').click()
    page.get_by_role('textbox', name='Punkt').fill('  Boka kurs  ')
    page.get_by_role('button', name='Spara egen punkt').click()
    page.get_by_role('checkbox', name='Boka kurs').wait_for(timeout=3000)
    page.get_by_role('button', name='Ändra Boka kurs').click()
    page.evaluate("window.__tasslaAlertActions=['Avbryt']")
    page.get_by_role('button', name='Radera egen punkt').click()
    check(page.get_by_role('checkbox', name='Boka kurs').count() == 1, 'Delete confirmation cancel preserves the item')
    page.evaluate("window.__tasslaAlertActions=['Radera']")
    page.get_by_role('button', name='Radera egen punkt').click()
    page.get_by_role('checkbox', name='Boka kurs').wait_for(state='detached', timeout=3000)
    check(page.evaluate('window.__tasslaAlertOptions') == ['Avbryt', 'Radera'], 'Delete menu exposes cancel and destructive confirmation actions')

    # Pending add survives an actual KnowledgeRoute unmount/remount and reuses one UUID.
    page.goto(f'{BASE}?screen=checklist-overview')
    wait_ready(page)
    open_template(page)
    page.get_by_role('button', name='Lägg till egen punkt').click()
    page.get_by_role('textbox', name='Punkt').fill('Boka kurs med instruktör')
    page.evaluate("window.__know02WriteDelayMs=350; window.__know02MutationFault='unknown'")
    page.get_by_role('button', name='Spara egen punkt').click()
    page.evaluate('window.__know02UnmountRoute()')
    page.wait_for_timeout(650)
    page.evaluate('window.__know02RemountRoute()')
    page.get_by_role('button', name='Kontrollera om ändringen sparades').wait_for(timeout=5000)
    page.get_by_role('button', name='Kontrollera om ändringen sparades').click()
    page.get_by_text('Sparat').wait_for(timeout=3000)
    inserted = page.evaluate("(window.__know02Mutations ?? []).filter(m => m.mode === 'insert' && m.table === 'dog_checklist_custom_items')")
    check(len(inserted) == 1 and re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', inserted[0]['payload'].get('id', ''), re.I) is not None, 'Uncertain add reconciles after route remount with one stable UUID insert')
    screenshot(page, 'checklist-remount-reconciled-375.png')

    # A changed dog/session key clears the pending snapshot and prevents replay in the new scope.
    page.goto(f'{BASE}?screen=checklist-overview')
    wait_ready(page)
    open_template(page)
    page.get_by_role('button', name='Lägg till egen punkt').click()
    page.get_by_role('textbox', name='Punkt').fill('Endast för första hunden')
    page.evaluate("window.__know02WriteDelayMs=350; window.__know02MutationFault='unknown'")
    page.get_by_role('button', name='Spara egen punkt').click()
    page.evaluate('window.__know02UnmountRoute()')
    page.wait_for_timeout(650)
    page.evaluate('window.__know02ChangeScope(); window.__know02RemountRoute()')
    page.wait_for_timeout(500)
    check(page.get_by_role('button', name='Kontrollera om ändringen sparades').count() == 0, 'Changing synthetic dog/session scope clears pending operation without replay')
    scope_inserts = page.evaluate("(window.__know02Mutations ?? []).filter(m => m.mode === 'insert' && m.table === 'dog_checklist_custom_items')")
    check(len(scope_inserts) == 1, 'New scope did not replay the prior dog’s custom-item insertion')

    # Approximate 140% text at small width and save the resulting key routes.
    for screen, name in [('knowledge', 'knowledge'), ('checklist-overview', 'checklist-overview'), ('faq', 'faq'), ('review-training-list', 'review-training-list')]:
        page = browser.new_page(viewport={'width': 375, 'height': 844})
        page.goto(f'{BASE}?screen={screen}')
        if screen == 'checklist-overview': wait_ready(page)
        else: page.wait_for_timeout(250)
        page.evaluate("""() => {
          for (const node of [...document.querySelectorAll('*')]) {
            if (![...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) continue;
            const style = getComputedStyle(node); const size = parseFloat(style.fontSize); const line = parseFloat(style.lineHeight);
            if (Number.isFinite(size)) node.style.fontSize = `${size * 1.4}px`;
            if (Number.isFinite(line)) node.style.lineHeight = `${line * 1.4}px`;
          }
        }""")
        if screen == 'knowledge':
            check(no_horizontal_overflow(page), 'Knowledge has no page/card horizontal overflow with 140% text at 375px')
            tablist = page.get_by_role('tablist').first
            faq_tab = page.get_by_role('tab', name='FAQ')
            tablist.evaluate('(el) => { el.scrollLeft = el.scrollWidth; }')
            faq_tab.wait_for(timeout=3000)
            tab_bounds = faq_tab.evaluate('(el) => { const r=el.getBoundingClientRect(); const p=el.parentElement.getBoundingClientRect(); return {left:r.left,right:r.right,height:r.height,parentLeft:p.left,parentRight:p.right}; }')
            check(tab_bounds['height'] >= 44 and tab_bounds['left'] >= tab_bounds['parentLeft'] - 1 and tab_bounds['right'] <= tab_bounds['parentRight'] + 1,
                  'FAQ tab is reachable with full label and at least 44px target after scrolling at 140%')
        else:
            check(no_horizontal_overflow(page), f'{screen} has no horizontal overflow with 140% text at 375px')
        if screen == 'knowledge':
            check(page.evaluate("""() => {
              const el=[...document.querySelectorAll('[dir="auto"]')].find(n=>n.textContent.includes('Gröna listor för valpens olika faser'));
              if(!el) return false;
              const r=el.getBoundingClientRect(), p=el.parentElement.getBoundingClientRect();
              const s=getComputedStyle(el);
              return r.left >= p.left-1 && r.right <= p.right+1 && r.height >= el.scrollHeight-1 && s.whiteSpace !== 'nowrap';
            }"""), 'Knowledge checklist shortcut copy wraps inside its card at 140%')
        screenshot(page, f'{name}-large-text-375.png')
        if screen == 'knowledge':
            faq_tab.click()
            page.get_by_role('button', name='När passar en valpkurs?, visa svar').wait_for(timeout=3000)
            check('Vanliga frågor' in page.locator('body').inner_text(), '140% FAQ tab opens the FAQ view')
            page.goto(f'{BASE}?screen=knowledge')
            page.evaluate("""() => { const scroller=[...document.querySelectorAll('*')].find(el => getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight); if(scroller) scroller.scrollTop=scroller.scrollHeight; }""")
            disclaimer = page.get_by_text('Granskningsdata')
            preview_bounds = disclaimer.evaluate("""el => { const r=el.getBoundingClientRect(); const s=el; let parent=s.parentElement; while(parent && getComputedStyle(parent).overflowY!=='auto') parent=parent.parentElement; const v=parent.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,height:r.height,scroll:s.scrollHeight,viewportTop:v.top,viewportBottom:v.bottom}; }""")
            check(preview_bounds['height'] >= preview_bounds['scroll'] - 1 and preview_bounds['top'] >= preview_bounds['viewportTop'] - 1 and preview_bounds['bottom'] <= preview_bounds['viewportBottom'] + 1,
                  'Guide review status is fully readable after scrolling past the viewport edge at 140%')
            page.screenshot(path=str(OUT / 'knowledge-review-preview-140-scroll-375.png'))

    check(not PAGE_ERRORS, 'No browser page errors in rendered flows')
    browser.close()

(OUT / 'browser-results.json').write_text(json.dumps({
    'passes': PASSES,
    'failures': FAILURES,
    'pageErrors': PAGE_ERRORS,
    'scope': 'Local React Native Web harness using synthetic records and APIs. Native Alert, VoiceOver, real Dynamic Type, Supabase/RLS, and live account isolation are not verified.',
}, ensure_ascii=False, indent=2) + '\n')
for result in PASSES:
    print('PASS', result)
for result in FAILURES:
    print('FAIL', result)

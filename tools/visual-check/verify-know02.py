from datetime import datetime, timezone
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description='Verify isolated KNOW-02 public/review browser journeys.')
parser.add_argument('--base-url', required=True)
parser.add_argument('--output-dir', required=True)
parser.add_argument('--bundle-file', help='Exact know02-app.js file served at --base-url for this run.')
parser.add_argument('--review', action='store_true')
args = parser.parse_args()
OUT = Path(args.output_dir)
if not OUT.is_absolute(): OUT = ROOT / OUT
BASE = args.base_url.rstrip('/') + '/'
BUILD_FILE = Path(args.bundle_file) if args.bundle_file else None
if BUILD_FILE is not None and not BUILD_FILE.is_absolute(): BUILD_FILE = ROOT / BUILD_FILE
OUT.mkdir(parents=True, exist_ok=True)
PASSES = []
FAILURES = []
PAGE_ERRORS = []
BROWSER_SCRIPT_URLS = set()
SERVED_BUNDLE_HASH = None
CAPTURES = []


def check(condition, name):
    if not condition:
        FAILURES.append(name)
        raise AssertionError(name)
    PASSES.append(name)


def wait_ready(page):
    page.get_by_role('button', name=re.compile(r'^Öppna ')).first.wait_for(timeout=5000)


def open_template(page, label='Första dagarna hemma'):
    name = f'Öppna {label}, föreslagen fas' if label == 'Första dagarna hemma' else f'Öppna {label}'
    target = page.get_by_role('button', name=name)
    target.wait_for(timeout=5000)
    target.click(position={'x': 10, 'y': 10})
    page.get_by_role('progressbar').wait_for(timeout=5000)


def scroll_top(page):
    page.evaluate("() => [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 20).forEach(el => { el.scrollTop = 0; })")


def scroll_bottom(page):
    page.evaluate("() => [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 20).forEach(el => { el.scrollTop = el.scrollHeight; })")


def no_horizontal_overflow(page):
    return page.evaluate("""() => {
      if (document.documentElement.scrollWidth > innerWidth) return false;
      return [...document.querySelectorAll('*')].every(el => {
        const style = getComputedStyle(el);
        return style.display === 'none' || el.scrollWidth <= el.clientWidth + 1 || style.overflowX === 'auto' || style.overflowX === 'scroll';
      });
    }""")


def screenshot(page, name, route_state=None, scroll_to_top=True):
    if scroll_to_top: scroll_top(page)
    page.screenshot(path=str(OUT / name))
    viewport = page.viewport_size or {}
    CAPTURES.append({
        'file': name,
        'viewport': f"{viewport.get('width', '?')}x{viewport.get('height', '?')}",
        'routeState': route_state or Path(name).stem,
        'fixture': 'synthetic review' if args.review else 'synthetic public',
    })


def check_bundle_identity():
    global SERVED_BUNDLE_HASH
    if BUILD_FILE is None: return
    artifact_hash = hashlib.sha256(BUILD_FILE.read_bytes()).hexdigest()
    served_body = urlopen(BASE + 'know02-app.js').read()
    SERVED_BUNDLE_HASH = hashlib.sha256(served_body).hexdigest()
    check(SERVED_BUNDLE_HASH == artifact_hash, 'Served KNOW-02 script bytes match the exact build artifact')
    check(BROWSER_SCRIPT_URLS == {BASE + 'know02-app.js'}, 'Browser requested the exact KNOW-02 script URL')


def save_results():
    try:
        branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
        commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    except Exception:
        branch, commit = 'unknown', 'unknown'
    build_artifact_hash = hashlib.sha256(BUILD_FILE.read_bytes()).hexdigest() if BUILD_FILE is not None else None
    payload = {
        'mode': 'review' if args.review else 'public', 'branch': branch, 'commit': commit,
        'environment': {'browser': 'Playwright Chromium', 'binary': '/usr/bin/chromium', 'host': '127.0.0.1', 'baseUrl': BASE},
        'fixture': 'synthetic public guide/article plus review-only FAQ/checklist and guide fixtures' if args.review else 'synthetic public guide/article; no review content',
        'route': 'Knowledge search/read, FAQ and phase checklist journeys',
        'viewports': ['375x844', '430x844', '375x667'],
        'browserScriptRequests': sorted(BROWSER_SCRIPT_URLS),
        'servedBundleSha256': SERVED_BUNDLE_HASH,
        'buildArtifact': {'file': str(BUILD_FILE) if BUILD_FILE else None, 'sha256': build_artifact_hash},
        'bundleMatchesArtifact': build_artifact_hash is not None and SERVED_BUNDLE_HASH == build_artifact_hash,
        'captures': CAPTURES,
        'buildId': 'ej skapad', 'command': 'python3 tools/visual-check/verify-know02.py --base-url ' + BASE + ' --output-dir ' + args.output_dir + (' --bundle-file ' + args.bundle_file if args.bundle_file else '') + (' --review' if args.review else ''),
        'passes': PASSES, 'failures': FAILURES, 'pageErrors': PAGE_ERRORS,
        'scope': 'Local React Native Web harness with synthetic records. Native behavior, live content/DB/RLS and account isolation are not verified.',
    }
    (OUT / 'browser-results.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')


def checkbox_mark(page, label):
    return page.get_by_role('checkbox', name=label).locator('[dir="auto"]').first.inner_text()


def new_page(browser, viewport):
    page = browser.new_page(viewport=viewport, device_scale_factor=1)
    def track_bundle(response):
        if response.request.resource_type == 'script' and response.status == 200 and response.url.endswith('/know02-app.js'):
            BROWSER_SCRIPT_URLS.add(response.url)
    page.on('response', track_bundle)
    page.on('pageerror', lambda error: PAGE_ERRORS.append(str(error)))
    return page


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    if not args.review:
        for width, height in ((375, 844), (430, 844), (375, 667)):
            page = new_page(browser, {'width': width, 'height': height})
            page.goto(f'{BASE}?screen=knowledge')
            page.get_by_label(re.compile('Sök guider för Luna')).wait_for(timeout=5000)
            check(page.get_by_role('tab', name='Artiklar').count() == 0 and page.get_by_role('tab', name='För dig').count() == 0, f'Public Knowledge has no top content tabs at {width}x{height}')
            check('Skapa en lugn vardagsrutin' in page.locator('body').inner_text(), f'Public guide fixture is visible at {width}x{height}')
            check('Review: syntetiskt guideexempel' not in page.locator('body').inner_text(), f'Public Knowledge excludes review guide fixtures at {width}x{height}')
            check(no_horizontal_overflow(page), f'Public Knowledge fits at {width}x{height}')
            screenshot(page, f'knowledge-public-{width}x{height}.png', 'Knowledge root/top')
            if width == 375 and height == 844:
                scroll_bottom(page)
                check(page.get_by_role('button', name='Öppna Checklistor').count() == 1 and page.get_by_role('button', name='Öppna Vanliga frågor').count() == 1, 'Knowledge root exposes both support destinations')
                screenshot(page, 'knowledge-public-shortcuts-375x844.png', 'Knowledge root/scrolled support shortcuts', scroll_to_top=False)

            page.goto(f'{BASE}?screen=faq')
            page.get_by_text('Inga frågor publicerade ännu.').wait_for(timeout=5000)
            check(page.get_by_role('button', name=re.compile('Frågor:')).count() == 0, f'Public FAQ hides inactive context choices at {width}x{height}')
            check(no_horizontal_overflow(page), f'Public FAQ fits at {width}x{height}')
            screenshot(page, f'faq-public-empty-{width}x{height}.png', 'FAQ/public honest empty state')

            page.goto(f'{BASE}?screen=checklist-overview')
            page.get_by_text('Inga checklistor publicerade ännu.').wait_for(timeout=5000)
            check(page.get_by_role('button', name=re.compile('Öppna .*föreslagen fas')).count() == 0, f'Public checklist hides phase navigation at {width}x{height}')
            check(page.evaluate('window.__know02ChecklistReads ?? 0') == 0 and page.evaluate('window.__know02ChecklistWrites ?? 0') == 0, f'Public checklist has zero reads and writes at {width}x{height}')
            check(no_horizontal_overflow(page), f'Public checklist fits at {width}x{height}')
            screenshot(page, f'checklist-public-empty-{width}x{height}.png', 'Checklist/public honest empty state')
            page.close()
        check(not PAGE_ERRORS, 'No browser page errors in public flows')
        check_bundle_identity()
        browser.close()
        save_results()
        for result in PASSES: print('PASS', result)
        raise SystemExit(0)

    for width, height in ((375, 844), (430, 844), (375, 667)):
        page = new_page(browser, {'width': width, 'height': height})
        page.clock.install(time=datetime(2026, 10, 11, 15, 0, tzinfo=timezone.utc))
        page.goto(f'{BASE}?screen=knowledge')
        page.get_by_label(re.compile('Sök guider för Luna')).wait_for(timeout=5000)
        check(page.get_by_role('tab', name='Artiklar').count() == 0 and page.get_by_role('tab', name='För dig').count() == 0, f'Review Knowledge has no top content tabs at {width}x{height}')
        check('Review: syntetiskt guideexempel' in page.locator('body').inner_text(), f'Review guide fixture appears in review mode at {width}x{height}')
        check(no_horizontal_overflow(page), f'Review Knowledge fits at {width}x{height}')
        screenshot(page, f'knowledge-review-{width}x{height}.png', 'Knowledge root/top')
        if width == 375 and height == 844:
            scroll_bottom(page)
            check(page.get_by_role('button', name='Öppna Checklistor').count() == 1 and page.get_by_role('button', name='Öppna Vanliga frågor').count() == 1, 'Review Knowledge root exposes both support destinations')
            screenshot(page, 'knowledge-review-shortcuts-375x844.png', 'Knowledge root/scrolled support shortcuts', scroll_to_top=False)

        page.goto(f'{BASE}?screen=faq')
        page.get_by_role('button', name='När passar en valpkurs?, visa svar').wait_for(timeout=5000)
        check(page.get_by_role('button', name='Frågor: Efter ålder, valt').count() == 1, f'Review FAQ shows its selected context at {width}x{height}')
        screenshot(page, f'faq-review-{width}x{height}.png', 'FAQ/review context choices')
        page.get_by_role('button', name='Frågor: Första dagarna hemma').click()
        question = page.get_by_role('button', name='Hur kan första natten bli lugnare?, visa svar')
        question.wait_for(timeout=3000)
        question.click(position={'x': 40, 'y': 25})
        page.get_by_text(re.compile('Ordna en trygg sovplats')).wait_for(timeout=3000)
        check('Ordna en trygg sovplats nära familjen' in page.locator('body').inner_text(), f'FAQ opens the answer for its selected context at {width}x{height}')
        page.get_by_role('button', name='Frågor: Före hemkomst').click()
        page.get_by_role('button', name='Hur möter barn valpen på ett tryggt sätt?, visa svar').wait_for(timeout=3000)
        check(page.get_by_role('button', name='Hur kan första natten bli lugnare?, visa svar').count() == 0, f'FAQ context change closes and filters the prior question at {width}x{height}')
        page.get_by_role('button', name='Frågor: Första dagarna hemma').click()
        question = page.get_by_role('button', name='Hur kan första natten bli lugnare?, visa svar')
        question.wait_for(timeout=3000)
        question.click(position={'x': 40, 'y': 25})
        page.get_by_text(re.compile('Ordna en trygg sovplats')).wait_for(timeout=3000)
        check(no_horizontal_overflow(page), f'Review FAQ answer fits at {width}x{height}')
        screenshot(page, f'faq-review-expanded-{width}x{height}.png', 'FAQ/review answer expanded')

        page.goto(f'{BASE}?screen=checklist-overview')
        wait_ready(page)
        check('Vald fas' in page.locator('body').inner_text() and 'Första dagarna hemma' in page.locator('body').inner_text(), f'Selected context and recommended phase are both visible at {width}px')
        check('Exempel · ej sakgranskat' in page.locator('body').inner_text() and 'Tillfälligt exempel – innehållet är inte sakgranskat.' not in page.locator('body').inner_text(), f'Review notice uses one concise truthful label at {width}px')
        check('1/4' in page.locator('body').inner_text(), f'Overview count includes saved preset and custom row at {width}px')
        check(all(page.get_by_role('button', name=f'Öppna {title}').count() == 1 for title in ['Inför hemkomsten', '8–12 veckor', '3–6 månader', '6–12 månader', 'Över ett år']), f'Compact list exposes every other phase at {width}px')
        check(page.get_by_text('Låt valpen landa i sin egen takt.').count() == 0 and page.get_by_role('button', name='Läs mer om tillfälliga exempel').count() == 0, f'Overview omits duplicate intro and review copy at {width}px')
        check(page.get_by_text('Fler faser').count() == 1, f'Overview groups remaining phases under one section at {width}px')
        check(no_horizontal_overflow(page), f'Checklist overview fits at {width}x{height}')
        screenshot(page, f'checklist-review-overview-{width}x{height}.png', 'Checklist/review overview')

        open_template(page)
        check('1 av 4 genomförda' in page.locator('body').inner_text(), f'Detail progress count at {width}px')
        check(no_horizontal_overflow(page), f'Checklist detail fits at {width}x{height}')
        screenshot(page, f'checklist-review-detail-{width}x{height}.png', 'Checklist/review detail')

        if width == 375 and height == 844:
            before_mark = checkbox_mark(page, 'Boka valpkurs')
            page.get_by_role('checkbox', name='Boka valpkurs').click()
            page.get_by_text('2 av 4 genomförda').wait_for(timeout=3000)
            check(checkbox_mark(page, 'Boka valpkurs') != before_mark, 'Own checklist item toggles directly and updates progress')
            screenshot(page, 'checklist-custom-checked-375.png')

    # Every compact secondary row opens its matching detail and returns to the list.
    page = new_page(browser, {'width': 375, 'height': 844})
    secondary_phases = [
        ('Inför hemkomsten', 'Ordna en trygg viloplats'),
        ('8–12 veckor', 'Öva på namnet med belöning'),
        ('3–6 månader', 'Öva inkallning på trygg plats'),
        ('6–12 månader', 'Repetera sådant som fungerar'),
        ('Över ett år', 'Välj en vardagsfärdighet att öva'),
    ]
    for phase, first_item in secondary_phases:
        page.goto(f'{BASE}?screen=checklist-overview')
        wait_ready(page)
        page.get_by_role('button', name=f'Öppna {phase}').click(position={'x': 10, 'y': 10})
        page.get_by_role('checkbox', name=first_item).wait_for(timeout=3000)
        check(True, f'Compact phase row opens matching detail: {phase}')
        page.get_by_role('button', name='Tillbaka').click()
        wait_ready(page)
        check(page.get_by_role('button', name=f'Öppna {phase}').count() == 1, f'Checklist detail returns to compact list: {phase}')

    # Search/read/back preserves the query and isolates a no-match until explicitly cleared.
    page = new_page(browser, {'width': 375, 'height': 844})
    page.goto(f'{BASE}?screen=knowledge')
    search = page.get_by_label('Sök guider för Luna')
    search.fill('vardagsrutin')
    page.get_by_role('button', name='Läs Skapa en lugn vardagsrutin').click()
    page.get_by_text('Källor').wait_for(timeout=3000)
    check('https://www.skk.se/hundagande/' in page.locator('body').inner_text(), 'Guide detail shows the existing HTTPS source')
    page.get_by_role('button', name='Tillbaka till guider').click()
    check(search.input_value() == 'vardagsrutin', 'Returning from guide detail preserves the search query')
    if args.review: screenshot(page, 'knowledge-search-returned-375x844.png')
    search.fill('no-such-knowledge-result')
    page.get_by_text(re.compile('Inga guider eller artiklar matchar')).wait_for(timeout=3000)
    page.get_by_role('button', name='Rensa sökning').click()
    check(search.input_value() == '', 'Search no-match can be cleared')

    # Context preference, explicit age recommendation, and pre-homecoming under eight weeks.
    page = new_page(browser, {'width': 375, 'height': 844})
    page.goto(f'{BASE}?screen=checklist-overview')
    wait_ready(page)
    page.get_by_role('button', name='Ändra checklistornas fas').click()
    page.get_by_role('button', name='Välj Före hemkomst').click()
    page.get_by_role('button', name='Välj Före hemkomst, nuvarande').wait_for(timeout=3000)
    check('Före hemkomst' in page.locator('body').inner_text() and 'Inför hemkomsten' in page.locator('body').inner_text(), 'Choosing a context updates the recommended phase after confirmed save')
    page.get_by_role('button', name='Ändra checklistornas fas').click()
    page.get_by_role('button', name='Välj Efter ålder').click()
    page.get_by_role('button', name='Välj Efter ålder, nuvarande').wait_for(timeout=3000)
    check('Efter ålder' in page.locator('body').inner_text() and page.get_by_role('button', name='Öppna 8–12 veckor, föreslagen fas').count() == 1, 'Age-based phase is recommended for ten weeks')
    screenshot(page, 'checklist-context-age-375.png')
    page.goto(f'{BASE}?screen=checklist-overview&state=empty&ageWeeks=4')
    wait_ready(page)
    page.get_by_role('button', name='Ändra checklistornas fas').click()
    page.get_by_role('button', name='Välj Efter ålder').click()
    page.get_by_role('button', name='Välj Efter ålder, nuvarande').wait_for(timeout=3000)
    check('Före hemkomst' in page.locator('body').inner_text() and 'Inför hemkomsten' in page.locator('body').inner_text(), 'Under eight weeks recommends preparation without an arrival date')
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

    # Training → Knowledge → FAQ → Knowledge → Training.
    page.goto(f'{BASE}?screen=review-training-route')
    page.get_by_role('button', name='Öppna Kunskap').click()
    page.get_by_label(re.compile('Sök guider för Luna')).wait_for(timeout=3000)
    page.get_by_role('button', name='Öppna Vanliga frågor').click()
    page.get_by_role('button', name='Frågor: Efter ålder, valt').wait_for(timeout=3000)
    page.get_by_role('button', name='Tillbaka till Kunskap').click()
    page.get_by_role('button', name='Tillbaka till Träning').click()
    page.get_by_role('heading', name='Träning').wait_for(timeout=3000)
    check(True, 'Training → Knowledge → FAQ → Knowledge → Training round trip')

    # Training → Knowledge → Checklist detail → overview → Knowledge → Training.
    page.get_by_role('button', name='Öppna Kunskap').click()
    page.get_by_role('button', name='Öppna Checklistor').click()
    wait_ready(page)
    open_template(page)
    page.get_by_role('progressbar').wait_for(timeout=3000)
    page.get_by_role('button', name='Tillbaka').click()
    wait_ready(page)
    page.get_by_role('button', name='Tillbaka till Kunskap').click()
    page.get_by_role('button', name='Tillbaka till Träning').click()
    page.get_by_role('heading', name='Träning').wait_for(timeout=3000)
    check(True, 'Training → Knowledge → checklist detail → overview → Knowledge → Training round trip')

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
    page.get_by_text('1 av 2 övningar klara').wait_for(timeout=3000)
    check(page.evaluate('window.__know02CloudWrites ?? 0') == 0, 'Review training completion does not call cloud progression')
    page.get_by_text('1 av 2 övningar klara').wait_for(timeout=3000)
    screenshot(page, 'review-training-progress-375.png')

    # Loading/error are distinct; error never implies a saved zero count.
    page = new_page(browser, {'width': 375, 'height': 844})
    page.goto(f'{BASE}?screen=checklist-overview&state=loading')
    page.get_by_text('Läser in…').first.wait_for(timeout=3000)
    check('0/3' not in page.locator('body').inner_text(), 'Loading overview does not claim zero saved progress')
    screenshot(page, 'checklist-loading-375.png')
    page.goto(f'{BASE}?screen=checklist-overview&state=error')
    page.get_by_text('Val och framsteg kunde inte hämtas.').wait_for(timeout=5000)
    body = page.locator('body').inner_text()
    check('0/3' not in body and '1/4' not in body, 'Read error overview does not imply saved zero progress')
    check(page.get_by_role('button', name='Försök hämta checklistorna igen').count() == 1, 'Read error has one retry action')
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
    check('1 av 5 genomförda' in page.locator('body').inner_text(), 'Custom item title is trimmed on save and confirmed progress count reconciles')

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
    page.get_by_text('Sparat', exact=True).wait_for(timeout=3000)
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

    check(not PAGE_ERRORS, 'No browser page errors in rendered flows')
    check_bundle_identity()
    browser.close()

save_results()
for result in PASSES:
    print('PASS', result)
for result in FAILURES:
    print('FAIL', result)

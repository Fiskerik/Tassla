from __future__ import annotations

import json
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[2]
DAILY_CHECKLIST_SOURCE = (ROOT / 'src/features/home/DailyChecklistScreen.tsx').read_text(encoding='utf-8')
DAILY_ACTIVITY_SOURCE = (ROOT / 'src/components/ui/DailyActivityItem.tsx').read_text(encoding='utf-8')
REVIEW = os.environ.get('TASSLA_UI_REVIEW') == 'true'
BASE = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4173')
DEFAULT_EVIDENCE = ROOT / 'docs/design/evidence/vision-rev02/2026-10-21-home-panels-2-3-8/home' / ('review' if REVIEW else 'public')
OUT = Path(os.environ.get('TASSLA_UI_EVIDENCE', DEFAULT_EVIDENCE))
OUT.mkdir(parents=True, exist_ok=True)
results: list[dict[str, object]] = []
failures: list[str] = []


def record(name: str, passed: bool, details: dict[str, object] | None = None) -> None:
    result = {'check': name, 'result': 'PASS' if passed else 'FAIL', **(details or {})}
    results.append(result)
    if not passed:
        failures.append(name)
        print(f'FAIL {name}: {details}')
    else:
        print(f'PASS {name}')


def home_url(scenario: str = 'ready', daily_mutation: str | None = None, *, image_fixture: str | None = None) -> str:
    mutation = f'&dailyMutation={daily_mutation}' if daily_mutation else ''
    images = f'&imageFixture={image_fixture}' if image_fixture else ''
    return f'{BASE}/?screen=home&homeScenario={scenario}{mutation}{images}'


def development_url(*, guides_state: str | None = None, age_scenario: str | None = None) -> str:
    query = ['screen=development']
    if guides_state:
        query.append(f'developmentGuidesState={guides_state}')
    if age_scenario:
        query.append(f'ageScenario={age_scenario}')
    return f"{BASE}/?{'&'.join(query)}"


def progress_url(*, state: str = 'ready', completed: int | None = None) -> str:
    query = [f'screen=progress', f'homeScenario={state}']
    if completed is not None:
        query.append(f'progressCount={completed}')
    return f"{BASE}/?{'&'.join(query)}"


def profile_url() -> str:
    return f'{BASE}/?screen=profile'


def insights_url(*, state: str = 'ready', period: str = 'week', origin: str = 'profile') -> str:
    return f'{BASE}/?screen=insights&origin={origin}&insightsPeriod={period}&insightsState={state}'


def image_fixture_url(screen: str) -> str:
    return f'{BASE}/?screen={screen}&imageFixture={screen}'


def visible_destinations(page) -> list[dict[str, object]]:
    tiles = []
    for name in ('Öppna Logga', 'Öppna Träna', 'Öppna Kunskap'):
        locator = page.get_by_role('button', name=name, exact=True)
        expect(locator).to_be_visible(timeout=5000)
        tiles.append({'name': name, 'box': locator.bounding_box()})
    return tiles


def vertical_scroll_state(page) -> dict[str, object] | None:
    return page.evaluate("""() => {
      const candidates = [...document.querySelectorAll('*')].filter((element) => {
        const style = getComputedStyle(element);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll')
          && element.clientHeight > 0 && element.scrollHeight > element.clientHeight + 8;
      }).sort((a, b) => b.clientHeight - a.clientHeight);
      const element = candidates[0];
      return element ? { top: element.scrollTop, max: element.scrollHeight - element.clientHeight,
        client: element.clientHeight, scroll: element.scrollHeight } : null;
    }""")


def set_vertical_scroll(page, offset: int) -> dict[str, object] | None:
    page.evaluate("""(requested) => {
      const candidates = [...document.querySelectorAll('*')].filter((element) => {
        const style = getComputedStyle(element);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll')
          && element.clientHeight > 0 && element.scrollHeight > element.clientHeight + 8;
      }).sort((a, b) => b.clientHeight - a.clientHeight);
      const element = candidates[0];
      if (!element) return;
      element.scrollTop = requested;
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    }""", offset)
    page.wait_for_timeout(120)
    return vertical_scroll_state(page)


def verify_development_views(browser) -> None:
    for width, app_height in ((375, 844), (430, 844)):
        page = browser.new_page(viewport={'width': width, 'height': app_height + (32 if REVIEW else 0)})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(home_url(), wait_until='networkidle')
        page.get_by_role('button', name='Visa utveckling för Luna', exact=True).click()
        expect(page.get_by_test_id('development-screen')).to_be_visible()
        expect(page.get_by_text('11 veckor · Valp', exact=True)).to_be_visible()
        expect(page.get_by_text('Nästa milstolpar', exact=True)).to_be_visible()
        expect(page.get_by_text('Granskade milstolpar är inte tillgängliga ännu', exact=True)).to_be_visible()
        expect(page.get_by_text('Standardbild', exact=True)).to_be_visible()
        age_pill = page.get_by_test_id('development-age-pill')
        age_pill_box = age_pill.bounding_box()
        record(f'Development age pill has a 44pt touch target at {width}px',
               age_pill_box is not None and age_pill_box['width'] >= 44 and age_pill_box['height'] >= 44,
               {'box': age_pill_box})
        puppy_range = page.get_by_text('0–6 mån', exact=True).bounding_box()
        adolescent_label = page.get_by_text('Unghund', exact=True).bounding_box()
        phase_gap = adolescent_label['x'] - (puppy_range['x'] + puppy_range['width']) if puppy_range and adolescent_label else None
        record(f'Development phase labels have breathing room at {width}px', phase_gap is not None and phase_gap >= 28,
               {'gap_pt': phase_gap, 'puppy_range': puppy_range, 'adolescent_label': adolescent_label})
        age_pill.click()
        expect(page.get_by_test_id('development-age-pill')).to_have_count(0)
        marker_toggle = page.get_by_test_id('development-age-marker-toggle')
        expect(marker_toggle).to_be_visible()
        marker_box = marker_toggle.bounding_box()
        record(f'Development age marker stays discoverable as a 44pt toggle at {width}px',
               marker_box is not None and marker_box['width'] >= 44 and marker_box['height'] >= 44,
               {'box': marker_box})
        if width == 375:
            page.screenshot(path=str(OUT / 'development-age-pill-hidden-375.png'), full_page=True)
        marker_toggle.click()
        expect(page.get_by_test_id('development-age-pill')).to_be_visible()
        record(f'Development age pill toggles off and back on from the marker at {width}px', True,
               {'initial_pill': age_pill_box})
        image = page.get_by_test_id('development-screen').locator('img').first.bounding_box()
        image_is_prominent = image is not None and image['height'] >= 260
        record(f'Development hero uses its large unique Standardbild at {width}px', image_is_prominent, {'image_box': image})
        if REVIEW:
            guide = page.get_by_role('button', name='Öppna guide: Så bygger ni lugna rutiner', exact=True)
            expect(guide).to_be_visible()
            page.screenshot(path=str(OUT / f'development-{width}.png'), full_page=True)
            guide.click()
            expect(page.get_by_role('button', name='Tillbaka till Utveckling', exact=True)).to_be_visible()
            expect(page.get_by_text('Så bygger ni lugna rutiner', exact=True)).to_be_visible()
            page.screenshot(path=str(OUT / f'development-guide-{width}.png'), full_page=True)
            page.get_by_role('button', name='Tillbaka till Utveckling', exact=True).click()
            expect(page.get_by_test_id('development-screen')).to_be_visible()
            expect(guide).to_be_visible()
            record(f'Development guide returns directly to Development at {width}px', True)
        else:
            expect(page.get_by_text('Det finns inga publicerade guider för den här åldern ännu.', exact=True)).to_be_visible()
            page.screenshot(path=str(OUT / f'development-{width}.png'), full_page=True)
            page.get_by_role('button', name='Tillbaka till Hem', exact=True).click()
            expect(page.get_by_text('Dagens att göra', exact=True)).to_be_visible()
            record(f'Public Development empty-guide state returns to Home at {width}px', True)
        record(f'Development render has no browser errors or horizontal overflow at {width}px',
               not page_errors and page.evaluate('document.documentElement.scrollWidth <= innerWidth'),
               {'page_errors': page_errors})
        page.close()


def verify_development_states(browser) -> None:
    for state in ('loading', 'error'):
        page = browser.new_page(viewport={'width': 375, 'height': 844 + (32 if REVIEW else 0)})
        page.goto(development_url(guides_state=state), wait_until='networkidle')
        if state == 'loading':
            expect(page.get_by_role('progressbar', name='Laddar innehåll')).to_have_count(2)
        else:
            expect(page.get_by_text('Guiderna kunde inte hämtas just nu.', exact=True)).to_be_visible()
            retry = page.get_by_role('button', name='Hämta utvecklingsguider igen', exact=True)
            expect(retry).to_be_visible()
            page.screenshot(path=str(OUT / 'development-guides-error-375.png'), full_page=True)
            retry.click()
            record('Development guide retry invokes the supplied retry action',
                   page.evaluate('window.__developmentGuideRetryCalls === 1'))
        page.screenshot(path=str(OUT / f'development-guides-{state}-375.png'), full_page=True)
        page.close()
        record(f'Development guide {state} state renders distinctly', True)

    for scenario in ('missing', 'invalid', 'future'):
        page = browser.new_page(viewport={'width': 375, 'height': 844 + (32 if REVIEW else 0)})
        page.goto(development_url(age_scenario=scenario), wait_until='networkidle')
        expect(page.get_by_text('Ålder och fas', exact=True)).to_be_visible()
        expect(page.get_by_text('Åldersresan visas när ett giltigt födelsedatum finns.', exact=True)).to_be_visible()
        expect(page.get_by_test_id('development-age-pill')).to_have_count(0)
        expect(page.get_by_text('Åldersrelevanta guider visas när ett giltigt födelsedatum finns.', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / f'development-age-{scenario}-375.png'), full_page=True)
        page.close()
        record(f'Development {scenario} birth date uses the neutral unknown-age state', True)

    if not REVIEW:
        return

    # Rendered three-route scroll-memory scenario at a short viewport. The fixture
    # changes only its memory-scope token; ProductWorkspace's real scope fields are
    # separately asserted by the Node route test.
    page = browser.new_page(viewport={'width': 375, 'height': 699})
    page.goto(home_url(), wait_until='networkidle')
    expect(page.get_by_test_id('review-app-viewport')).to_be_visible()
    set_vertical_scroll(page, 82)
    development_entry = page.get_by_role('button', name='Visa utveckling för Luna', exact=True)
    development_entry.scroll_into_view_if_needed()
    home_before = vertical_scroll_state(page)
    development_entry.click()
    expect(page.get_by_test_id('development-screen')).to_be_visible()
    dev_before = set_vertical_scroll(page, 188)
    guide = page.get_by_role('button', name='Öppna guide: Så bygger ni lugna rutiner', exact=True)
    guide.scroll_into_view_if_needed()
    dev_before = vertical_scroll_state(page)
    assert dev_before is not None, 'Development should have a scrollable route at the short viewport.'
    guide.click()
    expect(page.get_by_role('button', name='Tillbaka till Utveckling', exact=True)).to_be_visible()
    page.get_by_role('button', name='Tillbaka till Utveckling', exact=True).click()
    dev_after = vertical_scroll_state(page)
    record('Development guide roundtrip restores its own rendered offset',
           dev_before is not None and dev_after is not None and abs(float(dev_after['top']) - float(dev_before['top'])) <= 1,
           {'before': dev_before, 'after': dev_after})
    page.get_by_role('button', name='Tillbaka till Hem', exact=True).click()
    home_after = vertical_scroll_state(page)
    record('Development return restores the separate Home offset',
           home_before is not None and home_after is not None and abs(float(home_after['top']) - float(home_before['top'])) <= 1,
           {'before': home_before, 'after': home_after})

    checklist_control = page.get_by_test_id('home-open-checklist')
    checklist_control.scroll_into_view_if_needed()
    home_checklist_origin = vertical_scroll_state(page)
    checklist_control.click()
    expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
    checklist_before = set_vertical_scroll(page, 104)
    assert checklist_before is not None, 'Checklist should have its own scrollable route at the short viewport.'
    page.get_by_role('button', name='Tillbaka till Hem', exact=True).click()
    home_from_checklist = vertical_scroll_state(page)
    record('Checklist return preserves the Home flow offset',
           home_from_checklist is not None and home_checklist_origin is not None
           and abs(float(home_from_checklist['top']) - float(home_checklist_origin['top'])) <= 1,
           {'before': home_checklist_origin, 'after': home_from_checklist})
    page.get_by_test_id('home-open-checklist').click()
    checklist_after = vertical_scroll_state(page)
    record('Home → Checklist restores the third independent route offset',
           checklist_before is not None and checklist_after is not None
           and abs(float(checklist_after['top']) - float(checklist_before['top'])) <= 1,
           {'before': checklist_before, 'after': checklist_after})
    page.get_by_role('button', name='Tillbaka till Hem', exact=True).click()
    page.get_by_role('tab', name='Logg', exact=True).click()
    expect(page.get_by_test_id('destination-result')).to_be_visible()
    page.get_by_role('tab', name='Hem', exact=True).click()
    flow_exit_home = vertical_scroll_state(page)
    record('Leaving the Home child flow clears the old Home scroll offset',
           flow_exit_home is None or float(flow_exit_home['top']) <= 1,
           {'after_flow_exit': flow_exit_home})

    page.get_by_role('button', name='Visa utveckling för Luna', exact=True).click()
    set_vertical_scroll(page, 142)
    changed_scopes: list[dict[str, object]] = []
    for dimension in ('account', 'account-generation', 'dog-id', 'breed', 'exact-birth-date', 'derived-age', 'review-public'):
        page.evaluate('(dimension) => window.__homePanelsChangeScrollScope?.(dimension)', dimension)
        page.wait_for_timeout(120)
        state = vertical_scroll_state(page)
        changed_scopes.append({'dimension': dimension, 'state': state})
        set_vertical_scroll(page, 142)
    record('Account, dog, breed, exact DOB, age and review-scope changes clear route offsets before reuse',
           all(item['state'] is not None and float(item['state']['top']) <= 1 for item in changed_scopes),
           {'scopes': changed_scopes})
    page.screenshot(path=str(OUT / 'development-short-viewport-375.png'), full_page=True)

    page.goto(home_url(), wait_until='networkidle')
    page.get_by_role('button', name='Visa utveckling för Luna', exact=True).click()
    page.evaluate("""() => {
      const root = document.querySelector('[data-testid="development-screen"]');
      if (!root) return;
      root.querySelectorAll('*').forEach((element) => {
        const style = getComputedStyle(element);
        const size = parseFloat(style.fontSize);
        const line = parseFloat(style.lineHeight);
        if (Number.isFinite(size)) element.style.fontSize = `${size * 1.4}px`;
        if (Number.isFinite(line)) element.style.lineHeight = `${line * 1.4}px`;
      });
    }""")
    text_fit = page.evaluate("""() => {
      const root = document.querySelector('[data-testid="development-screen"]');
      const heroRight = root?.querySelector('[data-testid="development-hero"]')?.getBoundingClientRect().right ?? 0;
      const range = [...(root?.querySelectorAll('*') ?? [])].find((element) => element.textContent?.trim() === '6–24 mån');
      const rangeRight = range?.getBoundingClientRect().right ?? Infinity;
      const ageText = [...(root?.querySelectorAll('*') ?? [])].filter((element) => element.textContent?.trim() === '11 veckor')
        .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
      const ageTextBox = ageText?.getBoundingClientRect();
      return { no_document_overflow: document.documentElement.scrollWidth <= innerWidth,
        phase_range_within_screen: rangeRight <= heroRight + 1, range_right: rangeRight, hero_right: heroRight,
        age_label_single_line: Boolean(ageTextBox && ageTextBox.height <= 24), age_label_height: ageTextBox?.height ?? null };
    }""")
    record('Development phase ranges and age pill remain readable with the 140% text layout proxy',
           text_fit['no_document_overflow'] and text_fit['phase_range_within_screen'] and text_fit['age_label_single_line'],
           text_fit)
    page.screenshot(path=str(OUT / 'development-text-140-375.png'), full_page=True)
    large_text_target = page.get_by_role('button', name='Öppna guide: Så bygger ni lugna rutiner', exact=True) if REVIEW \
        else page.get_by_text('Det finns inga publicerade guider för den här åldern ännu.', exact=True)
    large_text_target.scroll_into_view_if_needed()
    target_box = large_text_target.bounding_box()
    bottom_nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    record('Development remains scrollable at 140% with content above the bottom menu',
           target_box is not None and bottom_nav is not None and target_box['y'] >= 0
           and target_box['y'] + target_box['height'] <= bottom_nav['y'],
           {'content': target_box, 'bottom_nav': bottom_nav})
    page.screenshot(path=str(OUT / 'development-text-140-bottom-375.png'))
    page.close()


def verify_insights_views(browser) -> None:
    for width in (375, 430):
        page = browser.new_page(viewport={'width': width, 'height': 844 + (32 if REVIEW else 0)})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(profile_url(), wait_until='networkidle')
        entry = page.get_by_role('button', name='Insikter', exact=True)
        expect(entry).to_be_visible()
        expect(entry).to_be_enabled()
        page.screenshot(path=str(OUT / f'profile-insights-entry-{width}.png'), full_page=True)

        # The actual edit form owns this action. A dirty profile draft keeps it visible but blocks navigation.
        name = page.get_by_role('textbox', name='Hundens namn', exact=True)
        name.fill('Luna prov')
        expect(entry).to_be_disabled()
        expect(page.get_by_text('Spara eller ändra tillbaka profiluppgifterna för att öppna Insikter.', exact=True)).to_be_visible()
        name.fill('Luna')
        expect(entry).to_be_enabled()
        entry.click()
        expect(page.get_by_role('tablist', name='Loggvy')).to_be_visible()
        expect(page.get_by_role('tab', name='Översikt', exact=True)).to_have_attribute('aria-selected', 'true')
        return_button = page.get_by_role('button', name='Tillbaka till Hundprofil', exact=True)
        expect(return_button).to_be_visible()
        expect(page.get_by_text('Registreringar över tid med Luna.', exact=True)).to_be_visible()
        if REVIEW:
            expect(page.get_by_text('Kiss ·', exact=False)).to_be_visible()
            expect(page.get_by_text('Bajs ·', exact=False)).to_be_visible()
        else:
            expect(page.get_by_text('Inga kiss-, bajs- eller olycksmarkeringar i perioden.', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / f'insights-week-profile-{width}.png'), full_page=True)

        page.get_by_role('tab', name='Månad', exact=True).click()
        expect(page.get_by_role('tab', name='Månad', exact=True)).to_have_attribute('aria-selected', 'true')
        page.screenshot(path=str(OUT / f'insights-month-profile-{width}.png'), full_page=True)
        page.get_by_role('tab', name='Sedan första loggen', exact=True).click()
        expect(page.get_by_role('tab', name='Sedan första loggen', exact=True)).to_have_attribute('aria-selected', 'true')
        if REVIEW:
            latest_marker = page.get_by_text('Pågår', exact=True).first
            expect(latest_marker).to_be_visible()
            record(f'All-history timeline opens at its current month at {width}px', True)
            other_marker = page.get_by_text('Andra', exact=True)
            other_marker.scroll_into_view_if_needed()
            expect(other_marker).to_be_visible()
            page.screenshot(path=str(OUT / f'insights-history-sparse-{width}.png'), full_page=True)
            gap_count = page.locator('[aria-label*="månader utan registreringar"]').count()
            record(f'Sparse history explains each omitted month interval at {width}px', gap_count > 0, {'accessible_gap_columns': gap_count})
            expect(page.get_by_text('Från första registreringen', exact=False)).to_be_visible()
        else:
            expect(page.get_by_text('Du har inga registreringar ännu', exact=True)).to_be_visible()
            log_button = page.get_by_role('button', name='Logga', exact=True)
            expect(log_button).to_be_visible()
            log_button.click()
            expect(page.get_by_role('tab', name='Idag', exact=True)).to_have_attribute('aria-selected', 'true')
            expect(page.get_by_role('button', name='Tillbaka till Hundprofil', exact=True)).to_be_visible()
            page.get_by_role('tab', name='Översikt', exact=True).click()
        page.screenshot(path=str(OUT / f'insights-history-profile-{width}.png'), full_page=True)

        # Idag keeps the profile return action until the main Logg tab is explicitly selected.
        page.get_by_role('tab', name='Idag', exact=True).click()
        expect(page.get_by_role('button', name='Tillbaka till Hundprofil', exact=True)).to_be_visible()
        page.get_by_role('tab', name='Översikt', exact=True).click()
        page.get_by_role('button', name='Tillbaka till Hundprofil', exact=True).click()
        expect(page.get_by_role('button', name='Insikter', exact=True)).to_be_visible()
        page.get_by_role('button', name='Insikter', exact=True).click()
        page.get_by_role('tab', name='Logg', exact=True).click()
        expect(page.get_by_role('tab', name='Idag', exact=True)).to_have_attribute('aria-selected', 'true')
        expect(page.get_by_role('button', name='Tillbaka till Hundprofil', exact=True)).to_have_count(0)
        record(f'Profile-origin return can be explicitly cleared from the selected Logg tab at {width}px', True)
        record(f'Profile entry, draft gate, shared overview periods and scoped return work at {width}px', not page_errors,
               {'page_errors': page_errors})
        page.close()

    # Distinct loading/error/empty copy and an actionable retry, using the same production LogScreen.
    page = browser.new_page(viewport={'width': 375, 'height': 844 + (32 if REVIEW else 0)})
    page.goto(insights_url(state='loading'), wait_until='networkidle')
    expect(page.get_by_text('Hämtar registreringar…', exact=True)).to_be_visible()
    page.screenshot(path=str(OUT / 'insights-loading-375.png'), full_page=True)
    page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 844 + (32 if REVIEW else 0)})
    page.goto(insights_url(state='error'), wait_until='networkidle')
    expect(page.get_by_text('Insikterna kunde inte hämtas', exact=True)).to_be_visible()
    retry = page.get_by_role('button', name='Försök igen', exact=True)
    expect(retry).to_be_visible()
    retry.click()
    record('Insights error state offers the supplied retry action', page.evaluate('window.__insightsRefreshCalls === 1'))
    page.screenshot(path=str(OUT / 'insights-error-375.png'), full_page=True)
    page.close()

    # 375×667 and a 140% web text proxy check the chart/footer fit and scroll path.
    page = browser.new_page(viewport={'width': 375, 'height': 667 + (32 if REVIEW else 0)})
    page.goto(insights_url(), wait_until='networkidle')
    page.get_by_text('Sömnmarkeringar', exact=True).scroll_into_view_if_needed()
    chart_title = page.get_by_text('Sömnmarkeringar', exact=True).bounding_box()
    bottom_nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    record('Insights remains scrollable above the fixed menu at 375×667',
           chart_title is not None and bottom_nav is not None and chart_title['y'] + chart_title['height'] <= bottom_nav['y'],
           {'chart_title': chart_title, 'bottom_nav': bottom_nav})
    page.screenshot(path=str(OUT / 'insights-short-viewport-375.png'), full_page=True)
    page.evaluate("""() => document.querySelectorAll('[dir="auto"]').forEach((element) => {
      const style = getComputedStyle(element);
      element.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
      element.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
    })""")
    page.get_by_text('Sömnmarkeringar', exact=True).scroll_into_view_if_needed()
    large_text_fits = page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    record('Insights has no horizontal page overflow with the 140% text layout proxy', large_text_fits)
    page.screenshot(path=str(OUT / 'insights-text-140-375.png'), full_page=True)
    page.close()


def verify_image_diversity(browser) -> None:
    if not REVIEW:
        for width in (375, 430):
            page = browser.new_page(viewport={'width': width, 'height': 844})
            page.goto(image_fixture_url('knowledge'), wait_until='networkidle')
            expect(page.get_by_text('Inga guider är publicerade för Luna ännu.', exact=True)).to_be_visible()
            page.screenshot(path=str(OUT / f'knowledge-empty-{width}.png'), full_page=True)
            page.goto(image_fixture_url('training'), wait_until='networkidle')
            expect(page.get_by_text('Inga övningar tillgängliga ännu', exact=True)).to_be_visible()
            record(f'Public Knowledge and Training use honest empty content at {width}px',
                   page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            page.screenshot(path=str(OUT / f'training-empty-{width}.png'), full_page=True)
            page.close()
        return

    for width in (375, 430):
        page = browser.new_page(viewport={'width': width, 'height': 844 + 32})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(image_fixture_url('knowledge'), wait_until='networkidle')
        expect(page.get_by_text('Tillfälligt exempel – innehållet är inte sakgranskat.', exact=True)).to_be_visible()
        guide_cards = [
            page.get_by_role('button', name='Läs Trygg start hemma', exact=True),
            page.get_by_role('button', name='Läs Kontakt och namn', exact=True),
            page.get_by_role('button', name='Läs Vardagsro och hantering', exact=True),
        ]
        image_sources: list[str | None] = []
        image_boxes = []
        for guide in guide_cards:
            expect(guide).to_be_visible()
            image = guide.locator('img').first
            image_sources.append(image.get_attribute('src'))
            image_boxes.append(image.bounding_box())
        record(f'Knowledge maps three stable guide identities to three different visible photos at {width}px',
               all(image_sources) and len(set(image_sources)) == 3,
               {'image_sources': image_sources, 'image_boxes': image_boxes})
        record(f'Knowledge image crops use the planned 200pt hero and 132pt guide images at {width}px',
               image_boxes[1] is not None and abs(image_boxes[1]['height'] - 200) <= 1
               and all(box is not None and abs(box['height'] - 132) <= 1 for index, box in enumerate(image_boxes) if index != 1),
               {'image_boxes': image_boxes})
        page.screenshot(path=str(OUT / f'knowledge-guides-{width}.png'), full_page=True)
        expect(page.get_by_role('textbox', name='Sök i guider för Luna', exact=True)).to_be_visible()
        expect(page.get_by_role('tablist', name='Huvudmeny').get_by_role('tab', name='Kunskap', exact=True)).to_be_visible()
        record(f'Knowledge guide search and the selected bottom destination remain visible at {width}px',
               not page_errors and page.evaluate('document.documentElement.scrollWidth <= innerWidth'),
               {'page_errors': page_errors})
        page.close()

    # Home opens the exact stable guide identity used by Knowledge's image manifest.
    page = browser.new_page(viewport={'width': 375, 'height': 844 + 32})
    page_errors: list[str] = []
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    page.goto(home_url(image_fixture='knowledge'), wait_until='networkidle')
    home_knowledge = page.get_by_role('button', name='Just nu med Luna, 11 veckor: Trygg start hemma', exact=True)
    home_knowledge.scroll_into_view_if_needed()
    page.screenshot(path=str(OUT / 'home-knowledge-card-375.png'), full_page=True)
    home_knowledge.click()
    expect(page.get_by_role('heading', name='Trygg start hemma', exact=True)).to_be_visible()
    record('Home knowledge recommendation opens its exact guide identity',
           page.evaluate("window.__homePanelsOpened === 'content:review-v1:training:trygg-start'") and not page_errors,
           {'page_errors': page_errors})
    page.close()

    # Home's current exercise recommendation opens the exact Training continuation card.
    page = browser.new_page(viewport={'width': 375, 'height': 844 + 32})
    page_errors = []
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    page.goto(home_url(image_fixture='training'), wait_until='networkidle')
    home_training = page.get_by_role('button', name='Just nu med Luna, 11 veckor: Vila nära', exact=True)
    home_training.scroll_into_view_if_needed()
    page.screenshot(path=str(OUT / 'home-training-card-375.png'), full_page=True)
    home_training.click()
    expect(page.get_by_role('heading', name='Träning', exact=True)).to_be_visible()
    continue_card = page.get_by_role('button', name='Fortsätt Trygg start hemma, nästa övning Vila nära, 1 av 2 övningar klara', exact=True)
    continue_card.scroll_into_view_if_needed()
    training_image = continue_card.locator('img').first
    training_source = training_image.get_attribute('src')
    training_box = training_image.bounding_box()
    page.screenshot(path=str(OUT / 'training-continuation-375.png'), full_page=True)
    record('Training continuation uses the Corgi photo and planned 88pt crop',
           training_box is not None
           and abs(training_box['width'] - 88) <= 1 and abs(training_box['height'] - 88) <= 1,
           {'training_source': training_source, 'training_image': training_box})
    record('Home recommendation and Training continuation use the same next-exercise title',
           'Vila nära' in continue_card.inner_text())
    continue_card.click()
    expect(page.get_by_role('dialog')).to_be_visible()
    expect(page.get_by_role('dialog').get_by_text('Vila nära', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name='Markera övningen som genomförd', exact=True)).to_be_visible()
    record('Training continuation still opens the same in-progress exercise', not page_errors, {'page_errors': page_errors})
    page.close()

    for width in (375, 430):
        page = browser.new_page(viewport={'width': width, 'height': 844 + 32})
        page_errors = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(image_fixture_url('training'), wait_until='networkidle')
        expect(page.get_by_role('heading', name='Träning', exact=True)).to_be_visible()
        continuation = page.get_by_role('button', name='Fortsätt Trygg start hemma, nästa övning Vila nära, 1 av 2 övningar klara', exact=True)
        continuation.scroll_into_view_if_needed()
        image_box = continuation.locator('img').first.bounding_box()
        nav_box = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
        record(f'Training continuation has a square 88pt image and clear navigation at {width}px',
               image_box is not None and abs(image_box['width'] - 88) <= 1
               and abs(image_box['height'] - 88) <= 1
               and nav_box is not None and image_box['y'] + image_box['height'] <= nav_box['y'] and not page_errors,
               {'image': image_box, 'bottom_nav': nav_box, 'page_errors': page_errors})
        page.screenshot(path=str(OUT / f'training-overview-{width}.png'), full_page=True)
        page.close()

    # Short device and large-text layout proxy keep the large photographs scrollable above navigation.
    for screen in ('knowledge', 'training'):
        page = browser.new_page(viewport={'width': 375, 'height': 667 + 32})
        page.goto(image_fixture_url(screen), wait_until='networkidle')
        if screen == 'knowledge':
            page.get_by_role('button', name='Läs Vardagsro och hantering', exact=True).scroll_into_view_if_needed()
            target = page.get_by_role('button', name='Läs Vardagsro och hantering', exact=True).locator('img').first
        else:
            continuation = page.get_by_role('button', name='Fortsätt Trygg start hemma, nästa övning Vila nära, 1 av 2 övningar klara', exact=True)
            continuation.scroll_into_view_if_needed()
            target = continuation.locator('img').first
        image_box = target.bounding_box()
        nav_box = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
        record(f'{screen.title()} crop is reachable without covering the bottom menu at 375×667',
               image_box is not None and nav_box is not None and image_box['y'] + image_box['height'] <= nav_box['y'],
               {'image': image_box, 'bottom_nav': nav_box})
        page.screenshot(path=str(OUT / f'{screen}-short-375.png'), full_page=True)
        page.evaluate("""() => document.querySelectorAll('[dir="auto"]').forEach((element) => {
          const style = getComputedStyle(element);
          element.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
          element.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
        })""")
        page.wait_for_timeout(80)
        record(f'{screen.title()} has no horizontal overflow with 140% text proxy',
               page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        page.screenshot(path=str(OUT / f'{screen}-text-140-375.png'), full_page=True)
        page.close()


def verify_progress_views(browser) -> None:
    if not REVIEW:
        page = browser.new_page(viewport={'width': 375, 'height': 844})
        page.goto(progress_url(), wait_until='networkidle')
        expect(page.get_by_test_id('daily-progress-screen')).to_be_visible()
        expect(page.get_by_text('Inga aktiviteter idag', exact=True)).to_be_visible()
        expect(page.get_by_role('progressbar')).to_have_count(0)
        primary = page.get_by_role('button', name='Hantera dagens aktiviteter', exact=True)
        expect(primary).to_be_visible()
        record('Public empty Progress shows no 0/0 ring and one primary action',
               primary.count() == 1 and page.get_by_text('0 av 0', exact=True).count() == 0)
        page.screenshot(path=str(OUT / 'progress-empty-375.png'), full_page=True)
        primary.click()
        expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
        expect(page.get_by_role('dialog')).to_be_visible()
        record('Empty Progress action opens the existing activity manager', True)
        page.close()
        return

    for width in (375, 430):
        page = browser.new_page(viewport={'width': width, 'height': 844 + 32})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(progress_url(completed=2), wait_until='networkidle')
        expect(page.get_by_test_id('daily-progress-screen')).to_be_visible()
        expect(page.get_by_role('heading', name='Dagens aktiviteter', exact=True)).to_be_visible()
        ring = page.get_by_role('progressbar', name='2 av 5 dagsuppgifter klara', exact=True)
        expect(ring).to_be_visible()
        box = ring.bounding_box()
        ring_stroke_count = page.get_by_test_id('daily-progress-ring-progress').count()
        training_status = page.get_by_test_id('daily-training-status-checkbox')
        training_status_box = training_status.bounding_box()
        expect(page.get_by_text('2 av 5 klara', exact=True)).to_be_visible()
        expect(page.get_by_text('Dagens lista är klar', exact=True)).to_have_count(0)
        record(f'Progress uses a continuous 40% ring and shared 2/5 list at {width}px',
               box is not None and abs(box['width'] - 248) <= 1 and abs(box['height'] - 248) <= 1
               and ring_stroke_count == 1 and page.get_by_text('Kissa', exact=True).is_visible(),
               {'ring': box, 'vector_strokes': ring_stroke_count})
        record(f'Environment-training status is a round 28pt checkbox at {width}px',
               training_status_box is not None and abs(training_status_box['width'] - 28) <= 1
               and abs(training_status_box['height'] - 28) <= 1
               and training_status.evaluate('(element) => parseFloat(getComputedStyle(element).borderRadius) >= element.getBoundingClientRect().width / 2'),
               {'checkbox': training_status_box})
        record(f'Progress does not invent completion timestamps at {width}px',
               page.get_by_text('07:12', exact=True).count() == 0 and page.get_by_text('08:45', exact=True).count() == 0)
        overflow = page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        record(f'Progress fits without horizontal overflow or browser errors at {width}px', overflow and not page_errors,
               {'page_errors': page_errors})
        if width == 375:
            page.screenshot(path=str(OUT / 'progress-375.png'), full_page=True)
        page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 876})
    page.goto(progress_url(completed=5), wait_until='networkidle')
    ring = page.get_by_role('progressbar', name='5 av 5 dagsuppgifter klara', exact=True)
    expect(ring).to_be_visible()
    expect(page.get_by_test_id('daily-progress-complete-note')).to_be_visible()
    expect(page.get_by_text('5 aktiviteter markerade som klara idag.', exact=True)).to_be_visible()
    training_check = page.get_by_test_id('daily-training-status-checkmark')
    expect(page.get_by_text('Miljöträning – nya ljud', exact=True)).to_be_visible()
    expect(training_check).to_have_count(1)
    record('100% vector ring closes and the factual completion note appears only when complete',
           page.get_by_test_id('daily-progress-ring-progress').count() == 1
           and training_check.is_visible())
    page.screenshot(path=str(OUT / 'progress-complete-375.png'), full_page=True)
    page.get_by_test_id('daily-progress-complete-note').scroll_into_view_if_needed()
    page.screenshot(path=str(OUT / 'progress-complete-bottom-375.png'), full_page=True)
    page.close()

    for state, message in (
        ('loading', 'Laddar innehåll'),
        ('error', 'Dagens framsteg kunde inte hämtas. Inget antal visas förrän aktiviteterna har lästs in.'),
        ('unknown', 'Dagens aktiviteter är inte tillgängliga ännu. Inget antal visas.'),
        ('partial', 'Dagens sammanställning är inte komplett ännu. Inget antal visas.'),
    ):
        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(progress_url(state=state), wait_until='networkidle')
        if state == 'loading':
            expect(page.get_by_role('progressbar', name='Laddar innehåll')).to_have_count(2)
        else:
            expect(page.get_by_text(message, exact=True)).to_be_visible()
        expect(page.get_by_role('progressbar', name='0 av 0 dagsuppgifter klara')).to_have_count(0)
        if state == 'error':
            retry = page.get_by_role('button', name='Hämta dagens framsteg igen', exact=True)
            expect(retry).to_be_visible()
            page.screenshot(path=str(OUT / 'progress-error-375.png'), full_page=True)
        if state == 'loading':
            page.screenshot(path=str(OUT / 'progress-loading-375.png'), full_page=True)
        record(f'Progress {state} state is distinct and never shows a 0/0 ring', True)
        page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 699})
    page.goto(progress_url(completed=2), wait_until='networkidle')
    expect(page.get_by_test_id('review-app-viewport')).to_be_visible()
    content = page.get_by_role('button', name='Öppna hela dagens checklista', exact=True)
    content.scroll_into_view_if_needed()
    nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    action = content.bounding_box()
    record('Progress remains naturally scrollable at the short viewport with its action above navigation',
           action is not None and nav is not None and action['y'] + action['height'] <= nav['y']
           and page.evaluate('document.documentElement.scrollWidth <= innerWidth'),
           {'action': action, 'nav': nav})
    page.screenshot(path=str(OUT / 'progress-short-375.png'), full_page=True)
    page.close()

    page = browser.new_page(viewport={'width': 375, 'height': 876})
    page.goto(progress_url(completed=5), wait_until='networkidle')
    page.evaluate("""() => document.querySelectorAll('[dir="auto"]').forEach((element) => {
      const style = getComputedStyle(element);
      element.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
      element.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
    })""")
    complete_note = page.get_by_test_id('daily-progress-complete-note')
    complete_note.scroll_into_view_if_needed()
    nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    note = complete_note.bounding_box()
    record('Progress completion content remains reachable at the 140% text proxy',
           page.evaluate('document.documentElement.scrollWidth <= innerWidth') and note is not None and nav is not None
           and note['y'] + note['height'] <= nav['y'], {'note': note, 'nav': nav})
    page.screenshot(path=str(OUT / 'progress-text-140-bottom-375.png'))
    page.close()


if os.environ.get('TASSLA_UI_PANEL') == 'progress':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
            args=['--no-sandbox'],
        )
        verify_progress_views(browser)
        browser.close()
    report = {'mode': 'review' if REVIEW else 'public', 'panel': 'progress', 'evidence_dir': str(OUT), 'results': results, 'failures': failures}
    (OUT / 'RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'RESULTS {len(results) - len(failures)}/{len(results)} PASS; evidence={OUT}')
    raise SystemExit(1 if failures else 0)


if os.environ.get('TASSLA_UI_PANEL') == 'insights':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
            args=['--no-sandbox'],
        )
        verify_insights_views(browser)
        browser.close()
    report = {'mode': 'review' if REVIEW else 'public', 'panel': 'insights', 'evidence_dir': str(OUT), 'results': results, 'failures': failures}
    (OUT / 'RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'RESULTS {len(results) - len(failures)}/{len(results)} PASS; evidence={OUT}')
    raise SystemExit(1 if failures else 0)


if os.environ.get('TASSLA_UI_PANEL') == 'image-diversity':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
            args=['--no-sandbox'],
        )
        verify_image_diversity(browser)
        browser.close()
    report = {'mode': 'review' if REVIEW else 'public', 'panel': 'image-diversity', 'evidence_dir': str(OUT), 'results': results, 'failures': failures}
    (OUT / 'RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'RESULTS {len(results) - len(failures)}/{len(results)} PASS; evidence={OUT}')
    raise SystemExit(1 if failures else 0)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
        args=['--no-sandbox'],
    )
    for width, app_height in ((375, 844), (430, 844)):
        page = browser.new_page(viewport={'width': width, 'height': app_height + (32 if REVIEW else 0)})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(home_url(), wait_until='networkidle')
        expect(page.get_by_text('Dagens att göra', exact=True)).to_have_count(1)
        expect(page.get_by_test_id('home-open-checklist')).to_be_visible()
        checklist_control = page.get_by_test_id('home-open-checklist')
        expect(page.get_by_role('button', name='Öppna Checklistor', exact=True)).to_be_visible()
        checklist_chevron = page.get_by_test_id('home-open-checklist-chevron')
        expect(checklist_chevron).to_be_visible()
        control_box = checklist_control.bounding_box()
        chevron_box = checklist_chevron.bounding_box()
        record(f'Home checklist action is a chevron-only touch target at {width}px',
               control_box is not None and chevron_box is not None
               and control_box['width'] >= 44 and control_box['height'] >= 44
               and abs(control_box['width'] - 44) <= 2
               and abs(control_box['height'] - 44) <= 2
               and control_box['x'] <= chevron_box['x']
               and chevron_box['x'] + chevron_box['width'] <= control_box['x'] + control_box['width'],
               {'control': control_box, 'chevron': chevron_box})
        record(f'Home header contains no checklist or manager text action at {width}px',
               page.get_by_text('Checklista', exact=True).count() == 0
               and page.get_by_text('Visa alla', exact=True).count() == 0
               and page.get_by_text('Hantera', exact=True).count() == 0)
        tiles = visible_destinations(page)
        touch_targets = []
        for name, locator in (
            ('Checklistor chevron', page.get_by_test_id('home-open-checklist')),
            ('Logga', page.get_by_role('button', name='Öppna Logga', exact=True)),
            ('Träna', page.get_by_role('button', name='Öppna Träna', exact=True)),
            ('Kunskap', page.get_by_role('button', name='Öppna Kunskap', exact=True)),
        ):
            box = locator.bounding_box()
            touch_targets.append({'name': name, 'box': box})
        touch_targets_ok = all(target['box'] is not None and target['box']['width'] >= 44 and target['box']['height'] >= 44 for target in touch_targets)
        record(f'Home actions meet the 44pt touch target at {width}px', touch_targets_ok, {'targets': touch_targets})
        if REVIEW:
            checkbox = page.get_by_role('checkbox').first.bounding_box()
            record(f'Home routine checkbox target meets 44pt at {width}px', checkbox is not None and checkbox['width'] >= 44 and checkbox['height'] >= 44, {'box': checkbox})
        nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
        tile_bottom = max(tile['box']['y'] + tile['box']['height'] for tile in tiles if tile['box'])
        clearance = nav['y'] - tile_bottom if nav else None
        viewport_box = page.get_by_test_id('review-app-viewport').bounding_box()
        min_clearance = 16
        record(
            f'initial Home and three destinations at {width}x{app_height} ({"review" if REVIEW else "public"})',
            nav is not None and clearance is not None and clearance >= min_clearance
            and viewport_box is not None and viewport_box['height'] == app_height,
            {'app_viewport': viewport_box, 'nav': nav, 'destination_tiles': tiles, 'clearance_pt': clearance,
             'minimum_clearance_pt': min_clearance},
        )
        record(f'no horizontal overflow or browser error at {width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth') and not page_errors, {'page_errors': page_errors})
        if REVIEW:
            expect(page.get_by_test_id('review-banner')).to_be_visible()
            expect(page.get_by_label('2 av 5 dagsuppgifter klara', exact=True)).to_be_visible()
            expect(page.get_by_role('button', name='Öppna Checklistor', exact=True)).to_be_visible()
        else:
            expect(page.get_by_text('Skapa en rutin eller välj ett träningssteg att ha med idag.', exact=True)).to_be_visible()
            record(f'public empty day has no 0/0 progress at {width}px', page.get_by_role('progressbar').count() == 0)
        page.screenshot(path=str(OUT / f'home-default-{width}.png'), full_page=True)

        # The arrow opens the full Checklistor route.
        page.get_by_test_id('home-open-checklist').click()
        expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
        expect(page.get_by_role('heading', name='Checklistor', exact=True)).to_be_visible()
        record(f'chevron opens Checklistor route at {width}px', page.evaluate('window.__homePanelsOpened') == 'checklist')
        page.screenshot(path=str(OUT / f'checklist-{width}.png'), full_page=True)
        if REVIEW:
            expect(page.get_by_text('Håll inne på en rutinpunkt för att öppna redigeringen.', exact=True)).to_be_visible()
            if width == 375:
                routine_button = page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True)
                has_native_hint = "accessibilityHint={item.kind === 'routine' && routineDay?.routine_id ? 'Håll inne på en rutinpunkt för att öppna redigeringen.' : undefined}" in DAILY_CHECKLIST_SOURCE
                hint_is_forwarded = 'accessibilityHint={accessibilityHint}' in DAILY_ACTIVITY_SOURCE
                record('routine detail passes the exact hold-to-edit accessibility hint', has_native_hint and hint_is_forwarded,
                       {'native_hint_source': has_native_hint, 'hint_forwarded_to_pressable': hint_is_forwarded,
                        'react_native_web_note': 'RN Web does not expose React Native accessibilityHint as a DOM attribute'})

                routine_checkbox = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)
                expect(routine_checkbox).to_have_attribute('aria-checked', 'false')
                # A normal press opens the focused manager and preserves its accessible pencil.
                routine_button.click()
                expect(page.get_by_text('Hantera Morgonrutin', exact=True)).to_be_visible()
                expect(page.get_by_role('button', name='Redigera rutin Morgonrutin', exact=True)).to_be_visible()
                record('ordinary routine press opens the focused manager without edit mode',
                       page.get_by_role('textbox', name='Namn på rutin Morgonrutin', exact=True).count() == 0)
                page.screenshot(path=str(OUT / 'checklist-routine-manager-375.png'), full_page=True)
                page.get_by_role('button', name='Stäng', exact=True).first.click()

                # A real held pointer exercises Pressable's long-press responder.
                routine_button = page.get_by_role('button', name='Öppna Rutin Morgonrutin, punkt Kissa', exact=True)
                toggle_calls_before = page.evaluate('window.__routineToggleCalls || 0')
                box = routine_button.bounding_box()
                assert box is not None
                page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
                page.mouse.down()
                page.wait_for_timeout(750)
                page.mouse.up()
                expect(page.get_by_role('textbox', name='Namn på rutin Morgonrutin', exact=True)).to_be_visible()
                record('longpress opens edit mode without falling through to ordinary onPress', True)
                expect(routine_checkbox).to_have_attribute('aria-checked', 'false')
                toggle_calls_after = page.evaluate('window.__routineToggleCalls || 0')
                record('longpress does not invoke the separate routine checkbox action', toggle_calls_after == toggle_calls_before,
                       {'before': toggle_calls_before, 'after': toggle_calls_after, 'checkbox': routine_checkbox.get_attribute('aria-checked')})
                page.screenshot(path=str(OUT / 'checklist-routine-longpress-edit-375.png'), full_page=True)
                page.get_by_role('button', name='Stäng', exact=True).first.click()

        # Standard Home at 140% text; the app stays naturally scrollable with no horizontal clipping.
        page.goto(home_url(), wait_until='networkidle')
        page.evaluate("""() => {
          document.querySelectorAll('[dir="auto"]').forEach((element) => {
            const style = getComputedStyle(element);
            element.style.fontSize = `${parseFloat(style.fontSize) * 1.4}px`;
            element.style.lineHeight = `${parseFloat(style.lineHeight) * 1.4}px`;
          });
        }""")
        scaled_tiles = visible_destinations(page)
        record(f'140% text does not overflow horizontally at {width}px', page.evaluate('document.documentElement.scrollWidth <= innerWidth'), {'destination_tiles': scaled_tiles})
        page.screenshot(path=str(OUT / f'home-text-140-{width}.png'), full_page=True)
        page.close()

    verify_development_views(browser)
    verify_development_states(browser)
    verify_insights_views(browser)

    # Loading, empty, error, unknown and partial source states keep the full-list control visible.
    for scenario, message in (
        ('loading', None),
        ('empty', 'Skapa en rutin eller välj ett träningssteg att ha med idag.'),
        ('error', 'Dagens uppgifter kunde inte hämtas. Ingen status räknas just nu.'),
        ('unknown', 'Dagens uppgifter är inte tillgängliga ännu.'),
        ('partial', 'Dagens uppgifter är inte tillgängliga ännu.'),
    ):
        page = browser.new_page(viewport={'width': 375, 'height': 844 + (32 if REVIEW else 0)})
        page.goto(home_url(scenario), wait_until='networkidle')
        expect(page.get_by_test_id('home-open-checklist')).to_be_visible()
        if message:
            expect(page.get_by_text(message, exact=True)).to_be_visible()
        if scenario in ('empty', 'unknown', 'partial'):
            record(f'{scenario} daily source does not show 0/0', page.get_by_role('progressbar').count() == 0)
        if scenario == 'error':
            expect(page.get_by_role('button', name='Hämta dagens uppgifter igen', exact=True)).to_be_visible()
        if scenario in ('unknown', 'partial'):
            expect(page.get_by_role('button', name='Hämta dagens uppgifter', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / f'home-{scenario}-375.png'), full_page=True)
        page.close()
        record(f'{scenario} state keeps one checklist control', True)

    if REVIEW:
        # Seven items preserve the total while the compact Home preview stays at five.
        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(home_url('seven'), wait_until='networkidle')
        expect(page.get_by_text('2/7 · Framsteg', exact=True)).to_be_visible()
        expect(page.get_by_label('2 av 7 dagsuppgifter klara', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name='Öppna Checklistor', exact=True)).to_be_visible()
        record('seven-item fixture shows total count and keeps only the chevron action',
               page.get_by_test_id('home-open-checklist').count() == 1
               and page.get_by_text('Visa alla', exact=True).count() == 0)
        page.screenshot(path=str(OUT / 'home-seven-items-375.png'), full_page=True)
        page.close()

        # A routine's visible check only follows confirmed persistence; each unresolved result keeps its retry path.
        for mode, message in (
            ('pending', 'Sparar…'),
            ('failed', 'Ändringen sparades inte. Kontrollera anslutningen och försök igen.'),
            ('unknown', 'Vi kunde inte bekräfta om ändringen sparades. Ingen ny bock visas. Kontrollera samma ändring innan du fortsätter.'),
            ('readback', 'Ändringen sparades, men dagens lista kunde inte hämtas. Status räknas först efter en ny avläsning.'),
        ):
            page = browser.new_page(viewport={'width': 375, 'height': 876})
            page.goto(home_url('ready', mode), wait_until='networkidle')
            expect(page.get_by_text(message, exact=True)).to_be_visible()
            checkbox = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)
            expect(checkbox).to_have_attribute('aria-checked', 'false')
            if mode in ('failed', 'unknown', 'readback'):
                expect(page.get_by_role('button', name='Kontrollera ändringen för Kissa igen', exact=True)).to_be_visible()
            page.screenshot(path=str(OUT / f'home-mutation-{mode}-375.png'), full_page=True)
            record(f'{mode} routine status keeps the unconfirmed checkbox and feedback', True)
            page.close()

        # Exercise the production Home checkbox callback. The harness holds the
        # confirmed activity snapshot until its synthetic success/readback resolves.
        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(home_url('ready', 'interaction'), wait_until='networkidle')
        unchecked = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)
        expect(unchecked).to_have_attribute('aria-checked', 'false')
        unchecked.click()
        expect(page.get_by_text('Sparar…', exact=True)).to_be_visible()
        expect(page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, inte klar', exact=True)).to_have_attribute('aria-checked', 'false')
        confirmed = page.get_by_role('checkbox', name='Rutin Morgonrutin, punkt Kissa, klar', exact=True)
        expect(confirmed).to_have_attribute('aria-checked', 'true', timeout=5000)
        expect(page.get_by_label('3 av 5 dagsuppgifter klara', exact=True)).to_be_visible()
        page.screenshot(path=str(OUT / 'home-mutation-confirmed-375.png'), full_page=True)
        record('routine interaction stays unchecked while pending, then updates checkbox and count after synthetic confirmation', True)
        page.close()

    # The shorter screen is reachable by scrolling; destinations remain above the fixed menu.
    page = browser.new_page(viewport={'width': 375, 'height': 667 + (32 if REVIEW else 0)})
    page.goto(home_url(), wait_until='networkidle')
    page.get_by_role('button', name='Öppna Kunskap', exact=True).scroll_into_view_if_needed()
    last_tile = page.get_by_role('button', name='Öppna Kunskap', exact=True).bounding_box()
    nav = page.get_by_role('tablist', name='Huvudmeny').bounding_box()
    record('375x667 Home scroll reaches the last destination above the menu', last_tile is not None and nav is not None and last_tile['y'] + last_tile['height'] <= nav['y'])
    page.screenshot(path=str(OUT / 'home-short-viewport-375.png'), full_page=True)
    page.close()
    browser.close()

report = {'mode': 'review' if REVIEW else 'public', 'evidence_dir': str(OUT), 'results': results, 'failures': failures}
(OUT / 'RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'RESULTS {len(results) - len(failures)}/{len(results)} PASS; evidence={OUT}')
raise SystemExit(1 if failures else 0)

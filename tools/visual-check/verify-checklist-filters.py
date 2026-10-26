from __future__ import annotations

import json
import os
import re
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[2]
REVIEW = os.environ.get('TASSLA_UI_REVIEW') == 'true'
BASE = os.environ.get('TASSLA_UI_BASE_URL', 'http://127.0.0.1:4173')
DEFAULT_OUT = ROOT / 'docs/design/evidence/flow-home-checklist-filters-2026-10-20/a03' / ('review' if REVIEW else 'public')
OUT = Path(os.environ.get('TASSLA_UI_EVIDENCE', DEFAULT_OUT))
OUT.mkdir(parents=True, exist_ok=True)
RESULTS: list[dict[str, object]] = []
FAILURES: list[str] = []


def record(name: str, details: dict[str, object] | None = None) -> None:
    RESULTS.append({'check': name, 'result': 'PASS', **(details or {})})
    print(f'PASS {name}')


def checklist_url(filter_name: str = 'Idag', range_state: str = 'ready', empty: bool = False) -> str:
    query = {'screen': 'checklist', 'checklistFilter': filter_name}
    if range_state != 'ready':
        query['rangeState'] = range_state
    if empty:
        query['rangeEmpty'] = 'true'
    return f'{BASE}/?{urlencode(query)}'


def tab_metrics(page) -> tuple[dict[str, object], list[dict[str, float] | None]]:
    tablist = page.get_by_role('tablist', name='Filtrera checklistor')
    container = tablist.bounding_box()
    tabs = tablist.get_by_role('tab')
    boxes = [tab.bounding_box() for tab in tabs.all()]
    scroll = tablist.evaluate('node => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, overflowX: getComputedStyle(node).overflowX })')
    return {'container': container, 'count': tabs.count(), 'scroll': scroll}, boxes


def screenshot_app(page, name: str) -> None:
    page.get_by_test_id('review-app-viewport').screenshot(path=str(OUT / name))
    if REVIEW:
        page.screenshot(path=str(OUT / name.replace('.png', '-full-screen.png')), full_page=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get('TASSLA_UI_CHROMIUM', '/usr/bin/chromium'),
        args=['--no-sandbox'],
    )

    for width in (375, 430):
        height = 844
        page = browser.new_page(viewport={'width': width, 'height': height + 0})
        page_errors: list[str] = []
        page.on('pageerror', lambda error: page_errors.append(str(error)))
        page.goto(checklist_url('Idag'), wait_until='networkidle')
        expect(page.get_by_test_id('daily-checklist-screen')).to_be_visible()
        if REVIEW:
            expect(page.get_by_test_id('review-banner')).to_have_count(0)
            expect(page.get_by_text('Kissa', exact=True)).to_be_visible()
        else:
            expect(page.get_by_text('Inga aktiviteter idag', exact=True)).to_be_visible()

        for filter_name in ('Idag', 'Denna vecka', 'Alla', 'Kommande'):
            tab = page.get_by_role('tab', name=filter_name, exact=True)
            expect(tab).to_be_visible()
            tab.click()
            expect(tab).to_have_attribute('aria-selected', 'true')
            metrics, boxes = tab_metrics(page)
            selected_count = page.locator('[role="tablist"][aria-label="Filtrera checklistor"] [aria-selected="true"]').count()
            container = metrics['container']
            selected_box = page.get_by_role('tab', name=filter_name, exact=True).bounding_box()
            inside_container = (container is not None and selected_box is not None
                and selected_box['x'] >= container['x'] - 1
                and selected_box['x'] + selected_box['width'] <= container['x'] + container['width'] + 1)
            touch_ok = all(box is not None and box['width'] >= 44 and box['height'] >= 44 for box in boxes)
            no_overflow = page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            row_count = len({round(box['y']) for box in boxes if box is not None})
            layout_ok = row_count == 1
            scroll = metrics['scroll']
            horizontal_scroll = scroll['overflowX'] in ('auto', 'scroll') and scroll['scrollHeight'] <= scroll['clientHeight'] + 1
            assert selected_count == 1 and touch_ok and inside_container and no_overflow and layout_ok and horizontal_scroll, {'tabs': boxes, 'scroll': scroll}

            if filter_name == 'Idag':
                if REVIEW:
                    expect(page.get_by_text('2 av 5 klara', exact=True)).to_be_visible()
                else:
                    expect(page.get_by_text('Inga aktiviteter idag', exact=True)).to_be_visible()
            elif filter_name in ('Denna vecka', 'Alla'):
                expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
                expect(page.get_by_role('checkbox')).to_have_count(0)
                if filter_name == 'Alla':
                    expect(page.get_by_text('Senaste 30 dagarna', exact=True)).to_be_visible()
                if REVIEW:
                    expect(page.get_by_role('button', name=re.compile('Öppna sparat träningssteg'))).to_be_visible()
            else:
                expect(page.get_by_text('Planerat, inte utfört', exact=True)).to_be_visible()
                expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
                expect(page.get_by_role('checkbox')).to_have_count(0)
                if REVIEW:
                    expect(page.get_by_text('Planerad', exact=True)).to_have_count(4)
                    expect(page.get_by_role('button', name=re.compile('Öppna planerad'))).to_have_count(4)
                else:
                    expect(page.get_by_text('Inget planerat den närmaste veckan', exact=True)).to_be_visible()

            record(f'{filter_name} is selected with 44pt controls and fits {width}px', {
                'segments': boxes, 'container': container, 'selected_count': selected_count, 'scroll': scroll,
            })
            screenshot_app(page, f'checklist-{filter_name.lower().replace(" ", "-")}-{width}x{height}.png')

        assert not page_errors, page_errors
        record(f'no browser errors at {width}px', {'page_errors': page_errors})
        page.close()

    if REVIEW:
        page = browser.new_page(viewport={'width': 375, 'height': 667 + 32})
        page.goto(checklist_url('Idag'), wait_until='networkidle')
        tablist = page.get_by_role('tablist', name='Filtrera checklistor')
        tabs = tablist.get_by_role('tab')
        boxes = [tab.bounding_box() for tab in tabs.all()]
        page.evaluate('''() => {document.querySelectorAll('*').forEach(el => { if (el.children.length) return; const style=getComputedStyle(el); const size=parseFloat(style.fontSize); const line=parseFloat(style.lineHeight); if (Number.isFinite(size)) el.style.fontSize=(size*1.4)+'px'; if (Number.isFinite(line)) el.style.lineHeight=(line*1.4)+'px'; });}''')
        enlarged = [tab.bounding_box() for tab in tabs.all()]
        assert all(box is not None and box['height'] >= 44 for box in enlarged)
        scroll = tablist.evaluate('node => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, overflowX: getComputedStyle(node).overflowX })')
        assert scroll['scrollWidth'] > scroll['clientWidth'] and scroll['scrollHeight'] <= scroll['clientHeight'] + 1
        tabs.last.scroll_into_view_if_needed()
        tabs.last.click()
        expect(tabs.last).to_have_attribute('aria-selected', 'true')
        last_box = tabs.last.bounding_box()
        container = tablist.bounding_box()
        scroll_left = tablist.evaluate('node => node.scrollLeft')
        document_fits = page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        horizontal_reachability = (scroll['overflowX'] in ('auto', 'scroll') and scroll_left > 0
            and last_box is not None and container is not None
            and last_box['x'] >= container['x'] - 1
            and last_box['x'] + last_box['width'] <= container['x'] + container['width'] + 1)
        assert document_fits and horizontal_reachability, {
            'scroll': scroll, 'scroll_left': scroll_left, 'last_tab': last_box, 'container': container,
        }
        screenshot_app(page, 'checklist-kommande-375x667-text-140.png')
        tabs.first.scroll_into_view_if_needed()
        tabs.first.click()
        expect(tabs.first).to_have_attribute('aria-selected', 'true')
        first_box = tabs.first.bounding_box()
        scroll_left_start = tablist.evaluate('node => node.scrollLeft')
        return_to_start = (scroll_left_start < scroll_left and first_box is not None and container is not None
            and first_box['x'] >= container['x'] - 1
            and first_box['x'] + first_box['width'] <= container['x'] + container['width'] + 1)
        assert document_fits and horizontal_reachability and return_to_start, {
            'scroll': scroll, 'scroll_left': scroll_left, 'last_tab': last_box,
            'scroll_left_start': scroll_left_start, 'first_tab': first_box, 'container': container,
        }
        record('375x667 at 140% text scrolls to the final pill and returns to the first filter', {
            'before': boxes, 'after': enlarged, 'scroll': scroll, 'scroll_left': scroll_left,
            'last_tab': last_box, 'scroll_left_start': scroll_left_start, 'first_tab': first_box, 'container': container,
        })
        screenshot_app(page, 'checklist-kommande-375x667-text-140-start.png')
        page.close()

        for range_state, expected_title, retry_label in (
            ('loading', 'Planerade aktiviteter hämtas', None),
            ('partial', 'Några planerade aktiviteter kunde inte hämtas.', 'Hämta planerade aktiviteter igen'),
            ('error', 'Planerade aktiviteter kunde inte hämtas', 'Hämta planerade aktiviteter igen'),
        ):
            page = browser.new_page(viewport={'width': 375, 'height': 876})
            page.goto(checklist_url('Kommande', range_state), wait_until='networkidle')
            if range_state == 'loading':
                expect(page.get_by_label(expected_title)).to_be_visible()
            else:
                expect(page.get_by_text(expected_title, exact=True)).to_be_visible()
                expect(page.get_by_role('button', name=retry_label, exact=True)).to_be_visible()
            expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
            record(f'Kommande {range_state} state is explicit and has no progress claim')
            screenshot_app(page, f'checklist-kommande-{range_state}-375.png')
            page.close()

        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(checklist_url('Kommande', empty=True), wait_until='networkidle')
        expect(page.get_by_text('Inget planerat den närmaste veckan', exact=True)).to_be_visible()
        expect(page.get_by_test_id('daily-checklist-progress')).to_have_count(0)
        record('Kommande empty state is distinct from loading and read failures')
        screenshot_app(page, 'checklist-kommande-empty-375.png')
        page.close()

        page = browser.new_page(viewport={'width': 375, 'height': 699})
        page.goto(checklist_url('Kommande'), wait_until='networkidle')
        health = page.get_by_role('button', name=re.compile('Öppna planerad vaccination'))
        health.scroll_into_view_if_needed()
        before = health.bounding_box()
        assert before is not None
        health.click()
        expect(page.get_by_text('Planerade hälsohändelser', exact=True)).to_be_visible()
        expect(page.get_by_text('Öppnad från Checklistan', exact=True)).to_be_visible()
        focus_label = page.get_by_text('Öppnad från Checklistan', exact=True).bounding_box()
        assert focus_label is not None and 0 <= focus_label['y'] < 667, focus_label
        record('planned health destination brings the selected plan into the first viewport', {'focus_label': focus_label})
        screenshot_app(page, 'checklist-health-source-375x667.png')
        page.get_by_role('button', name='Tillbaka till Checklistan', exact=True).click()
        expect(page.get_by_role('tab', name='Kommande', exact=True)).to_have_attribute('aria-selected', 'true')
        health_return = page.get_by_role('button', name=re.compile('Öppna planerad vaccination'))
        expect(health_return).to_be_visible()
        after = health_return.bounding_box()
        assert after is not None and abs(after['y'] - before['y']) < 24, {'before': before, 'after': after}
        record('planned health opens the correct source and returns to Kommande at the same scroll offset', {'before': before, 'after': after})
        screenshot_app(page, 'checklist-health-return-375x667.png')
        page.close()

        page = browser.new_page(viewport={'width': 375, 'height': 699})
        page.goto(checklist_url('Alla'), wait_until='networkidle')
        training = page.get_by_role('button', name=re.compile('Öppna sparat träningssteg'))
        training.scroll_into_view_if_needed()
        before = training.bounding_box()
        assert before is not None
        training.click()
        expect(page.get_by_test_id('historical-training-step-detail')).to_be_visible()
        expect(page.get_by_text(re.compile('Endast läsning'))).to_be_visible()
        expect(page.get_by_role('button', name='Markera övningen som genomförd', exact=True)).to_have_count(0)
        screenshot_app(page, 'checklist-training-source-375x667.png')
        page.get_by_role('button', name='Tillbaka till Checklistan', exact=True).click()
        expect(page.get_by_role('tab', name='Alla', exact=True)).to_have_attribute('aria-selected', 'true')
        training_return = page.get_by_role('button', name=re.compile('Öppna sparat träningssteg'))
        expect(training_return).to_be_visible()
        after = training_return.bounding_box()
        assert after is not None and abs(after['y'] - before['y']) < 24, {'before': before, 'after': after}
        record('historical training source is read-only and returns to Alla at the same scroll offset', {'before': before, 'after': after})
        screenshot_app(page, 'checklist-training-return-375x667.png')
        page.close()

        page = browser.new_page(viewport={'width': 375, 'height': 876})
        page.goto(checklist_url('Kommande'), wait_until='networkidle')
        routine = page.get_by_role('button', name=re.compile('Öppna planerad rutin Morgonrutin')).first
        expect(routine).to_be_visible()
        routine.click()
        expect(page.get_by_role('heading', name='Hantera Morgonrutin', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name=re.compile('Lägg till.*idag'), exact=True)).to_have_count(0)
        expect(page.get_by_role('button', name='Klar', exact=True)).to_be_visible()
        record('planned routine opens focused template management without day actions')
        screenshot_app(page, 'checklist-upcoming-routine-source-375.png')
        page.close()

    browser.close()

report = {
    'mode': 'review' if REVIEW else 'public',
    'evidence_dir': str(OUT),
    'scope': 'Panel 4 Checklist filters and source routes; synthetic React Native Web, not live backend/native certification',
    'results': RESULTS,
    'failures': FAILURES,
}
(OUT / 'RESULTS.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'RESULTS {len(RESULTS)}/{len(RESULTS) + len(FAILURES)} PASS; evidence={OUT}')
raise SystemExit(1 if FAILURES else 0)

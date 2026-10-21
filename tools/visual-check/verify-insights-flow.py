#!/usr/bin/env python3
"""Exercise production LogScreen and InsightsScreen with deterministic synthetic data."""
import argparse
import hashlib
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[2]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(*args: str) -> str:
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def parse_args():
    parser = argparse.ArgumentParser(description='Verify the complete Logga → Översikt → Insikter return journey.')
    parser.add_argument('--base-url', default='http://127.0.0.1:4173/')
    parser.add_argument('--output-dir', default='docs/design/evidence/flow-insights-01/public')
    parser.add_argument('--bundle-file', required=True, help='Exact app.js file served by base-url.')
    parser.add_argument('--review', action='store_true')
    parser.add_argument('--no-capture', action='store_true')
    return parser.parse_args()


def main():
    args = parse_args()
    output = Path(args.output_dir)
    if not args.no_capture:
        output.mkdir(parents=True, exist_ok=True)
    bundle = Path(args.bundle_file).resolve()
    manifest_path = bundle.parent / 'build-manifest.json'
    if not bundle.is_file() or not manifest_path.is_file():
        raise AssertionError('The served bundle and build manifest must come from the same build output.')
    build_manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    branch, commit = git('rev-parse', '--abbrev-ref', 'HEAD'), git('rev-parse', 'HEAD')
    verifier_hash, bundle_hash = sha256(Path(__file__)), sha256(bundle)
    assert build_manifest.get('branch') == branch
    assert build_manifest.get('commit') == commit
    assert build_manifest.get('bundle_file') == bundle.name
    assert build_manifest.get('bundle_sha256') == bundle_hash
    assert build_manifest.get('verifier_file') == 'tools/visual-check/verify-insights-flow.py'
    assert build_manifest.get('verifier_sha256') == verifier_hash

    results, captures, page_errors = [], [], []

    def record(page, label, filename=None, route=''):
        viewport = page.evaluate('({width: innerWidth, height: innerHeight})')
        results.append({'check': label, 'route': route, 'viewport': viewport})
        print(f'PASS {label}')
        if filename and not args.no_capture:
            page.screenshot(path=str(output / filename))
            captures.append({'file': filename, 'route': route, 'viewport': viewport, 'state': label})

    def assert_period_selected(page, period):
        selected = page.get_by_role('tab', name=period, exact=True)
        assert selected.evaluate('(element) => getComputedStyle(element).backgroundColor') == 'rgb(33, 116, 72)', f'{period} is not visibly selected.'

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'],
        )
        page = browser.new_page(viewport={'width': 375, 'height': 844}, device_scale_factor=1, timezone_id='Europe/Stockholm')
        page.clock.install(time=datetime(2026, 10, 21, 13, 0, tzinfo=timezone.utc))
        page.on('pageerror', lambda error: page_errors.append(str(error)))

        def open_insights(width=375, height=844, scenario='ready', period='Vecka'):
            page.set_viewport_size({'width': width, 'height': height})
            params = {'screen': 'insights', 'period': period, 'insightsScenario': scenario}
            route = '?' + urlencode(params)
            page.goto(f'{args.base_url}{route}')
            expect(page.get_by_role('heading', name='Insikter', exact=True)).to_be_visible()
            expect(page.get_by_role('tablist', name='Huvudmeny')).to_be_visible()
            return route

        def verify_ready(width, height):
            route = open_insights(width, height)
            expect(page.get_by_role('heading', name='Kiss & bajs', exact=True)).to_be_visible()
            expect(page.get_by_role('heading', name='Sömn', exact=True)).to_be_visible()
            expect(page.get_by_text('Tidsintervall för sömnlogg saknas ännu.', exact=True)).to_be_visible()
            labels = page.locator('[data-testid^="insights-chart-label-"]')
            expect(labels).to_have_count(7)
            assert labels.all_text_contents() == ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
            assert all(labels.nth(index).evaluate('(element) => element.scrollWidth <= element.clientWidth + 1') for index in range(7)), 'A week label is visibly truncated.'
            assert page.get_by_role('tab', name='Logg').get_attribute('aria-selected') == 'true'
            assert_period_selected(page, 'Vecka')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}x{height}.'
            record(page, f'Insights ready composition at {width}x{height}', f'insights-ready-{width}x{height}.png', route)

        for viewport in [(375, 844), (430, 844), (375, 667)]:
            verify_ready(*viewport)

        route = open_insights()
        page.get_by_role('tab', name='Månad', exact=True).click()
        assert_period_selected(page, 'Månad')
        record(page, 'Month period changes the projection and grouped calendar-week bars', 'insights-month-375x844.png', route)
        page.get_by_role('tab', name='Sedan start', exact=True).click()
        assert_period_selected(page, 'Sedan start')
        record(page, 'Since-start period groups longer history by year', 'insights-since-start-375x667.png', route)

        route = open_insights(scenario='empty', period='Sedan start')
        expect(page.get_by_text('Inga loggar i perioden.', exact=True)).to_be_visible()
        expect(page.get_by_text('Ingen sparad logghistorik ännu.', exact=True)).to_be_visible()
        record(page, 'Empty history remains distinct from loading and failure', 'insights-empty-375x844.png', route)

        route = open_insights(scenario='loading')
        expect(page.get_by_text('Hämtar loggar…', exact=True)).to_be_visible()
        record(page, 'Insights loading state', 'insights-loading-375x844.png', route)

        route = open_insights(scenario='error')
        expect(page.get_by_text('Insikter kunde inte hämtas.', exact=True)).to_be_visible()
        record(page, 'Insights read failure offers recovery', 'insights-error-375x844.png', route)
        page.get_by_role('button', name='Försök igen', exact=True).click()
        expect(page.get_by_role('heading', name='Kiss & bajs', exact=True)).to_be_visible()
        record(page, 'Retry returns from error to current synthetic data')

        route = open_insights(scenario='partial-limit', period='Sedan start')
        expect(page.get_by_text('Äldre loggar kan saknas. Äldsta stapeln visar bara den lästa delen.', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name='Försök igen', exact=True)).to_have_count(0)
        record(page, 'Hard history cap shows its covered interval without a futile retry', 'insights-partial-cap-375x844.png', route)

        route = open_insights(scenario='partial-timeout')
        expect(page.get_by_text('Alla loggar kunde inte hämtas. Äldsta stapeln kan vara ofullständig.', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name='Försök igen', exact=True)).to_be_visible()
        record(page, 'Timeout partial state offers a fresh read', 'insights-partial-timeout-375x844.png', route)
        page.get_by_role('button', name='Försök igen', exact=True).click()
        expect(page.get_by_role('heading', name='Kiss & bajs', exact=True)).to_be_visible()

        # Capture Logga at the standard target size, then use a compact viewport to measure route offsets.
        page.set_viewport_size({'width': 375, 'height': 844})
        route = '?' + urlencode({'screen': 'log-insights'})
        page.goto(f'{args.base_url}{route}')
        expect(page.get_by_role('heading', name='Logga', exact=True)).to_be_visible()
        selected_date = page.get_by_role('button', name=re.compile('Valt datum .* Öppna kalender'))
        page.get_by_role('button', name='Visa föregående dag', exact=True).click()
        saved_date_label = selected_date.get_attribute('aria-label')
        record(page, 'Logga date selection before opening Insights', 'log-before-insights-375x844.png', route)
        page.set_viewport_size({'width': 375, 'height': 400})
        log_scroll = page.get_by_test_id('app-screen-scroll-log')
        log_offset = log_scroll.evaluate('(element) => { element.scrollTop = 14; element.dispatchEvent(new Event("scroll", { bubbles: true })); return element.scrollTop; }')
        assert log_offset > 0, f'Logga fixture did not scroll: {log_scroll.evaluate("(element) => [element.clientHeight, element.scrollHeight]")}.'
        page.get_by_role('tab', name='Översikt', exact=True).click()
        expect(page.get_by_role('heading', name='Insikter', exact=True)).to_be_visible()
        assert page.get_by_role('tab', name='Logg').get_attribute('aria-selected') == 'true'
        insights_scroll = page.get_by_test_id('app-screen-scroll-insights')
        expect(insights_scroll).to_have_js_property('scrollTop', 0)
        page.wait_for_timeout(300)
        record(page, 'Logga → Översikt opens Insights at its own route top', 'insights-route-open-375x400.png', route)
        insights_offset = insights_scroll.evaluate('(element) => { element.scrollTop = element.scrollHeight; element.dispatchEvent(new Event("scroll", { bubbles: true })); return element.scrollTop; }')
        assert insights_offset > 0, f'Insights fixture did not scroll: {insights_scroll.evaluate("(element) => [element.clientHeight, element.scrollHeight]")}.'
        page.get_by_role('button', name='Tillbaka', exact=True).click()
        expect(page.get_by_role('heading', name='Logga', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name=saved_date_label, exact=True)).to_be_visible()
        restored_log_offset = log_scroll.evaluate('(element) => element.scrollTop')
        assert abs(restored_log_offset - log_offset) <= 1, f'Logga offset changed: expected {log_offset}, got {restored_log_offset}.'
        record(page, 'Insights back preserves exact selected date, active Logg tab and Logga offset')
        page.get_by_role('tab', name='Översikt', exact=True).click()
        expect(page.get_by_role('heading', name='Insikter', exact=True)).to_be_visible()
        restored_insights_offset = insights_scroll.evaluate('(element) => element.scrollTop')
        assert abs(restored_insights_offset - insights_offset) <= 1, f'Insights offset was overwritten: expected {insights_offset}, got {restored_insights_offset}.'
        record(page, 'Each route restores its own saved scroll offset')

        banner_count = page.get_by_text('Syntetiskt granskningsläge', exact=False).count()
        assert (banner_count > 0) == args.review, 'Public/review banner state does not match the build.'
        browser.close()

    assert not page_errors, f'Unexpected browser errors: {page_errors}'
    mode = 'review' if args.review else 'public'
    print(f'PASS {len(results)} {mode} Insights checks; 0 browser errors')
    if not args.no_capture:
        manifest = {
            'flow': 'FLOW-INSIGHTS-01',
            'mode': mode,
            'branch': branch,
            'commit': commit,
            'browser': 'Chromium via Playwright, actual LogScreen and InsightsScreen with synthetic fixture data',
            'base_url': args.base_url,
            'bundle_file': bundle.name,
            'bundle_sha256': bundle_hash,
            'build_script_sha256': build_manifest['build_script_sha256'],
            'verifier_file': 'tools/visual-check/verify-insights-flow.py',
            'verifier_sha256': verifier_hash,
            'captures': captures,
            'checks': results,
            'page_errors': page_errors,
            'visual_status': 'PARTIAL — production components rendered and compared; complete panel-8 live/native acceptance remains separate',
            'live_data_rls_native_release': 'NOT TESTABLE in this synthetic browser fixture',
        }
        (output / 'browser-results.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
if __name__ == '__main__':
    main()

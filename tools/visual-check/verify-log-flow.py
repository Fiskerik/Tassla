#!/usr/bin/env python3
"""Render and exercise the production LogScreen with synthetic local fixtures."""
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
    parser = argparse.ArgumentParser(description='Verify Logga v6 presentation and core UI callbacks with synthetic data.')
    parser.add_argument('--base-url', default='http://127.0.0.1:4173/')
    parser.add_argument('--output-dir', default='docs/design/evidence/flow-log-01/public')
    parser.add_argument('--bundle-file', required=True, help='Exact app.js file served by base-url.')
    parser.add_argument('--review', action='store_true', help='Verify the isolated synthetic review build.')
    parser.add_argument('--no-capture', action='store_true', help='Run interactions without writing screenshots or a results manifest.')
    return parser.parse_args()


def main():
    args = parse_args()
    output = Path(args.output_dir)
    if not args.no_capture:
        output.mkdir(parents=True, exist_ok=True)

    bundle = Path(args.bundle_file).resolve()
    build_manifest_path = bundle.parent / 'build-manifest.json'
    if not bundle.is_file() or not build_manifest_path.is_file():
        raise AssertionError('The served bundle and build-manifest.json must come from the same build output.')
    build_manifest = json.loads(build_manifest_path.read_text(encoding='utf-8'))
    branch, commit = git('rev-parse', '--abbrev-ref', 'HEAD'), git('rev-parse', 'HEAD')
    verifier_hash, bundle_hash = sha256(Path(__file__)), sha256(bundle)
    assert build_manifest.get('branch') == branch, 'Build branch does not match the checked-out branch.'
    assert build_manifest.get('commit') == commit, 'Build commit does not match the checked-out commit.'
    assert build_manifest.get('bundle_file') == bundle.name, 'Build manifest names another bundle.'
    assert build_manifest.get('bundle_sha256') == bundle_hash, 'Served bundle SHA-256 does not match its build manifest.'
    assert build_manifest.get('verifier_file') == 'tools/visual-check/verify-log-flow.py', 'Build did not bind this flow verifier.'
    assert build_manifest.get('verifier_sha256') == verifier_hash, 'Flow verifier changed after the bundle was built.'

    results = []
    captures = []
    page_errors = []

    def record(page, label, filename=None, route='?screen=log'):
        viewport = page.evaluate('({width: innerWidth, height: innerHeight})')
        results.append({'check': label, 'route': route, 'viewport': viewport})
        print(f'PASS {label}')
        if filename and not args.no_capture:
            path = output / filename
            page.screenshot(path=str(path))
            captures.append({'file': filename, 'route': route, 'viewport': viewport, 'state': label})

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'],
        )
        page = browser.new_page(viewport={'width': 375, 'height': 844}, device_scale_factor=1, timezone_id='Europe/Stockholm')
        page.clock.install(time=datetime(2026, 10, 21, 13, 0, tzinfo=timezone.utc))
        page.on('pageerror', lambda error: page_errors.append(str(error)))

        def open_log(width=375, height=844, **query):
            page.set_viewport_size({'width': width, 'height': height})
            params = {'screen': 'log', **query}
            page.goto(f"{args.base_url}?{urlencode(params)}")
            expect(page.get_by_role('heading', name='Logga', exact=True)).to_be_visible()
            expect(page.get_by_role('tablist', name='Huvudmeny')).to_be_visible()

        def verify_standard_log(width, height):
            open_log(width, height)
            expect(page.get_by_role('button', name='Logga kiss', exact=True)).to_be_attached()
            expect(page.get_by_role('button', name='Logga bajs', exact=True)).to_be_attached()
            expect(page.get_by_role('button', name='Logga mat', exact=True)).to_be_attached()
            expect(page.get_by_role('button', name='Logga sömn', exact=True)).to_be_attached()
            expect(page.get_by_role('button', name='Visa fler loggtyper', exact=True)).to_be_attached()
            expect(page.locator('text=Snabb logg')).to_have_count(0)
            expect(page.locator('text=Dagens logg')).to_have_count(0)
            expect(page.locator('text=Händelser')).to_have_count(0)
            expect(page.get_by_role('button', name=re.compile('Mat .*tryck för att ändra'))).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Page overflows horizontally at {width}x{height}.'
            strip = page.locator('[aria-label="Snabbval för loggning"]')
            strip_box = strip.bounding_box()
            assert strip_box is not None and strip_box['width'] > 0, f'Quick action strip missing at {width}x{height}.'
            scroll_state = strip.evaluate('(el) => ({clientWidth: el.clientWidth, scrollWidth: el.scrollWidth})')
            assert scroll_state['scrollWidth'] > scroll_state['clientWidth'], f'Quick actions do not scroll horizontally at {width}x{height}: {scroll_state}'
            nav = page.get_by_role('tablist', name='Huvudmeny')
            cta = page.get_by_role('button', name='Lägg till händelse', exact=True)
            assert cta.count() == 1, 'The main add-event action must occur once in the standard view.'
            initial_cta = cta.bounding_box()
            nav_box = nav.bounding_box()
            assert initial_cta is not None and nav_box is not None
            initially_visible = initial_cta['y'] >= 0 and initial_cta['y'] + initial_cta['height'] <= nav_box['y']
            record(page, f'Logga standard composition at {width}x{height}; CTA initially {"visible" if initially_visible else "below fold"}', f'log-standard-{width}x{height}.png')
            cta.evaluate("el => el.scrollIntoView({block: 'end', inline: 'nearest'})")
            cta_box = cta.bounding_box()
            nav_box = nav.bounding_box()
            assert cta_box is not None and nav_box is not None and cta_box['y'] >= 0 and cta_box['y'] + cta_box['height'] <= nav_box['y'], f'CTA is clipped by fixed navigation at {width}x{height}: {cta_box} / {nav_box}'
            record(page, f'Add-event action is reachable above fixed navigation at {width}x{height}', f'log-cta-{width}x{height}.png')

        mode = 'review' if args.review else 'public'
        if args.review:
            expect_banner = True
        else:
            expect_banner = False
        for width, height in [(375, 844), (430, 844), (375, 667)]:
            verify_standard_log(width, height)
            banner_count = page.get_by_text('Syntetiskt granskningsläge', exact=False).count()
            assert (banner_count > 0) == expect_banner, f'{mode} banner state does not match the build.'

        # Fler reveals the remaining production quick actions in their own horizontal strip.
        open_log()
        page.get_by_role('button', name='Visa fler loggtyper', exact=True).click()
        for label in ['Logga promenad', 'Logga olycka', 'Logga vatten']:
            expect(page.get_by_role('button', name=label, exact=True)).to_be_attached()
        record(page, 'Fler reveals the remaining log actions without a tall grid', 'log-fler-open-375x844.png')
        page.get_by_role('button', name='Logga vatten', exact=True).click()
        expect(page.get_by_text('Vatten loggat', exact=True)).to_be_visible()
        expect(page.get_by_role('button', name='Visa fler loggtyper', exact=True)).to_be_attached()
        expect(page.get_by_role('button', name='Logga promenad', exact=True)).to_have_count(0)
        page.get_by_role('button', name='Ångra: Vatten loggat', exact=True).click()
        expect(page.get_by_text('Vatten loggat', exact=True)).to_have_count(0)
        record(page, 'A quick action invokes the add callback, confirms success, and undo removes it', 'log-quick-action-undo-375x844.png')

        # Long-press continues to reach the existing saved-layout editor.
        open_log()
        pee = page.get_by_role('button', name='Logga kiss', exact=True)
        box = pee.bounding_box()
        assert box is not None
        page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
        page.mouse.down()
        page.wait_for_timeout(750)
        page.mouse.up()
        expect(page.get_by_role('heading', name='Ändra snabbval', exact=True)).to_be_visible()
        page.get_by_role('button', name='Klar med snabbval', exact=True).click()
        record(page, 'Long-press still opens the quick-action layout editor')

        # The cloud fixture provides ready/loading/error calendar states and synthetic markers.
        open_log()
        date_button = page.get_by_role('button', name=re.compile('Valt datum .* Öppna kalender'))
        date_button.click()
        expect(page.get_by_text('Prick visar dagar med loggar', exact=True)).to_be_visible()
        marked_days = page.get_by_role('button', name=re.compile('har loggar'))
        assert marked_days.count() >= 1, 'Synthetic calendar markers were not shown.'
        record(page, 'Calendar opens with synthetic log markers', 'log-calendar-ready-375x844.png')
        page.get_by_role('button', name='Visa föregående månad', exact=True).click()
        expect(page.get_by_text('Inga loggar den här månaden', exact=True)).to_be_visible()
        page.get_by_role('button', name=re.compile('september 2026')).first.click()
        expect(page.get_by_text('1 september', exact=False).first).to_be_visible()
        expect(page.get_by_text('Välj datum', exact=True)).to_have_count(0)
        record(page, 'Calendar month navigation and day selection update the selected date')

        open_log(calendarScenario='loading')
        page.get_by_role('button', name=re.compile('Valt datum .* Öppna kalender')).click()
        expect(page.get_by_text('Hämtar loggdagar…', exact=True)).to_be_visible()
        record(page, 'Calendar shows its loading state', 'log-calendar-loading-375x844.png')
        expect(page.get_by_text('Prick visar dagar med loggar', exact=True)).to_be_visible(timeout=3000)

        open_log(calendarScenario='error')
        page.get_by_role('button', name=re.compile('Valt datum .* Öppna kalender')).click()
        expect(page.get_by_text('Loggdagar kunde inte hämtas.', exact=True)).to_be_visible()
        record(page, 'Calendar read error is distinct from an empty month', 'log-calendar-error-375x844.png')
        page.get_by_role('button', name='Försök hämta loggdagar igen', exact=True).click()
        expect(page.get_by_text('Prick visar dagar med loggar', exact=True)).to_be_visible()
        record(page, 'Calendar retry returns to ready state', 'log-calendar-retry-375x844.png')

        # Existing timeline edit/delete affordances remain in the real LogScreen.
        open_log()
        row = page.get_by_role('button', name=re.compile('Mat .*tryck för att ändra'))
        row.click()
        expect(page.get_by_text('Ändra händelse', exact=True)).to_be_visible()
        page.get_by_role('button', name='Avbryt ändring', exact=True).click()
        row = page.get_by_role('button', name=re.compile('Mat .*tryck för att ändra'))
        row.click()
        page.evaluate("window.__tasslaAlertActions = ['Radera']")
        page.get_by_role('button', name='Radera händelse', exact=True).click()
        expect(page.get_by_role('button', name=re.compile('Mat .*tryck för att ändra'))).to_have_count(0)
        record(page, 'Timeline details open and confirmed synthetic delete removes the row')

        browser.close()

    assert not page_errors, f'Unexpected browser errors: {page_errors}'
    print(f'PASS {len(results)} {mode} Logga checks; 0 page errors')
    if not args.no_capture:
        manifest = {
            'flow': 'FLOW-LOG-01',
            'mode': mode,
            'branch': branch,
            'commit': commit,
            'browser': 'Chromium via Playwright, React Native Web fixture, synthetic data only',
            'base_url': args.base_url,
            'bundle_file': bundle.name,
            'bundle_sha256': bundle_hash,
            'build_script_sha256': build_manifest['build_script_sha256'],
            'verifier_file': 'tools/visual-check/verify-log-flow.py',
            'verifier_sha256': verifier_hash,
            'captures': captures,
            'checks': results,
            'page_errors': page_errors,
            'visual_status': 'PARTIAL — browser presentation verified; full-screen vision_rev02 acceptance remains separate',
            'live_data_rls_native_release': 'NOT TESTABLE in this synthetic browser fixture',
        }
        (output / 'browser-results.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

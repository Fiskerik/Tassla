#!/usr/bin/env python3
import argparse
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import expect, sync_playwright


def parse_args():
    parser = argparse.ArgumentParser(description='Verify the synthetic Home and Training progress journey.')
    parser.add_argument('--base-url', default='http://127.0.0.1:4173/')
    parser.add_argument('--output-dir', default='docs/design/evidence/flow-training-2026-10-21/public')
    parser.add_argument('--review', action='store_true', help='Verify review copy and hidden filters without claiming persistence.')
    parser.add_argument('--no-capture', action='store_true', help='Run interactions without writing screenshots.')
    return parser.parse_args()


def main():
    args = parse_args()
    output = Path(args.output_dir)
    if not args.no_capture:
        output.mkdir(parents=True, exist_ok=True)
    results = []

    def record(page, label, capture=None):
        results.append(label)
        print(f'PASS {label}')
        if capture and not args.no_capture:
            page.wait_for_timeout(350)
            page.screenshot(path=str(output / f'{capture}.png'), full_page=True)

    def verify_training_screen(page, step_title):
        expect(page.get_by_test_id('training-fixture-banner')).to_be_visible()
        expect(page.get_by_text('Nästa övning', exact=True).first).to_be_visible()
        expect(page.get_by_role('button', name=f'Öva nu: {step_title}', exact=True)).to_be_visible()
        for removed_filter in ['Mina', 'Rekommenderat', 'Alla övningar']:
            expect(page.get_by_text(removed_filter, exact=True)).to_have_count(0)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path='/usr/bin/chromium',
            args=['--no-sandbox', '--disable-crash-reporter', '--disable-breakpad'],
        )
        page = browser.new_page(viewport={'width': 375, 'height': 844}, device_scale_factor=1)
        page.on('pageerror', lambda error: (_ for _ in ()).throw(AssertionError(str(error))))

        if args.review:
            page.goto(f"{args.base_url}?{urlencode({'screen': 'training', 'trainingScenario': 'default', 'homeScenario': 'training-flow'})}")
            expect(page.get_by_test_id('training-fixture-banner')).to_be_visible()
            expect(page.get_by_text('Markeringar i dessa övningsutkast sparas under den här visningen.', exact=False)).to_be_visible()
            for removed_filter in ['Mina', 'Rekommenderat', 'Alla övningar']:
                expect(page.get_by_text(removed_filter, exact=True)).to_have_count(0)
            record(page, 'review fixture labels draft progress as view-local and hides removed filters', 'review-training')

            for width, height in [(375, 844), (430, 844), (375, 667)]:
                page.set_viewport_size({'width': width, 'height': height})
                expect(page.get_by_test_id('training-fixture-banner')).to_be_visible()
                record(page, f'review Training renders at {width}x{height}', f'review-training-{width}x{height}')
            browser.close()
            print(f'PASS {len(results)} review training-flow checks')
            return

        page.goto(f"{args.base_url}?{urlencode({'screen': 'training', 'trainingScenario': 'home-ordering', 'homeScenario': 'training-flow'})}")
        verify_training_screen(page, 'En lugn paus')
        record(page, 'in-progress program wins over earlier unstarted source row', 'training-before-mark-375x844')

        page.get_by_role('button', name='Öva nu: En lugn paus', exact=True).click()
        page.get_by_role('button', name='Markera övningen som genomförd', exact=True).click()
        expect(page.get_by_text('Övningen är genomförd.', exact=True)).to_be_visible()
        record(page, 'mark callback confirms before showing changed progress')

        page.get_by_role('tab', name='Hem', exact=True).click()
        expect(page.get_by_text('Vila nära', exact=True)).to_be_visible()
        record(page, 'Home shows next step after confirmed mark', 'home-after-mark-375x844')
        for width, height in [(430, 844), (375, 667)]:
            page.set_viewport_size({'width': width, 'height': height})
            expect(page.get_by_text('Vila nära', exact=True)).to_be_visible()
            record(page, f'Home progress renders at {width}x{height}', f'home-after-mark-{width}x{height}')
        page.get_by_role('tab', name='Logg', exact=True).click()
        expect(page.get_by_test_id('review-log-banner')).to_be_visible()
        page.get_by_role('tab', name='Träning', exact=True).click()
        verify_training_screen(page, 'Vila nära')
        record(page, 'Home to Logg to Training returns to the same confirmed next step', 'training-after-mark-375x844')

        for width, height in [(430, 844), (375, 667)]:
            page.set_viewport_size({'width': width, 'height': height})
            expect(page.get_by_role('button', name='Öva nu: Vila nära', exact=True)).to_be_visible()
            record(page, f'Training progress renders at {width}x{height}', f'training-after-mark-{width}x{height}')
        page.get_by_role('button', name='Trygg vardagsstart, Pågår, 2 av 3 övningar klara. Öppna programmet', exact=True).click()
        page.get_by_role('button', name='En lugn paus, Klar, Genomförd', exact=True).click()
        page.get_by_role('button', name='Avmarkera En lugn paus', exact=True).click()
        expect(page.get_by_text('Övningen är avmarkerad.', exact=True)).to_be_visible()
        page.get_by_role('button', name='Stäng', exact=True).last.click()
        record(page, 'unmark is confirmed and returns to the program')

        page.get_by_role('tab', name='Hem', exact=True).click()
        expect(page.get_by_text('En lugn paus', exact=True)).to_be_visible()
        record(page, 'Home reflects confirmed unmark', 'home-after-unmark-375x844')
        page.get_by_role('tab', name='Logg', exact=True).click()
        page.get_by_role('tab', name='Träning', exact=True).click()
        verify_training_screen(page, 'En lugn paus')
        record(page, 'unmarked progress persists after Home to Logg to Training tab return', 'training-after-unmark-375x844')

        browser.close()

    print(f'PASS {len(results)} public training-flow checks')


if __name__ == '__main__':
    main()
